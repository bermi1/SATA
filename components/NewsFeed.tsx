import { ArrowUpRight, CalendarDays, FlaskConical, Globe2, Newspaper, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { listNewsFeed } from "@/lib/news-feed";
import type { FeedItem } from "@/lib/types";

export const FEED_TABS = [
  { key: "news", label: "News", cats: ["news", "safety"], icon: Newspaper },
  { key: "events", label: "Events & conferences", cats: ["conference"], icon: CalendarDays },
  { key: "research", label: "Research", cats: ["research"], icon: FlaskConical },
  { key: "cases", label: "Case reports", cats: ["case"], icon: Stethoscope },
] as const;
const REGIONS = [["", "Everywhere"], ["tanzania", "Tanzania"], ["africa", "Africa"], ["world", "World"]] as const;

const ART: Record<FeedItem["category"], { from: string; to: string; icon: typeof Newspaper }> = {
  news: { from: "#0a3d66", to: "#127bc0", icon: Newspaper },
  safety: { from: "#0a3d66", to: "#0f766e", icon: ShieldCheck },
  conference: { from: "#3b1f66", to: "#127bc0", icon: CalendarDays },
  research: { from: "#0b1f33", to: "#1d6fa5", icon: FlaskConical },
  case: { from: "#4a1020", to: "#c2410c", icon: Stethoscope },
};
const REGION_LABEL = { tanzania: "Tanzania", africa: "Africa", world: "World" } as const;

const ago = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  if (d < 1) return "Today";
  if (d < 2) return "Yesterday";
  if (d < 30) return `${Math.floor(d)} days ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
};

// Every card has a picture: the article's own photo, or designed artwork for its category.
function Picture({ item, tall }: { item: FeedItem; tall?: boolean }) {
  const a = ART[item.category];
  const Icon = a.icon;
  return (
    <div className={`relative overflow-hidden ${tall ? "h-56 sm:h-72" : "h-40"}`} style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}>
      <div className="absolute inset-0 grid place-items-center">
        <Icon className="size-14 text-white/15" strokeWidth={1.25} />
        <span className="absolute bottom-3 left-4 right-4 truncate text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">{item.source}</span>
      </div>
      {item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105" />
      )}
      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
        <Globe2 className="size-3" /> {REGION_LABEL[item.region]}
      </span>
    </div>
  );
}

function Card({ item }: { item: FeedItem }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition hover:-translate-y-0.5 hover:border-blue hover:shadow-lg hover:shadow-ink/5">
      <Picture item={item} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-muted"><span className="truncate font-bold text-blue">{item.source}</span><span>·</span><span className="shrink-0">{ago(item.publishedAt)}</span></div>
        <h3 className="mt-2 line-clamp-3 font-display text-[15px] font-bold leading-snug text-deep group-hover:text-blue">{item.title}</h3>
        {item.summary && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{item.summary}</p>}
        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-bold text-blue">Read at source <ArrowUpRight className="size-3.5" /></span>
      </div>
    </a>
  );
}

export async function NewsFeed({ tab = "news", region = "" }: { tab?: string; region?: string }) {
  const t = FEED_TABS.find((x) => x.key === tab) ?? FEED_TABS[0];
  const reg = REGIONS.some(([k]) => k === region) ? region : "";
  const all = await listNewsFeed(reg ? { region: reg } : undefined, 300);
  const items = all.filter((x) => (t.cats as readonly string[]).includes(x.category))
    .sort((a, b) => (b.region !== "world" ? 1 : 0) - (a.region !== "world" ? 1 : 0) || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 24);
  const [lead, ...rest] = items;
  const href = (k: string, r: string) => `/news?${new URLSearchParams({ ...(k !== "news" ? { feed: k } : {}), ...(r ? { region: r } : {}) })}#world`;

  return (
    <section id="world" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue">Anaesthesia around the world</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-deep sm:text-3xl">News, events and research, updated daily.</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">Collected automatically every morning from journals, societies and news outlets in Tanzania, across Africa and worldwide. Stories open at their original source.</p>
        </div>
      </div>

      <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Feed sections">
        {FEED_TABS.map(({ key, label, icon: Icon }) => (
          <Link key={key} href={href(key, reg)} scroll={false} aria-current={key === t.key ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${key === t.key ? "border-deep bg-deep text-white" : "border-line bg-white text-ink hover:border-blue hover:text-blue"}`}>
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </nav>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Region">
        {REGIONS.map(([k, label]) => (
          <Link key={k} href={href(t.key, k)} scroll={false} aria-current={k === reg ? "true" : undefined}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${k === reg ? "bg-blue/10 text-blue" : "text-muted hover:text-blue"}`}>{label}</Link>
        ))}
      </div>

      {!lead ? (
        <p className="mt-8 rounded-lg border border-dashed border-line p-10 text-center text-sm text-muted">No {t.label.toLowerCase()} for this region yet. The feed refreshes every morning.</p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <a href={lead.url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-lg border border-line bg-white transition hover:border-blue hover:shadow-lg md:col-span-2 lg:row-span-2">
            <Picture item={lead} tall />
            <div className="p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted"><span className="font-bold text-blue">{lead.source}</span><span>·</span>{ago(lead.publishedAt)}</div>
              <h3 className="mt-2 font-display text-xl font-bold leading-snug text-deep group-hover:text-blue sm:text-2xl">{lead.title}</h3>
              {lead.summary && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{lead.summary}</p>}
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue">Read at source <ArrowUpRight className="size-4" /></span>
            </div>
          </a>
          {rest.map((n) => <Card key={n.id} item={n} />)}
        </div>
      )}
    </section>
  );
}
