"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export interface MenuGroup { label: string; href: string; external?: boolean; note?: string; children?: { label: string; href: string }[] }

export function MobileMenu({ groups, signedIn, home }: { groups: MenuGroup[]; signedIn: boolean; home: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  const close = () => setOpen(false);

  return (
    <>
      <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="relative grid size-10 place-items-center rounded-full bg-blue/10 lg:hidden">
        <span className={`absolute h-0.5 w-[18px] rounded bg-deep transition ${open ? "rotate-45" : "-translate-y-1.5"}`} />
        <span className={`absolute h-0.5 w-[18px] rounded bg-deep transition ${open ? "opacity-0" : ""}`} />
        <span className={`absolute h-0.5 w-[18px] rounded bg-deep transition ${open ? "-rotate-45" : "translate-y-1.5"}`} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#06233d] text-white lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex h-16 items-center justify-between px-5">
            <Logo tone="white" size={40} />
            <button aria-label="Close menu" onClick={close} className="grid size-10 place-items-center rounded-full border border-white/25 text-2xl">×</button>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
            {groups.map((g, i) => g.children ? (
              <details key={g.label} className="group rise border-b border-white/10" style={{ animationDelay: `${i * 35}ms` }}>
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between py-4 font-display text-2xl font-bold [&::-webkit-details-marker]:hidden">{g.label}<ChevronDown className="size-5 text-white/50 transition group-open:rotate-180" /></summary>
                <div className="grid gap-1 pb-4 pl-1">
                  <Link href={g.href} onClick={close} className="flex min-h-12 items-center text-base font-semibold text-sky-300">All of {g.label.toLowerCase()} →</Link>
                  {g.children.map((c) => <Link key={c.href} href={c.href} onClick={close} className="flex min-h-12 items-center rounded-lg px-1 text-base text-white/85 active:bg-white/10">{c.label}</Link>)}
                  {g.note && <p className="pb-1 pt-2 text-sm text-white/55">{g.note}</p>}
                </div>
              </details>
            ) : (
              <Link key={g.href} href={g.href} onClick={close} target={g.external ? "_blank" : undefined} rel={g.external ? "noreferrer" : undefined} className={`rise flex items-center justify-between border-b border-white/10 py-4 font-display text-2xl font-bold ${g.external ? "text-red-300" : ""}`} style={{ animationDelay: `${i * 35}ms` }}>
                {g.label}<span className="text-lg text-white/40">{g.external ? "↗" : "→"}</span>
              </Link>
            ))}
          </nav>
          <div className="grid grid-cols-2 gap-3 border-t border-white/10 p-5 pb-8">
            <Link href={signedIn ? home : "/membership/apply"} onClick={close} className={`rounded-full bg-white py-4 text-center text-base font-bold text-deep ${signedIn ? "col-span-2" : ""}`}>{signedIn ? "Open my account" : "Join SATA"}</Link>
            {!signedIn && <Link href="/login" onClick={close} className="order-first rounded-full border border-white/30 py-4 text-center text-base font-semibold">Sign in</Link>}
          </div>
        </div>
      )}
    </>
  );
}
