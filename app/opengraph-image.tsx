import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The picture shown when a SATA link is shared (WhatsApp, Facebook, LinkedIn, X, email): logo + name.
export const alt = "SATA — Society of Anaesthesiologists of Tanzania";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logo = `data:image/png;base64,${await readFile(join(process.cwd(), "public/brand/logo-360.png"), "base64")}`;

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "linear-gradient(135deg, #0a3d66 0%, #127bc0 100%)", position: "relative", padding: "0 90px" }}>
        <div style={{ width: 380, height: 380, borderRadius: 190, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={300} height={300} alt="" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 70, color: "#ffffff" }}>
          <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>SATA</div>
          <div style={{ fontSize: 40, fontWeight: 700, marginTop: 24, lineHeight: 1.2 }}>Society of Anaesthesiologists</div>
          <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.2 }}>of Tanzania</div>
          <div style={{ fontSize: 26, marginTop: 28, color: "#cfe6f7" }}>Safe anaesthesia for every patient · Since 2002</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 12, background: "#e8141b" }} />
      </div>
    ),
    size,
  );
}
