import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { extractOfficial, verifyOfficial } from "../scripts/official-extraction.mjs";
import { defaultSources, syncConfiguration } from "../scripts/sync-opportunities.mjs";
import { htmlDocument } from "../scripts/official-documents.mjs";
import { syncOfficialSource } from "../scripts/source-only-sync.mjs";

const source = defaultSources.find(source => source.key === "kfas");
const url = "https://apply.kfas.org.kw/Offers/OffersDetailes?offerId=83b58475-a7a6-f111-aaad-70a8a522812d";
const text = "KFAS Offer Details Strategic Thinking Local Executive Education (LEE) Strategy No Description Available Provider UCL Dates Nov 02 – Nov 05, 2030 Time 08:00 AM – 03:00 PM Registration Deadline Oct 15, 2030 03:00 PM Venue Abdullah Al Salem Cultural Center Brochure View & Download Apply General Terms & Conditions Target Audience General A programme to improve strategic thinking and management. Terms & Conditions No Terms Specified Target Audience Kuwaiti Nationals Minimum of 2 years of Management Experience Working in Public and Private sector Apply for this Program Required Data Attachments Nomination Letter (Training Approval) Updated CV (In English) Cancel Apply";
const doc = { url, text, channel: "website", candidates: [], images: ["https://apply.kfas.org.kw/poster.png"], imageHashes: ["a".repeat(64)], links: [url, "https://apply.kfas.org.kw/User/Login?returnUrl=" + encodeURIComponent(new URL(url).pathname + new URL(url).search)] };
const now = Date.parse("2030-09-01T12:00:00Z");

