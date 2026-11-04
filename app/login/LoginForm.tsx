"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props { next?: string; preset?: string; presetLabel?: string; presetHint?: string }

const input = "w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-blue focus:ring-4 focus:ring-blue/10";
const button = "w-full rounded-full bg-blue px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue/25 hover:bg-deep disabled:opacity-60";

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { error?: string; home?: string; devCode?: string };
  return { ok: res.ok, data };
}

export default function LoginForm({ next, preset, presetLabel, presetHint }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState("");

  function finish(home?: string) {
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : home ?? "/portal");
    router.refresh();
  }

  async function sendCode(addr: string) {
    setBusy(true);
    setErr("");
    const { ok, data } = await post("/api/auth/request", { email: addr });
    setBusy(false);
    if (!ok) return setErr(data.error ?? "Could not send the code");
    setEmail(addr);
    setDevCode(data.devCode ?? "");
    setSent(true);
  }

  async function verify(code: string) {
    setBusy(true);
    setErr("");
    const { ok, data } = await post("/api/auth/verify", { email, code });
    if (!ok) {
      setBusy(false);
      return setErr(data.error ?? "Could not sign in");
    }
    finish(data.home);
  }

  async function demo(addr: string) {
    setBusy(true);
    const { ok, data } = await post("/api/auth/demo", { email: addr });
    if (!ok) {
      setBusy(false);
      return setErr(data.error ?? "Could not sign in");
    }
    finish(data.home);
  }

  if (preset) {
    return (
      <button onClick={() => demo(preset)} disabled={busy} className="flex items-center justify-between rounded-xl border border-amber-200 bg-white px-4 py-3 text-left transition hover:border-blue disabled:opacity-60">
        <span><span className="block text-sm font-semibold text-deep">{presetLabel}</span><span className="text-xs text-muted">{presetHint}</span></span>
        <span className="text-blue">→</span>
      </button>
    );
  }

  if (sent) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); verify(String(new FormData(e.currentTarget).get("code"))); }} className="space-y-3">
        <p className="text-sm text-muted">If <strong className="text-deep">{email}</strong> is a registered SATA email, a 6-digit code is on its way. It expires in 10 minutes.</p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Sign-in code</span>
          <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required autoFocus placeholder="123456" className={`${input} text-center text-lg tracking-[0.4em]`} />
        </label>
        {devCode && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Development mode: no email provider is set, so your code is <strong>{devCode}</strong>.</p>}
        <button disabled={busy} className={button}>{busy ? "Checking…" : "Sign in"}</button>
        <button type="button" onClick={() => { setSent(false); setErr(""); }} className="w-full text-center text-sm text-blue hover:underline">Use a different email or resend</button>
        {err && <p role="alert" className="text-sm text-vigil">{err}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); sendCode(String(new FormData(e.currentTarget).get("email")).trim()); }} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Email</span>
        <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={input} />
      </label>
      <button disabled={busy} className={button}>{busy ? "Sending…" : "Email me a sign-in code"}</button>
      {err && <p role="alert" className="text-sm text-vigil">{err}</p>}
    </form>
  );
}
