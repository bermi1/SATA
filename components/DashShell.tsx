import Link from "next/link";
import { Logo } from "./Logo";
import { LogoutButton } from "./LogoutButton";
import { AdminTabs } from "./AdminTabs";
import { BottomTabs, SideLinks } from "./SideLinks";

export interface NavItem { href: string; label: string; badge?: number; short?: string }

export function DashShell({ title, subtitle, nav, user, bottomTabs, children }: { title: string; subtitle: string; nav: NavItem[]; user: { name: string; role: string }; bottomTabs?: boolean | "admin"; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-line bg-white lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col p-3 lg:p-4">
          <div className="flex items-center justify-between lg:block">
            <Link href="/" className="flex items-center gap-3 px-2 py-1.5" aria-label="SATA public site">
              <Logo size={38} />
              <div><div className="font-display text-sm font-extrabold leading-tight text-deep">{title}</div><div className="text-[11px] text-muted">{subtitle}</div></div>
            </Link>
            <LogoutButton className="rounded-full px-3 py-2 text-xs font-semibold text-slate-500 hover:text-vigil lg:hidden" />
          </div>
          <div className={bottomTabs ? "hidden lg:block" : ""}><SideLinks items={nav} /></div>
          <div className="mt-auto hidden border-t border-line pt-4 lg:block">
            <div className="truncate px-2 text-sm font-semibold text-deep">{user.name}</div>
            <div className="px-2 text-xs capitalize text-muted">{user.role}</div>
            <div className="mt-2 flex items-center justify-between px-1"><Link href="/" className="rounded-full px-2 py-1 text-xs font-medium text-slate-500 hover:text-blue">← Public site</Link><LogoutButton className="rounded-full px-2 py-1 text-xs font-medium text-slate-500 hover:text-vigil" /></div>
          </div>
        </div>
      </aside>
      <main className={`min-w-0 p-4 sm:p-6 md:p-8 ${bottomTabs ? "pb-28 lg:pb-8" : ""}`}>{children}</main>
      {bottomTabs === "admin" ? <AdminTabs items={nav} /> : bottomTabs ? <BottomTabs items={nav.slice(0, 6)} /> : null}
    </div>
  );
}
