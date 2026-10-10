/**
 * ⭐⭐ prototype — EVERY OBJECT TWICE AS BIG (the owner, 2026-10-10: *"multiply all the dimensions of all the objects by two (parts, frozen
 * objects, pieces). However, keep all the other values unchanged (camera setup, curves, gains, etc.)"* — *"white sphere unchanged"*, *"gizmos
 * unchanged"*).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SCENE_1, SCENE_1_SHIFT_Y, SCENE_1_UNIT_M } from "../src/content/scene_1";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { sceneConfig } from "../src/input/scene_rig";
import { goalReport } from "../src/core/goal";
import { IDENTITY, type Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐ prototype — every object twice as big", () => {
  it("⭐⭐ the objects at 0.2 m per unit (was 0.1): sizes AND positions doubled; the lights kept at 0.1; the boot centre (the old origin) with the objects", () => {
    expect(SCENE_1_UNIT_M).toBe(0.2);
    expect(SCENE_1.unitM).toBe(0.2);
    expect(SCENE_1.lightUnitM).toBe(0.1);
    expect(code("render/lighting.ts")).toMatch(/const u = st\.sceneSpec\.lightUnitM \?\? st\.sceneSpec\.unitM \?\? 1;/);
    expect(SCENE_1.orbit!.centreM![1]).toBeCloseTo(SCENE_1_SHIFT_Y * 0.2, 12);
  });

  it("⭐⭐ everything else unchanged: the rings, the camera's numbers, the white sphere (metres, not units)", () => {
    const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    expect([cfg.orbitTopRadiusM, cfg.orbitTopHeightM, cfg.orbitMiddleRadiusM, cfg.orbitMiddleHeightM]).toEqual([2.55, 1.575, 0.09, 0.15]);
    expect([cfg.orbitLowerRadiusM, cfg.orbitLowerHeightM, cfg.orbitBottomRadiusM, cfg.orbitBottomHeightM]).toEqual([0.09, -0.15, 2.55, -1.575]);
    expect(DEFAULT_CONFIG.cameraRadiusOffsetMm).toBe(1250);
    expect(DEFAULT_CONFIG.pieceSphereRadiusM).toBe(2.3);
  });

  it("⭐ the goal fit's exact core is a length of the pieces' geometry — it scales with the unit (2 mm at 0.1, 4 mm at 0.2)", () => {
    expect(code("core/goal.ts")).toMatch(/return \(FIT_INLIER_M \* unitM\) \/ 0\.1;/);
    // the painting exact, its 41 pieces in place at both scales
    const final = SCENE_1.final!;
    for (const u of [0.1, 0.2]) {
      const at = new Map(final.bodies.map((b) => [b.id, { position: (b.position as Vec3).map((v) => v * u) as unknown as Vec3, orientation: IDENTITY }]));
      expect(goalReport(final, u, (id) => at.get(id) ?? null, { positionM: 0.01, angleRad: 0.1 }).met).toBe(true);
    }
  });
});
