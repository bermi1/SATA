import { z } from "zod";
import { addEnquiry } from "@/lib/store";
import { normalizePhone } from "@/lib/sms";
import { clientIp, limited } from "@/lib/request";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(25).optional().or(z.literal("")),
  topic: z.enum(["Membership", "Events & conferences", "Payments", "Partnership & sponsorship", "Media", "Other"]),
  message: z.string().min(10).max(3000),
  company: z.string().max(0).optional(), // honeypot: real people leave this empty
});

export async function POST(req: Request) {
  const blocked = await limited(`contact:${await clientIp()}`, 5, 10 * 60_000);
  if (blocked) return blocked;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please complete your name, a valid email, a topic and a message of at least 10 characters." }, { status: 400 });
  const { company: _hp, phone, ...rest } = parsed.data;
  void _hp;
  await addEnquiry({ ...rest, phone: phone ? normalizePhone(phone) ?? phone : undefined });
  return Response.json({ ok: true });
}
