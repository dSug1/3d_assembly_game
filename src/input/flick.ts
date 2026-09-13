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
  const prev = buffer[buffer.length - 2]!;

  // 1. terminal speed at lift — the drag/flick discriminator.
  const dtLift = last.t - prev.t;
  if (dtLift <= 0) return null;
  const liftPxPerS =
    (Math.hypot(last.x - prev.x, last.y - prev.y) / dtLift) * 1000;
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

/** Keep only the samples inside `flickWindow` of the newest one. */
export function trimBuffer(buffer: readonly Sample[], cfg: GestureConfig): Sample[] {
  if (buffer.length === 0) return [];
  const cutoff = buffer[buffer.length - 1]!.t - cfg.flickWindow;
  return buffer.filter((s) => s.t >= cutoff);
}
