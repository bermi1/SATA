import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy", description: "How the Society of Anaesthesiologists of Tanzania collects, uses and protects personal information." };

export default function Privacy() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" updated="November 2026">
      <p>The Society of Anaesthesiologists of Tanzania (SATA) respects your privacy. This policy explains what we collect on this website, why, and the choices you have. We handle personal information in line with the Personal Data Protection Act, 2022 of Tanzania.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Membership applications and records:</strong> name, email, phone number, professional category and cadre, facility, region, membership number, subscription and payment history, event attendance and CPD points.</li>
        <li><strong>Event registrations:</strong> name, email and phone number for members and guests, ticket code, payment status and attendance.</li>
        <li><strong>Newsletter sign-ups:</strong> email address and, if you choose, a phone number and your consent to receive SMS.</li>
        <li><strong>Enquiries:</strong> the details and message you send through the contact form.</li>
        <li><strong>Sign-in:</strong> your email address and a one-time code, which we store only in hashed form and delete after use or expiry.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To process applications, run the member register and confirm good standing.</li>
        <li>To issue receipts, manage events, record attendance and credit CPD.</li>
        <li>To send service messages such as payment reminders, tickets and approvals.</li>
        <li>To send news and event updates to people who subscribed, who can stop at any time.</li>
        <li>To keep the platform secure, including an audit log of administrative actions.</li>
      </ul>

      <h2>Who can see it</h2>
      <p>Access to member records is limited to SATA officers according to their role: the secretariat, the treasurer and the leadership each see only what their duties require. Public member verification shows only a name, category and whether the member is in good standing, never contact details.</p>
      <p>We do not sell personal information. We use service providers to run the platform (hosting, database, email and SMS delivery, and payment channels). They process data on our instructions.</p>

      <h2>Cookies</h2>
      <p>The site sets one cookie, <code>sata_session</code>, only when you sign in. It keeps you signed in for up to seven days and is not used for advertising. We do not use advertising or tracking cookies.</p>

      <h2>How long we keep it</h2>
      <p>Member records are kept while you are a member and for as long as needed afterwards for accounting, audit and governance. Newsletter details are kept until you unsubscribe. Enquiries are kept for as long as needed to respond and for record keeping.</p>

      <h2>Your rights</h2>
      <p>You may ask to see, correct or delete your personal information, to object to certain uses, and to withdraw consent to marketing messages at any time. Email <a href="mailto:info@sata.co.tz">info@sata.co.tz</a> and we will respond within a reasonable time. To stop SMS messages, reply STOP to any message.</p>

      <h2>Security</h2>
      <p>Data is stored in an access-controlled database and transmitted over encrypted connections. Sign-in uses one-time codes with attempt limits, and administrative actions are logged. No system is perfectly secure, so please tell us promptly if you suspect misuse of your account.</p>

      <h2>Changes and contact</h2>
      <p>We may update this policy and will change the date above when we do. Questions: <a href="mailto:info@sata.co.tz">info@sata.co.tz</a>, MUHAS/MOI, P.O. Box 65387, Dar es Salaam, Tanzania.</p>
    </LegalPage>
  );
}
