import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { reviewedCourses } from "../scripts/reviewed-kfas-batch.mjs";
import { additionalReviewedCourses } from "../scripts/additional-kfas-courses.mjs";

test("additional November KFAS courses retain authentic images and eligibility", async () => {
  assert.equal(additionalReviewedCourses.length, 3);
  for (const course of additionalReviewedCourses) {
    const bytes = await readFile(new URL(`../public/verified/${course.slug}.${course.extension}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), course.hash);
    assert.ok(Date.parse(course.deadline) < Date.parse(course.start));
    assert.match(course.description, /سنتين/);
    assert.match(course.caption, /^شعار/);
  }
});

test("three reviewed KFAS programs preserve verified provider logos and deadlines", async () => {
  assert.equal(reviewedCourses.length, 3);
  for (const row of reviewedCourses) {
    assert.match(row.id, /^[a-f0-9-]{36}$/);
    assert.ok(Date.parse(row.deadline) < Date.parse(row.start));
    assert.ok(Date.parse(row.start) <= Date.parse(row.end));
    assert.match(row.caption, /^شعار/);
    const bytes = await readFile(new URL(`../public/verified/${row.slug}.png`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), row.hash);
  }
});

test("initial catalog setup refuses existing tables and keeps evidence private", async () => {
  const sql = await readFile(new URL("../supabase/catalog-initial-setup.sql", import.meta.url), "utf8");
  assert.match(sql, /raise exception 'Catalog already exists/);
  assert.doesNotMatch(sql, /drop\s|delete\s|create or replace/gi);
  assert.match(sql, /learning_source_documents enable row level security/);
  assert.match(sql, /grant select on public.learning_sources,public.learning_opportunities to anon,authenticated/);
  assert.doesNotMatch(sql, /grant select[^;]*learning_source_documents/i);
  assert.match(sql, /create trigger zz_enforce_complete_learning_announcement/);
});

test("UI identifies initial review and does not imply ongoing automated verification", async () => {
  const [ui, i18n] = await Promise.all([
    readFile(new URL("../app/components/KuwaitCoursesApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/mirsad-i18n.ts", import.meta.url), "utf8"),
  ]);
  assert.match(ui, /ai_review_model/);
  assert.match(i18n, /الجمع والمراجعة الآلية المستمرة لم يُفعّلا بعد/);
  assert.match(i18n, /هذه ليست متابعة آلية مستمرة/);
  assert.match(i18n, /Continuous automated collection and review are not active yet/);
  assert.match(i18n, /this is not continuous automated monitoring/);
  assert.match(ui, /imageCaption/);
});
