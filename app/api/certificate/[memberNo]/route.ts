import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { authorizeDoc, categoryLabel, longDate, verifyUrl } from "@/lib/doc-access";
import { listOfficers } from "@/lib/store";

// Membership certificate as a vector PDF (A4 landscape): crisp to print, small to email.
const W = 842;
const H = 595;
const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const NAVY = hex("#0a3d66");
const BLUE = hex("#127bc0");
const RED = hex("#e8141b");
const INK = hex("#0b1f33");
const MUTED = hex("#5b7185");
const GOLD = hex("#b8923a");
const LINE = hex("#dbe7f1");

/** Address printed on the certificate. The QR code always opens the live verification page. */
const DOMAIN = process.env.CERT_DOMAIN ?? "sata.co.tz";
const AFFILIATES = [["WFSA", "images/affiliates/wfsa.png"], ["CANECSA", "images/affiliates/canecsa.png"], ["MAT", "images/affiliates/mat.jpg"]] as const;

const file = (rel: string) => readFile(join(process.cwd(), "public", rel));

function center(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = INK, spacing = 0) {
  const width = font.widthOfTextAtSize(text, size) + spacing * (text.length - 1);
  if (!spacing) return page.drawText(text, { x: (W - width) / 2, y, size, font, color });
  let x = (W - width) / 2;
  for (const ch of text) { page.drawText(ch, { x, y, size, font, color }); x += font.widthOfTextAtSize(ch, size) + spacing; }
}

function fit(font: PDFFont, text: string, max: number, start: number, min: number) {
  let s = start;
  while (s > min && font.widthOfTextAtSize(text, s) > max) s -= 1;
  return s;
}

const drawImageFit = (page: PDFPage, img: PDFImage, cx: number, y: number, maxW: number, maxH: number) => {
  const s = Math.min(maxW / img.width, maxH / img.height);
  page.drawImage(img, { x: cx - (img.width * s) / 2, y, width: img.width * s, height: img.height * s });
};

