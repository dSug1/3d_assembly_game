/**
 * GOLDEN VECTORS — the movement mode, and the tap that flips it.
 *
 * ⛔⛔ **THIS FILE REPLACES `assignment.test.ts`, WHICH TESTED THREE FORKS.** From `1.0.5` to
 * `1.0.7` one flag selected between fork A (one touchpoint translates), fork B (the spec's
 * inversion) and fork C (this tap toggle), so a hand could compare them in the same minute.
 * ⭐ The owner closed fork C on the glass and chose it (`D28`), so A, B, the flag, its latch
 * and their suites are **deleted** — not disabled, because a dormant fork is a trap.
 * ⚠ The forks' account is one tier down, in `Claude/00_CORE/queue_notes/IN13.md`.
 */
import { describe, expect, it } from "vitest";
import {
  initialBehaviour,
  isTapRelease,
  pressTogglesMode,
  toggleBehaviour,
  type PressToggleContext,
} from "@input/mode_toggle";
import * as modeToggle from "@input/mode_toggle";

describe("the mode a session starts in", () => {
  it("⭐⭐ ROTATE — the owner's default, confirmed twice", () => {
    // ⛔⛔ **THIS VECTOR PINNED THE WRONG VALUE FOR A DAY, AND THAT IS WHY IT IS WORTH A
    // COMMENT.** The owner said *"Default start: rotation mode"* on 2026-09-16; `CLAUDE.md`
    // and `scene.ts`'s comment both recorded `ROTATE`; the function returned `TRANSLATE` and
    // **this vector asserted the returned value rather than the decision**. ⭐ So the suite
    // was green, the documents were right, and the product booted in the other mode — the
    // *fix beside the defect* shape, in its purest form: nothing was ever fixed here at all,
    // the COMMENT moved and the code did not.
    // ⭐⭐ `METHOD`: *a vector that is written from the code it tests cannot contradict it.*
    // Re-confirmed by the owner 2026-09-17: *"I confirm the scene shall boot in rotation
    // mode, not translation mode."*
    expect(initialBehaviour()).toBe("ROTATE");
  });
});

describe("⛔⛔ THE TOGGLE IS IMMEDIATE, and a double tap simply flips TWICE", () => {
  // ⭐⭐ THREE FORMULATIONS, EACH CORRECTED BY A HAND. (1) toggle at once, CONSUMING the tap
  // so two toggles could not reset the camera → a double tap flipped twice and the
  // double-tap gesture could never form. (2) a single tap HELD for `doubleTapWindow` and
  // cancelled by a second — correct, and Unity's own parameter → *"there is a lag … it shall
  // be immediate."* (3) immediate again, with the consequence accepted in the owner's words:
  // *"worst case, a double tap occurs and the behavior and movement can be reverted back
  // while the camera orbit resets."*

  it("⭐ ONE tap switches the mode, with nothing to wait for", () => {
    expect(toggleBehaviour("TRANSLATE")).toBe("ROTATE");
    expect(toggleBehaviour("ROTATE")).toBe("TRANSLATE");
  });

  it("⛔⛔ TWO taps REVERT — the accepted worst case, as an invariant", () => {
    // ⚠ The camera reset that fires alongside it is wiring, and no vector reaches it —
    // stated rather than implied.
    for (const start of ["TRANSLATE", "ROTATE"] as const) {
      expect(toggleBehaviour(toggleBehaviour(start))).toBe(start);
    }
  });

  it("⛔ THE RETIRED MACHINERY IS GONE FROM THE SURFACE, not left dormant", () => {
    // ⭐⭐ A GUARD ON THREE RETRACTIONS AT ONCE, and it has to read the real surface to be
    // worth anything: the tap DEFERRAL (`pendingAfterTap`, `toggleDue`) that a hand felt as
    // lag, and the FORK machinery (`assignmentOf`, `adoptAssignment`, `holderDrive`) that
    // `D28` deleted. ⛔ Any of them reappearing means somebody believed it was dormant and
    // intended, which is exactly what deletion is meant to prevent.
    const surface = Object.keys(modeToggle);
    for (const gone of [
      "pendingAfterTap",
      "toggleDue",
      "assignmentOf",
      "adoptAssignment",
      "assignmentPending",
      "assignmentLabel",
      "tapTogglesBehaviour",
    ]) {
      expect(surface).not.toContain(gone);
    }
    // ⭐ And what SHOULD be there, so the guard cannot pass by the module being empty.
    // ⚠ `pressTogglesMode` joined it with `D58` (2026-09-19) — an ADDITION, listed here on
    // purpose: this vector exists so a change to the surface is a decision somebody makes, not
    // something that happens.
    expect(surface.sort()).toEqual([
      "initialBehaviour",
      "isTapRelease",
      "pressTogglesMode",
      "toggleBehaviour",
    ]);
  });
});

