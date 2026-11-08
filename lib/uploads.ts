import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { usingSupabase } from "./db";
import { supabaseAdmin } from "./db/supabase";

// Uploaded posters, photos and PDFs. Production: a private Supabase Storage bucket ("uploads"), served through /api/uploads/[name].
// Local development: .data/uploads on disk.
const BUCKET = "uploads";
const LOCAL_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "uploads");
const MAX_IMAGE = 4 * 1024 * 1024; // Vercel caps request bodies at 4.5 MB; stored WebP files are far smaller
const MAX_PDF = 20 * 1024 * 1024;

export const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", pdf: "application/pdf" };

const sniff = (b: Buffer): "png" | "jpg" | "webp" | null => {
  if (b.length > 12 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
};

async function put(name: string, buf: Buffer, ext: string): Promise<{ url: string } | { error: string }> {
  if (usingSupabase()) {
    const { error } = await supabaseAdmin().storage.from(BUCKET).upload(name, buf, { contentType: MIME[ext], upsert: false });
    if (error) return { error: "Could not store the file. Please try again." };
  } else {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DIR, name), buf);
  }
  return { url: `/api/uploads/${name}` };
}

/** Reads a stored upload, or null if it does not exist. */
export async function readUpload(name: string): Promise<Buffer | null> {
  if (usingSupabase()) {
    const { data, error } = await supabaseAdmin().storage.from(BUCKET).download(name);
    return error || !data ? null : Buffer.from(await data.arrayBuffer());
  }
  const file = path.join(LOCAL_DIR, name);
  return fs.existsSync(/*turbopackIgnore: true*/ file) ? fs.readFileSync(/*turbopackIgnore: true*/ file) : null;
}

/** Every uploaded photo is turned into a compact WebP (max 1920px, EXIF stripped) to save Supabase storage. */
async function toWebp(buf: Buffer): Promise<Buffer | null> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(buf, { failOn: "error" }).rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toBuffer();
  } catch { return null; }
}

/** Validates by file signature (not the client-claimed type), converts to WebP and stores the image. Returns its public URL. */
export async function savePoster(file: File): Promise<{ url: string } | { error: string }> {
  if (file.size > MAX_IMAGE) return { error: "Image must be 4 MB or smaller" };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return { error: "Image must be a PNG, JPG or WebP file" };
  const webp = await toWebp(buf);
  if (webp && (ext !== "webp" || webp.length < buf.length)) return put(`${randomUUID()}.webp`, webp, "webp");
  return put(`${randomUUID()}.${ext}`, buf, ext);
}

/** Stores a PDF publication (checked by its %PDF signature). Returns its public URL. */
export async function savePdf(file: File): Promise<{ url: string } | { error: string }> {
  if (file.size > MAX_PDF) return { error: "PDF must be 20 MB or smaller" };
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length < 5 || buf.toString("ascii", 0, 5) !== "%PDF-") return { error: "That file is not a PDF" };
  return put(`${randomUUID()}.pdf`, buf, "pdf");
}
export const saveImage = savePoster;
