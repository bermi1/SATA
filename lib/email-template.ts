// Branded HTML email layout for every SATA email. Table-based, inline styles only, so it renders in Gmail, Outlook and phones.

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sata-website-liard.vercel.app").replace(/\/$/, "");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Plain text → paragraphs, with links made clickable.
function paragraphs(text: string) {
  return text.trim().split(/\n{2,}/).map((p) => {
    const html = esc(p).replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#127bc0;text-decoration:underline">$1</a>');
    return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#33475b">${html}</p>`;
  }).join("");
}

export interface EmailOptions {
  heading?: string;
  /** A large highlighted value, e.g. a sign-in code. */
  code?: string;
  button?: { label: string; href: string };
  /** Pictures shown in the email body (e.g. the membership certificate and ID card). */
  images?: { src: string; alt: string; href?: string; width?: number }[];
  /** Files attached to the email; Resend downloads each from its URL. */
  attachments?: { filename: string; path: string }[];
  preheader?: string;
}

export function renderEmail(subject: string, text: string, o: EmailOptions = {}) {
  const site = SITE();
  const pre = esc(o.preheader ?? text.split("\n")[0].slice(0, 120));
  const codeBlock = o.code
    ? `<tr><td align="center" style="padding:8px 0 24px">
         <div style="display:inline-block;padding:16px 28px;border-radius:12px;background:#f3f8fc;border:1px solid #dbe7f1;font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:10px;color:#0a3d66">${esc(o.code)}</div>
       </td></tr>`
    : "";
  const button = o.button
    ? `<tr><td align="center" style="padding:4px 0 24px">
         <a href="${esc(o.button.href)}" style="display:inline-block;padding:13px 28px;border-radius:999px;background:#0a3d66;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">${esc(o.button.label)}</a>
       </td></tr>`
    : "";

  const images = (o.images ?? []).map((im) => {
    const w = Math.min(im.width ?? 488, 488);
    const img = `<img src="${esc(im.src)}" width="${w}" alt="${esc(im.alt)}" style="display:block;width:100%;max-width:${w}px;height:auto;border:0;border-radius:10px;box-shadow:0 6px 18px rgba(11,31,51,.12)">`;
    return `<tr><td align="center" style="padding:6px 0 18px">${im.href ? `<a href="${esc(im.href)}">${img}</a>` : img}</td></tr>`;
  }).join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#eef3f8;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${pre}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3f8;padding:32px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dbe7f1">
    <tr><td style="height:4px;background:linear-gradient(90deg,#0a3d66,#127bc0 70%,#e8141b);background-color:#127bc0;font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td align="center" style="padding:28px 32px 8px">
      <a href="${site}" style="text-decoration:none"><img src="${site}/brand/logo.png" width="72" alt="SATA" style="display:block;width:72px;height:auto;border:0"></a>
      <div style="margin-top:12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#127bc0">Society of Anaesthesiologists of Tanzania</div>
    </td></tr>
    <tr><td style="padding:16px 36px 8px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:16px;font-size:22px;font-weight:800;line-height:1.3;color:#0b1f33">${esc(o.heading ?? subject)}</td></tr>
        <tr><td>${paragraphs(text)}</td></tr>
        ${codeBlock}${images}${button}
      </table>
    </td></tr>
    <tr><td style="padding:20px 36px 28px;border-top:1px solid #eef3f8">
      <p style="margin:0;font-size:12px;line-height:1.6;color:#7a8ca0">
        <b style="color:#0a3d66">SATA Secretariat</b> · Dar es Salaam, Tanzania<br>
        <a href="${site}" style="color:#127bc0;text-decoration:none">${site.replace(/^https?:\/\//, "")}</a> · <a href="mailto:info@sata.co.tz" style="color:#127bc0;text-decoration:none">info@sata.co.tz</a>
      </p>
    </td></tr>
  </table>
  <p style="margin:16px 0 0;font-size:11px;color:#9aabbd">You received this email because of your SATA membership or activity on our website.</p>
</td></tr>
</table>
</body></html>`;
}
