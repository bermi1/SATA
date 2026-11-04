// SMS + email provider layer. Pick a provider with env vars; with none set the app runs in
// DEMO mode: messages are logged in the dashboard but nothing leaves the server.
//
//   SMS_PROVIDER=africastalking  AT_USERNAME=...  AT_API_KEY=...  AT_SENDER_ID=SATA
//   SMS_PROVIDER=beem            BEEM_API_KEY=...  BEEM_SECRET=...  BEEM_SENDER_ID=SATA
//   RESEND_API_KEY=...  EMAIL_FROM="SATA <info@sata.co.tz>"

export interface SendResult { to: string; ok: boolean; error?: string }

/** Normalise Tanzanian numbers to +255XXXXXXXXX. Returns null when it cannot be a valid number. */
export function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "255" + d.slice(1);
  else if (/^[67]\d{8}$/.test(d)) d = "255" + d;
  return /^255[67]\d{8}$/.test(d) ? "+" + d : null;
}

/** GSM-7 messages hold 160 chars (153 when concatenated); anything with other characters is Unicode (70 / 67). */
export function smsSegments(text: string): number {
  if (!text) return 0;
  const unicode = /[^\x20-\x7E\n]/.test(text);
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  return text.length <= single ? 1 : Math.ceil(text.length / multi);
}

export const smsProvider = () => process.env.SMS_PROVIDER ?? "demo";
export const emailProvider = () => (process.env.RESEND_API_KEY ? "resend" : "demo");

async function atSend(to: string[], message: string): Promise<SendResult[]> {
  const res = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: { apiKey: process.env.AT_API_KEY ?? "", Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: process.env.AT_USERNAME ?? "", to: to.join(","), message, ...(process.env.AT_SENDER_ID ? { from: process.env.AT_SENDER_ID } : {}) }),
  });
  const data = (await res.json().catch(() => ({}))) as { SMSMessageData?: { Recipients?: { number: string; status: string }[] } };
  const rows = data.SMSMessageData?.Recipients ?? [];
  return to.map((n) => {
    const r = rows.find((x) => x.number === n);
    return r ? { to: n, ok: r.status === "Success", error: r.status === "Success" ? undefined : r.status } : { to: n, ok: false, error: res.ok ? "No status returned" : `HTTP ${res.status}` };
  });
}

async function beemSend(to: string[], message: string): Promise<SendResult[]> {
  const auth = Buffer.from(`${process.env.BEEM_API_KEY}:${process.env.BEEM_SECRET}`).toString("base64");
  const res = await fetch("https://apisms.beem.africa/v1/send", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ source_addr: process.env.BEEM_SENDER_ID ?? "SATA", schedule_time: "", encoding: 0, message, recipients: to.map((n, i) => ({ recipient_id: i + 1, dest_addr: n.replace("+", "") })) }),
  });
  return to.map((n) => ({ to: n, ok: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` }));
}

/** Send one message text to many numbers. Same text for all; personalise before calling. */
export async function sendSms(to: string[], message: string): Promise<SendResult[]> {
  const numbers = [...new Set(to)];
  const provider = smsProvider();
  try {
    if (provider === "africastalking") {
      const out: SendResult[] = [];
      for (let i = 0; i < numbers.length; i += 100) out.push(...(await atSend(numbers.slice(i, i + 100), message)));
      return out;
    }
    if (provider === "beem") {
      const out: SendResult[] = [];
      for (let i = 0; i < numbers.length; i += 100) out.push(...(await beemSend(numbers.slice(i, i + 100), message)));
      return out;
    }
  } catch (e) {
    return numbers.map((n) => ({ to: n, ok: false, error: e instanceof Error ? e.message : "Send failed" }));
  }
  return numbers.map((n) => ({ to: n, ok: true })); // demo
}

export async function sendEmail(to: string, subject: string, text: string): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) return { to, ok: true }; // demo
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "SATA <info@sata.co.tz>", to, subject, text }),
    });
    return { to, ok: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return { to, ok: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}
