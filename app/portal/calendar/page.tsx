import CalendarView from "@/components/CalendarView";
import { PageHeader } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { calendarEntries, listRegistrations } from "@/lib/store";

export default async function MemberCalendar() {
  const me = await requirePage();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dar_es_Salaam" }).format(new Date());
  const mine = new Set((await listRegistrations()).filter((r) => r.memberId === me.id).map((r) => r.eventId));
  const entries = (await calendarEntries({ members: true })).map((e) => (mine.has(e.id) ? { ...e, label: `${e.label} · You're registered` } : e));
  return (
    <>
      <PageHeader eyebrow="Calendar" title="SATA calendar">Every conference, webinar, meeting and deadline for the year, including members-only dates. Events you are registered for are marked.</PageHeader>
      <CalendarView entries={entries} initialKey={today} />
    </>
  );
}
