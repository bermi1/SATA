// camelCase app objects <-> snake_case table rows. Only top-level keys are converted; JSON columns are left alone.

export const snake = (k: string) => k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const camel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** Fields whose TypeScript type is `T | null`: a database NULL stays null. Everything else becomes `undefined` (optional). */
const KEEP_NULL = new Set(["paidThrough", "lastReminderAt", "memberId", "headMemberId", "capacity", "receiptNo"]);

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(\+00:00|Z)$/;

export function toDb(obj: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[snake(k)] = v === undefined ? null : v;
  return out;
}

export function fromDb<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = camel(k);
    if (v === null) {
      if (KEEP_NULL.has(key)) out[key] = null;
    } else out[key] = typeof v === "string" && ISO_UTC.test(v) ? new Date(v).toISOString() : v;
  }
  return out as T;
}

export const whereToDb = (w: Record<string, unknown>) => Object.fromEntries(Object.entries(w).map(([k, v]) => [snake(k), v]));
