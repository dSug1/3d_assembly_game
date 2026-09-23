/**
 * ⭐⭐⭐ **THE SET OF MODES THAT TRANSLATE — one fact, one home.**
 *
 * ⛔ Three rules asked this question in three places, and one of them was wrong for four days
 * (defect 55, device-reported three times) while a second was wrong silently (defect 60, the
 * gizmo). ⚠ The vectors below are what a fourth caller inherits.
 */
import { describe, expect, it } from "vitest";
import { isTranslatingMode, TRANSLATING_MODES } from "@input/grip_mode";
import { swingDriverIndex } from "@input/approach_swing";

describe("⛔⛔ the translating modes", () => {
  it('⭐⭐ "DEPTH" is a TRANSLATION — the whole of defect 55, asserted once', () => {
    expect(isTranslatingMode("TRANSLATE")).toBe(true);
    expect(isTranslatingMode("DEPTH")).toBe(true);
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

  it("⭐ the set is exactly those two — a fourth caller reads this, not the code", () => {
    expect([...TRANSLATING_MODES].sort()).toEqual(["DEPTH", "TRANSLATE"]);
  });

  it("⛔⛔ and the SWING now reads that set rather than its own copy of it", () => {
    // ⚠ The vector that used to stand here asserted the DEFECT — `["DEPTH", null, "TRANSLATE"]`
    // was pinned to 2, skipping the DEPTH grip on purpose. ⭐ It is 0, and it is 0 because both
    // callers now ask one function.
    expect(swingDriverIndex(["DEPTH", null, "TRANSLATE"])).toBe(0);
    expect(swingDriverIndex(["ROTATE", "DEPTH"])).toBe(1);
    expect(swingDriverIndex(["ROTATE", null])).toBe(-1);
  });
});
