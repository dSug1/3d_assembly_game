/**
 * ⭐⭐ prototype — THE TUNING MENU'S **TRANSLATION IN WORLDSPACE** (the owner, 2026-10-10: *"create a submenu TRANSLATION IN WORLDSPACE and
 * move to this submenu all the sliders which we do not use in the current movement of the green and turquoise pieces"* → *"put it at the
 * bottom, with the moved sections nested inside it under their current names. leave the two as they are now"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const menu = readFileSync(new URL("../src/render/tuning_menu.ts", import.meta.url), "utf8");
const at = (s: string) => {
  const i = menu.indexOf(s);
  expect(i, s).toBeGreaterThanOrEqual(0);
  return i;
};
const key = (k: string) => at(`"${k}",`);

describe("⭐⭐ prototype — TRANSLATION IN WORLDSPACE", () => {
  it("is the LAST section, after the kept OBJECT TRANSLATION and FACE ALIGNMENT", () => {
    const ws = at('title: "TRANSLATION IN WORLDSPACE"');
    expect(menu.indexOf("title:", ws + 1)).toBeGreaterThan(ws);
    // the kept sections come first, and the moved ones carry the same names inside it
    expect(at('title: "OBJECT TRANSLATION"')).toBeLessThan(ws);
    expect(at('title: "FACE ALIGNMENT"')).toBeLessThan(ws);
    expect(menu.indexOf('title: "OBJECT TRANSLATION"', ws)).toBeGreaterThan(ws);
    expect(menu.indexOf('title: "OBJECT ROTATION"')).toBeGreaterThan(ws);
    expect(menu.indexOf('title: "FACE ALIGNMENT"', ws)).toBeGreaterThan(ws);
    // nothing after it at the top level: the sections array closes after it
    expect(menu.indexOf("]);", ws)).toBeGreaterThan(ws);
    expect(menu.slice(ws).match(/\n {4}\{/g)).toBeNull();
  });
  it("holds the sliders a grabbed PART reads; the orbit's stay where they were", () => {
    const ws = at('title: "TRANSLATION IN WORLDSPACE"');
    for (const k of [
      "collisionSkinMm", "gainTranslateScreen", "translateInertiaMs", "translateDampingRatio", "translateLeadMs", "gainTranslateDepth",
      "gainRollDrag", "translateSwayMm", "translateSwayTauMs", "gainRotateFree", "rotationIncrementDeg", "faceHighlightAlpha",
      "pioneerCursorDrag", "showHitFaceContour", "captureOffsetMm", "snapConeDeg",
    ])
      expect(key(k), k).toBeGreaterThan(ws);
    for (const k of [
      "lockPlacedPieces", "motionDeadbandMm", "restConfirmMs", "restGapFactor", "swayTurnDeg", "swayReferenceSpeedMmPerS", "highlightLiftMm",
      "orbitCentreGraceMs", "ungrabbedGoalMm", "ungrabbedGoalDeg",
    ])
      expect(key(k), k).toBeLessThan(ws);
  });
});
