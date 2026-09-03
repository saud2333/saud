"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Language } from "./CivilApp";
import { appHref, isGitHubPagesRuntime } from "../lib/runtime";
import { getSupabaseClient } from "../lib/supabase";

type ChatMessage = { role: "user" | "assistant"; content: string; createdAt: string; sources?: Array<{ label: string; url: string }> };
type SavedConversation = { id: number | string; discipline: string; transcript: ChatMessage[]; updatedAt: string };
type ProviderState = "checking" | "live" | "fallback";

const disciplines = [
  { id: "Construction AI", icon: "▥", ar: "البناء", en: "Construction", descriptionAr: "تخطيط المنزل والمراحل والتكلفة", descriptionEn: "Home planning, stages, and cost" },
  { id: "Structural AI", icon: "⌗", ar: "إنشائي", en: "Structural", descriptionAr: "مدخلات وأحمال وفحوص أولية", descriptionEn: "Inputs, loads, and preliminary checks" },
  { id: "Water AI", icon: "≈", ar: "المياه", en: "Water", descriptionAr: "الطلب والخزانات والأنابيب", descriptionEn: "Demand, tanks, and pipes" },
  { id: "Roads AI", icon: "⌁", ar: "الطرق", en: "Roads", descriptionAr: "الرصف والمرور والتصريف", descriptionEn: "Pavement, traffic, and drainage" },
  { id: "Materials AI", icon: "▦", ar: "المواد", en: "Materials", descriptionAr: "المواصفات والجودة والمقارنة", descriptionEn: "Specifications, quality, comparison" },
  { id: "BOQ AI", icon: "Σ", ar: "الكميات", en: "BOQ", descriptionAr: "مراجعة البنود والوحدات", descriptionEn: "Items and unit review" },
];

const prompts = {
  ar: ["ما البيانات المطلوبة لتقدير بناء بيت؟", "كيف أقارن عرضي مواد بالمواصفة نفسها؟", "أنشئ قائمة تدقيق لصب بلاطة", "ما المعلومات اللازمة لحساب خزان؟"],
  en: ["What inputs are needed for a house estimate?", "How do I compare same-spec material quotes?", "Create a slab-pour checklist", "What data is needed to size a tank?"],
};

const sourceGroups = {
  construction: [
    { label: "بلدية الكويت", url: "https://baladia.gov.kw/" },
    { label: "المؤسسة العامة للرعاية السكنية", url: "https://www.pahw.gov.kw/" },
    { label: "متجر المواصفات الكويتية", url: "https://ksm.pai.gov.kw/ar/Pages/SearchStandards.aspx" },
  ],
  water: [
    { label: "وزارة الكهرباء والماء والطاقة المتجددة", url: "https://www.mew.gov.kw/ar/services-menu/services/" },
    { label: "وزارة الأشغال العامة", url: "https://www.mpw.gov.kw/" },
  ],
  roads: [
    { label: "وزارة الأشغال العامة", url: "https://www.mpw.gov.kw/" },
    { label: "مختبرات الجودة — الهيئة العامة للصناعة", url: "https://pai.gov.kw/quality-labs-directory" },
  ],
  materials: [
    { label: "متجر المواصفات الكويتية", url: "https://ksm.pai.gov.kw/ar/Pages/SearchStandards.aspx" },
    { label: "قطاع المواصفات والخدمات الصناعية", url: "https://pai.gov.kw/en/industrial-standards-and-services-sector" },
  ],
};

