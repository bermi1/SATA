import { z } from "zod";
import { guard } from "@/lib/auth";
import { openTicket } from "@/lib/store";

const schema = z.object({ subject: z.string().min(3).max(120), message: z.string().min(5).max(2000) });

export async function POST(req: Request) {
  const me = await guard();
  if (me instanceof Response) return me;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Add a subject and message" }, { status: 400 });
  await openTicket(me.id, parsed.data.subject, parsed.data.message);
  return Response.json({ ok: true }, { status: 201 });
}
