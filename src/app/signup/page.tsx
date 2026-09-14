"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Mail,
  Lock,
  User,
  AtSign,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/library";

  const [fullName, setFullName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const supabase = React.useMemo(() => createClient(), []);

  const validateInputs = (): string | null => {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!username.trim()) return "Please enter a username.";
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return "Username must be between 3 and 30 characters long.";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return "Username can only contain letters, numbers, and underscores.";
    }
    if (!email.trim()) return "Please enter a valid email address.";
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validateInputs();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);

    try {
      const cleanUsername = username.trim().toLowerCase();
      const origin = window.location.origin;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: cleanUsername,
          },
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      // If Supabase has email confirmation enabled, data.session might be null
      if (data.user && !data.session) {
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
      } else if (data.session) {
        router.push(next);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm backdrop-blur-xs flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20 mb-1">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Begin Your Journey
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
            Create your reader account to discover novellas, save bookmarks, and maintain reading streaks.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs leading-relaxed animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="fullName"
                className="text-xs font-semibold uppercase tracking-wider text-foreground/80"
              >
                Full Name
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Elena Vance"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User className="w-4 h-4" />}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-xs font-semibold uppercase tracking-wider text-foreground/80"
              >
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                placeholder="elena_reads"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={<AtSign className="w-4 h-4" />}
              />
            </div>
          </div>

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
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider text-foreground/80"
            >
              Password (min. 8 characters)
            </label>
            <div className="relative flex items-center">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                className="pr-10"
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

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-semibold uppercase tracking-wider text-foreground/80"
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
            />
          </div>

          {/* Password Match Indicator */}
          {confirmPassword && (
            <div className="flex items-center gap-1.5 text-xs">
              {password === confirmPassword ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Passwords match</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Passwords do not match</span>
                </span>
              )}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full mt-2 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Your Profile...</span>
              </>
            ) : (
              <>
                <span>Create Taleora Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="text-center pt-2 border-t border-border text-xs text-muted-foreground">
          <span>Already have an account? </span>
          <Link
            href={`/login${next !== "/library" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="text-primary font-semibold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <SignupForm />
    </React.Suspense>
  );
}
