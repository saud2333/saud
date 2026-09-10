import assert from "node:assert/strict";
import test from "node:test";
import { applyReviewResults, defaultSources, isExpired, parseSourcePage, retiredSourceUrls, retireRemovedSources } from "../scripts/sync-opportunities.mjs";

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

test("never sends registration directly to an external form provider", () => {
  const html = `<section><h1>STEM Robotics Workshop</h1><a href="https://forms.external.test/apply">Register Now</a></section>`;
  const [row] = parseSourcePage(html, source, "2030-09-01");
  assert.equal(row.registration_url, "https://example.test/courses");
  assert.equal(row.source_url, "https://example.test/courses");
});

test("keeps structured expiry data when the same course also appears as a link", () => {
  const html = '<script type="application/ld+json">{"@type":"Course","name":"Past AI Course","url":"/past-ai","endDate":"2025-01-03T14:00:00+03:00"}</script><a href="/past-ai">Past AI Course</a>';
  const row = parseSourcePage(html, source, "2026-09-04").find((item) => item.title_ar === "Past AI Course");
  assert.equal(row.status, "closed");
  assert.equal(row.is_published, false);
});

test("extracts dated KISR-style table rows and closes past courses", () => {
  const html = `<table><tr><td>1</td><td>Ethical AI in Research</td><td>7-9/12/2025</td><td>Shuwaikh</td><td><a href="https://example.test/form">Form</a></td></tr></table>`;
  const rows = parseSourcePage(html, source, "2026-09-04");
  const row = rows.find((item) => item.title_ar === "Ethical AI in Research");
  assert.equal(row.schedule_label, "7-9/12/2025");
  assert.equal(row.location, "Shuwaikh");
  assert.equal(row.is_published, false);
});

test("tracks the active Kuwait learning sources and retires removed organizations", () => {
  assert.deepEqual(defaultSources.map((sourceItem) => sourceItem.key), ["kgbc", "kisr", "sacgc", "coded", "kfas", "ku-engineering", "ku-community"]);
  assert.ok(defaultSources.find((sourceItem) => sourceItem.key === "kfas").feedUrls.includes("https://apply.kfas.org.kw/Offers/ListOffers"));
  assert.deepEqual(retiredSourceUrls, []);
});

test("unpublishes catalog records before disabling retired sources", async () => {
  const calls = [];
  const client = {
    from(table) {
      return {
        select(columns) {
          return { in(column, values) {
            calls.push({ operation: "select", table, columns, column, values });
            return Promise.resolve({ data: [{ id: "old-1" }, { id: "old-2" }, { id: "old-3" }], error: null });
          } };
        },
        update(values) {
          return { in(column, ids) {
            calls.push({ operation: "update", table, values, column, ids });
            return Promise.resolve({ error: null });
          } };
        },
      };
    },
  };
  assert.equal(await retireRemovedSources(client), 0);
  assert.equal(calls.length, 0);
  assert.equal(await retireRemovedSources(client, ["https://retired.example/"]), 3);
  assert.deepEqual(calls.map(({ operation, table }) => `${operation}:${table}`), [
    "select:learning_sources",
    "update:learning_opportunities",
    "update:learning_sources",
  ]);
  assert.deepEqual(calls[1].values, { is_published: false, publication_ready: false });
  assert.deepEqual(calls[2].values, { is_active: false });
});

test("uses a stable factual hash so AI review only repeats after content changes", () => {
  const base = `<script type="application/ld+json">${JSON.stringify({
    "@type": "Course",
    name: "Future Science Course",
    description: "Official description",
    url: "/future-science",
    offers: { url: "/register" },
  })}</script>`;
  const first = parseSourcePage(base, source, "2030-09-01")[0];
  const laterCheck = parseSourcePage(base, source, "2030-09-02")[0];
  const changed = parseSourcePage(base.replace("Official description", "Updated official description"), source, "2030-09-02")[0];
  assert.equal(first.content_hash, laterCheck.content_hash);
  assert.notEqual(first.content_hash, changed.content_hash);
});

test("does not republish an unchanged opportunity that previously failed AI review", () => {
  const row = { source_fingerprint: "official#course", status: "open", is_published: true };
  const [output] = applyReviewResults([row], [], [{
    source_fingerprint: row.source_fingerprint,
    ai_review_status: "needs_review",
  }]);
  assert.equal(output.status, "verify");
  assert.equal(output.is_published, false);
});
