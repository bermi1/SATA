import { ArrowLeft, Download, ExternalLink, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { canOpenResource, isPdfUrl } from "@/lib/library";
import { getResource } from "@/lib/store";
import { RESOURCE_LABEL } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const r = await getResource((await params).id);
  return r && r.status === "published" ? { title: r.title, description: r.description.slice(0, 160) } : { title: "Resource library" };
}

export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [r, me] = await Promise.all([getResource(id), getSession()]);
  if (!r) notFound();
  const open = canOpenResource(r, me);
  if (r.status !== "published" && !open) notFound();
  const file = `/api/resources/${r.id}/file`;
  const pdf = isPdfUrl(r.url);
  const next = encodeURIComponent(`/resources/${r.id}`);
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:py-16">
      <Link href="/resources" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue"><ArrowLeft className="size-4" /> Resource library</Link>
      <div className="mt-6 flex flex-wrap items-center gap-2"><Badge tone="blue">{RESOURCE_LABEL[r.kind]}</Badge>{r.year && <span className="text-sm font-semibold text-muted">{r.year}</span>}{r.status !== "published" && <Badge tone="amber">{r.status}</Badge>}</div>
      <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-deep sm:text-4xl">{r.title}</h1>
      {r.author && <p className="mt-2 text-muted">{r.author}</p>}
      <h2 className="mt-8 text-xs font-bold uppercase tracking-widest text-muted">Abstract</h2>
      <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-ink">{r.description}</p>

      {open ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={file} {...(pdf ? { target: "_blank", rel: "noreferrer" } : {})} className="inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue/25 hover:bg-deep"><ExternalLink className="size-4" />{pdf ? "Read online" : "Open"}</a>
          {pdf && <a href={`${file}?download=1`} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3 text-sm font-bold text-deep hover:border-blue hover:text-blue"><Download className="size-4" /> Download PDF</a>}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-blue/20 bg-gradient-to-br from-blue/5 to-white p-6">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-deep text-white"><Lock className="size-5" /></span><div className="font-display text-lg font-bold text-deep">Members only: sign in or join SATA</div></div>
          <p className="mt-2 text-sm text-muted">{me ? "Your membership is not active yet, so this file is locked. Complete your payment from the portal to unlock the library." : "Reading and downloading is for active SATA members."}</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {me ? <Link href="/portal/payments" className="rounded-full bg-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-deep">Go to payments</Link> : <Link href={`/login?next=${next}`} className="rounded-full bg-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-deep">Sign in</Link>}
            <Link href="/membership/apply" className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-deep hover:border-blue hover:text-blue">Join SATA</Link>
          </div>
        </div>
      )}
    </div>
  );
}
