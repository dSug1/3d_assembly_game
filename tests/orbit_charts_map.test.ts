/**
 * GOLDEN VECTORS — **THE ORBIT ON CHARTS, STEP 1.1** (2026-11-15, `Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md` §2.2, §7.2; the owner: *"Charts approved.
 * … Proceed with execution."*): `buildFaceMap`'s two options, not wired yet.
 * * The options ABSENT: today's map, exactly (a box, `Scene_0`'s lying heptagon).
 * * `layout: "chart"` — the pole the shape's TOP / BOTTOM SET (a facet level within 1°: a cap; else the pole itself, the side band to ±90°), the columns by
 *   heading within 0.5°, the levels every side facet's level edge: a box's map unchanged; a shed's 60° roof a side up to 90°; a steep pyramid roof no
 *   longer pinned on its apex.
 * * `scale: "normals"` — each level halfway between the elevations of the facets meeting there, by the edges' lengths: ±45° on a box; the prototype's
 *   (`scripts/probes/chart_lib.ts`, `buildChart`) level pitches on the lying heptagon, pinned. The whole comparison on 35 shapes:
 *   `scripts/probes/chart_port_check.ts`.
 * RED on the commit before (`510bbd8`) and on the mutants recorded in the step's report.
 */
import { describe, expect, it } from "vitest";
import { buildFaceMap, DEFAULT_FACET_OPTS, mapTarget, type FaceMap, type FacetOpts, type MapFace } from "../src/input/face_map";
import { prismOutline } from "../src/core/prism";
import type { Vec3 } from "../src/core/vec";
import type { ShellBox } from "../src/input/orbit_shell";

const D = Math.PI / 180;
const O0 = { edgeMm: 0, edgeDeg: 0 };
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const CHART: FacetOpts = { ...DEFAULT_FACET_OPTS, layout: "chart" };
const NORMALS: FacetOpts = { ...DEFAULT_FACET_OPTS, layout: "chart", scale: "normals" };

/** a convex solid from its polygons: each a face, oriented outward from the box's middle, its triangles a fan; the box its bounds */
function solid(polys: readonly (readonly Vec3[])[]): { faces: MapFace[]; box: ShellBox } {
  const vs = polys.flat();
  const lo: Vec3 = [Math.min(...vs.map((v) => v[0])), Math.min(...vs.map((v) => v[1])), Math.min(...vs.map((v) => v[2]))];
  const hi: Vec3 = [Math.max(...vs.map((v) => v[0])), Math.max(...vs.map((v) => v[1])), Math.max(...vs.map((v) => v[2]))];
  const mid: Vec3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const faces = polys.map((p): MapFace => {
    const c = cross(sub(p[1]!, p[0]!), sub(p[2]!, p[0]!));
    const l = Math.hypot(...c);
    const tris: [Vec3, Vec3, Vec3][] = [];
    for (let i = 1; i + 1 < p.length; i++) tris.push([p[0]!, p[i]!, p[i + 1]!]);
    const centre: Vec3 = [p.reduce((s, v) => s + v[0], 0) / p.length, p.reduce((s, v) => s + v[1], 0) / p.length, p.reduce((s, v) => s + v[2], 0) / p.length];
    let n: Vec3 = [c[0] / l, c[1] / l, c[2] / l];
    if (dot(n, sub(centre, mid)) < 0) n = [-n[0], -n[1], -n[2]];
    return { normal: n, centre, tris, part: "p" };
  });
  return { faces, box: { lo, hi } };
}
/** a box x × y × z, its bottom at y 0, centred in x / z, as six quads (corners counter-clockwise or not: `solid` orients them) */
function boxPolys(x: number, y: number, z: number): Vec3[][] {
  const [a, b] = [x / 2, z / 2];
  return [
    [[-a, 0, -b], [a, 0, -b], [a, 0, b], [-a, 0, b]],
    [[-a, y, -b], [a, y, -b], [a, y, b], [-a, y, b]],
    [[-a, 0, -b], [a, 0, -b], [a, y, -b], [-a, y, -b]],
    [[-a, 0, b], [a, 0, b], [a, y, b], [-a, y, b]],
    [[-a, 0, -b], [-a, 0, b], [-a, y, b], [-a, y, -b]],
    [[a, 0, -b], [a, 0, b], [a, y, b], [a, y, -b]],
  ];
}
/** `Scene_0`'s heptagon LYING along x (the prototype's `tippedPolys(7, 0)`): `prismOutline(7, 0.483, 0.483)` on its bottom edge, x ±0.245, flat ends */
function heptagonPolys(): Vec3[][] {
  const W = 0.483;
  const prof = prismOutline(7, W, W)!.map(([z, y]) => [z, y + W / 2] as const);
  const at = (x: number, k: number): Vec3 => [x, prof[k]![1], prof[k]![0]];
  const n = prof.length;
  const out: Vec3[][] = [];
  for (let k = 0; k < n; k++) out.push([at(-0.245, k), at(-0.245, (k + 1) % n), at(0.245, (k + 1) % n), at(0.245, k)]);
  out.push([...Array(n)].map((_, k) => at(0.245, k)));
  out.push([...Array(n)].map((_, k) => at(-0.245, k)));
  return out;
}
/** a SHED: a 0.48 m square box 0.2 m high under one roof rising 60° from its front (−z) to its back (+z) */
function shedPolys(): Vec3[][] {
  const a = 0.24;
  const top = 0.2 + 0.48 * Math.tan(60 * D);
  return [
    [[-a, 0, -a], [a, 0, -a], [a, 0, a], [-a, 0, a]],
    [[-a, 0, -a], [a, 0, -a], [a, 0.2, -a], [-a, 0.2, -a]],
    [[-a, 0, a], [a, 0, a], [a, top, a], [-a, top, a]],
    [[-a, 0, -a], [-a, 0, a], [-a, top, a], [-a, 0.2, -a]],
    [[a, 0, -a], [a, 0, a], [a, top, a], [a, 0.2, -a]],
    [[-a, 0.2, -a], [a, 0.2, -a], [a, top, a], [-a, top, a]],
  ];
}
/** a box 0.483 × 0.3 × 0.483 under a STEEP pyramid roof, its apex at 0.8 m (the roof's faces 64° from level, their normals 26° up) */
function pyramidPolys(): Vec3[][] {
  const a = 0.483 / 2;
  const h = 0.3;
  const apex: Vec3 = [0, 0.8, 0];
  const c: Vec3[] = [[-a, h, -a], [a, h, -a], [a, h, a], [-a, h, a]];
  const walls = boxPolys(0.483, h, 0.483).filter((_, i) => i !== 1);
  return [...walls, ...c.map((p, k) => [p, c[(k + 1) % 4]!, apex])];
}

