"use client";

import { ArrowRight, BookOpen, CalendarDays, ShieldCheck, UserRound, Wallet } from "lucide-react";
import { useState } from "react";

const ACCOUNTS = [
  { role: "member", title: "Member", text: "Digital card, certificate, payments, events, CPD and the members' library.", icon: UserRound },
  { role: "secretariat", title: "Secretariat (full admin)", text: "Everything: every committee's dashboard and tool in one console.", icon: ShieldCheck },
  { role: "management", title: "Management & finance", text: "Applications, members, payments, bulk SMS and email, the newsletter.", icon: Wallet },
  { role: "education", title: "Education committee", text: "The resource library and review of member research, cases and articles.", icon: BookOpen },
  { role: "social", title: "Social committee", text: "Events and webinars, the website pop-up, news posts and the gallery.", icon: CalendarDays },
] as const;

export function DemoPicker() {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  async function go(role: string) {
    setBusy(role); setErr("");
    const res = await fetch("/api/auth/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok && data?.home) { window.location.assign(data.home); return; }
    setErr(data?.error ?? "Could not sign in. Please try again."); setBusy(null);
  }
  return (
    <>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACCOUNTS.map((a) => (
          <button key={a.role} onClick={() => go(a.role)} disabled={!!busy}
            className="group flex flex-col rounded-2xl border border-line/80 bg-white p-6 text-left shadow-[0_1px_2px_rgba(11,31,51,.04)] transition hover:-translate-y-0.5 hover:border-blue/40 hover:shadow-lg disabled:opacity-60">
            <span className="grid size-11 place-items-center rounded-xl bg-deep text-white transition group-hover:bg-blue"><a.icon className="size-5" /></span>
            <span className="mt-4 text-[17px] font-semibold text-ink">{a.title}</span>
            <span className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{a.text}</span>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue">{busy === a.role ? "Opening…" : "Open demo"} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span>
          </button>
        ))}
      </div>
      {err && <p role="alert" className="mt-4 text-sm font-medium text-vigil">{err}</p>}
    </>
  );
}
