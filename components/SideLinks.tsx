"use client";

import {
  Banknote, BarChart3, BookOpen, CalendarCheck, CalendarDays, CircleUser, ClipboardCheck, FileClock, Globe, House, Images, LayoutDashboard, LifeBuoy, Mail, Megaphone,
  MessageSquareText, Network, Send, ShieldCheck, UserCog, Users, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./DashShell";

const ICONS: Record<string, LucideIcon> = {
  "/portal": House, "/portal/events": CalendarCheck, "/portal/calendar": CalendarDays, "/portal/payments": Banknote, "/portal/library": BookOpen,
  "/portal/submit": Send, "/portal/support": LifeBuoy, "/portal/profile": CircleUser,
  "/admin": LayoutDashboard, "/admin/applications": ClipboardCheck, "/admin/members": Users, "/admin/payments": Banknote, "/admin/events": CalendarCheck,
  "/admin/calendar": CalendarDays, "/admin/messaging": MessageSquareText, "/admin/subscribers": Mail, "/admin/newsletter": Send, "/admin/comms": Megaphone,
  "/admin/library": BookOpen, "/admin/site": Globe, "/admin/gallery": Images, "/admin/departments": Network, "/admin/reports": BarChart3, "/admin/audit": FileClock,
  "/admin/team": UserCog,
};
export const iconFor = (href: string): LucideIcon => ICONS[href.replace(/[?#].*$/, "")] ?? (href.startsWith("/admin") ? ShieldCheck : House);

const isActive = (href: string, path: string) => href === path || (href.split("/").length > 2 && path.startsWith(href));

// Grouped, icon-led navigation on the navy sidebar (desktop).
export function SideLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const groups: { name: string; items: NavItem[] }[] = [];
  for (const i of items) {
    const g = i.group ?? "";
    const last = groups[groups.length - 1];
    if (last && last.name === g) last.items.push(i); else groups.push({ name: g, items: [i] });
  }
  return (
    <nav className="mt-6 grid gap-5" aria-label="Dashboard">
      {groups.map((g) => (
        <div key={g.name || "main"}>
          {g.name && <div className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/40">{g.name}</div>}
          <ul className="grid gap-0.5">
            {g.items.map((i) => {
              const active = isActive(i.href, path);
              const Icon = iconFor(i.href);
              return (
                <li key={i.href}>
                  <Link href={i.href} aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition ${active ? "bg-white/[.12] text-white" : "text-white/70 hover:bg-white/[.06] hover:text-white"}`}>
                    {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-sky-300" />}
                    <Icon className={`size-[17px] shrink-0 ${active ? "text-sky-300" : "text-white/50 group-hover:text-white/80"}`} strokeWidth={1.9} />
                    <span className="min-w-0 flex-1 truncate">{i.label}</span>
                    {!!i.badge && <span className="rounded-full bg-vigil px-1.5 py-px text-[10.5px] font-semibold text-white tabular">{i.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

const SHORT: Record<string, string> = { "/portal": "Home", "/portal/events": "Events", "/portal/payments": "Payments", "/portal/library": "Library", "/portal/support": "Help", "/portal/profile": "Profile" };
const TAB_ORDER = ["/portal", "/portal/events", "/portal/payments", "/portal/library", "/portal/profile"];

// Thumb-reach navigation for phones: five clear tabs.
export function BottomTabs({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const tabs = TAB_ORDER.map((h) => items.find((i) => i.href === h)).filter((i): i is NavItem => !!i);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Portal tabs">
      <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((i) => {
          const Icon = iconFor(i.href);
          const active = path === i.href || (i.href !== "/portal" && path.startsWith(i.href));
          return (
            <li key={i.href}>
              <Link href={i.href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active ? "text-deep" : "text-slate-500"}`} aria-current={active ? "page" : undefined}>
                <span className={`grid h-7 w-14 place-items-center rounded-full transition ${active ? "bg-blue/10 text-blue" : ""}`}><Icon className="size-[19px]" strokeWidth={1.9} /></span>
                {SHORT[i.href] ?? i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
