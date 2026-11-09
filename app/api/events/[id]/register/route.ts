import { z } from "zod";
import { getSession } from "@/lib/auth";
import { sendOne } from "@/lib/messaging";
import { normalizePhone } from "@/lib/sms";
import { isInGoodStanding, registerForEvent } from "@/lib/store";

const guest = z.object({ guestName: z.string().min(3).max(120), guestEmail: z.string().email(), guestPhone: z.string().min(9).max(20) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getSession();
  let res;
  if (me?.demo) return Response.json({ error: "This is a view-only demo account, so event registration is switched off." }, { status: 403 });
  if (me) {
    if (me.status === "pending") return Response.json({ error: "Your application is still being reviewed. You can register once it is approved." }, { status: 403 });
    if (!isInGoodStanding(me)) return Response.json({ error: "Renew your membership to register as a member" }, { status: 402 });
    res = await registerForEvent(id, { memberId: me.id });
  } else {
    const parsed = guest.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Enter your name, email and phone number" }, { status: 400 });
    const phone = normalizePhone(parsed.data.guestPhone);
    if (!phone) return Response.json({ error: "Enter a valid Tanzanian phone number, e.g. 0754 000 000" }, { status: 400 });
    res = await registerForEvent(id, { ...parsed.data, guestPhone: phone });
  }
  if ("error" in res) return Response.json({ error: res.error }, { status: 409 });
  if (!res.already) {
    const to = me?.phone ?? res.registration.guestPhone;
    const owes = res.fee > 0 ? ` Fee TZS ${res.fee.toLocaleString("en-US")} is due at sata.co.tz/portal/payments.` : "";
    await sendOne(to, `SATA: You are registered for ${res.event.title}. Ticket ${res.registration.ticketCode}.${owes}`, me?.name ?? res.registration.guestName ?? "Guest");
  }
  return Response.json({ ok: true, ticketCode: res.registration.ticketCode, fee: res.fee, paid: res.registration.paid, already: res.already });
}
