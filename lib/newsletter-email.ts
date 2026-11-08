// Branded HTML for the weekly newsletter, plus delivery through Resend's batch endpoint.
import type { Newsletter, NewsletterItem } from "./types";

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sata-website-liard.vercel.app").replace(/\/$/, "");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const KIND_LABEL: Record<NewsletterItem["kind"], string> = {
  announcement: "From SATA", event: "SATA event", conference: "Conference", research: "Research", case: "Case report", safety: "Safety", news: "News", custom: "Highlight",
};
export const kindLabel = (k: NewsletterItem["kind"]) => KIND_LABEL[k] ?? "News";

const absolute = (u: string) => (/^https?:\/\//i.test(u) ? u : `${SITE()}${u.startsWith("/") ? "" : "/"}${u}`);

function itemHtml(it: NewsletterItem, n: number) {
  const href = esc(absolute(it.url));
  const img = it.image
    ? `<td width="96" valign="top" style="padding-right:14px"><a href="${href}"><img src="${esc(absolute(it.image))}" width="96" height="72" alt="" style="display:block;width:96px;height:72px;object-fit:cover;border-radius:8px;border:0;background:#eef3f8"></a></td>`
    : "";
  return `<tr><td style="padding:14px 0;border-top:1px solid #eef3f8">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      ${img}
      <td valign="top">
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${it.kind === "announcement" || it.kind === "event" ? "#e8141b" : "#127bc0"}">${n}. ${esc(kindLabel(it.kind))}${it.pinned ? " &middot; Featured" : ""}</div>
        <a href="${href}" style="display:block;margin:4px 0 4px;font-size:16px;font-weight:800;line-height:1.35;color:#0b1f33;text-decoration:none">${esc(it.title)}</a>
        <div style="font-size:13px;line-height:1.55;color:#33475b">${esc(it.summary)}</div>
        <div style="margin-top:6px;font-size:12px;color:#7a8ca0">${esc(it.source)} &middot; <a href="${href}" style="color:#127bc0;text-decoration:none;font-weight:700">Read more &rarr;</a></div>
      </td></tr></table></td></tr>`;
}

export function renderNewsletterText(nl: Pick<Newsletter, "subject" | "intro" | "items">) {
  return [nl.subject, "", nl.intro, "", ...nl.items.map((it, i) => `${i + 1}. ${it.title}\n${it.summary}\n${absolute(it.url)}\n`), `SATA - ${SITE()}`].join("\n");
}

export function renderNewsletter(nl: Pick<Newsletter, "subject" | "intro" | "items" | "weekOf">) {
  const site = SITE();
  const intro = esc(nl.intro).split(/\n{2,}/).map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#33475b">${p.replace(/\n/g, "<br>")}</p>`).join("");
  const week = new Date(`${nl.weekOf}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(nl.subject)}</title></head>
<body style="margin:0;padding:0;background:#eef3f8;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(nl.intro.slice(0, 120))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3f8;padding:32px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dbe7f1">
    <tr><td style="height:4px;background:linear-gradient(90deg,#0a3d66,#127bc0 70%,#e8141b);background-color:#127bc0;font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td align="center" style="padding:28px 32px 8px">
      <a href="${site}" style="text-decoration:none"><img src="${site}/brand/logo.png" width="72" alt="SATA" style="display:block;width:72px;height:auto;border:0"></a>
      <div style="margin-top:12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#127bc0">Society of Anaesthesiologists of Tanzania</div>
    </td></tr>
    <tr><td style="padding:16px 36px 4px">
      <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#7a8ca0">Week of ${esc(week)}</div>
      <div style="padding:6px 0 14px;font-size:24px;font-weight:800;line-height:1.3;color:#0b1f33">${esc(nl.subject)}</div>
      ${intro}
    </td></tr>
    <tr><td style="padding:4px 36px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${nl.items.map((it, i) => itemHtml(it, i + 1)).join("")}</table>
    </td></tr>
    <tr><td align="center" style="padding:8px 36px 28px">
      <a href="${site}/news" style="display:inline-block;padding:13px 28px;border-radius:999px;background:#0a3d66;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">More news on sata.co.tz</a>
    </td></tr>
    <tr><td style="padding:20px 36px 28px;border-top:1px solid #eef3f8">
      <p style="margin:0;font-size:12px;line-height:1.6;color:#7a8ca0">
        <b style="color:#0a3d66">SATA Secretariat</b> &middot; Dar es Salaam, Tanzania<br>
        <a href="${site}" style="color:#127bc0;text-decoration:none">${site.replace(/^https?:\/\//, "")}</a> &middot; <a href="mailto:info@sata.co.tz" style="color:#127bc0;text-decoration:none">info@sata.co.tz</a>
      </p>
    </td></tr>
  </table>
  <p style="margin:16px 0 0;font-size:11px;color:#9aabbd">You receive this weekly digest as a SATA member or newsletter subscriber. To stop, reply with &ldquo;unsubscribe&rdquo; or write to <a href="mailto:info@sata.co.tz?subject=Unsubscribe" style="color:#9aabbd">info@sata.co.tz</a>.</p>
</td></tr>
</table>
</body></html>`;
}

export interface BatchResult { sent: number; failed: number; demo: boolean; error?: string }

/** Sends through Resend's batch endpoint, 100 messages per call. Without RESEND_API_KEY nothing is sent (demo). */
export async function sendNewsletterBatch(nl: Pick<Newsletter, "subject" | "intro" | "items" | "weekOf">, recipients: string[], subjectPrefix = ""): Promise<BatchResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: recipients.length, failed: 0, demo: true };
  const subject = subjectPrefix + nl.subject;
  const html = renderNewsletter(nl);
  const text = renderNewsletterText(nl);
  const from = process.env.EMAIL_FROM ?? "SATA <info@sata.co.tz>";
  const replyTo = process.env.EMAIL_REPLY_TO ?? "info@sata.co.tz";
  let sent = 0, failed = 0, error: string | undefined;
  for (let i = 0; i < recipients.length; i += 100) {
    const chunk = recipients.slice(i, i + 100);
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(chunk.map((to) => ({ from, to: [to], subject, html, text, reply_to: replyTo }))),
      });
      if (res.ok) sent += chunk.length;
      else { failed += chunk.length; error = `HTTP ${res.status}`; }
    } catch (e) {
      failed += chunk.length;
      error = e instanceof Error ? e.message : "Send failed";
    }
  }
  return { sent, failed, demo: false, error };
}
