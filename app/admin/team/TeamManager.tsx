"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Admin { id: string; name: string; email: string; role: string }
const ROLES = ["secretariat", "management", "treasurer", "education", "social", "leadership"];
const field = "w-full rounded-xl border border-line bg-white px-3 py-3 text-base outline-none focus:border-blue sm:text-sm";

export default function TeamManager({ meId, meRole, writable, admins, labels }: { meId: string; meRole: string; writable: boolean; admins: Admin[]; labels: Record<string, string> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const roles = ROLES.filter((r) => r !== "secretariat" || meRole === "secretariat");

  async function call(method: string, body: unknown, okText: string) {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/team", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ ok: false, text: j.error ?? "Something went wrong" });
      else { setMsg({ ok: true, text: j.emailed === false ? `${okText} (the email could not be sent)` : okText }); router.refresh(); return true; }
    } catch { setMsg({ ok: false, text: "Network error" }); } finally { setBusy(false); }
    return false;
  }

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (await call("POST", { email: d.email, name: d.name, phone: d.phone || undefined, role: d.role }, "Admin added and emailed")) form.reset();
  }

  return (
    <div>
      {msg && <p role="status" className={`mb-4 rounded-xl p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-vigil"}`}>{msg.text}</p>}
      <ul className="divide-y divide-line">
        {admins.map((a) => {
          const locked = a.role === "secretariat" && meRole !== "secretariat";
          return (
            <li key={a.id} className="flex flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-deep">{a.name}{a.id === meId && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}</div>
                <div className="truncate text-xs text-muted">{a.email} · {labels[a.role]}</div>
              </div>
              {writable && !locked && (
                <div className="flex gap-2">
                  <select aria-label={`Role of ${a.name}`} disabled={busy} value={a.role} onChange={(e) => call("PATCH", { id: a.id, role: e.target.value }, "Role updated")} className={`${field} min-h-11 flex-1 sm:w-56 sm:flex-none`}>
                    {ROLES.filter((r) => r !== "secretariat" || meRole === "secretariat").map((r) => <option key={r} value={r}>{labels[r]}</option>)}
                  </select>
                  {a.id !== meId && <button disabled={busy} onClick={() => window.confirm(`Remove admin access from ${a.name}? They stay on as an ordinary member.`) && call("DELETE", { id: a.id }, "Admin access removed")} className="min-h-11 rounded-xl border border-vigil/30 px-4 text-sm font-bold text-vigil hover:bg-vigil/5">Remove</button>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {writable && (
        <details className="mt-5 rounded-2xl border border-dashed border-blue/40 p-4" open={admins.length < 2}>
          <summary className="cursor-pointer text-sm font-bold text-blue">+ Add an admin</summary>
          <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-muted">Full name<input name="name" required minLength={2} className={`${field} mt-1`} autoComplete="off" /></label>
            <label className="text-xs font-semibold text-muted">Email<input name="email" type="email" required className={`${field} mt-1`} autoComplete="off" /></label>
            <label className="text-xs font-semibold text-muted">Phone (optional)<input name="phone" type="tel" className={`${field} mt-1`} autoComplete="off" /></label>
            <label className="text-xs font-semibold text-muted">Role<select name="role" defaultValue="social" className={`${field} mt-1`}>{roles.map((r) => <option key={r} value={r}>{labels[r]}</option>)}</select></label>
            <div className="sm:col-span-2"><button disabled={busy} className="min-h-12 w-full rounded-full bg-blue px-6 text-sm font-bold text-white hover:bg-deep disabled:opacity-60 sm:w-auto">{busy ? "Saving…" : "Add and email them"}</button></div>
          </form>
        </details>
      )}
    </div>
  );
}
