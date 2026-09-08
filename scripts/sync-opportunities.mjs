import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_REVIEW_MODEL, reviewOpportunitiesWithAI } from "./ai-review.mjs";
import { documentHash, extractAnnouncements } from "./announcement-extraction.mjs";
import { collectSocialDocuments, fetchOfficialPage, withImageHashes } from "./official-documents.mjs";
import { mirrorEmbeddedImages } from "./embedded-media.mjs";
import { gatePublication, officialTimestamp, officialUrl, publicationIssues, REVIEW_POLICY_VERSION } from "./publication-policy.mjs";

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

export async function syncSource(client, source, { env = process.env, fetchImpl = fetch, extract = extractAnnouncements, review = reviewOpportunitiesWithAI } = {}) {
  const startedAt = new Date().toISOString();
  const { data: sourceRow, error: sourceError } = await client.from("learning_sources").upsert({
    name: source.name, website_url: source.websiteUrl, feed_url: source.feedUrl, parser_key: "evidence_v2", is_active: true,
  }, { onConflict: "website_url" }).select("id").single();
  if (sourceError) throw sourceError;
  const { data: cached, error: cacheError } = await client.from("learning_source_documents").select("*").eq("source_id", sourceRow.id);
  if (cacheError) throw cacheError;
  const cacheByUrl = new Map((cached ?? []).map((item) => [item.document_url, item]));
  const channels = [], documents = [];
  const pages = await Promise.allSettled((source.feedUrls ?? [source.feedUrl]).map((url) => fetchOfficialPage(url, source, fetchImpl)));
  pages.forEach((result, index) => {
    channels.push({ channel: "website", url: (source.feedUrls ?? [source.feedUrl])[index], status: result.status === "fulfilled" ? "ok" : "failed" });
    if (result.status === "fulfilled") documents.push(result.value);
  });
  const social = await collectSocialDocuments(source, env, fetchImpl);
  channels.push(...social.channels); documents.push(...social.documents);
  // Crawl current official detail links and recheck prior live website pages.
  // Each run is bounded; cached documents prevent repeated extraction costs.
  const detailUrls = [...new Set([
    ...documents.flatMap((document) => [...document.candidates, ...(document.channel !== "website" ? document.links : [])]),
    ...(cached ?? []).filter((item) => item.channel === "website" && item.rows?.some((row) => row.is_published)).map((item) => item.document_url),
  ])].filter((url) => officialUrl(url, source) && !documents.some((document) => document.url === url))
    .sort((a, b) => (Date.parse(cacheByUrl.get(a)?.checked_at) || 0) - (Date.parse(cacheByUrl.get(b)?.checked_at) || 0)).slice(0, 20);
  const details = await Promise.allSettled(detailUrls.map((url) => fetchOfficialPage(url, source, fetchImpl)));
  details.forEach((result, index) => {
    channels.push({ channel: "website_detail", url: detailUrls[index], status: result.status === "fulfilled" ? "ok" : "failed" });
    if (result.status === "fulfilled") documents.push(result.value);
  });
  const groupedDocuments = new Map();
  for (const document of documents) {
    const previous = groupedDocuments.get(document.url);
    groupedDocuments.set(document.url, { ...document, requestedUrls: [...new Set([...(previous?.requestedUrls ?? []), document.requestedUrl ?? document.url])] });
  }
  const uniqueDocuments = [...groupedDocuments.values()]
    .sort((a, b) => (Date.parse(cacheByUrl.get(a.url)?.checked_at) || 0) - (Date.parse(cacheByUrl.get(b.url)?.checked_at) || 0));
  const failures = []; let count = 0, published = 0, held = 0;
  const prepareDocument = async (document) => {
    const prepared = await mirrorEmbeddedImages(document, source, client);
    return withImageHashes(prepared.document, source, fetchImpl, prepared.trustedMirrors);
  };
  const hideDocument = async (document) => {
    for (const url of new Set([document.url, ...(document.requestedUrls ?? [])])) {
      const { error } = await client.from("learning_opportunities").update({ is_published: false, publication_ready: false }).eq("source_id", sourceRow.id).eq("source_url", url);
      if (error) throw error;
    }
  };
  for (let document of uniqueDocuments) {
    if (Date.now() - Date.parse(startedAt) > 180_000) {
      failures.push({ url: document.url, message: "Source time budget reached; remaining documents will be retried next run" });
      break;
    }
    let outputRows;
    try {
      document = await prepareDocument(document);
      const hash = documentHash(document), previous = cacheByUrl.get(document.url);
      const reusable = previous?.evidence_hash === hash && previous.review_policy_version === REVIEW_POLICY_VERSION
        && previous.status === "reviewed" && previous.rows.every((row) => row.ai_review_status === "verified")
        && Date.parse(previous.reviewed_at) > Date.now() - 24 * 60 * 60_000;
      if (reusable) {
        outputRows = previous.rows.map((row) => gatePublication(row, source, document));
      } else {
        const extracted = await extract({ document, source, apiKey: env.OPENAI_API_KEY, model: env.OPENAI_REVIEW_MODEL || env.OPENAI_MODEL || DEFAULT_REVIEW_MODEL, fetchImpl });
        const complete = extracted.filter((row) => publicationIssues(row, source, document).length === 0);
        const reviewed = await review({ rows: complete, source, evidence: JSON.stringify(document), images: document.images, apiKey: env.OPENAI_API_KEY, model: env.OPENAI_REVIEW_MODEL || env.OPENAI_MODEL || DEFAULT_REVIEW_MODEL, fetchImpl });
        const reviews = new Map(reviewed.map((row) => [row.source_fingerprint, row]));
        outputRows = extracted.map((row) => gatePublication(reviews.get(row.source_fingerprint) ?? { ...row, ai_review_status: "needs_review", ai_review_note: "الإعلان غير مكتمل أو يحتاج إلى دليل أوضح." }, source, document));
      }
      // A still-visible social announcement must not keep a closed/broken
      // registration page publishable. Recheck its destination every run.
      for (let index = 0; index < outputRows.length; index++) {
        const row = outputRows[index];
        if (!row.is_published) continue;
        const registrationPage = row.registration_url === document.url ? document
          : await prepareDocument(await fetchOfficialPage(row.registration_url, source, fetchImpl));
        const registrationHash = documentHash(registrationPage);
        const prior = previous?.rows.find((item) => item.source_fingerprint === row.source_fingerprint);
        if (!reusable || prior?.registration_page_hash !== registrationHash) {
          const evidence = JSON.stringify({
            registrationPage: { ...registrationPage, text: registrationPage.text.slice(0, 12_000) },
            announcement: { ...document, text: document.text.slice(0, 12_000) },
          });
          const [checked] = await review({ rows: [row], source, evidence,
            images: [...new Set([...document.images, ...registrationPage.images])],
            apiKey: env.OPENAI_API_KEY, model: env.OPENAI_REVIEW_MODEL || env.OPENAI_MODEL || DEFAULT_REVIEW_MODEL, fetchImpl });
          outputRows[index] = gatePublication({ ...(checked ?? { ...row, ai_review_status: "needs_review" }), registration_page_hash: registrationHash }, source, document);
        }
      }
      // Reconcile this exact successfully reviewed document, even when empty.
      // Do not infer deletion from a truncated social timeline or a failed fetch.
      await hideDocument(document);
      if (outputRows.length) {
        const records = outputRows.map((row) => databaseRow(row, sourceRow.id, startedAt));
        const { error } = await client.from("learning_opportunities").upsert(records, { onConflict: "source_fingerprint" });
        if (error) throw error;
      }
      const { error: documentError } = await client.from("learning_source_documents").upsert({
        source_id: sourceRow.id, document_url: document.url, channel: document.channel,
        evidence_hash: hash, evidence: document, rows: outputRows, status: "reviewed",
        reviewed_at: reusable ? previous.reviewed_at : startedAt, checked_at: startedAt, review_policy_version: REVIEW_POLICY_VERSION,
      }, { onConflict: "source_id,document_url" });
      if (documentError) throw documentError;
      count += outputRows.length; published += outputRows.filter((row) => row.is_published).length;
      held += outputRows.filter((row) => !row.is_published).length;
    } catch (error) {
      failures.push({ url: document.url, message: error.message });
      await hideDocument(document);
    }
  }
  for (const channel of channels.filter((channel) => channel.url && channel.status === "failed")) {
    const { error } = await client.from("learning_opportunities").update({ is_published: false, publication_ready: false }).eq("source_id", sourceRow.id).eq("source_url", channel.url);
    if (error) throw error;
  }
  const report = { count, published, held, documents: uniqueDocuments.length, channels, failures };
  const { error: statusError } = await client.from("learning_sources").update({
    last_synced_at: startedAt, last_sync_status: failures.length || channels.some((channel) => channel.status !== "ok") ? "partial" : "ok",
    last_sync_message: JSON.stringify(report), channel_status: channels,
  }).eq("id", sourceRow.id);
  if (statusError) throw statusError;
  return { ...report, ok: uniqueDocuments.length > 0 && failures.length === 0 };
}

