/**
 * §1.3 — THE TAP TESTS: the double-tap memory (`TapHistory`) and the one tap test (`isTapRelease`).
 * ⛔ (2026-11-14, CL1) the per-touchpoint RECOGNIZER (`Recognizer`, its phases, release verdicts and pose port) deleted: never constructed since
 * the parts' translation and rotation were deleted on 2026-11-02 (the code at `7c38150`; its record `IN1`).
 */
import type { GestureConfig } from "./gestureConfig";
import type { Sample } from "./motion";
import { mmToPx } from "../core/units";

/**
 * Double-tap memory.
 *
 * ⛔ IT CANNOT LIVE IN ONE TOUCHPOINT. Two taps are two different pointer ids, so the touchpoint that saw the first is already gone when
 * the second presses. One of these is shared across every touchpoint.
 */
export class TapHistory {
  private last: Sample | null = null;

  constructor(private readonly cfg: GestureConfig) {}

  reset(): void {
    this.last = null;
  }

  /**
   * ⚠ Call with the PRESS sample of the tap and the time it was released: the
   * window is measured RELEASE-to-PRESS, and the slop between the two PRESS points.
   */
  record(press: Sample, releaseT: number): "TAP" | "DOUBLE_TAP" {
    const paired = this.pairsWithLast(press);
    this.last = { x: press.x, y: press.y, t: releaseT };
    if (paired) {
      // ⭐ Clear, so a third tap is a fresh TAP and not a second DOUBLE_TAP.
      this.last = null;
      return "DOUBLE_TAP";
    }
    return "TAP";
  }

  /**
   * ⭐⭐⭐ **WOULD THIS PRESS COMPLETE A DOUBLE TAP — asked NOW, on the way down?** (`A22`)
   *
   * > *"why a single tap followed by a rapid press (the equivalent of double tap where the
   * > final release is not done) doesn't trigger a switch to orange?"* — the owner, 2026-09-19
   *
   * ⛔⛔ **BECAUSE THE QUESTION WAS ONLY EVER ASKED AT THE RELEASE.** `record` is called with
   * the release time, so a second touch that is **pressed and held** never asked it at all —
   * and `D55` had moved the ALIGN to the press while leaving the mode SWITCH behind on the
   * release. ⚠ That is `D55`'s own rule applied to one half of the gesture and not the other.
   * (History: the press-time align is deleted — the TAP aligns since `D119` — and so is the
   * orange FOLLOW, `D106`; the peek still serves `D68`'s revert.)
   *
   * ⭐⭐ **IT IS A PEEK, AND IT MUTATES NOTHING.** The release still runs `record`, which is
   * what actually consumes the pair and clears the memory — two writers of one fact is the
   * shape this project forbids. ⛔ And it shares `pairsWithLast` with `record` rather than
   * restating the window and the slop, so the press and the release **cannot disagree** about
   * what a double tap is.
   *
   * ⚠ The window is measured RELEASE-to-PRESS, so holding the second touch down for a long
   * time does not change the answer: `record` will still say `DOUBLE_TAP` when it finally
   * lifts, exactly as this said when it landed.
   */
  wouldPair(press: Sample): boolean {
    return this.pairsWithLast(press);
  }

  /** ⛔ The one definition of *these two taps are a pair*. Shared, so it cannot drift. */
  private pairsWithLast(press: Sample): boolean {
    const prev = this.last;
    if (!prev) return false;
    const gap = press.t - prev.t;
    const apart = Math.hypot(press.x - prev.x, press.y - prev.y);
    return (
      gap <= this.cfg.doubleTapWindow && apart <= mmToPx(this.cfg.doubleTapSlop)
    );
  }
}

/**
 * ⛔ (2026-11-02) moved here from `input/mode_toggle.ts`, deleted with the parts' translation, rotation and alignment (commit `d8134eb`).
 *
 * §1.3's tap test, in **one** place.
 *
 * ⛔ It was inlined in the camera-reset branch, and the toggle needs the identical question
 * at a second site. ⭐ *"A tap is a tap whatever it lands on"* — that comment was already in
 * the code, and two copies of the arithmetic would be two definitions free to disagree
 * (`CONSTRAINTS` §4).
 *
 *
 * @param slopPx the slop already converted to pixels. ⚠ Converted by the CALLER, because
 *   `mmToPx` needs the device and this file is engine-free and device-free.
 */
export function isTapRelease(
  pressedT: number,
  pressedX: number,
  pressedY: number,
  releaseT: number,
  releaseX: number,
  releaseY: number,
  maxDurationMs: number,
  slopPx: number,
): boolean {
  return (
    releaseT - pressedT <= maxDurationMs &&
    Math.hypot(releaseX - pressedX, releaseY - pressedY) <= slopPx
  );
}
