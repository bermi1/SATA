import { headers } from "next/headers";
import { repo } from "./db";

/** Best-effort client address behind Vercel and other proxies. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

/** True when the browser says the request came from our own site (CSRF defence for cookie-authenticated writes). */
export async function sameOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return true; // non-browser clients and same-origin requests without an Origin header
  const host = h.get("x-forwarded-host") ?? h.get("host");
  try { return new URL(origin).host === host; } catch { return false; }
}

/** Returns a 429 Response when `key` has exceeded `max` hits within `windowMs`, otherwise null. */
export async function limited(key: string, max: number, windowMs: number): Promise<Response | null> {
  const hits = await repo().rateHit(key, windowMs);
  return hits > max
    ? Response.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429, headers: { "retry-after": String(Math.ceil(windowMs / 1000)) } })
    : null;
}
