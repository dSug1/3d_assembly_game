/**
 * §2 rule **2sexte**, and amendment **A3** (`D14`) — ROTATING AN ANCHORED OBJECT.
 *
 * Design of record: `Claude/10_INPUT_TOUCH/AMENDMENTS_R5.md` A3, over spec §2 2sexte.
 *
 * ⛔⛔ THE WHOLE POINT IS THAT THE ANCHOR SURVIVES. An object with one constraint has
 * exactly **one** rotational DOF left — the twist about the constraint's axis — and every
 * rotation this file produces is about THAT axis, never about the camera's. Rotating about
 * the view axis and hoping is how an anchor silently breaks, and
 * `tests/anchor_rotate.test.ts` carries that as a counter-example rather than as prose.
 *
 * ⭐⭐ TWO INPUTS DRIVE ONE DOF, AND WHICH ONE DEPENDS ON WHERE THE CAMERA IS.
 * Let **α** be the angle between the view axis and the constraint axis:
 *
 *   * **α ≈ 90°** — the axis lies across the screen. A drag is well-conditioned; a roll
 *     about the view axis would swing the anchored normal straight off its target.
 *   * **α ≈ 0°** — the camera looks ALONG the axis. Rolling about the view axis *is*
 *     twisting about the anchor, exactly. ⛔ And the DRAG is degenerate here: the axis
 *     projects to a POINT, so §2 2sexte's *"component perpendicular to the axis as
 *     projected on screen"* has no direction at all — every screen direction is equally
 *     perpendicular, and the rule would turn the object by an arbitrary amount.
 *
 * ⭐ So they are not rivals for one DOF; they are two charts over one circle, each
 * well-conditioned where the other fails. Revision 5 forbade roll on a constrained object
 * for a reason that is TRUE IN GENERAL and FALSE IN THE CASE THAT MATTERS, which is what
 * `D14` corrected.
 *
 * ⛔⛔ ONE CONSTANT GOVERNS THE HANDOVER, NOT TWO. Two independently chosen thresholds
 * give either a DEAD BAND where the DOF has no driver — a control that silently stops
 * working at some camera angles, which nobody can reproduce — or an OVERLAP where it has
 * two and the object turns twice as fast as either rule intends. `CONSTRAINTS` §4.
 *
 * ⭐⭐ A FINDING THAT FELL OUT OF THE VECTORS, AND IT BEARS ON WHERE THE HANDOVER SITS.
 * The near side's screen excursion per radian is `r·sin α`, so §2 2sexte's mapping — a
 * GAIN in radians per millimetre, not a tracking factor — turns the object at the same
 * rate whatever the camera is doing, while the motion that rate PRODUCES fades to nothing
 * as the axis swings toward the camera. ⛔ **So the drag does not fail suddenly at α = 0;
 * it goes quiet over a range before it.** The honest tracking mapping is `1/(r·sin α)`
 * radians per millimetre, which DIVERGES there — a much stronger statement of the
 * degeneracy than "the projection is a point".
 * ⚠ `anchorHandoverCos` must therefore hand over while the drag still produces VISIBLE
 * motion, not at the point where it becomes undefined. ⭐ That is a device question and it
 * is exactly the kind this project has lost three times to a guess.
 *
 * ⛔ ENGINE-FREE. It takes a screen frame of world vectors, never a camera.
 */
import { cross, dot, normalize, qFromAxisAngle, qmul, type Quat, type Vec3 } from "../core/vec";
import { pxToMm } from "../core/units";
import type { ScreenFrame } from "./screen_rotate";

// ⛔⛔ **`AnchorDriver`, `resolveAnchorDriver` AND `viewAxisAlignment` WERE DELETED HERE**
// (2026-09-17). ⭐ They implemented `A3`'s handover: ONE constant with hysteresis, latched at
// press, choosing between the drag chart and the roll chart for the single free DOF.
// ✅ `D34` retired the DECISION itself — `A12` had already moved roll to the SECOND
// touchpoint, so the two charts are two **CHANNELS**, both live, each reached by a different
// hand shape. Nothing chooses; there is no dead band to size and no constant to write.
// ⚠ *A handover between rules became a handover between fingers, and stopped being a
// decision* — and machinery kept for a decision that no longer exists is the shape that
// produced defect 40. It is deleted rather than parked.

