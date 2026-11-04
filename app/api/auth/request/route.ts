import { z } from "zod";
import { issueCode } from "@/lib/otp";
import { clientIp, limited, sameOrigin } from "@/lib/request";
import { emailProvider, sendEmail } from "@/lib/sms";
import { getMemberByEmail } from "@/lib/store";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(200) });

// Step 1 of sign-in: email a one-time code. The response is identical whether or not the address is registered.
export async function POST(req: Request) {
  if (!(await sameOrigin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  const { email } = parsed.data;

  const blocked = (await limited(`otp-req:ip:${await clientIp()}`, 20, 15 * 60_000)) ?? (await limited(`otp-req:email:${email}`, 5, 15 * 60_000));
  if (blocked) return blocked;

  const prod = process.env.NODE_ENV === "production";
  if (prod && emailProvider() === "demo") return Response.json({ error: "Sign-in email is not configured yet. Please contact the SATA secretariat." }, { status: 503 });

  const m = await getMemberByEmail(email);
  let devCode: string | undefined;
  if (m && m.status !== "suspended") {
    const code = await issueCode(email);
    const sent = await sendEmail(email, "Your SATA sign-in code", `Your SATA sign-in code is ${code}.\n\nIt expires in 10 minutes. If you did not ask for it, you can ignore this email.`);
    if (!sent.ok) return Response.json({ error: "We could not send the email. Please try again shortly." }, { status: 502 });
    if (!prod && emailProvider() === "demo") devCode = code; // local development only: there is no email provider to deliver it
  }
  return Response.json({ ok: true, ...(devCode ? { devCode } : {}) });
}
