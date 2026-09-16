/**
 * Safe Environment Variable configuration and validation for Taleora
 *
 * NOTE FOR NEXT.JS CLIENT BUNDLES:
 * Next.js / Turbopack only inlines NEXT_PUBLIC_* variables when accessed
 * as literal properties like `process.env.NEXT_PUBLIC_KEY`.
 * Dynamic access like `process.env[key]` evaluates to undefined in the browser!
 */

export interface AppEnv {
  appName: string;
  appDescription: string;
  appUrl: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseAnonKey: string; // Backward-compatible alias for supabasePublishableKey
  isProduction: boolean;
  isDevelopment: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "[Config] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set. Copy .env.example to .env.local and fill in the values."
  );
}

export const env: AppEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Taleora",
  appDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    "A modern, immersive story and reading experience",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  supabaseUrl,
  supabasePublishableKey,
  supabaseAnonKey: supabasePublishableKey,
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
};
