import { guard } from "@/lib/auth";
import { composeWeekly } from "@/lib/newsletter";

export async function POST() {
  const me = await guard("broadcast");
  if (me instanceof Response) return me;
  const nl = await composeWeekly(me.name);
  return Response.json({ ok: true, id: nl.id, items: nl.items.length });
}
