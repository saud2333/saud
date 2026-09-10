import type { LearningOpportunity, OpportunityKind, OpportunityMode, OpportunityStatus } from "../data/opportunities";

export type SiteLanguage = "ar" | "en";

export const uiCopy = {
  ar: {
    brand: "مرصاد", brandSubtitle: "فرص التعلّم في الكويت", homeAria: "مِرصاد — الصفحة الرئيسية",
    featuredNav: "الأبرز", catalogNav: "كل الفرص", sourcesNav: "المصادر", mainNav: "التنقل الرئيسي",
    languageLabel: "EN", languageAria: "Switch to English", darkMode: "تفعيل الوضع الداكن", lightMode: "تفعيل الوضع الفاتح",
    syncLive: "متصل بالدليل", syncConnecting: "فحص التحديثات", syncSetup: "يلزم إكمال الربط", syncAwaiting: "بانتظار تفعيل التحديثات", syncUnavailable: "تعذّر تحديث الدليل",
    kicker: "فرص موثّقة من الجهات الرسمية", heroTitle: "تعلّم مهارات المستقبل", heroAccent: "من فرص الكويت.",
    heroCopy: "الدورات والورش المعلنة رسميًا والمفتوح تسجيلها. ابحث بالعمر أو المجال أو المكان، وسجّل من موقع الجهة الرسمي.",
    searchPlaceholder: "ابحث عن روبوتات، إسعافات، تصميم…", searchAria: "البحث في الدورات والورش", clearSearch: "مسح البحث", search: "ابحث",
    availableNow: "فرصة متاحة الآن", notVerified: "لم يكتمل التحقق من الفرص", fields: "مجالات", automatic: "تلقائي", expiredHidden: "إخفاء التسجيل المنتهي",
    heroImageAlt: "متعلمون في مختبر تقني", guide: "مُرشد مِرصاد", guideQuestion: "شنو يناسبك؟", guideCopy: "اكتب عمرك واهتمامك، وأنا أرتّب لك الفرص المتاحة الآن.", askGuide: "اسأل المرشد",
    learningFields: "مجالات التعلّم", selectedOpportunities: "فرص مختارة", beforeClosing: "قبل إغلاق التسجيل", highlightedNow: "الأبرز الآن", closingSoon: "تسجيلها يغلق قريبًا",
    curatedDescription: "فرص مختارة من الإعلانات الرسمية.", closingDescription: "الفرص المتاحة مرتبة حسب أقرب موعد لإغلاق التسجيل، وليست ترتيبًا للشعبية أو الجودة.", viewDetails: "عرض التفاصيل",
    initialReviewNote: "أُضيفت هذه البرامج بعد مراجعة صفحاتها الرسمية. الجمع والمراجعة الآلية المستمرة لم يُفعّلا بعد؛ تأكد من توفر المقاعد في موقع الجهة قبل التقديم.",
    officialLanguageNote: "نعرض تفاصيل كل دورة باللغة التي نشرتها الجهة عندما لا تتوفر نسخة إنجليزية موثقة.",
    fullDirectory: "الدليل الكامل", coursesAndWorkshops: "الدورات والورش", filters: "الفلاتر", courseFilters: "فلاتر الدورات", filterResults: "فلترة النتائج", clearAll: "مسح الكل",
    fieldAndSpecialty: "المجال والتخصص", field: "المجال", exactSpecialty: "التخصص الدقيق", organizer: "الجهة المنظمة", opportunityType: "نوع الفرصة",
    targetAge: "العمر المستهدف", allAges: "كل الأعمار", years: "سنة", all: "الكل", age: "العمر", enterAge: "اكتب العمر", ageExample: "مثال: 14", quickAges: "أعمار سريعة",
    unknownAgeHidden: "تُخفى الفرص التي لم يعلن منظمها العمر لتفادي التخمين.", attendance: "طريقة الحضور", governorate: "المحافظة",
    expiredAutoHidden: "التسجيل المنتهي يختفي تلقائيًا من النتائج.", show: "عرض", result: "نتيجة", matching: "فرصة مطابقة", activeFilters: "فلاتر مفعّلة",
    sort: "ترتيب", sortFeatured: "الأبرز", sortPrice: "الأقل سعرًا", sortTitle: "أبجديًا", details: "التفاصيل", location: "المكان", duration: "المدة", fees: "الرسوم",
    lastCheck: "آخر فحص", officialRegistration: "موقع الجهة للتسجيل", openOfficialRegistration: "افتح صفحة الدورة في موقع الجهة المنظمة", viewCourse: "عرض",
    emptySetup: "ربط دليل الدورات غير مكتمل", emptyAwaiting: "بانتظار تفعيل جمع الدورات", emptyConnecting: "جارٍ التحقق من الفرص", emptyUnavailable: "تعذّر التحقق من الدورات حاليًا", emptyNoMatches: "لا توجد فرص مؤكدة تطابق البحث حاليًا",
    emptySetupCopy: "قاعدة بيانات الدورات تحتاج إعدادًا. هذا لا يعني عدم وجود دورات لدى الجهات.", emptyAwaitingCopy: "قاعدة البيانات متصلة، لكن جمع الإعلانات ومراجعتها لم يبدأ بعد. لا يمثل هذا العدد الدورات المتاحة لدى الجهات.", emptyUnavailableCopy: "سنحاول الاتصال مجددًا تلقائيًا. لا نعرض بيانات قديمة أو غير مؤكدة أثناء التعذّر.", emptyNoMatchesCopy: "تظهر الإعلانات الرسمية بعد التحقق من المواعيد ورابط التسجيل. غياب العمر أو الرسوم لا يمنع العرض؛ نكتب «غير معلن من الجهة».", clearFilters: "مسح الفلاتر",
    howVerify: "كيف نتحقق؟", sourceFirst: "المعلومة تبدأ من المصدر.", everyHalfHour: "بحث كل نصف ساعة", everyHalfHourCopy: "البوت مجدول لفحص مواقع الجهات وروابط إعلاناتها. قد يتأخر التشغيل عند ازدحام خدمة الجدولة. حسابات Instagram وX لم تُربط بعد.",
    noGuessing: "مراجعة بلا تخمين", noGuessingCopy: "نراجع المعلومات مقابل الإعلان. العمر والرسوم غير المذكورين يظهران بعبارة «غير معلن من الجهة»، ولا نعتبر التسجيل مجانيًا أو مناسبًا لكل الأعمار.",
    registrationOpen: "تسجيل متاح", registrationOpenCopy: "تظهر الفرص ذات المواعيد وروابط التسجيل المؤكدة، وتختفي بعد إغلاق التسجيل أو بدء البرنامج.", primarySources: "المصادر الأساسية", sourceHealth: "حالة فحص الجهات",
    firstCheckPending: "بانتظار أول فحص", staleCheck: "آخر فحص قديم — التحديث يحتاج متابعة", sourceFailed: "تعذّر الوصول إلى المصدر", sourcePartial: "فحص جزئي — بعض الصفحات لم تُفحص", automaticCheckDone: "اكتمل فحص الموقع برمجيًا", reviewedOnAdd: "مراجعة عند الإضافة", noCheckTime: "لا يوجد وقت فحص مسجل",
    sourceNoteOne: "الفحص الحالي برمجي وليس مراجعة ذكاء اصطناعي. تُنشر الإعلانات التي يستطيع البوت استخراج تفاصيلها والتحقق منها؛ الإعلانات المصوّرة فقط أو ناقصة المواعيد تبقى خارج النتائج لحين مراجعتها.",
    sourceNoteTwo: "لا نضيف بطاقات دون إعلان رسمي. غياب العمر أو الرسوم لا يخفي الدورة، لكن تعارض المعلومات أو عدم تأكد التسجيل يوقف نشرها. المراجعة الآلية لا تضمن خلو المصدر من الخطأ؛ راجع الإعلان الرسمي قبل التسجيل.",
    footerTag: "ابحث. قارن. تعلّم.", footerCopy: "دليل مستقل يجمع فرص التعلّم في الكويت ويعيدك دائمًا إلى المصدر الرسمي.", backToTop: "العودة للأعلى ↑", askMirsad: "اسأل مِرصاد",
    assistantAria: "مُرشد مِرصاد", close: "إغلاق", ready: "جاهز للبحث", botIntro: "قل لي عمرك والمجال الذي تحبه، وسأختصر لك الخيارات.", botFound: "وجدت {count} فرص قريبة من طلبك. طبّقت الفلاتر على الدليل أيضًا.", botNoMatch: "ما لقيت تطابقًا دقيقًا الآن. جرّب مجالًا أوسع أو اختر «كل الفرص».",
    quickPrompts: ["عمري 16 وأحب التقنية", "أبي ورشة مهارات", "دورات هندسية حضورية"], botPlaceholder: "مثال: عمري 18 وأحب الروبوتات", send: "إرسال", botDisclaimer: "المرشد يبحث في بيانات الدليل الحالية ولا يضمن توفر المقاعد.",
    detailAria: "تفاصيل", verifiedAt: "آخر تحقق من المصدر", officialBotReview: "فحصه البوت برمجيًا من المصدر الرسمي؛ لم يراجعه ذكاء اصطناعي. ", interactiveReview: "راجعه مساعد الذكاء الاصطناعي عند الإضافة؛ هذه ليست متابعة آلية مستمرة. ", aiReviewed: "راجعه الذكاء الاصطناعي بتاريخ {date}. ", registrationDisclaimer: "زر التسجيل يفتح صفحة التقديم الرسمية لدى الجهة. توفر رابط التقديم لا يضمن المقاعد أو القبول.", openRegistration: "افتح صفحة التسجيل في موقع الجهة ↗", viewSource: "عرض المصدر",
  },
  en: {
    brand: "Mirsad", brandSubtitle: "Learning opportunities in Kuwait", homeAria: "Mirsad — home page",
    featuredNav: "Featured", catalogNav: "All opportunities", sourcesNav: "Sources", mainNav: "Main navigation",
    languageLabel: "عربي", languageAria: "التبديل إلى العربية", darkMode: "Enable dark mode", lightMode: "Enable light mode",
    syncLive: "Directory connected", syncConnecting: "Checking updates", syncSetup: "Connection setup required", syncAwaiting: "Waiting for updates", syncUnavailable: "Directory update failed",
    kicker: "Verified opportunities from official sources", heroTitle: "Build skills for the future", heroAccent: "with opportunities in Kuwait.",
    heroCopy: "Officially announced courses and workshops with registration currently open. Search by age, field or location, then register on the organizer’s official website.",
    searchPlaceholder: "Search robotics, first aid, design…", searchAria: "Search courses and workshops", clearSearch: "Clear search", search: "Search",
    availableNow: "opportunities available now", notVerified: "opportunity verification incomplete", fields: "fields", automatic: "Automatic", expiredHidden: "expired registration removal",
    heroImageAlt: "Learners in a technology lab", guide: "Mirsad Guide", guideQuestion: "What suits you?", guideCopy: "Tell me your age and interests, and I’ll narrow down the opportunities available now.", askGuide: "Ask the guide",
    learningFields: "Learning fields", selectedOpportunities: "Selected opportunities", beforeClosing: "Before registration closes", highlightedNow: "Featured now", closingSoon: "Registration closes soon",
    curatedDescription: "Selected opportunities from official announcements.", closingDescription: "Available opportunities are ordered by the nearest registration deadline, not by popularity or quality.", viewDetails: "View details",
    initialReviewNote: "These programs were added after their official pages were reviewed. Continuous automated collection and review are not active yet; confirm seat availability on the organizer’s website before applying.",
    officialLanguageNote: "Course titles, descriptions and official details remain in the organizer’s published language when no verified English version is available.",
    fullDirectory: "Full directory", coursesAndWorkshops: "Courses and workshops", filters: "Filters", courseFilters: "Course filters", filterResults: "Filter results", clearAll: "Clear all",
    fieldAndSpecialty: "Field and specialization", field: "Field", exactSpecialty: "Specialization", organizer: "Organizer", opportunityType: "Opportunity type",
    targetAge: "Target age", allAges: "All ages", years: "years", all: "All", age: "Age", enterAge: "Enter age", ageExample: "Example: 14", quickAges: "Quick ages",
    unknownAgeHidden: "Opportunities without a published age range are hidden to avoid guessing.", attendance: "Attendance mode", governorate: "Governorate",
    expiredAutoHidden: "Expired registrations disappear from results automatically.", show: "Show", result: "results", matching: "matching opportunities", activeFilters: "active filters",
    sort: "Sort", sortFeatured: "Featured", sortPrice: "Lowest price", sortTitle: "Alphabetical", details: "Details", location: "Location", duration: "Duration", fees: "Fees",
    lastCheck: "Last checked", officialRegistration: "Official registration", openOfficialRegistration: "Open this opportunity on the organizer’s official website", viewCourse: "View",
    emptySetup: "Course directory connection is incomplete", emptyAwaiting: "Waiting for course collection to start", emptyConnecting: "Checking opportunities", emptyUnavailable: "Courses cannot be verified right now", emptyNoMatches: "No verified opportunities match your search right now",
    emptySetupCopy: "The course database needs setup. This does not mean organizers have no courses.", emptyAwaitingCopy: "The database is connected, but announcement collection and review have not started. This count does not represent available courses.", emptyUnavailableCopy: "We will retry automatically. Old or unverified data is not shown while the directory is unavailable.", emptyNoMatchesCopy: "Official announcements appear after dates and registration links are verified. Missing age or fees do not block a course; they are marked as not announced by the organizer.", clearFilters: "Clear filters",
    howVerify: "How do we verify?", sourceFirst: "Every detail starts at the source.", everyHalfHour: "Checked every 30 minutes", everyHalfHourCopy: "The bot is scheduled to check organizer websites and announcement links. GitHub scheduling may occasionally be delayed. Instagram and X accounts are not connected yet.",
    noGuessing: "Review without guessing", noGuessingCopy: "We compare details with the announcement. Unpublished ages and fees are marked as not announced; we never assume a course is free or suitable for all ages.",
    registrationOpen: "Registration available", registrationOpenCopy: "Only opportunities with verified dates and registration links appear, and they disappear after registration closes or the program begins.", primarySources: "Primary sources", sourceHealth: "Source check status",
    firstCheckPending: "Waiting for the first check", staleCheck: "Last check is old — updates need attention", sourceFailed: "Source could not be reached", sourcePartial: "Partial check — some pages were not checked", automaticCheckDone: "Website check completed automatically", reviewedOnAdd: "Reviewed when added", noCheckTime: "No check time recorded",
    sourceNoteOne: "The current verification is programmatic, not an AI review. Announcements are published only when the bot can extract and verify their details; image-only announcements or those missing dates remain outside the results until reviewed.",
    sourceNoteTwo: "We do not create cards without an official announcement. Missing age or fees do not hide a course, but conflicting information or uncertain registration prevents publication. Automated checks cannot guarantee that the source is error-free; review the official announcement before registering.",
    footerTag: "Search. Compare. Learn.", footerCopy: "An independent directory that gathers learning opportunities in Kuwait and always takes you back to the official source.", backToTop: "Back to top ↑", askMirsad: "Ask Mirsad",
    assistantAria: "Mirsad Guide", close: "Close", ready: "Ready to search", botIntro: "Tell me your age and the field you like, and I’ll narrow down the options.", botFound: "I found {count} opportunities close to your request and applied the filters to the directory.", botNoMatch: "I couldn’t find an exact match right now. Try a broader field or choose All opportunities.",
    quickPrompts: ["I’m 16 and interested in technology", "I want a skills workshop", "In-person engineering courses"], botPlaceholder: "Example: I’m 18 and interested in robotics", send: "Send", botDisclaimer: "The guide searches the current directory and cannot guarantee seat availability.",
    detailAria: "Details for", verifiedAt: "Last verified at source", officialBotReview: "Checked programmatically against the official source; not reviewed by AI. ", interactiveReview: "Reviewed by the AI assistant when it was added; this is not continuous automated monitoring. ", aiReviewed: "Reviewed by AI on {date}. ", registrationDisclaimer: "The registration button opens the organizer’s official application page. A working link does not guarantee seats or acceptance.", openRegistration: "Open official registration ↗", viewSource: "View source",
  },
} as const;

