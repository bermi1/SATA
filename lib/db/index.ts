import { fileRepo } from "./file";
import { supabaseRepo } from "./supabase";
import type { Repo } from "./types";

const configured = () => !!(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Supabase when configured. The JSON-file backend exists for local development only and is refused in production. */
export function repo(): Repo {
  if (configured()) return supabaseRepo;
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error("Production requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The local file database is for development only.");
  }
  return fileRepo;
}

export const usingSupabase = configured;
