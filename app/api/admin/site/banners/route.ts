import { guard } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/store";
import { saveImage } from "@/lib/uploads";
import { BANNER_PAGES } from "@/lib/types";

// Multipart: `page` plus a new `image` and/or a vertical `focus` (0-100) so faces stay in frame.
export async function POST(req: Request) {
  const me = await guard("site");
  if (me instanceof Response) return me;
  const fd = await req.formData().catch(() => null);
  const page = String(fd?.get("page") ?? "");
  if (!fd || !(BANNER_PAGES as readonly string[]).includes(page)) return Response.json({ error: "Unknown page" }, { status: 400 });
  const s = await getSettings();
  const patch: { pageHeroes?: Record<string, string>; pageHeroFocus?: Record<string, number> } = {};

  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    const saved = await saveImage(file);
    if ("error" in saved) return Response.json({ error: saved.error }, { status: 400 });
    patch.pageHeroes = { ...s.pageHeroes, [page]: saved.url };
  }
  const focus = fd.get("focus");
  if (focus !== null && focus !== "") {
    const n = Number(focus);
    if (!Number.isFinite(n) || n < 0 || n > 100) return Response.json({ error: "Focus must be between 0 and 100" }, { status: 400 });
    patch.pageHeroFocus = { ...(s.pageHeroFocus ?? {}), [page]: Math.round(n) };
  }
  if (!patch.pageHeroes && !patch.pageHeroFocus) return Response.json({ error: "Choose a picture or a focus" }, { status: 400 });
  await updateSettings(patch, me.name);
  return Response.json({ ok: true });
}
