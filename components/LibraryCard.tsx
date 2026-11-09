import { ArrowUpRight, BookOpen, ClipboardList, FileText, FlaskConical, Lock, Newspaper, Stethoscope } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { RESOURCE_LABEL, isClosed, type Resource, type ResourceKind } from "@/lib/types";

export const KIND_ICON: Record<ResourceKind, typeof FileText> = { guideline: BookOpen, form: ClipboardList, research: FlaskConical, case: Stethoscope, article: Newspaper };

export function ResourceCard({ r, open }: { r: Resource; open: boolean }) {
  const Icon = KIND_ICON[r.kind];
  const closed = isClosed(r);
  return (
    <Link href={`/resources/${r.id}`} className={`group flex h-full gap-4 rounded-2xl border border-line p-5 transition hover:-translate-y-0.5 hover:border-blue hover:shadow-lg hover:shadow-ink/5 ${closed ? "bg-mist/60" : "bg-white"}`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue/10 text-blue transition group-hover:bg-blue group-hover:text-white"><Icon className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2"><Badge tone="blue">{RESOURCE_LABEL[r.kind]}</Badge>{r.year && <span className="text-xs font-semibold text-muted">{r.year}</span>}{closed && <Badge tone="red">Closed</Badge>}</span>
        <span className="mt-2 block font-display text-base font-bold leading-snug text-deep group-hover:text-blue">{r.title}</span>
        {r.author && <span className="mt-0.5 block text-xs text-muted">{r.author}</span>}
        <span className="mt-1.5 line-clamp-3 block text-sm leading-relaxed text-muted">{r.description}</span>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue">{open ? <>Open <ArrowUpRight className="size-3.5" /></> : <><Lock className="size-3.5" /> Members only</>}</span>
      </span>
    </Link>
  );
}
