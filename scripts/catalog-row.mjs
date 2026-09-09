import { officialTimestamp } from "./publication-policy.mjs";

export function databaseRow(row, sourceId, checkedAt) {
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
