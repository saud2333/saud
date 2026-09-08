// One-time, interactively reviewed batch, not an automated AI-service result.
// Prints data only. Does not connect to Supabase or renew reviews automatically.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { htmlDocument, boundedText } from "./official-documents.mjs";
import { gatePublication, UNANNOUNCED } from "./publication-policy.mjs";
import { documentHash } from "./announcement-extraction.mjs";

export const reviewedCourses = [
  {
    id: "d695c200-15a1-f111-b8de-70a8a522812d", slug: "strategic-leadership",
    title: "Strategic Leadership in Action: Direction, Choices and Execution",
    titleAr: "القيادة الاستراتيجية في الممارسة: التوجه والخيارات والتنفيذ",
    description: "برنامج تقدمه جامعة هيريوت وات للكويتيين المهنيين والمديرين المستقبليين العاملين في القطاعين العام والخاص. يتناول التفكير الاستراتيجي وتحليل بيئة الأعمال وتحديد الأولويات وتوزيع الموارد وإدارة المخاطر وتحويل الاستراتيجية إلى تنفيذ. يتطلب التقديم خطاب ترشيح وسيرة ذاتية محدثة باللغة الإنجليزية. لم تحدد الصفحة حدًا أدنى للخبرة.",
    kind: "course", specialty: "الإدارة الاستراتيجية", start: "2026-10-04", end: "2026-10-07", deadline: "2026-09-28", days: 4,
    datesQuote: "Oct 04 – Oct 07, 2026", deadlineQuote: "Sep 28, 2026",
    descriptionQuote: "strategic thinking capabilities", kindQuote: "Open Enrollment (OE)",
    caption: "شعار جامعة هيريوت وات — من إعلان KFAS",
    hash: "85215d9887c4690f11473294debba3dbe6e2bebb89fa0c8fb0423bd1e4631279",
  },
  {
    id: "6a727807-2084-f111-ab0e-70a8a52238d0", slug: "innovation-adaptive-leadership",
    title: "Innovation & Adaptive Leadership", titleAr: "الابتكار والقيادة التكيفية",
    description: "ورشة تفاعلية تقدمها جامعة كاليفورنيا بيركلي لمدة ثلاثة أيام، تجمع النقاش والتفكير مع الرسم وصناعة الأفكار في أنشطة عملية تدعم الابتكار والقيادة التكيفية. للكويتيين العاملين في القطاعين العام والخاص ممن لديهم خبرة إدارية لا تقل عن سنتين. يتطلب التقديم سيرة ذاتية محدثة باللغة الإنجليزية وخطاب ترشيح أو موافقة تدريب. تُطبّق شروط KFAS المنشورة في صفحة التقديم.",
    kind: "workshop", specialty: "الابتكار والقيادة", start: "2026-10-18", end: "2026-10-20", deadline: "2026-10-04", days: 3,
    datesQuote: "Oct 18 – Oct 20, 2026", deadlineQuote: "Oct 04, 2026",
    descriptionQuote: "draw and create things", kindQuote: "workshop",
    caption: "شعار Berkeley ExecEd — من إعلان KFAS",
    hash: "bbc52b078d3204b80d054901e7ab4aff9490f3db4d32c4ebff5fcf8bf6cece22",
  },
  {
    id: "6534f183-1b84-f111-ab0e-70a8a52238d0", slug: "leading-organizations",
    title: "Leading Organizations into the Future", titleAr: "قيادة المؤسسات نحو المستقبل",
    description: "برنامج قيادي تقدمه ESMT Berlin لمدة أربعة أيام، يركز على تحديد المزايا التنافسية وتصميم استراتيجيات تستعد للمستقبل وقيادة التنفيذ وإيصال الرؤية لدعم الأداء المؤسسي. للكويتيين العاملين في القطاعين العام والخاص ممن لديهم خبرة إدارية لا تقل عن سنتين. يتطلب التقديم سيرة ذاتية محدثة باللغة الإنجليزية وخطاب ترشيح أو موافقة تدريب. تُطبّق شروط KFAS المنشورة في صفحة التقديم.",
    kind: "course", specialty: "القيادة المؤسسية", start: "2026-10-26", end: "2026-10-29", deadline: "2026-10-05", days: 4,
    datesQuote: "Oct 26 – Oct 29, 2026", deadlineQuote: "Oct 05, 2026",
    descriptionQuote: "define competitive advantages", kindQuote: "Local Executive Education (LEE)",
    caption: "شعار ESMT Berlin — من إعلان KFAS",
    hash: "0f2310ca86f16968ac2cd64a2c23de3b6a11bbc1e1b4964d2d6f07f96ca7564b",
  },
];

