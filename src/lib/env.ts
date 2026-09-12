/**
 * Safe Environment Variable configuration and validation for Taleora
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

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    if (process.env.NODE_ENV === "production") {
      console.warn(`[Environment Warning] Variable ${key} is not set.`);
    }
    return "";
  }
  return value;
}

export const env: AppEnv = {
  appName: getEnvVar("NEXT_PUBLIC_APP_NAME", "Taleora"),
  appDescription: getEnvVar(
    "NEXT_PUBLIC_APP_DESCRIPTION",
    "A modern, immersive story and reading experience"
  ),
  appUrl: getEnvVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  supabaseUrl: getEnvVar("NEXT_PUBLIC_SUPABASE_URL", ""),
  supabaseAnonKey: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""),
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
};
