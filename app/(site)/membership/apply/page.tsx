import type { Metadata } from "next";
import ApplyForm from "@/components/ApplyForm";
import { PageHero } from "@/components/PageHero";
import { FEES, fmtTZS, REGIONS } from "@/lib/config";

export const metadata: Metadata = { title: "Apply for membership" };

export default function Apply() {
  return (
    <>
      <PageHero eyebrow="Join SATA" title="Membership application" crumbs={[["Membership", "/membership"], ["Apply"]]}
        intro="Your application goes straight to the Membership & Welfare department for verification, usually the same day." />
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm sm:p-8">
          <ApplyForm regions={REGIONS} fees={(Object.keys(FEES) as (keyof typeof FEES)[]).map((k) => ({ value: k, label: FEES[k].registration ? `${FEES[k].label}: ${fmtTZS(FEES[k].registration)}` : FEES[k].label }))} />
        </div>
        <aside className="space-y-5 text-sm">
          <div className="rounded-lg bg-mist p-6"><h2 className="font-display text-base font-bold text-deep">What happens next</h2><ol className="mt-3 space-y-2.5 text-muted"><li>1. You submit the form with your proof of payment.</li><li>2. The secretariat verifies your credentials and payment.</li><li>3. You are approved and receive a welcome email.</li><li>4. Your certificate and digital ID card are ready to download.</li></ol></div>
          <div className="rounded-lg border border-line p-6"><h2 className="font-display text-base font-bold text-deep">Eligibility</h2><p className="mt-2 leading-relaxed text-muted">Full: licensed anaesthesiologists in active practice in Tanzania. Associate: anaesthetic officers, clinical officers, nurse anaesthetists, pharmacists and medical officers with an interest in anaesthesia.</p></div>
        </aside>
      </div>
    </>
  );
}
