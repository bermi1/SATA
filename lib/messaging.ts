import { emailProvider, normalizePhone, sendEmail, sendSms, smsProvider, smsSegments } from "./sms";
import {
  addNotification, AUDIENCE_LABEL, auditLog, getEvent, listEvents, listMembers, listRegistrations, recordMessage, resolveAudience, stampReminded,
  type Recipient,
} from "./store";
import type { AudienceSpec, MessageLog } from "./types";

export const TOKENS = ["{name}", "{memberNo}", "{fee}", "{due}", "{days}"];

export const render = (body: string, vars: Record<string, string>) => body.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

export const audienceName = async (spec: AudienceSpec) => {
  const base = AUDIENCE_LABEL[spec.type] ?? spec.type;
  const ev = spec.id && spec.type.startsWith("event_") ? (await getEvent(spec.id))?.title : null;
  return ev ? `${base}: ${ev}` : base;
};

export async function previewCampaign(spec: AudienceSpec, body: string) {
  const list = await resolveAudience(spec);
  const sms = list.filter((r) => r.phone);
  const sample = list[0] ? render(body, list[0].vars) : body;
  return {
    recipients: list.length,
    smsReachable: sms.length,
    emailReachable: list.filter((r) => r.email).length,
    noPhone: list.length - sms.length,
    segmentsPerMessage: smsSegments(sample),
    totalSegments: sms.reduce((s, r) => s + smsSegments(render(body, r.vars)), 0),
    sample,
    smsProvider: smsProvider(),
    emailProvider: emailProvider(),
  };
}

async function inChunks<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

interface Campaign {
  recipients: Recipient[];
  channels: ("sms" | "email")[];
  subject?: string;
  body: string;
  sender: string;
  kind: MessageLog["kind"];
  audience: string;
  notify?: { title: string; kind: "payment" | "event" | "general" };
}

export async function deliver(c: Campaign) {
  let sent = 0, failed = 0, segments = 0;
  const failures: string[] = [];

  if (c.channels.includes("sms")) {
    const targets = c.recipients.filter((r) => r.phone);
    // Group identical texts so un-personalised blasts go out as one API call per 100 numbers.
    const groups = new Map<string, string[]>();
    for (const r of targets) {
      const text = render(c.body, r.vars);
      groups.set(text, [...(groups.get(text) ?? []), r.phone!]);
      segments += smsSegments(text);
    }
    const results = await inChunks([...groups.entries()], 5, ([text, to]) => sendSms(to, text));
    for (const res of results.flat()) {
      if (res.ok) sent++;
      else { failed++; failures.push(`${res.to}: ${res.error}`); }
    }
  }

  if (c.channels.includes("email")) {
    const targets = c.recipients.filter((r) => r.email);
    const results = await inChunks(targets, 10, (r) => sendEmail(r.email!, c.subject ?? "Message from SATA", render(c.body, r.vars)));
    for (const res of results) {
      if (res.ok) sent++;
      else { failed++; failures.push(`${res.to}: ${res.error}`); }
    }
  }

  if (c.notify) {
    for (const r of c.recipients) if (r.memberId) await addNotification(r.memberId, c.notify.title, render(c.body, r.vars), c.notify.kind);
  }

  await recordMessage({
    sender: c.sender, kind: c.kind, audience: c.audience, channels: c.channels, subject: c.subject, body: c.body,
    recipients: c.recipients.length, sent, failed, smsSegments: segments, provider: c.channels.includes("sms") ? smsProvider() : emailProvider(),
  });
  await auditLog(c.sender, `Sent ${c.kind} message to ${c.audience} (${c.recipients.length} recipients, ${sent} delivered, ${failed} failed)`);
  return { recipients: c.recipients.length, sent, failed, segments, failures: failures.slice(0, 5) };
}

export async function sendCampaign(input: { audience: AudienceSpec; channels: ("sms" | "email")[]; subject?: string; body: string; sender: string; inApp?: boolean }) {
  const recipients = await resolveAudience(input.audience);
  const out = await sendCampaignTo(recipients, input);
  // A manual payment reminder counts toward the 7-day limit, so the daily job doesn't text the same people again.
  if (input.audience.type === "overdue" || input.audience.type === "expiring") await Promise.all(recipients.map((r) => r.memberId ? stampReminded(r.memberId) : null));
  return out;
}

