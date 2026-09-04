import assert from "node:assert/strict";
import test from "node:test";
import { isExpired, parseSourcePage } from "../scripts/sync-opportunities.mjs";

const source = {
  key: "fixture",
  name: "جهة تدريبية رسمية",
  websiteUrl: "https://example.test/",
  feedUrl: "https://example.test/courses",
};

test("extracts a new course and its registration deadline from JSON-LD", () => {
  const html = `<script type="application/ld+json">${JSON.stringify({
    "@type": "Course",
    name: "دورة الروبوتات للصغار",
    description: "تدريب عملي في الروبوتات",
    url: "/robotics",
    startDate: "2030-10-01T08:00:00+03:00",
    endDate: "2030-10-03T14:00:00+03:00",
    offers: { url: "/register", validThrough: "2030-09-28T23:59:00+03:00", price: "25" },
    audience: { audienceType: "12–17 سنة" },
  })}</script>`;
  const [row] = parseSourcePage(html, source, "2030-09-01");
  assert.equal(row.title_ar, "دورة الروبوتات للصغار");
  assert.equal(row.category, "التقنية والذكاء الاصطناعي");
  assert.equal(row.min_age, 12);
  assert.equal(row.max_age, 17);
  assert.equal(row.registration_url, "https://example.test/register");
  assert.equal(row.is_published, true);
});

test("marks a course expired using registration deadline before event end", () => {
  assert.equal(isExpired({ registration_ends_at: "2026-09-01T00:00:00Z", ends_at: "2026-10-01T00:00:00Z" }, Date.parse("2026-09-04T00:00:00Z")), true);
});

