/**
 * ⭐⭐⭐ **THE SET OF MODES THAT TRANSLATE — one fact, one home.**
 *
 * ⛔ Two rules asked this question in two places and one of them was wrong for days (defect 55,
 * device-reported three times), while the second was wrong silently until the owner noticed the
 * gizmo disappearing under the finger that was moving the body.
 */
import { describe, expect, it } from "vitest";
import { isTranslatingMode, keepsGizmo, TRANSLATING_MODES } from "@input/grip_mode";

describe("⛔⛔ the translating modes", () => {
  it("⭐⭐ the SECOND touchpoint's mode is a TRANSLATION — defect 55, asserted once", () => {
    // ⚠ It was called `"DEPTH"` until the owner named the trap: *"the second finger should not
    // set mode to depth since it is driving the translation along gravity axis, not depth … or
    // the name of the mode 'depth' is ill chosen."* ⛔ A mode named after an AXIS goes stale the
    // moment the channels move, and this one had been stale since `D75`.
    expect(isTranslatingMode("DEPTH")).toBe(false);
    expect(isTranslatingMode("TRANSLATE")).toBe(true);
    expect(isTranslatingMode("TRANSLATE_2ND")).toBe(true);
  });

  it("⛔ a ROTATE, an unknown mode and no grip are not", () => {
    // ⚠ A turn moves a body's SURFACE without moving the body, which is the distinction every
    // caller wants — and the 2026-09-19 report is what it costs when a rotation drives a swing.
    expect(isTranslatingMode("ROTATE")).toBe(false);
    expect(isTranslatingMode(null)).toBe(false);
    expect(isTranslatingMode(undefined)).toBe(false);
    expect(isTranslatingMode("")).toBe(false);
    // ⛔ A mode invented later is NOT quietly included: adding one is a decision in that file.
    expect(isTranslatingMode("SCALE")).toBe(false);
  });

  it("⭐ the set is exactly those two — a third caller reads this, not the code", () => {
    expect([...TRANSLATING_MODES].sort()).toEqual(["TRANSLATE", "TRANSLATE_2ND"]);
  });
});

describe("⭐⭐ `D168` — a pressed body being ROTATED keeps its gizmo on a still frame", () => {
  it("⭐ ⛔ RED against the build before: a free body in ROTATE that did not turn this frame lost its gizmo", () => {
    expect(keepsGizmo({ aligned: false, mode: "ROTATE", turnedThisFrame: false })).toBe(true);
  });
  it("⭐ unchanged: an aligned body, a translating one, one that turned this frame", () => {
    expect(keepsGizmo({ aligned: true, mode: null, turnedThisFrame: false })).toBe(true);
    expect(keepsGizmo({ aligned: false, mode: "TRANSLATE", turnedThisFrame: false })).toBe(true);
    expect(keepsGizmo({ aligned: false, mode: null, turnedThisFrame: true })).toBe(true);
  });
  it("⛔ a free body with no mode yet (pressed, not moved) and no turn: none — there is nothing to show", () => {
    expect(keepsGizmo({ aligned: false, mode: null, turnedThisFrame: false })).toBe(false);
  });
});
