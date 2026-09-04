import assert from "node:assert/strict";
import test from "node:test";
import { defaultSources, isExpired, parseSourcePage } from "../scripts/sync-opportunities.mjs";

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

test("uses the nearest program heading for generic registration buttons", () => {
  const html = `<section><h2>Our Programs</h2><h1>STEM Racing Workshops</h1><a href="/register">Register Now</a></section>`;
  const [row] = parseSourcePage(html, source, "2030-09-01");
  assert.equal(row.title_ar, "STEM Racing Workshops");
  assert.equal(row.kind, "workshop");
  assert.equal(row.registration_url, "https://example.test/register");
});

test("extracts dated KISR-style table rows and closes past courses", () => {
  const html = `<table><tr><td>1</td><td>Ethical AI in Research</td><td>7-9/12/2025</td><td>Shuwaikh</td><td><a href="https://example.test/form">Form</a></td></tr></table>`;
  const rows = parseSourcePage(html, source, "2026-09-04");
  const row = rows.find((item) => item.title_ar === "Ethical AI in Research");
  assert.equal(row.schedule_label, "7-9/12/2025");
  assert.equal(row.location, "Shuwaikh");
  assert.equal(row.is_published, false);
});

test("tracks the four requested Kuwait learning sources", () => {
  assert.deepEqual(defaultSources.slice(0, 4).map((sourceItem) => sourceItem.key), ["kgbc", "kfas", "kisr", "sacgc"]);
});
