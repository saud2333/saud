import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_REVIEW_MODEL, reviewOpportunitiesWithAI } from "./ai-review.mjs";

export const defaultSources = [
  {
    key: "kgbc",
    name: "مجلس الكويت للمباني الخضراء — KGBC",
    websiteUrl: "https://www.kuwaitgbc.com/",
    feedUrl: "https://www.kuwaitgbc.com/events",
  },
  {
    key: "kfas",
    name: "مؤسسة الكويت للتقدم العلمي — KFAS",
    websiteUrl: "https://www.kfas.org.kw/",
    feedUrl: "https://apply.kfas.org.kw/Offers/ListOffers",
    feedUrls: [
      "https://apply.kfas.org.kw/Offers/ListOffers",
      "https://apply.kfas.org.kw/FormDetails/SubServices?Id=54043757-b3f6-f011-8406-70a8a51d5041",
      "https://apply.kfas.org.kw/",
    ],
  },
  {
    key: "kisr",
    name: "معهد الكويت للأبحاث العلمية — KISR",
    websiteUrl: "https://www.kisr.edu.kw/",
    feedUrl: "https://www.kisr.edu.kw/ar/careers-training/training-courses/",
    feedUrls: [
      "https://www.kisr.edu.kw/ar/careers-training/training-courses/",
      "https://www.kisr.edu.kw/ar/careers-training/student-programs/",
    ],
  },
  {
    key: "sacgc",
    name: "مركز صباح الأحمد للموهبة والإبداع — SACGC",
    websiteUrl: "https://sacgc.org/",
    feedUrl: "https://sacgc.org/en/",
    feedUrls: ["https://sacgc.org/en/", "https://tcbclubs.sacgc.org/"],
  },
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

const learningWords = /دور(?:ة|ات)|ورش(?:ة|ات)|معسكر|برنامج\s+تدريب|تدريب|course|workshop|bootcamp|training|leadership|management|innovation|performance|finance|future|science|school|lego|stem|robot|latex|solar|energy|data|engineering/i;
const ignoredLabels = /^(الرئيسية|اتصل بنا|تواصل معنا|المزيد|اقرأ المزيد|طلباتي|my requests|login|home|menu|next|previous)$/i;
const actionLabels = /^(register now|apply now|apply|read more|view courses|details?|التفاصيل|للتسجيل|سجل الآن|قدّم الآن)$/i;

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

function officialDomain(source) {
  try {
    return new URL(source.websiteUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function isOfficialSourceUrl(value, source) {
  try {
    const url = new URL(value);
    const domain = officialDomain(source);
    const hostname = url.hostname.toLowerCase();
    return Boolean(domain) && /^https?:$/.test(url.protocol) && (hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function officialUrlOrLanding(value, source) {
  const candidate = absoluteUrl(value, source.feedUrl);
  return isOfficialSourceUrl(candidate, source) ? candidate : source.feedUrl;
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

function contentHash(row) {
  const facts = [
    row.title_ar, row.description_ar, row.kind, row.category, row.subcategory,
    row.organizer, row.location, row.governorate, row.mode, row.min_age, row.max_age,
    row.age_label, row.duration_label, row.schedule_label, row.starts_at, row.ends_at,
    row.registration_ends_at, row.price_kwd, row.registration_url, row.source_url,
  ];
  return createHash("sha256").update(JSON.stringify(facts)).digest("hex");
}

function safeIso(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseDateRange(value) {
  const match = String(value).match(/(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?\s*[\/]\s*(\d{1,2})\s*[\/]\s*(20\d{2})/);
  if (!match) return { startsAt: null, endsAt: null };
  const [, startDay, endDay = startDay, month, year] = match;
  const startsAt = new Date(`${year}-${month.padStart(2, "0")}-${startDay.padStart(2, "0")}T00:00:00+03:00`).toISOString();
  const endsAt = new Date(`${year}-${month.padStart(2, "0")}-${endDay.padStart(2, "0")}T23:59:59+03:00`).toISOString();
  return { startsAt, endsAt };
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
  const sourceUrl = officialUrlOrLanding(node.url ?? offers.url, source);
  const registrationUrl = officialUrlOrLanding(offers.url ?? node.url, source);
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
    let title = stripHtml(match[3]);
    const href = absoluteUrl(decodeEntities(match[2]), source.feedUrl);
    if (actionLabels.test(title)) {
      const prefix = html.slice(Math.max(0, (match.index ?? 0) - 1600), match.index ?? 0);
      const headings = [...prefix.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)];
      const contextualTitle = stripHtml(headings.at(-1)?.[1] ?? "");
      if (contextualTitle) title = contextualTitle;
    }
    const evidence = `${title} ${href}`;
    if (title.length < 4 || title.length > 180 || ignoredLabels.test(title) || !learningWords.test(evidence) || !/^https?:/i.test(href)) continue;
    const [category, subcategory] = classify(evidence);
    rows.push({
      id: stableId(source.key, href, title), title_ar: title, title_en: null,
      description_ar: `تفاصيل الفرصة كما نشرتها ${source.name}. افتح المصدر الرسمي لمعرفة الوصف الكامل وشروط التسجيل.`,
      kind: inferKind(evidence), category, subcategory, organizer: source.name, location: "الكويت", governorate: "غير محدد",
      mode: inferMode({}, evidence), min_age: null, max_age: null, age_label: "لم يحدده المنظم",
      duration_label: "يحدده المنظم", schedule_label: "الموعد يحدده المنظم", starts_at: null, ends_at: null,
      registration_ends_at: null, price_kwd: null, status: "verify",
      registration_url: officialUrlOrLanding(href, source), source_url: officialUrlOrLanding(href, source),
      image_url: imageFor(category), tags: [subcategory], featured: false, is_published: true,
      source_checked_at: checkedAt, source_fingerprint: fingerprint(href, title), last_seen_at: new Date().toISOString(),
    });
  }
  return rows;
}

function parseCourseTables(html, source, checkedAt) {
  const rows = [];
  for (const rowMatch of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = rowMatch[1];
    const cells = [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => stripHtml(match[1]));
    const dateCell = cells.find((cell) => /\d{1,2}(?:\s*[-–]\s*\d{1,2})?\s*\/\s*\d{1,2}\s*\/\s*20\d{2}/.test(cell));
    if (!dateCell) continue;
    const dateIndex = cells.indexOf(dateCell);
    const title = cells.slice(0, dateIndex).findLast((cell) => cell.length >= 4 && !/^\d+$/.test(cell));
    if (!title) continue;
    const rowLinks = [...rowHtml.matchAll(/href\s*=\s*(["'])(.*?)\1/gi)].map((match) => absoluteUrl(decodeEntities(match[2]), source.feedUrl));
    const candidateUrl = rowLinks.find((url) => /^https?:/i.test(url) && !/chrome-extension/i.test(url)) ?? source.feedUrl;
    const registrationUrl = officialUrlOrLanding(candidateUrl, source);
    const { startsAt, endsAt } = parseDateRange(dateCell);
    const active = Boolean(startsAt && new Date(startsAt).getTime() > Date.now());
    const [category, subcategory] = classify(title);
    rows.push({
      id: stableId(source.key, source.feedUrl, title), title_ar: title, title_en: null,
      description_ar: `دورة مدرجة في الخطة التدريبية الرسمية لدى ${source.name}.`, kind: inferKind(title), category, subcategory,
      organizer: source.name, location: cells[dateIndex + 1] || "الكويت", governorate: "غير محدد", mode: "in_person",
      min_age: null, max_age: null, age_label: "لم يحدده المنظم", duration_label: "يحدده المنظم", schedule_label: dateCell,
      starts_at: startsAt, ends_at: endsAt, registration_ends_at: startsAt, price_kwd: null,
      status: active ? "open" : "closed", registration_url: registrationUrl, source_url: source.feedUrl,
      image_url: imageFor(category), tags: [subcategory], featured: false, is_published: active,
      source_checked_at: checkedAt, source_fingerprint: fingerprint(source.feedUrl, title), last_seen_at: new Date().toISOString(),
    });
  }
  return rows;
}

function uniqueRows(rows) {
  const unique = new Map();
  for (const row of rows) {
    if (!unique.has(row.source_fingerprint)) unique.set(row.source_fingerprint, row);
  }
  return [...unique.values()];
}

export function parseSourcePage(html, source, checkedAt = new Date().toISOString().slice(0, 10)) {
  const combined = [...parseJsonLd(html, source, checkedAt), ...parseCourseTables(html, source, checkedAt), ...parseLearningLinks(html, source, checkedAt)];
  return uniqueRows(combined).map((row) => ({ ...row, content_hash: contentHash(row) }));
}

export function isExpired(row, now = Date.now()) {
  const deadline = row.registration_ends_at ?? row.ends_at;
  return Boolean(deadline && new Date(deadline).getTime() <= now);
}

export function applyReviewResults(rows, reviewedRows, existingRows = []) {
  const reviewedByFingerprint = new Map(reviewedRows.map((row) => [row.source_fingerprint, row]));
  const existingByFingerprint = new Map(existingRows.map((row) => [row.source_fingerprint, row]));
  return rows.map((row) => {
    const reviewed = reviewedByFingerprint.get(row.source_fingerprint);
    if (reviewed) return reviewed;
    const existing = existingByFingerprint.get(row.source_fingerprint);
    return existing?.ai_review_status === "needs_review"
      ? { ...row, status: "verify", is_published: false }
      : row;
  });
}

async function syncSource(client, source) {
  const startedAt = new Date().toISOString();
  const sourcePages = await Promise.allSettled((source.feedUrls ?? [source.feedUrl]).map(async (feedUrl) => {
    const response = await fetch(feedUrl, {
      headers: { "user-agent": "MirsadCourseBot/1.0 (+https://github.com/saud2333/saud)" },
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) throw new Error(`${feedUrl}: HTTP ${response.status}`);
    const html = await response.text();
    return {
      rows: parseSourcePage(html, { ...source, feedUrl }),
      evidence: stripHtml(html).slice(0, 12_000),
      feedUrl,
    };
  }));
  const successfulPages = sourcePages.filter((result) => result.status === "fulfilled");
  if (!successfulPages.length) throw new Error(`${source.name}: all official pages failed`);
  const rows = uniqueRows(successfulPages.flatMap((result) => result.value.rows));
  const evidence = successfulPages
    .map((result) => `URL: ${result.value.feedUrl}\n${result.value.evidence}`)
    .join("\n\n")
    .slice(0, 30_000);
  const { data: sourceRow, error: sourceError } = await client.from("learning_sources").upsert({
    name: source.name, website_url: source.websiteUrl, feed_url: source.feedUrl, parser_key: "auto", is_active: true,
    last_synced_at: startedAt, last_sync_status: successfulPages.length === sourcePages.length ? "ok" : "partial",
    last_sync_message: `${rows.length} opportunities found across ${successfulPages.length}/${sourcePages.length} pages`,
  }, { onConflict: "website_url" }).select("id").single();
  if (sourceError) throw sourceError;

  const { data: existingRows, error: existingError } = await client
    .from("learning_opportunities")
    .select("source_fingerprint,content_hash,ai_review_status")
    .eq("source_id", sourceRow.id);
  if (existingError) throw existingError;
  const existingByFingerprint = new Map((existingRows ?? []).map((row) => [row.source_fingerprint, row]));
  const changedRows = rows.filter((row) => {
    const existing = existingByFingerprint.get(row.source_fingerprint);
    return !existing || existing.content_hash !== row.content_hash || ["pending", "unavailable"].includes(existing.ai_review_status);
  });
  const reviewedRows = [];
  for (let index = 0; index < changedRows.length; index += 12) {
    const batch = changedRows.slice(index, index + 12);
    try {
      reviewedRows.push(...await reviewOpportunitiesWithAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_REVIEW_MODEL ?? process.env.OPENAI_MODEL ?? DEFAULT_REVIEW_MODEL,
        source,
        evidence,
        rows: batch,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      reviewedRows.push(...batch.map((row) => ({
        ...row,
        ai_review_status: "unavailable",
        ai_reviewed_at: null,
        ai_review_note: `تعذرت مراجعة الذكاء الاصطناعي في هذه الجولة: ${message}`.slice(0, 500),
        ai_review_model: null,
        status: "verify",
        is_published: false,
      })));
    }
  }
  const outputRows = applyReviewResults(rows, reviewedRows, existingRows ?? []);

  if (rows.length) {
    const { error } = await client.from("learning_opportunities").upsert(outputRows.map((row) => ({ ...row, source_id: sourceRow.id })), { onConflict: "source_fingerprint" });
    if (error) throw error;
  }
  if (rows.length && successfulPages.length === sourcePages.length) {
    const { error } = await client
      .from("learning_opportunities")
      .update({ status: "closed", is_published: false })
      .eq("source_id", sourceRow.id)
      .eq("is_published", true)
      .lt("last_seen_at", startedAt);
    if (error) throw error;
  }
  return {
    count: rows.length,
    aiReviewed: reviewedRows.filter((row) => row.ai_review_status === "verified").length,
    aiHeld: reviewedRows.filter((row) => row.ai_review_status === "needs_review").length,
    aiUnavailable: reviewedRows.filter((row) => row.ai_review_status === "unavailable").length,
  };
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
      const outcome = await syncSource(client, source);
      results.push({ source: source.name, ...outcome, ok: true });
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
