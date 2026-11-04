import { z } from "zod";
import { guard } from "@/lib/auth";
import { removeRegistration, setRegistrationPaid } from "@/lib/store";

const schema = z.object({ id: z.string(), action: z.enum(["paid", "unpaid", "remove"]) });

export async function POST(req: Request) {
  const me = await guard("events");
  if (me instanceof Response) return me;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { id, action } = parsed.data;
  const res = action === "remove" ? await removeRegistration(id, me.name) : await setRegistrationPaid(id, action === "paid", me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true });
}
