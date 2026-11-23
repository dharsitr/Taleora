/**
 * Procedural Web Audio Ambient Soundscapes Synthesizer for Taleora.
 * Generates natural ambient soundscapes (Rain, Fireplace, Quiet Library, Coffeehouse)
 * purely in-browser using Web Audio noise filters and procedural impulses.
 * Zero external audio files, zero network bandwidth, 100% offline capable.
 */

export type SoundscapeType = "rain" | "fireplace" | "library" | "coffeehouse";

class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSoundscape: SoundscapeType | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private timerId: NodeJS.Timeout | null = null;
  private volume = 0.5;

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
    return this.ctx;
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
        // Brownian noise: integrated white noise
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      } else {
        // Pink noise filter (Paul Kellet's algorithm)
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
   * Starts a procedural ambient soundscape.
   */
  public play(type: SoundscapeType, volume = this.volume): void {
    if (typeof window === "undefined") return;

    this.stop();
    const ctx = this.initContext();

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume), ctx.currentTime + 1.2);
    this.masterGain.connect(ctx.destination);
    this.volume = volume;

    if (type === "rain") {
      this.buildRain(ctx, this.masterGain);
    } else if (type === "fireplace") {
      this.buildFireplace(ctx, this.masterGain);
    } else if (type === "library") {
      this.buildLibrary(ctx, this.masterGain);
    } else if (type === "coffeehouse") {
      this.buildCoffeehouse(ctx, this.masterGain);
    }

    this.activeSoundscape = type;
  }

  private buildRain(ctx: AudioContext, destination: GainNode) {
    const buffer = this.createNoiseBuffer(ctx, "pink");
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    // Soft low-pass filter for rainfall rumble
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(850, ctx.currentTime);

    this.noiseSource.connect(filter);
    filter.connect(destination);
    this.noiseSource.start();
  }

  private buildFireplace(ctx: AudioContext, destination: GainNode) {
    // Low rumble
    const buffer = this.createNoiseBuffer(ctx, "brown");
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, ctx.currentTime);

    this.noiseSource.connect(filter);
    filter.connect(destination);
    this.noiseSource.start();

    // Random crackle impulses
    const scheduleCrackle = () => {
      if (!this.activeSoundscape || this.activeSoundscape !== "fireplace" || !this.ctx) return;
      const crackleOsc = this.ctx.createOscillator();
      const crackleGain = this.ctx.createGain();

      crackleOsc.type = "triangle";
      crackleOsc.frequency.setValueAtTime(400 + Math.random() * 2200, this.ctx.currentTime);

      crackleGain.gain.setValueAtTime(0.08 * this.volume, this.ctx.currentTime);
      crackleGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);

      crackleOsc.connect(crackleGain);
      crackleGain.connect(destination);

      crackleOsc.start();
      crackleOsc.stop(this.ctx.currentTime + 0.05);

      const nextDelay = 80 + Math.random() * 450;
      this.timerId = setTimeout(scheduleCrackle, nextDelay);
    };

    scheduleCrackle();
  }

  private buildLibrary(ctx: AudioContext, destination: GainNode) {
    // Deep, soothing room tone (filtered brownian noise)
    const buffer = this.createNoiseBuffer(ctx, "brown");
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(140, ctx.currentTime);

    this.noiseSource.connect(filter);
    filter.connect(destination);
    this.noiseSource.start();
  }

  private buildCoffeehouse(ctx: AudioContext, destination: GainNode) {
    // Soft acoustic cafe murmur tone
    const buffer = this.createNoiseBuffer(ctx, "pink");
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(450, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

    this.noiseSource.connect(bandpass);
    bandpass.connect(destination);
    this.noiseSource.start();
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public stop(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      this.noiseSource = null;
    }
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    this.activeSoundscape = null;
  }

  public getActive(): SoundscapeType | null {
    return this.activeSoundscape;
  }
}

export const ambientSoundscapes = new AmbientSoundscapeEngine();
