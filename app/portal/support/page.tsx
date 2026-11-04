import JsonForm from "@/components/JsonForm";
import { Badge, fmtDate, PageHeader, Panel } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { listTickets } from "@/lib/store";

export default async function Support() {
  const me = await requirePage();
  const mine = (await listTickets()).filter((t) => t.memberId === me.id);
  return (
    <>
      <PageHeader eyebrow="Help desk" title="Ask the Secretariat">Every question becomes a ticket with an owner, so nothing gets lost in a phone call.</PageHeader>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="New ticket"><JsonForm url="/api/portal/tickets" submit="Send" reset compact success="Ticket sent. We'll reply soon." fields={[{ name: "subject", label: "Subject" }, { name: "message", label: "Message", type: "textarea" }]} /></Panel>
        <Panel title="My tickets">
          {mine.length === 0 ? <p className="text-sm text-muted">No tickets yet.</p> : <ul className="divide-y divide-line">{mine.map((t) => <li key={t.id} className="py-3 first:pt-0"><div className="flex items-center justify-between gap-2"><span className="font-semibold text-deep">{t.subject}</span><Badge tone={t.status === "open" ? "amber" : "green"}>{t.status}</Badge></div><div className="text-xs text-muted">{fmtDate(t.createdAt)}</div></li>)}</ul>}
        </Panel>
      </div>
    </>
  );
}
