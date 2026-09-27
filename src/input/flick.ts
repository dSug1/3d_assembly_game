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
import type { GestureConfig } from "./gestureConfig";
import type { Sample } from "./motion";


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
  // ⛔⛔⛔ **THE WINDOW MAY END *NOW* RATHER THAN AT THE LAST SAMPLE — defect 70.**
  //
  // > *"sometimes, it seems I need to wait a little before redoing the same translation movement,
  // > and then the camera swing works again"* — the owner, 2026-09-23
  //
  // ⚠⚠ Trimmed against the last SAMPLE, a buffer that stops receiving events keeps its window
  // frozen around the last burst — so *"how fast is this finger"* answers with the speed of a
  // gesture that **has already finished**, indefinitely. ⭐ The flick reads it at the release,
  // where `now` and the last sample are the same instant, which is why it never showed there.
  // ⛔ The approach swing reads it MID-GESTURE, which is where a stale answer damps the swing to
  // nothing — and an immediate second push inherits the first one's speed.
  //
  // ⚠ The default keeps the old behaviour exactly: a caller that does not say when *now* is gets
  // the release-time reading it has always had.
  const end = nowMs !== undefined && Number.isFinite(nowMs) ? nowMs : buffer[buffer.length - 1]!.t;
  const cutoff = end - cfg.flickWindow;
  return buffer.filter((s) => s.t >= cutoff);
}
