"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LABELS: Record<string, string> = { about: "About", leadership: "Leadership", membership: "Membership", events: "Events", calendar: "Calendar", news: "News", resources: "Resources", gallery: "Gallery", contact: "Contact" };

// One banner photograph per inner page. Choosing a file uploads it straight away.
const FOCUS = [["10", "Top"], ["30", "Upper"], ["50", "Centre"], ["70", "Lower"], ["90", "Bottom"]];
const nearest = (v: number) => FOCUS.reduce((a, b) => (Math.abs(Number(b[0]) - v) < Math.abs(Number(a[0]) - v) ? b : a))[0];

export default function BannersEditor({ banners, focus, writable }: { banners: Record<string, string>; focus: Record<string, number>; writable: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function upload(page: string, file?: File, focusValue?: string) {
    setBusy(page);
    setErr("");
    const fd = new FormData();
    fd.set("page", page);
    if (file) fd.set("image", file);
    if (focusValue) fd.set("focus", focusValue);
    const res = await fetch("/api/admin/site/banners", { method: "POST", body: fd }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(null);
    if (!res?.ok) { setErr(data?.error ?? "Could not upload"); return; }
    router.refresh();
  }

  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.keys(LABELS).map((k) => (
          <li key={k} className="rounded-xl border border-line p-3">
            <div className="relative aspect-[16/6] overflow-hidden rounded-lg bg-gradient-to-br from-blue to-deep">
              {banners[k] && <Image src={banners[k]} alt={`${LABELS[k]} page banner`} fill sizes="360px" style={{ objectPosition: `50% ${focus[k] ?? 40}%` }} className="object-cover" unoptimized={banners[k].startsWith("/api/")} />}
              <div className="absolute inset-0 bg-deep/30" />
              <span className="absolute left-3 top-2 text-sm font-bold text-white">{LABELS[k]}</span>
            </div>
            {writable && (
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <label className="cursor-pointer text-xs font-bold text-blue">
                  {busy === k ? "Saving…" : "Change banner"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy !== null} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(k, f); e.target.value = ""; }} />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-muted">Focus
                  <select defaultValue={nearest(focus[k] ?? 40)} disabled={busy !== null} onChange={(e) => upload(k, undefined, e.target.value)} className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-deep" aria-label={`${LABELS[k]} banner focus`}>
                    {FOCUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
              </div>
            )}
          </li>
        ))}
      </ul>
      {err && <p role="alert" className="mt-3 text-sm font-medium text-vigil">{err}</p>}
    </div>
  );
}
