import { z } from "zod";
import { guard } from "@/lib/auth";
import { baseSchema, readLibraryForm } from "@/lib/library-input";
import { deleteResource, getMember, getResource, reviewResource, saveResource } from "@/lib/store";
import { sendEmail } from "@/lib/sms";
import { RESOURCE_KINDS, type Resource } from "@/lib/types";

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sata-website-liard.vercel.app").replace(/\/$/, "");

const schema = baseSchema.extend({
  id: z.string().optional(),
  kind: z.enum(RESOURCE_KINDS),
  membersOnly: z.enum(["true", "false"]),
  closesAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

// Add or edit an item (multipart: details plus a PDF "file" or a "url"). New items are published at once.
export async function POST(req: Request) {
  const me = await guard("content");
  if (me instanceof Response) return me;
  const form = await readLibraryForm(req);
  if ("error" in form) return Response.json({ error: form.error }, { status: 400 });
  const parsed = schema.safeParse(form.raw);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Check the details" }, { status: 400 });
  const d = parsed.data;
  const existing = d.id ? await getResource(d.id) : null;
  if (d.id && !existing) return Response.json({ error: "Item not found" }, { status: 404 });
  const url = form.url || existing?.url || "";
  if (!url) return Response.json({ error: "Upload a PDF or paste a link" }, { status: 400 });
  const input: Omit<Resource, "id"> = { title: d.title, kind: d.kind, description: d.description, author: d.author || undefined, year: d.year, closesAt: d.closesAt || undefined, membersOnly: d.membersOnly === "true", url };
  if (!existing) input.status = "published";
  const { resource } = await saveResource({ ...input, id: existing?.id }, me.name);
  return Response.json({ ok: true, id: resource.id });
}

const decision = z.object({ id: z.string(), action: z.enum(["approve", "reject", "unpublish", "publish"]), note: z.string().max(1000).optional() });

// Approve or reject a submission, or move a published item back out of / into the library.
export async function PATCH(req: Request) {
  const me = await guard("content");
  if (me instanceof Response) return me;
  const parsed = decision.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { id, action } = parsed.data;
  const note = parsed.data.note?.trim() ?? "";
  const before = await getResource(id);
  if (!before) return Response.json({ error: "Item not found" }, { status: 404 });
  if (action === "reject" && note.length < 3) return Response.json({ error: "Tell the author why, so they can improve it" }, { status: 400 });

  const res = await reviewResource(id, action === "approve" || action === "publish" ? "approve" : "reject", action === "unpublish" ? note || "Unpublished by the Education committee" : note, me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });

  // Tell the author about a decision on their submission.
  if (before.status === "pending" && before.submittedBy) {
    const author = await getMember(before.submittedBy);
    if (author?.email) {
      if (action === "approve") {
        await sendEmail(author.email, "Your submission is now in the SATA library", `Dear ${author.name},\n\nThe Education committee has approved "${before.title}". It is now published in the SATA resource library.${note ? `\n\nNote from the reviewer: ${note}` : ""}`, { heading: "Submission approved", button: { label: "View in the library", href: `${SITE()}/resources/${id}` } });
      } else if (action === "reject") {
        await sendEmail(author.email, "Update on your SATA library submission", `Dear ${author.name},\n\nThank you for submitting "${before.title}". The Education committee was not able to publish it this time.\n\nNote from the reviewer: ${note}\n\nYou are welcome to revise it and submit again.`, { heading: "Submission not accepted", button: { label: "My submissions", href: `${SITE()}/portal/library` } });
      }
    }
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const me = await guard("content");
  if (me instanceof Response) return me;
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const res = await deleteResource(body?.id ?? "", me.name);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json({ ok: true });
}
