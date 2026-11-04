import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { excerpt, RichText } from "@/components/RichText";
import { fmtDate } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getArticle, listAnnouncements } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  return a && a.audience === "all" ? { title: a.title, description: excerpt(a.body, 160) } : { title: "News" };
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getArticle((await params).slug);
  const me = await getSession();
  if (!a || (a.audience === "members" && !me) || (a.audience === "leadership" && !(me && me.role !== "member"))) notFound();
  const more = (await listAnnouncements(me ? "member" : "public")).filter((x) => x.id !== a.id).slice(0, 3);

  return (
    <>
      <PageHero eyebrow={`News · ${fmtDate(a.createdAt, { day: "numeric", month: "long", year: "numeric" })}`} title={a.title} image={a.image} crumbs={[["News", "/news"], [a.title]]} />
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-12 lg:grid-cols-[1fr_320px]">
        <article className="max-w-3xl">
          {a.image && <Image src={a.image} alt="" width={1400} height={900} sizes="(min-width:1024px) 760px, 100vw" className="mb-8 aspect-[16/9] w-full rounded-lg object-cover shadow-md" unoptimized={a.image.startsWith("/api/")} priority />}
          <RichText text={a.body} />
          {a.link && <a href={a.link.url} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-md bg-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-deep">{a.link.label} <ArrowUpRight className="size-4" /></a>}
          <p className="mt-10 border-t border-line pt-5 text-sm text-muted">Published by {a.author}. <Link href="/news" className="font-semibold text-blue">← All news</Link></p>
        </article>
        <aside className="space-y-6">
          <div className="rounded-lg border border-line p-5">
            <h2 className="font-display text-base font-bold text-deep">More news</h2>
            <ul className="mt-3 divide-y divide-line">{more.map((m) => <li key={m.id}><Link href={`/news/${m.slug}`} className="block py-3 first:pt-0"><span className="block text-xs text-muted">{fmtDate(m.createdAt)}</span><span className="mt-0.5 block text-sm font-semibold text-deep hover:text-blue">{m.title}</span></Link></li>)}</ul>
          </div>
          <div className="rounded-lg bg-deep p-5 text-white"><h2 className="font-display text-base font-bold">Join SATA</h2><p className="mt-1.5 text-sm text-white/75">Professional recognition, CPD and a voice in the Society.</p><Link href="/membership" className="mt-4 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-bold text-deep">Membership</Link></div>
        </aside>
      </div>
    </>
  );
}
