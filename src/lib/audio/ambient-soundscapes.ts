/**
 * Procedural Multi-Channel Web Audio Ambient Soundscapes Synthesizer for Taleora.
 * Generates natural ambient soundscapes (Rain, Fireplace, Quiet Library, Coffeehouse, Lo-Fi Vinyl)
 * concurrently using Web Audio noise filters and procedural impulses.
 * Zero external audio files, zero network bandwidth, 100% offline capable.
 */

export type SoundscapeType = "rain" | "fireplace" | "library" | "coffeehouse" | "lofi";

interface ActiveTrack {
  type: SoundscapeType;
  source: AudioBufferSourceNode | OscillatorNode | null;
  gainNode: GainNode;
  filterNode?: BiquadFilterNode;
  timerId?: NodeJS.Timeout | null;
  volume: number;
}

export interface SoundscapePreset {
  id: string;
  name: string;
  desc: string;
  volumes: Partial<Record<SoundscapeType, number>>;
}

export const SOUNDSCAPE_PRESETS: SoundscapePreset[] = [
  {
    id: "oxford-rain",
    name: "Rainy Oxford Library",
    desc: "Gentle window rainfall with deep acoustic library stillness",
    volumes: { rain: 0.7, library: 0.35 },
  },
  {
    id: "midnight-study",
    name: "Midnight Study",
    desc: "Warm crackling fireplace with soothing low rain and vinyl hum",
    volumes: { fireplace: 0.65, rain: 0.3, lofi: 0.25 },
  },
  {
    id: "paris-cafe",
    name: "Parisian Café",
    desc: "Soft coffeehouse chatter and warm acoustic resonance",
    volumes: { coffeehouse: 0.6, lofi: 0.3 },
  },
  {
    id: "deep-focus",
    name: "Deep Room Tone",
    desc: "Subtle brownian room resonance for profound reading focus",
    volumes: { library: 0.5 },
  },
];

