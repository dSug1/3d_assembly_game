/**
 * GOLDEN VECTORS — screen-plane rotation (§2 rules 2bis / 2quinte).
 *
 * ⭐⭐ THESE ROTATE A MARKER AND CHECK WHERE IT LANDS. `METHOD`: *a composition is a
 * thing to measure, not an emergent property.* Asserting the quaternion's components
 * would test the arithmetic against itself; asserting where a face ENDS UP tests the
 * claim the user actually made with their finger.
 *
 * ⛔ Two defects reported from the device on 2026-09-13 are pinned here:
 *   1. both axes rotated the cube AGAINST the finger;
 *   2. yaw was world-frame while pitch was object-frame, so the cube tumbled.
 */
import { describe, expect, it } from "vitest";
import { IDENTITY, qRotate, qmul, qconj, qFromAxisAngle, type Vec3 } from "../src/core/vec";
import {
  screenPlaneRotation,
  screenRollRotation,
  type ScreenFrame,
} from "../src/input/screen_rotate";

/** A camera looking along +z, screen x right, screen y up in world terms. */
const FRAME: ScreenFrame = {
  right: [1, 0, 0],
  up: [0, 1, 0],
  viewAxis: [0, 0, 1], // ⚠ away from the viewer, into the screen
};

/** The point of the object facing the viewer. Where it goes is the whole assertion. */
const TOWARD_VIEWER: Vec3 = [0, 0, -1];
const TOWARD_TOP: Vec3 = [0, 1, 0];

const GAIN = 0.008;
/** Screen-space component of a rotated marker. */
const onScreen = (v: Vec3) => ({ right: v[0], up: v[1] });

describe("2bis — yaw and pitch follow the finger", () => {
  it("⭐ finger RIGHT sends the face toward the viewer to the RIGHT", () => {
    const q = screenPlaneRotation(IDENTITY, FRAME, 60, 0, GAIN);
    expect(onScreen(qRotate(q, TOWARD_VIEWER)).right).toBeGreaterThan(0);
  });

  it("⭐ finger LEFT sends it LEFT", () => {
    const q = screenPlaneRotation(IDENTITY, FRAME, -60, 0, GAIN);
    expect(onScreen(qRotate(q, TOWARD_VIEWER)).right).toBeLessThan(0);
  });

  it("⭐ finger UP sends it UP — dy is NEGATIVE upward, screen coordinates", () => {
    const q = screenPlaneRotation(IDENTITY, FRAME, 0, -60, GAIN);
    expect(onScreen(qRotate(q, TOWARD_VIEWER)).up).toBeGreaterThan(0);
  });

  it("⭐ finger DOWN sends it DOWN", () => {
    const q = screenPlaneRotation(IDENTITY, FRAME, 0, 60, GAIN);
    expect(onScreen(qRotate(q, TOWARD_VIEWER)).up).toBeLessThan(0);
  });

  it("a zero delta is the identity — a resting finger rotates nothing", () => {
    expect(screenPlaneRotation(IDENTITY, FRAME, 0, 0, GAIN)).toEqual(IDENTITY);
  });
});

