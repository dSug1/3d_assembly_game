/**
 * ⭐⭐⭐ **THE SET OF MODES THAT TRANSLATE — one fact, one home.**
 *
 * ⛔ Two rules asked this question in two places and one of them was wrong for days (defect 55,
 * device-reported three times), while the second was wrong silently until the owner noticed the
 * gizmo disappearing under the finger that was moving the body.
 */
import { describe, expect, it } from "vitest";
import { isTranslatingMode, TRANSLATING_MODES } from "@input/grip_mode";
import { swingDriverIndex } from "@input/approach_swing";

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

  it("⛔⛔ and the SWING reads that set rather than its own copy of it", () => {
    expect(swingDriverIndex(["TRANSLATE_2ND", null, "TRANSLATE"])).toBe(0);
    expect(swingDriverIndex(["ROTATE", "TRANSLATE_2ND"])).toBe(1);
    expect(swingDriverIndex(["ROTATE", null])).toBe(-1);
  });
});
