"use client";

import { useEffect, useMemo, useState } from "react";
import {
  directoryRecords,
  inspectionChecklists,
  materials,
  roadmap,
  roadmapDetails,
  sectors,
  verifiedSuppliers,
  type DirectoryRecord,
  type LocaleText,
} from "../data/catalog";
import {
  ProjectDashboard,
  RoadsHub,
  WaterHub,
  copy,
  type Language,
  type View,
} from "./CivilApp";
import AiWorkspace from "./AiWorkspace";
import ProfileWorkspace from "./ProfileWorkspace";
import ThemeToggle from "./ThemeToggle";
import { calculatorFunctions, estimateHouseRange } from "../lib/calculator-core.mjs";

type T = typeof copy.ar | typeof copy.en;
type BoqRow = { id: number; item: string; qty: string; unit: string; rate: string };
type Quote = { price: string; delivery: string; specification: string };

const viewPaths: Record<View, string> = {
  home: "/",
  construction: "/construction",
  water: "/water",
  roads: "/infrastructure",
  dashboard: "/dashboard",
  guide: "/guide",
  ai: "/ai",
  profile: "/profile",
  admin: "/admin",
};

const navIcons: Record<View, string> = {
  home: "⌂", construction: "▥", water: "≈", roads: "⌁", dashboard: "◫", guide: "?", ai: "✦", profile: "◎", admin: "⚙",
};

const local = (value: LocaleText, lang: Language) => value[lang];
const numeric = (value: string) => Number(value) || 0;
const number = (value: number, lang: Language, digits = 2) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-KW" : "en-KW", { maximumFractionDigits: digits }).format(value);

