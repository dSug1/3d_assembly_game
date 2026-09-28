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
  it("⭐ the default is one CSS pixel — its world size is exactly one pixel's at that distance", () => {
    expect(DEFAULT_CONFIG.highlightLiftMm).toBeCloseTo(25.4 / 96, 12);
    for (const d of [0.15, 0.6, 1.5, 3]) {
      expect(highlightLiftM(DEFAULT_CONFIG.highlightLiftMm, d, FOV, H)).toBeCloseTo(trackingMetresPerPx(d, FOV, H), 12);
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
