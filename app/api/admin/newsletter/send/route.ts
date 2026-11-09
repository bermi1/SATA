import { z } from "zod";
import { guard } from "@/lib/auth";
import { sendIssue } from "@/lib/newsletter";

export async function POST(req: Request) {
  const me = await guard("broadcast");
  if (me instanceof Response) return me;
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const r = await sendIssue(parsed.data.id);
  if (!("newsletter" in r)) return Response.json({ error: r.error }, { status: r.error.includes("not found") ? 404 : 409 });
  return Response.json({ ok: true, sent: r.sent, failed: r.failed, recipients: r.recipients, demo: r.demo });
}
