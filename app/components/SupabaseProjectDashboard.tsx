"use client";

import { useEffect, useMemo, useState } from "react";
import type { Language, View } from "./CivilApp";
import { appHref } from "../lib/runtime";
import { getSupabaseClient } from "../lib/supabase";

type ProjectRow = {
  id: string;
  name: string;
  project_type: string;
  governorate: string | null;
  status: string;
  budget_kwd: number | null;
  spent_kwd: number;
  created_at: string;
};

export default function SupabaseProjectDashboard({ lang, navigate }: { lang: Language; navigate: (view: View, section?: string) => void }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    const supabase = getSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    setAuthenticated(Boolean(auth.user));
    if (!auth.user) return;
    const { data, error } = await supabase.from("projects").select("id,name,project_type,governorate,status,budget_kwd,spent_kwd,created_at").eq("user_id", auth.user.id).order("updated_at", { ascending: false });
    if (error) { setMessage(error.message); return; }
    setProjects((data ?? []) as ProjectRow[]);
  };
  useEffect(() => {
    const timer = window.setTimeout(() => { load().catch(() => setAuthenticated(false)); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const totals = useMemo(() => projects.reduce((current, project) => ({ budget: current.budget + Number(project.budget_kwd ?? 0), spent: current.spent + Number(project.spent_kwd ?? 0) }), { budget: 0, spent: 0 }), [projects]);
  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = getSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { setAuthenticated(false); return; }
      const { error } = await supabase.from("projects").insert({ user_id: auth.user.id, name, governorate: governorate || null, budget_kwd: budget ? Number(budget) : null, project_type: "house", status: "planning" });
      if (error) throw error;
      setName(""); setBudget(""); setGovernorate(""); setMessage(lang === "ar" ? "✓ تم إنشاء المشروع." : "✓ Project created.");
      await load();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not create project"); }
    finally { setBusy(false); }
  };

  if (authenticated === null) return <section className="account-state"><span className="account-loader"/><p>{lang === "ar" ? "نحمّل مشاريعك…" : "Loading your projects…"}</p></section>;
  if (!authenticated) return <section className="dashboard-hero"><span>MY PROJECT · SECURE WORKSPACE</span><h1>{lang === "ar" ? "لوحة المشروع" : "Project dashboard"}</h1><p>{lang === "ar" ? "سجّل الدخول لإنشاء المشاريع وحفظ BOQ والفحوصات والمستندات." : "Sign in to create projects and save BOQs, inspections, and documents."}</p><a className="button primary green" href={appHref("/profile")}>{lang === "ar" ? "تسجيل الدخول" : "Sign in"} ↗</a></section>;

  return <><section className="dashboard-hero live-dashboard"><span>MY PROJECT · SUPABASE</span><h1>{lang === "ar" ? "مشاريعي" : "My projects"}</h1><p>{lang === "ar" ? "مساحة واحدة لميزانية المشروع والكميات والفحوصات والمستندات." : "One workspace for project budgets, quantities, inspections, and documents."}</p><form className="project-create-form" onSubmit={create}><input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} placeholder={lang === "ar" ? "اسم المشروع" : "Project name"}/><input type="number" min="0" step="0.001" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder={lang === "ar" ? "الميزانية KWD — اختياري" : "Budget KWD — optional"}/><select value={governorate} onChange={(event) => setGovernorate(event.target.value)}><option value="">{lang === "ar" ? "المحافظة — اختياري" : "Governorate — optional"}</option>{["العاصمة","حولي","الفروانية","الجهراء","الأحمدي","مبارك الكبير"].map((item) => <option key={item}>{item}</option>)}</select><button className="button primary green" disabled={busy} type="submit">＋ {busy ? (lang === "ar" ? "جارٍ الإنشاء…" : "Creating…") : (lang === "ar" ? "مشروع جديد" : "New project")}</button></form>{message && <small className="save-message">{message}</small>}</section><section className="metric-grid"><article><span>{lang === "ar" ? "إجمالي الميزانية" : "Total budget"}</span><b>{totals.budget.toLocaleString(lang === "ar" ? "ar-KW" : "en-KW")} KWD</b><small>{projects.length} {lang === "ar" ? "مشروع" : "projects"}</small></article><article><span>{lang === "ar" ? "المنصرف" : "Spent"}</span><b>{totals.spent.toLocaleString(lang === "ar" ? "ar-KW" : "en-KW")} KWD</b><small>{lang === "ar" ? "من السجلات المدخلة" : "From entered records"}</small></article><article><span>{lang === "ar" ? "المتبقي" : "Remaining"}</span><b>{Math.max(0, totals.budget - totals.spent).toLocaleString(lang === "ar" ? "ar-KW" : "en-KW")} KWD</b><small>{lang === "ar" ? "قيمة حسابية" : "Calculated value"}</small></article><article><span>{lang === "ar" ? "المشاريع النشطة" : "Active projects"}</span><b>{projects.filter((item) => item.status !== "completed" && item.status !== "archived").length}</b><small>{lang === "ar" ? "قيد التخطيط أو التنفيذ" : "Planning or in progress"}</small></article></section><section className="saved-projects"><header><h2>{lang === "ar" ? "سجل المشاريع" : "Project register"}</h2><button type="button" onClick={() => navigate("construction", "boq")}>＋ BOQ</button></header>{projects.length ? <div className="saved-project-grid">{projects.map((project) => <article key={project.id}><small>{project.status.toUpperCase()}</small><h3>{project.name}</h3><p>{project.governorate || "—"}</p><b>{Number(project.budget_kwd ?? 0).toLocaleString(lang === "ar" ? "ar-KW" : "en-KW")} KWD</b><button type="button" onClick={() => navigate("construction", "checklists")}>{lang === "ar" ? "فتح أدوات المشروع" : "Open project tools"} ←</button></article>)}</div> : <div className="admin-empty"><span>⌂</span><h2>{lang === "ar" ? "لا توجد مشاريع بعد" : "No projects yet"}</h2><p>{lang === "ar" ? "أنشئ أول مشروع من النموذج أعلاه." : "Create the first project from the form above."}</p></div>}</section></>;
}
