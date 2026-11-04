import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = { title: "Contact", description: "Contact the Society of Anaesthesiologists of Tanzania secretariat." };

const TOPICS = [
  ["Joining or renewing", "Membership questions, eligibility, fees and your member card.", "/membership"],
  ["Events and conferences", "Registration, tickets, CPD and programmes.", "/events"],
  ["Publications", "Reports, research calls, policy and guidelines.", "/resources"],
  ["Latest news", "Announcements and conference reports.", "/news"],
];

export default async function Contact() {
  const s = await getSettings();
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("MUHAS MOI Simulation Laboratory and Patient Safety Center Dar es Salaam")}`;
  return (
    <>
      <PageHero pageKey="contact" eyebrow="Contact" title="Get in touch with the secretariat." image="/images/events/mbeya-2026.jpg" crumbs={[["Contact"]]}
        intro="Questions about membership, events, partnerships or the media? Write to us and we will reply by email. Members can also open a support ticket from their portal." />

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:py-16 lg:grid-cols-[1fr_1.25fr]">
        <Reveal>
          <div>
            <h2 className="font-display text-2xl font-bold text-deep">Society of Anaesthesiologists of Tanzania</h2>
            <p className="mt-2 text-muted">Headquartered at the MUHAS/MOI Simulation Laboratory and Patient Safety Center, Dar es Salaam.</p>
            <ul className="mt-7 divide-y divide-line border-y border-line">
              <li className="flex gap-4 py-4"><MapPin className="mt-0.5 size-5 shrink-0 text-blue" /><div><div className="text-[11px] font-bold uppercase tracking-wider text-muted">Address</div><div className="mt-0.5 font-semibold text-deep">{s.address}</div><a href={maps} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-blue">Open in Maps <ArrowUpRight className="size-3.5" /></a></div></li>
              <li className="flex gap-4 py-4"><Phone className="mt-0.5 size-5 shrink-0 text-blue" /><div><div className="text-[11px] font-bold uppercase tracking-wider text-muted">Phone</div><a href={`tel:${s.phone.replace(/\s/g, "")}`} className="mt-0.5 block font-semibold text-deep hover:text-blue">{s.phone}</a></div></li>
              <li className="flex gap-4 py-4"><Mail className="mt-0.5 size-5 shrink-0 text-blue" /><div><div className="text-[11px] font-bold uppercase tracking-wider text-muted">Email</div><a href={`mailto:${s.email}`} className="mt-0.5 block font-semibold text-deep hover:text-blue">{s.email}</a></div></li>
              <li className="flex gap-4 py-4"><Clock className="mt-0.5 size-5 shrink-0 text-blue" /><div><div className="text-[11px] font-bold uppercase tracking-wider text-muted">Response time</div><div className="mt-0.5 font-semibold text-deep">We aim to reply within two working days.</div></div></li>
            </ul>
            <div className="mt-8 rounded-lg bg-mist p-6">
              <h3 className="font-display text-base font-bold text-deep">Looking for something specific?</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {TOPICS.map(([t, d, h]) => <li key={t}><Link href={h} className="group block"><span className="font-semibold text-deep group-hover:text-blue">{t} →</span><span className="mt-0.5 block text-xs leading-snug text-muted">{d}</span></Link></li>)}
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="rounded-lg border border-line bg-white p-6 shadow-lg shadow-ink/5 sm:p-8">
            <h2 className="font-display text-xl font-bold text-deep">Send us a message</h2>
            <p className="mb-6 mt-1 text-sm text-muted">Every message reaches the secretariat inbox and is tracked until it is answered.</p>
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </>
  );
}
