/**
 * GOLDEN VECTORS — the APPROACH SWING, a trial on branch `1.0.18-`.
 *
 * ⭐⭐⭐ THE VECTOR THAT MATTERS IS THE ROUND TRIP, and it is written first: *the camera leaves
 * its orbit when the capture triggers and is back on it, exactly, at contact.* ⛔ Every other
 * property here is a detail of how it gets there; that one is the owner's requirement.
 */
import { describe, expect, it } from "vitest";
import {
  swingProgress,
  swingSignFor,
  swingYawRad,
  type SwingLatch,
} from "@input/approach_swing";

const LATCH: SwingLatch = { gapAtTriggerM: 0.07, sign: 1 };
const AMP = (25 * Math.PI) / 180;
const yawAt = (gapM: number, latch: SwingLatch = LATCH) =>
  swingYawRad(swingProgress(gapM, latch), AMP, latch.sign);

describe("⛔⛔⛔ THE ROUND TRIP — out, and exactly back", () => {
  it("⭐⭐⭐ the camera is EXACTLY on its orbit at the trigger and at contact", () => {
    // ⛔ `toBe(0)`, not `toBeCloseTo`. `Math.sin(Math.PI)` is 1.2246e-16, and the owner's
    // requirement is *"the camera shall be back to its original position"* — a residual makes
    // that a near-miss rather than a fact. This is the mutant the whole file exists to kill.
    expect(yawAt(0.07)).toBe(0);
    expect(yawAt(0)).toBe(0);
  });

  it("⭐⭐ it is furthest out at HALF the original gap — the owner's reversal point", () => {
    // ⚠ *"When the offset is half what it initially was, the camera orbit reverses."*
    expect(Math.abs(yawAt(0.035))).toBeCloseTo(AMP, 12);
    // ⭐ And that really is the maximum, not merely a large value: sampled either side.
    for (const g of [0.05, 0.04, 0.03, 0.02]) {
      expect(Math.abs(yawAt(g))).toBeLessThan(Math.abs(yawAt(0.035)) + 1e-12);
    }
  });

  it("⭐⭐ it grows on the way in and shrinks on the way back — monotone on each side", () => {
    // ⛔ A COMPOSITION, sampled: the shape is the claim, and a single peak value cannot say
    // whether the curve got there monotonically or wandered.
    const half = [0.07, 0.065, 0.06, 0.05, 0.045, 0.04, 0.035].map((g) => Math.abs(yawAt(g)));
    for (let i = 1; i < half.length; i++) expect(half[i]!).toBeGreaterThan(half[i - 1]!);
    const back = [0.035, 0.03, 0.02, 0.015, 0.01, 0.005, 0].map((g) => Math.abs(yawAt(g)));
    for (let i = 1; i < back.length; i++) expect(back[i]!).toBeLessThan(back[i - 1]!);
  });

  it("⛔⛔⛔ THE REVERSAL IS SMOOTH — the camera's angular SPEED passes through zero", () => {
    // ⚠⚠ THIS VECTOR EXISTS BECAUSE A MUTANT SURVIVED. A **triangle** satisfies every other
    // claim in this file — zero at both ends, peak at half, monotone on each side, one sign —
    // and it was the stated REASON for choosing a sine that nothing tested:
    //
    //   *"its velocity is continuous at the reversal: a triangle changes the camera's angular
    //    speed instantaneously at the halfway point, which on glass reads as a knock exactly
    //    when the hand is concentrating on the last millimetres."*
    //
    // ⭐⭐ `METHOD`: *a reason recorded in prose is not a tested claim.* So it is measured: the
    // slope either side of the peak, numerically. ⛔ A sine's is ≈ 0 at the peak; a triangle's
    // jumps from `+2A` to `−2A`, a discontinuity of `4A`.
    const h = 1e-6;
    const slope = (p: number) =>
      (swingYawRad(p + h, AMP, 1) - swingYawRad(p - h, AMP, 1)) / (2 * h);
    expect(Math.abs(slope(0.5))).toBeLessThan(1e-4);
    // ⚠ And the two one-sided slopes AGREE at the reversal rather than flipping.
    expect(Math.abs(slope(0.5 - 1e-3) - slope(0.5 + 1e-3))).toBeLessThan(0.02 * AMP);
    // ⭐ While away from the peak the camera really is moving — so the test above is a statement
    // about smoothness and not about the swing being flat everywhere.
    expect(Math.abs(slope(0.25))).toBeGreaterThan(0.5 * AMP);
  });

  it("⛔ the sign is the LATCH's, and reversing it mirrors the whole swing", () => {
    const other: SwingLatch = { gapAtTriggerM: 0.07, sign: -1 };
    expect(yawAt(0.035, other)).toBeCloseTo(-yawAt(0.035), 12);
    // ⚠ The reversal at half is NOT a change of sign — both halves are on the same side of the
    // orbit. ⛔ Asserted, because "reverses" in the dictation could be read either way, and the
    // other reading would sweep the camera through the original position and out the far side.
    expect(Math.sign(yawAt(0.05))).toBe(Math.sign(yawAt(0.02)));
  });
});

