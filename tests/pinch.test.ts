/**
 * GOLDEN VECTORS — §2 rule 4, pinch zoom.
 *
 * ⭐ `IN1` cost seven device passes and 14 defects, and three shapes accounted for
 * nearly all of them. These vectors are written against those shapes deliberately:
 *
 *   1. a rate estimated over the shortest available baseline  → pinch uses no rate at
 *      all, only an absolute separation, so the vectors check it is noise-immune;
 *   2. a quantity substituted for the one asked for           → checked by asserting
 *      the DIRECTION a hand expects, not the sign of an internal number;
 *   3. idealised fixtures                                     → every gesture here
 *      carries pointer noise and imperfect finger motion.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, CAMERA_NEAR_PLANE_M } from "../src/input/gestureConfig";
import { PinchTracker, clampCameraRadiusM } from "../src/input/pinch";
import { MotionTracker, type Sample } from "../src/input/motion";
import { mmToPx } from "../src/core/units";

const cfg = DEFAULT_CONFIG;

/** Two touchpoints `apartMm` apart, centred, with optional pointer noise. */
function pair(apartMm: number, t: number, noisePx = 0, seedRef = { s: 5 }): [Sample, Sample] {
  const rnd = () => {
    seedRef.s = (seedRef.s * 1103515245 + 12345) & 0x7fffffff;
    return (seedRef.s / 0x7fffffff) * 2 - 1;
  };
  const half = mmToPx(apartMm) / 2;
  return [
    { x: 400 - half + rnd() * noisePx, y: 300 + rnd() * noisePx, t },
    { x: 400 + half + rnd() * noisePx, y: 300 + rnd() * noisePx, t },
  ];
}

/**
 * Begin a pinch AND cross the deadband, returning the tracker armed at `armedMm`.
 * ⚠ The first reading past the deadband deliberately returns exactly 1 — it
 * re-anchors so the gesture cannot jump — so a fixture that measures zoom must arm
 * first. Three vectors were written wrong before this helper existed.
 */
function armed(startMm: number, armedMm: number): PinchTracker {
  const p = new PinchTracker(cfg);
  p.begin(...pair(startMm, 0));
  const first = p.scale(...pair(armedMm, 10));
  expect(first).toBe(1);
  expect(p.isZooming).toBe(true);
  return p;
}

describe("pinch zoom — the mapping", () => {
  it("⭐ fingers APART bring the camera CLOSER", () => {
    // ⛔ Asserted as the direction a HAND expects, not as the sign of an internal
    // number. `IN1`'s yaw and pitch both shipped inverted because the internal sign
    // was self-consistent and nobody checked it against the gesture.
    const p = armed(40, 45);
    expect(p.scale(...pair(90, 20))!).toBeLessThan(1); // a smaller radius = closer
  });

  it("⭐ fingers TOGETHER push the camera AWAY", () => {
    const p = armed(80, 75);
    expect(p.scale(...pair(40, 20))!).toBeGreaterThan(1);
  });

  it("⭐ the mapping is SCALE-FREE — the same ratio gives the same zoom", () => {
    // A doubling is a doubling, whether the hand is small on a phone or wide on a
    // tablet. Both are armed first, then given the same RATIO.
    const wide = armed(40, 50).scale(...pair(100, 20))!;
    const narrow = armed(20, 25).scale(...pair(50, 20))!;
    expect(wide).toBeCloseTo(narrow, 9);
    expect(wide).toBeCloseTo(0.5, 9); // doubled separation halves the radius
  });

  it("⭐⭐ a pinch OUT and back returns EXACTLY to where it started", () => {
    // ⛔ THE REASON THE RATIO IS TAKEN FROM THE GESTURE'S START AND NEVER ACCUMULATED.
    // An incremental mapping integrates its own rounding; `IN1`'s roll had precisely
    // this defect, where 200° out and 200° back finished 180° from where it began.
    const p = armed(50, 55);
    for (let i = 0; i < 40; i++) p.scale(...pair(55 + i, 20 + i * 10));
    for (let i = 40; i >= 0; i--) p.scale(...pair(55 + i, 500 + (40 - i) * 10));
    expect(p.scale(...pair(55, 1000))!).toBeCloseTo(1, 12);
  });

  it("⛔ pointer noise does not move the zoom once it IS live", () => {
    // ⚠ The deadband only protects the START. A live pinch reads separation every
    // frame, so noise must not shake the camera either.
    const seed = { s: 9 };
    const p = armed(50, 55);
    let worst = 0;
    for (let t = 20; t <= 2000; t += 10) {
      worst = Math.max(worst, Math.abs(p.scale(...pair(55, t, 0.5, seed))! - 1));
    }
    // ±0.5 px of noise on a 55 mm separation is ~0.5% — and it is a RATIO of
    // absolute distances, so it needs no baseline and no filter.
    expect(worst).toBeLessThan(0.02);
  });
});

