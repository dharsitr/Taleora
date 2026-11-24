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
  Disc,
  Sliders,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  ambientSoundscapes,
  SoundscapeType,
  SOUNDSCAPE_PRESETS,
  SoundscapePreset,
} from "@/lib/audio/ambient-soundscapes";
import {
  textToSpeechEngine,
  TtsSpeed,
  TtsState,
} from "@/lib/audio/text-to-speech";
import { cn } from "@/lib/utils";

interface ReaderAudioPopoverProps {
  paragraphs: string[];
  currentParagraphIndex?: number;
  onParagraphChange?: (idx: number) => void;
  onClose?: () => void;
}

const SOUNDSCAPE_CHANNELS: Array<{
  id: SoundscapeType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "rain", label: "Soft Rain", desc: "Gentle window rainfall", icon: CloudRain },
  { id: "fireplace", label: "Hearth Fire", desc: "Warm crackling embers", icon: Flame },
  { id: "library", label: "Quiet Library", desc: "Soothing deep room tone", icon: BookOpen },
  { id: "coffeehouse", label: "Coffeehouse", desc: "Cozy cafe ambiance", icon: Coffee },
  { id: "lofi", label: "Lo-Fi Vinyl", desc: "Warm harmonic vinyl crackle", icon: Disc },
];

const SPEEDS: TtsSpeed[] = [0.8, 1.0, 1.25, 1.5];

