import JsonForm from "@/components/JsonForm";
import { Badge, fmtDate, PageHeader, Panel, Table } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { fmtTZS } from "@/lib/config";
import { isInGoodStanding, listPayments, listRegistrations, listEvents } from "@/lib/store";

const METHODS = [
  { value: "mpesa", label: "M-Pesa" }, { value: "airtel", label: "Airtel Money" }, { value: "mixx", label: "Mixx by Yas" }, { value: "gepg", label: "GePG control number" }, { value: "bank", label: "Bank transfer" },
];

export default async function Payments() {
  const me = await requirePage();
  const fee = me.category === "full" ? 60_000 : 25_000;
  const mine = (await listPayments()).filter((p) => p.memberId === me.id);
  const evById = new Map((await listEvents({ includeDrafts: true })).map((e) => [e.id, e]));
  const owing = (await listRegistrations()).filter((r) => r.memberId === me.id && !r.paid).map((r) => ({ r, e: evById.get(r.eventId)! }));
  return (
    <>
      <PageHeader eyebrow="Payments" title="Payments & receipts">Every payment updates your standing and issues a numbered receipt immediately.</PageHeader>
      <div className="grid gap-6 lg:grid-cols-2">
        {me.category !== "honorary" && (
          <Panel title={isInGoodStanding(me) ? "Renew early" : "Renew your membership"}>
            <p className="mb-4 text-sm text-muted">Annual subscription: <b className="text-ink">{fmtTZS(fee)}</b>. Extends your membership to the next 30 June.</p>
            <JsonForm url="/api/portal/pay" extra={{ purpose: "subscription" }} submit={`Pay ${fmtTZS(fee)}`} compact success="Paid. Receipt {receiptNo}." fields={[{ name: "method", label: "Pay with", type: "select", options: METHODS, defaultValue: "mpesa" }]} />
          </Panel>
        )}
        {owing.map(({ r, e }) => (
          <Panel key={r.id} title={`Pay for ${e.title}`}>
            <JsonForm url="/api/portal/pay" extra={{ purpose: "event", eventId: e.id }} submit={`Pay ${fmtTZS(e.fees[me.category] ?? 0)}`} compact success="Paid. Receipt {receiptNo}." fields={[{ name: "method", label: "Pay with", type: "select", options: METHODS, defaultValue: "mpesa" }]} />
          </Panel>
        ))}
        <Panel title="Support SATA">
          <JsonForm url="/api/portal/pay" extra={{ purpose: "donation" }} submit="Donate" compact reset success="Thank you. Receipt {receiptNo}." fields={[
            { name: "amount", label: "Amount (TZS)", type: "number", half: true, defaultValue: "10000" },
            { name: "method", label: "Pay with", type: "select", options: METHODS, half: true, defaultValue: "mpesa" },
          ]} />
        </Panel>
        <Panel title="Receipt history" className="lg:col-span-2">
          {mine.length === 0 ? <p className="text-sm text-muted">No payments yet.</p> : (
            <Table head={["Receipt", "Date", "For", "Method", "Amount"]}>
              {mine.map((p) => (<tr key={p.id}><td className="font-mono text-xs">{p.receiptNo}</td><td>{fmtDate(p.createdAt)}</td><td className="capitalize">{p.purpose}</td><td><Badge tone="grey">{p.method}</Badge></td><td className="font-semibold">{fmtTZS(p.amount)}</td></tr>))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
