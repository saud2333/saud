export type LocaleText = { ar: string; en: string };

export type DirectoryRecord = {
  id: string;
  kind: "engineer" | "contractor" | "supplier" | "lab";
  name: LocaleText;
  specialty: LocaleText;
  area: LocaleText;
  verification: "verified" | "unverified" | "pending";
  experienceYears: number | null;
  source: string | null;
  updatedAt: string | null;
  demo: boolean;
  avatarPosition?: string;
  services?: LocaleText[];
  projects?: LocaleText;
};

export type MaterialRecord = {
  id: string;
  name: LocaleText;
  category: "construction" | "water" | "roads";
  specification: string;
  unit: string;
  price: number | null;
  currency: "KWD";
  supplier: string | null;
  delivery: number | null;
  quality: string | null;
  source: string | null;
  updatedAt: string | null;
  confidence: "unavailable" | "low" | "medium" | "high";
  supplierIds: string[];
};

export type SupplierRecord = {
  id: string;
  name: LocaleText;
  products: LocaleText[];
  phone: string;
  phoneLabel?: LocaleText;
  location: LocaleText;
  website: string;
  source: string;
  qualityNote: LocaleText;
  lastChecked: string;
};

export const sectors = [
  {
    id: "construction",
    code: "01",
    title: { ar: "الإنشاءات", en: "Construction" },
    description: { ar: "المهندسون، المقاولون، سوق المواد، BOQ، ومساعد بناء البيت.", en: "Engineers, contractors, material market, BOQ, and house-building guidance." },
    stats: { ar: "8 وحدات عملية", en: "8 working modules" },
  },
  {
    id: "water",
    code: "02",
    title: { ar: "هندسة المياه", en: "Water Engineering" },
    description: { ar: "الشبكات، الطلب، الفواقد، المضخات، التصريف والمياه العادمة.", en: "Networks, demand, losses, pumps, drainage, and wastewater." },
    stats: { ar: "12 حاسبة هندسية", en: "12 engineering calculators" },
  },
  {
    id: "roads",
    code: "03",
    title: { ar: "البنية التحتية والطرق", en: "Infrastructure & Roads" },
    description: { ar: "الرصف، المرور، مواد الطرق، المشاريع وبلاغات العيوب.", en: "Pavement, traffic, road materials, projects, and defect reporting." },
    stats: { ar: "6 أدوات متخصصة", en: "6 specialist tools" },
  },
];

const engineer = (
  id: string,
  ar: string,
  en: string,
  specialtyAr: string,
  specialtyEn: string,
  areaAr: string,
  areaEn: string,
  experienceYears: number,
  avatarPosition: string,
  services: Array<[string, string]>,
): DirectoryRecord => ({
  id,
  kind: "engineer",
  name: { ar: `${ar} — اسم تجريبي`, en: `${en} — fictional name` },
  specialty: { ar: specialtyAr, en: specialtyEn },
  area: { ar: areaAr, en: areaEn },
  verification: "unverified",
  experienceYears,
  source: null,
  updatedAt: null,
  demo: true,
  avatarPosition,
  services: services.map(([serviceAr, serviceEn]) => ({ ar: serviceAr, en: serviceEn })),
  projects: { ar: "لا توجد مشاريع موثقة — ملف توضيحي", en: "No verified projects — illustrative profile" },
});