describe("⛔⛔ THE PROGRESS — clamped at both ends, and degenerate inputs are refused", () => {
  it("⭐ 0 at the trigger, 1 at contact, linear in the gap between", () => {
    expect(swingProgress(0.07, LATCH)).toBe(0);
    expect(swingProgress(0.035, LATCH)).toBeCloseTo(0.5, 12);
    expect(swingProgress(0, LATCH)).toBe(1);
  });

  it("⛔⛔ PULLING BACK PAST THE TRIGGER DOES NOT SWING THE OTHER WAY", () => {
    // ⚠ `p` would go negative and `sin` would take the camera out on the far side — a hand
    // backing off would see the view swing the wrong way, which is the opposite of the cue this
    // is for. ⭐ It returns to zero and STAYS there.
    expect(swingProgress(0.09, LATCH)).toBe(0);
    expect(yawAt(0.09)).toBe(0);
    expect(yawAt(10)).toBe(0);
  });

  it("⛔ PAST CONTACT the bodies interpenetrate and the gap reads 0 — still home", () => {
    // ⚠ `gapBetween` returns 0 for overlap, so there is no negative gap to handle; the clamp is
    // what makes that harmless rather than something the caller must know.
    expect(swingProgress(-0.01, LATCH)).toBe(1);
    expect(yawAt(-0.01)).toBe(0);
  });

  it("⛔⛔ a trigger gap of ZERO is degenerate and answers `1` — the only safe answer", () => {
    // ⚠ It would divide by zero, and it means the capture fired AT contact, where there is no
    // approach left to show. ⭐ `1` puts the swing at home: the one answer that cannot move the
    // camera. `LESSONS_CARRIED` §6 — a degenerate input refuses, it does not improvise.
    for (const g0 of [0, -1, NaN, Infinity]) {
      const bad: SwingLatch = { gapAtTriggerM: g0, sign: 1 };
      expect(swingProgress(0.03, bad)).toBe(1);
      expect(swingYawRad(swingProgress(0.03, bad), AMP, 1)).toBe(0);
    }
    expect(swingProgress(NaN, LATCH)).toBe(1);
  });
});

describe("⛔ THE DIRECTION — *opposite to the dx movement*", () => {
  it("⭐⭐ a finger moving RIGHT swings the camera the other way", () => {
    // ⛔ THE OWNER'S WORD IS *OPPOSITE*, and this is the only place it is written as arithmetic.
    // ⚠ `A7` and `D52` were both sign COMPOSITIONS that nothing measured; this is one function
    // so that it can be.
    expect(swingSignFor(12)).toBe(-1);
    expect(swingSignFor(-12)).toBe(1);
  });

  it("⚠ a zero dx falls back to +1 rather than to NO SWING", () => {
    // ⛔ `Math.sign(0)` is `0`, which would multiply the amplitude away — the gesture would
    // silently do nothing, and a hand could only retry by pulling apart and coming back.
    // ⭐ Declared and arbitrary, exactly like `rollSignFor`'s fallback.
    expect(swingSignFor(0)).toBe(1);
  });
});
