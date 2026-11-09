"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import LibraryForm, { type LibraryItem } from "@/components/LibraryForm";

type Status = "pending" | "published" | "rejected";

/** Per-item actions: approve / reject with a note, edit (with upload), unpublish, delete. */
export default function ReviewControls({ item, status }: { item: LibraryItem; status: Status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);

  async function call(method: "PATCH" | "DELETE", body: Record<string, string>) {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/library", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) { setErr(data?.error ?? "Could not save"); return; }
    router.refresh();
  }
  const btn = "rounded-full px-4 py-2 text-xs font-bold transition disabled:opacity-60";
  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {status !== "published" && <button disabled={busy} onClick={() => call("PATCH", { id: item.id, action: "approve", note })} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>{status === "pending" ? "Approve" : "Publish"}</button>}
        {status === "published" && <button disabled={busy} onClick={() => window.confirm("Unpublish this item?") && call("PATCH", { id: item.id, action: "unpublish" })} className={`${btn} border border-line bg-white text-deep hover:border-blue`}>Unpublish</button>}
        <button onClick={() => setEditing((v) => !v)} className={`${btn} border border-line bg-white text-deep hover:border-blue`}>{editing ? "Close editor" : status === "pending" ? "Edit before approving" : "Edit"}</button>
        <button disabled={busy} onClick={() => window.confirm(`Delete "${item.title}" permanently?`) && call("DELETE", { id: item.id })} className={`${btn} border border-vigil/30 bg-white text-vigil hover:border-vigil`}>Delete</button>
      </div>
      {status === "pending" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to the author (required to reject)" aria-label="Note to the author" className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-blue focus:ring-4 focus:ring-blue/10" />
          <button disabled={busy} onClick={() => call("PATCH", { id: item.id, action: "reject", note })} className={`${btn} shrink-0 bg-vigil text-white hover:opacity-90`}>Reject with note</button>
        </div>
      )}
      {err && <p role="alert" className="text-sm font-medium text-vigil">{err}</p>}
      {editing && <div className="rounded-2xl bg-mist p-4"><LibraryForm url="/api/admin/library" item={item} admin submit="Save changes" success="Saved" /></div>}
    </div>
  );
}
