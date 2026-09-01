"use client";

import { useEffect, useMemo, useState } from "react";
import {
  directoryRecords,
  materials,
  moduleCatalog,
  roadmap,
  sectors,
  sourceRegistry,
  type LocaleText,
} from "../data/catalog";

type Language = "ar" | "en";
type View = "home" | "construction" | "water" | "roads" | "dashboard" | "admin";

const copy = {
  ar: {
    nav: ["الرئيسية", "الإنشاءات", "المياه", "الطرق والبنية التحتية", "مشروعي"],
    heroTag: "KUWAIT CIVIL ENGINEERING HUB · منصة هندسية متكاملة",
    heroTitle: "كل ما تحتاجه للهندسة المدنية في الكويت —",
    heroAccent: "في مكان واحد.",
    heroLead: "ابحث عن الخبرة، قارن المواد، احسب مشروعك، واتخذ قرارًا أوضح بأدوات هندسية وذكاء اصطناعي متخصص.",
    explore: "استكشف المنصة",
    askAi: "اسأل Civil AI",
    search: "ابحث عن مادة، مهندس، حاسبة أو خدمة…",
    connected: "جاهز للمساعدة",
    aiPrompt: "صف مشروعك أو ابدأ بسؤال هندسي",
    aiExample: "مثال: أبي أبني بيت مساحة 600 م² في الكويت",
    disclaimer: "المعلومات والحسابات المقدمة تقديرية وتعليمية ولا تعتبر بديلًا عن التصميم أو الاعتماد الهندسي من مهندس مختص ومرخص.",
    sectors: "مسارات متخصصة. منصة واحدة.",
    sectorLead: "تجربة بسيطة لصاحب البيت، ومساحة عمل عميقة للمهندس والمقاول والمورد.",
    open: "فتح القطاع",
    quick: "ابدأ بمهمة",
    engineer: "ابحث عن مهندس",
    compare: "قارن مواد",
    estimate: "قدّر مشروعك",
    tools: "حاسبات هندسية",
    dataTitle: "مؤشر مواد الكويت",
    dataUnavailable: "البيانات غير متاحة",
    sourcePending: "بانتظار ربط مصدر موثوق",
    demo: "بيانات تجريبية — ليست سجلات حقيقية",
    source: "المصدر",
    updated: "آخر تحديث",
    confidence: "الثقة",
    directory: "الدليل الهندسي",
    filters: "التصفية والبحث",
    all: "الكل",
    verified: "موثّق",
    unverified: "غير موثّق",
    profile: "عرض الملف",
    quote: "طلب عرض سعر",
    materialMarket: "سوق المواد والمقارنة",
    specRule: "تظهر المقارنة فقط بين عروض متطابقة في المواصفة والوحدة والجودة.",
    price: "السعر",
    specification: "المواصفة",
    supplier: "المورد",
    delivery: "التوصيل",
    house: "ابني بيتك",
    houseLead: "تقدير أولي مبني فقط على المساحة ومعدلات التكلفة التي تدخلها أنت.",
    builtArea: "مساحة البناء (م²)",
    lowRate: "الحد الأدنى KWD/م²",
    highRate: "الحد الأعلى KWD/م²",
    calculate: "احسب النطاق",
    range: "النطاق التقديري",
    needRates: "أدخل معدلات تكلفة من مصدر موثوق لإظهار النطاق.",
    boq: "مساحة عمل BOQ",
    boqLead: "أضف البنود والكميات والأسعار التي زودك بها المورد؛ لا توجد أسعار ثابتة داخل الواجهة.",
    item: "البند",
    quantity: "الكمية",
    unit: "الوحدة",
    rate: "السعر",
    amount: "القيمة",
    addRow: "أضف بندًا",
    total: "الإجمالي",
    roadmap: "خارطة بناء البيت",
    responsibility: "المسؤول",
    checklist: "قائمة فحص المرحلة",
    calcLab: "مختبر الحاسبات",
    concrete: "حجم الخرسانة",
    rebar: "وزن حديد التسليح",
    length: "الطول (م)",
    width: "العرض (م)",
    depth: "السماكة (م)",
    diameter: "القطر (مم)",
    count: "العدد",
    result: "النتيجة",
    assumptions: "الافتراضات والملاحظات",
    waterHub: "Water Engineering Hub",
    waterLead: "حسابات شفافة مع الصيغة والوحدات والافتراضات، ومراعاة سياق الكويت قبل اعتماد التصميم.",
    headLoss: "فقدان الضغط — Hazen-Williams",
    pumpPower: "قدرة المضخة",
    stormwater: "تصريف الأمطار — Rational Method",
    flow: "التدفق Q (م³/ث)",
    pipeDiameter: "قطر الأنبوب (م)",
    coefficient: "معامل C",
    head: "الرفع H (م)",
    efficiency: "الكفاءة (%)",
    intensity: "شدة المطر (مم/ساعة)",
    areaHa: "المساحة (هكتار)",
    runoff: "معامل الجريان",
    roadsHub: "Kuwait Infrastructure Hub",
    roadsLead: "أدوات أولية للمرور والرصف، وسوق مواد منفصل، ومسار منظم لتوثيق عيوب الطرق.",
    traffic: "توقع حجم الحركة",
    currentAadt: "AADT الحالي",
    growth: "النمو السنوي (%)",
    years: "فترة التصميم (سنة)",
    futureAadt: "AADT المستقبلي",
    reportRoad: "بلّغ عن مشكلة طريق",
    defect: "نوع العيب",
    location: "الموقع / المنطقة",
    severity: "الخطورة",
    photo: "صورة الموقع",
    createReport: "إنشاء مسودة البلاغ",
    reportReady: "تم تجهيز مسودة البلاغ. يلزم تسجيل الدخول لحفظها وإصدار PDF.",
    project: "لوحة المشروع",
    projectLead: "اجمع الميزانية وBOQ والمهام والمستندات والفريق في سجل واحد قابل للتدقيق.",
    budget: "الميزانية",
    spent: "المنصرف",
    remaining: "المتبقي",
    tasks: "المهام",
    documents: "المستندات",
    signIn: "سجّل الدخول لحفظ المشروع",
    admin: "لوحة الإدارة",
    adminLead: "مراجعة المصادر والسجلات والبلاغات والمحتوى وأدوار المستخدمين قبل النشر.",
    sourceHealth: "حالة مصادر البيانات",
    notConnected: "غير متصل",
    reviewQueue: "قائمة المراجعة",
    noProduction: "لا توجد بيانات إنتاجية بعد",
    aiTitle: "Civil AI",
    aiIntro: "اختر التخصص. سأسأل عن البيانات الناقصة قبل أي حساب، ولن أنشئ تقييمات أو أسعارًا.",
    send: "إرسال",
    clear: "مسح",
    close: "إغلاق",
    aiFallback: "وصلني سؤالك. قبل الحساب أحتاج: أبعاد ووحدات واضحة، الموقع، معيار التصميم المطلوب، وأي قيود تشغيلية. ستكون النتيجة تقديرية وتحتاج مراجعة مهندس مرخص.",
    empty: "لا توجد نتائج مطابقة.",
    footer: "CivilKuwait — بنية رقمية للهندسة المدنية في الكويت",
  },
  en: {
    nav: ["Home", "Construction", "Water", "Infrastructure & roads", "My project"],
    heroTag: "KUWAIT CIVIL ENGINEERING HUB · ONE ENGINEERING PLATFORM",
    heroTitle: "Everything you need for civil engineering in Kuwait —",
    heroAccent: "in one place.",
    heroLead: "Find expertise, compare materials, calculate your project, and make clearer decisions with engineering tools and specialist AI.",
    explore: "Explore the platform",
    askAi: "Ask Civil AI",
    search: "Search for a material, engineer, calculator, or service…",
    connected: "Ready to help",
    aiPrompt: "Describe your project or ask an engineering question",
    aiExample: "Example: I want to build a 600 m² house in Kuwait",
    disclaimer: "Information and calculations are estimates for educational use and do not replace design or approval by a qualified, licensed engineer.",
    sectors: "Specialist paths. One platform.",
    sectorLead: "Simple for homeowners; deep enough for engineers, contractors, and suppliers.",
    open: "Open hub",
    quick: "Start a task",
    engineer: "Find an engineer",
    compare: "Compare materials",
    estimate: "Estimate a project",
    tools: "Engineering calculators",
    dataTitle: "Kuwait material index",
    dataUnavailable: "Data unavailable",
    sourcePending: "Awaiting a verified source connection",
    demo: "Demo data — not real records",
    source: "Source",
    updated: "Last updated",
    confidence: "Confidence",
    directory: "Engineering directory",
    filters: "Filter and search",
    all: "All",
    verified: "Verified",
    unverified: "Unverified",
    profile: "View profile",
    quote: "Request a quote",
    materialMarket: "Material market and comparison",
    specRule: "Comparison is enabled only for offers with matching specifications, units, and quality.",
    price: "Price",
    specification: "Specification",
    supplier: "Supplier",
    delivery: "Delivery",
    house: "Build my house",
    houseLead: "A preliminary estimate based only on the area and cost rates you provide.",
    builtArea: "Built area (m²)",
    lowRate: "Low rate KWD/m²",
    highRate: "High rate KWD/m²",
    calculate: "Calculate range",
    range: "Estimated range",
    needRates: "Enter rates from a verified source to calculate a range.",
    boq: "BOQ workspace",
    boqLead: "Add items, quantities, and supplier rates. No prices are hard-coded in the interface.",
    item: "Item",
    quantity: "Quantity",
    unit: "Unit",
    rate: "Rate",
    amount: "Amount",
    addRow: "Add item",
    total: "Total",
    roadmap: "House-building roadmap",
    responsibility: "Responsible",
    checklist: "Stage checklist",
    calcLab: "Calculator lab",
    concrete: "Concrete volume",
    rebar: "Rebar weight",
    length: "Length (m)",
    width: "Width (m)",
    depth: "Depth (m)",
    diameter: "Diameter (mm)",
    count: "Count",
    result: "Result",
    assumptions: "Assumptions and notes",
    waterHub: "Water Engineering Hub",
    waterLead: "Transparent calculations with formulae, units, assumptions, and Kuwait context before design approval.",
    headLoss: "Head loss — Hazen-Williams",
    pumpPower: "Pump power",
    stormwater: "Stormwater — Rational Method",
    flow: "Flow Q (m³/s)",
    pipeDiameter: "Pipe diameter (m)",
    coefficient: "C coefficient",
    head: "Head H (m)",
    efficiency: "Efficiency (%)",
    intensity: "Rainfall intensity (mm/hr)",
    areaHa: "Area (ha)",
    runoff: "Runoff coefficient",
    roadsHub: "Kuwait Infrastructure Hub",
    roadsLead: "Preliminary traffic and pavement tools, a separate road-material market, and structured road-defect reporting.",
    traffic: "Traffic projection",
    currentAadt: "Current AADT",
    growth: "Annual growth (%)",
    years: "Design period (years)",
    futureAadt: "Future AADT",
    reportRoad: "Report a road problem",
    defect: "Defect type",
    location: "Location / area",
    severity: "Severity",
    photo: "Site photo",
    createReport: "Create report draft",
    reportReady: "Report draft is ready. Sign in to save it and issue a PDF.",
    project: "Project dashboard",
    projectLead: "Keep budget, BOQ, tasks, documents, and the project team in one auditable record.",
    budget: "Budget",
    spent: "Spent",
    remaining: "Remaining",
    tasks: "Tasks",
    documents: "Documents",
    signIn: "Sign in to save this project",
    admin: "Admin dashboard",
    adminLead: "Review sources, records, reports, content, and roles before publication.",
    sourceHealth: "Data-source health",
    notConnected: "Not connected",
    reviewQueue: "Review queue",
    noProduction: "No production records yet",
    aiTitle: "Civil AI",
    aiIntro: "Choose a discipline. I will ask for missing data before calculating, and will not invent ratings or prices.",
    send: "Send",
    clear: "Clear",
    close: "Close",
    aiFallback: "I received your question. Before calculating, I need clear dimensions and units, location, the required design standard, and operating constraints. The result will remain preliminary and must be reviewed by a licensed engineer.",
    empty: "No matching results.",
    footer: "CivilKuwait — digital infrastructure for civil engineering in Kuwait",
  },
} as const;

