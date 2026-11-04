export const TABLES = [
  "members", "departments", "officers", "events", "registrations", "attendance", "payments", "announcements", "enquiries",
  "resources", "gallery", "tickets", "subscribers", "notifications", "messages", "audit", "team", "partners", "calendar",
  "settings", "login_codes",
] as const;
export type Table = (typeof TABLES)[number];

/** Primary-key column of each table (default "id"). */
export const PK: Partial<Record<Table, string>> = { team: "slug" };
export const pkOf = (t: Table) => PK[t] ?? "id";

export type Where = Record<string, string | number | boolean | null>;
export interface ListOpts { orderBy?: string; desc?: boolean; limit?: number }

/** The only thing the store needs from a database. Two backends: Supabase (production) and a JSON file (local development). */
export interface Repo {
  readonly kind: "supabase" | "file";
  list<T>(t: Table, where?: Where, opts?: ListOpts): Promise<T[]>;
  get<T>(t: Table, id: string): Promise<T | null>;
  put<T extends object>(t: Table, row: T): Promise<T>;
  putMany<T extends object>(t: Table, rows: T[]): Promise<void>;
  del(t: Table, id: string): Promise<void>;
  delWhere(t: Table, where: Where): Promise<void>;
  seq(name: "member" | "receipt"): Promise<number>;
  setSeq(name: "member" | "receipt", value: number): Promise<void>;
  /** Sliding-window rate limit: records a hit and returns how many hits the key has in the window. */
  rateHit(key: string, windowMs: number): Promise<number>;
}
