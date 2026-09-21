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
  pairPressRevertsToggle,
  toggleBehaviour,
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
    // ⚠ `pressTogglesMode` joined this list with `D58` and `releaseTogglesMode` with `D64`,
    // each an ADDITION made on purpose. ⛔ Both LEFT it with `D66` on 2026-09-21, which is the
    // same vector doing the same job in the other direction: the surface shrinks by decision.
    // ⚠ `pairPressRevertsToggle` joined it with `D68` (2026-09-21) — an ADDITION made on
    // purpose, listed so the surface changes by decision and not by accident.
    expect(surface.sort()).toEqual([
      "initialBehaviour",
      "isTapRelease",
      "pairPressRevertsToggle",
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

describe("⛔⛔⛔ `D66` — A PRESS DOES NOT TOGGLE THE MODE, AND THE RULE IS `D28` AGAIN", () => {
  // ⛔⛔ THE OWNER, 2026-09-21, after two fixes aimed at the wrong event:
  //
  //   *"i toggle translation mode, i translate follower with first touch then press second
  //    touch outside any object then translate in depth with second touch and when i release
  //    second touch, follower switches to rotation mode."*
  //   *"A press never toggles while a body is held, but a tap by the second touchpoint can (as
  //    per present rule for tap)."*
  //
  // ⭐⭐⭐ THE MODE HAD FLIPPED ON THE **PRESS** (`D58`), AND `translatesOnDrag` HID IT until
  // the second finger lifted — which is why it was reported as a release, twice. ⛔ `D58`,
  // `D61`, `D64` and `D65` are all repealed; the suites that tested them are deleted with them,
  // because a vector whose subject is gone certifies nothing.

  it("⛔⛔⛔ THE DELETED RULES ARE GONE FROM THE SURFACE, not left dormant", () => {
    // ⭐ The same guard the tap DEFERRAL and the FORK machinery get: *deleted, not disabled*,
    // and a reappearance means somebody believed it was intended.
    const surface = Object.keys(modeToggle);
    for (const gone of ["pressTogglesMode", "releaseTogglesMode"]) {
      expect(surface).not.toContain(gone);
    }
  });

  it("⭐⭐ and the toggle's own arithmetic is untouched — a tap flips, two taps revert", () => {
    // ⚠ What a tap DOES was never the defect; WHICH EVENT toggles was. This is the whole of
    // the rule that remains, and it is `D27`/`D28`'s.
    const boot = initialBehaviour();
    expect(toggleBehaviour(boot)).not.toBe(boot);
    expect(toggleBehaviour(toggleBehaviour(boot))).toBe(boot);
  });
});


describe("⛔⛔⛔ `D68` — A DOUBLE TAP REVERTS THE MODE EVEN WHEN THE SECOND HALF NEVER LIFTS", () => {
  // ⛔⛔ THE OWNER, 2026-09-21: *"if i double tap without release the pioneer and press the
  // follower → orange, the translation/rotation mode toggles: it should not toggle. (Note that
  // if I press the pioneer and then press the follower → cyan, the mode does not toggle which is
  // correct)."*
  //
  // ⭐⭐⭐ AN INVARIANT BREAK, NOT A NEW RULE. `D28` accepted *two taps revert* — and `D67`'s
  // route to orange is a double tap whose second half never lifts, so the second toggle never
  // happened and the pair left the mode flipped.

  it("⭐⭐⭐ a press that completes a pair undoes the first tap's toggle", () => {
    expect(pairPressRevertsToggle(true, true)).toBe(true);
  });

  it("⛔⛔ BUT ONLY IF THAT TAP ACTUALLY TOGGLED — the two facts are not one", () => {
    // ⚠⚠ *Was there a first tap* and *did it toggle* are different questions: a tap consumed
    // by an alignment toggles nothing, and undoing it would flip the mode the hand had. ⛔ This
    // is the vector that keeps the rule from inferring the second from the first.
    expect(pairPressRevertsToggle(true, false)).toBe(false);
  });

  it("⚠ and an ordinary press — no pair — never touches the mode (`D66` stands)", () => {
    expect(pairPressRevertsToggle(false, true)).toBe(false);
    expect(pairPressRevertsToggle(false, false)).toBe(false);
  });

  it("⭐⭐ THE COMPOSITION: both readings of the gesture end where they started", () => {
    // ⛔ A truth table is not enough here — the CLAIM is about the mode after a whole gesture,
    // so it is composed: a tap toggles, and the completing press undoes exactly that.
    const boot = initialBehaviour();
    let mode = boot;
    // tap #1 — the release toggles
    mode = toggleBehaviour(mode);
    expect(mode).not.toBe(boot);
    // press #2 completes the pair and reverts, and its own release is spent
    if (pairPressRevertsToggle(true, true)) mode = toggleBehaviour(mode);
    expect(mode).toBe(boot);
  });
});
