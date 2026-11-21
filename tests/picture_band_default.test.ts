// ⭐⭐⭐ (2026-11-21, `Claude/40_RENDER_SCENE/spec/PICTURE_REBUILD.md` §4.7 R3, D-P3 amended) THE BAND'S WIDTH — chosen by the owner's rule (*"Do what
// minimize the camera movements while maintaining the key rules (calm, etc.)"*) on the approach cycle in the game (kit `follow/r3/runs_a`): the same
// whole pitch (≈ 60° a cycle) at 10 and 34 mm, but the largest frame step 5.9 / 11.1 / 9.7° at 10 mm against 1.9 / 3.3 / 3.1° at 34 mm (5 and 9.5 px a
// frame at 60, 8.4 at 143) — 40 mm brings his fast pace under 3°.
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { bandShare } from "../src/input/picture";

describe("R3 — the band's width by default", () => {
  it("40 mm of approach finger before 0.65 m (10 mm before: the pitch at 6 – 11° a frame at his pace)", () => {
    expect(DEFAULT_CONFIG.pictureBandMm).toBe(40);
  });
  it("its share: whole at the unlatch, half at 20 mm, none from 40 mm", () => {
    const w = DEFAULT_CONFIG.pictureBandMm;
    expect(bandShare(0, w)).toBe(1);
    expect(bandShare(20, w)).toBeCloseTo(0.5, 12);
    expect(bandShare(40, w)).toBe(0);
  });
});
