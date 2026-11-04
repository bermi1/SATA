"use client";

import { CalendarDays, LayoutDashboard, MessageSquareText, MoreHorizontal, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NavItem } from "./DashShell";

const PRIMARY: { href: string; label: string; icon: typeof Users }[] = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/messaging", label: "Messages", icon: MessageSquareText },
];

// Phone navigation for the admin console: four key areas plus a "More" sheet with everything else.
export function AdminTabs({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the sheet on navigation
  useEffect(() => setOpen(false), [path]);
  const allowed = new Set(items.map((i) => i.href));
  const primary = PRIMARY.filter((p) => allowed.has(p.href));
  const rest = items.filter((i) => !primary.some((p) => p.href === i.href));
  const active = (h: string) => (h === "/admin" ? path === h : path.startsWith(h));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More">
          <button className="absolute inset-0 bg-ink/50" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mb-3 flex items-center justify-between"><div className="font-display text-lg font-extrabold text-deep">More</div><button onClick={() => setOpen(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-mist"><X className="size-5" /></button></div>
            <ul className="grid gap-1">
              {rest.map((i) => (
                <li key={i.href}><Link href={i.href} className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-semibold ${active(i.href) ? "bg-blue text-white" : "text-ink hover:bg-mist"}`}>{i.label}{!!i.badge && <span className="rounded-full bg-vigil px-2 py-0.5 text-xs text-white">{i.badge}</span>}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Admin tabs">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {primary.map((p) => (
            <li key={p.href}><Link href={p.href} aria-current={active(p.href) ? "page" : undefined} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${active(p.href) ? "text-blue" : "text-slate-500"}`}><span className={`grid h-7 w-12 place-items-center rounded-full ${active(p.href) ? "bg-blue/10" : ""}`}><p.icon className="size-5" /></span>{p.label}</Link></li>
          ))}
          <li><button onClick={() => setOpen(true)} className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-slate-500"><span className="relative grid h-7 w-12 place-items-center rounded-full"><MoreHorizontal className="size-5" />{rest.some((r) => r.badge) && <span className="absolute right-2 top-0 size-2 rounded-full bg-vigil" />}</span>More</button></li>
        </ul>
      </nav>
    </>
  );
}
