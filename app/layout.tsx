import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "استدامة البناء | نحو أثر يدوم",
  description:
    "تصوّر مبدئي لمنصة برنامج الاستدامة في البناء، تعرض المنهجية والأعمال والنتائج بصورة حديثة وواضحة.",
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
