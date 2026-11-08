"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Compose({ label, ghost, confirm: ask }: { label: string; ghost?: boolean; confirm?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function run() {
    if (ask && !window.confirm(ask)) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/newsletter/compose", { method: "POST" }).catch(() => null);
    const d = await res?.json().catch(() => ({}));
    setBusy(false);
    setMsg(res?.ok ? `Draft ready with ${d.items} items.` : d?.error ?? "Failed");
    if (res?.ok) router.refresh();
  }
  return (
    <div>
      <button onClick={run} disabled={busy} className={ghost ? "rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-blue hover:text-blue disabled:opacity-50" : "rounded-full bg-blue px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue/25 transition hover:bg-deep disabled:opacity-50"}>{busy ? "Composing…" : label}</button>
      {msg && <p role="status" className="mt-2 text-sm font-medium text-emerald-700">{msg}</p>}
    </div>
  );
}
