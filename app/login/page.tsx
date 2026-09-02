import Link from "next/link";

export const dynamic = "force-dynamic";
export default function LoginPage() {
  return <main className="login-route"><article><span className="auth-mark">CK</span><p className="eyebrow">CIVILKUWAIT ACCOUNT</p><h1>تسجيل الدخول الآمن</h1><p>استخدم حساب ChatGPT لحفظ الملف الشخصي والمشاريع والمحادثات. لا توجد كلمة مرور منفصلة مخزّنة داخل CivilKuwait.</p><a className="button primary green" href="/signin-with-chatgpt?return_to=/profile">المتابعة إلى تسجيل الدخول ↗</a><Link href="/">← العودة للرئيسية</Link></article></main>;
}
