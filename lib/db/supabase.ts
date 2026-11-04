import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fromDb, snake, toDb, whereToDb } from "./map";
import { pkOf, type ListOpts, type Repo, type Table, type Where } from "./types";

// Production backend. The service-role key is used ONLY on the server; tables have deny-all RLS so the public key can reach nothing.

const PAGE = 1000;
let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

const fail = (op: string, t: string, e: { message: string }): never => { throw new Error(`Database ${op} failed on ${t}: ${e.message}`); };

export const supabaseRepo: Repo = {
  kind: "supabase",
  async list<T>(t: Table, where?: Where, opts?: ListOpts) {
    const out: T[] = [];
    const max = opts?.limit ?? Infinity;
    for (let from = 0; out.length < max; from += PAGE) {
      const size = Math.min(PAGE, max - out.length);
      let q = supabaseAdmin().from(t).select("*").order(opts?.orderBy ? snake(opts.orderBy) : pkOf(t), { ascending: !opts?.desc }).range(from, from + size - 1);
      if (where) for (const [k, v] of Object.entries(whereToDb(where))) q = v === null ? q.is(k, null) : q.eq(k, v);
      const { data, error } = await q;
      if (error) fail("read", t, error);
      out.push(...(data ?? []).map((r) => fromDb<T>(r)));
      if (!data || data.length < size) break;
    }
    return out;
  },
  async get<T>(t: Table, id: string) {
    const { data, error } = await supabaseAdmin().from(t).select("*").eq(pkOf(t), id).maybeSingle();
    if (error) fail("read", t, error);
    return data ? fromDb<T>(data) : null;
  },
  async put<T extends object>(t: Table, row: T) {
    const { error } = await supabaseAdmin().from(t).upsert(toDb(row), { onConflict: pkOf(t) });
    if (error) fail("write", t, error);
    return row;
  },
  async putMany<T extends object>(t: Table, rows: T[]) {
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabaseAdmin().from(t).upsert(rows.slice(i, i + 200).map(toDb), { onConflict: pkOf(t) });
      if (error) fail("write", t, error);
    }
  },
  async del(t: Table, id: string) {
    const { error } = await supabaseAdmin().from(t).delete().eq(pkOf(t), id);
    if (error) fail("delete", t, error);
  },
  async delWhere(t: Table, where: Where) {
    let q = supabaseAdmin().from(t).delete();
    for (const [k, v] of Object.entries(whereToDb(where))) q = v === null ? q.is(k, null) : q.eq(k, v);
    const { error } = await q;
    if (error) fail("delete", t, error);
  },
  async seq(name) {
    const { data, error } = await supabaseAdmin().rpc(name === "member" ? "next_member_no" : "next_receipt_no");
    if (error) fail("sequence", name, error);
    return Number(data);
  },
  async setSeq(name, value) {
    const { error } = await supabaseAdmin().rpc("set_sequence", { seq: name === "member" ? "member_no_seq" : "receipt_seq", val: value });
    if (error) fail("sequence", name, error);
  },
  async rateHit(key, windowMs) {
    const sb = supabaseAdmin();
    const since = new Date(Date.now() - windowMs).toISOString();
    const ins = await sb.from("rate_limits").insert({ key });
    if (ins.error) fail("write", "rate_limits", ins.error);
    const { count, error } = await sb.from("rate_limits").select("*", { count: "exact", head: true }).eq("key", key).gte("at", since);
    if (error) fail("read", "rate_limits", error);
    if (Math.random() < 0.02) await sb.from("rate_limits").delete().lt("at", new Date(Date.now() - 86_400_000).toISOString());
    return count ?? 0;
  },
};
