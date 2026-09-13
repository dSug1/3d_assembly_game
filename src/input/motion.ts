/**
 * §1.1 — THE HYSTERETIC MOTION STATE.
 *
 * ⛔⛔ `delta === 0` IS NEVER EVALUATED LITERALLY. A resting finger jitters, so a
 * literal zero test is true almost never and the rules that depend on "the other
 * touchpoint is still" would essentially never fire. Every "delta position" in the
 * spec means `MOVING`; every "no delta position" means `STATIONARY`.
 *
 * ⭐ `moveEnterDistance > moveExitDistance` is REQUIRED and asserted: equal
 * thresholds chatter at the boundary, which is a state machine flipping many times
 * per second in the user's hand.
 *
 * ⛔⛔ AND THE THRESHOLD IS **NET DISPLACEMENT FROM AN ANCHOR**, NOT ACCUMULATED
 * TRAVEL. The spec (§1.1) says *"accumulated travel since the last STATIONARY frame
 * exceeds moveEnterDistance"*, and taken literally that is unusable: the path length
 * of a jittering finger is a random walk, so it GROWS WITHOUT BOUND and every
 * resting touchpoint eventually reads MOVING. Measured on the first test run — a
 * finger oscillating ±0.5 px crossed a 5.7 px threshold in under half a second.
 * ⭐ Net displacement from the anchor is bounded for jitter and grows for a real
 * drag, which is the discrimination actually wanted. Reported back to the spec.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐⭐ AND THE EXIT IS NOT A SPEED TEST ALONE. `IN0` left `moveExitDistance`
 * DECLARED AND UNUSED -- an unused tunable is a lie in the config, and `IN5` would
 * have gone and measured a number that did nothing.
 *
 * It is now the EXCURSION BOUND during settle candidacy: the moment speed drops
 * below `stillSpeed`, that position becomes a candidate rest point, and STATIONARY
 * latches only if the finger stayed within `moveExitDistance` of it for the whole
 * `stillTime`. ⭐ This catches what an instantaneous speed test STRUCTURALLY cannot:
 * a SLOW PERSISTENT CREEP, which is never at rest and never exceeds `stillSpeed`.
 *
 * ⛔⛔ AND THE TWO THRESHOLDS MUST BE MUTUALLY CONSISTENT, WHICH THEY WERE NOT.
 * Motion sustained below `stillSpeed` for `stillTime` cannot cover more ground than
 * `stillSpeed * stillTime`, so if that product does not EXCEED `moveExitDistance`,
 * the bound is unreachable under any wiring whatsoever. The shipped defaults were
 * `6 mm/s x 80 ms = 0.48 mm` against a `0.8 mm` bound. Asserted below, so the next
 * inconsistent config is a loud failure rather than another dead threshold.
 */
import { mmToPx } from "../core/units";
import { validateGestureConfig, type GestureConfig } from "./gestureConfig";

export type MotionState = "STATIONARY" | "MOVING";

export interface Sample {
  /** CSS pixels. */
  readonly x: number;
  readonly y: number;
  /** Milliseconds, monotonic. */
  readonly t: number;
}

export class MotionTracker {
  private state: MotionState = "STATIONARY";
  private last: Sample | null = null;
  /** Where the finger settled. Displacement is measured from HERE, not integrated. */
  private anchor: Sample | null = null;
  private stillSinceMs: number | null = null;
  /** Where the finger was when it first slowed down. Excursion is measured from HERE. */
  private settleAnchor: Sample | null = null;

  constructor(private readonly cfg: GestureConfig) {
    // ⭐ Every cross-tunable consistency rule lives in ONE place, and every
    // Recognizer builds one of these. See `validateGestureConfig` for the rules.
    validateGestureConfig(cfg);
  }

  get current(): MotionState {
    return this.state;
  }

  reset(): void {
    this.state = "STATIONARY";
    this.last = null;
    this.anchor = null;
    this.stillSinceMs = null;
    this.settleAnchor = null;
  }

  push(s: Sample): MotionState {
    const prev = this.last;
    this.last = s;
    this.anchor ??= s;
    if (!prev) return this.state;

    const dt = s.t - prev.t;
    const step = Math.hypot(s.x - prev.x, s.y - prev.y);
    // ⚠ A zero or negative interval means a duplicated/backwards timestamp. Treat
    // the sample as position-only rather than dividing by it.
    const speedPxPerS = dt > 0 ? (step / dt) * 1000 : 0;
    const stillSpeedPx = mmToPx(this.cfg.stillSpeed);

    if (this.state === "STATIONARY") {
      const anchor = this.anchor!;
      const displaced = Math.hypot(s.x - anchor.x, s.y - anchor.y);
      if (displaced >= mmToPx(this.cfg.moveEnterDistance)) {
        this.state = "MOVING";
        this.stillSinceMs = null;
      }
      return this.state;
    }

    // MOVING -> STATIONARY needs THREE things, not one: the speed low, the
    // EXCURSION from where it slowed inside `moveExitDistance`, and both of those
    // sustained for `stillTime`. The excursion term is the one that sees a creep.
    if (speedPxPerS <= stillSpeedPx) {
      if (this.settleAnchor === null) {
        this.settleAnchor = prev;
        this.stillSinceMs = prev.t;
      }
      const excursionPx = Math.hypot(s.x - this.settleAnchor.x, s.y - this.settleAnchor.y);
      if (excursionPx > mmToPx(this.cfg.moveExitDistance)) {
        // ⭐ Slow, but it went somewhere. Restart candidacy HERE rather than
        // cancelling outright -- a creep then simply never accumulates `stillTime`
        // and stays MOVING, which is the correct reading of a deliberate slow drag.
        this.settleAnchor = s;
        this.stillSinceMs = s.t;
      } else if (s.t - this.stillSinceMs! >= this.cfg.stillTime) {
        this.state = "STATIONARY";
        // ⭐ Re-anchor HERE. The next MOVING decision is measured from where the
        // finger actually came to rest, not from where the gesture began.
        this.anchor = s;
        this.stillSinceMs = null;
        this.settleAnchor = null;
      }
    } else {
      this.stillSinceMs = null;
      this.settleAnchor = null;
    }
    return this.state;
  }
}
