import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { DemoPicker } from "./DemoPicker";

export const metadata: Metadata = { title: "Try the SATA platform", robots: { index: false } };

export default function DemoPage() {
  const on = process.env.DEMO_LOGIN === "on";
  return (
    <div className="dash min-h-screen bg-gradient-to-b from-[#f5f8fb] to-white">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-3"><Logo size={44} /><span className="text-sm font-semibold text-deep">Society of Anaesthesiologists of Tanzania</span></Link>
        <p className="mt-10 text-[12px] font-semibold uppercase tracking-[0.14em] text-blue">Preview</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Try the new SATA platform</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          Pick an account to look around as a member or as a committee. Demo accounts are <strong className="font-semibold text-ink">view-only</strong>: you can open every page, but nothing is saved or sent.
          Use the <strong className="font-semibold text-ink">Feedback</strong> button at the bottom of any dashboard page to leave a comment for the team.
        </p>
        {on ? <DemoPicker /> : <p className="mt-10 rounded-2xl border border-line bg-white p-6 text-sm text-muted">Demo access is switched off at the moment. Please contact the SATA secretariat.</p>}
      </div>
    </div>
  );
}
