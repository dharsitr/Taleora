"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ShieldAlert, Loader2, AlertCircle, Copy, Check, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMfaStatus, enrollTotpFactor, verifyMfaEnrollment, challengeAndVerifyMfa, MfaEnrollmentData } from "@/lib/auth/mfa";
import { createSecurityNotification } from "@/lib/security/notifications";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function MfaChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const forceSetup = searchParams.get("setup") === "true";

  const supabase = createClient();
  const [loading, setLoading] = React.useState(true);
  const [verifying, setVerifying] = React.useState(false);
  const [isSetupMode, setIsSetupMode] = React.useState(false);
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [enrollment, setEnrollment] = React.useState<MfaEnrollmentData | null>(null);
  const [code, setCode] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      setLoading(true);
      setErrorMessage(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      const status = await getMfaStatus(supabase);
      if (!mounted) return;

      // If already at AAL2, proceed to destination
      if (status.currentLevel === "aal2") {
        router.push(nextPath);
        return;
      }

      if (forceSetup || !status.hasEnrolledMfa || status.factors.length === 0) {
        // Mode 1: Setup mode (Admin has not enrolled yet or explicitly requested setup)
        setIsSetupMode(true);
        const enrollRes = await enrollTotpFactor(supabase, "Taleora Admin Authenticator");
        if (!mounted) return;
        if (enrollRes.error || !enrollRes.data) {
          setErrorMessage(enrollRes.error?.message || "Failed to initialize authenticator enrollment.");
        } else {
          setEnrollment(enrollRes.data);
          setFactorId(enrollRes.data.factorId);
        }
      } else {
        // Mode 2: Verification mode (Admin has enrolled factor, need to elevate session)
        setIsSetupMode(false);
        setFactorId(status.factors[0].id);
      }

      setLoading(false);
    }

    checkStatus();

    return () => {
      mounted = false;
    };
  }, [nextPath, forceSetup, router, supabase]);

  const handleCopySecret = () => {
    if (!enrollment?.secret) return;
    navigator.clipboard.writeText(enrollment.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || code.trim().length !== 6) {
      setErrorMessage("Please enter a valid 6-digit verification code.");
      return;
    }

    setVerifying(true);
    setErrorMessage(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (isSetupMode) {
      const res = await verifyMfaEnrollment(supabase, factorId, code);
      if (!res.success) {
        setErrorMessage(res.error?.message || "Invalid code. Please check your authenticator app.");
        setVerifying(false);
        return;
      }

      if (user) {
        await createSecurityNotification(supabase, user.id, "mfa_enrolled");
      }
    } else {
      const res = await challengeAndVerifyMfa(supabase, factorId, code);
      if (!res.success) {
        setErrorMessage(res.error?.message || "Invalid authentication code. Please try again.");
        setVerifying(false);
        return;
      }

      if (user) {
        await createSecurityNotification(supabase, user.id, "admin_elevated");
      }
    }

    setVerifying(false);
    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-10 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            {isSetupMode ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-foreground">
              {isSetupMode ? "Setup Admin Two-Factor Authentication" : "Admin Two-Factor Verification"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isSetupMode
                ? "Taleora requires Multi-Factor Authentication (AAL2) for administrative privileges."
                : "Enter the code from your authenticator app to access the Admin Workspace."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Verifying security status...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {isSetupMode && enrollment && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-border/60">
                  {enrollment.qrCode.startsWith("data:") ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={enrollment.qrCode}
                      alt="Scan with Authenticator App"
                      className="w-44 h-44 object-contain"
                    />
                  ) : (
                    <div
                      className="w-44 h-44 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: enrollment.qrCode }}
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Or enter manual key in your authenticator app:
                  </label>
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-secondary/30 font-mono text-xs">
                    <span className="truncate select-all text-foreground">{enrollment.secret}</span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Copy Secret"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="mfa-challenge-code" className="text-xs font-medium text-foreground">
                6-digit authenticator code
              </label>
              <Input
                id="mfa-challenge-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center font-mono tracking-widest text-xl font-bold h-12"
                required
                autoFocus
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={verifying || code.trim().length !== 6}>
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <span>{isSetupMode ? "Enable MFA & Continue" : "Verify & Access Admin"}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
