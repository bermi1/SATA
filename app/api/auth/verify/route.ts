import { z } from "zod";
import { setSession } from "@/lib/auth";
import { checkCode } from "@/lib/otp";
import { clientIp, limited, sameOrigin } from "@/lib/request";
import { getMemberByEmail } from "@/lib/store";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(200), code: z.string().trim().regex(/^\d{6}$/) });

// Step 2 of sign-in: exchange the emailed code for a session.
export async function POST(req: Request) {
  if (!(await sameOrigin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter the 6-digit code" }, { status: 400 });
  const { email, code } = parsed.data;

  const blocked = (await limited(`otp-verify:ip:${await clientIp()}`, 30, 15 * 60_000)) ?? (await limited(`otp-verify:email:${email}`, 10, 15 * 60_000));
  if (blocked) return blocked;

  const result = await checkCode(email, code);
  if (result !== "ok") return Response.json({ error: result === "expired" ? "That code has expired. Request a new one." : "That code is not correct." }, { status: 401 });
  const m = await getMemberByEmail(email);
  if (!m || m.status === "suspended") return Response.json({ error: "That code is not correct." }, { status: 401 });
  await setSession(m.id);
  return Response.json({ ok: true, home: m.role === "member" ? "/portal" : "/admin" });
}
