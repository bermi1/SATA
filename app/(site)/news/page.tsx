import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero, SectionHead } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { excerpt } from "@/components/RichText";
import { Badge, fmtDate } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { listAnnouncements } from "@/lib/store";
import { NewsFeed } from "@/components/NewsFeed";


export const metadata: Metadata = { title: "News", description: "News, conference reports and announcements from the Society of Anaesthesiologists of Tanzania." };

export default async function News({ searchParams }: { searchParams: Promise<{ feed?: string; region?: string }> }) {
  const sp = await searchParams;
  const me = await getSession();
  const items = await listAnnouncements(me ? "member" : "public");
  const [lead, ...rest] = items;

  return (
    <>
      <PageHero pageKey="news" eyebrow="News & announcements" title="What's happening at SATA." image="/images/news/conference-2025.jpg" crumbs={[["News"]]}
        intro="Conference reports, announcements and notices from the Society, from the Mbeya and Mwanza conferences to the master class and AAAC 2027." />

      <div className="mx-auto max-w-7xl space-y-14 px-5 py-14 md:py-16">
        {lead && (
          <Reveal>
            <article className="grid overflow-hidden rounded-lg border border-line bg-white shadow-lg shadow-ink/5 lg:grid-cols-[1.05fr_1fr]">
              <div className="flex flex-col justify-center p-7 sm:p-10">
                <div className="flex items-center gap-2"><Badge>Latest</Badge><span className="text-xs font-semibold text-muted">{fmtDate(lead.createdAt)}</span></div>
                <h2 className="mt-4 font-display text-2xl font-bold leading-tight text-deep sm:text-3xl"><Link href={`/news/${lead.slug}`} className="hover:text-blue">{lead.title}</Link></h2>
                <p className="mt-3 leading-relaxed text-muted">{excerpt(lead.body, 260)}</p>
                <Link href={`/news/${lead.slug}`} className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-bold text-blue transition hover:gap-3">Read the full story <ArrowRight className="size-4" /></Link>
              </div>
              <div className="relative min-h-64 lg:min-h-[340px]">{lead.image ? <Image src={lead.image} alt="" fill sizes="(min-width:1024px) 560px, 100vw" className="object-cover" unoptimized={lead.image.startsWith("/api/")} /> : <div className="absolute inset-0 bg-gradient-to-br from-blue to-deep" />}</div>
            </article>
          </Reveal>
        )}

        <section>
          <Reveal><SectionHead eyebrow="From SATA" title="More from the Society." /></Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((n, i) => (
              <Reveal key={n.id} delay={i * 60}>
                <Link href={`/news/${n.slug}`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition hover:border-blue hover:shadow-lg hover:shadow-ink/5">
                  <div className="relative h-44 bg-gradient-to-br from-blue to-deep">{n.image && <Image src={n.image} alt="" fill sizes="(min-width:1024px) 400px, 100vw" className="object-cover transition duration-500 group-hover:scale-105" unoptimized={n.image.startsWith("/api/")} />}</div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted">{fmtDate(n.createdAt)}{n.audience === "members" && <Badge tone="amber">Members</Badge>}</div>
                    <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-deep group-hover:text-blue">{n.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{excerpt(n.body, 160)}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <NewsFeed tab={sp.feed} region={sp.region} />
      </div>
    </>
  );
}
