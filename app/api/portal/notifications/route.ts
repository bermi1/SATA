import { guard } from "@/lib/auth";
import { markNotificationsRead } from "@/lib/store";

export async function POST() {
  const me = await guard();
  if (me instanceof Response) return me;
  await markNotificationsRead(me.id);
  return Response.json({ ok: true });
}
