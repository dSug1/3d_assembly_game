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
  tapTogglesBehaviour,
  toggleBehaviour,
  type Assignment,
} from "@input/assignment";
import * as assignment from "@input/assignment";
import { modeFor } from "@input/depth_translate";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";

const A: Assignment = "ONE_FINGER_TRANSLATE";
const B: Assignment = "TWO_FINGER_TRANSLATE";
const C: Assignment = "TAP_TOGGLE";

describe("assignmentOf — the flag reads as a fork", () => {
  it("0 is fork A — and ⛔ FORK C IS NOW THE SHIPPED DEFAULT", () => {
    // ⭐⭐ THE DEFAULT IS ASSERTED, not assumed, and this vector has now changed ONCE — on
    // 2026-09-16, when the owner chose fork C after driving all three. ⚠ It is the guard
    // that makes a default change a DELIBERATE act: anyone editing `DEFAULT_CONFIG` has to
    // come here and say so, which is how a shipped behaviour stops moving by accident.
    expect(assignmentOf(0)).toBe(A);
    expect(assignmentOf(DEFAULT_CONFIG.touchpointAssignment)).toBe(C);
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

describe("⛔⛔ FORK C — WHICH taps toggle, and it is now ALL of them", () => {
  // ⚠ This block was titled *"the tap is CONSUMED, or two toggles reset the camera"* while
  // that rule existed. It was retired when the double tap stopped being a toggle, and the
  // title is corrected rather than left describing a rule the code no longer has.
  it("only fork C toggles", () => {
    // ⭐ A and B must be untouched: a tap outside while holding is their camera double-tap.
    expect(tapTogglesBehaviour(A, true)).toBe(false);
    expect(tapTogglesBehaviour(B, true)).toBe(false);
    expect(tapTogglesBehaviour(C, true)).toBe(true);
  });

  it("⛔ a PRESS does not toggle — it keeps every meaning it already has", () => {
    // ⭐ The owner's own split: *"second touchpoint pressed (not tapped) same behavior as
    // current (depth translation, roll, …)"*.
    expect(tapTogglesBehaviour(C, false)).toBe(false);
  });

  it("⛔⛔ ANY TAP TOGGLES — including with NOTHING HELD, and this vector was INVERTED", () => {
    // ⭐⭐ IT ASSERTED THE OPPOSITE UNTIL 2026-09-16, on two arguments I had written down:
    // that a *second* touchpoint presupposes a first, and that the camera double-tap had to
    // stay reachable on an empty scene. ⛔ The owner overruled both: *"a single tap by one
    // only touchpoint anywhere also toggles the movement behavior."*
    // ⭐ The first argument dissolved when the toggle became a session MODE — setting it
    // with an empty hand is now the useful case, since it is what the next grab inherits.
    // ⭐ The second was already answered by the accepted trade: a double tap toggles twice
    // (back where it started) AND resets the camera. Nothing became unreachable.
    // ⚠ The `holderPresent` parameter is GONE, not ignored — a dead argument named after a
    // condition a hand overruled is an invitation to wire it back.
    expect(tapTogglesBehaviour(C, true)).toBe(true);
    expect(Object.keys(assignment)).toContain("tapTogglesBehaviour");
    expect(tapTogglesBehaviour.length).toBe(2);
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

describe("⛔⛔ THE TOGGLE IS IMMEDIATE, and a double tap simply toggles TWICE", () => {
  // ⭐⭐ DEVICE-CORRECTED 2026-09-16, and this suite REPLACES one that asserted the
  // opposite. A deferral was built — a tap armed a toggle that fired only after
  // `doubleTapWindow` with no second tap, so a double tap could be told from two singles
  // before anything moved — and a hand rejected it: *"there is a lag when the second
  // touchpoint is tapped and the behavior change. It shall be immediate."*
  // ⛔ The owner's accepted worst case, in their words: *"a double tap occurs and the
  // behavior and movement can be reverted back while the camera orbit resets."*
  // ⭐⭐⭐ Which is what Unity's own `Tap` does — it *"does not wait to detect a second
  // tap"* — chosen here deliberately rather than inherited.

  it("⭐ ONE tap switches the mode, with nothing to wait for", () => {
    expect(toggleBehaviour("TRANSLATE")).toBe("ROTATE");
  });

  it("⛔⛔ TWO taps REVERT — the accepted worst case, as an invariant", () => {
    // ⭐ A double tap is two taps, each acting at once, so the mode returns to where it
    // started. ⚠ The camera reset that fires alongside it is wiring, and no vector reaches
    // it — stated rather than implied.
    for (const start of ["TRANSLATE", "ROTATE"] as const) {
      expect(toggleBehaviour(toggleBehaviour(start))).toBe(start);
    }
  });

  it("⛔ there is NO deferral left in the module surface to wire back by accident", () => {
    // ⭐⭐ A GUARD ON A RETRACTION, and it has to read the real surface to be worth
    // anything. The deferral's functions were DELETED, not disabled, so a later session
    // cannot reintroduce them believing they were dormant and intended.
    for (const gone of ["pendingAfterTap", "toggleDue"]) {
      expect(Object.keys(assignment)).not.toContain(gone);
    }
  });

  it("⚠ the inter-tap window still MEANS something — it is §1.3's, not the toggle's", () => {
    // ⛔ `isTapRelease` still bounds a tap's own duration and travel; `TapHistory` still
    // pairs two of them inside `doubleTapWindow` for the camera reset. ⭐ What changed is
    // only that the toggle no longer waits for that verdict.
    expect(isTapRelease(0, 0, 0, 100, 1, 1, 250, 10)).toBe(true);
    expect(isTapRelease(0, 0, 0, 400, 1, 1, 250, 10)).toBe(false);
  });
});

describe("⛔⛔ FORK C's MODE IS STICKY — it survives a release", () => {
  // ⭐⭐ DEVICE-CORRECTED 2026-09-16: *"when the first touchpoint is released and pressed
  // again, the movement automatically resets to translation. I would expect the movement
  // resumes the behavior as it was prior to release."*
  // ⚠ I had read the owner's *"for one single ongoing touchpoint"* as *the toggle dies with
  // the gesture* and put the state on the grip. It is a MODE.

  it("⭐ the session default is the only place TRANSLATE is imposed", () => {
    // ⛔ `initialBehaviour` is now read ONCE per session, not once per gesture. That is
    // wiring — the variable lives in `scene.ts` — so what is vectorable is the intent: there
    // is exactly one initialiser, and nothing here resets a mode mid-session.
    expect(initialBehaviour()).toBe("TRANSLATE");
  });

  it("⚠ the stickiness itself is WIRING, and this says so rather than pretending", () => {
    // ⛔ The mode lives in `scene.ts`, initialised once per session — no vector here can
    // reach that, and an earlier draft of this test tried to imply it from the module's
    // surface. ⭐ It asserted that nothing here "knows about a gesture", which is FALSE:
    // `isTapRelease` takes a release by design. A vector built on a false premise is worse
    // than none, so what remains is the true part: the only mutator is the toggle.
    let mode = initialBehaviour();
    mode = toggleBehaviour(mode);
    expect(mode).toBe("ROTATE");
  });
});
