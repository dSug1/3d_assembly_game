/**
 * ⭐⭐ AMENDMENT A7, END TO END — does a drag actually turn the object about the WORLD
 * axes, at a tilted camera?
 *
 * ⛔⛔ THIS FILE EXISTS BECAUSE A DEVICE SAID IT DOES NOT: *"you destroyed the rotation
 * around the gravity axis and orthogonal to gravity: the rotation came back to the axis of
 * the screen view plane."* Every part of A7 was vectored in isolation — the frame is
 * orthonormal, `up` is the world vertical — and the wiring compiled. ⚠ None of that is the
 * same claim as *"a horizontal drag yaws about gravity"*, which is what a hand judges.
 *
 * ⭐ `METHOD`: a composition is a thing to measure, not an emergent property. These vectors
 * compose the frame with the rotation and assert the axis that comes out the far end.
 */
import { describe, expect, it } from "vitest";
import { gravityFrame } from "../src/input/gravity_frame";
import { screenPlaneRotation, screenRollRotation } from "../src/input/screen_rotate";
import { IDENTITY, dot, normalize, qRotate, type Quat, type Vec3 } from "../src/core/vec";

const DOWN: Vec3 = [0, -1, 0];
const UP: Vec3 = [0, 1, 0];

/** The axis a rotation turns about, as a unit vector. */
function axisOf(q: Quat): Vec3 {
  return normalize([q[1], q[2], q[3]]) ?? [0, 0, 0];
}

/** The camera's own basis, the way the scene builds it — what A7 replaced. */
function cameraUp(forward: Vec3): Vec3 {
  const right = normalize([
    UP[1] * forward[2] - UP[2] * forward[1],
    UP[2] * forward[0] - UP[0] * forward[2],
    UP[0] * forward[1] - UP[1] * forward[0],
  ])!;
  return [
    forward[1] * right[2] - forward[2] * right[1],
    forward[2] * right[0] - forward[0] * right[2],
    forward[0] * right[1] - forward[1] * right[0],
  ];
}

const TILTS: { name: string; forward: Vec3 }[] = [
  { name: "level", forward: normalize([0, 0, 1])! },
  { name: "down 45°", forward: normalize([0, -1, 1])! },
  { name: "down 72°", forward: normalize([0, -0.95, 0.31])! },
  { name: "up 45° (bottom ring)", forward: normalize([0, 1, 1])! },
];

