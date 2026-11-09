import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { authorizeDoc, categoryLabel, longDate, pngHeaders, verifyUrl } from "@/lib/doc-access";

const W = 1012;
const H = 638;
const logo = `data:image/png;base64,${await readFile(join(process.cwd(), "public/brand/logo-360.png"), "base64")}`;

export async function GET(req: Request, { params }: { params: Promise<{ memberNo: string }> }) {
  const { memberNo } = await params;
  const auth = await authorizeDoc(req, memberNo, "card");
  if ("response" in auth) return auth.response;
  const m = auth.member;
  const qr = await QRCode.toDataURL(verifyUrl(m.memberNo), { margin: 0, width: 240, color: { dark: "#0a3d66", light: "#ffffff" } });
  const valid = m.category === "honorary" && !m.paidThrough ? "Lifetime" : longDate(m.paidThrough, "-");
  const nameSize = m.name.length > 28 ? 40 : 48;

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: "linear-gradient(135deg, #072c4a 0%, #0a3d66 55%, #127bc0 130%)", color: "#ffffff", fontFamily: "Geist, sans-serif" }}>
        <div style={{ position: "absolute", right: -140, top: -140, width: 460, height: 460, borderRadius: 230, background: "rgba(255,255,255,0.06)", display: "flex" }} />
        <div style={{ position: "absolute", right: -60, bottom: -200, width: 420, height: 420, borderRadius: 210, background: "rgba(255,255,255,0.05)", display: "flex" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 10, background: "linear-gradient(90deg, #127bc0, #e8141b)", display: "flex" }} />
        <div style={{ position: "absolute", left: 48, right: 48, top: 40, bottom: 44, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", width: 92, height: 92, borderRadius: 46, background: "#ffffff", alignItems: "center", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} width={74} height={74} alt="" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 22 }}>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: 2 }}>SATA</div>
              <div style={{ display: "flex", fontSize: 18, color: "#cfe6f7", letterSpacing: 1 }}>Society of Anaesthesiologists of Tanzania</div>
            </div>
            <div style={{ display: "flex", flex: 1 }} />
            <div style={{ display: "flex", padding: "8px 20px", borderRadius: 30, border: "2px solid #d9bd73", color: "#d9bd73", fontSize: 20, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>{categoryLabel(m)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", maxWidth: 600 }}>
              <div style={{ display: "flex", fontSize: nameSize, fontWeight: 800, lineHeight: 1.1 }}>{m.name}</div>
              <div style={{ display: "flex", marginTop: 8, fontSize: 24, color: "#cfe6f7" }}>{m.cadre}</div>
              <div style={{ display: "flex", marginTop: 26, fontSize: 40, fontWeight: 700, letterSpacing: 6, color: "#d9bd73" }}>{m.memberNo}</div>
              <div style={{ display: "flex", marginTop: 6, fontSize: 18, letterSpacing: 3, color: "#cfe6f7", textTransform: "uppercase" }}>{`Valid through ${valid}`}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", padding: 12, background: "#ffffff", borderRadius: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} width={170} height={170} alt="" />
              </div>
              <div style={{ display: "flex", marginTop: 8, fontSize: 14, color: "#cfe6f7", letterSpacing: 2, textTransform: "uppercase" }}>Scan to verify</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, headers: pngHeaders(m.memberNo, "card", req) },
  );
}
