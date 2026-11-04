import { ArrowUpRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { listGallery } from "@/lib/store";

export const metadata: Metadata = { title: "Gallery", description: "Photographs from SATA conferences, master classes and events." };

const when = (d: string) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(d + "T00:00:00Z"));

export default async function Gallery() {
  const albums = await listGallery();
  return (
    <>
      <PageHero pageKey="gallery" eyebrow="Gallery" title="SATA in pictures." crumbs={[["Resources", "/resources"], ["Gallery"]]}
        intro="Highlights from our conferences, master classes and meetings. Each album links to the complete set of photographs." />
      <div className="mx-auto max-w-7xl space-y-14 px-5 py-14 md:py-16">
        {albums.map((a) => (
          <Reveal key={a.id}>
            <section aria-labelledby={a.id}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue">{when(a.date)}</div>
                  <h2 id={a.id} className="mt-1 text-2xl font-bold text-deep">{a.title}</h2>
                  {a.place && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin className="size-3.5" />{a.place}</p>}
                </div>
                {a.link && <a href={a.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-blue px-5 py-2.5 text-sm font-bold text-white transition hover:bg-deep">View the full album <ArrowUpRight className="size-4" /></a>}
              </div>
              <div className={`mt-5 grid gap-3 ${a.photos.length > 1 ? "md:grid-cols-3" : ""}`}>
                {a.photos.map((p, i) => (
                  <a key={p} href={p} target="_blank" rel="noreferrer" className={`group relative block overflow-hidden rounded-lg bg-mist ${i === 0 && a.photos.length > 2 ? "md:col-span-2 md:row-span-2 aspect-[3/2]" : "aspect-[3/2]"}`}>
                    <Image src={p} alt={`${a.title}, photograph ${i + 1}`} fill sizes={i === 0 && a.photos.length > 2 ? "(min-width:768px) 66vw, 100vw" : "(min-width:768px) 33vw, 100vw"} quality={85} className="object-cover transition duration-500 group-hover:scale-[1.03]" unoptimized={p.startsWith("/api/")} />
                  </a>
                ))}
              </div>
            </section>
          </Reveal>
        ))}
      </div>
    </>
  );
}