const categoryEnglish: Record<string, string> = {
  "الكل": "All",
  "التقنية والذكاء الاصطناعي": "Technology & AI",
  "الهندسة والطاقة": "Engineering & Energy",
  "الأعمال والمهارات": "Business & Skills",
  "الصحة والسلامة": "Health & Safety",
  "الفنون والإبداع": "Arts & Creativity",
};

const categoryBlurbEnglish: Record<string, string> = {
  "التقنية والذكاء الاصطناعي": "Programming, data and robotics",
  "الهندسة والطاقة": "Engineering, sustainability and energy",
  "الأعمال والمهارات": "Career, management and communication",
  "الصحة والسلامة": "Health, first aid and safety",
  "الفنون والإبداع": "Design, art and making",
};

const knownEnglish: Record<string, string> = {
  "مجلس الكويت للمباني الخضراء — KGBC": "Kuwait Green Building Council — KGBC",
  "معهد الكويت للأبحاث العلمية — KISR": "Kuwait Institute for Scientific Research — KISR",
  "مركز صباح الأحمد للموهبة والإبداع — SACGC": "Sabah Al-Ahmad Center for Giftedness and Creativity — SACGC",
  "الكل": "All", "عام": "General", "غير محدد": "Not specified", "الكويت": "Kuwait",
  "تقنية": "Technology", "هندسة": "Engineering", "صحة وسلامة": "Health & safety", "إبداع": "Creativity", "مهارات عامة": "General skills",
  "الذكاء الاصطناعي الوكيلي والأتمتة": "Agentic AI & automation", "الذكاء الاصطناعي وعلوم البيانات": "AI & data science",
  "الأمن السيبراني": "Cybersecurity", "تطوير التطبيقات بالذكاء الاصطناعي": "AI application development",
  "غير معلن من الجهة": "Not announced by the organizer", "يحدده المنظم": "Set by the organizer", "الموعد يحدده المنظم": "Set by the organizer",
  "العاصمة": "Capital", "حولي": "Hawalli", "الفروانية": "Farwaniya", "الأحمدي": "Ahmadi", "الجهراء": "Jahra", "مبارك الكبير": "Mubarak Al-Kabeer",
  "كودد — CODED": "CODED", "مؤسسة الكويت للتقدم العلمي — KFAS": "Kuwait Foundation for the Advancement of Sciences — KFAS",
  "جامعة الكويت — كلية الهندسة والبترول": "Kuwait University — College of Engineering and Petroleum",
  "جامعة الكويت — مركز خدمة المجتمع والتعليم المستمر": "Kuwait University — Center for Community Service and Continuing Education",
  "جامعة الكويت — مركز خدمة المجتمع": "Kuwait University — Center for Community Service",
};

