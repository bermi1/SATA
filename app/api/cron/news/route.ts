import { refreshNewsFeed } from "@/lib/news-feed";

export const maxDuration = 60;

// Daily job (see vercel.json): collects anaesthesia news. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ ok: true, ...(await refreshNewsFeed()) });
}
