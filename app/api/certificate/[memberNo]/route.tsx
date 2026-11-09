import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { authorizeDoc, categoryLabel, longDate, pngHeaders, verifyUrl } from "@/lib/doc-access";
import { listOfficers, listPartners, listPayments } from "@/lib/store";

// Membership certificate: clean, modern A4 landscape (2000 x 1414 PNG).
const W = 2000;
const H = 1414;
const NAVY = "#0a3d66";
const BLUE = "#127bc0";
const RED = "#e8141b";
const INK = "#0b1f33";
const MUTED = "#5b7185";
const LINE = "#dbe7f1";
const GOLD = "#b8923a";

/** The address printed on the certificate. The QR code always points to the live verification page. */
const DOMAIN = process.env.CERT_DOMAIN ?? "sata.co.tz";

const asData = async (rel: string) => {
  try {
    const ext = rel.split(".").pop()?.toLowerCase();
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
    return `data:${mime};base64,${await readFile(join(process.cwd(), "public", rel.replace(/^\//, "")), "base64")}`;
  } catch { return null; }
};
const logo = (await asData("brand/logo-360.png"))!;

// Soft concentric "vigilance" rings in the corner: the only ornament.
const rings = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">${Array.from({ length: 14 }, (_, i) => `<circle cx="900" cy="0" r="${120 + i * 52}" fill="none" stroke="${BLUE}" stroke-width="1.4" opacity="${0.16 - i * 0.01}"/>`).join("")}</svg>`).toString("base64")}`;

