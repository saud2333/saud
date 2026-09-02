"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Language } from "./CivilApp";

type ChatMessage = { role: "user" | "assistant"; content: string; createdAt: string; sources?: Array<{ label: string; url: string }> };
type SavedConversation = { id: number; discipline: string; transcript: ChatMessage[]; updatedAt: string };

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

export default function AiWorkspace({ lang }: { lang: Language }) {
  const [discipline, setDiscipline] = useState("Construction AI");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [history, setHistory] = useState<SavedConversation[]>([]);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);
  const selected = disciplines.find((item) => item.id === discipline)!;

  useEffect(() => {
    fetch("/api/ai").then(async (response) => {
      if (!response.ok) { setAuthenticated(false); return; }
      const data = await response.json() as { authenticated: boolean; data: SavedConversation[] };
      setAuthenticated(data.authenticated);
      setHistory(data.data ?? []);
    }).catch(() => setAuthenticated(false));
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
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discipline, message: value, locale: lang, conversationId, transcript: messages }) });
      const data = await response.json() as { reply?: string; sources?: Array<{ label: string; url: string }>; disclaimer?: string; conversation_id?: number | null; saved?: boolean; error?: string };
      if (!response.ok || !data.reply) throw new Error(data.error || "Request failed");
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
      <div className="ai-hero-status"><span><i />{lang === "ar" ? "يربط المصادر الرسمية" : "Official-source links"}</span><span><i />{lang === "ar" ? "لا يفترض أسعار السوق" : "No assumed market prices"}</span><span><i />{lang === "ar" ? "الحفظ للمستخدم المسجّل" : "Saved for signed-in users"}</span></div>
    </header>

    <div className="ai-workbench">
      <aside className="ai-mode-rail"><header><b>{lang === "ar" ? "التخصص" : "Discipline"}</b><button type="button" onClick={startNew}>＋ {lang === "ar" ? "محادثة" : "New"}</button></header>{disciplines.map((item) => <button className={discipline === item.id ? "active" : ""} type="button" key={item.id} onClick={() => { setDiscipline(item.id); startNew(); }}><i>{item.icon}</i><span><b>{lang === "ar" ? item.ar : item.en}</b><small>{lang === "ar" ? item.descriptionAr : item.descriptionEn}</small></span></button>)}<div className="ai-history"><b>{lang === "ar" ? "المحفوظة" : "Saved"}</b>{authenticated === false && <a href="/signin-with-chatgpt?return_to=/ai">{lang === "ar" ? "سجّل الدخول للحفظ" : "Sign in to save"} ↗</a>}{history.slice(0, 6).map((item) => <button type="button" key={item.id} onClick={() => openHistory(item)}><span>{item.discipline.replace(" AI", "")}</span><small>{new Date(item.updatedAt).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-KW")}</small></button>)}</div></aside>

      <main className="ai-conversation">
        <header><span><i>{selected.icon}</i><b>{lang === "ar" ? selected.ar : selected.en} AI</b></span><em>{authenticated ? (lang === "ar" ? "يحفظ تلقائيًا" : "Auto-saved") : (lang === "ar" ? "جلسة مؤقتة" : "Temporary session")}</em></header>
        <div className="ai-message-stream">{messages.length === 0 ? <div className="ai-empty-state"><span>✦</span><h2>{lang === "ar" ? "ابدأ بالسياق، لا بالتخمين." : "Start with context, not guesses."}</h2><p>{lang === "ar" ? "اختر سؤالًا سريعًا أو اكتب تفاصيل مشروعك. سأطلب القيم الناقصة وأضع المصادر بجانب الإجابة." : "Choose a quick prompt or describe your project. Missing values and sources appear alongside the answer."}</p><div>{prompts[lang].map((prompt) => <button type="button" key={prompt} onClick={() => setMessage(prompt)}>{prompt}<b>←</b></button>)}</div></div> : messages.map((item, index) => <article className={`ai-chat-message ${item.role}`} key={`${item.createdAt}-${index}`}><header><b>{item.role === "user" ? (lang === "ar" ? "أنت" : "You") : "Civil AI"}</b><time>{new Date(item.createdAt).toLocaleTimeString(lang === "ar" ? "ar-KW" : "en-KW", { hour: "2-digit", minute: "2-digit" })}</time></header><p>{item.content}</p>{item.sources && <div className="message-sources">{item.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>↗ {source.label}</a>)}</div>}</article>)}{sending && <div className="ai-thinking"><i /><i /><i /><span>{lang === "ar" ? "يراجع المدخلات…" : "Reviewing inputs…"}</span></div>}<div ref={messagesEnd}/></div>
        <form className="ai-composer" onSubmit={send}><div className="composer-tools"><button type="button" title={lang === "ar" ? "إرفاق ملف — قريبًا" : "Attach file — coming soon"}>＋</button><span>{lang === "ar" ? "لا ترسل بيانات شخصية أو مخططات سرية" : "Do not send personal data or confidential drawings"}</span><small>{message.length}/5000</small></div><textarea maxLength={5000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={lang === "ar" ? `اكتب سؤالك في ${selected.ar}…` : `Ask about ${selected.en.toLowerCase()}…`} /><button className="send-ai" type="submit" disabled={!message.trim() || sending}>{lang === "ar" ? "إرسال" : "Send"}<span>↑</span></button>{error && <p className="form-error">{error}</p>}</form>
      </main>

      <aside className="ai-context-panel"><header><b>{lang === "ar" ? "سياق الإجابة" : "Answer context"}</b><span>LIVE</span></header><section><small>{lang === "ar" ? "نوع البيانات" : "Data mode"}</small><b>{lang === "ar" ? "مدخلات المستخدم + روابط رسمية" : "User inputs + official links"}</b></section><section><small>{lang === "ar" ? "المصادر الظاهرة" : "Visible sources"}</small>{sourceLinks.length ? sourceLinks.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.label}<span>↗</span></a>) : <p>{lang === "ar" ? "ستظهر المصادر المرتبطة بعد أول إجابة." : "Relevant sources appear after the first answer."}</p>}</section><section className="ai-boundary"><small>{lang === "ar" ? "حدود الاستخدام" : "Use boundary"}</small><p>{lang === "ar" ? "المخرجات تعليمية أولية. المخططات والأحمال والتنفيذ تحتاج مراجعة واعتماد مهندس مختص ومرخص." : "Outputs are preliminary and educational. Drawings, loads, and execution require a qualified licensed engineer."}</p></section></aside>
    </div>
  </section>;
}
