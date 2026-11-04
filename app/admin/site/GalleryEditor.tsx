"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RowControls } from "@/components/RowControls";

interface Album { id: string; title: string; date: string; place?: string; link?: string; photos: string[] }
const box = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10";

function AlbumForm({ album }: { album?: Album }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (album) fd.set("id", album.id);
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/site/gallery", { method: "POST", body: fd }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) { setMsg({ ok: false, text: data?.error ?? "Could not save" }); return; }
    setMsg({ ok: true, text: "Saved" });
    if (!album) form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input name="title" required placeholder="Event or album title" defaultValue={album?.title} className={`${box} sm:col-span-2`} />
      <label><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Event date</span><input name="date" type="date" required defaultValue={album?.date} className={box} /></label>
      <label><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Place (optional)</span><input name="place" defaultValue={album?.place} className={box} /></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Link to the full album (optional)</span><input name="link" type="url" placeholder="https://photos.app.goo.gl/…" defaultValue={album?.link} className={box} /></label>
      <label className="rounded-xl border border-dashed border-line bg-white p-3 text-sm sm:col-span-2">
        <span className="block font-semibold text-deep">{album ? "Add more pictures" : "Pictures (2 or 3)"}</span>
        <span className="mb-2 block text-xs text-muted">Choose up to three images, 5 MB each. Wide, high-resolution photographs look best.</span>
        <input type="file" name="photos" accept="image/png,image/jpeg,image/webp" multiple required={!album} className="block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-blue file:px-4 file:py-2 file:text-xs file:font-bold file:text-white" />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button disabled={busy} className="rounded-full bg-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-deep disabled:opacity-60">{busy ? "Saving…" : album ? "Save album" : "Add album"}</button>{msg && <span role="status" className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-vigil"}`}>{msg.text}</span>}</div>
    </form>
  );
}

function PhotoStrip({ album }: { album: Album }) {
  const router = useRouter();
  async function remove(photo: string) {
    if (!window.confirm("Remove this picture from the album?")) return;
    await fetch("/api/admin/site/gallery", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: album.id, photo }) });
    router.refresh();
  }
  return (
    <div className="flex gap-2">
      {album.photos.map((p) => (
        <div key={p} className="group relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-mist">
          <Image src={p} alt="" fill sizes="80px" className="object-cover" unoptimized={p.startsWith("/api/")} />
          {album.photos.length > 1 && <button onClick={() => remove(p)} aria-label="Remove picture" className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-ink/70 text-[10px] text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100">✕</button>}
        </div>
      ))}
    </div>
  );
}

export default function GalleryEditor({ albums, writable }: { albums: Album[]; writable: boolean }) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {albums.map((a) => (
          <li key={a.id} className="py-3 first:pt-0">
            <div className="flex flex-wrap items-center gap-3">
              <PhotoStrip album={a} />
              <div className="min-w-0 flex-1"><div className="truncate font-semibold text-deep">{a.title}</div><div className="truncate text-xs text-muted">{a.date}{a.place ? ` · ${a.place}` : ""}{a.link ? " · full album linked" : " · no album link"}</div></div>
              {writable && <RowControls url="/api/admin/site/gallery" idKey="id" id={a.id} label={a.title} />}
            </div>
            {writable && <details className="mt-2"><summary className="cursor-pointer text-xs font-bold text-blue">Edit album</summary><div className="mt-3 rounded-2xl bg-mist p-4"><AlbumForm album={a} /></div></details>}
          </li>
        ))}
      </ul>
      {writable && <details className="mt-4 rounded-2xl border border-dashed border-blue/40 p-4"><summary className="cursor-pointer text-sm font-bold text-blue">+ Add an event album</summary><div className="mt-4"><AlbumForm /></div></details>}
    </div>
  );
}
