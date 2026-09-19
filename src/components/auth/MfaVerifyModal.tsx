"use client";

import * as React from "react";
import { ShieldAlert, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { challengeAndVerifyMfa, getMfaStatus } from "@/lib/auth/mfa";
import { createSecurityNotification } from "@/lib/security/notifications";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface MfaVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function MfaVerifyModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Two-Factor Verification Required",
  description = "Please enter the 6-digit security code from your authenticator app to proceed.",
}: MfaVerifyModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = React.useState(true);
  const [verifying, setVerifying] = React.useState(false);
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    async function loadFactor() {
      setLoading(true);
      setErrorMessage(null);
      const status = await getMfaStatus(supabase);
      if (!mounted) return;

      if (!status.hasEnrolledMfa || status.factors.length === 0) {
        setErrorMessage("No enrolled authenticator factor found.");
      } else {
        setFactorId(status.factors[0].id);
      }
      setLoading(false);
    }

    loadFactor();
    return () => {
      mounted = false;
    };
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || code.trim().length !== 6) {
      setErrorMessage("Please enter a 6-digit verification code.");
      return;
    }

    setVerifying(true);
    setErrorMessage(null);

    const res = await challengeAndVerifyMfa(supabase, factorId, code);
    if (!res.success) {
      setErrorMessage(res.error?.message || "Invalid authentication code. Please try again.");
      setVerifying(false);
      return;
    }

    // Send security notification for administrative elevation
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await createSecurityNotification(supabase, userData.user.id, "admin_elevated");
    }

    setVerifying(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Preparing security challenge...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="verify-totp-code" className="text-xs font-medium text-foreground">
                6-digit authenticator code
              </label>
              <Input
                id="verify-totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center font-mono tracking-widest text-lg font-bold"
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

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={verifying}>
                Cancel
              </Button>
              <Button type="submit" disabled={verifying || code.trim().length !== 6}>
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
