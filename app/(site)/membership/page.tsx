import { Award, BookOpenCheck, Check, HeartHandshake, Landmark, Library, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, SectionHead } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { FEES, fmtTZS } from "@/lib/config";

export const metadata: Metadata = { title: "Membership", description: "Join the Society of Anaesthesiologists of Tanzania: categories, fees, benefits and how to apply." };

const BENEFITS = [
  { icon: Award, t: "Professional recognition", d: "Be part of the official national body representing anaesthesiologists and anaesthesia providers in Tanzania." },
  { icon: BookOpenCheck, t: "Continuous learning", d: "CME and CPD through workshops, webinars and scientific meetings." },
  { icon: Users, t: "Networking & collaboration", d: "Connect with national and international experts; join collaborative research and advocacy projects." },
  { icon: Landmark, t: "Conferences & events", d: "Priority invitations and discounted rates to the Annual Scientific Conference, training programmes and symposia." },
  { icon: Library, t: "Information access", d: "The latest research, policies and guidelines shaping anaesthesia and critical care practice." },
  { icon: HeartHandshake, t: "Welfare & support", d: "A professional network that promotes wellbeing, mentorship and better working conditions." },
];

const DOES = [
  ["Attend and take part", "Come to the Annual General Meeting, scientific conferences, master classes and webinars, and contribute to discussions and projects."],
  ["Have a say in governance", "Full members vote at the AGM and can hold office. Associate members elect two representatives to the Executive Committee."],
  ["Serve on a department", "Join the departments that carry out the Society's work: scientific, membership, finance, events, research, patient safety and communications."],
  ["Learn and earn CPD", "Every attended event is recorded and CPD points are credited automatically to your member profile."],
  ["Mentor and be mentored", "Support trainees and young researchers, and benefit from experienced colleagues across hospitals and regions."],
  ["Speak up for safe care", "Contribute to advocacy with the Ministry of Health, WFSA, WHO and partners, including alignment with the National Surgical, Obstetric and Anaesthesia Plan."],
];

const CATS = [
  { k: "full" as const, who: "Qualified anaesthesiologists engaged in full-time or part-time practice within Tanzania.", points: ["Voting rights at the AGM", "Eligible to hold office", "Must be a licensed anaesthesiologist in active practice", "Must uphold SATA's Constitution and ethical standards"] },
  { k: "associate" as const, who: "Anaesthetic officers, clinical officers, nurse anaesthetists, pharmacists and medical officers with an interest in anaesthesia.", points: ["Attend all meetings and scientific activities", "Contribute to discussions and projects", "Elect two Executive Committee representatives", "Not eligible to vote directly at the AGM"] },
  { k: "honorary" as const, who: "Distinguished individuals or institutions with significant contributions to anaesthesia, critical care or SATA's objectives.", points: ["Granted by the Executive Committee", "Exempt from membership and subscription fees", "May take part in events", "No voting rights or eligibility for office"] },
];

const STEPS = [
  ["Apply online", "Complete the application with your cadre, facility and region."],
  ["Attach credentials", "Provide professional credentials or proof of practice."],
  ["Pay the registration fee", "M-Pesa, Airtel Money, Mixx by Yas, GePG or bank, with an instant receipt."],
  ["Receive your membership ID", "Approval gives you a membership number and a digital card with a QR code."],
];

