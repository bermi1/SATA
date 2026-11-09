import { z } from "zod";
import { savePdf } from "./uploads";

export const baseSchema = z.object({
  title: z.string().min(3, "Add a title").max(160),
  description: z.string().min(10, "Add an abstract of at least a sentence").max(4000),
  author: z.string().max(200).optional().or(z.literal("")),
  year: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().min(1950).max(2100).optional()),
  url: z.string().max(500).optional().or(z.literal("")),
});

/** Reads a multipart request into plain strings, plus the stored file URL (or the pasted link). */
export async function readLibraryForm(req: Request): Promise<{ raw: Record<string, string>; url: string } | { error: string }> {
  const fd = await req.formData().catch(() => null);
  if (!fd) return { error: "Invalid form" };
  const raw: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") raw[k] = v.trim();
  let url = raw.url ?? "";
  const file = fd.get("file");
  if (file instanceof File && file.size > 0) {
    const saved = await savePdf(file);
    if ("error" in saved) return { error: saved.error };
    url = saved.url;
  }
  if (url && !/^https?:\/\//.test(url) && !url.startsWith("/api/uploads/")) return { error: "Use a full link (https://…)" };
  return { raw, url };
}
