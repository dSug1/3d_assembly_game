/**
 * GOLDEN VECTORS — **`D139`: a snap stops the gesture that made it; only the roll goes on** (the owner,
 * 2026-09-28).
 */
import { describe, expect, it } from "vitest";
import { seatLockAllows, type GripChannel } from "@input/seat_lock";

const ALL: GripChannel[] = ["TRANSLATE", "ROTATE", "LIFT", "ROLL", "ZOOM", "TAP"];

describe("⭐⭐⭐ `D139` — seatLockAllows", () => {
  it("⭐ a LOCKED grip keeps the roll and nothing else (the owner: 'except roll which can still continue')", () => {
    expect(ALL.filter((c) => seatLockAllows(true, c))).toEqual(["ROLL"]);
  });

  it("⛔ the translation is refused — RED: it carried on and dragged Pioneer and Follower together (`D102`)", () => {
    expect(seatLockAllows(true, "TRANSLATE")).toBe(false);
    expect(seatLockAllows(true, "LIFT")).toBe(false);
  });

  it("⭐ an unlocked grip drives everything, as before", () => {
    expect(ALL.every((c) => seatLockAllows(false, c))).toBe(true);
  });
});
