/**
 * §1.3 — THE FLICK TEST, evaluated once at release over the motion buffer.
 *
 * ⭐⭐ THIS IS WHAT MAKES DRAGS AND FLICKS SEPARABLE. Previously every drag ended in
 * a release, so every drag could satisfy a flick rule, and the two competed for the
 * same gesture. The discriminator is TERMINAL SPEED: a drag decelerates and lifts,
 * a flick is still moving when the finger leaves.
 *
 * ⭐ Direction purity is ONE RATIO, not two independent thresholds. The old form
 * (`|x| < smallThreshold` AND `|y| > bigThreshold`) left a large undefined wedge
 * between the two — directions that were neither accepted nor rejected.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔⛔ AND THE LIFT SPEED IS MEASURED OVER A WINDOW, NOT OVER THE LAST SAMPLE PAIR.
 * THIS IS A DEVICE-CONFIRMED DEFECT, found on a Lenovo TB-X606F on 2026-09-13: the
 * owner reported the flick rollback firing INCONSISTENTLY for the same gesture.
 *
 * The cause is not the finger and not the thresholds. A browser emits `pointerup`
 * at whatever position and instant it chooses, and **very commonly repeats the last
 * `pointermove` coordinates**. A two-sample estimator then reads a displacement of
 * ZERO across that final pair, computes a lift speed of zero, and throws away a
 * flick that plainly happened. Whether the browser coalesces that last event is not
 * something the user can feel or control — hence "inconsistent".
 *
 * ⭐ Reproduced headlessly, both ways: a clean 400 mm/s stroke is a flick; the SAME
 * stroke with a coordinate-repeating `pointerup` appended is not. Pinned by vectors.
 *
 * ⭐⭐ THIS IS THE `METHOD` LESSON VERBATIM: *print the aggregation, not just the
 * value.* A single sample pair is the noisiest possible estimator of a speed, and
 * the fix is not a tuned threshold — no value of `flickLiftSpeed` rescues a
 * measurement of zero. It is to state the window the speed is averaged over.
 */
import { mmToPx } from "../core/units";
import type { GestureConfig } from "./gestureConfig";
import type { Sample } from "./motion";

export type FlickAxis = "HORIZONTAL" | "VERTICAL";

export interface Flick {
  readonly axis: FlickAxis;
  /** Sign along the dominant axis: −1 or +1, in screen coordinates. */
  readonly sign: -1 | 1;
  readonly travelMm: number;
  readonly liftSpeedMmPerS: number;
  readonly purity: number;
}

const EPSILON_PX = 1e-6;

/**
 * `null` when it is not a flick — which is the common case and is not a failure.
 *
 * ⚠ `buffer` must be ordered oldest-first and should already be trimmed to
 * `flickWindow`. `trimBuffer` does that.
 */
export function detectFlick(buffer: readonly Sample[], cfg: GestureConfig): Flick | null {
  if (buffer.length < 2) return null;
  const first = buffer[0]!;
  const last = buffer[buffer.length - 1]!;

  // 1. terminal speed at lift — the drag/flick discriminator. See the header for why
  // this is a WINDOW and not the last pair; it is the fix for inconsistent rollback.
  const liftPxPerS = terminalSpeedPxPerS(buffer, cfg);
  if (liftPxPerS < mmToPx(cfg.flickLiftSpeed)) return null;

  // 2. travel within the window.
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const travelPx = Math.hypot(dx, dy);
  if (travelPx < mmToPx(cfg.flickDistance)) return null;

  // 3. direction purity — one ratio.
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const purity = Math.max(ax, ay) / (Math.min(ax, ay) + EPSILON_PX);
  if (purity < cfg.flickPurity) return null;

  const horizontal = ax >= ay;
  return {
    axis: horizontal ? "HORIZONTAL" : "VERTICAL",
    sign: (horizontal ? dx : dy) >= 0 ? 1 : -1,
    travelMm: travelPx / mmToPx(1),
    liftSpeedMmPerS: liftPxPerS / mmToPx(1),
    purity,
  };
}

/**
 * Mean speed over the last `flickLiftWindow` ms of the buffer.
 *
 * ⚠ Exported because the on-device readout must be able to show the value the
 * product ACTUALLY USED. A readout that recomputes it is a second implementation,
 * and it can disagree with the product while both look right.
 */
export function terminalSpeedPxPerS(
  buffer: readonly Sample[],
  cfg: GestureConfig,
): number {
  if (buffer.length < 2) return 0;
  const last = buffer[buffer.length - 1]!;
  const cutoff = last.t - cfg.flickLiftWindow;
  let i = buffer.length - 1;
  while (i > 0 && buffer[i - 1]!.t >= cutoff) i--;
  // ⚠ Sampling sparser than the window leaves nothing inside it to measure against.
  // Step back one more rather than returning zero: a real interval measured slightly
  // too wide is an estimate; a zero is a fabricated dead stop, which is the whole
  // defect being fixed here.
  if (i === buffer.length - 1) i = buffer.length - 2;
  const from = buffer[i]!;
  const dt = last.t - from.t;
  if (dt <= 0) return 0;
  return (Math.hypot(last.x - from.x, last.y - from.y) / dt) * 1000;
}

/** Keep only the samples inside `flickWindow` of the newest one. */
export function trimBuffer(buffer: readonly Sample[], cfg: GestureConfig): Sample[] {
  if (buffer.length === 0) return [];
  const cutoff = buffer[buffer.length - 1]!.t - cfg.flickWindow;
  return buffer.filter((s) => s.t >= cutoff);
}
