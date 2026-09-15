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
 * ⛔ But the DISPLACEMENT applied must be this frame's, not the window's — re-applying an
 * overlapping window every frame would compound it, which is the same trap A5's ratio had.
 * ⭐ So the window GATES and the frame MOVES: two questions, two baselines, and neither
 * borrows the other's.
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
  /** Their shared vertical travel across the window, millimetres. ⚠ Screen y: DOWN is +. */
  readonly commonMm: number;
  /** How far apart the two travels were — the quantity the tolerance is on. */
  readonly spreadMm: number;
}

/**
 * Decides whether two touchpoints are travelling **together in y**.
 *
 * ⛔⛔ IT ONLY DECIDES. It reports the window's travel so a caller can see what it judged,
 * but the caller must move the object by THIS FRAME's delta — see the header.
 *
 * ⚠ One per gesture: it carries the window.
 */
export class CommonDragDetector {
  private readonly window: { t: number; a: number; b: number }[] = [];

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

  /** Feed both touchpoints' current y. `null` when this is not a common drag. */
  push(t: number, aYPx: number, bYPx: number): CommonDrag | null {
    this.window.push({ t, a: aYPx, b: bYPx });
    while (this.window.length > 1 && t - this.window[0]!.t > this.windowMs) this.window.shift();

    const first = this.window[0]!;
    // ⛔ A window of one sample has no baseline at all; saying nothing is the honest answer.
    if (this.window.length < 2) return null;

    const da = pxToMm(aYPx - first.a);
    const db = pxToMm(bYPx - first.b);

    // ⛔ BOTH must actually be moving. A still finger's "travel" is jitter, and pairing it
    // with a real one would read as common motion whenever the moving one happened to be
    // slow. This is what keeps rule 6 — whose anchor is deliberately still — out of A6.
    const floor = MIN_TRAVEL_NOISE_MULTIPLE * this.noiseMm;
    if (!(Math.abs(da) > floor) || !(Math.abs(db) > floor)) return null;

    const spreadMm = Math.abs(da - db);
    if (spreadMm > this.toleranceMm) return null;

    return { commonMm: (da + db) / 2, spreadMm };
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
 * Move an object in horizontal depth by one frame's common travel.
 *
 * @param commonDyPx this frame's shared vertical travel, CSS pixels. ⚠ Screen y grows
 *   DOWNWARD, and fingers moving UP push the object AWAY — an object further off along the
 *   ground sits higher on screen, so the gesture agrees with what the eye expects.
 * @param metresPerPx `trackingMetresPerPx` for the camera — rule 6's computed factor, so a
 *   given finger travel moves the object as far into the scene as it would across it.
 *
 * ⛔ Returns the position UNCHANGED when there is no push direction or the object is not in
 * front of the camera — never a `NaN`, which would never wash out of a placement.
 */
export function depthTranslate(
  cameraPosition: Vec3,
  objectPosition: Vec3,
  viewAxis: Vec3,
  gravityDown: Vec3,
  commonDyPx: number,
  metresPerPx: number,
  gain: number,
  minM: number,
  maxM: number,
): Vec3 {
  const push = depthPushDirection(viewAxis, gravityDown);
  if (!push || !Number.isFinite(commonDyPx) || !Number.isFinite(metresPerPx)) {
    return objectPosition;
  }
  const depth = dot(sub(objectPosition, cameraPosition), push);
  if (!(depth > 0)) return objectPosition;

  // ⚠ NEGATED: screen y grows downward, and up means away.
  const wanted = depth - commonDyPx * metresPerPx * gain;
  const clamped = Math.min(maxM, Math.max(minM, wanted));
  // ⭐ Only the along-push component moves, so HEIGHT is untouched by construction.
  return add(objectPosition, scale(push, clamped - depth));
}
