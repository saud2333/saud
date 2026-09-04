import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("implements the Arabic Mirsad discovery experience", async () => {
  const [layout, page, app, css, data, migration, automaticSync, officialLinks] = await Promise.all([
    read("app/layout.tsx"),
    read("app/page.tsx"),
    read("app/components/KuwaitCoursesApp.tsx"),
    read("app/globals.css"),
    read("app/data/opportunities.ts"),
    read("supabase/migrations/0002_mirsad_learning_opportunities.sql"),
    read("supabase/migrations/0003_mirsad_automatic_sync.sql"),
    read("supabase/migrations/0004_mirsad_official_registration_urls.sql"),
  ]);
  assert.match(layout, /مِرصاد \| دليل دورات وورش الكويت/);
  assert.match(layout, /lang="ar" dir="rtl"/);
  assert.match(page, /KuwaitCoursesApp/);
  assert.match(app, /تعلّم مهارات المستقبل/);
  assert.match(app, /filter_learning_opportunities/);
  assert.match(app, /مُرشد مِرصاد/);
  assert.match(app, /learning-opportunities-live/);
  assert.match(app, /السعر غير منشور/);
  assert.match(data, /Service Robotics for Industry/);
  assert.match(data, /لم يحدده المنظم/);
  assert.match(data, /مجلس الكويت للمباني الخضراء/);
  assert.match(data, /مؤسسة الكويت للتقدم العلمي/);
  assert.match(data, /معهد الكويت للأبحاث العلمية/);
  assert.match(data, /مركز صباح الأحمد للموهبة والإبداع/);
  assert.doesNotMatch(data, /forms\.office\.com/);
  assert.match(app, /officialRegistrationDestination/);
  assert.match(app, /موقع الجهة للتسجيل/);
  assert.match(migration, /learning_opportunities_public_read/);
  assert.match(migration, /supabase_realtime/);
  assert.match(automaticSync, /archive_expired_learning_opportunities/);
  assert.match(automaticSync, /registration_ends_at/);
  assert.match(officialLinks, /normalize_learning_opportunity_registration/);
  assert.match(officialLinks, /kuwaitgbc\\\.com/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /html\[data-theme="dark"\]/);
  assert.match(layout, /mirsad-theme/);
});

test("includes all primary pages and API surfaces", async () => {
  const paths = [
    "app/construction/page.tsx",
    "app/water/page.tsx",
    "app/infrastructure/page.tsx",
    "app/dashboard/page.tsx",
    "app/admin/page.tsx",
    "app/admin/access/page.tsx",
    "app/ai/page.tsx",
    "app/profile/page.tsx",
    "app/login/page.tsx",
    "app/guide/page.tsx",
    "app/api/materials/route.ts",
    "app/api/materials/[id]/route.ts",
    "app/api/engineers/route.ts",
    "app/api/suppliers/route.ts",
    "app/api/projects/route.ts",
    "app/api/road-reports/route.ts",
    "app/api/documents/upload/route.ts",
    "app/api/boq/analyze/route.ts",
    "app/api/ai/route.ts",
    "app/api/profile/route.ts",
    "app/api/admin/session/route.ts",
    "app/api/admin/claim/route.ts",
  ];
  await Promise.all(paths.map((path) => access(new URL(path, root))));
});

test("includes database, storage, and production assets", async () => {
  const [schema, packageJson, hosting, migration, profileMigration, adminMigration, worker] = await Promise.all([
    read("db/schema.ts"),
    read("package.json"),
    read(".openai/hosting.json"),
    read("drizzle/0000_sticky_malice.sql"),
    read("drizzle/0001_dark_sentinel.sql"),
    read("drizzle/0002_fine_kylun.sql"),
    read("worker/index.ts"),
  ]);
  for (const table of ["users", "engineers", "contractors", "suppliers", "materials", "materialPrices", "priceHistory", "projects", "boqs", "roadReports", "documents", "aiConversations", "notifications"]) {
    assert.match(schema, new RegExp(`export const ${table}`));
  }
  assert.match(packageJson, /drizzle-orm/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(hosting, /"r2": "FILES"/);
  assert.match(migration, /CREATE TABLE `material_prices`/);
  assert.match(profileMigration, /ADD `theme` text/);
  assert.match(adminMigration, /idx_users_single_admin/);
  assert.match(worker, /allowedApiMethods/);
  assert.match(worker, /Content-Security-Policy/);
  await access(new URL("public/og.png", root));
  await access(new URL("public/civilkuwait-sustainable-hero.png", root));
  await access(new URL("public/fictional-engineers-grid.png", root));
  await access(new URL("dist/server/index.js", root));
});

test("keeps AI and live-data safety boundaries explicit", async () => {
  const [ai, catalog, architecture] = await Promise.all([
    read("app/api/ai/route.ts"),
    read("app/data/catalog.ts"),
    read("ARCHITECTURE.md"),
  ]);
  assert.match(ai, /safe_local_source_router/);
  assert.match(ai, /requestOpenAI/);
  assert.match(ai, /external_ai_connected: externalAiConnected/);
  assert.match(ai, /provider_configured: Boolean\(apiKey\)/);
  assert.match(ai, /ksm\.pai\.gov\.kw/);
  assert.match(catalog, /price: null/);
  assert.match(catalog, /demo: true/);
  assert.match(architecture, /لا تُقارن عروض مختلفة مباشرة/);
  assert.match(architecture, /لا يوجد مفتاح ذكاء اصطناعي داخل الكود/);
});

test("protects administration server-side and persists user-owned state", async () => {
  const [server, session, claim, profile, aiPage] = await Promise.all([
    read("app/lib/server.ts"),
    read("app/api/admin/session/route.ts"),
    read("app/api/admin/claim/route.ts"),
    read("app/api/profile/route.ts"),
    read("app/components/AiWorkspace.tsx"),
  ]);
  assert.match(server, /requireAdminUser/);
  assert.match(server, /ADMIN_SETUP_CODE/);
  assert.match(session, /requireAdminUser/);
  assert.match(claim, /count\(\)/);
  assert.match(claim, /constantTimeMatch/);
  assert.match(profile, /db\.update\(users\)/);
  assert.match(aiPage, /سجّل الدخول للحفظ/);
});
