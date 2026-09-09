import { collectSocialDocuments, fetchOfficialPage, withImageHashes } from "./official-documents.mjs";
import { mirrorEmbeddedImages } from "./embedded-media.mjs";
import { extractOfficial, verifyOfficial, OFFICIAL_VERIFIER_VERSION } from "./official-extraction.mjs";
import { officialUrl, REVIEW_POLICY_VERSION } from "./publication-policy.mjs";
import { documentHash } from "./announcement-extraction.mjs";
import { databaseRow } from "./catalog-row.mjs";

async function checked(result) {
  const value = await result;
  if (value.error) throw new Error(`Catalog write/read failed (${value.error.code ?? "request_failed"})`);
  return value.data;
}

export async function syncOfficialSource(client, source, { env = process.env, fetchImpl = fetch } = {}) {
  const startedAt = new Date().toISOString(), channels = [], documents = [], failures = [];
  const sourceRow = await checked(client.from("learning_sources").upsert({ name: source.name, website_url: source.websiteUrl,
    feed_url: source.feedUrl, parser_key: OFFICIAL_VERIFIER_VERSION, is_active: true }, { onConflict: "website_url" }).select("id").single());
  const cached = await checked(client.from("learning_source_documents").select("document_url,checked_at,rows").eq("source_id", sourceRow.id)) ?? [];
  const existing = await checked(client.from("learning_opportunities").select("id,title_ar,title_en,source_fingerprint,source_url,is_published,registration_ends_at,featured").eq("source_id", sourceRow.id)) ?? [];
  const current = existing.filter(row => row.is_published || Date.parse(row.registration_ends_at) > Date.now());
  const fetchPage = async (url, channel) => {
    try { const document = await fetchOfficialPage(url, source, fetchImpl); documents.push(document); channels.push({ channel, url, status: "ok" }); }
    catch (error) { channels.push({ channel, url, status: "failed", message: error.message }); }
  };
  await Promise.all((source.feedUrls ?? [source.feedUrl]).map(url => fetchPage(url, "website")));
  const social = await collectSocialDocuments(source, env, fetchImpl);
  channels.push(...social.channels.map(channel => channel.status === "ok" ? { ...channel, status: "discovery_only" } : channel));
  const detailUrls = [...new Set([
    ...current.map(row => row.source_url),
    ...documents.flatMap(document => document.candidates),
    ...social.documents.flatMap(document => document.links),
  ])].filter(url => officialUrl(url, source) && !documents.some(document => document.url === url));
  // Check live records first; rotate discovery by oldest check to prevent starvation.
  const live = new Set(current.map(row => row.source_url));
  const seen = new Map(cached.map(document => [document.document_url, Date.parse(document.checked_at)]));
  detailUrls.sort((a, b) => Number(live.has(b)) - Number(live.has(a)) || (seen.get(a) ?? 0) - (seen.get(b) ?? 0));
  const queue = detailUrls.slice(0, 28);
  for (let offset = 0; offset < queue.length; offset += 4) await Promise.all(queue.slice(offset, offset + 4).map(url => fetchPage(url, "website_detail")));
  let published = 0, held = 0, unsupported = 0, count = 0;
  const unique = new Map(documents.map(document => [document.url, document]));
  for (let document of unique.values()) {
    let rows = extractOfficial(document, source);
    if (rows.length) {
      try {
        const prepared = await mirrorEmbeddedImages(document, source, client);
        document = await withImageHashes(prepared.document, source, fetchImpl, prepared.trustedMirrors);
        rows = extractOfficial(document, source);
      } catch (error) {
        failures.push({ url: document.url, message: error.message });
        document = { ...document, images: [], imageHashes: [] };
        rows = extractOfficial(document, source);
      }
    } else unsupported++;
    const checkedAt = new Date().toISOString();
    const output = rows.map(row => {
      const previous = existing.find(item => item.id === row.id);
      // Preserve reviewed Arabic titles only when the official English title is unchanged.
      if (previous?.title_en && previous.title_en === row.title_en) row.title_ar = previous.title_ar;
      if (previous) { row.source_fingerprint = previous.source_fingerprint; row.featured = Boolean(previous.featured); }
      const result = verifyOfficial(row, source, document, Date.parse(checkedAt));
      if (result.registration_url !== document.url) {
        result.publication_issues.push("registration:destination_needs_adapter");
        result.is_published = false; result.publication_ready = false; result.status = "verify";
      }
      return result;
    });
    if (output.length) await checked(client.from("learning_opportunities").upsert(output.map(row => databaseRow(row, sourceRow.id, checkedAt)), { onConflict: "id" }));
    // Reconcile only a successfully fetched exact page. A missing/changed
    // template cannot keep yesterday's claims alive. Nothing is hard-deleted.
    let hide = client.from("learning_opportunities").update({ is_published: false, publication_ready: false })
      .eq("source_id", sourceRow.id).eq("source_url", document.url);
    if (output.length) hide = hide.not("id", "in", `(${output.map(row => row.id).join(",")})`);
    await checked(hide);
    const { embeddedImages, ...safeEvidence } = document;
    await checked(client.from("learning_source_documents").upsert({ source_id: sourceRow.id, document_url: document.url,
      channel: "website", evidence: safeEvidence, evidence_hash: documentHash(document), rows: output,
      status: rows.length ? "official_source_checked" : "no_supported_complete_announcement",
      review_policy_version: REVIEW_POLICY_VERSION, reviewed_at: checkedAt, checked_at: checkedAt,
    }, { onConflict: "source_id,document_url" }));
    count += output.length; published += output.filter(row => row.is_published).length; held += output.filter(row => !row.is_published).length;
  }
  for (const channel of channels.filter(item => item.status === "failed" && item.url)) {
    await checked(client.from("learning_opportunities").update({ is_published: false, publication_ready: false })
      .eq("source_id", sourceRow.id).eq("source_url", channel.url));
  }
  const report = { mode: "official_source", count, published, held, unsupportedDocuments: unsupported,
    documents: unique.size, deferred: Math.max(0, detailUrls.length - queue.length), channels, failures };
  const status = !unique.size ? "failed" : failures.length || channels.some(item => item.status === "failed") ? "partial" : "ok";
  await checked(client.from("learning_sources").update({ last_synced_at: new Date().toISOString(), last_sync_status: status,
    last_sync_message: JSON.stringify(report), channel_status: channels }).eq("id", sourceRow.id));
  // Optional channel gaps are visible in the source report; database failures
  // still fail the job. One unavailable website must not stop other sources.
  return { ...report, startedAt, ok: true };
}
