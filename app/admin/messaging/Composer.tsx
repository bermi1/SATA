"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Opt { value: string; label: string }
interface Preview { recipients: number; smsReachable: number; emailReachable: number; noPhone: number; segmentsPerMessage: number; totalSegments: number; sample: string; smsProvider: string; emailProvider: string }

const AUDIENCES: Opt[] = [
  { value: "all_members", label: "All members" },
  { value: "good_standing", label: "Members in good standing" },
  { value: "overdue", label: "Members overdue (not paid)" },
  { value: "expiring", label: "Members expiring within 30 days" },
  { value: "pending", label: "Pending applicants" },
  { value: "department", label: "A department…" },
  { value: "event_registrants", label: "Registrants of an event…" },
  { value: "event_unpaid", label: "Event registrants who haven't paid…" },
  { value: "event_absent", label: "Event no-shows…" },
  { value: "subscribers", label: "Newsletter subscribers" },
  { value: "everyone", label: "Everyone (members + subscribers)" },
];

const TEMPLATES: { label: string; sms: boolean; subject?: string; body: string }[] = [
  { label: "Payment reminder", sms: true, subject: "Your SATA membership", body: "SATA: Dear {name}, your membership {memberNo} is due. Renew ({fee}) via M-Pesa, Airtel, Mixx or GePG at sata.co.tz/portal/payments. Asante." },
  { label: "Event reminder", sms: true, subject: "Event reminder", body: "SATA: Reminder: our event is coming up. Please check sata.co.tz/events for details and bring your ticket." },
  { label: "AGM notice", sms: true, subject: "Notice of AGM", body: "SATA: Dear {name}, the Annual General Meeting notice is now on sata.co.tz/news. Please plan to attend. Asante." },
  { label: "General notice", sms: true, subject: "News from SATA", body: "SATA: Dear {name}, " },
];

