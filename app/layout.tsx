// Root layout: loads the two brand fonts (Fraunces for display text, Hanken
// Grotesk for body) as CSS variables consumed by tailwind.config.ts, and sets
// the page metadata. next/font self-hosts the fonts — no external requests.
// Also mounts the two global client helpers: the cookie-consent banner and
// the consent-gated analytics listener.

import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";
import AnalyticsListener from "@/components/AnalyticsListener";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Helagi — understand your symptoms",
  description:
    "Describe your symptoms in your own words. Helagi asks a few simple questions and gives clear health information, plus a summary you can print for your doctor.",
};

// Tints the browser chrome (mobile address bar) to match the cream canvas.
export const viewport: Viewport = {
  themeColor: "#F6F1E7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable}`}>
      <body className="font-sans">
        {children}
        <CookieBanner />
        <AnalyticsListener />
      </body>
    </html>
  );
}