const n = (value: string) => Number(value) || 0;
const local = (text: LocaleText, lang: Language) => text[lang];
const formatNumber = (value: number, lang: Language, digits = 2) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-KW" : "en-KW", { maximumFractionDigits: digits }).format(value);

function NumberField({ label, value, onChange, step = "any", min = "0" }: { label: string; value: string; onChange: (value: string) => void; step?: string; min?: string }) {
  return <label className="field"><span>{label}</span><input type="number" value={value} step={step} min={min} onChange={(event) => onChange(event.target.value)} /></label>;
}

function EmptyData({ t }: { t: typeof copy.ar | typeof copy.en }) {
  return <div className="empty-data"><b>—</b><strong>{t.dataUnavailable}</strong><span>{t.sourcePending}</span></div>;
}

export default function CivilApp({ initialView = "home" }: { initialView?: View }) {
  const [lang, setLang] = useState<Language>("ar");
  const [view, setView] = useState<View>(initialView);
  const [query, setQuery] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const t = copy[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const navigate = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main>
      <header className="app-header">
        <button className="brand" type="button" onClick={() => navigate("home")}><b>CK</b><span>CivilKuwait<small>{lang === "ar" ? "منصة الهندسة المدنية في الكويت" : "Kuwait civil engineering hub"}</small></span></button>
        <nav aria-label="Main navigation">
          {(["home", "construction", "water", "roads", "dashboard"] as View[]).map((item, index) => <button className={view === item ? "active" : ""} key={item} type="button" onClick={() => navigate(item)}>{t.nav[index]}</button>)}
        </nav>
        <div className="header-actions"><button className="search-trigger" type="button" onClick={() => document.getElementById("global-search")?.focus()}>⌕</button><button className="language" type="button" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>{lang === "ar" ? "EN" : "ع"}</button><button className="account" type="button" onClick={() => navigate("dashboard")}>◎</button></div>
      </header>

      {view === "home" && <Home lang={lang} t={t} navigate={navigate} query={query} setQuery={setQuery} openAi={() => setAiOpen(true)} />}
      {view === "construction" && <ConstructionHub lang={lang} t={t} query={query} setQuery={setQuery} />}
      {view === "water" && <WaterHub lang={lang} t={t} />}
      {view === "roads" && <RoadsHub lang={lang} t={t} />}
      {view === "dashboard" && <ProjectDashboard lang={lang} t={t} navigate={navigate} />}
      {view === "admin" && <AdminDashboard t={t} />}

      <button className="floating-ai" type="button" onClick={() => setAiOpen(true)}><span>✦</span> Civil AI</button>
      {aiOpen && <AiPanel lang={lang} t={t} close={() => setAiOpen(false)} />}
      <footer><span>{t.footer}</span><button type="button" onClick={() => navigate("admin")}>{t.admin}</button><b>© 2026</b></footer>
    </main>
  );
}

