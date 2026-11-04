"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "draft" | "published" | "cancelled";

export function EventActions({ id, status, canDelete }: { id: string; status: Status; canDelete: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run(init: RequestInit, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/admin/events/${id}`, init).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) { setErr(data?.error ?? "Failed"); return; }
    router.refresh();
  }
  const set = (s: Status, confirmText?: string) => run({ method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: s }) }, confirmText);
  const btn = "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "published" && <button disabled={busy} onClick={() => set("published")} className={`${btn} border-blue bg-blue text-white hover:bg-deep`}>{status === "draft" ? "Publish" : "Reopen"}</button>}
      {status === "published" && <button disabled={busy} onClick={() => set("draft")} className={`${btn} border-line bg-white hover:border-blue hover:text-blue`}>Unpublish</button>}
      {status !== "cancelled" && <button disabled={busy} onClick={() => set("cancelled", "Cancel this event? Registration will close.")} className={`${btn} border-line bg-white hover:border-amber-400 hover:text-amber-700`}>Cancel event</button>}
      {canDelete && <button disabled={busy} onClick={() => run({ method: "DELETE" }, "Delete this event permanently?")} className={`${btn} border-vigil/30 bg-white text-vigil hover:bg-vigil/5`}>Delete</button>}
      {err && <span className="text-xs text-vigil">{err}</span>}
    </div>
  );
}
