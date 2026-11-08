import { composeWeekly } from "@/lib/newsletter";

// Mondays 05:00 UTC (see vercel.json). Only drafts the issue; a person reviews and sends it from /admin/newsletter.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const nl = await composeWeekly("system");
  return Response.json({ ok: true, id: nl.id, weekOf: nl.weekOf, items: nl.items.length });
}