function Field({ label, value, onChange, type = "number", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: "number" | "text"; placeholder?: string }) {
  return <label className="field"><span>{label}</span><input type={type} min={type === "number" ? "0" : undefined} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function DataBadge({ lang, type }: { lang: Language; type: "official" | "demo" | "unavailable" }) {
  const label = type === "official"
    ? (lang === "ar" ? "مصدر رسمي" : "Official source")
    : type === "demo"
      ? (lang === "ar" ? "بيانات تجريبية" : "Demo data")
      : (lang === "ar" ? "السعر غير متاح" : "Price unavailable");
  return <span className={`data-badge ${type}`}><i />{label}</span>;
}

export default function CivilAppV2({ initialView = "home" }: { initialView?: View }) {
  const [lang, setLang] = useState<Language>("ar");
  const [view, setView] = useState<View>(initialView);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = copy[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    const onPopState = () => {
      const next = (Object.entries(viewPaths).find(([, path]) => path === window.location.pathname)?.[0] ?? "home") as View;
      setView(next);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("global-search")?.focus();
      }
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("popstate", onPopState); window.removeEventListener("keydown", onKeyDown); };
  }, []);

  const navigate = (next: View, section?: string) => {
    setView(next);
    setMobileOpen(false);
    if (window.location.pathname !== viewPaths[next]) window.history.pushState({}, "", viewPaths[next]);
    if (section) window.setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const primaryViews: View[] = ["home", "construction", "water", "roads", "ai", "guide"];
  const navLabels = lang === "ar" ? ["الرئيسية", "الإنشاءات", "المياه", "الطرق", "Civil AI", "دليل الاستخدام"] : ["Home", "Construction", "Water", "Roads", "Civil AI", "How to use"];
  return <main>
    <header className="app-header v2-header">
      <button className="brand" type="button" onClick={() => navigate("home")}><b>CK</b><span>CivilKuwait<small>{lang === "ar" ? "بناء أذكى · أثر أقل" : "Smarter building · lower impact"}</small></span></button>
      <nav aria-label={lang === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
        {primaryViews.map((item, index) => <button className={view === item ? "active" : ""} key={item} type="button" onClick={() => navigate(item)}><i>{navIcons[item]}</i>{navLabels[index]}</button>)}
      </nav>
      <div className="header-actions">
        <button className="search-trigger" type="button" aria-label={t.search} onClick={() => document.getElementById("global-search")?.focus()}>⌕</button>
        <ThemeToggle label={lang === "ar" ? "تبديل المظهر" : "Toggle theme"} />
        <button className="language" type="button" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>{lang === "ar" ? "EN" : "ع"}</button>
        <button className="profile-trigger" type="button" onClick={() => navigate("profile")} aria-label={lang === "ar" ? "الملف الشخصي" : "Profile"}>◎</button>
        <button className="start-project" type="button" onClick={() => navigate("construction", "house")}>{lang === "ar" ? "ابدأ مشروعك" : "Start project"}</button>
        <button className="menu-toggle" type="button" aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>☰</button>
      </div>
    </header>

    <div className="utility-nav" aria-label={lang === "ar" ? "اختصارات المهام" : "Task shortcuts"}>
      <strong>{lang === "ar" ? "وصول سريع" : "Quick access"}</strong>
      <button type="button" onClick={() => navigate("construction", "directory")}>♙ {lang === "ar" ? "المهندسون والمقاولون" : "Engineers & contractors"}</button>
      <button type="button" onClick={() => navigate("construction", "materials")}>▦ {lang === "ar" ? "أسعار وجودة المواد" : "Material price & quality"}</button>
      <button type="button" onClick={() => navigate("construction", "boq")}>Σ BOQ</button>
      <button type="button" onClick={() => navigate("construction", "calculators")}>⌗ {lang === "ar" ? "الحاسبات" : "Calculators"}</button>
      <button type="button" onClick={() => navigate("construction", "checklists")}>☑ {lang === "ar" ? "قوائم الفحص" : "Checklists"}</button>
      <button type="button" onClick={() => navigate("guide")}>? {lang === "ar" ? "كيف أستخدم الموقع؟" : "How it works"}</button>
    </div>

    {mobileOpen && <div className="mobile-menu-v2"><button className="mobile-backdrop" type="button" onClick={() => setMobileOpen(false)} aria-label="Close" /><aside><header><b>CivilKuwait</b><button type="button" onClick={() => setMobileOpen(false)}>×</button></header>{primaryViews.map((item, index) => <button className={view === item ? "active" : ""} key={item} type="button" onClick={() => navigate(item)}><i>{navIcons[item]}</i><span>{navLabels[index]}</span><b>←</b></button>)}<div><button type="button" onClick={() => navigate("profile")}>{lang === "ar" ? "ملفي" : "My profile"}</button><button type="button" onClick={() => navigate("construction", "materials")}>{lang === "ar" ? "سوق المواد" : "Material market"}</button></div></aside></div>}

    {view === "home" && <HomeV2 lang={lang} t={t} query={query} setQuery={setQuery} navigate={navigate} openAi={() => navigate("ai")} />}
    {view === "construction" && <ConstructionHubV2 lang={lang} t={t} />}
    {view === "water" && <WaterHub lang={lang} t={t} />}
    {view === "roads" && <RoadsHub lang={lang} t={t} />}
    {view === "dashboard" && <ProjectDashboard lang={lang} t={t} navigate={navigate} />}
    {view === "guide" && <GuidePage lang={lang} navigate={navigate} />}
    {view === "ai" && <AiWorkspace lang={lang} />}
    {view === "profile" && <ProfileWorkspace lang={lang} />}

    {view !== "ai" && <button className="floating-ai" type="button" onClick={() => navigate("ai")}><span>✦</span><b>Civil AI</b><small>{lang === "ar" ? "اسأل الآن" : "Ask now"}</small></button>}
    <footer><span>CivilKuwait · {lang === "ar" ? "قرارات أوضح، مواد أفضل، مبانٍ أكثر استدامة" : "Clearer decisions, better materials, more sustainable buildings"}</span><button type="button" onClick={() => navigate("guide")}>{lang === "ar" ? "دليل الموقع" : "Site guide"}</button><button type="button" onClick={() => navigate("profile")}>{lang === "ar" ? "حسابي" : "My account"}</button></footer>
  </main>;
}

function HomeV2({ lang, t, query, setQuery, navigate, openAi }: { lang: Language; t: T; query: string; setQuery: (value: string) => void; navigate: (view: View, section?: string) => void; openAi: () => void }) {
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [
      ...materials.map((item) => ({ id: item.id, label: local(item.name, lang), type: "material", section: "materials" })),
      ...directoryRecords.map((item) => ({ id: item.id, label: local(item.name, lang), type: item.kind, section: "directory" })),
      ...verifiedSuppliers.map((item) => ({ id: item.id, label: local(item.name, lang), type: "supplier", section: "suppliers" })),
    ].filter((item) => item.label.toLowerCase().includes(q)).slice(0, 7);
  }, [query, lang]);

  return <>
    <section className="hero sustainability-hero">
      <div className="hero-photo" aria-hidden="true" />
      <div className="hero-copy">
        <div className="sustainability-pill">● {lang === "ar" ? "هندسة مستدامة للكويت" : "Sustainable engineering for Kuwait"}</div>
        <p className="eyebrow">{t.heroTag}</p>
        <h1>{t.heroTitle} <em>{t.heroAccent}</em></h1>
        <p className="hero-lead">{lang === "ar" ? "خطّط منزلك، اختر المختص، قارن السعر مع المواصفة والجودة، ووثّق التنفيذ خطوة بخطوة." : "Plan your home, choose a specialist, compare price with specification and quality, and document every construction step."}</p>
        <div className="hero-buttons"><button className="button primary green" type="button" onClick={() => navigate("construction", "house")}>{lang === "ar" ? "ابدأ بناء بيتك" : "Start building your home"} <span>←</span></button><button className="button glass" type="button" onClick={() => navigate("guide")}>▶ {lang === "ar" ? "شاهد دليل الموقع" : "View site guide"}</button></div>
        <div className="hero-trust"><span>✓ {lang === "ar" ? "أسماء مهنية تجريبية وموسومة" : "Clearly labelled fictional profiles"}</span><span>✓ {lang === "ar" ? "اتصالات الموردين من مواقعهم الرسمية" : "Supplier contacts from official sites"}</span><span>✓ {lang === "ar" ? "لا أسعار مخترعة" : "No invented prices"}</span></div>
      </div>
      <aside className="task-launcher">
        <header><span>01</span><div><b>{lang === "ar" ? "ماذا تريد أن تنجز؟" : "What do you want to do?"}</b><small>{lang === "ar" ? "اختر مهمة وسنأخذك مباشرة" : "Choose a task and go straight there"}</small></div></header>
        <button type="button" onClick={() => navigate("construction", "directory")}><i>♙</i><span><b>{lang === "ar" ? "أحتاج مهندسًا أو مقاولًا" : "I need an engineer or contractor"}</b><small>{lang === "ar" ? "بحث، تخصص، منطقة، وخدمات" : "Search, discipline, area, and services"}</small></span><em>←</em></button>
        <button type="button" onClick={() => navigate("construction", "materials")}><i>▦</i><span><b>{lang === "ar" ? "أريد مواد بناء" : "I need building materials"}</b><small>{lang === "ar" ? "موردون رسميون، جودة، واتصال مباشر" : "Official suppliers, quality, and direct contact"}</small></span><em>←</em></button>
        <button type="button" onClick={() => navigate("construction", "house")}><i>⌂</i><span><b>{lang === "ar" ? "أريد تقدير بناء بيت" : "I want a house estimate"}</b><small>{lang === "ar" ? "نطاق تقديري بمدخلاتك أنت" : "A range based on your own inputs"}</small></span><em>←</em></button>
        <button type="button" onClick={openAi}><i>✦</i><span><b>{t.askAi}</b><small>{lang === "ar" ? "يطلب البيانات الناقصة قبل الحساب" : "Asks for missing data before calculating"}</small></span><em>←</em></button>
      </aside>
    </section>

    <section className="search-band v2-search"><span>⌕</span><input id="global-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /><kbd>Ctrl K</kbd>{results.length > 0 && <div className="search-results">{results.map((result) => <button key={result.id} type="button" onClick={() => navigate("construction", result.section)}><span>{result.label}</span><small>{result.type}</small></button>)}</div>}</section>

    <section className="journey-strip"><span>{lang === "ar" ? "رحلة مشروعك" : "Your project journey"}</span>{[
      [lang === "ar" ? "اختر المختص" : "Choose expert", "directory"],
      [lang === "ar" ? "قدّر التكلفة" : "Estimate cost", "house"],
      [lang === "ar" ? "أنشئ BOQ" : "Create BOQ", "boq"],
      [lang === "ar" ? "قارن المواد" : "Compare materials", "materials"],
      [lang === "ar" ? "افحص التنفيذ" : "Inspect work", "checklists"],
    ].map(([label, id], index) => <button key={id} type="button" onClick={() => navigate("construction", id)}><i>{String(index + 1).padStart(2, "0")}</i>{label}<b>←</b></button>)}</section>

    <section className="sector-section" id="sectors"><div className="section-heading"><span>01 — 03</span><h2>{t.sectors}</h2><p>{t.sectorLead}</p></div><div className="sector-grid">{sectors.map((sector) => <button className={`sector-card sector-${sector.id}`} key={sector.id} type="button" onClick={() => navigate(sector.id as View)}><span className="sector-code">{sector.code}</span><div className="sector-symbol">{sector.id === "construction" ? "▥" : sector.id === "water" ? "≈" : "⌁"}</div><small>{local(sector.stats, lang)}</small><h3>{local(sector.title, lang)}</h3><p>{local(sector.description, lang)}</p><b>{t.open} ↗</b></button>)}</div></section>

    <section className="source-snapshot"><div><p className="eyebrow">SOURCE-CONNECTED MARKET</p><h2>{lang === "ar" ? "موردون حقيقيون. أسعار بلا تخمين." : "Real suppliers. No guessed prices."}</h2><p>{lang === "ar" ? "ربطنا بيانات المنتجات والاتصال بالمواقع الرسمية. السعر يبقى «غير متاح» حتى ينشره المورد أو تدخله من عرض سعر حديث." : "Products and contacts are linked to official sites. Price remains unavailable until published or entered from a current quote."}</p><button className="button primary green" type="button" onClick={() => navigate("construction", "materials")}>{lang === "ar" ? "افتح سوق المواد" : "Open material market"} ←</button></div><div className="supplier-mini-grid">{verifiedSuppliers.slice(0, 4).map((supplier) => <article key={supplier.id}><DataBadge lang={lang} type="official"/><h3>{local(supplier.name, lang)}</h3><p>{supplier.products.map((item) => local(item, lang)).join(" · ")}</p><a href={supplier.website} target="_blank" rel="noreferrer">{supplier.phone} ↗</a></article>)}</div></section>

    <section className="sustainability-band"><div><span>↓</span><b>{lang === "ar" ? "أثر أقل يبدأ بقرار أفضل" : "Lower impact starts with a better decision"}</b></div>{[
      [lang === "ar" ? "مقارنة حسب المواصفة" : "Specification-led comparison", "SPEC"],
      [lang === "ar" ? "عزل وكفاءة حرارية" : "Insulation & thermal efficiency", "ENERGY"],
      [lang === "ar" ? "تقليل الهدر في BOQ" : "Less BOQ waste", "WASTE"],
      [lang === "ar" ? "توثيق الجودة والفحص" : "Quality & inspection records", "QA/QC"],
    ].map(([label, tag]) => <span key={tag}><small>{tag}</small>{label}</span>)}</section>
    <section className="safety-banner"><b>!</b><p>{t.disclaimer}</p></section>
  </>;
}