export default function Composer({ events, departments, initial, canSend }: { events: Opt[]; departments: Opt[]; initial: { type?: string; id?: string }; canSend: boolean }) {
  const router = useRouter();
  const [type, setType] = useState(initial.type && AUDIENCES.some((a) => a.value === initial.type) ? initial.type : "overdue");
  const [id, setId] = useState(initial.id ?? "");
  const [sms, setSms] = useState(true);
  const [email, setEmail] = useState(false);
  const [inApp, setInApp] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const needsEvent = type.startsWith("event_");
  const needsDept = type === "department";
  const needsId = needsEvent || needsDept;
  const idOptions = needsEvent ? events : departments;
  const ready = !needsId || !!id;

  // eslint-disable-next-line react-hooks/set-state-in-effect -- keeps the selected id valid when the audience type changes
  useEffect(() => { if (needsId && !idOptions.some((o) => o.value === id)) setId(idOptions[0]?.value ?? ""); }, [needsId, idOptions, id]);

  const spec = useMemo(() => ({ type, ...(needsId && id ? { id } : {}) }), [type, id, needsId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the preview when the audience is incomplete is intentional
    if (!ready) { setPreview(null); return; }
    const t = setTimeout(async () => {
      const res = await fetch("/api/admin/messaging/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audience: spec, body }) });
      if (res.ok) setPreview(await res.json());
    }, 250);
    return () => clearTimeout(t);
  }, [spec, body, ready]);

  async function send() {
    if (!preview || !ready) return;
    const channels = [sms && "sms", email && "email"].filter(Boolean) as ("sms" | "email")[];
    const msg = `Send to ${preview.recipients} people${sms ? ` (${preview.smsReachable} by SMS, about ${preview.totalSegments} SMS segments)` : ""}? This cannot be undone.`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/admin/messaging", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audience: spec, channels, subject: email || inApp ? subject || undefined : undefined, body, inApp, confirmCount: preview.recipients }) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (res?.ok) {
      setResult({ ok: true, text: `Sent: ${data.sent} delivered, ${data.failed} failed, ${data.recipients} recipients.${data.failureText ? ` ${data.failureText}` : ""}` });
      setBody("");
      router.refresh();
    } else setResult({ ok: false, text: data?.error ?? "Could not send" });
  }

  const box = "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";
  const chip = "rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-deep hover:border-blue hover:text-blue";
  const channelsOk = sms || email;
  const canSubmit = canSend && ready && !!preview && preview.recipients > 0 && body.trim().length >= 3 && channelsOk && (!email || subject.trim().length > 0) && !busy;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <div className="space-y-5">
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Quick templates</span>
          <div className="flex flex-wrap gap-2">{TEMPLATES.map((t) => <button key={t.label} type="button" className={chip} onClick={() => { setBody(t.body); setSubject(t.subject ?? ""); }}>{t.label}</button>)}</div>
        </div>

        <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Send to</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className={box}>{AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select>
        </label>
        {needsId && (
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">{needsEvent ? "Event" : "Department"}</span>
            <select value={id} onChange={(e) => setId(e.target.value)} className={box}>{idOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </label>
        )}

        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Channels</span>
          <div className="flex flex-wrap gap-2">
            {([["SMS", sms, setSms], ["Email", email, setEmail], ["Also in the member portal", inApp, setInApp]] as const).map(([l, v, set]) => (
              <label key={l} className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${v ? "border-blue bg-blue/10 text-blue" : "border-line bg-white text-slate-600"}`}>
                <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} className="size-4 accent-blue" />{l}
              </label>
            ))}
          </div>
        </div>

        {(email || inApp) && <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Subject / title</span><input value={subject} onChange={(e) => setSubject(e.target.value)} className={box} placeholder="Your SATA membership" /></label>}

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted"><span>Message</span><span className={body.length > 160 ? "text-amber-600" : ""}>{body.length} chars{preview && sms ? ` · ${preview.segmentsPerMessage} SMS segment${preview.segmentsPerMessage === 1 ? "" : "s"}` : ""}</span></span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className={box} placeholder="Write your message…" />
        </label>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">Personalise: {["{name}", "{memberNo}", "{fee}", "{due}", "{days}"].map((t) => <button key={t} type="button" className={chip} onClick={() => setBody((b) => b + t)}>{t}</button>)}</div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-mist p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-blue">Audience preview</div>
          {preview ? (
            <>
              <div className="mt-2 font-display text-4xl font-extrabold text-deep">{preview.recipients}</div>
              <div className="text-sm text-muted">people will receive this</div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted">Reachable by SMS</dt><dd className="font-bold text-deep">{preview.smsReachable}</dd></div>
                <div><dt className="text-xs text-muted">Reachable by email</dt><dd className="font-bold text-deep">{preview.emailReachable}</dd></div>
                <div><dt className="text-xs text-muted">No valid phone</dt><dd className="font-bold text-deep">{preview.noPhone}</dd></div>
                <div><dt className="text-xs text-muted">Total SMS segments</dt><dd className="font-bold text-deep">{sms ? preview.totalSegments : 0}</dd></div>
              </dl>
              <div className={`mt-4 rounded-xl px-3 py-2 text-xs font-semibold ${preview.smsProvider === "demo" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>
                SMS: {preview.smsProvider === "demo" ? "Demo mode: messages are logged, not sent. Add provider keys to go live." : `Live via ${preview.smsProvider}`}
              </div>
            </>
          ) : <p className="mt-2 text-sm text-muted">Choose an audience to see who will be reached.</p>}
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-muted">How the first recipient sees it</div>
          <div className="mt-3 rounded-2xl rounded-bl-sm bg-blue/10 p-4 text-sm leading-relaxed text-deep">{(preview?.sample || body) || "Your message appears here."}</div>
        </div>

        {canSend ? (
          <button onClick={send} disabled={!canSubmit} className="w-full rounded-full bg-blue px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue/25 transition hover:bg-deep disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "Sending…" : preview ? `Send to ${preview.recipients} people` : "Send"}
          </button>
        ) : <p className="rounded-xl bg-mist p-4 text-sm text-muted">Your role can preview messages but not send them.</p>}
        {result && <p role="status" className={`rounded-xl p-4 text-sm font-medium ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-vigil/10 text-vigil"}`}>{result.text}</p>}
      </div>
    </div>
  );
}
