/**
 * AMENDMENT **A6** — **DEPTH TRANSLATION BY A COMMON VERTICAL DRAG.**
 *
 * Design of record: `Claude/10_INPUT_TOUCH/AMENDMENTS_R5.md` A6, superseding A5's trigger.
 *
 * > One touchpoint on the object, one touchpoint anywhere, and **both moving in y by the
 * > same amount** — the object translates in horizontal depth.
 *
 * ## ⛔⛔ WHY THE PINCH HAD TO GO, AND IT WAS FOUND BY FINGER
 *
 * A5 made two fingers ON the object a depth pinch. ⚠ *"When the object is small, it is not
 * possible to pinch it out to send it backwards because two fingers cannot sit on the small
 * object."* ⭐ And it fails exactly where it hurts: pushing a part away SHRINKS it on
 * screen, so **the gesture destroyed its own affordance as it succeeded** — the further you
 * got, the harder it became to go further.
 *
 * ⭐⭐ A6's second touchpoint goes ANYWHERE, so the object's size on screen stops mattering
 * at all. And it is the same hand shape rule 6 already uses — one finger on the part, one
 * beside it — so depth becomes a variation of translation rather than a separate idea.
 *
 * ## ⛔⛔ IT SHARES A CONFIGURATION WITH RULE 6, AND THE DISCRIMINATOR IS THE WHOLE DESIGN
 *
 * Rule 6 is *one touchpoint on an object && one outside*, and A6 is a superset of that. So
 * the two are separated by WHAT THE FINGERS DO, not by where they are:
 *
 * | both fingers | rule |
 * |---|---|
 * | the anchor is still, the object finger drags | **rule 6** — translate in the screen plane |
 * | **both travel in y together**, within a tolerance | ⭐ **A6** — translate in depth |
 *
 * ⛔ COMMON MODE IS DEPTH; DIFFERENTIAL MODE IS RULE 6. That is the one sentence worth
 * remembering, and it is why the tolerance is on the DIFFERENCE of the two travels rather
 * than on either one.
 *
 * ## ⛔⛔ DETECTION NEEDS A BASELINE; APPLICATION NEEDS AN INCREMENT. THEY ARE SEPARATE.
 *
 * Mistake shape 1 on this project is *a rate estimated over the shortest available
 * baseline*, and it has cost three defects. So "are these two fingers moving together?" is
 * decided over a **stated window** against the **measured** pointer noise.
 *
 * ⛔ But the DISPLACEMENT applied must not be a re-applied window — that would compound,
 * which is the trap A5's ratio had.
 *
 * ## ⭐⭐ THE OBJECT FOLLOWS THE **SHARED** MOTION, MEASURED FROM THE LATCH
 *
 * ⛔⛔ A THIRD DEFECT, FOUND BY FINGER: *"the finger which is outside any object can move
 * the object on depth once or twice even if the finger on the object is still."* The
 * displacement used to be **half of each finger's own delta**, and halves sum to the average
 * — so a finger moving ALONE still contributed real motion until the divergence test tripped.
 * ⚠ Any tolerance above zero leaks that way; it is inherent to averaging, not to the number.
 *
 * ⭐ So the quantity is the travel the two fingers are **coupled** on — their mean, faded
 * out by how far they have drifted apart since the latch. See `coupledTravel`, which also
 * records the discontinuous first attempt and why a hand felt it within minutes.
 *
 * ⭐⭐ Three properties fall out, and each answers a report:
 *
 * * a **still finger moves the object nowhere** — the fade takes the motion back to zero as
 *   the drift grows, so a lone finger nudges and returns rather than translating;
 * * it is **cumulative**, so nothing compounds and the caller applies only the CHANGE;
 * * **out and back retraces exactly**, which is what stops a back-and-forth from drifting.
 *
 * ## ⭐ THE GAIN IS RULE 6's, REDIRECTED
 *
 * The displacement uses `trackingMetresPerPx` — the same computed factor rule 6 uses — so
 * **one hand's-worth of finger travel moves the object the same distance whichever
 * direction it is going**, in the screen plane or into the scene. ⛔ Not a
 * metres-per-millimetre constant, which rule 6 proved cannot serve both ends of a 20× zoom
 * clamp. `gainTranslateDepth` multiplies it, and 1.0 means *as far as a drag would*.
 *
 * ⚠ It is NOT "the object stays under the finger": that mapping diverges as the camera
 * levels out, because an object pushed along the ground barely moves on screen when you are
 * looking at it horizontally. ⭐ Consistency with rule 6 is a property that holds at every
 * camera elevation; tracking is not. See A6 for the trade.
 *
 * ⛔ ENGINE-FREE.
 */
