"use client";

import * as React from "react";
import { Settings, Eye, Type, Moon, Sun, Monitor, BellOff, ShieldCheck, ShieldAlert, KeyRound, Loader2, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import { getMfaStatus, unenrollMfaFactor, MfaStatus } from "@/lib/auth/mfa";
import { MfaSetupModal } from "@/components/auth/MfaSetupModal";
import { createSecurityNotification } from "@/lib/security/notifications";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = React.useState("medium");
  const [distractionFree, setDistractionFree] = React.useState(false);
  const [mfaStatus, setMfaStatus] = React.useState<MfaStatus | null>(null);
  const [loadingMfa, setLoadingMfa] = React.useState(true);
  const [showSetupModal, setShowSetupModal] = React.useState(false);
  const [removingFactorId, setRemovingFactorId] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  const supabase = createClient();

  const loadMfa = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingMfa(false);
        return;
      }
      setCurrentUserId(user.id);

      const [status, profileRes] = await Promise.all([
        getMfaStatus(supabase),
        supabase.from("profiles").select("role").eq("id", user.id).single(),
      ]);

      setMfaStatus(status);
      setUserRole(profileRes.data?.role || null);
    } catch (err) {
      console.warn("Failed to load MFA status:", err);
    } finally {
      setLoadingMfa(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    loadMfa();
  }, [loadMfa]);

  const handleDisableMfa = async (factorId: string) => {
    if (!confirm("Are you sure you want to disable Two-Factor Authentication? This reduces your account security.")) {
      return;
    }
    setRemovingFactorId(factorId);
    const res = await unenrollMfaFactor(supabase, factorId);
    if (res.success && currentUserId) {
      await createSecurityNotification(supabase, currentUserId, "mfa_removed");
      await loadMfa();
    } else if (res.error) {
      alert(res.error.message);
    }
    setRemovingFactorId(null);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-col gap-2 border-b border-border/70 pb-5">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Settings className="w-4 h-4" />
          <span>Reader Preferences</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Display & Reader Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Customize your reading environment for optimum comfort and focus.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <span>Color Theme</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Choose between warm paper parchment, deep night obsidian, or follow your system.
                </CardDescription>
              </div>
              <ThemeToggle />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "flex flex-col gap-2 p-3.5 rounded-lg border text-left transition-all cursor-pointer",
                  theme === "light"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span>Warm Paper (Light)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Soft sepia paper background to reduce eye strain in daylight.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex flex-col gap-2 p-3.5 rounded-lg border text-left transition-all cursor-pointer",
                  theme === "dark"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Moon className="w-4 h-4 text-primary" />
                  <span>Obsidian (Dark)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deep charcoal and slate for comfortable evening reading.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={cn(
                  "flex flex-col gap-2 p-3.5 rounded-lg border text-left transition-all cursor-pointer",
                  theme === "system"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <span>Automatic (System)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically match your device&apos;s OS light/dark schedule.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Typography Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" />
              <span>Reader Typography</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Test font scaling and readability.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              {["small", "medium", "large"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer",
                    fontSize === size
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                  )}
                >
                  {size} Text
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-border bg-secondary/30 font-serif leading-relaxed">
              <p
                className={cn(
                  "transition-all duration-200",
                  fontSize === "small" && "text-sm",
                  fontSize === "medium" && "text-base",
                  fontSize === "large" && "text-lg"
                )}
              >
                &ldquo;She traced the constellations charted across the parchment. The stars, once thought to be static embers in an indifferent sky, pulsed with the steady rhythm of a sleeping giant.&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Distraction Free Mode */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BellOff className="w-5 h-5 text-primary" />
                  <span>Distraction-Free Reading Mode</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Hides secondary badges and notification dots while reading story chapters.
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setDistractionFree(!distractionFree)}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative cursor-pointer",
                  distractionFree ? "bg-primary" : "bg-border"
                )}
              >
                <span
                  className={cn(
                    "block w-4 h-4 rounded-full bg-white transition-transform absolute top-1",
                    distractionFree ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>
          </CardHeader>
        </Card>

        {/* Account Security & Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-primary" />
                  <span>Two-Factor Authentication (TOTP)</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Add an extra layer of security using an authenticator app (e.g., Google Authenticator, 1Password).
                </CardDescription>
              </div>
              {mfaStatus?.hasEnrolledMfa ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Active (AAL2)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Inactive</span>
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {["admin", "moderator"].includes(userRole || "") && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold capitalize">{userRole} Role Requirement: </span>
                  <span>
                    Two-Factor Authentication is strictly required for administrative privileges. Administrative workspaces and sensitive operations require active AAL2 verification.
                  </span>
                </div>
              </div>
            )}

            {loadingMfa ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Checking two-factor status...</span>
              </div>
            ) : mfaStatus?.hasEnrolledMfa ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  {mfaStatus.factors.map((factor) => (
                    <div
                      key={factor.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30 text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-xs text-foreground">{factor.friendlyName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Enrolled {new Date(factor.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisableMfa(factor.id)}
                        disabled={removingFactorId === factor.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-8"
                      >
                        {removingFactorId === factor.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                        )}
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your account is protected with time-based one-time password (TOTP) verification.
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-dashed border-border bg-secondary/10">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-foreground">Protect your account with TOTP</p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Require a 6-digit verification code from your authenticator app in addition to your password whenever accessing sensitive areas.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setShowSetupModal(true)}
                  className="shrink-0"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Enable 2FA
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MFA Setup Modal */}
      <MfaSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={() => {
          loadMfa();
        }}
      />
    </div>
  );
}
