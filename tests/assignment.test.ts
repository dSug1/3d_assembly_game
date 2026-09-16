/**
 * GOLDEN VECTORS — the `1.0.5` touchpoint assignment, and its latch.
 *
 * ⭐⭐ The owner's rule is the thing under test: **the fork may change only while nothing is
 * touching the glass.** ⛔ It is stricter than latching at press, and the vectors say why —
 * at press, a flip between two fingers landing would still swap the meaning of a gesture
 * that had already begun.
 */
import { describe, expect, it } from "vitest";
import {
  adoptAssignment,
  assignmentLabel,
  assignmentOf,
  assignmentPending,
  type Assignment,
} from "@input/assignment";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";

const A: Assignment = "ONE_FINGER_TRANSLATE";
const B: Assignment = "TWO_FINGER_TRANSLATE";

describe("assignmentOf — the flag reads as a fork", () => {
  it("0 is fork A, and it is the SHIPPED DEFAULT", () => {
    // ⭐ The default is the reading a hand has judged (2026-09-16). A device-approved
    // behaviour must not become reachable-only-by-flag because a new option arrived.
    expect(assignmentOf(0)).toBe(A);
    expect(assignmentOf(DEFAULT_CONFIG.translateNeedsSecondTouch)).toBe(A);
  });

  it("1 is fork B, the spec's own assignment", () => {
    expect(assignmentOf(1)).toBe(B);
  });
});

describe("⛔⛔ adoptAssignment — the latch the owner specified", () => {
  it("⭐ an empty glass adopts the request", () => {
    expect(adoptAssignment(A, B, 0)).toBe(B);
    expect(adoptAssignment(B, A, 0)).toBe(A);
  });

  it("⛔⛔ ONE finger down refuses it — a gesture may be in flight", () => {
    // ⭐⭐ THE OWNER'S RULE, AS THE VECTOR THAT MATTERS. Swapping which finger translates
    // while a finger is already dragging changes what the gesture in progress MEANS, and
    // the user cannot un-mean it. `METHOD`: acting is irreversible.
    expect(adoptAssignment(A, B, 1)).toBe(A);
  });

  it("⛔ and so does a whole hand", () => {
    for (const n of [2, 3, 5]) expect(adoptAssignment(A, B, n)).toBe(A);
  });

  it("⭐⭐ a flip made mid-gesture is DEFERRED, not dropped", () => {
    // ⚠ The sequence a device pass will actually produce: flip the menu with one finger
    // still on the glass, lift, then touch again. The request must survive the wait, or
    // the toggle would silently need pressing twice.
    let live: Assignment = adoptAssignment(A, B, 1); // flipped mid-drag → held back
    expect(live).toBe(A);
    live = adoptAssignment(live, B, 0); // the finger lifts → it lands
    expect(live).toBe(B);
  });

  it("⭐ it is idempotent while nothing changes", () => {
    let live: Assignment = A;
    for (let i = 0; i < 5; i++) live = adoptAssignment(live, A, 0);
    expect(live).toBe(A);
  });

  it("⛔ it is a LATCH, not a toggle — re-adopting the same value cannot flip it", () => {
    // ⚠ The counter-example for an implementation that XOR'd or negated instead of
    // assigning: that reads identically on the first call and inverts on the second.
    expect(adoptAssignment(B, B, 0)).toBe(B);
    expect(adoptAssignment(B, B, 1)).toBe(B);
  });
});

describe("assignmentPending — the gap must be visible", () => {
  it("true exactly while the request differs from what is in force", () => {
    expect(assignmentPending(A, B)).toBe(true);
    expect(assignmentPending(A, A)).toBe(false);
  });

  it("⭐ the labels name the fork, not the flag value", () => {
    // ⚠ A HUD reading `translateNeedsSecondTouch=1` would make a device report say "1",
    // which is unattributable a week later. The fork has a name in every document.
    expect(assignmentLabel(A)).toBe("one-finger-translate");
    expect(assignmentLabel(B)).toBe("two-finger-translate");
  });
});

describe("⛔ the validator refuses a half-set flag", () => {
  it("accepts 0 and 1", () => {
    for (const v of [0, 1]) {
      expect(() =>
        validateGestureConfig({ ...DEFAULT_CONFIG, translateNeedsSecondTouch: v }),
      ).not.toThrow();
    }
  });

  it("⛔⛔ refuses anything between or beyond — it selects a RULE TABLE, not a range", () => {
    // ⭐ Without this, `assignmentOf` reads everything except 1 as fork A: 0.5 or 2 would
    // LOOK like the default while the person who set it believed the rule table had
    // changed. ⚠ Reachable for real from a URL, and from a slider whose step is edited.
    for (const v of [0.5, 2, -1, Number.NaN]) {
      expect(() =>
        validateGestureConfig({ ...DEFAULT_CONFIG, translateNeedsSecondTouch: v }),
      ).toThrow(/translateNeedsSecondTouch/);
    }
  });
});
