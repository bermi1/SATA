import ActionButton from "@/components/ActionButton";
import JsonForm from "@/components/JsonForm";
import { Badge, fmtDate, PageHeader, Panel, Stat, Table } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { fmtTZS } from "@/lib/config";
import { listMembers, listPayments, memberMap } from "@/lib/store";

export default async function AdminPayments() {
  const me = await requirePage("payments");
  const mm = await memberMap();
  const all = await listPayments();
  const unmatched = all.filter((p) => !p.memberId);
  const receipted = all.filter((p) => p.memberId);
  const writable = canWrite(me.role, "payments");
  const byMethod = receipted.reduce<Record<string, number>>((a, p) => ((a[p.method] = (a[p.method] ?? 0) + p.amount), a), {});
  const members = (await listMembers()).filter((m) => m.status !== "pending");
  return (
    <>
      <PageHeader eyebrow="Finance & Fundraising" title="Payments & reconciliation">Money that no member record has claimed, with the system&apos;s proposed match. Confirming a match issues the receipt and renews the member in one step.</PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Collected" value={fmtTZS(receipted.reduce((s, p) => s + p.amount, 0))} hint={`${receipted.length} receipts`} />
        <Stat label="Awaiting reconciliation" value={fmtTZS(unmatched.reduce((s, p) => s + p.amount, 0))} hint={`${unmatched.length} payments`} tone={unmatched.length ? "red" : undefined} />
        <Stat label="Top channel" value={Object.entries(byMethod).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"} hint="by value" />
      </div>
      <div className="mt-6 grid gap-6">
        <Panel title={`Reconciliation queue (${unmatched.length})`}>
          {unmatched.length === 0 ? <p className="text-sm text-muted">Every payment is matched. ✓</p> : (
            <Table head={["Reference", "Payer", "Method", "Amount", "Received", "Proposed match", ""]}>
              {unmatched.map((p) => { const g = p.suggestedMemberId ? mm.get(p.suggestedMemberId) ?? null : null; return (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.reference}</td><td className="font-semibold text-deep">{p.payerName}</td><td><Badge tone="grey">{p.method}</Badge></td><td>{fmtTZS(p.amount)}</td><td>{fmtDate(p.createdAt)}</td>
                  <td>{g ? <span>{g.name} <span className="text-xs text-muted">{g.memberNo}</span></span> : <span className="text-muted">No suggestion</span>}</td>
                  <td>{writable && g && <ActionButton url="/api/admin/payments" body={{ paymentId: p.id, memberId: g.id }} label="Confirm match" doneLabel="Receipted" />}</td>
                </tr>
              ); })}
            </Table>
          )}
        </Panel>
        {writable && (
          <Panel title="Record a bank-slip or cash payment">
            <JsonForm url="/api/admin/payments" method="PUT" submit="Record & issue receipt" reset compact success="Receipt {receiptNo} issued." fields={[
              { name: "memberId", label: "Member", type: "select", options: members.map((m) => ({ value: m.id, label: `${m.memberNo} · ${m.name}` })) },
              { name: "purpose", label: "Purpose", type: "select", half: true, options: [{ value: "subscription", label: "Subscription" }, { value: "registration", label: "Registration fee" }, { value: "event", label: "Event" }, { value: "donation", label: "Donation" }] },
              { name: "method", label: "Method", type: "select", half: true, options: [{ value: "bank", label: "Bank" }, { value: "mpesa", label: "M-Pesa" }, { value: "airtel", label: "Airtel Money" }, { value: "mixx", label: "Mixx by Yas" }, { value: "gepg", label: "GePG" }] },
              { name: "amount", label: "Amount (TZS)", type: "number" },
            ]} />
          </Panel>
        )}
        <Panel title="Ledger (latest 40)">
          <Table head={["Receipt", "Date", "Payer", "For", "Method", "Amount"]}>
            {receipted.slice(0, 40).map((p) => <tr key={p.id}><td className="font-mono text-xs">{p.receiptNo}</td><td>{fmtDate(p.createdAt)}</td><td className="font-semibold text-deep">{p.payerName}</td><td className="capitalize">{p.purpose}</td><td><Badge tone="grey">{p.method}</Badge></td><td>{fmtTZS(p.amount)}</td></tr>)}
          </Table>
        </Panel>
      </div>
    </>
  );
}
