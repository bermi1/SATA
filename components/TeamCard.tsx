import Image from "next/image";
import { linkedinUrl, type TeamMember } from "@/lib/team";

const LinkedInGlyph = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
);

// Portrait card: photo fills the card, a blue gradient at the bottom carries name, title and LinkedIn.
export function TeamCard({ m, priority }: { m: TeamMember; priority?: boolean }) {
  return (
    <article id={m.slug} className="group relative aspect-[4/5] scroll-mt-28 overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 via-sky-300/70 to-blue/70 shadow-md shadow-blue/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue/25">
      <Image src={m.photo} alt={m.name} fill priority={priority} sizes="(min-width:1280px) 200px, (min-width:768px) 30vw, 46vw" className="object-cover object-top transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06335a] via-[#0b4f89]/95 to-transparent px-3.5 pb-3.5 pt-14">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-[13.5px] font-bold leading-tight text-white">{m.name}</h3>
            <p className="mt-1 text-[10.5px] font-semibold uppercase leading-snug tracking-wide text-sky-200">{m.role}</p>
          </div>
          <a href={linkedinUrl(m)} target="_blank" rel="noreferrer" aria-label={`${m.name} on LinkedIn`} className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white hover:text-[#0a66c2]">
            <LinkedInGlyph />
          </a>
        </div>
      </div>
    </article>
  );
}
