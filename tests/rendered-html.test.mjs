import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Arabic sustainability site", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*\blang=["']ar["'][^>]*\bdir=["']rtl["']/i);
  assert.match(html, /<title>استدامة البناء \| نحو أثر يدوم<\/title>/);
  assert.match(html, /نبني اليوم\./);
  assert.match(html, /ليدوم الأثر غدًا\./);
  assert.match(html, /src="[^"]*hero-sustainability\.png/);
  assert.match(html, /href="#program"/);
  assert.match(html, /href="#method"/);
  assert.match(html, /href="#story"/);
  assert.match(html, /href="#next"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps starter-only code out of the finished site", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /hero-sustainability\.png/);
  assert.match(page, /id="program"/);
  assert.match(page, /id="method"/);
  assert.match(page, /id="story"/);
  assert.match(page, /id="next"/);
  assert.match(layout, /lang="ar" dir="rtl"/);
  assert.match(layout, /استدامة البناء \| نحو أثر يدوم/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(max-width:\s*680px\)/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|site-creator-vinext-starter/);

  await access(new URL("../public/hero-sustainability.png", import.meta.url));
  await assert.rejects(
    access(new URL("../app/_sites-preview", templateRoot)),
  );
});
