// Weekly newsletter: compose a ranked "10 key things" draft, edit it, send it.
import Anthropic from "@anthropic-ai/sdk";
import { repo } from "./db";
import { listNewsFeed } from "./news-feed";
import { sendNewsletterBatch } from "./newsletter-email";
import { listAnnouncements, listEvents, listMembers, listSubscribers } from "./store";
import type { FeedItem, Newsletter, NewsletterItem, NewsletterKind } from "./types";

const DAY = 86_400_000;
export const ITEM_COUNT = 10;
const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sata-website-liard.vercel.app").replace(/\/$/, "");
const uid = () => `nl${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Monday (UTC) of the week containing `d`, as YYYY-MM-DD. */
export function mondayOf(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

export function clip(text: string, max = 200) {
  const t = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40)).replace(/[\s,;:.-]+$/, "") + "…";
}

interface Candidate { item: NewsletterItem; score: number; own: boolean; feedScore: number }

const REGION = { tanzania: 30, africa: 20, world: 10 } as const;
const CATEGORY_BONUS: Record<FeedItem["category"], number> = { conference: 6, research: 5, case: 5, safety: 4, news: 0 };

/** Scoring: SATA content first (recent announcements, upcoming events), then the feed by region, category and its own score. */
export function rankCandidates(input: {
  announcements: { title: string; body: string; slug?: string; id: string; createdAt: string; image?: string }[];
  events: { title: string; summary: string; slug: string; startsAt: string; image?: string; externalUrl?: string; type: string }[];
  feed: FeedItem[];
  now?: number;
}): Candidate[] {
  const now = input.now ?? Date.now();
  const out: Candidate[] = [];
  for (const a of input.announcements) {
    const age = (now - +new Date(a.createdAt)) / DAY;
    if (age > 7 || age < 0) continue;
    out.push({ own: true, feedScore: 0, score: 200 - age * 3, item: { title: a.title, summary: clip(a.body), url: `${SITE()}/news/${a.slug ?? a.id}`, image: a.image, source: "SATA", kind: "announcement" } });
  }
  for (const e of input.events) {
    const ahead = (+new Date(e.startsAt) - now) / DAY;
    if (ahead < 0 || ahead > 60) continue;
    out.push({ own: true, feedScore: 0, score: 190 - ahead, item: { title: e.title, summary: clip(e.summary), url: e.externalUrl ?? `${SITE()}/events/${e.slug}`, image: e.image, source: "SATA", kind: e.type === "conference" || e.type === "agm" ? "conference" : "event" } });
  }
  for (const f of input.feed) {
    const age = (now - +new Date(f.publishedAt)) / DAY;
    if (age > 10 || age < -1) continue;
    out.push({ own: false, feedScore: f.score, score: REGION[f.region] + CATEGORY_BONUS[f.category] + Math.max(0, 10 - age) * 0.8 + Math.min(f.score, 50) * 0.1, item: { title: f.title, summary: clip(f.summary || f.title), url: f.url, image: f.image ?? undefined, source: f.source, kind: f.category } });
  }
  return out.sort((a, b) => b.score - a.score || b.feedScore - a.feedScore);
}

/** Take the top N, making sure there is an event/conference, a research item and a case report when any exist. */
export function pickMix(ranked: Candidate[], n = ITEM_COUNT): NewsletterItem[] {
  const seen = new Set<string>();
  const uniq = ranked.filter((c) => (seen.has(c.item.url) ? false : (seen.add(c.item.url), true)));
  const maxOwn = 6;
  let own = 0;
  const picked: Candidate[] = [];
  for (const c of uniq) {
    if (picked.length >= n) break;
    if (c.own && own >= maxOwn) continue;
    if (c.own) own++;
    picked.push(c);
  }
  const wants: NewsletterKind[][] = [["event", "conference"], ["research"], ["case"]];
  for (const kinds of wants) {
    if (picked.some((p) => kinds.includes(p.item.kind))) continue;
    const add = uniq.find((c) => kinds.includes(c.item.kind) && !picked.includes(c));
    if (!add) continue;
    const needed = (p: Candidate) => wants.some((w) => w.includes(p.item.kind) && picked.filter((q) => w.includes(q.item.kind)).length === 1);
    const victim = [...picked].reverse().find((p) => !needed(p));
    if (picked.length < n) picked.push(add);
    else if (victim) picked[picked.indexOf(victim)] = add;
  }
  return picked.sort((a, b) => b.score - a.score).map((c) => c.item);
}

function templateIntro(items: NewsletterItem[]) {
  const top = items.slice(0, 3).map((i) => i.title.replace(/[.!?]+$/, ""));
  const lead = top.length ? ` This week we look at ${top.length > 1 ? top.slice(0, -1).join(", ") + " and " + top[top.length - 1] : top[0]}.` : "";
  return `Dear colleagues, welcome to this week's SATA digest.${lead}\n\nHere are the ${items.length} things worth your time, from our own community and from anaesthesia, critical care and patient safety around Tanzania, Africa and the world.`;
}

