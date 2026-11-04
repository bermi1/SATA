import { Badge, fmtDate, PageHeader, Panel } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { FEES } from "@/lib/config";
import { listDepartments } from "@/lib/store";

export default async function Profile() {
  const me = await requirePage();
  const depts = (await listDepartments()).filter((d) => me.departmentIds.includes(d.id));
  const rows: [string, string][] = [
    ["Member number", me.memberNo], ["Category", FEES[me.category].label], ["Cadre", me.cadre], ["Facility", me.facility], ["Region", me.region],
    ["Email", me.email], ["Phone", me.phone], ["Member since", fmtDate(me.joinedAt)],
  ];
  return (
    <>
      <PageHeader eyebrow="Profile" title={me.name} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="My details"><dl className="divide-y divide-line">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2.5 text-sm first:pt-0"><dt className="text-muted">{k}</dt><dd className="text-right font-semibold text-deep">{v}</dd></div>)}</dl><p className="mt-4 text-xs text-muted">To change your details, open a ticket in the help desk.</p></Panel>
        <Panel title="My departments">{depts.length === 0 ? <p className="text-sm text-muted">You haven&apos;t joined a department yet. Ask the Secretariat to add you.</p> : <ul className="space-y-3">{depts.map((d) => <li key={d.id}><div className="flex items-center gap-2 font-semibold text-deep">{d.name}{d.headMemberId === me.id && <Badge tone="blue">Head</Badge>}</div><div className="text-xs text-muted">{d.mandate}</div></li>)}</ul>}</Panel>
      </div>
    </>
  );
}
