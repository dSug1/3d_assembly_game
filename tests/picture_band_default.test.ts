// ⭐⭐⭐ (2026-11-21, `Claude/40_RENDER_SCENE/spec/PICTURE_REBUILD.md` §4.7 R3, §8.2) THE BAND'S WIDTH — 10 mm (the design's, his `tiltBlendMm` figure,
// near his realignment pace C4, 3° a mm). ⛔ 40 mm (the lead, `3aca06b`, reverted the same day): the whole far approach of `Scene_1`'s top is ≈ 30 mm of
// finger from its rest to 0.65 m, so a 40 mm band reached the far REST — the far picture partly blended toward close in's everywhere (the 60° cap, D-F1,
// broken far out; his ten stretches and the S1 walks no longer the follower's: kit `follow/r3/runs` against `runs_b`, where 0 and 10 mm are identical).
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { bandShare } from "../src/input/picture";

describe("R3 — the band's width by default", () => {
  it("10 mm of approach finger before 0.65 m — never the far approach's whole range (≈ 30 mm on Scene_1)", () => {
    expect(DEFAULT_CONFIG.pictureBandMm).toBe(10);
  });
  it("its share: whole at the unlatch, half at 5 mm, none from 10 mm — the far rest (≈ 30 mm out) untouched", () => {
    const w = DEFAULT_CONFIG.pictureBandMm;
    expect(bandShare(0, w)).toBe(1);
    expect(bandShare(5, w)).toBeCloseTo(0.5, 12);
    expect(bandShare(10, w)).toBe(0);
    expect(bandShare(30, w)).toBe(0);
  });
});
