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
  const last = buffer[buffer.length - 1]!;

  // 1. terminal speed at lift — the drag/flick discriminator. See the header for why
  // this is a WINDOW and not the last pair; it is the fix for inconsistent rollback.
  // ⭐ It does not depend on where the tail starts: it is always the last
  // `flickLiftWindow` ms. Computed once, outside the scan.
  const liftPxPerS = terminalSpeedPxPerS(buffer, cfg);
  if (liftPxPerS < mmToPx(cfg.flickLiftSpeed)) return null;

  // ⭐⭐⭐ THE FLICK IS THE **TAIL** OF THE GESTURE, NOT THE WHOLE WINDOW.
  //
  // ⛔⛔ DEVICE-REPORTED 2026-09-16: *"the flick should be triggerable during an ongoing
  // rotation — it seems the flick only triggers if the touchpoint presses and directly do a
  // flick."* ⭐ Exactly right, and the cause was measuring travel and purity from
  // `buffer[0]` — the oldest sample still inside `flickWindow`. On a press-and-flick that
  // sample IS the start of the flick; at the end of an ongoing rotation it is somewhere in
  // the middle of the rotation, so the NET displacement from it is short and its direction
  // is a mixture. The gesture was fine and the baseline was wrong.
  //
  // ⭐⭐ THE SAME SHAPE AS MISTAKE 1 — *a rate estimated over the shortest available
  // baseline* — with the sign reversed: here a DISPLACEMENT was measured over a baseline
  // that included motion belonging to another gesture. ⛔ And it is the same fix in both
  // directions: **state the window the quantity is measured over**, rather than taking
  // whatever the buffer happens to hold.
  //
  // ⭐ So `flickWindow` becomes the LONGEST tail a flick may be read over, not a fixed
  // baseline, and the test is applied to the longest tail that passes. Longest, not
  // shortest: a short tail is the easiest thing in the world to make look pure, and the
  // most travel the hand can be shown to have made in one direction is the honest reading.
  // ⚠ With a MINIMUM span of `flickLiftWindow`, so the displacement is never measured
  // over a shorter baseline than the speed already is — two samples of a coalesced jump
  // are not a flick, and `validateGestureConfig` already refuses a lift window wider than
  // the buffer.
  for (let i = 0; i <= buffer.length - 2; i++) {
    const from = buffer[i]!;
    if (last.t - from.t < cfg.flickLiftWindow) break;
    const dx = last.x - from.x;
    const dy = last.y - from.y;
    const travelPx = Math.hypot(dx, dy);
    if (travelPx < mmToPx(cfg.flickDistance)) continue;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    const purity = Math.max(ax, ay) / (Math.min(ax, ay) + EPSILON_PX);
    if (purity < cfg.flickPurity) continue;
    const horizontal = ax >= ay;
    return {
      axis: horizontal ? "HORIZONTAL" : "VERTICAL",
      sign: (horizontal ? dx : dy) >= 0 ? 1 : -1,
      travelMm: travelPx / mmToPx(1),
      liftSpeedMmPerS: liftPxPerS / mmToPx(1),
      purity,
    };
  }
  return null;
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
export function trimBuffer(
  buffer: readonly Sample[],
  cfg: GestureConfig,
  nowMs?: number,
): Sample[] {
  if (buffer.length === 0) return [];
  // ⛔⛔⛔ **THE WINDOW MAY END *NOW* RATHER THAN AT THE LAST SAMPLE — defect 70, 2026-09-23.**
  //
  // > *"sometimes, it seems I need to wait a little before redoing the same translation movement,
  // > and then the camera swing works again"* — the owner
  //
  // ⚠⚠ Trimmed against the last SAMPLE, a buffer that stops receiving events keeps its window
  // frozen around the last burst — so *"how fast is this finger"* answers with the speed of a
  // gesture that **has already finished**, indefinitely. ⭐ The flick reads it at the release,
  // where `now` and the last sample are the same instant, which is why it never showed there.
  // ⛔ The swing reads it at the START of an approach, which is the moment most likely to sit in
  // the shadow of the previous push — and it LATCHES the answer (defect 68).
  //
  // ⚠ The default keeps the old behaviour exactly: a caller that does not say when *now* is gets
  // the release-time reading it has always had.
  const end = nowMs !== undefined && Number.isFinite(nowMs) ? nowMs : buffer[buffer.length - 1]!.t;
  const cutoff = end - cfg.flickWindow;
  return buffer.filter((s) => s.t >= cutoff);
}
