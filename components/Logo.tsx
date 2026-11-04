import Image from "next/image";
import Link from "next/link";

// The SATA mark stands free on the page: no box, no badge.
// "white" renders the same artwork in white for dark backgrounds.
export function Logo({ tone = "color", size = 44, withText = false, className = "" }: { tone?: "color" | "white"; size?: number; withText?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image src="/brand/logo.png" alt="SATA" width={size} height={Math.round(size * 0.9)} priority style={{ height: size * 0.9, width: "auto", filter: tone === "white" ? "brightness(0) invert(1)" : undefined }} />
      {withText && (
        <span className={`font-display text-[13px] font-extrabold uppercase leading-[1.15] tracking-wide ${tone === "white" ? "text-white" : "text-deep"}`}>
          Society of<br />Anaesthesiologists<br />of Tanzania
        </span>
      )}
    </span>
  );
}

export function LogoLink(props: Parameters<typeof Logo>[0]) {
  return <Link href="/" aria-label="SATA home"><Logo {...props} /></Link>;
}
