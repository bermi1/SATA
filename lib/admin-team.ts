import { repo } from "./db";
import { normalizePhone } from "./sms";
import { auditLog, getMember, getMemberByEmail, listMembers } from "./store";
import type { Member, Role } from "./types";
import { ROLE_LABEL } from "./types";

export type AdminRole = Exclude<Role, "member">;
export const ADMIN_ROLE_LIST: AdminRole[] = ["secretariat", "management", "treasurer", "education", "social", "leadership"];

export const listAdmins = async () => (await listMembers()).filter((m) => m.role !== "member");

/** Only secretariat may hand out or take away secretariat access. */
function allowed(actor: Member, ...roles: Role[]) {
  return actor.role === "secretariat" || !roles.includes("secretariat");
}

export async function grantAdmin(actor: Member, input: { email: string; name: string; phone?: string; role: AdminRole }) {
  if (!allowed(actor, input.role)) return { error: "Only the secretariat can grant secretariat access" as const };
  const email = input.email.trim().toLowerCase();
  const existing = await getMemberByEmail(email);
  if (existing) {
    if (!allowed(actor, existing.role)) return { error: "Only the secretariat can change a secretariat account" as const };
    const was = existing.role;
    existing.role = input.role;
    if (existing.status === "pending" || existing.status === "suspended") existing.status = "active";
    await repo().put("members", existing);
    await auditLog(actor.name, `Changed role of ${existing.name} from ${ROLE_LABEL[was]} to ${ROLE_LABEL[input.role]}`);
    return { member: existing, created: false as const };
  }
  const n = await repo().seq("member");
  const m: Member = {
    id: `m${String(n).padStart(3, "0")}`, memberNo: `SATA-${String(n).padStart(4, "0")}`,
    name: input.name.trim(), email, phone: (input.phone && normalizePhone(input.phone)) || input.phone?.trim() || "",
    category: "honorary", cadre: "Administrator", facility: "SATA Secretariat", region: "Tanzania",
    status: "active", paidThrough: null, cpdPoints: 0, joinedAt: new Date().toISOString(), role: input.role, departmentIds: [],
  };
  await repo().put("members", m);
  await auditLog(actor.name, `Added admin ${m.name} (${m.email}) as ${ROLE_LABEL[input.role]}`);
  return { member: m, created: true as const };
}

export async function changeAdminRole(actor: Member, id: string, role: AdminRole) {
  const m = await getMember(id);
  if (!m || m.role === "member") return { error: "Admin not found" as const };
  if (!allowed(actor, role, m.role)) return { error: "Only the secretariat can change secretariat access" as const };
  if (m.id === actor.id && role !== m.role && m.role === "secretariat") return { error: "You cannot change your own secretariat access" as const };
  if (m.role === "secretariat" && role !== "secretariat") {
    const left = (await listAdmins()).filter((a) => a.role === "secretariat" && a.id !== m.id).length;
    if (left < 1) return { error: "At least one secretariat account must remain" as const };
  }
  const was = m.role;
  m.role = role;
  await repo().put("members", m);
  await auditLog(actor.name, `Changed role of ${m.name} from ${ROLE_LABEL[was]} to ${ROLE_LABEL[role]}`);
  return { member: m };
}

export async function removeAdmin(actor: Member, id: string) {
  const m = await getMember(id);
  if (!m || m.role === "member") return { error: "Admin not found" as const };
  if (m.id === actor.id) return { error: "You cannot remove your own admin access" as const };
  if (!allowed(actor, m.role)) return { error: "Only the secretariat can remove a secretariat account" as const };
  if (m.role === "secretariat") {
    const left = (await listAdmins()).filter((a) => a.role === "secretariat" && a.id !== m.id).length;
    if (left < 1) return { error: "You cannot remove the last secretariat account" as const };
  }
  const was = m.role;
  m.role = "member";
  await repo().put("members", m);
  await auditLog(actor.name, `Removed admin access (${ROLE_LABEL[was]}) from ${m.name}`);
  return { member: m };
}
