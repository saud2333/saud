import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://civilkuwait.hsah-otb.chatgpt.site";
const title = "CivilKuwait | منصة الهندسة المدنية في الكويت";
const description = "منصة الهندسة المدنية المستدامة في الكويت: دليل المهندسين والمقاولين، سوق مواد موثّق بالمصدر، BOQ، حاسبات، وخارطة بناء البيت.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ar_KW",
    alternateLocale: ["en_KW"],
    url: "/",
    siteName: "CivilKuwait",
    title,
    description,
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "CivilKuwait — Sustainable Civil Engineering in Kuwait" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CivilKuwait",
  description,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: ["ar-KW", "en-KW"],
  areaServed: { "@type": "Country", name: "Kuwait" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themeScript = `(function(){try{var p=localStorage.getItem('civilkuwait-theme')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()`;
  return <html lang="ar" dir="rtl" suppressHydrationWarning><head><meta name="theme-color" content="#071d2b"/><script dangerouslySetInnerHTML={{ __html: themeScript }}/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}/></head><body>{children}</body></html>;
}
