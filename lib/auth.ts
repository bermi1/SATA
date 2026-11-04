import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sameOrigin } from "./request";
import { secret } from "./secret";
import { getMember } from "./store";
import type { Member, Role } from "./types";

export const COOKIE = "sata_session";
const WEEK = 60 * 60 * 24 * 7;

const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");

export function makeToken(memberId: string) {
  const exp = Math.floor(Date.now() / 1000) + WEEK;
  const body = `${memberId}.${exp}`;
  return `${body}.${sign(body)}`;
}

function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const [id, exp, sig] = token.split(".");
  if (!id || !exp || !sig) return null;
  const expected = sign(`${id}.${exp}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return id;
}

export async function setSession(memberId: string) {
  (await cookies()).set(COOKIE, makeToken(memberId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: WEEK });
}
export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Member | null> {
  const id = readToken((await cookies()).get(COOKIE)?.value);
  if (!id) return null;
  const m = await getMember(id);
  return m && m.status !== "suspended" ? m : null;
}

export type Area = "members" | "applications" | "events" | "attendance" | "payments" | "announcements" | "support" | "departments" | "reports" | "audit" | "messaging" | "subscribers" | "site";

const MATRIX: Record<Exclude<Role, "member">, Area[]> = {
  secretariat: ["members", "applications", "events", "attendance", "announcements", "support", "departments", "reports", "audit", "messaging", "subscribers", "site"],
  treasurer: ["members", "payments", "reports", "events", "messaging", "subscribers"],
  leadership: ["members", "events", "attendance", "reports", "departments", "announcements", "audit", "payments", "messaging", "subscribers"],
};

export const can = (role: Role, area: Area) => role !== "member" && MATRIX[role].includes(area);
export const canWrite = (role: Role, area: Area) =>
  can(role, area) && !(role === "leadership" && ["members", "payments", "attendance", "events", "messaging", "subscribers"].includes(area));

export const isAdmin = (m: Member | null): m is Member => !!m && m.role !== "member";

/** For route handlers: returns the member or a 401/403 Response. */
export async function guard(area?: Area, write = true): Promise<Member | Response> {
  if (write && !(await sameOrigin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const m = await getSession();
  if (!m) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (area && !(write ? canWrite(m.role, area) : can(m.role, area))) return Response.json({ error: "You do not have permission for this action" }, { status: 403 });
  return m;
}

/** For pages: redirects unauthenticated or unauthorised visitors. */
export async function requirePage(area?: Area): Promise<Member> {
  const m = await getSession();
  if (!m) redirect("/login");
  if (area && !can(m.role, area)) redirect(m.role === "member" ? "/portal" : "/admin");
  return m;
}
