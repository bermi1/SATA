import { ChevronRight, FileCheck2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Badge, fmtDate, PageHeader } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { FEES, fmtTZS } from "@/lib/config";
import { listMembers } from "@/lib/store";

export default async function Applications() {
  await requirePage("applications");
  const pending = (await listMembers()).filter((m) => m.status === "pending").sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  return (
    <>
      <PageHeader eyebrow="Membership & finance" title="Applications">
        Open an application to check the applicant&apos;s details and proof of payment, then approve. Approval activates the member and emails their certificate and ID card.
      </PageHeader>
      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">No applications are waiting.</div>
      ) : (
        <ul className="grid gap-3">
          {pending.map((m) => {
            const a = (m.application ?? {}) as Record<string, unknown>;
            const paid = typeof a.amountPaid === "number" ? a.amountPaid : null;
            const fee = FEES[m.category].registration;
            const proof = typeof a.paymentProof === "string" && a.paymentProof;
            return (
              <li key={m.id}>
                <Link href={`/admin/applications/${m.id}`} className="group flex items-center gap-4 rounded-2xl border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(11,31,51,.04)] transition hover:-translate-y-0.5 hover:border-blue/40 hover:shadow-md sm:p-5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-deep/[.07] text-[15px] font-semibold text-deep">{m.name.split(/\s+/).filter((w) => !/^dr\.?$/i.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[15.5px] font-semibold text-ink group-hover:text-blue">{m.name}</span>
                      <Badge tone="blue">{FEES[m.category].label}</Badge>
                    </div>
                    <div className="mt-1 truncate text-[13px] text-muted">{[m.cadre, m.facility, m.region].filter(Boolean).join(" · ")}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                      <span className="text-muted">Applied {fmtDate(m.joinedAt)}</span>
                      {paid === null ? <span className="inline-flex items-center gap-1 text-muted"><TriangleAlert className="size-3.5" />No payment amount</span>
                        : <span className={`inline-flex items-center gap-1 font-medium ${paid < fee ? "text-amber-700" : "text-emerald-700"}`}>{paid < fee ? <TriangleAlert className="size-3.5" /> : <FileCheck2 className="size-3.5" />}Paid {fmtTZS(paid)} of {fmtTZS(fee)}</span>}
                      {proof && <span className="text-muted">Proof attached</span>}
                    </div>
                  </div>
                  <span className="hidden items-center gap-1 text-[13px] font-semibold text-blue sm:inline-flex">Review <ChevronRight className="size-4 transition group-hover:translate-x-0.5" /></span>
                  <ChevronRight className="size-5 shrink-0 text-muted sm:hidden" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
