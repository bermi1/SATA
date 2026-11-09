"use client";

import { useState } from "react";

const input = "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-base outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10 sm:text-sm";
const fileInput = `${input} file:mr-3 file:rounded-full file:border-0 file:bg-mist file:px-3 file:py-1 file:text-xs file:font-semibold file:text-deep`;
const STEPS = ["Personal", "Contact", "Category", "Payment", "Declaration"];

interface Opt { value: string; label: string }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

// Multi-step membership application (sections A to E of SATA's official form). All inputs stay mounted, so the
// browser keeps every value while the member moves between steps; only the current step is visible.
export default function ApplyForm({ regions, fees }: { regions: string[]; fees: Opt[] }) {
  const [step, setStep] = useState(0);
  const [nat, setNat] = useState("");
  const [superSpec, setSuperSpec] = useState("No");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const foreign = nat.trim() !== "" && !/^tanzanian?$/i.test(nat.trim());

  const show = (i: number) => (i === step ? "grid gap-4" : "hidden");

  function validateStep(form: HTMLFormElement): boolean {
    const panel = form.querySelector<HTMLElement>(`[data-step="${step}"]`);
    if (!panel) return true;
    for (const el of panel.querySelectorAll<HTMLInputElement>("input, select, textarea")) {
      if (!el.checkValidity()) { el.reportValidity(); return false; }
    }
    return true;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!validateStep(form)) return;
    if (step < STEPS.length - 1) { setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const fd = new FormData(form);
    fd.set("declaration", fd.get("declaration") === "on" ? "true" : "false");
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/apply", { method: "POST", body: fd }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) { setErr(data?.error ?? "Network error. Please try again."); return; }
    setDone(data.memberNo);
  }

  if (done) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
        <h2 className="mt-4 font-display text-2xl font-extrabold text-deep">Application received</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">Your reference is <b className="font-mono text-deep">{done}</b>. The Membership &amp; Welfare team will verify your details and proof of payment. We will email you your certificate and digital ID card once you are approved.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted">
          <span>Step {step + 1} of {STEPS.length}: <span className="text-deep">{STEPS[step]}</span></span>
          <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-gradient-to-r from-blue to-deep transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <ol className="mt-3 hidden justify-between text-[11px] font-semibold uppercase tracking-wider sm:flex">
          {STEPS.map((s, i) => <li key={s} className={i <= step ? "text-blue" : "text-muted/60"}>{String.fromCharCode(65 + i)}. {s}</li>)}
        </ol>
      </div>

      <div data-step="0" className={show(0)}>
        <Field label="Full name *"><input name="name" required minLength={3} autoComplete="name" className={input} placeholder="Dr. Jane Mushi" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Gender *"><select name="gender" required defaultValue="" className={input}><option value="" disabled>Select…</option><option>Male</option><option>Female</option></select></Field>
          <Field label="Nationality *"><input name="nationality" required value={nat} onChange={(e) => setNat(e.target.value)} className={input} placeholder="Tanzanian" /></Field>
        </div>
        <Field label="Professional qualification *"><input name="qualification" required className={input} placeholder="e.g. MD, MMed Anaesthesia" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Any superspecialization? *"><select name="superspecialization" required value={superSpec} onChange={(e) => setSuperSpec(e.target.value)} className={input}><option>No</option><option>Yes</option></select></Field>
          {superSpec === "Yes" && <Field label="Please specify *"><input name="superspecializationDetails" required className={input} /></Field>}
        </div>
        <Field label={`Practising licence ${foreign ? "*" : "(foreigners only)"}`} hint="PDF, JPG or PNG. Required if you are not a Tanzanian national.">
          <input type="file" name="licence" required={foreign} accept="application/pdf,image/png,image/jpeg" className={fileInput} />
        </Field>
        <Field label="Medical Council registration number (optional)"><input name="councilNo" className={input} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current employer / institution *"><input name="employer" required className={input} /></Field>
          <Field label="Job title / designation *"><input name="jobTitle" required className={input} placeholder="e.g. Anaesthesiologist" /></Field>
        </div>
        <Field label="Years of practice in anaesthesia / critical care *"><input name="yearsOfPractice" type="number" inputMode="numeric" min={0} max={70} required className={input} /></Field>
      </div>

      <div data-step="1" className={show(1)}>
        <Field label="Email *"><input name="email" type="email" required autoComplete="email" className={input} /></Field>
        <Field label="Phone *" hint="Include the country code, e.g. +255754000000"><input name="phone" type="tel" required pattern="\+[0-9]{8,15}" title="Start with the country code, e.g. +255754000000" autoComplete="tel" className={input} placeholder="+255" /></Field>
        <Field label="Postal address"><textarea name="address" rows={2} className={input} /></Field>
        <Field label="Region"><select name="region" defaultValue="" className={input}><option value="">Select…</option>{regions.map((r) => <option key={r}>{r}</option>)}<option>Outside Tanzania</option></select></Field>
      </div>

      <div data-step="2" className={show(2)}>
        <Field label="Membership category *"><select name="category" required defaultValue="" className={input}><option value="" disabled>Select…</option>{fees.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
        <p className="rounded-xl bg-mist p-4 text-sm leading-relaxed text-muted">Full: licensed anaesthesiologists. Associate: anaesthetic officers, nurse anaesthetists, clinical officers, pharmacists and medical officers with an interest in anaesthesia. Honorary: by invitation of the Society.</p>
      </div>

      <div data-step="3" className={show(3)}>
        <Field label="Amount paid (TZS) *"><input name="amountPaid" type="number" inputMode="numeric" min={0} required className={input} /></Field>
        <Field label="Proof of payment *" hint="Screenshot, photo or PDF of your receipt, up to 4 MB.">
          <input type="file" name="paymentProof" required accept="application/pdf,image/png,image/jpeg,image/webp" className={fileInput} />
        </Field>
      </div>

      <div data-step="4" className={show(4)}>
        <label className="flex items-start gap-3 rounded-xl border border-line bg-mist p-4 text-sm font-semibold text-deep">
          <input type="checkbox" name="declaration" required className="mt-0.5 size-5 shrink-0 accent-blue" />
          I agree and wish to become a member of SATA.
        </label>
      </div>

      {err && <p role="alert" className="mt-4 text-sm font-medium text-vigil">{err}</p>}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || busy} className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-deep disabled:invisible">Back</button>
        <button disabled={busy} className="rounded-full bg-blue px-7 py-3 text-sm font-bold text-white transition hover:bg-deep disabled:opacity-60">
          {step < STEPS.length - 1 ? "Continue" : busy ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
