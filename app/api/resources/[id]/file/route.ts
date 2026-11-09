import { getSession } from "@/lib/auth";
import { canOpenResource } from "@/lib/library";
import { getResource } from "@/lib/store";
import { readUpload } from "@/lib/uploads";

// Access-checked file delivery: stored uploads are streamed, external links are redirected to.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [r, me] = await Promise.all([getResource(id), getSession()]);
  if (!r) return new Response("Not found", { status: 404 });
  const to = (path: string) => Response.redirect(new URL(path, req.url), 302);
  if (!canOpenResource(r, me)) return to(me ? `/resources/${id}` : `/login?next=${encodeURIComponent(`/resources/${id}`)}`);

  if (r.url.startsWith("/api/uploads/")) {
    const name = r.url.slice("/api/uploads/".length);
    if (!/^[a-f0-9-]{36}\.pdf$/.test(name)) return new Response("Not found", { status: 404 });
    const buf = await readUpload(name);
    if (!buf) return new Response("Not found", { status: 404 });
    const download = new URL(req.url).searchParams.get("download") === "1";
    const filename = r.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80) || "document";
    return new Response(new Uint8Array(buf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `${download ? "attachment" : "inline"}; filename="${filename}.pdf"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  }
  if (/^https?:\/\//.test(r.url) || (r.url.startsWith("/") && !r.url.startsWith("//"))) return to(r.url);
  return new Response("This item has no file yet", { status: 404 });
}
