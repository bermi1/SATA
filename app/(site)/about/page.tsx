import { ArrowUpRight, ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AFFILIATES, PartnerStrip } from "@/components/Partners";
import { PageHero } from "@/components/PageHero";
import { FEES, fmtTZS } from "@/lib/config";
import { getSettings, listPartners } from "@/lib/store";

export const metadata: Metadata = { title: "About SATA", description: "The Society of Anaesthesiologists of Tanzania: who we are, what we believe, how we work and who we work with." };

const OBJECTIVES = [
  "Enhance access to and the quality of anaesthesia and critical care",
  "Standardise practice through evidence-based guidance",
  "Empower professionals through training and mentorship",
  "Build networks and partnerships across institutions",
  "Advance research and innovation in African practice",
  "Promote the welfare of our members",
  "Support training and education at every level",
];

const HOW = [
  ["Educate", "Annual scientific conference, master classes, workshops and webinars with CPD credit."],
  ["Advocate", "A professional voice with the Ministry of Health, WFSA, WHO and policymakers."],
  ["Collaborate", "Partnerships with hospitals, universities, donors and implementing partners."],
  ["Research", "Abstracts, audits and African-led research that changes practice."],
];

const TIMELINE = [
  ["7–9 May 2025", "9th SATA Scientific Conference", "Gold Crest Hotel, Mwanza"],
  ["22–23 Jul 2025", "Master Class Course in Anaesthesia", "MUHAS MOI and MNH, Dar es Salaam"],
  ["20–22 May 2026", "10th Scientific Conference & AGM", "City Garden Park Hall, Mbeya"],
  ["13–16 Sep 2027", "AAAC 2027, hosted by SATA", "JNICC, Dar es Salaam", "https://aaac2027.com"],
];

const AFFILIATIONS = [
  ["WFSA", "World Federation of Societies of Anaesthesiologists", "Anaesthesiologists from over 150 countries.", "https://www.wfsahq.org"],
  ["CANECSA", "College of Anaesthesiologists of East, Central and Southern Africa", "Training, examining and accrediting in the ECSA region.", "https://canecsa.org"],
  ["MAT", "Medical Association of Tanzania", "The umbrella body for doctors and health practitioners.", "https://www.mat.or.tz"],
];

const FAQ = [
  ["Who can join SATA?", "Full membership is for licensed anaesthesiologists in active practice in Tanzania. Associate membership is for anaesthetic officers, clinical officers, nurse anaesthetists, pharmacists and medical officers with an interest in anaesthesia. Honorary membership is awarded by the Executive Committee."],
  ["How much does it cost?", `The registration fee is ${fmtTZS(FEES.full.registration)} for Full members and ${fmtTZS(FEES.associate.registration)} for Associate members. Annual subscriptions are approved by members at the AGM.`],
  ["When do I renew?", "Subscriptions fall due by 30 June each year. Two consecutive years unpaid without explanation may lead to temporary suspension."],
  ["How do employers verify my membership?", "Every member has a digital card with a QR code. Scanning it shows your name, category and whether you are in good standing, with no personal contact details."],
];

const head = "text-[11px] font-bold uppercase tracking-[0.2em] text-blue";

