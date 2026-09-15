/**
 * AMENDMENT A5 (`D16`) — THE DEPTH PINCH.
 *
 * ⭐⭐ THE VECTOR THAT MATTERS MOST IS THE ONE THAT ANSWERS A QUESTION A5 LEFT OPEN:
 * does a depth pinch also slide the object across the screen? A5 declined to decide, and
 * the geometry decides it — scaling along the camera-to-object ray leaves the object on the
 * SAME RAY, so its screen position cannot change. That is asserted here, not assumed.
 */
import { describe, expect, it } from "vitest";
import { depthPinchLimits, depthPinchPosition, depthPinchTracker } from "../src/input/depth_pinch";
import { DEFAULT_CONFIG, CAMERA_NEAR_PLANE_M } from "../src/input/gestureConfig";
import { cross, length, sub, type Vec3 } from "../src/core/vec";
import { mmToPx } from "../src/core/units";
import type { Sample } from "../src/input/motion";

// ⚠⚠ THE FIXTURE MUST LEAVE HEADROOM UNDER THE CEILING, and my first one did not: the
// object sat 2.44 m from the camera against a `maxM` of 3 m, so a 1.25× push CLAMPED and
// the "scales exactly" vector failed. The code was right and the fixture was unrealistic —
// mistake shape 5, for the fourth time in this session. ⭐ State the range a law holds in.
const CAM: Vec3 = [0, 0.2, -1];
const OBJ: Vec3 = [0.1, 0, 0.05];
const { minM, maxM } = depthPinchLimits(DEFAULT_CONFIG);

const distance = (from: Vec3, to: Vec3) => length(sub(to, from));

describe("⭐⭐ the object stays on its own ray — the screen position cannot change", () => {
  it("the pinched position is COLLINEAR with the camera and the original position", () => {
    for (const factor of [0.4, 0.75, 1.5, 3]) {
      const moved = depthPinchPosition(CAM, OBJ, factor, minM, maxM);
      // Same ray ⇒ the cross product of the two camera-relative vectors vanishes.
      const before = sub(OBJ, CAM);
      const after = sub(moved, CAM);
      expect(length(cross(before, after)), `factor ${factor}`).toBeCloseTo(0, 9);
    }
  });

  it("⛔ and it stays on the FORWARD half of the ray — never behind the camera", () => {
    for (const factor of [0.001, 0.4, 3, 1000]) {
      const moved = depthPinchPosition(CAM, OBJ, factor, minM, maxM);
      const before = sub(OBJ, CAM);
      const after = sub(moved, CAM);
      expect(
        before[0] * after[0] + before[1] * after[1] + before[2] * after[2],
        `factor ${factor}`,
      ).toBeGreaterThan(0);
    }
  });
});

describe("the sense of the gesture", () => {
  it("⚠ a factor ABOVE 1 pushes the object away — fingers together make it smaller", () => {
    expect(distance(CAM, depthPinchPosition(CAM, OBJ, 2, minM, maxM))).toBeGreaterThan(
      distance(CAM, OBJ),
    );
  });

  it("a factor BELOW 1 brings it closer", () => {
    expect(distance(CAM, depthPinchPosition(CAM, OBJ, 0.5, minM, maxM))).toBeLessThan(
      distance(CAM, OBJ),
    );
  });

  it("⭐ a factor of exactly 1 changes nothing", () => {
    const moved = depthPinchPosition(CAM, OBJ, 1, minM, maxM);
    expect(distance(moved, OBJ)).toBeCloseTo(0, 12);
  });

  it("⭐⭐ scales the DISTANCE by the factor exactly — 1.0 is the computed value, not a taste", () => {
    for (const factor of [0.5, 1.25, 2]) {
      expect(distance(CAM, depthPinchPosition(CAM, OBJ, factor, minM, maxM))).toBeCloseTo(
        distance(CAM, OBJ) * factor,
        9,
      );
    }
  });

  it("⭐ pinch out and back RETURNS — the mapping is a ratio, not an accumulation", () => {
    const away = depthPinchPosition(CAM, OBJ, 1.7, minM, maxM);
    const back = depthPinchPosition(CAM, away, 1 / 1.7, minM, maxM);
    expect(distance(back, OBJ)).toBeCloseTo(0, 9);
  });
});

