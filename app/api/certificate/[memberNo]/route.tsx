import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { authorizeDoc, categoryLabel, longDate, pngHeaders, verifyUrl } from "@/lib/doc-access";
import { listOfficers } from "@/lib/store";

const W = 2000;
const H = 1414;
const NAVY = "#0a3d66";
const GOLD = "#b8923a";
const GOLD_L = "#d9bd73";

const logo = `data:image/png;base64,${await readFile(join(process.cwd(), "public/brand/logo-360.png"), "base64")}`;

// Guilloche-style border: interlaced sine waves along each edge plus spirograph rosettes in the corners.
function wave(x0: number, y0: number, len: number, amp: number, cycles: number, phase: number, vertical: boolean) {
  const steps = 240;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = Math.sin(t * cycles * Math.PI * 2 + phase) * amp;
    const x = vertical ? x0 + a : x0 + t * len;
    const y = vertical ? y0 + t * len : y0 + a;
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

function rosette(cx: number, cy: number, r: number, color: string) {
  let out = "";
  for (let i = 0; i < 18; i++) out += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.38}" transform="rotate(${i * 10} ${cx} ${cy})" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.8"/>`;
  out += `<circle cx="${cx}" cy="${cy}" r="${r * 0.2}" fill="none" stroke="${GOLD}" stroke-width="2"/>`;
  return out;
}

function backgroundSvg() {
  const m = 46; // outer margin
  const band = 58; // guilloche band thickness
  const x1 = m, y1 = m, x2 = W - m, y2 = H - m;
  let lines = "";
  const colors = [NAVY, GOLD, "#127bc0", GOLD_L];
  for (let k = 0; k < 4; k++) {
    const ph = (k * Math.PI) / 2;
    const amp = band / 2 - 8;
    const cy = band / 2;
    lines += `<path d="${wave(x1, y1 + cy, x2 - x1, amp, 46, ph, false)}" stroke="${colors[k]}" fill="none" stroke-width="1.4" opacity="0.75"/>`;
    lines += `<path d="${wave(x1, y2 - cy, x2 - x1, amp, 46, ph + 1, false)}" stroke="${colors[k]}" fill="none" stroke-width="1.4" opacity="0.75"/>`;
    lines += `<path d="${wave(x1 + cy, y1, y2 - y1, amp, 32, ph, true)}" stroke="${colors[k]}" fill="none" stroke-width="1.4" opacity="0.75"/>`;
    lines += `<path d="${wave(x2 - cy, y1, y2 - y1, amp, 32, ph + 1, true)}" stroke="${colors[k]}" fill="none" stroke-width="1.4" opacity="0.75"/>`;
  }
  // Soft medallion behind the text.
  let medal = "";
  for (let i = 0; i < 36; i++) medal += `<ellipse cx="${W / 2}" cy="${H / 2}" rx="520" ry="190" transform="rotate(${i * 5} ${W / 2} ${H / 2})" fill="none" stroke="${NAVY}" stroke-width="1" opacity="0.045"/>`;
  const frame = (inset: number, w: number, c: string) => `<rect x="${x1 + inset}" y="${y1 + inset}" width="${x2 - x1 - inset * 2}" height="${y2 - y1 - inset * 2}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#fffdf8"/>
    ${medal}
    ${frame(0, 6, NAVY)}${frame(8, 1.5, GOLD)}${lines}${frame(band, 1.5, GOLD)}${frame(band + 8, 5, NAVY)}
    ${rosette(x1 + band / 2 + 2, y1 + band / 2 + 2, 62, GOLD)}${rosette(x2 - band / 2 - 2, y1 + band / 2 + 2, 62, GOLD)}
    ${rosette(x1 + band / 2 + 2, y2 - band / 2 - 2, 62, GOLD)}${rosette(x2 - band / 2 - 2, y2 - band / 2 - 2, 62, GOLD)}
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
const bg = backgroundSvg();

export async function GET(req: Request, { params }: { params: Promise<{ memberNo: string }> }) {
  const { memberNo } = await params;
  const auth = await authorizeDoc(req, memberNo, "certificate");
  if ("response" in auth) return auth.response;
  const m = auth.member;

  const officers = await listOfficers();
  const president = officers.find((o) => /^president$/i.test(o.title.trim()))?.name ?? "";
  const secretary = officers.find((o) => /^(general secretary|secretary general)$/i.test(o.title.trim()))?.name ?? "";
  const url = verifyUrl(m.memberNo);
  const qr = await QRCode.toDataURL(url, { margin: 0, width: 220, color: { dark: NAVY, light: "#ffffff" } });
  const admitted = longDate((m.application?.approvedAt as string | undefined) ?? m.joinedAt);
  const valid = m.category === "honorary" && !m.paidThrough ? "Lifetime" : longDate(m.paidThrough, "-");
  const nameSize = m.name.length > 34 ? 84 : m.name.length > 26 ? 100 : 118;

  const sig = (name: string, role: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 420 }}>
      <div style={{ display: "flex", height: 50, fontSize: 30, color: NAVY, fontWeight: 600 }}>{name}</div>
      <div style={{ display: "flex", width: 380, height: 2, background: NAVY }} />
      <div style={{ display: "flex", marginTop: 10, fontSize: 24, letterSpacing: 6, color: GOLD, fontWeight: 700, textTransform: "uppercase" }}>{role}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", fontFamily: "Geist, sans-serif" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} width={W} height={H} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
        <div style={{ position: "absolute", left: 150, right: 150, top: 150, bottom: 140, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={150} height={150} alt="" />
          <div style={{ display: "flex", marginTop: 18, fontSize: 30, letterSpacing: 9, color: NAVY, fontWeight: 700, textTransform: "uppercase" }}>Society of Anaesthesiologists of Tanzania</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 26 }}>
            <div style={{ display: "flex", width: 160, height: 2, background: GOLD }} />
            <div style={{ display: "flex", width: 14, height: 14, background: GOLD, transform: "rotate(45deg)", margin: "0 18px" }} />
            <div style={{ display: "flex", width: 160, height: 2, background: GOLD }} />
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 104, fontWeight: 800, color: NAVY, letterSpacing: 2 }}>Certificate of Membership</div>
          <div style={{ display: "flex", marginTop: 34, fontSize: 32, color: "#5b6b7a", letterSpacing: 3 }}>This is to certify that</div>
          <div style={{ display: "flex", marginTop: 20, fontSize: nameSize, fontWeight: 800, color: NAVY, textAlign: "center" }}>{m.name}</div>
          <div style={{ display: "flex", width: 900, height: 3, background: GOLD, marginTop: 16 }} />
          <div style={{ display: "flex", marginTop: 26, fontSize: 36, color: "#33475b" }}>{`has been admitted as ${/^[aeiouh]/i.test(categoryLabel(m)) && !/^h(?!on)/i.test(categoryLabel(m)) ? "an" : "a"} ${categoryLabel(m)} Member of the Society`}</div>
          <div style={{ display: "flex", marginTop: 40, gap: 90 }}>
            {[["Member number", m.memberNo], ["Date admitted", admitted], ["Valid through", valid]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", fontSize: 22, letterSpacing: 5, color: GOLD, fontWeight: 700, textTransform: "uppercase" }}>{l}</div>
                <div style={{ display: "flex", marginTop: 8, fontSize: 38, fontWeight: 700, color: NAVY }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", width: "100%", alignItems: "flex-end", justifyContent: "space-between" }}>
            {sig(president, "President")}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", padding: 10, background: "#ffffff", border: `2px solid ${GOLD}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} width={150} height={150} alt="" />
              </div>
              <div style={{ display: "flex", marginTop: 10, fontSize: 20, color: "#5b6b7a" }}>{`Verify at ${url.replace(/^https?:\/\//, "")}`}</div>
            </div>
            {sig(secretary, "General Secretary")}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, headers: pngHeaders(m.memberNo, "certificate", req) },
  );
}
