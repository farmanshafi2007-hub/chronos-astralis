/**
 * Zero-dependency Web Audio API mechanical escapement acoustic synthesizer.
 * Synthesizes crisp metallic pallet-stone impulse ticks and hairspring resonance.
 */
export class EscapementAudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled = false;
  private lastTickIndex = -1;

  public toggle(enable?: boolean): boolean {
    const next = enable !== undefined ? enable : !this.isEnabled;
    this.isEnabled = next;
    if (this.isEnabled) {
      this.ensureContext();
    }
    return this.isEnabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public update(simTimeSeconds: number, ticksPerSecond: number, timeScale: number): void {
    if (!this.isEnabled || timeScale <= 0 || timeScale > 12) return;
    const totalTicks = Math.floor(simTimeSeconds * ticksPerSecond);
    if (totalTicks !== this.lastTickIndex) {
      const isEvenBeat = totalTicks % 2 === 0;
      this.lastTickIndex = totalTicks;
      this.triggerEscapementImpulse(isEvenBeat);
    }
  }

  private triggerEscapementImpulse(isTick: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // High-frequency metallic pallet stone impulse ("tick" vs slightly higher "tock")
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isTick ? 4200 : 4850, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.018);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isTick ? 3600 : 4100, now);
    filter.Q.setValueAtTime(6.5, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(isTick ? 0.065 : 0.05, now + 0.0015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  }

  public dispose(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
