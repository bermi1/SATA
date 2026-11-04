import { MIME, readUpload } from "@/lib/uploads";

// Serves uploaded files. The strict filename pattern blocks path traversal.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const m = name.match(/^[a-f0-9-]{36}\.(png|jpg|webp|pdf)$/);
  if (!m) return new Response("Not found", { status: 404 });
  const buf = await readUpload(name);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": MIME[m[1]],
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      ...(m[1] === "pdf" ? { "content-disposition": "inline" } : {}),
    },
  });
}
