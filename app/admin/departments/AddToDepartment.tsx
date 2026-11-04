"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddToDepartment({ departmentId, options }: { departmentId: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!value) return;
    setBusy(true);
    await fetch("/api/admin/departments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: value, departmentId, on: true }) });
    setValue("");
    setBusy(false);
    router.refresh();
  }
  return (
    <div className="mt-4 flex gap-2">
      <select value={value} onChange={(e) => setValue(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue" aria-label="Add member to department">
        <option value="">Add a member…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button onClick={add} disabled={!value || busy} className="rounded-full bg-blue px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Add</button>
    </div>
  );
}