function databaseRow(row, sourceId, checkedAt) {
  // Missing facts remain explicit in publication_issues. Neutral storage values
  // only satisfy legacy NOT NULL constraints on quarantined records.
  const result = { ...row, source_id: sourceId, last_seen_at: checkedAt, source_checked_at: checkedAt.slice(0, 10), image_caption: row.image_caption || "صورة منشورة ضمن الإعلان الرسمي" };
  for (const field of ["title_ar", "description_ar", "category", "subcategory", "location", "age_label", "duration_label", "schedule_label", "registration_url", "image_url"]) result[field] ??= "";
  result.kind ??= "course"; result.mode ??= "in_person";
  result.title_ar = result.title_ar.slice(0, 240); result.description_ar = result.description_ar.slice(0, 1800);
  for (const field of ["starts_at", "ends_at", "registration_ends_at"]) if (!Number.isFinite(officialTimestamp(result[field]))) result[field] = null;
  for (const field of ["min_age", "max_age"]) if (!Number.isInteger(result[field]) || result[field] < 3 || result[field] > 99) result[field] = null;
  if (result.min_age !== null && result.max_age !== null && result.max_age < result.min_age) { result.min_age = null; result.max_age = null; }
  if (!Number.isFinite(result.price_kwd) || result.price_kwd < 0) result.price_kwd = null;
  return result;
}
export function syncConfiguration(env, { requireAI = true } = {}) {
  const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceKey = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !serviceKey) throw new Error("Supabase server connection is not configured; no catalog data was changed.");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash || !["", "/"].includes(parsed.pathname)) throw new Error("Invalid Supabase HTTPS project URL.");
  const aiConfigured = Boolean(env.OPENAI_API_KEY?.trim());
  // Missing review credentials are a setup failure, not evidence that courses disappeared.
  // This must run before creating a client, archiving, or reconciling any source.
  if (requireAI && !aiConfigured) throw new Error("OPENAI_API_KEY is missing; automated review is inactive and no catalog data was changed.");
  return { url, serviceKey, aiConfigured };
}

