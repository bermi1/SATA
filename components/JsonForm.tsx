"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface Field {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "textarea" | "select" | "datetime-local" | "url";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  half?: boolean;
  optional?: boolean; // omitted from the payload when blank
}

interface Props {
  url: string;
  method?: "POST" | "PUT";
  fields: Field[];
  submit: string;
  /** Message shown on success. {field} placeholders are filled from the JSON response. */
  success?: string;
  redirect?: string;
  extra?: Record<string, unknown>;
  reset?: boolean;
  compact?: boolean;
}

const input = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";

export default function JsonForm({ url, method = "POST", fields, submit, success, redirect, extra, reset, compact }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body: Record<string, unknown> = { ...extra };
    for (const f of fields) {
      const raw = String(fd.get(f.name) ?? "").trim();
      if (!raw && f.optional) continue;
      body[f.name] = f.type === "number" ? (raw === "" ? null : Number(raw)) : raw;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Something went wrong" });
        return;
      }
      const text = (success ?? "Saved").replace(/\{(\w+)\}/g, (_, k) => String(data[k] ?? ""));
      setMsg({ ok: true, text });
      if (reset) form.reset();
      if (redirect) router.push(redirect);
      router.refresh();
    } catch {
      setMsg({ ok: false, text: "Network error. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.name} className={f.half ? "block" : "block sm:col-span-2"}>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea name={f.name} required={f.required !== false && !f.optional} rows={4} placeholder={f.placeholder} defaultValue={f.defaultValue} className={input} />
            ) : f.type === "select" ? (
              <select name={f.name} required={f.required !== false && !f.optional} defaultValue={f.defaultValue ?? ""} className={input}>
                {!f.defaultValue && <option value="" disabled>Select…</option>}
                {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input name={f.name} type={f.type ?? "text"} required={f.required !== false && !f.optional} placeholder={f.placeholder} defaultValue={f.defaultValue} min={f.type === "number" ? 0 : undefined} className={input} />
            )}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button disabled={busy} className="rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue/25 transition hover:bg-deep disabled:opacity-60">
          {busy ? "Please wait…" : submit}
        </button>
        {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-vigil"}`}>{msg.text}</p>}
      </div>
    </form>
  );
}
