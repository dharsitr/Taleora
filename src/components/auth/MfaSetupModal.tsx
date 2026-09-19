"use client";

import * as React from "react";
import { ShieldCheck, Copy, Check, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { enrollTotpFactor, verifyMfaEnrollment, MfaEnrollmentData } from "@/lib/auth/mfa";
import { createSecurityNotification } from "@/lib/security/notifications";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface MfaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function MfaSetupModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Enable Two-Factor Authentication",
  description = "Scan this QR code with an authenticator app like Google Authenticator or 1Password.",
}: MfaSetupModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = React.useState(true);
  const [verifying, setVerifying] = React.useState(false);
  const [enrollment, setEnrollment] = React.useState<MfaEnrollmentData | null>(null);
  const [code, setCode] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    async function startEnrollment() {
      setLoading(true);
      setErrorMessage(null);
      const res = await enrollTotpFactor(supabase, "Taleora Authenticator");
      if (!mounted) return;

      if (res.error || !res.data) {
        setErrorMessage(res.error?.message || "Failed to initialize authenticator setup.");
      } else {
        setEnrollment(res.data);
      }
      setLoading(false);
    }

    startEnrollment();
    return () => {
      mounted = false;
    };
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  const handleCopySecret = () => {
    if (!enrollment?.secret) return;
    navigator.clipboard.writeText(enrollment.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment || code.trim().length !== 6) {
      setErrorMessage("Please enter a valid 6-digit authentication code.");
      return;
    }

    setVerifying(true);
    setErrorMessage(null);

    const res = await verifyMfaEnrollment(supabase, enrollment.factorId, code);
    if (!res.success) {
      setErrorMessage(res.error?.message || "Invalid code. Please check your authenticator app and try again.");
      setVerifying(false);
      return;
    }

    // Send security notification
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await createSecurityNotification(supabase, userData.user.id, "mfa_enrolled");
    }

    setVerifying(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Generating secure authenticator key...</p>
          </div>
        ) : errorMessage && !enrollment ? (
          <div className="flex flex-col gap-4">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            {/* QR Code display */}
            {enrollment?.qrCode && (
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-border/60">
                {/* Supabase returns SVG string or data URL */}
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
            )}

            {/* Manual Secret Key */}
            {enrollment?.secret && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Can&apos;t scan? Enter secret key manually:
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
            )}

            {/* 6-Digit Code Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="totp-code" className="text-xs font-medium text-foreground">
                Enter 6-digit code from your authenticator app
              </label>
              <Input
                id="totp-code"
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
                  "Verify & Enable"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
