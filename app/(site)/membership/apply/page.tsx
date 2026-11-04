import type { Metadata } from "next";
import JsonForm from "@/components/JsonForm";
import { PageHero } from "@/components/PageHero";
import { CADRES, FEES, fmtTZS, REGIONS } from "@/lib/config";

export const metadata: Metadata = { title: "Apply for membership" };

export default function Apply() {
  return (
    <>
      <PageHero eyebrow="Join SATA" title="Membership application" crumbs={[["Membership", "/membership"], ["Apply"]]}
        intro="Your application goes straight to the Membership & Welfare department for verification, usually the same day." />
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm sm:p-8">
          <JsonForm
            url="/api/apply"
            submit="Submit application"
            success="Application received. Your membership number is {memberNo}. Registration fee: {feeText}."
            reset
            fields={[
              { name: "name", label: "Full name", placeholder: "Dr. Jane Mushi" },
              { name: "email", label: "Email", type: "email", half: true },
              { name: "phone", label: "Phone", type: "tel", half: true, placeholder: "0754 000 000" },
              { name: "category", label: "Membership category", type: "select", half: true, options: [
                { value: "full", label: `Full: ${fmtTZS(FEES.full.registration)}` },
                { value: "associate", label: `Associate: ${fmtTZS(FEES.associate.registration)}` },
              ] },
              { name: "cadre", label: "Cadre", type: "select", half: true, options: CADRES.map((c) => ({ value: c, label: c })) },
              { name: "facility", label: "Facility / employer", half: true },
              { name: "region", label: "Region", type: "select", half: true, options: REGIONS.map((r) => ({ value: r, label: r })) },
            ]}
          />
        </div>
        <aside className="space-y-5 text-sm">
          <div className="rounded-lg bg-mist p-6"><h2 className="font-display text-base font-bold text-deep">What happens next</h2><ol className="mt-3 space-y-2.5 text-muted"><li>1. You receive your membership number.</li><li>2. The secretariat verifies your credentials.</li><li>3. You pay the registration fee by mobile money, GePG or bank.</li><li>4. Your digital card appears in your member portal.</li></ol></div>
          <div className="rounded-lg border border-line p-6"><h2 className="font-display text-base font-bold text-deep">Eligibility</h2><p className="mt-2 leading-relaxed text-muted">Full: licensed anaesthesiologists in active practice in Tanzania. Associate: anaesthetic officers, clinical officers, nurse anaesthetists, pharmacists and medical officers with an interest in anaesthesia.</p></div>
        </aside>
      </div>
    </>
  );
}
