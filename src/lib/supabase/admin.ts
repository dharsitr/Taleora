import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { env } from "@/lib/env";

/**
 * SECURITY GUARD:
 * Service role client bypasses Row Level Security (RLS).
 * It must NEVER be called or bundled on the browser/client side.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "[Security Alert] createAdminClient cannot be invoked on the client side!"
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "[Configuration Error] SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables."
    );
  }

  return createClient<Database>(env.supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
