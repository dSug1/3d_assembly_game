/**
 * §2 rule 2septies, as amended — **THE EVICTION SHAKE**.
 *
 * Design of record: `Claude/10_INPUT_TOUCH/AMENDMENTS_R5.md`, amendment **A4** (`D15`).
 * A quick **back-and-forth** on a selected object clears its alignments.
 *
 * ⛔⛔ WHY IT IS NOT A ROLL, WHICH IS WHAT THIS WAS FOR ONE DAY. `A1` chose a 360° roll
 * while roll was FORBIDDEN on a constrained object, so that channel was free. `A3`/`D14`
 * gave the channel back to a real control — an object anchored on gravity must still take
 * roll when the camera looks along the gravity axis, because there rolling about the view
 * axis IS twisting about the anchor. ⭐ *A different channel is the resolution to an
 * ambiguity; a bigger number is not* — which is why 720° was rejected rather than tried.
 *
 * ⛔⛔ AND THAT IS EXACTLY WHY STRAIGHTNESS IS PART OF THE DEFINITION, NOT A GUARD BOLTED
 * ON: **A CIRCLE PROJECTS TO A BACK-AND-FORTH ON EVERY AXIS.** A finger sweeping a circle
 * oscillates along any line you measure it against, so a detector that only counted
 * reversals would fire on the very gesture A3 just made legal. A shake is *oscillation
 * ALONG AN AXIS*; how far the path strays off that axis is part of what the word means.
 * ⭐ `METHOD` — *no heuristic pile-up*: this is the definition, not a special case bolted
 * onto an observed failure.
 *
 * ⭐⭐ THE NOISE DISCIPLINE IS `sway.ts`'s, AND IT WAS PAID FOR. A per-sample direction is
 * noise: at 0.761 mm of measured jitter and an 8 ms frame, a finger held perfectly still
 * fired **272 false kicks in 3 s**. Here the same fact sets the hysteresis — a reversal is
 * only a reversal once the finger has come back `legMm` from the last extremum, and
 * `validateGestureConfig` refuses a `legMm` that does not clear the measured noise.
 *
 * ⛔ ENGINE-FREE, and it decides nothing: it reports that a shake HAPPENED. What that
 * costs the object — `D13`: alignments go, **mates stay** — is the caller's, and a
 * mate-only stack must refuse AUDIBLY rather than silently do nothing.
 */
import { pxToMm } from "../core/units";
import type { GestureConfig } from "./gestureConfig";
import type { Sample } from "./motion";

export interface ShakeParams {
  /** Reversals required. §A4: 2 — out, back, out. */
  readonly reversals: number;
  /** They must all fall inside this window, in milliseconds. */
  readonly windowMs: number;
  /**
   * Minimum travel back from an extremum before a reversal counts, in millimetres.
   * ⭐ It is the HYSTERESIS as well as the amplitude floor — one number, because they
   * are the same question asked twice: *is this a leg, or is it jitter?*
   */
  readonly legMm: number;
  /**
   * Maximum excursion PERPENDICULAR to the shake axis, as a fraction of the along-axis
   * amplitude. ⛔ This is what separates a shake from a circle. See the header.
   */
  readonly straightness: number;
}

/** What a completed shake reports. ⚠ Diagnostic — the caller acts, this only tells. */
export interface ShakeVerdict {
  /** Reversals counted when it fired. */
  readonly reversals: number;
  /** Peak-to-peak amplitude along the shake axis, millimetres. */
  readonly amplitudeMm: number;
  /** How long the whole shake took, milliseconds. */
  readonly durationMs: number;
}

/**
 * Watches ONE touchpoint for a shake. ⚠ One per gesture: it carries the axis the first
 * leg established, and a fresh gesture is a fresh axis.
 *
 * ⛔ It fires at most ONCE. Eviction is destructive, and a detector that re-armed inside
 * one gesture would clear a stack, let the user keep shaking, and clear it again — which
 * is invisible when there is nothing left to clear and indistinguishable from a bug when
 * there is.
 */
export class ShakeDetector {
  /** Samples still inside the window, oldest first. */
  private readonly window: Sample[] = [];
  /** Unit vector of the shake axis, in millimetres-space. `null` until established. */
  private axis: { x: number; y: number } | null = null;
  /** Origin the axis coordinate is measured from. */
  private originX = 0;
  private originY = 0;
  /** Signed position along the axis at the last extremum, millimetres. */
  private lastExtremum = 0;
  /** Which way the finger is currently travelling along the axis: +1, −1 or 0. */
  private heading = 0;
  private reversals = 0;
  private reversalTimes: number[] = [];
  private firstReversalT = 0;
  private minAlong = 0;
  private maxAlong = 0;
  private maxPerp = 0;
  private fired = false;

  /**
   * @param params the four tunables. ⭐ All four are `IN5` placeholders and each ships
   *   with a slider: the whole safety of this gesture is the gap between a shake and a
   *   corrective nudge, and that is a hand's judgement, not a simulation's.
   * @param noiseMm the MEASURED pointer noise. ⭐ Passed in rather than assumed — it is a
   *   property of the glass, exactly as `SwayWatcher` takes it.
   */
  constructor(
    private readonly params: ShakeParams,
    private readonly noiseMm: number,
  ) {}