export const directoryRecords: DirectoryRecord[] = [
  engineer("demo-engineer-01", "م. سالم الركائز", "Eng. Salem Al-Rakaez", "إنشائي", "Structural", "العاصمة وحولي", "Capital & Hawalli", 9, "0% 0%", [["مراجعة مخططات", "Drawing review"], ["فحص هيكل", "Structural inspection"]]),
  engineer("demo-engineer-02", "م. نورة البناء", "Eng. Noura Al-Binaa", "إدارة مشاريع", "Project management", "جميع المحافظات", "All governorates", 7, "50% 0%", [["إدارة مشروع", "Project management"], ["خطة تنفيذ", "Delivery planning"]]),
  engineer("demo-engineer-03", "م. بدر الاستدامة", "Eng. Bader Sustainability", "مدني / مواقع", "Civil / Site", "الأحمدي ومبارك الكبير", "Ahmadi & Mubarak Al-Kabeer", 11, "100% 0%", [["إشراف موقع", "Site supervision"], ["قوائم فحص", "Inspection checklists"]]),
  engineer("demo-engineer-04", "م. ريم المنشآت", "Eng. Reem Structures", "معماري / تنسيق", "Architectural coordination", "العاصمة والفروانية", "Capital & Farwaniya", 6, "0% 100%", [["تنسيق المخططات", "Drawing coordination"], ["واجهات مستدامة", "Sustainable façades"]]),
  engineer("demo-engineer-05", "م. فهد المياه", "Eng. Fahad Water", "مياه وصرف", "Water & drainage", "جميع المحافظات", "All governorates", 10, "50% 100%", [["شبكات مياه", "Water networks"], ["تصريف أمطار", "Stormwater"]]),
  engineer("demo-engineer-06", "م. ليان المسار", "Eng. Layan Mobility", "طرق وبنية تحتية", "Roads & infrastructure", "الجهراء والأحمدي", "Jahra & Ahmadi", 8, "100% 100%", [["فحص طرق", "Road inspection"], ["BOQ بنية تحتية", "Infrastructure BOQ"]]),
  {
    id: "demo-contractor-01", kind: "contractor",
    name: { ar: "ركائز الديرة للمقاولات — اسم تجريبي", en: "Rakaez Al-Deera Contracting — fictional" },
    specialty: { ar: "مقاولات سكنية وهيكل أسود", en: "Residential & structural shell" },
    area: { ar: "جميع المحافظات", en: "All governorates" }, verification: "pending", experienceYears: 12,
    source: null, updatedAt: null, demo: true, projects: { ar: "لا توجد مشاريع موثقة", en: "No verified projects" },
    services: [{ ar: "هيكل أسود", en: "Structural shell" }, { ar: "إدارة مقاولين باطن", en: "Subcontractor coordination" }],
  },
  {
    id: "demo-contractor-02", kind: "contractor",
    name: { ar: "مسار أخضر للإنشاءات — اسم تجريبي", en: "Green Path Construction — fictional" },
    specialty: { ar: "تشطيبات وعزل", en: "Finishing & insulation" },
    area: { ar: "العاصمة وحولي", en: "Capital & Hawalli" }, verification: "unverified", experienceYears: 8,
    source: null, updatedAt: null, demo: true, projects: { ar: "لا توجد مشاريع موثقة", en: "No verified projects" },
    services: [{ ar: "تشطيبات", en: "Finishing" }, { ar: "عزل حراري ومائي", en: "Thermal & waterproofing" }],
  },
  {
    id: "demo-contractor-03", kind: "contractor",
    name: { ar: "بنية الخليج للمشاريع — اسم تجريبي", en: "Gulf Infra Projects — fictional" },
    specialty: { ar: "طرق وبنية تحتية", en: "Roads & infrastructure" },
    area: { ar: "الجهراء والأحمدي", en: "Jahra & Ahmadi" }, verification: "pending", experienceYears: 14,
    source: null, updatedAt: null, demo: true, projects: { ar: "لا توجد مشاريع موثقة", en: "No verified projects" },
    services: [{ ar: "أعمال طرق", en: "Road works" }, { ar: "شبكات خدمات", en: "Utility networks" }],
  },
];

