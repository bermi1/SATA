import { z } from "zod";
import { savePoster } from "./uploads";
import type { SataEvent } from "./types";

const TZ_OFFSET = "+03:00"; // East Africa Time

/** datetime-local values carry no zone: read them as EAT so the server's own timezone never matters. */
export const parseEat = (v: string) => new Date(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(v) ? `${v}:00${TZ_OFFSET}` : v);

/** ISO -> "YYYY-MM-DDTHH:mm" in EAT, for datetime-local inputs. */
export const toEatInput = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Africa/Dar_es_Salaam", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)).replace(" ", "T");

const num = z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)), z.number().int().min(0).optional());

const schema = z.object({
  title: z.string().min(3).max(160),
  type: z.enum(["conference", "agm", "workshop", "webinar", "meeting", "marathon", "training"]),
  mode: z.enum(["physical", "online", "hybrid"]),
  status: z.enum(["draft", "published", "cancelled"]).default("published"),
  startsAt: z.string().min(8),
  endsAt: z.string().min(8),
  venue: z.string().min(2).max(200),
  link: z.string().url().optional().or(z.literal("")),
  externalUrl: z.string().url().optional().or(z.literal("")),
  summary: z.string().min(5).max(2000),
  theme: z.string().max(200).optional(),
  capacity: num,
  cpdPoints: num,
  memberFee: num,
  guestFee: num,
  minutesRequired: num,
});

export async function parseEventForm(fd: FormData): Promise<{ data: Omit<SataEvent, "id" | "slug"> & { image?: string } } | { error: string }> {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: `Check the event details: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}` };
  const d = parsed.data;
  const startsAt = parseEat(d.startsAt);
  const endsAt = parseEat(d.endsAt);
  if (isNaN(+startsAt) || isNaN(+endsAt)) return { error: "Enter valid start and end times" };
  if (endsAt < startsAt) return { error: "The event must end after it starts" };

  let image: string | undefined;
  const poster = fd.get("poster");
  if (poster instanceof File && poster.size > 0) {
    const saved = await savePoster(poster);
    if ("error" in saved) return { error: saved.error };
    image = saved.url;
  }
  return {
    data: {
      title: d.title, type: d.type, mode: d.mode, status: d.status, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), venue: d.venue,
      link: d.link || undefined, externalUrl: d.externalUrl || undefined, summary: d.summary, theme: d.theme || undefined,
      capacity: d.capacity && d.capacity > 0 ? d.capacity : null, cpdPoints: d.cpdPoints ?? 0,
      fees: { full: d.memberFee ?? 0, associate: d.memberFee ?? 0, guest: d.guestFee ?? 0 },
      minutesRequired: d.minutesRequired && d.minutesRequired > 0 ? d.minutesRequired : undefined, image,
    },
  };
}
