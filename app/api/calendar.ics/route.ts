import { getSession } from "@/lib/auth";
import { calendarEntries } from "@/lib/store";

// iCalendar feed so members and the public can add SATA dates to Google, Apple or Outlook calendars.
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const day = (iso: string) => iso.replace(/-/g, "");
const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export async function GET(req: Request) {
  const me = await getSession();
  const entries = (await calendarEntries({ members: !!me })).filter((e) => e.kind !== "event" || !e.sample);
  const origin = new URL(req.url).origin;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SATA//Calendar//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:SATA Calendar", "X-WR-TIMEZONE:Africa/Dar_es_Salaam"];
  for (const e of entries) {
    const allDay = /^\d{4}-\d{2}-\d{2}$/.test(e.start);
    lines.push("BEGIN:VEVENT", `UID:${e.id}@sata.co.tz`, `DTSTAMP:${utc(new Date().toISOString())}`, `SUMMARY:${esc(e.title)}`);
    if (allDay) {
      const endDay = new Date((e.end ?? e.start) + "T00:00:00Z");
      endDay.setUTCDate(endDay.getUTCDate() + 1); // DTEND is exclusive for all-day entries
      lines.push(`DTSTART;VALUE=DATE:${day(e.start)}`, `DTEND;VALUE=DATE:${day(endDay.toISOString().slice(0, 10))}`);
    } else {
      lines.push(`DTSTART:${utc(e.start)}`, `DTEND:${utc(e.end ?? e.start)}`);
    }
    if (e.place) lines.push(`LOCATION:${esc(e.place)}`);
    if (e.href) lines.push(`URL:${e.href.startsWith("http") ? e.href : origin + e.href}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n"), { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'attachment; filename="sata-calendar.ics"' } });
}
