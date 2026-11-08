/**
 * Automatic anaesthesia news collector.
 *
 * Once a day (/api/cron/news) it reads ~20 public feeds: Google News searches focused on Tanzania, Africa and
 * conferences, the main anaesthesia journals and safety bodies, and PubMed research on anaesthesia in Africa.
 * Every item goes through a relevance model (below) that keeps only anaesthesia-related stories, works out
 * the region (Tanzania / Africa / World) and category, and ranks them. Only the newest MAX_ROWS are kept,
 * so the table stays tiny on the Supabase free tier.
 */
import { createHash } from "node:crypto";
import { repo } from "./db";
import type { FeedItem } from "./types";

const MAX_ROWS = 200;
const MAX_AGE_DAYS = 150;
const UA = "Mozilla/5.0 (compatible; SATA-NewsBot/1.0; +https://sata.co.tz)";

// ───────────────────────── sources

const gnews = (q: string, gl = "TZ") => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-${gl}&gl=${gl}&ceid=${gl}:en`;

interface Source { name: string; url: string; kind?: "research" | "case" | "events" | "news"; trusted?: boolean; region?: FeedItem["region"] }

export const SOURCES: Source[] = [
  // Google News: Tanzania, Africa, conferences, workforce
  { name: "Google News", url: gnews('anaesthesia OR anesthesia OR anaesthesiologist Tanzania') },
  { name: "Google News", url: gnews('"Society of Anaesthesiologists of Tanzania" OR SATA anaesthesia') },
  { name: "Google News", url: gnews('anaesthesia Muhimbili OR KCMC OR Bugando OR Zanzibar OR Dodoma') },
  { name: "Google News", url: gnews('anaesthesia OR anesthesia Africa', "KE") },
  { name: "Google News", url: gnews('anaesthesiologists shortage Africa OR "anaesthesia workforce"', "ZA") },
  { name: "Google News", url: gnews('anaesthesia OR anesthesiology conference OR congress 2026 OR 2027', "GB") },
  { name: "Google News", url: gnews('WFSA OR "World Federation of Societies of Anaesthesiologists"', "GB") },
  { name: "Google News", url: gnews('"All Africa Anaesthesia Congress" OR AAAC OR CANECSA', "KE") },
  { name: "Google News", url: gnews('anesthesiology research breakthrough', "US") },
  { name: "Google News", url: gnews('safe surgery anaesthesia Africa Lancet OR WHO', "GB") },
  // Journals, societies and safety bodies
  { name: "WFSA", url: "https://wfsahq.org/feed", trusted: true },
  { name: "CANECSA", url: "https://canecsa.org/feed/", trusted: true, region: "africa" },
  { name: "ESAIC", url: "https://www.esaic.org/feed/", trusted: true },
  { name: "NYSORA", url: "https://www.nysora.com/feed/", trusted: true },
  { name: "EMCrit", url: "https://emcrit.org/feed/" },
  { name: "Operation Smile", url: "https://www.operationsmile.org/feed" },
  { name: "Pediatric Anesthesia", url: "https://onlinelibrary.wiley.com/feed/14609592/most-recent", kind: "research", trusted: true },
  { name: "Canadian Journal of Anesthesia", url: "https://link.springer.com/search.rss?facet-journal-id=12630&query=&sortOrder=newestFirst", kind: "research", trusted: true },
  { name: "Regional Anesthesia & Pain Medicine", url: "https://rapm.bmj.com/rss/ahead.xml", kind: "research", trusted: true },
  { name: "Regional Anesthesia & Pain Medicine", url: "https://rapm.bmj.com/rss/current.xml", kind: "research", trusted: true },
  { name: "Southern African J. of Anaesthesia & Analgesia", url: "https://sajaa.co.za/index.php/sajaa/gateway/plugin/WebFeedGatewayPlugin/rss2", kind: "research", trusted: true, region: "africa" },
  { name: "medRxiv anesthesia", url: "https://connect.medrxiv.org/medrxiv_xml.php?subject=anesthesia", kind: "research", trusted: true },
  { name: "East & Central African J. of Surgery", url: "https://www.ajol.info/index.php/ecajs/gateway/plugin/WebFeedGatewayPlugin/rss2", kind: "research", region: "africa" },
  { name: "Tanzania J. of Health Research", url: "https://www.ajol.info/index.php/thrb/gateway/plugin/WebFeedGatewayPlugin/rss2", kind: "research", region: "tanzania" },
  { name: "East African Medical Journal", url: "https://www.ajol.info/index.php/eamj/gateway/plugin/WebFeedGatewayPlugin/rss2", kind: "research", region: "africa" },
  { name: "Malawi Medical Journal", url: "https://www.ajol.info/index.php/mmj/gateway/plugin/WebFeedGatewayPlugin/rss2", kind: "research", region: "africa" },
  { name: "Lancet Global Health", url: "https://www.thelancet.com/rssfeed/langlo_current.xml", kind: "research" },
  { name: "Lancet Global Health", url: "https://www.thelancet.com/rssfeed/langlo_online.xml", kind: "research" },
  { name: "BMJ Global Health", url: "https://gh.bmj.com/rss/current.xml", kind: "research" },
  { name: "Frontiers in Pain Research", url: "https://www.frontiersin.org/journals/pain-research/rss", kind: "research" },
  { name: "BMJ Case Reports", url: "https://casereports.bmj.com/rss/current.xml", kind: "case" },
  // General health and regional news: the relevance model keeps only anaesthesia stories
  { name: "Medical Xpress", url: "https://medicalxpress.com/rss-feed/search/?search=sedation" },
  { name: "Medical Xpress", url: "https://medicalxpress.com/rss-feed/search/?search=postoperative+pain" },
  { name: "ScienceDaily", url: "https://www.sciencedaily.com/rss/health_medicine/pain_control.xml" },
  { name: "Daily News Tanzania", url: "https://dailynews.co.tz/feed/", region: "tanzania" },
  { name: "HabariLeo", url: "https://habarileo.co.tz/feed/", region: "tanzania" },
  { name: "AllAfrica", url: "https://allafrica.com/tools/headlines/rdf/tanzania/headlines.rdf", region: "tanzania" },
  { name: "AllAfrica", url: "https://allafrica.com/tools/headlines/rdf/eastafrica/headlines.rdf", region: "africa" },
  { name: "AllAfrica", url: "https://allafrica.com/tools/headlines/rdf/health/headlines.rdf", region: "africa" },
  { name: "AllAfrica", url: "https://allafrica.com/tools/headlines/rdf/kenya/headlines.rdf", region: "africa" },
  { name: "AllAfrica", url: "https://allafrica.com/tools/headlines/rdf/uganda/headlines.rdf", region: "africa" },
  { name: "AllAfrica", url: "https://allafrica.com/tools/headlines/rdf/rwanda/headlines.rdf", region: "africa" },
  { name: "Nation Africa", url: "https://nation.africa/kenya/rss.xml", region: "africa" },
  { name: "WHO Africa", url: "https://www.afro.who.int/rss/featured-news.xml", region: "africa" },
  { name: "Health Policy Watch", url: "https://www.healthpolicy-watch.news/feed/" },
  { name: "MSF", url: "https://www.msf.org/rss/all" },
  { name: "British Journal of Anaesthesia", url: "https://www.bjanaesthesia.org/current.rss", kind: "research", trusted: true },
  { name: "Anaesthesia (journal)", url: "https://associationofanaesthetists-publications.onlinelibrary.wiley.com/action/showFeed?jc=13652044&type=etoc&feed=rss", kind: "research", trusted: true },
  { name: "Southern African J. of Anaesthesia", url: "https://www.tandfonline.com/feed/rss/ojaa20", kind: "research", trusted: true },
  { name: "Medical Xpress", url: "https://medicalxpress.com/rss-feed/search/?search=anesthesia" },
];

// ───────────────────────── relevance model
// A weighted feature classifier: each term carries a learned-style weight; an item is kept when the
// anaesthesia signal is strong enough. Region and category are separate one-vs-rest scorers.

const CORE: [RegExp, number][] = [
  [/\banaesthe|\banesthe/i, 4], [/anaesthesiolog|anesthesiolog/i, 5], [/\bWFSA\b|CANECSA|All Africa Anaesthesia/i, 5],
  [/perioperative|peri-operative/i, 3], [/\bsedation\b|\bairway\b|intubat/i, 2.5], [/\bICU\b|intensive care|critical care/i, 1.5],
  [/pain (medicine|management)|regional block|nerve block|spinal block|epidural/i, 2.5], [/\bsurg(ery|ical)\b/i, 1],
  [/obstetric|caesarean|c-section/i, 1], [/resuscitat|ventilat/i, 1.2], [/patient safety/i, 1.5],
];
const NEGATIVE: [RegExp, number][] = [
  [/\b(stock|shares|NYSE|NASDAQ|earnings|market size|CAGR|forecast to 20\d\d)\b/i, -6], // market-report spam
  [/veterinar|\bdog\b|\bcat\b|horse/i, -3], [/celebrity|lawsuit|malpractice verdict/i, -2],
  [/\bNASA\b|astrophysic|astronom|telescope|SATA (drive|cable|port|SSD)/i, -10], // acronym clashes (AAAC, SATA)
];
const TZ = /tanzania|dar es salaam|dodoma|mwanza|mbeya|arusha|moshi|zanzibar|muhimbili|\bMUHAS\b|\bKCMC\b|bugando|\bMNH\b|tanga|morogoro/i;
const AFRICA = /africa|kenya|uganda|rwanda|burundi|ethiopia|nigeria|ghana|malawi|zambia|zimbabwe|mozambique|botswana|namibia|congo|somalia|sudan|egypt|morocco|cameroon|senegal|sierra leone|liberia|madagascar|nairobi|kampala|kigali|lagos|accra|johannesburg|cape town|CANECSA|\bAAAC\b|COSECSA/i;
const CAT: [FeedItem["category"], RegExp][] = [
  ["case", /case report|case series|\ba case of\b|rare case|unusual case|clinical case/i],
  ["conference", /conference|congress|symposium|summit|annual meeting|workshop|masterclass|master class|\bCME\b|webinar|scientific meeting/i],
  ["safety", /patient safety|shortage|workforce|safe surgery|safe anaesthesia|maternal (death|mortality)|access to (surgery|anaesthesia)|WHO\b/i],
  ["research", /study|trial|randomi[sz]ed|cohort|meta-analysis|systematic review|journal|researchers|findings/i],
];

const sum = (text: string, terms: [RegExp, number][]) => terms.reduce((s, [re, w]) => s + (re.test(text) ? w : 0), 0);

export function classify(title: string, summary: string, src: Source) {
  const text = `${title} ${summary}`;
  const core = sum(text, CORE) + sum(title, CORE) * 0.5; // words in the headline count extra
  let score = core + sum(text, NEGATIVE) + (src.trusted ? 3 : 0);
  const region: FeedItem["region"] = TZ.test(text) ? "tanzania" : AFRICA.test(text) ? "africa" : src.region ?? "world";
  score += region === "tanzania" ? 4 : region === "africa" ? 2 : 0;
  const found = CAT.find(([, re]) => re.test(text))?.[0];
  const category: FeedItem["category"] = src.kind === "case" ? "case" : src.kind === "events" ? "conference"
    : src.kind === "research" ? (found === "case" ? "case" : "research") : found ?? "news";
  // PubMed / Europe PMC searches already match anaesthesia in the abstract, so their hits are relevant by construction.
  const targeted = /^(pubmed|epmc):/.test(src.url);
  const relevant = targeted || ((src.trusted ? score >= 4 : score >= 6) && core >= 3);
  return { relevant, score: Math.round(score * 10) / 10, region, category };
}

// ───────────────────────── feed parsing (RSS 2.0 and Atom, no dependencies)

const decode = (s: string) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&");
const strip = (s: string) => decode(decode(s)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"))?.[1];
const attr = (xml: string, name: string, a: string) => xml.match(new RegExp(`<${name}[^>]*\\s${a}="([^"]+)"`, "i"))?.[1];

