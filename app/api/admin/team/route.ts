import { z } from "zod";
import { guard } from "@/lib/auth";
import { changeAdminRole, grantAdmin, removeAdmin } from "@/lib/admin-team";
import { sendEmail } from "@/lib/sms";
import { ROLE_LABEL } from "@/lib/types";

const role = z.enum(["secretariat", "management", "treasurer", "education", "social", "leadership"]);
const add = z.object({ email: z.string().email(), name: z.string().trim().min(2).max(120), phone: z.string().trim().max(30).optional(), role });
const change = z.object({ id: z.string(), role });
const remove = z.object({ id: z.string() });

const fail = (error: string) => Response.json({ error }, { status: 400 });

export async function POST(req: Request) {
  const me = await guard("admins");
  if (me instanceof Response) return me;
  const p = add.safeParse(await req.json().catch(() => null));
  if (!p.success) return fail("Enter a valid email, name and role");
  const res = await grantAdmin(me, p.data);
  if (res.error) return fail(res.error);
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const label = ROLE_LABEL[res.member.role];
  const mail = await sendEmail(
    res.member.email,
    `You've been given ${label} access to SATA admin`,
    `Hello ${res.member.name.split(" ")[0]},\n\n${me.name} has given you ${label} access to the SATA admin console.\n\nTo sign in, open the link below, enter this email address and we will send you a one-time code. There is no password to remember.`,
    { heading: `You now have ${label} access`, button: { label: "Sign in to SATA", href: `${site}/login` }, preheader: `${label} access to SATA admin` },
  );
  return Response.json({ ok: true, created: res.created, emailed: mail.ok });
}

export async function PATCH(req: Request) {
  const me = await guard("admins");
  if (me instanceof Response) return me;
  const p = change.safeParse(await req.json().catch(() => null));
  if (!p.success) return fail("Invalid request");
  const res = await changeAdminRole(me, p.data.id, p.data.role);
  if (res.error) return fail(res.error);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const me = await guard("admins");
  if (me instanceof Response) return me;
  const p = remove.safeParse(await req.json().catch(() => null));
  if (!p.success) return fail("Invalid request");
  const res = await removeAdmin(me, p.data.id);
  if (res.error) return fail(res.error);
  return Response.json({ ok: true });
}
