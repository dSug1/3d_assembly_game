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
 */
import { mmToPx } from "../core/units";
import type { GestureConfig } from "./gestureConfig";

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

  constructor(private readonly cfg: GestureConfig) {
    if (cfg.moveEnterDistance <= cfg.moveExitDistance) {
      throw new Error(
        "moveEnterDistance must exceed moveExitDistance, or the motion state chatters.",
      );
    }
  }

  get current(): MotionState {
    return this.state;
  }

  reset(): void {
    this.state = "STATIONARY";
    this.last = null;
    this.anchor = null;
    this.stillSinceMs = null;
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

    // MOVING -> STATIONARY needs BOTH a slow speed and it sustained for stillTime.
    if (speedPxPerS <= stillSpeedPx) {
      this.stillSinceMs ??= prev.t;
      if (s.t - this.stillSinceMs >= this.cfg.stillTime) {
        this.state = "STATIONARY";
        // ⭐ Re-anchor HERE. The next MOVING decision is measured from where the
        // finger actually came to rest, not from where the gesture began.
        this.anchor = s;
        this.stillSinceMs = null;
      }
    } else {
      this.stillSinceMs = null;
    }
    return this.state;
  }
}
