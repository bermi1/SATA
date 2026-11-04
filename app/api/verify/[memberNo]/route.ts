import { getMemberByNo, isInGoodStanding } from "@/lib/store";

// Public verification: an employer scans a member's QR card and sees standing only (no contact details).
export async function GET(_req: Request, { params }: { params: Promise<{ memberNo: string }> }) {
  const { memberNo } = await params;
  const m = await getMemberByNo(memberNo);
  if (!m) return Response.json({ valid: false }, { status: 404 });
  return Response.json({
    valid: true, memberNo: m.memberNo, name: m.name, category: m.category, cadre: m.cadre,
    goodStanding: isInGoodStanding(m), paidThrough: m.paidThrough,
  });
}
