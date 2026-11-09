"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RESOURCE_KINDS, RESOURCE_LABEL } from "@/lib/types";

export interface LibraryItem { id: string; title: string; kind: string; description: string; url: string; membersOnly: boolean; year?: number; author?: string; closesAt?: string }

const box = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";
const lab = "mb-1 block text-xs font-semibold uppercase tracking-wider text-muted";

/** Library item form used by members (submit for review) and the Education committee (add / edit). */
export default function LibraryForm({ url, item, admin, kinds = [...RESOURCE_KINDS], submit, success, onDone }: {
  url: string;
  item?: LibraryItem;
  admin?: boolean;
  kinds?: string[];
  submit: string;
  success: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const label = (k: string) => RESOURCE_LABEL[k as keyof typeof RESOURCE_LABEL] ?? k;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (admin) fd.set("membersOnly", fd.get("membersOnly") === "on" ? "true" : "false");
    if (item) fd.set("id", item.id);
    setBusy(true);
    setMsg(null);
    const res = await fetch(url, { method: "POST", body: fd }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) { setMsg({ ok: false, text: data?.error ?? "Could not save. Try again." }); return; }
    setMsg({ ok: true, text: success });
    if (!item) form.reset();
    onDone?.();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3.5 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className={lab}>Title</span><input name="title" required defaultValue={item?.title} className={box} /></label>
      <label><span className={lab}>Type</span><select name="kind" defaultValue={item?.kind ?? kinds[0]} className={box}>{kinds.map((k) => <option key={k} value={k}>{label(k)}</option>)}</select></label>
      <label><span className={lab}>Year</span><input name="year" type="number" min={1950} max={2100} defaultValue={item?.year ?? new Date().getFullYear()} className={box} /></label>
      <label className="sm:col-span-2"><span className={lab}>Authors</span><input name="author" placeholder="e.g. A. Mushi, B. Kimaro" defaultValue={item?.author} className={box} /></label>
      <label className="sm:col-span-2"><span className={lab}>Abstract / description</span><textarea name="description" required rows={5} defaultValue={item?.description} className={box} /></label>
      <label className="rounded-xl border border-dashed border-line bg-white p-3 text-sm sm:col-span-2">
        <span className="block font-semibold text-deep">Upload a PDF</span>
        <span className="mb-2 block text-xs text-muted">Up to 20 MB. Or paste an external link below instead.</span>
        <input type="file" name="file" accept="application/pdf" className="block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-blue file:px-4 file:py-2 file:text-xs file:font-bold file:text-white" />
      </label>
      <label className="sm:col-span-2"><span className={lab}>External link (optional if you upload a PDF)</span><input name="url" placeholder={item?.url.startsWith("/api/uploads") ? "Leave empty to keep the uploaded file" : "https://…"} defaultValue={item && !item.url.startsWith("/api/uploads") ? item.url : ""} className={box} /></label>
      {admin && (
        <>
          <label><span className={lab}>Closes on (optional)</span><input name="closesAt" type="date" defaultValue={item?.closesAt} className={box} /></label>
          <label className="flex items-center gap-2 self-end rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-semibold text-deep"><input type="checkbox" name="membersOnly" defaultChecked={item ? item.membersOnly : true} className="size-4 accent-blue" />Members only</label>
        </>
      )}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button disabled={busy} className="rounded-full bg-blue px-6 py-2.5 text-sm font-bold text-white transition hover:bg-deep disabled:opacity-60">{busy ? "Saving…" : submit}</button>
        {msg && <span role="status" className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-vigil"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
