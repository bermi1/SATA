import { ArrowUpRight, BookText, Camera, FileText, FlaskConical, Landmark, ScrollText, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AffiliateRow } from "@/components/Partners";
import { PageHero, SectionHead } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { Badge } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { listResources } from "@/lib/store";
import { isClosed, RESOURCE_KINDS, type Resource, type ResourceKind } from "@/lib/types";

export const metadata: Metadata = { title: "Resources & publications", description: "Reports, research, policy, guidelines, forms and photographs from the Society of Anaesthesiologists of Tanzania." };

const KIND: Record<ResourceKind, { label: string; plural: string; blurb: string; icon: typeof FileText }> = {
  report: { label: "Report", plural: "Reports", blurb: "Conference and programme reports.", icon: FileText },
  research: { label: "Research", plural: "Research", blurb: "Calls for abstracts, tracks and submission guidance.", icon: FlaskConical },
  publication: { label: "Publication", plural: "Publications", blurb: "Journals, proceedings and papers.", icon: BookText },
  policy: { label: "Policy", plural: "Policy & advocacy", blurb: "Recommendations, objectives and positions.", icon: Landmark },
  guideline: { label: "Guideline", plural: "Guidelines & information", blurb: "How membership, sponsorship and standards work.", icon: ScrollText },
  form: { label: "Form", plural: "Forms", blurb: "Applications and registrations.", icon: FileText },
  media: { label: "Media", plural: "Photos & media", blurb: "Photograph albums from our events.", icon: Camera },
};

function Item({ r }: { r: Resource }) {
  const K = KIND[r.kind];
  const closed = isClosed(r);
  const external = r.url.startsWith("http");
  const pdf = r.url.endsWith(".pdf");
  const props = external || pdf ? { target: "_blank", rel: "noreferrer" } : {};
  return (
    <a href={r.url} {...props} className={`group flex h-full gap-4 rounded-lg border border-line p-5 transition hover:border-blue hover:shadow-md hover:shadow-ink/5 ${closed ? "bg-mist/60" : "bg-white"}`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue/10 text-blue transition group-hover:bg-blue group-hover:text-white"><K.icon className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2"><Badge tone="grey">{K.label}</Badge>{r.year && <span className="text-xs font-semibold text-muted">{r.year}</span>}{r.membersOnly && <Badge tone="amber">Members</Badge>}{pdf && <Badge tone="green">PDF</Badge>}{closed && <Badge tone="red">Closed</Badge>}</span>
        <span className="mt-2 block font-display text-base font-bold leading-snug text-deep group-hover:text-blue">{r.title}</span>
        {r.author && <span className="mt-0.5 block text-xs text-muted">{r.author}</span>}
        <span className="mt-1.5 block text-sm leading-relaxed text-muted">{r.description}</span>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue">{pdf ? "Open PDF" : external ? "Open link" : "Read"} <ArrowUpRight className="size-3.5" /></span>
      </span>
    </a>
  );
}

export default async function Resources({ searchParams }: { searchParams: Promise<{ kind?: string; q?: string }> }) {
  const { kind, q = "" } = await searchParams;
  const me = await getSession();
  const all = (await listResources(!!me)).sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  const needle = q.trim().toLowerCase();
  const active = RESOURCE_KINDS.find((k) => k === kind);
  const filtered = all.filter((r) => (!active || r.kind === active) && (!needle || [r.title, r.description, r.author ?? ""].some((t) => t.toLowerCase().includes(needle))));
  const counts = Object.fromEntries(RESOURCE_KINDS.map((k) => [k, all.filter((r) => r.kind === k).length])) as Record<ResourceKind, number>;
  const live = filtered.filter((r) => !isClosed(r));
  const closed = filtered.filter((r) => isClosed(r));
  const grouped = RESOURCE_KINDS.map((k) => ({ k, items: live.filter((r) => r.kind === k) })).filter((g) => g.items.length);

  return (
    <>
      <PageHero pageKey="resources" eyebrow="Resources" title="Reports, research and publications." image="/images/aaac/hero-carousel-1800ss_getty_rf_surgery_anesthesia.webp" crumbs={[["Resources"]]}
        intro="The Society's library: conference reports, research calls, policy positions, guidelines, forms and photographs. New publications are added by the secretariat." />

      <div className="mx-auto max-w-7xl px-5 py-12 md:py-14">
        <form className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between" role="search">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by type">
            <Link href={q ? `/resources?q=${encodeURIComponent(q)}` : "/resources"} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${!active ? "bg-deep text-white" : "bg-mist text-deep hover:bg-blue/10"}`}>All <span className="opacity-60">{all.length}</span></Link>
            {RESOURCE_KINDS.filter((k) => counts[k] > 0).map((k) => <Link key={k} href={`/resources?kind=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active === k ? "bg-deep text-white" : "bg-mist text-deep hover:bg-blue/10"}`}>{KIND[k].plural} <span className="opacity-60">{counts[k]}</span></Link>)}
          </div>
          <div className="relative md:w-72">
            {active && <input type="hidden" name="kind" value={active} />}
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder="Search the library" aria-label="Search the library" className="w-full rounded-md border border-line bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue focus:ring-4 focus:ring-blue/10" />
          </div>
        </form>

        {filtered.length === 0 ? (
          <p className="mt-12 rounded-lg bg-mist p-8 text-center text-muted">Nothing matches your search. <Link href="/resources" className="font-semibold text-blue">Show everything</Link></p>
        ) : (
          <div className="mt-10 space-y-12">
            {grouped.map(({ k, items }) => (
              <section key={k} id={k}>
                <Reveal><SectionHead eyebrow={`${items.length} ${items.length === 1 ? "item" : "items"}`} title={KIND[k].plural} intro={KIND[k].blurb} /></Reveal>
                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((r, i) => <Reveal key={r.id} delay={i * 40}><Item r={r} /></Reveal>)}</div>
              </section>
            ))}
          </div>
        )}

        {closed.length > 0 && (
          <section id="closed" className="mt-14">
            <Reveal><SectionHead eyebrow={`${closed.length} ${closed.length === 1 ? "item" : "items"}`} title="Closed and past." intro="Calls, forms and deadlines whose event or closing date has passed. They stay here for reference." /></Reveal>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{closed.map((r) => <Item key={r.id} r={r} />)}</div>
          </section>
        )}

        <section className="mt-16 rounded-lg bg-mist p-6 sm:p-8">
          <SectionHead eyebrow="Beyond SATA" title="Publications from our affiliates." intro="Clinical guidance, training and professional standards from the bodies SATA is affiliated with." />
          <div className="mt-6"><AffiliateRow /></div>
        </section>
      </div>
    </>
  );
}