export const verifiedSuppliers: SupplierRecord[] = [
  {
    id: "kwtsteel",
    name: { ar: "كويت ستيل", en: "KUWAIT STEEL" },
    products: [{ ar: "حديد تسليح", en: "Rebar" }, { ar: "مربعات الصلب", en: "Billet" }],
    phone: "+96523200000",
    location: { ar: "الكويت — راجع الموقع الرسمي للتفاصيل", en: "Kuwait — see official site for details" },
    website: "https://www.kwtsteel.com/contact",
    source: "https://www.kwtsteel.com/product",
    qualityNote: { ar: "المورد يعلن مطابقة الحديد للمعايير المحلية والدولية؛ تحقّق من الشهادة والدرجة لكل توريد.", en: "Supplier states conformity with local and international standards; verify certificate and grade per delivery." },
    lastChecked: "2026-09-01",
  },
  {
    id: "kuwaitcement",
    name: { ar: "شركة أسمنت الكويت", en: "Kuwait Cement Company" },
    products: [{ ar: "أسمنت", en: "Cement" }],
    phone: "+96522401700",
    location: { ar: "بيت الأسمنت، شرق، شارع الشهداء", en: "Cement House, Sharq, Al-Shuhada St." },
    website: "https://kuwaitcement.com/contact/?lang=en",
    source: "https://kuwaitcement.com/contact/?lang=en",
    qualityNote: { ar: "بيانات الاتصال من الموقع الرسمي؛ اطلب شهادة المنتج والمواصفة مع عرض السعر.", en: "Contact details from the official site; request product certificate and specification with the quote." },
    lastChecked: "2026-09-01",
  },
  {
    id: "acico",
    name: { ar: "أسيكو المجموعة", en: "ACICO Group" },
    products: [{ ar: "طابوق أبيض", en: "AAC blocks" }, { ar: "أسمنت", en: "Cement" }, { ar: "خرسانة جاهزة", en: "Ready mix" }, { ar: "إنترلوك", en: "Interlock" }],
    phone: "+9651888811",
    phoneLabel: { ar: "الرقم الرئيسي — أرقام البيع المباشر في المصدر", en: "Main line — direct sales numbers in source" },
    location: { ar: "مصانع في ميناء عبدالله والصليبية", en: "Factories in Mina Abdullah and Sulaibiya" },
    website: "https://acicogroup.com/ar/direct-sales/",
    source: "https://acicogroup.com/ar/direct-sales/",
    qualityNote: { ar: "المورد يعلن اختبار المواد الخام باستمرار؛ اطلب تقرير الاختبار وشهادة المطابقة.", en: "Supplier states continuous raw-material testing; request test report and conformity certificate." },
    lastChecked: "2026-09-01",
  },
  {
    id: "portlandkw",
    name: { ar: "أسمنت بورتلاند كويت", en: "Kuwait Portland Cement" },
    products: [{ ar: "أسمنت", en: "Cement" }, { ar: "خرسانة جاهزة", en: "Ready mix" }, { ar: "رمل وحصى", en: "Sand & aggregate" }],
    phone: "+9651884455",
    location: { ar: "الشويخ الصناعية", en: "Shuwaikh Industrial" },
    website: "https://portlandkw.co/en/",
    source: "https://portlandkw.co/en/",
    qualityNote: { ar: "الموقع الرسمي يعرّف خطوط المنتجات؛ اطلب المواصفة والشهادة والتوفر قبل المقارنة.", en: "Official site lists product lines; request specification, certificate, and availability before comparison." },
    lastChecked: "2026-09-01",
  },
  {
    id: "ahliachemicals",
    name: { ar: "الشركة الأهلية للكيماويات", en: "Ahlia Chemicals" },
    products: [{ ar: "عزل مائي وحراري", en: "Waterproofing & insulation" }, { ar: "كيماويات بناء", en: "Construction chemicals" }],
    phone: "+96524716761",
    phoneLabel: { ar: "مكتب المبيعات", en: "Sales office" },
    location: { ar: "شمال صبحان الصناعية", en: "North Subhan Industrial Area" },
    website: "https://www.ahliachemicals.com/Supply%26Apply.html",
    source: "https://www.ahliachemicals.com/Supply%26Apply.html",
    qualityNote: { ar: "الموقع الرسمي ينشر ISO 9001 و14001 و45001؛ تحقّق من صلاحية الشهادة ونطاقها.", en: "Official site publishes ISO 9001, 14001 and 45001; verify certificate validity and scope." },
    lastChecked: "2026-09-01",
  },
  {
    id: "bitugulf",
    name: { ar: "بيتوجلف للعوازل", en: "BITUGULF" },
    products: [{ ar: "لفائف عزل مائي", en: "Waterproofing membranes" }],
    phone: "+96590019846",
    phoneLabel: { ar: "المبيعات", en: "Sales" },
    location: { ar: "الشعيبة الصناعية الغربية — معرض في الشويخ", en: "Western Shuaiba Industrial — showroom in Shuwaikh" },
    website: "https://bitugulf.net/contact-us/",
    source: "https://bitugulf.net/contact-us/",
    qualityNote: { ar: "تحقّق من السماكة والتسليح واعتماد النظام الكامل قبل المقارنة.", en: "Verify membrane thickness, reinforcement, and full-system approval before comparison." },
    lastChecked: "2026-09-01",
  },
  {
    id: "wara",
    name: { ar: "ورا لمواد البناء", en: "Wara Building Materials" },
    products: [{ ar: "مواد بناء وتشطيبات", en: "Building & finishing materials" }, { ar: "عزل ومواد لاصقة", en: "Insulation & adhesives" }],
    phone: "+96541080400",
    phoneLabel: { ar: "هاتف وواتساب", en: "Phone & WhatsApp" },
    location: { ar: "الشويخ الصناعية 2، قطعة 1، شارع 23", en: "Shuwaikh Industrial 2, Block 1, Street 23" },
    website: "https://www.warawork.com/",
    source: "https://www.warawork.com/",
    qualityNote: { ar: "مورد متعدد العلامات؛ اطلب اسم المصنع والمواصفة والضمان لكل منتج.", en: "Multi-brand supplier; request manufacturer, specification, and warranty for each product." },
    lastChecked: "2026-09-01",
  },
  {
    id: "mpi",
    name: { ar: "صناعات الأنابيب المعدنية", en: "Metal Pipes Industries" },
    products: [{ ar: "أنابيب معدنية", en: "Metal pipes" }],
    phone: "+9651833380",
    location: { ar: "الصليبية الصناعية، قطعة 1، طريق 4", en: "Industrial Sulaibiya, Block 1, Road 4" },
    website: "https://mpi.com.kw/contact/",
    source: "https://mpi.com.kw/contact/",
    qualityNote: { ar: "تحقّق من القطر والسماكة والطلاء وفئة الضغط وشهادة المصنع.", en: "Verify diameter, wall thickness, coating, pressure class, and mill certificate." },
    lastChecked: "2026-09-01",
  },
];