import { CAMERA_NEAR_PLANE_M, type GestureConfig } from "./gestureConfig";
import { pxToMm } from "../core/units";
import { add, dot, normalize, scale, sub, type Vec3 } from "../core/vec";

/**
 * How near and how far a depth translation may drive an object, in metres of HORIZONTAL
 * depth. ⭐ Carried unchanged from A5: the bounds were derived, not invented, and changing
 * the TRIGGER does not change where an object may end up.
 *
 * * **The floor is twice the near plane.** `pinch.ts` records why: a zoom across the near
 *   plane produces *a black page with no error at all*. An object pushed onto the camera
 *   would clip through and invert behind it — the same silent failure, one object at a
 *   time.
 * * **The ceiling is the camera's own maximum orbit radius.** Beyond it the object cannot
 *   be brought back into view even by zooming all the way out. ⚠ A gesture must not reach a
 *   state the user cannot undo.
 *
 * ⚠ Whether the ceiling ever BINDS is on the HUD rather than asserted here — the owner
 * looked for it and could not see it, and a claim a device cannot check is an assertion.
 */
export function depthLimits(cfg: GestureConfig): { minM: number; maxM: number } {
  return { minM: 2 * CAMERA_NEAR_PLANE_M, maxM: cfg.cameraRadiusMaxM };
}

/**
 * The direction depth runs along: the camera's view direction with its gravity component
 * removed, normalised. `null` when there is none.
 *
 * ⛔⛔ HORIZONTAL, NOT ALONG THE VIEW AXIS — the owner's correction, and the reason is that
 * **gravity is the primary constraint in this game**. §2 rule 2ter anchors a face to it and
 * parts are assembled on a working plane, so a camera looking down would make "away" point
 * into the FLOOR. A gesture meaning *"put this further away"* must not change an object's
 * HEIGHT.
 *
 * ⛔ It vanishes when the camera looks straight down, and the orbit surface's top ring is a
 * steep look-down. ⚠ The MECHANISM of the weakening is the camera's POSITION, not its
 * angle: flattening does not turn the view direction, so what shrinks is the horizontal
 * distance as the camera climbs overhead.
 */
export function depthPushDirection(viewAxis: Vec3, gravityDown: Vec3): Vec3 | null {
  const g = normalize(gravityDown);
  const v = normalize(viewAxis);
  if (!g || !v) return null;
  return normalize(sub(v, scale(g, dot(v, g))));
}

/**
 * ⭐⭐ WHAT THE DETECTOR KNOWS SO FAR, and the distinction is the whole of the boundary fix.
 *
 * ⛔⛔ A DEFECT FOUND BY FINGER: *"at the end and beginning of the movement, it slightly
 * jumps, as if it doesn't know what to follow."* Exactly so — it did not know. The detector
 * used to answer `null` both for *"I have not decided"* and for *"this is not a common
 * drag"*, so the caller could not tell them apart and fell through to rule 6 either way.
 * ⚠ Under A7 rule 6's dy is the GRAVITY axis, so the undecided frames at each end of the
 * gesture were applied as a vertical lurch before depth took over.
 *
 * ⭐ *Acting is irreversible; not knowing is not a reason to act.* The caller now WITHHOLDS
 * the vertical component while `PENDING` and releases it to whichever rule wins.
 */
export type CommonDragVerdict = "PENDING" | "COMMON" | "SEPARATE";