export async function GET(req: Request, { params }: { params: Promise<{ memberNo: string }> }) {
  const { memberNo } = await params;
  const auth = await authorizeDoc(req, memberNo, "certificate");
  if ("response" in auth) return auth.response;
  const m = auth.member;

  const officers = await listOfficers();
  const officer = (re: RegExp) => officers.find((o) => re.test(o.title.trim()))?.name ?? "";
  const president = officer(/^president$/i);
  const secretary = officer(/^(secretary general|general secretary)$/i);
  const since = longDate((m.application?.approvedAt as string | undefined) ?? m.joinedAt);
  const renew = m.paidThrough ? longDate(m.paidThrough) : "Lifetime membership";
  const cat = categoryLabel(m);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`SATA Certificate of Membership · ${m.name}`);
  pdf.setAuthor("Society of Anaesthesiologists of Tanzania");
  pdf.setSubject(`${m.memberNo} · ${cat} Member`);
  const page = pdf.addPage([W, H]);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(await file("brand/logo-360.png"));
  const qr = await pdf.embedPng(await QRCode.toBuffer(verifyUrl(m.memberNo), { type: "png", margin: 0, width: 300, color: { dark: "#0a3d66", light: "#ffffff" } }));

  // Frame
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: NAVY, borderWidth: 2.2 });
  page.drawRectangle({ x: 25, y: 25, width: W - 50, height: H - 50, borderColor: GOLD, borderWidth: 0.6 });
  // Bottom accent bar
  const barY = 25, barW = (W - 50) / 3;
  page.drawRectangle({ x: 25, y: barY, width: barW, height: 5, color: NAVY });
  page.drawRectangle({ x: 25 + barW, y: barY, width: barW, height: 5, color: BLUE });
  page.drawRectangle({ x: 25 + barW * 2, y: barY, width: barW, height: 5, color: RED });

  // Header
  drawImageFit(page, logo, W / 2, 478, 92, 72);
  center(page, "SOCIETY OF ANAESTHESIOLOGISTS OF TANZANIA", 456, bold, 10.5, BLUE, 2.2);
  center(page, "Certificate of Membership", 412, bold, 34, NAVY);
  page.drawLine({ start: { x: W / 2 - 60, y: 398 }, end: { x: W / 2 + 60, y: 398 }, thickness: 1.2, color: GOLD });

  // Recipient
  center(page, "This is to certify that", 368, reg, 12.5, MUTED);
  const nameSize = fit(bold, m.name, 600, 38, 22);
  center(page, m.name, 326, bold, nameSize, INK);
  center(page, `has been admitted as ${/^[aeiou]/i.test(cat) ? "an" : "a"} ${cat} Member of the Society of Anaesthesiologists of Tanzania`, 298, reg, 12.5, hex("#33475b"));
  center(page, "and is entitled to the rights and privileges of membership.", 281, reg, 12.5, hex("#33475b"));

  // Details row
  const cols = [["MEMBER NUMBER", m.memberNo], ["MEMBERSHIP", `${cat} Member`], ["MEMBER SINCE", since], ["RENEWAL DUE", renew]];
  const colW = 160, startX = (W - colW * cols.length) / 2;
  page.drawLine({ start: { x: startX, y: 262 }, end: { x: startX + colW * cols.length, y: 262 }, thickness: 0.6, color: LINE });
  page.drawLine({ start: { x: startX, y: 212 }, end: { x: startX + colW * cols.length, y: 212 }, thickness: 0.6, color: LINE });
  cols.forEach(([label, value], i) => {
    const cx = startX + colW * i + colW / 2;
    const lw = bold.widthOfTextAtSize(label, 7.5) + 1.2 * (label.length - 1);
    let x = cx - lw / 2;
    for (const ch of label) { page.drawText(ch, { x, y: 244, size: 7.5, font: bold, color: MUTED }); x += bold.widthOfTextAtSize(ch, 7.5) + 1.2; }
    const vs = fit(bold, value, colW - 12, 13, 9);
    page.drawText(value, { x: cx - bold.widthOfTextAtSize(value, vs) / 2, y: 224, size: vs, font: bold, color: NAVY });
  });

  // Signatures and verification
  const sig = (name: string, role: string, cx: number) => {
    const ns = fit(bold, name, 190, 11.5, 8);
    page.drawText(name, { x: cx - bold.widthOfTextAtSize(name, ns) / 2, y: 138, size: ns, font: bold, color: INK });
    page.drawLine({ start: { x: cx - 105, y: 130 }, end: { x: cx + 105, y: 130 }, thickness: 0.8, color: INK });
    page.drawText(role, { x: cx - reg.widthOfTextAtSize(role, 9) / 2, y: 117, size: 9, font: reg, color: BLUE });
  };
  sig(president, "President", 200);
  sig(secretary, "Secretary General", W - 200);
  page.drawImage(qr, { x: W / 2 - 34, y: 112, width: 68, height: 68 });
  const verify = `Verify at ${DOMAIN}/verify · ${m.memberNo}`;
  page.drawText(verify, { x: (W - reg.widthOfTextAtSize(verify, 7.5)) / 2, y: 100, size: 7.5, font: reg, color: MUTED });

  // Affiliations
  center(page, "IN AFFILIATION WITH", 76, bold, 6.5, MUTED, 1.4);
  const imgs = await Promise.all(AFFILIATES.map(async ([, p]) => { try { const b = await file(p); return p.endsWith(".jpg") ? await pdf.embedJpg(b) : await pdf.embedPng(b); } catch { return null; } }));
  const present = imgs.filter((i): i is PDFImage => !!i);
  const slot = 90, total = slot * present.length;
  present.forEach((img, i) => drawImageFit(page, img, (W - total) / 2 + slot * i + slot / 2, 40, 72, 26));

  const bytes = await pdf.save();
  const download = new URL(req.url).searchParams.get("download");
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "cache-control": "private, no-store",
      "content-disposition": `${download ? "attachment" : "inline"}; filename="SATA-certificate-${m.memberNo}.pdf"`,
    },
  });
}
