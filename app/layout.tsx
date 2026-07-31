import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://kisr47.pages.dev";
const pageTitle = "استدامة 47 | من الخلطة إلى أثر يدوم";
const pageDescription =
  "مشروع طلبة الدورة الصيفية 47 يوثّق ما تعلّموه عن المونة والخلطات الخرسانية المستدامة، من القياس والخلط إلى فهم الأثر.";

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
    siteName: "استدامة 47",
    title: pageTitle,
    description:
      "تجربة طلبة الدورة الصيفية 47 في المونة والخلطات الخرسانية المستدامة.",
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "استدامة 47 — من الخلطة إلى أثر يدوم",
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
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
