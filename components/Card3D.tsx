"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";

export interface CardProps {
  name: string;
  memberNo: string;
  category: string;
  cadre: string;
  validUntil: string;
  good: boolean;
  verifyUrl: string;
}

// Digital membership card that tilts in 3D with the cursor. The logo stands free on the card, not in a box.
export default function Card3D(p: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) scale(1.02)`;
    el.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "perspective(900px) rotateY(0) rotateX(0)";
  };
  return (
    <div className="mx-auto w-full max-w-md" onPointerMove={move} onPointerLeave={reset}>
      <div
        ref={ref}
        className="card-3d relative aspect-[1.586] overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-2xl shadow-blue/20"
        style={{ ["--gx" as string]: "50%", ["--gy" as string]: "50%" }}
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue via-blue to-vigil" />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at var(--gx) var(--gy), rgba(18,123,192,.12), transparent 50%)" }} />
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-blue/5" />
        <div className="relative flex h-full flex-col justify-between" style={{ transform: "translateZ(30px)" }}>
          <div className="flex items-start justify-between gap-2">
            <Image src="/brand/logo.png" alt="SATA" width={64} height={58} className="h-[54px] w-auto" />
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${p.good ? "bg-emerald-100 text-emerald-800" : "bg-vigil/10 text-vigil"}`}>
              {p.good ? "Good standing" : "Renewal due"}
            </span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-display text-xl font-extrabold text-deep">{p.name}</div>
              <div className="mt-0.5 text-xs text-muted">{p.cadre} · {p.category}</div>
              <div className="mt-3 font-mono text-sm font-bold tracking-widest text-blue">{p.memberNo}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Valid until {p.validUntil}</div>
            </div>
            <div className="rounded-xl border border-line bg-white p-1.5"><QRCodeSVG value={p.verifyUrl} size={76} fgColor="#0a3d66" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
