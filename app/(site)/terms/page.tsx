import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Use", description: "Terms for using the SATA website, member portal and online services." };

export default function Terms() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Use" updated="November 2026">
      <p>By using the website and member portal of the Society of Anaesthesiologists of Tanzania (SATA), you agree to these terms.</p>

      <h2>Information on this site</h2>
      <p>Content is provided for professional information and does not replace clinical judgement, national guidelines or the advice of your institution. Event details, dates and fees can change; the details confirmed by the secretariat apply.</p>

      <h2>Membership and accounts</h2>
      <ul>
        <li>Membership is governed by the SATA Constitution. Eligibility, categories, fees and renewal rules are published on the Membership page.</li>
        <li>Give accurate information when you apply or register. SATA may decline or suspend a membership for false information or conduct that breaches the Constitution.</li>
        <li>Sign-in codes are personal. Do not share them, and tell us at once if you suspect someone else used your account.</li>
      </ul>

      <h2>Payments</h2>
      <p>Registration fees, annual subscriptions (due by 30 June each year) and event fees are payable in Tanzanian shillings through the channels shown in the portal. A receipt is issued when a payment is confirmed. Fees are non-refundable except where SATA decides otherwise, for example when an event is cancelled.</p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not attempt to access records you are not authorised to see, probe or disrupt the service, or upload harmful files.</li>
        <li>Use member contact information only for the purposes SATA permits. Do not send unsolicited commercial messages to members.</li>
      </ul>

      <h2>Content and ownership</h2>
      <p>The SATA name, logo and original content belong to SATA or its partners and may not be reused for commercial purposes without permission. Reports and publications may be shared with attribution unless marked otherwise.</p>

      <h2>Liability</h2>
      <p>We work to keep the service available and accurate, but it is provided as is. To the extent permitted by law, SATA is not liable for losses arising from interruptions, errors or reliance on information on this site.</p>

      <h2>Changes and contact</h2>
      <p>We may update these terms and will change the date above when we do. Questions: <a href="mailto:info@sata.co.tz">info@sata.co.tz</a>.</p>
    </LegalPage>
  );
}
