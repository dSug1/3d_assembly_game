/**
 * ⭐⭐⭐ THE CALM — ONE SMOOTH PROFILE OVER EVERY FACE (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.8, the owner: *"it is almost as if there is orbit
 * then slide then orbit when I travel with dy or dx through a vertical face … B. build the smooth profile"*): `src/input/orbit_calm.ts`, wired in
 * `render/assembly_wiring.ts`. ⭐⭐⭐ (2026-11-06) ported to the rebuild as `src/input/loop_calm.ts` (scope §22.3 P2) — RED against `8dfa635` (absent). The shown angle across a face `Θ·(s·x + (1 − s)·x³)` of the orbit's pace share `x`; the face's gnomonic direction — the
 * same vector from both faces at an edge, from the three at a corner; a top orbited as a wall (B). RED against `f2aa456` (`calmProfile`, `calmFacets`,
 * `calmDir(p, facets, o)` absent: §21.6 F5's normals weighted over a zone — a dx across the front turned 1.1° a step in its middle, then 30° in one step
 * near a third from each side, 71° at the edge; a top a pure slide).
 */
import { describe, expect, it } from "vitest";
import { calmDir, calmFacets, calmProfile, capProfile, polyDistance, type CalmOpts } from "../src/input/loop_calm";
import { buildFaceMap, type FaceMap } from "../src/input/face_map";
import { isCapNormal, travelAt, travelStep, type TravelFacet } from "../src/input/loop_travel";
import type { Vec3 } from "../src/core/vec";

const D = 180 / Math.PI;
const ang = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * D;
const unit = (u: Vec3): Vec3 => {
  const l = Math.hypot(...u);
  return [u[0] / l, u[1] / l, u[2] / l];
};
const O: CalmOpts = { shareH: 0.25, shareV: 0.25, edgeRad: 10 / D, edgeM: 0.01 };
/** ⭐ (the rebuild) the place `deg` of the turn from the front's middle — dx (`"x"`) across it, dy (`"y"`) up it and on — by the travel itself at 1°/mm */
function placeAt(map: FaceMap, comp: "x" | "y", deg: number): Vec3 {
  const fs: TravelFacet[] = map.facets.map((f) => ({ n: f.n, poly: f.poly, cap: isCapNormal(f.n) }));
  const fi = fs.findIndex((f) => f.n[2] < -0.9);
  const f = map.facets[fi]!;
  const c: Vec3 = [(map.core.lo[0] + map.core.hi[0]) / 2, (map.core.lo[1] + map.core.hi[1]) / 2, -f.e];
  let t = travelAt(fs, c, fi);
  const o = { degPerMm: 1, edgeM: 0.01, edgeRad: 10 / D };
  const step = 0.25 * Math.sign(deg);
  for (let m = 0; m < Math.abs(deg) - 1e-9; m += 0.25) t = travelStep(fs, t, comp, step, o).travel;
  return t.p;
}
/** `Scene_1`'s painting (50 × 48 × 3.3 cm) and a deep box (a 50 cm deep top) */
const THIN = { lo: [-0.25, 0, -0.05] as Vec3, hi: [0.25, 0.48, -0.017] as Vec3 };
const DEEP = { lo: [-0.25, 0, -0.5] as Vec3, hi: [0.25, 0.48, 0] as Vec3 };