const BOX = solid(boxPolys(0.483, 0.483, 0.483));
const HEPT = solid(heptagonPolys());
const SHED = solid(shedPolys());
const PYRAMID = solid(pyramidPolys());
/** the column whose slice holds `yaw` */
const columnOf = (m: FaceMap, yaw: number) => m.columns.find((c) => Math.abs(Math.atan2(Math.sin(yaw - c.mid), Math.cos(yaw - c.mid))) <= c.hw + 1e-12)!;

describe("⭐⭐⭐ the options ABSENT: today's map, exactly", () => {
  it("a box: deep-equal to the map built with the defaults named; its columns ±45°, no levels, its two caps real", () => {
    const m = buildFaceMap(BOX.faces, BOX.box);
    expect(m).toEqual(buildFaceMap(BOX.faces, BOX.box, { ...DEFAULT_FACET_OPTS, layout: "built", scale: "built" }));
    expect(m.levels).toBeUndefined();
    expect(m.columns.map((c) => c.bounds)).toEqual([...Array(4)].map(() => [-Math.PI / 4, Math.PI / 4]));
    expect(m.facets.map((f) => `${f.kind}${f.real ? "" : "v"}`)).toEqual(["SIDE", "SIDE", "SIDE", "SIDE", "TOP", "BOTTOM"]);
  });
  it("the lying heptagon: deep-equal to the defaults named; today's height scale pinned (the ridge's virtual cap, the band to 90°)", () => {
    const m = buildFaceMap(HEPT.faces, HEPT.box);
    expect(m).toEqual(buildFaceMap(HEPT.faces, HEPT.box, { ...DEFAULT_FACET_OPTS, layout: "built", scale: "built" }));
    expect(m.levels!.p).toEqual([-0.7853981633974483, 0.05551791410259099, 1.1041231111832355, 1.5707963267948966]);
    expect(m.levels!.y).toEqual([-2.7755575615628914e-17, 0.1723807041919373, 0.38733592639373693, 0.4830000000000002]);
    expect(m.facets[m.top]!.real).toBe(false);
  });
});

