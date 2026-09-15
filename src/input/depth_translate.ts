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
 * ⛔ And the DISPLACEMENT is the DRIVER's own delta — the finger touching the object —
 * applied per frame. The validator contributes none of it.
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
 * ⭐⭐ DRIVER AND VALIDATOR — what the detector knows so far.
 *
 * ⛔⛔ THE OBJECT FOLLOWS **ONE** FINGER: the one touching it. The second finger does not
 * contribute motion at all — it **authorises** the depth reading by following the first
 * within a percentage ratio. ⚠ That is the owner's design, and it replaced three attempts
 * of mine that all tried to COMBINE the two fingers' travel (a mean, then a minimum, then a
 * faded mean). Every one of them was felt on the glass within minutes, because a blend has
 * seams and a hand feels seams.
 *
 * ⭐ It also disposes of an earlier report for free: *"the finger outside can move the
 * object even if the finger on the object is still."* A validator moves nothing, ever.
 *
 * ## ⛔⛔ A RATIO IS UNDEFINED IN EXACTLY TWO PLACES, AND BOTH ARE REAL
 *
 * The owner named them:
 *
 * * **at a reversal** — *"both delta position y converge to zero before changing sign
 *   (maybe one before the other)"*. A ratio of two numbers passing through zero is noise,
 *   and deciding on it is what leaked vertical translation at every turnaround;
 * * **at the start** — *"if the second finger is slightly lagging its start, it can be
 *   confused with a gravity axis translation"*. The driver is moving and the validator has
 *   not begun, so the ratio reads zero for a reason that is not disagreement.
 *
 * ⭐⭐ SO THOSE ARE **HOLD** WINDOWS, NOT DECISION POINTS. When the driver's travel is too
 * small for a ratio to mean anything, the detector keeps whatever it last concluded. It
 * does not re-decide on noise, and it does not decide at all until it has something to
 * decide with.
 */
export type CommonDragVerdict = "PENDING" | "COMMON" | "SEPARATE";

/** What the detector reports while a depth drag is in force. */
export interface CommonDrag {
  /** The driver's travel across the window, millimetres. ⚠ Screen y: DOWN is positive. */
  readonly driverMm: number;
  /** The validator's travel across the same window. */
  readonly followerMm: number;
  /** `followerMm / driverMm` — 1 is perfect following. ⚠ `null` while undefined. */
  readonly ratio: number | null;
}

/**
 * Classifies a two-finger vertical gesture as a depth drag or not.
 *
 * ⛔⛔ IT ONLY CLASSIFIES. The caller moves the object by the DRIVER's own delta — see the
 * header. A detector that also produced the displacement is how the last three versions
 * ended up blending two fingers together.
 *
 * ⚠ One per gesture.
 */
export class CommonDragDetector {
  private readonly window: { t: number; driver: number; follower: number }[] = [];
  private state: CommonDragVerdict = "PENDING";
  /** How long the driver and validator have disagreed, milliseconds. */
  private disagreeingSinceMs: number | null = null;

  /**
   * @param windowMs    the baseline both travels are measured over. ⛔ Not per frame:
   *   mistake shape 1 on this project is a rate over the shortest available baseline.
   * @param followRatio how far from 1 the validator's ratio may sit and still count as
   *   following — 0.35 means "within ±35%".
   * @param noiseMm     the MEASURED pointer noise. ⭐ It decides when the driver has moved
   *   enough for a ratio to mean anything at all.
   */
  constructor(
    private readonly windowMs: number,
    private readonly followRatio: number,
    private readonly noiseMm: number,
  ) {}

  get verdict(): CommonDragVerdict {
    return this.state;
  }

  /**
   * Feed the driver's and the validator's current y, in CSS pixels.
   *
   * @returns the reading when the gesture is a depth drag, else `null`. ⚠ `null` covers
   *   both PENDING and SEPARATE; read `verdict` to tell them apart, because the caller must
   *   WITHHOLD the vertical while pending and hand it to rule 6 when separate.
   */
  push(t: number, driverYPx: number, followerYPx: number): CommonDrag | null {
    this.window.push({ t, driver: driverYPx, follower: followerYPx });
    while (this.window.length > 1 && t - this.window[0]!.t > this.windowMs) this.window.shift();

    const first = this.window[0]!;
    if (this.window.length < 2) return this.reading(0, 0, null);

    const driverMm = pxToMm(driverYPx - first.driver);
    const followerMm = pxToMm(followerYPx - first.follower);

    // ⛔⛔ THE HOLD WINDOW. Below this the driver has not moved enough for a ratio to carry
    // information — which is the case at a REVERSAL, where both travels pass through zero,
    // and at the START, before either finger has committed. ⭐ Keep the last conclusion
    // rather than re-deciding on noise: that is what stopped the turnaround leak.
    if (Math.abs(driverMm) <= MIN_TRAVEL_NOISE_MULTIPLE * this.noiseMm) {
      return this.reading(driverMm, followerMm, null);
    }

    const ratio = followerMm / driverMm;
    const following = Math.abs(ratio - 1) <= this.followRatio;

    if (following) {
      this.state = "COMMON";
      this.disagreeingSinceMs = null;
      return this.reading(driverMm, followerMm, ratio);
    }

    // ⛔ DISAGREEMENT MUST PERSIST BEFORE IT COUNTS. The owner's second ambiguity is a
    // validator that starts LATE: for a moment it reads as no following at all, and that is
    // a lag rather than a different gesture. ⚠ Deciding on the first disagreeing window is
    // what made a lagging second finger look like a gravity translation.
    this.disagreeingSinceMs ??= t;
    if (t - this.disagreeingSinceMs >= this.windowMs * DECISION_WINDOWS) {
      this.state = "SEPARATE";
    }
    return this.state === "COMMON" ? this.reading(driverMm, followerMm, ratio) : null;
  }

  private reading(driverMm: number, followerMm: number, ratio: number | null): CommonDrag | null {
    return this.state === "COMMON" ? { driverMm, followerMm, ratio } : null;
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
