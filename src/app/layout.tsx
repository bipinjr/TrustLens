import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MagneticButtons, CursorGlow } from "@/components/fx";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

// Fonts ship with the repo (latin subsets), so builds never depend on reaching Google Fonts.
const display = localFont({ variable: "--font-display", display: "swap", src: [
  { path: "./fonts/InstrumentSerif-normal.woff2", weight: "400", style: "normal" },
  { path: "./fonts/InstrumentSerif-italic.woff2", weight: "400", style: "italic" },
] });
const body = localFont({ variable: "--font-body", display: "swap", src: [{ path: "./fonts/Inter-normal.woff2", weight: "100 900", style: "normal" }] });
const mono = localFont({ variable: "--font-code", display: "swap", src: [{ path: "./fonts/JetBrainsMono-normal.woff2", weight: "100 800", style: "normal" }] });
const pen = localFont({ variable: "--font-pen", display: "swap", src: [{ path: "./fonts/Caveat-normal.woff2", weight: "400 700", style: "normal" }] });

export const metadata: Metadata = {
  title: { default: "TrustLens", template: "%s · TrustLens" },
  description: "Paste a suspicious message, record a call or drop a screenshot. See every trick it uses, in your language. Research-backed scam protection for India.",
};

export const viewport: Viewport = { themeColor: "#07090a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} ${pen.variable}`}>
      <body className="min-h-dvh">
        <div className="app-bg" aria-hidden><i className="aur a1" /><i className="aur a2" /><i className="aur a3" /><i className="dots" /></div>
        <MagneticButtons />
        <CursorGlow />
        <RegisterSW />
        <Nav />
        <div className="page-in">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
