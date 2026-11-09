import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import LoginForm from "./LoginForm";
import { repo } from "@/lib/db";
import { listMembers } from "@/lib/store";

export const metadata: Metadata = { title: "Sign in" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Sample one-click sign-in exists only in local development against the sample database.
  const demo = process.env.NODE_ENV !== "production" && repo().kind === "file";
  const all = demo ? await listMembers() : [];
  const pick = (role: string) => all.find((m) => m.role === role);
  const personas = [
    { label: "Member", who: all.find((m) => m.role === "member" && m.status === "active"), hint: "Portal, card, events" },
    { label: "Secretary General", who: pick("secretariat"), hint: "Members, events, attendance" },
    { label: "Treasurer", who: pick("treasurer"), hint: "Payments & reconciliation" },
    { label: "President", who: pick("leadership"), hint: "Oversight & reports" },
  ];
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue to-deep p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="dot-grid absolute inset-0 opacity-20" />
        <Link href="/" className="relative" aria-label="SATA home"><Logo tone="white" size={64} withText /></Link>
        <div className="relative">
          <h1 className="text-5xl font-extrabold leading-tight">Your professional home, in one place.</h1>
          <p className="mt-5 max-w-md text-lg text-white/80">Renew, register for events, track CPD and carry a verifiable digital card.</p>
        </div>
        <div className="relative text-sm text-white/60">vigilance</div>
      </div>
      <div className="flex items-center px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-8 block lg:hidden" aria-label="SATA home"><Logo size={56} withText /></Link>
          <h2 className="text-3xl font-extrabold text-deep">Sign in</h2>
          <p className="mt-2 text-sm text-muted">Enter the email on your SATA membership and we will send you a one-time code.</p>
          <div className="mt-6"><LoginForm next={next} /></div>
          {process.env.DEMO_LOGIN === "on" && (
            <a href="/demo" className="mt-5 flex items-center justify-between rounded-2xl border border-dashed border-blue/40 bg-blue/[.04] px-4 py-3 text-sm text-deep transition hover:bg-blue/[.08]">
              <span><span className="font-semibold">Just looking?</span> Try a view-only demo account</span><span aria-hidden>→</span>
            </a>
          )}
          {demo && <div className="mt-10 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-800">Development only · sample data</div>
            <p className="mt-1 text-xs text-amber-900">Pick a role to explore. This panel does not exist in production, where every sign-in needs an emailed code.</p>
            <div className="mt-4 grid gap-2">
              {personas.map((p) => p.who && (
                <LoginForm key={p.label} next={next} preset={p.who.email} presetLabel={`${p.label}: ${p.who.name}`} presetHint={p.hint} />
              ))}
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}
