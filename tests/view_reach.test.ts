/**
 * ⭐⭐⭐ T5 — EVERY FACE REACHABLE, THE VIEW NEVER STEPPING (2026-11-06, the second rebuild — `TILTED_ORBIT_REBUILD_SCOPE.md` §26.3; the owner: *"there shall
 * be a lean only if the next contour face can be reached"*; *"Check if any face would be reachable by the gizmo in the case of a more complex assembly
 * geometry: for example if the assembly was a horizontally extruded hexagon, a vertically extruded hexagon, a pyramid like the green piece"*). From a wall,
 * every sequence of dx / dy (a breadth-first search over the travel's places, a face crossed only where the view is continuous — `sameView`): every facet
 * of the contour reached; no step turns the view (its direction or its up) by more than the travel's own turn; never a roll (the right level — by
 * construction, `loop_view.test.ts`). Without T5 the same search steps the view over 60° (a cap's far wall, its side walls). RED against `1.0.103-` (the
 * view's hold on a 20° cone and a carried up — the module absent; there the stuck bottom face).
 */
import { describe, expect, it } from "vitest";
import { buildFaceMap, type FaceMap, type MapFace } from "../src/input/face_map";
import { sameView, viewAt, viewDir, viewFacets, viewUp, type ViewOpts } from "../src/input/loop_view";
import { isCapNormal, travelAt, travelStep, type CrossOk, type Travel, type TravelFacet } from "../src/input/loop_travel";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const O: ViewOpts = { shareH: 0.25, shareV: 0.25, edgeRad: 10 * D, edgeM: 0.01 };
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

/** the breadth-first search: the facets reached, and the worst view step (its direction or its up, deg) of one 2 mm step */
function explore(map: FaceMap, rule = true): { reached: Set<number>; worstStepDeg: number; states: number } {
  const fs: TravelFacet[] = map.facets.map((f) => ({ n: f.n, poly: f.poly, cap: isCapNormal(f.n) }));
  const vf = viewFacets(map.facets);
  const view = (t: Travel) => viewAt(vf, t.facet, t.p, t.entry, O);
  const crossOk: CrossOk = (a, b) => sameView(view(a), view(b));
  // the start: the facet facing −z the most, its centre
  let fi = 0;
  fs.forEach((f, i) => {
    if (f.n[2] < fs[fi]!.n[2]) fi = i;
  });
  const poly = map.facets[fi]!.poly;
  const c: Vec3 = [poly.reduce((s, v) => s + v[0], 0) / poly.length, poly.reduce((s, v) => s + v[1], 0) / poly.length, poly.reduce((s, v) => s + v[2], 0) / poly.length];
  const queue: Travel[] = [travelAt(fs, c, fi)];
  const seen = new Set<string>();
  const reached = new Set<number>([fi]);
  let worst = 0;
  const key = (t: Travel) => `${t.facet}|${t.p.map((x) => Math.round(x * 500)).join(",")}|${t.entry === null ? "-" : t.entry.map((x) => Math.round(x * 4)).join(",")}`;
  while (queue.length > 0 && seen.size < 40000) {
    const t = queue.shift()!;
    const k0 = key(t);
    if (seen.has(k0)) continue;
    seen.add(k0);
    const v0 = view(t);
    for (const [comp, mm] of [["x", 2], ["x", -2], ["y", 2], ["y", -2]] as const) {
      const r = travelStep(fs, t, comp, mm, TO, rule ? crossOk : undefined);
      const v1 = view(r.travel);
      const step = Math.max(Math.acos(Math.max(-1, Math.min(1, dot(viewDir(v0), viewDir(v1))))), Math.acos(Math.max(-1, Math.min(1, dot(viewUp(v0), viewUp(v1))))));
      worst = Math.max(worst, step / D);
      reached.add(r.travel.facet);
      queue.push({ ...r.travel, hold: { x: 0, y: 0 } });
    }
  }
  return { reached, worstStepDeg: worst, states: seen.size };
}

describe("⭐⭐⭐ T5 — every face reachable, the view never stepping (§26.3)", () => {
  for (const [name, s] of Object.entries(SHAPES))
    it(`⭐⭐⭐ ${name}: every facet reached from a wall by dx / dy`, () => {
      const map = buildFaceMap(s.faces, s.box);
      expect(map.facets.length).toBe(FACETS[name]);
      const r = explore(map);
      expect(r.states).toBeGreaterThan(50);
      expect([...r.reached].sort((a, b) => a - b)).toEqual(map.facets.map((_, i) => i));
    });
  it("⭐⭐⭐ the box (`Scene_1`'s contour): no 2 mm step turns the view beyond the travel's own 10° and the profile's slope — no jump anywhere, a top and a bottom included", () => {
    const s = SHAPES.painting!;
    expect(explore(buildFaceMap(s.faces, s.box)).worstStepDeg).toBeLessThan(25);
  });
  it("⭐⭐⭐ a slanted edge (the frustum's front and side): the two faces' views MEET all along it — a neighbour both loops reach leans once (⛔ summed: twice as far)", () => {
    const s = SHAPES.frustum!;
    const map = buildFaceMap(s.faces, s.box);
    const vf = viewFacets(map.facets);
    const front = map.facets.findIndex((f) => f.n[2] < -0.9);
    const side = map.facets.findIndex((f) => f.n[0] > 0.9);
    // the common edge: base (0.15, 0, −0.1) → top (0.075, 0.45, −0.05)
    for (const k of [0.2, 0.35, 0.5, 0.65, 0.8]) {
      const p: Vec3 = [0.15 - 0.075 * k, 0.45 * k, -0.1 + 0.05 * k];
      expect(sameView(viewAt(vf, front, p, null, O), viewAt(vf, side, p, null, O))).toBe(true);
    }
  });
  it("⭐⭐ not vacuous: without T5 the same search steps the view over 40° in one step (past a cap's far edge, off its sides)", () => {
    const s = SHAPES.painting!;
    expect(explore(buildFaceMap(s.faces, s.box), false).worstStepDeg).toBeGreaterThan(40);
  });
});
