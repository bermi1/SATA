"use client";

import { useState } from "react";

const TOPICS = ["Membership", "Events & conferences", "Payments", "Partnership & sponsorship", "Media", "Other"];
const box = "w-full rounded-md border border-line bg-white px-3.5 py-3 text-[15px] outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted";

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("busy");
    setErr("");
    const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(fd.entries())) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) setState("done");
    else { setState("idle"); setErr(data?.error ?? "Something went wrong. Please try again."); }
  }

  if (state === "done") {
    return (
      <div role="status" className="rounded-lg bg-emerald-50 p-6 text-emerald-900">
        <div className="font-display text-lg font-bold">Thank you. Your message has been received.</div>
        <p className="mt-1 text-sm">The secretariat will reply to the email address you gave, usually within two working days.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate={false}>
      <label><span className={label}>Full name</span><input name="name" required minLength={2} autoComplete="name" className={box} /></label>
      <label><span className={label}>Email</span><input name="email" type="email" required autoComplete="email" className={box} /></label>
      <label><span className={label}>Phone (optional)</span><input name="phone" type="tel" autoComplete="tel" placeholder="0754 000 000" className={box} /></label>
      <label><span className={label}>Topic</span><select name="topic" required defaultValue="" className={box}><option value="" disabled>Choose a topic…</option>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label className="sm:col-span-2"><span className={label}>Message</span><textarea name="message" required minLength={10} rows={6} className={box} placeholder="How can we help?" /></label>
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button disabled={state === "busy"} className="rounded-md bg-blue px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-blue/20 transition hover:bg-deep disabled:opacity-60">{state === "busy" ? "Sending…" : "Send message"}</button>
        {err && <p role="alert" className="text-sm font-medium text-vigil">{err}</p>}
      </div>
    </form>
  );
}
