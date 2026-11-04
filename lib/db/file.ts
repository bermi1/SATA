import fs from "node:fs";
import path from "node:path";
import { buildSeedTables } from "./seed-data";
import { pkOf, TABLES, type ListOpts, type Repo, type Table, type Where } from "./types";

// Local-development backend: the whole database lives in memory and is persisted to .data/db-v4.json.
// Never used in production (see lib/db/index.ts).

type Rows = Record<string, Record<string, unknown>[]>;
interface State { rows: Rows; seq: { member: number; receipt: number } }

const FILE = process.env.SATA_DB_FILE ?? path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "db-v4.json");
const g = globalThis as unknown as { __sataFile?: State; __sataFileTimer?: NodeJS.Timeout | null; __sataRate?: Map<string, number[]> };

function fresh(): State {
  const rows = buildSeedTables("demo") as unknown as Rows;
  return { rows, seq: { member: rows.members.length, receipt: (rows.payments as { receiptNo?: string }[]).filter((p) => p.receiptNo).length } };
}

function load(): State {
  try {
    if (fs.existsSync(/*turbopackIgnore: true*/ FILE)) {
      const s = JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ FILE, "utf8")) as State;
      for (const t of TABLES) s.rows[t] ??= [];
      return s;
    }
  } catch { /* fall through to a fresh database */ }
  return fresh();
}

const state = () => (g.__sataFile ??= load());

function persist() {
  if (g.__sataFileTimer) return;
  g.__sataFileTimer = setTimeout(() => {
    g.__sataFileTimer = null;
    try {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(g.__sataFile));
    } catch { /* read-only filesystem: stay in memory */ }
  }, 150);
}

const matches = (row: Record<string, unknown>, where?: Where) => !where || Object.entries(where).every(([k, v]) => (row[k] ?? null) === v);
const clone = <T,>(v: T): T => structuredClone(v);

export const fileRepo: Repo = {
  kind: "file",
  async list<T>(t: Table, where?: Where, opts?: ListOpts) {
    let rows = state().rows[t].filter((r) => matches(r, where));
    if (opts?.orderBy) {
      const k = opts.orderBy, dir = opts.desc ? -1 : 1;
      rows = [...rows].sort((a, b) => (String(a[k] ?? "") < String(b[k] ?? "") ? -dir : String(a[k] ?? "") > String(b[k] ?? "") ? dir : 0));
    }
    if (opts?.limit) rows = rows.slice(0, opts.limit);
    return rows.map((r) => clone(r) as T);
  },
  async get<T>(t: Table, id: string) {
    const r = state().rows[t].find((x) => x[pkOf(t)] === id);
    return r ? (clone(r) as T) : null;
  },
  async put<T extends object>(t: Table, row: T) {
    const rows = state().rows[t];
    const key = pkOf(t);
    const copy = clone(row) as Record<string, unknown>;
    const i = rows.findIndex((x) => x[key] === copy[key]);
    if (i >= 0) rows[i] = copy; else rows.push(copy);
    persist();
    return row;
  },
  async putMany<T extends object>(t: Table, list: T[]) { for (const r of list) await this.put(t, r); },
  async del(t: Table, id: string) { state().rows[t] = state().rows[t].filter((x) => x[pkOf(t)] !== id); persist(); },
  async delWhere(t: Table, where: Where) { state().rows[t] = state().rows[t].filter((x) => !matches(x, where)); persist(); },
  async seq(name) { const n = ++state().seq[name]; persist(); return n; },
  async setSeq(name, value) { state().seq[name] = value; persist(); },
  async rateHit(key, windowMs) {
    const m = (g.__sataRate ??= new Map());
    const now = Date.now();
    const hits = (m.get(key) ?? []).filter((t: number) => now - t < windowMs);
    hits.push(now);
    m.set(key, hits);
    return hits.length;
  },
};
