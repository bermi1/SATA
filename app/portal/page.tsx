import Link from "next/link";
import Card3D from "@/components/Card3D";
import { Badge, EVENT_LABEL, fmtDate, fmtRange, PageHeader, Panel } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { FEES } from "@/lib/config";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { isInGoodStanding, listAnnouncements, listAttendance, listEvents, listNotifications, listRegistrations } from "@/lib/store";

export default async function Dashboard() {
  const me = await requirePage();
  const good = isInGoodStanding(me);
  const regs = (await listRegistrations()).filter((r) => r.memberId === me.id);
  const upcoming = (await listEvents()).filter((e) => new Date(e.endsAt) >= new Date());
  const myUpcoming = upcoming.filter((e) => regs.some((r) => r.eventId === e.id));
  const attended = (await listAttendance()).filter((a) => a.memberId === me.id && a.counted);
  // eslint-disable-next-line react-hooks/purity -- server component: evaluated once per request
  const days = me.paidThrough ? Math.ceil((+new Date(me.paidThrough) - Date.now()) / 86_400_000) : null;
  const news = (await listAnnouncements("member")).slice(0, 3);
  const notes = (await listNotifications(me.id)).map((n) => ({ id: n.id, title: n.title, body: n.body, kind: n.kind, read: n.read, when: fmtDate(n.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }));
  const expiring = good && days !== null && days <= 30 && me.category !== "honorary";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      <PageHeader eyebrow="Karibu" title={`Hello, ${me.name.replace(/^(Dr|Prof)\.\s*/, "").split(" ")[0]}`}>
        {me.status === "pending" ? "Your application is with the Membership & Welfare department. We'll notify you once it's approved." : good ? "Your membership is current." : "Your membership needs renewing. It takes under a minute."}
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,460px)_1fr]">
        <div>
          <Card3D name={me.name} memberNo={me.memberNo} category={FEES[me.category].label} cadre={me.cadre} good={good}
            validUntil={me.paidThrough ? fmtDate(me.paidThrough) : me.category === "honorary" ? "Lifetime" : "—"} verifyUrl={`${origin}/verify/${me.memberNo}`} />
          <p className="mt-3 text-center text-xs text-muted">Employers scan the QR code to confirm your standing.</p>
          {me.status !== "pending" && me.status !== "suspended" && (
            <div className="mt-5 rounded-2xl border border-line bg-white p-5">
              <div className="font-display text-base font-bold text-deep">Certificate and ID card</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={`/api/certificate/${me.memberNo}?download=1`} className="rounded-full bg-blue px-4 py-2 text-xs font-bold text-white hover:bg-deep">Download certificate</a>
                <a href={`/api/card/${me.memberNo}?download=1`} className="rounded-full border border-blue px-4 py-2 text-xs font-bold text-blue hover:bg-mist">Download ID card</a>
              </div>
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer font-semibold text-blue">Preview</summary>
                <div className="mt-3 space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/certificate/${me.memberNo}`} alt="Membership certificate" loading="lazy" className="w-full rounded-lg border border-line" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/card/${me.memberNo}`} alt="Digital ID card" loading="lazy" className="w-full max-w-sm rounded-xl border border-line" />
                </div>
              </details>
            </div>
          )}
        </div>
        <div className="grid content-start gap-4 sm:grid-cols-3">
          {[
            ["Status", <Badge key="s" tone={good ? "green" : me.status === "pending" ? "amber" : "red"}>{me.status === "pending" ? "Pending" : good ? "Good standing" : "Renewal due"}</Badge>, days !== null ? (days > 0 ? `${days} days to renewal` : "Expired") : ""],
            ["CPD points", <span key="c" className="font-display text-3xl font-extrabold text-deep">{me.cpdPoints}</span>, "credited from attended events"],
            ["Events attended", <span key="a" className="font-display text-3xl font-extrabold text-deep">{attended.length}</span>, "counted for CPD"],
          ].map(([l, v, h]) => (
            <div key={String(l)} className="rounded-2xl border border-line bg-white p-5"><div className="text-xs font-semibold uppercase tracking-wider text-muted">{l}</div><div className="mt-2">{v}</div><div className="mt-1 text-xs text-muted">{h}</div></div>
          ))}
          {!good && me.status !== "pending" && (
            <Link href="/portal/payments" className="rounded-2xl bg-vigil p-5 text-white shadow-lg shadow-vigil/25 sm:col-span-3"><div className="font-display text-lg font-extrabold">Your membership payment is overdue. Renew now →</div><div className="text-sm text-white/85">Pay by M-Pesa, Airtel Money, Mixx by Yas or GePG. Your receipt is instant.</div></Link>
          )}
          {expiring && (
            <Link href="/portal/payments" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:col-span-3"><div className="font-display text-lg font-extrabold text-amber-900">Your membership expires in {days} days →</div><div className="text-sm text-amber-900/80">Renew early to stay in good standing and keep your event access.</div></Link>
          )}
          <Panel title={`Notifications${notes.some((n) => !n.read) ? ` (${notes.filter((n) => !n.read).length} new)` : ""}`} className="sm:col-span-3"><NotificationsPanel items={notes} /></Panel>
          <Panel title="My upcoming events" className="sm:col-span-3" action={<Link href="/portal/events" className="text-xs font-semibold text-blue">All events →</Link>}>
            {myUpcoming.length === 0 ? <p className="text-sm text-muted">You haven&apos;t registered for anything yet. <Link href="/portal/events" className="font-semibold text-blue">Browse events</Link></p> : (
              <ul className="space-y-3">{myUpcoming.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3"><div><div className="font-semibold text-deep">{e.title}</div><div className="text-xs text-muted">{fmtRange(e)}</div></div><Badge>{EVENT_LABEL[e.type]}</Badge></li>
              ))}</ul>
            )}
          </Panel>
          <Panel title="From the Secretariat" className="sm:col-span-3">
            <ul className="divide-y divide-line">{news.map((n) => <li key={n.id} className="py-3 first:pt-0 last:pb-0"><div className="font-semibold text-deep">{n.title}</div><div className="text-xs text-muted">{fmtDate(n.createdAt)}</div></li>)}</ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
