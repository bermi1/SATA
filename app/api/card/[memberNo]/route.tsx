import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { authorizeDoc, categoryLabel, longDate, pngHeaders, verifyUrl } from "@/lib/doc-access";

// Digital membership ID card (credit-card ratio, 1012 x 638 PNG).
const W = 1012;
const H = 638;
const DOMAIN = process.env.CERT_DOMAIN ?? "sata.co.tz";
const logoWhite = `data:image/png;base64,${await readFile(join(process.cwd(), "public/brand/logo-white-360.png"), "base64")}`;
const rings = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="638">${Array.from({ length: 10 }, (_, i) => `<circle cx="640" cy="638" r="${90 + i * 46}" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="${0.1 - i * 0.008}"/>`).join("")}</svg>`).toString("base64")}`;

export async function GET(req: Request, { params }: { params: Promise<{ memberNo: string }> }) {
  const { memberNo } = await params;
  const auth = await authorizeDoc(req, memberNo, "card");
  if ("response" in auth) return auth.response;
  const m = auth.member;
  const qr = await QRCode.toDataURL(verifyUrl(m.memberNo), { margin: 0, width: 300, color: { dark: "#0a3d66", light: "#ffffff" } });
  const valid = m.paidThrough ? longDate(m.paidThrough) : "Lifetime";
  const nameSize = m.name.length > 26 ? 40 : m.name.length > 18 ? 48 : 54;

  const field = (label: string, value: string) => (
    <div style={{ display: "flex", flexDirection: "column", marginRight: 44 }}>
      <div style={{ display: "flex", fontSize: 14, letterSpacing: 3, color: "rgba(255,255,255,.6)", fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", marginTop: 6, fontSize: 24, fontWeight: 700, color: "#ffffff" }}>{value}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", borderRadius: 36, overflow: "hidden", fontFamily: "Geist, sans-serif", background: "#ffffff" }}>
        {/* Navy identity side */}
        <div style={{ width: 640, height: H, display: "flex", flexDirection: "column", position: "relative", padding: "44px 48px 42px", background: "linear-gradient(145deg, #072c4a 0%, #0a3d66 55%, #0f5c95 100%)", color: "#ffffff" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rings} width={640} height={638} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoWhite} width={88} height={88} alt="" />
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 18 }}>
              <div style={{ display: "flex", fontSize: 34, fontWeight: 700, letterSpacing: 3 }}>SATA</div>
              <div style={{ display: "flex", fontSize: 15, color: "rgba(255,255,255,.72)" }}>Society of Anaesthesiologists of Tanzania</div>
            </div>
          </div>
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", fontSize: 14, letterSpacing: 4, color: "#7cc4f5", fontWeight: 700 }}>MEMBER</div>
          <div style={{ display: "flex", marginTop: 8, fontSize: nameSize, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1 }}>{m.name}</div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 20, color: "rgba(255,255,255,.72)" }}>{m.cadre}</div>
          <div style={{ display: "flex", marginTop: 34 }}>
            {field("Member no.", m.memberNo)}
            {field("Category", categoryLabel(m))}
            {field("Valid until", valid)}
          </div>
        </div>

        {/* Verification side */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", background: "#ffffff" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, display: "flex", background: "linear-gradient(180deg, #127bc0, #e8141b)" }} />
          <div style={{ display: "flex", padding: 18, borderRadius: 24, border: "1px solid #dbe7f1", background: "#ffffff", boxShadow: "0 10px 30px rgba(11,31,51,.08)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={220} height={220} alt="" />
          </div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 18, fontWeight: 700, color: "#0a3d66" }}>Scan to verify</div>
          <div style={{ display: "flex", marginTop: 4, fontSize: 15, color: "#5b7185" }}>{`${DOMAIN}/verify`}</div>
          <div style={{ display: "flex", marginTop: 28, padding: "8px 18px", borderRadius: 999, background: m.status === "active" ? "#e7f6ee" : "#fdeceb", color: m.status === "active" ? "#137a46" : "#b4231b", fontSize: 15, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{m.status === "active" ? "In good standing" : m.status}</div>
        </div>
      </div>
    ),
    { width: W, height: H, headers: pngHeaders(m.memberNo, "card", req) },
  );
}
