import Link from "next/link";
import type { ReactNode } from "react";
import type { EventType, SataEvent } from "@/lib/types";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const TZ = "Africa/Dar_es_Salaam";
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts }).format(new Date(iso));
export const fmtTime = (iso: string) => fmtDate(iso, { hour: "2-digit", minute: "2-digit" });
export const fmtRange = (e: SataEvent) => {
  if (e.datesTbc) return "2027 · dates to be announced";
  const a = fmtDate(e.startsAt, { day: "numeric", month: "short" });
  const b = fmtDate(e.endsAt, { day: "numeric", month: "short", year: "numeric" });
  return a === fmtDate(e.endsAt, { day: "numeric", month: "short" }) ? b : `${a} – ${b}`;
};

export const EVENT_LABEL: Record<EventType, string> = {
  conference: "Conference", agm: "Conference & AGM", workshop: "Workshop", webinar: "Webinar", meeting: "Meeting", marathon: "Marathon", training: "Training",
};

const TONES = {
  blue: "bg-blue/10 text-blue",
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-vigil/10 text-vigil",
  grey: "bg-slate-100 text-slate-600",
} as const;

export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[tone])}>{children}</span>;
}

export function Button({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "ghost" | "light"; className?: string }) {
  const v = {
    primary: "bg-blue text-white hover:bg-deep shadow-lg shadow-blue/25",
    ghost: "border border-line bg-white text-ink hover:border-blue hover:text-blue",
    light: "bg-white text-deep hover:bg-mist",
  }[variant];
  return (
    <Link href={href} className={cn("inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition", v, className)}>
      {children}
    </Link>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "red" }) {
  return (
    <div className="rounded-2xl border border-line/80 bg-white p-5 shadow-[0_1px_2px_rgba(11,31,51,.04)]">
      <div className="text-[12.5px] font-medium text-muted">{label}</div>
      <div className={cn("tabular mt-1.5 text-[28px] font-semibold leading-tight tracking-tight", tone === "red" ? "text-vigil" : "text-ink")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-7">
      {eyebrow && <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-blue">{eyebrow}</div>}
      <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink md:text-[30px]">{title}</h1>
      {children && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(11,31,51,.04)]", className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-line/70 px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[11.5px] uppercase tracking-wider text-muted">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-line/60 [&>tr:last-child]:border-0 [&_td]:px-3 [&_td]:py-3">{children}</tbody>
      </table>
    </div>
  );
}
