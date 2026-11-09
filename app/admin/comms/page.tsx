import Link from "next/link";
import { redirect } from "next/navigation";
import ActionButton from "@/components/ActionButton";
import MultipartForm from "@/components/MultipartForm";
import { RowControls } from "@/components/RowControls";
import { Badge, fmtDate, PageHeader, Panel } from "@/components/ui";
import { can, canWrite, requirePage } from "@/lib/auth";
import { listAnnouncements, listEnquiries, listTickets, memberMap } from "@/lib/store";

export default async function Comms() {
  const me = await requirePage();
  if (!can(me.role, "broadcast") && !can(me.role, "announcements") && !can(me.role, "support")) redirect("/admin");
  const mm = await memberMap();
  const items = await listAnnouncements("leadership");
  const tickets = await listTickets();
  const enquiries = await listEnquiries();
  const open = enquiries.filter((q) => q.status === "new").length;
  return (
    <>
      <PageHeader eyebrow="Communications & Advocacy" title="News, enquiries & help desk">Publish news with a picture, answer messages from the website contact form, and resolve member tickets.</PageHeader>
      <div className="grid gap-6 xl:grid-cols-2">
        {canWrite(me.role, "announcements") && (
          <Panel title="Publish news">
            <MultipartForm url="/api/admin/announcements" submit="Publish" resetOnDone
              image={{ name: "image", label: "Picture (optional)" }}
              fields={[
                { name: "title", label: "Headline", span: true },
                { name: "body", label: "Story", type: "textarea", hint: "Use a blank line between paragraphs. Start a line with ## for a heading, or - for a bullet." },
                { name: "audience", label: "Who can read it", type: "select", options: [{ value: "all", label: "Everyone (public news)" }, { value: "members", label: "Members only" }, { value: "leadership", label: "Leadership only" }], defaultValue: "all" },
                { name: "linkLabel", label: "Button text (optional)", required: false },
                { name: "linkUrl", label: "Button link (optional)", type: "url", required: false, span: true },
              ]} />
          </Panel>
        )}

        {can(me.role, "support") && <Panel title={`Website enquiries${open ? ` (${open} new)` : ""}`}>
          {enquiries.length === 0 ? <p className="text-sm text-muted">No messages yet. They arrive from the Contact page.</p> : (
            <ul className="divide-y divide-line">
              {enquiries.slice(0, 12).map((q) => (
                <li key={q.id} className="py-3 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-deep">{q.name}</span><Badge tone="grey">{q.topic}</Badge><span className="text-xs text-muted">{fmtDate(q.createdAt)}</span></div>
                      <div className="mt-0.5 text-xs"><a href={`mailto:${q.email}`} className="font-semibold text-blue">{q.email}</a>{q.phone && <span className="text-muted"> · {q.phone}</span>}</div>
                      <p className="mt-1.5 whitespace-pre-line text-sm text-muted">{q.message}</p>
                    </div>
                    {q.status === "new" ? <ActionButton url="/api/admin/enquiries" body={{ id: q.id }} label="Mark handled" doneLabel="Handled" /> : <Badge tone="green">Handled</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>}

        {can(me.role, "support") && <Panel title="Member help-desk tickets">
          {tickets.length === 0 ? <p className="text-sm text-muted">No tickets yet. Members open them from their portal.</p> : (
            <ul className="divide-y divide-line">{tickets.map((t) => (
              <li key={t.id} className="py-3 first:pt-0">
                <div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-deep">{t.subject}</div><div className="text-xs text-muted">{mm.get(t.memberId)?.name} · {fmtDate(t.createdAt)}</div><p className="mt-1 text-sm text-muted">{t.message}</p></div>
                  {t.status === "open" ? <ActionButton url="/api/admin/tickets" body={{ id: t.id }} label="Resolve" doneLabel="Resolved" /> : <Badge tone="green">Resolved</Badge>}</div>
              </li>
            ))}</ul>
          )}
        </Panel>}

        <Panel title="Published news">
          <ul className="divide-y divide-line">
            {items.map((n) => (
              <li key={n.id} className="py-3 first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0"><Link href={`/news/${n.slug}`} className="block truncate font-semibold text-deep hover:text-blue">{n.title}</Link><div className="text-xs text-muted">{fmtDate(n.createdAt)} · {n.author}</div></div>
                  <div className="flex items-center gap-2"><Badge tone={n.audience === "all" ? "blue" : "amber"}>{n.audience}</Badge>{canWrite(me.role, "announcements") && <RowControls url="/api/admin/announcements" idKey="id" id={n.id} label={n.title} />}</div>
                </div>
                {canWrite(me.role, "announcements") && (
                  <details className="mt-2"><summary className="cursor-pointer text-xs font-bold text-blue">Edit</summary>
                    <div className="mt-3 rounded-2xl bg-mist p-4">
                      <MultipartForm url="/api/admin/announcements" hidden={{ id: n.id }} submit="Save changes" image={{ name: "image", label: "Picture", current: n.image }}
                        fields={[{ name: "title", label: "Headline", defaultValue: n.title, span: true }, { name: "body", label: "Story", type: "textarea", defaultValue: n.body }, { name: "audience", label: "Who can read it", type: "select", defaultValue: n.audience, options: [{ value: "all", label: "Everyone" }, { value: "members", label: "Members only" }, { value: "leadership", label: "Leadership only" }] }, { name: "linkLabel", label: "Button text", required: false, defaultValue: n.link?.label }, { name: "linkUrl", label: "Button link", type: "url", required: false, span: true, defaultValue: n.link?.url }]} />
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
