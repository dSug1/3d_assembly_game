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
import { initialBehaviour, isTapRelease, toggleBehaviour } from "@input/mode_toggle";
import * as modeToggle from "@input/mode_toggle";

describe("the mode a session starts in", () => {
  it("⭐ TRANSLATE, because it is the commonest gesture", () => {
    // ⚠ The one part of `D23` this model kept: the commonest gesture on the cheapest input.
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
    expect(surface.sort()).toEqual(["initialBehaviour", "isTapRelease", "toggleBehaviour"]);
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
    let mode = initialBehaviour();
    mode = toggleBehaviour(mode);
    expect(mode).toBe("ROTATE");
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
