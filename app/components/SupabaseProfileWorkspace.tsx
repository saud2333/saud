"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Language } from "./CivilApp";
import { applyTheme, type ThemePreference } from "./ThemeToggle";
import { appHref, authRedirectUrl } from "../lib/runtime";
import { getSupabaseClient } from "../lib/supabase";

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  job_title: string | null;
  company: string | null;
  phone: string | null;
  governorate: string | null;
  bio: string | null;
  role: "homeowner" | "engineer" | "contractor" | "supplier" | "admin";
  locale: "ar" | "en";
  theme: ThemePreference;
};

const blankProfile = (user: User): ProfileRow => ({
  id: user.id,
  email: user.email ?? null,
  display_name: (user.user_metadata?.display_name as string | undefined) ?? "",
  job_title: "",
  company: "",
  phone: "",
  governorate: "",
  bio: "",
  role: "homeowner",
  locale: "ar",
  theme: "system",
});

function SupabaseAuthCard({ lang }: { lang: Language }) {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    const supabase = getSupabaseClient();
    try {
      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl() });
        if (resetError) throw resetError;
        setMessage(lang === "ar" ? "أرسلنا رابط استعادة كلمة المرور إذا كان البريد مسجلًا." : "A password recovery link was sent if the email is registered.");
      } else if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: authRedirectUrl(), data: { display_name: name } },
        });
        if (signUpError) throw signUpError;
        setMessage(data.session
          ? (lang === "ar" ? "تم إنشاء الحساب وتسجيل الدخول." : "Account created and signed in.")
          : (lang === "ar" ? "تم إنشاء الحساب. افتح رسالة التأكيد في بريدك ثم ارجع للموقع." : "Account created. Confirm the email, then return to the site."));
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (cause) {
      const details = cause instanceof Error ? cause.message : "Authentication failed";
      setError(lang === "ar" ? `تعذّر إكمال العملية: ${details}` : `Could not complete the request: ${details}`);
    } finally { setBusy(false); }
  };

  return <section className="auth-page supabase-auth"><article><span className="auth-mark">CK</span><p className="eyebrow">SUPABASE AUTH · CIVILKUWAIT</p><h1>{mode === "signin" ? (lang === "ar" ? "ادخل إلى مساحة مشروعك." : "Enter your project workspace.") : mode === "signup" ? (lang === "ar" ? "أنشئ حسابك." : "Create your account.") : (lang === "ar" ? "استعد كلمة المرور." : "Recover your password.")}</h1><p>{lang === "ar" ? "حساب واحد لحفظ الملف والمشاريع وBOQ وقوائم الفحص ومحادثات Civil AI." : "One account for your profile, projects, BOQs, inspections, and Civil AI conversations."}</p><div className="auth-tabs"><button className={mode === "signin" ? "active" : ""} type="button" onClick={() => setMode("signin")}>{lang === "ar" ? "دخول" : "Sign in"}</button><button className={mode === "signup" ? "active" : ""} type="button" onClick={() => setMode("signup")}>{lang === "ar" ? "حساب جديد" : "Create account"}</button></div><form className="supabase-auth-form" onSubmit={submit}>{mode === "signup" && <label><span>{lang === "ar" ? "الاسم المعروض" : "Display name"}</span><input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>}<label><span>{lang === "ar" ? "البريد الإلكتروني" : "Email"}</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>{mode !== "reset" && <label><span>{lang === "ar" ? "كلمة المرور" : "Password"}</span><input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>}<button className="button primary green" disabled={busy} type="submit">{busy ? (lang === "ar" ? "جارٍ التنفيذ…" : "Working…") : mode === "signin" ? (lang === "ar" ? "تسجيل الدخول" : "Sign in") : mode === "signup" ? (lang === "ar" ? "إنشاء الحساب" : "Create account") : (lang === "ar" ? "إرسال رابط الاستعادة" : "Send recovery link")}</button>{message && <p className="auth-success">✓ {message}</p>}{error && <p className="form-error">{error}</p>}</form><button className="auth-text-button" type="button" onClick={() => setMode(mode === "reset" ? "signin" : "reset")}>{mode === "reset" ? (lang === "ar" ? "العودة للدخول" : "Back to sign in") : (lang === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?")}</button><small>{lang === "ar" ? "الاتصال مشفّر، والصلاحيات محمية بسياسات قاعدة البيانات." : "Encrypted connection with database-enforced access rules."}</small></article><aside><div><b>01</b><span>{lang === "ar" ? "حفظ آمن مرتبط بحسابك" : "Secure account-owned storage"}</span></div><div><b>02</b><span>{lang === "ar" ? "مزامنة المشاريع والأدوات" : "Projects and tools in sync"}</span></div><div><b>03</b><span>{lang === "ar" ? "لوحة الإدارة لحساب واحد فقط" : "Single-account administration"}</span></div></aside></section>;
}

export default function SupabaseProfileWorkspace({ lang }: { lang: Language }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "saving" | "saved" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    const load = async (nextUser: User | null) => {
      setUser(nextUser);
      if (!nextUser) { setProfile(null); setState("ready"); return; }
      const { data, error: profileError } = await supabase.from("profiles").select("id,email,display_name,job_title,company,phone,governorate,bio,role,locale,theme").eq("id", nextUser.id).maybeSingle();
      if (profileError) { setError(profileError.message); setState("error"); return; }
      const nextProfile = (data as ProfileRow | null) ?? blankProfile(nextUser);
      setProfile(nextProfile); applyTheme(nextProfile.theme); setState("ready");
    };
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { window.setTimeout(() => load(session?.user ?? null), 0); });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (state === "loading") return <section className="account-state"><span className="account-loader"/><p>{lang === "ar" ? "نجهّز ملفك…" : "Preparing your profile…"}</p></section>;
  if (!user) return <SupabaseAuthCard lang={lang} />;
  if (!profile) return <section className="account-state"><p>{lang === "ar" ? `تعذّر تحميل الملف: ${error}` : `Could not load profile: ${error}`}</p></section>;

  const set = (key: keyof ProfileRow, value: string) => setProfile((current) => current ? ({ ...current, [key]: value }) : current);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setState("saving"); setError("");
    const editable = { display_name: profile.display_name, job_title: profile.job_title, company: profile.company, phone: profile.phone, governorate: profile.governorate, bio: profile.bio, locale: profile.locale, theme: profile.theme };
    const { data, error: saveError } = await getSupabaseClient().from("profiles").update(editable).eq("id", user.id).select("id,email,display_name,job_title,company,phone,governorate,bio,role,locale,theme").single();
    if (saveError) { setError(saveError.message); setState("error"); return; }
    setProfile(data as ProfileRow); applyTheme((data as ProfileRow).theme); setState("saved");
    window.setTimeout(() => setState("ready"), 1800);
  };
  const signOut = async () => { await getSupabaseClient().auth.signOut(); };

  return <section className="profile-page"><header><div className="profile-avatar">{(profile.display_name || profile.email || "C").slice(0, 1).toUpperCase()}</div><div><p className="eyebrow">MY CIVILKUWAIT · SUPABASE</p><h1>{lang === "ar" ? "ملفي الشخصي" : "My profile"}</h1><p>{profile.email}</p></div><button className="profile-signout" type="button" onClick={signOut}>{lang === "ar" ? "تسجيل الخروج" : "Sign out"} ↗</button></header><div className="profile-layout"><nav><button className="active" type="button" onClick={() => document.getElementById("identity")?.scrollIntoView({ behavior: "smooth" })}>◎ {lang === "ar" ? "البيانات الأساسية" : "Basics"}</button><button type="button" onClick={() => document.getElementById("preferences")?.scrollIntoView({ behavior: "smooth" })}>◐ {lang === "ar" ? "المظهر واللغة" : "Appearance"}</button><a href={appHref("/dashboard")}>◫ {lang === "ar" ? "مشاريعي" : "My projects"}</a><a href={appHref("/ai")}>✦ {lang === "ar" ? "محادثات AI" : "AI conversations"}</a>{profile.role === "admin" && <a href={appHref("/admin")}>⚙ {lang === "ar" ? "لوحة الإدارة" : "Administration"}</a>}</nav><form onSubmit={save}><section id="identity"><header><span>01</span><div><h2>{lang === "ar" ? "معلومات الحساب" : "Account information"}</h2><p>{lang === "ar" ? "تُحفظ هذه البيانات في حسابك ولا تظهر لمستخدم آخر." : "These details are stored in your account and hidden from other users."}</p></div></header><div className="profile-form-grid"><label><span>{lang === "ar" ? "الاسم المعروض" : "Display name"}</span><input value={profile.display_name ?? ""} onChange={(event) => set("display_name", event.target.value)} /></label><label><span>{lang === "ar" ? "الصفة المهنية" : "Job title"}</span><input value={profile.job_title ?? ""} onChange={(event) => set("job_title", event.target.value)} /></label><label><span>{lang === "ar" ? "الشركة / المكتب" : "Company / office"}</span><input value={profile.company ?? ""} onChange={(event) => set("company", event.target.value)} /></label><label><span>{lang === "ar" ? "المحافظة" : "Governorate"}</span><select value={profile.governorate ?? ""} onChange={(event) => set("governorate", event.target.value)}><option value="">—</option>{["العاصمة","حولي","الفروانية","الجهراء","الأحمدي","مبارك الكبير"].map((item) => <option key={item}>{item}</option>)}</select></label><label><span>{lang === "ar" ? "رقم التواصل — اختياري" : "Contact number — optional"}</span><input value={profile.phone ?? ""} onChange={(event) => set("phone", event.target.value)} inputMode="tel" /></label><label className="full"><span>{lang === "ar" ? "نبذة قصيرة" : "Short bio"}</span><textarea maxLength={500} value={profile.bio ?? ""} onChange={(event) => set("bio", event.target.value)} /></label></div></section><section id="preferences"><header><span>02</span><div><h2>{lang === "ar" ? "المظهر واللغة" : "Appearance and language"}</h2></div></header><div className="preference-cards">{(["light","dark","system"] as ThemePreference[]).map((theme) => <button className={profile.theme === theme ? "active" : ""} type="button" key={theme} onClick={() => { setProfile((current) => current ? ({ ...current, theme }) : current); applyTheme(theme); }}><i>{theme === "light" ? "☀" : theme === "dark" ? "☾" : "◐"}</i><b>{theme === "light" ? (lang === "ar" ? "فاتح" : "Light") : theme === "dark" ? (lang === "ar" ? "داكن" : "Dark") : (lang === "ar" ? "حسب الجهاز" : "System")}</b><span>✓</span></button>)}</div></section><footer><span>{state === "saved" ? (lang === "ar" ? "✓ تم الحفظ" : "✓ Saved") : error}</span><button className="button primary green" type="submit" disabled={state === "saving"}>{state === "saving" ? (lang === "ar" ? "جارٍ الحفظ…" : "Saving…") : (lang === "ar" ? "حفظ الملف" : "Save profile")}</button></footer></form></div></section>;
}
