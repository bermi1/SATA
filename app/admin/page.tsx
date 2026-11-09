import { AlertTriangle, BadgeCheck, BookOpenCheck, CalendarDays, CalendarPlus, Coins, FilePlus2, Images, Library, Mail, Megaphone, MessageSquareText, Newspaper, Sparkles, UserPlus, Users, Video } from "lucide-react";
import Link from "next/link";
import { Badge, EVENT_LABEL, fmtDate, fmtRange, PageHeader, Panel } from "@/components/ui";
import { can, canWrite, requirePage } from "@/lib/auth";
import { fmtTZS } from "@/lib/config";
import { listAnnouncements, listEvents, listGallery, listMembers, listPayments, listRegistrations, listResources, stats } from "@/lib/store";
import { RESOURCE_KINDS, RESOURCE_LABEL, ROLE_LABEL } from "@/lib/types";

type Icon = typeof Users;
type Tone = "red" | "green";
type Act = { href: string; label: string; icon: Icon };

function Kpi({ icon: Icon, label, value, hint, href, tone }: { icon: Icon; label: string; value: React.ReactNode; hint?: string; href?: string; tone?: Tone }) {
  const body = (
    <div className="group h-full rounded-2xl border border-line bg-white p-4 transition hover:border-blue hover:shadow-lg hover:shadow-blue/10 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone === "red" ? "bg-vigil/10 text-vigil" : tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-blue/10 text-blue"}`}><Icon className="size-[18px]" /></span>
      </div>
      <div className="mt-3 break-words font-display text-2xl font-extrabold text-deep sm:text-3xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

const Kpis = ({ children }: { children: React.ReactNode }) => <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{children}</div>;

function Actions({ items }: { items: (Act | false)[] }) {
  const list = items.filter((x): x is Act => !!x);
  if (!list.length) return null;
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
      {list.map((a) => (
        <Link key={a.href} href={a.href} className="flex min-h-14 items-center gap-3 rounded-2xl bg-gradient-to-br from-blue to-deep p-4 text-white shadow-lg shadow-blue/20 transition hover:-translate-y-0.5 active:scale-[.98]"><a.icon className="size-5 shrink-0" /><span className="text-sm font-bold leading-tight">{a.label}</span></Link>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-8 first:mt-0"><h2 className="mb-3 font-display text-lg font-extrabold text-deep">{title}</h2>{children}</section>;
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted">{children}</p>;
const MoreLink = ({ href, children }: { href: string; children: React.ReactNode }) => <Link href={href} className="text-xs font-semibold text-blue">{children}</Link>;
const STATUS_LABEL = { active: "Active", pending: "Pending", lapsed: "Lapsed", suspended: "Suspended" } as const;

export default async function Overview() {
  const me = await requirePage();
  const has = (a: Parameters<typeof can>[1]) => can(me.role, a);
  const edit = (a: Parameters<typeof can>[1]) => canWrite(me.role, a);
  const showFinance = has("applications") || has("payments");
  const showEdu = has("content");
  const showSocial = has("events") || has("announcements") || has("gallery");
  const first = me.name.replace(/^(Dr|Prof)\.\s*/, "").split(" ")[0];
  const now = new Date();

  const [s, members, payments, events, regs, resources, news, albums] = await Promise.all([
    showFinance ? stats() : null,
    showFinance ? listMembers() : [],
    showFinance && has("payments") ? listPayments() : [],
    showSocial ? listEvents({ includeDrafts: true }) : [],
    showSocial && has("events") ? listRegistrations() : [],
    showEdu ? listResources(true) : [],
    showSocial && has("announcements") ? listAnnouncements("leadership") : [],
    showSocial && has("gallery") ? listGallery() : [],
  ]);

  // management & finance
  const pending = members.filter((m) => m.status === "pending");
  const unmatched = payments.filter((p) => !p.memberId);
  const since = new Date(now.getTime() - 30 * 86_400_000);
  const recent = payments.filter((p) => p.memberId && new Date(p.createdAt) >= since).reduce((t, p) => t + p.amount, 0);
  const byStatus = (["active", "pending", "lapsed", "suspended"] as const).map((k) => [k, members.filter((m) => m.status === k).length] as const);

  // education
  const submissions = resources.filter((r) => r.status === "pending");
  const published = resources.filter((r) => (r.status ?? "published") === "published");

  // social
  const upcoming = events.filter((e) => new Date(e.endsAt) >= now && e.status !== "cancelled").sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const nextWebinar = upcoming.find((e) => e.type === "webinar");
  const regCount = (id: string) => regs.filter((r) => r.eventId === id).length;

  const alerts = [
    s && has("applications") && s.pending > 0 && `${s.pending} application${s.pending > 1 ? "s" : ""} to review`,
    s && has("messaging") && s.overdue > 0 && `${s.overdue} member${s.overdue > 1 ? "s" : ""} overdue`,
    s && has("payments") && s.unmatchedCount > 0 && `${s.unmatchedCount} unmatched payment${s.unmatchedCount > 1 ? "s" : ""}`,
    showEdu && submissions.length > 0 && `${submissions.length} library submission${submissions.length > 1 ? "s" : ""} to review`,
  ].filter(Boolean) as string[];

  return (
    <>
      <PageHeader eyebrow={ROLE_LABEL[me.role]} title={`Good to see you, ${first}`}>
        {me.role === "leadership" ? "A read-only summary of how the Society is doing." : "What needs your attention today, and the quickest way to act on it."}
      </PageHeader>

      {alerts.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <AlertTriangle className="size-6 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm text-amber-950"><b>Needs attention:</b> {alerts.join(" · ")}</div>
          {s && edit("messaging") && s.overdue > 0 && <Link href="/admin/messaging?type=overdue" className="min-h-11 rounded-full bg-amber-600 px-4 py-3 text-center text-xs font-bold text-white">Remind overdue members</Link>}
        </div>
      )}

      {showFinance && s && (
        <Section title="Membership & finance">
          <Kpis>
            {has("applications") && <Kpi icon={UserPlus} label="Applications" value={s.pending} hint="awaiting approval" tone={s.pending ? "red" : undefined} href="/admin/applications" />}
            {has("payments") && <Kpi icon={AlertTriangle} label="Unmatched" value={s.unmatchedCount} hint={fmtTZS(s.unmatchedValue)} tone={s.unmatchedCount ? "red" : undefined} href="/admin/payments" />}
            <Kpi icon={BadgeCheck} label="Renewals" value={s.overdue} hint={`overdue · ${s.expiring} due in 30 days`} tone={s.overdue ? "red" : "green"} href={has("messaging") ? "/admin/messaging?type=overdue" : undefined} />
            {has("payments") && <Kpi icon={Coins} label="Last 30 days" value={fmtTZS(recent)} hint={`${fmtTZS(s.revenue)} all time`} href="/admin/payments" />}
            <Kpi icon={Users} label="Members" value={s.total} hint={`${s.good} in good standing`} href="/admin/members" />
          </Kpis>
          <Actions items={[
            edit("applications") && { href: "/admin/applications", label: "Review applications", icon: UserPlus },
            edit("messaging") && { href: "/admin/messaging", label: "Send bulk SMS / email", icon: MessageSquareText },
            edit("broadcast") && { href: "/admin/newsletter", label: "Compose the newsletter", icon: Mail },
            edit("payments") && { href: "/admin/payments", label: "Reconcile payments", icon: Coins },
          ]} />
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Panel title="Members by status">
              <ul className="space-y-2.5 text-sm">{byStatus.map(([k, n]) => (
                <li key={k} className="flex items-center gap-3"><span className="w-20 shrink-0 text-muted">{STATUS_LABEL[k]}</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-mist"><span className="block h-full rounded-full bg-blue" style={{ width: `${members.length ? (n / members.length) * 100 : 0}%` }} /></span><b className="w-8 text-right text-deep">{n}</b></li>
              ))}</ul>
            </Panel>
            {has("applications") && (
              <Panel title="Applications to review" action={<MoreLink href="/admin/applications">Open →</MoreLink>}>
                {pending.length === 0 ? <Empty>Nothing waiting.</Empty> : <ul className="divide-y divide-line">{pending.slice(0, 5).map((m) => <li key={m.id} className="flex justify-between gap-3 py-2.5 text-sm first:pt-0"><span className="min-w-0 truncate font-semibold text-deep">{m.name}</span><span className="shrink-0 text-right text-muted">{m.cadre}</span></li>)}</ul>}
              </Panel>
            )}
            {has("payments") && (
              <Panel title="Unmatched payments" action={<MoreLink href="/admin/payments">Open →</MoreLink>}>
                {unmatched.length === 0 ? <Empty>All payments are matched.</Empty> : <ul className="divide-y divide-line">{unmatched.slice(0, 5).map((p) => <li key={p.id} className="flex justify-between gap-3 py-2.5 text-sm first:pt-0"><span className="min-w-0 truncate font-semibold text-deep">{p.payerName}</span><span className="shrink-0 text-right text-muted">{fmtTZS(p.amount)}</span></li>)}</ul>}
              </Panel>
            )}
          </div>
        </Section>
      )}

      {showEdu && (
        <Section title="Education library">
          <Kpis>
            <Kpi icon={BookOpenCheck} label="To review" value={submissions.length} hint="member submissions" tone={submissions.length ? "red" : "green"} href="/admin/library" />
            <Kpi icon={Library} label="Published" value={published.length} hint="library items" href="/admin/library" />
          </Kpis>
          <Actions items={[
            edit("content") && { href: "/admin/library", label: "Review submissions", icon: BookOpenCheck },
            edit("content") && { href: "/admin/library#add", label: "Add a resource", icon: FilePlus2 },
          ]} />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel title="Submissions waiting" action={<MoreLink href="/admin/library">Open →</MoreLink>}>
              {submissions.length === 0 ? <Empty>No submissions waiting for review.</Empty> : <ul className="divide-y divide-line">{submissions.slice(0, 5).map((r) => <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0"><span className="min-w-0 truncate font-semibold text-deep">{r.title}</span><Badge tone="amber">{RESOURCE_LABEL[r.kind]}</Badge></li>)}</ul>}
            </Panel>
            <Panel title="Published by type">
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">{RESOURCE_KINDS.map((k) => <li key={k} className="rounded-xl bg-mist p-3"><div className="font-display text-2xl font-extrabold text-deep">{published.filter((r) => r.kind === k).length}</div><div className="text-xs text-muted">{RESOURCE_LABEL[k]}</div></li>)}</ul>
            </Panel>
          </div>
        </Section>
      )}

      {showSocial && (
        <Section title="Events, news & gallery">
          <Kpis>
            {has("events") && <Kpi icon={CalendarDays} label="Upcoming events" value={upcoming.length} href="/admin/events" />}
            {has("events") && <Kpi icon={Video} label="Next webinar" value={nextWebinar ? fmtDate(nextWebinar.startsAt, { day: "numeric", month: "short" }) : "None"} hint={nextWebinar ? `${nextWebinar.title} · ${regCount(nextWebinar.id)} registered` : "nothing scheduled"} href={nextWebinar ? `/admin/events/${nextWebinar.id}` : "/admin/events"} />}
            {has("announcements") && <Kpi icon={Newspaper} label="News posts" value={news.length} hint="published" href="/admin/comms" />}
            {has("gallery") && <Kpi icon={Images} label="Gallery albums" value={albums.length} href="/admin/site#gallery" />}
          </Kpis>
          <Actions items={[
            edit("events") && { href: "/admin/events/new", label: "Create an event", icon: CalendarPlus },
            edit("announcements") && { href: "/admin/comms", label: "Post news", icon: Megaphone },
            edit("gallery") && { href: "/admin/site#gallery", label: "Add a gallery album", icon: Sparkles },
          ]} />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {has("events") && (
              <Panel title="Coming up" action={<MoreLink href="/admin/events">Manage →</MoreLink>}>
                {upcoming.length === 0 ? <Empty>No upcoming events.</Empty> : <ul className="divide-y divide-line">{upcoming.slice(0, 5).map((e) => <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0"><div className="min-w-0"><Link href={`/admin/events/${e.id}`} className="block truncate font-semibold text-deep hover:text-blue">{e.title}</Link><div className="text-xs text-muted">{fmtRange(e)} · {regCount(e.id)} registered</div></div>{e.status === "draft" ? <Badge tone="amber">Draft</Badge> : <Badge>{EVENT_LABEL[e.type]}</Badge>}</li>)}</ul>}
              </Panel>
            )}
            {has("announcements") && (
              <Panel title="Recent news" action={<MoreLink href="/admin/comms">Open →</MoreLink>}>
                {news.length === 0 ? <Empty>No news posts yet.</Empty> : <ul className="divide-y divide-line">{news.slice(0, 4).map((n) => <li key={n.id} className="py-2.5 first:pt-0"><div className="truncate text-sm font-semibold text-deep">{n.title}</div><div className="text-xs text-muted">{fmtDate(n.createdAt)}</div></li>)}</ul>}
              </Panel>
            )}
            {has("gallery") && (
              <Panel title="Gallery albums" action={<MoreLink href="/admin/site#gallery">Open →</MoreLink>}>
                {albums.length === 0 ? <Empty>No albums yet.</Empty> : <ul className="divide-y divide-line">{albums.slice(0, 4).map((a) => <li key={a.id} className="flex justify-between gap-3 py-2.5 text-sm first:pt-0"><span className="min-w-0 truncate font-semibold text-deep">{a.title}</span><span className="shrink-0 text-muted">{a.photos.length} photos</span></li>)}</ul>}
              </Panel>
            )}
          </div>
        </Section>
      )}

      {!showFinance && !showEdu && !showSocial && <Empty>Your account has no dashboard sections yet. Ask the secretariat to review your role.</Empty>}
    </>
  );
}
