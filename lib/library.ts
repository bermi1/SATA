import { can } from "./auth";
import type { Member, Resource } from "./types";

/** Library access: public published items (forms) are open; everything else needs an active member.
 *  Content administrators and the submitter can always open an item, whatever its status. */
export function canOpenResource(r: Resource, m: Member | null) {
  if (m && (can(m.role, "content") || r.submittedBy === m.id)) return true;
  if ((r.status ?? "published") !== "published") return false;
  return !r.membersOnly || (!!m && m.status === "active");
}

export const isPdfUrl = (u: string) => u.endsWith(".pdf") || u.startsWith("/api/uploads/");
