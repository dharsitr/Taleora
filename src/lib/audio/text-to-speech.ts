/**
 * Web Speech API Text-to-Speech (TTS) Narration Engine for Taleora.
 * Seamlessly speaks story chapters paragraph by paragraph and sentence by sentence
 * with real-time word/sentence boundary callbacks, rate acceleration, voice selection,
 * and state subscriptions.
 */

export type TtsSpeed = 0.8 | 1.0 | 1.25 | 1.5;

export interface SentenceInfo {
  index: number;
  text: string;
  start: number;
  end: number;
}

export interface TtsState {
  isPlaying: boolean;
  isPaused: boolean;
  currentParagraphIndex: number;
  currentSentenceIndex: number;
  currentSentenceText: string;
  speed: TtsSpeed;
  selectedVoiceName: string | null;
}

export interface TtsCallbacks {
  onParagraphChange?: (paragraphIdx: number) => void;
  onSentenceChange?: (paragraphIdx: number, sentenceIdx: number, sentenceText: string) => void;
  onEnd?: () => void;
  onStateChange?: (state: TtsState) => void;
}

/**
 * Splits text into sentences with precise character ranges.
 */
export function splitIntoSentences(text: string): SentenceInfo[] {
  if (!text || text.trim().length === 0) return [];

  // Match sentences ending in ., !, ?, or quotes
  const regex = /[^.!?]+[.!?]+["'”’]?|[^.!?]+$/g;
  const sentences: SentenceInfo[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      const leadingSpace = raw.indexOf(trimmed);
      const start = match.index + (leadingSpace >= 0 ? leadingSpace : 0);
      sentences.push({
        index: sentences.length,
        text: trimmed,
        start,
        end: start + trimmed.length,
      });
    }
  }

  if (sentences.length === 0 && text.trim().length > 0) {
    sentences.push({
      index: 0,
      text: text.trim(),
      start: 0,
      end: text.trim().length,
    });
  }

  return sentences;
}

class TextToSpeechEngine {
  private utterance: SpeechSynthesisUtterance | null = null;
  private paragraphs: string[] = [];
  private currentParagraphIdx = 0;
  private currentSentenceIdx = 0;
  private currentSentences: SentenceInfo[] = [];
  private speed: TtsSpeed = 1.0;
  private isCurrentlyPlaying = false;
  private isCurrentlyPaused = false;
  private selectedVoiceName: string | null = null;
  private callbacks: TtsCallbacks = {};
  private listeners: Set<(state: TtsState) => void> = new Set();

