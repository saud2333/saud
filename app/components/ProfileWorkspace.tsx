"use client";

import { useEffect, useState } from "react";
import type { Language } from "./CivilApp";
import { applyTheme, type ThemePreference } from "./ThemeToggle";
import { isGitHubPagesRuntime } from "../lib/runtime";
import SupabaseProfileWorkspace from "./SupabaseProfileWorkspace";

type Profile = {
  id: string; email: string | null; displayName: string | null; jobTitle: string | null; company: string | null;
  phone: string | null; governorate: string | null; bio: string | null; role: string; locale: "ar" | "en"; theme: ThemePreference;
};

const emptyProfile: Profile = { id: "", email: null, displayName: "", jobTitle: "", company: "", phone: "", governorate: "", bio: "", role: "homeowner", locale: "ar", theme: "system" };

export default function ProfileWorkspace({ lang }: { lang: Language }) {
  return isGitHubPagesRuntime() ? <SupabaseProfileWorkspace lang={lang} /> : <SitesProfileWorkspace lang={lang} />;
}

function SitesProfileWorkspace({ lang }: { lang: Language }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [state, setState] = useState<"loading" | "anonymous" | "ready" | "saving" | "saved" | "error">("loading");
  useEffect(() => {
    fetch("/api/profile").then(async (response) => {
      if (response.status === 401) { setState("anonymous"); return; }
      if (!response.ok) throw new Error();
      const data = await response.json() as { user: Profile };
      setProfile({ ...emptyProfile, ...data.user }); setState("ready");
      if (data.user.theme) applyTheme(data.user.theme);
    }).catch(() => setState("error"));
  }, []);
  const set = (key: keyof Profile, value: string) => setProfile((current) => ({ ...current, [key]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setState("saving");
    try {
      const response = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      if (!response.ok) throw new Error();
      const data = await response.json() as { data: Profile };
      setProfile(data.data); applyTheme(data.data.theme); setState("saved");
      window.setTimeout(() => setState("ready"), 1800);
    } catch { setState("error"); }
  };

  if (state === "loading") return <section className="account-state"><span className="account-loader"/><p>{lang === "ar" ? "نجهّز ملفك…" : "Preparing your profile…"}</p></section>;
  if (state === "anonymous") return <section className="auth-page"><article><span className="auth-mark">CK</span><p className="eyebrow">SECURE ACCOUNT · CIVILKUWAIT</p><h1>{lang === "ar" ? "مشروعك محفوظ لك." : "Your project, saved for you."}</h1><p>{lang === "ar" ? "سجّل الدخول بحساب ChatGPT لحفظ ملفك ومشاريعك وBOQ ومحادثات Civil AI. لا نخزّن كلمة مرور داخل الموقع." : "Sign in with ChatGPT to save your profile, projects, BOQs, and Civil AI conversations. This site stores no password."}</p><a className="button primary green" href="/signin-with-chatgpt?return_to=/profile">{lang === "ar" ? "تسجيل الدخول الآمن" : "Secure sign in"} ↗</a><small>{lang === "ar" ? "تتم المصادقة عبر صفحة ChatGPT الرسمية." : "Authentication is handled by the official ChatGPT sign-in flow."}</small></article><aside><div><b>01</b><span>{lang === "ar" ? "ملف شخصي وإعدادات" : "Profile and settings"}</span></div><div><b>02</b><span>{lang === "ar" ? "مشاريع ومحادثات محفوظة" : "Saved projects and conversations"}</span></div><div><b>03</b><span>{lang === "ar" ? "بيانات مملوكة لصاحب الحساب" : "Account-owned data"}</span></div></aside></section>;

  return <section className="profile-page">
    <header><div className="profile-avatar">{(profile.displayName || profile.email || "C").slice(0, 1).toUpperCase()}</div><div><p className="eyebrow">MY CIVILKUWAIT</p><h1>{lang === "ar" ? "ملفي الشخصي" : "My profile"}</h1><p>{profile.email}</p></div><a href="/signout-with-chatgpt?return_to=/">{lang === "ar" ? "تسجيل الخروج" : "Sign out"} ↗</a></header>
    <div className="profile-layout"><nav><a className="active" href="#identity">◎ {lang === "ar" ? "البيانات الأساسية" : "Basics"}</a><a href="#preferences">◐ {lang === "ar" ? "المظهر واللغة" : "Appearance"}</a><a href="/dashboard">◫ {lang === "ar" ? "مشاريعي" : "My projects"}</a><a href="/ai">✦ {lang === "ar" ? "محادثات AI" : "AI conversations"}</a>{profile.role === "admin" && <a href="/admin">⚙ {lang === "ar" ? "لوحة الإدارة" : "Administration"}</a>}</nav><form onSubmit={save}><section id="identity"><header><span>01</span><div><h2>{lang === "ar" ? "معلومات الحساب" : "Account information"}</h2><p>{lang === "ar" ? "ساعد الأدوات على تخصيص تجربة المشروع دون إضافة بيانات حساسة." : "Help tools tailor the project experience without adding sensitive data."}</p></div></header><div className="profile-form-grid"><label><span>{lang === "ar" ? "الاسم المعروض" : "Display name"}</span><input value={profile.displayName ?? ""} onChange={(event) => set("displayName", event.target.value)} /></label><label><span>{lang === "ar" ? "الصفة المهنية" : "Job title"}</span><input value={profile.jobTitle ?? ""} onChange={(event) => set("jobTitle", event.target.value)} placeholder={lang === "ar" ? "مالك منزل، مهندس، مقاول…" : "Homeowner, engineer, contractor…"}/></label><label><span>{lang === "ar" ? "الشركة / المكتب" : "Company / office"}</span><input value={profile.company ?? ""} onChange={(event) => set("company", event.target.value)} /></label><label><span>{lang === "ar" ? "المحافظة" : "Governorate"}</span><select value={profile.governorate ?? ""} onChange={(event) => set("governorate", event.target.value)}><option value="">—</option>{["العاصمة","حولي","الفروانية","الجهراء","الأحمدي","مبارك الكبير"].map((item) => <option key={item}>{item}</option>)}</select></label><label><span>{lang === "ar" ? "رقم التواصل — اختياري" : "Contact number — optional"}</span><input value={profile.phone ?? ""} onChange={(event) => set("phone", event.target.value)} inputMode="tel" /></label><label className="full"><span>{lang === "ar" ? "نبذة قصيرة" : "Short bio"}</span><textarea maxLength={500} value={profile.bio ?? ""} onChange={(event) => set("bio", event.target.value)} /></label></div></section><section id="preferences"><header><span>02</span><div><h2>{lang === "ar" ? "المظهر واللغة" : "Appearance and language"}</h2><p>{lang === "ar" ? "اختيار المظهر يُحفظ في الحساب وعلى هذا الجهاز." : "Appearance is saved to your account and this device."}</p></div></header><div className="preference-cards">{(["light","dark","system"] as ThemePreference[]).map((theme) => <button className={profile.theme === theme ? "active" : ""} type="button" key={theme} onClick={() => { setProfile((current) => ({ ...current, theme })); applyTheme(theme); }}><i>{theme === "light" ? "☀" : theme === "dark" ? "☾" : "◐"}</i><b>{theme === "light" ? (lang === "ar" ? "فاتح" : "Light") : theme === "dark" ? (lang === "ar" ? "داكن" : "Dark") : (lang === "ar" ? "حسب الجهاز" : "System")}</b><span>✓</span></button>)}</div></section><footer><span>{state === "saved" ? (lang === "ar" ? "✓ تم الحفظ" : "✓ Saved") : state === "error" ? (lang === "ar" ? "تعذّر الحفظ" : "Could not save") : ""}</span><button className="button primary green" type="submit" disabled={state === "saving"}>{state === "saving" ? (lang === "ar" ? "جارٍ الحفظ…" : "Saving…") : (lang === "ar" ? "حفظ الملف" : "Save profile")}</button></footer></form></div>
  </section>;
}
