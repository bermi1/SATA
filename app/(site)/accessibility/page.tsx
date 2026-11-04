import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Accessibility", description: "SATA's commitment to an accessible website and how to report a barrier." };

export default function Accessibility() {
  return (
    <LegalPage eyebrow="Legal" title="Accessibility" updated="November 2026">
      <p>SATA wants everyone, including colleagues who use assistive technology, to be able to use this website. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 level AA.</p>

      <h2>What we do</h2>
      <ul>
        <li>Semantic page structure, keyboard-operable navigation and visible focus states.</li>
        <li>Text alternatives for meaningful images, and labels on every form field.</li>
        <li>Colour contrast chosen for readability, and layouts that adapt from phones to large screens.</li>
        <li>Moving content, such as the home-page carousel, can be paused with its controls and stops automatically for people who have asked their device to reduce motion.</li>
      </ul>

      <h2>Known limitations</h2>
      <p>Some older PDF publications were produced before this site and may not be fully accessible. If you need one in another format, tell us and we will provide it.</p>

      <h2>Tell us about a barrier</h2>
      <p>If something here is hard to use, email <a href="mailto:info@sata.co.tz">info@sata.co.tz</a> or call <a href="tel:+255754092507">+255 754 092 507</a> with the page and what went wrong. We will respond and work to fix it.</p>
    </LegalPage>
  );
}
