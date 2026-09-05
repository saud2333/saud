import assert from "node:assert/strict";
import test from "node:test";
import { reviewOpportunitiesWithAI } from "../scripts/ai-review.mjs";

const source = {
  name: "جهة كويتية رسمية",
  feedUrl: "https://example.test/courses",
};

const candidate = {
  source_fingerprint: "https://example.test/course#دورة علمية",
  title_ar: "دورة علمية",
  description_ar: "برنامج علمي للفئة العمرية 14–18 سنة.",
  kind: "course",
  organizer: source.name,
  location: "الكويت",
  min_age: 14,
  max_age: 18,
  age_label: "14–18 سنة",
  schedule_label: "1–3 أكتوبر 2030",
  starts_at: "2030-10-01T05:00:00.000Z",
  ends_at: "2030-10-03T11:00:00.000Z",
  registration_ends_at: "2030-09-28T20:59:00.000Z",
  registration_url: "https://example.test/register",
  source_url: "https://example.test/course",
  status: "open",
  is_published: true,
};

function responseFor(verdict, note = "تطابقت الحقائق مع المصدر الرسمي.") {
  return async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.headers.authorization, "Bearer test-key");
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.equal(body.text.format.type, "json_schema");
    assert.match(body.instructions, /Never infer, correct, enrich, or invent facts/);
    return new Response(JSON.stringify({
      model: "gpt-test-reviewer",
      output_text: JSON.stringify({
        reviews: [{ source_fingerprint: candidate.source_fingerprint, verdict, note }],
      }),
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
}

test("marks a supported changed opportunity as AI verified", async () => {
  const [row] = await reviewOpportunitiesWithAI({
    apiKey: "test-key",
    source,
    evidence: "دورة علمية للفئة العمرية 14–18 سنة من 1 إلى 3 أكتوبر 2030.",
    rows: [candidate],
    fetchImpl: responseFor("verified"),
  });
  assert.equal(row.ai_review_status, "verified");
  assert.equal(row.ai_review_model, "gpt-test-reviewer");
  assert.equal(row.is_published, true);
  assert.ok(row.ai_reviewed_at);
});

test("quarantines an opportunity when the AI review finds missing or conflicting evidence", async () => {
  const [row] = await reviewOpportunitiesWithAI({
    apiKey: "test-key",
    source,
    evidence: "لا يوجد عمر منشور في الصفحة.",
    rows: [candidate],
    fetchImpl: responseFor("needs_review", "العمر المسجل غير مدعوم بنص المصدر."),
  });
  assert.equal(row.ai_review_status, "needs_review");
  assert.equal(row.status, "verify");
  assert.equal(row.is_published, false);
});

test("holds changed bot data when no AI key is configured", async () => {
  const [row] = await reviewOpportunitiesWithAI({
    apiKey: "",
    source,
    evidence: "",
    rows: [candidate],
    fetchImpl: async () => { throw new Error("must not be called"); },
  });
  assert.equal(row.ai_review_status, "unavailable");
  assert.equal(row.status, "verify");
  assert.equal(row.is_published, false);
  assert.equal(row.ai_reviewed_at, null);
});
