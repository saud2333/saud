import type { LearningOpportunity } from "../data/opportunities";

export type BotContext = { ids?: string[]; age?: number; organizer?: string; field?: string; kind?: string; mode?: string; free?: boolean };
export const normalize = (text: string) => text.toLowerCase().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[\u064B-\u065Fـ]/g, "").replace(/[٠-٩]/g, x => String("٠١٢٣٤٥٦٧٨٩".indexOf(x))).replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

export function answerMirsad(question: string, catalog: LearningOpportunity[], language: "ar" | "en", previous: BotContext = {}, available = true) {
  const q = normalize(question);
  const t = (ar: string, en: string) => language === "ar" ? ar : en;
  const reset = /من جديد|كل الدورات|كل الفرص|reset|all courses/.test(q);
  const context: BotContext = reset ? {} : { ...previous };
  const result = (reply: string, rows: LearningOpportunity[] = []) => ({ reply, rows, context });
  if (/^(هلا|هلا والله|مرحبا|السلام عليكم|اهلا|hi|hello|hey)$/.test(q)) return result(t("هلا فيك! أنا بوت مرصاد. اسألني عن الدورات، العمر، الرسوم، المواعيد، المكان أو التسجيل. تقدر تقول: عمري 16 وأبي ورشة تقنية.", "Hello! I’m Mirsad Bot. Ask about courses, ages, fees, dates, locations or registration. Try: I’m 16 and want a technology workshop."));
  if (/^(شكرا|مشكور|يعطيك العافيه|thanks|thank you)$/.test(q)) return result(t("العفو! شنو تحب تعرف بعد؟", "You’re welcome! What else would you like to know?"));
  if (/تغير.*لغه|انجليزي|english|change language/.test(q) && !/دور|course/.test(q)) return result(t("غيّر لغة الموقع من زر EN / عربي أعلى الصفحة. البوت يتبع اللغة اللي تختارها.", "Use EN / عربي at the top of the page. The bot follows your selected language."));
  if (/داكن|فاتح|dark|light mode/.test(q)) return result(t("زر الشمس أو القمر أعلى الصفحة يغيّر النمط، ويحفظ اختيارك على جهازك.", "Use the sun or moon button at the top. Your preference is saved on this device."));
  if (/تحديث|يتحدث|البوت يشتغل|update|how often/.test(q)) return result(t("البوت مجدول لفحص المصادر كل نصف ساعة وقد يتأخر التشغيل. شوف وقت آخر فحص وحالة كل جهة في قسم المصادر. الفرص المنتهية تختفي من النتائج.", "Source checks are scheduled every 30 minutes and can be delayed. See Sources for each organizer’s last check and status. Expired opportunities are hidden."));
  if (/من انت|شنو مرصاد|ما هو مرصاد|ذكاء اصطناعي|who are you|are you ai|what is mirsad/.test(q)) return result(t("أنا بوت مرصاد، أبحث في بيانات الدورات وأجاوب عن استخدام الموقع بقواعد جاهزة، بدون خدمة AI. ما عندي إجابات موثوقة لكل الأسئلة العامة.", "I’m Mirsad Bot: a rule-based course finder and site guide, with no AI service. I don’t have reliable answers to every general question."));
  if (/استرجاع|استرداد|الغاء|refund|cancel/.test(q)) return result(t("التسجيل والدفع والإلغاء عند الجهة المنظمة. راجع سياسة الاسترجاع في موقعها وتواصل معها؛ مرصاد ما يستقبل دفعات أو يغيّر التسجيلات.", "Registration, payments and cancellations are handled by the organizer. Check their refund policy and contact them; Mirsad does not take payments or change bookings."));
  if (/شهاده|معتمد|certificate|accredit/.test(q)) return result(t("ما أقدر أؤكد شهادة أو اعتماد إلا إذا ذكرته الجهة رسميًا. افتح تفاصيل الدورة ثم المصدر الرسمي وتحقق من نوع الشهادة وشروط الحصول عليها.", "A certificate or accreditation is only confirmed by the organizer. Open the course details and official source to check the certificate and its requirements."));
  if (/مقاعد|مضمون|قبول|seats|acceptance|guarantee/.test(q)) return result(t("عرض الدورة أو وجود رابط التسجيل ما يضمن مقعد أو قبول. توفر المقاعد وشروط القبول تتأكد منها في صفحة التسجيل الرسمية.", "A course listing or application link does not guarantee a seat or acceptance. Check availability and admission requirements on the official registration page."));
  if (/كيف.*سجل|شلون.*سجل|طريقه التسجيل|how.*register|how.*apply/.test(q)) return result(t("افتح بطاقة الدورة، ثم اضغط «موقع الجهة للتسجيل». يكمل التسجيل في الموقع الرسمي للجهة. ما تحتاج حساب في مرصاد لتصفح الدورات.", "Open a course card, then choose Official registration. Complete your application on the organizer’s website. You don’t need a Mirsad account to browse."));
  if (/مصادر|الجهات|من وين|sources|organizers/.test(q)) return result(t("نتابع مواقع CODED وKFAS وKGBC وKISR ومركز صباح الأحمد وجهات جامعة الكويت. قسم المصادر يوضح حالة الفحص؛ وجود جهة ما يعني أن عندها تسجيل مفتوح حاليًا.", "We monitor official sites for CODED, KFAS, KGBC, KISR, SACGC and Kuwait University providers. Sources shows check status; an organizer may have no current registration."));

  const age = q.match(/(?:عمري|عمره|عمرها|عمر|age|aged|i am|im)\s*(\d{1,3})\b/) ?? q.match(/\b(\d{1,3})\s*(?:سنه|سنوات|years?)/);
  if (age) context.age = Number(age[1]);
  const organizers: [RegExp, string][] = [[/kfas|كفاس|التقدم العلمي/, "KFAS"], [/coded|كودد/, "CODED"], [/kgbc|المباني الخضراء/, "KGBC"], [/kisr|الابحاث العلميه/, "KISR"], [/sacgc|صباح الاحمد/, "SACGC"], [/جامعه الكويت|kuwait university/, "جامعة الكويت"]];
  const fields: [RegExp, string][] = [[/تقني|برمج|روبوت|ذكاء|technology|coding|robot|\bai\b|programming/, "التقنية والذكاء الاصطناعي"], [/هندس|طاقه|engineer|energy/, "الهندسة والطاقة"], [/صحه|اسعاف|سلامه|health|safety/, "الصحة والسلامة"], [/فن|تصميم|ابداع|design|\bart\b/, "الفنون والإبداع"], [/مهار|ادار|اعمال|skill|business|management/, "الأعمال والمهارات"]];
  const org = organizers.find(([pattern]) => pattern.test(q));
  const field = fields.find(([pattern]) => pattern.test(q));
  if (org) context.organizer = org[1];
  if (field) context.field = field[1];
  if (/ورشه|ورش|workshop/.test(q)) context.kind = "workshop";
  else if (/معسكر|bootcamp/.test(q)) context.kind = "camp";
  else if (!reset && /دوره|دورات|course/.test(q)) context.kind = "course";
  if (/اونلاين|عن بعد|online|remote/.test(q)) context.mode = "online";
  if (/حضوري|in person/.test(q)) context.mode = "in_person";
  if (/مجاني|بلاش|free/.test(q)) context.free = true;
  const detail = /سعر|رسوم|بكم|جم |price|cost|fee|مكان|وين|where|location|متي|موعد|تاريخ|when|date|deadline|عمر|age|وصف|تفاصيل|about|details|سجل|register|apply/.test(q);
  const explicit = catalog.filter(item => [item.title, item.titleEn].some(title => title && normalize(title).length > 4 && q.includes(normalize(title))));
  const followup = detail && !age && !org && !field && !/ورشه|دوره|دورات|workshop|course|مجاني|free/.test(q) && previous.ids?.length;
  let rows = explicit.length ? explicit : followup ? catalog.filter(item => previous.ids?.includes(item.id)) : catalog.filter(item =>
    (!context.organizer || item.organizer.includes(context.organizer)) && (!context.field || item.category === context.field)
    && (!context.kind || item.kind === context.kind) && (!context.mode || item.mode === context.mode)
    && (!context.free || item.priceKwd === 0)
    && (context.age === undefined || ((item.minAge !== null || item.maxAge !== null) && (item.minAge === null || context.age >= item.minAge) && (item.maxAge === null || context.age <= item.maxAge))));
  // Unknown subjects must not silently turn into an unfiltered course list.
  if (!explicit.length && !followup && !org && !field && !detail && !reset) {
    const stop = new Set(normalize("ابي ابغي اريد وابي عندكم عندك هل في فيه عن لي من لو سمحت ابحث اقترح رشح ورشة ورش دورة دورات معسكر فرص مجانية مجاني متاح متاحة حضوري اونلاين بعد كلها شنو ايش دوراتكم course courses workshop workshops bootcamp find show me a an the any available free online remote in person please want i to").split(" "));
    const terms = q.split(" ").filter(word => word.length > 2 && !stop.has(word) && !/^\d+$/.test(word));
    if (terms.length) rows = rows.filter(item => { const haystack = normalize([item.title, item.titleEn, item.description, item.subcategory, ...(item.tags ?? [])].join(" ")); return terms.every(term => haystack.includes(term)); });
  }
  if (!available) return result(t("بيانات الدورات غير متاحة حاليًا. جرّب تحديث الصفحة، أو اسألني عن التسجيل وطريقة استخدام الموقع.", "Course data is currently unavailable. Refresh the page, or ask about registration and how to use the site."));
  const known = explicit.length || followup || age || org || field || /دور|ورش|معسكر|فرص|اقترح|رشح|ابحث|عندكم|متاح|course|workshop|bootcamp|find|recommend|available|free|مجاني|حضوري|online|كل الفرص/.test(q);
  if (!known) return result(detail ? t("أي دورة تقصد؟ اكتب اسمها كما يظهر في الدليل، أو اطلب دورات في مجال معين أولًا.", "Which course do you mean? Enter its title from the directory, or search a field first.") : t("ما عندي جواب موثوق لهذا السؤال. أقدر أساعدك بالدورات والعمر والرسوم والمواعيد والتسجيل واستخدام مرصاد. اكتب مثلًا: ورش مجانية، دورات KISR، أو شلون أسجل؟", "I don’t have a reliable answer to that question. I can help with courses, ages, fees, dates, registration and Mirsad. Try: free workshops, KISR courses, or how do I register?"));
  rows = rows.slice(0, 5);
  context.ids = rows.map(item => item.id);
  if (!rows.length) return result(t("ما لقيت فرص مطابقة في الدليل الحالي. جرّب «كل الفرص» لبدء بحث جديد. إذا حددت عمرًا، نستبعد الدورات اللي ما أعلنت أعمارها؛ هذا ما يعني عدم وجود دورات لدى الجهات.", "No matching opportunities in the current directory. Try “all courses” to reset. Age searches exclude unpublished age ranges; this does not mean organizers have no courses."));
  const unknown = t("غير معلن من الجهة", "Not announced by the organizer");
  const descriptions = rows.map(item => {
    const title = language === "en" ? item.titleEn || item.title : item.title;
    const facts: string[] = [];
    if (/سعر|رسوم|بكم|جم |price|cost|fee|مجاني|free/.test(q)) facts.push(t("الرسوم: ", "Fees: ") + (item.priceKwd === null ? unknown : item.priceKwd === 0 ? t("مجاني", "Free") : `${item.priceKwd} KWD`));
    if (/مكان|وين|where|location/.test(q)) facts.push(t("المكان: ", "Location: ") + item.location);
    if (/متي|موعد|تاريخ|when|date|deadline/.test(q)) facts.push(t("الموعد: ", "Schedule: ") + item.schedule, t("إغلاق التسجيل: ", "Registration closes: ") + (item.registrationEndsAt ? new Date(item.registrationEndsAt).toLocaleString(language === "ar" ? "ar-KW" : "en-KW", { timeZone: "Asia/Kuwait" }) : unknown));
    if (/عمر|age/.test(q)) facts.push(t("العمر: ", "Age: ") + (item.minAge === null && item.maxAge === null ? unknown : `${item.minAge ?? "…"}–${item.maxAge ?? "…"}`));
    if (/وصف|تفاصيل|about|details/.test(q)) facts.push(item.description);
    return title + (facts.length ? "\n" + facts.join("\n") : " — " + item.organizer);
  });
  return result(descriptions.join("\n\n") + "\n\n" + t("اضغط بطاقة الدورة للتفاصيل والتسجيل الرسمي. تقدر تسأل بعدها: بكم؟ وين؟ متى؟", "Open a course card for details and official registration. You can follow up with: how much, where, or when?"), rows);
}
