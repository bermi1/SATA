import type { MetadataRoute } from "next";
import { listAnnouncements, listEvents } from "@/lib/store";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sata.co.tz";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/about", "/leadership", "/membership", "/membership/apply", "/events", "/news", "/resources", "/gallery", "/contact", "/verify", "/privacy", "/terms", "/accessibility"];
  const [events, news] = await Promise.all([listEvents(), listAnnouncements("public")]);
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...events.map((e) => ({ url: `${base}/events/${e.slug}`, lastModified: new Date(e.startsAt), priority: 0.6 })),
    ...news.filter((a) => a.slug).map((a) => ({ url: `${base}/news/${a.slug}`, lastModified: new Date(a.createdAt), priority: 0.5 })),
  ];
}
