/**
 * ⭐⭐⭐ **AXIS TRANSLATION — the delta position projected onto the object axes.**
 *
 * > *"for all these three delta position inputs, the delta position inputs (dx and dy from
 * > first touch, ddepth from second touch) are projected onto the object axis and the object
 * > is translated along these axis according to these projected values (same as what Blender
 * > does for translation of an object)."* — the owner, 2026-09-22
 *
 * ## ⭐⭐ THE PROJECTION IS ONTO THE AXIS'S **SCREEN SHADOW**
 *
 * An axis is a world direction; a delta position is two numbers on the glass. The thing they
 * can be compared in is the screen, so each channel asks **how much of that axis runs along
 * the direction this finger pushed**:
 *
 * ```
 *   travel along axis = (finger travel, px) · (axis projected on screen) × metresPerPx × gain
 * ```
 *
 * ⛔⛔ **AND IT IS NOT NORMALISED — THE OWNER'S CHOICE, 2026-09-22.** Blender divides by the
 * axis's on-screen length so the object keeps up with the mouse *along that axis*, which is
 * exact right up to the moment the axis turns to face the camera and then divides by zero.
 * ⭐ Leaving the division out makes a foreshortened axis go QUIET instead of running away:
 * full rate square to the view, 71% at 45°, **0 pointing at the camera**. ⚠ It costs exact
 * tracking on a foreshortened axis and it buys no new threshold — and *a guessed number has
 * been wrong every single time on this project*, so the cutoff that Blender's form would need
 * is a number this rule now never has to have.
 *
 * ⭐ It is the sixth appearance of **goes quiet before it fails** (A3's handover, A6's depth,
 * A7's vertical and roll, `towardGravity` at a level camera). ⚠ Expect it, say it on the HUD,
 * and do not read it as a defect the first time a hand meets it.
 *
 * ## ⭐⭐⭐ THE SIGNS FALL OUT — INCLUDING THE ONE THAT WAS A DEFECT FOUND BY FINGER
 *
 * ⛔ `depthTranslate` needs `awaySign = sign(towardGravity)` because *fingers-up means away*
 * is true looking DOWN on the scene and **backwards from the bottom ring**, and assuming it
 * was a constant produced *"the depth translation is chaotic"*. ⭐⭐ Here that sign is not
 * assumed and not passed in: `dot(depthAxis, cameraUp)` is positive looking down, negative
 * looking up, and **zero at a level camera** — the same three answers, arrived at by the
 * projection rather than by a rule about it. ⚠ One less quantity to get wrong, and the
 * degenerate case is the quiet one rather than a wrong direction.
 *
 * ## ⛔ IT TAKES THE **TRUE** CAMERA AXES, NOT THE GRAVITY FRAME
 *
 * The question is *what does this axis look like on the glass*, and the glass is the camera's
 * own right and up — `ScreenFrame`, not `A7`'s flattened basis. ⚠ Handing it the gravity
 * frame would make `dot(depthAxis, up)` identically zero and the depth channel dead at every
 * camera angle: the two frames answer different questions, which is why they are two types.
 *
 * ⛔ ENGINE-FREE.
 */
import { add, dot, normalize, scale, sub, type Vec3 } from "../core/vec";
import type { ObjectAxes } from "./object_axes";

/** The camera's own axes — `ScreenFrame`'s `right` and `up`. ⚠ Never the gravity frame. */
export interface CameraScreenAxes {
  readonly right: Vec3;
  readonly up: Vec3;
}

/** One frame's finger travel, CSS pixels. ⭐ **Deadbanded** travel (`A11`), never a raw delta. */
export interface AxisInputsPx {
  /** The holder's horizontal travel → the object's **x** axis. */
  readonly holderDxPx: number;
  /** The holder's vertical travel → the object's **depth** axis. ⚠ Screen y grows DOWNWARD. */
  readonly holderDyPx: number;
  /** The second touchpoint's vertical travel → the object's **gravity** axis. */
  readonly secondDyPx: number;
}

/** Metres along each object axis this frame. ⭐ Reported per axis so the HUD prints what the
 * rule computed rather than a recomputation of it, and so a vector can pin one channel. */
export interface AxisTravelM {
  readonly xM: number;
  readonly gravityM: number;
  readonly depthM: number;
}

