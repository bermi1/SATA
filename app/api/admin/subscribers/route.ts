import { z } from "zod";
import { guard } from "@/lib/auth";
import { listSubscribers, removeSubscriber } from "@/lib/store";

// CSV export of subscribers.
export async function GET() {
  const me = await guard("subscribers", false);
  if (me instanceof Response) return me;
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = ["Name,Email,Phone,SMS consent,Source,Joined", ...(await listSubscribers()).map((s) => [s.name ?? "", s.email, s.phone ?? "", s.smsConsent ? "Yes" : "No", s.source, s.createdAt].map(q).join(","))];
  return new Response(rows.join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="sata-subscribers.csv"' } });
}

const del = z.object({ id: z.string() });

export async function POST(req: Request) {
  const me = await guard("subscribers");
  if (me instanceof Response) return me;
  const parsed = del.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const res = await removeSubscriber(parsed.data.id, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true });
}