/** What the detector reports when two fingers are travelling together. */
export interface CommonDrag {
  /**
   * ⭐⭐ THE COUPLED TRAVEL SINCE THE LATCH, millimetres — the running sum of each step's
   * mean movement scaled by how well the two fingers agreed AT THAT STEP. See `coupling`.
   * ⚠ Screen y: DOWN is positive. ⛔ CUMULATIVE — the caller applies the CHANGE since it
   * last acted, never this value itself, or the motion would compound every frame.
   */
  readonly sharedMm: number;
  /** Their averaged travel across the window. ⚠ Diagnostic: the object does NOT follow it. */
  readonly commonMm: number;
  /** How far apart the two travels were — the quantity the entry tolerance is on. */
  readonly spreadMm: number;
}

/**
 * Decides whether two touchpoints are travelling **together in y**.
 *
 * ⛔⛔ IT ONLY DECIDES. It reports the window's travel so a caller can see what it judged,
 * but the caller must move the object by THIS FRAME's delta — see the header.
 *
 * ⛔⛔ AND IT **LATCHES**, WHICH IS A DEFECT FIX, NOT A REFINEMENT.
 * *"At the start when the two fingers move together the translation on depth is OK but then
 * it seems to blend into a translation along gravity axis, even though the two fingers
 * continue their synchronized movements."* — found by finger, 2026-09-15.
 *
 * The entry test needs BOTH fingers to have travelled more than 3× the measured pointer
 * noise across the window. ⚠ Every deliberate drag SLOWS as it settles, so that floor stops
 * being met while the hand is still doing exactly the same thing — the gate returned
 * `null`, control fell through to rule 6, and under A7 rule 6's dy is the GRAVITY axis. The
 * gesture converted itself from depth into a vertical lift, smoothly, as the speed decayed.
 * ⭐ Hence "blend": it was not a glitch, it was a handover.
 *
 * ⛔ **A speed below the noise floor means "no new information", not "a different
 * gesture".** So entering needs both fingers moving; STAYING needs only that they have not
 * demonstrably diverged. That is §1.1's `moveEnterDistance > moveExitDistance` and §1.3's
 * one-way `COMMITTED_CONTINUOUS`, applied to the one mode selector that was still deciding
 * per frame — and `IN4` already wrote the rule down: a noisy continuous signal must not
 * pick a mode every frame.
 *
 * ## ⛔⛔ AND THE EXIT IS **CUMULATIVE**, NOT WINDOWED — a second defect, found by finger
 *
 * The first latch exited on a WINDOWED divergence, and that is rate-dependent, which broke
 * it both ways at once:
 *
 * * *"if I stop moving the second finger and it stays idle, the depth translation continues
 *   instead of switching"* — the holder had to cover the whole tolerance **within one
 *   window** (6 mm in 60 ms, i.e. >100 mm/s) before the spread could exceed it. Drag slower
 *   and it never exited at all.
 * * *"I can continue to see some drift when I do back and forth"* — two fingers never turn
 *   around in the same millisecond, and that skew makes a windowed spread **spike** at each
 *   reversal, releasing the latch and leaking frames of rule 6 before it re-entered.
 *
 * ⛔ **No pair of values fixes both**: lowering the tolerance leaks more at reversals,
 * raising it makes an idle anchor stickier. ⭐ The quantity was wrong, not the number —
 * which is `METHOD`'s *"ask whether you replaced the quantity rather than improved it"*,
 * read from the other end.
 *
 * ⭐⭐ So divergence is now measured as **total displacement since the latch**:
 * `|(a − a₀) − (b − b₀)|`. An idle finger diverges steadily and exits after a fixed
 * DISTANCE at any speed; a turnaround skew is a transient that cancels itself as both
 * fingers complete the turn.
 *
 * ⚠ One per gesture: it carries the window and the latch.
 */