const safeGuidance: Record<string, { ar: string; en: string; source: keyof typeof sourceGroups }> = {
  "Construction AI": { ar: "قبل التقدير أحتاج مساحة البناء الصافية، عدد الأدوار، المنطقة، وجود سرداب أو مصعد، مستوى التشطيب، ومصدر معدل التكلفة وتاريخه.", en: "Before estimating, provide net built area, floor count, location, basement or lift requirements, finish level, and the source and date of your cost rate.", source: "construction" },
  "Structural AI": { ar: "قبل أي حساب إنشائي أحتاج النظام الإنشائي، الأبعاد، الأحمال، مقاومات المواد، تقرير التربة، والكود المعتمد. يلزم اعتماد مهندس إنشائي مرخص.", en: "Before structural calculation, provide the structural system, dimensions, loads, material strengths, soil report, and governing code. A licensed structural engineer must approve the result.", source: "construction" },
  "Water AI": { ar: "أحتاج عدد المستخدمين أو الوحدات، نمط الطلب، ساعات التخزين، المناسيب، الضغط المتاح، ومادة وقطر وطول الأنبوب قبل الحساب.", en: "Provide occupants or units, demand pattern, storage hours, elevations, available pressure, pipe material, diameter, and length before calculation.", source: "water" },
  "Roads AI": { ar: "أحتاج AADT، نسبة المركبات الثقيلة، النمو، فترة التصميم، CBR، التصريف، ومنهج التصميم المعتمد. الناتج فحص أولي فقط.", en: "Provide AADT, heavy-vehicle share, growth, design life, CBR, drainage, and the approved design method. Output is preliminary only.", source: "roads" },
  "Materials AI": { ar: "للمقارنة العادلة أحتاج المواصفة والدرجة والوحدة والكمية وموقع التسليم والشهادات المطلوبة. لن أفترض سعرًا حيًا.", en: "For a fair comparison, provide specification, grade, unit, quantity, delivery location, and required certificates. No live price will be assumed.", source: "materials" },
  "BOQ AI": { ar: "الصق البنود وحدد العملة والوحدات ونطاق المشروع. سأشير إلى البنود غير الواضحة ولن أضيف أسعارًا غير مقدمة منك.", en: "Paste the items, then specify currency, units, and project scope. Ambiguous items will be flagged and no unprovided prices will be added.", source: "construction" },
};

