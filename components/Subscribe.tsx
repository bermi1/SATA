"use client";

import { useState } from "react";

// Newsletter signup: email required, phone optional (for SMS reminders, with explicit consent).
export function Subscribe({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [msg, setMsg] = useState("");
  const dark = tone === "dark";
  const input = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${dark ? "border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-sky-300 focus:ring-sky-300/20" : "border-line bg-white text-ink focus:border-blue focus:ring-blue/10"}`;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("busy");
    setMsg("");
    const phone = String(fd.get("phone") ?? "").trim();
    const res = await fetch("/api/subscribe", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: String(fd.get("email")), phone: phone || undefined, name: String(fd.get("name") ?? "") || undefined, smsConsent: !!phone && fd.get("sms") === "on" }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) { setState("done"); setMsg(data.already ? "You're already subscribed. We've updated your details." : "You're subscribed. Welcome to the SATA community."); }
    else { setState("idle"); setMsg(data?.error ?? "Something went wrong. Try again."); }
  }

  if (state === "done") return <p role="status" className={`rounded-2xl p-5 text-sm font-semibold ${dark ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-800"}`}>✓ {msg}</p>;
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2" aria-label="Newsletter signup">
      <input name="name" placeholder="Your name (optional)" autoComplete="name" className={input} />
      <input name="email" type="email" required placeholder="Email address" autoComplete="email" className={input} />
      <input name="phone" type="tel" placeholder="Phone, e.g. 0754 000 000 (optional)" autoComplete="tel" className={input} />
      <button disabled={state === "busy"} className={`rounded-xl px-6 py-3 text-sm font-bold transition disabled:opacity-60 ${dark ? "bg-white text-deep hover:bg-mist" : "bg-blue text-white hover:bg-deep"}`}>{state === "busy" ? "Subscribing…" : "Subscribe"}</button>
      <label className={`flex items-start gap-2 text-xs sm:col-span-2 ${dark ? "text-white/60" : "text-muted"}`}>
        <input type="checkbox" name="sms" defaultChecked className="mt-0.5 size-4 accent-blue" />
        <span>Also send me SMS updates and event reminders. You can opt out at any time.</span>
      </label>
      {msg && <p role="alert" className="text-sm font-medium text-vigil sm:col-span-2">{msg}</p>}
    </form>
  );
}
