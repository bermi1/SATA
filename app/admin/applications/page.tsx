import ActionButton from "@/components/ActionButton";
import { Badge, fmtDate, PageHeader, Panel, Table } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { FEES, fmtTZS } from "@/lib/config";
import { listMembers } from "@/lib/store";

export default async function Applications() {
  const me = await requirePage("applications");
  const pending = (await listMembers()).filter((m) => m.status === "pending");
  const writable = canWrite(me.role, "applications");
  return (
    <>
      <PageHeader eyebrow="Membership & Welfare" title="Applications">Verify credentials, then approve. Approval activates the member, issues their card and starts their renewal clock.</PageHeader>
      <Panel>
        {pending.length === 0 ? <p className="text-sm text-muted">No applications are waiting. 🎉</p> : (
          <Table head={["Applicant", "Category", "Cadre", "Facility", "Region", "Applied", "Fee", ""]}>
            {pending.map((m) => (
              <tr key={m.id}>
                <td><div className="font-semibold text-deep">{m.name}</div><div className="text-xs text-muted">{m.email} · {m.phone}</div></td>
                <td><Badge tone="blue">{FEES[m.category].label}</Badge></td><td>{m.cadre}</td><td>{m.facility}</td><td>{m.region}</td><td>{fmtDate(m.joinedAt)}</td><td>{fmtTZS(FEES[m.category].registration)}</td>
                <td>{writable && <div className="flex gap-2"><ActionButton url={`/api/admin/applications/${m.id}`} body={{ approve: true }} label="Approve" doneLabel="Approved" /><ActionButton url={`/api/admin/applications/${m.id}`} body={{ approve: false }} label="Decline" variant="danger" confirm={`Decline ${m.name}?`} doneLabel="Declined" /></div>}</td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