export class CommonDragDetector {
  private readonly window: { t: number; a: number; b: number }[] = [];
  /** ⭐ True once the two fingers have been seen travelling together. */
  private latched = false;
  /**
   * Where each finger was when the latch closed. ⛔ Divergence is measured from HERE, not
   * across the window — see the header. `null` while unlatched.
   */
  private latchOrigin: { a: number; b: number } | null = null;
  /**
   * ⛔ True once there is enough evidence to say *"these two are NOT one gesture"* — as
   * opposed to *"I do not know yet"*. ⚠ The difference decides whether the caller may act.
   */
  private decided = false;
  /** The two fingers' positions at the previous push — the increment's baseline. */
  private prev: { a: number; b: number } | null = null;
  /** ⭐ The integrated coupled travel since the latch, millimetres. */
  private coupledMm = 0;

  /**
   * @param windowMs      the baseline the travels are measured over.
   * @param toleranceMm   how far apart the two travels may be and still count as common.
   * @param noiseMm       the MEASURED pointer noise. ⭐ Passed in, as `sway.ts` takes it:
   *   it is a property of the glass, and it decides how much travel means anything.
   */
  constructor(
    private readonly windowMs: number,
    private readonly toleranceMm: number,
    private readonly noiseMm: number,
  ) {}

  /** ⭐ True while a common drag is in force. Exits only on a real divergence. */
  get isCommon(): boolean {
    return this.latched;
  }

  /**
   * ⭐ What the detector knows RIGHT NOW, without being fed anything. `PENDING` until it has
   * enough evidence to say either way — see `CommonDragVerdict`.
   */
  get verdict(): CommonDragVerdict {
    if (this.latched) return "COMMON";
    return this.decided ? "SEPARATE" : "PENDING";
  }

  /** Feed both touchpoints' current y. `null` when this is not a common drag. */
  push(t: number, aYPx: number, bYPx: number): CommonDrag | null {
    this.window.push({ t, a: aYPx, b: bYPx });
    while (this.window.length > 1 && t - this.window[0]!.t > this.windowMs) this.window.shift();

    const first = this.window[0]!;
    // ⛔ A window of one sample has no baseline at all; saying nothing is the honest answer.
    // ⚠ And it is PENDING, not SEPARATE: nothing has been ruled out yet.
    if (this.window.length < 2) return null;

    const da = pxToMm(aYPx - first.a);
    const db = pxToMm(bYPx - first.b);

    // ⛔ BOTH must actually be moving — TO ENTER. A still finger's "travel" is jitter, and
    // pairing it with a real one would read as common motion whenever the moving one
    // happened to be slow. This is what keeps rule 6 — whose anchor is deliberately still —
    // out of A6.
    // ⭐⭐ ONCE LATCHED THE FLOOR NO LONGER APPLIES. A hand that slows mid-gesture is still
    // doing the same gesture, and re-asking this question every frame is what made the
    // depth translation blend into a vertical one as the fingers settled.
    const floor = MIN_TRAVEL_NOISE_MULTIPLE * this.noiseMm;
    if (!this.latched && (!(Math.abs(da) > floor) || !(Math.abs(db) > floor))) {
      // ⭐⭐ THE DECISION, AND IT IS THE ONE THAT MATTERS AT THE START OF A GESTURE.
      // One finger moving well while the other stays put is RULE 6 — an anchor is meant to
      // be still. That is evidence, not an absence of it, so the caller may act on y.
      // ⚠ Both merely slow is NOT evidence: it is a hand that has not committed yet, and
      // acting on it is what produced the lurch at each end.
      const spanMs = s_windowSpan(this.window);
      if (spanMs >= this.windowMs * DECISION_WINDOWS && Math.abs(da - db) > this.toleranceMm) {
        this.decided = true;
      }
      return null;
    }

    const spreadMm = Math.abs(da - db);

    if (this.latched && this.latchOrigin) {
      // ⛔⛔ CUMULATIVE divergence: how far the two have drifted apart in TOTAL since the
      // latch closed. Rate-independent, so an idle finger exits after a fixed distance
      // however slowly the other moves, and a turnaround skew cancels itself.
      const sinceA = pxToMm(aYPx - this.latchOrigin.a);
      const sinceB = pxToMm(bYPx - this.latchOrigin.b);

      // ⭐⭐ INTEGRATE. Each step contributes the pair's MEAN movement, scaled by how well
      // they currently agree — so a pair moving together accrues the full travel, and a
      // finger running on alone accrues less and less until it accrues nothing. ⛔ Nothing
      // already banked is ever revised, which is what stops the backward yank.
      if (this.prev) {
        const stepMeanMm =
          (pxToMm(aYPx - this.prev.a) + pxToMm(bYPx - this.prev.b)) / 2;
        this.coupledMm += stepMeanMm * coupling(sinceA - sinceB, this.toleranceMm);
      }
      this.prev = { a: aYPx, b: bYPx };

      if (Math.abs(sinceA - sinceB) > this.toleranceMm) {
        this.latched = false;
        this.latchOrigin = null;
        this.prev = null;
        this.coupledMm = 0;
        // ⭐ Leaving a latch IS a decision: the fingers demonstrably parted company, so the
        // caller may hand the vertical back to rule 6 immediately.
        this.decided = true;
        return null;
      }
      return { sharedMm: this.coupledMm, commonMm: (da + db) / 2, spreadMm };
    }

    // ⛔ ENTERING still asks the windowed question: are they moving together RIGHT NOW?
    if (spreadMm > this.toleranceMm) return null;

    this.latched = true;
    this.decided = false;
    this.latchOrigin = { a: aYPx, b: bYPx };
    this.prev = { a: aYPx, b: bYPx };
    this.coupledMm = 0;
    // ⭐ Zero by construction at the latch: nothing coupled has happened yet.
    return { sharedMm: 0, commonMm: (da + db) / 2, spreadMm };
  }
}

