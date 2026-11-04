import { z } from "zod";
import { guard } from "@/lib/auth";
import { audienceSchema } from "@/lib/audience-schema";
import { sendCampaign } from "@/lib/messaging";
import { resolveAudience } from "@/lib/store";

const schema = z.object({
  audience: audienceSchema,
  channels: z.array(z.enum(["sms", "email"])).min(1),
  subject: z.string().max(140).optional(),
  body: z.string().min(3).max(1000),
  inApp: z.boolean().optional(),
  confirmCount: z.number().int(),
});

// Bulk SMS / email. `confirmCount` must equal the audience size the admin saw in the preview.
export async function POST(req: Request) {
  const me = await guard("messaging");
  if (me instanceof Response) return me;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Choose an audience, a channel and write a message" }, { status: 400 });
  const { audience, channels, subject, body, inApp, confirmCount } = parsed.data;
  if (["department", "event_registrants", "event_unpaid", "event_absent"].includes(audience.type) && !audience.id) return Response.json({ error: "Choose which department or event" }, { status: 400 });
  if (channels.includes("email") && !subject) return Response.json({ error: "Add a subject for the email" }, { status: 400 });
  const actual = (await resolveAudience(audience)).length;
  if (actual === 0) return Response.json({ error: "No one is in that audience" }, { status: 400 });
  if (actual !== confirmCount) return Response.json({ error: `The audience changed (now ${actual} people). Preview again before sending.` }, { status: 409 });
  const res = await sendCampaign({ audience, channels, subject, body, sender: me.name, inApp });
  return Response.json({ ok: true, ...res, failureText: res.failures.join("; ") });
}
