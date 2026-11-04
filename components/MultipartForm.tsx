"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface MField {
  name: string;
  label: string;
  type?: "text" | "url" | "email" | "textarea" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  defaultValue?: string | boolean;
  required?: boolean;
  hint?: string;
  span?: boolean;
}

const box = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";

// Generic form that posts multipart data (text fields plus an optional image) and refreshes the page.
export default function MultipartForm({ url, fields, image, hidden, submit, resetOnDone }: {
  url: string;
  fields: MField[];
  image?: { name: string; label: string; current?: string; required?: boolean; round?: boolean };
  hidden?: Record<string, string>;
  submit: string;
  resetOnDone?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(image?.current ?? null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    for (const f of fields) if (f.type === "checkbox") fd.set(f.name, fd.get(f.name) === "on" ? "true" : "false");
    setBusy(true);
    setMsg(null);
    const res = await fetch(url, { method: "POST", body: fd }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) { setMsg({ ok: false, text: data?.error ?? "Could not save" }); return; }
    setMsg({ ok: true, text: "Saved" });
    if (resetOnDone) { form.reset(); setPreview(image?.current ?? null); }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3.5 sm:grid-cols-2">
      {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {image && (
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">{image.label}</span>
          <label className="relative flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-line bg-mist p-3 transition hover:border-blue">
            <span className={`grid size-20 shrink-0 place-items-center overflow-hidden bg-white text-2xl text-blue ring-1 ring-line ${image.round ? "rounded-full" : "rounded-xl"}`}>
              {preview ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview} alt="" className="size-full object-cover object-top" /> : "↑"}
            </span>
            <span className="text-sm"><b className="text-deep">{preview ? "Change picture" : "Add a picture"}</b><br /><span className="text-xs text-muted">PNG, JPG or WebP · up to 5 MB</span></span>
            <input type="file" name={image.name} accept="image/png,image/jpeg,image/webp" required={image.required && !image.current} className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} />
          </label>
        </div>
      )}
      {fields.map((f) => (
        <label key={f.name} className={`block ${f.span || f.type === "textarea" ? "sm:col-span-2" : ""}`}>
          {f.type === "checkbox" ? (
            <span className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-semibold text-deep"><input type="checkbox" name={f.name} defaultChecked={!!f.defaultValue} className="size-4 accent-blue" />{f.label}</span>
          ) : (
            <>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">{f.label}</span>
              {f.type === "textarea" ? <textarea name={f.name} rows={3} required={f.required !== false} defaultValue={String(f.defaultValue ?? "")} className={box} />
                : f.type === "select" ? <select name={f.name} defaultValue={String(f.defaultValue ?? "")} className={box}>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                : <input name={f.name} type={f.type ?? "text"} required={f.required !== false} defaultValue={String(f.defaultValue ?? "")} className={box} />}
              {f.hint && <span className="mt-1 block text-xs text-muted">{f.hint}</span>}
            </>
          )}
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button disabled={busy} className="rounded-full bg-blue px-6 py-2.5 text-sm font-bold text-white transition hover:bg-deep disabled:opacity-60">{busy ? "Saving…" : submit}</button>
        {msg && <span role="status" className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-vigil"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
