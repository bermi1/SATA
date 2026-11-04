import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = { title: "Verify a member", description: "Check whether a SATA member is in good standing." };

export default async function VerifyLookup({ searchParams }: { searchParams: Promise<{ no?: string }> }) {
  const { no } = await searchParams;
  const clean = no?.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (clean) redirect(`/verify/${clean}`);
  return (
    <>
      <PageHero eyebrow="Membership" title="Verify a member." crumbs={[["Verify a member"]]} intro="Employers, partners and colleagues can confirm that a SATA member is in good standing. You can also scan the QR code on a member&apos;s digital card." />
      <section className="mx-auto max-w-lg px-5 py-14">
        <form className="rounded-3xl border border-line bg-white p-7 shadow-sm">
          <ShieldCheck className="size-8 text-blue" aria-hidden />
          <label htmlFor="no" className="mt-4 block text-sm font-semibold text-deep">Membership number</label>
          <input id="no" name="no" required placeholder="SATA-0001" autoComplete="off" className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-mono text-sm uppercase tracking-widest outline-none focus:border-blue focus:ring-4 focus:ring-blue/10" />
          <button className="mt-5 w-full rounded-full bg-blue px-6 py-3 text-sm font-semibold text-white hover:bg-deep">Check membership</button>
          <p className="mt-4 text-xs text-muted">We show only the member&apos;s name, category and whether their subscription is current. No contact details are ever displayed.</p>
        </form>
      </section>
    </>
  );
}
