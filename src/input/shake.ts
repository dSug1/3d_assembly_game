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
  /** The last reading, kept so `sawReversal` reports what the product actually measured. */
  private lastRead: Reading | null = null;
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

  /** ⭐ True while the WINDOW holds at least one reversal — see `read`. */
  get sawReversal(): boolean {
    return (this.lastRead?.reversals ?? 0) > 0;
  }

  /**
   * ⛔⛔ THE FLICK TEST IS SKIPPED ONCE THIS IS TRUE (A4). A shake is literally two flicks
   * in opposite directions, so every leg matches the flick signature — fast, straight, far
   * — by construction, and without a skip the gesture that REMOVES a constraint would push
   * one at its release.
   *
   * ⛔⛔⛔ **IT KEYED ON THE FIRST REVERSAL FOR ONE HOUR, AND A DEVICE REPORT RETIRED THAT
   * — the same hour it was wired.** *"The flick should be triggerable during an ongoing
   * rotation"*: a hand turning an object and then flicking a face **reverses**, so a
   * one-reversal skip suppresses exactly the gesture `IN3` exists to serve. ⭐⭐ A4's own
   * text asked for the broad version, and it was written when a flick was read over the
   * whole motion window — where a reversal made a flick undetectable anyway, so the skip
   * cost nothing. `D33` made the flick read its TAIL, and the same rule suddenly cost the
   * main gesture. ⭐ *A guard sized against one reading of a signal is not still the right
   * size when the reading changes.*
   *
   * ✅ So it keys on the shake having **FIRED**, which is the case with a concrete harm: the
   * hand has just cleared its alignments and the release would immediately push a new one,
   * undoing the escape with the gesture that made it.
   * ⚠⚠ THE COST, STATED: a shake ABANDONED before it fires (out-and-back, one reversal)
   * can still end in a flick and push an alignment. ⛔ That is accepted rather than
   * overlooked, because it is **reversible** — one constraint still rotates (2sexte), and a
   * shake removes it — while suppressing every post-reversal flick is not recoverable by
   * any gesture at all. ⚠ The owner's to overturn; `D33` records it as mine.
   */
  get suppressesFlick(): boolean {
    return this.fired;
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

    this.lastRead = this.read(0);

    // ⭐⭐⭐ **THE SHAKE IS LOOKED FOR IN EVERY TRAILING SUB-WINDOW, LONGEST FIRST** — and
    // this is `D33`'s lesson applied to the second gesture that needed it.
    //
    // ⛔⛔ READING THE WHOLE WINDOW IS NOT ENOUGH, and my own vector for the device report
    // proved it before a hand could: a 480 ms drag followed by a 240 ms shake leaves the
    // 600 ms window **mostly drag**, so its principal axis is a diagonal, its perpendicular
    // excursion is huge, and the straightness test refuses the very gesture the report asked
    // for. ⭐ The window must be the LONGEST extent a shake may be read over, never the
    // baseline it is measured on — exactly what `flickWindow` became.
    //
    // ⚠ Longest first, so the verdict reports the whole shake rather than the last two legs
    // of it; and `O(n²)` on a window of ~75 samples, which is a few thousand flops per
    // sample and not worth optimising until something measures it.
    for (let from = 0; from + 3 <= this.window.length; from++) {
      const r = this.read(from);
      if (r === null) continue;
      if (r.reversals < this.params.reversals) continue;
      if (!(r.amplitudeMm > 0)) continue;
      // ⛔ Straightness: a circle oscillates on every axis, and is NOT a shake. See the header.
      if (r.maxPerpMm > this.params.straightness * r.amplitudeMm) continue;
      this.fired = true;
      return {
        reversals: r.reversals,
        amplitudeMm: r.amplitudeMm,
        durationMs: s.t - r.firstReversalT,
      };
    }
    return null;
  }

  /**
   * ⭐⭐⭐ **THE WHOLE GESTURE IS READ FROM THE TRAILING WINDOW, EVERY SAMPLE.**
   *
   * ⛔⛔ **DEVICE-REPORTED 2026-09-16, AND THE OLD SHAPE COULD NOT HAVE DONE BETTER**: *"your
   * shake movement is triggered only if the touchpoint is pressed and the shake immediately
   * follows... the shake is not working in translation mode."* Both complaints are one defect.
   *
   * ⚠ The first build claimed its axis ONCE, from the first leg that cleared the noise, and
   * tracked headings against it for the rest of the gesture. So a hand that dragged an object
   * somewhere and *then* shook it was measured against an axis established seconds earlier,
   * pointing somewhere else — and the reversals, the amplitude and the perpendicular
   * excursion were all accumulated from that same stale origin. ⭐ It worked only when the
   * shake WAS the gesture's beginning, which is exactly what the report says.
   *
   * ⭐⭐⭐ THE SAME MISTAKE `D33` FIXED IN THE FLICK, IN THE SAME WEEK: **a quantity measured
   * from the oldest sample of the gesture instead of from the RECENT motion.** The flick's
   * cure was to read its tail; this one's is to read the window — and neither is a threshold
   * change. ⛔ Mistake shape 1's family: *state the window the quantity is measured over.*
   *
   * ⭐ How the axis is found now: the **principal axis of the windowed path** (the dominant
   * eigenvector of its 2×2 covariance, closed form). For an oscillation along a line that IS
   * the line; for a circle it is arbitrary and the perpendicular excursion then refuses the
   * gesture, which is the header's argument unchanged. ⚠ A diameter search would be O(n²)
   * per sample for no more accuracy on a path this short.
   *
   * ⛔ And the amplitude must clear the noise before any of it means anything: below that the
   * *axis* belongs to the jitter, and a resting finger would oscillate about it.
   */
  private read(from: number): Reading | null {
    const win = from === 0 ? this.window : this.window.slice(from);
    const n = win.length;
    if (n < 3) return null;

    let mx = 0;
    let my = 0;
    for (const p of win) {
      mx += pxToMm(p.x);
      my += pxToMm(p.y);
    }
    mx /= n;
    my /= n;

    let sxx = 0;
    let sxy = 0;
    let syy = 0;
    for (const p of win) {
      const dx = pxToMm(p.x) - mx;
      const dy = pxToMm(p.y) - my;
      sxx += dx * dx;
      sxy += dx * dy;
      syy += dy * dy;
    }
    sxx /= n;
    sxy /= n;
    syy /= n;

    // The larger eigenvalue of a symmetric 2×2, and an eigenvector for it.
    const trace = sxx + syy;
    const disc = Math.max(0, (trace * trace) / 4 - (sxx * syy - sxy * sxy));
    const lambda = trace / 2 + Math.sqrt(disc);
    let ax = sxy;
    let ay = lambda - sxx;
    if (Math.hypot(ax, ay) < 1e-12) {
      // ⚠ The other row, for the case `sxy ≈ 0` — an axis-aligned path, which is the
      // COMMON one on a touchscreen, not an edge case.
      ax = lambda - syy;
      ay = sxy;
    }
    let len = Math.hypot(ax, ay);
    if (!(len > 1e-12)) {
      // Isotropic to numerical precision: no axis exists. ⛔ Say nothing rather than
      // substitute one — `LESSONS_CARRIED` §6.
      return null;
    }
    ax /= len;
    ay /= len;

    const along: number[] = [];
    let maxPerpMm = 0;
    for (const p of win) {
      const dx = pxToMm(p.x) - mx;
      const dy = pxToMm(p.y) - my;
      along.push(dx * ax + dy * ay);
      maxPerpMm = Math.max(maxPerpMm, Math.abs(-dx * ay + dy * ax));
    }
    const amplitudeMm = Math.max(...along) - Math.min(...along);
    if (!(amplitudeMm > AXIS_NOISE_MULTIPLE * this.noiseMm)) return null;

    // ⭐ Reversals counted ACROSS THE WINDOW, with `legMm` as the hysteresis — the same
    // rule as before, applied to the window instead of to an accumulating state.
    let heading = 0;
    let extremum = along[0]!;
    let reversals = 0;
    let firstReversalT = win[win.length - 1]!.t;
    for (let i = 1; i < along.length; i++) {
      const d = along[i]! - extremum;
      if (Math.abs(d) < this.params.legMm) continue;
      const dir = d > 0 ? 1 : -1;
      extremum = along[i]!;
      if (heading === 0) {
        // The first leg only sets a heading; there is nothing yet to reverse from.
        heading = dir;
        continue;
      }
      if (dir === heading) continue; // ⭐ a long leg is ONE leg
      heading = dir;
      reversals++;
      if (reversals === 1) firstReversalT = win[i]!.t;
    }
    return { reversals, amplitudeMm, maxPerpMm, firstReversalT };
  }
}

/** What one reading of the window found. ⚠ Diagnostic — `push` decides. */
interface Reading {
  readonly reversals: number;
  readonly amplitudeMm: number;
  readonly maxPerpMm: number;
  readonly firstReversalT: number;
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