describe("⭐⭐⭐ layout \"chart\" (§2.2): the pole the top / bottom set, the columns by heading, the levels every level edge", () => {
  it("a box: the same map as today, deep-equal", () => {
    expect(buildFaceMap(BOX.faces, BOX.box, CHART)).toEqual(buildFaceMap(BOX.faces, BOX.box));
  });
  it("⭐ a shed's 60° roof is a SIDE: no cap above it, its column's band to 90°, the place up the roof to its high edge (⛔ today: the band to 45°, then pinned on the top edge's middle)", () => {
    const m = buildFaceMap(SHED.faces, SHED.box, CHART);
    const roof = m.facets.findIndex((f) => Math.abs(f.n[1] - 0.5) < 1e-9);
    expect(m.facets[roof]!.kind).toBe("SIDE");
    expect(m.facets[m.top]!.real).toBe(false);
    for (const c of m.columns) expect(c.bounds[c.bounds.length - 1]).toBe(Math.PI / 2);
    const yaw = -Math.PI / 2; // the roof faces −z
    expect(columnOf(m, yaw).facets).toContain(roof);
    const top = 0.2 + 0.48 * Math.tan(60 * D);
    const ys: number[] = [];
    for (const p of [60, 70, 80, 90]) {
      const t = mapTarget(m, yaw, p * D, O0);
      expect(t.band).toBe("SIDE");
      expect(t.stack).toBe(roof);
      ys.push(t.surface[1]);
    }
    for (let k = 1; k < ys.length; k++) expect(ys[k]!).toBeGreaterThan(ys[k - 1]! + 0.03);
    expect(ys[3]!).toBeCloseTo(top, 12);
  });
  it("⭐ a box under a STEEP pyramid roof: the place MOVES between pitch 60° and 80° up a roof face (⛔ today pinned on the apex — the virtual cap a point)", () => {
    const today = buildFaceMap(PYRAMID.faces, PYRAMID.box);
    const a60 = mapTarget(today, 0, 60 * D, O0).surface;
    expect(dist(a60, mapTarget(today, 0, 80 * D, O0).surface)).toBeLessThan(1e-9);
    expect(dist(a60, [0, 0.8, 0])).toBeLessThan(1e-9);
    const m = buildFaceMap(PYRAMID.faces, PYRAMID.box, CHART);
    const p60 = mapTarget(m, 0, 60 * D, O0);
    const p80 = mapTarget(m, 0, 80 * D, O0);
    expect(p60.band).toBe("SIDE");
    expect(p80.stack).toBe(p60.stack);
    expect(m.facets[p60.stack]!.n[1]).toBeGreaterThan(0.4);
    expect(dist(p60.surface, p80.surface)).toBeGreaterThan(0.1);
    expect(p80.surface[1]).toBeGreaterThan(p60.surface[1] + 0.1);
    expect(dist(mapTarget(m, 0, 90 * D, O0).surface, [0, 0.8, 0])).toBeLessThan(1e-9);
  });
});

describe("⭐⭐⭐ scale \"normals\" (§2.2, §5.2): each level halfway between the facets meeting there, by the edges' lengths", () => {
  it("a box: ±45° — the same places as the built scale", () => {
    const m = buildFaceMap(BOX.faces, BOX.box, NORMALS);
    const b = buildFaceMap(BOX.faces, BOX.box);
    for (const c of m.columns) {
      expect(c.bounds.length).toBe(2);
      expect(c.bounds[0]!).toBeCloseTo(-Math.PI / 4, 14);
      expect(c.bounds[1]!).toBeCloseTo(Math.PI / 4, 14);
    }
    for (let y = 0; y < 360; y += 15) for (let p = -90; p <= 90; p += 10) expect(dist(mapTarget(m, y * D, p * D, O0).surface, mapTarget(b, y * D, p * D, O0).surface)).toBeLessThan(1e-12);
  });
  it("⭐ the lying heptagon: the prototype's level pitches (`buildChart(…, [0, 1, 0], \"normals\")`, pinned) — the bottom −58.16°, the pole 90°", () => {
    const m = buildFaceMap(HEPT.faces, HEPT.box, NORMALS);
    const ref = [-1.0150722833595585, -0.22095171947275585, 0.6654733009920436, 1.5707963267948966];
    expect(m.levels!.p.length).toBe(ref.length);
    m.levels!.p.forEach((p, k) => expect(p).toBeCloseTo(ref[k]!, 12));
    expect(m.levels!.y).toEqual([-2.7755575615628914e-17, 0.17238070419193718, 0.3873359263937369, 0.4830000000000002]);
    // a stacked column's bounds are its levels' pitches (the sides of the heptagon: three facets, the ends one)
    const side = m.columns.find((c) => c.facets.length === 3)!;
    side.bounds.forEach((p, k) => expect(p).toBeCloseTo(ref[k]!, 12));
  });
});
