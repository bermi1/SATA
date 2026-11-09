import { getSession } from "./auth";
import { FEES } from "./config";
import { siteUrl, validDocToken, type DocKind } from "./links";
import { getMemberByNo } from "./store";
import type { Member } from "./types";

/** Resolves the member for a certificate/card request. Allowed: the member, an admin, or a valid signed `?t=` token. */
export async function authorizeDoc(req: Request, memberNo: string, kind: DocKind): Promise<{ member: Member } | { response: Response }> {
  const no = memberNo.trim().toUpperCase();
  const member = await getMemberByNo(no);
  if (!member) return { response: new Response("Not found", { status: 404 }) };
  const t = new URL(req.url).searchParams.get("t");
  let ok = validDocToken(member.memberNo, kind, t);
  if (!ok) {
    const me = await getSession();
    ok = !!me && (me.id === member.id || me.role !== "member");
  }
  if (!ok) return { response: new Response("Forbidden", { status: 403 }) };
  if (member.status === "pending" || member.status === "suspended") return { response: new Response("Membership is not active", { status: 409 }) };
  return { member };
}

export const verifyUrl = (memberNo: string) => `${siteUrl()}/verify?no=${memberNo}`;
export const categoryLabel = (m: Member) => FEES[m.category].label.replace(/ Member$/, "");
export const longDate = (iso: string | null | undefined, fallback = "Lifetime") =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : fallback;

export function pngHeaders(memberNo: string, kind: DocKind, req: Request) {
  const download = new URL(req.url).searchParams.get("download");
  return {
    "cache-control": "private, no-store",
    ...(download ? { "content-disposition": `attachment; filename="SATA-${kind}-${memberNo}.png"` } : {}),
  };
}
