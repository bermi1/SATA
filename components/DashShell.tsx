import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "./Logo";
import { LogoutButton } from "./LogoutButton";
import { AdminTabs } from "./AdminTabs";
import { BottomTabs, SideLinks } from "./SideLinks";

export interface NavItem { href: string; label: string; badge?: number; short?: string; group?: string }

const initials = (n: string) => n.split(/\s+/).filter((w) => !/^(dr|prof|mr|mrs|ms|amb)\.?$/i.test(w)).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "S";

// Shared frame for the member portal and every committee console: navy sidebar on desktop, compact top bar + bottom tabs on phones.
export function DashShell({ title, subtitle, nav, user, bottomTabs, children }: { title: string; subtitle: string; nav: NavItem[]; user: { name: string; role: string }; bottomTabs?: boolean | "admin"; children: React.ReactNode }) {
  return (
    <div className="dash min-h-screen bg-[#f5f8fb] lg:grid lg:grid-cols-[272px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col bg-gradient-to-b from-[#0a3d66] to-[#06233d] text-white lg:flex">
        <Link href="/" className="flex items-center gap-3 px-5 pb-2 pt-6" aria-label="SATA public site">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white shadow-sm"><Logo size={34} /></span>
          <span className="min-w-0"><span className="block text-[15px] font-semibold leading-tight">{title}</span><span className="block truncate text-[11.5px] text-white/55">{subtitle}</span></span>
        </Link>
        <div className="dash-scroll flex-1 overflow-y-auto px-3 pb-4"><SideLinks items={nav} /></div>
        <div className="m-3 rounded-xl bg-white/[.07] p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-300/20 text-[13px] font-semibold text-sky-200">{initials(user.name)}</span>
            <div className="min-w-0"><div className="truncate text-[13px] font-semibold">{user.name}</div><div className="truncate text-[11.5px] text-white/55">{user.role}</div></div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
            <Link href="/" className="inline-flex items-center gap-1 text-[12px] font-medium text-white/60 hover:text-white">Public site <ArrowUpRight className="size-3.5" /></Link>
            <LogoutButton className="text-[12px] font-medium text-white/60 hover:text-red-300" />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Phone top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <Link href="/" className="flex items-center gap-2.5" aria-label="SATA public site">
            <Logo size={32} />
            <span><span className="block text-[14px] font-semibold leading-tight text-deep">{title}</span><span className="block text-[11px] text-muted">{subtitle}</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <LogoutButton className="rounded-full px-2.5 py-1.5 text-[12px] font-medium text-slate-500 hover:text-vigil" />
            <span className="grid size-8 place-items-center rounded-full bg-deep text-[12px] font-semibold text-white">{initials(user.name)}</span>
          </div>
        </header>
        {/* Admin consoles on phones: the section list stays reachable through the "More" sheet; portal uses bottom tabs. */}
        <main className={`mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-9 ${bottomTabs ? "pb-28 lg:pb-9" : ""}`}>{children}</main>
      </div>
      {bottomTabs === "admin" ? <AdminTabs items={nav} /> : bottomTabs ? <BottomTabs items={nav} /> : null}
    </div>
  );
}
