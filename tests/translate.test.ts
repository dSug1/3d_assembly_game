/**
 * GOLDEN VECTORS — §4 rule 6, screen-plane translation.
 *
 * ⛔⛔ THE FIRST VECTOR IS THE COMPOSITION, and it is written as a ROUND TRIP: move the
 * object by what the rule says, project it back onto the screen, and check it landed
 * under the finger. `METHOD`: *a composition is a thing to measure* — and the two
 * defects this project has paid most for were both compositions nobody computed.
 */
import { describe, expect, it } from "vitest";
import { trackingMetresPerPx } from "../src/input/translate";

const FOV = 0.8; // rad, Babylon's default vertical field of view
const H = 800; // CSS px of viewport height

describe("rule 6 — directions and degenerate inputs", () => {

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

