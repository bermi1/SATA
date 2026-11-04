import { Download, MessageSquare } from "lucide-react";
import Link from "next/link";
import ActionButton from "@/components/ActionButton";
import { Badge, fmtDate, PageHeader, Panel, Stat, Table } from "@/components/ui";
import { can, canWrite, requirePage } from "@/lib/auth";
import { listSubscribers } from "@/lib/store";

export default async function Subscribers() {
  const me = await requirePage("subscribers");
  const subs = await listSubscribers();
  const withPhone = subs.filter((s) => s.phone && s.smsConsent).length;
  const writable = canWrite(me.role, "subscribers");
  return (
    <>
      <PageHeader eyebrow="Audience" title="Newsletter subscribers">People who signed up on the website for news and event reminders. Phone numbers are only used for SMS where the person gave consent.</PageHeader>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat label="Subscribers" value={subs.length} /><Stat label="With SMS consent" value={withPhone} /><Stat label="Email only" value={subs.length - withPhone} />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/api/admin/subscribers" className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold hover:border-blue hover:text-blue"><Download className="size-4" /> Export CSV</a>
        {can(me.role, "messaging") && <Link href="/admin/messaging?type=subscribers" className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-deep"><MessageSquare className="size-4" /> Send newsletter</Link>}
      </div>
      <Panel className="mt-6">
        {subs.length === 0 ? <p className="text-sm text-muted">No subscribers yet. The signup form is in the website footer.</p> : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {subs.map((s) => (
                <li key={s.id} className="py-3 first:pt-0"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate font-semibold text-deep">{s.name ?? s.email}</div><div className="truncate text-xs text-muted">{s.email}</div><div className="text-xs text-muted">{s.phone ?? "no phone"}</div></div>{s.smsConsent && <Badge tone="green">SMS</Badge>}</div></li>
              ))}
            </ul>
            <div className="hidden md:block">
              <Table head={["Name", "Email", "Phone", "SMS", "Source", "Joined", ""]}>
                {subs.map((s) => (
                  <tr key={s.id}><td className="font-semibold text-deep">{s.name ?? "-"}</td><td>{s.email}</td><td>{s.phone ?? "-"}</td><td>{s.smsConsent ? <Badge tone="green">Consent</Badge> : <Badge tone="grey">No</Badge>}</td><td>{s.source}</td><td>{fmtDate(s.createdAt)}</td><td>{writable && <ActionButton url="/api/admin/subscribers" body={{ id: s.id }} label="Remove" variant="danger" confirm={`Remove ${s.email}?`} doneLabel="Removed" />}</td></tr>
                ))}
              </Table>
            </div>
          </>
        )}
      </Panel>
    </>
  );
}
