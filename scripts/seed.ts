/**
 * Seeds the production Supabase database with SATA's real content (events, news, resources, leadership, gallery,
 * calendar, site settings) and creates the first administrator. It NEVER creates sample members or payments.
 *
 *   npm run db:seed                 seed tables that are empty, create the admin from SATA_ADMIN_EMAIL
 *   npm run db:seed -- --force      re-seed content tables even if they already have rows (overwrites edits)
 *   npm run db:seed -- --demo       load the full sample dataset (staging / demos only)
 */
import { loadEnvConfig } from "@next/env";
import type { Member } from "../lib/types";

loadEnvConfig(process.cwd());

async function main() {
  const { buildSeedTables } = await import("../lib/db/seed-data");
  const { supabaseRepo: db } = await import("../lib/db/supabase");
  const { TABLES } = await import("../lib/db/types");

  const demo = process.argv.includes("--demo");
  const force = process.argv.includes("--force");
  const tables = buildSeedTables(demo ? "demo" : "production");

  for (const t of TABLES) {
    const rows = tables[t];
    if (!rows.length) continue;
    const existing = await db.list(t, undefined, { limit: 1 });
    if (existing.length && !force) { console.log(`skip   ${t} (already has data)`); continue; }
    await db.putMany(t, rows);
    console.log(`seeded ${t}: ${rows.length}`);
  }

  if (demo) {
    await db.setSeq("member", tables.members.length);
    await db.setSeq("receipt", (tables.payments as { receiptNo?: string }[]).filter((p) => p.receiptNo).length);
  }

  const email = process.env.SATA_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.log("\nNo SATA_ADMIN_EMAIL set: no administrator was created. Set it and run again to create one.");
    return;
  }
  const existing = (await db.list<Member>("members", { email }))[0];
  if (existing) {
    if (existing.role === "member") await db.put("members", { ...existing, role: "secretariat", status: "active" });
    console.log(`admin  ${email} already exists (role ensured)`);
    return;
  }
  const n = await db.seq("member");
  const admin: Member = {
    id: `m${String(n).padStart(3, "0")}`, memberNo: `SATA-${String(n).padStart(4, "0")}`, name: process.env.SATA_ADMIN_NAME ?? "SATA Secretariat", email,
    phone: process.env.SATA_ADMIN_PHONE ?? "+255754092507", category: "honorary", cadre: "Administrator", facility: "SATA Secretariat", region: "Dar es Salaam",
    status: "active", paidThrough: null, cpdPoints: 0, joinedAt: new Date().toISOString(), role: "secretariat", departmentIds: [],
  };
  await db.put("members", admin);
  console.log(`admin  created ${admin.name} <${email}> as ${admin.memberNo} (secretariat)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