interface Raw { title: string; summary: string; url: string; image?: string; source: string; date: Date }

function parseFeed(xml: string, src: Source): Raw[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  return blocks.flatMap((b) => {
    let title = strip(tag(b, "title") ?? "");
    const rawDesc = decode(tag(b, "description") ?? tag(b, "summary") ?? tag(b, "content:encoded") ?? tag(b, "content") ?? "");
    const url = decode((tag(b, "link") ?? attr(b, "link", "href") ?? "").trim());
    const date = new Date(tag(b, "pubDate") ?? tag(b, "published") ?? tag(b, "updated") ?? tag(b, "dc:date") ?? "");
    let source = src.name;
    if (src.name === "Google News") {
      const s = strip(tag(b, "source") ?? "");
      if (s) { source = s; title = title.replace(new RegExp(`\\s+-\\s+${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), ""); }
    }
    const image = attr(b, "media:content", "url") ?? attr(b, "media:thumbnail", "url") ?? (attr(b, "enclosure", "type")?.startsWith("image") ? attr(b, "enclosure", "url") : undefined) ?? rawDesc.match(/<img[^>]+src="([^"]+)"/i)?.[1];
    const summary = src.name === "Google News" ? "" : strip(rawDesc).slice(0, 400);
    if (!title || !/^https?:\/\//.test(url) || isNaN(date.getTime())) return [];
    return [{ title, summary, url, image: image && /^https:\/\//.test(image) ? image : undefined, source, date }];
  });
}

async function get(url: string, ms = 9000) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, application/json, text/html" }, signal: AbortSignal.timeout(ms), redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// PubMed: anaesthesia research from Tanzania and Africa (NCBI E-utilities, JSON).
const ANAES = "(anesthesia[tiab] OR anaesthesia[tiab] OR anesthesiology[tiab] OR anaesthesiologist*[tiab] OR anesthetic[tiab])";
const PUBMED_QUERIES: { term: string; src: Source }[] = [
  { term: `${ANAES} AND (Tanzania[tiab] OR Africa*[tiab])`, src: { name: "PubMed", url: "pubmed:africa", kind: "research", trusted: true } },
  { term: `${ANAES} AND Case Reports[pt]`, src: { name: "PubMed case reports", url: "pubmed:cases", kind: "case", trusted: true } },
];

async function pubmed(term: string): Promise<Raw[]> {
  const s = JSON.parse(await get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=pub_date&retmax=20&term=${encodeURIComponent(term)}`));
  const ids: string[] = s.esearchresult?.idlist ?? [];
  if (!ids.length) return [];
  const d = JSON.parse(await get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`));
  return ids.flatMap((id) => {
    const r = d.result?.[id];
    const date = new Date(r?.sortpubdate ?? r?.pubdate ?? "");
    if (!r?.title || isNaN(date.getTime())) return [];
    return [{ title: strip(r.title), summary: `${r.fulljournalname ?? r.source ?? ""}${r.authors?.length ? ` · ${r.authors.slice(0, 3).map((a: { name: string }) => a.name).join(", ")}${r.authors.length > 3 ? " et al." : ""}` : ""}`, url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`, source: "PubMed", date }];
  });
}

// Europe PMC: title/abstract searches (no key needed).
const EPMC_A = "(TITLE_ABS:anaesthesia OR TITLE_ABS:anesthesia OR TITLE_ABS:anaesthetic OR TITLE_ABS:anesthesiology)";
const EPMC_QUERIES: { q: string; src: Source }[] = [
  { q: `${EPMC_A} AND (TITLE_ABS:Africa OR TITLE_ABS:Tanzania OR TITLE_ABS:Kenya OR TITLE_ABS:Uganda OR TITLE_ABS:Ethiopia OR TITLE_ABS:Nigeria OR TITLE_ABS:Malawi OR TITLE_ABS:Rwanda)`, src: { name: "Europe PMC", url: "epmc:africa", kind: "research", trusted: true, region: "africa" } },
  { q: `TITLE_ABS:Tanzania AND (TITLE_ABS:anaesthesia OR TITLE_ABS:anesthesia OR TITLE_ABS:perioperative)`, src: { name: "Europe PMC", url: "epmc:tanzania", kind: "research", trusted: true, region: "tanzania" } },
  { q: `${EPMC_A} AND PUB_TYPE:"Case Reports"`, src: { name: "Europe PMC case reports", url: "epmc:cases", kind: "case", trusted: true } },
];

async function europePmc(q: string): Promise<Raw[]> {
  const d = JSON.parse(await get(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(q)}&format=json&pageSize=25&sort=${encodeURIComponent("P_PDATE_D desc")}&resultType=lite`));
  return (d.resultList?.result ?? []).flatMap((r: { title?: string; firstPublicationDate?: string; journalTitle?: string; authorString?: string; pmid?: string; doi?: string; id?: string; source?: string }) => {
    const date = new Date(r.firstPublicationDate ?? "");
    const url = r.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/` : r.doi ? `https://doi.org/${r.doi}` : r.id ? `https://europepmc.org/article/${r.source}/${r.id}` : "";
    if (!r.title || !url || isNaN(date.getTime())) return [];
    return [{ title: strip(r.title), summary: [r.journalTitle, r.authorString?.slice(0, 120)].filter(Boolean).join(" · "), url, source: r.journalTitle ?? "Europe PMC", date }];
  });
}