describe("⭐⭐⭐ THE CALM — one smooth profile over every face (§21.8)", () => {
  it("⭐⭐⭐ THE PROFILE: odd, ±1 at the edges, the middle's share as its pace there, 3 − 2s at the edges — growing all the way (no flat stretch, no bump)", () => {
    expect(calmProfile(1, 0.25)).toBe(1);
    expect(calmProfile(-1, 0.25)).toBe(-1);
    expect(calmProfile(0, 0.25)).toBe(0);
    expect(calmProfile(1.5, 0.25)).toBe(1);
    const slope = (x: number) => (calmProfile(x + 1e-6, 0.25) - calmProfile(x - 1e-6, 0.25)) / 2e-6;
    expect(slope(0)).toBeCloseTo(0.25, 6);
    expect(slope(1 - 1e-6)).toBeCloseTo(2.5, 4);
    let prev = 0;
    for (let x = 0; x <= 1; x += 0.05) {
      expect(slope(Math.min(x, 1 - 1e-6))).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = slope(Math.min(x, 1 - 1e-6));
    }
    expect(calmProfile(0.4, 1)).toBeCloseTo(0.4, 12); // share 1: the plain orbit
  });

  it("⭐⭐⭐ A dx ACROSS THE FRONT (the owner's report): the camera's pace grows evenly from the middle to the edges — each step's turn at least the one before it toward the edge, the edge at the bisector (45°), the middle square (⛔ F5: 1.1° then 30° in one step, 71° at the edge)", () => {
    const map = buildFaceMap([], THIN);
    const F = calmFacets(map.facets);
    const heading = (k: number) => {
      const w = calmDir(placeAt(map, "x", 4.5 * k), F, O)!;
      return Math.atan2(w[0], -w[2]) * D;
    };
    expect(heading(0)).toBeCloseTo(0, 9);
    expect(heading(10)).toBeCloseTo(45, 4);
    expect(heading(-10)).toBeCloseTo(-45, 4);
    let prev = 0;
    for (let k = 1; k <= 10; k++) {
      const step = heading(k) - heading(k - 1);
      expect(step).toBeGreaterThanOrEqual(prev - 1e-6);
      expect(step).toBeLessThan(12);
      prev = step;
    }
  });

  it("⭐⭐ (no entry known — a boot on a cap) A dy UP THE FRONT AND OVER A DEEP TOP: the same profile up the wall, ON at the same pace across the edge (C1), straight above at the top's middle (⛔ F3: the 90° crammed into the wall's last cm, then a slide)", () => {
    const map = buildFaceMap([], DEEP);
    const F = calmFacets(map.facets);
    const elev = (p: number) => {
      const w = calmDir(placeAt(map, "y", p), F, O)!;
      return Math.atan2(w[1], -w[2]) * D;
    };
    expect(elev(45)).toBeCloseTo(45, 4);
    expect(elev(90)).toBeCloseTo(90, 4);
    const before = elev(45) - elev(40.5);
    const after = elev(49.5) - elev(45);
    expect(Math.abs(after - before)).toBeLessThan(0.5); // the same pace on both sides of the edge
    let worst = 0;
    for (let p = -45; p < 90; p += 4.5) worst = Math.max(worst, elev(p + 4.5) - elev(p));
    expect(worst).toBeLessThan(12);
  });

  it("⭐⭐⭐ (§23) A CAP IS A TERMINUS — entered from the front: up the front as before, ON across the edge at the same pace (C1), then a SLIDE reaching straight above ONLY at the far edge — never past it (no roll); the top's sideways profile unchanged (⛔ §21.8 B: straight above at the middle, past it beyond)", () => {
    const map = buildFaceMap([], DEEP);
    const F = calmFacets(map.facets);
    const FRONT: Vec3 = [0, 0, -1];
    const elevAt = (p: Vec3) => {
      const w = calmDir(p, F, O, FRONT)!;
      return Math.atan2(w[1], -w[2]) * D;
    };
    const elev = (p: number) => elevAt(placeAt(map, "y", p));
    expect(elev(45)).toBeCloseTo(45, 4); // the edge: the bisector, as the front's own profile ends
    // the same pace on both sides of the edge (the upright map's top quarter: 45° of pitch over the cap's half depth, as the front's 45° over its half)
    const before = elev(45) - elev(44.5);
    const after = elev(45.5) - elev(45);
    expect(Math.abs(after - before)).toBeLessThan(0.1 * before);
    // over the top along its depth (z from the front edge −0.5 to the far edge 0)
    const top = (z: number) => elevAt([0, 0.48, z]);
    expect(top(-0.25)).toBeLessThan(89); // the middle: not yet straight above
    expect(top(-1e-9)).toBeCloseTo(90, 6); // the far edge: straight above
    let prev = top(-0.5);
    for (let z = -0.5; z <= 0; z += 0.005) {
      const e = top(z);
      expect(e).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(e).toBeLessThanOrEqual(90 + 1e-9);
      prev = e;
    }
    // the cap's profile: 1 at the entry edge, 0 at the far edge, monotone, the far edge's pace the middle's share
    expect(capProfile(1, 0.25)).toBeCloseTo(1, 12);
    expect(capProfile(0, 0.25)).toBe(0);
    expect((capProfile(1e-6, 0.25) - capProfile(0, 0.25)) / 1e-6).toBeCloseTo(0.25, 4);
    expect((capProfile(1, 0.25) - capProfile(1 - 1e-6, 0.25)) / 1e-6).toBeCloseTo(2 * 2.5, 3); // twice the wall's edge pace over the half span: C1
  });

  it("⭐⭐⭐ CONTINUOUS ACROSS EVERY EDGE AND CORNER: the gnomonic direction is the same vector from each face (on a box `n_A + n_B` plus the same along the edge)", () => {
    const F = calmFacets(buildFaceMap([], DEEP).facets);
    const e = 1e-7;
    const near = (p: Vec3, q: Vec3) => expect(ang(calmDir(p, F, O)!, calmDir(q, F, O)!)).toBeLessThan(1e-3);
    near([0.25 - e, 0.3, -0.5], [0.25, 0.3, -0.5 + e]); // the front ↔ the +x side
    near([0.1, 0.48 - e, -0.5], [0.1, 0.48, -0.5 + e]); // the front ↔ the top
    near([0.25, 0.48 - e, -0.2], [0.25 - e, 0.48, -0.2]); // the +x side ↔ the top
    const c = [calmDir([0.25 - e, 0.48 - e, -0.5], F, O)!, calmDir([0.25, 0.48 - e, -0.5 + e], F, O)!, calmDir([0.25 - e, 0.48, -0.5 + e], F, O)!];
    expect(ang(c[0]!, c[1]!)).toBeLessThan(1e-3);
    expect(ang(c[0]!, c[2]!)).toBeLessThan(1e-3);
    expect(ang(c[0]!, unit([1, 1, -1]))).toBeLessThan(1e-3); // a box's corner: the three normals' diagonal
  });

  it("⭐⭐⭐ NO STEP ANYWHERE on `Scene_1`'s thin painting: up the front, over the top, down the back, round the +x side and back — every turn shrinks with the step (a quarter of the step: under a third of the turn — continuous), within the orbit's own pace over a 3.3 cm face", () => {
    const F = calmFacets(buildFaceMap([], THIN).facets);
    const worstAt = (h: number) => {
      const path: Vec3[] = [];
      for (let y = 0.05; y <= 0.48; y += h) path.push([0.2, y, -0.05]);
      for (let z = -0.05; z <= -0.017; z += h) path.push([0.2, 0.48, z]);
      for (let y = 0.48; y >= 0.3; y -= h) path.push([0.2, y, -0.017]);
      for (let x = 0.2; x <= 0.25; x += h) path.push([x, 0.3, -0.017]);
      for (let z = -0.017; z >= -0.05; z -= h) path.push([0.25, 0.3, z]);
      for (let x = 0.25; x >= 0.15; x -= h) path.push([x, 0.3, -0.05]);
      let worst = 0;
      for (let i = 1; i < path.length; i++) worst = Math.max(worst, ang(calmDir(path[i - 1]!, F, O)!, calmDir(path[i]!, F, O)!));
      return worst;
    };
    const w1 = worstAt(0.001);
    expect(w1).toBeLessThan(10);
    expect(worstAt(0.00025)).toBeLessThan(w1 / 3);
  });

  it("⭐ the facets' neighbours: a box's every side 45° away; the distance to a polygon", () => {
    const F = calmFacets(buildFaceMap([], DEEP).facets);
    for (const f of F) for (const h of [f.half.tLo, f.half.tHi, f.half.bLo, f.half.bHi]) expect(h * D).toBeCloseTo(45, 6);
    const front = F.find((f) => f.n[2] < -0.9)!;
    expect(polyDistance([0, 0.2, -0.6], front.poly, front.n)).toBeCloseTo(0.1, 12);
  });

});
