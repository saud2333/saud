"use client";

/* eslint-disable @next/next/no-img-element -- static export and user-controlled source images require ordinary img elements. */

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "../lib/supabase";
import {
  categories,
  categoryMeta,
  type LearningOpportunity,
  type OpportunityKind,
  type OpportunityMode,
} from "../data/opportunities";

type DataMode = "connecting" | "live" | "unavailable";
type SortMode = "featured" | "price" | "title";

declare global {
  interface Document {
    modelContext?: {
      registerTool?: (tool: {
        name: string;
        title: string;
        description: string;
        inputSchema: Record<string, unknown>;
        annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
        execute: (input: unknown) => unknown;
      }, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

const kindLabels: Record<OpportunityKind, string> = {
  course: "دورة",
  workshop: "ورشة",
  camp: "معسكر",
};

const modeLabels: Record<OpportunityMode, string> = {
  in_person: "حضوري",
  online: "عن بُعد",
  hybrid: "هجين",
};

const statusLabels = {
  open: "التسجيل متاح",
  verify: "تحقّق من التوفر",
  closed: "التسجيل مغلق",
};

function assetPath(path: string) {
  if (!path.startsWith("/")) return path;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/saud")) return `/saud${path}`;
  return path;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : value === null || value === undefined ? null : Number(value);
}

function fromSupabaseRow(row: Record<string, unknown>): LearningOpportunity {
  const kind = ["course", "workshop", "camp"].includes(asString(row.kind)) ? asString(row.kind) as OpportunityKind : "course";
  const mode = ["in_person", "online", "hybrid"].includes(asString(row.mode)) ? asString(row.mode) as OpportunityMode : "in_person";
  const status = ["open", "verify", "closed"].includes(asString(row.status)) ? asString(row.status) as LearningOpportunity["status"] : "verify";
  return {
    id: asString(row.id),
    title: asString(row.title_ar, asString(row.title)),
    titleEn: asString(row.title_en) || undefined,
    description: asString(row.description_ar, asString(row.description)),
    kind,
    category: asString(row.category, "الأعمال والمهارات"),
    subcategory: asString(row.subcategory, "عام"),
    organizer: asString(row.organizer, "جهة تدريبية"),
    location: asString(row.location, "الكويت"),
    governorate: asString(row.governorate, "غير محدد"),
    mode,
    minAge: asNumber(row.min_age),
    maxAge: asNumber(row.max_age),
    ageLabel: asString(row.age_label, "لم يحدده المنظم"),
    duration: asString(row.duration_label, "يحدده المنظم"),
    schedule: asString(row.schedule_label, "الموعد يحدده المنظم"),
    startsAt: asString(row.starts_at) || null,
    endsAt: asString(row.ends_at) || null,
    registrationEndsAt: asString(row.registration_ends_at) || null,
    priceKwd: asNumber(row.price_kwd),
    status,
    registrationUrl: asString(row.registration_url, asString(row.source_url, "#")),
    sourceUrl: asString(row.source_url, "#"),
    image: asString(row.image_url, "/courses-skills.png"),
    featured: Boolean(row.featured),
    sourceCheckedAt: asString(row.source_checked_at, "2026-09-04"),
    aiReviewStatus: ["pending", "verified", "needs_review", "unavailable"].includes(asString(row.ai_review_status))
      ? asString(row.ai_review_status) as LearningOpportunity["aiReviewStatus"]
      : undefined,
    aiReviewedAt: asString(row.ai_reviewed_at) || null,
    aiReviewNote: asString(row.ai_review_note) || null,
    announcementChannel: asString(row.announcement_channel, "website"),
    officialAccountUrl: asString(row.official_account_url) || null,
    officialAccountProofUrl: asString(row.official_account_proof_url) || null,
    tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [],
  };
}

function ageMatches(item: LearningOpportunity, age: number | null) {
  if (age === null) return true;
  if (item.minAge === null && item.maxAge === null) return false;
  return (item.minAge === null || age >= item.minAge) && (item.maxAge === null || age <= item.maxAge);
}

function priceLabel(price: number | null) {
  if (price === null) return "السعر غير منشور";
  if (price === 0) return "مجاني";
  return `${new Intl.NumberFormat("ar-KW", { maximumFractionDigits: 3 }).format(price)} د.ك`;
}

function checkedLabel(date: string) {
  const parsed = new Date(date.includes("T") ? date : date + "T12:00:00");
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat("ar-KW", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

function aiReviewLabel(item: LearningOpportunity) {
  if (item.aiReviewStatus === "verified") return "✓ راجعه الذكاء الاصطناعي";
  if (item.aiReviewStatus === "pending") return "◷ بانتظار مراجعة AI";
  return "✓ مصدر رسمي";
}

function organizerMark(organizer: string) {
  if (/KGBC|المباني الخضراء/i.test(organizer)) return "KGBC";
  if (/KFAS|التقدم العلمي/i.test(organizer)) return "KFAS";
  if (/KISR|الأبحاث العلمية/i.test(organizer)) return "KISR";
  if (/SACGC|صباح الأحمد/i.test(organizer)) return "SACGC";
  if (/جامعة الكويت/.test(organizer)) return "KU";
  return "KW";
}

const officialRegistrationPortals = [
  { organizer: /KGBC|المباني الخضراء/i, domains: ["kuwaitgbc.com"], landing: "https://www.kuwaitgbc.com/events" },
  { organizer: /KFAS|التقدم العلمي/i, domains: ["kfas.org.kw"], landing: "https://apply.kfas.org.kw/" },
  { organizer: /KISR|الأبحاث العلمية/i, domains: ["kisr.edu.kw"], landing: "https://www.kisr.edu.kw/ar/careers-training/training-courses/" },
  { organizer: /SACGC|صباح الأحمد/i, domains: ["sacgc.org"], landing: "https://sacgc.org/en/" },
  { organizer: /جامعة الكويت.*مركز خدمة المجتمع/i, domains: ["ku.edu.kw"], landing: "https://ccsce.ku.edu.kw/" },
  { organizer: /جامعة الكويت/i, domains: ["ku.edu.kw"], landing: "https://engineering.ku.edu.kw/ar/vdpct/about/office-consultation-and-training" },
] as const;

function hasOfficialDomain(value: string, domains: readonly string[]) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return /^https?:$/.test(url.protocol) && domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function officialPortalFor(item: LearningOpportunity) {
  return officialRegistrationPortals.find((portal) => portal.organizer.test(item.organizer))
    ?? officialRegistrationPortals.find((portal) => hasOfficialDomain(item.sourceUrl, portal.domains));
}

function officialRegistrationDestination(item: LearningOpportunity) {
  const portal = officialPortalFor(item);
  if (!portal) return "#sources";
  return hasOfficialDomain(item.registrationUrl, portal.domains) ? item.registrationUrl : portal.landing;
}

function officialSourceDestination(item: LearningOpportunity) {
  const portal = officialPortalFor(item);
  if (!portal) return "#sources";
  if (item.officialAccountUrl && item.officialAccountProofUrl && hasOfficialDomain(item.officialAccountProofUrl, portal.domains)) {
    try {
      const url = new URL(item.sourceUrl), account = new URL(item.officialAccountUrl);
      if (url.protocol === "https:" && url.hostname === account.hostname && !url.username && !url.password) {
        if (item.announcementChannel === "youtube" && url.hostname === "www.youtube.com" && url.pathname === "/watch" && /^[\w-]{11}$/.test(url.searchParams.get("v") ?? "")) return url.href;
        if (item.announcementChannel === "x" && url.hostname === "x.com" && url.pathname.startsWith(account.pathname + "/status/")) return url.href;
        if (item.announcementChannel === "instagram" && ["www.instagram.com", "instagram.com"].includes(url.hostname) && /^\/(p|reel)\/[\w-]+\/?$/.test(url.pathname)) return url.href;
      }
    } catch { /* Unproven social URLs fall back to the official website. */ }
  }
  return hasOfficialDomain(item.sourceUrl, portal.domains) ? item.sourceUrl : portal.landing;
}

function isOpportunityActive(item: LearningOpportunity, now: number) {
  return item.status === "open" && item.aiReviewStatus === "verified"
    && Boolean(item.registrationEndsAt && Date.parse(item.registrationEndsAt) > now)
    && Boolean(item.startsAt && Date.parse(item.startsAt) > now);
}

export default function KuwaitCoursesApp() {
  const [opportunities, setOpportunities] = useState<LearningOpportunity[]>([]);
  const [dataMode, setDataMode] = useState<DataMode>("connecting");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("الكل");
  const [subcategory, setSubcategory] = useState("الكل");
  const [selectedOrganizer, setSelectedOrganizer] = useState("الكل");
  const [kind, setKind] = useState<OpportunityKind | "all">("all");
  const [mode, setMode] = useState<OpportunityMode | "all">("all");
  const [age, setAge] = useState<number | null>(null);
  const [governorate, setGovernorate] = useState("الكل");
  const [sort, setSort] = useState<SortMode>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selection, setSelected] = useState<LearningOpportunity | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [botOpen, setBotOpen] = useState(false);
  const [botText, setBotText] = useState("");
  const [botReply, setBotReply] = useState("قل لي عمرك والمجال الذي تحبه، وسأختصر لك الخيارات.");
  const [botResults, setBotResults] = useState<LearningOpportunity[]>([]);
  const [clock, setClock] = useState(() => Date.now());
  const catalogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("mirsad-theme");
    const preferred = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    const timer = window.setTimeout(() => setTheme(preferred), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const client = getSupabaseClient();
    const refresh = async () => {
      try {
      const { data, error } = await client
        .from("learning_opportunities")
        .select("*")
        .eq("is_published", true)
        .eq("ai_review_status", "verified")
        .eq("publication_ready", true)
        .gt("registration_ends_at", new Date().toISOString())
        .gt("last_seen_at", new Date(Date.now() - 24 * 60 * 60_000).toISOString())
        .order("featured", { ascending: false })
        .order("source_checked_at", { ascending: false })
        .limit(200);
      if (!active) return;
      if (!error) {
        const liveItems = (data ?? []).map((row) => fromSupabaseRow(row as Record<string, unknown>));
        setOpportunities(liveItems);
        setDataMode("live");
      } else {
        setOpportunities([]);
        setDataMode("unavailable");
      }
      } catch {
        if (active) { setOpportunities([]); setDataMode("unavailable"); }
      }
    };
    void refresh();
    const pollingTimer = window.setInterval(() => void refresh(), 60_000);
    const channel = client
      .channel("learning-opportunities-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "learning_opportunities" }, () => void refresh())
      .subscribe();
    return () => {
      active = false;
      window.clearInterval(pollingTimer);
      void client.removeChannel(channel);
    };
  }, []);

  const activeOpportunities = useMemo(() => opportunities.filter((item) => isOpportunityActive(item, clock)), [clock, opportunities]);
  const selected = activeOpportunities.find((item) => item.id === selection?.id) ?? null;
  const currentBotResults = botResults.flatMap((result) => activeOpportunities.filter((item) => item.id === result.id));
  const governors = useMemo(() => ["الكل", ...Array.from(new Set(activeOpportunities.map((item) => item.governorate)))], [activeOpportunities]);
  const subcategories = useMemo(() => {
    const candidates = category === "الكل" ? activeOpportunities : activeOpportunities.filter((item) => item.category === category);
    return ["الكل", ...Array.from(new Set(candidates.map((item) => item.subcategory))).sort((a, b) => a.localeCompare(b, "ar"))];
  }, [activeOpportunities, category]);
  const organizers = useMemo(
    () => ["الكل", ...Array.from(new Set(activeOpportunities.map((item) => item.organizer))).sort((a, b) => a.localeCompare(b, "ar"))],
    [activeOpportunities],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return activeOpportunities
      .filter((item) => category === "الكل" || item.category === category)
      .filter((item) => subcategory === "الكل" || item.subcategory === subcategory)
      .filter((item) => selectedOrganizer === "الكل" || item.organizer === selectedOrganizer)
      .filter((item) => kind === "all" || item.kind === kind)
      .filter((item) => mode === "all" || item.mode === mode)
      .filter((item) => governorate === "الكل" || item.governorate === governorate)
      .filter((item) => ageMatches(item, age))
      .filter((item) => !needle || [item.title, item.titleEn, item.description, item.organizer, item.category, item.subcategory, ...item.tags].join(" ").toLowerCase().includes(needle))
      .sort((a, b) => {
        if (sort === "price") return (a.priceKwd ?? Number.MAX_SAFE_INTEGER) - (b.priceKwd ?? Number.MAX_SAFE_INTEGER);
        if (sort === "title") return a.title.localeCompare(b.title, "ar");
        return Number(b.featured) - Number(a.featured);
      });
  }, [activeOpportunities, age, category, governorate, kind, mode, query, selectedOrganizer, sort, subcategory]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: "filter_learning_opportunities",
        title: "فلترة فرص التعلّم",
        description: "يطبّق البحث والمجال والعمر على دليل دورات وورش الكويت الظاهر في الصفحة.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            category: { type: "string", enum: categories },
            age: { type: ["integer", "null"], minimum: 6, maximum: 65 },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          const value = typeof input === "object" && input !== null ? input as { query?: unknown; category?: unknown; age?: unknown } : {};
          if (typeof value.query === "string") setQuery(value.query.slice(0, 100));
          if (typeof value.category === "string" && categories.includes(value.category as typeof categories[number])) {
            setCategory(value.category);
            setSubcategory("الكل");
          }
          if (value.age === null) setAge(null);
          if (typeof value.age === "number" && Number.isInteger(value.age) && value.age >= 6 && value.age <= 65) setAge(value.age);
          window.setTimeout(() => catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
          return { applied: true };
        },
      }, { signal: lifecycle.signal })).catch(() => undefined);
    } catch {
      // WebMCP is progressive enhancement; the visual controls remain the source of truth.
    }
    return () => lifecycle.abort();
  }, []);

  const featured = activeOpportunities.filter((item) => item.featured).slice(0, 3);
  const activeFilterCount = [
    category !== "الكل",
    subcategory !== "الكل",
    selectedOrganizer !== "الكل",
    kind !== "all",
    mode !== "all",
    age !== null,
    governorate !== "الكل",
  ].filter(Boolean).length;

  function setSiteTheme(next: "light" | "dark") {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem("mirsad-theme", next);
  }

  function clearFilters() {
    setQuery("");
    setCategory("الكل");
    setSubcategory("الكل");
    setSelectedOrganizer("الكل");
    setKind("all");
    setMode("all");
    setAge(null);
    setGovernorate("الكل");
  }

  function askBot(text: string) {
    const prompt = text.trim();
    if (!prompt) return;
    setBotText("");
    let nextCategory = "الكل";
    let nextKind: OpportunityKind | "all" = "all";
    let nextMode: OpportunityMode | "all" = "all";
    let nextAge: number | null = null;
    if (/ذكاء|برمج|روبوت|تقني/.test(prompt)) nextCategory = "التقنية والذكاء الاصطناعي";
    else if (/هندس|طاقة|كهرب|مدني/.test(prompt)) nextCategory = "الهندسة والطاقة";
    else if (/صحة|إسعاف|سلامة/.test(prompt)) nextCategory = "الصحة والسلامة";
    else if (/فن|خزف|إبداع|تصميم/.test(prompt)) nextCategory = "الفنون والإبداع";
    else if (/إدارة|مهار|عرض|كتابة/.test(prompt)) nextCategory = "الأعمال والمهارات";
    if (/ورشة/.test(prompt)) nextKind = "workshop";
    if (/معسكر/.test(prompt)) nextKind = "camp";
    if (/أونلاين|اونلاين|عن بعد/.test(prompt)) nextMode = "online";
    if (/حضوري/.test(prompt)) nextMode = "in_person";
    const foundAge = prompt.match(/\d{1,2}/)?.[0];
    if (foundAge) nextAge = Math.min(65, Math.max(6, Number(foundAge)));
    const matches = activeOpportunities.filter((item) =>
      (nextCategory === "الكل" || item.category === nextCategory) &&
      (nextKind === "all" || item.kind === nextKind) &&
      (nextMode === "all" || item.mode === nextMode) &&
      ageMatches(item, nextAge),
    ).slice(0, 3);
    setCategory(nextCategory);
    setSubcategory("الكل");
    setKind(nextKind);
    setMode(nextMode);
    setAge(nextAge);
    setBotResults(matches);
    setBotReply(matches.length ? `وجدت ${matches.length} فرص قريبة من طلبك. طبّقت الفلاتر على الدليل أيضًا.` : "ما لقيت تطابقًا دقيقًا الآن. جرّب مجالًا أوسع أو اختر «كل الفرص». ");
  }

  function handleBotSubmit(event: FormEvent) {
    event.preventDefault();
    askBot(botText);
  }

  return (
    <main className="mirsad-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="مِرصاد — الصفحة الرئيسية">
          <span className="brand-mark"><i /><i /><i /></span>
          <span><b>مِرْصاد</b><small>فرص التعلّم في الكويت</small></span>
        </a>
        <nav aria-label="التنقل الرئيسي">
          <a href="#featured">الأبرز</a>
          <a href="#catalog">كل الفرص</a>
          <a href="#sources">المصادر</a>
        </nav>
        <div className="header-actions">
          <span className={`sync-state ${dataMode}`}><i />{dataMode === "live" ? "متصل بالدليل" : dataMode === "connecting" ? "فحص التحديثات" : "تعذّر تحديث الدليل"}</span>
          <button className="theme-toggle" type="button" aria-label={theme === "light" ? "تفعيل الوضع الداكن" : "تفعيل الوضع الفاتح"} onClick={() => setSiteTheme(theme === "light" ? "dark" : "light")}>
            <span>{theme === "light" ? "☾" : "☀"}</span>
          </button>
        </div>
      </header>

      <section className="discovery-hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-content">
          <p className="kicker"><span>فرص موثّقة من الجهات الرسمية</span></p>
          <h1>تعلّم مهارات المستقبل<br /><em>من فرص الكويت.</em></h1>
          <p className="hero-copy">الدورات والورش المكتملة معلوماتها والمفتوح تسجيلها. ابحث بالعمر أو المجال أو المكان، وسجّل من موقع الجهة الرسمي.</p>
          <div className="hero-search" role="search">
            <span className="search-icon">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن روبوتات، إسعافات، تصميم…" aria-label="البحث في الدورات والورش" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="مسح البحث">×</button>}
            <button className="search-submit" type="button" onClick={() => catalogRef.current?.scrollIntoView({ behavior: "smooth" })}>ابحث</button>
          </div>
          <div className="hero-notes">
            <span><b>{activeOpportunities.length}</b> فرصة متاحة الآن</span>
            <span><b>{new Set(activeOpportunities.map((item) => item.category)).size}</b> مجالات</span>
            <span><b>تلقائي</b> إخفاء التسجيل المنتهي</span>
          </div>
        </div>
        <aside className="bot-preview">
          <img src={assetPath("/courses-tech.png")} alt="متعلمون في مختبر تقني" />
          <div className="bot-orbit"><i /><i /><span>✦</span></div>
          <div className="bot-card-copy"><div><small>مُرشد مِرصاد</small><h2>شنو يناسبك؟</h2><p>اكتب عمرك واهتمامك، وأنا أرتّب لك الفرص المتاحة الآن.</p></div><button type="button" onClick={() => setBotOpen(true)}>اسأل المرشد <span>←</span></button></div>
        </aside>
      </section>

      <section className="category-strip" aria-label="مجالات التعلّم">
        {categories.slice(1).map((item) => {
          const meta = categoryMeta[item];
          const count = activeOpportunities.filter((opportunity) => opportunity.category === item).length;
          return <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => { setCategory(item); setSubcategory("الكل"); catalogRef.current?.scrollIntoView({ behavior: "smooth" }); }}>
            <span className="category-icon">{meta.icon}</span>
            <span><small>{meta.code} · {count.toLocaleString("ar-KW")}</small><b>{item}</b><em>{meta.blurb}</em></span>
            <i>↗</i>
          </button>;
        })}
      </section>

      {featured.length > 0 && <section className="featured-section" id="featured">
        <div className="section-title">
          <div><p className="section-index">01 / مختارات المحرر</p><h2>الأبرز الآن</h2></div>
          <p>فرص متنوعة من الخطة التدريبية الرسمية، اخترناها لسهولة المقارنة بين المجالات.</p>
        </div>
        <div className="featured-grid">
          {featured.map((item, index) => <article className="feature-card" key={item.id}>
            <img src={assetPath(item.image)} alt="" />
            <div className="feature-shade" />
            <div className="feature-top"><span>0{index + 1}</span><b>{kindLabels[item.kind]}</b></div>
            <div className="feature-copy">
              <small>{item.category} · {item.subcategory}</small>
              <h3>{item.title}</h3>
              <p>{item.duration} · {item.ageLabel}</p>
              <button type="button" onClick={() => setSelected(item)}>عرض التفاصيل <span>←</span></button>
            </div>
          </article>)}
        </div>
      </section>}

      <section className="catalog-section" id="catalog" ref={catalogRef}>
        <div className="section-title catalog-title">
          <div><p className="section-index">02 / الدليل الكامل</p><h2>الدورات والورش</h2></div>
          <button className="mobile-filter-button" type="button" onClick={() => setFiltersOpen(true)}>الفلاتر {activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button>
        </div>
        <div className="catalog-layout">
          <aside className={`filter-panel ${filtersOpen ? "open" : ""}`} aria-label="فلاتر الدورات">
            <div className="filter-mobile-head"><b>فلترة النتائج</b><button type="button" onClick={() => setFiltersOpen(false)}>×</button></div>
            <div className="filter-heading"><span>FILTER / 01</span><button type="button" onClick={clearFilters}>مسح الكل</button></div>
            <fieldset>
              <legend>المجال والتخصص</legend>
              <label className="select-label">المجال
                <select value={category} onChange={(event) => { setCategory(event.target.value); setSubcategory("الكل"); }}>
                  {categories.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="select-label">التخصص الدقيق
                <select value={subcategory} onChange={(event) => setSubcategory(event.target.value)}>
                  {subcategories.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </fieldset>
            <fieldset>
              <legend>الجهة المنظمة</legend>
              <select value={selectedOrganizer} onChange={(event) => setSelectedOrganizer(event.target.value)} aria-label="الجهة المنظمة">
                {organizers.map((item) => <option key={item}>{item}</option>)}
              </select>
            </fieldset>
            <fieldset>
              <legend>نوع الفرصة</legend>
              <div className="option-row">
                {([ ["all", "الكل"], ["course", "دورة"], ["workshop", "ورشة"], ["camp", "معسكر"] ] as const).map(([value, label]) => <button key={value} className={kind === value ? "active" : ""} type="button" onClick={() => setKind(value)}>{label}</button>)}
              </div>
            </fieldset>
            <fieldset>
              <legend>العمر المستهدف</legend>
              <div className="age-control">
                <div><b>{age === null ? "كل الأعمار" : `${age} سنة`}</b><button type="button" onClick={() => setAge(null)}>الكل</button></div>
                <input type="range" min="6" max="65" step="1" value={age ?? 25} onChange={(event) => setAge(Number(event.target.value))} aria-label="العمر" />
                <div className="range-labels"><span>6</span><span>18</span><span>35</span><span>65+</span></div>
                <div className="age-entry">
                  <label>اكتب العمر
                    <input type="number" min="6" max="65" inputMode="numeric" value={age ?? ""} placeholder="مثال: 14" onChange={(event) => setAge(event.target.value ? Math.min(65, Math.max(6, Number(event.target.value))) : null)} />
                  </label>
                  <div className="age-presets" aria-label="أعمار سريعة">
                    {[6, 10, 14, 18, 25].map((value) => <button key={value} className={age === value ? "active" : ""} type="button" onClick={() => setAge(value)}>{value}</button>)}
                  </div>
                </div>
                {age !== null && <small>تُخفى الفرص التي لم يعلن منظمها العمر لتفادي التخمين.</small>}
              </div>
            </fieldset>
            <fieldset>
              <legend>طريقة الحضور</legend>
              <label><input type="radio" name="mode" checked={mode === "all"} onChange={() => setMode("all")} /> الكل</label>
              <label><input type="radio" name="mode" checked={mode === "in_person"} onChange={() => setMode("in_person")} /> حضوري</label>
              <label><input type="radio" name="mode" checked={mode === "online"} onChange={() => setMode("online")} /> عن بُعد</label>
              <label><input type="radio" name="mode" checked={mode === "hybrid"} onChange={() => setMode("hybrid")} /> هجين</label>
            </fieldset>
            <fieldset>
              <legend>المحافظة</legend>
              <select value={governorate} onChange={(event) => setGovernorate(event.target.value)}>{governors.map((item) => <option key={item}>{item}</option>)}</select>
            </fieldset>
            <p className="auto-filter-note"><i /> التسجيل المنتهي يختفي تلقائيًا من النتائج.</p>
            <button className="apply-mobile" type="button" onClick={() => setFiltersOpen(false)}>عرض {filtered.length.toLocaleString("ar-KW")} نتيجة</button>
          </aside>
          {filtersOpen && <button className="filter-backdrop" type="button" aria-label="إغلاق الفلاتر" onClick={() => setFiltersOpen(false)} />}

          <div className="catalog-results">
            <div className="results-toolbar">
              <div><b>{filtered.length.toLocaleString("ar-KW")}</b> فرصة مطابقة {activeFilterCount > 0 && <span>· {activeFilterCount} فلاتر مفعّلة</span>}</div>
              <label>ترتيب <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="featured">الأبرز</option><option value="price">الأقل سعرًا</option><option value="title">أبجديًا</option></select></label>
            </div>
            <div className="active-filters">
              {category !== "الكل" && <button type="button" onClick={() => setCategory("الكل")}>{category} ×</button>}
              {subcategory !== "الكل" && <button type="button" onClick={() => setSubcategory("الكل")}>{subcategory} ×</button>}
              {selectedOrganizer !== "الكل" && <button type="button" onClick={() => setSelectedOrganizer("الكل")}>{selectedOrganizer} ×</button>}
              {kind !== "all" && <button type="button" onClick={() => setKind("all")}>{kindLabels[kind]} ×</button>}
              {mode !== "all" && <button type="button" onClick={() => setMode("all")}>{modeLabels[mode]} ×</button>}
              {governorate !== "الكل" && <button type="button" onClick={() => setGovernorate("الكل")}>{governorate} ×</button>}
              {age !== null && <button type="button" onClick={() => setAge(null)}>عمر {age} ×</button>}
              {query && <button type="button" onClick={() => setQuery("")}>«{query}» ×</button>}
            </div>
            {filtered.length ? <div className="course-grid">
              {filtered.map((item) => <article className="course-card" key={item.id}>
                <button className="course-image" type="button" onClick={() => setSelected(item)} aria-label={`عرض ${item.title}`}>
                  <img src={assetPath(item.image)} alt="" />
                  <span className={`course-status ${item.status}`}>{statusLabels[item.status]}</span>
                  <span className="course-kind">{kindLabels[item.kind]}</span>
                </button>
                <div className="course-body">
                  <div className="course-code"><span>{categoryMeta[item.category]?.code ?? "LEARN"}</span><b>{item.subcategory}</b></div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <dl>
                    <div><dt>العمر</dt><dd>{item.ageLabel}</dd></div>
                    <div><dt>المدة</dt><dd>{item.duration}</dd></div>
                    <div><dt>المكان</dt><dd>{modeLabels[item.mode]} · {item.location}</dd></div>
                    <div><dt>الرسوم</dt><dd>{priceLabel(item.priceKwd)}</dd></div>
                  </dl>
                  <div className="course-organizer"><span className="org-monogram">{organizerMark(item.organizer)}</span><span><small>الجهة المنظمة</small><b>{item.organizer}</b></span></div>
                  <div className={"course-confidence " + (item.aiReviewStatus === "verified" ? "ai-reviewed" : "")}>
                    <span>{aiReviewLabel(item)}</span>
                    <small>آخر مراجعة: {checkedLabel(item.aiReviewedAt ?? item.sourceCheckedAt)}</small>
                  </div>
                  <div className="course-actions">
                    <button type="button" onClick={() => setSelected(item)}>التفاصيل</button>
                    <a href={officialRegistrationDestination(item)} target="_blank" rel="noreferrer" aria-label={`افتح صفحة ${item.title} في موقع الجهة المنظمة`}>موقع الجهة للتسجيل <span>↗</span></a>
                  </div>
                </div>
              </article>)}
            </div> : <div className="empty-state" role="status"><span>⌁</span><h3>{dataMode === "connecting" ? "جارٍ التحقق من الفرص" : dataMode === "unavailable" ? "تعذّر التحقق من الدورات حاليًا" : "لا توجد فرص مؤكدة ومكتملة حاليًا"}</h3><p>{dataMode === "unavailable" ? "سنحاول الاتصال مجددًا تلقائيًا. لا نعرض بيانات قديمة أو غير مؤكدة أثناء التعذّر." : "تظهر الدورة أو الورشة هنا بعد إعلانها رسميًا واكتمال معلوماتها ومراجعتها، ما دام التسجيل متاحًا."}</p>{(activeFilterCount > 0 || query) && <button type="button" onClick={clearFilters}>مسح الفلاتر</button>}</div>}
          </div>
        </div>
      </section>

      <section className="source-section" id="sources">
        <div><p className="section-index">03 / كيف نتحقق؟</p><h2>المعلومة تبدأ من المصدر.</h2></div>
        <div className="source-steps">
          <article><span>01</span><h3>الإعلان الرسمي</h3><p>نعتمد موقع الجهة وحساباتها التي ثبتت رسميتها، مع رابط الإعلان الأصلي.</p></article>
          <article><span>02</span><h3>اكتمال ومراجعة</h3><p>نراجع الوصف والعمر والموعد والمكان والرسوم والرابط مقابل الإعلان. النقص أو التعارض يوقف النشر.</p></article>
          <article><span>03</span><h3>تسجيل متاح</h3><p>تظهر الفرص المكتملة فقط، وتختفي بعد إغلاق التسجيل أو بدء البرنامج.</p></article>
        </div>
        <div className="source-badges" aria-label="المصادر الأساسية"><span>KGBC</span><span>KFAS</span><span>KISR</span><span>SACGC</span></div>
        <p className="source-note">إذا لم تعلن الجهة فرصة مكتملة، لا نضيف لها بطاقات. مراجعة الذكاء الاصطناعي تدعم التحقق ولا تضمن خلو المصدر من الخطأ؛ راجع الإعلان الرسمي قبل التسجيل.</p>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark"><i /><i /><i /></span><span><b>مِرْصاد</b><small>ابحث. قارن. تعلّم.</small></span></div>
        <p>دليل مستقل يجمع فرص التعلّم في الكويت ويعيدك دائمًا إلى المصدر الرسمي.</p>
        <a href="#top">العودة للأعلى ↑</a>
      </footer>

      <button className="floating-bot" type="button" onClick={() => setBotOpen(true)}><span>✦</span><b>اسأل مِرصاد</b></button>

      {botOpen && <div className="bot-dialog" role="dialog" aria-modal="true" aria-label="مُرشد مِرصاد">
        <button className="dialog-backdrop" type="button" onClick={() => setBotOpen(false)} aria-label="إغلاق" />
        <section>
          <header><div className="mini-bot">✦</div><div><b>مُرشد مِرصاد</b><small><i /> جاهز للبحث</small></div><button type="button" onClick={() => setBotOpen(false)}>×</button></header>
          <div className="chat-body">
            <p className="bot-message">{botReply}</p>
            {currentBotResults.map((item) => <button className="bot-result" type="button" key={item.id} onClick={() => { setSelected(item); setBotOpen(false); }}><span><small>{item.category}</small><b>{item.title}</b></span><i>←</i></button>)}
            <div className="quick-prompts">
              {["عمري 16 وأحب التقنية", "أبي ورشة مهارات", "دورات هندسية حضورية"].map((prompt) => <button type="button" key={prompt} onClick={() => askBot(prompt)}>{prompt}</button>)}
            </div>
          </div>
          <form onSubmit={handleBotSubmit}><input autoFocus value={botText} onChange={(event) => setBotText(event.target.value)} placeholder="مثال: عمري 18 وأحب الروبوتات" /><button type="submit" aria-label="إرسال">←</button></form>
          <p className="bot-disclaimer">المرشد يبحث في بيانات الدليل الحالية ولا يضمن توفر المقاعد.</p>
        </section>
      </div>}

      {selected && <div className="detail-dialog" role="dialog" aria-modal="true" aria-label={`تفاصيل ${selected.title}`}>
        <button className="dialog-backdrop" type="button" onClick={() => setSelected(null)} aria-label="إغلاق" />
        <article>
          <button className="detail-close" type="button" onClick={() => setSelected(null)}>×</button>
          <div className="detail-image"><img src={assetPath(selected.image)} alt="" /><span className={`course-status ${selected.status}`}>{statusLabels[selected.status]}</span></div>
          <div className="detail-content">
            <p className="course-code"><span>{categoryMeta[selected.category]?.code ?? "LEARN"}</span><b>{selected.category} / {selected.subcategory}</b></p>
            <h2>{selected.title}</h2>
            {selected.titleEn && <p className="english-title" dir="ltr">{selected.titleEn}</p>}
            <p className="detail-description">{selected.description}</p>
            <dl>
              <div><dt>الجهة</dt><dd>{selected.organizer}</dd></div>
              <div><dt>العمر</dt><dd>{selected.ageLabel}</dd></div>
              <div><dt>المدة</dt><dd>{selected.duration}</dd></div>
              <div><dt>الموعد</dt><dd>{selected.schedule}</dd></div>
              <div><dt>المكان</dt><dd>{selected.location} · {modeLabels[selected.mode]}</dd></div>
              <div><dt>الرسوم</dt><dd>{priceLabel(selected.priceKwd)}</dd></div>
            </dl>
            <div className="tag-list">{selected.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
            <div className="verification-note"><span>✓</span><p><b>آخر تحقق من المصدر: {checkedLabel(selected.sourceCheckedAt)}</b><small>{selected.aiReviewStatus === "verified" && selected.aiReviewedAt ? "راجعه الذكاء الاصطناعي بتاريخ " + checkedLabel(selected.aiReviewedAt) + ". " : ""}زر التسجيل يفتح موقع الجهة المنظمة فقط، ولا يحوّلك مِرصاد إلى نموذج خارجي مباشرة.</small></p></div>
            <div className="detail-actions"><a className="primary-link" href={officialRegistrationDestination(selected)} target="_blank" rel="noreferrer">افتح صفحة التسجيل في موقع الجهة ↗</a><a href={officialSourceDestination(selected)} target="_blank" rel="noreferrer">عرض المصدر</a></div>
          </div>
        </article>
      </div>}
    </main>
  );
}