describe("⛔ the clamps, and why both bounds exist", () => {
  it("cannot be pushed through the near plane — the failure is a BLACK PAGE with no error", () => {
    const crushed = depthPinchPosition(CAM, OBJ, 1e-6, minM, maxM);
    expect(distance(CAM, crushed)).toBeGreaterThanOrEqual(CAMERA_NEAR_PLANE_M);
    expect(distance(CAM, crushed)).toBeCloseTo(minM, 9);
  });

  it("cannot be pushed beyond the camera's own maximum orbit radius — an unreachable state", () => {
    const flung = depthPinchPosition(CAM, OBJ, 1e6, minM, maxM);
    expect(distance(CAM, flung)).toBeCloseTo(maxM, 9);
    expect(maxM).toBe(DEFAULT_CONFIG.cameraRadiusMaxM);
  });

  it("⭐ both bounds are DERIVED, not invented — no new tunable to measure", () => {
    expect(minM).toBe(2 * CAMERA_NEAR_PLANE_M);
    expect(maxM).toBe(DEFAULT_CONFIG.cameraRadiusMaxM);
  });

  it("⚠⚠ THE HEADROOM IS TIGHT, and this vector exists to say so out loud", () => {
    // ⭐ A finding, not a property: an object already 2.4 m out cannot be pushed even 1.25×
    // before the ceiling stops it, because the ceiling IS the camera's maximum radius. So
    // how far a pinch can push depends on where the camera is, and at full zoom-out it can
    // barely push at all. ⛔ A DEVICE QUESTION — if it feels like the gesture "sticks",
    // this is why, and the fix is the ceiling, not the gain.
    const far: Vec3 = [0.3, 0.2, 0.4];
    const farCam: Vec3 = [0, 0.5, -2];
    const room = maxM / distance(farCam, far);
    expect(room).toBeLessThan(1.25);
    expect(distance(farCam, depthPinchPosition(farCam, far, 2, minM, maxM))).toBeCloseTo(maxM, 9);
  });
});

describe("⛔ degenerate inputs return the position unchanged, never NaN", () => {
  it("an object sitting ON the camera has no ray to scale along", () => {
    expect(depthPinchPosition(CAM, CAM, 2, minM, maxM)).toEqual(CAM);
  });

  it("a non-finite or non-positive factor is refused", () => {
    for (const bad of [0, -1, NaN, Infinity]) {
      expect(depthPinchPosition(CAM, OBJ, bad, minM, maxM), `factor ${bad}`).toEqual(OBJ);
    }
  });

  it("⛔ never writes a NaN into a coordinate — one would never wash out of a placement", () => {
    for (const factor of [0, NaN, Infinity, 1e300]) {
      for (const c of depthPinchPosition(CAM, OBJ, factor, minM, maxM)) {
        expect(Number.isFinite(c)).toBe(true);
      }
    }
  });
});

describe("the tracker is the SAME one rule 4 uses", () => {
  const at = (x: number, y: number, t: number): Sample => ({ x, y, t });

  it("⭐ it carries `gainPinchDepth`, not `gainZoom` — one class, two gains", () => {
    const tracker = depthPinchTracker({ ...DEFAULT_CONFIG, gainPinchDepth: 1 });
    tracker.begin(at(0, 0, 0), at(mmToPx(60), 0, 0));
    // Cross the deadband, which re-anchors and returns 1.
    expect(tracker.scale(at(0, 0, 10), at(mmToPx(80), 0, 10))).toBe(1);
    // Fingers now come together to half the separation ⇒ the object goes twice as far.
    const factor = tracker.scale(at(0, 0, 20), at(mmToPx(40), 0, 20))!;
    expect(factor).toBeCloseTo(2, 9);
  });

  it("⭐ a bigger gain moves it further for the same finger travel", () => {
    const factorAt = (gain: number) => {
      const tracker = depthPinchTracker({ ...DEFAULT_CONFIG, gainPinchDepth: gain });
      tracker.begin(at(0, 0, 0), at(mmToPx(60), 0, 0));
      tracker.scale(at(0, 0, 10), at(mmToPx(80), 0, 10));
      return tracker.scale(at(0, 0, 20), at(mmToPx(40), 0, 20))!;
    };
    expect(factorAt(2)).toBeGreaterThan(factorAt(1));
  });

  it("⛔ says nothing inside the deadband — a caller must leave the object alone", () => {
    const tracker = depthPinchTracker(DEFAULT_CONFIG);
    tracker.begin(at(0, 0, 0), at(mmToPx(60), 0, 0));
    expect(tracker.scale(at(0, 0, 10), at(mmToPx(60.2), 0, 10))).toBeNull();
  });
});
