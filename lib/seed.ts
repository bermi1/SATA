import type {
  Announcement, Attendance, Category, Department, Member, MemberStatus, Officer, Payment, Registration, Resource, SataEvent, Ticket,
} from "./types";
import { CADRES, REGIONS } from "./config";

// Deterministic PRNG so every restart yields the same demo data.
let s = 20260511;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];

const FIRST = ["Neema", "Juma", "Amina", "Baraka", "Zawadi", "Hamisi", "Furaha", "Salim", "Rehema", "Emmanuel", "Mwajuma", "Peter", "Grace", "Said", "Upendo", "Daniel", "Halima", "Joseph", "Esther", "Rashid", "Lucy", "Godfrey", "Fatuma", "Edson", "Veronica", "Ally", "Beatrice", "Isaya", "Mariam", "Elias"];
const LAST = ["Mushi", "Mwakyusa", "Kimaro", "Massawe", "Mrema", "Lyimo", "Mtui", "Sanga", "Mbwambo", "Nyerere", "Komba", "Msuya", "Kileo", "Shayo", "Tarimo", "Mollel", "Swai", "Kaaya", "Mkude", "Nnko", "Chacha", "Maganga", "Lema", "Haule", "Mdoe"];
const FACILITY = ["Muhimbili National Hospital", "MOI", "Benjamin Mkapa Hospital", "KCMC", "Bugando Medical Centre", "Mbeya Zonal Referral Hospital", "Mnazi Mmoja Hospital", "Muhimbili Mloganzila", "Mount Meru Regional Hospital", "Amana Regional Hospital", "Temeke Regional Hospital", "Ocean Road Cancer Institute"];

const iso = (d: string) => new Date(d).toISOString();

export const OFFICERS_SEED: { title: string; name: string }[] = [
  { title: "President", name: "Dr. Rebecca Samwel Shija" },
  { title: "President Elect", name: "Dr. Angela Paul Muhozya" },
  { title: "Secretary General", name: "Dr. John Kweyamba" },
  { title: "Vice Secretary General", name: "Dr. Amos Zacharia" },
  { title: "Treasurer", name: "Dr. Anna Assenga" },
  { title: "Deputy Treasurer", name: "Dr. Letisia Komba" },
];

const officerRole = (title: string) =>
  title === "Treasurer" || title === "Deputy Treasurer" ? "treasurer" : title.includes("Secretary") ? "secretariat" : "leadership";

