import { AlertTriangle, BadgeCheck, CalendarDays, CalendarPlus, Coins, MessageSquareText, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { Badge, EVENT_LABEL, fmtDate, fmtRange, PageHeader, Panel } from "@/components/ui";
import { can, requirePage } from "@/lib/auth";
import { fmtTZS } from "@/lib/config";
import { listAudit, listEvents, listMembers, stats } from "@/lib/store";

function Kpi({ icon: Icon, label, value, hint, href, tone }: { icon: typeof Users; label: string; value: React.ReactNode; hint?: string; href?: string; tone?: "red" | "green" }) {
  const body = (
    <div className="group h-full rounded-2xl border border-line bg-white p-4 transition hover:border-blue hover:shadow-lg hover:shadow-blue/10 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
        <span className={`grid size-9 place-items-center rounded-xl ${tone === "red" ? "bg-vigil/10 text-vigil" : tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-blue/10 text-blue"}`}><Icon className="size-[18px]" /></span>
      </div>
      <div className="mt-3 font-display text-2xl font-extrabold text-deep sm:text-3xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function Overview() {
  const me = await requirePage();
  const s = await stats();
  const pending = (await listMembers()).filter((m) => m.status === "pending");
  const upcoming = (await listEvents({ includeDrafts: true })).filter((e) => new Date(e.endsAt) >= new Date() && e.status !== "cancelled").slice(0, 4);
  const audit = (await listAudit()).slice(0, 6);
  const rate = s.total ? Math.round((s.good / s.total) * 100) : 0;
  const maxRev = Math.max(...s.revenueByMonth.map((r) => r[1]), 1);
  const circ = 2 * Math.PI * 42;
  const actions = [
    { href: "/admin/events/new", label: "New event", icon: CalendarPlus, area: "events" as const },
    { href: "/admin/messaging", label: "Send SMS", icon: MessageSquareText, area: "messaging" as const },
    { href: "/admin/applications", label: "Review applications", icon: UserPlus, area: "applications" as const },
    { href: "/admin/payments", label: "Reconcile payments", icon: Coins, area: "payments" as const },
  ].filter((a) => can(me.role, a.area));

  return (
    <>
      <PageHeader eyebrow="Overview" title={`Good to see you, ${me.name.replace(/^(Dr|Prof)\.\s*/, "").split(" ")[0]}`}>Everything that needs a decision today, with an owner attached.</PageHeader>

      {(s.overdue > 0 || s.unmatchedCount > 0 || s.pending > 0) && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <AlertTriangle className="size-6 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm text-amber-950">
            <b>Needs attention:</b> {[s.pending && `${s.pending} application${s.pending > 1 ? "s" : ""} to review`, s.overdue && `${s.overdue} member${s.overdue > 1 ? "s" : ""} overdue`, s.unmatchedCount && `${s.unmatchedCount} unmatched payment${s.unmatchedCount > 1 ? "s" : ""}`].filter(Boolean).join(" · ")}
          </div>
          {can(me.role, "messaging") && s.overdue > 0 && <Link href="/admin/messaging?type=overdue" className="rounded-full bg-amber-600 px-4 py-2 text-center text-xs font-bold text-white">Remind overdue members</Link>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={Users} label="Members" value={s.total} hint={`${s.good} in good standing`} href="/admin/members" />
        <Kpi icon={BadgeCheck} label="Good standing" value={`${rate}%`} hint={`${s.lapsed} lapsed`} tone="green" />
        <Kpi icon={Coins} label="Revenue" value={fmtTZS(s.revenue)} hint="all receipted payments" href="/admin/payments" />
        <Kpi icon={AlertTriangle} label="Unmatched" value={s.unmatchedCount} hint={fmtTZS(s.unmatchedValue)} tone={s.unmatchedCount ? "red" : undefined} href="/admin/payments" />
        <Kpi icon={UserPlus} label="Applications" value={s.pending} hint="awaiting approval" tone={s.pending ? "red" : undefined} href="/admin/applications" />
        <Kpi icon={CalendarDays} label="Upcoming events" value={s.upcoming} href="/admin/events" />
        <Kpi icon={MessageSquareText} label="SMS delivered" value={s.smsSent.toLocaleString("en-US")} hint={`${s.subscribers} subscribers`} href="/admin/messaging" />
        <Kpi icon={Users} label="Attendances" value={s.attendanceTotal} hint="counted for CPD" />
      </div>

      {actions.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-blue to-deep p-4 text-white shadow-lg shadow-blue/20 transition hover:-translate-y-0.5"><a.icon className="size-5 shrink-0" /><span className="text-sm font-bold leading-tight">{a.label}</span></Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Revenue by month" className="xl:col-span-2">
          {s.revenueByMonth.length === 0 ? <p className="text-sm text-muted">No payments yet.</p> : (
            <div className="flex h-44 items-end gap-2 sm:gap-3" role="img" aria-label="Revenue by month">
              {s.revenueByMonth.map(([m, v]) => (
                <div key={m} className="flex h-full flex-1 flex-col items-center gap-2">
                  <div className="text-[10px] font-semibold text-muted">{Math.round(v / 1000)}k</div>
                  <div className="flex min-h-0 w-full flex-1 items-end"><div className="w-full rounded-t-lg bg-gradient-to-t from-blue to-sky-400" style={{ height: `${Math.max((v / maxRev) * 100, 4)}%` }} /></div>
                  <div className="text-[10px] font-semibold uppercase text-muted">{m.slice(5)}/{m.slice(2, 4)}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Membership health">
          <div className="flex items-center gap-5">
            <svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90" role="img" aria-label={`${rate}% in good standing`}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e8f1f8" strokeWidth="12" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#127bc0" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(rate / 100) * circ} ${circ}`} />
            </svg>
            <div className="text-sm"><div className="font-display text-3xl font-extrabold text-deep">{rate}%</div><div className="text-muted">in good standing</div><div className="mt-2 text-xs text-muted">{s.expiring} expiring in 30 days · {s.overdue} overdue</div></div>
          </div>
        </Panel>

        {can(me.role, "applications") && (
          <Panel title="Applications to review" action={<Link href="/admin/applications" className="text-xs font-semibold text-blue">Open →</Link>}>
            {pending.length === 0 ? <p className="text-sm text-muted">Nothing waiting.</p> : <ul className="divide-y divide-line">{pending.slice(0, 5).map((m) => <li key={m.id} className="flex justify-between gap-3 py-2.5 text-sm first:pt-0"><span className="font-semibold text-deep">{m.name}</span><span className="text-right text-muted">{m.cadre}</span></li>)}</ul>}
          </Panel>
        )}
        <Panel title="Coming up" action={<Link href="/admin/events" className="text-xs font-semibold text-blue">Manage →</Link>}>
          <ul className="divide-y divide-line">{upcoming.map((e) => <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0"><div className="min-w-0"><Link href={`/admin/events/${e.id}`} className="block truncate font-semibold text-deep hover:text-blue">{e.title}</Link><div className="text-xs text-muted">{fmtRange(e)}</div></div>{e.status === "draft" ? <Badge tone="amber">Draft</Badge> : <Badge>{EVENT_LABEL[e.type]}</Badge>}</li>)}</ul>
        </Panel>
        <Panel title="Recent activity">
          {audit.length === 0 ? <p className="text-sm text-muted">Actions taken in this console are listed here with who did them and when.</p> : <ul className="space-y-2.5 text-sm">{audit.map((a) => <li key={a.id}><b className="text-deep">{a.actor}</b> <span className="text-muted">· {a.action} · {fmtDate(a.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></li>)}</ul>}
        </Panel>
      </div>
    </>
  );
}
