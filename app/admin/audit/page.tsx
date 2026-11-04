import { fmtDate, PageHeader, Panel, Table } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { listAudit } from "@/lib/store";

export default async function Audit() {
  await requirePage("audit");
  const rows = await listAudit();
  return (
    <>
      <PageHeader eyebrow="Accountability" title="Audit log">Every action against a member record, payment or event is attributed and timestamped.</PageHeader>
      <Panel>
        {rows.length === 0 ? <p className="text-sm text-muted">No actions yet. Approve an application or check someone in to see entries here.</p> : (
          <Table head={["When", "Who", "Action"]}>{rows.map((a) => <tr key={a.id}><td className="whitespace-nowrap">{fmtDate(a.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td className="font-semibold text-deep">{a.actor}</td><td>{a.action}</td></tr>)}</Table>
        )}
      </Panel>
    </>
  );
}
