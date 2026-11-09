import { Lock, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AffiliateRow } from "@/components/Partners";
import { PageHero, SectionHead } from "@/components/PageHero";
import { ResourceCard } from "@/components/LibraryCard";
import { Reveal } from "@/components/Reveal";
import { getSession } from "@/lib/auth";
import { canOpenResource } from "@/lib/library";
import { listResources } from "@/lib/store";
import { RESOURCE_KINDS, RESOURCE_LABEL } from "@/lib/types";

export const metadata: Metadata = { title: "Resource library", description: "Guidelines, forms, research, case studies and articles from the Society of Anaesthesiologists of Tanzania." };

export default async function Resources({ searchParams }: { searchParams: Promise<{ kind?: string; q?: string }> }) {
  const { kind, q = "" } = await searchParams;
  const me = await getSession();
  const all = (await listResources()).sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));
  const needle = q.trim().toLowerCase();
  const active = RESOURCE_KINDS.find((k) => k === kind);
  const filtered = all.filter((r) => (!active || r.kind === active) && (!needle || [r.title, r.description, r.author ?? ""].some((t) => t.toLowerCase().includes(needle))));
  const counts = Object.fromEntries(RESOURCE_KINDS.map((k) => [k, all.filter((r) => r.kind === k).length]));
  const locked = !me || (me.status !== "active" && me.role === "member");
  const tab = (on: boolean) => `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${on ? "bg-deep text-white" : "bg-mist text-deep hover:bg-blue/10"}`;
  const qs = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <>
      <PageHero pageKey="resources" eyebrow="Resource library" title="Guidelines, research and case studies." image="/images/aaac/hero-carousel-1800ss_getty_rf_surgery_anesthesia.webp" crumbs={[["Resources"]]}
        intro="Browse everything the Society has published. Members can open and download every item, and can submit their own research, case studies and articles for review." />

      <div className="mx-auto max-w-7xl px-5 py-10 md:py-14">
        {locked && (
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-blue/20 bg-gradient-to-br from-blue/5 to-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-deep text-white"><Lock className="size-5" /></span>
              <div><div className="font-display text-lg font-bold text-deep">Members only: sign in or join SATA</div><p className="mt-0.5 text-sm text-muted">You can see what is in the library. Opening and downloading needs an active SATA membership.</p></div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/login?next=/resources" className="rounded-full bg-blue px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue/25 hover:bg-deep">Sign in</Link>
              <Link href="/membership/apply" className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-deep hover:border-blue hover:text-blue">Join SATA</Link>
            </div>
          </div>
        )}

        <form className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" role="search">
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0" aria-label="Filter by type">
            <Link href={q ? `/resources?q=${encodeURIComponent(q)}` : "/resources"} className={tab(!active)}>All <span className="opacity-60">{all.length}</span></Link>
            {RESOURCE_KINDS.map((k) => <Link key={k} href={`/resources?kind=${k}${qs}`} className={tab(active === k)}>{RESOURCE_LABEL[k]} <span className="opacity-60">{counts[k]}</span></Link>)}
          </div>
          <div className="relative lg:w-80">
            {active && <input type="hidden" name="kind" value={active} />}
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder="Search title, author or topic" aria-label="Search the library" className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue focus:ring-4 focus:ring-blue/10" />
          </div>
        </form>

        {filtered.length === 0 ? (
          <p className="mt-10 rounded-2xl bg-mist p-8 text-center text-muted">Nothing matches. <Link href="/resources" className="font-semibold text-blue">Show everything</Link></p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((r, i) => <Reveal key={r.id} delay={Math.min(i, 6) * 40}><ResourceCard r={r} open={canOpenResource(r, me)} /></Reveal>)}</div>
        )}

        {me && me.status === "active" && (
          <div className="mt-10 rounded-2xl bg-mist p-6 text-center"><div className="font-display text-lg font-bold text-deep">Have research or a case to share?</div><p className="mt-1 text-sm text-muted">Submit it for review by the Education committee.</p><Link href="/portal/submit" className="mt-4 inline-block rounded-full bg-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-deep">Submit to the library</Link></div>
        )}

        <section className="mt-16 rounded-2xl bg-mist p-6 sm:p-8">
          <SectionHead eyebrow="Beyond SATA" title="Publications from our affiliates." intro="Clinical guidance, training and professional standards from the bodies SATA is affiliated with." />
          <div className="mt-6"><AffiliateRow /></div>
        </section>
      </div>
    </>
  );
}