export default function Membership() {
  return (
    <>
      <PageHero pageKey="membership" eyebrow="Membership" title="Join the community that champions safe anaesthesia in Tanzania." image="/images/events/mbeya-2026.jpg" crumbs={[["Membership"]]}
        intro="Membership connects consultants, trainees, nurse anaesthetists and allied providers who share one mission: safer, more accessible and more effective anaesthesia for every patient.">
        <Link href="/membership/apply" className="rounded-md bg-white px-6 py-3 text-sm font-bold text-deep transition hover:bg-mist">Apply online</Link>
        <Link href="/login" className="rounded-md border border-white/40 px-6 py-3 text-sm font-semibold transition hover:bg-white/10">Member sign in</Link>
      </PageHero>

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-14 md:space-y-20 md:py-16">
        {/* Fees */}
        <section id="fees">
          <Reveal><SectionHead eyebrow="Categories & fees" title="Three ways to belong." intro="Registration fees are paid once when you join. Annual subscriptions are approved by members at the AGM and fall due by 30 June each year." /></Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {CATS.map((c, i) => (
              <Reveal key={c.k} delay={i * 70}>
                <div className={`flex h-full flex-col rounded-lg border p-6 ${c.k === "full" ? "border-blue bg-blue/[0.03] shadow-md" : "border-line bg-white"}`}>
                  <div className="font-display text-lg font-bold text-deep">{FEES[c.k].label}</div>
                  <div className="mt-3 flex items-baseline gap-1.5"><span className="font-display text-3xl font-bold text-blue">{FEES[c.k].registration ? fmtTZS(FEES[c.k].registration) : "No fee"}</span>{FEES[c.k].registration > 0 && <span className="text-xs text-muted">registration</span>}</div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{c.who}</p>
                  <ul className="mt-5 space-y-2 border-t border-line pt-5 text-sm">{c.points.map((p) => <li key={p} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-blue" />{p}</li>)}</ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section>
          <Reveal><SectionHead eyebrow="Why join" title="What membership gives you." /></Reveal>
          <div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.t} delay={i * 50}>
                <div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue/10 text-blue"><b.icon className="size-5" /></span><div><h3 className="font-display text-base font-bold text-deep">{b.t}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{b.d}</p></div></div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* What members do */}
        <section className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          <Reveal><SectionHead eyebrow="In practice" title="What SATA members do." intro="Membership is active, not just a card. This is how members take part in the life of the Society." /></Reveal>
          <Reveal delay={80}>
            <ol className="divide-y divide-line border-y border-line">
              {DOES.map(([t, d], i) => (
                <li key={t} className="flex gap-4 py-4"><span className="w-7 shrink-0 font-display text-sm font-bold text-blue">{String(i + 1).padStart(2, "0")}</span><div><div className="font-display text-[15px] font-bold text-deep">{t}</div><p className="mt-0.5 text-sm leading-relaxed text-muted">{d}</p></div></li>
              ))}
            </ol>
          </Reveal>
        </section>

        {/* How to join */}
        <section>
          <Reveal><SectionHead eyebrow="How to join" title="Four steps." /></Reveal>
          <ol className="relative mt-8 grid gap-6 sm:grid-cols-4">
            <span className="absolute left-0 right-0 top-[13px] hidden h-px bg-line sm:block" aria-hidden />
            {STEPS.map(([t, d], i) => (
              <Reveal key={t} delay={i * 60}>
                <li className="relative"><span className="relative grid size-7 place-items-center rounded-full bg-blue text-xs font-bold text-white ring-4 ring-white">{i + 1}</span><div className="mt-3 font-display text-[15px] font-bold text-deep">{t}</div><p className="mt-1 text-sm leading-snug text-muted">{d}</p></li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Renewal */}
        <Reveal>
          <section className="rounded-lg border border-line bg-mist p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-deep">Renewal and compliance</h2>
            <p className="mt-2 max-w-3xl leading-relaxed text-muted">Membership is renewed annually, with subscription fees due by <b className="text-ink">30 June</b> of each calendar year. Please keep your contact details up to date. Failure to pay for two consecutive years without a valid explanation may lead to temporary suspension, with reinstatement on payment of outstanding fees and a written application to the Executive Committee.</p>
            <div className="mt-5 flex flex-wrap gap-3"><Link href="/membership/apply" className="rounded-md bg-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-deep">Start your application</Link><Link href="/about#faq" className="rounded-md border border-line bg-white px-6 py-3 text-sm font-semibold text-deep transition hover:border-blue hover:text-blue">Read the FAQ</Link></div>
          </section>
        </Reveal>
      </div>
    </>
  );
}
