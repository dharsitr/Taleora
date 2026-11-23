"use client";

import * as React from "react";
import {
  List,
  Type,
  Bookmark,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  Sun,
  Coffee,
  Moon,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReaderSettings, ReaderTheme } from "@/types/books";
import { ReaderAudioPopover } from "./ReaderAudioPopover";
import { ambientSoundscapes } from "@/lib/audio/ambient-soundscapes";
import { textToSpeechEngine } from "@/lib/audio/text-to-speech";

interface ReaderFloatingHUDProps {
  progressPercentage: number;
  chapterNumber: number;
  totalChapters: number;
  estimatedMinutes: number;
  visible?: boolean;
  pageNumber?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onOpenChapters: () => void;
  onOpenSettings: () => void;
  onBookmarkCurrent?: () => void;
  isBookmarked?: boolean;
  zenMode?: boolean;
  onToggleZenMode?: () => void;
  settings?: ReaderSettings;
  onUpdateSettings?: (newSettings: Partial<ReaderSettings>) => void;
  paragraphs?: string[];
  currentParagraphIndex?: number;
  onParagraphSelect?: (idx: number) => void;
}

const THEME_OPTIONS: Array<{
  id: ReaderTheme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  borderClass: string;
}> = [
  { id: "light", label: "Linen", icon: Sun, bgClass: "bg-[#faf8f5]", borderClass: "border-[#e6ded3]" },
  { id: "sepia", label: "Sepia", icon: Coffee, bgClass: "bg-[#ede4cb]", borderClass: "border-[#d8caa8]" },
  { id: "dark", label: "Obsidian", icon: Moon, bgClass: "bg-[#090a0f]", borderClass: "border-zinc-800" },
  { id: "nordic", label: "Nordic", icon: Sparkles, bgClass: "bg-[#ffffff]", borderClass: "border-zinc-200" },
];

