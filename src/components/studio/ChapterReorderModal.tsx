"use client";

import * as React from "react";
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Layers,
  Sparkles,
  Save,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ChapterRow } from "@/types/books";
import { cn } from "@/lib/utils";

interface ChapterReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterRow[];
  onOrderSaved: (newOrder: ChapterRow[]) => void;
}

export function ChapterReorderModal({
  isOpen,
  onClose,
  chapters,
  onOrderSaved,
}: ChapterReorderModalProps) {
  const [list, setList] = React.useState<ChapterRow[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setList([...chapters].sort((a, b) => a.chapter_number - b.chapter_number));
  }, [chapters, isOpen]);

  if (!isOpen) return null;

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const copy = [...list];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);

    // Re-index chapter numbers
    const updated = copy.map((ch, i) => ({
      ...ch,
      chapter_number: i + 1,
    }));
    setList(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      // Batch update chapter numbers
      const promises = list.map((ch) =>
        supabase
          .from("chapters")
          .update({ chapter_number: ch.chapter_number })
          .eq("id", ch.id)
      );
      await Promise.all(promises);

      onOrderSaved(list);
      onClose();
    } catch (err) {
      console.error("Failed to reorder chapters:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/30 bg-[#10131B]/95 backdrop-blur-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white">
                Chapter Sequencer & Reorder
              </h3>
              <p className="text-[11px] text-zinc-400">
                Move chapters up or down to re-index sequence in 1 click
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List of chapters with up/down arrows */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {list.map((ch, idx) => (
            <div
              key={ch.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-serif font-bold text-xs text-white truncate">
                    {ch.title}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {ch.word_count || 0} words · ~{ch.estimated_read_minutes || 1}m
                  </span>
                </div>
              </div>

              {/* Up / Down Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveItem(idx, "up")}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 disabled:opacity-20 flex items-center justify-center transition-colors cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === list.length - 1}
                  onClick={() => moveItem(idx, "down")}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 disabled:opacity-20 flex items-center justify-center transition-colors cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-white cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isSaving}
            onClick={handleSave}
            className="gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-md cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving Order..." : "Save Chapter Sequence"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
