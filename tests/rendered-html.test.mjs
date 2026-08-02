import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(path = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
      ...init,
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
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");

  const html = await response.text();
  assert.match(html, /<html[^>]*\blang=["']ar["'][^>]*\bdir=["']rtl["']/i);
  assert.match(html, /<title>الاستدامة بالبناء 47 \| من الخلطة إلى أثر يدوم<\/title>/);
  assert.match(html, /طلبة الدورة الصيفية 47/);
  assert.match(html, /نصنع المعرفة\./);
  assert.match(html, /ونبني أثرًا يدوم\./);
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
  assert.match(page, /mobileMenuRef/);
  assert.match(page, /scrollToCurrentHash/);
  assert.match(page, /hashchange/);
  assert.match(page, /if \(!preferencesReady\) return;/);
  assert.match(page, /handleSectionLink/);
  assert.match(page, /popstate/);
  assert.match(layout, /lang="ar" dir="rtl"/);
  assert.match(layout, /الاستدامة بالبناء 47 \| من الخلطة إلى أثر يدوم/);
  assert.match(layout, /\/og\.png/);
  assert.match(layout, /application\/ld\+json/);
  assert.match(layout, /"@type": "Course"/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(max-width:\s*620px\)/);
  assert.match(css, /html\[data-theme="dark"\]/);
  assert.match(css, /\.header-controls/);
  assert.doesNotMatch(page, /hero-meta|أنواع خلطات|مراحل عملية/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|site-creator-vinext-starter/);

  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/_headers", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});

test("rejects unsupported methods with hardened response headers", async () => {
  const response = await render("/", { method: "POST" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/);
});
