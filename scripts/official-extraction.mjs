import { createHash } from "node:crypto";
import { documentHash } from "./announcement-extraction.mjs";
import { officialTimestamp, officialUrl, publicationIssues, REVIEW_POLICY_VERSION, UNANNOUNCED } from "./publication-policy.mjs";

export const OFFICIAL_VERIFIER_VERSION = "official-parser-v1";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
const evidence = (field, quote) => ({ field, quote, image_url: null });

function localTime(year, month, day, hour, minute, meridiem) {
  if (!months[month] || Number(hour) < 1 || Number(hour) > 12) return null;
  const h = Number(hour) % 12 + (meridiem === "PM" ? 12 : 0);
  const value = `${year}-${months[month]}-${day.padStart(2, "0")}T${String(h).padStart(2, "0")}:${minute}:00+03:00`;
  return Number.isFinite(officialTimestamp(value)) ? value : null;
}

function baseRow(source, document, identity) {
  return {
    id: `${source.key}-${identity}`, source_fingerprint: `${document.url}#${identity}`,
    organizer: source.name, source_url: document.url, registration_url: document.url,
    min_age: null, max_age: null, age_label: UNANNOUNCED, price_kwd: null,
    governorate: "غير محدد", featured: false, tags: [],
    announcement_channel: "website", official_account_url: null, official_account_proof_url: null,
    ai_review_status: "unavailable", ai_reviewed_at: null, ai_review_model: null,
    ai_review_note: "لم تستخدم مراجعة ذكاء اصطناعي؛ فحص برمجي للمصدر الرسمي.",
    image_url: document.images[0] ?? null, field_evidence: [],
  };
}

// This adapter is restricted to the observed KFAS LEE template and a named
// Kuwait venue. Foreign programmes and changed templates are never guessed.
export function extractKfas(document, source) {
  const url = new URL(document.url), id = url.searchParams.get("offerId");
  if (source.key !== "kfas" || url.hostname !== "apply.kfas.org.kw" || url.pathname !== "/Offers/OffersDetailes" || !/^[a-f0-9-]{36}$/i.test(id ?? "")) return [];
  const t = document.text;
  const heading = t.match(/Offer Details (.+?) (?:Local Executive Education \(LEE\)|Open Enrollment \(OE\)) (.+?) (?:No Description Available|Provider)/);
  if (!heading) return [];
  const dates = t.match(/Dates ([A-Z][a-z]{2}) (\d{1,2}) [–—-] ([A-Z][a-z]{2}) (\d{1,2}), (\d{4}) Time (\d{2}):(\d{2}) (AM|PM) [–—-] (\d{2}):(\d{2}) (AM|PM)/);
  const deadline = t.match(/Registration Deadline ([A-Z][a-z]{2}) (\d{1,2}), (\d{4}) (\d{2}):(\d{2}) (AM|PM)/);
  const venue = t.match(/Venue (Abdullah Al Salem Cultural Center)(?: Brochure| Apply| Registration)/);
  const overview = t.match(/Target Audience General (.+?) Terms & Conditions (.+?) Target Audience (.+?) Apply for this Program/);
  const topAction = t.match(/Venue .+? (Apply|Registration Closed|Closed) General Terms & Conditions Target Audience/);
  const login = document.links.some((link) => {
    const u = new URL(link); return u.pathname === "/User/Login" && u.searchParams.get("returnUrl") === url.pathname + url.search;
  });
  const row = baseRow(source, document, id.toLowerCase());
  const provider = t.match(/Provider (.+?) Dates /)?.[1];
  // Keep the published audience and requirements in full, ahead of any summary.
  const audience = overview?.[3] ?? "";
  const terms = overview?.[2] === "No Terms Specified" ? "" : overview?.[2] ?? "";
  const attachments = t.match(/Attachments (.+?) Cancel Apply/)?.[1] ?? "";
  const eligibility = [audience, terms, attachments].filter(Boolean).join(" · ");
  const general = overview?.[1] ?? "";
  const description = `${general.slice(0, Math.max(0, 1700 - eligibility.length))}${general.length > 1700 - eligibility.length ? "…" : ""}\n${eligibility}`;
  Object.assign(row, {
    title_ar: heading[1], title_en: heading[1], description_ar: overview && eligibility.length < 1500 ? description : null,
    kind: /workshop/i.test(heading[1]) ? "workshop" : "course",
    category: "الأعمال والمهارات", subcategory: heading[2],
    location: venue?.[1] ?? null, mode: venue ? "in_person" : null,
    starts_at: dates ? localTime(dates[5], dates[1], dates[2], dates[6], dates[7], dates[8]) : null,
    ends_at: dates ? localTime(dates[5], dates[3], dates[4], dates[9], dates[10], dates[11]) : null,
    registration_ends_at: deadline ? localTime(deadline[3], deadline[1], deadline[2], deadline[4], deadline[5], deadline[6]) : null,
    schedule_label: dates?.[0] ?? null,
    duration_label: dates ? `${dates[1]} ${dates[2]} – ${dates[3]} ${dates[4]}, ${dates[5]}` : null,
    registration_state: topAction?.[1] === "Apply" && login ? "open" : topAction ? "closed" : "unknown",
    image_caption: provider ? `شعار ${provider} — من إعلان KFAS` : "صورة الإعلان الرسمي",
    tags: [heading[2]],
  });
  row.field_evidence = [
    evidence("title", heading[1]), evidence("kind", heading[0].includes("Local Executive") ? "Local Executive Education (LEE)" : "Open Enrollment (OE)"),
    evidence("description", general), evidence("schedule", dates?.[0] ?? ""),
    evidence("location", venue?.[0] ?? ""), evidence("mode", venue?.[0] ?? ""),
    evidence("registration", deadline?.[0] ?? ""),
  ];
  // Unknown ages and fees stay null. If a future template adds them, require an
// adapter update instead of silently ignoring stated restrictions.
  if (/\b(?:ages?\s*[:\d]|aged\s+\d|KWD\b|Kuwaiti Dinars?\b|fees?\s*[:\d]|free of charge\b)/i.test(general + " " + eligibility)) row.description_ar = null;
  return [row];
}

