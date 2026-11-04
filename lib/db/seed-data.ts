import { buildSeed } from "../seed";
import { TEAM } from "../team";
import { NEWS_ARTICLES, RESOURCES_SEED } from "../news-seed";
import type { CalendarItem, GalleryAlbum, SitePartner, SiteSettings, Subscriber } from "../types";
import type { Table } from "./types";

export const GALLERY_SEED: GalleryAlbum[] = [
  { id: "gal-10th", title: "10th Scientific Conference & AGM", date: "2026-05-20", place: "City Garden Park Hall, Mbeya", link: "https://photos.app.goo.gl/jVnPy6an2cgKBMRs5", photos: ["/images/gallery/mbeya-welcome.jpg", "/images/gallery/mbeya-panel.jpg", "/images/gallery/mbeya-speaker.jpg"] },
  { id: "gal-8th", title: "8th SATA Annual Scientific Conference", date: "2024-05-01", place: "Dar es Salaam", link: "https://photos.app.goo.gl/zGUJrtYq3Qgjxu5K7", photos: ["/images/gallery/8th-delegates.jpg", "/images/gallery/8th-stage.jpg", "/images/gallery/8th-colleagues.jpg"] },
  { id: "gal-9th", title: "9th SATA Scientific Conference", date: "2025-05-07", place: "Gold Crest Hotel, Mwanza", photos: ["/images/news/conference-2025.jpg"] },
  { id: "gal-master", title: "Master Class Course in Anaesthesia", date: "2025-07-22", place: "MUHAS, MOI and MNH", link: "https://drive.google.com/drive/mobile/folders/1Fl-YX0WOZPw33UlLZWyzyDFv8GBIdOQ9", photos: ["/images/news/masterclass-2025.jpg"] },
];

// Vertical focal point (0 = top, 100 = bottom) per banner, so faces stay in frame at the wide banner shape.
const PAGE_FOCUS_SEED: Record<string, number> = { about: 55, leadership: 72, membership: 60, events: 20, calendar: 75, news: 35, resources: 40, gallery: 38, contact: 38 };

// Banner photographs for the inner pages. Editable from the admin console.
const PAGE_HEROES_SEED: Record<string, string> = {
  about: "/images/gallery/8th-delegates.jpg",
  leadership: "/images/gallery/mbeya-panel.jpg",
  membership: "/images/gallery/8th-group.jpg",
  events: "/images/gallery/mbeya-welcome.jpg",
  calendar: "/images/gallery/mbeya-hall.jpg",
  news: "/images/gallery/8th-stage.jpg",
  resources: "/images/gallery/mbeya-speaker.jpg",
  gallery: "/images/gallery/8th-colleagues.jpg",
  contact: "/images/gallery/8th-colleagues.jpg",
};

// Real milestones from the AAAC 2027 timeline (aaac2027.com) and SATA's own rules.
export const CALENDAR_SEED: CalendarItem[] = [
  { id: "cal-aaac-abstracts", title: "AAAC 2027: abstract submission opens", date: "2026-10-01", endDate: "2026-12-31", kind: "deadline", notes: "Abstract submission opens in Q4 2026. Original research, case reports and case series, 300 words.", href: "https://aaac2027.com/abstracts", membersOnly: false },
  { id: "cal-aaac-early", title: "AAAC 2027: early-bird registration ends", date: "2027-01-31", kind: "deadline", notes: "Early-bird pricing runs through 31 January 2027.", href: "https://aaac2027.com/registration", membersOnly: false },
  { id: "cal-aaac-oaf", title: "AAAC 2027: lowest-price Out-of-Africa tickets end", date: "2027-03-31", kind: "deadline", notes: "Limited tickets at the lowest price; sale ends 31 March 2027.", href: "https://aaac2027.com/registration", membersOnly: false },
  { id: "cal-aaac-review", title: "AAAC 2027: abstract review closes", date: "2027-04-30", kind: "deadline", notes: "Abstract review closes in April 2027.", href: "https://aaac2027.com", membersOnly: false },
  { id: "cal-aaac-programme", title: "AAAC 2027: scientific programme released", date: "2027-07-01", kind: "other", notes: "The programme is published in July 2027.", href: "https://aaac2027.com/programme", membersOnly: false },
  { id: "cal-aaac-workshops", title: "AAAC 2027: pre-congress workshops", date: "2027-09-12", kind: "training", notes: "Pre-congress workshops at JNICC, Dar es Salaam.", href: "https://aaac2027.com", membersOnly: false },
];

