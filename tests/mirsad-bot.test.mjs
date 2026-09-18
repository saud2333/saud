import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(new URL("../app/lib/mirsad-bot.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { answerMirsad, botFaqs, botGroups } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
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

test("every FAQ button and typed label answers in both languages without catalog access", () => {
  assert.ok(botFaqs.length >= 40);
  assert.equal(new Set(botFaqs.map(faq => faq.id)).size, botFaqs.length);
  for (const faq of botFaqs) {
    assert.ok(botGroups.some(group => group.id === faq.group));
    for (const language of ["ar", "en"]) {
      const expected = language === "ar" ? faq.answerAr : faq.answerEn;
      for (const id of [faq.id, undefined]) {
        const result = answerMirsad(faq[language], [], language, { age: 99, organizer: "KISR", free: true }, false, id);
        assert.equal(result.matchedFaq, faq.id, `${language}: ${faq.id}`);
        assert.equal(result.reply, expected);
        assert.ok(result.reply.length > 20);
      }
    }
  }
});

test("new searches do not inherit previous suggestion filters", () => {
  const first = answerMirsad("ورشة تقنية", rows, "ar");
  assert.deepEqual(answerMirsad("KFAS", rows, "ar", first.context).rows.map(row => row.id), ["b"]);
});

test("English apostrophes preserve age constraints and AI is a course topic", () => {
  assert.deepEqual(answerMirsad("I’m 16 and interested in technology", rows, "en").rows.map(row => row.id), ["a"]);
  assert.equal(answerMirsad("دورات ذكاء اصطناعي", rows, "ar").rows.length, 1);
});

test("short fee and duration followups use previous results", () => {
  const first = answerMirsad("ورشة تقنية", rows, "ar");
  for (const question of ["جم؟", "how much?"]) {
    assert.match(answerMirsad(question, rows, "ar", first.context).reply, /10 KWD/);
  }
  assert.match(answerMirsad("كم يوم؟", rows, "ar", first.context).reply, /المدة: غير معلن/);
});