describe("⭐⭐ a HORIZONTAL drag yaws about GRAVITY, at every tilt", () => {
  for (const { name, forward } of TILTS) {
    it(`${name}`, () => {
      const frame = gravityFrame(forward, DOWN)!;
      const q = screenPlaneRotation(IDENTITY, frame, 100, 0, 0.001);
      const axis = axisOf(q);
      // ⭐ The axis is the world vertical (up to sign), not the camera's up.
      expect(Math.abs(dot(axis, UP))).toBeCloseTo(1, 9);
    });
  }

  /**
   * ⭐⭐⭐ **AND THE SIGN, WHICH EVERY VECTOR ABOVE DELIBERATELY DOES NOT TEST.**
   *
   * ⛔⛔ `Math.abs(dot(axis, UP))` asserts the axis IS the vertical **up to sign** — so all of
   * them would still pass if a horizontal drag yawed the object BACKWARDS at some camera
   * positions and not others. ⚠ That is *a sign is not tested by any amount of testing the
   * magnitude*, sitting inside the very file written to measure this composition.
   *
   * ⭐⭐ **ADDED 2026-09-22, AFTER A DEVICE REPORT**: *"there are some cases where the dx delta
   * position and the yaw rotation direction are inverted."* ⛔ This sweep answers it for the
   * FREE yaw, and the answer is **no**: 400+ camera positions, none inverted. ⭐ Which is what
   * made the report's real subject findable — the CONSTRAINED twist on an aligned body, whose
   * near-side mapping reversed with the alignment axis. *"Same symptom" never means "same
   * cause"*, and the way to tell them apart was to measure both.
   */
  it("⭐⭐⭐ a rightward drag yaws the NEAR FACE rightward — at every camera on the sphere", () => {
    let checked = 0;
    const inverted: string[] = [];
    for (let az = 0; az < 360; az += 15) {
      for (let el = -80; el <= 80; el += 10) {
        const a = (az * Math.PI) / 180;
        const e = (el * Math.PI) / 180;
        const fwd = normalize([
          Math.sin(a) * Math.cos(e),
          Math.sin(e),
          Math.cos(a) * Math.cos(e),
        ]);
        if (!fwd) continue;
        const frame = gravityFrame(fwd, DOWN);
        if (!frame) continue;
        // ⚠ The CAMERA's own right, built the way Babylon builds it — NOT the gravity frame's,
        // or the vector would be checking the rule against itself (`METHOD` §2).
        const camRight = normalize([
          UP[1] * fwd[2] - UP[2] * fwd[1],
          UP[2] * fwd[0] - UP[0] * fwd[2],
          UP[0] * fwd[1] - UP[1] * fwd[0],
        ]);
        if (!camRight) continue;
        const q = screenPlaneRotation(IDENTITY, frame, +100, 0, 0.0005);
        // A probe on the side of the body FACING the camera — what a hand actually watches.
        const near: Vec3 = [-fwd[0], -fwd[1], -fwd[2]];
        const moved = qRotate(q, near);
        const drift = dot(
          [moved[0] - near[0], moved[1] - near[1], moved[2] - near[2]],
          camRight,
        );
        checked++;
        if (drift <= 0) inverted.push(`az=${az} el=${el} drift=${drift.toFixed(6)}`);
      }
    }
    // ⚠ The COUNT is asserted too: a sweep that silently checked nothing would pass.
    expect(checked).toBeGreaterThan(300);
    expect(inverted).toEqual([]);
  });

  it("⛔⛔ COUNTER-EXAMPLE: the CAMERA's up is NOT the vertical once it tilts", () => {
    // ⚠ The thing A7 changed, stated as a number so "it came back to the screen axes" is a
    // checkable claim rather than an impression.
    expect(Math.abs(dot(cameraUp(TILTS[0]!.forward), UP))).toBeCloseTo(1, 9); // level: same
    expect(Math.abs(dot(cameraUp(TILTS[2]!.forward), UP))).toBeLessThan(0.4); // steep: not
  });
});

describe("⭐ a VERTICAL drag pitches about the horizontal screen axis", () => {
  for (const { name, forward } of TILTS) {
    it(`${name} — the pitch axis is horizontal`, () => {
      const frame = gravityFrame(forward, DOWN)!;
      const q = screenPlaneRotation(IDENTITY, frame, 0, 100, 0.001);
      expect(dot(axisOf(q), UP)).toBeCloseTo(0, 9);
    });
  }
});

describe("⭐⭐ a ROLL turns about the HORIZONTAL depth axis, never the view axis", () => {
  for (const { name, forward } of TILTS) {
    it(`${name} — the roll axis is horizontal`, () => {
      const frame = gravityFrame(forward, DOWN)!;
      const q = screenRollRotation(IDENTITY, frame, 30);
      expect(dot(axisOf(q), UP)).toBeCloseTo(0, 9);
    });
  }

  it("⛔⛔ COUNTER-EXAMPLE: the VIEW axis is nearly vertical at the top ring", () => {
    // ⭐ Which is the whole argument for A7: rolling about it there is barely
    // distinguishable from yawing, so the two gestures stop being independent.
    expect(Math.abs(dot(TILTS[2]!.forward, UP))).toBeGreaterThan(0.9);
    const frame = gravityFrame(TILTS[2]!.forward, DOWN)!;
    expect(Math.abs(dot(axisOf(screenRollRotation(IDENTITY, frame, 30)), UP))).toBeCloseTo(0, 9);
  });
});
