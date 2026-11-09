import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSession, guard } from "@/lib/auth";
import { repo } from "@/lib/db";
import { clientIp, limited, sameOrigin } from "@/lib/request";
import type { Feedback } from "@/lib/types";

const schema = z.object({ message: z.string().trim().min(3).max(3000), page: z.string().max(300).default("") });

// Comments from reviewers (demo accounts) and staff, read at /admin/feedback.
export async function POST(req: Request) {
  if (!(await sameOrigin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const me = await getSession();
  if (!me) return Response.json({ error: "Sign in to leave feedback" }, { status: 401 });
  const blocked = await limited(`feedback:${await clientIp()}`, 30, 60 * 60_000);
  if (blocked) return blocked;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please write a little more" }, { status: 400 });
  const row: Feedback = { id: randomUUID(), page: parsed.data.page, message: parsed.data.message, name: me.name, role: me.role, memberId: me.id, status: "new", createdAt: new Date().toISOString() };
  await repo().put("feedback", row);
  return Response.json({ ok: true });
}

// Mark a comment done / new again.
export async function PATCH(req: Request) {
  const me = await guard("admins");
  if (me instanceof Response) return me;
  const body = z.object({ id: z.string(), status: z.enum(["new", "done"]) }).safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const row = await repo().get<Feedback>("feedback", body.data.id);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  await repo().put("feedback", { ...row, status: body.data.status });
  return Response.json({ ok: true });
}
