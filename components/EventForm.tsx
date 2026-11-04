"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface EventFormValues {
  id?: string;
  title?: string; type?: string; mode?: string; status?: string; startsAt?: string; endsAt?: string; venue?: string;
  link?: string; externalUrl?: string; summary?: string; theme?: string; capacity?: number | null; cpdPoints?: number;
  memberFee?: number; guestFee?: number; minutesRequired?: number; image?: string;
}

const TYPES = [["conference", "Conference"], ["agm", "Conference & AGM"], ["workshop", "Workshop"], ["webinar", "Webinar"], ["meeting", "Meeting"], ["marathon", "Marathon / fun run"], ["training", "Training"]];
const box = "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";

function Field({ label, hint, children, span }: { label: string; hint?: string; children: React.ReactNode; span?: boolean }) {
  return (
    <label className={`block ${span ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export default function EventForm({ values = {} }: { values?: EventFormValues }) {
  const router = useRouter();
  const editing = !!values.id;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState<string | null>(values.image ?? null);
  const [mode, setMode] = useState(values.mode ?? "physical");
  const [type, setType] = useState(values.type ?? "conference");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch(editing ? `/api/admin/events/${values.id}` : "/api/admin/events", { method: editing ? "PATCH" : "POST", body: new FormData(e.currentTarget) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setErr(data?.error ?? "Could not save the event");
      setBusy(false);
      return;
    }
    router.push(`/admin/events/${data.id ?? values.id}`);
    router.refresh();
  }

  const online = mode !== "physical";
  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      {/* Poster */}
      <div className="sm:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Event poster</span>
        <label className="group relative flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-mist p-4 text-center transition hover:border-blue">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Poster preview" className="max-h-72 w-auto rounded-xl object-contain shadow-lg" />
          ) : (
            <>
              <span className="grid size-12 place-items-center rounded-full bg-blue/10 text-2xl text-blue">↑</span>
              <span className="mt-3 text-sm font-semibold text-deep">Tap to upload a poster</span>
              <span className="text-xs text-muted">PNG, JPG or WebP · up to 5 MB</span>
            </>
          )}
          <input type="file" name="poster" accept="image/png,image/jpeg,image/webp" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} />
        </label>
      </div>

      <Field label="Title" span><input name="title" required minLength={3} defaultValue={values.title} className={box} placeholder="Critical Care Webinar: Sepsis Bundles" /></Field>
      <Field label="Type">
        <select name="type" value={type} onChange={(e) => { setType(e.target.value); if (e.target.value === "webinar") setMode("online"); }} className={box}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </Field>
      <Field label="Format">
        <select name="mode" value={mode} onChange={(e) => setMode(e.target.value)} className={box}><option value="physical">In person</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select>
      </Field>
      <Field label="Starts (East Africa Time)"><input name="startsAt" type="datetime-local" required defaultValue={values.startsAt} className={box} /></Field>
      <Field label="Ends (East Africa Time)"><input name="endsAt" type="datetime-local" required defaultValue={values.endsAt} className={box} /></Field>
      <Field label={online ? "Platform" : "Venue"} span><input name="venue" required defaultValue={values.venue} className={box} placeholder={online ? "Zoom" : "City Garden Park Hall, Mbeya"} /></Field>
      {online && <Field label="Join link" hint="Shown to registered, paid attendees." span><input name="link" type="url" defaultValue={values.link} className={box} placeholder="https://" /></Field>}
      <Field label="Theme (optional)" span><input name="theme" defaultValue={values.theme} className={box} /></Field>
      <Field label="Description" span><textarea name="summary" required rows={4} defaultValue={values.summary} className={box} placeholder="What will attendees learn or do?" /></Field>

      <Field label="Capacity" hint="Leave blank for unlimited."><input name="capacity" type="number" min={0} defaultValue={values.capacity ?? ""} className={box} /></Field>
      <Field label="CPD points"><input name="cpdPoints" type="number" min={0} defaultValue={values.cpdPoints ?? 0} className={box} /></Field>
      <Field label="Member fee (TZS)" hint="0 = free for members."><input name="memberFee" type="number" min={0} defaultValue={values.memberFee ?? 0} className={box} /></Field>
      <Field label="Guest fee (TZS)" hint="Non-members who register on the website."><input name="guestFee" type="number" min={0} defaultValue={values.guestFee ?? 0} className={box} /></Field>
      {online && <Field label="Minutes online to count" hint="Attendance below this is not credited with CPD." span><input name="minutesRequired" type="number" min={0} defaultValue={values.minutesRequired ?? ""} className={box} /></Field>}
      <Field label="Register on another site (optional)" hint="If registration happens elsewhere, e.g. aaac2027.com." span><input name="externalUrl" type="url" defaultValue={values.externalUrl} className={box} placeholder="https://" /></Field>

      <Field label="Visibility" span>
        <select name="status" defaultValue={values.status ?? "published"} className={box}>
          <option value="published">Published: visible on the website, registration open</option>
          <option value="draft">Draft: hidden from the public</option>
          <option value="cancelled">Cancelled: visible but registration closed</option>
        </select>
      </Field>

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button disabled={busy} className="rounded-full bg-blue px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue/25 transition hover:bg-deep disabled:opacity-60">{busy ? "Saving…" : editing ? "Save changes" : "Create event"}</button>
        {err && <p role="alert" className="text-sm font-medium text-vigil">{err}</p>}
      </div>
    </form>
  );
}