// Picture for stories whose feed has none: the article page's og:image (skips Google redirect pages).
async function ogImage(url: string) {
  if (/news\.google\.com|pubmed\.ncbi/.test(url)) return undefined;
  try {
    const html = (await get(url, 6000)).slice(0, 200_000);
    const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i) ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
    const img = m?.[1] && decode(m[1]);
    return img && /^https:\/\//.test(img) ? img : undefined;
  } catch { return undefined; }
}

const normTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").slice(0, 90);
const idOf = (url: string) => createHash("sha1").update(url).digest("hex").slice(0, 20);

// ───────────────────────── the job

export async function refreshNewsFeed() {
  const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;
  const report: Record<string, number | string> = {};

  const batches = await Promise.all([
    ...SOURCES.map(async (src) => {
      try { const items = parseFeed(await get(src.url), src).map((r) => ({ r, src })); report[src.url] = items.length; return items; }
      catch (e) { report[src.url] = e instanceof Error ? e.message : "failed"; return []; }
    }),
    (async () => { // one at a time: NCBI allows ~3 requests a second without a key
      const out: { r: Raw; src: Source }[] = [];
      for (const { term, src } of PUBMED_QUERIES) {
        try { const items = (await pubmed(term)).map((r) => ({ r, src })); report[src.url] = items.length; out.push(...items); }
        catch (e) { report[src.url] = e instanceof Error ? e.message : "failed"; }
        await new Promise((ok) => setTimeout(ok, 700));
      }
      return out;
    })(),
    ...EPMC_QUERIES.map(async ({ q, src }) => {
      try { const items = (await europePmc(q)).map((r) => ({ r, src })); report[src.url] = items.length; return items; }
      catch (e) { report[src.url] = e instanceof Error ? e.message : "failed"; return []; }
    }),
  ]);

  const seen = new Set<string>();
  const kept: FeedItem[] = [];
  for (const { r, src } of batches.flat()) {
    if (r.date.getTime() > Date.now()) r.date = new Date(); // journals often date issues in the future
    if (r.date.getTime() < cutoff) continue;
    const key = normTitle(r.title);
    if (seen.has(key)) continue;
    const c = classify(r.title, r.summary, src);
    if (!c.relevant) continue;
    seen.add(key);
    kept.push({ id: idOf(r.url), title: r.title, summary: r.summary, url: r.url, image: r.image ?? null, source: r.source, region: c.region, category: c.category, score: c.score, publishedAt: r.date.toISOString(), fetchedAt: new Date().toISOString() });
  }

  // Keep pictures already found on earlier runs; look up new ones for the best-ranked stories.
  const db = repo();
  const existing = await db.list<FeedItem>("news_feed");
  const prev = new Map(existing.map((x) => [x.id, x]));
  for (const k of kept) if (!k.image && prev.get(k.id)?.image) k.image = prev.get(k.id)!.image;
  const needImg = kept.filter((k) => !k.image && !prev.has(k.id)).sort((a, b) => b.score - a.score).slice(0, 25);
  await Promise.all(needImg.map(async (k) => { k.image = (await ogImage(k.url)) ?? null; }));

  if (kept.length) await db.putMany("news_feed", kept);

  // Retention with quotas, so busy journal feeds never crowd out Tanzanian and African news.
  const all = [...new Map([...existing, ...kept].map((x) => [x.id, x])).values()]
    .filter((x) => new Date(x.publishedAt).getTime() >= cutoff)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const keep = new Set<string>();
  const perSource = new Map<string, number>();
  const take = (pred: (x: FeedItem) => boolean, n: number, sourceCap = 20) => {
    for (const x of all) {
      if (n <= 0) break;
      if (keep.has(x.id) || !pred(x) || (perSource.get(x.source) ?? 0) >= sourceCap) continue;
      keep.add(x.id); perSource.set(x.source, (perSource.get(x.source) ?? 0) + 1); n--;
    }
  };
  take((x) => x.region !== "world", 60, 40);                      // everything from Tanzania and Africa first
  take((x) => x.category === "conference", 30);
  take((x) => x.category === "news" || x.category === "safety", 40);
  take((x) => x.category === "case", 25);
  take((x) => x.category === "research", 45);
  const drop = [...new Map([...existing, ...kept].map((x) => [x.id, x])).keys()].filter((id) => !keep.has(id));
  const stored = new Set(existing.map((x) => x.id).concat(kept.map((x) => x.id)));
  for (const id of drop) if (stored.has(id)) await db.del("news_feed", id);

  return { fetched: batches.flat().length, kept: kept.length, total: keep.size, removed: drop.length, max: MAX_ROWS, sources: report };
}

export async function listNewsFeed(filter?: { region?: string; category?: string }, limit = 60) {
  const rows = await repo().list<FeedItem>("news_feed", undefined, { orderBy: "publishedAt", desc: true, limit: 300 });
  return rows
    .filter((r) => (!filter?.region || r.region === filter.region) && (!filter?.category || r.category === filter.category))
    .slice(0, limit);
}