function ConstructionHubV2({ lang, t }: { lang: Language; t: T }) {
  const [kind, setKind] = useState<"engineer" | "contractor">("engineer");
  const [query, setQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<DirectoryRecord | null>(null);
  const filtered = directoryRecords.filter((record) => record.kind === kind && [local(record.name, lang), local(record.specialty, lang), local(record.area, lang)].join(" ").toLowerCase().includes(query.toLowerCase()));

  return <>
    <section className="hub-intro construction-intro"><p className="eyebrow">CONSTRUCTION HUB · SUSTAINABILITY FIRST</p><div className="hub-breadcrumb"><button type="button" onClick={() => window.history.back()}>⌂</button><span>/</span><b>{lang === "ar" ? "الإنشاءات" : "Construction"}</b></div><h1>{lang === "ar" ? "ابنِ بوضوح." : "Build with clarity."}</h1><p>{lang === "ar" ? "ابدأ من المختص، مرّ بالمواد والكميات، وأنهِ كل مرحلة بقائمة فحص موثقة." : "Start with the right specialist, move through materials and quantities, and close each stage with a documented inspection."}</p></section>
    <nav className="hub-subnav">{[
      ["directory", lang === "ar" ? "الدليل" : "Directory"],
      ["materials", lang === "ar" ? "المواد والموردون" : "Materials & suppliers"],
      ["house", lang === "ar" ? "ابني بيتك" : "Build my house"],
      ["calculators", lang === "ar" ? "الحاسبات" : "Calculators"],
      ["boq", "BOQ"],
      ["roadmap", lang === "ar" ? "خارطة البناء" : "Roadmap"],
      ["checklists", lang === "ar" ? "قوائم الفحص" : "Checklists"],
    ].map(([id, label]) => <button type="button" key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}>{label}</button>)}</nav>

    <section className="workspace-section directory-section" id="directory">
      <div className="workspace-title"><span>01</span><div><h2>{lang === "ar" ? "دليل المهندسين والمقاولين" : "Engineer & contractor directory"}</h2><p>{lang === "ar" ? "الملفات الحالية خيالية للتصميم فقط، وموسومة بوضوح. لا توجد تقييمات أو مشاريع مخترعة." : "Current profiles are fictional for product demonstration and clearly labelled. No invented ratings or projects."}</p></div></div>
      <div className="directory-controls"><div className="segmented"><button className={kind === "engineer" ? "active" : ""} type="button" onClick={() => setKind("engineer")}>{lang === "ar" ? "المهندسون" : "Engineers"} <b>6</b></button><button className={kind === "contractor" ? "active" : ""} type="button" onClick={() => setKind("contractor")}>{lang === "ar" ? "المقاولون" : "Contractors"} <b>3</b></button></div><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === "ar" ? "ابحث بالتخصص أو المنطقة…" : "Search by specialty or area…"} /></label></div>
      <div className="directory-grid enriched">{filtered.map((record) => <article className="profile-card" key={record.id}>
        {record.kind === "engineer" ? <div className="avatar-photo" style={{ backgroundPosition: record.avatarPosition }} role="img" aria-label={local(record.name, lang)} /> : <div className="contractor-photo"><span>▥</span></div>}
        <DataBadge lang={lang} type="demo"/>
        <small>{local(record.specialty, lang)}</small><h3>{local(record.name, lang)}</h3>
        <div className="profile-meta"><span>⌖ {local(record.area, lang)}</span><span>◷ {record.experienceYears} {lang === "ar" ? "سنوات نموذجية" : "demo years"}</span></div>
        <div className="service-tags">{record.services?.slice(0, 2).map((service) => <span key={service.en}>{local(service, lang)}</span>)}</div>
        <p className="no-rating">{lang === "ar" ? "لا توجد تقييمات موثقة" : "No verified reviews"}</p>
        <div className="card-actions"><button type="button" onClick={() => setSelectedProfile(record)}>{lang === "ar" ? "عرض الملف" : "View profile"}</button><button type="button" disabled>{lang === "ar" ? "التواصل بعد التحقق" : "Contact after verification"}</button></div>
      </article>)}</div>
    </section>

    <MaterialMarketplace lang={lang} />
    <HouseAssistant lang={lang} t={t} />
    <CalculatorStudio lang={lang} />
    <BoqWorkspace lang={lang} />
    <RoadmapWorkspace lang={lang} />
    <InspectionWorkspace lang={lang} />
    <section className="safety-banner"><b>!</b><p>{t.disclaimer}</p></section>
    {selectedProfile && <ProfileModal lang={lang} profile={selectedProfile} close={() => setSelectedProfile(null)} />}
  </>;
}

