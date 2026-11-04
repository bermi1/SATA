"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center" role="alert">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue">Something went wrong</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold text-deep">We hit a problem loading this page.</h1>
      <p className="mt-3 text-muted">It is not you. Please try again, and if it keeps happening let the SATA secretariat know.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="rounded-full bg-blue px-6 py-3 text-sm font-semibold text-white hover:bg-deep">Try again</button>
        <Link href="/" className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-deep hover:border-blue">Home</Link>
      </div>
    </main>
  );
}