describe("pinch zoom — the deadband", () => {
  it("a tiny separation change does NOT zoom", () => {
    const p = new PinchTracker(cfg);
    p.begin(...pair(50, 0));
    expect(p.scale(...pair(50.5, 10))).toBeNull();
    expect(p.isZooming).toBe(false);
  });

  it("⭐⭐ crossing the deadband does NOT jump — it re-anchors", () => {
    // ⛔ THE DEFECT SHAPE `IN1` HIT THREE TIMES (the stale reference, the creeping
    // baseline, the moving centre). Without re-anchoring, the first live frame would
    // scale by the whole deadband at once — a visible snap starting every gesture.
    const p = new PinchTracker(cfg);
    p.begin(...pair(50, 0));
    const first = p.scale(...pair(50 + cfg.pinchDeadband + 0.2, 10));
    expect(first).toBe(1); // exactly no zoom yet
    expect(p.isZooming).toBe(true);
  });

  it("⭐ and zoom then accrues FROM the crossing point", () => {
    const p = new PinchTracker(cfg);
    p.begin(...pair(50, 0));
    const crossed = 50 + cfg.pinchDeadband + 0.2;
    p.scale(...pair(crossed, 10));
    const s = p.scale(...pair(crossed * 2, 20))!;
    expect(s).toBeCloseTo(0.5, 6); // doubled separation from the crossing = half radius
  });

  it("⛔ pointer noise alone never starts a zoom", () => {
    // Two resting fingers jitter. §1.1 exists because `delta == 0` is never true.
    const p = new PinchTracker(cfg);
    const seed = { s: 5 };
    p.begin(...pair(50, 0, 0.5, seed));
    for (let t = 10; t <= 3000; t += 10) {
      expect(p.scale(...pair(50, t, 0.5, seed))).toBeNull();
    }
    expect(p.isZooming).toBe(false);
  });

  it("ending the gesture stops it reporting", () => {
    const p = new PinchTracker(cfg);
    p.begin(...pair(50, 0));
    p.scale(...pair(70, 10));
    p.end();
    expect(p.scale(...pair(90, 20))).toBeNull();
  });
});

describe("⛔⛔ the camera radius clamp — the black-page guard", () => {
  it("never lets the radius reach the near plane", () => {
    // ⛔ THE MOST EXPENSIVE FAILURE THIS PROJECT HAS ALREADY HAD: a metre-scale scene
    // inside Babylon's default 1-unit near plane rendered a black page with NO error
    // anywhere. A zoom that can drive the radius below `minZ` recreates it silently.
    expect(clampCameraRadiusM(0.0001, cfg)).toBeGreaterThan(CAMERA_NEAR_PLANE_M);
    expect(clampCameraRadiusM(-5, cfg)).toBe(cfg.cameraRadiusMinM);
  });

  it("clamps the far end too", () => {
    expect(clampCameraRadiusM(9999, cfg)).toBe(cfg.cameraRadiusMaxM);
  });

  it("leaves a radius inside the range alone", () => {
    expect(clampCameraRadiusM(0.6, cfg)).toBe(0.6);
  });

  it("⛔ a config whose zoom could clip the scene is REJECTED at construction", () => {
    expect(
      () => new MotionTracker({ ...cfg, cameraRadiusMinM: CAMERA_NEAR_PLANE_M }),
    ).toThrow(/near/);
  });

  it("⛔ an inverted zoom range is rejected", () => {
    expect(() => new MotionTracker({ ...cfg, cameraRadiusMinM: 5 })).toThrow();
  });
});
