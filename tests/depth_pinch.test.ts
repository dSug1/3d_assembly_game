/**
 * AMENDMENT A5 (`D16`) — THE DEPTH PINCH.
 *
 * ⭐⭐ THE VECTOR THAT MATTERS MOST IS **HEIGHT NEVER CHANGES**. A5's "depth" is horizontal
 * — the camera's view direction with its gravity component removed — and the reason is not
 * only the visual feedback the owner asked for: **gravity is the primary constraint in this
 * game**, so a gesture meaning *"put this further away"* must not quietly drive a part into
 * the floor, which pushing along a tilted camera's ray does.
 *
 * ⛔ The first build DID push along the camera ray, and the counter-example below is that
 * build: it is asserted to move the object's height, which is what disqualified it.
 */
import { describe, expect, it } from "vitest";
import {
  depthPinchLimits,
  depthPinchPosition,
  depthPinchTracker,
  depthPushDirection,
} from "../src/input/depth_pinch";
import { DEFAULT_CONFIG, CAMERA_NEAR_PLANE_M } from "../src/input/gestureConfig";
import { add, dot, length, normalize, scale, sub, type Vec3 } from "../src/core/vec";
import { mmToPx } from "../src/core/units";
import type { Sample } from "../src/input/motion";

const DOWN: Vec3 = [0, -1, 0];
/** A camera above the scene looking down and forward — the ordinary way to view a build. */
const CAM: Vec3 = [0, 0.8, -1.2];
const VIEW: Vec3 = normalize([0, -0.5, 1])!; // into the screen, tilted down
const OBJ: Vec3 = [0.15, 0.1, 0.1];
const { minM, maxM } = depthPinchLimits(DEFAULT_CONFIG);

const height = (p: Vec3) => p[1];
const pinch = (factor: number, obj: Vec3 = OBJ, view: Vec3 = VIEW) =>
  depthPinchPosition(CAM, obj, view, DOWN, factor, minM, maxM);

describe("⭐⭐ HEIGHT NEVER CHANGES — gravity is the primary constraint", () => {
  it("pushing away leaves the object at exactly the same height", () => {
    for (const factor of [0.4, 0.8, 1.5, 3]) {
      expect(height(pinch(factor)), `factor ${factor}`).toBeCloseTo(height(OBJ), 12);
    }
  });

  it("…at every camera elevation, including a steep look-down", () => {
    for (const tilt of [0.1, 0.5, 1.5, 4]) {
      const view = normalize([0, -tilt, 1])!;
      expect(height(pinch(2, OBJ, view)), `tilt ${tilt}`).toBeCloseTo(height(OBJ), 12);
    }
  });

  it("⛔⛔ COUNTER-EXAMPLE: the first build pushed along the CAMERA RAY, and moved the height", () => {
    // What A5 originally shipped: scale the whole camera-to-object vector.
    const ray = sub(OBJ, CAM);
    const alongRay = add(CAM, scale(normalize(ray)!, length(ray) * 2));
    // ⭐ It drives the part downward — into the floor — because the camera looks down.
    expect(height(alongRay)).toBeLessThan(height(OBJ) - 0.1);
    // The rule as decided does not.
    expect(height(pinch(2))).toBeCloseTo(height(OBJ), 12);
  });
});

describe("the push direction is the view axis, flattened", () => {
  it("is perpendicular to gravity, always", () => {
    for (const tilt of [0, 0.3, 1, 5]) {
      const d = depthPushDirection(normalize([0.2, -tilt, 1])!, DOWN)!;
      expect(dot(d, DOWN), `tilt ${tilt}`).toBeCloseTo(0, 12);
      expect(length(d)).toBeCloseTo(1, 12);
    }
  });

  it("keeps the view's heading — it flattens, it does not turn", () => {
    const d = depthPushDirection(normalize([1, -1, 1])!, DOWN)!;
    expect(d[0] / d[2]).toBeCloseTo(1, 12);
  });

  it("⛔ is null when the camera looks STRAIGHT DOWN — a real configuration, not a corner", () => {
    expect(depthPushDirection([0, -1, 0], DOWN)).toBeNull();
    expect(pinch(2, OBJ, [0, -1, 0])).toEqual(OBJ);
  });

  it("⚠ and it GOES QUIET as the camera moves OVERHEAD — the same shape as A3's handover", () => {
    // ⚠⚠ My first version of this varied the view ANGLE with the camera fixed, and the
    // travel did not change at all — because flattening [0,−tilt,1] gives [0,0,1] for
    // EVERY tilt. The heading does not turn; that is the property asserted just above.
    // ⭐ The effect is real but it comes from the camera's POSITION: climbing the orbit
    // surface shortens the HORIZONTAL distance to the object, and that is what scales.
    const travelFrom = (cam: Vec3) => {
      const view = normalize(sub(OBJ, cam))!;
      return length(sub(depthPinchPosition(cam, OBJ, view, DOWN, 1.5, minM, maxM), OBJ));
    };
    const low: Vec3 = [0, 0.3, -1.5];
    const high: Vec3 = [0, 1.4, -0.25]; // near the top ring: almost overhead
    expect(travelFrom(high)).toBeLessThan(travelFrom(low));
  });
});

