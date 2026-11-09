import { createHmac, timingSafeEqual } from "node:crypto";
import { secret } from "./secret";

export type DocKind = "certificate" | "card";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const sig = (memberNo: string, kind: DocKind) => createHmac("sha256", secret()).update(`${memberNo}:${kind}`).digest("base64url");

export function docToken(memberNo: string, kind: DocKind) {
  return sig(memberNo, kind);
}

export function validDocToken(memberNo: string, kind: DocKind, t: string | null | undefined) {
  if (!t) return false;
  const a = Buffer.from(t);
  const b = Buffer.from(sig(memberNo, kind));
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Absolute, signed link that works without signing in (for emails). */
export const docLink = (memberNo: string, kind: DocKind, download = false) =>
  `${siteUrl()}/api/${kind}/${memberNo}?t=${docToken(memberNo, kind)}${download ? "&download=1" : ""}`;