class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tracks: Map<SoundscapeType, ActiveTrack> = new Map();
  private masterVolume = 0.65;
  private listeners: Set<(activeTracks: Record<SoundscapeType, number>) => void> = new Set();

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public subscribe(listener: (activeTracks: Record<SoundscapeType, number>) => void): () => void {
    this.listeners.add(listener);
    listener(this.getActiveVolumes());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const active = this.getActiveVolumes();
    this.listeners.forEach((listener) => {
      try {
        listener(active);
      } catch (err) {
        console.warn("Soundscape listener error:", err);
      }
    });
  }

  /**
   * Generates a 5-second seamless loop buffer of pink/brownian noise.
   */
  private createNoiseBuffer(ctx: AudioContext, type: "pink" | "brown"): AudioBuffer {
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === "brown") {
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      } else {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  /**
   * Adjusts or starts a specific sound channel volume (0.0 to 1.0).
   * Setting volume > 0 starts it; setting volume <= 0 stops it.
   */
  public setTrackVolume(type: SoundscapeType, volume: number): void {
    if (typeof window === "undefined") return;

    const clamped = Math.max(0, Math.min(1, volume));
    if (clamped === 0) {
      this.stopTrack(type);
      return;
    }

    const existing = this.tracks.get(type);
    if (existing && this.ctx) {
      existing.volume = clamped;
      existing.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      existing.gainNode.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.3);
      this.notify();
      return;
    }

    // Start fresh track
    const ctx = this.initContext();
    const trackGain = ctx.createGain();
    trackGain.gain.setValueAtTime(0.001, ctx.currentTime);
    trackGain.gain.linearRampToValueAtTime(clamped, ctx.currentTime + 0.6);
    trackGain.connect(this.masterGain!);

    const track: ActiveTrack = {
      type,
      source: null,
      gainNode: trackGain,
      volume: clamped,
    };

    if (type === "rain") {
      this.buildRain(ctx, track);
    } else if (type === "fireplace") {
      this.buildFireplace(ctx, track);
    } else if (type === "library") {
      this.buildLibrary(ctx, track);
    } else if (type === "coffeehouse") {
      this.buildCoffeehouse(ctx, track);
    } else if (type === "lofi") {
      this.buildLofi(ctx, track);
    }

    this.tracks.set(type, track);
    this.notify();
  }

  public toggleTrack(type: SoundscapeType, defaultVolume = 0.5): void {
    if (this.tracks.has(type)) {
      this.stopTrack(type);
    } else {
      this.setTrackVolume(type, defaultVolume);
    }
  }

  public stopTrack(type: SoundscapeType): void {
    const track = this.tracks.get(type);
    if (!track) return;

    if (track.timerId) {
      clearTimeout(track.timerId);
      track.timerId = null;
    }

    if (this.ctx && track.gainNode) {
      track.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      track.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      setTimeout(() => {
        try {
          if (track.source) {
            (track.source as AudioBufferSourceNode).stop?.();
            track.source.disconnect();
          }
          track.gainNode.disconnect();
        } catch {
          // Ignore disconnect error
        }
      }, 350);
    }

    this.tracks.delete(type);
    this.notify();
  }

  public applyPreset(preset: SoundscapePreset): void {
    this.stopAll();
    Object.entries(preset.volumes).forEach(([type, vol]) => {
      if (vol && vol > 0) {
        this.setTrackVolume(type as SoundscapeType, vol);
      }
    });
  }

  public stopAll(): void {
    const keys = Array.from(this.tracks.keys());
    keys.forEach((k) => this.stopTrack(k));
  }

  // Compatibility helpers
  public play(type: SoundscapeType, volume = 0.5): void {
    this.stopAll();
    this.setTrackVolume(type, volume);
  }

  public stop(): void {
    this.stopAll();
  }

  public getActive(): SoundscapeType | null {
    const first = Array.from(this.tracks.keys())[0];
    return first || null;
  }

  public getActiveVolumes(): Record<SoundscapeType, number> {
    const res: Record<SoundscapeType, number> = {
      rain: 0,
      fireplace: 0,
      library: 0,
      coffeehouse: 0,
      lofi: 0,
    };
    this.tracks.forEach((track, type) => {
      res[type] = track.volume;
    });
    return res;
  }

  public isTrackActive(type: SoundscapeType): boolean {
    return this.tracks.has(type);
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  public setVolume(vol: number): void {
    this.setMasterVolume(vol);
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  // Synthesis Builders
  private buildRain(ctx: AudioContext, track: ActiveTrack) {
    const buffer = this.createNoiseBuffer(ctx, "pink");
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, ctx.currentTime);

    source.connect(filter);
    filter.connect(track.gainNode);
    source.start();
    track.source = source;
  }

  private buildFireplace(ctx: AudioContext, track: ActiveTrack) {
    const buffer = this.createNoiseBuffer(ctx, "brown");
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, ctx.currentTime);

    source.connect(filter);
    filter.connect(track.gainNode);
    source.start();
    track.source = source;

    const scheduleCrackle = () => {
      if (!this.tracks.has("fireplace") || !this.ctx) return;
      const crackleOsc = this.ctx.createOscillator();
      const crackleGain = this.ctx.createGain();

      crackleOsc.type = "triangle";
      crackleOsc.frequency.setValueAtTime(400 + Math.random() * 2200, this.ctx.currentTime);

      crackleGain.gain.setValueAtTime(0.08 * track.volume, this.ctx.currentTime);
      crackleGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);

      crackleOsc.connect(crackleGain);
      crackleGain.connect(track.gainNode);

      crackleOsc.start();
      crackleOsc.stop(this.ctx.currentTime + 0.05);

      const nextDelay = 80 + Math.random() * 450;
      track.timerId = setTimeout(scheduleCrackle, nextDelay);
    };

    scheduleCrackle();
  }

  private buildLibrary(ctx: AudioContext, track: ActiveTrack) {
    const buffer = this.createNoiseBuffer(ctx, "brown");
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(140, ctx.currentTime);

    source.connect(filter);
    filter.connect(track.gainNode);
    source.start();
    track.source = source;
  }

  private buildCoffeehouse(ctx: AudioContext, track: ActiveTrack) {
    const buffer = this.createNoiseBuffer(ctx, "pink");
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(450, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

    source.connect(bandpass);
    bandpass.connect(track.gainNode);
    source.start();
    track.source = source;
  }

  private buildLofi(ctx: AudioContext, track: ActiveTrack) {
    // Gentle warm vinyl crackle + low harmonic flutter
    const buffer = this.createNoiseBuffer(ctx, "pink");
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.Q.setValueAtTime(2.5, ctx.currentTime);

    source.connect(filter);
    filter.connect(track.gainNode);
    source.start();
    track.source = source;
  }
}

export const ambientSoundscapes = new AmbientSoundscapeEngine();
