import type { ReactNode } from "react";
import { PageHero } from "./PageHero";

/** Shared layout for the privacy, terms and accessibility pages. */
export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} crumbs={[[title]]} intro={`Last updated ${updated}.`} />
      <article className="mx-auto max-w-3xl px-5 py-12 text-[15px] leading-relaxed text-ink [&_a]:font-semibold [&_a]:text-blue [&_a:hover]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-deep [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </article>
    </>
  );
}
