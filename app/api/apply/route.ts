import { z } from "zod";
import { applyForMembership } from "@/lib/store";

const schema = z.object({
  name: z.string().min(3).max(120),
  email: z.string().email(),
  phone: z.string().min(9).max(20),
  category: z.enum(["full", "associate"]),
  cadre: z.string().min(2),
  facility: z.string().min(2).max(160),
  region: z.string().min(2),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please complete every field correctly" }, { status: 400 });
  const res = await applyForMembership(parsed.data);
  if ("error" in res) return Response.json({ error: res.error }, { status: 409 });
  return Response.json({ ok: true, memberNo: res.member.memberNo, registrationFee: res.registrationFee, feeText: `TZS ${res.registrationFee.toLocaleString("en-US")}` }, { status: 201 });
}
