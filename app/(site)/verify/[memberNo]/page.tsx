import type { Metadata } from "next";
import Link from "next/link";
import { fmtDate } from "@/components/ui";
import { FEES } from "@/lib/config";
import { getMemberByNo, isInGoodStanding } from "@/lib/store";

export const metadata: Metadata = { title: "Verify membership" };

// Public page opened by scanning the QR code on a member's digital card.
export default async function Verify({ params }: { params: Promise<{ memberNo: string }> }) {
  const m = await getMemberByNo((await params).memberNo);
  const good = m ? isInGoodStanding(m) : false;
  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <div className={`mx-auto grid size-20 place-items-center rounded-full text-4xl text-white ${!m ? "bg-slate-400" : good ? "bg-emerald-500" : "bg-vigil"}`}>{!m ? "?" : good ? "✓" : "!"}</div>
      <h1 className="mt-6 text-3xl font-extrabold text-deep">{!m ? "Not found" : good ? "Member in good standing" : "Membership not current"}</h1>
      {m ? (
        <div className="mt-8 rounded-3xl border border-line bg-white p-7 text-left">
          <div className="font-display text-2xl font-extrabold text-deep">{m.name}</div>
          <div className="mt-1 text-sm text-muted">{m.cadre} · {FEES[m.category].label}</div>
          <div className="mt-5 font-mono text-sm tracking-widest text-blue">{m.memberNo}</div>
          <div className="mt-1 text-xs text-muted">{m.paidThrough ? `Paid through ${fmtDate(m.paidThrough)}` : m.category === "honorary" ? "Honorary: no subscription" : "No active subscription"}</div>
        </div>
      ) : (
        <p className="mt-4 text-muted">No SATA member matches this number.</p>
      )}
      <Link href="/" className="mt-8 inline-block text-sm font-semibold text-blue hover:underline">sata.co.tz</Link>
    </div>
  );
}
