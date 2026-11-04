import { z } from "zod";
import { guard } from "@/lib/auth";
import { FEES } from "@/lib/config";
import { getEvent, listRegistrations, recordPayment } from "@/lib/store";

const schema = z.object({
  purpose: z.enum(["subscription", "event", "donation"]),
  method: z.enum(["mpesa", "airtel", "mixx", "gepg", "bank"]),
  eventId: z.string().optional(),
  amount: z.number().int().positive().optional(),
});

// Demo checkout: stands in for the mobile-money / GePG gateway. In production the gateway's
// callback calls await recordPayment(); only the amount and purpose are decided server-side.
export async function POST(req: Request) {
  const me = await guard();
  if (me instanceof Response) return me;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Choose how you want to pay" }, { status: 400 });
  const { purpose, method, eventId } = parsed.data;
  let amount = parsed.data.amount ?? 0;
  if (purpose === "subscription") amount = me.category === "full" ? 60_000 : 25_000;
  if (purpose === "event") {
    const ev = eventId ? await getEvent(eventId) : null;
    if (!ev) return Response.json({ error: "Event not found" }, { status: 404 });
    if (!(await listRegistrations(ev.id)).some((r) => r.memberId === me.id)) return Response.json({ error: "Register for the event before paying" }, { status: 409 });
    amount = ev.fees[me.category] ?? 0;
    if (amount <= 0) return Response.json({ error: "Nothing to pay for this event" }, { status: 400 });
  }
  if (purpose === "donation" && amount < 1000) return Response.json({ error: "Minimum donation is TZS 1,000" }, { status: 400 });
  void FEES;
  const res = await recordPayment({ memberId: me.id, purpose, amount, method, eventId }, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true, receiptNo: res.payment.receiptNo, amount });
}
