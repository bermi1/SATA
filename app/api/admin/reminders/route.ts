import { guard } from "@/lib/auth";
import { runReminders } from "@/lib/messaging";

// Manual trigger for the same job the daily cron runs.
export async function POST() {
  const me = await guard("messaging");
  if (me instanceof Response) return me;
  const r = await runReminders(me.name);
  return Response.json({ ok: true, ...r });
}