function Home({ lang, t, navigate, query, setQuery, openAi }: { lang: Language; t: typeof copy.ar | typeof copy.en; navigate: (view: View) => void; query: string; setQuery: (value: string) => void; openAi: () => void }) {
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [...materials.map((item) => ({ id: item.id, label: local(item.name, lang), type: t.materialMarket })), ...directoryRecords.map((item) => ({ id: item.id, label: local(item.name, lang), type: t.directory }))].filter((item) => item.label.toLowerCase().includes(q)).slice(0, 5);
  }, [query, lang, t]);

  return <>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">{t.heroTag}</p><h1>{t.heroTitle} <em>{t.heroAccent}</em></h1><p className="hero-lead">{t.heroLead}</p><div className="hero-buttons"><button className="button primary" type="button" onClick={() => document.getElementById("sectors")?.scrollIntoView()}>{t.explore}<span>↙</span></button><button className="button ghost" type="button" onClick={openAi}>✦ {t.askAi}</button></div></div>
      <div className="hero-console"><div className="console-top"><span>✦ CIVIL AI</span><small>● {t.connected}</small></div><p>{t.aiPrompt}</p><button className="sample-prompt" type="button" onClick={openAi}>{t.aiExample}<b>↑</b></button><div className="console-tags"><span>BOQ</span><span>WATER</span><span>ROADS</span><span>MATERIALS</span></div><small>{t.disclaimer}</small></div>
      <div className="hero-grid" aria-hidden="true" />
    </section>
    <section className="search-band"><span>⌕</span><input id="global-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /><kbd>⌘ K</kbd>{results.length > 0 && <div className="search-results">{results.map((result) => <button key={result.id} type="button" onClick={() => navigate(result.type === t.directory ? "construction" : "construction")}><span>{result.label}</span><small>{result.type}</small></button>)}</div>}</section>
    <section className="sector-section" id="sectors"><div className="section-heading"><span>01 — 03</span><h2>{t.sectors}</h2><p>{t.sectorLead}</p></div><div className="sector-grid">{sectors.map((sector) => <button className={`sector-card sector-${sector.id}`} key={sector.id} type="button" onClick={() => navigate(sector.id as View)}><span className="sector-code">{sector.code}</span><div className="sector-symbol" aria-hidden="true">{sector.id === "construction" ? "▥" : sector.id === "water" ? "≈" : "⌁"}</div><small>{local(sector.stats, lang)}</small><h3>{local(sector.title, lang)}</h3><p>{local(sector.description, lang)}</p><b>{t.open} ↗</b></button>)}</div></section>
    <section className="task-section"><div className="section-heading compact"><span>04</span><h2>{t.quick}</h2></div><div className="task-grid"><button type="button" onClick={() => navigate("construction")}><i>01</i><b>{t.engineer}</b><span>↗</span></button><button type="button" onClick={() => navigate("construction")}><i>02</i><b>{t.compare}</b><span>↗</span></button><button type="button" onClick={() => navigate("construction")}><i>03</i><b>{t.estimate}</b><span>↗</span></button><button type="button" onClick={() => navigate("water")}><i>04</i><b>{t.tools}</b><span>↗</span></button></div></section>
    <section className="index-section"><div><p className="eyebrow">LIVE DATA LAYER</p><h2>{t.dataTitle}</h2><p>{t.specRule}</p><div className="data-meta"><span>{t.source}: —</span><span>{t.updated}: —</span><span>{t.confidence}: {t.dataUnavailable}</span></div></div><EmptyData t={t} /></section>
    <section className="safety-banner"><b>!</b><p>{t.disclaimer}</p></section>
  </>;
}

