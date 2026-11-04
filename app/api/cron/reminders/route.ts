import { runReminders } from "@/lib/messaging";

// Daily job (see vercel.json). Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const r = await runReminders("Automatic reminder");
  return Response.json({ ok: true, ...r });
}
