/**
 * AMENDMENT A6 — DEPTH TRANSLATION BY A COMMON VERTICAL DRAG.
 *
 * ⭐⭐ THE VECTORS THAT MATTER ARE THE ONES SEPARATING A6 FROM RULE 6. The two share a
 * touchpoint configuration — one finger on the object, one beside it — and are told apart
 * only by WHAT THE FINGERS DO. So the negatives come first: a rule 6 drag (anchor still)
 * must not read as depth, and a still hand must not either.
 *
 * ⭐ HEIGHT NEVER CHANGES is carried over from A5 and still asserted: the push direction is
 * perpendicular to gravity by construction, and gravity is the primary constraint here.
 */
import { describe, expect, it } from "vitest";
import {
  CommonDragDetector,
  depthLimits,
  depthPushDirection,
  depthTranslate,
} from "../src/input/depth_translate";
import { DEFAULT_CONFIG, CAMERA_NEAR_PLANE_M } from "../src/input/gestureConfig";
import { dot, length, normalize, scale, sub, type Vec3 } from "../src/core/vec";
import { mmToPx } from "../src/core/units";

const NOISE_MM = 0.761; // ⭐ MEASURED, 2026-09-14.
const TOL_MM = 6;
const WINDOW_MS = 60;

const DOWN: Vec3 = [0, -1, 0];
const CAM: Vec3 = [0, 0.8, -1.2];
const VIEW: Vec3 = normalize([0, -0.5, 1])!;
const OBJ: Vec3 = [0.15, 0.1, 0.1];
const { minM, maxM } = depthLimits(DEFAULT_CONFIG);
const PER_PX = 0.002; // rule 6's computed factor, at some camera distance

const push = depthPushDirection(VIEW, DOWN)!;
const depthOf = (p: Vec3) => dot(sub(p, CAM), push);
const move = (dyPx: number, gain = 1, obj: Vec3 = OBJ) =>
  depthTranslate(CAM, obj, VIEW, DOWN, dyPx, PER_PX, gain, minM, maxM);

const detector = () => new CommonDragDetector(WINDOW_MS, TOL_MM, NOISE_MM);

// ══════════════════════════════════════════════════════════════════════════════
// ⛔ WHAT MUST NOT READ AS DEPTH
// ══════════════════════════════════════════════════════════════════════════════

describe("⛔ telling A6 apart from RULE 6", () => {
  it("⛔⛔ A RULE 6 DRAG IS NOT DEPTH — the anchor is still, so there is no common travel", () => {
    // The object finger sweeps 30 mm down; the anchor sits where it was put.
    const d = detector();
    let last: unknown = null;
    for (let i = 0; i <= 8; i++) last = d.push(i * 8, mmToPx(i * 4), mmToPx(0));
    expect(last).toBeNull();
  });

  it("⛔ …even when the still anchor JITTERS at the measured noise floor", () => {
    const d = detector();
    let seen = 0;
    let seed = 7;
    for (let i = 0; i <= 40; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const jitterMm = ((seed / 0x7fffffff) * 2 - 1) * NOISE_MM;
      if (d.push(i * 8, mmToPx(i * 3), mmToPx(jitterMm))) seen++;
    }
    expect(seen).toBe(0);
  });

  it("⛔ A STILL HAND is not a common drag, however long you wait", () => {
    const d = detector();
    let seen = 0;
    for (let i = 0; i <= 200; i++) if (d.push(i * 8, 0, 0)) seen++;
    expect(seen).toBe(0);
  });

  it("⛔ FINGERS MOVING OPPOSITE WAYS is not common motion — that is a pinch, not a drag", () => {
    const d = detector();
    let last: unknown = null;
    for (let i = 0; i <= 8; i++) last = d.push(i * 8, mmToPx(i * 3), mmToPx(-i * 3));
    expect(last).toBeNull();
  });

  it("⛔ travelling together but too far APART is refused — the tolerance is on the DIFFERENCE", () => {
    const d = detector();
    let last: unknown = null;
    // 24 mm against 4 mm: both moving, same direction, 20 mm apart — over a 6 mm tolerance.
    for (let i = 0; i <= 8; i++) last = d.push(i * 8, mmToPx(i * 3), mmToPx(i * 0.5));
    expect(last).toBeNull();
  });

  it("⛔ a single sample has no baseline and says nothing", () => {
    expect(detector().push(0, mmToPx(50), mmToPx(50))).toBeNull();
  });
});

