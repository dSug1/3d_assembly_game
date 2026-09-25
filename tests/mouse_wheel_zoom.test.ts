/**
 * GOLDEN VECTORS — **THE MOUSE WHEEL ZOOMS** (the owner, 2026-09-25: *"add the zoom with the mouse
 * roller for desktop"*).
 *
 * ⭐ It writes the orbit's `zoom` multiplier, the quantity the pinch writes — so these vectors pin
 * the direction, the ratio, and the clamp on the multiplier itself.
 */
import { describe, expect, it } from "vitest";
import { WHEEL_ZOOM_STEP, wheelNotches, wheelZoom } from "@input/mouse_wheel_zoom";

describe("⭐ wheelNotches — the sign and the unit", () => {
  it("⭐⭐ scrolling UP (deltaY < 0) is a positive notch — zoom IN", () => {
    expect(wheelNotches(-100, 0)).toBeCloseTo(1, 12);
    expect(wheelNotches(100, 0)).toBeCloseTo(-1, 12);
  });

  it("⚠ lines and pages are normalised to notches too", () => {
    expect(wheelNotches(-3, 1)).toBeCloseTo(1, 12);
    expect(wheelNotches(-1, 2)).toBeCloseTo(1, 12);
  });

  it("⛔ zero and non-finite deltas are no notch at all", () => {
    expect(wheelNotches(0, 0)).toBe(0);
    expect(wheelNotches(Number.NaN, 0)).toBe(0);
  });
});

describe("⭐⭐⭐ wheelZoom — a ratio per notch, clamped on the multiplier", () => {
  it("⭐⭐ a notch IN makes the radius SMALLER, by exactly one step", () => {
    // ⛔ RED against the inverted sign, which would zoom out on scroll up.
    expect(wheelZoom(1, 1, 0.1, 10)).toBeCloseTo(1 / WHEEL_ZOOM_STEP, 12);
    expect(wheelZoom(1, -1, 0.1, 10)).toBeCloseTo(WHEEL_ZOOM_STEP, 12);
  });

  it("⭐ N in then N out returns exactly where it started — a ratio, not a step", () => {
    // ⚠ RED against an absolute increment, which would feel different at every distance.
    const inward = wheelZoom(2, 3, 0.1, 10);
    expect(wheelZoom(inward, -3, 0.1, 10)).toBeCloseTo(2, 12);
  });

  it("⛔⛔ CLAMPED ON THE MULTIPLIER — scrolling past a limit stores nothing", () => {
    // ⚠ `applyCamera` clamps the camera, not `zoom`. Without this, twenty notches past the limit
    // would have to be scrolled back through before the view moved again.
    let z = 1;
    for (let i = 0; i < 50; i++) z = wheelZoom(z, 1, 0.5, 4);
    expect(z).toBeCloseTo(0.5, 12);
    // ⭐ and the very next notch out moves the view at once
    expect(wheelZoom(z, -1, 0.5, 4)).toBeGreaterThan(0.5);
  });

  it("⛔ a zero or non-finite notch leaves the zoom alone", () => {
    expect(wheelZoom(1.7, 0, 0.1, 10)).toBe(1.7);
    expect(wheelZoom(1.7, Number.NaN, 0.1, 10)).toBe(1.7);
  });
});