export function ReaderAudioPopover({
  paragraphs,
  currentParagraphIndex = 0,
  onParagraphChange,
  onClose,
}: ReaderAudioPopoverProps) {
  const [activeTab, setActiveTab] = React.useState<"ambient" | "narration">("ambient");

  // Multi-track ambient volumes
  const [activeVolumes, setActiveVolumes] = React.useState<Record<SoundscapeType, number>>(
    ambientSoundscapes.getActiveVolumes()
  );
  const [masterVolume, setMasterVolume] = React.useState<number>(ambientSoundscapes.getVolume());

  // Narration (TTS) states
  const [ttsState, setTtsState] = React.useState<TtsState>(textToSpeechEngine.getState());
  const [availableVoices, setAvailableVoices] = React.useState<SpeechSynthesisVoice[]>([]);

  // Subscribe to audio engines
  React.useEffect(() => {
    const unsubAmbient = ambientSoundscapes.subscribe((vols) => {
      setActiveVolumes({ ...vols });
    });
    const unsubTts = textToSpeechEngine.subscribe((state) => {
      setTtsState({ ...state });
    });

    if (textToSpeechEngine.isSupported()) {
      setAvailableVoices(textToSpeechEngine.getAvailableVoices());
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          setAvailableVoices(textToSpeechEngine.getAvailableVoices());
        };
      }
    }

    return () => {
      unsubAmbient();
      unsubTts();
    };
  }, []);

  const handleChannelVolumeChange = (type: SoundscapeType, val: number) => {
    ambientSoundscapes.setTrackVolume(type, val);
  };

  const handleMasterVolumeChange = (val: number) => {
    setMasterVolume(val);
    ambientSoundscapes.setMasterVolume(val);
  };

  const handleApplyPreset = (preset: SoundscapePreset) => {
    ambientSoundscapes.applyPreset(preset);
  };

  const handlePlayNarration = () => {
    if (ttsState.isPaused) {
      textToSpeechEngine.resume();
    } else {
      textToSpeechEngine.playParagraphs(paragraphs, currentParagraphIndex, {
        onParagraphChange: (idx) => {
          if (onParagraphChange) onParagraphChange(idx);
        },
      });
    }
  };

  const handlePauseNarration = () => {
    textToSpeechEngine.pause();
  };

  const handleStopNarration = () => {
    textToSpeechEngine.stop();
  };

  const hasAnyAmbientActive = Object.values(activeVolumes).some((v) => v > 0);

  return (
    <div className="w-[340px] sm:w-[380px] rounded-2xl border border-border/80 bg-background/95 dark:bg-[#111319]/95 backdrop-blur-2xl shadow-2xl overflow-hidden p-4 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150 text-foreground">
      {/* Popover Header with Tab Switcher */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Audio Immersion
            </h3>
            <p className="text-[10px] text-muted-foreground">Procedural & Narration Engine</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-0.5 rounded-lg bg-secondary/70 border border-border/50 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("ambient")}
            className={cn(
              "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1",
              activeTab === "ambient"
                ? "bg-background text-amber-500 dark:text-amber-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Ambience</span>
            {hasAnyAmbientActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("narration")}
            className={cn(
              "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1",
              activeTab === "narration"
                ? "bg-background text-amber-500 dark:text-amber-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Narration</span>
            {ttsState.isPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: AMBIENT SOUNDSCAPES MIXER */}
      {activeTab === "ambient" && (
        <div className="flex flex-col gap-3">
          {/* Quick Scene Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Atmosphere Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {SOUNDSCAPE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2 py-1.5 rounded-xl border border-border/70 hover:border-amber-500/40 bg-card/60 hover:bg-secondary/60 text-left transition-all cursor-pointer flex flex-col"
                >
                  <span className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                    {p.name}
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  </span>
                  <span className="text-[9px] text-muted-foreground line-clamp-1">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Track Volume Channels */}
          <div className="flex flex-col gap-2 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sound Channels
              </span>
              {hasAnyAmbientActive && (
                <button
                  type="button"
                  onClick={() => ambientSoundscapes.stopAll()}
                  className="text-[10px] text-amber-500 hover:underline cursor-pointer"
                >
                  Mute All
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 max-h-[170px] overflow-y-auto pr-1">
              {SOUNDSCAPE_CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const vol = activeVolumes[ch.id] || 0;
                const isActive = vol > 0;

                return (
                  <div
                    key={ch.id}
                    className={cn(
                      "flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-xl border transition-all",
                      isActive
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-secondary/30 border-border/40 opacity-75 hover:opacity-100"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => ambientSoundscapes.toggleTrack(ch.id, 0.5)}
                      className="flex items-center gap-2 cursor-pointer text-left w-28 shrink-0"
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                          isActive
                            ? "bg-amber-500 text-stone-950 font-bold"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-foreground leading-tight">
                          {ch.label}
                        </span>
                        <span className="text-[9px] text-muted-foreground line-clamp-1">
                          {ch.desc}
                        </span>
                      </div>
                    </button>

                    {/* Channel Volume Slider */}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(vol * 100)}
                      onChange={(e) =>
                        handleChannelVolumeChange(ch.id, Number(e.target.value) / 100)
                      }
                      className="flex-1 h-1 bg-secondary rounded-lg accent-amber-500 cursor-pointer"
                    />

                    <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">
                      {Math.round(vol * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master Volume */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3 text-xs">
            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              Master Volume
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(masterVolume * 100)}
              onChange={(e) => handleMasterVolumeChange(Number(e.target.value) / 100)}
              className="w-28 h-1 bg-secondary rounded-lg accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-foreground font-semibold">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: NARRATION (TTS) ENGINE */}
      {activeTab === "narration" && (
        <div className="flex flex-col gap-3.5">
          {/* Active Sentence Preview */}
          <div className="p-3 rounded-xl bg-card border border-border/70 flex flex-col gap-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                Spoken Sentence
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Para {ttsState.currentParagraphIndex + 1} of {paragraphs.length}
              </span>
            </div>
            <p className="text-xs font-serif italic text-foreground line-clamp-2">
              {ttsState.currentSentenceText ||
                paragraphs[currentParagraphIndex]?.slice(0, 110) ||
                "Ready to narrate chapter..."}
            </p>
          </div>

          {/* Voice Selection */}
          {availableVoices.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Narrator Voice
              </label>
              <select
                value={ttsState.selectedVoiceName || ""}
                onChange={(e) => textToSpeechEngine.setVoice(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-input bg-background text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Playback Controls & Speed */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60">
            {/* Speed Pills */}
            <div className="flex items-center gap-1">
              {SPEEDS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => textToSpeechEngine.setSpeed(sp)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer",
                    ttsState.speed === sp
                      ? "bg-amber-500 text-stone-950 font-bold"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sp}x
                </button>
              ))}
            </div>

            {/* Play/Pause/Stop Buttons */}
            <div className="flex items-center gap-2">
              {ttsState.isPlaying && !ttsState.isPaused ? (
                <button
                  type="button"
                  onClick={handlePauseNarration}
                  className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  <Pause className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePlayNarration}
                  className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              )}

              {ttsState.isPlaying && (
                <button
                  type="button"
                  onClick={handleStopNarration}
                  className="w-8 h-8 rounded-full border border-border hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
