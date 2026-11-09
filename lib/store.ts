import { repo } from "./db";
import { SETTINGS_SEED } from "./db/seed-data";
import { FEES } from "./config";
import { normalizePhone } from "./sms";
import { sendRenewalEmail, sendWelcomeEmail } from "./member-mail";
import type { TeamMember } from "./team";
import type {
  Attendance, AudienceSpec, AuditEntry, Category, Member, MessageLog, Notification, Payment, PayMethod, PayPurpose,
  Announcement, CalendarItem, CalEntry, Enquiry, GalleryAlbum, Registration, Resource, Role, SataEvent, SitePartner, SiteSettings, Subscriber, Ticket,
  Department, Officer,
} from "./types";
import { normalizeKind } from "./types";

const R = () => repo();

const slugOf = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const byDateDesc = <T,>(f: (x: T) => string) => (a: T, b: T) => +new Date(f(b)) - +new Date(f(a));
const nowIso = () => new Date().toISOString();

async function log(actor: string, action: string) {
  const e: AuditEntry = { id: uid("l"), at: nowIso(), actor, action };
  await R().put("audit", e);
}

export const isInGoodStanding = (m: Member) =>
  m.status === "active" && (m.category === "honorary" || (m.paidThrough !== null && new Date(m.paidThrough) >= new Date()));

export const daysToRenewal = (m: Member) => (m.paidThrough ? Math.ceil((+new Date(m.paidThrough) - Date.now()) / 86_400_000) : null);

const renewalDate = () => {
  const now = new Date();
  return new Date(now.getMonth() > 5 ? now.getFullYear() + 1 : now.getFullYear(), 5, 30);
};

// ───── reads
export const listMembers = () => R().list<Member>("members", undefined, { orderBy: "memberNo" });
export const getMember = (id: string) => R().get<Member>("members", id);
export const getMemberByNo = async (no: string) => (await R().list<Member>("members", { memberNo: no.trim().toUpperCase() }))[0] ?? null;
export const getMemberByEmail = async (e: string) => (await R().list<Member>("members", { email: e.trim().toLowerCase() }))[0] ?? null;
export const listOfficers = async () => (await R().list<Officer>("officers")).sort((a, b) => a.rank - b.rank);
export const listDepartments = async () => (await R().list<Department>("departments")).sort((a, b) => a.id.localeCompare(b.id));
export async function listEvents(opts: { includeDrafts?: boolean } = {}) {
  const all = await R().list<SataEvent>("events");
  return all.filter((e) => opts.includeDrafts || (e.status ?? "published") === "published").sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
}
/** The event currently promoted as a website pop-up (soonest upcoming, published, with popup on). */
export async function getPopupEvent() {
  const now = Date.now();
  return (await listEvents()).find((e) => e.popup && new Date(e.popupUntil ?? e.startsAt).getTime() >= now && new Date(e.endsAt).getTime() >= now) ?? null;
}
export async function getEvent(idOrSlug: string) {
  return (await R().get<SataEvent>("events", idOrSlug)) ?? (await R().list<SataEvent>("events", { slug: idOrSlug }))[0] ?? null;
}
export const listRegistrations = (eventId?: string) => R().list<Registration>("registrations", eventId ? { eventId } : undefined);
export const listAttendance = (eventId?: string) => R().list<Attendance>("attendance", eventId ? { eventId } : undefined);
export const listPayments = async () => (await R().list<Payment>("payments")).sort(byDateDesc((p) => p.createdAt));
export async function listAnnouncements(audience: "public" | "member" | "leadership" = "public") {
  const all = await R().list<Announcement>("announcements");
  return all.filter((a) => a.audience === "all" || (audience !== "public" && a.audience === "members") || (audience === "leadership" && a.audience === "leadership")).sort(byDateDesc((a) => a.createdAt));
}
const normResource = (r: Resource): Resource => ({ ...r, kind: normalizeKind(r.kind), status: r.status ?? "published" });
/** Published library items (kinds normalised). Opening a file is gated separately; the listing shows everything. */
export async function listResources(_member = true) {
  return (await R().list<Resource>("resources")).map(normResource).filter((r) => r.status === "published");
}
/** Every library item in any status, for the Education committee. */
export async function listAllResources() {
  return (await R().list<Resource>("resources")).map(normResource).sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "") || (b.year ?? 0) - (a.year ?? 0));
}
export async function getResource(id: string) {
  const r = await R().get<Resource>("resources", id);
  return r ? normResource(r) : null;
}
export async function submitResource(member: Member, input: Pick<Resource, "title" | "kind" | "description" | "author" | "year" | "url">) {
  const r: Resource = { ...input, id: uid("res"), membersOnly: true, status: "pending", submittedBy: member.id, submittedAt: nowIso() };
  await R().put("resources", r);
  await log(member.name, `Submitted to library: ${r.title}`);
  return r;
}
export async function reviewResource(id: string, decision: "approve" | "reject", note: string, reviewer: string) {
  const r = await R().get<Resource>("resources", id);
  if (!r) return { error: "Item not found" as const };
  r.status = decision === "approve" ? "published" : "rejected";
  r.reviewedBy = reviewer;
  r.reviewNote = note || null;
  await R().put("resources", r);
  await log(reviewer, `${decision === "approve" ? "Approved" : "Rejected"} library item: ${r.title}`);
  return { resource: normResource(r) };
}
export const listTickets = async () => (await R().list<Ticket>("tickets")).sort(byDateDesc((t) => t.createdAt));
export const listAudit = () => R().list<AuditEntry>("audit", undefined, { orderBy: "at", desc: true, limit: 80 });
export const listSubscribers = async () => (await R().list<Subscriber>("subscribers")).sort(byDateDesc((s) => s.createdAt));
export const listMessages = () => R().list<MessageLog>("messages", undefined, { orderBy: "at", desc: true, limit: 200 });

