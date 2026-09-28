/**
 * GOLDEN VECTORS — **`D137`: a horizontal pinch while holding a body zooms** (the owner, 2026-09-28),
 * amended the same day: the zoom ENDS as soon as either finger's deadbanded `dy` is not zero.
 */
import { describe, expect, it } from "vitest";
import { holdPinch, holdPinchEnds, nextDxSign, type PinchFinger } from "@input/hold_pinch";

const f = (x: number, dxSign: -1 | 0 | 1, dy = 0, ax = "MOVING"): PinchFinger => ({
  axes: { x: ax as "MOVING" },
  dxSign,
  dy,
  x,
});

describe("⭐⭐⭐ `D137` — the zoom STARTS: both fingers sideways, in opposite directions, both dy zero", () => {
  it("⭐ spreading → OUT, whichever finger is on the right", () => {
    expect(holdPinch(f(100, -1), f(300, 1))).toBe("OUT");
    expect(holdPinch(f(300, 1), f(100, -1))).toBe("OUT");
  });

  it("⭐ closing → IN", () => {
    expect(holdPinch(f(100, 1), f(300, -1))).toBe("IN");
    expect(holdPinch(f(300, -1), f(100, 1))).toBe("IN");
  });

  it("⛔ both fingers the SAME way is a translation with a passenger, not a pinch", () => {
    expect(holdPinch(f(100, 1), f(300, 1))).toBeNull();
    expect(holdPinch(f(100, -1), f(300, -1))).toBeNull();
  });

  it("⛔ any deadbanded dy on either finger is not a pinch (the owner: 'and no dy')", () => {
    expect(holdPinch(f(100, -1, 2), f(300, 1))).toBeNull();
    expect(holdPinch(f(100, -1), f(300, 1, -3))).toBeNull();
  });

  it("⛔ a finger that is not moving sideways, or has never moved, is not a pinch", () => {
    expect(holdPinch(f(100, -1, 0, "STATIONARY"), f(300, 1))).toBeNull();
    expect(holdPinch(f(100, 0), f(300, 1))).toBeNull();
  });
});

describe("⭐⭐⭐ `D137`, amended — the zoom ENDS as soon as one dy is not zero", () => {
  it("⭐ either finger's deadbanded dy ends it (RED against the first build, which held until a lift)", () => {
    expect(holdPinchEnds(0, 0)).toBe(false);
    expect(holdPinchEnds(1.5, 0)).toBe(true);
    expect(holdPinchEnds(0, -0.2)).toBe(true);
  });

  it("⭐ the SAME band decides both ways: a dy that stops the start also ends the zoom", () => {
    for (const dy of [0.1, -4, 12]) {
      expect(holdPinch(f(100, -1, dy), f(300, 1))).toBeNull();
      expect(holdPinchEnds(dy, 0)).toBe(true);
    }
  });

  it("nextDxSign keeps the last sideways direction through a still sample", () => {
    expect(nextDxSign(0, 3)).toBe(1);
    expect(nextDxSign(1, 0)).toBe(1);
    expect(nextDxSign(1, -2)).toBe(-1);
  });
});
