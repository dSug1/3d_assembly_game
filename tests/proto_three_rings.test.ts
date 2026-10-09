/**
 * ⭐⭐ prototype — THE FOUR RINGS MADE THREE (the owner, 2026-10-09: *"Make a slider to toggle from 4 to 3 rings in the menu camera orbit
 * around center. When on 3 rings configuration, merge the 2nd and 3rd rings of the four ring configuration and make sure the camera 2D curve
 * is smoothed on the 3 rings as well as for the way in and way out"*).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { distanceTurningPoints, elevationGainScale, fourRingLayout, mergedRingLayout, orbitOffset, ringLayout } from "../src/input/orbit";
import { cameraOffset } from "../src/input/follow_camera";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { sceneConfig } from "../src/input/scene_rig";
import { SCENE_1 } from "../src/content/scene_1";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const four = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
const three = { ...four, orbitRingCount: 3 };
// an ASYMMETRIC pair, so the midpoint is not where the four-ring waist happens to sit
const lop = { ...four, orbitMiddleRadiusM: 0.3, orbitMiddleHeightM: 0.45 };
const lop3 = { ...lop, orbitRingCount: 3 };
const ring = (cfg: typeof DEFAULT_CONFIG, v: number) => {
  const o = orbitOffset(cfg, 0, v, 1).offsetM;
  return { r: Math.hypot(o[0], o[2]), h: o[1] };
};

describe("⭐⭐ prototype — three rings, the 2nd and 3rd merged", () => {
  it("⭐ the slider: 4 by default, 3 or 4 only, in CAMERA ORBIT AROUND CENTER; the cached keys read it", () => {
    expect(DEFAULT_CONFIG.orbitRingCount).toBe(4);
    expect(() => validateGestureConfig(three)).not.toThrow();
    expect(() => validateGestureConfig({ ...four, orbitRingCount: 2 })).toThrow(/orbitRingCount/);
    const menu = code("render/tuning_menu.ts");
    expect(menu).toContain('"orbitRingCount", 3, 4, 1)');
    expect(menu.indexOf('"orbitRingCount"')).toBeGreaterThan(menu.indexOf('title: "CAMERA ORBIT AROUND CENTER"'));
    // the green zoom floor and the yaw gain are recomputed when it changes
    expect(code("render/green_box_wiring.ts").split("cfg.orbitLowerRingOn, cfg.orbitRingCount,").length - 1).toBe(2);
  });

  it("⭐⭐ three rings: the bottom, the MIDPOINT of the 2nd and 3rd, the top — the curve passes through each", () => {
    for (const cfg of [three, lop3]) {
      const mid = { r: (cfg.orbitMiddleRadiusM + cfg.orbitLowerRadiusM) / 2, h: (cfg.orbitMiddleHeightM + cfg.orbitLowerHeightM) / 2 };
      expect(ring(cfg, 0).r).toBeCloseTo(cfg.orbitBottomRadiusM, 9);
      expect(ring(cfg, 0).h).toBeCloseTo(cfg.orbitBottomHeightM, 9);
      expect(ring(cfg, 0.5).r).toBeCloseTo(mid.r, 9);
      expect(ring(cfg, 0.5).h).toBeCloseTo(mid.h, 9);
      expect(ring(cfg, 1).r).toBeCloseTo(cfg.orbitTopRadiusM, 9);
      expect(ring(cfg, 1).h).toBeCloseTo(cfg.orbitTopHeightM, 9);
    }
    // ⛔ the four-ring curve does not pass there (the vector is not vacuous)
    const m = { r: (lop.orbitMiddleRadiusM + lop.orbitLowerRadiusM) / 2, h: (lop.orbitMiddleHeightM + lop.orbitLowerHeightM) / 2 };
    expect(Math.abs(ring(lop, 0.5).h - m.h) + Math.abs(ring(lop, 0.5).r - m.r)).toBeGreaterThan(0.01);
    expect(ringLayout(three)).toEqual(mergedRingLayout(three));
    expect(ringLayout(four)).toEqual(fourRingLayout(four));
    expect(ringLayout({ ...three, orbitLowerRingOn: 0 })).toBeNull(); // a three-ring SCENE stays as ever
  });

  it("⭐⭐ SMOOTH: the 2D curve (radius, height) has no corner — its direction turns by little per step everywhere, the merged ring included; heights climb; the distance turns once", () => {
    for (const cfg of [three, lop3]) {
      const N = 600;
      const pts = Array.from({ length: N + 1 }, (_, i) => ring(cfg, i / N));
      let worst = 0;
      for (let i = 1; i < N; i++) {
        const a = [pts[i]!.r - pts[i - 1]!.r, pts[i]!.h - pts[i - 1]!.h];
        const b = [pts[i + 1]!.r - pts[i]!.r, pts[i + 1]!.h - pts[i]!.h];
        const cos = (a[0]! * b[0]! + a[1]! * b[1]!) / (Math.hypot(a[0]!, a[1]!) * Math.hypot(b[0]!, b[1]!));
        worst = Math.max(worst, Math.acos(Math.min(1, cos)));
        expect(pts[i + 1]!.h).toBeGreaterThan(pts[i]!.h); // climbs: no fold, no plateau
      }
      expect(worst).toBeLessThan((3 * Math.PI) / 180); // a corner would turn by far more in one step
      expect(distanceTurningPoints(cfg)).toBeLessThanOrEqual(1);
      // the tangents match across the merged ring (C¹): left and right slopes in s
      const l = mergedRingLayout(cfg);
      const e = 1e-6;
      const at = (s: number) => ring(cfg, s / l.total);
      for (const k of ["r", "h"] as const) {
        const left = (at(1 / 3)[k] - at(1 / 3 - e)[k]) / e;
        const right = (at(1 / 3 + e)[k] - at(1 / 3)[k]) / e;
        expect(Math.abs(left - right)).toBeLessThan(1e-3);
      }
    }
  });

  it("⭐ a millimetre of dy runs through an outer segment as with four rings: each keeps its ⅓ span, the waist gone (gain × 1.5)", () => {
    expect(mergedRingLayout(three).total).toBeCloseTo(2 / 3, 12);
    expect(elevationGainScale(three)).toBeCloseTo(1.5, 12);
    expect(elevationGainScale(four)).toBeCloseTo(1 / fourRingLayout(four).total, 12);
    expect(elevationGainScale({ ...three, orbitLowerRingOn: 0 })).toBe(1);
  });

  it("⭐⭐ the camera, the way in and the way out ride the SAME curve — they read it through `orbitOffset` / `cameraOffset`, no copy of the rings", () => {
    // the camera's pitch on the rig follows the merged curve
    const cam = (cfg: typeof DEFAULT_CONFIG, v: number) => cameraOffset(cfg, { yaw: 0, v }, [1, 0, 0], { yawRad: 0, pitchRad: 0 }, 0);
    const o3 = orbitOffset(lop3, 0, 0.5, 1).offsetM;
    const c3 = cam(lop3, 0.5);
    expect(Math.atan2(c3[1], c3[0])).toBeCloseTo(Math.atan2(o3[1], o3[0]), 9);
    // the way in, the orbit around the piece and the way out place the piece and the camera from those two, nowhere else
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const be = st\.pieceEntry === null \? null : orbitOffset\(st\.cfg, st\.pieceEntry\.headingRad, st\.boxOrbit\.v, st\.boxOrbit\.zoom\)\.offsetM;/);
    expect(w).toMatch(/const bo = orbitOffset\(st\.cfg, st\.orbit\.yaw, st\.orbit\.elevation, GREEN_PIECE_ORBIT_ZOOM\);/); // the way out's home
    expect(w).not.toMatch(/orbitMiddle(Radius|Height)M[^,|]/); // no ring read past the cached keys
  });
});
