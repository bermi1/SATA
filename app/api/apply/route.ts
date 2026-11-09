import { z } from "zod";
import { clientIp, limited } from "@/lib/request";
import { applyForMembership } from "@/lib/store";
import { savePdf, savePoster } from "@/lib/uploads";

const txt = (min: number, max: number) => z.string().trim().min(min).max(max);
const schema = z.object({
  name: txt(3, 120),
  gender: z.enum(["Male", "Female"]),
  nationality: txt(2, 80),
  qualification: txt(2, 160),
  superspecialization: z.enum(["Yes", "No"]),
  superspecializationDetails: z.string().trim().max(200).optional(),
  councilNo: z.string().trim().max(60).optional(),
  employer: txt(2, 160),
  jobTitle: txt(2, 120),
  yearsOfPractice: z.coerce.number().int().min(0).max(70),
  email: z.string().trim().email(),
  phone: z.string().trim().regex(/^\+\d{8,15}$/, "Phone must start with the country code, e.g. +255754000000"),
  address: z.string().trim().max(300).optional(),
  region: z.string().trim().max(60).optional(),
  category: z.enum(["full", "associate", "honorary"]),
  amountPaid: z.coerce.number().int().min(0).max(100_000_000),
  declaration: z.literal("true"),
}).refine((d) => d.superspecialization === "No" || !!d.superspecializationDetails, { message: "Please specify your superspecialization", path: ["superspecializationDetails"] });

const field = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v : undefined;
};

export async function POST(req: Request) {
  const tooMany = await limited(`apply:${await clientIp()}`, 10, 60 * 60_000);
  if (tooMany) return tooMany;
  const fd = await req.formData().catch(() => null);
  if (!fd) return Response.json({ error: "Invalid submission" }, { status: 400 });
  const raw: Record<string, unknown> = {};
  for (const k of Object.keys(schema.shape)) raw[k] = field(fd, k);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Please complete every required field" }, { status: 400 });
  const d = parsed.data;

  const proof = fd.get("paymentProof");
  if (!(proof instanceof File) || proof.size === 0) return Response.json({ error: "Please upload your proof of payment" }, { status: 400 });
  const licence = fd.get("licence");
  if (d.nationality.toLowerCase() !== "tanzanian" && d.nationality.toLowerCase() !== "tanzania" && !(licence instanceof File && licence.size > 0))
    return Response.json({ error: "Foreign applicants must upload their practising licence" }, { status: 400 });

  const store = async (f: File, label: string) => {
    const r = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf") ? await savePdf(f) : await savePoster(f);
    return "error" in r ? { error: `${label}: ${r.error}` } : r;
  };
  const p = await store(proof, "Proof of payment");
  if ("error" in p) return Response.json({ error: p.error }, { status: 400 });
  let licenceUrl: string | undefined;
  if (licence instanceof File && licence.size > 0) {
    const l = await store(licence, "Practising licence");
    if ("error" in l) return Response.json({ error: l.error }, { status: 400 });
    licenceUrl = l.url;
  }

  const res = await applyForMembership({
    name: d.name, email: d.email, phone: d.phone, category: d.category, cadre: d.jobTitle, facility: d.employer, region: d.region || "Not stated",
    application: {
      gender: d.gender, nationality: d.nationality, qualification: d.qualification, superspecialization: d.superspecialization,
      superspecializationDetails: d.superspecialization === "Yes" ? d.superspecializationDetails : undefined,
      councilNo: d.councilNo || undefined, jobTitle: d.jobTitle, employer: d.employer, yearsOfPractice: d.yearsOfPractice, address: d.address || undefined,
      amountPaid: d.amountPaid, paymentProof: p.url, licence: licenceUrl, declaration: true, submittedAt: new Date().toISOString(),
    },
  });
  if ("error" in res) return Response.json({ error: res.error }, { status: 409 });
  return Response.json({ ok: true, memberNo: res.member.memberNo });
}
