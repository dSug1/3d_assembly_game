/**
 * GOLDEN VECTORS — **`D139`: a snap stops the gesture that made it; only the roll goes on** (the owner,
 * 2026-09-28).
 */
import { describe, expect, it } from "vitest";
import { rollRearmed, seatLockAllows, type GripChannel } from "@input/seat_lock";

const ALL: GripChannel[] = ["TRANSLATE", "ROTATE", "LIFT", "ROLL", "ZOOM", "TAP"];

describe("⭐⭐⭐ `D139` — seatLockAllows", () => {
  it("⭐ a LOCKED grip keeps the roll and nothing else (the owner: 'except roll which can still continue') — `D172`: once RE-ARMED", () => {
    expect(ALL.filter((c) => seatLockAllows(true, c, true))).toEqual(["ROLL"]);
  });

  it("⛔ the translation is refused — RED: it carried on and dragged Pioneer and Follower together (`D102`)", () => {
    expect(seatLockAllows(true, "TRANSLATE")).toBe(false);
    expect(seatLockAllows(true, "LIFT")).toBe(false);
  });

  it("⭐ an unlocked grip drives everything, as before", () => {
    expect(ALL.every((c) => seatLockAllows(false, c))).toBe(true);
  });
});

describe("⭐⭐⭐ `D172` — after a snap the roll must be RE-ARMED by a new second touch, a new Shift or a new click", () => {
  it("⛔ the second touchpoint already down at the seat does NOT roll — RED: `D139` let it, so a slight dx rolled the seated piece", () => {
    expect(seatLockAllows(true, "ROLL", false)).toBe(false);
    expect(seatLockAllows(true, "ROLL")).toBe(false);
  });

  it("⭐ one pressed after the seat rolls; re-arming unlocks nothing else", () => {
    expect(seatLockAllows(true, "ROLL", true)).toBe(true);
    for (const c of ALL.filter((x) => x !== "ROLL")) expect(seatLockAllows(true, c, true)).toBe(false);
  });

  it("⭐ re-armed = pressed later: a touchpoint's press order above every one down at the seat", () => {
    expect(rollRearmed(3, 3)).toBe(false); // ⭐ the finger (or Shift) that was down at the seat
    expect(rollRearmed(2, 3)).toBe(false);
    expect(rollRearmed(4, 3)).toBe(true); // ⭐ a NEW finger, or Shift pressed again (a new touchpoint)
    expect(rollRearmed(0, -1)).toBe(true); // ⭐ no touchpoint was down at the seat: any press is later
  });

  it("⭐ an unlocked grip is untouched: the roll needs no re-arming before a seat", () => {
    expect(seatLockAllows(false, "ROLL", false)).toBe(true);
  });
});