async function aiIntro(items: NewsletterItem[]): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY || items.length === 0) return null;
  try {
    const client = new Anthropic({ timeout: 20_000, maxRetries: 1 });
    const r = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 1024,
      output_config: { effort: "low" },
      system: "You write the weekly newsletter of the Society of Anaesthesiologists of Tanzania (SATA). Write a warm, professional 2-3 sentence introduction in SATA's voice (collegial, practical, proud of Tanzanian anaesthesia). No greeting line, headings, bullet points or emojis, and do not list every story. Reply with the introduction only.",
      messages: [{ role: "user", content: "This week's stories:\n" + items.map((i, n) => `${n + 1}. ${i.title}`).join("\n") }],
    });
    if (r.stop_reason === "refusal") return null;
    const text = r.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    return text.length > 20 ? text : null;
  } catch {
    return null;
  }
}

export const listNewsletters = async () => (await repo().list<Newsletter>("newsletters")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
export const getNewsletter = (id: string) => repo().get<Newsletter>("newsletters", id);
export async function currentDraft() {
  return (await listNewsletters()).find((n) => n.status === "draft") ?? null;
}

export async function composeWeekly(createdBy = "system"): Promise<Newsletter> {
  const [announcements, events, feed] = await Promise.all([listAnnouncements("public"), listEvents(), listNewsFeed(undefined, 300)]);
  const items = pickMix(rankCandidates({ announcements, events: events.filter((e) => !e.sample), feed }));
  const intro = (await aiIntro(items)) ?? templateIntro(items);
  const weekOf = mondayOf();
  const existing = (await listNewsletters()).find((n) => n.status === "draft" && n.weekOf === weekOf);
  const nl: Newsletter = {
    id: existing?.id ?? uid(),
    weekOf,
    subject: existing?.subject ?? `SATA weekly: ${items.length} key things this week`,
    intro,
    items,
    status: "draft",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    sentCount: 0,
    createdBy: existing?.createdBy ?? createdBy,
  };
  await repo().put("newsletters", nl);
  return nl;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Subscribers plus active members, de-duplicated. Neither table has an unsubscribe flag; unsubscribing means being removed. */
export async function newsletterRecipients(): Promise<string[]> {
  const [subs, members] = await Promise.all([listSubscribers(), listMembers()]);
  const set = new Set<string>();
  for (const e of [...subs.map((s) => s.email), ...members.filter((m) => m.status === "active").map((m) => m.email)]) {
    const x = (e ?? "").trim().toLowerCase();
    if (EMAIL.test(x)) set.add(x);
  }
  return [...set];
}

export const sendTest = (nl: Newsletter, to: string) => sendNewsletterBatch(nl, [to], "[TEST] ");

export async function sendIssue(id: string) {
  const nl = await getNewsletter(id);
  if (!nl) return { error: "Newsletter not found" as const };
  if (nl.status === "sent") return { error: "This issue has already been sent" as const };
  const recipients = await newsletterRecipients();
  if (recipients.length === 0) return { error: "There are no recipients yet" as const };
  const r = await sendNewsletterBatch(nl, recipients);
  const done: Newsletter = { ...nl, status: "sent", sentAt: new Date().toISOString(), sentCount: r.sent };
  await repo().put("newsletters", done);
  return { newsletter: done, ...r, recipients: recipients.length };
}
