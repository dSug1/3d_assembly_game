/**
 * GOLDEN VECTORS — **THE CAPTURE OFFSET** (`D49`): millimetres on the glass made world metres by the camera, the goal capture's radius
 * (`D183`, `captureOffsetM` in `input/goal_capture.ts`). ⛔ (2026-11-02) this was `highlight.test.ts`: the surface gap, the boot clearance
 * and the translation conditions are deleted with the parts' capture, translation and rotation (commit `d8134eb`).
 */
import { describe, expect, it } from "vitest";
import { captureOffsetM } from "@input/goal_capture";
import { DEFAULT_CONFIG } from "@input/gestureConfig";

describe("THE CAMERA-SCALED OFFSET — the owner's rule, as arithmetic", () => {
  // The reference viewport for these vectors: 1200 CSS px tall, 0.8 rad vertical field of
  // view — Babylon's default fov and a plausible tablet height.
  const FOV = 0.8;
  const VH = 1200;

  it("A CLOSER CAMERA MEANS A SMALLER WORLD OFFSET — the requirement, directly", () => {
    // The owner: *"if the camera and focus is close to an object, the offset distance in mm
    // shall be less than if the camera and focus are far."*
    const near = captureOffsetM(8, 0.5, FOV, VH);
    const far = captureOffsetM(8, 2.0, FOV, VH);
    expect(near).toBeLessThan(far);
    // And it is PROPORTIONAL, not merely monotone: four times the distance, four times the
    // offset. A monotone-but-not-proportional mapping would keep the apparent size drifting
    // with zoom, which is the half of the request that a bare *"smaller when closer"* misses.
    expect(far / near).toBeCloseTo(4, 9);
  });

  it("THE APPARENT SIZE IS CONSTANT — the same fraction of the screen at every zoom", () => {
    // THE COMPOSITION, MEASURED. `METHOD`: *a composition is a thing to measure, not an
    // emergent property* — and *"the same in pixels, without using pixels"* is a claim about
    // the whole chain `mm -> px -> metres-per-px -> metres`, not about either half.
    // The world extent visible at distance d is `2*d*tan(fov/2)`, so the offset as a
    // FRACTION of the screen must not depend on d at all.
    const fraction = (d: number): number =>
      captureOffsetM(8, d, FOV, VH) / (2 * d * Math.tan(FOV / 2));
    expect(fraction(0.4)).toBeCloseTo(fraction(3.0), 12);
    // And the value is what 8 mm of a 1200 px viewport should be: 8 mm => 30.24 CSS px.
    expect(fraction(1.5)).toBeCloseTo(30.236220472440944 / VH, 9);
  });

  it("it is DEVICE-INDEPENDENT in the way pixels are not", () => {
    // THE HALF OF THE REQUEST RAW PIXELS COULD NOT SATISFY. A pixel threshold means a
    // different physical size on every screen; a millimetre threshold converted through the
    // viewport height means the same fraction of the screen on all of them.
    const frac = (vh: number): number =>
      captureOffsetM(8, 1.5, FOV, vh) / (2 * 1.5 * Math.tan(FOV / 2));
    expect(frac(800)).toBeGreaterThan(frac(2400));
    // A taller viewport shows more world, so 8 mm is a smaller share of it — exactly as a
    // physical ruler held against two screens of different size behaves.
    expect(frac(800) / frac(2400)).toBeCloseTo(3, 9);
  });

  it("degenerate inputs give 0 — which reads as NOTHING CAPTURES, the safe direction", () => {
    // A zero-height viewport happens for real, in the frame before the canvas is laid out.
    // The alternative — Infinity or NaN — would capture the entire scene for that frame, and
    // a NaN written into a comparison never washes out.
    expect(captureOffsetM(8, 1.5, FOV, 0)).toBe(0);
    expect(captureOffsetM(8, 0, FOV, VH)).toBe(0);
    expect(captureOffsetM(0, 1.5, FOV, VH)).toBe(0);
    expect(captureOffsetM(-3, 1.5, FOV, VH)).toBe(0);
  });

  it("the shipped default is 10 mm on the glass \u2014 the owner's number (2026-09-26, after 15)", () => {
    // Stated once, here, so a change to it is a deliberate edit with a red suite in between
    // rather than a silent drift. What that number DOES is the vector above.
    expect(DEFAULT_CONFIG.captureOffsetMm).toBe(10);
    // 10 mm of glass at the boot camera is about 40 mm of world, half the L = 80 mm module.
    expect(captureOffsetM(DEFAULT_CONFIG.captureOffsetMm, 1.5, FOV, VH)).toBeCloseTo(0.04, 3);
  });
});
