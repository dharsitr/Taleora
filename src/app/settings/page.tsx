"use client";

import * as React from "react";
import {
  Eye,
  Type,
  Moon,
  Sun,
  Monitor,
  BellOff,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Loader2,
  Trash2,
  Sparkles,
  CheckCircle2,
  Leaf,
  Activity,
  Database,
  CloudOff,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import { getMfaStatus, unenrollMfaFactor, MfaStatus } from "@/lib/auth/mfa";
import { MfaSetupModal } from "@/components/auth/MfaSetupModal";
import { createSecurityNotification } from "@/lib/security/notifications";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { greenReadingEngine, formatBytes, SustainabilityMetrics } from "@/lib/green/eco-reading";
import { SustainabilityDashboard } from "@/components/reader/SustainabilityDashboard";

type FontStyleType = "serif" | "sans" | "mono";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = React.useState<"small" | "medium" | "large" | "xlarge">("medium");
  const [fontStyle, setFontStyle] = React.useState<FontStyleType>("serif");
  const [distractionFree, setDistractionFree] = React.useState(false);
  const [sustainabilityModalOpen, setSustainabilityModalOpen] = React.useState(false);
  const [sustainabilityMetrics, setSustainabilityMetrics] = React.useState<SustainabilityMetrics>(() =>
    greenReadingEngine.getMetrics()
  );
  const [mfaStatus, setMfaStatus] = React.useState<MfaStatus | null>(null);
  const [loadingMfa, setLoadingMfa] = React.useState(true);
  const [showSetupModal, setShowSetupModal] = React.useState(false);
  const [removingFactorId, setRemovingFactorId] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsub = greenReadingEngine.subscribe(() => {
      setSustainabilityMetrics(greenReadingEngine.getMetrics());
    });
    return unsub;
  }, []);

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
    <div className="relative flex flex-col gap-8 max-w-4xl mx-auto pb-20">
      {/* Background Ambient Warm Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-card/85 p-6 sm:p-8 shadow-[0_12px_45px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-mono text-[11px] tracking-widest">Sanctum Preferences</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Display & Reader Settings
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Curate your reading atmosphere, typography scaling, distraction-free focus, and vault security.
            </p>
          </div>

          <div className="self-start sm:self-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-7">
        {/* Section 1: Color Palette & Paper Swatches */}
        <Card className="border border-amber-500/25 bg-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Atmospheric Paper & Canvas</span>
            </div>
            <CardTitle className="text-xl font-bold font-serif text-foreground mt-1">
              Color Palette & Theme
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Select between soft daytime vellum, deep night obsidian, or celestial system synchronization.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Option 1: Warm Paper */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer group",
                  theme === "light"
                    ? "border-amber-400 bg-amber-500/10 ring-1 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "border-stone-800 bg-stone-900/50 hover:bg-stone-900/80 hover:border-amber-500/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="font-serif font-bold">Warm Paper</span>
                  </div>
                  {theme === "light" && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </div>

                {/* Swatch Preview Bar */}
                <div className="h-10 rounded-lg bg-[#FAF7F0] border border-amber-900/10 p-2 flex items-center justify-between shadow-inner">
                  <span className="text-[11px] font-serif text-stone-800 font-medium italic">
                    Vellum Prose
                  </span>
                  <div className="w-3 h-3 rounded-full bg-amber-600/40" />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Soft sepia paper background crafted to reduce ocular fatigue in daylight.
                </p>
              </button>

              {/* Option 2: Obsidian (Dark Luxury) */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer group",
                  theme === "dark"
                    ? "border-amber-400 bg-amber-500/10 ring-1 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                    : "border-stone-800 bg-stone-900/50 hover:bg-stone-900/80 hover:border-amber-500/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span className="font-serif font-bold">Obsidian Noir</span>
                  </div>
                  {theme === "dark" && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </div>

                {/* Swatch Preview Bar */}
                <div className="h-10 rounded-lg bg-[#0B0D11] border border-amber-500/30 p-2 flex items-center justify-between shadow-inner">
                  <span className="text-[11px] font-serif text-amber-100/90 font-medium italic">
                    Obsidian Gold
                  </span>
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Deep onyx void with warm amber accents for immersive nocturnal reading.
                </p>
              </button>

              {/* Option 3: Automatic (System) */}
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={cn(
                  "relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer group",
                  theme === "system"
                    ? "border-amber-400 bg-amber-500/10 ring-1 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "border-stone-800 bg-stone-900/50 hover:bg-stone-900/80 hover:border-amber-500/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                    <Monitor className="w-4 h-4 text-amber-400" />
                    <span className="font-serif font-bold">Celestial Orbit</span>
                  </div>
                  {theme === "system" && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </div>

                {/* Swatch Preview Bar */}
                <div className="h-10 rounded-lg bg-gradient-to-r from-[#FAF7F0] to-[#0B0D11] border border-stone-700 p-2 flex items-center justify-between shadow-inner">
                  <span className="text-[10px] font-mono text-stone-600 dark:text-stone-300 font-medium">
                    Auto-Sync
                  </span>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Automatically aligns the page atmosphere to your device&apos;s diurnal clock.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Reader Typography Studio */}
        <Card className="border border-amber-500/25 bg-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Type className="w-4 h-4 text-amber-400" />
              <span>Literary Typesetting</span>
            </div>
            <CardTitle className="text-xl font-bold font-serif text-foreground mt-1">
              Typography & Scale Studio
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Adjust type scale and font aesthetics with a real-time illuminated drop-cap excerpt.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 pb-6 flex flex-col gap-6">
            {/* Controls Row: Font Family & Size Steppers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Font Family Dock */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  Typeface Style:
                </span>
                <div className="flex items-center gap-2">
                  {[
                    { id: "serif", label: "Editorial Serif", sample: "font-serif" },
                    { id: "sans", label: "Modern Sans", sample: "font-sans" },
                    { id: "mono", label: "Lore Mono", sample: "font-mono" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setFontStyle(style.id as FontStyleType)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer border",
                        fontStyle === style.id
                          ? "bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                          : "bg-stone-900/60 hover:bg-stone-800 text-muted-foreground hover:text-amber-300 border-stone-800"
                      )}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Dock */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  Type Scale:
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "small", label: "14px", name: "Compact" },
                    { id: "medium", label: "16px", name: "Default" },
                    { id: "large", label: "18px", name: "Comfort" },
                    { id: "xlarge", label: "22px", name: "Large" },
                  ].map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setFontSize(size.id as "small" | "medium" | "large" | "xlarge")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer border",
                        fontSize === size.id
                          ? "bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                          : "bg-stone-900/60 hover:bg-stone-800 text-muted-foreground hover:text-amber-300 border-stone-800"
                      )}
                    >
                      <span>{size.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Illuminated Drop-Cap Preview Box */}
            <div className="relative overflow-hidden p-6 sm:p-7 rounded-2xl border border-amber-500/30 bg-stone-950/70 shadow-xl backdrop-blur-md">
              <div className="absolute top-2 right-3 text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">
                Live Reader Preview
              </div>

              <div
                className={cn(
                  "leading-relaxed transition-all duration-300 text-foreground/90",
                  fontStyle === "serif" && "font-serif",
                  fontStyle === "sans" && "font-sans",
                  fontStyle === "mono" && "font-mono",
                  fontSize === "small" && "text-sm",
                  fontSize === "medium" && "text-base",
                  fontSize === "large" && "text-lg",
                  fontSize === "xlarge" && "text-xl sm:text-2xl"
                )}
              >
                {/* Classical Gold Illuminated Drop Cap */}
                <span className="float-left text-4xl sm:text-5xl font-serif font-black leading-none pr-3 pt-1 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                  S
                </span>
                <span>
                  he traced the constellations charted across the parchment. The stars, once thought to be static embers in an indifferent sky, pulsed with the steady rhythm of an ancient cosmos awaiting the reader&apos;s touch.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Immersion & Focus Mode */}
        <Card className="border border-amber-500/25 bg-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
                  <BellOff className="w-4 h-4 text-amber-400" />
                  <span>Sanctuary Focus</span>
                </div>
                <CardTitle className="text-xl font-bold font-serif text-foreground mt-1">
                  Distraction-Free Reading Mode
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Submerges secondary headers, notification badges, and dock icons into the shadows during active chapter reading.
                </CardDescription>
              </div>

              {/* Luxury Amber Toggle Switch */}
              <button
                type="button"
                onClick={() => setDistractionFree(!distractionFree)}
                aria-label="Toggle distraction-free mode"
                className={cn(
                  "w-12 h-7 rounded-full transition-all duration-300 relative cursor-pointer border p-0.5 shadow-inner shrink-0",
                  distractionFree
                    ? "bg-amber-500 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                    : "bg-stone-900 border-stone-800"
                )}
              >
                <span
                  className={cn(
                    "block w-5 h-5 rounded-full bg-stone-950 transition-transform duration-300 shadow-md",
                    distractionFree ? "translate-x-5 bg-stone-950" : "translate-x-0 bg-stone-500"
                  )}
                />
              </button>
            </div>
          </CardHeader>
        </Card>

        {/* Section 4: Green Computing & Digital Sustainability */}
        <Card className="border border-emerald-500/25 bg-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  <span>Green Computing & Digital Sustainability</span>
                </div>
                <CardTitle className="text-xl font-bold font-serif text-foreground mt-1">
                  Eco Reading & Telemetry
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Minimize network payloads, eliminate redundant API calls via chapter caching, and conserve GPU energy with 2D rendering.
                </CardDescription>
              </div>

              {/* Eco Mode Toggle Switch */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground hidden sm:inline">
                  {sustainabilityMetrics.ecoModeActive ? "Eco Mode Active" : "Eco Mode Off"}
                </span>
                <button
                  type="button"
                  onClick={() => greenReadingEngine.setEcoModeActive(!sustainabilityMetrics.ecoModeActive)}
                  aria-label="Toggle Eco Reading Mode"
                  className={cn(
                    "w-12 h-7 rounded-full transition-all duration-300 relative cursor-pointer border p-0.5 shadow-inner shrink-0",
                    sustainabilityMetrics.ecoModeActive
                      ? "bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                      : "bg-stone-900 border-stone-800"
                  )}
                >
                  <span
                    className={cn(
                      "block w-5 h-5 rounded-full transition-transform duration-300 shadow-md",
                      sustainabilityMetrics.ecoModeActive
                        ? "translate-x-5 bg-stone-950"
                        : "translate-x-0 bg-stone-500"
                    )}
                  />
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 pb-6 flex flex-col gap-5">
            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cache Hits</span>
                </div>
                <p className="text-xl font-serif font-bold text-foreground">
                  {sustainabilityMetrics.cacheHits}
                </p>
                <span className="text-[10px] text-muted-foreground">Tracked in session</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                  <CloudOff className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Avoided Calls</span>
                </div>
                <p className="text-xl font-serif font-bold text-foreground">
                  {sustainabilityMetrics.networkRequestsAvoided}
                </p>
                <span className="text-[10px] text-muted-foreground">Requests prevented</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Transferred</span>
                </div>
                <p className="text-xl font-serif font-bold text-foreground">
                  {formatBytes(sustainabilityMetrics.totalDataTransferredBytes)}
                </p>
                <span className="text-[10px] text-muted-foreground">Actual measured</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Est. Data Saved</span>
                </div>
                <p className="text-xl font-serif font-bold text-emerald-400">
                  {formatBytes(sustainabilityMetrics.estimatedDataSavedBytes)}
                </p>
                <span className="text-[10px] text-emerald-500/80 font-mono">Formula estimated</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-xs text-muted-foreground text-center sm:text-left">
                Measurements reflect client-side session payload caching and avoid speculative carbon claims.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => greenReadingEngine.resetMetrics()}
                  className="text-xs h-8 rounded-xl border-border/80 hover:bg-secondary cursor-pointer"
                >
                  Reset Session
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setSustainabilityModalOpen(true)}
                  className="text-xs h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer shadow-sm shadow-emerald-600/20"
                >
                  <Activity className="w-3.5 h-3.5 mr-1.5" />
                  Full Telemetry Modal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Vault Security & Two-Factor Authentication (TOTP) */}
        <Card className="border border-amber-500/25 bg-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Vault Authentication</span>
                </div>
                <CardTitle className="text-xl font-bold font-serif text-foreground mt-1">
                  Two-Factor Authentication (TOTP)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Bolster your author rights and reader credentials using an authenticator app (Google Authenticator, 1Password, or Apple Keychain).
                </CardDescription>
              </div>

              {/* Status Medallion */}
              {mfaStatus?.hasEnrolledMfa ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>AAL2 Shield Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-stone-900 text-stone-400 border border-stone-800 self-start sm:self-auto">
                  <ShieldAlert className="w-3.5 h-3.5 text-stone-500" />
                  <span>Protection Inactive</span>
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6 pb-6 flex flex-col gap-4">
            {["admin", "moderator"].includes(userRole || "") && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-bold capitalize font-serif">{userRole} Administrative Requirement: </span>
                  <span>
                    Two-Factor Authentication is mandatory for administrative privileges. Content management and publishing authorizations require active AAL2 verification.
                  </span>
                </div>
              </div>
            )}

            {loadingMfa ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Querying authenticator status...</span>
              </div>
            ) : mfaStatus?.hasEnrolledMfa ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2.5">
                  {mfaStatus.factors.map((factor) => (
                    <div
                      key={factor.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/20 bg-stone-950/60 text-sm shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-foreground font-serif">{factor.friendlyName}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            Enrolled {new Date(factor.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisableMfa(factor.id)}
                        disabled={removingFactorId === factor.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-8 border border-red-500/20"
                      >
                        {removingFactorId === factor.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                        )}
                        Deactivate
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your Taleora author rights and credentials require cryptographic TOTP challenge on login.
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-amber-500/25 bg-stone-950/50 shadow-md">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-serif font-bold text-foreground">
                    Arm Your Account With Authenticator Protection
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                    Require a 6-digit rolling code from your authenticator app in addition to your password whenever logging in.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setShowSetupModal(true)}
                  className="shrink-0 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold border-none shadow-md shadow-amber-500/20"
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

      {/* Sustainability & Green Telemetry Modal */}
      <SustainabilityDashboard
        isOpen={sustainabilityModalOpen}
        onClose={() => setSustainabilityModalOpen(false)}
      />
    </div>
  );
}
