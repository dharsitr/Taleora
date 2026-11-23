"use client";

import * as React from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Headphones,
  CloudRain,
  Flame,
  BookOpen,
  Coffee,
  Sparkles,
} from "lucide-react";
import { ambientSoundscapes, SoundscapeType } from "@/lib/audio/ambient-soundscapes";
import { textToSpeechEngine, TtsSpeed } from "@/lib/audio/text-to-speech";
import { cn } from "@/lib/utils";

interface ReaderAudioPopoverProps {
  paragraphs: string[];
  currentParagraphIndex?: number;
  onParagraphChange?: (idx: number) => void;
  onClose?: () => void;
}

const SOUNDSCAPES: Array<{
  id: SoundscapeType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "rain", label: "Soft Rain", desc: "Gentle window rainfall", icon: CloudRain },
  { id: "fireplace", label: "Hearth Fire", desc: "Warm crackling embers", icon: Flame },
  { id: "library", label: "Quiet Library", desc: "Soothing deep room tone", icon: BookOpen },
  { id: "coffeehouse", label: "Coffeehouse", desc: "Cozy cafe ambiance", icon: Coffee },
];

const SPEEDS: TtsSpeed[] = [0.8, 1.0, 1.25, 1.5];

export function ReaderAudioPopover({
  paragraphs,
  currentParagraphIndex = 0,
  onParagraphChange,
  onClose,
}: ReaderAudioPopoverProps) {
  const [activeTab, setActiveTab] = React.useState<"ambient" | "narration">("ambient");

  // Ambient soundscape states
  const [activeSoundscape, setActiveSoundscape] = React.useState<SoundscapeType | null>(
    ambientSoundscapes.getActive()
  );
  const [volume, setVolume] = React.useState<number>(ambientSoundscapes.getVolume());

  // Narration (TTS) states
  const [isTtsPlaying, setIsTtsPlaying] = React.useState(false);
  const [isTtsPaused, setIsTtsPaused] = React.useState(false);
  const [ttsSpeed, setTtsSpeed] = React.useState<TtsSpeed>(1.0);
  const [activeSpeechIdx, setActiveSpeechIdx] = React.useState(currentParagraphIndex);

  const handleToggleSoundscape = (type: SoundscapeType) => {
    if (activeSoundscape === type) {
      ambientSoundscapes.stop();
      setActiveSoundscape(null);
    } else {
      ambientSoundscapes.play(type, volume);
      setActiveSoundscape(type);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    ambientSoundscapes.setVolume(newVol);
  };

  const handlePlayNarration = () => {
    if (isTtsPaused) {
      textToSpeechEngine.resume();
      setIsTtsPaused(false);
      setIsTtsPlaying(true);
    } else {
      setIsTtsPlaying(true);
      setIsTtsPaused(false);
      textToSpeechEngine.playParagraphs(paragraphs, activeSpeechIdx, {
        onParagraphChange: (idx) => {
          setActiveSpeechIdx(idx);
          if (onParagraphChange) onParagraphChange(idx);
        },
        onEnd: () => {
          setIsTtsPlaying(false);
          setIsTtsPaused(false);
        },
      });
    }
  };

  const handlePauseNarration = () => {
    textToSpeechEngine.pause();
    setIsTtsPaused(true);
  };

  const handleStopNarration = () => {
    textToSpeechEngine.stop();
    setIsTtsPlaying(false);
    setIsTtsPaused(false);
  };

  const handleChangeSpeed = (speed: TtsSpeed) => {
    setTtsSpeed(speed);
    textToSpeechEngine.setSpeed(speed);
  };

  return (
    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-76 sm:w-84 rounded-2xl border border-border/80 bg-background/95 backdrop-blur-2xl p-4 shadow-2xl flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header with Mode Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-secondary/60 border border-border/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("ambient")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer",
              activeTab === "ambient"
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Soundscapes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("narration")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer",
              activeTab === "narration"
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Voice Narration
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-secondary"
          >
            Done
          </button>
        )}
      </div>

      {/* Tab 1: Ambient Soundscapes */}
      {activeTab === "ambient" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            {SOUNDSCAPES.map((item) => {
              const Icon = item.icon;
              const isPlaying = activeSoundscape === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleSoundscape(item.id)}
                  className={cn(
                    "p-2.5 rounded-xl border flex flex-col gap-1 text-left transition-all cursor-pointer",
                    isPlaying
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                      : "border-border/70 hover:border-border hover:bg-secondary/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={cn("w-4 h-4", isPlaying ? "text-primary animate-pulse" : "text-muted-foreground")} />
                    {isPlaying && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    )}
                  </div>
                  <span className={cn("text-xs font-serif font-bold", isPlaying ? "text-primary" : "text-foreground")}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2.5 pt-1 px-1">
            {volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="font-mono text-[10px] text-muted-foreground min-w-[28px] text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {activeSoundscape && (
            <button
              type="button"
              onClick={() => {
                ambientSoundscapes.stop();
                setActiveSoundscape(null);
              }}
              className="text-[11px] text-muted-foreground hover:text-rose-500 transition-colors text-center cursor-pointer mt-1"
            >
              Turn off ambient soundscape
            </button>
          )}
        </div>
      )}

      {/* Tab 2: Voice Narration (TTS) */}
      {activeTab === "narration" && (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between bg-secondary/40 border border-border/60 p-3 rounded-xl">
            <div className="flex flex-col">
              <span className="text-xs font-serif font-bold text-foreground">
                Story Reader Voice
              </span>
              <span className="text-[10px] text-muted-foreground">
                Paragraph {activeSpeechIdx + 1} of {paragraphs.length}
              </span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-1.5">
              {!isTtsPlaying || isTtsPaused ? (
                <button
                  type="button"
                  onClick={handlePlayNarration}
                  className="w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center cursor-pointer shadow-xs transition-transform active:scale-95"
                  title="Play Story Narration"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseNarration}
                  className="w-8 h-8 rounded-full bg-amber-600 text-white hover:bg-amber-700 flex items-center justify-center cursor-pointer shadow-xs transition-transform active:scale-95"
                  title="Pause Narration"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                </button>
              )}

              {(isTtsPlaying || isTtsPaused) && (
                <button
                  type="button"
                  onClick={handleStopNarration}
                  className="w-8 h-8 rounded-full border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
                  title="Stop Narration"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              )}
            </div>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-muted-foreground font-medium">Narration Pace</span>
            <div className="flex items-center gap-1">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleChangeSpeed(s)}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer",
                    ttsSpeed === s
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
