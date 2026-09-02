"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminAccess() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/profile").then((response) => setSignedIn(response.ok)).catch(() => setSignedIn(false)); }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setState("sending"); setMessage("");
    try {
      const response = await fetch("/api/admin/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await response.json() as { claimed?: boolean; error?: string };
      if (!response.ok || !data.claimed) throw new Error(data.error);
      setState("done"); window.setTimeout(() => window.location.assign("/admin"), 800);
    } catch { setState("error"); setMessage("الرمز غير صحيح أو أن الحساب الإداري تم تعيينه مسبقًا."); }
  };
  return <main className="admin-access"><article><span className="auth-mark">CK</span><p className="eyebrow">ONE-TIME ADMIN CLAIM</p><h1>تفعيل الحساب الإداري</h1><p>هذه الصفحة غير مرتبطة بالتنقّل العام. سجّل دخولك أولًا، ثم استخدم رمز التأسيس مرة واحدة. بعد التفعيل لن يتمكن حساب ثانٍ من المطالبة بصلاحية الإدارة.</p>{signedIn === false ? <a className="button primary green" href="/signin-with-chatgpt?return_to=/admin/access">تسجيل الدخول بحساب ChatGPT ↗</a> : <form onSubmit={submit}><label><span>رمز التأسيس</span><input type="password" autoComplete="one-time-code" minLength={16} value={code} onChange={(event) => setCode(event.target.value)} /></label><button className="button primary green" type="submit" disabled={signedIn === null || state === "sending"}>{state === "sending" ? "جارٍ التحقق…" : "تفعيل هذا الحساب"}</button>{state === "done" && <strong>✓ تم التفعيل</strong>}{message && <small>{message}</small>}</form>}<Link className="back-link" href="/">← العودة للموقع</Link></article></main>;
}
