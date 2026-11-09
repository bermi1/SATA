import { docLink, siteUrl } from "./links";
import { sendEmail } from "./sms";
import { FEES } from "./config";
import type { Member } from "./types";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const validText = (m: Member) => (m.paidThrough ? fmt(m.paidThrough) : "lifetime");

/** Welcome email sent when an application is approved. Never throws. */
export async function sendWelcomeEmail(m: Member) {
  try {
    const text = `Dear ${m.name},\n\nCongratulations. Your application has been approved and you are now a ${FEES[m.category].label} of the Society of Anaesthesiologists of Tanzania.\n\nMembership number: ${m.memberNo}\nValid through: ${validText(m)}\n\nYour membership certificate: ${docLink(m.memberNo, "certificate", true)}\nYour digital ID card: ${docLink(m.memberNo, "card", true)}\n\nSign in to your member portal to register for events, track your CPD points and manage your membership.\n\nWelcome to SATA.`;
    await sendEmail(m.email, "Welcome to SATA: your membership is approved", text, {
      heading: "Welcome to SATA", button: { label: "Sign in to your portal", href: `${siteUrl()}/login` }, preheader: `Your membership number is ${m.memberNo}`,
    });
  } catch { /* email is best effort */ }
}

/** Sent when a payment renews or extends membership. Never throws. */
export async function sendRenewalEmail(m: Member) {
  try {
    const text = `Dear ${m.name},\n\nThank you. Your SATA membership (${m.memberNo}) has been renewed and is now valid through ${validText(m)}.\n\nYour updated digital ID card: ${docLink(m.memberNo, "card", true)}\nYour membership certificate: ${docLink(m.memberNo, "certificate", true)}`;
    await sendEmail(m.email, "Your SATA membership is renewed", text, {
      heading: "Your SATA membership is renewed", button: { label: "View my ID card", href: docLink(m.memberNo, "card") }, preheader: `Valid through ${validText(m)}`,
    });
  } catch { /* email is best effort */ }
}
