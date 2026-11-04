"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const KINDS = [["deadline", "Deadline"], ["meeting", "Committee / department meeting"], ["training", "Training"], ["holiday", "Observance / holiday"], ["other", "Other date"]];
const box = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";

export default function CalendarItemForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/calendar", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: fd.get("title"), date: fd.get("date"), endDate: fd.get("endDate") || undefined, kind: fd.get("kind"), notes: fd.get("notes") || undefined, href: fd.get("href") || undefined, membersOnly: fd.get("membersOnly") === "on" }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) { setMsg({ ok: false, text: data?.error ?? "Could not save" }); return; }
    setMsg({ ok: true, text: "Added to the calendar" });
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input name="title" required minLength={3} placeholder="What is happening? e.g. AGM notice deadline" className={`${box} sm:col-span-2`} />
      <label><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Date</span><input name="date" type="date" required className={box} /></label>
      <label><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">End date (optional)</span><input name="endDate" type="date" className={box} /></label>
      <select name="kind" defaultValue="deadline" className={`${box} sm:col-span-2`} aria-label="Type">{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <input name="notes" placeholder="Note (optional)" className={`${box} sm:col-span-2`} />
      <input name="href" type="url" placeholder="Link (optional)" className={`${box} sm:col-span-2`} />
      <label className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-semibold text-deep sm:col-span-2"><input type="checkbox" name="membersOnly" className="size-4 accent-blue" />Visible to members only</label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button disabled={busy} className="rounded-full bg-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-deep disabled:opacity-60">{busy ? "Adding…" : "Add to calendar"}</button>{msg && <span role="status" className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-vigil"}`}>{msg.text}</span>}</div>
    </form>
  );
}
