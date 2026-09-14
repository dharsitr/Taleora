"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle2, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email address";

  const [resending, setResending] = React.useState(false);
  const [resendStatus, setResendStatus] = React.useState<string | null>(null);

  const supabase = React.useMemo(() => createClient(), []);

  const handleResend = async () => {
    if (email === "your email address" || !email.includes("@")) {
      setResendStatus("Please return to the sign in page to request a new link.");
      return;
    }

    setResending(true);
    setResendStatus(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/library`,
        },
      });

      if (error) {
        setResendStatus(`Failed to resend: ${error.message}`);
      } else {
        setResendStatus("A fresh verification link has been sent to your inbox!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setResendStatus(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm backdrop-blur-xs flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
          <Mail className="w-8 h-8 animate-pulse" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Verify Your Email
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            We have sent a confirmation email to:
          </p>
          <span className="font-mono text-xs sm:text-sm font-semibold text-foreground px-3 py-1.5 rounded-lg bg-secondary border border-border break-all">
            {email}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Please check your inbox and click the verification link to confirm your account and enter Taleora.
        </p>

        {resendStatus && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border text-xs text-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{resendStatus}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleResend}
            disabled={resending}
            className="flex-1 gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
            <span>Resend Email</span>
          </Button>

          <Link href="/login" className="flex-1">
            <Button size="md" className="w-full gap-2 text-xs">
              <span>Return to Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}