describe("⛔⛔ the rotation is WORLD-frame, not the object's", () => {
  /**
   * ⚠ TWO EARLIER VERSIONS OF THIS BLOCK WERE WRONG, AND BOTH ARE WORTH KEEPING.
   *
   * The first asserted that a downward drag lowers the viewer-facing point by the
   * SAME amount whatever the accumulated yaw. False: a rotation about the screen-x
   * axis moves a point by an amount depending on its distance FROM that axis, so a
   * point sitting on it does not move at all. Correct geometry, wrong premise.
   *
   * The second built its counter-example by rotating about the object's TRANSFORMED
   * right axis. That is the identity `R(q·axis, θ) ⊗ q = q ⊗ R(axis, θ)` — it is the
   * SAME rotation, so the "defect" and the fix agreed exactly and the vector proved
   * nothing. `METHOD`: a test that cannot fail is not a test.
   *
   * ⭐ The invariant that actually says "world-frame" is this: THE DELTA APPLIED IS
   * INDEPENDENT OF THE POSE IT IS APPLIED TO. That is what left-multiplication
   * means, and it is what makes the screen axes stay the screen's.
   */
  const delta = (base: typeof IDENTITY, dxPx: number, dyPx: number) =>
    qmul(screenPlaneRotation(base, FRAME, dxPx, dyPx, GAIN), qconj(base));

  it("⭐ the SAME finger step applies the SAME world rotation, whatever the pose", () => {
    const poses = [
      IDENTITY,
      screenPlaneRotation(IDENTITY, FRAME, 200, 0, GAIN), // ~92° of yaw
      screenPlaneRotation(IDENTITY, FRAME, 0, 150, GAIN),
      screenPlaneRotation(IDENTITY, FRAME, 300, -220, GAIN),
    ];
    const reference = delta(poses[0]!, 30, -20);
    for (const pose of poses) {
      const d = delta(pose, 30, -20);
      for (let i = 0; i < 4; i++) expect(d[i]).toBeCloseTo(reference[i]!, 9);
    }
  });

  it("⛔ ...and OBJECT-frame composition fails that — the real counter-example", () => {
    // Right-multiplication is the object's own frame: `qmul(base, delta)`. It is a
    // genuinely different rotation, and it is what makes a cube tumble away from
    // the finger once it has been turned.
    const yawed = screenPlaneRotation(IDENTITY, FRAME, 200, 0, GAIN);
    const world = qRotate(screenPlaneRotation(yawed, FRAME, 0, -60, GAIN), TOWARD_VIEWER);
    const objectFrame = qmul(yawed, qFromAxisAngle(FRAME.right, 60 * GAIN));
    const local = qRotate(objectFrame, TOWARD_VIEWER);
    const apart = Math.hypot(world[0] - local[0], world[1] - local[1], world[2] - local[2]);
    expect(apart).toBeGreaterThan(0.1);
  });

  it("⭐ an upward drag raises the viewer-facing DIRECTION, at any accumulated yaw", () => {
    // The user-facing claim, stated the way the finger means it: whatever the cube
    // has already been turned to, dragging up tips the face you are looking at
    // upward. ⚠ It is about the viewer-facing DIRECTION, not about any one material
    // point — that confusion is what made the first version of this vector false.
    for (const yawPx of [0, 100, 200, 300, -250]) {
      const base = screenPlaneRotation(IDENTITY, FRAME, yawPx, 0, GAIN);
      const d = delta(base, 0, -40);
      expect(qRotate(d, TOWARD_VIEWER)[1]).toBeGreaterThan(0);
    }
  });
});

describe("2quinte — roll about the view axis", () => {
  it("⭐ a POSITIVE roll is CLOCKWISE on screen, matching roll.ts", () => {
    // The top of the object must travel to the RIGHT. ⛔ This is the one assertion
    // that ties `RollDetector`'s declared sign to what the user sees; if the two
    // files disagree, the cube rolls against the finger and no magnitude test
    // anywhere would catch it.
    const q = screenRollRotation(IDENTITY, FRAME, 30);
    expect(onScreen(qRotate(q, TOWARD_TOP)).right).toBeGreaterThan(0);
  });

  it("⭐ a NEGATIVE roll is COUNTER-CLOCKWISE", () => {
    const q = screenRollRotation(IDENTITY, FRAME, -30);
    expect(onScreen(qRotate(q, TOWARD_TOP)).right).toBeLessThan(0);
  });

  it("roll keeps the viewer-facing direction facing the viewer", () => {
    // It is a rotation about the view axis, so the face you are looking at must
    // still be the face you are looking at — only spun.
    const q = screenRollRotation(IDENTITY, FRAME, 45);
    expect(qRotate(q, TOWARD_VIEWER)[2]).toBeCloseTo(-1, 6);
  });
});
