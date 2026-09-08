// Additional courses reviewed interactively on 2026-09-08.
// This is a dated addition batch, never an unattended review substitute.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { fetchOfficialPage } from "./official-documents.mjs";
import { prepareReviewedBatch } from "./reviewed-kfas-batch.mjs";

export const additionalReviewedCourses = [
  {
    id: "83b58475-a7a6-f111-aaad-70a8a522812d", slug: "strategic-thinking-growth-impact", extension: "jpg",
    title: "Strategic Thinking for Growth and Impact", titleAr: "التفكير الاستراتيجي للنمو والأثر",
    description: "برنامج تقدمه UCL للمهنيين في الإدارة الوسطى، ويتناول تحليل بيئة الأعمال وبناء الميزة التنافسية وصياغة الاستراتيجية واتخاذ القرار وتحويل التوجه الاستراتيجي إلى خطط تنفيذية، مع دمج الاستدامة والابتكار وإدارة المخاطر. للكويتيين العاملين في القطاعين العام والخاص ممن لديهم خبرة إدارية لا تقل عن سنتين. يتطلب التقديم خطاب ترشيح أو موافقة تدريب وسيرة ذاتية محدثة باللغة الإنجليزية.",
    kind: "course", specialty: "التفكير الاستراتيجي", start: "2026-11-02", end: "2026-11-05", deadline: "2026-10-15", days: 4,
    datesQuote: "Nov 02 – Nov 05, 2026", deadlineQuote: "Oct 15, 2026", descriptionQuote: "build competitive advantage", kindQuote: "Local Executive Education (LEE)",
    eligibilityQuote: "Minimum of 2 years of Management Experience",
    caption: "شعار UCL — من إعلان KFAS", hash: "447c796e0081cc4514facb67de4c836018753881e95a6f21b279379e6126ce99",
  },
  {
    id: "a32faf62-1b84-f111-ab0e-70a8a52238d0", slug: "emerging-leaders", extension: "jpg",
    title: "Emerging Leaders", titleAr: "القادة الناشئون",
    description: "برنامج تفاعلي تقدمه Alliance Manchester Business School، يركز على قيادة الذات والآخرين والفرق، وفهم أسلوب القيادة الشخصي وتطويره من خلال أدوات تشخيص وجلسات تفاعلية وسيناريوهات عملية وخطط قابلة للتطبيق في المؤسسة. للكويتيين العاملين في القطاعين العام والخاص ممن لديهم خبرة إدارية لا تقل عن سنتين. يتطلب التقديم سيرة ذاتية محدثة باللغة الإنجليزية وخطاب ترشيح أو موافقة تدريب.",
    kind: "course", specialty: "تطوير القيادة", start: "2026-11-09", end: "2026-11-11", deadline: "2026-10-19", days: 3,
    datesQuote: "Nov 09 – Nov 11, 2026", deadlineQuote: "Oct 19, 2026", descriptionQuote: "leading self, leading others and leading teams", kindQuote: "Local Executive Education (LEE)",
    eligibilityQuote: "Minimum 2years Managerial Experience",
    caption: "شعار Alliance Manchester Business School — من إعلان KFAS", hash: "afcc9c4a695b52844a65d1e31493a0fdd0441a38054c3f4b25edc69b9317bb21",
  },
  {
    id: "56ad5a4a-1b84-f111-ab0e-70a8a52238d0", slug: "change-management-execution", extension: "png",
    title: "Change Management: from Mindset to Execution", titleAr: "إدارة التغيير: من العقلية إلى التنفيذ",
    description: "برنامج تقدمه Headspring لمدة ثلاثة أيام، يجمع النماذج المفاهيمية والتطبيق العملي لقيادة التحولات المؤسسية الكبيرة. يعمل المشاركون على تحديات حقيقية لبناء خطط تغيير تناسب مؤسساتهم وتدعم أثرًا قابلًا للقياس. للكويتيين العاملين في القطاعين العام والخاص ممن لديهم خبرة إدارية لا تقل عن سنتين. يتطلب التقديم سيرة ذاتية محدثة باللغة الإنجليزية وخطاب ترشيح أو موافقة تدريب.",
    kind: "course", specialty: "إدارة التغيير", start: "2026-11-15", end: "2026-11-17", deadline: "2026-10-25", days: 3,
    datesQuote: "Nov 15 – Nov 17, 2026", deadlineQuote: "Oct 25, 2026", descriptionQuote: "tailored transformation plans", kindQuote: "Local Executive Education (LEE)",
    eligibilityQuote: "Minimum 2years Managerial Experience",
    caption: "شعار Headspring — من إعلان KFAS", hash: "2b723347ad4c38df812c99f14a244ee9af12c0bb3541bce53f67dc1927040e9b",
  },
];

async function downloadOfficialImages() {
  assert.equal(new Date().toISOString().slice(0, 10), "2026-09-08", "This dated image review must not be replayed");
  const source = { key: "kfas", websiteUrl: "https://www.kfas.org.kw/" };
  for (const course of additionalReviewedCourses) {
    const document = await fetchOfficialPage(`https://apply.kfas.org.kw/Offers/OffersDetailes?offerId=${course.id}`, source);
    assert.ok(document.text.includes(course.title));
    const image = document.embeddedImages?.find((entry) => entry.sha256 === course.hash);
    assert.ok(image, "Official image changed since review");
    const output = new URL(`../public/verified/${course.slug}.${course.extension}`, import.meta.url);
    const bytes = Buffer.from(image.base64, "base64");
    try { await writeFile(output, bytes, { flag: "wx" }); }
    catch (error) {
      if (error.code !== "EEXIST") throw error;
      assert.equal(createHash("sha256").update(await readFile(output)).digest("hex"), course.hash, "Existing asset must not be overwritten");
    }
    console.log(JSON.stringify({ saved: output.pathname, sha256: course.hash }));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--download-images")) await downloadOfficialImages();
  else console.log(JSON.stringify(await prepareReviewedBatch(additionalReviewedCourses)));
}
