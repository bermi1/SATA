import ActionButton from "@/components/ActionButton";
import { Badge, fmtDate, PageHeader, Panel, Table } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { FEES, fmtTZS } from "@/lib/config";
import { listMembers } from "@/lib/store";
import type { Member } from "@/lib/types";

const LABELS: [string, string][] = [
  ["gender", "Gender"], ["nationality", "Nationality"], ["qualification", "Qualification"], ["superspecialization", "Superspecialization"],
  ["superspecializationDetails", "Superspecialization details"], ["councilNo", "Medical Council no."], ["employer", "Employer"], ["jobTitle", "Job title"],
  ["yearsOfPractice", "Years of practice"], ["address", "Postal address"],
];

function Details({ m }: { m: Member }) {
  const a = m.application;
  if (!a) return <div className="mt-1 text-xs text-muted">No extra application details (submitted before the new form).</div>;
  const link = (u: unknown, label: string) => typeof u === "string" && u ? <a href={u} target="_blank" rel="noreferrer" className="font-semibold text-blue underline">{label}</a> : <span className="text-muted">none</span>;
  return (
    <details className="mt-1.5 text-xs">
      <summary className="cursor-pointer font-semibold text-blue">View full application</summary>
      <dl className="mt-2 grid max-w-md grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {LABELS.filter(([k]) => a[k] !== undefined && a[k] !== "").map(([k, l]) => <div key={k} className="contents"><dt className="text-muted">{l}</dt><dd className="text-deep">{String(a[k])}</dd></div>)}
        <dt className="text-muted">Amount paid</dt><dd className="font-semibold text-deep">{typeof a.amountPaid === "number" ? fmtTZS(a.amountPaid) : "-"}</dd>
        <dt className="text-muted">Proof of payment</dt><dd>{link(a.paymentProof, "Open proof")}</dd>
        <dt className="text-muted">Practising licence</dt><dd>{link(a.licence, "Open licence")}</dd>
        <dt className="text-muted">Declaration</dt><dd className="text-deep">{a.declaration ? "Agreed" : "-"}</dd>
      </dl>
    </details>
  );
}

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
                <td><div className="font-semibold text-deep">{m.name}</div><div className="text-xs text-muted">{m.email} · {m.phone}</div><Details m={m} /></td>
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
