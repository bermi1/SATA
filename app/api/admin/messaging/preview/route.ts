import { z } from "zod";
import { guard } from "@/lib/auth";
import { previewCampaign } from "@/lib/messaging";
import { audienceSchema } from "@/lib/audience-schema";

const schema = z.object({ audience: audienceSchema, body: z.string().max(1000) });

export async function POST(req: Request) {
  const me = await guard("messaging", false);
  if (me instanceof Response) return me;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  return Response.json(await previewCampaign(parsed.data.audience, parsed.data.body));
}