function HubIntro({ eyebrow, title, lead, modules, lang }: { eyebrow: string; title: string; lead: string; modules: readonly (readonly string[])[]; lang: Language }) {
  return <section className="hub-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{lead}</p><div className="module-strip">{modules.map((module, index) => <span key={module[0]}><i>{String(index + 1).padStart(2, "0")}</i>{module[lang === "ar" ? 1 : 2]}</span>)}</div></section>;
}

function ConstructionHub({ lang, t, query, setQuery }: { lang: Language; t: typeof copy.ar | typeof copy.en; query: string; setQuery: (value: string) => void }) {
  const [kind, setKind] = useState("all");
  const [area, setArea] = useState("500");
  const [lowRate, setLowRate] = useState("");
  const [highRate, setHighRate] = useState("");
  const [estimate, setEstimate] = useState<[number, number] | null>(null);
  const [boqRows, setBoqRows] = useState([{ id: 1, item: "", qty: "", unit: "m³", rate: "" }]);
  const [roadmapStep, setRoadmapStep] = useState("01");
  const [length, setLength] = useState("6"); const [width, setWidth] = useState("4"); const [depth, setDepth] = useState("0.2");
  const [barDiameter, setBarDiameter] = useState("12"); const [barLength, setBarLength] = useState("12"); const [barCount, setBarCount] = useState("10");
  const filteredDirectory = directoryRecords.filter((record) => (kind === "all" || record.kind === kind) && local(record.name, lang).toLowerCase().includes(query.toLowerCase()));
  const total = boqRows.reduce((sum, row) => sum + n(row.qty) * n(row.rate), 0);
  const patchRow = (id: number, key: string, value: string) => setBoqRows((rows) => rows.map((row) => row.id === id ? { ...row, [key]: value } : row));

  return <>
    <HubIntro eyebrow="CONSTRUCTION HUB" title={lang === "ar" ? "من التخطيط إلى الاستلام." : "From planning to handover."} lead={lang === "ar" ? "أدلة قابلة للتحقق، سوق مواد قائم على المواصفات، ومساحات عمل للحساب والتوثيق." : "Verifiable directories, specification-led material data, and workspaces for calculation and documentation."} modules={moduleCatalog.construction} lang={lang} />
    <section className="workspace-section"><div className="workspace-title"><span>01</span><div><h2>{t.directory}</h2><p>{t.demo}</p></div></div><div className="filter-bar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.filters} /><select value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">{t.all}</option><option value="engineer">Engineers</option><option value="contractor">Contractors</option><option value="supplier">Suppliers</option><option value="lab">Labs</option></select></div><div className="directory-grid">{filteredDirectory.map((record) => <article className="profile-card" key={record.id}><div className="avatar">{record.kind.slice(0, 1).toUpperCase()}</div><span className={`badge ${record.verification}`}>{record.verification === "verified" ? t.verified : t.unverified}</span><small>{local(record.specialty, lang)}</small><h3>{local(record.name, lang)}</h3><p>⌖ {local(record.area, lang)}</p><dl><div><dt>{t.source}</dt><dd>{record.source ?? "—"}</dd></div><div><dt>{t.updated}</dt><dd>{record.updatedAt ?? "—"}</dd></div></dl><div className="card-actions"><button type="button">{t.profile}</button><button type="button" disabled>{t.quote}</button></div></article>)}{filteredDirectory.length === 0 && <p>{t.empty}</p>}</div></section>
    <section className="workspace-section dark"><div className="workspace-title"><span>02</span><div><h2>{t.materialMarket}</h2><p>{t.specRule}</p></div></div><div className="material-table" role="table"><div className="table-head" role="row"><span>{t.item}</span><span>{t.specification}</span><span>{t.supplier}</span><span>{t.price}</span><span>{t.source}</span></div>{materials.filter((item) => item.category === "construction").map((item) => <div className="table-row" role="row" key={item.id}><strong>{local(item.name, lang)}</strong><span>{item.specification}</span><span>{item.supplier ?? t.dataUnavailable}</span><span>{item.price === null ? "— KWD" : `${item.price} KWD/${item.unit}`}</span><span><i className="status-dot" /> {t.sourcePending}</span></div>)}</div><div className="chart-empty"><div className="chart-lines"><i/><i/><i/><i/></div><EmptyData t={t} /></div></section>
    <section className="workspace-split"><article className="tool-card"><span className="tool-number">03</span><h2>{t.house}</h2><p>{t.houseLead}</p><div className="form-grid"><NumberField label={t.builtArea} value={area} onChange={setArea} /><NumberField label={t.lowRate} value={lowRate} onChange={setLowRate} /><NumberField label={t.highRate} value={highRate} onChange={setHighRate} /></div><button className="button primary" type="button" onClick={() => setEstimate(n(lowRate) > 0 && n(highRate) >= n(lowRate) ? [n(area) * n(lowRate), n(area) * n(highRate)] : null)}>{t.calculate}</button><div className="tool-result"><small>{t.range}</small>{estimate ? <b>{formatNumber(estimate[0], lang, 0)} – {formatNumber(estimate[1], lang, 0)} KWD</b> : <span>{t.needRates}</span>}<p>{t.disclaimer}</p></div></article>
      <article className="tool-card"><span className="tool-number">04</span><h2>{t.calcLab}</h2><div className="mini-calc"><h3>{t.concrete}</h3><div className="form-grid three"><NumberField label={t.length} value={length} onChange={setLength}/><NumberField label={t.width} value={width} onChange={setWidth}/><NumberField label={t.depth} value={depth} onChange={setDepth}/></div><output><span>{t.result}</span><b>{formatNumber(n(length) * n(width) * n(depth), lang)} m³</b></output><small>V = L × W × D · {t.assumptions}: {lang === "ar" ? "أبعاد صافية دون هدر" : "net dimensions, no waste allowance"}</small></div><div className="mini-calc"><h3>{t.rebar}</h3><div className="form-grid three"><NumberField label={t.diameter} value={barDiameter} onChange={setBarDiameter}/><NumberField label={t.length} value={barLength} onChange={setBarLength}/><NumberField label={t.count} value={barCount} onChange={setBarCount}/></div><output><span>{t.result}</span><b>{formatNumber((n(barDiameter) ** 2 / 162) * n(barLength) * n(barCount), lang)} kg</b></output><small>W = d²/162 × L × N · {lang === "ar" ? "وزن نظري، دون تراكب أو هدر" : "theoretical weight, excluding laps and waste"}</small></div></article></section>
    <section className="workspace-section"><div className="workspace-title"><span>05</span><div><h2>{t.boq}</h2><p>{t.boqLead}</p></div></div><div className="boq-table"><div className="boq-row head"><span>{t.item}</span><span>{t.quantity}</span><span>{t.unit}</span><span>{t.rate}</span><span>{t.amount}</span></div>{boqRows.map((row) => <div className="boq-row" key={row.id}><input value={row.item} onChange={(event) => patchRow(row.id, "item", event.target.value)} placeholder={t.item}/><input type="number" min="0" value={row.qty} onChange={(event) => patchRow(row.id, "qty", event.target.value)}/><select value={row.unit} onChange={(event) => patchRow(row.id, "unit", event.target.value)}><option>m³</option><option>m²</option><option>m</option><option>kg</option><option>ton</option><option>unit</option></select><input type="number" min="0" value={row.rate} onChange={(event) => patchRow(row.id, "rate", event.target.value)}/><output>{formatNumber(n(row.qty) * n(row.rate), lang)} KWD</output></div>)}</div><div className="boq-footer"><button type="button" onClick={() => setBoqRows((rows) => [...rows, { id: Date.now(), item: "", qty: "", unit: "m³", rate: "" }])}>＋ {t.addRow}</button><b>{t.total}: {formatNumber(total, lang)} KWD</b></div></section>
    <section className="roadmap-section"><div className="workspace-title"><span>06</span><div><h2>{t.roadmap}</h2><p>{lang === "ar" ? "مسار إرشادي؛ المتطلبات والمدد تُربط لاحقًا بالمصادر الرسمية." : "Guidance flow; requirements and durations will be linked to official sources."}</p></div></div><div className="roadmap"><div>{roadmap.map((step) => <button className={roadmapStep === step[0] ? "active" : ""} type="button" key={step[0]} onClick={() => setRoadmapStep(step[0])}><span>{step[0]}</span><b>{step[lang === "ar" ? 1 : 2]}</b></button>)}</div>{roadmap.filter((step) => step[0] === roadmapStep).map((step) => <article key={step[0]}><span>{step[0]}</span><h3>{step[lang === "ar" ? 1 : 2]}</h3><dl><div><dt>{t.responsibility}</dt><dd>{step[lang === "ar" ? 3 : 4]}</dd></div><div><dt>{t.source}</dt><dd>{t.sourcePending}</dd></div></dl><h4>{t.checklist}</h4>{[lang === "ar" ? "تحقق من نطاق العمل" : "Verify scope", lang === "ar" ? "راجع المستندات المطلوبة" : "Review required documents", lang === "ar" ? "وثّق الموافقات والفحوصات" : "Document approvals and inspections"].map((item) => <label key={item}><input type="checkbox"/> {item}</label>)}</article>)}</div></section>
  </>;
}