export function ReaderFloatingHUD({
  progressPercentage,
  chapterNumber,
  totalChapters,
  estimatedMinutes,
  visible = true,
  pageNumber,
  totalPages,
  onPageChange,
  onOpenChapters,
  onOpenSettings,
  onBookmarkCurrent,
  isBookmarked = false,
  zenMode = false,
  onToggleZenMode,
  settings,
  onUpdateSettings,
  paragraphs,
  currentParagraphIndex,
  onParagraphSelect,
}: ReaderFloatingHUDProps) {
  const [mounted, setMounted] = React.useState(false);
  const [isTypoPopoverOpen, setIsTypoPopoverOpen] = React.useState(false);
  const [isAudioPopoverOpen, setIsAudioPopoverOpen] = React.useState(false);
  const [isIdle, setIsIdle] = React.useState(false);
  const idleTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Inactivity auto-fade: after 4 seconds of idle, dim HUD smoothly
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 4000);
    };

    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("touchstart", resetIdleTimer);

    resetIdleTimer();

    return () => {
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("touchstart", resetIdleTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const fractionRemaining = 1 - progressPercentage / 100;
  const minutesRemaining = Math.max(
    1,
    Math.round((estimatedMinutes || 10) * fractionRemaining)
  );

  return (
    <>
      {/* Top Persistent Micro Progress Strip */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 h-[2.5px] z-50 bg-border/20 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_8px_rgba(194,89,35,0.5)]"
          style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
        />
      </div>

      {/* Floating Centered Glassmorphic HUD Dock */}
      <div
        className={cn(
          "fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 pointer-events-auto select-none max-w-[calc(100vw-24px)]",
          visible ? "translate-y-0" : "translate-y-8 pointer-events-none opacity-0",
          isIdle && !isTypoPopoverOpen && !isAudioPopoverOpen ? "opacity-35 hover:opacity-100" : "opacity-95 hover:opacity-100"
        )}
      >
        {/* Floating Quick Typography & Ambiance Popover */}
        {isTypoPopoverOpen && settings && onUpdateSettings && (
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 sm:w-80 rounded-2xl border border-border/80 bg-background/95 backdrop-blur-2xl p-4 shadow-2xl flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <span className="text-xs font-serif font-bold text-foreground flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" />
                Quick Appearance
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsTypoPopoverOpen(false);
                  onOpenSettings();
                }}
                className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
              >
                All Settings
              </button>
            </div>

            {/* Font Size Adjuster */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium">Font Scale</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}
                  className="w-7 h-7 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-xs font-bold text-foreground flex items-center justify-center cursor-pointer transition-colors"
                  title="Decrease Font Size"
                >
                  A-
                </button>
                <span className="font-mono text-xs font-bold text-foreground min-w-[36px] text-center">
                  {settings.fontSize}px
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ fontSize: Math.min(26, settings.fontSize + 1) })}
                  className="w-7 h-7 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-xs font-bold text-foreground flex items-center justify-center cursor-pointer transition-colors"
                  title="Increase Font Size"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Ambiance Switcher */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Reading Ambiance</span>
              <div className="grid grid-cols-4 gap-1.5">
                {THEME_OPTIONS.map((t) => {
                  const Icon = t.icon;
                  const isSelected = settings.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onUpdateSettings({ theme: t.id })}
                      className={cn(
                        "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer",
                        t.bgClass,
                        t.borderClass,
                        isSelected
                          ? "ring-2 ring-primary border-primary shadow-xs font-bold"
                          : "opacity-75 hover:opacity-100"
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-[9px] text-foreground tracking-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Floating Ambient & Narration Audio Popover */}
        {isAudioPopoverOpen && (
          <ReaderAudioPopover
            paragraphs={paragraphs || []}
            currentParagraphIndex={currentParagraphIndex}
            onParagraphChange={onParagraphSelect}
            onClose={() => setIsAudioPopoverOpen(false)}
          />
        )}

        {/* Main Dock Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-border/80 bg-background/90 dark:bg-card/90 backdrop-blur-2xl text-[11px] sm:text-xs text-muted-foreground shadow-2xl whitespace-nowrap overflow-x-auto ring-1 ring-black/5 dark:ring-white/10">
          {/* Table of Contents Button */}
          <button
            type="button"
            onClick={onOpenChapters}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-secondary hover:text-foreground text-muted-foreground transition-colors cursor-pointer shrink-0"
            title="Table of Contents (Chapters)"
          >
            <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <span className="h-3.5 w-px bg-border/80 shrink-0" />

          {/* Chapter / Progress Badge */}
          <span className="font-semibold text-foreground text-xs shrink-0 px-1">
            Ch. {chapterNumber}
          </span>

          {/* Stepper & Page Indicators */}
          {mounted && pageNumber !== undefined && totalPages !== undefined && (
            <>
              <div className="flex items-center gap-0.5 font-mono text-[11px] sm:text-xs shrink-0">
                {onPageChange && (
                  <button
                    type="button"
                    disabled={pageNumber <= 1}
                    onClick={() => onPageChange(pageNumber - 1)}
                    className="w-6 h-6 rounded-full hover:bg-secondary disabled:opacity-25 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="font-bold text-primary px-1">
                  {pageNumber} / {totalPages}
                </span>
                {onPageChange && (
                  <button
                    type="button"
                    disabled={pageNumber >= totalPages}
                    onClick={() => onPageChange(pageNumber + 1)}
                    className="w-6 h-6 rounded-full hover:bg-secondary disabled:opacity-25 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          )}

          <span className="h-3.5 w-px bg-border/80 shrink-0" />

          {/* Quick Typography & Ambiance Popover Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsAudioPopoverOpen(false);
              setIsTypoPopoverOpen(!isTypoPopoverOpen);
            }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-serif font-bold transition-colors cursor-pointer shrink-0",
              isTypoPopoverOpen
                ? "bg-primary text-primary-foreground shadow-xs"
                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
            )}
            title="Quick Typography & Ambiance"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Aa</span>
          </button>

          {/* Quick Audio & Ambient Soundscapes Button */}
          <button
            type="button"
            onClick={() => {
              setIsTypoPopoverOpen(false);
              setIsAudioPopoverOpen(!isAudioPopoverOpen);
            }}
            className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 relative",
              isAudioPopoverOpen
                ? "bg-primary text-primary-foreground shadow-xs"
                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
            )}
            title="Ambient Soundscapes & Story Narration"
          >
            <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {typeof window !== "undefined" && (ambientSoundscapes.getActive() || textToSpeechEngine.getState().isPlaying) && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          {/* Quick Bookmark Ribbon Button */}
          {onBookmarkCurrent && (
            <button
              type="button"
              onClick={onBookmarkCurrent}
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0",
                isBookmarked
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              title={isBookmarked ? "Page Bookmarked" : "Bookmark This Page"}
            >
              <Bookmark className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isBookmarked && "fill-current")} />
            </button>
          )}

          {/* Zen Mode Button */}
          {onToggleZenMode && (
            <button
              type="button"
              onClick={onToggleZenMode}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-secondary hover:text-foreground text-muted-foreground transition-colors cursor-pointer shrink-0"
              title={zenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
            >
              {zenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Remaining reading time */}
          <span className="hidden md:flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground/80 shrink-0 pl-1 border-l border-border/80">
            <Clock className="w-3 h-3 text-primary/70" />
            <span>~{minutesRemaining}m</span>
          </span>
        </div>
      </div>
    </>
  );
}
