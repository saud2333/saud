"use client";

/* eslint-disable @next/next/no-img-element -- static export and user-controlled source images require ordinary img elements. */

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "../lib/supabase";
import { emptyCatalogMode } from "../lib/catalog-status.mjs";
import {
  ageLabel,
  aiReviewLabel,
  categoryBlurb,
  categoryLabel,
  checkedLabel,
  kindLabel,
  localizedText,
  modeLabel,
  opportunityTitle,
  priceLabel,
  statusLabel,
  type SiteLanguage,
  uiCopy,
} from "../lib/mirsad-i18n";
import {
  categories,
  categoryMeta,
  type LearningOpportunity,
  type OpportunityKind,
  type OpportunityMode,
} from "../data/opportunities";

type DataMode = "connecting" | "live" | "unavailable" | "setup_required" | "awaiting_sync";
type SortMode = "featured" | "price" | "title";
type SourceState = { name: string; website_url: string; last_synced_at: string | null; last_sync_status: string | null; parser_key: string | null };
const monitoredOrganizers = ["كودد — CODED", "مؤسسة الكويت للتقدم العلمي — KFAS"];
const retiredOrganizerPattern = /KGBC|المباني الخضراء|KISR|الأبحاث العلمية|SACGC|صباح الأحمد/i;

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

