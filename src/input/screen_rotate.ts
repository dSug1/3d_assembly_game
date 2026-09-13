/**
 * SCREEN-PLANE ROTATION — mapping a finger delta onto a world rotation.
 *
 * §2 rule 2bis: *"the selected object rotates in yaw and pitch along the vertical and
 * horizontal axes of the SCREEN VIEW PLANE"*. §2 rule 2quinte: roll *"on the screen
 * view plane"*, i.e. about the view axis.
 *
 * ⛔⛔ BOTH ANGLES ARE WORLD-FRAME, AND THAT IS THE WHOLE POINT OF THIS FILE.
 * Device-reported on 2026-09-13: *"the yaw is in the world coordinates while the
 * pitch is in the object coordinates."* That is what Euler assignment does — setting
 * `rotation.x` and `rotation.y` applies them in a FIXED ORDER, so the second angle
 * acts inside the frame the first one just created. The object then tumbles in a way
 * no finger asked for, and it gets worse the further it is turned.
 *
 * ⭐ Here both rotations are built about WORLD axes (the camera's screen right/up,
 * resolved in world space) and LEFT-multiplied onto the base pose. `qmul(b, a)` is
 * "apply `a`, then `b`" — world-frame composition, by that function's own contract.
 *
 * ⭐⭐ AND THE COMPOSITE IS ASSERTED, NOT ASSUMED. `METHOD`: *a composition is a
 * thing to measure, not an emergent property* — the predecessor's rotation stack was
 * defensible at every layer and a reflection as a whole, because nobody ever
 * computed the whole chain in one expression. The vectors here rotate an actual
 * marker vector and check where it lands.
 *
 * ⛔ SIGNS, DECLARED AGAINST THE SCREEN (`tests/screen_rotate.test.ts` asserts each):
 *
 *     finger RIGHT  ⇒ the face toward the viewer travels RIGHT
 *     finger UP     ⇒ the face toward the viewer travels UP
 *     roll POSITIVE ⇒ CLOCKWISE on screen (matching `roll.ts`)
 *
 * ⚠ The caller resolves the three axes ONCE, at press. Storing them rather than
 * recomputing per frame is the same lesson as §1.4's `WORLD_AXIS_ALIGN`: rule 1's
 * camera orbit must not silently redefine the axes half-way through a gesture.
 */
import { qFromAxisAngle, qmul, type Quat, type Vec3 } from "../core/vec";

/**
 * The camera's screen axes, in WORLD space, latched at press.
 * ⚠ `viewAxis` points AWAY from the viewer, into the screen — a camera forward.
 */
export interface ScreenFrame {
  readonly right: Vec3;
  readonly up: Vec3;
  readonly viewAxis: Vec3;
}

/**
 * Yaw + pitch from a screen-space finger delta, in CSS pixels, applied on top of
 * `base`. `dyPx` is positive DOWNWARD, as screen coordinates are.
 *
 * ⚠ `radPerPx` is the caller's gain. `IN3` takes it from `gainRotateFree` in
 * millimetres; the render stub passes its own diagnostic constant. This function
 * holds no tunable of its own — one constant, one place.
 */
export function screenPlaneRotation(
  base: Quat,
  frame: ScreenFrame,
  dxPx: number,
  dyPx: number,
  radPerPx: number,
): Quat {
  // ⛔ NEGATED, both. Deduced from the device — the first build rotated the cube
  // AGAINST the finger on both axes — and pinned by vectors that rotate a marker
  // and check which way it actually went.
  const yaw = qFromAxisAngle(frame.up, -dxPx * radPerPx);
  const pitch = qFromAxisAngle(frame.right, -dyPx * radPerPx);
  // Apply base, then pitch, then yaw — every term about a WORLD axis.
  return qmul(yaw, qmul(pitch, base));
}

/**
 * Roll about the view axis (2quinte), applied on top of `base`.
 *
 * ⚠ `degClockwise` is `RollDetector.accumulatedDeg`, whose declared sign is positive
 * for CLOCKWISE on screen. The two files must agree on that or the object rolls
 * against the finger, and no magnitude test anywhere would notice.
 */
export function screenRollRotation(base: Quat, frame: ScreenFrame, degClockwise: number): Quat {
  const roll = qFromAxisAngle(frame.viewAxis, (-degClockwise * Math.PI) / 180);
  return qmul(roll, base);
}
