import { z } from "zod";
import { guard } from "@/lib/auth";
import { assignDepartment } from "@/lib/store";

const schema = z.object({ memberId: z.string(), departmentId: z.string(), on: z.boolean() });

export async function POST(req: Request) {
  const me = await guard("departments");
  if (me instanceof Response) return me;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const res = await assignDepartment(parsed.data.memberId, parsed.data.departmentId, parsed.data.on, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true });
}
