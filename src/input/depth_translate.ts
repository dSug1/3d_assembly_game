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
 * ⭐ So the quantity is now the part of the motion **both fingers agree on**:
 *
 * ```
 *   sharedMm = the signed travel the two have IN COMMON since the latch
 *            = 0 unless both have moved the same way
 *            = the SMALLER of the two travels when they have
 * ```
 *
 * ⭐⭐ Three properties fall out, and each answers a report:
 *
 * * a **still finger contributes nothing** — the smaller travel is zero, so the other
 *   finger moving alone moves the object not at all;
 * * it is **cumulative**, so nothing compounds and the caller applies only the CHANGE;
 * * **out and back returns exactly**, because the shared travel retraces itself — which is
 *   what stops a back-and-forth from drifting.
 *
 * ⚠ It follows the SLOWER finger when the two differ, which is conservative on purpose: a
 * gesture that means "both of us" should not move further than the more hesitant half.
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

/** What the detector reports when two fingers are travelling together. */
export interface CommonDrag {
  /**
   * ⭐⭐ THE SIGNED TRAVEL THE TWO FINGERS HAVE IN COMMON SINCE THE LATCH, millimetres.
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

  /** Feed both touchpoints' current y. `null` when this is not a common drag. */
  push(t: number, aYPx: number, bYPx: number): CommonDrag | null {
    this.window.push({ t, a: aYPx, b: bYPx });
    while (this.window.length > 1 && t - this.window[0]!.t > this.windowMs) this.window.shift();

    const first = this.window[0]!;
    // ⛔ A window of one sample has no baseline at all; saying nothing is the honest answer.
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
    if (!this.latched && (!(Math.abs(da) > floor) || !(Math.abs(db) > floor))) return null;

    const spreadMm = Math.abs(da - db);

    if (this.latched && this.latchOrigin) {
      // ⛔⛔ CUMULATIVE divergence: how far the two have drifted apart in TOTAL since the
      // latch closed. Rate-independent, so an idle finger exits after a fixed distance
      // however slowly the other moves, and a turnaround skew cancels itself.
      const sinceA = pxToMm(aYPx - this.latchOrigin.a);
      const sinceB = pxToMm(bYPx - this.latchOrigin.b);
      if (Math.abs(sinceA - sinceB) > this.toleranceMm) {
        this.latched = false;
        this.latchOrigin = null;
        return null;
      }
      return { sharedMm: shared(sinceA, sinceB), commonMm: (da + db) / 2, spreadMm };
    }

    // ⛔ ENTERING still asks the windowed question: are they moving together RIGHT NOW?
    if (spreadMm > this.toleranceMm) return null;

    this.latched = true;
    this.latchOrigin = { a: aYPx, b: bYPx };
    // ⭐ Zero by construction at the latch: nothing shared has happened yet.
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
 * ⭐⭐ THE PART OF TWO TRAVELS THAT IS COMMON TO BOTH.
 *
 * Zero unless they went the same way; otherwise the SMALLER of the two, carrying that
 * shared sign. ⛔ This is what makes a still finger contribute nothing — its travel is
 * zero, so the shared part is zero however far the other one goes.
 */
export function shared(aMm: number, bMm: number): number {
  if (aMm > 0 && bMm > 0) return Math.min(aMm, bMm);
  if (aMm < 0 && bMm < 0) return Math.max(aMm, bMm);
  return 0;
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
