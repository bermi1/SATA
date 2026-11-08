import { Mail } from "lucide-react";
import { Badge, fmtDate, PageHeader, Panel, Stat } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { currentDraft, listNewsletters, newsletterRecipients } from "@/lib/newsletter";
import { emailProvider } from "@/lib/sms";
import Compose from "./Compose";
import Editor from "./Editor";

export default async function NewsletterPage() {
  const me = await requirePage("announcements");
  const writable = canWrite(me.role, "announcements");
  const [draft, all, recipients] = await Promise.all([currentDraft(), listNewsletters(), newsletterRecipients()]);
  const sent = all.filter((n) => n.status === "sent");
  const live = emailProvider() === "resend";

  return (
    <>
      <PageHeader eyebrow="Communications" title="Weekly newsletter">
        Every Monday morning SATA drafts &ldquo;10 key things this week&rdquo; from our own news and events and the anaesthesia news feed. Review it, adjust it and send it when you are happy. Nothing is sent automatically.
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Recipients" value={recipients.length.toLocaleString("en-US")} hint="subscribers + active members" />
        <Stat label="Issues sent" value={sent.length} />
        <Stat label="Last sent" value={sent[0]?.sentAt ? fmtDate(sent[0].sentAt, { day: "numeric", month: "short" }) : "Never"} />
        <Stat label="Current draft" value={draft ? `${draft.items.length} items` : "None"} hint={draft ? `week of ${fmtDate(draft.weekOf, { day: "numeric", month: "short" })}` : undefined} />
      </div>

      <div className={`mt-6 rounded-2xl border p-4 text-sm ${live ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
        <b>Email:</b> {live ? "Live via Resend." : "Demo mode. Sending is recorded but no email leaves the server. Set RESEND_API_KEY to go live."}
      </div>

      <div className="mt-6 grid gap-6">
        {draft ? (
          <Editor key={`${draft.id}-${draft.items.length}-${draft.intro.length}`} draft={draft} recipients={recipients.length} canEdit={writable} />
        ) : (
          <Panel title="This week's draft">
            <div className="flex flex-col items-start gap-4">
              <p className="max-w-xl text-sm text-muted"><Mail className="mb-2 size-6 text-blue" />No draft yet. The automatic draft appears on Monday at 05:00 UTC, or you can compose one now from the latest news.</p>
              {writable && <Compose label="Compose this week's draft" />}
            </div>
          </Panel>
        )}

        <Panel title="Past issues">
          {sent.length === 0 ? <p className="text-sm text-muted">No issue has been sent yet.</p> : (
            <ul className="divide-y divide-line">
              {sent.map((n) => (
                <li key={n.id} className="flex flex-col gap-1 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-deep">{n.subject}</div>
                    <div className="text-xs text-muted">Week of {fmtDate(n.weekOf)} · {n.items.length} items{n.sentAt ? ` · sent ${fmtDate(n.sentAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}</div>
                  </div>
                  <Badge tone="green">{n.sentCount.toLocaleString("en-US")} recipients</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