const materialNames: Array<[string, string, string, MaterialRecord["category"], string, string, string[]]> = [
  ["rebar-y12", "حديد تسليح Y12", "Rebar Y12", "construction", "Grade + standard + mill certificate", "ton", ["kwtsteel"]],
  ["cement-opc", "أسمنت عادي OPC", "OPC Cement", "construction", "Standard + strength class + production date", "bag / ton", ["kuwaitcement", "acico", "portlandkw"]],
  ["ready-mix", "خرسانة جاهزة", "Ready-mix concrete", "construction", "Strength + exposure class + slump + SCM content", "m³", ["acico", "portlandkw"]],
  ["aac-block", "طابوق خرساني خلوي", "AAC block", "construction", "Dimensions + density + thermal conductivity", "m³ / unit", ["acico"]],
  ["sand", "رمل مغسول", "Washed sand", "construction", "Grading + fines + chloride/sulfate limits", "m³ / ton", ["portlandkw"]],
  ["aggregate", "ركام", "Aggregate", "construction", "Size + grading + abrasion + absorption", "ton", ["portlandkw"]],
  ["brc-mesh", "شبك حديد BRC", "BRC mesh", "construction", "Wire diameter + spacing + steel grade", "sheet / ton", []],
  ["waterproofing", "عزل مائي", "Waterproofing", "construction", "System type + thickness + reinforcement + warranty", "m² / roll", ["ahliachemicals", "bitugulf", "wara"]],
  ["insulation", "عزل حراري", "Thermal insulation", "construction", "Material + density + thermal resistance + fire class", "m² / board", ["ahliachemicals", "wara"]],
  ["tiles", "بلاط وتشطيبات", "Tiles & finishes", "construction", "Dimensions + absorption + slip class + batch", "m²", ["wara"]],
  ["pipes", "أنابيب معدنية", "Metal pipes", "construction", "Diameter + wall thickness + coating + pressure class", "m", ["mpi"]],
  ["additives", "إضافات خرسانة", "Concrete additives", "construction", "Product type + dosage + compatibility + standard", "L / kg", ["ahliachemicals", "wara"]],
  ["water-pipe", "أنبوب مياه", "Water pipe", "water", "Material + pressure class + diameter", "m", ["mpi"]],
  ["asphalt", "خلطة أسفلتية", "Asphalt mix", "roads", "Mix design + binder grade + aggregate source", "ton", []],
  ["geotextile", "جيوتكستايل", "Geotextile", "roads", "Tensile strength + permeability + durability", "m²", []],
];

