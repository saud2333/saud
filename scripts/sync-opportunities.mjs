import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

export const defaultSources = [
  {
    key: "ku-engineering",
    name: "جامعة الكويت — كلية الهندسة والبترول",
    websiteUrl: "https://engineering.ku.edu.kw/",
    feedUrl: "https://engineering.ku.edu.kw/ar/vdpct/about/office-consultation-and-training",
  },
  {
    key: "ku-community",
    name: "جامعة الكويت — مركز خدمة المجتمع والتعليم المستمر",
    websiteUrl: "https://ccsce.ku.edu.kw/",
    feedUrl: "https://ccsce.ku.edu.kw/",
  },
];

const learningWords = /دور(?:ة|ات)|ورش(?:ة|ات)|معسكر|برنامج\s+تدريب|تدريب|course|workshop|bootcamp|training|robot|latex|solar|energy|data|engineering/i;
const ignoredLabels = /^(الرئيسية|اتصل بنا|تواصل معنا|المزيد|اقرأ المزيد|login|home|menu|next|previous)$/i;

function decodeEntities(value) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(value = "") {
  return decodeEntities(String(value).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function absoluteUrl(value, base) {
  if (!value) return base;
  try {
    return new URL(String(value), base).href;
  } catch {
    return base;
  }
}

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function flattenJsonLd(value) {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (!value || typeof value !== "object") return [];
  return [value, ...flattenJsonLd(value["@graph"] ?? [])];
}

function classify(text) {
  if (/ذكاء|برمج|روبوت|بيانات|تقني|cyber|software|data|robot/i.test(text)) return ["التقنية والذكاء الاصطناعي", "تقنية"];
  if (/هندس|طاقة|كهرب|مدني|ميكاني|solar|energy|engineer/i.test(text)) return ["الهندسة والطاقة", "هندسة"];
  if (/صحة|إسعاف|سلامة|health|medical|first aid/i.test(text)) return ["الصحة والسلامة", "صحة وسلامة"];
  if (/فن|خزف|تصميم|إبداع|art|design/i.test(text)) return ["الفنون والإبداع", "إبداع"];
  return ["الأعمال والمهارات", "مهارات عامة"];
}

function inferKind(text) {
  if (/ورشة|workshop/i.test(text)) return "workshop";
  if (/معسكر|bootcamp/i.test(text)) return "camp";
  return "course";
}

function inferMode(node, text) {
  const attendance = String(node.eventAttendanceMode ?? "");
  if (/mixed|hybrid|هجين/i.test(`${attendance} ${text}`)) return "hybrid";
  if (/online|virtual|عن بعد|أونلاين|اونلاين/i.test(`${attendance} ${text}`)) return "online";
  return "in_person";
}

function parseAge(node) {
  const audience = stripHtml(asObject(firstValue(node.audience)).audienceType ?? node.typicalAgeRange ?? "");
  const numbers = audience.match(/\d{1,2}/g)?.map(Number) ?? [];
  return { minAge: numbers[0] ?? null, maxAge: numbers[1] ?? null, ageLabel: audience || "لم يحدده المنظم" };
}

function fingerprint(sourceUrl, title) {
  return `${sourceUrl.trim().toLowerCase()}#${title.trim().toLowerCase()}`;
}

function stableId(sourceKey, sourceUrl, title) {
  return `${sourceKey}-${createHash("sha1").update(fingerprint(sourceUrl, title)).digest("hex").slice(0, 18)}`;
}

function safeIso(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function imageFor(category) {
  if (category === "التقنية والذكاء الاصطناعي") return "/courses-tech.png";
  if (category === "الهندسة والطاقة") return "/courses-engineering.png";
  return "/courses-skills.png";
}

function normalizeJsonLd(node, source, checkedAt) {
  const type = firstValue(node["@type"]);
  if (!/Course|Event|EducationEvent/i.test(String(type ?? ""))) return null;
  const title = stripHtml(node.name ?? node.headline ?? "");
  if (title.length < 4) return null;
  const offers = asObject(firstValue(node.offers));
  const organizer = asObject(firstValue(node.organizer));
  const place = asObject(firstValue(node.location));
  const address = asObject(place.address);
  const sourceUrl = absoluteUrl(node.url ?? offers.url, source.feedUrl);
  const registrationUrl = absoluteUrl(offers.url ?? node.url, sourceUrl);
  const description = stripHtml(node.description ?? `تفاصيل الفرصة كما نشرتها ${source.name}.`).slice(0, 1800);
  const fullText = `${title} ${description}`;
  const [category, subcategory] = classify(fullText);
  const age = parseAge(node);
  const priceValue = Number(offers.price);
  const imageValue = firstValue(node.image);
  const image = typeof imageValue === "object" && imageValue ? imageValue.url : imageValue;
  const startsAt = safeIso(node.startDate);
  const endsAt = safeIso(node.endDate);
  const registrationEndsAt = safeIso(offers.validThrough ?? node.registrationDeadline);
  const deadline = registrationEndsAt ?? endsAt;
  const active = !deadline || new Date(deadline).getTime() > Date.now();
  const locality = stripHtml(address.addressLocality ?? address.streetAddress ?? place.name ?? "الكويت");
  return {
    id: stableId(source.key, sourceUrl, title), title_ar: title, title_en: null, description_ar: description,
    kind: inferKind(fullText), category, subcategory,
    organizer: stripHtml(organizer.name ?? source.name), location: locality || "الكويت", governorate: "غير محدد",
    mode: inferMode(node, fullText), min_age: age.minAge, max_age: age.maxAge, age_label: age.ageLabel,
    duration_label: "يحدده المنظم",
    schedule_label: stripHtml(node.startDate ? `${node.startDate}${node.endDate ? ` — ${node.endDate}` : ""}` : "الموعد يحدده المنظم"),
    starts_at: startsAt, ends_at: endsAt, registration_ends_at: registrationEndsAt,
    price_kwd: Number.isFinite(priceValue) ? priceValue : null, status: active ? "open" : "closed",
    registration_url: registrationUrl, source_url: sourceUrl,
    image_url: image ? absoluteUrl(image, sourceUrl) : imageFor(category), tags: [subcategory], featured: false,
    is_published: active, source_checked_at: checkedAt, source_fingerprint: fingerprint(sourceUrl, title), last_seen_at: new Date().toISOString(),
  };
}

function parseJsonLd(html, source, checkedAt) {
  const rows = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      for (const node of flattenJsonLd(JSON.parse(decodeEntities(match[1]).trim()))) {
        const row = normalizeJsonLd(node, source, checkedAt);
        if (row) rows.push(row);
      }
    } catch {
      // A malformed block does not stop the remaining official sources.
    }
  }
  return rows;
}

function parseLearningLinks(html, source, checkedAt) {
  const rows = [];
  const pattern = /<a\s+[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const title = stripHtml(match[3]);
    const href = absoluteUrl(decodeEntities(match[2]), source.feedUrl);
    const evidence = `${title} ${href}`;
    if (title.length < 4 || title.length > 180 || ignoredLabels.test(title) || !learningWords.test(evidence) || !/^https?:/i.test(href)) continue;
    const [category, subcategory] = classify(evidence);
    rows.push({
      id: stableId(source.key, href, title), title_ar: title, title_en: null,
      description_ar: `تفاصيل الفرصة كما نشرتها ${source.name}. افتح المصدر الرسمي لمعرفة الوصف الكامل وشروط التسجيل.`,
      kind: inferKind(evidence), category, subcategory, organizer: source.name, location: "الكويت", governorate: "غير محدد",
      mode: inferMode({}, evidence), min_age: null, max_age: null, age_label: "لم يحدده المنظم",
      duration_label: "يحدده المنظم", schedule_label: "الموعد يحدده المنظم", starts_at: null, ends_at: null,
      registration_ends_at: null, price_kwd: null, status: "verify", registration_url: href, source_url: href,
      image_url: imageFor(category), tags: [subcategory], featured: false, is_published: true,
      source_checked_at: checkedAt, source_fingerprint: fingerprint(href, title), last_seen_at: new Date().toISOString(),
    });
  }
  return rows;
}

export function parseSourcePage(html, source, checkedAt = new Date().toISOString().slice(0, 10)) {
  const combined = [...parseJsonLd(html, source, checkedAt), ...parseLearningLinks(html, source, checkedAt)];
  return [...new Map(combined.map((row) => [row.source_fingerprint, row])).values()];
}

export function isExpired(row, now = Date.now()) {
  const deadline = row.registration_ends_at ?? row.ends_at;
  return Boolean(deadline && new Date(deadline).getTime() <= now);
}

async function syncSource(client, source) {
  const startedAt = new Date().toISOString();
  const response = await fetch(source.feedUrl, {
    headers: { "user-agent": "MirsadCourseBot/1.0 (+https://github.com/saud2333/saud)" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
  const rows = parseSourcePage(await response.text(), source);
  const { data: sourceRow, error: sourceError } = await client.from("learning_sources").upsert({
    name: source.name, website_url: source.websiteUrl, feed_url: source.feedUrl, parser_key: "auto", is_active: true,
    last_synced_at: startedAt, last_sync_status: "ok", last_sync_message: `${rows.length} opportunities found`,
  }, { onConflict: "website_url" }).select("id").single();
  if (sourceError) throw sourceError;
  if (rows.length) {
    const { error } = await client.from("learning_opportunities").upsert(rows.map((row) => ({ ...row, source_id: sourceRow.id })), { onConflict: "source_fingerprint" });
    if (error) throw error;
  }
  return rows.length;
}

export async function runSync() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: archiveError } = await client.rpc("archive_expired_learning_opportunities");
  if (archiveError) throw archiveError;
  const results = [];
  for (const source of defaultSources) {
    try {
      results.push({ source: source.name, count: await syncSource(client, source), ok: true });
    } catch (error) {
      results.push({ source: source.name, count: 0, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  process.stdout.write(`${JSON.stringify({ syncedAt: new Date().toISOString(), results }, null, 2)}\n`);
  if (results.every((result) => !result.ok)) process.exitCode = 1;
  return results;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) await runSync();

