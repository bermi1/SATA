"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkDone({ id, done }: { id: string; done: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} onClick={async () => { setBusy(true); await fetch("/api/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: done ? "new" : "done" }) }); router.refresh(); setBusy(false); }}
      className={`rounded-full px-3 py-1 text-[11.5px] font-semibold transition ${done ? "bg-mist text-muted hover:text-ink" : "bg-deep text-white hover:bg-blue"}`}>
      {busy ? "…" : done ? "Reopen" : "Mark done"}
    </button>
  );
}
