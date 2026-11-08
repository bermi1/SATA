import { z } from "zod";
import { guard } from "@/lib/auth";
import { getNewsletter, sendTest } from "@/lib/newsletter";

export async function POST(req: Request) {
  const me = await guard("announcements");
  if (me instanceof Response) return me;
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const nl = await getNewsletter(parsed.data.id);
  if (!nl) return Response.json({ error: "Newsletter not found" }, { status: 404 });
  const r = await sendTest(nl, me.email);
  if (r.failed) return Response.json({ error: r.error ?? "Could not send the test" }, { status: 502 });
  return Response.json({ ok: true, to: me.email, demo: r.demo });
}
