"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sourceRegistry, verifiedSuppliers } from "../data/catalog";
import ThemeToggle from "./ThemeToggle";

type AdminUser = { email: string | null; displayName: string | null; role: string };

export default function AdminPortal() {
  const [status, setStatus] = useState<"loading" | "authorized" | "hidden" | "error">("loading");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [section, setSection] = useState("overview");
  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) { setStatus("hidden"); return; }
      const data = await response.json() as { user: AdminUser };
      setUser(data.user); setStatus("authorized");
    }).catch(() => setStatus("error"));
  }, []);
  if (status === "loading") return <main className="admin-locked"><span className="account-loader"/><p>جارٍ التحقق…</p></main>;
  if (status !== "authorized") return <main className="admin-locked"><span>404</span><h1>الصفحة غير متاحة.</h1><p>عُد إلى المنصة أو سجّل الدخول من صفحة الملف الشخصي.</p><Link className="button primary green" href="/">العودة للرئيسية</Link></main>;

  const nav = [["overview","نظرة عامة"],["users","المستخدمون"],["sources","المصادر"],["materials","المواد"],["directory","الدليل"],["reports","البلاغات"],["ai","سجل Civil AI"]];
  return <main className="admin-portal"><header><Link href="/" className="brand"><b>CK</b><span>CivilKuwait<small>CONTROL ROOM</small></span></Link><div><ThemeToggle label="تبديل المظهر"/><span><small>ADMIN</small><b>{user?.displayName || user?.email}</b></span><a href="/signout-with-chatgpt?return_to=/">خروج ↗</a></div></header><div className="admin-shell"><aside><strong>الإدارة</strong>{nav.map(([id,label]) => <button className={section === id ? "active" : ""} type="button" key={id} onClick={() => setSection(id)}><i>{id === "overview" ? "◫" : id === "sources" ? "⌁" : id === "ai" ? "✦" : "·"}</i><span>{label}</span></button>)}<Link href="/">← عرض الموقع</Link></aside><section><header><div><p className="eyebrow">PRIVATE · SINGLE ADMIN</p><h1>{nav.find(([id]) => id === section)?.[1]}</h1><p>هذه البيانات لا تُعرض إلا للحساب الإداري المعتمد.</p></div><button type="button">＋ إجراء جديد</button></header>{section === "overview" && <><div className="admin-metrics"><article><small>المستخدمون المسجّلون</small><b>—</b><span>يظهر العدد بعد تهيئة قاعدة الإنتاج</span></article><article><small>الموردون المرتبطون</small><b>{verifiedSuppliers.length}</b><span>مصادر رسمية معلنة</span></article><article><small>طلبات المراجعة</small><b>0</b><span>لا توجد طلبات حالية</span></article><article><small>حالة المصادر</small><b>1 / {sourceRegistry.length}</b><span>اتصال قراءة فقط</span></article></div><article className="admin-card"><header><h2>صحة المصادر</h2><span>آخر مراجعة: 01/09/2026</span></header>{sourceRegistry.map((source) => <div className="admin-source-row" key={source.id}><i className={source.status === "connected_readonly" ? "online" : ""}/><span><b>{source.label}</b><small>{source.coverage}</small></span><em>{source.status === "connected_readonly" ? "مرتبط — قراءة فقط" : "غير مرتبط"}</em></div>)}</article></>}{section !== "overview" && <article className="admin-empty"><span>◫</span><h2>مساحة إدارة {nav.find(([id]) => id === section)?.[1]}</h2><p>تعرض هذه الوحدة السجلات الحقيقية فقط عند وجودها. لا توجد أرقام أو حالات تجريبية مخفية على أنها إنتاجية.</p></article>}</section></div></main>;
}
