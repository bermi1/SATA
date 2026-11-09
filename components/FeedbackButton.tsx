"use client";

import { MessageSquarePlus, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Lets reviewers and staff leave a comment about the page they are on.
export function FeedbackButton({ prominent }: { prominent?: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | string>("idle");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    const res = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, page: path }) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) { setState("sent"); setMsg(""); } else setState(data?.error ?? "Could not send. Please try again.");
  }

  return (
    <>
      <button onClick={() => { setOpen(true); setState("idle"); }}
        className={`fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold shadow-xl transition lg:bottom-6 lg:right-6 ${prominent ? "bg-vigil text-white shadow-vigil/30 hover:bg-red-700" : "bg-white text-deep ring-1 ring-line hover:ring-blue/40"}`}>
        <MessageSquarePlus className="size-4" /> Feedback
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Leave feedback">
          <button aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/50" />
          <form onSubmit={send} className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><div className="text-[16px] font-semibold text-ink">Leave feedback</div><div className="mt-0.5 text-xs text-muted">About this page: <span className="font-medium text-ink">{path}</span></div></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-8 place-items-center rounded-full bg-mist"><X className="size-4" /></button>
            </div>
            {state === "sent" ? (
              <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Thank you. Your comment has reached the SATA team.</p>
            ) : (
              <>
                <textarea value={msg} onChange={(e) => setMsg(e.target.value)} required minLength={3} maxLength={3000} rows={5} autoFocus placeholder="What works well? What should change?"
                  className="mt-4 w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-blue focus:ring-4 focus:ring-blue/10" />
                {state !== "idle" && state !== "busy" && <p role="alert" className="mt-2 text-sm text-vigil">{state}</p>}
                <button disabled={state === "busy" || msg.trim().length < 3} className="mt-3 w-full rounded-full bg-blue py-3 text-sm font-semibold text-white transition hover:bg-deep disabled:opacity-50">{state === "busy" ? "Sending…" : "Send feedback"}</button>
              </>
            )}
          </form>
        </div>
      )}
    </>
  );
}
