/**
 * ⭐⭐ prototype (green box) — a FOURTH orbit ring between the middle and the bottom (the owner, 2026-10-02: *"add a fourth ring between
 * the middle ring and the bottom ring, with radius same as middle ring and height the negative opposite of middle ring's height"*).
 */
import { describe, expect, it } from "vitest";
import { orbitOffset, distanceTurningPoints, fourRingLayout, OrbitController } from "../src/input/orbit";
import { mmToPx } from "../src/core/units";
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
  it("⭐ Scene_1 has it: 0.09 m at −0.15 m — the 2nd ring's radius, its height negated; the orbit passes through all FOUR rings", () => {
    const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    expect(cfg.orbitLowerRingOn).toBe(1);
    expect(cfg.orbitLowerRadiusM).toBe(cfg.orbitMiddleRadiusM);
    expect(cfg.orbitLowerHeightM).toBe(-cfg.orbitMiddleHeightM);
    const knots = [
      [0, cfg.orbitBottomRadiusM, cfg.orbitBottomHeightM],
      [fourRingLayout(cfg).knots[1]! / fourRingLayout(cfg).total, cfg.orbitLowerRadiusM, cfg.orbitLowerHeightM],
      [fourRingLayout(cfg).knots[2]! / fourRingLayout(cfg).total, cfg.orbitMiddleRadiusM, cfg.orbitMiddleHeightM],
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

describe("⭐⭐ prototype — the waist without its plateau; the outer transitions as they were (the owner, 2026-10-02)", () => {
  const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
  // ⭐ an INDEPENDENT re-implementation of the even layout the owner liked: Fritsch–Carlson through four knots at 0, ⅓, ⅔, 1
  const even = (ys: number[], v: number): number => {
    const h = 1 / 3;
    const d = [0, 1, 2].map((k) => (ys[k + 1]! - ys[k]!) / h);
    const m = [0, 1, 2, 3].map((k) => {
      if (k === 0) return d[0]!;
      if (k === 3) return d[2]!;
      const a = d[k - 1]!, b = d[k]!;
      if (!(a * b > 0)) return 0;
      return Math.sign(a + b) * Math.min(Math.abs((a + b) / 2), 3 * Math.min(Math.abs(a), Math.abs(b)));
    });
    const k = Math.min(2, Math.max(0, Math.ceil(v / h - 1e-12) - 1));
    const u = (v - k * h) / h;
    return (2 * u ** 3 - 3 * u ** 2 + 1) * ys[k]! + (u ** 3 - 2 * u ** 2 + u) * h * m[k]! + (-2 * u ** 3 + 3 * u ** 2) * ys[k + 1]! + (u ** 3 - u ** 2) * h * m[k + 1]!;
  };
  const R = [cfg.orbitBottomRadiusM, cfg.orbitLowerRadiusM, cfg.orbitMiddleRadiusM, cfg.orbitTopRadiusM];
  const H = [cfg.orbitBottomHeightM, cfg.orbitLowerHeightM, cfg.orbitMiddleHeightM, cfg.orbitTopHeightM];

  it("⭐⭐ a millimetre of dy moves the 1st ↔ 2nd and 3rd ↔ 4th transitions EXACTLY as the even layout did", () => {
    const L = fourRingLayout(cfg);
    const g = cfg.gainOrbitElevation; // v per mm, before
    for (let mm = 0; mm <= 1 / 3 / g + 1e-9; mm += 1) {
      for (const [vOld, vNew] of [
        [1 - mm * g, 1 - (mm * g) / L.total], // from the 1st (top) ring down to the 2nd
        [mm * g, (mm * g) / L.total], // from the 4th (bottom) ring up to the 3rd
      ] as const) {
        const o = orbitOffset(cfg, 0, vNew, 1).offsetM;
        expect(Math.hypot(o[0], o[2])).toBeCloseTo(even(R, vOld), 9);
        expect(o[1]).toBeCloseTo(even(H, vOld), 9);
      }
    }
    // and the drag really does move v by `g ÷ total` per mm
    const c = new OrbitController(cfg, 0, 0.9);
    c.drag(0, 2 * mmToPx(1)); // 2 mm, finger down → v up, clamped at 1
    const c2 = new OrbitController(cfg, 0, 0.9);
    c2.drag(0, -2 * mmToPx(1));
    expect(0.9 - c2.elevation).toBeCloseTo((2 * g) / L.total, 12);
  });

  it("⭐⭐ the waist (2nd ↔ 3rd) has NO plateau any more: it runs at the speed it is entered at — linear in height", () => {
    const L = fourRingLayout(cfg);
    // ⅔ + its height step ÷ its entry tangent — 1.725 with the owner's ±1.0 m outer rings (2026-10-06; 2.5875 at ±1.575)
    expect(L.total).toBeCloseTo(2 / 3 + 0.3 / 1.725, 3);
    const v1 = L.knots[1]! / L.total;
    const v2 = L.knots[2]! / L.total;
    for (let i = 0; i <= 10; i++) {
      const v = v1 + ((v2 - v1) * i) / 10;
      const o = orbitOffset(cfg, 0, v, 1).offsetM;
      expect(o[1]).toBeCloseTo(cfg.orbitLowerHeightM + ((cfg.orbitMiddleHeightM - cfg.orbitLowerHeightM) * i) / 10, 9);
      expect(Math.hypot(o[0], o[2])).toBeCloseTo(0.09, 9);
    }
    // ⛔ the even layout's plateau: ~7 cm climbed between v = 0.4 and 0.6; now the waist's 30 cm in ~0.21 of v (~0.15 at ±1.575)
    expect(even(H, 0.6) - even(H, 0.4)).toBeLessThan(0.13); // ⚠ ~12.7 cm with the owner's ±1.0 m outer rings (2026-10-06; ~7 at ±1.575)
    expect(v2 - v1).toBeLessThan(0.21);
  });
});