describe("only the horizontal DEPTH scales", () => {
  const push = depthPushDirection(VIEW, DOWN)!;
  const depthOf = (p: Vec3) => dot(sub(p, CAM), push);
  /** The offset across the view, in the ground plane. */
  const acrossOf = (p: Vec3) => {
    const r = sub(p, CAM);
    return sub(sub(r, scale(push, dot(r, push))), scale(DOWN, dot(r, DOWN)));
  };

  it("⭐⭐ scales the depth by the factor exactly — 1.0 is computed, not a taste", () => {
    for (const factor of [0.5, 1.25, 2]) {
      expect(depthOf(pinch(factor)), `factor ${factor}`).toBeCloseTo(depthOf(OBJ) * factor, 9);
    }
  });

  it("leaves the ACROSS-view offset untouched", () => {
    const before = acrossOf(OBJ);
    const after = acrossOf(pinch(2.5));
    expect(length(sub(after, before))).toBeCloseTo(0, 12);
  });

  it("⭐ a factor of exactly 1 changes nothing", () => {
    expect(length(sub(pinch(1), OBJ))).toBeCloseTo(0, 12);
  });

  it("⭐ pinch out and back RETURNS — a ratio, not an accumulation", () => {
    const away = pinch(1.7);
    const back = depthPinchPosition(CAM, away, VIEW, DOWN, 1 / 1.7, minM, maxM);
    expect(length(sub(back, OBJ))).toBeCloseTo(0, 9);
  });

  it("⚠ a factor ABOVE 1 pushes away, below 1 brings closer", () => {
    expect(depthOf(pinch(2))).toBeGreaterThan(depthOf(OBJ));
    expect(depthOf(pinch(0.5))).toBeLessThan(depthOf(OBJ));
  });
});

describe("⛔ the clamps, and why both bounds exist", () => {
  const push = depthPushDirection(VIEW, DOWN)!;
  const depthOf = (p: Vec3) => dot(sub(p, CAM), push);

  it("cannot be pulled onto the camera — the failure is a BLACK PAGE with no error", () => {
    expect(depthOf(pinch(1e-6))).toBeCloseTo(minM, 9);
    expect(minM).toBeGreaterThan(CAMERA_NEAR_PLANE_M);
  });

  it("cannot be pushed beyond the camera's own maximum orbit radius — an unreachable state", () => {
    expect(depthOf(pinch(1e6))).toBeCloseTo(maxM, 9);
  });

  it("⭐ both bounds are DERIVED, not invented — no new tunable to measure", () => {
    expect(minM).toBe(2 * CAMERA_NEAR_PLANE_M);
    expect(maxM).toBe(DEFAULT_CONFIG.cameraRadiusMaxM);
  });

  it("⚠⚠ the headroom is TIGHT, and this vector says so out loud", () => {
    // ⭐ A finding, not a property. The ceiling IS the camera's max radius, so how far a
    // pinch can push depends on where the camera already is. ⛔ If it feels like the
    // gesture sticks, that is the ceiling — not the gain.
    const farCam: Vec3 = [0, 0.5, -2.4];
    const far: Vec3 = [0.3, 0.2, 0.4];
    const pushed = depthPinchPosition(farCam, far, VIEW, DOWN, 2, minM, maxM);
    expect(dot(sub(pushed, farCam), push)).toBeCloseTo(maxM, 9);
  });
});

describe("⛔ degenerate inputs return the position unchanged", () => {
  it("an object BEHIND the camera has no depth to scale", () => {
    const behind: Vec3 = [0, 0.1, -3];
    expect(pinch(2, behind)).toEqual(behind);
  });

  it("a non-finite or non-positive factor is refused", () => {
    for (const bad of [0, -1, NaN, Infinity]) {
      expect(pinch(bad), `factor ${bad}`).toEqual(OBJ);
    }
  });

  it("⛔ never writes a NaN — one would never wash out of a placement", () => {
    for (const factor of [0, NaN, Infinity, 1e300]) {
      for (const c of pinch(factor)) expect(Number.isFinite(c)).toBe(true);
    }
    for (const c of depthPinchPosition(CAM, OBJ, [0, 0, 0], DOWN, 2, minM, maxM)) {
      expect(Number.isFinite(c)).toBe(true);
    }
  });
});

describe("the tracker is the SAME one rule 4 uses", () => {
  const at = (x: number, y: number, t: number): Sample => ({ x, y, t });

  it("⭐ it carries `gainPinchDepth`, not `gainZoom` — one class, two gains", () => {
    const tracker = depthPinchTracker({ ...DEFAULT_CONFIG, gainPinchDepth: 1 });
    tracker.begin(at(0, 0, 0), at(mmToPx(60), 0, 0));
    expect(tracker.scale(at(0, 0, 10), at(mmToPx(80), 0, 10))).toBe(1);
    // Fingers come together to half the separation ⇒ the object goes twice as deep.
    expect(tracker.scale(at(0, 0, 20), at(mmToPx(40), 0, 20))!).toBeCloseTo(2, 9);
  });

  it("⛔ says nothing inside the deadband — a caller must leave the object alone", () => {
    const tracker = depthPinchTracker(DEFAULT_CONFIG);
    tracker.begin(at(0, 0, 0), at(mmToPx(60), 0, 0));
    expect(tracker.scale(at(0, 0, 10), at(mmToPx(60.2), 0, 10))).toBeNull();
  });
});
