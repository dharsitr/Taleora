"use client";

import * as React from "react";
import {
  X,
  Leaf,
  Database,
  CloudOff,
  Activity,
  RotateCcw,
  Info,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  SustainabilityMetrics,
  greenReadingEngine,
  formatBytes,
} from "@/lib/green/eco-reading";
import { ReaderSettings } from "@/types/books";
import { cn } from "@/lib/utils";

interface SustainabilityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export function SustainabilityDashboard({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SustainabilityDashboardProps) {
  const [metrics, setMetrics] = React.useState<SustainabilityMetrics>(() =>
    greenReadingEngine.getMetrics()
  );

  React.useEffect(() => {
    if (!isOpen) return;
    setMetrics(greenReadingEngine.getMetrics());

    const unsubscribe = greenReadingEngine.subscribe(() => {
      setMetrics(greenReadingEngine.getMetrics());
    });

    return unsubscribe;
  }, [isOpen]);

  // Sync Eco mode state with settings
  const isEcoActive = Boolean(settings.ecoMode);

  const toggleEcoMode = () => {
    const nextState = !isEcoActive;
    onUpdateSettings({
      ecoMode: nextState,
      // When Eco mode is turned on, force readerMode to 2d for low-power rendering
      readerMode: nextState ? "2d" : settings.readerMode || "3d",
    });
    greenReadingEngine.setEcoModeActive(nextState);
  };

  const handleReset = () => {
    greenReadingEngine.resetMetrics();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl flex flex-col gap-4 sm:gap-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-label="Sustainability & Green Reading Dashboard"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                Sustainability Dashboard
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Green Computing & Resource Optimization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dashboard"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Eco Mode Toggle Card */}
        <div
          className={cn(
            "p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
            isEcoActive
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-50"
              : "bg-secondary/40 border-border text-foreground"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                isEcoActive
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Eco Reading Mode</span>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    isEcoActive
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {isEcoActive ? "Active" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {isEcoActive
                  ? "Low-power 2D canvas, persistent chapter caching, and minimized network transfers active."
                  : "Enable to save device battery and eliminate repeat network requests."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleEcoMode}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all flex items-center justify-center gap-1.5",
              isEcoActive
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>{isEcoActive ? "Disable Eco" : "Enable Eco"}</span>
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* 1. Cache Hits */}
          <div className="p-3.5 rounded-xl border border-border bg-card/60 flex flex-col gap-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-primary" />
                <span>Cache Hits</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-secondary text-foreground uppercase tracking-wide">
                Tracked
              </span>
            </div>
            <div className="font-mono text-2xl font-bold text-foreground mt-1">
              {metrics.cacheHits}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Chapters served from memory / session cache
            </p>
          </div>

          {/* 2. Requests Avoided */}
          <div className="p-3.5 rounded-xl border border-border bg-card/60 flex flex-col gap-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <CloudOff className="w-3.5 h-3.5 text-emerald-500" />
                <span>Requests Avoided</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-secondary text-foreground uppercase tracking-wide">
                Tracked
              </span>
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics.networkRequestsAvoided}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Redundant network roundtrips prevented
            </p>
          </div>

          {/* 3. Estimated Data Saved */}
          <div className="p-3.5 rounded-xl border border-border bg-card/60 flex flex-col gap-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Est. Data Saved</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 uppercase tracking-wide font-bold">
                Estimate
              </span>
            </div>
            <div className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {formatBytes(metrics.estimatedDataSavedBytes)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Estimated based on avoided chapter payload bytes
            </p>
          </div>

          {/* 4. Total Data Transferred */}
          <div className="p-3.5 rounded-xl border border-border bg-card/60 flex flex-col gap-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-500" />
                <span>Data Transferred</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-secondary text-foreground uppercase tracking-wide">
                Tracked
              </span>
            </div>
            <div className="font-mono text-2xl font-bold text-foreground mt-1">
              {formatBytes(metrics.totalDataTransferredBytes)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Actual measured reader HTTP transfer bytes
            </p>
          </div>
        </div>

        {/* Active Optimizations Checklist */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-border bg-secondary/30">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Active Green Computing Optimizations</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{isEcoActive ? "Low-power 2D reader active" : "3D GPU reader active"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>In-memory chapter caching</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Lazy loading for non-essential media</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Zero-redundancy repeated reads</span>
            </div>
          </div>
        </div>

        {/* Transparency & Measurement Notice */}
        <div className="p-3 rounded-xl border border-border/80 bg-background/50 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>
            <strong className="text-foreground">Measurement Integrity:</strong> Metrics are
            derived from actual HTTP payload measurements and cache interception. Taleora adheres
            to scientific Green Computing standards and does not output speculative electricity or
            carbon claims without physical hardware telemetry.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border/70">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-secondary"
            title="Reset session telemetry counters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Telemetry</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