export const materials: MaterialRecord[] = materialNames.map(([id, ar, en, category, specification, unit, supplierIds]) => ({
  id, name: { ar, en }, category, specification, unit, supplierIds,
  price: null, currency: "KWD", supplier: null, delivery: null, quality: null, source: null, updatedAt: null, confidence: "unavailable",
}));

export const roadmap = [
  ["01", "شراء الأرض", "Land purchase", "المالك", "Owner"],
  ["02", "اختيار المهندس", "Select engineer", "المالك", "Owner"],
  ["03", "التصميم والتراخيص", "Design & permits", "المكتب الهندسي", "Engineering office"],
  ["04", "دراسة التربة وBOQ", "Soil study & BOQ", "المختبر / حاسب الكميات", "Lab / QS"],
  ["05", "اختيار المقاول والتعاقد", "Contractor & contract", "المالك / الاستشاري", "Owner / consultant"],
  ["06", "الحفر والأساسات", "Excavation & foundations", "المقاول / الاستشاري", "Contractor / consultant"],
  ["07", "الهيكل والأعمال MEP", "Structure & MEP", "فريق المشروع", "Project team"],
  ["08", "العزل والتشطيبات", "Waterproofing & finishing", "المقاول / الموردون", "Contractor / suppliers"],
  ["09", "الاختبارات والاستلام", "Testing & handover", "الاستشاري / المالك", "Consultant / owner"],
];

