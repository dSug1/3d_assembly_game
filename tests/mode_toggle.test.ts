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
  tapReleaseToggles,
  toggleBehaviour,
  type Behaviour,
} from "@input/mode_toggle";
import * as modeToggle from "@input/mode_toggle";

describe("the mode a session starts in", () => {
  it("⭐⭐ TRANSLATE — `D71`, the owner's instruction of 2026-09-22", () => {
    // ⭐⭐⭐ **THE QUOTE IS THE ASSERTION.** *"Set the default to translation mode at scene
    // boot."* ⛔ This line exists to state the DECISION, and it is written from that sentence
    // rather than from `initialBehaviour`'s body — which is the whole lesson of the day this
    // vector got it wrong.
    //
    // ⛔⛔ **THIS VECTOR PINNED THE WRONG VALUE FOR A DAY, AND THE ACCOUNT IS KEPT.** The owner
    // said *"Default start: rotation mode"* on 2026-09-16; `CLAUDE.md` and `scene.ts`'s comment
    // both recorded `ROTATE`; the function returned `TRANSLATE` and **this vector asserted the
    // returned value rather than the decision**. ⭐ So the suite was green, the documents were
    // right, and the product booted in the other mode — the *fix beside the defect* shape, in
    // its purest form: nothing was ever fixed here at all, the COMMENT moved and the code did
    // not. Re-confirmed 2026-09-17: *"I confirm the scene shall boot in rotation mode."*
    // ⭐⭐ `METHOD`: *a vector that is written from the code it tests cannot contradict it.*
    //
    // ⚠⚠ **AND THE VALUE IS NOW THE ONE THE DEFECT USED TO RETURN, WHICH IS WORTH SAYING OUT
    // LOUD.** A reader who finds `TRANSLATE` here and remembers the audit will suspect a
    // regression. ⛔ It is not one: the 2026-09-17 defect was a DISAGREEMENT between a human
    // sentence and the code, and the test for it is not the value but whether any instruction
    // still asks for the other mode. None does — `D71` supersedes both earlier ones.
    expect(initialBehaviour()).toBe("TRANSLATE");
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
    // ⚠⚠ `tapReleaseToggles` joined it on **2026-09-23**, and it is the other half of that same
    // decision: `D68` said a reverting press spends its own release, and the fact lived in a
    // `Set` in `scene.ts` that nothing read. ⛔ It is here now because a rule in a render file
    // is a rule nothing can interrogate — including this vector.
    expect(surface.sort()).toEqual([
      "initialBehaviour",
      "isTapRelease",
      "pairPressRevertsToggle",
      "tapReleaseToggles",
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

describe("⛔⛔⛔ `D68` WHOLE — the two halves, and the SEQUENCES a hand actually performs", () => {
  /**
   * ⭐⭐ **A MODEL OF THE SCENE'S THREADING, AND IT SAYS SO.** These vectors drive the two pure
   * rules in the order `scene.ts` drives them. ⚠ That makes them a *second implementation* of
   * the wiring — the risk `METHOD` names — so they are written to assert the NET MODE after a
   * whole gesture, which is the only thing a hand can see, and never the intermediate flags.
   * ⛔ What they cannot prove is that the render layer threads it this way; what they CAN do is
   * state what the sequence must come to, which is what nobody wrote down for two days.
   */
  const run = (
    events: readonly ("tap" | "press-pairs" | "release-after-pair" | "align-tap")[],
  ): Behaviour => {
    let behaviour: Behaviour = "TRANSLATE";
    let lastTapToggled = false;
    let spent = false;
    for (const e of events) {
      if (e === "press-pairs") {
        if (pairPressRevertsToggle(true, lastTapToggled)) {
          behaviour = toggleBehaviour(behaviour);
          lastTapToggled = false;
          spent = true;
        }
      } else if (e === "align-tap") {
        // ⭐ A tap consumed by an alignment: it toggles nothing and arms nothing.
        if (tapReleaseToggles(spent, true)) throw new Error("an aligned tap must not toggle");
        spent = false;
      } else {
        // a tap RELEASE — `tap` is a plain one, `release-after-pair` follows a reverting press
        if (tapReleaseToggles(spent, false)) {
          behaviour = toggleBehaviour(behaviour);
          lastTapToggled = true;
        }
        spent = false;
      }
    }
    return behaviour;
  };

  it("⭐ one tap flips the mode", () => {
    expect(run(["tap"])).toBe("ROTATE");
  });

  it("⭐⭐⭐ A COMPLETED DOUBLE TAP ENDS WHERE IT STARTED — the second half of the defect", () => {
    // ⛔ toggle → the press reverts → **the release is spent**. ⚠ Until 2026-09-23 the last step
    // toggled again, because the `Set` recording *spent* was written and never read, so this
    // sequence finished on `ROTATE` and a hand saw the mode flip after a double tap.
    expect(run(["tap", "press-pairs", "release-after-pair"])).toBe("TRANSLATE");
  });

  it("⭐⭐⭐ A DOUBLE TAP WHOSE SECOND HALF NEVER LIFTS ALSO ENDS WHERE IT STARTED", () => {
    // ⛔ `D67`'s route to orange, and the gesture the owner reported: the second press is still
    // down when the Follower is touched. ⚠ It only works because the FIRST tap armed the
    // revert — and a tap on the **Pioneer** is a tap on an OBJECT, which was the path that did
    // not arm it.
    expect(run(["tap", "press-pairs"])).toBe("TRANSLATE");
  });

  it("⛔ a tap CONSUMED BY AN ALIGNMENT toggles nothing, and leaves nothing to revert", () => {
    expect(run(["align-tap"])).toBe("TRANSLATE");
    expect(run(["align-tap", "press-pairs"])).toBe("TRANSLATE");
  });

  it("⛔ the predicate itself — all four combinations, since neither flag alone decides", () => {
    expect(tapReleaseToggles(false, false)).toBe(true);
    expect(tapReleaseToggles(true, false)).toBe(false);
    expect(tapReleaseToggles(false, true)).toBe(false);
    expect(tapReleaseToggles(true, true)).toBe(false);
  });
});
