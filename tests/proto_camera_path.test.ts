/**
 * ⭐⭐⭐ prototype — THE CAMERA'S APPROACH PATH (`input/camera_path.ts`; `Claude/40_RENDER_SCENE/spec/CAMERA_APPROACH_PATH.md`, agreed
 * 2026-10-06).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { catmullRom4, fromAround, pathAngles, pathCamera, pathParam, pieceFrame, pieceInFrame, toAround } from "../src/input/camera_path";
import { orbitOffset } from "../src/input/orbit";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { sceneConfig } from "../src/input/scene_rig";
import { SCENE_1 } from "../src/content/scene_1";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const BAND = { startM: 2.7, aboveM: 2.4, rightM: 2.1, endM: 1.8 };
const D = Math.PI / 180;
const C: Vec3 = [0, 0, 0];

/** The piece on Scene_1's rings at distance `d` from the centre, on the upper or the lower half. */
function pieceAt(d: number, half: "upper" | "lower"): Vec3 {
  const cfg = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
  const r = (v: number) => orbitOffset(cfg, 0, v, 1).radiusM;
  let lo = half === "upper" ? 0.5 : 0;
  let hi = half === "upper" ? 1 : 0.5;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (half === "upper" ? r(m) < d : r(m) > d) lo = m;
    else hi = m;
  }
  const o = orbitOffset(cfg, 0, (lo + hi) / 2, 1).offsetM;
  return [o[0], o[1], o[2]];
}

