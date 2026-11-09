import { AskSata } from "@/components/AskSata";
import { EventPopup } from "@/components/EventPopup";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";
import { EVENT_LABEL, fmtRange } from "@/components/ui";
import { getPopupEvent } from "@/lib/store";

const tzs = (n: number) => `TZS ${n.toLocaleString("en-US")}`;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const e = await getPopupEvent().catch(() => null);
  const member = e?.fees.full ?? 0;
  const popup = e && {
    id: e.id, slug: e.slug, title: e.title, typeLabel: EVENT_LABEL[e.type], dates: fmtRange(e), venue: e.venue, summary: e.summary,
    image: e.image, cpdPoints: e.cpdPoints,
    fee: e.externalUrl ? `Register on ${new URL(e.externalUrl).hostname.replace(/^www\./, "")}` : member > 0 ? `Members ${tzs(member)}` : "Free for members",
    registerHref: e.externalUrl || `/events/${e.slug}`, external: !!e.externalUrl,
  };
  return (
    <>
      <span id="top" />
      <SiteNav />
      <main id="main-content" className="flex-1">{children}</main>
      <SiteFooter />
      <AskSata />
      {popup && <EventPopup event={popup} />}
    </>
  );
}
