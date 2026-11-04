import Link from "next/link";
import { Badge, fmtDate, PageHeader, Panel, Table } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { FEES } from "@/lib/config";
import { isInGoodStanding, listDepartments, listMembers } from "@/lib/store";

const FILTERS = ["all", "active", "lapsed", "pending", "suspended"] as const;

export default async function Members({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requirePage("members");
  const { q = "", status = "all" } = await searchParams;
  const depts = await listDepartments();
  const needle = q.trim().toLowerCase();
  const rows = (await listMembers()).filter((m) => (status === "all" || m.status === status) && (!needle || [m.name, m.memberNo, m.email, m.facility, m.region].some((v) => v.toLowerCase().includes(needle))));
  return (
    <>
      <PageHeader eyebrow="National register" title="Members">The register is the source of truth. Standing is derived from payment, never typed by hand.</PageHeader>
      <Panel>
        <form className="mb-5 flex flex-wrap items-center gap-3">
          <input name="q" defaultValue={q} placeholder="Search name, number, email, facility, region…" className="min-w-64 flex-1 rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-4 focus:ring-blue/10" />
          <input type="hidden" name="status" value={status} />
          <button className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white">Search</button>
          <div className="flex gap-1">{FILTERS.map((f) => <Link key={f} href={`/admin/members?status=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${status === f ? "bg-deep text-white" : "bg-mist text-deep hover:bg-blue/10"}`}>{f}</Link>)}</div>
        </form>
        <p className="mb-3 text-xs text-muted">{rows.length} member{rows.length === 1 ? "" : "s"}</p>
        <Table head={["Member", "No.", "Category", "Cadre", "Region", "Status", "Paid through", "CPD", "Departments"]}>
          {rows.slice(0, 100).map((m) => (
            <tr key={m.id}>
              <td><div className="font-semibold text-deep">{m.name}</div><div className="text-xs text-muted">{m.facility}</div></td>
              <td className="font-mono text-xs">{m.memberNo}</td><td>{FEES[m.category].label.replace(" Member", "")}</td><td>{m.cadre}</td><td>{m.region}</td>
              <td><Badge tone={isInGoodStanding(m) ? "green" : m.status === "pending" ? "amber" : "red"}>{isInGoodStanding(m) ? "Good standing" : m.status}</Badge></td>
              <td>{m.paidThrough ? fmtDate(m.paidThrough) : "—"}</td><td>{m.cpdPoints}</td>
              <td className="text-xs text-muted">{m.departmentIds.map((d) => depts.find((x) => x.id === d)?.name.split(" ")[0]).join(", ") || "—"}</td>
            </tr>
          ))}
        </Table>
        {rows.length > 100 && <p className="mt-3 text-xs text-muted">Showing the first 100. Narrow your search to see more.</p>}
      </Panel>
    </>
  );
}