test("required organizations and half-hour source-only schedule are configured", async () => {
  const implementation = await readFile(new URL("../scripts/source-only-sync.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(implementation, /from ["']\.\/sync-opportunities\.mjs/);
  for (const key of ["coded", "kgbc", "kisr", "sacgc", "kfas"]) assert.ok(defaultSources.some(s => s.key === key));
  const workflow = await readFile(new URL("../.github/workflows/sync-opportunities.yml", import.meta.url), "utf8");
  assert.match(workflow, /cron: "\*\/30 \* \* \* \*"/);
  assert.match(workflow, /BOT_VERIFICATION_MODE: official_source/);
  assert.equal(syncConfiguration({ SUPABASE_URL: "https://test.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test", BOT_VERIFICATION_MODE: "official_source" }).aiConfigured, false);
});

test("official parser publishes exact local facts without pretending to use AI", () => {
  const [row] = extractOfficial(doc, source);
  const verified = verifyOfficial(row, source, doc, now);
  assert.deepEqual(verified.publication_issues, []);
  assert.equal(verified.is_published, true, verified.publication_issues.join(","));
  assert.equal(verified.ai_review_status, "unavailable");
  assert.equal(verified.verification_method, "official_source");
  assert.equal(row.registration_ends_at, "2030-10-15T15:00:00+03:00");
  assert.equal(row.min_age, null); assert.equal(row.max_age, null); assert.equal(row.price_kwd, null);
  assert.match(row.description_ar, /2 years of Management Experience/);
  assert.match(row.description_ar, /Updated CV/);
});

test("missing deadline, changed template, image or closed application fail closed", () => {
  for (const changed of [
    { ...doc, text: text.replace("Registration Deadline", "Deadline unpublished") },
    { ...doc, text: text.replace("Download Apply General", "Download Registration Closed General") },
    { ...doc, links: [url] }, { ...doc, images: [], imageHashes: [] },
    { ...doc, text: text.replace("Kuwaiti Nationals", "Kuwaiti Nationals Age: 18") },
  ]) for (const row of extractOfficial(changed, source)) assert.equal(verifyOfficial(row, source, changed, now).is_published, false);
  assert.deepEqual(extractOfficial({ ...doc, text: text.replace("Local Executive Education (LEE)", "International Executive Education") }, source), []);
});

test("expired registrations disappear and re-checking does not resurrect them", () => {
  const [row] = extractOfficial(doc, source);
  for (const time of [Date.parse(row.registration_ends_at), Date.parse(row.starts_at)]) {
    const checked = verifyOfficial(row, source, doc, time);
    assert.equal(checked.is_published, false); assert.equal(checked.status, "closed");
  }
});

test("generic structured adapter does not turn a start date or inquiry into a deadline", () => {
  const coded = defaultSources.find(s => s.key === "coded");
  const json = { "@type": "Course", name: "Software Course", description: "A practical software course", startDate: "2030-11-02T08:00:00+03:00", endDate: "2030-11-05T15:00:00+03:00", offers: { url: "https://coded.kw/course" } };
  const document = htmlDocument(`<script type="application/ld+json">${JSON.stringify(json)}</script>`, "https://coded.kw/course", coded);
  const [row] = extractOfficial(document, coded);
  assert.equal(row.registration_ends_at, null);
  assert.equal(row.registration_state, "unknown");
  assert.equal(verifyOfficial(row, coded, document, now).is_published, false);
});

test("CODED adapter publishes a live cohort only after its exact official application page is checked", () => {
  const coded = defaultSources.find(s => s.key === "coded");
  const pageUrl = "https://coded.kw/bootcamps/data-science";
  const registrationUrl = "https://coded.kw/program/DS/apply?utm_source=website&utm_medium=organic&cohort=DS-Sep%2FDec-30";
  const html = `<title>AI & Data Science Bootcamp in Kuwait | CODED Kuwait</title><main>Everything you need to know Learn how to build and launch applied AI products. Next kickoff · your seat is live 27 Sept 2030 – 3 Dec 2030 Sun–Wed · 5:00–8:45 PM CODED Campus, Free Trade Zone <a href="${registrationUrl}">Apply Now</a> Bootcamp price 2,200 KD Explore Payment Option Applications close in 00 Days 00 Hours 00 Minutes 00 Seconds Duration 10 weeks Level Beginner–Friendly Format In-Person, Kuwait Overview Work with real datasets and deploy practical models. See what you will get <img src="/brand/coded-wordmark-navy.png"><img src="/img/data-science.jpg"></main>`;
  const page = { ...htmlDocument(html, pageUrl, coded), imageHashes: ["a".repeat(64), "b".repeat(64)] };
  const registration = htmlDocument("<main>Data Science — Apply Join our next cohort Starts 2030-09-27 Ends 2030-12-03 Start Application</main>", registrationUrl, coded);
  const [row] = extractOfficial(page, coded);
  const held = verifyOfficial(row, coded, page, now);
  const verified = verifyOfficial(row, coded, page, now, registration);
  assert.equal(held.is_published, false);
  assert.equal(verified.is_published, true, verified.publication_issues.join(","));
  assert.equal(row.registration_ends_at, "2030-09-27T00:00:00+03:00");
  assert.equal(row.starts_at, "2030-09-27T17:00:00+03:00");
  assert.equal(row.ends_at, "2030-12-03T20:45:00+03:00");
  assert.equal(row.price_kwd, 2200);
  assert.equal(row.image_url, "https://coded.kw/img/data-science.jpg");
  assert.equal(verified.registration_page_hash.length, 64);
  assert.deepEqual(verified.publication_issues, []);
});

test("new publication policy preserves evidence privacy and server-only writes", async () => {
  const sql = await readFile(new URL("../supabase/migrations/0009_official_source_verification.sql", import.meta.url), "utf8");
  assert.match(sql, /verified_at > now\(\) - interval '24 hours'/);
  assert.match(sql, /new\.ai_review_status = 'unavailable'/);
  assert.match(sql, /registration_ends_at > now\(\)/);
  assert.doesNotMatch(sql, /grant\s+(?:all|insert|update|delete)|disable row level|drop table/i);
});

test("source sync adds, refreshes without duplication, and hides a closed course", async () => {
  const tables = { learning_sources: [], learning_opportunities: [], learning_source_documents: [] };
  const client = { from(table) {
    const filters = []; let op = "select", values, conflict = "id", single = false;
    const q = {
      select() { return q; }, single() { single = true; return q; },
      eq(key, value) { filters.push(row => row[key] === value); return q; },
      not(key, operator, value) { filters.push(row => !value.slice(1, -1).split(",").includes(row[key])); return q; },
      upsert(value, options = {}) { op = "upsert"; values = Array.isArray(value) ? value : [value]; conflict = options.onConflict ?? "id"; return q; },
      update(value) { op = "update"; values = value; return q; },
      then(resolve, reject) {
        try {
          let data = [];
          if (op === "upsert") for (const value of values) {
            let row = tables[table].find(row => conflict.split(",").every(key => row[key] === value[key]));
            if (row) Object.assign(row, value);
            else { row = { id: "source-fixture", ...value }; tables[table].push(row); }
            data.push(row);
          }
          else { data = tables[table].filter(row => filters.every(filter => filter(row))); if (op === "update") data.forEach(row => Object.assign(row, values)); }
          resolve({ data: single ? data[0] : data, error: null });
        } catch (error) { reject(error); }
      },
    }; return q;
  } };
  let content = text;
  const fixtureSource = { ...source, feedUrl: url, feedUrls: [url] };
  const fetchImpl = async (destination) => destination === url
    ? new Response(`<main>${content}<a href="${doc.links[1]}">Apply</a><img src="/poster.png"></main>`, { headers: { "content-type": "text/html" } })
    : destination.endsWith("/poster.png") ? new Response("image fixture", { headers: { "content-type": "image/png" } }) : new Response("", { status: 404 });
  await syncOfficialSource(client, fixtureSource, { env: {}, fetchImpl });
  assert.equal(tables.learning_opportunities.length, 1);
  assert.equal(tables.learning_opportunities[0].is_published, true);
  assert.equal(tables.learning_opportunities[0].ai_review_status, "unavailable");
  const fingerprint = tables.learning_opportunities[0].source_fingerprint;
  await syncOfficialSource(client, fixtureSource, { env: {}, fetchImpl });
  assert.equal(tables.learning_opportunities.length, 1);
  assert.equal(tables.learning_opportunities[0].source_fingerprint, fingerprint);
  content = text.replace("Download Apply General", "Download Registration Closed General");
  await syncOfficialSource(client, fixtureSource, { env: {}, fetchImpl });
  assert.equal(tables.learning_opportunities[0].is_published, false);
  assert.equal(tables.learning_source_documents[0].status, "official_source_checked");
});