function assetPath(path: string) {
  const verifiedMirror = "https://saud2333.github.io/saud/verified/";
  if (path.startsWith(verifiedMirror)) path = "/verified/" + path.slice(verifiedMirror.length);
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
    ageLabel: row.min_age == null && row.max_age == null ? "غير معلن من الجهة" : asString(row.age_label, "غير معلن من الجهة"),
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
    imageCaption: asString(row.image_caption) || undefined,
    featured: Boolean(row.featured),
    sourceCheckedAt: asString(row.source_checked_at, "2026-09-04"),
    aiReviewStatus: ["pending", "verified", "needs_review", "unavailable"].includes(asString(row.ai_review_status))
      ? asString(row.ai_review_status) as LearningOpportunity["aiReviewStatus"]
      : undefined,
    aiReviewedAt: asString(row.ai_reviewed_at) || null,
    aiReviewNote: asString(row.ai_review_note) || null,
    aiReviewModel: asString(row.ai_review_model) || null,
    verificationMethod: asString(row.verification_method, "ai"),
    verifiedAt: asString(row.verified_at) || null,
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

function organizerMark(organizer: string) {
  if (/CODED|كودد/i.test(organizer)) return "CODED";
  if (/KFAS|التقدم العلمي/i.test(organizer)) return "KFAS";
  if (/جامعة الكويت/.test(organizer)) return "KU";
  return "KW";
}

const officialRegistrationPortals = [
  { organizer: /CODED|كودد/i, domains: ["coded.kw"], landing: "https://coded.kw/companies/programs" },
  { organizer: /KFAS|التقدم العلمي/i, domains: ["kfas.org.kw"], landing: "https://apply.kfas.org.kw/" },
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
  return !retiredOrganizerPattern.test(item.organizer)
    && item.status === "open" && (item.aiReviewStatus === "verified" || item.verificationMethod === "official_source")
    && Boolean(item.registrationEndsAt && Date.parse(item.registrationEndsAt) > now)
    && Boolean(item.startsAt && Date.parse(item.startsAt) > now);
}

export default function KuwaitCoursesApp() {
  const [opportunities, setOpportunities] = useState<LearningOpportunity[]>([]);
  const [dataMode, setDataMode] = useState<DataMode>("connecting");
  const [sourceStates, setSourceStates] = useState<SourceState[]>([]);
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
  const [language, setLanguage] = useState<SiteLanguage>("ar");
  const [botOpen, setBotOpen] = useState(false);
  const [botText, setBotText] = useState("");
  const [botReplyMode, setBotReplyMode] = useState<"intro" | "found" | "empty">("intro");
  const [botResults, setBotResults] = useState<LearningOpportunity[]>([]);
  const [clock, setClock] = useState(() => Date.now());
  const catalogRef = useRef<HTMLElement>(null);
  const copy = uiCopy[language];
  const locale = language === "ar" ? "ar-KW" : "en-KW";
  const directionArrow = language === "ar" ? "←" : "→";

  useEffect(() => {
    const saved = window.localStorage.getItem("mirsad-theme");
    const preferred = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    const savedLanguage = window.localStorage.getItem("mirsad-language") === "en" ? "en" : "ar";
    const timer = window.setTimeout(() => { setTheme(preferred); setLanguage(savedLanguage); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.language = language;
  }, [language]);

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
        .or("ai_review_status.eq.verified,verification_method.eq.official_source")
        .eq("publication_ready", true)
        .gt("registration_ends_at", new Date().toISOString())
        .gt("last_seen_at", new Date(Date.now() - 24 * 60 * 60_000).toISOString())
        .order("featured", { ascending: false })
        .order("source_checked_at", { ascending: false })
        .limit(200);
      if (!active) return;
      if (!error) {
        const { data: sources, error: sourceError } = await client.from("learning_sources").select("name,website_url,last_synced_at,last_sync_status,parser_key").eq("is_active", true);
        if (!active) return;
        setSourceStates(sourceError ? [] : (sources ?? []) as SourceState[]);
        const liveItems = (data ?? []).map((row) => fromSupabaseRow(row as Record<string, unknown>));
        setOpportunities(liveItems);
        if (liveItems.length) setDataMode("live");
        else {
          setDataMode(sourceError ? "unavailable" : emptyCatalogMode(sources));
        }
      } else {
        setOpportunities([]);
        setDataMode(["PGRST205", "PGRST204"].includes(error.code) ? "setup_required" : "unavailable");
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
    return ["الكل", ...Array.from(new Set(candidates.map((item) => item.subcategory))).sort((a, b) => localizedText(a, language).localeCompare(localizedText(b, language), language))];
  }, [activeOpportunities, category, language]);
  const organizers = useMemo(
    () => ["الكل", ...Array.from(new Set([...monitoredOrganizers, ...activeOpportunities.map((item) => item.organizer)])).sort((a, b) => localizedText(a, language).localeCompare(localizedText(b, language), language))],
    [activeOpportunities, language],
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
        if (sort === "title") return opportunityTitle(a, language).localeCompare(opportunityTitle(b, language), language);
        return Number(b.featured) - Number(a.featured);
      });
  }, [activeOpportunities, age, category, governorate, kind, language, mode, query, selectedOrganizer, sort, subcategory]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: "filter_learning_opportunities",
        title: language === "ar" ? "فلترة فرص التعلّم" : "Filter learning opportunities",
        description: language === "ar" ? "يطبّق البحث والمجال والعمر على دليل دورات وورش الكويت الظاهر في الصفحة." : "Applies search, field and age filters to the visible Kuwait learning directory.",
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
  }, [language]);

  const curated = activeOpportunities.filter((item) => item.featured);
  const featured = (curated.length ? curated : [...activeOpportunities].sort((a, b) => Date.parse(a.registrationEndsAt!) - Date.parse(b.registrationEndsAt!))).slice(0, 3);
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

  function setSiteLanguage(next: SiteLanguage) {
    setLanguage(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    localStorage.setItem("mirsad-language", next);
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
    if (/ذكاء|برمج|روبوت|تقني|\bai\b|artificial intelligence|program|coding|robot|tech/i.test(prompt)) nextCategory = "التقنية والذكاء الاصطناعي";
    else if (/هندس|طاقة|كهرب|مدني|engineer|energy|electrical|civil/i.test(prompt)) nextCategory = "الهندسة والطاقة";
    else if (/صحة|إسعاف|سلامة|health|first aid|safety/i.test(prompt)) nextCategory = "الصحة والسلامة";
    else if (/فن|خزف|إبداع|تصميم|art|pottery|creative|design/i.test(prompt)) nextCategory = "الفنون والإبداع";
    else if (/إدارة|مهار|عرض|كتابة|business|management|skill|leadership|writing/i.test(prompt)) nextCategory = "الأعمال والمهارات";
    if (/ورشة|workshop/i.test(prompt)) nextKind = "workshop";
    if (/معسكر|bootcamp|camp/i.test(prompt)) nextKind = "camp";
    if (/أونلاين|اونلاين|عن بعد|online|remote/i.test(prompt)) nextMode = "online";
    if (/حضوري|in[ -]?person|onsite/i.test(prompt)) nextMode = "in_person";
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
    setBotReplyMode(matches.length ? "found" : "empty");
  }

  function handleBotSubmit(event: FormEvent) {
    event.preventDefault();
    askBot(botText);
  }

  const botReply = botReplyMode === "intro"
    ? copy.botIntro
    : botReplyMode === "found"
      ? copy.botFound.replace("{count}", currentBotResults.length.toLocaleString(locale))
      : copy.botNoMatch;

  return (
    <main className="mirsad-shell" lang={language} dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="site-header">
        <a className="brand" href="#top" aria-label={copy.homeAria}>
          <img className="mirsad-mark" src={assetPath("/mirsad-mark.svg")} width="44" height="44" alt="" />
          <span><b>{copy.brand}</b><small>{copy.brandSubtitle}</small></span>
        </a>
        <nav aria-label={copy.mainNav}>
          <a href="#featured">{copy.featuredNav}</a>
          <a href="#catalog">{copy.catalogNav}</a>
          <a href="#sources">{copy.sourcesNav}</a>
        </nav>
        <div className="header-actions">
          <span className={`sync-state ${dataMode}`}><i />{dataMode === "live" ? copy.syncLive : dataMode === "connecting" ? copy.syncConnecting : dataMode === "setup_required" ? copy.syncSetup : dataMode === "awaiting_sync" ? copy.syncAwaiting : copy.syncUnavailable}</span>
          <button className="language-toggle" type="button" aria-label={copy.languageAria} onClick={() => setSiteLanguage(language === "ar" ? "en" : "ar")}>{copy.languageLabel}</button>
          <button className="theme-toggle" type="button" aria-label={theme === "light" ? copy.darkMode : copy.lightMode} onClick={() => setSiteTheme(theme === "light" ? "dark" : "light")}>
            <span>{theme === "light" ? "☾" : "☀"}</span>
          </button>
        </div>
      </header>

      <section className="discovery-hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-content">
          <p className="kicker"><span>{copy.kicker}</span></p>
          <h1>{copy.heroTitle}<br /><em>{copy.heroAccent}</em></h1>
          <p className="hero-copy">{copy.heroCopy}</p>
          <div className="hero-search" role="search">
            <span className="search-icon">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} aria-label={copy.searchAria} />
            {query && <button type="button" onClick={() => setQuery("")} aria-label={copy.clearSearch}>×</button>}
            <button className="search-submit" type="button" onClick={() => catalogRef.current?.scrollIntoView({ behavior: "smooth" })}>{copy.search}</button>
          </div>
          <div className="hero-notes">
            <span><b>{dataMode === "live" ? activeOpportunities.length.toLocaleString(locale) : "—"}</b> {dataMode === "live" ? copy.availableNow : copy.notVerified}</span>
            <span><b>{new Set(activeOpportunities.map((item) => item.category)).size.toLocaleString(locale)}</b> {copy.fields}</span>
            <span><b>{copy.automatic}</b> {copy.expiredHidden}</span>
          </div>
        </div>
        <aside className="bot-preview">
          <img src={assetPath("/courses-tech.png")} alt={copy.heroImageAlt} />
          <div className="bot-orbit"><i /><i /><span>✦</span></div>
          <div className="bot-card-copy"><div><small>{copy.guide}</small><h2>{copy.guideQuestion}</h2><p>{copy.guideCopy}</p></div><button type="button" onClick={() => setBotOpen(true)}>{copy.askGuide} <span>{directionArrow}</span></button></div>
        </aside>
      </section>

      <section className="category-strip" aria-label={copy.learningFields}>
        {categories.slice(1).map((item) => {
          const meta = categoryMeta[item];
          const count = activeOpportunities.filter((opportunity) => opportunity.category === item).length;
          return <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => { setCategory(item); setSubcategory("الكل"); catalogRef.current?.scrollIntoView({ behavior: "smooth" }); }}>
            <span className="category-icon">{meta.icon}</span>
            <span><small>{meta.code} · {count.toLocaleString(locale)}</small><b>{categoryLabel(item, language)}</b><em>{categoryBlurb(item, meta.blurb, language)}</em></span>
            <i>↗</i>
          </button>;
        })}
      </section>

      {featured.length > 0 && <section className="featured-section" id="featured">
        <div className="section-title">
          <div><p className="section-index">01 / {curated.length ? copy.selectedOpportunities : copy.beforeClosing}</p><h2>{curated.length ? copy.highlightedNow : copy.closingSoon}</h2></div>
          <p>{curated.length ? copy.curatedDescription : copy.closingDescription}</p>
        </div>
        <div className="featured-grid">
          {featured.map((item, index) => <article className="feature-card" key={item.id}>
            <img src={assetPath(item.image)} alt={item.imageCaption ?? ""} className={item.imageCaption ? "provider-logo" : undefined} />
            <div className="feature-shade" />
            <div className="feature-top"><span>0{index + 1}</span><b>{kindLabel(item.kind, language)}</b></div>
            <div className="feature-copy">
              <small>{categoryLabel(item.category, language)} · {localizedText(item.subcategory, language)}</small>
              <h3 dir="auto">{opportunityTitle(item, language)}</h3>
              <p dir="auto">{localizedText(item.duration, language)} · {ageLabel(item, language)}</p>
              <button type="button" onClick={() => setSelected(item)}>{copy.viewDetails} <span>{directionArrow}</span></button>
            </div>
          </article>)}
        </div>
      </section>}

      <section className="catalog-section" id="catalog" ref={catalogRef}>
        {activeOpportunities.some((item) => item.aiReviewModel === "codex-interactive") && <p className="catalog-language-note">{copy.initialReviewNote}</p>}
        {language === "en" && <p className="catalog-language-note">{copy.officialLanguageNote}</p>}
        <div className="section-title catalog-title">
          <div><p className="section-index">02 / {copy.fullDirectory}</p><h2>{copy.coursesAndWorkshops}</h2></div>
          <button className="mobile-filter-button" type="button" onClick={() => setFiltersOpen(true)}>{copy.filters} {activeFilterCount > 0 && <b>{activeFilterCount.toLocaleString(locale)}</b>}</button>
        </div>
        <div className="catalog-layout">
          <aside className={`filter-panel ${filtersOpen ? "open" : ""}`} aria-label={copy.courseFilters}>
            <div className="filter-mobile-head"><b>{copy.filterResults}</b><button type="button" onClick={() => setFiltersOpen(false)} aria-label={copy.close}>×</button></div>
            <div className="filter-heading"><span>FILTER / 01</span><button type="button" onClick={clearFilters}>{copy.clearAll}</button></div>
            <fieldset>
              <legend>{copy.fieldAndSpecialty}</legend>
              <label className="select-label">{copy.field}
                <select value={category} onChange={(event) => { setCategory(event.target.value); setSubcategory("الكل"); }}>
                  {categories.map((item) => <option value={item} key={item}>{categoryLabel(item, language)}</option>)}
                </select>
              </label>
              <label className="select-label">{copy.exactSpecialty}
                <select value={subcategory} onChange={(event) => setSubcategory(event.target.value)}>
                  {subcategories.map((item) => <option value={item} key={item}>{localizedText(item, language)}</option>)}
                </select>
              </label>
            </fieldset>
            <fieldset>
              <legend>{copy.organizer}</legend>
              <select value={selectedOrganizer} onChange={(event) => setSelectedOrganizer(event.target.value)} aria-label={copy.organizer}>
                {organizers.map((item) => <option value={item} key={item}>{localizedText(item, language)}</option>)}
              </select>
            </fieldset>
            <fieldset>
              <legend>{copy.opportunityType}</legend>
              <div className="option-row">
                {(["all", "course", "workshop", "camp"] as const).map((value) => <button key={value} className={kind === value ? "active" : ""} type="button" onClick={() => setKind(value)}>{value === "all" ? copy.all : kindLabel(value, language)}</button>)}
              </div>
            </fieldset>
            <fieldset>
              <legend>{copy.targetAge}</legend>
              <div className="age-control">
                <div><b>{age === null ? copy.allAges : `${age.toLocaleString(locale)} ${copy.years}`}</b><button type="button" onClick={() => setAge(null)}>{copy.all}</button></div>
                <input type="range" min="6" max="65" step="1" value={age ?? 25} onChange={(event) => setAge(Number(event.target.value))} aria-label={copy.age} />
                <div className="range-labels"><span>6</span><span>18</span><span>35</span><span>65+</span></div>
                <div className="age-entry">
                  <label>{copy.enterAge}
                    <input type="number" min="6" max="65" inputMode="numeric" value={age ?? ""} placeholder={copy.ageExample} onChange={(event) => setAge(event.target.value ? Math.min(65, Math.max(6, Number(event.target.value))) : null)} />
                  </label>
                  <div className="age-presets" aria-label={copy.quickAges}>
                    {[6, 10, 14, 18, 25].map((value) => <button key={value} className={age === value ? "active" : ""} type="button" onClick={() => setAge(value)}>{value}</button>)}
                  </div>
                </div>
                {age !== null && <small>{copy.unknownAgeHidden}</small>}
              </div>
            </fieldset>
            <fieldset>
              <legend>{copy.attendance}</legend>
              <label><input type="radio" name="mode" checked={mode === "all"} onChange={() => setMode("all")} /> {copy.all}</label>
              <label><input type="radio" name="mode" checked={mode === "in_person"} onChange={() => setMode("in_person")} /> {modeLabel("in_person", language)}</label>
              <label><input type="radio" name="mode" checked={mode === "online"} onChange={() => setMode("online")} /> {modeLabel("online", language)}</label>
              <label><input type="radio" name="mode" checked={mode === "hybrid"} onChange={() => setMode("hybrid")} /> {modeLabel("hybrid", language)}</label>
            </fieldset>
            <fieldset>
              <legend>{copy.governorate}</legend>
              <select value={governorate} onChange={(event) => setGovernorate(event.target.value)}>{governors.map((item) => <option value={item} key={item}>{localizedText(item, language)}</option>)}</select>
            </fieldset>
            <p className="auto-filter-note"><i /> {copy.expiredAutoHidden}</p>
            <button className="apply-mobile" type="button" onClick={() => setFiltersOpen(false)}>{copy.show} {filtered.length.toLocaleString(locale)} {copy.result}</button>
          </aside>
          {filtersOpen && <button className="filter-backdrop" type="button" aria-label={copy.close} onClick={() => setFiltersOpen(false)} />}

          <div className="catalog-results">
            <div className="results-toolbar">
              <div><b>{dataMode === "live" ? filtered.length.toLocaleString(locale) : "—"}</b> {copy.matching} {activeFilterCount > 0 && <span>· {activeFilterCount.toLocaleString(locale)} {copy.activeFilters}</span>}</div>
              <label>{copy.sort} <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="featured">{copy.sortFeatured}</option><option value="price">{copy.sortPrice}</option><option value="title">{copy.sortTitle}</option></select></label>
            </div>
            <div className="active-filters">
              {category !== "الكل" && <button type="button" onClick={() => setCategory("الكل")}>{categoryLabel(category, language)} ×</button>}
              {subcategory !== "الكل" && <button type="button" onClick={() => setSubcategory("الكل")}>{localizedText(subcategory, language)} ×</button>}
              {selectedOrganizer !== "الكل" && <button type="button" onClick={() => setSelectedOrganizer("الكل")}>{localizedText(selectedOrganizer, language)} ×</button>}
              {kind !== "all" && <button type="button" onClick={() => setKind("all")}>{kindLabel(kind, language)} ×</button>}
              {mode !== "all" && <button type="button" onClick={() => setMode("all")}>{modeLabel(mode, language)} ×</button>}
              {governorate !== "الكل" && <button type="button" onClick={() => setGovernorate("الكل")}>{localizedText(governorate, language)} ×</button>}
              {age !== null && <button type="button" onClick={() => setAge(null)}>{copy.age} {age.toLocaleString(locale)} ×</button>}
              {query && <button type="button" onClick={() => setQuery("")}>«{query}» ×</button>}
            </div>
            {filtered.length ? <div className="course-grid">
              {filtered.map((item) => <article className="course-card" key={item.id}>
                <button className="course-image" type="button" onClick={() => setSelected(item)} aria-label={`${copy.viewCourse} ${opportunityTitle(item, language)}`}>
                  <img src={assetPath(item.image)} alt={item.imageCaption ?? ""} className={item.imageCaption ? "provider-logo" : undefined} />
                  {item.imageCaption && <small className="image-caption">{item.imageCaption}</small>}
                  <span className={`course-status ${item.status}`}>{statusLabel(item.status, language)}</span>
                  <span className="course-kind">{kindLabel(item.kind, language)}</span>
                </button>
                <div className="course-body">
                  <div className="course-code"><span>{categoryMeta[item.category]?.code ?? "LEARN"}</span><b>{localizedText(item.subcategory, language)}</b></div>
                  <h3 dir="auto">{opportunityTitle(item, language)}</h3>
                  <p dir="auto">{item.description}</p>
                  <dl>
                    <div><dt>{copy.age}</dt><dd>{ageLabel(item, language)}</dd></div>
                    <div><dt>{copy.duration}</dt><dd dir="auto">{localizedText(item.duration, language)}</dd></div>
                    <div><dt>{copy.location}</dt><dd dir="auto">{modeLabel(item.mode, language)} · {localizedText(item.location, language)}</dd></div>
                    <div><dt>{copy.fees}</dt><dd>{priceLabel(item.priceKwd, language)}</dd></div>
                  </dl>
                  <div className="course-organizer"><span className="org-monogram">{organizerMark(item.organizer)}</span><span><small>{copy.organizer}</small><b>{localizedText(item.organizer, language)}</b></span></div>
                  <div className={"course-confidence " + (item.aiReviewStatus === "verified" ? "ai-reviewed" : "")}>
                    <span>{aiReviewLabel(item, language)}</span>
                    <small>{copy.lastCheck}: {checkedLabel(item.verifiedAt ?? item.aiReviewedAt ?? item.sourceCheckedAt, language)}</small>
                  </div>
                  <div className="course-actions">
                    <button type="button" onClick={() => setSelected(item)}>{copy.details}</button>
                    <a href={officialRegistrationDestination(item)} target="_blank" rel="noreferrer" aria-label={`${copy.openOfficialRegistration}: ${opportunityTitle(item, language)}`}>{copy.officialRegistration} <span>↗</span></a>
                  </div>
                </div>
              </article>)}
            </div> : <div className="empty-state" role="status"><span>⌁</span><h3>{dataMode === "setup_required" ? copy.emptySetup : dataMode === "awaiting_sync" ? copy.emptyAwaiting : dataMode === "connecting" ? copy.emptyConnecting : dataMode === "unavailable" ? copy.emptyUnavailable : copy.emptyNoMatches}</h3><p>{dataMode === "setup_required" ? copy.emptySetupCopy : dataMode === "awaiting_sync" ? copy.emptyAwaitingCopy : dataMode === "unavailable" ? copy.emptyUnavailableCopy : copy.emptyNoMatchesCopy}</p>{(activeFilterCount > 0 || query) && <button type="button" onClick={clearFilters}>{copy.clearFilters}</button>}</div>}
          </div>
        </div>
      </section>

      <section className="source-section" id="sources">
        <div><p className="section-index">03 / {copy.howVerify}</p><h2>{copy.sourceFirst}</h2></div>
        <div className="source-steps">
          <article><span>01</span><h3>{copy.everyHalfHour}</h3><p>{copy.everyHalfHourCopy}</p></article>
          <article><span>02</span><h3>{copy.noGuessing}</h3><p>{copy.noGuessingCopy}</p></article>
          <article><span>03</span><h3>{copy.registrationOpen}</h3><p>{copy.registrationOpenCopy}</p></article>
        </div>
        <div className="source-badges" aria-label={copy.primarySources}><span>CODED</span><span>KFAS</span></div>
        <div className="source-health" aria-label={copy.sourceHealth}>
          {monitoredOrganizers.map(name => {
            const source = sourceStates.find(item => item.name === name);
            const recent = source?.last_synced_at && Date.parse(source.last_synced_at) > clock - 90 * 60_000;
            const automatic = source?.parser_key === "official-parser-v1";
            return <article key={name}><b>{localizedText(name, language)}</b><span>{!source?.last_synced_at ? copy.firstCheckPending : !recent ? copy.staleCheck : source.last_sync_status === "failed" ? copy.sourceFailed : source.last_sync_status === "partial" ? copy.sourcePartial : automatic ? copy.automaticCheckDone : copy.reviewedOnAdd}</span>
              <small>{source?.last_synced_at ? checkedLabel(source.last_synced_at, language, true) : copy.noCheckTime}</small></article>;
          })}
        </div>
        <p className="source-note">{copy.sourceNoteOne}</p>
        <p className="source-note">{copy.sourceNoteTwo}</p>
      </section>

      <footer>
        <div className="brand footer-brand"><img className="mirsad-mark" src={assetPath("/mirsad-mark.svg")} width="36" height="36" alt="" /><span><b>{copy.brand}</b><small>{copy.footerTag}</small></span></div>
        <p>{copy.footerCopy}</p>
        <a href="#top">{copy.backToTop}</a>
      </footer>

      <button className="floating-bot" type="button" onClick={() => setBotOpen(true)}><span>✦</span><b>{copy.askMirsad}</b></button>

      {botOpen && <div className="bot-dialog" role="dialog" aria-modal="true" aria-label={copy.assistantAria}>
        <button className="dialog-backdrop" type="button" onClick={() => setBotOpen(false)} aria-label={copy.close} />
        <section>
          <header><div className="mini-bot">✦</div><div><b>{copy.guide}</b><small><i /> {copy.ready}</small></div><button type="button" aria-label={copy.close} onClick={() => setBotOpen(false)}>×</button></header>
          <div className="chat-body">
            <p className="bot-message">{botReply}</p>
            {currentBotResults.map((item) => <button className="bot-result" type="button" key={item.id} onClick={() => { setSelected(item); setBotOpen(false); }}><span><small>{categoryLabel(item.category, language)}</small><b dir="auto">{opportunityTitle(item, language)}</b></span><i>{directionArrow}</i></button>)}
            <div className="quick-prompts">
              {copy.quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => askBot(prompt)}>{prompt}</button>)}
            </div>
          </div>
          <form onSubmit={handleBotSubmit}><input autoFocus value={botText} onChange={(event) => setBotText(event.target.value)} placeholder={copy.botPlaceholder} /><button type="submit" aria-label={copy.send}>{directionArrow}</button></form>
          <p className="bot-disclaimer">{copy.botDisclaimer}</p>
        </section>
      </div>}

      {selected && <div className="detail-dialog" role="dialog" aria-modal="true" aria-label={`${copy.detailAria} ${opportunityTitle(selected, language)}`}>
        <button className="dialog-backdrop" type="button" onClick={() => setSelected(null)} aria-label={copy.close} />
        <article>
          <button className="detail-close" type="button" aria-label={copy.close} onClick={() => setSelected(null)}>×</button>
          <div className="detail-image"><img src={assetPath(selected.image)} alt={selected.imageCaption ?? ""} className={selected.imageCaption ? "provider-logo" : undefined} /><span className={`course-status ${selected.status}`}>{statusLabel(selected.status, language)}</span>{selected.imageCaption && <small className="image-caption">{selected.imageCaption}</small>}</div>
          <div className="detail-content">
            <p className="course-code"><span>{categoryMeta[selected.category]?.code ?? "LEARN"}</span><b>{categoryLabel(selected.category, language)} / {localizedText(selected.subcategory, language)}</b></p>
            <h2 dir="auto">{opportunityTitle(selected, language)}</h2>
            {language === "ar" && selected.titleEn && <p className="english-title" dir="ltr">{selected.titleEn}</p>}
            <p className="detail-description" dir="auto">{selected.description}</p>
            <dl>
              <div><dt>{copy.organizer}</dt><dd>{localizedText(selected.organizer, language)}</dd></div>
              <div><dt>{copy.age}</dt><dd>{ageLabel(selected, language)}</dd></div>
              <div><dt>{copy.duration}</dt><dd dir="auto">{localizedText(selected.duration, language)}</dd></div>
              <div><dt>{language === "ar" ? "الموعد" : "Schedule"}</dt><dd dir="auto">{localizedText(selected.schedule, language)}</dd></div>
              <div><dt>{copy.location}</dt><dd dir="auto">{localizedText(selected.location, language)} · {modeLabel(selected.mode, language)}</dd></div>
              <div><dt>{copy.fees}</dt><dd>{priceLabel(selected.priceKwd, language)}</dd></div>
            </dl>
            <div className="tag-list">{selected.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
            <div className="verification-note"><span>✓</span><p><b>{copy.verifiedAt}: {checkedLabel(selected.sourceCheckedAt, language)}</b><small>{selected.verificationMethod === "official_source" ? copy.officialBotReview : selected.aiReviewModel === "codex-interactive" ? copy.interactiveReview : selected.aiReviewStatus === "verified" && selected.aiReviewedAt ? copy.aiReviewed.replace("{date}", checkedLabel(selected.aiReviewedAt, language)) : ""}{copy.registrationDisclaimer}</small></p></div>
            <div className="detail-actions"><a className="primary-link" href={officialRegistrationDestination(selected)} target="_blank" rel="noreferrer">{copy.openRegistration}</a><a href={officialSourceDestination(selected)} target="_blank" rel="noreferrer">{copy.viewSource}</a></div>
          </div>
        </article>
      </div>}
    </main>
  );
}
