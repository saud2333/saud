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
};

export const sectors = [
  {
    id: "construction",
    code: "01",
    title: { ar: "الإنشاءات", en: "Construction" },
    description: {
      ar: "المهندسون، المقاولون، سوق المواد، BOQ، ومساعد بناء البيت.",
      en: "Engineers, contractors, material market, BOQ, and house-building guidance.",
    },
    stats: { ar: "8 وحدات عملية", en: "8 working modules" },
  },
  {
    id: "water",
    code: "02",
    title: { ar: "هندسة المياه", en: "Water Engineering" },
    description: {
      ar: "الشبكات، الطلب، الفواقد، المضخات، التصريف والمياه العادمة.",
      en: "Networks, demand, losses, pumps, drainage, and wastewater.",
    },
    stats: { ar: "12 حاسبة هندسية", en: "12 engineering calculators" },
  },
  {
    id: "roads",
    code: "03",
    title: { ar: "البنية التحتية والطرق", en: "Infrastructure & Roads" },
    description: {
      ar: "الرصف، المرور، مواد الطرق، المشاريع وبلاغات العيوب.",
      en: "Pavement, traffic, road materials, projects, and defect reporting.",
    },
    stats: { ar: "6 أدوات متخصصة", en: "6 specialist tools" },
  },
];

export const directoryRecords: DirectoryRecord[] = [
  {
    id: "demo-engineer-01",
    kind: "engineer",
    name: { ar: "ملف مهندس تجريبي 01", en: "Demo engineer profile 01" },
    specialty: { ar: "إنشائي", en: "Structural" },
    area: { ar: "جميع المحافظات", en: "All governorates" },
    verification: "unverified",
    experienceYears: null,
    source: null,
    updatedAt: null,
    demo: true,
  },
  {
    id: "demo-contractor-01",
    kind: "contractor",
    name: { ar: "ملف مقاول تجريبي 01", en: "Demo contractor profile 01" },
    specialty: { ar: "سكني", en: "Residential" },
    area: { ar: "جميع المحافظات", en: "All governorates" },
    verification: "pending",
    experienceYears: null,
    source: null,
    updatedAt: null,
    demo: true,
  },
  {
    id: "demo-supplier-01",
    kind: "supplier",
    name: { ar: "ملف مورد تجريبي 01", en: "Demo supplier profile 01" },
    specialty: { ar: "مواد إنشائية", en: "Construction materials" },
    area: { ar: "الكويت", en: "Kuwait" },
    verification: "unverified",
    experienceYears: null,
    source: null,
    updatedAt: null,
    demo: true,
  },
];

const materialNames: Array<[string, string, string, MaterialRecord["category"], string]> = [
  ["rebar-y12", "حديد تسليح Y12", "Rebar Y12", "construction", "ASTM / BS — specify grade"],
  ["cement-opc", "أسمنت عادي OPC", "OPC Cement", "construction", "Specify standard and class"],
  ["ready-mix", "خرسانة جاهزة", "Ready-mix concrete", "construction", "Specify strength and exposure class"],
  ["water-pipe", "أنبوب مياه", "Water pipe", "water", "Specify material, pressure class and diameter"],
  ["asphalt", "خلطة أسفلتية", "Asphalt mix", "roads", "Specify mix design and binder grade"],
  ["geotextile", "جيوتكستايل", "Geotextile", "roads", "Specify tensile strength and permeability"],
];

export const materials: MaterialRecord[] = materialNames.map(([id, ar, en, category, specification]) => ({
  id,
  name: { ar, en },
  category,
  specification,
  unit: category === "water" ? "m" : category === "construction" && id !== "rebar-y12" ? "unit" : "ton",
  price: null,
  currency: "KWD",
  supplier: null,
  delivery: null,
  quality: null,
  source: null,
  updatedAt: null,
  confidence: "unavailable",
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

export const moduleCatalog = {
  construction: [
    ["engineers", "دليل المهندسين", "Engineer directory"],
    ["contractors", "دليل المقاولين", "Contractor directory"],
    ["materials", "سوق مواد البناء", "Material marketplace"],
    ["boq", "أداة BOQ", "BOQ workspace"],
    ["house", "ابني بيتك", "Build my house"],
    ["roadmap", "خارطة البناء", "Building roadmap"],
    ["calculators", "حاسبات الإنشاءات", "Construction calculators"],
    ["checklists", "قوائم الفحص", "Inspection checklists"],
  ],
  water: [
    ["pipe", "تدفق الأنابيب", "Pipe flow"],
    ["hazen", "Hazen-Williams", "Hazen-Williams"],
    ["darcy", "Darcy-Weisbach", "Darcy-Weisbach"],
    ["pump", "الرفع وقدرة المضخة", "Pump head & power"],
    ["tank", "حجم الخزان", "Tank volume"],
    ["demand", "الطلب والذروة", "Demand & peak flow"],
    ["storm", "تصريف الأمطار", "Stormwater runoff"],
    ["sewer", "تحجيم الصرف", "Sewer sizing"],
  ],
  roads: [
    ["traffic", "توقع الحركة", "Traffic projection"],
    ["pavement", "مدخلات تصميم الرصف", "Pavement design inputs"],
    ["market", "سوق مواد الطرق", "Road material market"],
    ["projects", "قاعدة المشاريع", "Project database"],
    ["report", "بلاغ عيب طريق", "Report a road defect"],
    ["checklists", "قوائم فحص الطرق", "Road checklists"],
  ],
} as const;

export const sourceRegistry = [
  { id: "kuwait-official", label: "Kuwait official sources", status: "not_connected", coverage: "Projects / permits" },
  { id: "supplier-feeds", label: "Verified supplier feeds", status: "not_connected", coverage: "Prices / availability" },
  { id: "directory-import", label: "Approved directory import", status: "not_connected", coverage: "Engineers / contractors / labs" },
];
