import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue">Error 404</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold text-deep">We could not find that page.</h1>
      <p className="mt-3 text-muted">The link may be out of date or the page may have moved.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-blue px-6 py-3 text-sm font-semibold text-white hover:bg-deep">Back to the home page</Link>
        <Link href="/contact" className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-deep hover:border-blue">Contact us</Link>
      </div>
    </main>
  );
}
