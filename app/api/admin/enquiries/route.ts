import { z } from "zod";
import { guard } from "@/lib/auth";
import { resolveEnquiry } from "@/lib/store";

const schema = z.object({ id: z.string() });

export async function POST(req: Request) {
  const me = await guard("support");
  if (me instanceof Response) return me;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  await resolveEnquiry(parsed.data.id, me.name);
  return Response.json({ ok: true });
}
