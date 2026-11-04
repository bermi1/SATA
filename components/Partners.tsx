import Image from "next/image";

interface Partner { id: string; name: string; logo: string; url?: string }

export const AFFILIATES = [
  { name: "WFSA", full: "World Federation of Societies of Anaesthesiologists", logo: "/images/affiliates/wfsa.svg", url: "https://www.wfsahq.org", wide: true },
  { name: "CANECSA", full: "College of Anaesthesiologists of East, Central and Southern Africa", logo: "/images/affiliates/canecsa.png", url: "https://canecsa.org" },
  { name: "MAT", full: "Medical Association of Tanzania", logo: "/images/affiliates/mat.jpg", url: "https://www.mat.or.tz" },
];

export function AffiliateRow({ dark }: { dark?: boolean }) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
      {AFFILIATES.map((a) => (
        <li key={a.name}>
          <a href={a.url} target="_blank" rel="noreferrer" className="group flex items-center gap-3" aria-label={a.full}>
            <span className={`grid place-items-center overflow-hidden ${a.wide ? "h-10 w-28" : "size-12 rounded-full"} ${dark ? "bg-white p-1" : ""} ${a.wide && dark ? "rounded-md px-2" : ""}`}>
              <Image src={a.logo} alt="" width={a.wide ? 112 : 48} height={a.wide ? 40 : 48} className="max-h-full w-auto object-contain" />
            </span>
            {!a.wide && <span className={`text-sm font-semibold ${dark ? "text-white/85 group-hover:text-white" : "text-deep group-hover:text-blue"}`}>{a.name}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function PartnerStrip({ partners }: { partners: Partner[] }) {
  return (
    <section aria-labelledby="partners" className="mx-auto mt-16 max-w-7xl px-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue" id="partners">Our partners</div>
      <ul className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {partners.map((p) => {
          const tile = (
            <span className="group grid aspect-[3/2] place-items-center overflow-hidden rounded-lg border border-line bg-white p-0.5 transition hover:border-blue hover:shadow-md">
              <Image src={p.logo} alt={p.name} width={300} height={200} className="h-full w-full object-contain grayscale transition duration-300 group-hover:grayscale-0" />
            </span>
          );
          return <li key={p.id}>{p.url ? <a href={p.url} target="_blank" rel="noreferrer" aria-label={p.name}>{tile}</a> : tile}</li>;
        })}
      </ul>
      <div className="mt-4 flex flex-col items-center gap-4 rounded-lg bg-mist px-5 py-6 text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">Affiliated with</span>
        <AffiliateRow />
      </div>
    </section>
  );
}
