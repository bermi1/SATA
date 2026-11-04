import { z } from "zod";
import { sendOne } from "@/lib/messaging";
import { clientIp, limited } from "@/lib/request";
import { addSubscriber } from "@/lib/store";

const schema = z.object({
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal("")),
  name: z.string().max(100).optional().or(z.literal("")),
  smsConsent: z.boolean().optional(),
});

export async function POST(req: Request) {
  const blocked = await limited(`subscribe:${await clientIp()}`, 6, 60_000);
  if (blocked) return blocked;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  const { email, phone, name, smsConsent } = parsed.data;
  const res = await addSubscriber({ email, phone: phone || undefined, name: name || undefined, smsConsent: smsConsent ?? !!phone });
  if ("error" in res) return Response.json({ error: res.error }, { status: 400 });
  if (!res.already && res.subscriber.phone && res.subscriber.smsConsent) await sendOne(res.subscriber.phone, "SATA: Thank you for subscribing. You will receive news and event reminders. Reply STOP to opt out.", "New subscriber");
  return Response.json({ ok: true, already: res.already });
}
