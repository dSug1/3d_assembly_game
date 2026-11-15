/**
 * ⭐ Synthetic convex solids for the orbit-on-charts vectors (`ORBIT_CHARTS.md` §7.2) — each a list of polygons, read through the REAL face map. The
 * same shapes as the offline prototype's (`scripts/probes/shapes_lib.ts`), rebuilt here because a test must not import from `scripts/`.
 */
import type { Vec3 } from "../../src/core/vec";
import type { MapFace } from "../../src/input/face_map";
import type { ShellBox } from "../../src/input/orbit_shell";
import { prismOutline } from "../../src/core/prism";
import { convexHull3 } from "../../src/core/hull3";

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => {
  const l = len(a);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** a convex solid from its polygons: each a face, oriented outward from the box's middle, its triangles a fan; the box its bounds */
export function solid(polys: readonly (readonly Vec3[])[]): { faces: MapFace[]; box: ShellBox } {
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
export function boxPolys(x: number, y: number, z: number): Vec3[][] {
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

/**
 * an N-gon prism LYING along x (`prismOutline(sides, 0.483, 0.483)` on its bottom edge, x ±0.245), flat ends (`tip` 0) or a pyramid tip `tip` out on
 * each end — its apex on the polygon's own centre (`centred`) or on its bounding box's (the prototype's `tippedPolys`)
 */
export function tippedPolys(sides: number, tip: number, centred = true): Vec3[][] {
  const W = 0.483;
  const HX = 0.245;
  const prof = prismOutline(sides, W, W)!.map(([z, y]) => [z, y + W / 2] as const);
  const at = (x: number, k: number): Vec3 => [x, prof[k]![1], prof[k]![0]];
  const n = prof.length;
  const out: Vec3[][] = [];
  for (let k = 0; k < n; k++) out.push([at(-HX, k), at(-HX, (k + 1) % n), at(HX, (k + 1) % n), at(HX, k)]);
  if (tip > 0)
    for (const s of [1, -1]) {
      const cy = centred ? prof.reduce((t, q) => t + q[1], 0) / n : W / 2;
      const cz = centred ? prof.reduce((t, q) => t + q[0], 0) / n : 0;
      const apex: Vec3 = [s * (HX + tip), cy, cz];
      for (let k = 0; k < n; k++) out.push([at(s * HX, k), at(s * HX, (k + 1) % n), apex]);
    }
  else {
    out.push([...Array(n)].map((_, k) => at(HX, k)));
    out.push([...Array(n)].map((_, k) => at(-HX, k)));
  }
  return out;
}

/** `Scene_0`'s heptagon LYING along x, flat ends (the prototype's `tippedPolys(7, 0)`) */
export const heptagonPolys = (): Vec3[][] => tippedPolys(7, 0);

/** the convex hull of the points, as its triangles (the face map merges the coplanar ones into one facet) */
export function hullPolys(points: readonly Vec3[]): Vec3[][] {
  const h = convexHull3(points)!;
  return h.triangles.map(([a, b, c]) => [h.points[a]!, h.points[b]!, h.points[c]!]);
}

/** the points scaled onto a sphere of radius `r`, turned so the direction `up` points up, set on the floor (y ≥ 0) */
export function onSphere(points: readonly Vec3[], r: number, up: Vec3): Vec3[] {
  const f = unit(up);
  const ax = cross(f, [0, 1, 0]);
  const s = len(ax);
  const c = f[1];
  const turn = (v: Vec3): Vec3 => {
    if (s < 1e-12) return v;
    const a: Vec3 = [ax[0] / s, ax[1] / s, ax[2] / s];
    const k = dot(a, v) * (1 - c);
    const x = cross(a, v);
    return [v[0] * c + x[0] * s + a[0] * k, v[1] * c + x[1] * s + a[1] * k, v[2] * c + x[2] * s + a[2] * k];
  };
  const P = points.map((v) => {
    const u = unit(v);
    return turn([u[0] * r, u[1] * r, u[2] * r]);
  });
  const y0 = Math.min(...P.map((v) => v[1]));
  return P.map((v) => [v[0], v[1] - y0, v[2]]);
}

const PHI = (1 + Math.sqrt(5)) / 2;
/** a cube's eight corners about its centre */
export const CUBE: Vec3[] = [];
for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) CUBE.push([a, b, c]);
/** an icosahedron's twelve vertices */
export const ICO: Vec3[] = [];
for (const s1 of [1, -1]) for (const s2 of [1, -1]) ICO.push([0, s1, s2 * PHI], [s1, s2 * PHI, 0], [s1 * PHI, 0, s2]);
/** a dodecahedron's twenty vertices; a face's normal: (0, φ, 1) */
export const DOD: Vec3[] = [...CUBE];
for (const a of [1, -1]) for (const b of [1, -1]) DOD.push([0, a / PHI, b * PHI], [a / PHI, b * PHI, 0], [a * PHI, 0, b / PHI]);
export const DOD_FACE: Vec3 = [0, PHI, 1];

/**
 * a BARREL: an upright square box (0.4 × 1 × 0.4) bevelled 22° in over its bottom and top 50 mm — the rings' mean elevations give its two inner levels
 * pitches only 22° apart over 90 % of its height, and the repair spreads them (`ring_chart.test.ts`)
 */
export function barrelPolys(): Vec3[][] {
  const inset = 0.05 * Math.tan((22 * Math.PI) / 180);
  const P: Vec3[] = [];
  for (const [y, h] of [[0, 0.2 - inset], [0.05, 0.2], [0.95, 0.2], [1, 0.2 - inset]] as const) for (const a of [-1, 1]) for (const b of [-1, 1]) P.push([a * h, y, b * h]);
  return hullPolys(P);
}

/** the prototype's SHED: a 0.48 m box 0.2 m tall under one roof slanted 60° (its top an edge at the back) — the spine from its bottom's centre slants */
export function shedPolys(): Vec3[][] {
  const r = 0.2 + 0.48 * Math.tan(Math.PI / 3);
  return hullPolys([[-0.24, 0, -0.24], [0.24, 0, -0.24], [-0.24, 0, 0.24], [0.24, 0, 0.24], [-0.24, 0.2, -0.24], [0.24, 0.2, -0.24], [-0.24, r, 0.24], [0.24, r, 0.24]]);
}
