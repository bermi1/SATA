"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Small up / down / delete controls used by the website editor lists.
export function RowControls({ url, idKey, id, move, label }: { url: string; idKey: string; id: string; move?: boolean; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function call(init: RequestInit) {
    setBusy(true);
    await fetch(url, { headers: { "content-type": "application/json" }, ...init });
    setBusy(false);
    router.refresh();
  }
  const b = "grid size-8 place-items-center rounded-full border border-line bg-white text-xs font-bold transition hover:border-blue hover:text-blue disabled:opacity-40";
  return (
    <div className="flex items-center gap-1.5">
      {move && <><button disabled={busy} aria-label={`Move ${label} up`} className={b} onClick={() => call({ method: "PATCH", body: JSON.stringify({ [idKey]: id, dir: -1 }) })}>↑</button><button disabled={busy} aria-label={`Move ${label} down`} className={b} onClick={() => call({ method: "PATCH", body: JSON.stringify({ [idKey]: id, dir: 1 }) })}>↓</button></>}
      <button disabled={busy} aria-label={`Remove ${label}`} className={`${b} border-vigil/30 text-vigil hover:border-vigil hover:text-vigil`} onClick={() => window.confirm(`Remove ${label}?`) && call({ method: "DELETE", body: JSON.stringify({ [idKey]: id }) })}>✕</button>
    </div>
  );
}