export const roadmapDetails: Record<string, { duration: LocaleText; documents: LocaleText[]; mistakes: LocaleText[]; checks: LocaleText[] }> = {
  "01": {
    duration: { ar: "تختلف حسب التحقق والتمويل", en: "Varies with due diligence and finance" },
    documents: [{ ar: "وثيقة الملكية والمخطط المساحي", en: "Title deed and survey plan" }],
    mistakes: [{ ar: "الشراء قبل التحقق من الاشتراطات والارتدادات", en: "Buying before checking planning constraints and setbacks" }],
    checks: [{ ar: "حدود الأرض والخدمات والمناسيب", en: "Boundaries, utilities, and levels" }],
  },
  "02": {
    duration: { ar: "قارن النطاق والخبرة قبل التعاقد", en: "Compare scope and experience before appointment" },
    documents: [{ ar: "نطاق خدمات واضح وعقد ومخرجات", en: "Clear scope, contract, and deliverables" }],
    mistakes: [{ ar: "اختيار السعر فقط دون مراجعة نطاق العمل", en: "Selecting on price without reviewing scope" }],
    checks: [{ ar: "الترخيص، التأمين، المسؤوليات، وعدد الزيارات", en: "License, insurance, responsibilities, and site visits" }],
  },
  "03": {
    duration: { ar: "يعتمد على تعقيد التصميم ومسار الموافقات", en: "Depends on design complexity and approval route" },
    documents: [{ ar: "مخططات معمارية وإنشائية وMEP وجداول", en: "Architectural, structural, MEP drawings and schedules" }],
    mistakes: [{ ar: "بدء التنفيذ قبل تنسيق جميع التخصصات", en: "Starting work before multidisciplinary coordination" }],
    checks: [{ ar: "تعارضات المخططات وكفاءة الطاقة وسهولة الصيانة", en: "Clashes, energy performance, and maintainability" }],
  },
  "04": {
    duration: { ar: "قبل التسعير والتعاقد النهائي", en: "Before final pricing and contract" },
    documents: [{ ar: "تقرير تربة وBOQ ومواصفات", en: "Soil report, BOQ, and specifications" }],
    mistakes: [{ ar: "كميات غير مترابطة مع آخر إصدار للمخططات", en: "Quantities not tied to the latest drawings" }],
    checks: [{ ar: "الإصدار والوحدات والبنود المفقودة والاحتياطيات", en: "Revision, units, omissions, and allowances" }],
  },
  "05": {
    duration: { ar: "لا تتعجل؛ راجع العروض على نطاق موحد", en: "Do not rush; normalize bid scope" },
    documents: [{ ar: "عقد، برنامج، دفعات، ضمانات، وتغييرات", en: "Contract, programme, payments, warranties, and variations" }],
    mistakes: [{ ar: "مقارنة الإجمالي دون توحيد الاستثناءات", en: "Comparing totals without normalizing exclusions" }],
    checks: [{ ar: "السجل، الفريق، المعدات، والمشاريع المرجعية", en: "Record, team, equipment, and reference projects" }],
  },
  "06": {
    duration: { ar: "حسب التربة وحجم المبنى", en: "Depends on soil and building scale" },
    documents: [{ ar: "تصريح بدء، مخطط توقيع، وطلبات فحص", en: "Start permit, setting-out plan, and inspection requests" }],
    mistakes: [{ ar: "صب قبل اعتماد التسليح والمناسيب والعزل", en: "Pouring before rebar, levels, and waterproofing approval" }],
    checks: [{ ar: "الحفر، الدمك، المحاور، الغطاء، والمواسير المدفونة", en: "Excavation, compaction, axes, cover, and buried services" }],
  },
  "07": {
    duration: { ar: "حسب النظام الإنشائي والتوريد", en: "Depends on structural system and procurement" },
    documents: [{ ar: "Shop drawings واعتمادات المواد وسجلات الصب", en: "Shop drawings, material approvals, and pour records" }],
    mistakes: [{ ar: "فتح خدمات بعد الصب دون تنسيق", en: "Cutting service openings after pours without coordination" }],
    checks: [{ ar: "الشدة والتسليح والفتحات والاختبارات والمعالجة", en: "Formwork, rebar, openings, tests, and curing" }],
  },
  "08": {
    duration: { ar: "حسب مستوى التشطيب وتتابع المقاولين", en: "Depends on finish level and trade sequencing" },
    documents: [{ ar: "عينات واعتمادات وضمانات وأنظمة عزل", en: "Samples, approvals, warranties, and waterproofing systems" }],
    mistakes: [{ ar: "إخفاء الأعمال قبل الاختبار والتوثيق", en: "Concealing work before testing and documentation" }],
    checks: [{ ar: "الميول، اختبار الغمر، الجسور الحرارية، والتشطيبات", en: "Falls, flood test, thermal bridges, and finishes" }],
  },
  "09": {
    duration: { ar: "حسب نتائج الاختبارات وإغلاق الملاحظات", en: "Depends on tests and closeout" },
    documents: [{ ar: "As-built، كتيبات، ضمانات، وشهادات اختبار", en: "As-built drawings, manuals, warranties, and test certificates" }],
    mistakes: [{ ar: "الاستلام دون قائمة نواقص وخطة إغلاق", en: "Handover without a snag list and closeout plan" }],
    checks: [{ ar: "التشغيل، التسريب، السلامة، العدادات، والمفاتيح", en: "Commissioning, leaks, safety, meters, and keys" }],
  },
};

