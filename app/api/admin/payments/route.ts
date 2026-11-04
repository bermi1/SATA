import { z } from "zod";
import { guard } from "@/lib/auth";
import { reconcilePayment, recordPayment } from "@/lib/store";

const reconcile = z.object({ paymentId: z.string(), memberId: z.string() });

// Confirm the match for an unclaimed payment: issues the receipt and updates the member's standing.
export async function POST(req: Request) {
  const me = await guard("payments");
  if (me instanceof Response) return me;
  const parsed = reconcile.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Choose a member" }, { status: 400 });
  const res = await reconcilePayment(parsed.data.paymentId, parsed.data.memberId, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true, receiptNo: res.payment.receiptNo });
}

const manual = z.object({
  memberId: z.string(),
  purpose: z.enum(["registration", "subscription", "event", "donation"]),
  amount: z.number().int().positive(),
  method: z.enum(["mpesa", "airtel", "mixx", "gepg", "bank"]),
});

// Record a bank-slip or cash payment manually.
export async function PUT(req: Request) {
  const me = await guard("payments");
  if (me instanceof Response) return me;
  const parsed = manual.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the payment details" }, { status: 400 });
  const res = await recordPayment(parsed.data, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true, receiptNo: res.payment.receiptNo }, { status: 201 });
}
