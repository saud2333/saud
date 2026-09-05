import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { gatePublication, officialTimestamp, publicationIssues, requiredEvidenceFields } from "../scripts/publication-policy.mjs";
import { collectSocialDocuments, fetchOfficialPage, htmlDocument, parseYoutubeFeed, withImageHashes } from "../scripts/official-documents.mjs";
import { documentHash, extractAnnouncements } from "../scripts/announcement-extraction.mjs";
import { syncSource } from "../scripts/sync-opportunities.mjs";

const source = { key: "fixture", name: "المركز العلمي", websiteUrl: "https://official.test/", feedUrl: "https://official.test/science" };
const quote = "ورشة العلوم، أعمار 14–18، حضوري في المختبر، يومان 1–2 أكتوبر 2030، 10 د.ك، التسجيل مفتوح حتى 28 سبتمبر 2030.";
const document = { url: source.feedUrl, text: quote, images: ["https://official.test/poster.jpg"], links: ["https://official.test/signup/science"], channel: "website" };
const complete = {
  id: "fixture-science", source_fingerprint: "official#science", source_url: source.feedUrl,
  title_ar: "ورشة العلوم", description_ar: "ورشة العلوم والتجارب التطبيقية في المختبر.", kind: "workshop",
  category: "التقنية والذكاء الاصطناعي", subcategory: "علوم", organizer: source.name, location: "المختبر", mode: "in_person",
  min_age: 14, max_age: 18, age_label: "14–18 سنة", price_kwd: 10, duration_label: "يومان", schedule_label: "1–2 أكتوبر 2030",
  starts_at: "2030-10-01T05:00:00Z", ends_at: "2030-10-02T11:00:00Z", registration_ends_at: "2030-09-28T20:59:59Z",
  registration_state: "open", registration_url: document.links[0], image_url: document.images[0],
  ai_review_status: "verified", ai_reviewed_at: new Date().toISOString(),
  field_evidence: requiredEvidenceFields.map((field) => ({ field, quote, image_url: null })),
};

test("only publishes a complete official announcement after independent review", () => {
  assert.equal(gatePublication(complete, source, document).is_published, true);
  for (const missing of ["min_age", "max_age", "price_kwd", "registration_ends_at", "starts_at", "ends_at", "image_url", "description_ar", "location", "mode", "duration_label", "registration_url"]) {
    assert.equal(gatePublication({ ...complete, [missing]: null }, source, document).is_published, false, missing);
  }
  assert.equal(gatePublication({ ...complete, ai_review_status: "needs_review" }, source, document).is_published, false);
  assert.equal(gatePublication({ ...complete, registration_state: "unknown" }, source, document).is_published, false);
});

test("rejects invented evidence, external forms, invalid date ordering, and expired registrations", () => {
  assert.ok(publicationIssues({ ...complete, field_evidence: [] }, source, document).includes("unproven:age"));
  assert.equal(gatePublication({ ...complete, registration_url: "https://forms.example/apply" }, source, document).is_published, false);
  assert.equal(gatePublication({ ...complete, registration_ends_at: "2030-10-04T12:00:00Z" }, source, document).is_published, false);
  assert.equal(gatePublication(complete, source, document, Date.parse("2030-09-29T00:00:00Z")).status, "closed");
});

test("official page fetch refuses an off-domain redirect before requesting it", async () => {
  const requests = [];
  await assert.rejects(fetchOfficialPage(source.feedUrl, source, async (url) => {
    requests.push(url);
    return new Response(null, { status: 302, headers: { location: "https://untrusted.test/course" } });
  }), /Off-domain/);
  assert.deepEqual(requests, [source.feedUrl]);
});

test("HTML evidence preserves source text, official links, and real images", () => {
  const row = htmlDocument('<nav>Menu</nav><h1>Science Workshop</h1><p>Ages 14–18</p><a href="/register">Register</a><img src="/poster.jpg"><script>secretNavigation()</script>', source.feedUrl, source);
  assert.match(row.text, /Ages 14–18/);
  assert.doesNotMatch(row.text, /secretNavigation|Menu/);
  assert.ok(row.links.includes("https://official.test/register"));
  assert.deepEqual(row.images, ["https://official.test/poster.jpg"]);
});

test("an officially identified YouTube feed yields announcements, not profile cards", () => {
  const xml = '<feed><yt:channelId>UCfixture</yt:channelId><entry><yt:videoId>abcdEF12345</yt:videoId><title>Science workshop</title><media:description>Apply https://official.test/science</media:description></entry></feed>';
  const [post] = parseYoutubeFeed(xml, source, { youtube: "UCfixture", proof: source.websiteUrl });
  assert.equal(post.url, "https://www.youtube.com/watch?v=abcdEF12345");
  assert.equal(post.accountProofUrl, source.websiteUrl);
  assert.throws(() => parseYoutubeFeed(xml, source, { youtube: "UCwrong" }), /Unexpected/);
  assert.deepEqual(parseYoutubeFeed('<feed><yt:channelId>UCfixture</yt:channelId></feed>', source, { youtube: "UCfixture" }), []);
});

test("social channels without credentials are explicitly unconfigured", async () => {
  const result = await collectSocialDocuments({ ...source, key: "kgbc" }, {}, async () => { throw new Error("must not request an authenticated API"); });
  assert.equal(result.documents.length, 0);
  assert.equal(result.channels.find((item) => item.channel === "instagram").status, "not_configured");
});

