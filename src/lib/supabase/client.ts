import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";
import { env } from "@/lib/env";

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Creates or reuses a Supabase client singleton for use in browser / client components.
 * Employs Row Level Security (RLS) and the public publishable key (or legacy anon key).
 */
export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || env.supabaseUrl;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.supabasePublishableKey;

  if (typeof window === "undefined") {
    return createBrowserClient<Database>(url, publishableKey);
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient<Database>(url, publishableKey);
  }

  return clientInstance;
}