export default async function About() {
  const partners = await listPartners();
  const s = await getSettings();
  return (
    <>
      <PageHero pageKey="about" eyebrow="About SATA" title="Vigilance, education and care, together." image="/images/news/conference-2025.jpg" crumbs={[["About"]]}
        intro={`${s.tagline} A professional, non-governmental, non-profit organisation registered under the NGOs Act No. 24 of 2002.`} />

      <div className="mx-auto max-w-5xl space-y-14 px-5 py-14">
        <section id="who" className="scroll-mt-28 grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <h2 className="font-display text-2xl font-bold text-deep">Who we are</h2>
          <div className="space-y-3 leading-relaxed text-muted">
            <p>SATA promotes excellence, patient safety and continuous professional development in anaesthesia and critical care. We are a versatile platform of interaction among healthcare and academic institutions, policymakers, donors and implementing partners.</p>
            <p>Our headquarters are at the MUHAS/MOI Simulation Laboratory and Patient Safety Center in Dar es Salaam. Our logo carries a single word, <b className="text-vigil">vigilance</b>, because safe anaesthesia is a discipline of constant attention.</p>
          </div>
        </section>

        <section id="mission" className="scroll-mt-28 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          <div className="bg-white p-6"><div className={head}>Vision</div><p className="mt-2 text-[15px] leading-relaxed text-ink">A culture of patient safety and quality improvement, cultivated through the efficient implementation of evidence-based anaesthetic and critical care practices in the healthcare system of Tanzania by 2030 and beyond.</p></div>
          <div className="bg-white p-6"><div className={head}>Mission</div><p className="mt-2 text-[15px] leading-relaxed text-ink">Serving our community by advancing anaesthesia care through education, advocacy, and collaboration, ensuring the highest standards of patient safety and well-being.</p></div>
        </section>

        <section id="objectives" className="scroll-mt-28 grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <h2 className="font-display text-2xl font-bold text-deep">Core objectives</h2>
          <ol className="divide-y divide-line border-y border-line">
            {OBJECTIVES.map((o, i) => (
              <li key={o} className="flex gap-4 py-3 text-[15px]"><span className="w-6 shrink-0 font-display text-sm font-bold text-blue">{String(i + 1).padStart(2, "0")}</span><span className="text-ink">{o}</span></li>
            ))}
          </ol>
        </section>

        <section id="how" className="scroll-mt-28">
          <h2 className="font-display text-2xl font-bold text-deep">How we work</h2>
          <ol className="relative mt-5 grid gap-5 sm:grid-cols-4">
            <span className="absolute left-0 right-0 top-[11px] hidden h-px bg-line sm:block" aria-hidden />
            {HOW.map(([t, d], i) => (
              <li key={t} className="relative">
                <span className="relative grid size-[22px] place-items-center rounded-full bg-blue text-[10px] font-bold text-white ring-4 ring-white">{i + 1}</span>
                <div className="mt-3 font-display text-[15px] font-bold text-deep">{t}</div>
                <p className="mt-1 text-[13px] leading-snug text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="gatherings" className="scroll-mt-28 grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <h2 className="font-display text-2xl font-bold text-deep">Recent gatherings</h2>
          <ul className="divide-y divide-line border-y border-line">
            {TIMELINE.map(([d, t, w, link]) => (
              <li key={t} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-3">
                <div><div className="text-[15px] font-semibold text-deep">{link ? <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-blue">{t}<ArrowUpRight className="size-3.5" /></a> : t}</div><div className="text-xs text-muted">{w}</div></div>
                <div className="text-xs font-bold text-blue">{d}</div>
              </li>
            ))}
          </ul>
        </section>

        <section id="affiliations" className="scroll-mt-28">
          <h2 className="font-display text-2xl font-bold text-deep">Affiliations</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {AFFILIATIONS.map(([n, f, d, u]) => (
              <li key={n}><a href={u} target="_blank" rel="noreferrer" className="block h-full rounded-xl border border-line p-4 transition hover:border-blue"><div className="flex items-center gap-3"><span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full">{(() => { const a = AFFILIATES.find((x) => x.name === n); return a ? <Image src={a.logo} alt="" width={a.wide ? 96 : 48} height={48} className="max-h-12 w-auto object-contain" /> : null; })()}</span><div className="font-display text-lg font-bold text-blue">{n}</div></div><div className="mt-2 text-[13px] font-semibold leading-snug text-deep">{f}</div><div className="mt-1 text-xs text-muted">{d}</div></a></li>
            ))}
          </ul>
        </section>

        <section id="faq" className="scroll-mt-28">
          <h2 className="font-display text-2xl font-bold text-deep">Questions</h2>
          <div className="mt-4 divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-3.5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-[15px] font-semibold text-deep">{q}<ChevronDown className="size-4 shrink-0 text-blue transition group-open:rotate-180" /></summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">More questions? <Link href="/contact" className="font-semibold text-blue">Contact the Secretariat</Link></p>
        </section>
      </div>

      <PartnerStrip partners={partners} />
      <div className="h-14" />
    </>
  );
}
