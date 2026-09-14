"use client";

import * as React from "react";
import { X, Trash2, Check, StickyNote } from "lucide-react";
import { HighlightColor, HighlightRow } from "@/types/books";
import { HIGHLIGHT_COLORS } from "@/lib/books/highlights";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface HighlightNoteModalProps {
  highlight: HighlightRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (highlightId: string, note: string | null, color: HighlightColor) => Promise<void>;
  onDeleteHighlight: (highlightId: string) => Promise<void>;
}

interface HighlightNoteFormProps {
  highlight: HighlightRow;
  onClose: () => void;
  onSaveNote: (highlightId: string, note: string | null, color: HighlightColor) => Promise<void>;
  onDeleteHighlight: (highlightId: string) => Promise<void>;
}

function HighlightNoteForm({
  highlight,
  onClose,
  onSaveNote,
  onDeleteHighlight,
}: HighlightNoteFormProps) {
  const [noteText, setNoteText] = React.useState(highlight.note || "");
  const [selectedColor, setSelectedColor] = React.useState<HighlightColor>(
    (highlight.color as HighlightColor) || "amber"
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveNote(highlight.id, noteText.trim() ? noteText : null, selectedColor);
      onClose();
    } catch (err) {
      console.error("Error saving note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this highlight and its note?")) return;
    setIsDeleting(true);
    try {
      await onDeleteHighlight(highlight.id);
      onClose();
    } catch (err) {
      console.error("Error deleting highlight:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const colors = Object.values(HIGHLIGHT_COLORS);

  return (
    <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-secondary/30">
        <div className="flex items-center gap-2 text-foreground font-serif font-semibold">
          <StickyNote className="w-4 h-4 text-primary" />
          <span id="note-modal-title">Highlight & Note</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-5 flex flex-col gap-4">
        {/* Highlighted Quote Preview */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Highlighted Passage
          </span>
          <blockquote
            className={cn(
              "p-3.5 rounded-xl border-l-4 text-sm font-serif italic text-foreground/90 bg-secondary/40 leading-relaxed max-h-36 overflow-y-auto",
              selectedColor === "amber" && "border-amber-400 bg-amber-500/10",
              selectedColor === "emerald" && "border-emerald-400 bg-emerald-500/10",
              selectedColor === "sky" && "border-sky-400 bg-sky-500/10",
              selectedColor === "rose" && "border-rose-400 bg-rose-500/10",
              selectedColor === "violet" && "border-purple-400 bg-purple-500/10"
            )}
          >
            &ldquo;{highlight.selected_text}&rdquo;
          </blockquote>
        </div>

        {/* Color Selector */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-medium text-muted-foreground">
            Color tint:
          </span>
          <div className="flex items-center gap-2">
            {colors.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedColor(c.key)}
                title={c.name}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer",
                  selectedColor === c.key
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                    : "opacity-75 hover:opacity-100 hover:scale-105"
                )}
              >
                <span className={cn("w-5 h-5 rounded-full shadow-xs", c.previewBg)} />
              </button>
            ))}
          </div>
        </div>

        {/* Note Input */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="highlight-note-input"
            className="text-xs font-medium text-foreground"
          >
            Personal Annotation / Note
          </label>
          <textarea
            id="highlight-note-input"
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Record your thoughts, connections, or literary reflections on this passage..."
            className="w-full rounded-xl border border-input bg-background/70 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/80 bg-secondary/20">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting || isSaving}
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 gap-1.5 cursor-pointer text-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{isDeleting ? "Deleting..." : "Delete Highlight"}</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
            className="text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isDeleting}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function HighlightNoteModal({
  highlight,
  isOpen,
  onClose,
  onSaveNote,
  onDeleteHighlight,
}: HighlightNoteModalProps) {
  if (!isOpen || !highlight) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <HighlightNoteForm
        key={highlight.id}
        highlight={highlight}
        onClose={onClose}
        onSaveNote={onSaveNote}
        onDeleteHighlight={onDeleteHighlight}
      />
    </div>
  );
}