function ProfileModal({ lang, profile, close }: { lang: Language; profile: DirectoryRecord; close: () => void }) {
  return <div className="profile-modal" role="dialog" aria-modal="true"><button className="modal-backdrop" type="button" onClick={close} aria-label="Close" /><article><header><DataBadge lang={lang} type="demo"/><button type="button" onClick={close}>×</button></header>{profile.kind === "engineer" ? <div className="profile-modal-photo" style={{ backgroundPosition: profile.avatarPosition }} /> : <div className="contractor-modal-photo">▥</div>}<small>{local(profile.specialty, lang)}</small><h2>{local(profile.name, lang)}</h2><p>{lang === "ar" ? "هذا ملف خيالي لتوضيح شكل الدليل. لا يمثل شخصًا أو شركة حقيقية." : "This is a fictional profile demonstrating the directory. It does not represent a real person or company."}</p><dl><div><dt>{lang === "ar" ? "المنطقة" : "Area"}</dt><dd>{local(profile.area, lang)}</dd></div><div><dt>{lang === "ar" ? "الخبرة" : "Experience"}</dt><dd>{profile.experienceYears} {lang === "ar" ? "سنوات نموذجية" : "demo years"}</dd></div><div><dt>{lang === "ar" ? "المشاريع" : "Projects"}</dt><dd>{profile.projects ? local(profile.projects, lang) : "—"}</dd></div></dl><h3>{lang === "ar" ? "الخدمات" : "Services"}</h3><div className="service-tags">{profile.services?.map((service) => <span key={service.en}>{local(service, lang)}</span>)}</div><button className="button primary" type="button" disabled>{lang === "ar" ? "التواصل متاح بعد التحقق من الملف" : "Contact available after verification"}</button></article></div>;
}

function MaterialMarketplace({ lang }: { lang: Language }) {
  const constructionMaterials = materials.filter((item) => item.category === "construction");
  const [materialId, setMaterialId] = useState(constructionMaterials[0].id);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [alert, setAlert] = useState("");
  const selected = constructionMaterials.find((item) => item.id === materialId)!;
  const suppliers = verifiedSuppliers.filter((supplier) => selected.supplierIds.includes(supplier.id));
  const quoteRows = suppliers.map((supplier) => ({ supplier, quote: quotes[supplier.id] ?? { price: "", delivery: "", specification: "" } }));
  const priced = quoteRows.filter((row) => numeric(row.quote.price) > 0 && row.quote.specification.trim());
  const sameSpecification = priced.length >= 2 && new Set(priced.map((row) => row.quote.specification.trim().toLowerCase())).size === 1;
  const best = sameSpecification ? [...priced].sort((a, b) => (numeric(a.quote.price) + numeric(a.quote.delivery)) - (numeric(b.quote.price) + numeric(b.quote.delivery)))[0] : null;
  const updateQuote = (supplierId: string, key: keyof Quote, value: string) => setQuotes((current) => {
    const previous = current[supplierId] ?? { price: "", delivery: "", specification: "" };
    return { ...current, [supplierId]: { ...previous, [key]: value } };
  });

  return <section className="workspace-section material-market-v2" id="materials">
    <div className="workspace-title"><span>02</span><div><h2>{lang === "ar" ? "سوق مواد البناء: السعر + الجودة + المصدر" : "Material market: price + quality + source"}</h2><p>{lang === "ar" ? "بيانات المورد والاتصال من المصدر الرسمي. أدخل عرض السعر الذي استلمته لتقارن إجمالي السعر والتوصيل، ولن تظهر نتيجة أفضل قيمة إلا عند تطابق المواصفة." : "Supplier contacts come from official sources. Enter received quotes to compare price plus delivery; best value appears only when specifications match."}</p></div></div>
    <div className="market-layout">
      <aside className="material-selector"><label><span>{lang === "ar" ? "اختر المادة" : "Choose material"}</span><select value={materialId} onChange={(event) => { setMaterialId(event.target.value); setQuotes({}); }}>{constructionMaterials.map((item) => <option key={item.id} value={item.id}>{local(item.name, lang)}</option>)}</select></label><div><small>{lang === "ar" ? "المواصفة المطلوبة للمقارنة" : "Required comparison specification"}</small><b>{selected.specification}</b></div><div><small>{lang === "ar" ? "الوحدة" : "Unit"}</small><b>{selected.unit}</b></div><DataBadge lang={lang} type="unavailable"/><p>{lang === "ar" ? "لا يوجد سعر حي موثوق لهذا المنتج حاليًا. اتصل بالمورد أو أدخل عرضك." : "No verified live price is available. Call a supplier or enter your quote."}</p></aside>
      <div className="quote-workspace">
        <header><span>{lang === "ar" ? "المورد" : "Supplier"}</span><span>{lang === "ar" ? "المواصفة في العرض" : "Quoted specification"}</span><span>{lang === "ar" ? "السعر KWD" : "Price KWD"}</span><span>{lang === "ar" ? "التوصيل KWD" : "Delivery KWD"}</span><span>{lang === "ar" ? "الاتصال والمصدر" : "Contact & source"}</span></header>
        {quoteRows.length ? quoteRows.map(({ supplier, quote }) => <article key={supplier.id}>
          <div><DataBadge lang={lang} type="official"/><h3>{local(supplier.name, lang)}</h3><small>{supplier.products.map((item) => local(item, lang)).join(" · ")}</small></div>
          <input value={quote.specification} onChange={(event) => updateQuote(supplier.id, "specification", event.target.value)} placeholder={selected.specification} />
          <input type="number" min="0" value={quote.price} onChange={(event) => updateQuote(supplier.id, "price", event.target.value)} placeholder="—" />
          <input type="number" min="0" value={quote.delivery} onChange={(event) => updateQuote(supplier.id, "delivery", event.target.value)} placeholder="—" />
          <div className="supplier-actions"><a href={`tel:${supplier.phone}`}>{supplier.phone}</a><a href={supplier.source} target="_blank" rel="noreferrer">{lang === "ar" ? "المصدر الرسمي" : "Official source"} ↗</a></div>
          <details><summary>{lang === "ar" ? "ملاحظة الجودة والموقع" : "Quality note & location"}</summary><p>{local(supplier.qualityNote, lang)}</p><small>{local(supplier.location, lang)} · {lang === "ar" ? "تم التحقق" : "Checked"} {supplier.lastChecked}</small></details>
        </article>) : <div className="no-suppliers"><b>{lang === "ar" ? "لا يوجد مورد مرتبط بعد" : "No linked supplier yet"}</b><span>{lang === "ar" ? "أضف مصدرًا موثوقًا من لوحة الإدارة." : "Add a verified source from admin."}</span></div>}
        <div className={`comparison-result ${best ? "ready" : ""}`}><span>{best ? "✓" : "i"}</span><div><b>{best ? (lang === "ar" ? `أفضل إجمالي بين العروض المتطابقة: ${local(best.supplier.name, lang)}` : `Best total among matching quotes: ${local(best.supplier.name, lang)}`) : (lang === "ar" ? "أدخل عرضين بالمواصفة نفسها لإظهار أفضل قيمة" : "Enter two matching-specification quotes to show best value")}</b>{best && <small>{number(numeric(best.quote.price) + numeric(best.quote.delivery), lang)} KWD · {lang === "ar" ? "السعر + التوصيل فقط؛ راجع الجودة والتوفر" : "price + delivery only; review quality and availability"}</small>}</div></div>
      </div>
    </div>
    <div className="supplier-directory-v2" id="suppliers"><div><span>8</span><h3>{lang === "ar" ? "موردون مرتبطون بمصادر رسمية" : "Suppliers linked to official sources"}</h3><p>{lang === "ar" ? "أرقام الاتصال عامة ومنشورة على مواقع الموردين." : "Public contact numbers published on supplier websites."}</p></div>{verifiedSuppliers.map((supplier) => <article key={supplier.id}><DataBadge lang={lang} type="official"/><h4>{local(supplier.name, lang)}</h4><p>{supplier.products.map((item) => local(item, lang)).join(" · ")}</p><a href={`tel:${supplier.phone}`}>{supplier.phone}</a><a href={supplier.website} target="_blank" rel="noreferrer">{lang === "ar" ? "الموقع الرسمي" : "Official site"} ↗</a></article>)}</div>
    <form className="price-alert" onSubmit={(event) => event.preventDefault()}><div><b>{lang === "ar" ? "تنبيه سعر" : "Price alert"}</b><span>{lang === "ar" ? "يُحفظ كمسودة حتى يتصل مصدر أسعار موثوق." : "Saved as draft until a verified price feed is connected."}</span></div><input value={alert} onChange={(event) => setAlert(event.target.value)} placeholder={lang === "ar" ? "مثال: نبّهني عند انخفاض الحديد عن…" : "Example: alert me when rebar drops below…"} /><button type="submit">{lang === "ar" ? "حفظ المسودة" : "Save draft"}</button></form>
  </section>;
}

