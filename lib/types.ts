export type Category = "full" | "associate" | "honorary";
export type MemberStatus = "pending" | "active" | "lapsed" | "suspended";
/** "secretariat" = full administrator. Committees: management (membership, finance and communications),
 *  education (educational content and the resource library), social (events, webinars, news and gallery). */
export type Role = "member" | "secretariat" | "management" | "treasurer" | "education" | "social" | "leadership";
export const ROLE_LABEL: Record<Role, string> = {
  member: "Member", secretariat: "Secretariat (full admin)", management: "Management & finance", treasurer: "Treasurer",
  education: "Education committee", social: "Social committee", leadership: "Leadership (view only)",
};

export interface Member {
  id: string;
  memberNo: string;
  name: string;
  email: string;
  phone: string;
  category: Category;
  cadre: string;
  facility: string;
  region: string;
  status: MemberStatus;
  paidThrough: string | null; // ISO date
  cpdPoints: number;
  joinedAt: string;
  role: Role;
  departmentIds: string[];
  lastReminderAt?: string | null;
  /** Extra answers from the membership application form (gender, nationality, payment proof, ...). */
  application?: Record<string, unknown> | null;
}

export type EventType = "conference" | "agm" | "workshop" | "webinar" | "meeting" | "marathon" | "training";
export type EventMode = "physical" | "online" | "hybrid";

export interface SataEvent {
  id: string;
  slug: string;
  title: string;
  type: EventType;
  mode: EventMode;
  startsAt: string;
  endsAt: string;
  datesTbc?: boolean;
  venue: string;
  link?: string; // webinar / join link
  summary: string;
  theme?: string;
  capacity: number | null;
  cpdPoints: number;
  fees: Partial<Record<Category | "guest", number>>;
  minutesRequired?: number; // webinar: minutes online to count as attended
  departmentId?: string;
  sample?: boolean; // illustrative placeholder, not confirmed SATA data
  externalUrl?: string; // registration handled on another official site
  image?: string; // poster
  status?: "draft" | "published" | "cancelled";
  /** Promote as a pop-up when visitors open the website (until popupUntil, or until the event starts). */
  popup?: boolean;
  popupUntil?: string | null;
}

export interface Registration {
  id: string;
  eventId: string;
  memberId: string | null;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  ticketCode: string;
  paid: boolean;
  createdAt: string;
}

export interface Attendance {
  id: string;
  eventId: string;
  memberId: string | null;
  guestName?: string;
  checkedInAt: string;
  method: "qr" | "manual" | "online";
  minutes?: number;
  counted: boolean;
}

export type PayPurpose = "registration" | "subscription" | "event" | "donation";
export type PayMethod = "mpesa" | "airtel" | "mixx" | "gepg" | "bank";

export interface Payment {
  id: string;
  memberId: string | null; // null = unmatched, awaiting reconciliation
  payerName: string;
  purpose: PayPurpose;
  amount: number;
  method: PayMethod;
  reference: string;
  receiptNo: string | null;
  createdAt: string;
  suggestedMemberId?: string;
  eventId?: string;
}

export interface Department {
  id: string;
  name: string;
  mandate: string;
  headMemberId: string | null;
  proposed?: boolean;
}

export interface Officer {
  id: string;
  title: string;
  name: string;
  memberId: string | null;
  rank: number;
}

export interface Announcement {
  id: string;
  slug?: string;
  title: string;
  body: string;
  audience: "all" | "members" | "leadership";
  createdAt: string;
  author: string;
  image?: string;
  link?: { label: string; url: string };
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  createdAt: string;
  status: "new" | "handled";
}

export const RESOURCE_KINDS = ["guideline", "form", "research", "case", "article"] as const;
export const RESOURCE_LABEL: Record<(typeof RESOURCE_KINDS)[number], string> = { guideline: "Guidelines", form: "Forms", research: "Research", case: "Case studies", article: "Articles" };
/** Older kinds from before the library was reorganised. */
export const normalizeKind = (k: string): (typeof RESOURCE_KINDS)[number] =>
  (RESOURCE_KINDS as readonly string[]).includes(k) ? (k as (typeof RESOURCE_KINDS)[number]) : k === "policy" ? "guideline" : "article";
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export interface Resource {
  id: string;
  title: string;
  kind: ResourceKind;
  description: string;
  membersOnly: boolean;
  url: string;
  year?: number;
  author?: string;
  closesAt?: string; // "YYYY-MM-DD": after this date the item is shown as Closed
  /** Member submissions wait for the Education committee. Missing = published (items added by admins). */
  status?: "pending" | "published" | "rejected";
  submittedBy?: string | null; // member id
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewNote?: string | null;
}

