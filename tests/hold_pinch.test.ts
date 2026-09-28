/**
 * GOLDEN VECTORS — **`D137`: a horizontal pinch while holding a body zooms** (the owner, 2026-09-28).
 */
import { describe, expect, it } from "vitest";
import { holdPinch, nextDxSign, type PinchFinger } from "@input/hold_pinch";

const f = (x: number, dxSign: -1 | 0 | 1, ax = "MOVING", ay = "STATIONARY"): PinchFinger => ({
  axes: { x: ax as "MOVING", y: ay as "STATIONARY" },
  dxSign,
  x,
});

describe("⭐⭐⭐ `D137` — holdPinch: both fingers sideways, in opposite directions, no dy", () => {
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

  it("⛔ any dy — either finger's y axis MOVING — is not a pinch (the owner: 'and no dy')", () => {
    expect(holdPinch(f(100, -1, "MOVING", "MOVING"), f(300, 1))).toBeNull();
    expect(holdPinch(f(100, -1), f(300, 1, "MOVING", "MOVING"))).toBeNull();
  });

  it("⛔ a finger that is not moving sideways, or has never moved, is not a pinch", () => {
    expect(holdPinch(f(100, -1, "STATIONARY"), f(300, 1))).toBeNull();
    expect(holdPinch(f(100, 0), f(300, 1))).toBeNull();
  });

  it("nextDxSign keeps the last sideways direction through a still sample", () => {
    expect(nextDxSign(0, 3)).toBe(1);
    expect(nextDxSign(1, 0)).toBe(1);
    expect(nextDxSign(1, -2)).toBe(-1);
  });
});
