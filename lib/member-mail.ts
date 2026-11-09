import { docLink, siteUrl } from "./links";
import { sendEmail } from "./sms";
import { FEES } from "./config";
import type { Member } from "./types";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const validText = (m: Member) => (m.paidThrough ? fmt(m.paidThrough) : "lifetime");

const certificate = (m: Member) => ({ src: docLink(m.memberNo, "certificate"), alt: "SATA membership certificate", href: docLink(m.memberNo, "certificate", true) });
const card = (m: Member) => ({ src: docLink(m.memberNo, "card"), alt: "SATA digital ID card", href: docLink(m.memberNo, "card", true), width: 360 });

/** Welcome email sent when an application is approved: certificate and ID card shown inline and attached. Never throws. */
export async function sendWelcomeEmail(m: Member) {
  try {
    const text = `Dear ${m.name},\n\nCongratulations. Your application has been approved and you are now a ${FEES[m.category].label} of the Society of Anaesthesiologists of Tanzania.\n\nMembership number: ${m.memberNo}\nValid through: ${validText(m)}\n\nYour membership certificate and digital ID card are below and attached to this email. Keep the ID card on your phone: anyone can scan its QR code to confirm your membership.\n\nSign in to your member portal to register for events, track your CPD points and manage your membership.\n\nWelcome to SATA.`;
    return await sendEmail(m.email, "Welcome to SATA: your membership is approved", text, {
      heading: "Welcome to SATA",
      images: [certificate(m), card(m)],
      attachments: [
        { filename: `SATA-certificate-${m.memberNo}.png`, path: docLink(m.memberNo, "certificate") },
        { filename: `SATA-ID-card-${m.memberNo}.png`, path: docLink(m.memberNo, "card") },
      ],
      button: { label: "Sign in to your portal", href: `${siteUrl()}/login` },
      preheader: `Your membership number is ${m.memberNo}`,
    });
  } catch { /* email is best effort */ }
}

/** Sent when a payment renews or extends membership: the updated ID card inline and attached. Never throws. */
export async function sendRenewalEmail(m: Member) {
  try {
    const text = `Dear ${m.name},\n\nThank you. Your SATA membership (${m.memberNo}) has been renewed and is now valid through ${validText(m)}.\n\nYour updated digital ID card is below and attached to this email.`;
    return await sendEmail(m.email, "Your SATA membership is renewed", text, {
      heading: "Your SATA membership is renewed",
      images: [card(m)],
      attachments: [{ filename: `SATA-ID-card-${m.memberNo}.png`, path: docLink(m.memberNo, "card") }],
      button: { label: "Open my member portal", href: `${siteUrl()}/portal` },
      preheader: `Valid through ${validText(m)}`,
    });
  } catch { /* email is best effort */ }
}
