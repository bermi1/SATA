// Official portraits come from the AAAC 2027 organising-committee page (aaac2027.com).
// SATA roles and spellings follow sata.co.tz/our-leadership-and-governance.
// `linkedin` is only shown when a real profile URL is supplied; otherwise the card links to a LinkedIn name search.

export interface TeamMember {
  slug: string;
  name: string;
  role: string;
  group: "executive" | "committee";
  photo: string;
  linkedin?: string;
  note?: string;
}

const P = (f: string) => `/images/aaac/${f}`;

export const TEAM: TeamMember[] = [
  { slug: "rebecca-shija", name: "Dr. Rebecca Samwel Shija", role: "President", group: "executive", photo: P("committee-Picture5-removebg-preview.png"), note: "Chair, AAAC 2027 Fundraising Committee" },
  { slug: "angela-muhozya", name: "Dr. Angela Paul Muhozya", role: "President Elect", group: "executive", photo: P("committee-Picture3-removebg-preview.png") },
  { slug: "john-kweyamba", name: "Dr. John Kweyamba", role: "Secretary General", group: "executive", photo: P("committee-Picture2-removebg-preview.png"), note: "Chair, AAAC 2027 Transport & Protocol" },
  { slug: "amos-zacharia", name: "Dr. Amos Zacharia", role: "Vice Secretary General", group: "executive", photo: P("committee-Picture7-removebg-preview.png"), note: "Chair, AAAC 2027 Education & Scientific" },
  { slug: "anna-assenga", name: "Dr. Anna Assenga", role: "Treasurer", group: "executive", photo: P("committee-584857.jpg"), note: "Head of Finance, AAAC 2027" },
  { slug: "letisia-komba", name: "Dr. Letisia Komba", role: "Deputy Treasurer", group: "executive", photo: P("committee-Picture4-removebg-preview.png"), note: "Deputy Chair, AAAC 2027 Finance" },
  { slug: "mpoki-ulisubisya", name: "Amb. Mpoki Ulisubisya", role: "Chairperson, AAAC 2027 Organising Committee", group: "committee", photo: P("committee-Picture2-removebg-preview__1_.png"), note: "MD, FCA(ECSA) · MOI" },
  { slug: "alex-lwiza", name: "Dr. Alex Lwiza", role: "Secretary, AAAC 2027 Organising Committee", group: "committee", photo: P("committee-Picture1.png") },
  { slug: "karima-khalid", name: "Dr. Karima Khalid", role: "Chair, AAAC 2027 Accommodation Committee", group: "committee", photo: P("committee-Picture6-removebg-preview.png") },
];

export const EXECUTIVE = TEAM.filter((m) => m.group === "executive");
export const COMMITTEE = TEAM.filter((m) => m.group === "committee");

export const linkedinUrl = (m: TeamMember) => m.linkedin ?? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(m.name.replace(/^(Dr|Prof|Amb)\.\s*/, "") + " anaesthesia Tanzania")}`;
