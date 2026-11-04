import ActionButton from "@/components/ActionButton";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { listDepartments, listMembers, listOfficers, memberMap } from "@/lib/store";
import AddToDepartment from "./AddToDepartment";

export default async function Departments() {
  const me = await requirePage("departments");
  const mm = await memberMap();
  const officers = await listOfficers();
  const depts = await listDepartments();
  const members = (await listMembers()).filter((m) => m.status === "active");
  const writable = canWrite(me.role, "departments");
  return (
    <>
      <PageHeader eyebrow="Governance" title="Leadership & departments">The Executive Committee and the departments that carry out SATA&apos;s work. Departments are a proposed structure for the Executive Committee to confirm.</PageHeader>
      <Panel title="Executive Committee">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {officers.map((o) => (
            <div key={o.id} className="rounded-2xl bg-mist p-4"><div className="text-xs font-bold uppercase tracking-widest text-blue">{o.title}</div><div className="mt-1 font-display font-bold text-deep">{o.name}</div>{o.memberId && <div className="text-xs text-muted">{mm.get(o.memberId)?.memberNo}</div>}</div>
          ))}
        </div>
      </Panel>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {depts.map((d) => {
          const team = members.filter((m) => m.departmentIds.includes(d.id));
          const head = d.headMemberId ? mm.get(d.headMemberId) ?? null : null;
          return (
            <Panel key={d.id} title={d.name} action={d.proposed ? <Badge tone="amber">Proposed</Badge> : undefined}>
              <p className="text-sm text-muted">{d.mandate}</p>
              <p className="mt-3 text-sm"><b className="text-deep">Head:</b> {head?.name ?? "Vacant"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {team.length === 0 && <span className="text-xs text-muted">No members assigned yet.</span>}
                {team.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-2 rounded-full bg-blue/10 py-1 pl-3 pr-1 text-xs font-semibold text-deep">{m.name}{writable && <ActionButton url="/api/admin/departments" body={{ memberId: m.id, departmentId: d.id, on: false }} label="✕" variant="ghost" />}</span>
                ))}
              </div>
              {writable && <AddToDepartment departmentId={d.id} options={members.filter((m) => !m.departmentIds.includes(d.id)).map((m) => ({ value: m.id, label: `${m.memberNo} · ${m.name}` }))} />}
            </Panel>
          );
        })}
      </div>
    </>
  );
}
