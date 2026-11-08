"use client";

import { ArrowDown, ArrowUp, ExternalLink, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { kindLabel } from "@/lib/newsletter-email";
import type { Newsletter, NewsletterItem } from "@/lib/types";
import Compose from "./Compose";

const input = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted";
const icon = "grid size-9 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-blue hover:text-blue disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink";

type Status = { ok: boolean; text: string } | null;

export default function Editor({ draft, recipients, canEdit }: { draft: Newsletter; recipients: number; canEdit: boolean }) {
  const router = useRouter();
  const [subject, setSubject] = useState(draft.subject);
  const [intro, setIntro] = useState(draft.intro);
  const [items, setItems] = useState<NewsletterItem[]>(draft.items);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [custom, setCustom] = useState({ title: "", summary: "", url: "", image: "" });

  async function call(url: string, method: "PUT" | "POST", body: unknown) {
    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    return { ok: !!res?.ok, data: (data ?? {}) as Record<string, unknown> };
  }

  async function save(next: { subject?: string; intro?: string; items?: NewsletterItem[] }, okText = "Saved") {
    setBusy("save");
    const r = await call("/api/admin/newsletter", "PUT", { id: draft.id, subject, intro, items, ...next });
    setBusy("");
    setStatus({ ok: r.ok, text: r.ok ? okText : String(r.data.error ?? "Could not save") });
    return r.ok;
  }

  async function setList(next: NewsletterItem[]) {
    const prev = items;
    setItems(next);
    if (!(await save({ items: next }))) setItems(prev);
  }
  const move = (i: number, d: -1 | 1) => {
    const n = [...items];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    return setList(n);
  };
  const pin = (i: number) => {
    const n = items.map((x, k) => (k === i ? { ...x, pinned: !x.pinned } : x));
    if (!items[i].pinned) {
      const [it] = n.splice(i, 1);
      n.unshift(it);
    }
    return setList(n);
  };
  const remove = (i: number) => setList(items.filter((_, k) => k !== i));
  const patch = (i: number, p: Partial<NewsletterItem>) => setItems(items.map((x, k) => (k === i ? { ...x, ...p } : x)));

  async function addCustom(e: React.FormEvent) {
    e.preventDefault();
    const it: NewsletterItem = { title: custom.title.trim(), summary: custom.summary.trim(), url: custom.url.trim(), image: custom.image.trim() || undefined, source: "SATA", kind: "custom", pinned: true };
    const next = [it, ...items];
    const prev = items;
    setItems(next);
    if (await save({ items: next }, "Item added at the top")) {
      setCustom({ title: "", summary: "", url: "", image: "" });
      setAdding(false);
    } else setItems(prev);
  }

  async function test() {
    setBusy("test");
    setStatus(null);
    if (!(await save({}, "Saved"))) return setBusy("");
    const r = await call("/api/admin/newsletter/test", "POST", { id: draft.id });
    setBusy("");
    setStatus({ ok: r.ok, text: r.ok ? (r.data.demo ? "Demo mode: the test was recorded but no email was sent." : `Test sent to ${r.data.to}.`) : String(r.data.error ?? "Could not send the test") });
  }

  async function send() {
    setBusy("send");
    setStatus(null);
    if (!(await save({}, "Saved"))) return setBusy("");
    const r = await call("/api/admin/newsletter/send", "POST", { id: draft.id });
    setBusy("");
    setConfirmSend(false);
    if (r.ok) {
      setStatus({ ok: true, text: `${r.data.demo ? "Recorded (demo mode, no email sent)" : "Sent"}: ${r.data.sent} delivered${r.data.failed ? `, ${r.data.failed} failed` : ""}.` });
      router.refresh();
    } else setStatus({ ok: false, text: String(r.data.error ?? "Send failed") });
  }

  const dirty = subject !== draft.subject || intro !== draft.intro;

  return (
    <>
      <section className="min-w-0 rounded-2xl border border-line bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-base font-bold text-deep">This week&rsquo;s draft <span className="font-normal text-muted">· week of {new Date(`${draft.weekOf}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</span></h2>
          {canEdit && <Compose label="Compose again" ghost confirm="Replace the current items and intro with a fresh draft? Your edits to the items will be lost." />}
        </header>
        <div className="grid gap-4 p-5">
          <label className="block">
            <span className={label}>Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!canEdit} maxLength={200} className={input} />
          </label>
          <label className="block">
            <span className={label}>Introduction</span>
            <textarea value={intro} onChange={(e) => setIntro(e.target.value)} disabled={!canEdit} rows={5} maxLength={2000} className={input} />
          </label>
          {canEdit && (
            <div>
              <button onClick={() => save({ subject, intro }, "Subject and intro saved")} disabled={busy !== "" || !dirty} className="rounded-full bg-deep px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue disabled:opacity-40">{busy === "save" ? "Saving…" : "Save subject & intro"}</button>
            </div>
          )}
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-line bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-base font-bold text-deep">Stories <span className="font-normal text-muted">· {items.length}</span></h2>
          {canEdit && <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-blue hover:text-blue"><Plus className="size-4" />Add custom item</button>}
        </header>
        <div className="p-3 sm:p-5">
          {adding && (
            <form onSubmit={addCustom} className="mb-5 grid gap-3 rounded-2xl border border-blue/30 bg-blue/5 p-4 sm:grid-cols-2">
              <label className="block sm:col-span-2"><span className={label}>Title</span><input required maxLength={200} value={custom.title} onChange={(e) => setCustom({ ...custom, title: e.target.value })} className={input} /></label>
              <label className="block sm:col-span-2"><span className={label}>Summary</span><textarea rows={3} maxLength={200} value={custom.summary} onChange={(e) => setCustom({ ...custom, summary: e.target.value })} className={input} /></label>
              <label className="block"><span className={label}>Link</span><input required type="url" placeholder="https://" value={custom.url} onChange={(e) => setCustom({ ...custom, url: e.target.value })} className={input} /></label>
              <label className="block"><span className={label}>Image URL (optional)</span><input type="url" placeholder="https://" value={custom.image} onChange={(e) => setCustom({ ...custom, image: e.target.value })} className={input} /></label>
              <div className="flex gap-3 sm:col-span-2">
                <button disabled={busy !== ""} className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-deep disabled:opacity-50">Add to newsletter</button>
                <button type="button" onClick={() => setAdding(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-muted hover:text-ink">Cancel</button>
              </div>
            </form>
          )}

          {items.length === 0 ? <p className="p-2 text-sm text-muted">No stories. Compose again or add a custom item.</p> : (
            <ol className="grid gap-3">
              {items.map((it, i) => (
                <li key={`${it.url}-${i}`} className={`rounded-2xl border p-3 sm:p-4 ${it.pinned ? "border-blue/40 bg-blue/5" : "border-line bg-white"}`}>
                  <div className="flex gap-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-mist text-sm font-bold text-deep">{i + 1}</div>
                    {it.image && (
                      // eslint-disable-next-line @next/next/no-img-element -- remote thumbnails from many hosts
                      <img src={it.image} alt="" className="hidden h-16 w-24 shrink-0 rounded-lg bg-mist object-cover sm:block" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className={`font-bold uppercase tracking-wider ${it.kind === "announcement" || it.kind === "event" ? "text-vigil" : "text-blue"}`}>{kindLabel(it.kind)}</span>
                        {it.pinned && <span className="inline-flex items-center gap-1 font-semibold text-blue"><Pin className="size-3" />Pinned</span>}
                        <span className="text-muted">{it.source}</span>
                      </div>
                      {editing === i ? (
                        <div className="mt-2 grid gap-2">
                          <input value={it.title} onChange={(e) => patch(i, { title: e.target.value })} maxLength={200} className={input} aria-label="Title" />
                          <textarea value={it.summary} onChange={(e) => patch(i, { summary: e.target.value })} maxLength={200} rows={3} className={input} aria-label="Summary" />
                          <div><button onClick={async () => { if (await save({ items })) setEditing(null); }} className="rounded-full bg-deep px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue">Save</button></div>
                        </div>
                      ) : (
                        <>
                          <a href={it.url} target="_blank" rel="noreferrer" className="mt-1 block font-semibold leading-snug text-deep hover:text-blue">{it.title}<ExternalLink className="ml-1 inline size-3 opacity-50" /></a>
                          <p className="mt-1 text-sm text-muted">{it.summary}</p>
                        </>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
                      <button className={icon} onClick={() => move(i, -1)} disabled={i === 0 || busy !== ""} aria-label="Move up" title="Move up"><ArrowUp className="size-4" /></button>
                      <button className={icon} onClick={() => move(i, 1)} disabled={i === items.length - 1 || busy !== ""} aria-label="Move down" title="Move down"><ArrowDown className="size-4" /></button>
                      <button className={icon} onClick={() => pin(i)} disabled={busy !== ""} aria-label={it.pinned ? "Unpin" : "Pin to top"} title={it.pinned ? "Unpin" : "Pin to top"}>{it.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}</button>
                      <button className={icon} onClick={() => setEditing(editing === i ? null : i)} aria-label="Edit text" title="Edit text"><Pencil className="size-4" /></button>
                      <button className={`${icon} ml-auto text-vigil hover:border-vigil hover:text-vigil`} onClick={() => remove(i)} disabled={busy !== ""} aria-label="Remove" title="Remove"><Trash2 className="size-4" /></button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {canEdit && (
        <section className="min-w-0 rounded-2xl border border-line bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button onClick={test} disabled={busy !== ""} className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-blue hover:text-blue disabled:opacity-50">{busy === "test" ? "Sending…" : "Send test to me"}</button>
            {!confirmSend ? (
              <button onClick={() => setConfirmSend(true)} disabled={busy !== "" || items.length === 0 || recipients === 0} className="rounded-full bg-vigil px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-vigil/25 transition hover:opacity-90 disabled:opacity-40">Send to all ({recipients.toLocaleString("en-US")} recipients)</button>
            ) : (
              <div role="alertdialog" aria-label="Confirm send" className="flex flex-col gap-3 rounded-2xl border border-vigil/40 bg-vigil/5 p-4 sm:flex-row sm:items-center">
                <p className="text-sm font-semibold text-ink">Send &ldquo;{subject}&rdquo; to {recipients.toLocaleString("en-US")} people now? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={send} disabled={busy !== ""} className="rounded-full bg-vigil px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === "send" ? "Sending…" : "Yes, send"}</button>
                  <button onClick={() => setConfirmSend(false)} disabled={busy === "send"} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold">Cancel</button>
                </div>
              </div>
            )}
          </div>
          {status && <p role="status" className={`mt-3 text-sm font-medium ${status.ok ? "text-emerald-700" : "text-vigil"}`}>{status.text}</p>}
        </section>
      )}
      {!canEdit && <p className="text-sm text-muted">You can review the draft, but only the secretariat can edit or send it.</p>}
    </>
  );
}