/**
 * The three channels, each projected onto its own axis.
 *
 * @param metresPerPx `trackingMetresPerPx` for this camera — rule 6's computed factor, so a
 *   given finger travel moves the body as far along any axis as it would across the screen.
 * @param holderGain `gainTranslateScreen` — the holder's two channels. ⭐ Unchanged from rule
 *   6, so the feel a hand already accepted is the feel this inherits for `dx`.
 * @param secondGain `gainTranslateDepth` — the second touchpoint's channel. ⚠ It has kept its
 *   name and its number while its AXIS moved from depth to gravity: it is *the second finger's
 *   translate gain*, and renaming a tuned number is how a device session loses its baseline.
 */
export function axisTravel(
  input: AxisInputsPx,
  camera: CameraScreenAxes,
  axes: ObjectAxes,
  metresPerPx: number,
  holderGain: number,
  secondGain: number,
): AxisTravelM {
  const right = normalize(camera.right);
  const up = normalize(camera.up);
  // ⛔ A camera with no basis moves nothing, rather than moving by NaN. One NaN written into a
  // placement is permanent — it never washes out of a position.
  if (!right || !up || !Number.isFinite(metresPerPx)) {
    return { xM: 0, gravityM: 0, depthM: 0 };
  }
  const finite = (n: number): number => (Number.isFinite(n) ? n : 0);
  return {
    // ⭐ `+dx` is rightwards on the glass and the axis's shadow carries the sign.
    xM: finite(input.holderDxPx) * dot(axes.x, right) * metresPerPx * holderGain,
    // ⛔ NEGATED, both of them: screen y grows downwards and the camera's up grows upwards.
    // ⚠ A missing sign here reads as *"the controls are inverted"* rather than as a bug, and
    // it is the single most common defect in a drag.
    depthM: -finite(input.holderDyPx) * dot(axes.depth, up) * metresPerPx * holderGain,
    gravityM: -finite(input.secondDyPx) * dot(axes.gravity, up) * metresPerPx * secondGain,
  };
}

/**
 * The three travels composed into one world displacement.
 *
 * ⭐⭐ **ONE EXPRESSION, AND THAT IS DELIBERATE.** `METHOD`: *a composition is a thing to
 * MEASURE, not an emergent property* — the predecessor's rotation stack was defensible at
 * every layer and a reflection as a whole. ⚠ Separating *what each channel asked for* from
 * *where the body ends up* is what lets a vector check the composite directly, which is the
 * check that was missing when `A7` was wrongly accused.
 */
export function axisDisplacement(travel: AxisTravelM, axes: ObjectAxes): Vec3 {
  return [
    axes.x[0] * travel.xM + axes.gravity[0] * travel.gravityM + axes.depth[0] * travel.depthM,
    axes.x[1] * travel.xM + axes.gravity[1] * travel.gravityM + axes.depth[1] * travel.depthM,
    axes.x[2] * travel.xM + axes.gravity[2] * travel.gravityM + axes.depth[2] * travel.depthM,
  ];
}

/**
 * ⭐ Keep a body inside the depth range a gesture may drive it to — `A5`'s bounds, unchanged.
 *
 * ⛔⛔ **IT IS CARRIED OVER DELIBERATELY, BECAUSE THE CHANNEL MOVED AND THE HAZARD DID NOT.**
 * `depthTranslate` clamped the along-push distance so an object could not be driven through
 * the near plane (*a black page with no error at all*) or past the camera's maximum orbit
 * radius, where it cannot be brought back. ⚠ The holder's `dy` now drives depth, so the same
 * clamp belongs on the same quantity, or a bound that was derived would be lost in a remap.
 *
 * @param pushDir the horizontal depth direction the range is measured along — `A7`'s
 *   `GravityFrame.depth`, which is what the limits were derived against.
 *
 * ⭐ Returns the position unchanged when it is already inside the range, when there is no
 * push direction, or when the body is behind the camera — never a `NaN`.
 */
export function clampDepthRange(
  cameraPosition: Vec3,
  position: Vec3,
  pushDir: Vec3,
  minM: number,
  maxM: number,
): Vec3 {
  const dir = normalize(pushDir);
  if (!dir) return position;
  const depth = dot(sub(position, cameraPosition), dir);
  if (!Number.isFinite(depth) || !(depth > 0)) return position;
  const clamped = Math.min(maxM, Math.max(minM, depth));
  if (clamped === depth) return position;
  // ⭐ Only the along-push component moves, so the other two axes' travel survives the clamp
  // intact — a body pressed against the ceiling still slides sideways.
  return add(position, scale(dir, clamped - depth));
}