export async function GET(req: Request, { params }: { params: Promise<{ memberNo: string }> }) {
  const { memberNo } = await params;
  const auth = await authorizeDoc(req, memberNo, "certificate");
  if ("response" in auth) return auth.response;
  const m = auth.member;

  const [officers, partners, payments] = await Promise.all([listOfficers(), listPartners(), listPayments()]);
  const officer = (re: RegExp) => officers.find((o) => re.test(o.title.trim()));
  const president = officer(/^president$/i);
  const secretary = officer(/^(secretary general|general secretary)$/i);

  // Membership period: from the latest subscription/registration payment (or approval) to the paid-through date.
  const paid = payments.filter((p) => p.memberId === m.id && (p.purpose === "subscription" || p.purpose === "registration")).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const start = paid?.createdAt ?? (m.application?.approvedAt as string | undefined) ?? m.joinedAt;
  const lifetime = !m.paidThrough;
  const from = longDate(start);
  const to = lifetime ? "Lifetime" : longDate(m.paidThrough);
  const progress = lifetime ? 1 : Math.min(1, Math.max(0.04, (Date.now() - new Date(start).getTime()) / (new Date(m.paidThrough!).getTime() - new Date(start).getTime() || 1)));

  const url = verifyUrl(m.memberNo);
  const qr = await QRCode.toDataURL(url, { margin: 0, width: 260, color: { dark: NAVY, light: "#ffffff" } });
  const cat = categoryLabel(m);
  const article = /^[aeiou]/i.test(cat) ? "an" : "a";
  const nameSize = m.name.length > 30 ? 92 : m.name.length > 22 ? 108 : 124;
  const logos = (await Promise.all(partners.slice(0, 6).map(async (p) => (p.logo?.startsWith("/") && !p.logo.startsWith("/api/") ? { name: p.name, src: await asData(p.logo) } : null)))).filter((x): x is { name: string; src: string } => !!x?.src);

  const label = (t: string) => <div style={{ display: "flex", fontSize: 21, letterSpacing: 4, fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>{t}</div>;
  const sig = (name: string | undefined, role: string) => (
    <div style={{ display: "flex", flexDirection: "column", width: 440 }}>
      <div style={{ display: "flex", height: 44, alignItems: "flex-end", fontSize: 30, fontWeight: 600, color: INK }}>{name ?? ""}</div>
      <div style={{ display: "flex", height: 2, background: INK, marginTop: 10, opacity: 0.7 }} />
      <div style={{ display: "flex", marginTop: 10, fontSize: 22, letterSpacing: 3, fontWeight: 700, color: BLUE, textTransform: "uppercase" }}>{role}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", background: "#ffffff", fontFamily: "Geist, sans-serif", position: "relative" }}>
        {/* Navy side panel */}
        <div style={{ width: 470, height: H, display: "flex", flexDirection: "column", alignItems: "center", background: `linear-gradient(180deg, ${NAVY} 0%, #072c4b 100%)`, color: "#ffffff", padding: "110px 50px 90px" }}>
          <div style={{ width: 240, height: 240, borderRadius: 120, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 50px rgba(0,0,0,.25)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={186} height={186} alt="" />
          </div>
          <div style={{ display: "flex", marginTop: 40, fontSize: 64, fontWeight: 800, letterSpacing: 6 }}>SATA</div>
          <div style={{ display: "flex", marginTop: 6, fontSize: 22, letterSpacing: 4, opacity: 0.7 }}>EST. 2002 · TANZANIA</div>
          <div style={{ display: "flex", width: 60, height: 4, background: RED, marginTop: 34, borderRadius: 2 }} />
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 4, opacity: 0.65 }}>MEMBER NUMBER</div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 52, fontWeight: 700, letterSpacing: 3 }}>{m.memberNo}</div>
          <div style={{ display: "flex", marginTop: 44, padding: 16, background: "#ffffff", borderRadius: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={200} height={200} alt="" />
          </div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 20, opacity: 0.75 }}>Scan to verify membership</div>
        </div>

        {/* Content */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={rings} width={900} height={900} alt="" style={{ position: "absolute", right: 0, top: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "110px 120px 70px 110px", position: "relative" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 7, fontWeight: 700, color: BLUE, textTransform: "uppercase" }}>Society of Anaesthesiologists of Tanzania</div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 92, fontWeight: 700, color: NAVY, letterSpacing: -2, lineHeight: 1 }}>Certificate of Membership</div>
          <div style={{ display: "flex", marginTop: 56, fontSize: 30, color: MUTED }}>This certifies that</div>
          <div style={{ display: "flex", marginTop: 12, fontSize: nameSize, fontWeight: 700, color: INK, letterSpacing: -2, lineHeight: 1.05 }}>{m.name}</div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 32, lineHeight: 1.45, color: "#33475b", maxWidth: 1240 }}>
            {`is ${article} ${cat} Member in good standing of the Society of Anaesthesiologists of Tanzania, committed to safe anaesthesia and critical care for every patient.`}
          </div>

          {/* Membership period */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 54, padding: "30px 36px", borderRadius: 24, background: "#f3f8fc", border: `1px solid ${LINE}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>{label("Membership from")}<div style={{ display: "flex", marginTop: 8, fontSize: 38, fontWeight: 700, color: NAVY }}>{from}</div></div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>{label("Category")}<div style={{ display: "flex", marginTop: 8, fontSize: 38, fontWeight: 700, color: NAVY }}>{cat}</div></div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>{label("Valid until")}<div style={{ display: "flex", marginTop: 8, fontSize: 38, fontWeight: 700, color: NAVY }}>{to}</div></div>
            </div>
            <div style={{ display: "flex", position: "relative", height: 14, marginTop: 24, borderRadius: 7, background: "#dbe7f1" }}>
              <div style={{ display: "flex", width: `${Math.round(progress * 100)}%`, height: 14, borderRadius: 7, background: `linear-gradient(90deg, ${NAVY}, ${BLUE})` }} />
            </div>
          </div>

          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            {sig(president?.name, "President")}
            {sig(secretary?.name, "Secretary General")}
          </div>

          {/* Partners + verification */}
          <div style={{ display: "flex", alignItems: "center", marginTop: 48, paddingTop: 26, borderTop: `1px solid ${LINE}` }}>
            <div style={{ display: "flex", fontSize: 18, letterSpacing: 4, fontWeight: 700, color: MUTED, marginRight: 26 }}>SUPPORTED BY</div>
            <div style={{ display: "flex", alignItems: "center", gap: 30, flex: 1 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logos.map((l) => <img key={l.name} src={l.src} alt="" height={46} style={{ height: 46, maxWidth: 150, objectFit: "contain" }} />)}
            </div>
            <div style={{ display: "flex", fontSize: 20, color: MUTED }}>{`Verify at ${DOMAIN}/verify · ${m.memberNo}`}</div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 470, right: 0, bottom: 0, height: 10, display: "flex", background: `linear-gradient(90deg, ${NAVY}, ${BLUE} 70%, ${RED})` }} />
        <div style={{ position: "absolute", left: 470, top: 0, bottom: 0, width: 6, display: "flex", background: GOLD, opacity: 0.85 }} />
      </div>
    ),
    { width: W, height: H, headers: pngHeaders(m.memberNo, "certificate", req) },
  );
}
