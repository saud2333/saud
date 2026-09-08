import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { compactEmbeddedPayloads, decodeEmbeddedImage, mirrorEmbeddedImages, MEDIA_BUCKET } from "../scripts/embedded-media.mjs";
import { fetchOfficialPage, htmlDocument, withImageHashes } from "../scripts/official-documents.mjs";

const source = { key: "kfas", name: "KFAS", websiteUrl: "https://www.kfas.org.kw/" };
const pageUrl = "https://apply.kfas.org.kw/Offers/OffersDetailes?offerId=test";
const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2S8AAAAASUVORK5CYII=";
const html = `<header><img src="data:image/png;base64,${png}"></header><h1>Science Workshop</h1><p>Oct 04 &ndash; Oct 07, 2030</p><img alt="Offer Image" src="data:image/png;base64,${png}"><a href="/apply">Apply</a>`;
const document = () => htmlDocument(html, pageUrl, source);

function storageClient({ missing = false, publicBucket = true, uploadError = null, getError = null } = {}) {
  const writes = [], files = new Map();
  let exists = !missing;
  const origin = "https://project.supabase.co/storage/v1/object/public/" + MEDIA_BUCKET + "/";
  const client = { storage: {
    async getBucket(name) {
      assert.equal(name, MEDIA_BUCKET);
      if (getError) return { error: getError };
      return exists ? { data: { public: publicBucket }, error: null } : { data: null, error: { code: "NoSuchBucket" } };
    },
    async createBucket(name, options) { writes.push({ operation: "create", name, options }); exists = true; return { error: null }; },
    from(name) {
      assert.equal(name, MEDIA_BUCKET);
      return {
        async upload(path, bytes, options) {
          writes.push({ operation: "upload", path, options });
          if (!uploadError) files.set(origin + path, bytes);
          return { error: uploadError };
        },
        getPublicUrl(path) { return { data: { publicUrl: origin + path } }; },
      };
    },
  } };
  return { client, writes, files };
}

test("KFAS embedded PDFs do not bury course text or become fake page links", () => {
  const large = `<a href="data:application/pdf;base64,${"A".repeat(3_000_000)}">Brochure</a>${html}`;
  const compact = compactEmbeddedPayloads(large);
  assert.ok(compact.text.length < 1000);
  const parsed = htmlDocument(large, pageUrl, source);
  assert.match(parsed.text, /Oct 04 – Oct 07, 2030/);
  assert.doesNotMatch(parsed.text, /AAAA|base64/);
  assert.equal(parsed.embeddedImages.length, 1);
  assert.equal(parsed.embeddedImages[0].base64, png);
  assert.ok(parsed.links.every((url) => url.startsWith("https://apply.kfas.org.kw/")));
  assert.ok(parsed.links.every((url) => !url.includes("mirsad-")));
});

test("only bounded, correctly typed raster images can be mirrored", () => {
  for (const [mime, payload] of [["image/svg+xml", png], ["image/png", Buffer.from("<svg></svg>").toString("base64")], ["image/png", "not base64"], ["image/png", "A".repeat(11_000_000)]]) {
    assert.equal(decodeEmbeddedImage(mime, payload), null);
  }
  const value = decodeEmbeddedImage("image/png", png);
  assert.equal(decodeEmbeddedImage("image/jpeg", png).mimeType, "image/png");
  assert.equal(value.sha256, createHash("sha256").update(Buffer.from(png, "base64")).digest("hex"));
  assert.equal(htmlDocument(`<header><img src="data:image/png;base64,${png}"></header><p>No offer</p>`, pageUrl, source).embeddedImages, undefined);
});

test("large HTML is supported only on the official KFAS application portal", async () => {
  const body = `<!--${"x".repeat(2_100_000)}-->${html}`;
  const fetcher = async () => new Response(body, { headers: { "content-type": "text/html", "content-length": String(Buffer.byteLength(body)) } });
  assert.equal((await fetchOfficialPage(pageUrl, source, fetcher)).embeddedImages.length, 1);
  await assert.rejects(fetchOfficialPage("https://www.kfas.org.kw/", source, fetcher), /size limit/);
  await assert.rejects(fetchOfficialPage(pageUrl, source, async () => new Response("", { headers: { "content-type": "text/html", "content-length": "40000001" } })), /size limit/);
});

test("embedded official images upload immutably and are byte-verified at their public URL", async () => {
  const { client, writes, files } = storageClient({ missing: true });
  const prepared = await mirrorEmbeddedImages(document(), source, client);
  assert.equal(writes[0].operation, "create");
  assert.equal(writes[0].options.public, true);
  assert.ok(!writes[0].options.allowedMimeTypes.includes("image/svg+xml"));
  assert.equal(writes[1].options.upsert, false);
  assert.match(writes[1].path, /^kfas\/[a-f0-9]{64}\.png$/);
  assert.equal(prepared.document.embeddedImages, undefined);
  assert.ok(!JSON.stringify(prepared.document).includes(png));
  const checked = await withImageHashes(prepared.document, source, async (url) => new Response(files.get(url), { headers: { "content-type": "image/png" } }), prepared.trustedMirrors);
  assert.equal(checked.imageHashes[0], prepared.document.imageProvenance[0].sha256);
  await assert.rejects(withImageHashes(prepared.document, source, async () => new Response("changed bytes", { headers: { "content-type": "image/png" } }), prepared.trustedMirrors), /does not match/);
  await assert.rejects(withImageHashes(prepared.document, source, async () => { throw new Error("should not fetch"); }), /Untrusted/);
});

test("storage permission errors and private buckets never become public automatically", async () => {
  const denied = storageClient({ getError: { code: "AccessDenied", message: "sensitive detail" } });
  await assert.rejects(mirrorEmbeddedImages(document(), source, denied.client), (error) => /AccessDenied/.test(error.message) && !error.message.includes("sensitive detail"));
  assert.equal(denied.writes.length, 0);
  const privateStorage = storageClient({ publicBucket: false });
  await assert.rejects(mirrorEmbeddedImages(document(), source, privateStorage.client), /not public/);
  assert.equal(privateStorage.writes.length, 0);
});

test("pre-existing content-addressed files are verified, never overwritten", async () => {
  const { client, writes } = storageClient({ uploadError: { code: "ResourceAlreadyExists", statusCode: "409" } });
  const prepared = await mirrorEmbeddedImages(document(), source, client);
  assert.equal(prepared.document.images.length, 1);
  assert.equal(writes[0].options.upsert, false);
});

test("nonofficial payloads and tampered image hashes cannot cause uploads", async () => {
  const { client, writes } = storageClient();
  await assert.rejects(mirrorEmbeddedImages({ ...document(), url: "https://untrusted.test/" }, source, client), /not from an official/);
  const changed = document(); changed.embeddedImages[0].sha256 = "wrong";
  await assert.rejects(mirrorEmbeddedImages(changed, source, client), /Invalid embedded/);
  assert.equal(writes.length, 0);
});

test("loading decorations and in-page tabs are not announcement images or crawl targets", () => {
  const parsed = htmlDocument(`${html}<img src="/File/assets/images/loader.svg"><meta property="og:image" content="/loading.gif"><a href="#tab1">Program</a><a href="#tab2">Apply</a><a href="/User/Login?returnUrl=/Offers/OffersDetailes">Apply</a>`, pageUrl, source);
  assert.deepEqual(parsed.images, []);
  assert.deepEqual(parsed.candidates, ["https://apply.kfas.org.kw/apply"]);
  assert.ok(parsed.links.every((url) => !url.includes("#")));
});
