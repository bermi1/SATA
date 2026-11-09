import { ExternalLink } from "lucide-react";
import Link from "next/link";
import LibraryForm from "@/components/LibraryForm";
import { Badge, fmtDate, PageHeader, Panel } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { getMember, listAllResources } from "@/lib/store";
import { RESOURCE_LABEL } from "@/lib/types";
import ReviewControls from "./ReviewControls";

const TABS = [["pending", "Pending review"], ["published", "Published"], ["rejected", "Rejected"]] as const;

export default async function AdminLibrary({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const me = await requirePage("content");
  const writable = canWrite(me.role, "content");
  const { tab } = await searchParams;
  const active = TABS.find(([k]) => k === tab)?.[0] ?? "pending";
  const all = await listAllResources();
  const counts = { pending: 0, published: 0, rejected: 0 };
  for (const r of all) counts[r.status ?? "published"]++;
  const items = all.filter((r) => (r.status ?? "published") === active);
  const authors = new Map(await Promise.all([...new Set(items.map((r) => r.submittedBy).filter((x): x is string => !!x))].map(async (id) => [id, await getMember(id)] as const)));

  return (
    <>
      <PageHeader eyebrow="Education committee" title="Resource library">Review member submissions and manage everything in the public library from this one page.</PageHeader>
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map(([k, l]) => <Link key={k} href={`/admin/library?tab=${k}`} role="tab" aria-selected={active === k} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${active === k ? "bg-deep text-white" : "bg-white text-deep ring-1 ring-line hover:text-blue"}`}>{l} <span className={k === "pending" && counts.pending ? "rounded-full bg-amber-400 px-1.5 text-xs text-deep" : "opacity-60"}>{counts[k]}</span></Link>)}
      </div>

      <Panel className="mt-5">
        {items.length === 0 ? <p className="text-sm text-muted">{active === "pending" ? "Nothing is waiting for review." : "No items here."}</p> : (
          <ul className="divide-y divide-line">
            {items.map((r) => {
              const author = r.submittedBy ? authors.get(r.submittedBy) : null;
              return (
                <li key={r.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2"><Badge tone="blue">{RESOURCE_LABEL[r.kind]}</Badge>{r.year && <span className="text-xs font-semibold text-muted">{r.year}</span>}{r.membersOnly && <Badge tone="amber">Members only</Badge>}</div>
                  <h3 className="mt-1.5 font-display text-lg font-bold text-deep">{r.title}</h3>
                  <p className="text-xs text-muted">
                    {r.author && <>By {r.author} · </>}
                    {r.submittedBy ? <>Submitted by {author ? `${author.name} (${author.memberNo})` : "a former member"}{r.submittedAt ? ` on ${fmtDate(r.submittedAt)}` : ""}</> : "Added by the committee"}
                    {r.reviewedBy && <> · Reviewed by {r.reviewedBy}</>}
                  </p>
                  <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-ink">{r.description}</p>
                  {r.reviewNote && <p className="mt-2 rounded-xl bg-mist p-3 text-sm"><b className="text-deep">Note: </b>{r.reviewNote}</p>}
                  <a href={`/api/resources/${r.id}/file`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue"><ExternalLink className="size-3.5" /> Open file or link</a>
                  {writable && <ReviewControls item={{ id: r.id, title: r.title, kind: r.kind, description: r.description, url: r.url, membersOnly: r.membersOnly, year: r.year, author: r.author, closesAt: r.closesAt }} status={active} />}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {writable && (
        <Panel title="Add an item directly" className="mt-6">
          <p className="mb-4 text-sm text-muted">Items added here are published straight away. Upload a PDF or paste a link.</p>
          <LibraryForm url="/api/admin/library" admin submit="Add to library" success="Added to the library" />
        </Panel>
      )}
    </>
  );
}
