/**
 * Web Speech API Text-to-Speech (TTS) Narration Engine for Taleora.
 * Seamlessly speaks story chapters paragraph by paragraph with play/pause,
 * rate acceleration, voice selection, and sentence tracking.
 */

export type TtsSpeed = 0.8 | 1.0 | 1.25 | 1.5;

export interface TtsState {
  isPlaying: boolean;
  isPaused: boolean;
  currentParagraphIndex: number;
  speed: TtsSpeed;
  voiceName: string | null;
}

class TextToSpeechEngine {
  private utterance: SpeechSynthesisUtterance | null = null;
  private paragraphs: string[] = [];
  private currentIdx = 0;
  private speed: TtsSpeed = 1.0;
  private isCurrentlyPlaying = false;
  private isCurrentlyPaused = false;
  private onParagraphChangeCallback: ((idx: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  public isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en") || v.default);
  }

  public playParagraphs(
    paragraphs: string[],
    startIdx = 0,
    callbacks?: {
      onParagraphChange?: (idx: number) => void;
      onEnd?: () => void;
    }
  ): void {
    if (!this.isSupported()) return;

    this.stop();
    this.paragraphs = paragraphs;
    this.currentIdx = Math.max(0, Math.min(paragraphs.length - 1, startIdx));
    this.onParagraphChangeCallback = callbacks?.onParagraphChange || null;
    this.onEndCallback = callbacks?.onEnd || null;
    this.isCurrentlyPlaying = true;
    this.isCurrentlyPaused = false;

    this.speakCurrentParagraph();
  }

  private speakCurrentParagraph(): void {
    if (!this.isSupported() || !this.isCurrentlyPlaying || this.currentIdx >= this.paragraphs.length) {
      this.isCurrentlyPlaying = false;
      this.isCurrentlyPaused = false;
      if (this.onEndCallback) this.onEndCallback();
      return;
    }

    const text = this.paragraphs[this.currentIdx];
    if (!text || text.trim().length === 0) {
      this.currentIdx += 1;
      this.speakCurrentParagraph();
      return;
    }

    if (this.onParagraphChangeCallback) {
      this.onParagraphChangeCallback(this.currentIdx);
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = this.speed;

    // Pick best English voice if available
    const voices = this.getAvailableVoices();
    const naturalVoice =
      voices.find((v) => v.name.includes("Natural") || v.name.includes("Enhanced") || v.name.includes("Google")) ||
      voices[0];
    if (naturalVoice) {
      utter.voice = naturalVoice;
    }

    utter.onend = () => {
      if (this.isCurrentlyPlaying && !this.isCurrentlyPaused) {
        this.currentIdx += 1;
        this.speakCurrentParagraph();
      }
    };

    utter.onerror = (e) => {
      // Speech errors can occur if cancelled; ignore cancel events
      if (e.error !== "canceled" && e.error !== "interrupted") {
        console.warn("TTS Speech error:", e);
      }
    };

    this.utterance = utter;
    window.speechSynthesis.speak(utter);
  }

  public pause(): void {
    if (!this.isSupported()) return;
    if (this.isCurrentlyPlaying && !this.isCurrentlyPaused) {
      window.speechSynthesis.pause();
      this.isCurrentlyPaused = true;
    }
  }

  public resume(): void {
    if (!this.isSupported()) return;
    if (this.isCurrentlyPaused) {
      window.speechSynthesis.resume();
      this.isCurrentlyPaused = false;
    }
  }

  public stop(): void {
    if (!this.isSupported()) return;
    this.isCurrentlyPlaying = false;
    this.isCurrentlyPaused = false;
    window.speechSynthesis.cancel();
    this.utterance = null;
  }

  public setSpeed(speed: TtsSpeed): void {
    this.speed = speed;
    if (this.isCurrentlyPlaying && !this.isCurrentlyPaused) {
      // Re-speak current paragraph at new rate
      window.speechSynthesis.cancel();
      this.speakCurrentParagraph();
    }
  }

  public getState(): TtsState {
    return {
      isPlaying: this.isCurrentlyPlaying,
      isPaused: this.isCurrentlyPaused,
      currentParagraphIndex: this.currentIdx,
      speed: this.speed,
      voiceName: this.utterance?.voice?.name || null,
    };
  }
}

export const textToSpeechEngine = new TextToSpeechEngine();
