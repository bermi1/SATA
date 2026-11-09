import { PageHeader, Panel, Badge, fmtDate } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { repo } from "@/lib/db";
import { ROLE_LABEL, type Feedback, type Role } from "@/lib/types";
import { MarkDone } from "./MarkDone";

export default async function FeedbackPage() {
  await requirePage("admins");
  const rows = (await repo().list<Feedback>("feedback")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = rows.filter((r) => r.status === "new");
  return (
    <>
      <PageHeader eyebrow="Society" title="Reviewer feedback">
        Comments left with the Feedback button by people trying the demo accounts and by staff. Share <span className="font-semibold text-ink">/demo</span> with anyone you want to review the platform.
      </PageHeader>
      <Panel title={`${open.length} new · ${rows.length} total`}>
        {!rows.length ? <p className="text-sm text-muted">No feedback yet.</p> : (
          <ul className="grid gap-3">
            {rows.map((r) => (
              <li key={r.id} className={`rounded-xl border p-4 ${r.status === "new" ? "border-blue/30 bg-blue/[.03]" : "border-line bg-white opacity-75"}`}>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="font-semibold text-ink">{r.name}</span>
                  <Badge tone="grey">{ROLE_LABEL[r.role as Role] ?? r.role}</Badge>
                  <span>on <code className="rounded bg-mist px-1.5 py-0.5 text-[11px] text-deep">{r.page || "/"}</code></span>
                  <span>· {fmtDate(r.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="ml-auto"><MarkDone id={r.id} done={r.status === "done"} /></span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink">{r.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
