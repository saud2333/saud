// An AI verdict alone can never make an incomplete announcement public.
export const REVIEW_POLICY_VERSION = "complete-official-v2";
export const requiredEvidenceFields = ["title", "description", "kind", "age", "schedule", "location", "mode", "price", "registration"];

export function officialTimestamp(value) {
  if (typeof value !== "string") return NaN;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/);
  if (!match) return NaN;
  const [, year, month, day, hour, minute, second, zone] = match;
  const calendar = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (calendar.getUTCFullYear() !== Number(year) || calendar.getUTCMonth() + 1 !== Number(month) || calendar.getUTCDate() !== Number(day)
    || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59
    || (zone !== "Z" && (Number(zone.slice(1, 3)) > 14 || Number(zone.slice(4)) > 59))) return NaN;
  return Date.parse(value);
}

export function officialUrl(value, source) {
  try {
    const url = new URL(value);
    const domain = new URL(source.websiteUrl).hostname.replace(/^www\./, "");
    return url.protocol === "https:" && !url.username && !url.password && !url.port
      && (url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch { return false; }
}

export function publicationIssues(row, source, document, now = Date.now()) {
  const issues = [];
  const unknown = /لم يحدد|غير محدد|يحدده|غير منشور|تفاصيل الفرصة كما|مدرجة في الخطة|unknown|unspecified|tba|tbd/i;
  for (const field of ["title_ar", "description_ar", "kind", "category", "subcategory", "organizer", "location", "mode", "age_label", "duration_label", "schedule_label"]) {
    if (typeof row[field] !== "string" || !row[field].trim() || unknown.test(row[field])) issues.push(`missing:${field}`);
  }
  if ((row.description_ar?.trim().length ?? 0) < 10) issues.push("missing:description_ar");
  if (!Number.isInteger(row.min_age) || !Number.isInteger(row.max_age) || row.min_age < 3 || row.max_age > 99 || row.max_age < row.min_age) issues.push("missing:age_range");
  if (typeof row.price_kwd !== "number" || !Number.isFinite(row.price_kwd) || row.price_kwd < 0) issues.push("missing:price");
  const start = officialTimestamp(row.starts_at), end = officialTimestamp(row.ends_at), deadline = officialTimestamp(row.registration_ends_at);
  if (![start, end, deadline].every(Number.isFinite) || end < start || deadline > start) issues.push("invalid:dates");
  if (start <= now || deadline <= now || row.registration_state !== "open") issues.push("registration:not_open");
  if (!officialUrl(row.registration_url, source) || !document.links.includes(row.registration_url)) issues.push("unproven:registration_url");
  if (row.source_url !== document.url) issues.push("unproven:source_url");
  if (!document.images.includes(row.image_url)) issues.push("missing:official_image");
  if (!["course", "workshop", "camp"].includes(row.kind)) issues.push("invalid:kind");
  if (!["in_person", "online", "hybrid"].includes(row.mode)) issues.push("invalid:mode");
  for (const field of requiredEvidenceFields) {
    const claim = row.field_evidence?.find((entry) => entry.field === field);
    const quote = claim?.quote?.trim();
    const imageEvidence = claim?.image_url && document.images.includes(claim.image_url);
    if (!quote || (!document.text.includes(quote) && !imageEvidence)) issues.push(`unproven:${field}`);
  }
  return [...new Set(issues)];
}

export function gatePublication(row, source, document, now = Date.now()) {
  const issues = publicationIssues(row, source, document, now);
  if (row.ai_review_status !== "verified") issues.push("review:not_verified");
  const ready = issues.length === 0;
  const expired = [row.starts_at, row.registration_ends_at].some((value) => Number.isFinite(Date.parse(value)) && Date.parse(value) <= now);
  return { ...row, publication_ready: ready, publication_issues: issues, is_published: ready, status: expired ? "closed" : ready ? "open" : "verify", review_policy_version: REVIEW_POLICY_VERSION };
}
