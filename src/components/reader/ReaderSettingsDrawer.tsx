"use client";

import * as React from "react";
import {
  X,
  Type,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Coffee,
  AlignLeft,
  Columns,
  BookOpen,
  FileText,
} from "lucide-react";
import { ReaderSettings, ReaderFontFamily, ReaderWidth } from "@/types/books";
import { cn } from "@/lib/utils";

interface ReaderSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export function ReaderSettingsDrawer({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: ReaderSettingsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-6"
        role="dialog"
        aria-label="Reader Appearance Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            <h3 className="font-serif text-lg font-bold text-foreground">
              Reading Appearance
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Theme Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Reading Palette
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Light / Warm Paper */}
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: "light" })}
              className={cn(
                "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                settings.theme === "light"
                  ? "border-primary bg-[#faf8f5] text-zinc-900 shadow-xs ring-2 ring-primary/20 font-bold"
                  : "border-border bg-[#faf8f5] text-zinc-700 hover:opacity-90"
              )}
            >
              <Sun className="w-4 h-4 text-amber-600" />
              <span className="text-xs">Warm Paper</span>
            </button>

            {/* Sepia / Vintage Parchment */}
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: "sepia" })}
              className={cn(
                "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                settings.theme === "sepia"
                  ? "border-amber-700 bg-[#f4ecd8] text-[#433422] shadow-xs ring-2 ring-amber-700/30 font-bold"
                  : "border-[#e4d7b8] bg-[#f4ecd8] text-[#594630] hover:opacity-90"
              )}
            >
              <Coffee className="w-4 h-4 text-amber-800" />
              <span className="text-xs">Sepia</span>
            </button>

            {/* Dark / Obsidian */}
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: "dark" })}
              className={cn(
                "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                settings.theme === "dark"
                  ? "border-primary bg-[#0d0f14] text-slate-100 shadow-xs ring-2 ring-primary/20 font-bold"
                  : "border-zinc-800 bg-[#0d0f14] text-slate-400 hover:opacity-90"
              )}
            >
              <Moon className="w-4 h-4 text-primary" />
              <span className="text-xs">Obsidian</span>
            </button>
          </div>
        </div>

        {/* 2. Font Family */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Typeface
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "serif" as ReaderFontFamily, label: "Literary Serif", font: "font-serif" },
              { id: "sans" as ReaderFontFamily, label: "Modern Sans", font: "font-sans" },
              { id: "mono" as ReaderFontFamily, label: "Monospace", font: "font-mono" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onUpdateSettings({ fontFamily: item.id })}
                className={cn(
                  "py-2 px-3 rounded-lg border text-xs text-center transition-all cursor-pointer",
                  item.font,
                  settings.fontFamily === item.id
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                    : "bg-secondary/60 text-foreground border-border/80 hover:bg-secondary"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Font Size Controls */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">
              Font Size
            </span>
            <span className="font-bold text-foreground">{settings.fontSize}px</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={settings.fontSize <= 14}
              onClick={() =>
                onUpdateSettings({ fontSize: Math.max(14, settings.fontSize - 2) })
              }
              aria-label="Decrease font size"
              className="w-10 h-10 rounded-lg border border-border bg-secondary flex items-center justify-center font-bold text-base hover:bg-secondary/80 disabled:opacity-40 cursor-pointer"
            >
              A-
            </button>

            <div className="flex-1 flex items-center justify-between px-2 text-xs text-muted-foreground">
              {[14, 16, 18, 20, 22, 24].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onUpdateSettings({ fontSize: size })}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors text-xs",
                    settings.fontSize === size
                      ? "bg-primary text-primary-foreground font-bold"
                      : "hover:bg-secondary"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={settings.fontSize >= 24}
              onClick={() =>
                onUpdateSettings({ fontSize: Math.min(24, settings.fontSize + 2) })
              }
              aria-label="Increase font size"
              className="w-10 h-10 rounded-lg border border-border bg-secondary flex items-center justify-center font-bold text-base hover:bg-secondary/80 disabled:opacity-40 cursor-pointer"
            >
              A+
            </button>
          </div>
        </div>

        {/* 4. Line Spacing & Reading Width */}
        <div className="grid grid-cols-2 gap-4">
          {/* Line Spacing */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Line Height</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 1.5, label: "Tight" },
                { value: 1.8, label: "Norm" },
                { value: 2.2, label: "Loose" },
              ].map((lh) => (
                <button
                  key={lh.value}
                  type="button"
                  onClick={() => onUpdateSettings({ lineHeight: lh.value })}
                  className={cn(
                    "py-1.5 px-2 rounded-md border text-[11px] text-center transition-all cursor-pointer",
                    Math.abs(settings.lineHeight - lh.value) < 0.1
                      ? "bg-primary text-primary-foreground border-primary font-bold"
                      : "bg-secondary/60 text-foreground border-border/80 hover:bg-secondary"
                  )}
                >
                  {lh.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Width */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Columns className="w-3.5 h-3.5" />
              <span>Margins</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: "narrow" as ReaderWidth, label: "Narrow" },
                { id: "standard" as ReaderWidth, label: "Standard" },
                { id: "wide" as ReaderWidth, label: "Wide" },
              ].map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onUpdateSettings({ width: w.id })}
                  className={cn(
                    "py-1.5 px-1.5 rounded-md border text-[11px] text-center transition-all cursor-pointer",
                    settings.width === w.id
                      ? "bg-primary text-primary-foreground border-primary font-bold"
                      : "bg-secondary/60 text-foreground border-border/80 hover:bg-secondary"
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Book Layout (Two-Page Spread vs Single Page) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Book Layout</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateSettings({ pageLayout: "spread" })}
              className={cn(
                "py-2 px-3 rounded-lg border text-xs flex items-center justify-center gap-2 transition-all cursor-pointer",
                settings.pageLayout === "spread" || !settings.pageLayout
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                  : "bg-secondary/60 text-foreground border-border/80 hover:bg-secondary"
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span>Two-Page Book</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ pageLayout: "single" })}
              className={cn(
                "py-2 px-3 rounded-lg border text-xs flex items-center justify-center gap-2 transition-all cursor-pointer",
                settings.pageLayout === "single"
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                  : "bg-secondary/60 text-foreground border-border/80 hover:bg-secondary"
              )}
            >
              <FileText className="w-4 h-4" />
              <span>Single Page</span>
            </button>
          </div>
        </div>

        {/* 5. Zen Mode Toggle */}
        <div className="pt-2 border-t border-border/70 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">
              Zen / Distraction-Free Mode
            </span>
            <span className="text-[11px] text-muted-foreground">
              Hide header toolbars while reading (Press F or tap canvas)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onUpdateSettings({ zenMode: !settings.zenMode })}
            className={cn(
              "px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
              settings.zenMode
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
            )}
          >
            {settings.zenMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Enter Zen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
