import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://kisr47.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "استدامة البناء | نحو أثر يدوم",
  description:
    "تصوّر مبدئي لمنصة برنامج الاستدامة في البناء، تعرض المنهجية والأعمال والنتائج بصورة حديثة وواضحة.",
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
    siteName: "استدامة البناء",
    title: "استدامة البناء | نحو أثر يدوم",
    description:
      "برنامج يحوّل الاستدامة في البناء إلى قرارات واضحة قابلة للقياس والتطبيق.",
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
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
