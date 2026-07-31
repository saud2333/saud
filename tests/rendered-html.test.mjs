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

test("server-renders the completed Arabic Summer Course 47 site", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*\blang=["']ar["'][^>]*\bdir=["']rtl["']/i);
  assert.match(html, /<title>الاستدامة بالبناء 47 \| من الخلطة إلى أثر يدوم<\/title>/);
  assert.match(html, /طلبة الدورة الصيفية 47/);
  assert.match(html, /نخلط المعرفة\./);
  assert.match(html, /ونبني أثرًا أقل\./);
  assert.match(html, /English/);
  assert.match(html, /type="range"/);
  assert.match(html, /href="#program"/);
  assert.match(html, /href="#lab"/);
  assert.match(html, /href="#impact"/);
  assert.match(html, /href="#sources"/);
  assert.match(html, /https:\/\/www\.unep\.org\/resources\/report\/global-status-report-buildings-and-construction-2025-2026/);
  assert.match(html, /https:\/\/www\.iea\.org\/reports\/cement-3/);
  assert.doesNotMatch(html, /أنواع خلطات|مراحل عملية|class="hero-meta"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps starter-only code out and preserves responsive production metadata", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /id="program"/);
  assert.match(page, /id="lab"/);
  assert.match(page, /id="impact"/);
  assert.match(page, /id="sources"/);
  assert.match(page, /الاستدامة بالبناء 47/);
  assert.match(page, /"use client"/);
  assert.match(page, /kisr47-language/);
  assert.match(page, /kisr47-theme/);
  assert.match(page, /Sustainable Construction 47/);
  assert.match(page, /type="range"/);
  assert.match(layout, /lang="ar" dir="rtl"/);
  assert.match(layout, /الاستدامة بالبناء 47 \| من الخلطة إلى أثر يدوم/);
  assert.match(layout, /\/og\.png/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(max-width:\s*620px\)/);
  assert.match(css, /html\[data-theme="dark"\]/);
  assert.match(css, /\.header-controls/);
  assert.doesNotMatch(page, /hero-meta|أنواع خلطات|مراحل عملية/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|site-creator-vinext-starter/);

  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
