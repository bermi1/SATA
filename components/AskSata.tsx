"use client";

import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = ["How do I join SATA?", "What events are coming up?", "How do I sign in to the portal?", "Tell me about AAAC 2027"];

// Renders [text](/link) and bare /paths as links; keeps everything else as plain text.
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\s\/[a-z][a-z0-9/_-]*)/gi);
  return <>{parts.map((p, i) => {
    const md = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (md) return md[2].startsWith("/") ? <Link key={i} href={md[2]} className="font-semibold text-blue underline">{md[1]}</Link> : <a key={i} href={md[2]} target="_blank" rel="noreferrer" className="font-semibold text-blue underline">{md[1]}</a>;
    const path = p.match(/^(\s)(\/[a-z][a-z0-9/_-]*)$/i);
    if (path) return <span key={i}>{path[1]}<Link href={path[2]} className="font-semibold text-blue underline">{path[2]}</Link></span>;
    return <span key={i}>{p.replace(/\*\*/g, "")}</span>;
  })}</>;
}

export function AskSata() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  async function ask(q: string) {
    q = q.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next.slice(-12) }) });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null))?.error ?? "Sorry, the assistant is unavailable right now.";
        setMsgs([...next, { role: "assistant", content: err }]);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setMsgs([...next, { role: "assistant", content: text }]);
      }
    } catch {
      setMsgs([...next, { role: "assistant", content: "Connection problem. Please try again." }]);
    } finally { setBusy(false); }
  }

  return (
    <>
      <button onClick={() => setOpen((v) => !v)} aria-label={open ? "Close Ask SATA" : "Ask SATA a question"}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-deep px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-deep/30 transition hover:bg-blue sm:bottom-6 sm:right-6">
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}<span className="hidden sm:inline">{open ? "Close" : "Ask SATA"}</span>
      </button>

      {open && (
        <div role="dialog" aria-label="Ask SATA" className="fixed inset-x-3 bottom-20 z-50 flex max-h-[min(640px,calc(100svh-7rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl shadow-ink/20 sm:inset-x-auto sm:right-6 sm:w-[380px]">
          <div className="flex items-center gap-3 bg-gradient-to-r from-deep to-blue px-4 py-3.5 text-white">
            <span className="grid size-9 place-items-center rounded-full bg-white/15"><Sparkles className="size-4" /></span>
            <div className="min-w-0"><div className="text-sm font-bold">Ask SATA</div><div className="text-[11px] text-white/75">Answers about the Society, events and membership</div></div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-mist/60 p-4 text-sm">
            {!msgs.length && (
              <>
                <p className="rounded-xl bg-white p-3 leading-relaxed text-ink shadow-sm">Habari! I can help with membership, events, the member portal and SATA&apos;s work. What would you like to know?</p>
                <div className="flex flex-wrap gap-2">{STARTERS.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-deep transition hover:border-blue hover:text-blue">{s}</button>)}</div>
              </>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 leading-relaxed ${m.role === "user" ? "rounded-br-sm bg-deep text-white" : "rounded-bl-sm bg-white text-ink shadow-sm"}`}>
                  {m.content ? (m.role === "assistant" ? <Rich text={m.content} /> : m.content) : <span className="inline-flex gap-1"><span className="size-1.5 animate-bounce rounded-full bg-muted" /><span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:120ms]" /><span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:240ms]" /></span>}
                </div>
              </div>
            ))}
            <div ref={end} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex items-center gap-2 border-t border-line p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} placeholder="Type your question…" aria-label="Your question"
              className="min-w-0 flex-1 rounded-full border border-line px-4 py-2.5 text-sm outline-none focus:border-blue" />
            <button disabled={busy || !input.trim()} aria-label="Send" className="grid size-10 shrink-0 place-items-center rounded-full bg-blue text-white transition hover:bg-deep disabled:opacity-40"><Send className="size-4" /></button>
          </form>
          <p className="px-4 pb-2.5 text-center text-[10px] text-muted">AI assistant · may make mistakes · not medical advice</p>
        </div>
      )}
    </>
  );
}
