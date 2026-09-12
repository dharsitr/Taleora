import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";
import { env } from "@/lib/env";

/**
 * Creates a Supabase client for use in browser / client components.
 * Employs Row Level Security (RLS) and the public anon key.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey
  );
}
