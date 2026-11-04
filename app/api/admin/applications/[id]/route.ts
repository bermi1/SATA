import { z } from "zod";
import { guard } from "@/lib/auth";
import { decideApplication } from "@/lib/store";

const schema = z.object({ approve: z.boolean() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await guard("applications");
  if (me instanceof Response) return me;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { id } = await params;
  const res = await decideApplication(id, parsed.data.approve, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true, status: res.member.status });
}
