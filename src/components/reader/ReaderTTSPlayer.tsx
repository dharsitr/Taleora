"use client";

import * as React from "react";
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Volume2,
  X,
  Sparkles,
} from "lucide-react";
import { textToSpeechEngine, TtsState, TtsSpeed } from "@/lib/audio/text-to-speech";
import { cn } from "@/lib/utils";

interface ReaderTTSPlayerProps {
  visible?: boolean;
  onSentenceChange?: (sentence: string) => void;
}

const SPEEDS: TtsSpeed[] = [0.8, 1.0, 1.25, 1.5];

export function ReaderTTSPlayer({ visible = true }: ReaderTTSPlayerProps) {
  const [ttsState, setTtsState] = React.useState<TtsState>(textToSpeechEngine.getState());

  React.useEffect(() => {
    const unsub = textToSpeechEngine.subscribe((state) => {
      setTtsState({ ...state });
    });
    return () => unsub();
  }, []);

  if (!ttsState.isPlaying && !ttsState.isPaused) {
    return null;
  }

  const handleTogglePlay = () => {
    if (ttsState.isPaused) {
      textToSpeechEngine.resume();
    } else {
      textToSpeechEngine.pause();
    }
  };

  const handleNextSpeed = () => {
    const idx = SPEEDS.indexOf(ttsState.speed);
    const nextSpeed = SPEEDS[(idx + 1) % SPEEDS.length];
    textToSpeechEngine.setSpeed(nextSpeed);
  };

  return (
    <div
      role="region"
      aria-label="Audio Narration Player"
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] sm:w-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-full border border-amber-500/30 bg-background/95 dark:bg-[#11141D]/95 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(245,158,11,0.15)] animate-in fade-in slide-in-from-bottom-4 duration-200 transition-all text-foreground"
      )}
    >
      {/* Play/Pause & Soundwave indicator */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleTogglePlay}
          title={ttsState.isPaused ? "Resume Narration" : "Pause Narration"}
          className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          {ttsState.isPaused ? (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          ) : (
            <Pause className="w-3.5 h-3.5 fill-current" />
          )}
        </button>

        {/* Audio Wave Visualizer Bars */}
        <div className="hidden sm:flex items-end gap-0.5 h-4 w-5 shrink-0">
          <span
            className={cn(
              "w-0.5 bg-amber-500 rounded-full transition-all",
              ttsState.isPaused ? "h-1" : "h-3 animate-pulse"
            )}
          />
          <span
            className={cn(
              "w-0.5 bg-amber-500 rounded-full transition-all",
              ttsState.isPaused ? "h-2" : "h-4 animate-bounce"
            )}
          />
          <span
            className={cn(
              "w-0.5 bg-amber-500 rounded-full transition-all",
              ttsState.isPaused ? "h-1" : "h-2.5 animate-pulse"
            )}
          />
        </div>
      </div>

      {/* Spoken Text Preview */}
      <div className="flex-1 min-w-0 px-1">
        <p className="text-[11px] font-serif italic text-foreground line-clamp-1 max-w-[200px] sm:max-w-[280px]">
          {ttsState.currentSentenceText || "Narrating chapter..."}
        </p>
      </div>

      {/* Controls: Skip sentence, speed, and close */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => textToSpeechEngine.previousSentence()}
          title="Previous Sentence"
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => textToSpeechEngine.nextSentence()}
          title="Next Sentence"
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Speed button */}
        <button
          type="button"
          onClick={handleNextSpeed}
          title="Change Narration Speed"
          className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 font-mono text-[10px] font-bold hover:bg-amber-500/20 cursor-pointer transition-colors"
        >
          {ttsState.speed}x
        </button>

        {/* Stop / Close button */}
        <button
          type="button"
          onClick={() => textToSpeechEngine.stop()}
          title="Close Narration"
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
