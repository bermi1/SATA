import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { repo } from "./db";
import { secret } from "./secret";

// One-time sign-in codes: 6 digits, hashed at rest, valid for 10 minutes, five wrong guesses and the code is dead.
const TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;

interface CodeRow { id: string; email: string; codeHash: string; expiresAt: string; attempts: number; createdAt: string }

const hash = (email: string, code: string) => createHmac("sha256", secret()).update(`${email}:${code}`).digest("hex");

export async function issueCode(email: string): Promise<string> {
  const e = email.trim().toLowerCase();
  await repo().delWhere("login_codes", { email: e });
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const row: CodeRow = { id: randomUUID(), email: e, codeHash: hash(e, code), expiresAt: new Date(Date.now() + TTL_MS).toISOString(), attempts: 0, createdAt: new Date().toISOString() };
  await repo().put("login_codes", row);
  return code;
}

export async function checkCode(email: string, code: string): Promise<"ok" | "invalid" | "expired"> {
  const e = email.trim().toLowerCase();
  const row = (await repo().list<CodeRow>("login_codes", { email: e }))[0];
  if (!row || row.attempts >= MAX_ATTEMPTS || new Date(row.expiresAt) < new Date()) return "expired";
  const a = Buffer.from(hash(e, code.trim()));
  const b = Buffer.from(row.codeHash);
  if (a.length === b.length && timingSafeEqual(a, b)) {
    await repo().del("login_codes", row.id);
    return "ok";
  }
  await repo().put("login_codes", { ...row, attempts: row.attempts + 1 });
  return "invalid";
}
