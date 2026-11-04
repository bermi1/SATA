import { z } from "zod";
import { setSession } from "@/lib/auth";
import { repo } from "@/lib/db";
import { getMemberByEmail } from "@/lib/store";

// One-click sample sign-in for LOCAL DEVELOPMENT ONLY. It does not exist in production or against a real database.
const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" || repo().kind !== "file") return new Response("Not found", { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid email" }, { status: 400 });
  const m = await getMemberByEmail(parsed.data.email);
  if (!m) return Response.json({ error: "No member found with that email" }, { status: 404 });
  await setSession(m.id);
  return Response.json({ ok: true, home: m.role === "member" ? "/portal" : "/admin" });
}
