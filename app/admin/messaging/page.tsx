import { BellRing, Mail, MessageSquareText } from "lucide-react";
import { Badge, fmtDate, PageHeader, Panel, Stat } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { emailProvider, smsProvider } from "@/lib/sms";
import { listDepartments, listEvents, listMessages, stats } from "@/lib/store";
import Composer from "./Composer";
import RunReminders from "./RunReminders";

export default async function Messaging({ searchParams }: { searchParams: Promise<{ type?: string; id?: string }> }) {
  const me = await requirePage("messaging");
  const q = await searchParams;
  const s = await stats();
  const sms = smsProvider();
  const history = (await listMessages()).slice(0, 25);
  const writable = canWrite(me.role, "messaging");
  const events = (await listEvents({ includeDrafts: false })).map((e) => ({ value: e.id, label: e.title })).reverse();
  const depts = (await listDepartments()).map((d) => ({ value: d.id, label: d.name }));

  return (
    <>
      <PageHeader eyebrow="Communications" title="Bulk SMS & email">Send reminders and notices to members, event registrants or subscribers. Personalised, previewed and logged.</PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Overdue members" value={s.overdue} hint="not paid" tone={s.overdue ? "red" : undefined} />
        <Stat label="Expiring in 30 days" value={s.expiring} />
        <Stat label="SMS delivered" value={s.smsSent.toLocaleString("en-US")} hint="all time" />
        <Stat label="Subscribers" value={s.subscribers} />
      </div>

      <div className={`mt-6 rounded-2xl border p-4 text-sm ${sms === "demo" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}>
        <b>SMS gateway:</b> {sms === "demo" ? "Demo mode. Messages are recorded below but not delivered. Set SMS_PROVIDER (africastalking or beem) and the provider keys in the environment to go live." : `Live via ${sms}.`}
        {" "}<b className="ml-2">Email:</b> {emailProvider() === "demo" ? "Demo mode. Set RESEND_API_KEY to go live." : "Live via Resend."}
      </div>

      <div className="mt-6 grid gap-6">
        <Panel title="Automatic payment reminders" action={<Badge tone="green">Runs daily</Badge>}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl text-sm leading-relaxed text-muted">
              <BellRing className="mb-2 size-6 text-blue" />
              Every day SATA texts members whose subscription is <b className="text-ink">overdue</b> or <b className="text-ink">expires within 30 days</b>, and warns people whose <b className="text-ink">event registration is unpaid</b> in the week before the event. Each person is reminded at most once every 7 days, and a notification also appears in their portal. Paying stops the reminders immediately.
            </div>
            {writable && <RunReminders />}
          </div>
        </Panel>

        <Panel title="Compose a message">
          <Composer events={events} departments={depts} initial={q} canSend={writable} />
        </Panel>

        <Panel title="Sent messages">
          {history.length === 0 ? <p className="text-sm text-muted">Nothing sent yet. Messages you send, and the automatic reminders, are logged here.</p> : (
            <ul className="divide-y divide-line">
              {history.map((m) => (
                <li key={m.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={m.kind === "auto-reminder" ? "amber" : "blue"}>{m.kind}</Badge>
                    {m.channels.map((c) => <Badge key={c} tone="grey">{c === "sms" ? <span className="inline-flex items-center gap-1"><MessageSquareText className="size-3" /> SMS</span> : <span className="inline-flex items-center gap-1"><Mail className="size-3" /> Email</span>}</Badge>)}
                    {m.provider === "demo" && <Badge tone="amber">demo</Badge>}
                    <span className="text-xs text-muted">{fmtDate(m.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {m.sender}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-deep">To {m.audience}: {m.recipients} recipients · {m.sent} delivered{m.failed ? ` · ${m.failed} failed` : ""}{m.smsSegments ? ` · ${m.smsSegments} segments` : ""}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{m.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
