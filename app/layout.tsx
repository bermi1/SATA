import type { Metadata } from "next";
import { IBM_Plex_Sans, Inter } from "next/font/google";
import "./globals.css";

const body = IBM_Plex_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
// Dashboards (member portal and committee consoles) use Inter: a calm, highly legible interface face.
const ui = Inter({ variable: "--font-ui", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sata.co.tz"),
  openGraph: { type: "website", siteName: "SATA — Society of Anaesthesiologists of Tanzania", locale: "en_TZ" },
  twitter: { card: "summary_large_image" },
  title: { default: "SATA — Society of Anaesthesiologists of Tanzania", template: "%s · SATA" },
  description:
    "Advancing safe and quality anaesthesia and critical care across Tanzania. Membership, events, CPD and professional resources.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${ui.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