/** A lookup of members by id, to avoid one query per row when rendering lists. */
export async function memberMap() {
  return new Map((await listMembers()).map((m) => [m.id, m]));
}

// ───── events
type NewEvent = Omit<SataEvent, "id" | "slug">;

export async function createEvent(e: NewEvent, actor: string) {
  const slug = slugOf(e.title) + "-" + Math.random().toString(36).slice(2, 5);
  const ev: SataEvent = { status: "published", ...e, id: uid("e"), slug };
  await R().put("events", ev);
  await log(actor, `Created event "${ev.title}"${ev.status === "draft" ? " (draft)" : ""}`);
  return ev;
}

export async function updateEvent(id: string, patch: Partial<NewEvent>, actor: string) {
  const ev = await getEvent(id);
  if (!ev) return { error: "Event not found" as const };
  Object.assign(ev, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)));
  await R().put("events", ev);
  await log(actor, `Updated event "${ev.title}"`);
  return { event: ev };
}

export async function deleteEvent(id: string, actor: string) {
  const ev = await getEvent(id);
  if (!ev) return { error: "Event not found" as const };
  if ((await listRegistrations(ev.id)).length || (await listAttendance(ev.id)).length) return { error: "This event has registrations or attendance. Cancel it instead of deleting." as const };
  await R().del("events", ev.id);
  await log(actor, `Deleted event "${ev.title}"`);
  return { ok: true as const };
}

