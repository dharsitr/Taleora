"use client";

import * as React from "react";
import { Copy, Check, MessageSquarePlus, X } from "lucide-react";
import { HighlightColor } from "@/types/books";
import { HIGHLIGHT_COLORS } from "@/lib/books/highlights";
import { cn } from "@/lib/utils";

interface HighlightToolbarProps {
  position: { x: number; y: number } | null;
  onHighlight: (color: HighlightColor, openNote?: boolean) => void;
  onClose: () => void;
}

export function HighlightToolbar({
  position,
  onHighlight,
  onClose,
}: HighlightToolbarProps) {
  const [copied, setCopied] = React.useState(false);

  if (!position) return null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const selection = window.getSelection();
      if (selection) {
        await navigator.clipboard.writeText(selection.toString());
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          onClose();
        }, 800);
      }
    } catch {
      // Ignore clipboard error
    }
  };

  const colors = Object.values(HIGHLIGHT_COLORS);

  return (
    <div
      role="toolbar"
      aria-label="Highlight Text Options"
      className={cn(
        "fixed z-50 flex items-center gap-1.5 p-1.5 rounded-xl border border-border/80 bg-background/95 backdrop-blur-md shadow-xl transition-all duration-150 animate-in fade-in zoom-in-95"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%) translateY(-10px)",
      }}
      onMouseDown={(e) => {
        // Prevent loss of selection on click
        e.preventDefault();
      }}
    >
      {/* Color options */}
      <div className="flex items-center gap-1 px-1 border-r border-border/60">
        {colors.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onHighlight(c.key, false)}
            title={`Highlight ${c.name}`}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-125 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <span
              className={cn("w-4.5 h-4.5 rounded-full shadow-xs", c.previewBg)}
            />
          </button>
        ))}
      </div>

      {/* Add Note Button */}
      <button
        type="button"
        onClick={() => onHighlight("amber", true)}
        title="Highlight & Add Note"
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer"
      >
        <MessageSquarePlus className="w-3.5 h-3.5 text-primary" />
        <span className="hidden sm:inline">Note</span>
      </button>

      {/* Copy Text Button */}
      <button
        type="button"
        onClick={handleCopy}
        title="Copy Selected Text"
        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={onClose}
        title="Close toolbar"
        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
