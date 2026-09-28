/**
 * GOLDEN VECTORS — **a highlight floats ONE PIXEL off what it marks, at every zoom** (the owner,
 * 2026-09-27: *"do that change for highlights and outline"*). ⛔ It was 1.5 mm in the world for a
 * face marker and 2 % of the body's half-size for the outline — 10–20 px up close, under one far away.
 */
import { describe, expect, it } from "vitest";
import { highlightLiftM, outlineOffsetStale } from "@input/highlight_lift";
import { trackingMetresPerPx } from "@input/translate";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";

const FOV = 0.8;
const H = 800;

describe("⭐⭐ the lift is a distance ON THE GLASS", () => {
  it("⭐ the default is 0.1 mm on the glass (the owner, 2026-09-28; was one CSS pixel) — its world size tracks the distance", () => {
    expect(DEFAULT_CONFIG.highlightLiftMm).toBe(0.1);
    for (const d of [0.15, 0.6, 1.5, 3]) {
      expect(highlightLiftM(DEFAULT_CONFIG.highlightLiftMm, d, FOV, H)).toBeCloseTo(
        trackingMetresPerPx(d, FOV, H) * ((0.1 * 96) / 25.4),
        12,
      );
    }
  });

  it("⛔ the default still clears a 24-bit depth buffer by 10× at every distance a body can be seen from — no z-fighting (the owner: 'does that create an issue?')", () => {
    // ⭐ The orbit radius tops out at `cameraRadiusMaxM` (3 m); a body can sit a couple of metres past the
    // orbit centre, so 5 m bounds it. ⚠ A first draft said 10 m and the margin there is only 6.7× (the
    // ratio is ≈ 67/d at an 800 px viewport) — measured by this vector, not guessed.
    // ⭐ A perspective depth buffer resolves `z²·(far − near) / (far·near·2²⁴)` at distance z; the
    // camera's planes are 0.01 m and 100 m. ⚠ A 16-BIT buffer (×256 coarser) would z-fight at any lift
    // this small — none of the target devices ships one, which is the premise this vector states.
    const NEAR = 0.01;
    const FAR = 100;
    const resolution = (z: number) => (z * z * (FAR - NEAR)) / (FAR * NEAR * 2 ** 24);
    expect(DEFAULT_CONFIG.cameraRadiusMaxM).toBeLessThanOrEqual(3);
    for (const d of [0.15, 0.6, 1.5, 3, 5]) {
      expect(highlightLiftM(DEFAULT_CONFIG.highlightLiftMm, d, FOV, H)).toBeGreaterThan(10 * resolution(d));
    }
  });

  it("⭐ the numbers the owner was shown: 0.16 mm at 0.15 m, 3.2 mm at 3 m (fov 0.8, 800 px)", () => {
    expect(highlightLiftM(25.4 / 96, 0.15, FOV, H) * 1000).toBeCloseTo(0.159, 3);
    expect(highlightLiftM(25.4 / 96, 3, FOV, H) * 1000).toBeCloseTo(3.171, 3);
  });

  it("⛔ it scales with distance and with the setting — never a fixed world size (RED: 1.5 mm everywhere)", () => {
    const a = highlightLiftM(0.5, 0.6, FOV, H);
    expect(highlightLiftM(0.5, 1.2, FOV, H)).toBeCloseTo(2 * a, 12);
    expect(highlightLiftM(1.0, 0.6, FOV, H)).toBeCloseTo(2 * a, 12);
    expect(highlightLiftM(25.4 / 96, 0.6, FOV, H)).not.toBeCloseTo(0.0015, 4);
  });

  it("a degenerate view (a canvas not laid out yet) lifts nothing rather than writing NaN", () => {
    expect(highlightLiftM(0.26, 0.6, FOV, 0)).toBe(0);
    expect(highlightLiftM(0.26, 0, FOV, H)).toBe(0);
  });

  it("the setting is a slider in (0, 5] mm — 0 would z-fight", () => {
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, highlightLiftMm: 0 })).toThrow(/highlightLiftMm/);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, highlightLiftMm: 6 })).toThrow(/highlightLiftMm/);
  });
});

describe("⭐ the outline's baked offset is rebuilt only when it has gone stale", () => {
  it("never built → build; within ±5 % → keep; beyond → rebuild", () => {
    expect(outlineOffsetStale(null, 0.001)).toBe(true);
    expect(outlineOffsetStale(0.001, 0.00104)).toBe(false);
    expect(outlineOffsetStale(0.001, 0.00096)).toBe(false);
    expect(outlineOffsetStale(0.001, 0.0011)).toBe(true);
    expect(outlineOffsetStale(0.001, 0.0009)).toBe(true);
  });

  it("a zoom from 0.15 m to 3 m makes it stale — the old 2 % offset never followed a zoom", () => {
    const near = highlightLiftM(25.4 / 96, 0.15, FOV, H);
    const far = highlightLiftM(25.4 / 96, 3, FOV, H);
    expect(outlineOffsetStale(near, far)).toBe(true);
  });
});