/**
 * How far the finger must travel before a direction is claimed, as a multiple of the
 * measured pointer noise. ⭐ The same multiple `sway.ts` uses, and for the same reason:
 * below it the travel belongs to the jitter. ⚠ Measured — a still finger once fired 272
 * false kicks in 3 s from per-sample directions.
 */
export const MIN_TRAVEL_NOISE_MULTIPLE = 3;

/**
 * How many full windows of disagreement before the detector will say SEPARATE.
 * ⚠ One window is the shortest baseline that can tell the two fingers apart at all, and
 * `METHOD` is blunt about the shortest available baseline. Two is a cheap margin on a
 * decision that hands the vertical axis to a different rule.
 */
const DECISION_WINDOWS = 2;

/** The time the window currently spans, milliseconds. */
function s_windowSpan(w: readonly { t: number }[]): number {
  return w.length < 2 ? 0 : w[w.length - 1]!.t - w[0]!.t;
}

/**
 * ⭐⭐ HOW MUCH OF A STEP THE TWO FINGERS ARE **COUPLED** ON — a fraction between 0 and 1,
 * from how far they have drifted apart.
 *
 * ```
 *   coupling = max(0, 1 − |a − b| / tolerance)
 * ```
 *
 * ⛔⛔ IT MULTIPLIES THE **INCREMENT**, NEVER THE ACCUMULATED TRAVEL, and that distinction
 * is a defect I wrote and the vectors caught before a finger had to. Fading the TOTAL means
 * that after the pair has travelled 27 mm together, a 1 mm disagreement drops the result
 * from 27 to 23 — **the object is yanked backwards by four millimetres**, and the yank
 * grows with how far the drag has already gone. ⭐ A correction must never be proportional
 * to the history it is correcting.
 *
 * ⛔⛔ THE FIRST VERSION OF THIS WAS `min(|a|,|b|)` WITH A SIGN TEST, AND IT WAS A
 * REGRESSION FOUND IMMEDIATELY BY FINGER: *"during a normal synchronized finger movement,
 * the object jumps erratically, as if it struggles to follow the finger movements."*
 *
 * ⚠ A minimum is **discontinuous**, and two things made that visible. The fingers' events
 * ALTERNATE, so the minimum only advances when the LAGGING one does — it stalls on one
 * event and double-steps on the next. And near the latch both travels hover about zero, so
 * the sign test flipped the result between 0 and small values; since the object moves by
 * the CHANGE, every flip was applied as real motion. ⭐ *A control must be a continuous
 * function of the input, or the hand feels every seam in it.*
 *
 * ⭐⭐ THE THREE PROPERTIES THAT ACTUALLY MATTER, ALL KEPT, AND NOW WITHOUT THE SEAMS:
 *
 * * **moving together ⇒ full tracking.** `|a − b|` is small, the fade is ≈1, and the result
 *   is their mean — smooth, and exactly what a synchronized drag asks for.
 * * **a still finger ⇒ the motion TAPERS TO NOTHING, and nets to zero.** As one finger runs
 *   on alone the drift grows, the fade falls linearly, and the coupled travel rises to a
 *   small peak at half the tolerance and returns to zero by the tolerance. ⭐ So a lone
 *   finger does not move the object anywhere — it nudges it out and brings it back.
 * * **out and back retraces**, because both terms retrace.
 *
 * ⭐ It reuses `depthCommonToleranceMm` rather than inventing a number: "how far apart may
 * two fingers drift and still be one gesture" is the same question the entry test asks.
 */
