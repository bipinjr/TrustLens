import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono, Caveat } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MagneticButtons, CursorGlow } from "@/components/fx";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-code" });
const pen = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-pen" });

export const metadata: Metadata = {
  title: { default: "TrustLens", template: "%s · TrustLens" },
  description: "Paste a suspicious message, record a call or drop a screenshot. See every trick it uses, in your language. Research-backed scam protection for India.",
};

export const viewport: Viewport = { themeColor: "#07090a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} ${pen.variable}`}>
      <body className="min-h-dvh">
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