function WaterHub({ lang, t }: { lang: Language; t: typeof copy.ar | typeof copy.en }) {
  const [flow, setFlow] = useState("0.02"); const [length, setLength] = useState("120"); const [diameter, setDiameter] = useState("0.15"); const [c, setC] = useState("130");
  const [head, setHead] = useState("25"); const [eff, setEff] = useState("70");
  const [intensity, setIntensity] = useState("50"); const [area, setArea] = useState("1"); const [runoff, setRunoff] = useState("0.7");
  const loss = n(c) && n(diameter) ? 10.67 * n(length) * n(flow) ** 1.852 / (n(c) ** 1.852 * n(diameter) ** 4.87) : 0;
  const power = n(eff) ? 1000 * 9.81 * n(flow) * n(head) / (n(eff) / 100) / 1000 : 0;
  const storm = 0.00278 * n(runoff) * n(intensity) * n(area);
  return <><HubIntro eyebrow="WATER ENGINEERING · KUWAIT CONTEXT" title={t.waterHub} lead={t.waterLead} modules={moduleCatalog.water} lang={lang}/><section className="context-strip">{["HIGH TEMPERATURE", "WATER SCARCITY", "DESALINATION", "FLASH FLOODING", "COASTAL CONDITIONS"].map((item) => <span key={item}>{item}</span>)}</section><section className="calculator-grid">
    <article className="engineering-calc"><span>01</span><h2>{t.headLoss}</h2><div className="form-grid"><NumberField label={t.flow} value={flow} onChange={setFlow}/><NumberField label={t.length} value={length} onChange={setLength}/><NumberField label={t.pipeDiameter} value={diameter} onChange={setDiameter}/><NumberField label={t.coefficient} value={c} onChange={setC}/></div><output><small>{t.result}</small><b>{formatNumber(loss, lang, 3)} m</b></output><div className="formula">hᶠ = 10.67 L Q¹·⁸⁵² / (C¹·⁸⁵² d⁴·⁸⁷)</div><p>{t.assumptions}: {lang === "ar" ? "ماء، جريان ممتلئ مستقر، وحدات SI، ومعامل C يختاره المستخدم حسب حالة الأنبوب." : "water, steady full flow, SI units, and user-selected C for the pipe condition."}</p></article>
    <article className="engineering-calc"><span>02</span><h2>{t.pumpPower}</h2><div className="form-grid"><NumberField label={t.flow} value={flow} onChange={setFlow}/><NumberField label={t.head} value={head} onChange={setHead}/><NumberField label={t.efficiency} value={eff} onChange={setEff}/></div><output><small>{t.result}</small><b>{formatNumber(power, lang, 2)} kW</b></output><div className="formula">P = ρ g Q H / η</div><p>{t.assumptions}: ρ = 1000 kg/m³, g = 9.81 m/s². {lang === "ar" ? "لا تشمل النتيجة هامش المحرك أو ظروف التشغيل المتغيرة." : "Motor margin and varying operating conditions are excluded."}</p></article>
    <article className="engineering-calc"><span>03</span><h2>{t.stormwater}</h2><div className="form-grid"><NumberField label={t.intensity} value={intensity} onChange={setIntensity}/><NumberField label={t.areaHa} value={area} onChange={setArea}/><NumberField label={t.runoff} value={runoff} onChange={setRunoff}/></div><output><small>{t.result}</small><b>{formatNumber(storm, lang, 3)} m³/s</b></output><div className="formula">Q = 0.00278 C i A</div><p>{t.assumptions}: {lang === "ar" ? "حوض صغير ومتجانس، وزمن العاصفة يساوي زمن التركيز. استخدم منحنيات IDF المعتمدة للموقع." : "small homogeneous catchment and storm duration equal to time of concentration. Use approved local IDF data."}</p></article>
  </section><section className="network-canvas"><div><p className="eyebrow">WATER NETWORK DESIGN</p><h2>{lang === "ar" ? "مساحة شبكة أولية" : "Preliminary network canvas"}</h2><p>{lang === "ar" ? "أضف العقد والأنابيب والخزانات والمضخات، ثم اربط النموذج بمحرك هيدروليكي معتمد قبل استخدامه في مشروع." : "Add nodes, pipes, tanks, and pumps, then connect the model to a validated hydraulic engine before project use."}</p></div><div className="network-visual"><i className="node n1">N1</i><i className="node n2">N2</i><i className="node n3">N3</i><i className="tank">T1</i><span className="pipe p1"/><span className="pipe p2"/><span className="pipe p3"/></div></section><section className="safety-banner"><b>!</b><p>{t.disclaimer}</p></section></>;
}