/**
 * The screen direction the object's NEAR SIDE travels in when it rotates by a positive
 * angle about `axisWorld`. `null` when there is no such direction.
 *
 * ⭐⭐ THIS IS THE WHOLE MAPPING, AND IT CARRIES ITS OWN DEGENERACY TEST. A point on the
 * near side sits at roughly `−viewAxis` from the axis, and a positive rotation moves it
 * along `axis × (−viewAxis)`. ⛔ That cross product **vanishes exactly when the axis
 * points at the camera** — `|axis × viewAxis| = sin α` — so the case where 2sexte is
 * undefined and the case where this returns `null` are the same case, derived rather than
 * detected. `LESSONS_CARRIED` §6: suppress, do not substitute.
 */
export function nearSideScreenDirection(
  frame: ScreenFrame,
  axisWorld: Vec3,
): { x: number; y: number } | null {
  const a = normalize(axisWorld);
  const v = normalize(frame.viewAxis);
  if (!a || !v) return null;
  const world = cross(a, [-v[0], -v[1], -v[2]]);
  // ⚠ Screen y grows DOWNWARD while `frame.up` grows upward, so the y component is
  // negated — the same sign trap `translate.ts` calls the commonest defect in a drag.
  const sx = dot(world, frame.right);
  const sy = -dot(world, frame.up);
  const len = Math.hypot(sx, sy);
  if (!(len > 1e-9)) return null;
  return { x: sx / len, y: sy / len };
}

/**
 * §2 rule 2sexte — the angle to turn about the constraint axis, from a finger delta.
 *
 * ⭐ DECLARED SIGN, asserted by vectors against a marker rather than described: **the
 * object's NEAR SIDE follows the finger**. That is the same promise `screen_rotate.ts`
 * makes for free rotation, so a hand does not have to learn two different rules for what
 * a drag does.
 *
 * @param radPerMm `gainRotateConstrained`, radians per millimetre of finger travel.
 * @returns radians about `axisWorld`, or `null` where the mapping is degenerate.
 */
export function constrainedDragAngle(
  frame: ScreenFrame,
  axisWorld: Vec3,
  dxPx: number,
  dyPx: number,
  radPerMm: number,
): number | null {
  const dir = nearSideScreenDirection(frame, axisWorld);
  if (!dir) return null;
  // The component of the finger's travel along the direction the near side would go.
  const alongMm = pxToMm(dxPx) * dir.x + pxToMm(dyPx) * dir.y;
  return alongMm * radPerMm;
}

/**
 * Amendment A3 — the angle to turn about the constraint axis, from a screen ROLL.
 *
 * ⚠ `degClockwise` is `RollDetector.accumulatedDeg`, whose declared sign is positive for
 * CLOCKWISE on screen — the same channel 2quinte uses on an unconstrained object.
 *
 * ⛔ THE SIGN FLIPS WITH THE AXIS. When the constraint axis points AWAY from the viewer a
 * clockwise sweep is one way round it, and when it points back at the viewer it is the
 * other — but the object must follow the finger either way, or orbiting under the object
 * would silently reverse its controls. `sign(dot(axis, viewAxis))` is that flip, and it is
 * asserted in both directions.
 *
 * @returns radians about `axisWorld`, or `null` when the axis is square to the view and
 *   no roll can be honoured without breaking the anchor.
 */
export function constrainedRollAngle(
  frame: ScreenFrame,
  axisWorld: Vec3,
  degClockwise: number,
): number | null {
  const a = normalize(axisWorld);
  const v = normalize(frame.viewAxis);
  if (!a || !v) return null;
  const c = dot(a, v);
  if (c === 0) return null; // square to the view: no component to roll about
  // ⚠ `screen_rotate.screenRollRotation` turns by `−degClockwise` about the view axis.
  // Matching it keeps ONE definition of which way a circle turns an object.
  return ((-degClockwise * Math.PI) / 180) * Math.sign(c);
}

/**
 * Apply a rotation about a WORLD axis on top of `base`.
 *
 * ⭐ Left-multiplied, exactly as `screen_rotate.ts` does it: `qmul(b, a)` is "apply `a`,
 * then `b`", so the new turn happens in the WORLD frame and never nests inside the pose
 * the object already has. That nesting is the defect a device reported as *"the yaw is in
 * world coordinates while the pitch is in object coordinates"*.
 */
export function rotateAboutAxis(base: Quat, axisWorld: Vec3, radians: number): Quat {
  return qmul(qFromAxisAngle(axisWorld, radians), base);
}

