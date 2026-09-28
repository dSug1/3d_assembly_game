/**
 * ⭐⭐ **THE FRAME METER** (the owner, 2026-09-28: *"on my tablet with usb debugging, the scene_01
 * interactions are much slower than the scene_0"*) — how long frames take on THIS device, so a cost
 * can be measured instead of argued about. Engine-free.
 *
 * ⭐ It records the interval between successive render-loop calls — the whole frame as the hand
 * feels it (script, draw and the wait for the display), not only `scene.render()`'s share.
 * ⭐⭐ It reports the MEDIAN and the **p95**: the slow tail is what a hand feels (`LESSONS_CARRIED`
 * §4 — *the tail decides the feel every time*), and a mean would hide it.
 * ⛔ An interval longer than `pauseMs` is a PAUSE (a hidden tab, a debugger stop), not a frame — it
 * is dropped rather than counted, or one switch of tabs would own the p95 for the whole window.
 */
export interface FrameStats {
  readonly medianMs: number;
  readonly p95Ms: number;
  /** How many frames the window holds — a small `n` means the numbers are not settled yet. */
  readonly n: number;
}

export class FrameMeter {
  private readonly intervals: number[] = [];

  constructor(
    private readonly windowFrames = 120,
    private readonly pauseMs = 1000,
  ) {}

  /** One frame's interval, milliseconds. Non-finite, non-positive or pause-length ones are dropped. */
  push(intervalMs: number): void {
    if (!Number.isFinite(intervalMs) || !(intervalMs > 0) || intervalMs > this.pauseMs) return;
    this.intervals.push(intervalMs);
    if (this.intervals.length > this.windowFrames) this.intervals.shift();
  }

  /** `null` until a frame has been recorded — never a made-up number. */
  stats(): FrameStats | null {
    const n = this.intervals.length;
    if (n === 0) return null;
    const s = [...this.intervals].sort((a, b) => a - b);
    const at = (q: number) => s[Math.min(n - 1, Math.floor(q * n))]!;
    return { medianMs: at(0.5), p95Ms: at(0.95), n };
  }
}

/** ⭐ The HUD's words for it: `17ms (59 fps) · p95 33ms`. */
export function formatFrameStats(s: FrameStats | null): string {
  if (!s) return "—";
  return `${s.medianMs.toFixed(0)}ms (${(1000 / s.medianMs).toFixed(0)} fps) · p95 ${s.p95Ms.toFixed(0)}ms · n=${s.n}`;
}