export const isClosed = (r: { closesAt?: string }, today = new Date().toISOString().slice(0, 10)) => !!r.closesAt && r.closesAt < today;

/** A photo album for an event: two or three featured pictures plus a link to the full album. */
export interface GalleryAlbum {
  id: string;
  title: string;
  date: string; // ISO date
  place?: string;
  link?: string; // full album (Google Photos, Drive…)
  photos: string[];
}

export interface Ticket {
  id: string;
  memberId: string;
  subject: string;
  message: string;
  status: "open" | "resolved";
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
}

export interface Subscriber {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  smsConsent: boolean;
  source: string;
  createdAt: string;
}

export type AudienceType =
  | "everyone" | "all_members" | "good_standing" | "overdue" | "expiring" | "pending"
  | "department" | "event_registrants" | "event_unpaid" | "event_absent" | "subscribers";

export interface AudienceSpec { type: AudienceType; id?: string }

export interface MessageLog {
  id: string;
  at: string;
  sender: string;
  kind: "bulk" | "auto-reminder" | "event" | "newsletter";
  audience: string;
  channels: ("sms" | "email")[];
  subject?: string;
  body: string;
  recipients: number;
  sent: number;
  failed: number;
  smsSegments: number;
  provider: string;
}

export interface Notification {
  id: string;
  memberId: string;
  title: string;
  body: string;
  kind: "payment" | "event" | "general";
  createdAt: string;
  read: boolean;
}

export interface SitePartner { id: string; name: string; logo: string; url?: string }
export interface HeroSlide { image: string; caption: string; text?: string; cta?: string; href?: string }
export interface SiteSettings { tagline: string; address: string; phone: string; email: string; heroSlides: HeroSlide[]; pageHeroes: Record<string, string>; pageHeroFocus?: Record<string, number> }

export const CAL_KINDS = ["deadline", "meeting", "training", "holiday", "other"] as const;
export type CalKind = (typeof CAL_KINDS)[number];

/** A dated entry on the SATA calendar that is not an event: deadlines, committee meetings, observances. */
export interface CalendarItem {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD" (all day) or an ISO instant
  endDate?: string;
  kind: CalKind;
  notes?: string;
  href?: string;
  membersOnly: boolean;
}

/** What the calendar views render: events and items normalised into one shape. */
export interface CalEntry {
  id: string;
  title: string;
  start: string;
  end?: string;
  kind: "event" | CalKind;
  label: string;
  href?: string;
  place?: string;
  external?: boolean;
  sample?: boolean;
  draft?: boolean;
  membersOnly?: boolean;
}

export const BANNER_PAGES = ["about", "leadership", "membership", "events", "calendar", "news", "resources", "gallery", "contact"] as const;

/** An anaesthesia news item collected automatically from outside sources (lib/news-feed.ts). */
export interface FeedItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image?: string | null;
  source: string;
  region: "tanzania" | "africa" | "world";
  category: "conference" | "research" | "case" | "safety" | "news";
  score: number;
  publishedAt: string;
  fetchedAt: string;
}

export type NewsletterKind = "announcement" | "event" | "conference" | "research" | "case" | "safety" | "news" | "custom";

/** One story in the weekly newsletter. */
export interface NewsletterItem {
  title: string;
  summary: string;
  url: string;
  image?: string;
  source: string;
  kind: NewsletterKind;
  pinned?: boolean;
}

/** A weekly "10 key things" newsletter issue, drafted automatically and sent by the secretariat. */
export interface Newsletter {
  id: string;
  weekOf: string; // ISO date of the Monday
  subject: string;
  intro: string;
  items: NewsletterItem[];
  status: "draft" | "sent";
  createdAt: string;
  sentAt?: string;
  sentCount: number;
  createdBy: string;
}
