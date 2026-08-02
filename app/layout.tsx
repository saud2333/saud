import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://kisr47.pages.dev";
const pageTitle = "الاستدامة بالبناء 47 | من الخلطة إلى أثر يدوم";
const pageDescription =
  "مشروع طلبة الدورة الصيفية 47 يوثّق ما تعلّموه عن المونة والخلطات الخرسانية المستدامة، من القياس والخلط إلى فهم الأثر.";
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "الاستدامة بالبناء 47",
  alternateName: "Sustainable Construction 47",
  description: pageDescription,
  url: siteUrl,
  inLanguage: ["ar", "en"],
  about: ["Sustainable construction", "Mortar", "Sustainable concrete"],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "J6Z-5q8TrAFKj1YBncrauRDPR1Tf66SpsrJFJXlr70c",
  },
  openGraph: {
    type: "website",
    locale: "ar_KW",
    url: "/",
    siteName: "الاستدامة بالبناء 47",
    title: pageTitle,
    description:
      "تجربة طلبة الدورة الصيفية 47 في المونة والخلطات الخرسانية المستدامة.",
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "الاستدامة بالبناء 47 — من الخلطة إلى أثر يدوم",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description:
      "تجربة طلبة الدورة الصيفية 47 في المونة والخلطات الخرسانية المستدامة.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem('kisr47-theme');var theme=saved==='dark'||saved==='light'?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var allowed={top:1,program:1,lab:1,impact:1,sources:1};function scrollToHash(){var raw=location.hash.slice(1);if(!raw)return;var id;try{id=decodeURIComponent(raw);}catch(e){return;}if(!allowed[id])return;var target=document.getElementById(id);if(!target)return;var header=document.querySelector('.site-header');var offset=header?header.offsetHeight:0;var root=document.documentElement;var previous=root.style.scrollBehavior;root.style.scrollBehavior='auto';window.scrollTo(0,Math.max(0,window.scrollY+target.getBoundingClientRect().top-offset-12));requestAnimationFrame(function(){root.style.scrollBehavior=previous;});}function handleHash(){var menu=document.querySelector('details.mobile-nav');if(menu)menu.open=false;scrollToHash();setTimeout(scrollToHash,250);}if(document.readyState==='loading'){addEventListener('DOMContentLoaded',scrollToHash,{once:true});}else{scrollToHash();}addEventListener('pageshow',scrollToHash);addEventListener('hashchange',handleHash);setTimeout(scrollToHash,0);setTimeout(scrollToHash,250);}());`,
          }}
        />
      </body>
    </html>
  );
}