export function categoryLabel(value: string, language: SiteLanguage) {
  return language === "en" ? categoryEnglish[value] ?? knownEnglish[value] ?? value : value;
}

export function categoryBlurb(value: string, fallback: string, language: SiteLanguage) {
  return language === "en" ? categoryBlurbEnglish[value] ?? fallback : fallback;
}

export function localizedText(value: string, language: SiteLanguage) {
  return language === "en" ? knownEnglish[value] ?? value : value;
}

export function opportunityTitle(item: LearningOpportunity, language: SiteLanguage) {
  return language === "en" ? item.titleEn || item.title : item.title;
}

export function ageLabel(item: LearningOpportunity, language: SiteLanguage) {
  if (language === "ar") return item.ageLabel;
  if (item.minAge === null && item.maxAge === null) return "Not announced by the organizer";
  if (item.minAge !== null && item.maxAge !== null) return item.minAge === item.maxAge ? `${item.minAge} years` : `${item.minAge}–${item.maxAge} years`;
  if (item.minAge !== null) return `${item.minAge}+ years`;
  return `Up to ${item.maxAge} years`;
}

export function kindLabel(kind: OpportunityKind, language: SiteLanguage) {
  const labels: Record<SiteLanguage, Record<OpportunityKind, string>> = {
    ar: { course: "دورة", workshop: "ورشة", camp: "معسكر" },
    en: { course: "Course", workshop: "Workshop", camp: "Bootcamp" },
  };
  return labels[language][kind];
}

