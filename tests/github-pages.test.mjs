import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("builds the GitHub Pages single-page app at the repository base path", () => {
  const index = read("docs/index.html");
  const notFound = read("docs/404.html");
  assert.match(index, /\/saud\/assets\/main-/);
  assert.match(notFound, /\/saud\/assets\/main-/);
  assert.ok(fs.existsSync(new URL("../docs/.nojekyll", import.meta.url)));
});

test("connects only with the public Supabase key", () => {
  const client = read("app/lib/supabase.ts");
  assert.match(client, /https:\/\/crqjtgolagrknjkpbsdi\.supabase\.co/);
  assert.match(client, /sb_publishable_/);
  assert.doesNotMatch(client, /service[_-]?role/i);
});

test("Supabase migration enforces ownership and a single administrator", () => {
  const sql = read("supabase/migrations/0001_civilkuwait_platform.sql");
  for (const table of ["profiles", "projects", "boq_documents", "boq_items", "inspection_runs", "inspection_items", "ai_conversations", "project_documents"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /profiles_single_admin_idx[\s\S]*where role = 'admin'/i);
  assert.match(sql, /create or replace function public\.claim_platform_admin/i);
  assert.match(sql, /revoke all on table[\s\S]*from anon, authenticated/i);
  assert.doesNotMatch(sql, /CKW-GH-/);
});
