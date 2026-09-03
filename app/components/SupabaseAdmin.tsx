"use client";

import { useEffect, useState } from "react";
import type { Language } from "./CivilApp";
import ThemeToggle from "./ThemeToggle";
import { appHref, navigateToPath } from "../lib/runtime";
import { getSupabaseClient } from "../lib/supabase";

type AdminProfile = { id: string; email: string | null; display_name: string | null; role: string };
type Counts = { users: number; projects: number; boqs: number; inspections: number; conversations: number };

export function SupabaseAdminAccess({ lang }: { lang: Language }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  useEffect(() => { getSupabaseClient().auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user))).catch(() => setSignedIn(false)); }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setState("sending"); setMessage("");
    const { data, error } = await getSupabaseClient().rpc("claim_platform_admin", { setup_code: code });
    if (error || data !== true) { setState("error"); setMessage(lang === "ar" ? "الرمز غير صحيح أو أن الحساب الإداري تم تعيينه مسبقًا." : "Invalid code or the administrator account was already assigned."); return; }
    setState("done"); window.setTimeout(() => navigateToPath("/admin"), 700);
  };
  return <section className="admin-access"><article><span className="auth-mark">CK</span><p className="eyebrow">ONE-TIME ADMIN CLAIM · SUPABASE</p><h1>{lang === "ar" ? "تفعيل الحساب الإداري" : "Activate administrator"}</h1><p>{lang === "ar" ? "هذه الصفحة غير ظاهرة في التنقل. سجّل دخولك أولًا ثم استخدم رمز التأسيس مرة واحدة. قاعدة البيانات تمنع تعيين حساب إداري ثانٍ." : "This route is hidden from navigation. Sign in first, then use the one-time setup code. The database prevents a second administrator."}</p>{signedIn === false ? <a className="button primary green" href={appHref("/profile")}>{lang === "ar" ? "الذهاب لتسجيل الدخول" : "Go to sign in"} ↗</a> : <form onSubmit={submit}><label><span>{lang === "ar" ? "رمز التأسيس" : "Setup code"}</span><input required type="password" autoComplete="one-time-code" minLength={24} value={code} onChange={(event) => setCode(event.target.value)} /></label><button className="button primary green" type="submit" disabled={signedIn === null || state === "sending"}>{state === "sending" ? (lang === "ar" ? "جارٍ التحقق…" : "Checking…") : (lang === "ar" ? "تفعيل هذا الحساب" : "Activate this account")}</button>{state === "done" && <strong>✓ {lang === "ar" ? "تم التفعيل" : "Activated"}</strong>}{message && <small>{message}</small>}</form>}<a className="back-link" href={appHref("/")}>← {lang === "ar" ? "العودة للموقع" : "Back to site"}</a></article></section>;
}

