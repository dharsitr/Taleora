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
  supabaseAnonKey: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[Config] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. Copy .env.example to .env.local and fill in the values."
  );
}

export const env: AppEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Taleora",
  appDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    "A modern, immersive story and reading experience",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  supabaseUrl,
  supabaseAnonKey,
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
};