export async function prepareReviewedBatch() {
  // A future operator must review source contents again, not replay an old verdict.
  assert.equal(new Date().toISOString().slice(0, 10), "2026-09-08", "This dated review must not be replayed on another day");
  const source = { name: "مؤسسة الكويت للتقدم العلمي — KFAS", websiteUrl: "https://www.kfas.org.kw/" };
  const result = [];
  for (const course of reviewedCourses) {
    const url = `https://apply.kfas.org.kw/Offers/OffersDetailes?offerId=${course.id}`;
    const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(30_000) });
    assert.equal(response.status, 200);
    // KFAS embeds its brochure PDFs in HTML; this local, three-page review needs a larger bounded read.
    const html = await boundedText(response, 40_000_000);
    const checkedAt = new Date().toISOString();
    // Exclude large embedded binary payloads from text parsing (retain the original bytes for hashes below).
    const textHtml = html.replace(/data:[^;"']+;base64,[A-Za-z0-9+/=]+/g, "embedded-binary");
    const original = htmlDocument(textHtml, url, source);
    original.text = original.text.replace(/&ndash;/g, "–").replace(/&mdash;/g, "—");
    for (const value of [course.title, course.datesQuote, course.deadlineQuote, course.descriptionQuote, course.kindQuote, "08:00 AM", "03:00 PM", "Abdullah Al Salem Cultural Center", "Apply"]) assert.ok(original.text.includes(value), `Changed source: ${value}. Current content: ${original.text.slice(0, 1500)}`);
    const imageTag = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]).find(tag => /alt=["']Offer Image["']/i.test(tag));
    const encoded = imageTag?.match(/src=["']data:image\/[^;]+;base64,([^"']+)["']/i)?.[1];
    assert.ok(encoded, "Missing original offer image");
    const imageHash = createHash("sha256").update(Buffer.from(encoded, "base64")).digest("hex");
    assert.equal(imageHash, course.hash, "Official image changed since visual review");
    assert.equal(createHash("sha256").update(await readFile(new URL(`../public/verified/${course.slug}.png`, import.meta.url))).digest("hex"), imageHash);
    const imageUrl = `https://saud2333.github.io/saud/verified/${course.slug}.png`;
    // This mirror is accepted only after a byte-for-byte match with the official embedded image.
    const document = { ...original, images: [imageUrl], imageHashes: [imageHash], imageProvenance: [{ url: imageUrl, sourcePage: url, selector: 'img[alt="Offer Image"]', sha256: imageHash, kind: "provider_logo" }] };
    const claims = [
      ["title", course.title], ["description", course.descriptionQuote], ["kind", course.kindQuote],
      ["schedule", course.datesQuote], ["location", "Abdullah Al Salem Cultural Center"],
      ["mode", "Abdullah Al Salem Cultural Center"], ["registration", course.deadlineQuote],
    ].map(([field, quote]) => ({ field, quote, image_url: null }));
    const row = gatePublication({
      id: `kfas-${course.id}`, title_ar: course.titleAr, title_en: course.title, description_ar: course.description,
      kind: course.kind, category: "الأعمال والمهارات", subcategory: course.specialty, organizer: source.name,
      location: "مركز الشيخ عبدالله السالم الثقافي — الكويت", governorate: "غير محدد", mode: "in_person",
      min_age: null, max_age: null, age_label: UNANNOUNCED, price_kwd: null,
      duration_label: `${course.days} أيام`, schedule_label: `${course.start} إلى ${course.end} · 08:00 صباحًا–03:00 مساءً`,
      starts_at: `${course.start}T08:00:00+03:00`, ends_at: `${course.end}T15:00:00+03:00`, registration_ends_at: `${course.deadline}T15:00:00+03:00`,
      registration_url: url, source_url: url, image_url: imageUrl, image_caption: course.caption,
      source_fingerprint: `${url}#${course.titleAr}`, content_hash: documentHash(document), evidence_hash: documentHash(document), registration_page_hash: documentHash(document),
      tags: ["KFAS", "للكويتيين"], featured: false, source_checked_at: checkedAt.slice(0, 10), last_seen_at: checkedAt,
      ai_review_status: "verified", ai_reviewed_at: checkedAt, ai_review_model: "codex-interactive",
      ai_review_note: "مراجعة تفاعلية عند الإضافة بعد جمع مستقل للمصدر؛ ليست مراجعة API مجدولة. رابط Apply وموعد نهائي قادم يدلان على إتاحة التقديم، ولا يؤكدان المقاعد. حُوّلت أوقات الفعالية الحضورية في الكويت إلى توقيت الكويت؛ المنطقة الزمنية غير مسماة في الصفحة. العمر والرسوم غير منشورين.",
      registration_state: "open", announcement_channel: "website", field_evidence: claims,
    }, source, document);
    assert.deepEqual(row.publication_issues, []);
    result.push({ row, evidence: { ...document, checkedAt, reviewedBy: "codex-interactive", reviewMode: "one-time-interactive", originalHtmlHash: createHash("sha256").update(html).digest("hex"), registrationBasis: "Official Apply form and future published deadline; seats and acceptance not guaranteed", timezoneInterpretation: "Physical Kuwait venue, local +03:00; source does not name timezone" } });
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await prepareReviewedBatch()));