async function sendCampaignTo(recipients: Recipient[], input: { audience: AudienceSpec; channels: ("sms" | "email")[]; subject?: string; body: string; sender: string; inApp?: boolean }) {
  return deliver({
    recipients, channels: input.channels, subject: input.subject, body: input.body, sender: input.sender,
    kind: input.audience.type === "subscribers" && input.channels.includes("email") ? "newsletter" : input.audience.type.startsWith("event_") ? "event" : "bulk",
    audience: await audienceName(input.audience), notify: input.inApp ? { title: input.subject ?? "Message from SATA", kind: "general" } : undefined,
  });
}

/** Ticket / receipt style one-off SMS to a single phone number. Never throws. */
export async function sendOne(phone: string | undefined | null, body: string, who: string) {
  const to = normalizePhone(phone);
  if (!to) return;
  const [res] = await sendSms([to], body);
  await recordMessage({ sender: "System", kind: "event", audience: who, channels: ["sms"], body, recipients: 1, sent: res?.ok ? 1 : 0, failed: res?.ok ? 0 : 1, smsSegments: smsSegments(body), provider: smsProvider() });
}

const OVERDUE_SMS = "SATA: Dear {name}, your membership {memberNo} is overdue. Renew ({fee}) via M-Pesa, Airtel, Mixx or GePG at sata.co.tz/portal/payments. Asante.";
const EXPIRING_SMS = "SATA: Dear {name}, your membership {memberNo} expires on {due} ({days} days). Renew ({fee}) at sata.co.tz/portal/payments. Asante.";

/**
 * Automatic non-payment reminders. Safe to run daily: each member is reminded at most once every 7 days.
 * Sends an SMS and drops an in-app notification into the member's portal.
 */
export async function runReminders(actor: string) {
  const weekAgo = Date.now() - 7 * 86_400_000;
  const fresh = (memberId: string | undefined, lastRemindedAt: string | null | undefined) => !memberId || !lastRemindedAt || +new Date(lastRemindedAt) < weekAgo;

  const mm = new Map((await listMembers()).map((m) => [m.id, m]));
  const overdue = (await resolveAudience({ type: "overdue" })).filter((r) => fresh(r.memberId, mm.get(r.memberId!)?.lastReminderAt));
  const expiring = (await resolveAudience({ type: "expiring" })).filter((r) => fresh(r.memberId, mm.get(r.memberId!)?.lastReminderAt));

  const out = { overdue: 0, expiring: 0, eventUnpaid: 0, sent: 0, failed: 0 };
  if (overdue.length) {
    const r = await deliver({ recipients: overdue, channels: ["sms"], body: OVERDUE_SMS, sender: actor, kind: "auto-reminder", audience: "Overdue members (auto)", notify: { title: "Your membership is overdue", kind: "payment" } });
    out.overdue = overdue.length; out.sent += r.sent; out.failed += r.failed;
    await Promise.all(overdue.map((x) => x.memberId ? stampReminded(x.memberId) : null));
  }
  if (expiring.length) {
    const r = await deliver({ recipients: expiring, channels: ["sms"], body: EXPIRING_SMS, sender: actor, kind: "auto-reminder", audience: "Expiring members (auto)", notify: { title: "Your membership expires soon", kind: "payment" } });
    out.expiring = expiring.length; out.sent += r.sent; out.failed += r.failed;
    await Promise.all(expiring.map((x) => x.memberId ? stampReminded(x.memberId) : null));
  }

  // Unpaid event registrations for events starting within a week
  for (const e of (await listEvents()).filter((ev) => ev.status !== "cancelled" && +new Date(ev.startsAt) > Date.now() && +new Date(ev.startsAt) < Date.now() + 7 * 86_400_000)) {
    const unpaid = await resolveAudience({ type: "event_unpaid", id: e.id });
    if (!unpaid.length || !(await listRegistrations(e.id)).length) continue;
    const body = `SATA: Your registration for ${e.title} is not yet paid. Pay at sata.co.tz/portal/payments to confirm your place. Ticket {ticket}.`;
    const r = await deliver({ recipients: unpaid, channels: ["sms"], body, sender: actor, kind: "auto-reminder", audience: `Unpaid: ${e.title} (auto)`, notify: { title: `Payment due for ${e.title}`, kind: "event" } });
    out.eventUnpaid += unpaid.length; out.sent += r.sent; out.failed += r.failed;
  }
  return out;
}
