import { and, desc, eq } from "drizzle-orm";
import { aiConversations } from "../../../db/schema";
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

export async function GET(request: Request) {
  const user = getRequestUser(request);
  if (!user) return Response.json({ authenticated: false, data: [] }, { status: 401 });
  try {
    const db = await ensureUser(user);
    const rows = await db.select().from(aiConversations).where(eq(aiConversations.ownerUserId, user.id)).orderBy(desc(aiConversations.updatedAt)).limit(24);
    return Response.json({ authenticated: true, data: rows.map((row) => ({ ...row, transcript: parseTranscript(row.transcriptJson) })) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const payload = await request.json().catch(() => null) as { discipline?: string; message?: string; locale?: Locale; conversationId?: number; transcript?: Message[] } | null;
  const message = payload?.message?.trim() ?? "";
  if (!message || message.length > 5000) return Response.json({ error: "A message between 1 and 5000 characters is required" }, { status: 400 });
  const locale: Locale = payload?.locale === "en" ? "en" : "ar";
  const disciplineName = disciplinePrompts[payload?.discipline ?? "Construction AI"] ? payload?.discipline ?? "Construction AI" : "Construction AI";
  const discipline = disciplinePrompts[disciplineName];
  const reply = discipline[locale];
  const now = new Date().toISOString();
  const safeHistory = Array.isArray(payload?.transcript) ? payload.transcript.slice(-18).filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string").map((item) => ({ role: item.role, content: item.content.slice(0, 5000), createdAt: item.createdAt || now })) : [];
  const transcript: Message[] = [...safeHistory, { role: "user", content: message, createdAt: now }, { role: "assistant", content: reply, createdAt: now }];
  let conversationId: number | null = null;
  let saved = false;

  if (user) {
    try {
      const db = await ensureUser(user);
      if (payload?.conversationId) {
        const [updated] = await db.update(aiConversations).set({ transcriptJson: JSON.stringify(transcript), discipline: disciplineName, updatedAt: now }).where(and(eq(aiConversations.id, payload.conversationId), eq(aiConversations.ownerUserId, user.id))).returning({ id: aiConversations.id });
        conversationId = updated?.id ?? null;
      }
      if (!conversationId) {
        const [created] = await db.insert(aiConversations).values({ ownerUserId: user.id, discipline: disciplineName, transcriptJson: JSON.stringify(transcript), safetyFlagsJson: "[]", model: "safe-local-source-router" }).returning({ id: aiConversations.id });
        conversationId = created.id;
      }
      saved = true;
    } catch (error) { return apiError(error, "Conversation could not be saved"); }
  }

  return Response.json({
    reply,
    sources: sources[discipline.sourceKey],
    mode: "safe_local_source_router",
    needs_clarification: true,
    external_ai_connected: false,
    authenticated: Boolean(user),
    saved,
    conversation_id: conversationId,
    disclaimer: locale === "ar" ? "إجابة تعليمية أولية. تحقّق من النص الرسمي الحالي واعتمد مهندسًا مرخصًا قبل التنفيذ." : "Preliminary educational guidance. Check the current official text and use a licensed engineer before execution.",
  });
}