export const PARTNERS_SEED: SitePartner[] = [
  { id: "pt1", name: "Trokaa", logo: "/images/partners/p1.png" },
  { id: "pt2", name: "Smile Train", logo: "/images/partners/p2.png" },
  { id: "pt3", name: "Kas Medics Ltd", logo: "/images/partners/p3.png" },
  { id: "pt4", name: "Anudha", logo: "/images/partners/p4.png" },
  { id: "pt5", name: "Ethypharm", logo: "/images/partners/p5.png" },
  { id: "pt6", name: "Goodman", logo: "/images/partners/p6.png" },
];

export const SETTINGS_SEED: SiteSettings = {
  tagline: "Advancing Safe and Quality Anaesthesia and Critical Care Across Tanzania.",
  address: "MUHAS/MOI, P.O. Box 65387, Dar es Salaam, Tanzania",
  phone: "+255 754 092 507",
  email: "info@sata.co.tz",
  pageHeroes: PAGE_HEROES_SEED,
  pageHeroFocus: PAGE_FOCUS_SEED,
  heroSlides: [
    { image: "/images/events/mbeya-2026.jpg", caption: "One community for anaesthesia in Tanzania.", text: "Anaesthesiologists, officers and nurse anaesthetists, united by education, advocacy and collaboration.", cta: "Join SATA", href: "/membership/apply" },
    { image: "/images/news/masterclass-2025.jpg", caption: "Learn by doing.", text: "Master classes, hands-on workshops and CPD that raise the standard of care in every region.", cta: "See events", href: "/events" },
    { image: "/images/news/conference-2025.jpg", caption: "From Mwanza to Mbeya, we convene.", text: "Annual scientific conferences and an AGM that bring the country's anaesthesia community together.", cta: "Read the news", href: "/news" },
    { image: "/images/aaac/hero-carousel-1800ss_getty_rf_surgery_anesthesia.webp", caption: "Patient safety is the standard.", text: "Vigilance, evidence and shared guidelines in every theatre and ICU across Tanzania.", cta: "About SATA", href: "/about" },
  ],
};

type Rows = Record<Table, object[]>;

/**
 * "demo": the full demonstration dataset (sample members, payments, registrations) for local development.
 * "production": only real organisation content. No fake people, payments or registrations.
 */
export function buildSeedTables(mode: "demo" | "production"): Rows {
  const demo = mode === "demo";
  const s = buildSeed();
  const day = 86_400_000;
  const sub = (email: string, phone: string | undefined, name: string, daysAgo: number): Subscriber => ({
    id: `s-${email}`, email, phone, name, smsConsent: !!phone, source: "website", createdAt: new Date(Date.now() - daysAgo * day).toISOString(),
  });
  const keepEvent = (e: { sample?: boolean }) => demo || !e.sample;
  return {
    members: demo ? s.members : [],
    departments: s.departments.map((d) => (demo ? d : { ...d, headMemberId: null })),
    officers: s.officers.map((o) => (demo ? o : { ...o, memberId: null })),
    events: s.events.filter(keepEvent),
    registrations: demo ? s.registrations : [],
    attendance: demo ? s.attendance : [],
    payments: demo ? s.payments : [],
    announcements: NEWS_ARTICLES.map((a) => ({ ...a })),
    enquiries: [],
    resources: RESOURCES_SEED.map((r) => ({ ...r })),
    gallery: GALLERY_SEED.map((g) => ({ ...g, photos: [...g.photos] })),
    tickets: [],
    subscribers: demo ? [sub("amani.student@example.tz", "+255712000111", "Amani (student)", 12), sub("research.partner@example.org", undefined, "Research partner", 30), sub("nurse.anaes@example.tz", "+255754000222", "Nurse anaesthetist", 3)] : [],
    notifications: [],
    messages: [],
    audit: [],
    team: TEAM.map((m, i) => ({ ...m, position: i })),
    partners: PARTNERS_SEED.map((p, i) => ({ ...p, position: i })),
    calendar: CALENDAR_SEED.map((c) => ({ ...c })),
    settings: [{ id: "site", ...structuredClone(SETTINGS_SEED) }],
    login_codes: [],
  };
}
