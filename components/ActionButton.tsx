"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  url: string;
  body?: Record<string, unknown>;
  label: string;
  variant?: "primary" | "ghost" | "danger";
  confirm?: string;
  doneLabel?: string;
}

const V = {
  primary: "bg-blue text-white hover:bg-deep",
  ghost: "border border-line bg-white text-ink hover:border-blue hover:text-blue",
  danger: "border border-vigil/30 bg-white text-vigil hover:bg-vigil/5",
};

export default function ActionButton({ url, body, label, variant = "primary", confirm: ask, doneLabel }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "err">("idle");
  const [err, setErr] = useState("");

  async function run() {
    if (ask && !window.confirm(ask)) return;
    setState("busy");
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) {
      setState("done");
      router.refresh();
    } else {
      setErr(data?.error ?? "Failed");
      setState("err");
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button onClick={run} disabled={state === "busy" || state === "done"} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${V[variant]}`}>
        {state === "busy" ? "…" : state === "done" ? doneLabel ?? "Done" : label}
      </button>
      {state === "err" && <span className="text-xs text-vigil">{err}</span>}
    </span>
  );
}
