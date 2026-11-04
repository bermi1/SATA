"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegistrantActions({ id, paid }: { id: string; paid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function act(action: "paid" | "unpaid" | "remove") {
    if (action === "remove" && !window.confirm("Remove this registration?")) return;
    setBusy(true);
    await fetch("/api/admin/registrations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action }) });
    setBusy(false);
    router.refresh();
  }
  return (
    <div className="flex gap-1.5">
      <button disabled={busy} onClick={() => act(paid ? "unpaid" : "paid")} className="rounded-full border border-line px-3 py-1 text-xs font-semibold hover:border-blue hover:text-blue disabled:opacity-50">{paid ? "Mark unpaid" : "Mark paid"}</button>
      <button disabled={busy} onClick={() => act("remove")} aria-label="Remove registration" className="rounded-full border border-vigil/25 px-2.5 py-1 text-xs font-semibold text-vigil hover:bg-vigil/5 disabled:opacity-50">✕</button>
    </div>
  );
}