export function buildSeed() {
  const members: Member[] = [];
  const mk = (i: number, name: string, over: Partial<Member> = {}): Member => {
    const cat: Category = over.category ?? (rnd() < 0.55 ? "full" : "associate");
    const roll = rnd();
    const status: MemberStatus = over.status ?? (roll < 0.74 ? "active" : roll < 0.9 ? "lapsed" : "pending");
    const slug = name.toLowerCase().replace(/^(dr|prof)\.\s*/, "").replace(/[^a-z]+/g, ".");
    return {
      id: `m${String(i).padStart(3, "0")}`,
      memberNo: `SATA-${String(i).padStart(4, "0")}`,
      name,
      email: `${slug}@example.tz`,
      phone: `+2557${Math.floor(10000000 + rnd() * 89999999)}`,
      category: cat,
      cadre: cat === "full" ? "Anaesthesiologist" : pick(CADRES.slice(1)),
      facility: pick(FACILITY),
      region: pick(REGIONS.slice(0, 14)),
      status,
      paidThrough: status === "active" ? iso("2027-06-30") : status === "lapsed" ? iso("2025-06-30") : null,
      cpdPoints: status === "pending" ? 0 : Math.floor(rnd() * 24),
      joinedAt: iso(`20${18 + Math.floor(rnd() * 8)}-0${1 + Math.floor(rnd() * 9)}-1${Math.floor(rnd() * 9)}`),
      role: "member",
      departmentIds: [],
      ...over,
    };
  };

  OFFICERS_SEED.forEach((o, i) =>
    members.push(
      mk(i + 1, o.name, { category: "full", status: "active", cadre: "Anaesthesiologist", role: officerRole(o.title), region: "Dar es Salaam", cpdPoints: 20 + i }),
    ),
  );
  for (let i = 7; i <= 60; i++) members.push(mk(i, `${rnd() < 0.5 ? "Dr. " : ""}${pick(FIRST)} ${pick(LAST)}`));
  members.push(mk(61, "Prof. Honorary Patron", { category: "honorary", status: "active", cadre: "Anaesthesiologist", paidThrough: null }));

  const officers: Officer[] = OFFICERS_SEED.map((o, i) => ({
    id: `o${i + 1}`, title: o.title, name: o.name, memberId: `m${String(i + 1).padStart(3, "0")}`, rank: i + 1,
  }));

  // Proposed departments: structure to be confirmed by the Executive Committee.
  const departments: Department[] = [
    { id: "d1", name: "Scientific & Education", mandate: "Annual scientific conference programme, workshops, CPD accreditation and the master-class series.", headMemberId: "m002", proposed: true },
    { id: "d2", name: "Membership & Welfare", mandate: "Applications, verification, renewals and member welfare.", headMemberId: "m003", proposed: true },
    { id: "d3", name: "Finance & Fundraising", mandate: "Subscriptions, sponsorship, reconciliation and the annual budget.", headMemberId: "m005", proposed: true },
    { id: "d4", name: "Events & Logistics", mandate: "Conferences, AGM, marathon, member meetings and webinars.", headMemberId: "m004", proposed: true },
    { id: "d5", name: "Research & Innovation", mandate: "Abstract review, audits and research collaboration.", headMemberId: null, proposed: true },
    { id: "d6", name: "Patient Safety & Quality", mandate: "Safety standards, guidelines and partnerships with the Ministry of Health, WFSA and WHO.", headMemberId: "m001", proposed: true },
    { id: "d7", name: "Communications & Advocacy", mandate: "Website, newsletters, media and policy advocacy.", headMemberId: "m006", proposed: true },
  ];
  members.forEach((m, idx) => {
    if (m.status === "pending" || m.category === "honorary") return;
    m.departmentIds = idx < 6 ? [departments[idx].id] : rnd() < 0.35 ? [pick(departments).id] : [];
  });

  const fee10 = { full: 150_000, associate: 150_000, guest: 250_000 } as const;
  const events: SataEvent[] = [
    { id: "e1", slug: "9th-sata-scientific-conference", title: "9th SATA Scientific Conference", type: "conference", mode: "physical", startsAt: iso("2025-05-07T08:00"), endsAt: iso("2025-05-09T17:00"), venue: "Gold Crest Hotel, Mwanza", summary: "Panels on educational programmes in paediatric anaesthesia, comprehensive cleft care and regional anaesthesia in paediatrics.", theme: "Safe, Accessible, and Sustainable Anesthesia for Children", capacity: null, cpdPoints: 12, fees: {}, image: "/images/events/mwanza-2025.jpg" },
    { id: "e2", slug: "master-class-course-in-anaesthesia", title: "Master Class Course in Anaesthesia", type: "workshop", mode: "physical", startsAt: iso("2025-07-22T08:00"), endsAt: iso("2025-07-23T17:00"), venue: "MUHAS MOI and MNH, Dar es Salaam", summary: "Twelve experts from India led problem-based learning in regional anaesthesia, POCUS, high-risk obstetrics, paediatric and cardiac anaesthesia, with SATA, AAFRIN Medihealth Solutions and APSF.", capacity: null, cpdPoints: 10, fees: {} },
    { id: "e3", slug: "10th-sata-scientific-conference-agm", title: "10th SATA Scientific Conference & AGM", type: "agm", mode: "physical", startsAt: iso("2026-05-20T08:00"), endsAt: iso("2026-05-22T17:00"), venue: "City Garden Park Hall, Mbeya", summary: "Plenaries, oral and poster abstracts, hands-on workshops (ICU ultrasound, mechanical ventilation, neuromonitoring, ACLS, ICU research) and the Annual General Meeting.", theme: "Beyond the Operating Room: The Role of the Anaesthesiologist in Critical Care", capacity: 200, cpdPoints: 15, fees: fee10, image: "/images/events/mbeya-2026.jpg" },
    { id: "e4", slug: "aaac-tanzania-2027", title: "AAAC 2027: 10th All Africa Anaesthesia Congress", type: "conference", mode: "physical", startsAt: iso("2027-09-13T06:00"), endsAt: iso("2027-09-16T18:00"), venue: "Julius Nyerere International Convention Centre (JNICC), Dar es Salaam", summary: "Africa's flagship congress for anaesthesia and critical care, hosted by SATA with the WFSA African Regional Section. Pre-congress workshops on 12 September. Up to 27.5 CPD hours.", theme: "The Future of Anaesthesia and Critical Care in Africa", capacity: null, cpdPoints: 27, fees: {}, externalUrl: "https://aaac2027.com/registration", image: "/images/aaac/hero-carousel-ChatGPT_Image_Jul_30__2026__07_20_59_PM.png" },
    { id: "e5", slug: "executive-committee-meeting-november", title: "Executive Committee Meeting", type: "meeting", mode: "online", startsAt: iso("2026-11-12T17:00"), endsAt: iso("2026-11-12T18:30"), venue: "Online", link: "https://meet.example/sata-exco", summary: "Monthly meeting of the Executive Committee and department heads.", capacity: 30, cpdPoints: 0, fees: {}, minutesRequired: 45, sample: true },
    { id: "e6", slug: "critical-care-webinar-series-nov", title: "Critical Care Webinar: Sepsis Bundles", type: "webinar", mode: "online", startsAt: iso("2026-11-19T18:00"), endsAt: iso("2026-11-19T19:30"), venue: "Online", link: "https://meet.example/sata-webinar", summary: "A one-hour clinical webinar with live Q&A. Attendance is tracked by minutes online; CPD is credited automatically.", capacity: 500, cpdPoints: 2, fees: { full: 0, associate: 0, guest: 10_000 }, minutesRequired: 45, sample: true },
    { id: "e7", slug: "sata-marathon", title: "SATA Marathon & Fun Run", type: "marathon", mode: "physical", startsAt: iso("2026-12-06T06:00"), endsAt: iso("2026-12-06T11:00"), venue: "Dar es Salaam — start point to be confirmed", summary: "Run for safe anaesthesia. Distances 5K, 10K and 21K; bibs are issued as QR tickets and collected at the start line.", capacity: 800, cpdPoints: 0, fees: { full: 20_000, associate: 20_000, guest: 30_000 }, sample: true },
  ];

  const registrations: Registration[] = [];
  const attendance: Attendance[] = [];
  const active = members.filter((m) => m.status === "active");
  active.slice(0, 34).forEach((m, i) => {
    registrations.push({ id: `r-e3-${m.id}`, eventId: "e3", memberId: m.id, ticketCode: `T10-${m.memberNo.slice(-4)}`, paid: true, createdAt: iso("2026-04-02T09:00") });
    if (i % 5 !== 4) attendance.push({ id: `a-e3-${m.id}`, eventId: "e3", memberId: m.id, checkedInAt: iso("2026-05-20T08:40"), method: "qr", counted: true });
  });
  active.slice(0, 20).forEach((m) =>
    attendance.push({ id: `a-e1-${m.id}`, eventId: "e1", memberId: m.id, checkedInAt: iso("2025-05-07T09:05"), method: "manual", counted: true }),
  );
  active.slice(5, 16).forEach((m) =>
    registrations.push({ id: `r-e6-${m.id}`, eventId: "e6", memberId: m.id, ticketCode: `WB-${m.memberNo.slice(-4)}`, paid: true, createdAt: iso("2026-11-01T09:00") }),
  );

  const payments: Payment[] = [];
  const methods = ["mpesa", "airtel", "mixx", "gepg", "bank"] as const;
  active.slice(0, 28).forEach((m, i) =>
    payments.push({
      id: `p${i + 1}`, memberId: m.id, payerName: m.name, purpose: i % 6 === 0 ? "registration" : "subscription",
      amount: m.category === "full" ? (i % 6 === 0 ? 100_000 : 60_000) : i % 6 === 0 ? 20_000 : 25_000,
      method: methods[i % 5], reference: `TX${900100 + i * 17}`, receiptNo: `RCT-2026-${String(i + 1).padStart(4, "0")}`,
      createdAt: iso(`2026-0${1 + (i % 9)}-1${i % 9}T10:00`),
    }),
  );
  const unmatched: [string, string, number][] = [
    ["A. Mwakalinga", "m012", 60_000], ["J. Msuya Kaaya", "m019", 60_000], ["Neema M.", "m023", 25_000], ["Unknown sender 7781", "", 100_000],
  ];
  unmatched.forEach(([payer, guess, amount], i) =>
    payments.push({
      id: `pu${i + 1}`, memberId: null, payerName: payer, purpose: "subscription", amount, method: methods[i],
      reference: `UN${77810 + i}`, receiptNo: null, createdAt: iso(`2026-10-2${i}T14:00`), suggestedMemberId: guess || undefined,
    }),
  );

  const announcements: Announcement[] = [
    { id: "n1", title: "10th Annual Scientific Conference concluded in Mbeya", body: "About 200 delegates, 12 exhibitors and 4 pre-conference workshops. Best abstract: Dr Hassan Vuai. Photos are in the gallery.", audience: "all", createdAt: iso("2026-06-05T09:00"), author: "Secretariat" },
    { id: "n2", title: "AAAC 2027 is coming to Dar es Salaam", body: "The 10th All Africa Anaesthesia Congress takes place 13–16 September 2027 at JNICC. Registration and abstract submission are open at aaac2027.com.", audience: "all", createdAt: iso("2026-10-15T09:00"), author: "Secretariat" },
    { id: "n3", title: "Annual subscriptions are due by 30 June", body: "Renew from your portal in under a minute. Two consecutive unpaid years may lead to temporary suspension.", audience: "members", createdAt: iso("2026-04-20T09:00"), author: "Treasurer" },
  ];

  const resources: Resource[] = [
    { id: "r1", title: "SATA Constitution", kind: "guideline", description: "Registered under the NGOs Act No. 24 of 2002.", membersOnly: false, url: "#" },
    { id: "r2", title: "Membership Application Guide", kind: "form", description: "Eligibility, fees and how to join.", membersOnly: false, url: "/membership" },
    { id: "r3", title: "10th Conference Abstract Book", kind: "research", description: "All accepted abstracts, Mbeya 2026.", membersOnly: true, url: "#" },
    { id: "r4", title: "Perioperative Safety Checklist", kind: "guideline", description: "Evidence-based checklist for theatre teams.", membersOnly: true, url: "#" },
    { id: "r5", title: "Mechanical Ventilation Workshop Slides", kind: "article", description: "Mbeya 2026 workshop deck.", membersOnly: true, url: "#" },
  ];

  const tickets: Ticket[] = [];
  return { members, officers, departments, events, registrations, attendance, payments, announcements, resources, tickets };
}