export const inspectionChecklists = [
  { id: "foundation", title: { ar: "فحص الأساسات", en: "Foundation inspection" }, items: [{ ar: "المحاور والمناسيب", en: "Axes and levels" }, { ar: "تقرير التربة وقاع الحفر", en: "Soil report and formation" }, { ar: "التسليح والغطاء والتراكب", en: "Rebar, cover, and laps" }, { ar: "العزل والخدمات المدفونة", en: "Waterproofing and buried services" }] },
  { id: "rebar", title: { ar: "فحص التسليح", en: "Rebar inspection" }, items: [{ ar: "القطر والعدد والتباعد", en: "Diameter, count, and spacing" }, { ar: "التراكبات والمرابط", en: "Laps and anchorage" }, { ar: "الكراسي والبسكوت والغطاء", en: "Chairs, spacers, and cover" }, { ar: "نظافة الحديد قبل الصب", en: "Clean rebar before pour" }] },
  { id: "formwork", title: { ar: "فحص الشدة", en: "Formwork inspection" }, items: [{ ar: "الأبعاد والمناسيب والاستقامة", en: "Dimensions, levels, and alignment" }, { ar: "الدعامات والربط", en: "Props and ties" }, { ar: "الإحكام ومادة الفك", en: "Tightness and release agent" }, { ar: "الفتحات والـ embeds", en: "Openings and embeds" }] },
  { id: "concrete", title: { ar: "فحص صب الخرسانة", en: "Concrete pour inspection" }, items: [{ ar: "اعتماد الخلطة ووقت الوصول", en: "Mix approval and arrival time" }, { ar: "الهبوط والعينات", en: "Slump and samples" }, { ar: "الهزاز وخطة الصب", en: "Vibration and pour plan" }, { ar: "المعالجة والحماية", en: "Curing and protection" }] },
  { id: "blockwork", title: { ar: "فحص المباني", en: "Blockwork inspection" }, items: [{ ar: "النوع والكثافة والمقاس", en: "Type, density, and size" }, { ar: "التربيط والاستقامة", en: "Bond and alignment" }, { ar: "العتبات والربط", en: "Lintels and ties" }, { ar: "الفتحات والخدمات", en: "Openings and services" }] },
  { id: "waterproofing", title: { ar: "فحص العزل المائي", en: "Waterproofing inspection" }, items: [{ ar: "اعتماد النظام والسطح", en: "System approval and substrate" }, { ar: "التراكبات والتفاصيل", en: "Laps and details" }, { ar: "اختبار الغمر", en: "Flood test" }, { ar: "طبقة الحماية والضمان", en: "Protection and warranty" }] },
  { id: "finishing", title: { ar: "فحص التشطيبات", en: "Finishing inspection" }, items: [{ ar: "العينة المعتمدة", en: "Approved sample" }, { ar: "الألوان والدفعات", en: "Colours and batches" }, { ar: "الاستقامة والفواصل", en: "Alignment and joints" }, { ar: "الحماية والتنظيف", en: "Protection and cleaning" }] },
];

export const moduleCatalog = {
  construction: [
    ["directory", "دليل المهندسين والمقاولين", "Engineers & contractors"],
    ["materials", "سوق مواد البناء", "Material marketplace"],
    ["house", "ابني بيتك", "Build my house"],
    ["calculators", "حاسبات الإنشاءات", "Construction calculators"],
    ["boq", "أداة BOQ", "BOQ workspace"],
    ["roadmap", "خارطة البناء", "Building roadmap"],
    ["checklists", "قوائم الفحص", "Inspection checklists"],
    ["suppliers", "الموردون الموثقون بالمصدر", "Source-verified suppliers"],
  ],
  water: [
    ["pipe", "تدفق الأنابيب", "Pipe flow"], ["hazen", "Hazen-Williams", "Hazen-Williams"],
    ["darcy", "Darcy-Weisbach", "Darcy-Weisbach"], ["pump", "الرفع وقدرة المضخة", "Pump head & power"],
    ["tank", "حجم الخزان", "Tank volume"], ["demand", "الطلب والذروة", "Demand & peak flow"],
    ["storm", "تصريف الأمطار", "Stormwater runoff"], ["sewer", "تحجيم الصرف", "Sewer sizing"],
  ],
  roads: [
    ["traffic", "توقع الحركة", "Traffic projection"], ["pavement", "مدخلات تصميم الرصف", "Pavement design inputs"],
    ["market", "سوق مواد الطرق", "Road material market"], ["projects", "قاعدة المشاريع", "Project database"],
    ["report", "بلاغ عيب طريق", "Report a road defect"], ["checklists", "قوائم فحص الطرق", "Road checklists"],
  ],
} as const;

export const sourceRegistry = [
  { id: "supplier-official", label: "Official supplier websites", status: "connected_readonly", coverage: "Contacts / products / published quality notes" },
  { id: "kuwait-official", label: "Kuwait official projects and permits", status: "not_connected", coverage: "Projects / permits" },
  { id: "price-feeds", label: "Verified live price feeds", status: "not_connected", coverage: "Prices / availability / delivery" },
  { id: "directory-import", label: "Professional directory verification", status: "not_connected", coverage: "Engineers / contractors / labs" },
];
