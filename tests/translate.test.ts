/**
 * GOLDEN VECTORS — §4 rule 6, screen-plane translation.
 *
 * ⛔⛔ THE FIRST VECTOR IS THE COMPOSITION, and it is written as a ROUND TRIP: move the
 * object by what the rule says, project it back onto the screen, and check it landed
 * under the finger. `METHOD`: *a composition is a thing to measure* — and the two
 * defects this project has paid most for were both compositions nobody computed.
 */
import { describe, expect, it } from "vitest";
import { screenTranslation, trackingMetresPerPx } from "../src/input/translate";
import { mmToPx } from "../src/core/units";

const FOV = 0.8; // rad, Babylon's default vertical field of view
const H = 800; // CSS px of viewport height

/**
 * Where a world displacement in the screen plane LANDS on screen, in CSS pixels.
 * ⛔ Derived from the projection independently of `translate.ts`, so the round trip is
 * a check and not a restatement: full-height world extent at `d` is `2·d·tan(fov/2)`.
 */
const projectToPx = (metres: number, d: number): number =>
  (metres / (2 * d * Math.tan(FOV / 2))) * H;

describe("rule 6 — the object stays under the finger", () => {
  it("⭐⭐ ROUND TRIP: at gain 1 the object lands exactly where the finger is", () => {
    // ⛔ THE WHOLE POINT OF THE RULE. Every distance the camera can actually be at:
    // the zoom clamp at both ends, the orbit waist, and both orbit rings — which are
    // ASYMMETRIC (1.14 m top against 0.71 m bottom), so a rule that worked only at one
    // camera height would pass a single-distance test and fail on the glass.
    for (const d of [0.15, 0.37, 0.6, 0.707, 1.141, 3]) {
      for (const [dx, dy] of [
        [10, 0],
        [0, 10],
        [-37, 14],
        [120, -80],
      ]) {
        const t = screenTranslation(dx!, dy!, d, FOV, H, 1);
        expect(projectToPx(t.rightM, d)).toBeCloseTo(dx!, 6);
        expect(projectToPx(-t.upM, d)).toBeCloseTo(dy!, 6);
      }
    }
  });

  it("⭐⭐ the SCREEN displacement is the same at both zoom extremes", () => {
    // ⛔ THE COMPOSITION, STATED AS THE PROPERTY THAT MATTERS. The world displacement
    // differs 20× between the ends of the zoom clamp; the screen displacement must not
    // differ at all, or the same drag means different things depending on the zoom.
    const near = screenTranslation(50, 0, 0.15, FOV, H, 1);
    const far = screenTranslation(50, 0, 3, FOV, H, 1);
    expect(far.rightM / near.rightM).toBeCloseTo(20, 6); // world: 20× apart
    expect(projectToPx(near.rightM, 0.15)).toBeCloseTo(50, 6); // screen: identical
    expect(projectToPx(far.rightM, 3)).toBeCloseTo(50, 6);
  });

  it("⛔⛔ a FIXED metres-per-mm gain would vary 20× on screen — the negative", () => {
    // ⚠ THE IMPLEMENTATION THAT LOOKS RIGHT AND IS NOT: one constant, no distance term.
    // It is what "add a gain and tune it on the device" produces, and it is unusable —
    // tuned zoomed out, the object creeps when zoomed in.
    const FIXED_M_PER_MM = 0.0024;
    const worldM = pxTravelMm(50) * FIXED_M_PER_MM;
    expect(projectToPx(worldM, 0.15) / projectToPx(worldM, 3)).toBeCloseTo(20, 6);
  });

  it("⭐ the gain is a MULTIPLIER: 2 outruns the finger by exactly two", () => {
    const one = screenTranslation(50, 30, 0.6, FOV, H, 1);
    const two = screenTranslation(50, 30, 0.6, FOV, H, 2);
    expect(two.rightM).toBeCloseTo(one.rightM * 2, 12);
    expect(two.upM).toBeCloseTo(one.upM * 2, 12);
    expect(screenTranslation(50, 30, 0.6, FOV, H, 0).rightM).toBe(0);
  });
});

describe("rule 6 — directions and degenerate inputs", () => {
  it("⛔ screen y is DOWN and the camera's up axis is UP: the sign is flipped", () => {
    // ⚠ A missing negation here looks like "the controls are inverted", not like a bug,
    // and the owner has already had to report exactly that once on this project.
    const t = screenTranslation(0, 10, 0.6, FOV, H, 1);
    expect(t.upM).toBeLessThan(0);
    expect(screenTranslation(10, 0, 0.6, FOV, H, 1).rightM).toBeGreaterThan(0);
  });

  it("⛔⛔ a viewport of zero height yields 0, never NaN or Infinity", () => {
    // ⚠ IT HAPPENS FOR REAL, in the frame before a canvas is laid out. One NaN written
    // into a pose is permanent — it never washes back out of a quaternion — so the
    // degenerate case is a vector, not a comment.
    for (const bad of [0, -1, Number.NaN]) {
      expect(trackingMetresPerPx(0.6, FOV, bad)).toBe(0);
      expect(trackingMetresPerPx(0.6, bad, H)).toBe(0);
      expect(trackingMetresPerPx(bad, FOV, H)).toBe(0);
      expect(Number.isFinite(screenTranslation(10, 10, 0.6, FOV, bad, 1).rightM)).toBe(true);
    }
  });

  it("⚠ the factor is per CSS pixel, not per device pixel", () => {
    // ⛔ Pointer coordinates are CSS pixels. Handing this a device-pixel height on a 3×
    // display makes the object move a third as far as the finger, with nothing on
    // screen to say why. The vector pins the unit by pinning the arithmetic.
    expect(trackingMetresPerPx(0.6, FOV, 800)).toBeCloseTo(
      (2 * 0.6 * Math.tan(0.4)) / 800,
      12,
    );
  });

  it("⭐ scales linearly with distance and with tan(fov/2)", () => {
    expect(trackingMetresPerPx(1.2, FOV, H)).toBeCloseTo(
      trackingMetresPerPx(0.6, FOV, H) * 2,
      12,
    );
    const wide = trackingMetresPerPx(0.6, 1.2, H);
    expect(wide / trackingMetresPerPx(0.6, FOV, H)).toBeCloseTo(
      Math.tan(0.6) / Math.tan(0.4),
      12,
    );
  });
});

/** Finger travel in mm expressed as CSS px, so the negative above is in real units. */
function pxTravelMm(px: number): number {
  return px / mmToPx(1);
}
