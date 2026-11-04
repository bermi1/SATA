import { z } from "zod";
import { guard } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/store";
import { saveImage } from "@/lib/uploads";

const schema = z.object({
  tagline: z.string().min(5).max(200),
  address: z.string().min(5).max(200),
  phone: z.string().min(7).max(30),
  email: z.string().email(),
});

// Multipart: contact details + up to four hero slides (caption{n}, text{n}, image{n}).
export async function POST(req: Request) {
  const me = await guard("site");
  if (me instanceof Response) return me;
  const fd = await req.formData().catch(() => null);
  if (!fd) return Response.json({ error: "Invalid form" }, { status: 400 });
  const raw: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Check the tagline, address, phone and email" }, { status: 400 });

  const current = (await getSettings()).heroSlides;
  const slides = [];
  for (let i = 0; i < 4; i++) {
    const caption = (raw[`caption${i}`] ?? "").trim();
    const text = (raw[`text${i}`] ?? "").trim();
    let image = current[i]?.image;
    const file = fd.get(`image${i}`);
    if (file instanceof File && file.size > 0) {
      const saved = await saveImage(file);
      if ("error" in saved) return Response.json({ error: `Slide ${i + 1}: ${saved.error}` }, { status: 400 });
      image = saved.url;
    }
    if (image) slides.push({ ...current[i], image, caption: caption || current[i]?.caption || "", text: text || current[i]?.text });
  }
  if (slides.length === 0) return Response.json({ error: "Keep at least one hero image" }, { status: 400 });
  await updateSettings({ ...parsed.data, heroSlides: slides }, me.name);
  return Response.json({ ok: true });
}
