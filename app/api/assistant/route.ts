import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { listNewsFeed } from "@/lib/news-feed";
import { clientIp, limited, sameOrigin } from "@/lib/request";
import { listAnnouncements, listEvents, listOfficers } from "@/lib/store";

export const maxDuration = 60;

// "Ask SATA": a small, low-cost assistant (Claude Haiku 5.5) that answers questions about the Society from the
// site's own content. Needs ANTHROPIC_API_KEY; without it the widget explains that the assistant is offline.

const schema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) })).min(1).max(20),
});

const RULES = `You are "Ask SATA", the website assistant of the Society of Anaesthesiologists of Tanzania (SATA).
Answer questions about SATA (membership, events and conferences, leadership, CPD, resources, how to use the website and member portal) and give general, educational information about anaesthesia as a profession and field.
- Base facts about SATA only on the SATA KNOWLEDGE section. If the answer isn't there, say you don't know and suggest contacting the secretariat at info@sata.co.tz or the Contact page.
- Never give individual medical advice, diagnoses or drug doses for a specific patient. For personal medical questions, tell the person to speak to their doctor or anaesthetist.
- Keep answers short and friendly (2–5 sentences, or a short list). Reply in Swahili when the user writes in Swahili.
- Point to pages on the site with relative links like /membership, /membership/apply, /events, /news, /resources, /contact, /login.`;

let cached: { at: number; text: string } | null = null;

async function knowledge() {
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.text;
  const [officers, events, news, feed] = await Promise.all([listOfficers(), listEvents(), listAnnouncements("public"), listNewsFeed({ region: "tanzania" }, 8)]);
  const upcoming = events.filter((e) => new Date(e.endsAt).getTime() >= Date.now() - 86_400_000);
  const text = [
    "ABOUT: SATA is the national professional society of anaesthesiologists and anaesthesia providers in Tanzania, registered in 2002 under the NGOs Act No. 24. It promotes safe anaesthesia, education and CPD, research and advocacy, and is affiliated with WFSA, CANECSA and MAT. Tanzania hosts the All Africa Anaesthesia Congress (AAAC) 2027 (aaac2027.com). Secretariat: Dar es Salaam, info@sata.co.tz.",
    "WEBSITE: Join online at /membership/apply. Members sign in at /login with a one-time code sent to their email (no password). The member portal has a digital membership card with QR code, payments and receipts, event registration and tickets, CPD record, notifications and help desk. Anyone can check a card at /verify.",
    `LEADERSHIP: ${officers.map((o) => `${o.title}: ${o.name}`).join("; ")}`,
    `UPCOMING EVENTS: ${upcoming.map((e) => `${e.title} (${e.datesTbc ? "dates to be confirmed" : new Date(e.startsAt).toDateString()}, ${e.venue}) - ${e.summary} /events/${e.slug}`).join(" | ") || "none listed"}`,
    `SATA NEWS AND NOTICES:\n${news.slice(0, 8).map((n) => `## ${n.title} (${n.createdAt.slice(0, 10)}) /news/${n.slug}\n${n.body.slice(0, 1800)}`).join("\n\n")}`,
    `RECENT ANAESTHESIA NEWS FROM TANZANIA: ${feed.map((f) => `${f.title} (${f.source})`).join("; ") || "none"}`,
  ].join("\n\n");
  cached = { at: Date.now(), text };
  return text;
}

export async function POST(req: Request) {
  if (!(await sameOrigin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const blocked = await limited(`assistant:${await clientIp()}`, 30, 60 * 60_000);
  if (blocked) return blocked;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please type a question." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "The assistant is not switched on yet. Please use the Contact page." }, { status: 503 });

  const client = new Anthropic();
  const msgs = parsed.data.messages;
  if (msgs[0].role !== "user") msgs.shift();

  const stream = client.messages.stream({
    model: "claude-haiku-5-5",
    max_tokens: 1024,
    output_config: { effort: "low" },
    system: [
      { type: "text", text: RULES },
      { type: "text", text: `SATA KNOWLEDGE:\n${await knowledge()}`, cache_control: { type: "ephemeral" } },
    ],
    messages: msgs,
  });

  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      try {
        for await (const ev of stream) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") ctrl.enqueue(enc.encode(ev.delta.text));
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") ctrl.enqueue(enc.encode("\n\nSorry, I can't help with that. Please contact the SATA secretariat at info@sata.co.tz."));
        else if (final.stop_reason === "max_tokens") ctrl.enqueue(enc.encode("…"));
      } catch (e) {
        const msg = e instanceof Anthropic.RateLimitError ? "The assistant is busy right now. Please try again in a minute."
          : e instanceof Anthropic.AuthenticationError ? "The assistant is not configured correctly. Please use the Contact page."
          : "Sorry, something went wrong. Please try again.";
        ctrl.enqueue(enc.encode(msg));
      } finally { ctrl.close(); }
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
