/**
 * GOLDEN VECTORS — **`D113`: the edge band** — a strip along the canvas edges that is always empty
 * space, so the camera reset stays reachable when a body fills the view.
 */
import { describe, expect, it } from "vitest";
import { inEdgeBand, type CanvasRect } from "@input/edge_band";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";

// ⚠ An OFFSET canvas on purpose: a rule that forgot `left`/`top` passes every vector at (0, 0).
const R: CanvasRect = { left: 100, top: 50, width: 800, height: 600 };
const B = 20;

describe("⭐⭐⭐ inEdgeBand", () => {
  it("⭐ all four edges are in the band", () => {
    expect(inEdgeBand(105, 300, R, B)).toBe(true); // left
    expect(inEdgeBand(895, 300, R, B)).toBe(true); // right
    expect(inEdgeBand(500, 55, R, B)).toBe(true); // top
    expect(inEdgeBand(500, 645, R, B)).toBe(true); // bottom
  });

  it("⛔ the middle of the view is not — a body there is grabbed as always", () => {
    expect(inEdgeBand(500, 350, R, B)).toBe(false);
    // ⚠ Just inside the band's inner edge, in canvas pixels 20 from the left.
    expect(inEdgeBand(120, 350, R, B)).toBe(false);
    expect(inEdgeBand(119.5, 350, R, B)).toBe(true);
  });

  it("⛔ the canvas offset is honoured — the page's own left margin is not the band", () => {
    // x = 110 is 10 px into the canvas (in the band); x = 30 is off the canvas entirely.
    expect(inEdgeBand(110, 350, R, B)).toBe(true);
    expect(inEdgeBand(30, 350, R, B)).toBe(false);
  });

  it("⚠ 0 switches it off; a degenerate canvas has no band", () => {
    expect(inEdgeBand(101, 300, R, 0)).toBe(false);
    expect(inEdgeBand(0, 0, { left: 0, top: 0, width: 0, height: 0 }, B)).toBe(false);
  });

  it("the shipped width validates, and a band past 20 mm is refused", () => {
    expect(DEFAULT_CONFIG.edgeBandMm).toBe(6);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, edgeBandMm: 25 })).toThrow(/edgeBandMm/);
  });
});
