"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthVisualSide } from "@/components/auth/AuthVisualSide";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/library";
  const errorParam = searchParams.get("error");
  const noticeParam = searchParams.get("notice");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(
    errorParam ? decodeURIComponent(errorParam) : null
  );

  const supabase = React.useMemo(() => createClient(), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.user) {
        router.push(next);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-4 sm:py-8">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Visual Panel: 3D Luxury Novella with Warm Ambient Glow */}
        <div className="lg:col-span-6 w-full">
          <AuthVisualSide
            quote="Return to your quiet corner of the world."
            badgeText="Daily reading streak"
            bookTitle="The Art of Reading"
          />
        </div>

        {/* Right Authentication Form Panel */}
        <div className="lg:col-span-6 w-full max-w-lg mx-auto">
          <div className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-xl p-6 sm:p-10 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
            {/* Subtle Amber Glow in Corner */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Brand Header */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-600/25">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="font-serif text-xl font-bold tracking-tight text-foreground">
                  Taleora
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Welcome Back, Reader
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enter your credentials to access your personal library and reading streaks.
              </p>
            </div>

            {/* Notice Notification */}
            {noticeParam && !errorMessage && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-foreground text-xs leading-relaxed animate-in fade-in duration-200">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="font-medium">{decodeURIComponent(noticeParam)}</span>
              </div>
            )}

            {/* Error Notification */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs leading-relaxed animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-foreground/80"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="reader@taleora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                  className="bg-secondary/40 border-border/80 focus:border-amber-500/60 focus:bg-card h-11"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold uppercase tracking-wider text-foreground/80"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    className="bg-secondary/40 border-border/80 focus:border-amber-500/60 focus:bg-card pr-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember this device & security */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-border text-amber-600 focus:ring-amber-500 bg-secondary/50 cursor-pointer"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full mt-2 h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-white shadow-lg shadow-amber-500/25 border border-amber-400/30 gap-2 cursor-pointer transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Your Library...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Library</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center pt-3 border-t border-border/70 text-xs text-muted-foreground">
              <span>New to Taleora? </span>
              <Link
                href={`/signup${next !== "/library" ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                Begin your journey
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
