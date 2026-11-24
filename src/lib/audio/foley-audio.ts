/**
 * Procedural Web Audio Foley Engine for Taleora.
 * Synthesizes realistic parchment page rustles, paper sweeps, and hardcover book spine thuds.
 * 100% procedural Web Audio API, zero audio assets, 100% offline capable.
 */

class FoleyAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;

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

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Procedural parchment page flip / rustle sound.
   * Generates a soft filtered burst of pink noise with an exponential decay and high-frequency flutter.
   */
  public playPageTurn(direction: "next" | "prev" = "next"): void {
    if (typeof window === "undefined" || this.isMuted) return;

    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const duration = 0.22;

      // 1. Noise buffer for parchment texture
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Mild pink filter
        last = (last + 0.04 * white) / 1.04;
        data[i] = last * 2.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // 2. Bandpass filter for crisp paper sweep
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      const startFreq = direction === "next" ? 1800 : 2200;
      const endFreq = direction === "next" ? 3200 : 1600;
      filter.frequency.setValueAtTime(startFreq, now);
      filter.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      filter.Q.setValueAtTime(1.8, now);

      // 3. Gain envelope (soft swell then rapid taper)
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // Audio autoplay policy or hardware restriction
    }
  }

  /**
   * Procedural hardcover spine thud / gentle book closure.
   * Resonant low-frequency triangle pulse with dampening.
   */
  public playBookSpineThud(): void {
    if (typeof window === "undefined" || this.isMuted) return;

    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const duration = 0.28;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + duration);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore
    }
  }
}

export const foleyAudio = new FoleyAudioEngine();
