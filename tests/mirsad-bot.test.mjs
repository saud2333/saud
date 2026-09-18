import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(new URL("../app/lib/mirsad-bot.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { answerMirsad } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const rows = [
  { id: "a", title: "ورشة تقنية", titleEn: "Technology Workshop", organizer: "CODED", category: "التقنية والذكاء الاصطناعي", kind: "workshop", mode: "in_person", minAge: 14, maxAge: 18, priceKwd: 10, location: "Kuwait", schedule: "Tomorrow", registrationEndsAt: null },
  { id: "b", title: "دورة بيانات", organizer: "KFAS", category: "التقنية والذكاء الاصطناعي", kind: "course", mode: "online", minAge: null, maxAge: null, priceKwd: null },
];
test("Arabic digits and age eligibility never match unknown ages", () => {
  const r = answerMirsad("عمري ١٦ وأبي ورشة تقنية", rows, "ar");
  assert.deepEqual(r.rows.map(r => r.id), ["a"]);
});
test("follow-up fee questions use prior results and reset includes all kinds", () => {
  const r = answerMirsad("ورشة تقنية", rows, "ar");
  assert.match(answerMirsad("بكم؟", rows, "ar", r.context).reply, /10 KWD/);
  assert.equal(answerMirsad("كل الفرص", rows, "ar", r.context).rows.length, 2);
});
test("unknown fees are not free and empty searches do not invent results", () => {
  assert.equal(answerMirsad("free courses", rows, "en").rows.length, 0);
  assert.equal(answerMirsad("دورات KISR", rows, "ar").rows.length, 0);
  assert.equal(answerMirsad("دورات طبخ", rows, "ar").rows.length, 0);
});
test("site help works without catalog; broad unknown questions get an honest reply", () => {
  assert.match(answerMirsad("شلون أسجل؟", [], "ar", {}, false).reply, /الموقع الرسمي/);
  assert.match(answerMirsad("capital of France", rows, "en").reply, /don’t have a reliable answer/);
  assert.match(answerMirsad("دورات", [], "ar", {}, false).reply, /غير متاحة/);
});
