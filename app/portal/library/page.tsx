import Link from "next/link";
import { Badge, fmtDate, PageHeader, Panel } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { listAllResources } from "@/lib/store";
import { RESOURCE_LABEL } from "@/lib/types";

const TONE = { pending: "amber", published: "green", rejected: "red" } as const;
const WORD = { pending: "Waiting for review", published: "Published", rejected: "Not accepted" } as const;

export default async function MyLibrary() {
  const me = await requirePage();
  const mine = (await listAllResources()).filter((r) => r.submittedBy === me.id);
  return (
    <>
      <PageHeader eyebrow="Resource library" title="My submissions">Track what you have sent to the Education committee.</PageHeader>
      <Panel title={`${mine.length} submission${mine.length === 1 ? "" : "s"}`} action={<Link href="/portal/submit" className="rounded-full bg-blue px-4 py-2 text-xs font-bold text-white hover:bg-deep">New submission</Link>}>
        {mine.length === 0 ? <p className="text-sm text-muted">Nothing yet. <Link href="/portal/submit" className="font-semibold text-blue">Submit your first item</Link> or <Link href="/resources" className="font-semibold text-blue">browse the library</Link>.</p> : (
          <ul className="divide-y divide-line">
            {mine.map((r) => {
              const st = r.status ?? "published";
              return (
                <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0"><div className="font-semibold text-deep">{st === "published" ? <Link href={`/resources/${r.id}`} className="hover:text-blue">{r.title}</Link> : r.title}</div><div className="text-xs text-muted">{RESOURCE_LABEL[r.kind]}{r.year ? ` · ${r.year}` : ""}{r.submittedAt ? ` · sent ${fmtDate(r.submittedAt)}` : ""}</div></div>
                    <Badge tone={TONE[st]}>{WORD[st]}</Badge>
                  </div>
                  {r.reviewNote && <p className="mt-2 rounded-xl bg-mist p-3 text-sm text-ink"><b className="text-deep">Reviewer note: </b>{r.reviewNote}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
