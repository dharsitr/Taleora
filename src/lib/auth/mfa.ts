import { SupabaseClient, AuthenticatorAssuranceLevels } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

export interface MfaStatus {
  currentLevel: AuthenticatorAssuranceLevels | null;
  nextLevel: AuthenticatorAssuranceLevels | null;
  hasEnrolledMfa: boolean;
  factors: Array<{
    id: string;
    friendlyName?: string;
    factorType: string;
    status: string;
    createdAt: string;
  }>;
}

export interface MfaEnrollmentData {
  factorId: string;
  qrCode: string; // SVG or data URL
  secret: string;
  uri: string;
}

/**
 * Retrieves the current MFA / Authenticator Assurance Level (AAL) status.
 */
export async function getMfaStatus(supabase: SupabaseClient<Database>): Promise<MfaStatus> {
  const [aalResponse, factorsResponse] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);

  const currentLevel = aalResponse.data?.currentLevel || null;
  const nextLevel = aalResponse.data?.nextLevel || null;

  const allFactors = factorsResponse.data?.all || [];
  const verifiedTotpFactors = allFactors
    .filter((f) => f.factor_type === "totp" && f.status === "verified")
    .map((f) => ({
      id: f.id,
      friendlyName: f.friendly_name || "Authenticator App",
      factorType: f.factor_type,
      status: f.status,
      createdAt: f.created_at,
    }));

  return {
    currentLevel,
    nextLevel,
    hasEnrolledMfa: verifiedTotpFactors.length > 0,
    factors: verifiedTotpFactors,
  };
}

/**
 * Initiates TOTP MFA enrollment, returning the secret and QR code.
 */
export async function enrollTotpFactor(
  supabase: SupabaseClient<Database>,
  friendlyName = "Taleora Authenticator"
): Promise<{ data: MfaEnrollmentData | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "Taleora",
      friendlyName,
    });

    if (error) throw error;
    if (!data || data.type !== "totp") {
      throw new Error("Failed to receive TOTP enrollment payload from Supabase.");
    }

    return {
      data: {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Unexpected error during MFA enrollment."),
    };
  }
}

/**
 * Verifies the initial TOTP code to finalize enrollment and elevate session to AAL2.
 */
export async function verifyMfaEnrollment(
  supabase: SupabaseClient<Database>,
  factorId: string,
  code: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const challengeRes = await supabase.auth.mfa.challenge({ factorId });
    if (challengeRes.error) throw challengeRes.error;

    const verifyRes = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeRes.data.id,
      code: code.trim(),
    });

    if (verifyRes.error) throw verifyRes.error;

    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Failed to verify MFA code."),
    };
  }
}

/**
 * Challenges and verifies an existing TOTP factor to upgrade an AAL1 session to AAL2.
 */
export async function challengeAndVerifyMfa(
  supabase: SupabaseClient<Database>,
  factorId: string,
  code: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const challengeRes = await supabase.auth.mfa.challenge({ factorId });
    if (challengeRes.error) throw challengeRes.error;

    const verifyRes = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeRes.data.id,
      code: code.trim(),
    });

    if (verifyRes.error) throw verifyRes.error;

    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Failed to verify authentication code."),
    };
  }
}

/**
 * Unenrolls/removes an MFA factor.
 */
export async function unenrollMfaFactor(
  supabase: SupabaseClient<Database>,
  factorId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error("Failed to remove MFA factor."),
    };
  }
}