  /** ⭐ True once ONE reversal has been seen — see `sawReversal` for why that matters. */
  get sawReversal(): boolean {
    return this.reversals > 0;
  }

  /**
   * ⛔⛔ THE FLICK TEST MUST BE SKIPPED ONCE THIS IS TRUE, AND IT IS THE ONE THING `IN3`
   * MUST NOT FORGET (A4). A shake is literally two flicks in opposite directions, so every
   * leg matches the flick signature — fast, straight, far — by construction. Without the
   * skip, a user who shakes to REMOVE a constraint releases mid-shake at speed, the flick
   * test passes, and 2ter or 2quater **pushes** one instead. With two on the stack the
   * object then has zero free rotational DOF and stops responding to drags at all.
   */
  get suppressesFlick(): boolean {
    return this.sawReversal;
  }

  /**
   * Feed one sample.
   *
   * @returns the verdict on the sample that completes the shake, else `null`.
   */
  push(s: Sample): ShakeVerdict | null {
    if (this.fired) return null;

    this.window.push(s);
    while (this.window.length > 1 && s.t - this.window[0]!.t > this.params.windowMs) {
      this.window.shift();
    }

    // ── Establish the axis from the first leg that clears the noise ────────────
    if (!this.axis) {
      const first = this.window[0]!;
      const dx = pxToMm(s.x - first.x);
      const dy = pxToMm(s.y - first.y);
      const travel = Math.hypot(dx, dy);
      // ⛔ Below this the "direction" belongs to the jitter, not to the hand. Say
      // nothing — `LESSONS_CARRIED` §6, suppress rather than substitute.
      if (!(travel > AXIS_NOISE_MULTIPLE * this.noiseMm)) return null;
      this.axis = { x: dx / travel, y: dy / travel };
      this.originX = first.x;
      this.originY = first.y;
      this.heading = 0;
      this.lastExtremum = 0;
      this.minAlong = 0;
      this.maxAlong = 0;
      this.maxPerp = 0;
      return null;
    }

    const { along, perp } = this.project(s);
    this.minAlong = Math.min(this.minAlong, along);
    this.maxAlong = Math.max(this.maxAlong, along);
    this.maxPerp = Math.max(this.maxPerp, Math.abs(perp));

    const delta = along - this.lastExtremum;
    if (Math.abs(delta) < this.params.legMm) return null;

    const dir = delta > 0 ? 1 : -1;
    if (this.heading === 0) {
      // The first leg only sets a heading; there is nothing yet to reverse from.
      this.heading = dir;
      this.lastExtremum = along;
      return null;
    }
    if (dir === this.heading) {
      // ⭐ Still going the same way — the extremum follows the finger out, so a long
      // leg is one leg and not a sequence of them.
      this.lastExtremum = along;
      return null;
    }

    // ── A reversal ────────────────────────────────────────────────────────────
    this.heading = dir;
    this.lastExtremum = along;
    if (this.reversals === 0) this.firstReversalT = s.t;
    this.reversals++;
    this.reversalTimes.push(s.t);
    // ⚠ Reversals must all fall inside ONE window. Drop any that have aged out, or a
    // slow fidget over ten seconds would accumulate into an eviction.
    this.reversalTimes = this.reversalTimes.filter((t) => s.t - t <= this.params.windowMs);
    if (this.reversalTimes.length < this.params.reversals) return null;

    // ── Straightness: a circle oscillates on every axis, and is NOT a shake ────
    const amplitudeMm = this.maxAlong - this.minAlong;
    if (!(amplitudeMm > 0)) return null;
    if (this.maxPerp > this.params.straightness * amplitudeMm) return null;

    this.fired = true;
    return {
      reversals: this.reversalTimes.length,
      amplitudeMm,
      durationMs: s.t - this.firstReversalT,
    };
  }

  /** Signed millimetres along the shake axis, and perpendicular to it. */
  private project(s: Sample): { along: number; perp: number } {
    const a = this.axis!;
    const dx = pxToMm(s.x - this.originX);
    const dy = pxToMm(s.y - this.originY);
    return { along: dx * a.x + dy * a.y, perp: -dx * a.y + dy * a.x };
  }
}

/**
 * How far the finger must travel before the shake AXIS is claimed, as a multiple of the
 * measured pointer noise. ⭐ The same multiple `sway.ts` uses to claim a heading, and for
 * the same reason: below it the direction is the noise's.
 */
export const AXIS_NOISE_MULTIPLE = 3;

/**
 * ⭐ The four tunables, read from the ONE config. `CONSTRAINTS` §4: a tuning value needed
 * in two places is IMPORTED, never copied — a second copy is how two paths silently drift.
 */
export function shakeParamsFrom(cfg: GestureConfig): ShakeParams {
  return {
    reversals: cfg.evictShakeReversals,
    windowMs: cfg.evictShakeWindowMs,
    legMm: cfg.evictShakeLegMm,
    straightness: cfg.evictShakeStraightness,
  };
}
