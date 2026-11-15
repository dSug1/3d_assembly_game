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

/**
 * ⭐⭐ (2026-11-15, the owner's phone: *"The scene is black. I can't see anything"* — the HUD read `frame —` after eight minutes, and nothing on it
 * told a stalled loop from a lost WebGL context or a canvas of no size) **THE DRAW STATE**, what the `draw` line reports: the frames drawn; the last
 * interval between two frames AS IT WAS (⛔ the meter drops one over a second as a pause — exactly the ones a stalled loop makes, so a crawling
 * device read `—` for ever); how many such long ones; the canvas's size on the page and its drawing buffer's; the WebGL context's state.
 */
export interface DrawState {
  readonly frames: number;
  /** the last interval between two render-loop calls, unfiltered; `null`: fewer than two calls yet */
  readonly lastIntervalMs: number | null;
  /** how many intervals were longer than a second (the meter's pauses) */
  readonly longFrames: number;
  readonly cssW: number;
  readonly cssH: number;
  readonly bufW: number;
  readonly bufH: number;
  /** `null`: no WebGL context to ask (a headless engine) */
  readonly contextLost: boolean | null;
  readonly lost: number;
  readonly restored: number;
  /** `gl.getError()`; 0: none */
  readonly glError: number;
}

/**
 * ⭐ The HUD's words for it: `gl ok · frames 1234 · last 17ms (long 0) · 414×800 → 828×1600`. Whatever is wrong is marked ⛔. ⚠ The context FIRST and
 * the sizes last: a phone shows about 55 characters of a line (the first build put the context last — cut off on the very screen it was made for).
 */
export function formatDrawState(d: DrawState): string {
  const last = d.lastIntervalMs === null ? "—" : `${d.lastIntervalMs > 1000 ? "⛔" : ""}${d.lastIntervalMs.toFixed(0)}ms`;
  const noSize = !(d.cssW > 0 && d.cssH > 0 && d.bufW > 0 && d.bufH > 0);
  const gl =
    d.contextLost === null
      ? "—"
      : (d.contextLost ? "⛔LOST" : "ok") +
        (d.lost > 0 || d.restored > 0 ? ` (lost ${d.lost}, back ${d.restored})` : "") +
        (d.glError !== 0 ? ` ⛔err 0x${d.glError.toString(16)}` : "");
  return `gl ${gl} · frames ${d.frames} · last ${last} (long ${d.longFrames}) · ${noSize ? "⛔" : ""}${d.cssW}×${d.cssH} → ${d.bufW}×${d.bufH}`;
}