describe("⭐⭐⭐ prototype — the camera's approach path", () => {
  it("⭐ the path is a function of the piece's distance alone: 2.7 → 0, 2.4 → 1 (ABOVE), 2.1 → 2 (RIGHT), 1.8 → 3; outside the band, none", () => {
    expect(pathParam(2.7, BAND)).toBeCloseTo(0, 12);
    expect(pathParam(2.55, BAND)).toBeCloseTo(0.5, 12);
    expect(pathParam(2.4, BAND)).toBeCloseTo(1, 12);
    expect(pathParam(2.1, BAND)).toBeCloseTo(2, 12);
    expect(pathParam(1.8, BAND)).toBeCloseTo(3, 12);
    expect(pathParam(2.71, BAND)).toBeNull();
    expect(pathParam(1.79, BAND)).toBeNull();
  });

  it("⭐⭐ the key poses: up 25° at ABOVE, right 50° at RIGHT, the normal pose at both ends; the offsets faded out (w 1) at ABOVE and RIGHT", () => {
    const at = (t: number) => pathAngles(t, 25, 50);
    expect(at(0)).toEqual({ upDeg: 0, rightDeg: 0, w: 0 });
    expect(at(3)).toEqual({ upDeg: 0, rightDeg: 0, w: 0 });
    expect(at(1).upDeg).toBeCloseTo(25, 12);
    expect(at(1).rightDeg).toBeCloseTo(0, 12);
    expect(at(1).w).toBe(1);
    expect(at(2).rightDeg).toBeCloseTo(50, 12);
    expect(at(2).upDeg).toBeCloseTo(0, 12);
    expect(at(2).w).toBe(1);
  });

  it("⭐⭐ the camera NEVER rests at a key pose (a Catmull-Rom curve): at ABOVE and RIGHT it is still moving", () => {
    const speed = (t: number) => {
      const a = pathAngles(t - 1e-4, 25, 50);
      const b = pathAngles(t + 1e-4, 25, 50);
      return Math.hypot(b.upDeg - a.upDeg, b.rightDeg - a.rightDeg) / 2e-4;
    };
    expect(speed(1)).toBeGreaterThan(5);
    expect(speed(2)).toBeGreaterThan(5);
    expect(catmullRom4([0, 1, 2, 3], 1.5)).toBeCloseTo(1.5, 12); // a line stays a line
  });

  it("⭐ around the piece and back: the angles round-trip, the distance kept", () => {
    const P: Vec3 = [1, 1.2, -1.5];
    const f = pieceFrame(C, P, 1)!;
    const a = { elev: 0.4, azim: -0.7, r: 1.25 };
    const back = toAround(fromAround(a, P, f), P, f);
    expect(back.elev).toBeCloseTo(a.elev, 12);
    expect(back.azim).toBeCloseTo(a.azim, 12);
    expect(back.r).toBeCloseTo(1.25, 12);
  });

  it("⭐⭐⭐ on Scene_1's rings, the defaults keep the piece IN THE FRAME (both halves, landscape, zoom 1) — and its distance", () => {
    for (const half of ["upper", "lower"] as const)
      for (const d of [2.7, 2.55, 2.4, 2.25, 2.1, 1.95, 1.8]) {
        const P = pieceAt(d, half);
        const f = pieceFrame(C, P, 1)!;
        const rel = [P[0] - C[0], P[1] - C[1], P[2] - C[2]];
        const base = { elev: Math.atan2(rel[1]!, Math.hypot(rel[0]!, rel[2]!)), azim: 0, r: 1.25 };
        const a = pathAngles(pathParam(d, BAND)!, 25, 50);
        const r = pathCamera(base, a.upDeg, a.rightDeg, P, C, f, { halfVRad: 0.4, aspect: 1.6, margin: 0.9 });
        expect(pieceInFrame(r.at, C, P, 0.4, 1.6, 0.9)).toBe(true);
        expect(Math.hypot(r.at[0] - P[0], r.at[1] - P[1], r.at[2] - P[2])).toBeCloseTo(1.25, 9); // ⭐ the distance to the piece kept
        expect(r.share).toBe(1); // the defaults are inside the reach: nothing clamped
      }
  });

  it("⭐⭐ beyond the reach (Q3): the angles CLAMPED — 80° above or 90° to the right still keep the piece in the frame", () => {
    const P = pieceAt(2.4, "upper");
    const f = pieceFrame(C, P, 1)!;
    const base = { elev: Math.atan2(P[1], Math.hypot(P[0], P[2])), azim: 0, r: 1.25 };
    for (const [up, right] of [[80, 0], [0, 90]] as const) {
      const r = pathCamera(base, up, right, P, C, f, { halfVRad: 0.4, aspect: 1.6, margin: 0.9 });
      expect(r.share).toBeLessThan(1);
      expect(r.share).toBeGreaterThan(0);
      expect(pieceInFrame(r.at, C, P, 0.4, 1.6, 0.9)).toBe(true);
    }
    // portrait: 50° to the right is out of reach, 20° is not
    const d21 = pieceAt(2.1, "upper");
    const f21 = pieceFrame(C, d21, 1)!;
    const b21 = { elev: Math.atan2(d21[1], Math.hypot(d21[0], d21[2])), azim: 0, r: 1.25 };
    expect(pathCamera(b21, 0, 50, d21, C, f21, { halfVRad: 0.4, aspect: 1 / 1.6, margin: 0.9 }).share).toBeLessThan(1);
    expect(pathCamera(b21, 0, 20, d21, C, f21, { halfVRad: 0.4, aspect: 1 / 1.6, margin: 0.9 }).share).toBe(1);
    void D;
  });

  it("⭐⭐ wired: latched at the alignment beyond the start (inside: none); unlatched by a respawn; the camera's position on the path; sliders", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/st\.restAligned = true;[^\n]*\n\s*latchCameraPath\(st\);/);
    expect(w).toMatch(/if \(!\(d > st\.cfg\.pathStartM\) \|\| f === null\) \{\s*st\.camPath = null;\s*return;\s*\}/);
    expect(w).toMatch(/st\.camPath = \{ side, rightDeg: landscape \? st\.cfg\.pathRightDegLandscape : st\.cfg\.pathRightDegPortrait \};/);
    expect(w).toMatch(/st\.restAligned = false;\s*st\.camPath = null;/); // the respawn
    expect(w).toMatch(/st\.camera\.setPosition\(cameraPathPosition\(st, normalCam, c, box\.position\) \?\? normalCam\);\s*st\.camera\.setTarget\(c\.clone\(\)\);/);
    expect(w).toMatch(/const t = pathParam\(d, \{ startM: cfg\.pathStartM, aboveM: cfg\.pathAboveM, rightM: cfg\.pathRightM, endM: cfg\.pathEndM \}\);/);
    expect(w).toMatch(/const gap = cameraGapM\(cfg\.cameraRadiusOffsetMm \/ 1000, st\.zoom\);/);
    expect(DEFAULT_CONFIG.pathStartM).toBe(2.7);
    expect([DEFAULT_CONFIG.pathAboveM, DEFAULT_CONFIG.pathRightM, DEFAULT_CONFIG.pathEndM]).toEqual([2.4, 2.1, 1.8]);
    expect([DEFAULT_CONFIG.pathAboveDeg, DEFAULT_CONFIG.pathRightDegLandscape, DEFAULT_CONFIG.pathRightDegPortrait]).toEqual([25, 50, 20]);
    expect(code("render/tuning_menu.ts")).toContain('title: "CAMERA APPROACH PATH"');
  });
});
