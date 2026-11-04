"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Slide { image: string; caption: string; text?: string }
interface Props { settings: { tagline: string; address: string; phone: string; email: string }; slides: Slide[] }

const box = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";

export default function SettingsForm({ settings, slides }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [previews, setPreviews] = useState<(string | null)[]>([0, 1, 2, 3].map((i) => slides[i]?.image ?? null));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/site/settings", { method: "POST", body: new FormData(e.currentTarget) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    setMsg(res?.ok ? { ok: true, text: "Saved. The public site is updated." } : { ok: false, text: data?.error ?? "Could not save" });
    if (res?.ok) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div>
        <h3 className="font-display text-sm font-bold text-deep">Hero slideshow</h3>
        <p className="mb-3 text-xs text-muted">Four large photographs shown on the landing page, each with its own headline and sentence. Wide, high-resolution images work best.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-line p-3">
              <label className="relative block aspect-video cursor-pointer overflow-hidden rounded-xl bg-mist ring-1 ring-line">
                {previews[i] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={previews[i]!} alt={`Slide ${i + 1}`} className="size-full object-cover" /> : <span className="grid size-full place-items-center text-sm text-muted">+ Add picture</span>}
                <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-deep shadow">Change</span>
                <input type="file" name={`image${i}`} accept="image/png,image/jpeg,image/webp" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreviews((p) => p.map((x, j) => (j === i ? URL.createObjectURL(f) : x))); }} />
              </label>
              <input name={`caption${i}`} defaultValue={slides[i]?.caption ?? ""} placeholder={`Headline ${i + 1}`} className={box} />
              <textarea name={`text${i}`} rows={2} defaultValue={slides[i]?.text ?? ""} placeholder="One supporting sentence" className={box} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-sm font-bold text-deep">Organisation details</h3>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Tagline</span><input name="tagline" required defaultValue={settings.tagline} className={box} /></label>
          <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Address</span><input name="address" required defaultValue={settings.address} className={box} /></label>
          <label><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Phone</span><input name="phone" required defaultValue={settings.phone} className={box} /></label>
          <label><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Email</span><input name="email" type="email" required defaultValue={settings.email} className={box} /></label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={busy} className="rounded-full bg-blue px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue/25 transition hover:bg-deep disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button>
        {msg && <span role="status" className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-vigil"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