export async function registerForEvent(eventId: string, who: { memberId?: string; guestName?: string; guestEmail?: string; guestPhone?: string }) {
  const ev = await getEvent(eventId);
  if (!ev || (ev.status ?? "published") === "draft") return { error: "Event not found" as const };
  if (ev.status === "cancelled") return { error: "This event has been cancelled" as const };
  if (new Date(ev.endsAt) < new Date()) return { error: "This event has ended" as const };
  const regs = await listRegistrations(ev.id);
  const existing = who.memberId ? regs.find((r) => r.memberId === who.memberId) : undefined;
  if (existing) return { registration: existing, event: ev, already: true as const, fee: 0 };
  if (ev.capacity !== null && regs.length >= ev.capacity) return { error: "This event is full" as const };
  const member = who.memberId ? await getMember(who.memberId) : null;
  const fee = member ? ev.fees[member.category] ?? 0 : ev.fees.guest ?? 0;
  const r: Registration = {
    id: uid("r"), eventId: ev.id, memberId: who.memberId ?? null, guestName: who.guestName, guestEmail: who.guestEmail, guestPhone: who.guestPhone,
    ticketCode: `${ev.slug.slice(0, 3).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    paid: fee === 0, createdAt: nowIso(),
  };
  await R().put("registrations", r);
  await log(member?.name ?? who.guestName ?? "Guest", `Registered for "${ev.title}"`);
  return { registration: r, event: ev, fee, already: false as const };
}

export async function setRegistrationPaid(id: string, paid: boolean, actor: string) {
  const r = await R().get<Registration>("registrations", id);
  if (!r) return { error: "Registration not found" as const };
  r.paid = paid;
  await R().put("registrations", r);
  await log(actor, `Marked a registration ${paid ? "paid" : "unpaid"} for "${(await getEvent(r.eventId))?.title}"`);
  return { registration: r };
}

export async function removeRegistration(id: string, actor: string) {
  const r = await R().get<Registration>("registrations", id);
  if (!r) return { error: "Registration not found" as const };
  await R().del("registrations", id);
  await log(actor, `Removed a registration from "${(await getEvent(r.eventId))?.title}"`);
  return { ok: true as const };
}

/** Contact details for a registrant. Pass a `memberMap()` when rendering many rows. */
export const registrantContact = (r: Registration, members: Map<string, Member>) => {
  const m = r.memberId ? members.get(r.memberId) : undefined;
  return { name: m?.name ?? r.guestName ?? "Guest", phone: m?.phone ?? r.guestPhone, email: m?.email ?? r.guestEmail, memberNo: m?.memberNo };
};

// ───── attendance
export async function recordAttendance(
  eventId: string,
  by: { ticketCode?: string; memberNo?: string; memberId?: string },
  opts: { method: Attendance["method"]; minutes?: number; actor: string },
) {
  const ev = await getEvent(eventId);
  if (!ev) return { error: "Event not found" as const };
  const regs = await listRegistrations(ev.id);
  let reg: Registration | undefined;
  let member: Member | null = null;
  if (by.ticketCode) {
    const code = by.ticketCode.trim().toLowerCase();
    reg = regs.find((r) => r.ticketCode.toLowerCase() === code);
    if (!reg) return { error: "Ticket not recognised for this event" as const };
    member = reg.memberId ? await getMember(reg.memberId) : null;
  } else {
    member = by.memberId ? await getMember(by.memberId) : by.memberNo ? await getMemberByNo(by.memberNo) : null;
    if (!member) return { error: "Member not found" as const };
    reg = regs.find((r) => r.memberId === member!.id);
  }
  const present = await listAttendance(ev.id);
  const dup = present.find((a) => (member && a.memberId === member.id) || (!member && reg && a.guestName === reg.guestName));
  if (dup) return { error: "Already checked in" as const };
  const counted = ev.minutesRequired ? (opts.minutes ?? 0) >= ev.minutesRequired : true;
  const a: Attendance = {
    id: uid("a"), eventId: ev.id, memberId: member?.id ?? null, guestName: member ? undefined : reg?.guestName,
    checkedInAt: nowIso(), method: opts.method, minutes: opts.minutes, counted,
  };
  await R().put("attendance", a);
  const cpdAwarded = member && counted ? ev.cpdPoints : 0;
  if (member && cpdAwarded) { member.cpdPoints += cpdAwarded; await R().put("members", member); }
  await log(opts.actor, `Checked in ${member?.name ?? reg?.guestName ?? "guest"} at "${ev.title}"`);
  return { attendance: a, member, event: ev, cpdAwarded };
}

// ───── members
export async function applyForMembership(input: { name: string; email: string; phone: string; category: Category; cadre: string; facility: string; region: string; application?: Record<string, unknown> | null }) {
  const email = input.email.trim().toLowerCase();
  if (await getMemberByEmail(email)) return { error: "An application with this email already exists" as const };
  const n = await R().seq("member");
  const m: Member = {
    ...input, email, phone: normalizePhone(input.phone) ?? input.phone, id: `m${String(n).padStart(3, "0")}`, memberNo: `SATA-${String(n).padStart(4, "0")}`, status: "pending",
    paidThrough: null, cpdPoints: 0, joinedAt: nowIso(), role: "member", departmentIds: [],
  };
  await R().put("members", m);
  await log(m.name, "Submitted a membership application");
  return { member: m, registrationFee: FEES[m.category].registration };
}

export async function decideApplication(id: string, approve: boolean, actor: string) {
  const m = await getMember(id);
  if (!m || m.status !== "pending") return { error: "Application not found" as const };
  if (approve) {
    m.status = "active";
    m.paidThrough = m.category === "honorary" ? null : renewalDate().toISOString();
    m.application = { ...(m.application ?? {}), approvedAt: nowIso() };
    await R().put("members", m);
    await addNotification(m.id, "Welcome to SATA", `Your application was approved. Your membership number is ${m.memberNo}.`, "general");
    await sendWelcomeEmail(m);
  } else {
    m.status = "suspended";
    await R().put("members", m);
  }
  await log(actor, `${approve ? "Approved" : "Declined"} application of ${m.name}`);
  return { member: m };
}

export async function assignDepartment(memberId: string, departmentId: string, on: boolean, actor: string) {
  const m = await getMember(memberId);
  if (!m) return { error: "Member not found" as const };
  m.departmentIds = on ? [...new Set([...m.departmentIds, departmentId])] : m.departmentIds.filter((d) => d !== departmentId);
  await R().put("members", m);
  await log(actor, `${on ? "Added" : "Removed"} ${m.name} ${on ? "to" : "from"} a department`);
  return { member: m };
}

// ───── payments
async function nextReceipt() {
  return `RCT-${new Date().getFullYear()}-${String(await R().seq("receipt")).padStart(4, "0")}`;
}

async function applyPaymentEffects(p: Payment) {
  const m = p.memberId ? await getMember(p.memberId) : null;
  if (!m) return;
  if (p.purpose === "subscription" || p.purpose === "registration") {
    const wasPending = m.status === "pending";
    const current = m.paidThrough ? new Date(m.paidThrough) : null;
    m.paidThrough = (current && current > new Date() ? new Date(current.getFullYear() + 1, 5, 30) : renewalDate()).toISOString();
    if (m.status === "lapsed") m.status = "active";
    m.lastReminderAt = null;
    await R().put("members", m);
    if (!wasPending) await sendRenewalEmail(m);
  }
  if (p.purpose === "event" && p.eventId) {
    const r = (await listRegistrations(p.eventId)).find((x) => x.memberId === m.id);
    if (r) { r.paid = true; await R().put("registrations", r); }
  }
  await addNotification(m.id, "Payment received", `Thank you. Receipt ${p.receiptNo} for TZS ${p.amount.toLocaleString("en-US")} has been issued.`, "payment");
}

export async function recordPayment(input: { memberId: string; purpose: PayPurpose; amount: number; method: PayMethod; eventId?: string }, actor: string) {
  const m = await getMember(input.memberId);
  if (!m) return { error: "Member not found" as const };
  const p: Payment = {
    id: uid("p"), memberId: m.id, payerName: m.name, purpose: input.purpose, amount: input.amount, method: input.method,
    reference: `TX${Math.floor(Math.random() * 900000 + 100000)}`, receiptNo: await nextReceipt(), createdAt: nowIso(), eventId: input.eventId,
  };
  await R().put("payments", p);
  await applyPaymentEffects(p);
  await log(actor, `Payment ${p.receiptNo} of TZS ${p.amount.toLocaleString("en-US")} from ${m.name}`);
  return { payment: p };
}

export async function reconcilePayment(paymentId: string, memberId: string, actor: string) {
  const p = await R().get<Payment>("payments", paymentId);
  const m = await getMember(memberId);
  if (!p || p.memberId || !m) return { error: "Payment or member not found" as const };
  p.memberId = m.id;
  p.receiptNo = await nextReceipt();
  await R().put("payments", p);
  await applyPaymentEffects(p);
  await log(actor, `Reconciled ${p.reference} to ${m.name}; issued ${p.receiptNo}`);
  return { payment: p };
}

// ───── support & announcements
export async function openTicket(memberId: string, subject: string, message: string) {
  const t: Ticket = { id: uid("t"), memberId, subject, message, status: "open", createdAt: nowIso() };
  await R().put("tickets", t);
  return t;
}
export async function resolveTicket(id: string, actor: string) {
  const t = await R().get<Ticket>("tickets", id);
  if (t) {
    t.status = "resolved";
    await R().put("tickets", t);
    await log(actor, `Resolved ticket "${t.subject}"`);
    await addNotification(t.memberId, "Your help-desk ticket was resolved", t.subject, "general");
  }
  return t;
}
export async function postAnnouncement(a: { title: string; body: string; audience: "all" | "members" | "leadership"; image?: string; link?: { label: string; url: string } }, author: string) {
  let slug = slugOf(a.title) || uid("news");
  while ((await R().list<Announcement>("announcements", { slug })).length) slug += "-" + Math.random().toString(36).slice(2, 4);
  const n: Announcement = { ...a, id: uid("n"), slug, createdAt: nowIso(), author };
  await R().put("announcements", n);
  await log(author, `Posted announcement "${a.title}"`);
  return n;
}

export async function updateAnnouncement(id: string, patch: Partial<Pick<Announcement, "title" | "body" | "audience" | "image" | "link">>, actor: string) {
  const a = await R().get<Announcement>("announcements", id);
  if (!a) return { error: "News item not found" as const };
  Object.assign(a, Object.fromEntries(Object.entries(patch).filter(([k, v]) => v !== undefined || k === "link")));
  await R().put("announcements", a);
  await log(actor, `Edited news: ${a.title}`);
  return { announcement: a };
}
export async function deleteAnnouncement(id: string, actor: string) {
  const a = await R().get<Announcement>("announcements", id);
  if (!a) return { error: "News item not found" as const };
  await R().del("announcements", id);
  await log(actor, `Removed news: ${a.title}`);
  return { ok: true as const };
}

export const getArticle = async (slug: string) => (await R().list<Announcement>("announcements", { slug }))[0] ?? null;

// ───── gallery
export const listGallery = async () => (await R().list<GalleryAlbum>("gallery")).sort((a, b) => b.date.localeCompare(a.date));
export async function saveAlbum(input: { id?: string; title: string; date: string; place?: string; link?: string; photos?: string[] }, actor: string) {
  const existing = input.id ? await R().get<GalleryAlbum>("gallery", input.id) : null;
  if (existing) {
    Object.assign(existing, { title: input.title, date: input.date, place: input.place || undefined, link: input.link || undefined });
    if (input.photos?.length) existing.photos = [...existing.photos, ...input.photos].slice(0, 6);
    await R().put("gallery", existing);
    await log(actor, `Updated gallery album: ${existing.title}`);
    return { album: existing };
  }
  if (!input.photos?.length) return { error: "Add at least one picture" as const };
  const g: GalleryAlbum = { id: uid("gal"), title: input.title, date: input.date, place: input.place || undefined, link: input.link || undefined, photos: input.photos.slice(0, 6) };
  await R().put("gallery", g);
  await log(actor, `Added gallery album: ${g.title}`);
  return { album: g };
}
export async function removeAlbumPhoto(id: string, photo: string, actor: string) {
  const g = await R().get<GalleryAlbum>("gallery", id);
  if (!g) return { error: "Album not found" as const };
  if (g.photos.length <= 1) return { error: "An album needs at least one picture" as const };
  g.photos = g.photos.filter((p) => p !== photo);
  await R().put("gallery", g);
  await log(actor, `Removed a picture from album: ${g.title}`);
  return { ok: true as const };
}
export async function deleteAlbum(id: string, actor: string) {
  const g = await R().get<GalleryAlbum>("gallery", id);
  if (!g) return { error: "Album not found" as const };
  await R().del("gallery", id);
  await log(actor, `Removed gallery album: ${g.title}`);
  return { ok: true as const };
}

// ───── calendar
export const listCalendarItems = () => R().list<CalendarItem>("calendar");

export async function saveCalendarItem(input: Omit<CalendarItem, "id"> & { id?: string }, actor: string) {
  const existing = input.id ? await R().get<CalendarItem>("calendar", input.id) : null;
  if (existing) {
    Object.assign(existing, input);
    await R().put("calendar", existing);
    await log(actor, `Updated calendar item: ${existing.title}`);
    return existing;
  }
  const c: CalendarItem = { ...input, id: uid("cal") };
  await R().put("calendar", c);
  await log(actor, `Added calendar item: ${c.title}`);
  return c;
}
export async function deleteCalendarItem(id: string, actor: string) {
  const c = await R().get<CalendarItem>("calendar", id);
  if (!c) return { error: "Calendar item not found" as const };
  await R().del("calendar", id);
  await log(actor, `Removed calendar item: ${c.title}`);
  return { ok: true as const };
}

const EVENT_LABELS: Record<string, string> = { conference: "Conference", agm: "Conference & AGM", workshop: "Workshop", webinar: "Webinar", meeting: "Meeting", marathon: "Marathon", training: "Training" };
const KIND_LABELS: Record<string, string> = { deadline: "Deadline", meeting: "Meeting", training: "Training", holiday: "Observance", other: "Date" };

/** Everything that belongs on the calendar for a given audience: events, items, and the 30 June subscription date each year. */
export async function calendarEntries(opts: { members: boolean; admin?: boolean }): Promise<CalEntry[]> {
  const [events, items] = await Promise.all([listEvents({ includeDrafts: !!opts.admin }), listCalendarItems()]);
  const out: CalEntry[] = [];
  for (const e of events) {
    if (e.status === "cancelled" && !opts.admin) continue;
    out.push({ id: e.id, title: e.title, start: e.startsAt, end: e.endsAt, kind: "event", label: EVENT_LABELS[e.type] ?? "Event", href: e.externalUrl ?? `/events/${e.slug}`, external: !!e.externalUrl, place: e.venue, sample: e.sample, draft: e.status === "draft" });
  }
  for (const c of items) {
    if (c.membersOnly && !opts.members) continue;
    out.push({ id: c.id, title: c.title, start: c.date, end: c.endDate, kind: c.kind, label: KIND_LABELS[c.kind], href: c.href, external: !!c.href?.startsWith("http"), membersOnly: c.membersOnly });
  }
  const y = new Date().getFullYear();
  for (const year of [y - 1, y, y + 1, y + 2]) {
    out.push({ id: `sub-${year}`, title: "Annual subscriptions due", start: `${year}-06-30`, kind: "deadline", label: "Deadline", href: opts.members ? "/portal/payments" : "/membership#fees" });
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}

// ───── website enquiries (contact form)
export const listEnquiries = async () => (await R().list<Enquiry>("enquiries")).sort(byDateDesc((q) => q.createdAt));
export async function addEnquiry(e: Omit<Enquiry, "id" | "createdAt" | "status">) {
  const q: Enquiry = { ...e, id: uid("q"), createdAt: nowIso(), status: "new" };
  await R().put("enquiries", q);
  await log(e.name, `Sent a website enquiry: ${e.topic}`);
  return q;
}
export async function resolveEnquiry(id: string, actor: string) {
  const q = await R().get<Enquiry>("enquiries", id);
  if (!q) return null;
  q.status = "handled";
  await R().put("enquiries", q);
  await log(actor, `Handled enquiry from ${q.name}`);
  return q;
}

// ───── notifications (in-app)
export async function addNotification(memberId: string, title: string, body: string, kind: Notification["kind"]) {
  await R().put("notifications", { id: uid("nt"), memberId, title, body, kind, createdAt: nowIso(), read: false } satisfies Notification);
}
export const listNotifications = async (memberId: string) => (await R().list<Notification>("notifications", { memberId })).sort(byDateDesc((n) => n.createdAt));
export async function markNotificationsRead(memberId: string) {
  const unread = (await R().list<Notification>("notifications", { memberId, read: false })).map((n) => ({ ...n, read: true }));
  await R().putMany("notifications", unread);
}

// ───── newsletter subscribers
export async function addSubscriber(input: { email: string; phone?: string; name?: string; smsConsent: boolean; source?: string }) {
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhone(input.phone) ?? undefined;
  if (input.phone && !phone) return { error: "Enter a valid Tanzanian phone number, e.g. 0754 000 000" as const };
  const existing = (await R().list<Subscriber>("subscribers", { email }))[0];
  if (existing) {
    if (phone) { existing.phone = phone; existing.smsConsent = input.smsConsent; await R().put("subscribers", existing); }
    return { subscriber: existing, already: true as const };
  }
  const s: Subscriber = { id: uid("s"), email, phone, name: input.name?.trim() || undefined, smsConsent: !!phone && input.smsConsent, source: input.source ?? "website", createdAt: nowIso() };
  await R().put("subscribers", s);
  await log(s.name ?? s.email, "Subscribed to the newsletter");
  return { subscriber: s, already: false as const };
}
export async function removeSubscriber(id: string, actor: string) {
  const s = await R().get<Subscriber>("subscribers", id);
  if (!s) return { error: "Subscriber not found" as const };
  await R().del("subscribers", id);
  await log(actor, `Removed subscriber ${s.email}`);
  return { ok: true as const };
}

// ───── messaging audiences
export interface Recipient { key: string; name: string; phone: string | null; email: string | null; memberId?: string; vars: Record<string, string> }

const memberRecipient = (m: Member): Recipient => {
  const d = daysToRenewal(m);
  return {
    key: m.id, name: m.name, phone: normalizePhone(m.phone), email: m.email, memberId: m.id,
    vars: {
      name: m.name.replace(/^(Dr|Prof)\.\s*/, ""), memberNo: m.memberNo,
      fee: `TZS ${(m.category === "full" ? 60_000 : 25_000).toLocaleString("en-US")}`,
      due: m.paidThrough ? new Date(m.paidThrough).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-",
      days: d === null ? "-" : String(d),
    },
  };
};

export const AUDIENCE_LABEL: Record<string, string> = {
  everyone: "Everyone (members + subscribers)", all_members: "All members", good_standing: "Members in good standing", overdue: "Members overdue (lapsed)",
  expiring: "Members expiring within 30 days", pending: "Pending applicants", department: "A department", event_registrants: "Event registrants",
  event_unpaid: "Event registrants who have not paid", event_absent: "Event no-shows", subscribers: "Newsletter subscribers",
};

export async function resolveAudience(spec: AudienceSpec): Promise<Recipient[]> {
  const all = await listMembers();
  const members = all.filter((m) => m.status !== "suspended");
  const byId = new Map(all.map((m) => [m.id, m]));
  const subRec = (x: Subscriber): Recipient => ({ key: x.id, name: x.name ?? x.email, phone: x.smsConsent ? x.phone ?? null : null, email: x.email, vars: { name: x.name ?? "friend", memberNo: "", fee: "", due: "", days: "" } });
  const regRec = (r: Registration): Recipient => {
    const c = registrantContact(r, byId);
    return { key: r.id, name: c.name, phone: normalizePhone(c.phone), email: c.email ?? null, memberId: r.memberId ?? undefined, vars: { name: c.name.replace(/^(Dr|Prof)\.\s*/, ""), memberNo: c.memberNo ?? "", fee: "", due: "", days: "", ticket: r.ticketCode } };
  };
  const ev = spec.id ? await getEvent(spec.id) : null;
  switch (spec.type) {
    case "all_members": return members.map(memberRecipient);
    case "good_standing": return members.filter(isInGoodStanding).map(memberRecipient);
    case "overdue": return members.filter((m) => m.status === "lapsed" || (m.status === "active" && m.category !== "honorary" && !isInGoodStanding(m))).map(memberRecipient);
    case "expiring": return members.filter((m) => { const d = daysToRenewal(m); return m.status === "active" && m.category !== "honorary" && d !== null && d >= 0 && d <= 30; }).map(memberRecipient);
    case "pending": return all.filter((m) => m.status === "pending").map(memberRecipient);
    case "department": return members.filter((m) => spec.id && m.departmentIds.includes(spec.id)).map(memberRecipient);
    case "subscribers": return (await listSubscribers()).map(subRec);
    case "event_registrants": return ev ? (await listRegistrations(ev.id)).map(regRec) : [];
    case "event_unpaid": return ev ? (await listRegistrations(ev.id)).filter((r) => !r.paid).map(regRec) : [];
    case "event_absent": {
      if (!ev) return [];
      const present = new Set((await listAttendance(ev.id)).map((a) => a.memberId ?? a.guestName));
      return (await listRegistrations(ev.id)).filter((r) => !present.has(r.memberId ?? r.guestName)).map(regRec);
    }
    case "everyone": {
      const seen = new Set<string>();
      const subs = await listSubscribers();
      return [...members.map(memberRecipient), ...subs.map(subRec)].filter((r) => { const k = r.email?.toLowerCase() ?? r.phone ?? r.key; if (seen.has(k)) return false; seen.add(k); return true; });
    }
  }
}

export async function recordMessage(m: Omit<MessageLog, "id" | "at">) {
  await R().put("messages", { ...m, id: uid("msg"), at: nowIso() } satisfies MessageLog);
}
export async function stampReminded(memberId: string) {
  const m = await getMember(memberId);
  if (m) { m.lastReminderAt = nowIso(); await R().put("members", m); }
}
export const auditLog = log;

// ───── website content (edited from the admin console)
type Positioned<T> = T & { position?: number };
const inOrder = <T,>(l: Positioned<T>[]) => [...l].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

export const listTeam = async () => inOrder(await R().list<Positioned<TeamMember>>("team")) as TeamMember[];
export const listPartners = async () => inOrder(await R().list<Positioned<SitePartner>>("partners")) as SitePartner[];

export async function getSettings(): Promise<SiteSettings> {
  const row = await R().get<Partial<SiteSettings>>("settings", "site");
  return { ...structuredClone(SETTINGS_SEED), ...row, pageHeroes: { ...SETTINGS_SEED.pageHeroes, ...(row?.pageHeroes ?? {}) }, pageHeroFocus: { ...SETTINGS_SEED.pageHeroFocus, ...(row?.pageHeroFocus ?? {}) } };
}

const slugify = (s: string) => s.toLowerCase().replace(/^(dr|prof|amb)\.\s*/, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function saveTeamMember(input: Omit<TeamMember, "slug" | "photo"> & { slug?: string; photo?: string }, actor: string) {
  const list = await R().list<Positioned<TeamMember>>("team");
  const existing = input.slug ? list.find((m) => m.slug === input.slug) : null;
  if (existing) {
    Object.assign(existing, { name: input.name, role: input.role, group: input.group, note: input.note || undefined, linkedin: input.linkedin || undefined, ...(input.photo ? { photo: input.photo } : {}) });
    await R().put("team", existing);
    await log(actor, `Updated team profile: ${existing.name}`);
    return { member: existing as TeamMember };
  }
  if (!input.photo) return { error: "Add a photo for the new team member" as const };
  let slug = slugify(input.name) || uid("m");
  while (list.some((m) => m.slug === slug)) slug += "-" + Math.random().toString(36).slice(2, 4);
  const m: Positioned<TeamMember> = { slug, name: input.name, role: input.role, group: input.group, photo: input.photo, note: input.note || undefined, linkedin: input.linkedin || undefined, position: Math.max(-1, ...list.map((x) => x.position ?? 0)) + 1 };
  await R().put("team", m);
  await log(actor, `Added team member: ${m.name}`);
  return { member: m as TeamMember };
}
export async function deleteTeamMember(slug: string, actor: string) {
  const m = await R().get<TeamMember>("team", slug);
  if (!m) return { error: "Team member not found" as const };
  await R().del("team", slug);
  await log(actor, `Removed team member: ${m.name}`);
  return { ok: true as const };
}
export async function moveTeamMember(slug: string, dir: -1 | 1, actor: string) {
  const list = inOrder(await R().list<Positioned<TeamMember>>("team"));
  const i = list.findIndex((x) => x.slug === slug);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return { error: "Cannot move further" as const };
  [list[i], list[j]] = [list[j], list[i]];
  await R().putMany("team", list.map((m, idx) => ({ ...m, position: idx })));
  await log(actor, `Reordered team: ${list[j].name}`);
  return { ok: true as const };
}

export async function savePartner(input: { id?: string; name: string; logo?: string; url?: string }, actor: string) {
  const list = await R().list<Positioned<SitePartner>>("partners");
  const existing = input.id ? list.find((p) => p.id === input.id) : null;
  if (existing) {
    Object.assign(existing, { name: input.name, url: input.url || undefined, ...(input.logo ? { logo: input.logo } : {}) });
    await R().put("partners", existing);
    await log(actor, `Updated partner: ${existing.name}`);
    return { partner: existing as SitePartner };
  }
  if (!input.logo) return { error: "Add a logo for the new partner" as const };
  const p: Positioned<SitePartner> = { id: uid("pt"), name: input.name, logo: input.logo, url: input.url || undefined, position: Math.max(-1, ...list.map((x) => x.position ?? 0)) + 1 };
  await R().put("partners", p);
  await log(actor, `Added partner: ${p.name}`);
  return { partner: p as SitePartner };
}
export async function deletePartner(id: string, actor: string) {
  const p = await R().get<SitePartner>("partners", id);
  if (!p) return { error: "Partner not found" as const };
  await R().del("partners", id);
  await log(actor, `Removed partner: ${p.name}`);
  return { ok: true as const };
}

export async function updateSettings(patch: Partial<SiteSettings>, actor: string) {
  const next: SiteSettings = { ...(await getSettings()), ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) };
  await R().put("settings", { id: "site", ...next });
  await log(actor, "Updated website settings");
  return next;
}

export async function saveResource(input: Omit<Resource, "id"> & { id?: string }, actor: string) {
  const existing = input.id ? await R().get<Resource>("resources", input.id) : null;
  if (existing) {
    Object.assign(existing, input);
    await R().put("resources", existing);
    await log(actor, `Updated resource: ${existing.title}`);
    return { resource: existing };
  }
  const r: Resource = { ...input, id: uid("res") };
  await R().put("resources", r);
  await log(actor, `Added resource: ${r.title}`);
  return { resource: r };
}
export async function deleteResource(id: string, actor: string) {
  const r = await R().get<Resource>("resources", id);
  if (!r) return { error: "Resource not found" as const };
  await R().del("resources", id);
  await log(actor, `Removed resource: ${r.title}`);
  return { ok: true as const };
}

// ───── analytics
export async function stats() {
  const [ms, payments, attendance, tickets, subscribers, messages, events, overdue, expiring] = await Promise.all([
    listMembers(), R().list<Payment>("payments"), R().list<Attendance>("attendance"), R().list<Ticket>("tickets"),
    R().list<Subscriber>("subscribers"), R().list<MessageLog>("messages"), listEvents({ includeDrafts: true }),
    resolveAudience({ type: "overdue" }), resolveAudience({ type: "expiring" }),
  ]);
  const paid = payments.filter((p) => p.memberId);
  const unmatched = payments.filter((p) => !p.memberId);
  const tally = (key: (m: Member) => string) =>
    Object.entries(ms.reduce<Record<string, number>>((a, m) => ((a[key(m)] = (a[key(m)] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
  const byMonth = paid.reduce<Record<string, number>>((a, p) => { const k = p.createdAt.slice(0, 7); a[k] = (a[k] ?? 0) + p.amount; return a; }, {});
  return {
    total: ms.length,
    good: ms.filter(isInGoodStanding).length,
    pending: ms.filter((m) => m.status === "pending").length,
    lapsed: ms.filter((m) => m.status === "lapsed").length,
    overdue: overdue.length,
    expiring: expiring.length,
    revenue: paid.reduce((s, p) => s + p.amount, 0),
    revenueByMonth: Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-8),
    unmatchedCount: unmatched.length,
    unmatchedValue: unmatched.reduce((s, p) => s + p.amount, 0),
    byCadre: tally((m) => m.cadre),
    byRegion: tally((m) => m.region),
    upcoming: events.filter((e) => new Date(e.endsAt) >= new Date() && e.status !== "cancelled").length,
    attendanceTotal: attendance.filter((a) => a.counted).length,
    openTickets: tickets.filter((t) => t.status === "open").length,
    subscribers: subscribers.length,
    smsSent: messages.reduce((s, m) => s + (m.channels.includes("sms") ? m.sent : 0), 0),
  };
}

export const ADMIN_ROLES: Role[] = ["secretariat", "treasurer", "leadership"];