function HouseAssistant({ lang, t }: { lang: Language; t: T }) {
  const [landArea, setLandArea] = useState("600");
  const [builtArea, setBuiltArea] = useState("500");
  const [floors, setFloors] = useState("2");
  const [region, setRegion] = useState("مبارك الكبير");
  const [finish, setFinish] = useState("medium");
  const [lowRate, setLowRate] = useState("");
  const [highRate, setHighRate] = useState("");
  const [basement, setBasement] = useState(false);
  const [elevator, setElevator] = useState(false);
  const [result, setResult] = useState<[number, number] | null>(null);

  return <section className="workspace-section house-assistant-v2" id="house"><div className="workspace-title"><span>03</span><div><h2>{lang === "ar" ? "ابني بيتك — مدخلات واضحة ونتيجة صادقة" : "Build my house — clear inputs, honest output"}</h2><p>{lang === "ar" ? "لا نضع سعر متر مخترعًا. أدخل الحدين من عرض موثوق أو مرجعك، وسنحسب النطاق ونحفظ افتراضاتك." : "We do not invent a rate per square metre. Enter a verified low/high rate and we calculate the range with your assumptions."}</p></div></div>
    <div className="house-grid"><form onSubmit={(event) => { event.preventDefault(); setResult(estimateHouseRange(numeric(builtArea), numeric(lowRate), numeric(highRate)) as [number, number] | null); }}><div className="form-grid three"><Field label={lang === "ar" ? "مساحة الأرض (م²)" : "Land area (m²)"} value={landArea} onChange={setLandArea}/><Field label={lang === "ar" ? "إجمالي مساحة البناء (م²)" : "Total built area (m²)"} value={builtArea} onChange={setBuiltArea}/><Field label={lang === "ar" ? "عدد الأدوار" : "Floors"} value={floors} onChange={setFloors}/></div><div className="form-grid three"><label className="field"><span>{lang === "ar" ? "المنطقة" : "Area"}</span><select value={region} onChange={(event) => setRegion(event.target.value)}>{["العاصمة","حولي","الفروانية","الجهراء","الأحمدي","مبارك الكبير"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>{lang === "ar" ? "مستوى التشطيب" : "Finish level"}</span><select value={finish} onChange={(event) => setFinish(event.target.value)}><option value="basic">{lang === "ar" ? "اقتصادي" : "Basic"}</option><option value="medium">{lang === "ar" ? "متوسط" : "Medium"}</option><option value="premium">{lang === "ar" ? "مرتفع" : "Premium"}</option></select></label><div className="toggle-pair"><label><input type="checkbox" checked={basement} onChange={(event) => setBasement(event.target.checked)}/><span>{lang === "ar" ? "سرداب" : "Basement"}</span></label><label><input type="checkbox" checked={elevator} onChange={(event) => setElevator(event.target.checked)}/><span>{lang === "ar" ? "مصعد" : "Lift"}</span></label></div></div><div className="rate-box"><Field label={lang === "ar" ? "الحد الأدنى KWD/م² — من مصدرك" : "Low KWD/m² — your source"} value={lowRate} onChange={setLowRate}/><Field label={lang === "ar" ? "الحد الأعلى KWD/م² — من مصدرك" : "High KWD/m² — your source"} value={highRate} onChange={setHighRate}/><button className="button primary green" type="submit">{t.calculate} ←</button></div></form>
      <aside><small>{lang === "ar" ? "النطاق التقديري" : "Estimated range"}</small>{result ? <b>{number(result[0], lang, 0)} – {number(result[1], lang, 0)} KWD</b> : <b>— KWD</b>}<p>{result ? `${landArea} m² land · ${builtArea} m² built · ${floors} floors · ${region} · ${finish} · basement: ${basement ? "yes" : "no"} · lift: ${elevator ? "yes" : "no"}` : t.needRates}</p><div className="green-checks"><span>✓ {lang === "ar" ? "أضف عزلًا حراريًا مناسبًا لمناخ الكويت" : "Plan climate-appropriate insulation"}</span><span>✓ {lang === "ar" ? "جهّز السطح للطاقة الشمسية" : "Make the roof solar-ready"}</span><span>✓ {lang === "ar" ? "اختر خلاطات وأدوات صحية منخفضة التدفق" : "Select low-flow fixtures"}</span><span>✓ {lang === "ar" ? "قلّل هدر المواد عبر BOQ مضبوط" : "Reduce waste with a controlled BOQ"}</span></div><strong>{t.disclaimer}</strong></aside></div>
  </section>;
}

const calculatorDefinitions = {
  concrete: { ar: "حجم الخرسانة", en: "Concrete volume", labels: [["الطول (م)","Length (m)"],["العرض (م)","Width (m)"],["السماكة (م)","Depth (m)"],["العدد","Count"]], formula: "V = L × W × D × N", unit: "m³", compute: calculatorFunctions.concrete },
  slab: { ar: "حجم البلاطة", en: "Slab volume", labels: [["الطول (م)","Length (m)"],["العرض (م)","Width (m)"],["السماكة (م)","Thickness (m)"],["عدد البلاطات","Slab count"]], formula: "V = L × W × t × N", unit: "m³", compute: calculatorFunctions.slab },
  excavation: { ar: "حجم الحفر", en: "Excavation volume", labels: [["الطول (م)","Length (m)"],["العرض (م)","Width (m)"],["العمق (م)","Depth (m)"],["العدد","Count"]], formula: "V = L × W × D × N", unit: "m³", compute: calculatorFunctions.excavation },
  backfill: { ar: "حجم الدفان", en: "Backfill volume", labels: [["حجم الحفر (م³)","Excavation (m³)"],["حجم المنشأ (م³)","Structure (m³)"],["معامل الدمك","Compaction factor"],["—","—"]], formula: "V = (Excavation − Structure) × factor", unit: "m³", compute: calculatorFunctions.backfill },
  block: { ar: "عدد الطابوق", en: "Block quantity", labels: [["مساحة الجدار (م²)","Wall area (m²)"],["طول الطابوقة (سم)","Block length (cm)"],["ارتفاع الطابوقة (سم)","Block height (cm)"],["هدر (%)","Waste (%)"]], formula: "N = A ÷ (L × H) × (1+w)", unit: "units", compute: calculatorFunctions.block },
  rebar: { ar: "وزن حديد التسليح", en: "Rebar weight", labels: [["القطر (مم)","Diameter (mm)"],["طول السيخ (م)","Bar length (m)"],["العدد","Count"],["هدر (%)","Waste (%)"]], formula: "W = d²/162 × L × N × (1+w)", unit: "kg", compute: calculatorFunctions.rebar },
  formwork: { ar: "مساحة الشدة", en: "Formwork area", labels: [["الطول (م)","Length (m)"],["العرض (م)","Width (m)"],["الارتفاع (م)","Height (m)"],["العدد","Count"]], formula: "A = 2(L+W)H × N", unit: "m²", compute: calculatorFunctions.formwork },
  steel: { ar: "وزن الصاج", en: "Steel plate weight", labels: [["الطول (م)","Length (m)"],["العرض (م)","Width (m)"],["السماكة (مم)","Thickness (mm)"],["العدد","Count"]], formula: "W = L × W × t × 7850 × N", unit: "kg", compute: calculatorFunctions.steel },
};

function CalculatorStudio({ lang }: { lang: Language }) {
  const [type, setType] = useState<keyof typeof calculatorDefinitions>("concrete");
  const [values, setValues] = useState(["6","4","0.2","1"]);
  const definition = calculatorDefinitions[type];
  const result = definition.compute(numeric(values[0]), numeric(values[1]), numeric(values[2]), numeric(values[3]));
  return <section className="workspace-section calculator-studio" id="calculators"><div className="workspace-title"><span>04</span><div><h2>{lang === "ar" ? "حاسبات الإنشاءات" : "Construction calculators"}</h2><p>{lang === "ar" ? "ثماني حاسبات بصيغ واضحة. القيم النظرية لا تشمل ظروف الموقع إلا عندما تُدخل معامل الهدر أو الدمك." : "Eight calculators with transparent formulae. Theoretical outputs exclude site conditions unless you enter waste or compaction."}</p></div></div><div className="calculator-layout"><aside>{Object.entries(calculatorDefinitions).map(([id, item], index) => <button className={type === id ? "active" : ""} key={id} type="button" onClick={() => { setType(id as keyof typeof calculatorDefinitions); setValues(["","","",""]); }}><i>{String(index+1).padStart(2,"0")}</i>{item[lang]}<b>←</b></button>)}</aside><article><span className="calc-kicker">FORMULA-BASED · SI UNITS</span><h3>{definition[lang]}</h3><div className="form-grid">{definition.labels.map((label, index) => <Field key={index} label={label[lang === "ar" ? 0 : 1]} value={values[index]} onChange={(value) => setValues((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))}/>)}</div><output><small>{lang === "ar" ? "النتيجة" : "Result"}</small><b>{number(result, lang, 3)} {definition.unit}</b></output><div className="formula">{definition.formula}</div><p>{lang === "ar" ? "ملاحظة: راجع الوحدات، المواصفات، والهدر الفعلي مع مهندس المشروع قبل اعتماد الكمية." : "Note: verify units, specifications, and actual waste with the project engineer before relying on the quantity."}</p></article></div></section>;
}

function BoqWorkspace({ lang }: { lang: Language }) {
  const [rows, setRows] = useState<BoqRow[]>([{ id: 1, item: "", qty: "", unit: "m³", rate: "" }]);
  const [note, setNote] = useState("");
  const total = rows.reduce((sum, row) => sum + numeric(row.qty) * numeric(row.rate), 0);
  const update = (id: number, key: keyof BoqRow, value: string | number) => setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
  const importCsv = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { setNote(lang === "ar" ? "تحليل PDF وExcel يحتاج تسجيل الدخول وموفر تحليل المستندات؛ استخدم CSV الآن." : "PDF and Excel require sign-in and the document-analysis provider; use CSV for now."); return; }
    const text = await file.text();
    const parsed = text.replace(/\r/g,"").split("\n").filter(Boolean).slice(1,201).map((line, index) => {
      const cols = line.split(",").map((value) => value.trim().replace(/^"|"$/g,""));
      return { id: Date.now()+index, item: cols[1] || cols[0] || "", qty: cols[2] || "", unit: cols[3] || "unit", rate: cols[4] || "" };
    });
    if (parsed.length) { setRows(parsed); setNote(lang === "ar" ? `تم استيراد ${parsed.length} بندًا. راجع الوحدات والقيم.` : `Imported ${parsed.length} items. Review units and values.`); }
  };
  return <section className="workspace-section boq-v2" id="boq"><div className="workspace-title"><span>05</span><div><h2>{lang === "ar" ? "أداة BOQ العملية" : "Practical BOQ workspace"}</h2><p>{lang === "ar" ? "أدخل البنود يدويًا أو استورد CSV. الأسعار من عروضك أنت، ويمكن مقارنتها لاحقًا بالموردين ذوي المواصفة نفسها." : "Enter items manually or import CSV. Rates come from your own quotes and can later be compared with same-specification suppliers."}</p></div></div><div className="boq-toolbar"><label className="upload compact-upload"><span>⇧</span><b>{lang === "ar" ? "استيراد CSV" : "Import CSV"}</b><input type="file" accept=".csv,.pdf,.xlsx" onChange={(event) => importCsv(event.target.files?.[0])}/></label><button type="button" onClick={() => setRows((current) => [...current,{id:Date.now(),item:"",qty:"",unit:"m³",rate:""}])}>＋ {lang === "ar" ? "بند جديد" : "New item"}</button><span>{rows.length} {lang === "ar" ? "بنود" : "items"}</span>{note && <em>{note}</em>}</div><div className="boq-table"><div className="boq-row head"><span>{lang === "ar" ? "الوصف" : "Description"}</span><span>{lang === "ar" ? "الكمية" : "Quantity"}</span><span>{lang === "ar" ? "الوحدة" : "Unit"}</span><span>{lang === "ar" ? "السعر" : "Rate"}</span><span>{lang === "ar" ? "القيمة" : "Amount"}</span></div>{rows.map((row) => <div className="boq-row" key={row.id}><input value={row.item} onChange={(event) => update(row.id,"item",event.target.value)} placeholder={lang === "ar" ? "وصف البند" : "Item description"}/><input type="number" min="0" value={row.qty} onChange={(event) => update(row.id,"qty",event.target.value)}/><select value={row.unit} onChange={(event) => update(row.id,"unit",event.target.value)}>{["m³","m²","m","kg","ton","unit"].map((unit) => <option key={unit}>{unit}</option>)}</select><input type="number" min="0" value={row.rate} onChange={(event) => update(row.id,"rate",event.target.value)}/><output>{number(numeric(row.qty)*numeric(row.rate),lang)} KWD</output></div>)}</div><div className="boq-summary"><span><small>{lang === "ar" ? "تكلفة المواد/البنود المدخلة" : "Entered item cost"}</small><b>{number(total,lang)} KWD</b></span><span><small>{lang === "ar" ? "عمالة" : "Labour"}</small><b>{lang === "ar" ? "أضف كبند" : "Add as item"}</b></span><span><small>{lang === "ar" ? "معدات وتوصيل واحتياط" : "Equipment, delivery & contingency"}</small><b>{lang === "ar" ? "أضف كبنود" : "Add as items"}</b></span></div></section>;
}

function RoadmapWorkspace({ lang }: { lang: Language }) {
  const [stepId, setStepId] = useState("01");
  const step = roadmap.find((item) => item[0] === stepId)!;
  const details = roadmapDetails[stepId];
  return <section className="roadmap-section" id="roadmap"><div className="workspace-title"><span>06</span><div><h2>{lang === "ar" ? "خارطة بناء البيت" : "House-building roadmap"}</h2><p>{lang === "ar" ? "اعرف المسؤول والمستند والخطأ الشائع وما الذي يجب فحصه في كل مرحلة." : "See the responsible party, document, common mistake, and inspection focus for every stage."}</p></div></div><div className="roadmap v2-roadmap"><div>{roadmap.map((item) => <button className={stepId === item[0] ? "active" : ""} type="button" key={item[0]} onClick={() => setStepId(item[0])}><span>{item[0]}</span><b>{item[lang === "ar" ? 1 : 2]}</b><i>←</i></button>)}</div><article><span>{step[0]} / 09</span><h3>{step[lang === "ar" ? 1 : 2]}</h3><dl><div><dt>{lang === "ar" ? "المسؤول" : "Responsible"}</dt><dd>{step[lang === "ar" ? 3 : 4]}</dd></div><div><dt>{lang === "ar" ? "المدة" : "Duration"}</dt><dd>{local(details.duration,lang)}</dd></div></dl><RoadmapList title={lang === "ar" ? "المستندات" : "Documents"} items={details.documents} lang={lang}/><RoadmapList title={lang === "ar" ? "خطأ شائع" : "Common mistake"} items={details.mistakes} lang={lang} warning/><RoadmapList title={lang === "ar" ? "ما الذي أفحصه؟" : "What should I inspect?"} items={details.checks} lang={lang}/><small>{lang === "ar" ? "المدد والمتطلبات تختلف حسب المشروع والجهة؛ تحقق من المصدر الرسمي." : "Durations and requirements vary by project and authority; verify official sources."}</small></article></div></section>;
}

function RoadmapList({ title, items, lang, warning = false }: { title: string; items: LocaleText[]; lang: Language; warning?: boolean }) {
  return <div className={`roadmap-list ${warning ? "warning" : ""}`}><h4>{warning ? "!" : "✓"} {title}</h4>{items.map((item) => <p key={item.en}>{local(item,lang)}</p>)}</div>;
}

function InspectionWorkspace({ lang }: { lang: Language }) {
  const [selected, setSelected] = useState(inspectionChecklists[0].id);
  const [statuses, setStatuses] = useState<Record<string,"pass"|"fail"|"pending">>({});
  const [notes, setNotes] = useState("");
  const checklist = inspectionChecklists.find((item) => item.id === selected)!;
  const completed = checklist.items.filter((_,index) => statuses[`${selected}-${index}`] && statuses[`${selected}-${index}`] !== "pending").length;
  return <section className="workspace-section inspection-v2" id="checklists"><div className="workspace-title"><span>07</span><div><h2>{lang === "ar" ? "قوائم فحص الموقع" : "Site inspection checklists"}</h2><p>{lang === "ar" ? "مرّر كل بند Pass / Fail، أضف ملاحظتك وصورة. الحفظ الدائم يتطلب تسجيل الدخول." : "Mark every item Pass / Fail, then add notes and a photo. Persistent saving requires sign-in."}</p></div></div><div className="inspection-layout"><aside>{inspectionChecklists.map((item) => <button className={selected === item.id ? "active" : ""} type="button" key={item.id} onClick={() => { setSelected(item.id); setNotes(""); }}><span>☑</span><b>{local(item.title,lang)}</b><i>←</i></button>)}</aside><article><header><div><small>{lang === "ar" ? "قائمة الفحص الحالية" : "Current checklist"}</small><h3>{local(checklist.title,lang)}</h3></div><b>{completed}/{checklist.items.length}</b></header>{checklist.items.map((item,index) => { const key=`${selected}-${index}`; return <div className="inspection-row" key={key}><span>{String(index+1).padStart(2,"0")}</span><strong>{local(item,lang)}</strong><div><button className={statuses[key] === "pass" ? "active pass" : ""} type="button" onClick={() => setStatuses((current) => ({...current,[key]:"pass"}))}>✓ PASS</button><button className={statuses[key] === "fail" ? "active fail" : ""} type="button" onClick={() => setStatuses((current) => ({...current,[key]:"fail"}))}>× FAIL</button></div></div>})}<label className="field notes-field"><span>{lang === "ar" ? "ملاحظات المهندس" : "Engineer notes"}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={lang === "ar" ? "اكتب الملاحظة والموقع والإجراء المطلوب…" : "Add note, location, and required action…"} /></label><div className="inspection-actions"><label className="upload compact-upload"><span>＋</span><b>{lang === "ar" ? "إضافة صورة" : "Add photo"}</b><input type="file" accept="image/*"/></label><a className="button primary green" href="/signin-with-chatgpt?return_to=/construction">{lang === "ar" ? "سجّل الدخول للحفظ" : "Sign in to save"}</a></div></article></div></section>;
}

function GuidePage({ lang, navigate }: { lang: Language; navigate: (view: View, section?: string) => void }) {
  const roles = [
    { icon:"⌂", title:{ar:"أبني بيتًا",en:"I am building a home"}, text:{ar:"ابدأ بتقدير نطاق التكلفة، ثم المختص، BOQ، المواد، والخارطة.",en:"Start with a cost range, then specialist, BOQ, materials, and roadmap."}, action:{ar:"ابدأ ابني بيتك",en:"Start house assistant"}, view:"construction" as View, section:"house" },
    { icon:"♙", title:{ar:"مهندس أو طالب",en:"Engineer or student"}, text:{ar:"استخدم الحاسبات، شبكات المياه، الطرق، وقوائم الفحص.",en:"Use calculators, water networks, roads, and inspection checklists."}, action:{ar:"افتح الحاسبات",en:"Open calculators"}, view:"construction" as View, section:"calculators" },
    { icon:"▦", title:{ar:"مقاول أو مورد",en:"Contractor or supplier"}, text:{ar:"راجع BOQ، المواصفات، والموردين المرتبطين بالمصدر.",en:"Review BOQ, specifications, and source-linked suppliers."}, action:{ar:"افتح سوق المواد",en:"Open material market"}, view:"construction" as View, section:"materials" },
  ];
  return <><section className="guide-hero"><p className="eyebrow">CIVILKUWAIT QUICK START</p><h1>{lang === "ar" ? "دليلك للموقع." : "Your site guide."}</h1><p>{lang === "ar" ? "لا تحتاج أن تعرف اسم الأداة. اختر من أنت وماذا تريد أن تنجز." : "You do not need to know the tool name. Choose who you are and what you need to accomplish."}</p></section><section className="guide-roles">{roles.map((role,index) => <article key={role.icon}><span>{role.icon}</span><small>0{index+1}</small><h2>{local(role.title,lang)}</h2><p>{local(role.text,lang)}</p><button type="button" onClick={() => navigate(role.view,role.section)}>{local(role.action,lang)} ←</button></article>)}</section><section className="guide-flow"><div><span>01</span><h2>{lang === "ar" ? "رحلة بناء البيت" : "House-building journey"}</h2></div><ol>{[
    [lang === "ar" ? "أدخل مساحة البناء ومعدلاتك الموثوقة" : "Enter area and your verified rates", "house"],
    [lang === "ar" ? "اختر مهندسًا أو مقاولًا بعد التحقق" : "Select an engineer or contractor after verification", "directory"],
    [lang === "ar" ? "أنشئ BOQ واستورد البنود" : "Create and import BOQ items", "boq"],
    [lang === "ar" ? "قارن عروض الموردين بالمواصفة نفسها" : "Compare same-specification supplier quotes", "materials"],
    [lang === "ar" ? "تابع الخارطة وأغلق قوائم الفحص" : "Follow the roadmap and close inspection lists", "checklists"],
  ].map(([label,section],index) => <li key={section}><button type="button" onClick={() => navigate("construction",section)}><i>{String(index+1).padStart(2,"0")}</i><b>{label}</b><span>←</span></button></li>)}</ol></section><section className="data-guide"><div><h2>{lang === "ar" ? "افهم شارات البيانات" : "Understand data badges"}</h2><p>{lang === "ar" ? "كل معلومة متغيرة تخبرك بوضوح هل مصدرها رسمي، تجريبي، أم غير متاح." : "Every changing value clearly states whether it is official, demo, or unavailable."}</p></div><article><DataBadge lang={lang} type="official"/><p>{lang === "ar" ? "اسم المورد والمنتجات ورقم الاتصال مرتبط بالموقع الرسمي." : "Supplier, products, and phone link to the official site."}</p></article><article><DataBadge lang={lang} type="demo"/><p>{lang === "ar" ? "اسم وصورة خيالية لتوضيح التجربة، وليست توصية." : "Fictional name and image for demonstration, not a recommendation."}</p></article><article><DataBadge lang={lang} type="unavailable"/><p>{lang === "ar" ? "لن نعرض رقمًا قبل وجود مصدر موثوق أو عرض سعر تدخله أنت." : "No number appears without a verified source or a quote you enter."}</p></article></section></>;
}
