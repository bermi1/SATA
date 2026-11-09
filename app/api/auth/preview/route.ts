import { z } from "zod";
import { setSession } from "@/lib/auth";
import { repo } from "@/lib/db";
import { clientIp, limited, sameOrigin } from "@/lib/request";
import type { Member } from "@/lib/types";

// One-click sign-in to a VIEW-ONLY demo account for reviewers (see /demo).
// Only accounts flagged `demo` can be used, all writes are refused for them (lib/auth.ts guard),
// and the whole feature is switched off unless DEMO_LOGIN=on.
const schema = z.object({ role: z.enum(["member", "secretariat", "management", "education", "social"]) });

export async function POST(req: Request) {
  if (process.env.DEMO_LOGIN !== "on") return Response.json({ error: "Demo access is switched off." }, { status: 404 });
  if (!(await sameOrigin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const blocked = await limited(`demo:${await clientIp()}`, 30, 15 * 60_000);
  if (blocked) return blocked;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Choose a demo account" }, { status: 400 });
  const m = (await repo().list<Member>("members", { role: parsed.data.role })).find((x) => x.demo);
  if (!m) return Response.json({ error: "That demo account is not set up." }, { status: 404 });
  await setSession(m.id);
  return Response.json({ ok: true, home: m.role === "member" ? "/portal" : "/admin" });
}
