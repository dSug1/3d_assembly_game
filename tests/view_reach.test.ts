/**
 * ⭐⭐⭐ THE VIEW'S RULE — EVERY FACE REACHABLE, NO SLANTED VIEW REACHED (2026-11-06, scope §22.2 T5 rewritten, §22.4 C2; the owner: *"any face contour that
 * would result in upside down slanted camera view cannot be reached … Check if any face would be reachable by the gizmo in the case of a more complex
 * assembly geometry: for example if the assembly was a horizontally extruded hexagon, a vertically extruded hexagon, a pyramid like the green piece"*).
 * From a wall, every sequence of dx / dy (a breadth-first search over the travel's places, the view's rule holding the steps — `loop_travel.ts`,
 * `loop_camera.ts`, the piece's direction `loop_calm.ts`): every facet of the contour reached; at every place reached the view either near vertical or
 * upright within the margin. RED against the rebuild's first build (T5 a rule on faces: a squat pyramid's sides all caps — the travel held on its first).
 */
import { describe, expect, it } from "vitest";
import { buildFaceMap, type FaceMap, type MapFace } from "../src/input/face_map";
import { calmDir, calmFacets, type CalmOpts } from "../src/input/loop_calm";
import { UP_MARGIN_RAD, gravityUp, inCone, nextCarried, viewAllowed } from "../src/input/loop_camera";
import { isCapNormal, travelAt, travelStep, type Travel, type TravelFacet } from "../src/input/loop_travel";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const O: CalmOpts = { shareH: 0.25, shareV: 0.25, edgeRad: 10 * D, edgeM: 0.01 };
const TO = { degPerMm: 5, edgeM: 0.01, edgeRad: 10 * D };
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** a convex polygon face (vertices in order), its normal outward from `centre` */
function face(vs: Vec3[], centre: Vec3): MapFace {
  let n = unit(cross(sub(vs[1]!, vs[0]!), sub(vs[2]!, vs[0]!)));
  const c: Vec3 = [vs.reduce((s, v) => s + v[0], 0) / vs.length, vs.reduce((s, v) => s + v[1], 0) / vs.length, vs.reduce((s, v) => s + v[2], 0) / vs.length];
  if (dot(n, sub(c, centre)) < 0) n = [-n[0], -n[1], -n[2]];
  const tris: [Vec3, Vec3, Vec3][] = [];
  for (let i = 1; i + 1 < vs.length; i++) tris.push([vs[0]!, vs[i]!, vs[i + 1]!]);
  return { normal: n, centre: c, tris };
}
/** a convex solid from two rings (the bottom and the top, matched vertex by vertex) */
function loft(lo: Vec3[], hi: Vec3[]): { faces: MapFace[]; box: { lo: Vec3; hi: Vec3 } } {
  const all = [...lo, ...hi];
  const c: Vec3 = [all.reduce((s, v) => s + v[0], 0) / all.length, all.reduce((s, v) => s + v[1], 0) / all.length, all.reduce((s, v) => s + v[2], 0) / all.length];
  const faces = [face(lo, c), face(hi, c)];
  for (let i = 0; i < lo.length; i++) {
    const j = (i + 1) % lo.length;
    faces.push(face([lo[i]!, lo[j]!, hi[j]!, hi[i]!], c));
  }
  const ext = (f: (...xs: number[]) => number): Vec3 => [f(...all.map((v) => v[0])), f(...all.map((v) => v[1])), f(...all.map((v) => v[2]))];
  const box = { lo: ext(Math.min), hi: ext(Math.max) };
  return { faces, box };
}
const ring = (k: number, r: number, at: (x: number, y: number) => Vec3, phase = 0): Vec3[] =>
  Array.from({ length: k }, (_, i) => at(r * Math.cos(phase + (2 * Math.PI * i) / k), r * Math.sin(phase + (2 * Math.PI * i) / k)));