const flatten = (value) => Array.isArray(value) ? value.flatMap(flatten) : value && typeof value === "object" ? [value, ...flatten(value["@graph"])] : [];
const one = (value) => Array.isArray(value) ? value[0] : value;
const string = (value) => typeof value === "string" ? value.trim() : "";

// General adapter: only explicit machine-readable course/event facts. No
// inference of age, currency, venue, time zone, registration state or deadline.
export function extractStructured(document, source) {
  return flatten(document.structuredData).flatMap((node) => {
    if (!/(?:Course|EducationEvent|Event)$/.test(string(one(node["@type"])))) return [];
    const title = string(node.name), description = string(node.description);
    const kind = /workshop|ورشة/i.test(title) ? "workshop" : /bootcamp|معسكر/i.test(title) ? "camp" : /Course$/.test(string(one(node["@type"]))) || /course|دورة/i.test(title) ? "course" : null;
    if (!title || !kind) return [];
    const offer = one(node.offers) ?? {}, location = one(node.location) ?? {};
    const modeValue = string(node.eventAttendanceMode);
    const mode = /OfflineEventAttendanceMode$/.test(modeValue) ? "in_person" : /OnlineEventAttendanceMode$/.test(modeValue) ? "online" : /MixedEventAttendanceMode$/.test(modeValue) ? "hybrid" : null;
    const age = string(node.typicalAgeRange), bounds = age.match(/^(\d{1,2})-(\d{1,2})?$/);
    const row = baseRow(source, document, sha(`${title}|${node.startDate}`).slice(0, 24));
    Object.assign(row, {
      title_ar: title, title_en: null, description_ar: description,
      kind, category: /AI|software|data|برمج|ذكاء/i.test(title) ? "التقنية والذكاء الاصطناعي" : /green|building|energy|engineer|طاقة|مباني|هندسة/i.test(title) ? "الهندسة والطاقة" : "الأعمال والمهارات",
      subcategory: string(node.about?.name) || title,
      location: string(location.name), mode,
      starts_at: node.startDate ?? null, ends_at: node.endDate ?? null,
      registration_ends_at: offer.validThrough ?? node.registrationDeadline ?? null,
      duration_label: string(node.duration) || `${node.startDate ?? ""} — ${node.endDate ?? ""}`,
      schedule_label: `${node.startDate ?? ""} — ${node.endDate ?? ""}`,
      registration_state: /(?:InStock|LimitedAvailability)$/.test(string(offer.availability)) ? "open" : /(?:SoldOut|Discontinued)$/.test(string(offer.availability)) ? "closed" : "unknown",
      registration_url: string(offer.url),
      image_url: typeof one(node.image) === "string" ? one(node.image) : one(node.image)?.url ?? null,
      min_age: bounds ? Number(bounds[1]) : null, max_age: bounds?.[2] ? Number(bounds[2]) : null,
      age_label: bounds ? age + " سنة" : UNANNOUNCED,
      price_kwd: offer.priceCurrency === "KWD" && /^\d+(?:\.\d+)?$/.test(String(offer.price)) ? Number(offer.price) : null,
    });
    row.field_evidence = [evidence("title", title), evidence("description", description), evidence("kind", kind === "course" ? string(one(node["@type"])) : title), evidence("schedule", string(node.startDate)), evidence("location", string(location.name)), evidence("mode", modeValue), evidence("registration", string(offer.validThrough ?? node.registrationDeadline))];
    if (bounds) row.field_evidence.push(evidence("age", age));
    if (row.price_kwd !== null) row.field_evidence.push(evidence("price", String(offer.price)));
    // Preserve unknown eligibility/fees as a hold, rather than discarding facts
    // that this narrow adapter cannot fully represent.
    if (node.audience || (age && !bounds) || (offer.price != null && row.price_kwd === null)) row.description_ar = null;
    return [row];
  });
}

export function extractOfficial(document, source) {
  if (document.channel !== "website" || !officialUrl(document.url, source)) return [];
  return source.key === "kfas" ? extractKfas(document, source) : extractStructured(document, source);
}

export function verifyOfficial(row, source, document, now = Date.now()) {
  const issues = publicationIssues(row, source, document, now);
  if (document.channel !== "website" || !officialUrl(document.url, source)) issues.push("source:not_official_website");
  if (!document.imageHashes?.length || document.imageHashes.length !== document.images.length) issues.push("image:not_checked");
  const ready = issues.length === 0;
  const hash = documentHash(document);
  return { ...row, verification_method: "official_source", verified_at: new Date(now).toISOString(), verifier_version: OFFICIAL_VERIFIER_VERSION,
    verification_note: "فحص برمجي للحقائق المنشورة ورابط التقديم وصورة الإعلان؛ ليس مراجعة ذكاء اصطناعي.",
    ai_review_status: "unavailable", ai_reviewed_at: null, ai_review_model: null,
    evidence_hash: hash, content_hash: hash, registration_page_hash: row.registration_url === document.url ? hash : null,
    review_policy_version: REVIEW_POLICY_VERSION, publication_ready: ready, publication_issues: issues, is_published: ready,
    status: [row.starts_at, row.registration_ends_at].some(v => Number.isFinite(Date.parse(v)) && Date.parse(v) <= now) ? "closed" : ready ? "open" : "verify",
  };
}
