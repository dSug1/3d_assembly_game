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
  initialBehaviour,
  isTapRelease,
  pendingAfterTap,
  tapTogglesBehaviour,
  toggleBehaviour,
  toggleDue,
  type Assignment,
  type PendingToggle,
} from "@input/assignment";
import { modeFor } from "@input/depth_translate";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";

const A: Assignment = "ONE_FINGER_TRANSLATE";
const B: Assignment = "TWO_FINGER_TRANSLATE";
const C: Assignment = "TAP_TOGGLE";

describe("assignmentOf — the flag reads as a fork", () => {
  it("0 is fork A, and it is the SHIPPED DEFAULT", () => {
    // ⭐ The default is the reading a hand has judged (2026-09-16). A device-approved
    // behaviour must not become reachable-only-by-flag because a new option arrived.
    expect(assignmentOf(0)).toBe(A);
    expect(assignmentOf(DEFAULT_CONFIG.touchpointAssignment)).toBe(A);
  });

  it("1 is fork B, the spec's own assignment", () => {
    expect(assignmentOf(1)).toBe(B);
  });

  it("2 is fork C, the tap toggle", () => {
    expect(assignmentOf(2)).toBe(C);
  });

  it("⚠ anything unrecognised reads as fork A — which is WHY the validator exists", () => {
    // ⛔ This function cannot refuse: it has no error channel and runs per frame. So an
    // out-of-range flag reads as the default, and `validateGestureConfig` is what stops one
    // ever reaching here. The two vectors are a PAIR; neither is sufficient alone.
    expect(assignmentOf(7)).toBe(A);
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

  it("⭐ fork C has a name of its own on the readout", () => {
    expect(assignmentLabel(C)).toBe("tap-toggle");
  });

  it("⭐ the labels name the fork, not the flag value", () => {
    // ⚠ A HUD reading `touchpointAssignment=1` would make a device report say "1",
    // which is unattributable a week later. The fork has a name in every document.
    expect(assignmentLabel(A)).toBe("one-finger-translate");
    expect(assignmentLabel(B)).toBe("two-finger-translate");
  });
});

describe("⛔ the validator refuses a half-set flag", () => {
  it("accepts 0, 1 and 2", () => {
    for (const v of [0, 1, 2]) {
      expect(() =>
        validateGestureConfig({ ...DEFAULT_CONFIG, touchpointAssignment: v }),
      ).not.toThrow();
    }
  });

  it("⛔⛔ refuses anything between or beyond — it selects a RULE TABLE, not a range", () => {
    // ⭐ Without this, `assignmentOf` reads anything it does not recognise as fork A, so
    // `1.5` or `3` would LOOK like the default while the person who set it believed the rule
    // table had changed. ⚠ Reachable from a URL, and from a slider whose step is edited.
    // ⭐⭐ `2` moved from this list into the accepted one when fork C arrived, and THIS
    // VECTOR IS WHAT CAUGHT THE CHANGE — which is what a vector is for.
    for (const v of [0.5, 1.5, 3, -1, Number.NaN]) {
      expect(() =>
        validateGestureConfig({ ...DEFAULT_CONFIG, touchpointAssignment: v }),
      ).toThrow(/touchpointAssignment/);
    }
  });
});

describe("⭐⭐⭐ FORK C — a TAPPED second touchpoint toggles the ongoing drag", () => {
  it("a gesture STARTS as translate — fork A's behaviour, so rotation costs a tap", () => {
    // ⚠ A vector because it is a TRADE, not an implementation detail: in fork C every
    // rotation is preceded by a tap, and that is what the fork has to be judged on.
    expect(initialBehaviour()).toBe("TRANSLATE");
  });

  it("each tap flips it, and two taps return", () => {
    expect(toggleBehaviour("TRANSLATE")).toBe("ROTATE");
    expect(toggleBehaviour("ROTATE")).toBe("TRANSLATE");
    expect(toggleBehaviour(toggleBehaviour("TRANSLATE"))).toBe("TRANSLATE");
  });

  it("⛔⛔ FORK C IGNORES PRESENCE — that is the whole of fork C", () => {
    // ⭐⭐ In A and B the mode is a function of whether a second touchpoint is DOWN. In C it
    // is not a function of that at all: a held second finger keeps only the meanings it
    // already has (depth while the holder is still, roll on its x), and the holder's own
    // drag is governed by the toggle.
    for (const present of [true, false]) {
      expect(modeFor(C, present, "TRANSLATE")).toBe("TRANSLATE");
      expect(modeFor(C, present, "ROTATE")).toBe("ROTATE");
    }
  });

  it("⭐ and forks A and B ignore the toggle, symmetrically", () => {
    // ⛔ THE CONTAINMENT THE THIRD FORK DEPENDS ON. If a toggle value could leak into A or
    // B, fork C's per-gesture state would start changing the two forks that are already
    // approved — and only after a tap, which is the hardest kind of interference to
    // reproduce on a device.
    for (const t of ["TRANSLATE", "ROTATE"] as const) {
      expect(modeFor(A, false, t)).toBe("TRANSLATE");
      expect(modeFor(A, true, t)).toBe("ROTATE");
      expect(modeFor(B, false, t)).toBe("ROTATE");
      expect(modeFor(B, true, t)).toBe("TRANSLATE");
    }
  });

  it("⛔⛔ A AND B ARE STILL EXACT OPPOSITES — the third fork did not disturb them", () => {
    for (const present of [true, false]) {
      expect(modeFor(A, present, "TRANSLATE")).not.toBe(modeFor(B, present, "TRANSLATE"));
    }
  });
});

describe("⛔⛔ FORK C — the tap is CONSUMED, or two toggles reset the camera", () => {
  it("only fork C toggles", () => {
    // ⭐ A and B must be untouched: a tap outside while holding is their camera double-tap.
    expect(tapTogglesBehaviour(A, true, true)).toBe(false);
    expect(tapTogglesBehaviour(B, true, true)).toBe(false);
    expect(tapTogglesBehaviour(C, true, true)).toBe(true);
  });

  it("⛔ a PRESS does not toggle — it keeps every meaning it already has", () => {
    // ⭐ The owner's own split: *"second touchpoint pressed (not tapped) same behavior as
    // current (depth translation, roll, …)"*.
    expect(tapTogglesBehaviour(C, false, true)).toBe(false);
  });

  it("⛔⛔ WITH NOTHING HELD IT DOES NOT TOGGLE, so the camera reset stays reachable", () => {
    // ⭐⭐ THE COLLISION THIS GUARD EXISTS FOR. Two taps outside any object fly the camera
    // home. If a tap with nothing held were consumed as a toggle, that reset would be
    // unreachable on an empty scene — exactly the scene it is most wanted on. ⚠ And a
    // *second* touchpoint presupposes a first, so there is no ongoing gesture to toggle
    // either: both arguments point the same way.
    expect(tapTogglesBehaviour(C, true, false)).toBe(false);
  });
});

describe("isTapRelease — §1.3's tap test, in one place", () => {
  const DUR = 250;
  const SLOP = 10;

  it("short and still is a tap", () => {
    expect(isTapRelease(0, 100, 100, 200, 103, 104, DUR, SLOP)).toBe(true);
  });

  it("⛔ too long is a PRESS, not a tap — the owner's distinction", () => {
    expect(isTapRelease(0, 100, 100, 251, 100, 100, DUR, SLOP)).toBe(false);
  });

  it("⛔ too far is a drag, not a tap", () => {
    expect(isTapRelease(0, 100, 100, 50, 111, 100, DUR, SLOP)).toBe(false);
  });

  it("⭐ both bounds are INCLUSIVE, and the distance is RADIAL", () => {
    // ⚠ Boundary values, because a threshold the hand parks on gets compared at its exact
    // value — `METHOD`, learned from A11's band. ⭐ 6-8-10 is the radial case: per-axis
    // arithmetic would wave 8 px on each axis through, which is 11.3 px away.
    expect(isTapRelease(0, 0, 0, DUR, 0, 0, DUR, SLOP)).toBe(true);
    expect(isTapRelease(0, 0, 0, 10, 6, 8, DUR, SLOP)).toBe(true);
    expect(isTapRelease(0, 0, 0, 10, 8, 8, DUR, SLOP)).toBe(false);
  });
});

describe("⛔⛔ A DOUBLE TAP IS NOT TWO SINGLE TAPS — discriminated by the time between them", () => {
  // ⭐ The project's window, and Unity's for comparison: `multiTapDelayTime` is 0.75 s and
  // `MultiTapInteraction.tapDelay` defaults to 2 × the single-tap time.
  const WINDOW = 300;

  it("⛔⛔ THE REPORTED DEFECT: a double tap must not toggle TWICE", () => {
    // ⭐⭐ *"Double tap vs two single taps: it shall be discriminated by time between two
    // taps."* The first tap arms a toggle; the second, arriving inside the window, is
    // reported by `TapHistory` as DOUBLE_TAP and must CANCEL it — net ZERO toggles, and the
    // double tap keeps its own meaning.
    let pending: PendingToggle = pendingAfterTap(null, "TAP", true, 1000);
    expect(pending).toBe(1000);
    pending = pendingAfterTap(pending, "DOUBLE_TAP", true, 1150);
    expect(pending).toBeNull();
    // ⛔ And nothing is due afterwards, however long we wait.
    expect(toggleDue(pending, 1150 + 10 * WINDOW, WINDOW)).toBe(false);
  });

  it("⭐ two taps FAR APART are two single taps — two toggles", () => {
    // ⚠ `TapHistory` reports the second as TAP because the gap exceeds the window, so each
    // one settles on its own. This is the other half of the owner's sentence.
    let pending: PendingToggle = pendingAfterTap(null, "TAP", true, 1000);
    expect(toggleDue(pending, 1000 + WINDOW + 1, WINDOW)).toBe(true);
    pending = null; // fired
    pending = pendingAfterTap(pending, "TAP", true, 5000);
    expect(toggleDue(pending, 5000 + WINDOW + 1, WINDOW)).toBe(true);
  });

  it("⛔ a single tap is NOT due before the window has passed", () => {
    // ⭐⭐ THE WHOLE POINT: until the window expires, the tap might still become half of a
    // pair. Acting early is what produced the defect.
    const pending = pendingAfterTap(null, "TAP", true, 1000);
    expect(toggleDue(pending, 1000, WINDOW)).toBe(false);
    expect(toggleDue(pending, 1299, WINDOW)).toBe(false);
  });

  it("⚠ the boundary is STRICTLY greater, so the two verdicts cannot both be true", () => {
    // ⛔ `TapHistory` pairs on `gap <= doubleTapWindow`. Firing AT the boundary would make
    // one instant both a settled single tap and the first half of a double.
    // ⭐ `METHOD`: a threshold the state machine parks on gets compared at its exact value.
    const pending = pendingAfterTap(null, "TAP", true, 0);
    expect(toggleDue(pending, WINDOW, WINDOW)).toBe(false);
    expect(toggleDue(pending, WINDOW + 1, WINDOW)).toBe(true);
  });

  it("nothing pending is never due", () => {
    expect(toggleDue(null, 1e9, WINDOW)).toBe(false);
  });

  it("⛔ an unarmed tap leaves the pending state ALONE, and does not arm one", () => {
    // ⚠ Forks A and B, and fork C with nothing held. The tap still goes through §1.3's
    // history — the camera double-tap must keep working — it simply arms no toggle.
    expect(pendingAfterTap(null, "TAP", false, 1000)).toBeNull();
    // ⭐ And an unarmed DOUBLE still cancels: whatever armed the pending tap, the pair that
    // followed was not a single tap.
    expect(pendingAfterTap(1000, "DOUBLE_TAP", false, 1100)).toBeNull();
  });

  it("⭐ a second armed tap outside the window REPLACES the pending one", () => {
    // ⚠ Three slow taps must be three toggles, not one: each supersedes the last, and the
    // one in flight has already fired by then.
    const first = pendingAfterTap(null, "TAP", true, 1000);
    const second = pendingAfterTap(first, "TAP", true, 9000);
    expect(second).toBe(9000);
  });
});