describe("⛔⛔ THE MODE IS STICKY — it survives a release", () => {
  // ⭐⭐ DEVICE-CORRECTED 2026-09-16: *"when the first touchpoint is released and pressed
  // again, the movement automatically resets to translation. I would expect the movement
  // resumes the behavior as it was prior to release."* ⚠ I had read *"for one single ongoing
  // touchpoint"* as *the toggle dies with the gesture* and put the state on the grip.

  it("⚠ the stickiness itself is WIRING, and this says so rather than pretending", () => {
    // ⛔ The latch lives in `scene.ts`, initialised once per session — no vector here can
    // reach that. ⭐ What is true and checkable: the only mutator is the toggle, and
    // `initialBehaviour` is the one place a mode is imposed.
    // ⛔⛔ **AND IT IS ASSERTED AS A *FLIP*, NOT AS A LITERAL** (2026-09-17). This vector used
    // to read `expect(mode).toBe("ROTATE")` after one toggle — which silently encoded the
    // boot value a second time, so correcting `initialBehaviour` reddened a vector that is
    // not about the boot value at all. ⭐ `METHOD`: *a vector states the property it names;
    // a literal borrowed from somewhere else makes it a second, hidden assertion about that
    // somewhere else.*
    const boot = initialBehaviour();
    const once = toggleBehaviour(boot);
    expect(once).not.toBe(boot);
    expect(toggleBehaviour(once)).toBe(boot);
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

describe("⛔⛔⛔ `D58` — A NEW PRESS TOGGLES THE MODE, IN THE OWNER'S TWO PLACES ONLY", () => {
  const ctx = (over: Partial<PressToggleContext> = {}): PressToggleContext => ({
    role: "OUTSIDE",
    somethingIsHeld: true,
    pressedTheHeldBodysPioneerFace: false,
    pressActedOnTheAlignment: false,
    heldBodyIsAlignedFollower: false,
    // ⚠ The fixture's default is *not the first* outside press, so every vector written before
    // `D61` keeps asking the question it was written to ask.
    firstOutsidePressOfThisHold: false,
    ...over,
  });

  it("⭐⭐⭐ a continued press OUTSIDE any object toggles — the owner's second trigger", () => {
    // ⛔ *"a new continued press (= a tap where there is no release) outside any object"*.
    // ⚠ Nothing here asks whether the finger will LIFT: a press and a tap are indistinguishable
    // on the way down, which is the whole reason `D55` exists.
    expect(pressTogglesMode(ctx())).toBe(true);
  });

  it("⭐⭐⭐ a continued press on the held body's EXACT PioneerFace toggles — the third", () => {
    // ⭐ It gives a job to the one press that had none: since `A22` that face returns `NOTHING`
    // unless the press completes a rapid pair. ⚠ BOTH halves are required — right object AND
    // right face — which is what `pressedTheHeldBodysPioneerFace` carries.
    expect(pressTogglesMode(ctx({ role: "OBJECT", pressedTheHeldBodysPioneerFace: true }))).toBe(true);
    // ⛔ Any OTHER object, or any other face of that Pioneer, is an ALIGNMENT gesture — `D55`
    // makes one, `A23` re-points one — and must not also flip the mode.
    expect(pressTogglesMode(ctx({ role: "OBJECT", pressedTheHeldBodysPioneerFace: false }))).toBe(false);
  });

  it("⛔⛔ A PRESS ON THE HELD OBJECT ITSELF DOES NOT — `SECOND` is absent from the list", () => {
    // ⚠⚠ NOT AN OVERSIGHT, AND THE REASON IS `A16`: that finger's channel is chosen by the very
    // mode its arrival would flip, so toggling there would make roll-vs-depth alternate on every
    // touch instead of being chosen. ⛔ The owner's list names outside-any-object and the
    // PioneerFace; this is neither.
    expect(pressTogglesMode(ctx({ role: "SECOND" }))).toBe(false);
  });

  it("⚠ a third touchpoint never toggles — *'wherever a tap triggers the toggle'*, read honestly", () => {
    // ⛔ `IGNORED` runs NOTHING on release by `IN2`'s design — no verdict, no tap history. So no
    // tap triggers a toggle there, and a press must not invent one.
    expect(pressTogglesMode(ctx({ role: "IGNORED" }))).toBe(false);
  });

  it("⛔⛔⛔ NOTHING HELD, NOTHING TOGGLED — the rule is scoped and deliberately asymmetric", () => {
    // ⚠ *"while the first touch is pressed on an object"*. A first press on empty space still
    // toggles only on its RELEASE, exactly as it always has. ⛔ The asymmetry is the owner's.
    for (const role of ["OUTSIDE", "OBJECT", "SECOND", "IGNORED"] as const) {
      expect(pressTogglesMode(ctx({ role, somethingIsHeld: false, pressedTheHeldBodysPioneerFace: true }))).toBe(false);
    }
  });

  it("⛔⛔ AND THE ALIGNMENT WINS THE GESTURE WHENEVER IT ACTED — one gesture, one consequence", () => {
    // ⭐ `A22`'s upgrade to `FOLLOW` fires on a press on that same PioneerFace — the very gesture
    // this rule also claims. ⛔ When it fires, the mode must NOT also flip: the same discipline
    // that made `alignFollowerToPioneer` consume the tap since `D38`.
    expect(
      pressTogglesMode(ctx({ role: "OBJECT", pressedTheHeldBodysPioneerFace: true, pressActedOnTheAlignment: true })),
    ).toBe(false);
    expect(pressTogglesMode(ctx({ pressActedOnTheAlignment: true }))).toBe(false);
  });
});

describe("⛔⛔⛔ `D61` — ON A FREE BODY THE **FIRST** OUTSIDE PRESS OF A HOLD IS INERT", () => {
  const ctx = (over: Partial<PressToggleContext> = {}): PressToggleContext => ({
    role: "OUTSIDE",
    somethingIsHeld: true,
    pressedTheHeldBodysPioneerFace: false,
    pressActedOnTheAlignment: false,
    heldBodyIsAlignedFollower: false,
    firstOutsidePressOfThisHold: false,
    ...over,
  });

  it("⭐⭐⭐ the press that PLACES the depth/roll finger does not flip the mode", () => {
    // ⛔⛔ THE OWNER, 2026-09-19: *"when an object is free (not follower), the first time the
    // second touch is pressed outside any object shall not trigger a toggle."*
    // ⭐⭐ It closes the `A16` collision `D58` opened, and closes it where `D59` could not: on a
    // FREE body the mode still picks whether that finger drives roll or depth, so a toggle on
    // its arrival would change what it is about to do.
    expect(pressTogglesMode(ctx({ firstOutsidePressOfThisHold: true }))).toBe(false);
  });

  it("⭐⭐ but a SECOND outside press during the same hold does toggle — switching stays reachable", () => {
    // ⚠ Without this the mode would be unreachable while holding, and `A16`'s *"switching …
    // shall require the tap"* would have become *switching is impossible*. ⛔ The cost of a
    // switch is now a lift and a re-press — a press standing in for the tap, which is the whole
    // of `D55`'s sweep.
    expect(pressTogglesMode(ctx({ firstOutsidePressOfThisHold: false }))).toBe(true);
  });

  it("⛔⛔ A FOLLOWER IS EXEMPT — its first outside press toggles, and that is deliberate", () => {
    // ⭐ `D59` took the mode out of a Follower's channel selection: the second touch gives roll
    // AND depth whatever the mode, so there is nothing left for a toggle to disturb.
    // ⚠ The asymmetry is the owner's own scoping — *"when an object is free (not follower)"*.
    expect(pressTogglesMode(ctx({ heldBodyIsAlignedFollower: true, firstOutsidePressOfThisHold: true }))).toBe(true);
  });

  it("⚠ the exemption is OUTSIDE-only — it cannot reach the PioneerFace trigger", () => {
    // ⛔ `D58`'s third trigger is an `OBJECT` press on the aligned face. `D61` is a rule about
    // the finger that drives depth/roll, which never lands there.
    expect(
      pressTogglesMode(ctx({ role: "OBJECT", pressedTheHeldBodysPioneerFace: true, firstOutsidePressOfThisHold: true })),
    ).toBe(true);
  });

  it("⚠ and it never RESURRECTS a toggle the earlier rules refused", () => {
    // ⛔ Order matters: nothing held, or an alignment that acted, still wins over `D61`.
    expect(pressTogglesMode(ctx({ somethingIsHeld: false, firstOutsidePressOfThisHold: false }))).toBe(false);
    expect(pressTogglesMode(ctx({ pressActedOnTheAlignment: true }))).toBe(false);
    expect(pressTogglesMode(ctx({ role: "SECOND" }))).toBe(false);
  });
});