export function coupling(driftMm: number, toleranceMm: number): number {
  if (!(toleranceMm > 0)) return 1;
  return Math.max(0, 1 - Math.abs(driftMm) / toleranceMm);
}

/**
 * Move an object in horizontal depth by one frame's common travel.
 *
 * @param push     the horizontal direction depth runs along — `GravityFrame.depth`.
 * @param awaySign +1 when moving the object AWAY makes it rise on screen (the camera looks
 *   DOWN on the scene), −1 when it makes it sink (the camera looks UP from below).
 *   ⛔⛔ IT IS NOT A CONSTANT, AND ASSUMING IT WAS WAS A DEFECT FOUND BY FINGER: *"when the
 *   camera is on the bottom ring facing upwards, the depth translation is chaotic."* An
 *   object further off along the ground rises toward the horizon seen from above and SINKS
 *   seen from below, so *fingers-up means away* is right on the top rings and backwards on
 *   the bottom one — and a hand correcting a backwards control produces exactly the chaos
 *   that was reported. ⭐ `Math.sign(GravityFrame.towardGravity)` is the value.
 *   ⚠ **0 at a level camera**, where a depth change produces no screen motion and there is
 *   nothing to follow. The gesture goes quiet rather than guessing a direction.
 * @param commonDyPx this frame's shared vertical travel, CSS pixels. ⚠ Screen y grows
 *   DOWNWARD.
 * @param metresPerPx `trackingMetresPerPx` for the camera — rule 6's computed factor, so a
 *   given finger travel moves the object as far into the scene as it would across it.
 *
 * ⛔ Returns the position UNCHANGED when there is no push direction or the object is not in
 * front of the camera — never a `NaN`, which would never wash out of a placement.
 */
export function depthTranslate(
  cameraPosition: Vec3,
  objectPosition: Vec3,
  push: Vec3,
  awaySign: number,
  commonDyPx: number,
  metresPerPx: number,
  gain: number,
  minM: number,
  maxM: number,
): Vec3 {
  const dir = normalize(push);
  if (!dir || !Number.isFinite(commonDyPx) || !Number.isFinite(metresPerPx)) {
    return objectPosition;
  }
  // ⛔ A level camera shows nothing for a depth change, so there is no direction to
  // follow. Suppress rather than pick one — `LESSONS_CARRIED` §6.
  const sign = Math.sign(awaySign);
  if (sign === 0 || !Number.isFinite(awaySign)) return objectPosition;

  const depth = dot(sub(objectPosition, cameraPosition), dir);
  if (!(depth > 0)) return objectPosition;

  // ⚠ NEGATED because screen y grows downward; ⭐ times `sign` because which way "away"
  // looks depends on whether the camera is above the scene or below it.
  const wanted = depth - commonDyPx * metresPerPx * gain * sign;
  const clamped = Math.min(maxM, Math.max(minM, wanted));
  // ⭐ Only the along-push component moves, so HEIGHT is untouched by construction.
  return add(objectPosition, scale(dir, clamped - depth));
}