const FACETS: Record<string, number> = { painting: 6, hexVertical: 8, hexHorizontal: 8, frustum: 6, squatPyramid: 6 };
const SHAPES: Record<string, { faces: MapFace[]; box: { lo: Vec3; hi: Vec3 } }> = {
  // `Scene_1`'s painting: 50 × 48 × 3.3 cm
  painting: loft([[-0.25, 0, -0.05], [0.25, 0, -0.05], [0.25, 0, -0.017], [-0.25, 0, -0.017]], [[-0.25, 0.48, -0.05], [0.25, 0.48, -0.05], [0.25, 0.48, -0.017], [-0.25, 0.48, -0.017]]),
  // a hexagon extruded vertically (its axis y)
  hexVertical: loft(ring(6, 0.2, (x, z) => [x, 0, z]), ring(6, 0.2, (x, z) => [x, 0.5, z])),
  // a hexagon extruded horizontally (its axis x), a flat top and bottom
  hexHorizontal: loft(ring(6, 0.2, (y, z) => [-0.3, 0.2 + z, y]), ring(6, 0.2, (y, z) => [0.3, 0.2 + z, y])),
  // the green piece: a steep frustum, its top half its base
  frustum: loft([[-0.15, 0, -0.1], [0.15, 0, -0.1], [0.15, 0, 0.1], [-0.15, 0, 0.1]], [[-0.075, 0.45, -0.05], [0.075, 0.45, -0.05], [0.075, 0.45, 0.05], [-0.075, 0.45, 0.05]]),
  // a squat pyramid: its sides 31° off the horizontal (their normals within 45° of the vertical — "caps" by the normal)
  squatPyramid: loft([[-0.25, 0, -0.25], [0.25, 0, -0.25], [0.25, 0, 0.25], [-0.25, 0, 0.25]], [[-0.05, 0.12, -0.05], [0.05, 0.12, -0.05], [0.05, 0.12, 0.05], [-0.05, 0.12, 0.05]]),
};

/** the breadth-first search: the facets reached, and the worst view reached (the carried up off gravity's, outside the cone) */
function explore(map: FaceMap, rule = true): { reached: Set<number>; worstDeg: number; states: number } {
  const fs: TravelFacet[] = map.facets.map((f) => ({ n: f.n, poly: f.poly, cap: isCapNormal(f.n) }));
  const cf = calmFacets(map.facets);
  const dirOf = (t: Travel): Vec3 => {
    const f = fs[t.facet]!;
    return calmDir(t.p, cf, O, f.cap ? t.entry : f.n) ?? f.n;
  };
  // the start: the facet facing −z the most, its centre
  let fi = 0;
  fs.forEach((f, i) => {
    if (f.n[2] < fs[fi]!.n[2]) fi = i;
  });
  const poly = map.facets[fi]!.poly;
  const c: Vec3 = [poly.reduce((s, v) => s + v[0], 0) / poly.length, poly.reduce((s, v) => s + v[1], 0) / poly.length, poly.reduce((s, v) => s + v[2], 0) / poly.length];
  const start = travelAt(fs, c, fi);
  const queue: { t: Travel; carried: Vec3 | null }[] = [{ t: start, carried: nextCarried(null, dirOf(start)) }];
  const seen = new Set<string>();
  const reached = new Set<number>([fi]);
  let worst = 0;
  const key = (t: Travel, k: Vec3 | null) => `${t.facet}|${t.p.map((x) => Math.round(x * 100)).join(",")}|${k === null ? "-" : k.map((x) => Math.round(x * 4)).join(",")}`;
  while (queue.length > 0 && seen.size < 6000) {
    const { t, carried } = queue.shift()!;
    const k0 = key(t, carried);
    if (seen.has(k0)) continue;
    seen.add(k0);
    for (const [comp, mm] of [["x", 2], ["x", -2], ["y", 2], ["y", -2]] as const) {
      const r = travelStep(fs, t, comp, mm, TO, rule ? (n) => viewAllowed(dirOf(n), carried) : undefined);
      const u = dirOf(r.travel);
      const nc = nextCarried(carried, u);
      reached.add(r.travel.facet);
      if (!inCone(u)) {
        const g = gravityUp(u);
        // the turn the up would have to make arriving here: gravity's against the one carried so far (⛔ against the one after the step: 0 by definition)
        const kk = carried === null ? null : unit(sub(carried, [u[0] * dot(carried, u), u[1] * dot(carried, u), u[2] * dot(carried, u)]));
        if (g !== null && kk !== null) worst = Math.max(worst, Math.acos(Math.max(-1, Math.min(1, dot(g, kk)))) / D);
      }
      queue.push({ t: r.travel, carried: nc });
    }
  }
  return { reached, worstDeg: worst, states: seen.size };
}

describe("⭐⭐⭐ the view's rule — every face reachable, no slanted view reached (§22.2 T5, §22.4 C2)", () => {
  for (const [name, s] of Object.entries(SHAPES))
    it(`⭐⭐⭐ ${name}: every facet reached from a wall by dx / dy; the view never slanted past the margin`, () => {
      const map = buildFaceMap(s.faces, s.box);
      expect(map.facets.length).toBe(FACETS[name]);
      const r = explore(map);
      expect(r.states).toBeGreaterThan(50);
      expect([...r.reached].sort((a, b) => a - b)).toEqual(map.facets.map((_, i) => i));
      expect(r.worstDeg).toBeLessThanOrEqual(UP_MARGIN_RAD / D + 1e-6);
    });
  it("⭐⭐ not vacuous: without the view's rule the same search reaches slanted / upside-down views (past a top's far edge, off its sides)", () => {
    const s = SHAPES.painting!;
    expect(explore(buildFaceMap(s.faces, s.box), false).worstDeg).toBeGreaterThan(60);
  });
});