export function modeLabel(mode: OpportunityMode, language: SiteLanguage) {
  const labels: Record<SiteLanguage, Record<OpportunityMode, string>> = {
    ar: { in_person: "حضوري", online: "عن بُعد", hybrid: "هجين" },
    en: { in_person: "In person", online: "Online", hybrid: "Hybrid" },
  };
  return labels[language][mode];
}

export function statusLabel(status: OpportunityStatus, language: SiteLanguage) {
  const labels: Record<SiteLanguage, Record<OpportunityStatus, string>> = {
    ar: { open: "التقديم متاح لدى الجهة", verify: "تحقّق من التوفر", closed: "التسجيل مغلق" },
    en: { open: "Applications open", verify: "Check availability", closed: "Registration closed" },
  };
  return labels[language][status];
}

export function priceLabel(price: number | null, language: SiteLanguage) {
  if (price === null) return language === "ar" ? "غير معلن من الجهة" : "Not announced by the organizer";
  if (price === 0) return language === "ar" ? "مجاني" : "Free";
  const locale = language === "ar" ? "ar-KW" : "en-KW";
  return language === "ar"
    ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(price)} د.ك`
    : `KWD ${new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(price)}`;
}

export function checkedLabel(date: string, language: SiteLanguage, includeTime = false) {
  const parsed = new Date(date.includes("T") ? date : date + "T12:00:00");
  if (Number.isNaN(parsed.getTime())) return date;
  const locale = language === "ar" ? "ar-KW" : "en-KW";
  return includeTime
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuwait" }).format(parsed)
    : new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

export function aiReviewLabel(item: LearningOpportunity, language: SiteLanguage) {
  if (language === "en") {
    if (item.verificationMethod === "official_source") return "✓ Official source checked";
    if (item.aiReviewStatus === "verified" && item.aiReviewModel === "codex-interactive") return "✓ Reviewed when added";
    if (item.aiReviewStatus === "verified") return "✓ AI reviewed";
    if (item.aiReviewStatus === "pending") return "◷ Awaiting AI review";
    return "✓ Official source";
  }
  if (item.verificationMethod === "official_source") return "✓ فحص المصدر الرسمي";
  if (item.aiReviewStatus === "verified" && item.aiReviewModel === "codex-interactive") return "✓ روجع عند الإضافة";
  if (item.aiReviewStatus === "verified") return "✓ راجعه الذكاء الاصطناعي";
  if (item.aiReviewStatus === "pending") return "◷ بانتظار مراجعة AI";
  return "✓ مصدر رسمي";
}
