// Print a transactional setup for a missing catalog without old demonstration rows.
// Run this output in the selected project's Supabase SQL Editor. No keys required.
import { readFile } from "node:fs/promises";

const base = new URL("../supabase/migrations/", import.meta.url);
const first = await readFile(new URL("0002_mirsad_learning_opportunities.sql", base), "utf8");
const schemaOnly = first.slice(0, first.indexOf("insert into public.learning_sources"))
  + first.slice(first.indexOf("do $$"));
const parts = [schemaOnly];
for (const name of ["0003_mirsad_automatic_sync.sql", "0004_mirsad_official_registration_urls.sql", "0005_mirsad_ai_review.sql", "0006_complete_official_announcements.sql", "0007_nullable_age_and_fees.sql"]) {
  parts.push((await readFile(new URL(name, base), "utf8")).replace(/^(?:begin|commit);\s*$/gm, ""));
}
console.log(`begin;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
create or replace function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
${parts.join("\n")}
notify pgrst, 'reload schema';
commit;
`);