test("extraction returns no invented course when a source announces nothing", async () => {
  const result = await extractAnnouncements({ document, source, apiKey: "test-key", fetchImpl: async (_, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.ok(body.input[0].content.some((item) => item.type === "input_image"));
    return Response.json({ status: "completed", output_text: '{"announcements":[]}' });
  } });
  assert.deepEqual(result, []);
});

function fakeDatabase(cached = []) {
  const writes = [];
  const client = { from(table) {
    let operation = "select", value; const filters = [];
    const builder = {
      select() { return builder; }, eq(...filter) { filters.push(filter); return builder; },
      upsert(next) { operation = "upsert"; value = next; return builder; },
      update(next) { operation = "update"; value = next; return builder; },
      single() { writes.push({ table, operation, value, filters }); return Promise.resolve({ data: { id: "source-id" }, error: null }); },
      then(resolve) { if (operation !== "select") writes.push({ table, operation, value, filters }); return Promise.resolve({ data: operation === "select" && table === "learning_source_documents" ? cached : [], error: null }).then(resolve); },
    }; return builder;
  } };
  return { client, writes };
}

test("a successful empty source hides prior opportunities from that exact document", async () => {
  const { client, writes } = fakeDatabase();
  const report = await syncSource(client, source, {
    env: {}, fetchImpl: async () => new Response("<p>No workshops currently</p>", { headers: { "content-type": "text/html" } }),
    extract: async () => [], review: async () => [],
  });
  assert.equal(report.count, 0);
  assert.equal(report.ok, true);
  const hide = writes.find((write) => write.table === "learning_opportunities" && write.operation === "update");
  assert.equal(hide.value.is_published, false);
  assert.ok(hide.filters.some(([column, value]) => column === "source_url" && value === source.feedUrl));
  assert.equal(writes.filter((write) => write.table === "learning_opportunities" && write.operation === "upsert").length, 0);
});

test("AI failure quarantines previous rows and reports a failed sync", async () => {
  const { client, writes } = fakeDatabase();
  const result = await syncSource(client, source, {
    env: {}, fetchImpl: async () => new Response("<p>Science workshop</p>", { headers: { "content-type": "text/html" } }),
    extract: async () => { throw new Error("AI unavailable"); },
  });
  assert.equal(result.ok, false);
  assert.equal(result.failures.length, 1);
  assert.ok(writes.some((write) => write.table === "learning_opportunities" && write.value.is_published === false));
});

test("UI has an empty catalog instead of resurrecting fallback courses", async () => {
  const app = await readFile(new URL("../app/components/KuwaitCoursesApp.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(app, /fallbackOpportunities|mergeWithCurated|data\?\.length/);
  assert.match(app, /setOpportunities\(liveItems\)/);
  assert.match(app, /publication_ready/);
});

test("a changed poster at the same URL invalidates the cached review", async () => {
  const before = await withImageHashes(document, source, async () => new Response("first poster bytes", { headers: { "content-type": "image/png" } }));
  const after = await withImageHashes(document, source, async () => new Response("updated poster bytes", { headers: { "content-type": "image/png" } }));
  assert.notEqual(documentHash(before), documentHash(after));
});

test("invalid calendar dates are rejected before database insertion", () => {
  assert.ok(Number.isNaN(officialTimestamp("2030-02-30T08:00:00+03:00")));
  assert.ok(Number.isNaN(officialTimestamp("2030-10-01T08:00:00")));
  assert.ok(Number.isFinite(officialTimestamp("2032-02-29T08:00:00+03:00")));
});

test("a removed course redirecting to an empty page hides its original URL", async () => {
  const { client, writes } = fakeDatabase();
  await syncSource(client, source, {
    env: {}, fetchImpl: async (url) => url === source.feedUrl
      ? new Response(null, { status: 302, headers: { location: "/empty" } })
      : new Response("<p>No current announcements</p>", { headers: { "content-type": "text/html" } }),
    extract: async () => [], review: async () => [],
  });
  assert.ok(writes.some((write) => write.table === "learning_opportunities" && write.filters.some(([field, value]) => field === "source_url" && value === source.feedUrl)));
});

test("duplicate AI entries cannot break a PostgREST upsert", async () => {
  const rows = await extractAnnouncements({ document, source, apiKey: "test-key", fetchImpl: async () => Response.json({ status: "completed", output_text: JSON.stringify({ announcements: [complete, { ...complete, min_age: 15 }] }) }) });
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].field_evidence, []);
});

test("a complete announcement is held when its registration destination is broken", async () => {
  const { client, writes } = fakeDatabase();
  const result = await syncSource(client, source, {
    env: {},
    fetchImpl: async (url) => url === document.images[0] ? new Response("poster", { headers: { "content-type": "image/png" } })
      : url === document.links[0] ? new Response("Missing", { status: 404 })
      : new Response(`<p>${quote}</p><a href="${document.links[0]}">التسجيل</a><img src="${document.images[0]}">`, { headers: { "content-type": "text/html" } }),
    extract: async () => [complete], review: async ({ rows }) => rows,
  });
  assert.equal(result.published, 0);
  assert.equal(result.ok, false);
  assert.equal(writes.filter((write) => write.table === "learning_opportunities" && write.operation === "upsert").length, 0);
});