export default function AiWorkspace({ lang }: { lang: Language }) {
  const [discipline, setDiscipline] = useState("Construction AI");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | string | null>(null);
  const [history, setHistory] = useState<SavedConversation[]>([]);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [providerState, setProviderState] = useState<ProviderState>("checking");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);
  const selected = disciplines.find((item) => item.id === discipline)!;

  useEffect(() => {
    if (isGitHubPagesRuntime()) {
      const supabase = getSupabaseClient();
      supabase.auth.getUser().then(async ({ data }) => {
        setProviderState("fallback");
        setAuthenticated(Boolean(data.user));
        if (!data.user) return;
        const { data: saved } = await supabase.from("ai_conversations").select("id,discipline,transcript,updated_at").eq("user_id", data.user.id).order("updated_at", { ascending: false }).limit(24);
        setHistory((saved ?? []).map((item) => ({ id: item.id as string, discipline: item.discipline as string, transcript: (item.transcript ?? []) as ChatMessage[], updatedAt: item.updated_at as string })));
      }).catch(() => { setAuthenticated(false); setProviderState("fallback"); });
      return;
    }
    fetch("/api/ai").then(async (response) => {
      if (!response.ok) { setAuthenticated(false); return; }
      const data = await response.json() as { authenticated: boolean; provider_ready?: boolean; data: SavedConversation[] };
      setAuthenticated(data.authenticated);
      setProviderState(data.provider_ready ? "live" : "fallback");
      setHistory(data.data ?? []);
    }).catch(() => { setAuthenticated(false); setProviderState("fallback"); });
  }, []);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const sourceLinks = useMemo(() => {
    const links = messages.flatMap((item) => item.sources ?? []);
    return [...new Map(links.map((item) => [item.url, item])).values()];
  }, [messages]);

  const startNew = () => { setConversationId(null); setMessages([]); setMessage(""); setError(""); };
  const openHistory = (item: SavedConversation) => { setConversationId(item.id); setDiscipline(item.discipline); setMessages(item.transcript ?? []); setError(""); };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = message.trim();
    if (!value || sending) return;
    setSending(true); setError(""); setMessage("");
    const userMessage: ChatMessage = { role: "user", content: value, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, userMessage]);
    try {
      if (isGitHubPagesRuntime()) {
        const guidance = safeGuidance[discipline] ?? safeGuidance["Construction AI"];
        const assistantMessage: ChatMessage = { role: "assistant", content: guidance[lang], createdAt: new Date().toISOString(), sources: sourceGroups[guidance.source] };
        const transcript = [...messages, userMessage, assistantMessage];
        setMessages(transcript);
        const supabase = getSupabaseClient();
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const payload = { user_id: authData.user.id, discipline, transcript, model: "safe-local-source-router", updated_at: new Date().toISOString() };
          if (typeof conversationId === "string") {
            const { error: updateError } = await supabase.from("ai_conversations").update(payload).eq("id", conversationId).eq("user_id", authData.user.id);
            if (updateError) throw updateError;
          } else {
            const { data: created, error: insertError } = await supabase.from("ai_conversations").insert(payload).select("id").single();
            if (insertError) throw insertError;
            setConversationId(created.id as string);
          }
          setAuthenticated(true);
        }
        setProviderState("fallback");
        return;
      }
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discipline, message: value, locale: lang, conversationId, transcript: messages }) });
      const data = await response.json() as { reply?: string; sources?: Array<{ label: string; url: string }>; disclaimer?: string; conversation_id?: number | null; saved?: boolean; error?: string; external_ai_connected?: boolean };
      if (!response.ok || !data.reply) throw new Error(data.error || "Request failed");
      setProviderState(data.external_ai_connected ? "live" : "fallback");
      const assistantMessage: ChatMessage = { role: "assistant", content: data.reply, createdAt: new Date().toISOString(), sources: data.sources };
      setMessages((current) => [...current, assistantMessage]);
      if (data.conversation_id) setConversationId(data.conversation_id);
      if (data.saved) setAuthenticated(true);
    } catch {
      setError(lang === "ar" ? "تعذّر إرسال الرسالة الآن. جرّب مرة أخرى." : "The message could not be sent. Try again.");
    } finally { setSending(false); }
  };

  return <section className="ai-page">
    <header className="ai-page-hero">
      <div><span className="ai-orbit">✦</span><p className="eyebrow">CIVIL AI · KUWAIT SOURCE ROUTER</p><h1>{lang === "ar" ? "مساحة هندسية أوضح." : "A clearer engineering workspace."}</h1><p>{lang === "ar" ? "اسأل، أكمل البيانات الناقصة، وافتح المصدر الرسمي قبل اتخاذ القرار." : "Ask, complete missing inputs, and open the official source before deciding."}</p></div>
      <div className={`ai-hero-status ${providerState === "live" ? "is-live" : providerState === "fallback" ? "is-fallback" : ""}`}><span><i />{providerState === "checking" ? (lang === "ar" ? "جارٍ فحص الاتصال" : "Checking AI connection") : providerState === "live" ? (lang === "ar" ? "الذكاء الاصطناعي متصل" : "AI generation connected") : (lang === "ar" ? "الوضع الإرشادي الأساسي" : "Basic guidance mode")}</span><span><i />{lang === "ar" ? "لا يفترض أسعار السوق" : "No assumed market prices"}</span><span><i />{lang === "ar" ? "الحفظ للمستخدم المسجّل" : "Saved for signed-in users"}</span></div>
    </header>

    <div className="ai-workbench">
      <aside className="ai-mode-rail"><header><b>{lang === "ar" ? "التخصص" : "Discipline"}</b><button type="button" onClick={startNew}>＋ {lang === "ar" ? "محادثة" : "New"}</button></header>{disciplines.map((item) => <button className={discipline === item.id ? "active" : ""} type="button" key={item.id} onClick={() => { setDiscipline(item.id); startNew(); }}><i>{item.icon}</i><span><b>{lang === "ar" ? item.ar : item.en}</b><small>{lang === "ar" ? item.descriptionAr : item.descriptionEn}</small></span></button>)}<div className="ai-history"><b>{lang === "ar" ? "المحفوظة" : "Saved"}</b>{authenticated === false && <a href={isGitHubPagesRuntime() ? appHref("/profile") : "/signin-with-chatgpt?return_to=/ai"}>{lang === "ar" ? "سجّل الدخول للحفظ" : "Sign in to save"} ↗</a>}{history.slice(0, 6).map((item) => <button type="button" key={item.id} onClick={() => openHistory(item)}><span>{item.discipline.replace(" AI", "")}</span><small>{new Date(item.updatedAt).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-KW")}</small></button>)}</div></aside>

      <main className="ai-conversation">
        <header><span><i>{selected.icon}</i><b>{lang === "ar" ? selected.ar : selected.en} AI</b></span><em>{authenticated ? (lang === "ar" ? "يحفظ تلقائيًا" : "Auto-saved") : (lang === "ar" ? "جلسة مؤقتة" : "Temporary session")}</em></header>
        {providerState === "fallback" && <div className="ai-provider-note" role="status">{lang === "ar" ? "التوليد الذكي غير متاح مؤقتًا؛ ستتلقى إرشادًا أساسيًا آمنًا بدل توقف المحادثة." : "AI generation is temporarily unavailable; safe basic guidance remains available so the conversation does not stop."}</div>}
        <div className="ai-message-stream">{messages.length === 0 ? <div className="ai-empty-state"><span>✦</span><h2>{lang === "ar" ? "ابدأ بالسياق، لا بالتخمين." : "Start with context, not guesses."}</h2><p>{lang === "ar" ? "اختر سؤالًا سريعًا أو اكتب تفاصيل مشروعك. سأطلب القيم الناقصة وأضع المصادر بجانب الإجابة." : "Choose a quick prompt or describe your project. Missing values and sources appear alongside the answer."}</p><div>{prompts[lang].map((prompt) => <button type="button" key={prompt} onClick={() => setMessage(prompt)}>{prompt}<b>←</b></button>)}</div></div> : messages.map((item, index) => <article className={`ai-chat-message ${item.role}`} key={`${item.createdAt}-${index}`}><header><b>{item.role === "user" ? (lang === "ar" ? "أنت" : "You") : "Civil AI"}</b><time>{new Date(item.createdAt).toLocaleTimeString(lang === "ar" ? "ar-KW" : "en-KW", { hour: "2-digit", minute: "2-digit" })}</time></header><p>{item.content}</p>{item.sources && <div className="message-sources">{item.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>↗ {source.label}</a>)}</div>}</article>)}{sending && <div className="ai-thinking"><i /><i /><i /><span>{lang === "ar" ? "يراجع المدخلات…" : "Reviewing inputs…"}</span></div>}<div ref={messagesEnd}/></div>
        <form className="ai-composer" onSubmit={send}><div className="composer-tools"><button type="button" title={lang === "ar" ? "إرفاق ملف — قريبًا" : "Attach file — coming soon"}>＋</button><span>{lang === "ar" ? "لا ترسل بيانات شخصية أو مخططات سرية · Ctrl + Enter للإرسال" : "Do not send personal data or confidential drawings · Ctrl + Enter to send"}</span><small>{message.length}/5000</small></div><textarea aria-label={lang === "ar" ? "رسالتك إلى Civil AI" : "Your message to Civil AI"} maxLength={5000} value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={lang === "ar" ? `اكتب سؤالك في ${selected.ar}…` : `Ask about ${selected.en.toLowerCase()}…`} /><button className="send-ai" type="submit" disabled={!message.trim() || sending}>{lang === "ar" ? "إرسال" : "Send"}<span>↑</span></button>{error && <p className="form-error">{error}</p>}</form>
      </main>

      <aside className="ai-context-panel"><header><b>{lang === "ar" ? "سياق الإجابة" : "Answer context"}</b><span className={providerState === "live" ? "live" : "fallback"}>{providerState === "live" ? "LIVE AI" : "SAFE"}</span></header><section><small>{lang === "ar" ? "نوع البيانات" : "Data mode"}</small><b>{lang === "ar" ? "مدخلات المستخدم + روابط رسمية" : "User inputs + official links"}</b></section><section><small>{lang === "ar" ? "المصادر الظاهرة" : "Visible sources"}</small>{sourceLinks.length ? sourceLinks.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.label}<span>↗</span></a>) : <p>{lang === "ar" ? "ستظهر المصادر المرتبطة بعد أول إجابة." : "Relevant sources appear after the first answer."}</p>}</section><section className="ai-boundary"><small>{lang === "ar" ? "حدود الاستخدام" : "Use boundary"}</small><p>{lang === "ar" ? "المخرجات تعليمية أولية. المخططات والأحمال والتنفيذ تحتاج مراجعة واعتماد مهندس مختص ومرخص." : "Outputs are preliminary and educational. Drawings, loads, and execution require a qualified licensed engineer."}</p></section></aside>
    </div>
  </section>;
}
