"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RunReminders() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function run() {
    if (!window.confirm("Send payment reminders now to every overdue or soon-expiring member who has not been reminded in the last 7 days?")) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/reminders", { method: "POST" }).catch(() => null);
    const d = await res?.json().catch(() => ({}));
    setBusy(false);
    setMsg(res?.ok ? `Reminded ${d.overdue} overdue, ${d.expiring} expiring and ${d.eventUnpaid} unpaid event registrants (${d.sent} delivered, ${d.failed} failed).` : d?.error ?? "Failed");
    router.refresh();
  }
  return (
    <div>
      <button onClick={run} disabled={busy} className="rounded-full bg-deep px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue disabled:opacity-50">{busy ? "Sending…" : "Run reminders now"}</button>
      {msg && <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{msg}</p>}
    </div>
  );
}