  public isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en") || v.default);
  }

  public setVoice(voiceName: string): void {
    this.selectedVoiceName = voiceName;
    this.notifyState();
  }

  public subscribe(listener: (state: TtsState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyState(): void {
    const state = this.getState();
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(state);
    }
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.warn("TTS state listener error:", err);
      }
    });
  }

  public playParagraphs(
    paragraphs: string[],
    startIdx = 0,
    callbacks?: TtsCallbacks
  ): void {
    if (!this.isSupported()) return;

    this.stop();
    this.paragraphs = paragraphs;
    this.currentParagraphIdx = Math.max(0, Math.min(paragraphs.length - 1, startIdx));
    this.callbacks = callbacks || {};
    this.isCurrentlyPlaying = true;
    this.isCurrentlyPaused = false;

    this.speakCurrentParagraph();
  }

  private speakCurrentParagraph(): void {
    if (!this.isSupported() || !this.isCurrentlyPlaying || this.currentParagraphIdx >= this.paragraphs.length) {
      this.isCurrentlyPlaying = false;
      this.isCurrentlyPaused = false;
      this.currentSentenceIdx = 0;
      this.currentSentences = [];
      this.notifyState();
      if (this.callbacks.onEnd) this.callbacks.onEnd();
      return;
    }

    const text = this.paragraphs[this.currentParagraphIdx];
    if (!text || text.trim().length === 0) {
      this.currentParagraphIdx += 1;
      this.speakCurrentParagraph();
      return;
    }

    this.currentSentences = splitIntoSentences(text);
    this.currentSentenceIdx = 0;

    if (this.callbacks.onParagraphChange) {
      this.callbacks.onParagraphChange(this.currentParagraphIdx);
    }

    const currentSentence = this.currentSentences[0];
    if (currentSentence && this.callbacks.onSentenceChange) {
      this.callbacks.onSentenceChange(
        this.currentParagraphIdx,
        0,
        currentSentence.text
      );
    }

    this.notifyState();

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = this.speed;

    // Pick selected or best natural English voice
    const voices = this.getAvailableVoices();
    let chosenVoice: SpeechSynthesisVoice | undefined;
    if (this.selectedVoiceName) {
      chosenVoice = voices.find((v) => v.name === this.selectedVoiceName);
    }
    if (!chosenVoice) {
      chosenVoice =
        voices.find(
          (v) =>
            v.name.includes("Natural") ||
            v.name.includes("Enhanced") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel")
        ) || voices[0];
    }
    if (chosenVoice) {
      utter.voice = chosenVoice;
      this.selectedVoiceName = chosenVoice.name;
    }

    // Real-time boundary tracking for sentence glow!
    utter.onboundary = (e: SpeechSynthesisEvent) => {
      if (this.currentSentences.length > 0) {
        const charIdx = e.charIndex;
        const matchingSentenceIdx = this.currentSentences.findIndex(
          (s) => charIdx >= s.start && charIdx <= s.end
        );

        if (matchingSentenceIdx !== -1 && matchingSentenceIdx !== this.currentSentenceIdx) {
          this.currentSentenceIdx = matchingSentenceIdx;
          const sentence = this.currentSentences[matchingSentenceIdx];
          if (this.callbacks.onSentenceChange && sentence) {
            this.callbacks.onSentenceChange(
              this.currentParagraphIdx,
              matchingSentenceIdx,
              sentence.text
            );
          }
          this.notifyState();
        }
      }
    };

    utter.onend = () => {
      if (this.isCurrentlyPlaying && !this.isCurrentlyPaused) {
        this.currentParagraphIdx += 1;
        this.speakCurrentParagraph();
      }
    };

    utter.onerror = (e) => {
      if (e.error !== "canceled" && e.error !== "interrupted") {
        console.warn("TTS Speech error:", e);
      }
    };

    this.utterance = utter;
    window.speechSynthesis.speak(utter);
  }

  public nextSentence(): void {
    if (!this.currentSentences.length) return;
    if (this.currentSentenceIdx < this.currentSentences.length - 1) {
      this.currentSentenceIdx += 1;
      const sentence = this.currentSentences[this.currentSentenceIdx];
      if (this.callbacks.onSentenceChange && sentence) {
        this.callbacks.onSentenceChange(
          this.currentParagraphIdx,
          this.currentSentenceIdx,
          sentence.text
        );
      }
      this.notifyState();
    } else if (this.currentParagraphIdx < this.paragraphs.length - 1) {
      this.currentParagraphIdx += 1;
      this.speakCurrentParagraph();
    }
  }

  public previousSentence(): void {
    if (this.currentSentenceIdx > 0) {
      this.currentSentenceIdx -= 1;
      const sentence = this.currentSentences[this.currentSentenceIdx];
      if (this.callbacks.onSentenceChange && sentence) {
        this.callbacks.onSentenceChange(
          this.currentParagraphIdx,
          this.currentSentenceIdx,
          sentence.text
        );
      }
      this.notifyState();
    } else if (this.currentParagraphIdx > 0) {
      this.currentParagraphIdx -= 1;
      this.speakCurrentParagraph();
    }
  }

  public pause(): void {
    if (!this.isSupported()) return;
    if (this.isCurrentlyPlaying && !this.isCurrentlyPaused) {
      window.speechSynthesis.pause();
      this.isCurrentlyPaused = true;
      this.notifyState();
    }
  }

  public resume(): void {
    if (!this.isSupported()) return;
    if (this.isCurrentlyPaused) {
      window.speechSynthesis.resume();
      this.isCurrentlyPaused = false;
      this.notifyState();
    }
  }

  public stop(): void {
    if (!this.isSupported()) return;
    this.isCurrentlyPlaying = false;
    this.isCurrentlyPaused = false;
    this.currentSentenceIdx = 0;
    this.currentSentences = [];
    window.speechSynthesis.cancel();
    this.utterance = null;
    this.notifyState();
  }

  public setSpeed(speed: TtsSpeed): void {
    this.speed = speed;
    this.notifyState();
    if (this.isCurrentlyPlaying && !this.isCurrentlyPaused) {
      window.speechSynthesis.cancel();
      this.speakCurrentParagraph();
    }
  }

  public getState(): TtsState {
    const sentence = this.currentSentences[this.currentSentenceIdx];
    return {
      isPlaying: this.isCurrentlyPlaying,
      isPaused: this.isCurrentlyPaused,
      currentParagraphIndex: this.currentParagraphIdx,
      currentSentenceIndex: this.currentSentenceIdx,
      currentSentenceText: sentence ? sentence.text : "",
      speed: this.speed,
      selectedVoiceName: this.selectedVoiceName,
    };
  }
}

export const textToSpeechEngine = new TextToSpeechEngine();