function RoadsHub({ lang, t }: { lang: Language; t: typeof copy.ar | typeof copy.en }) {
  const [aadt, setAadt] = useState("12000"); const [growth, setGrowth] = useState("3"); const [years, setYears] = useState("20");
  const [defect, setDefect] = useState("Pothole"); const [location, setLocation] = useState(""); const [severity, setSeverity] = useState("medium"); const [file, setFile] = useState(""); const [ready, setReady] = useState(false);
  const future = n(aadt) * (1 + n(growth) / 100) ** n(years);
  return <><HubIntro eyebrow="INFRASTRUCTURE & ROADS" title={t.roadsHub} lead={t.roadsLead} modules={moduleCatalog.roads} lang={lang}/><section className="workspace-split road-tools"><article className="tool-card"><span className="tool-number">01</span><h2>{t.traffic}</h2><div className="form-grid"><NumberField label={t.currentAadt} value={aadt} onChange={setAadt}/><NumberField label={t.growth} value={growth} onChange={setGrowth}/><NumberField label={t.years} value={years} onChange={setYears}/></div><div className="tool-result"><small>{t.futureAadt}</small><b>{formatNumber(future, lang, 0)} veh/day</b><p>AADTₙ = AADT₀(1+g)ⁿ · {lang === "ar" ? "يفترض معدل نمو ثابتًا؛ لا يحسب ESAL أو توزيع الاتجاه والحارات." : "assumes constant growth; ESAL, directional and lane distribution are excluded."}</p></div></article><article className="tool-card pavement-inputs"><span className="tool-number">02</span><h2>{lang === "ar" ? "مدخلات تصميم الرصف" : "Pavement design inputs"}</h2><p>{lang === "ar" ? "سجّل مدخلاتك قبل الانتقال إلى منهج التصميم المعتمد." : "Capture project inputs before applying the approved design method."}</p><div className="form-grid"><NumberField label="CBR (%)" value="" onChange={() => {}}/><NumberField label="ESAL" value="" onChange={() => {}}/><NumberField label={t.years} value={years} onChange={setYears}/></div><div className="locked-result"><b>DESIGN OUTPUT LOCKED</b><span>{lang === "ar" ? "اختر منهج التصميم واربط المواصفات المعتمدة للمشروع." : "Select a design method and connect project-approved standards."}</span></div></article></section>
    <section className="workspace-section dark"><div className="workspace-title"><span>03</span><div><h2>{lang === "ar" ? "سوق مواد الطرق" : "Road material market"}</h2><p>{t.specRule}</p></div></div><div className="material-table">{materials.filter((item) => item.category === "roads").map((item) => <div className="table-row" key={item.id}><strong>{local(item.name, lang)}</strong><span>{item.specification}</span><span>{t.dataUnavailable}</span><span>— KWD/{item.unit}</span><span><i className="status-dot"/> {t.sourcePending}</span></div>)}</div></section>
    <section className="report-section"><div className="report-copy"><span>04</span><h2>{t.reportRoad}</h2><p>{lang === "ar" ? "وثّق الموقع والصورة ووصف المشكلة. تصنيف الصورة بالذكاء الاصطناعي يبقى اقتراحًا يحتاج مراجعة بشرية." : "Capture location, photo, and description. AI image classification remains a suggestion requiring human review."}</p><div className="defect-list">{["Pothole", "Crack", "Rutting", "Drainage", "Settlement", "Damaged kerb"].map((item) => <span key={item}>{item}</span>)}</div></div><form onSubmit={(event) => { event.preventDefault(); setReady(true); }}><label className="field"><span>{t.defect}</span><select value={defect} onChange={(event) => setDefect(event.target.value)}>{["Pothole", "Crack", "Rutting", "Surface Failure", "Drainage Problem", "Settlement", "Damaged Kerb"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>{t.location}</span><input required value={location} onChange={(event) => setLocation(event.target.value)}/></label><label className="field"><span>{t.severity}</span><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label className="upload"><span>＋</span><b>{file || t.photo}</b><input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0]?.name ?? "")}/></label><button className="button primary" type="submit">{t.createReport}</button>{ready && <p className="success">✓ {t.reportReady}</p>}</form></section><section className="safety-banner"><b>!</b><p>{t.disclaimer}</p></section></>;
}

