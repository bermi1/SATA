"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RowControls } from "@/components/RowControls";

interface Item { id: string; title: string; kind: string; description: string; url: string; membersOnly: boolean; year?: number; author?: string; closesAt?: string }

const KINDS = [["report", "Report"], ["research", "Research"], ["publication", "Publication"], ["policy", "Policy"], ["guideline", "Guideline"], ["form", "Form"], ["media", "Photos & media"]];
const box = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";

function ResourceForm({ item }: { item?: Item }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("membersOnly", fd.get("membersOnly") === "on" ? "true" : "false");
    if (item) fd.set("id", item.id);
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/site/resources", { method: "POST", body: fd }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) { setMsg({ ok: false, text: data?.error ?? "Could not save" }); return; }
    setMsg({ ok: true, text: "Saved" });
    if (!item) form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input name="title" required placeholder="Title" defaultValue={item?.title} className={`${box} sm:col-span-2`} />
      <select name="kind" defaultValue={item?.kind ?? "publication"} className={box} aria-label="Type">{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <input name="year" type="number" min={1990} max={2100} placeholder="Year" defaultValue={item?.year} className={box} aria-label="Year" />
      <input name="author" placeholder="Author or issuing body" defaultValue={item?.author} className={`${box} sm:col-span-2`} />
      <textarea name="description" required rows={2} placeholder="Short description" defaultValue={item?.description} className={`${box} sm:col-span-2`} />
      <label className="rounded-xl border border-dashed border-line bg-white p-3 text-sm sm:col-span-2">
        <span className="block font-semibold text-deep">Upload a PDF</span>
        <span className="mb-2 block text-xs text-muted">Up to 20 MB. Or paste a link below instead.</span>
        <input type="file" name="file" accept="application/pdf" className="block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-blue file:px-4 file:py-2 file:text-xs file:font-bold file:text-white" />
      </label>
      <input name="url" placeholder={item ? "Link (leave as is to keep the current file or link)" : "…or a link, e.g. https://…"} defaultValue={item && !item.url.startsWith("/api/uploads") ? item.url : ""} className={`${box} sm:col-span-2`} />
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Closes on (optional)</span><input name="closesAt" type="date" defaultValue={item?.closesAt} className={box} /><span className="mt-1 block text-xs text-muted">After this date the item is marked Closed and moves to the archive automatically (event over, deadline passed).</span></label>
      <label className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-semibold text-deep sm:col-span-2"><input type="checkbox" name="membersOnly" defaultChecked={item?.membersOnly} className="size-4 accent-blue" />Members only</label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button disabled={busy} className="rounded-full bg-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-deep disabled:opacity-60">{busy ? "Saving…" : item ? "Save" : "Add to library"}</button>{msg && <span role="status" className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-vigil"}`}>{msg.text}</span>}</div>
    </form>
  );
}

export default function ResourcesEditor({ items, writable }: { items: Item[]; writable: boolean }) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {items.map((r) => (
          <li key={r.id} className="py-3 first:pt-0">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1"><div className="truncate font-semibold text-deep">{r.title}{r.membersOnly && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Members</span>}</div><div className="truncate text-xs text-muted">{r.kind}{r.year ? ` · ${r.year}` : ""} · {r.url}</div></div>
              {writable && <RowControls url="/api/admin/site/resources" idKey="id" id={r.id} label={r.title} />}
            </div>
            {writable && <details className="mt-2"><summary className="cursor-pointer text-xs font-bold text-blue">Edit</summary><div className="mt-3 rounded-2xl bg-mist p-4"><ResourceForm item={r} /></div></details>}
          </li>
        ))}
      </ul>
      {writable && <details className="mt-4 rounded-2xl border border-dashed border-blue/40 p-4"><summary className="cursor-pointer text-sm font-bold text-blue">+ Add a report, publication or document</summary><div className="mt-4"><ResourceForm /></div></details>}
    </div>
  );
}
