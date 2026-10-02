/**
 * ⭐⭐ prototype (green box) — a FOURTH orbit ring between the middle and the bottom (the owner, 2026-10-02: *"add a fourth ring between
 * the middle ring and the bottom ring, with radius same as middle ring and height the negative opposite of middle ring's height"*).
 */
import { describe, expect, it } from "vitest";
import { orbitOffset, distanceTurningPoints } from "../src/input/orbit";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { sceneConfig } from "../src/input/scene_rig";
import { parseSceneDescriptor, serializeSceneDescriptor } from "../src/core/game_structure";
import { SCENE_1 } from "../src/content/scene_1";
import { SCENE_0 } from "../src/content/scene_0";

const ring = (cfg: typeof DEFAULT_CONFIG, v: number) => {
  const o = orbitOffset(cfg, 0, v, 1).offsetM;
  return { r: Math.hypot(o[0], o[2]), h: o[1] };
};

describe("⭐⭐ prototype — a fourth orbit ring", () => {
  it("⭐ Scene_1 has it: 0.09 m at −0.15 m — the middle ring's radius, its height negated; the orbit passes through all FOUR at v = 0, ⅓, ⅔, 1", () => {
    const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    expect(cfg.orbitLowerRingOn).toBe(1);
    expect(cfg.orbitLowerRadiusM).toBe(cfg.orbitMiddleRadiusM);
    expect(cfg.orbitLowerHeightM).toBe(-cfg.orbitMiddleHeightM);
    const knots = [
      [0, cfg.orbitBottomRadiusM, cfg.orbitBottomHeightM],
      [1 / 3, cfg.orbitLowerRadiusM, cfg.orbitLowerHeightM],
      [2 / 3, cfg.orbitMiddleRadiusM, cfg.orbitMiddleHeightM],
      [1, cfg.orbitTopRadiusM, cfg.orbitTopHeightM],
    ] as const;
    for (const [v, r, h] of knots) {
      expect(ring(cfg, v).r).toBeCloseTo(r, 9);
      expect(ring(cfg, v).h).toBeCloseTo(h, 9);
    }
    // a symmetric waist: the surface mirrors about v = ½
    for (const v of [0.1, 0.25, 0.4, 0.45]) {
      expect(ring(cfg, v).r).toBeCloseTo(ring(cfg, 1 - v).r, 9);
      expect(ring(cfg, v).h).toBeCloseTo(-ring(cfg, 1 - v).h, 9);
    }
    // the heights climb (no fold), the radius never leaves the rings' range, the distance turns once — and it validates
    let prevH = -Infinity;
    for (let i = 0; i <= 300; i++) {
      const p = ring(cfg, i / 300);
      expect(p.h).toBeGreaterThanOrEqual(prevH - 1e-12);
      expect(p.r).toBeGreaterThanOrEqual(0.09 - 1e-9);
      expect(p.r).toBeLessThanOrEqual(2.55 + 1e-9);
      prevH = p.h;
    }
    expect(distanceTurningPoints(cfg)).toBe(1);
    expect(() => validateGestureConfig(cfg)).not.toThrow();
  });

  it("⭐ OPTIONAL: a scene without it keeps its three rings exactly (Scene_0 = the defaults); the JSON seam keeps and checks it", () => {
    expect(DEFAULT_CONFIG.orbitLowerRingOn).toBe(0);
    expect(sceneConfig(DEFAULT_CONFIG, SCENE_0.orbit).orbitLowerRingOn).toBe(0);
    // with the flag off, the lower ring's values change nothing
    const off = sceneConfig(DEFAULT_CONFIG, SCENE_0.orbit);
    const moved = { ...off, orbitLowerRadiusM: 2.9, orbitLowerHeightM: -0.9 };
    for (const v of [0, 0.2, 0.5, 0.8, 1]) expect(orbitOffset(moved, 0.7, v, 1.3).offsetM).toEqual(orbitOffset(off, 0.7, v, 1.3).offsetM);
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE_1)).orbit).toEqual(SCENE_1.orbit);
    const o = JSON.parse(serializeSceneDescriptor(SCENE_1));
    o.orbit.lowerHeightM = "x";
    expect(() => parseSceneDescriptor(JSON.stringify(o))).toThrow(/orbit.lowerHeightM/);
  });

  it("⛔ refused when it does not sit between the bottom and the middle — the surface would fold", () => {
    const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    expect(() => validateGestureConfig({ ...cfg, orbitLowerHeightM: 0.2 })).toThrow(/bottom → lower → middle → top/);
    expect(() => validateGestureConfig({ ...cfg, orbitLowerHeightM: -1.6 })).toThrow(/bottom → lower → middle → top/);
    expect(() => validateGestureConfig({ ...cfg, orbitLowerRingOn: 0.5 })).toThrow(/orbitLowerRingOn/);
    expect(() => validateGestureConfig({ ...cfg, orbitLowerRadiusM: 0 })).toThrow(/orbitLowerRadiusM/);
  });
});