function ProjectDashboard({ lang, t, navigate }: { lang: Language; t: typeof copy.ar | typeof copy.en; navigate: (view: View) => void }) {
  return <><section className="dashboard-hero"><span>MY PROJECT · DEMO WORKSPACE</span><h1>{t.project}</h1><p>{t.projectLead}</p><a className="button primary" href="/signin-with-chatgpt?return_to=/dashboard">{t.signIn} ↗</a></section><section className="metric-grid"><article><span>{t.budget}</span><b>— KWD</b><small>{t.dataUnavailable}</small></article><article><span>{t.spent}</span><b>— KWD</b><small>{t.dataUnavailable}</small></article><article><span>{t.remaining}</span><b>— KWD</b><small>{t.dataUnavailable}</small></article><article><span>{t.tasks}</span><b>0 / 0</b><small>{lang === "ar" ? "أنشئ مشروعًا للبدء" : "Create a project to start"}</small></article></section><section className="dashboard-grid"><article><h2>BOQ</h2><EmptyData t={t}/><button type="button" onClick={() => navigate("construction")}>＋ {lang === "ar" ? "إنشاء BOQ" : "Create BOQ"}</button></article><article><h2>{t.documents}</h2><EmptyData t={t}/><label className="upload"><span>＋</span><b>{lang === "ar" ? "رفع PDF / Excel / صورة" : "Upload PDF / Excel / image"}</b><input type="file"/></label></article><article><h2>{lang === "ar" ? "الفريق والموردون" : "Team and suppliers"}</h2><EmptyData t={t}/><button type="button" onClick={() => navigate("construction")}>＋ {t.engineer}</button></article></section></>;
}