export async function checkSyncConnection({ env = process.env, createClientImpl = createClient } = {}) {
  const config = syncConfiguration(env, { requireAI: false });
  const client = createClientImpl(config.url, config.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const tables = ["learning_sources", "learning_opportunities", "learning_source_documents"];
  for (const table of tables) {
    // HEAD requests prove access to the catalog and private evidence without exporting records.
    const { error } = await client.from(table).select("*", { count: "exact", head: true });
    if (error) throw new Error(`Catalog connection check failed: ${table} (${error.code || "request_failed"}).`);
  }
  return { connection: "ok", catalogTables: tables, aiConfigured: config.aiConfigured, automatedReviewTested: false, writesPerformed: false };
}

export async function runSync({ env = process.env, createClientImpl = createClient } = {}) {
  const { url, serviceKey } = syncConfiguration(env);
  const client = createClientImpl(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: archiveError } = await client.rpc("archive_expired_learning_opportunities");
  if (archiveError) throw archiveError;
  const results = [];
  for (const source of defaultSources) {
    try {
      const outcome = await syncSource(client, source, { env });
      results.push({ source: source.name, ...outcome });
    } catch (error) {
      results.push({ source: source.name, count: 0, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  process.stdout.write(`${JSON.stringify({ syncedAt: new Date().toISOString(), results }, null, 2)}\n`);
  if (results.some((result) => !result.ok)) process.exitCode = 1;
  return results;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  if (process.argv.includes("--check-connection")) console.log(JSON.stringify(await checkSyncConnection()));
  else await runSync();
}