describe("✅ what IS a common drag", () => {
  const run = (aStepMm: number, bStepMm: number) => {
    const d = detector();
    let last = null as ReturnType<CommonDragDetector["push"]>;
    for (let i = 0; i <= 8; i++) last = d.push(i * 8, mmToPx(i * aStepMm), mmToPx(i * bStepMm));
    return last;
  };

  it("both fingers sweeping down together is reported", () => {
    const v = run(3, 3)!;
    expect(v).not.toBeNull();
    expect(v.spreadMm).toBeCloseTo(0, 9);
    expect(v.commonMm).toBeGreaterThan(0); // screen y grows DOWNWARD
  });

  it("⭐ a small spread INSIDE the tolerance still counts — hands are not machines", () => {
    const v = run(3, 2.6)!;
    expect(v).not.toBeNull();
    expect(v.spreadMm).toBeGreaterThan(0);
    expect(v.spreadMm).toBeLessThan(TOL_MM);
  });

  it("⭐ the reported common travel is the AVERAGE of the two, not either one", () => {
    // ⚠ Two samples, both inside the window, so the travels are exactly what is written
    // here. My first version of this used a ramp whose SPREAD (14 mm) exceeded the 6 mm
    // tolerance, and the detector refused it — correctly. ⭐ Control the window when the
    // assertion is about arithmetic rather than about the gate.
    const d = detector();
    d.push(0, 0, 0);
    const v = d.push(8, mmToPx(10), mmToPx(6))!;
    expect(v).not.toBeNull();
    expect(v.commonMm).toBeCloseTo(8, 6);
    expect(v.spreadMm).toBeCloseTo(4, 6);
  });

  it("works upward as well as downward", () => {
    expect(run(-3, -3)!.commonMm).toBeLessThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════

describe("⭐⭐ HEIGHT NEVER CHANGES — gravity is the primary constraint", () => {
  it("at every camera elevation", () => {
    for (const tilt of [0.1, 0.5, 1.5, 4]) {
      const view = normalize([0, -tilt, 1])!;
      const out = depthTranslate(CAM, OBJ, view, DOWN, mmToPx(-20), PER_PX, 1, minM, maxM);
      expect(out[1], `tilt ${tilt}`).toBeCloseTo(OBJ[1], 12);
    }
  });

  it("⛔ and the across-view offset is untouched too — only the depth moves", () => {
    const across = (p: Vec3) => {
      const r = sub(p, CAM);
      return sub(sub(r, scale(push, dot(r, push))), scale(DOWN, dot(r, DOWN)));
    };
    expect(length(sub(across(move(mmToPx(-30))), across(OBJ)))).toBeCloseTo(0, 12);
  });
});

describe("the sense and the size of the motion", () => {
  it("⚠ fingers UP push the object AWAY — it sits higher on screen when further off", () => {
    expect(depthOf(move(mmToPx(-20)))).toBeGreaterThan(depthOf(OBJ));
  });

  it("fingers DOWN bring it closer", () => {
    expect(depthOf(move(mmToPx(20)))).toBeLessThan(depthOf(OBJ));
  });

  it("⭐⭐ moves as far as RULE 6 would for the same travel — gain 1 means CONSISTENT, not tracking", () => {
    // 30 mm of finger at this camera factor: the same world distance a screen-plane drag
    // would cover, just pointed into the scene instead of across it.
    const travelPx = mmToPx(30);
    expect(depthOf(move(-travelPx)) - depthOf(OBJ)).toBeCloseTo(travelPx * PER_PX, 9);
  });

  it("is linear in the travel, and in the gain", () => {
    expect(depthOf(move(-mmToPx(30))) - depthOf(OBJ)).toBeCloseTo(
      3 * (depthOf(move(-mmToPx(10))) - depthOf(OBJ)),
      9,
    );
    expect(depthOf(move(-mmToPx(10), 2)) - depthOf(OBJ)).toBeCloseTo(
      2 * (depthOf(move(-mmToPx(10), 1)) - depthOf(OBJ)),
      9,
    );
  });

  it("⭐ out and back RETURNS — it is a displacement, applied per frame", () => {
    const away = move(-mmToPx(25));
    const back = depthTranslate(CAM, away, VIEW, DOWN, mmToPx(25), PER_PX, 1, minM, maxM);
    expect(length(sub(back, OBJ))).toBeCloseTo(0, 9);
  });

  it("zero travel changes nothing", () => {
    expect(length(sub(move(0), OBJ))).toBeCloseTo(0, 12);
  });
});

describe("⛔ the clamps and the degenerate cases", () => {
  it("cannot be pulled onto the camera", () => {
    expect(depthOf(move(mmToPx(100000)))).toBeCloseTo(minM, 9);
    expect(minM).toBeGreaterThan(CAMERA_NEAR_PLANE_M);
  });

  it("cannot be pushed past the camera's own maximum orbit radius", () => {
    expect(depthOf(move(-mmToPx(100000)))).toBeCloseTo(maxM, 9);
  });

  it("⭐ both bounds are DERIVED — no new tunable to measure", () => {
    expect(minM).toBe(2 * CAMERA_NEAR_PLANE_M);
    expect(maxM).toBe(DEFAULT_CONFIG.cameraRadiusMaxM);
  });

  it("⛔ a camera looking STRAIGHT DOWN has no depth direction", () => {
    expect(depthPushDirection([0, -1, 0], DOWN)).toBeNull();
    expect(depthTranslate(CAM, OBJ, [0, -1, 0], DOWN, mmToPx(-20), PER_PX, 1, minM, maxM)).toEqual(
      OBJ,
    );
  });

  it("⛔ an object BEHIND the camera is left alone", () => {
    const behind: Vec3 = [0, 0.1, -3];
    expect(move(mmToPx(-20), 1, behind)).toEqual(behind);
  });

  it("⛔ never writes a NaN — one would never wash out of a placement", () => {
    for (const bad of [NaN, Infinity]) {
      for (const c of depthTranslate(CAM, OBJ, VIEW, DOWN, bad, PER_PX, 1, minM, maxM)) {
        expect(Number.isFinite(c)).toBe(true);
      }
      for (const c of depthTranslate(CAM, OBJ, VIEW, DOWN, mmToPx(-20), bad, 1, minM, maxM)) {
        expect(Number.isFinite(c)).toBe(true);
      }
    }
  });
});