function AdminDashboard({ t }: { t: typeof copy.ar | typeof copy.en }) {
  return <><section className="dashboard-hero admin-hero"><span>ROLE: ADMIN · PROTECTED AREA</span><h1>{t.admin}</h1><p>{t.adminLead}</p></section><section className="admin-layout"><aside>{["Overview", "Engineers", "Contractors", "Suppliers", "Materials", "Projects", "Road reports", "Reviews", "AI logs", "Sources", "Users & roles"].map((item, index) => <button className={index === 0 ? "active" : ""} type="button" key={item}>{item}</button>)}</aside><div><section className="metric-grid small"><article><span>{t.reviewQueue}</span><b>0</b><small>{t.noProduction}</small></article><article><span>Verified records</span><b>0</b><small>{t.noProduction}</small></article><article><span>Open reports</span><b>0</b><small>{t.noProduction}</small></article></section><article className="source-health"><h2>{t.sourceHealth}</h2>{sourceRegistry.map((source) => <div key={source.id}><span><i className="status-dot"/><b>{source.label}</b><small>{source.coverage}</small></span><em>{t.notConnected}</em><button type="button">Configure</button></div>)}</article></div></section></>;
}

function AiPanel({ lang, t, close }: { lang: Language; t: typeof copy.ar | typeof copy.en; close: () => void }) {
  const [discipline, setDiscipline] = useState("Construction AI"); const [message, setMessage] = useState(""); const [reply, setReply] = useState(""); const [loading, setLoading] = useState(false);
  const send = async () => { if (!message.trim()) return; setLoading(true); try { const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ discipline, message, locale: lang }) }); const payload = await response.json() as { reply?: string }; setReply(payload.reply ?? t.aiFallback); } catch { setReply(t.aiFallback); } finally { setLoading(false); } };
  return <div className="ai-overlay" role="dialog" aria-modal="true"><button className="ai-backdrop" type="button" onClick={close} aria-label={t.close}/><aside className="ai-panel"><header><span>✦</span><div><b>{t.aiTitle}</b><small>{t.connected}</small></div><button type="button" onClick={close}>×</button></header><div className="ai-disciplines">{["Construction AI", "Structural AI", "Water AI", "Roads AI", "Materials AI", "BOQ AI"].map((item) => <button className={discipline === item ? "active" : ""} type="button" key={item} onClick={() => setDiscipline(item)}>{item}</button>)}</div><div className="chat-area"><div className="assistant-message"><b>{discipline}</b><p>{t.aiIntro}</p></div>{message && reply && <><div className="user-message">{message}</div><div className="assistant-message"><b>{discipline}</b><p>{reply}</p><small>{t.disclaimer}</small></div></>}</div><div className="chat-input"><textarea value={message} onChange={(event) => { setMessage(event.target.value); setReply(""); }} placeholder={t.aiExample}/><button type="button" disabled={loading} onClick={send}>{loading ? "…" : "↑"}</button></div><footer><button type="button" onClick={() => { setMessage(""); setReply(""); }}>{t.clear}</button><small>{t.disclaimer}</small></footer></aside></div>;
}