export function SupabaseAdminPortal({ lang }: { lang: Language }) {
  const [status, setStatus] = useState<"loading" | "authorized" | "hidden" | "error">("loading");
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [counts, setCounts] = useState<Counts>({ users: 0, projects: 0, boqs: 0, inspections: 0, conversations: 0 });
  const [section, setSection] = useState("overview");
  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { setStatus("hidden"); return; }
      const { data: row, error } = await supabase.from("profiles").select("id,email,display_name,role").eq("id", auth.user.id).single();
      if (error || row?.role !== "admin") { setStatus("hidden"); return; }
      setProfile(row as AdminProfile); setStatus("authorized");
      const tables = [["profiles","users"],["projects","projects"],["boq_documents","boqs"],["inspection_runs","inspections"],["ai_conversations","conversations"]] as const;
      const results = await Promise.all(tables.map(async ([table, key]) => {
        const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
        return [key, count ?? 0] as const;
      }));
      setCounts(Object.fromEntries(results) as Counts);
    };
    load().catch(() => setStatus("error"));
  }, []);
  if (status === "loading") return <section className="admin-locked"><span className="account-loader"/><p>{lang === "ar" ? "جارٍ التحقق…" : "Checking access…"}</p></section>;
  if (status !== "authorized") return <section className="admin-locked"><span>404</span><h1>{lang === "ar" ? "الصفحة غير متاحة." : "Page unavailable."}</h1><p>{lang === "ar" ? "لوحة الإدارة مخصصة للحساب الإداري الوحيد." : "Administration is restricted to the single administrator account."}</p><a className="button primary green" href={appHref("/")}>{lang === "ar" ? "العودة للرئيسية" : "Back home"}</a></section>;

  const nav = [["overview",lang === "ar" ? "نظرة عامة" : "Overview"],["users",lang === "ar" ? "المستخدمون" : "Users"],["projects",lang === "ar" ? "المشاريع" : "Projects"],["boqs","BOQ"],["inspections",lang === "ar" ? "الفحوصات" : "Inspections"],["ai","Civil AI"]];
  const metrics = [[lang === "ar" ? "المستخدمون" : "Users",counts.users],[lang === "ar" ? "المشاريع" : "Projects",counts.projects],["BOQ",counts.boqs],[lang === "ar" ? "قوائم الفحص" : "Inspections",counts.inspections]] as const;
  return <section className="admin-portal"><header><a href={appHref("/")} className="brand"><b>CK</b><span>CivilKuwait<small>CONTROL ROOM</small></span></a><div><ThemeToggle label={lang === "ar" ? "تبديل المظهر" : "Toggle theme"}/><span><small>ADMIN</small><b>{profile?.display_name || profile?.email}</b></span><button className="admin-signout" type="button" onClick={async () => { await getSupabaseClient().auth.signOut(); navigateToPath("/"); }}>{lang === "ar" ? "خروج" : "Sign out"} ↗</button></div></header><div className="admin-shell"><aside><strong>{lang === "ar" ? "الإدارة" : "Administration"}</strong>{nav.map(([id,label]) => <button className={section === id ? "active" : ""} type="button" key={id} onClick={() => setSection(id)}><i>{id === "overview" ? "◫" : id === "ai" ? "✦" : "·"}</i><span>{label}</span></button>)}<a href={appHref("/")}>← {lang === "ar" ? "عرض الموقع" : "View site"}</a></aside><section><header><div><p className="eyebrow">PRIVATE · SINGLE ADMIN · RLS</p><h1>{nav.find(([id]) => id === section)?.[1]}</h1><p>{lang === "ar" ? "تُقرأ السجلات من Supabase ولا تظهر إلا للحساب الإداري." : "Records are read from Supabase and visible only to the administrator."}</p></div></header>{section === "overview" ? <><div className="admin-metrics">{metrics.map(([label,value]) => <article key={label}><small>{label}</small><b>{value}</b><span>{lang === "ar" ? "سجلات حقيقية محفوظة" : "Stored production records"}</span></article>)}</div><article className="admin-card"><header><h2>{lang === "ar" ? "حالة النظام" : "System status"}</h2><span>Supabase · GitHub Pages</span></header><div className="admin-source-row"><i className="online"/><span><b>Authentication + Row Level Security</b><small>{lang === "ar" ? "متصل ومحمي داخل قاعدة البيانات" : "Connected and database-protected"}</small></span><em>ONLINE</em></div><div className="admin-source-row"><i className="online"/><span><b>Civil AI history</b><small>{counts.conversations} {lang === "ar" ? "محادثة محفوظة" : "saved conversations"}</small></span><em>ONLINE</em></div></article></> : <article className="admin-empty"><span>◫</span><h2>{nav.find(([id]) => id === section)?.[1]}</h2><p>{lang === "ar" ? "الوحدة متصلة بقاعدة البيانات. لا نعرض بيانات تجريبية على أنها سجلات فعلية." : "This module is connected to the database. Demo data is never shown as production records."}</p></article>}</section></div></section>;
}
