import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, FileText, Mail, Phone, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ActionButton from "@/components/ActionButton";
import { Badge, fmtDate } from "@/components/ui";
import { canWrite, requirePage } from "@/lib/auth";
import { FEES, fmtTZS } from "@/lib/config";
import { getMember, listMembers } from "@/lib/store";

const text = (v: unknown) => (v === undefined || v === null || v === "" ? null : String(v));

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line/60 py-3 last:border-0 sm:grid-cols-[220px_1fr] sm:gap-4">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="text-[14.5px] font-medium text-ink">{value ?? <span className="font-normal text-muted">Not provided</span>}</dd>
    </div>
  );
}

function Section({ letter, title, children }: { letter: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(11,31,51,.04)]">
      <header className="flex items-center gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
        <span className="grid size-8 place-items-center rounded-lg bg-deep text-[13px] font-semibold text-white">{letter}</span>
        <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
      </header>
      <dl className="px-5 py-1 sm:px-6">{children}</dl>
    </section>
  );
}

function Doc({ url, label }: { url: string | null; label: string }) {
  if (!url) return <span className="font-normal text-muted">Not uploaded</span>;
  const isPdf = /\.pdf($|\?)/i.test(url);
  return (
    <div className="grid gap-3">
      {!isPdf && (
        <a href={url} target="_blank" rel="noreferrer" className="block w-full max-w-md overflow-hidden rounded-xl border border-line bg-mist">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="max-h-96 w-full object-contain" />
        </a>
      )}
      <a href={url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-blue transition hover:border-blue">
        {isPdf ? <FileText className="size-4" /> : <ExternalLink className="size-4" />} Open {label.toLowerCase()}
      </a>
    </div>
  );
}

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("applications");
  const { id } = await params;
  const m = await getMember(id);
  if (!m || m.demo) notFound();
  const a = (m.application ?? {}) as Record<string, unknown>;
  const writable = canWrite(me.role, "applications");
  const fee = FEES[m.category].registration;
  const paid = typeof a.amountPaid === "number" ? a.amountPaid : null;
  const short = paid !== null && paid < fee;

  // Previous / next pending application, in the order they arrived.
  const pending = (await listMembers()).filter((x) => x.status === "pending").sort((x, y) => x.joinedAt.localeCompare(y.joinedAt));
  const idx = pending.findIndex((x) => x.id === m.id);
  const prev = idx > 0 ? pending[idx - 1] : null;
  const next = idx >= 0 && idx < pending.length - 1 ? pending[idx + 1] : null;
  const statusTone = m.status === "active" ? "green" : m.status === "pending" ? "amber" : m.status === "suspended" ? "red" : "grey";

  return (
    <div className="pb-24 lg:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/applications" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-blue"><ArrowLeft className="size-4" /> All applications</Link>
        {idx >= 0 && (
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <span>{idx + 1} of {pending.length} waiting</span>
            {prev ? <Link href={`/admin/applications/${prev.id}`} aria-label="Previous application" className="grid size-8 place-items-center rounded-full border border-line bg-white hover:border-blue hover:text-blue"><ArrowLeft className="size-4" /></Link> : null}
            {next ? <Link href={`/admin/applications/${next.id}`} aria-label="Next application" className="grid size-8 place-items-center rounded-full border border-line bg-white hover:border-blue hover:text-blue"><ArrowRight className="size-4" /></Link> : null}
          </div>
        )}
      </div>

      {/* Applicant header */}
      <div className="mt-5 flex flex-col gap-5 rounded-2xl bg-gradient-to-br from-[#0a3d66] to-[#0f5c95] p-6 text-white sm:flex-row sm:items-center sm:p-7">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-semibold">{m.name.split(/\s+/).filter((w) => !/^dr\.?$/i.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><Badge tone={statusTone}>{m.status === "pending" ? "Waiting for review" : m.status}</Badge><span className="text-[13px] text-white/70">Applied {fmtDate(m.joinedAt, { day: "numeric", month: "long", year: "numeric" })}</span></div>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">{m.name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-white/80">
            <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 hover:text-white"><Mail className="size-4" />{m.email}</a>
            <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 hover:text-white"><Phone className="size-4" />{m.phone}</a>
          </div>
        </div>
        <div className="rounded-xl bg-white/10 px-4 py-3 text-[13px]">
          <div className="text-white/65">Applying as</div>
          <div className="mt-0.5 text-[16px] font-semibold">{FEES[m.category].label}</div>
        </div>
      </div>

      {/* Payment check */}
      <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 text-[14px] ${paid === null ? "border-line bg-white text-muted" : short ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
        {short || paid === null ? <TriangleAlert className="mt-0.5 size-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0" />}
        <div>
          {paid === null ? "No payment amount was given on this application." : short
            ? <>Paid <strong>{fmtTZS(paid)}</strong>, but the {FEES[m.category].label} registration fee is <strong>{fmtTZS(fee)}</strong>. Check the proof of payment before approving.</>
            : <>Paid <strong>{fmtTZS(paid)}</strong>, which covers the {FEES[m.category].label} registration fee of {fmtTZS(fee)}. Confirm it against the proof of payment below.</>}
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        <Section letter="A" title="Personal information">
          <Row label="Full name" value={m.name} />
          <Row label="Gender" value={text(a.gender)} />
          <Row label="Nationality" value={text(a.nationality)} />
          <Row label="Professional qualification" value={text(a.qualification)} />
          <Row label="Superspecialization" value={text(a.superspecialization) && `${a.superspecialization}${a.superspecializationDetails ? `: ${a.superspecializationDetails}` : ""}`} />
          <Row label="Medical Council registration no." value={text(a.councilNo)} />
          <Row label="Current employer / institution" value={text(a.employer) ?? m.facility} />
          <Row label="Job title / designation" value={text(a.jobTitle) ?? m.cadre} />
          <Row label="Years of practice" value={text(a.yearsOfPractice)} />
          <Row label="Practising licence (foreign applicants)" value={<Doc url={text(a.licence)} label="Practising licence" />} />
        </Section>

        <Section letter="B" title="Contact information">
          <Row label="Email address" value={m.email} />
          <Row label="Phone number" value={m.phone} />
          <Row label="Postal address" value={text(a.address)} />
          <Row label="Region" value={m.region} />
        </Section>

        <Section letter="C" title="Membership category">
          <Row label="Category applied for" value={FEES[m.category].label} />
          <Row label="Registration fee" value={fmtTZS(fee)} />
        </Section>

        <Section letter="D" title="Payment information">
          <Row label="Amount paid" value={paid !== null ? fmtTZS(paid) : null} />
          <Row label="Proof of payment" value={<Doc url={text(a.paymentProof)} label="Proof of payment" />} />
        </Section>

        <Section letter="E" title="Declaration">
          <Row label="Declaration" value={a.declaration ? "Agreed: “I agree and wish to become a member of SATA.”" : null} />
        </Section>
      </div>

      {/* Decision bar */}
      {writable && m.status === "pending" && (
        <div className="fixed inset-x-0 bottom-[64px] z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:sticky lg:bottom-0 lg:mt-6 lg:rounded-2xl lg:border lg:px-6 lg:pr-40 lg:shadow-lg">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
            <div className="hidden text-[13.5px] text-muted sm:block">Approving activates <strong className="font-semibold text-ink">{m.name}</strong> and emails their certificate and ID card.</div>
            <div className="flex w-full gap-2 sm:w-auto">
              <ActionButton url={`/api/admin/applications/${m.id}`} body={{ approve: false }} label="Decline" variant="danger" size="lg" confirm={`Decline ${m.name}'s application?`} doneLabel="Declined" redirect={next ? `/admin/applications/${next.id}` : "/admin/applications"} />
              <ActionButton url={`/api/admin/applications/${m.id}`} body={{ approve: true }} label="Approve membership" size="lg" doneLabel="Approved" redirect={next ? `/admin/applications/${next.id}` : "/admin/applications"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
