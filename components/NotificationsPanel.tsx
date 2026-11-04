"use client";

import { useRouter } from "next/navigation";

export interface NoteItem { id: string; title: string; body: string; when: string; kind: string; read: boolean }

export function NotificationsPanel({ items }: { items: NoteItem[] }) {
  const router = useRouter();
  const unread = items.filter((i) => !i.read).length;
  return (
    <div>
      {unread > 0 && (
        <button onClick={async () => { await fetch("/api/portal/notifications", { method: "POST" }); router.refresh(); }} className="mb-3 text-xs font-bold text-blue">Mark {unread} as read</button>
      )}
      {items.length === 0 ? <p className="text-sm text-muted">No notifications yet. Payment reminders and receipts appear here.</p> : (
        <ul className="divide-y divide-line">
          {items.slice(0, 8).map((n) => (
            <li key={n.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.read ? "bg-slate-300" : n.kind === "payment" ? "bg-vigil" : "bg-blue"}`} aria-label={n.read ? "Read" : "Unread"} />
              <div className="min-w-0"><div className="text-sm font-semibold text-deep">{n.title}</div><div className="text-sm text-muted">{n.body}</div><div className="mt-0.5 text-xs text-slate-400">{n.when}</div></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
