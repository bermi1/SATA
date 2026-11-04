"use client";

import { Banknote, CalendarCheck, CalendarDays, CircleUser, House, LifeBuoy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./DashShell";

const isActive = (href: string, path: string) => href === path || (href.split("/").length > 2 && path.startsWith(href));

export function SideLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="mt-3 flex gap-1 overflow-x-auto pb-1 lg:mt-4 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Dashboard">
      {items.map((i) => {
        const active = isActive(i.href, path);
        return (
          <Link key={i.href} href={i.href} className={`flex shrink-0 items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${active ? "bg-blue text-white shadow-md shadow-blue/25" : "text-slate-600 hover:bg-blue/10 hover:text-blue"}`}>
            {i.label}
            {!!i.badge && <span className={`ml-3 rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-white/25 text-white" : "bg-vigil text-white"}`}>{i.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

const ICONS: Record<string, LucideIcon> = { "/portal": House, "/portal/events": CalendarCheck, "/portal/calendar": CalendarDays, "/portal/payments": Banknote, "/portal/support": LifeBuoy, "/portal/profile": CircleUser };
const SHORT: Record<string, string> = { "/portal": "Home", "/portal/events": "Events", "/portal/calendar": "Calendar", "/portal/payments": "Pay", "/portal/support": "Help", "/portal/profile": "Profile" };

// Thumb-reach navigation for phones.
export function BottomTabs({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Portal tabs">
      <ul className="mx-auto grid max-w-md grid-cols-6">
        {items.map((i) => {
          const Icon = ICONS[i.href] ?? House;
          const active = path === i.href || (i.href !== "/portal" && path.startsWith(i.href));
          return (
            <li key={i.href}>
              <Link href={i.href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${active ? "text-blue" : "text-slate-500"}`} aria-current={active ? "page" : undefined}>
                <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? "bg-blue/10" : ""}`}><Icon className="size-5" /></span>
                {SHORT[i.href] ?? i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
