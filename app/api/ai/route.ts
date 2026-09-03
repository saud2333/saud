import { and, desc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { aiConversations } from "../../../db/schema";
import { DEFAULT_AI_MODEL, buildInstructions, requestOpenAI, sanitizeHistory } from "../../lib/ai-core.mjs";
import { apiError, ensureUser, getRequestUser } from "../../lib/server";

type Locale = "ar" | "en";
type Message = { role: "user" | "assistant"; content: string; createdAt: string };

const sources = {
  construction: [
    { label: "بلدية الكويت", url: "https://baladia.gov.kw/" },
    { label: "المؤسسة العامة للرعاية السكنية", url: "https://www.pahw.gov.kw/" },
    { label: "متجر المواصفات الكويتية — الهيئة العامة للصناعة", url: "https://ksm.pai.gov.kw/ar/Pages/SearchStandards.aspx" },
  ],
  water: [
    { label: "وزارة الكهرباء والماء والطاقة المتجددة", url: "https://www.mew.gov.kw/ar/services-menu/services/" },
    { label: "وزارة الأشغال العامة", url: "https://www.mpw.gov.kw/" },
  ],
  roads: [
    { label: "وزارة الأشغال العامة", url: "https://www.mpw.gov.kw/" },
    { label: "مختبرات الجودة — الهيئة العامة للصناعة", url: "https://pai.gov.kw/quality-labs-directory" },
  ],
  materials: [
    { label: "متجر المواصفات الكويتية", url: "https://ksm.pai.gov.kw/ar/Pages/SearchStandards.aspx" },
    { label: "قطاع المواصفات والخدمات الصناعية", url: "https://pai.gov.kw/en/industrial-standards-and-services-sector" },
  ],
};

const disciplinePrompts: Record<string, { ar: string; en: string; sourceKey: keyof typeof sources }> = {
  "Construction AI": {
    ar: "قبل التقدير أحتاج: مساحة البناء الصافية، عدد الأدوار، المنطقة، وجود سرداب أو مصعد، مستوى التشطيب، ومصدر معدل التكلفة وتاريخه. سأفصل ما تدخله أنت عن أي معلومة رسمية.",
    en: "Before estimating, provide net built area, floor count, location, basement or lift requirements, finish level, and the source and date of your cost rate. Your inputs remain separate from official information.",
    sourceKey: "construction",
  },
  "Structural AI": {
    ar: "قبل أي حساب إنشائي أحتاج النظام الإنشائي، الأبعاد، الأحمال، مقاومات المواد، تقرير التربة، والكود المعتمد. لا يمكن اعتماد النتيجة دون مهندس إنشائي مرخص.",
    en: "Before any structural calculation, provide the structural system, dimensions, loads, material strengths, soil report, and governing code. A licensed structural engineer must approve the result.",
    sourceKey: "construction",
  },
  "Water AI": {
    ar: "أحتاج عدد المستخدمين أو الوحدات، نمط الطلب، ساعات التخزين، المناسيب، الضغط المتاح، مادة وقطر وطول الأنبوب، ودرجة حرارة التشغيل قبل الحساب.",
    en: "Provide occupants or units, demand pattern, storage hours, elevations, available pressure, pipe material, diameter, length, and operating temperature before calculation.",
    sourceKey: "water",
  },
  "Roads AI": {
    ar: "أحتاج AADT، نسبة المركبات الثقيلة، النمو، فترة التصميم، CBR، المناخ، التصريف، ومنهج التصميم المعتمد. الناتج فحص أولي فقط.",
    en: "Provide AADT, heavy-vehicle share, growth, design life, CBR, climate, drainage, and the approved design method. Output is preliminary only.",
    sourceKey: "roads",
  },
  "Materials AI": {
    ar: "للمقارنة العادلة أحتاج المواصفة والدرجة والوحدة والكمية وموقع التسليم والشهادات المطلوبة. لن أعامل مواصفات مختلفة كبدائل متساوية.",
    en: "For a fair comparison, provide specification, grade, unit, quantity, delivery location, and required certificates. Different specifications are not treated as equivalent.",
    sourceKey: "materials",
  },
  "BOQ AI": {
    ar: "الصق البنود وحدد العملة والوحدات ونطاق المشروع. سأفصل القيم المدخلة عن الاستنتاجات وأشير إلى البنود غير الواضحة للمراجعة.",
    en: "Paste the items, then specify currency, units, and project scope. Entered values remain separate from inferences, and ambiguous items are flagged for review.",
    sourceKey: "construction",
  },
};

const parseTranscript = (value: string): Message[] => {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
};

const runtimeString = (key: "OPENAI_API_KEY" | "OPENAI_MODEL") => {
  const value = env[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store" },
});

async function safetyIdentifier(userId: string | undefined) {
  if (!userId) return undefined;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const providerReady = Boolean(runtimeString("OPENAI_API_KEY"));
  if (!user) return json({ authenticated: false, data: [], provider_ready: providerReady });
  try {
    const db = await ensureUser(user);
    const rows = await db.select().from(aiConversations).where(eq(aiConversations.ownerUserId, user.id)).orderBy(desc(aiConversations.updatedAt)).limit(24);
    return json({ authenticated: true, provider_ready: providerReady, data: rows.map((row) => ({ ...row, transcript: parseTranscript(row.transcriptJson) })) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const payload = await request.json().catch(() => null) as { discipline?: string; message?: string; locale?: Locale; conversationId?: number; transcript?: Message[] } | null;
  const message = payload?.message?.trim() ?? "";
  if (!message || message.length > 5000) return json({ error: "A message between 1 and 5000 characters is required" }, 400);
  const locale: Locale = payload?.locale === "en" ? "en" : "ar";
  const disciplineName = disciplinePrompts[payload?.discipline ?? "Construction AI"] ? payload?.discipline ?? "Construction AI" : "Construction AI";
  const discipline = disciplinePrompts[disciplineName];
  const now = new Date().toISOString();
  const safeHistory = sanitizeHistory(payload?.transcript).map((item) => ({ ...item, createdAt: item.createdAt || now }));
  const sourceList = sources[discipline.sourceKey];
  const apiKey = runtimeString("OPENAI_API_KEY");
  const configuredModel = runtimeString("OPENAI_MODEL") ?? DEFAULT_AI_MODEL;
  let reply = discipline[locale];
  let responseModel = "safe-local-source-router";
  let mode = "safe_local_source_router";
  let externalAiConnected = false;

  if (apiKey) {
    try {
      const generated = await requestOpenAI({
        apiKey,
        model: configuredModel,
        instructions: buildInstructions({
          locale,
          disciplineName,
          disciplineGuidance: discipline[locale],
          sourceList,
        }),
        history: safeHistory,
        message,
        safetyIdentifier: await safetyIdentifier(user?.id),
      });
      if (generated) {
        reply = generated.reply;
        responseModel = generated.model;
        mode = "openai_responses";
        externalAiConnected = true;
      }
    } catch (error) {
      console.error("Civil AI provider request failed", error instanceof Error ? error.message : "Unknown provider error");
    }
  }

  const transcript: Message[] = [...safeHistory, { role: "user", content: message, createdAt: now }, { role: "assistant", content: reply, createdAt: now }];
  let conversationId: number | null = null;
  let saved = false;

  if (user) {
    try {
      const db = await ensureUser(user);
      if (payload?.conversationId) {
        const [updated] = await db.update(aiConversations).set({ transcriptJson: JSON.stringify(transcript), discipline: disciplineName, model: responseModel, updatedAt: now }).where(and(eq(aiConversations.id, payload.conversationId), eq(aiConversations.ownerUserId, user.id))).returning({ id: aiConversations.id });
        conversationId = updated?.id ?? null;
      }
      if (!conversationId) {
        const [created] = await db.insert(aiConversations).values({ ownerUserId: user.id, discipline: disciplineName, transcriptJson: JSON.stringify(transcript), safetyFlagsJson: "[]", model: responseModel }).returning({ id: aiConversations.id });
        conversationId = created.id;
      }
      saved = true;
    } catch (error) { return apiError(error, "Conversation could not be saved"); }
  }

  return json({
    reply,
    sources: sourceList,
    mode,
    model: responseModel,
    external_ai_connected: externalAiConnected,
    provider_configured: Boolean(apiKey),
    authenticated: Boolean(user),
    saved,
    conversation_id: conversationId,
    disclaimer: locale === "ar" ? "إجابة تعليمية أولية. تحقّق من النص الرسمي الحالي واعتمد مهندسًا مرخصًا قبل التنفيذ." : "Preliminary educational guidance. Check the current official text and use a licensed engineer before execution.",
  });
}
