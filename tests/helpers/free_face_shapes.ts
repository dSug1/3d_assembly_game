/**
 * ⭐ THE 35 SHAPES of the offline prototype's test table (`scripts/probes/chart_lib.ts`, `SHAPES`), rebuilt here because a test must not import from
 * `scripts/` — each built exactly as there (`scripts/probes/shapes_lib.ts`: the same points in the same order, so the same hulls), read through the REAL
 * face map by `chart_shapes.ts`'s `solid`. Used by `tests/free_face.test.ts` (step C2, `TILTED_POLE_CLOSE_IN.md` §7).
 */
import type { Vec3 } from "../../src/core/vec";
import { hullPolys, tippedPolys } from "./chart_shapes";

const D = Math.PI / 180;
const W = 0.483;
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => {
  const l = len(a);
  return l > 1e-15 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 1, 0];
};

/** the prototype's `toUp`: the rotation bringing the unit vector `from` onto +y (straight down: a half turn about x) */
function toUp(from: Vec3): (v: Vec3) => Vec3 {
  const f = unit(from);
  const ax = cross(f, [0, 1, 0]);
  const s = len(ax);
  const c = f[1];
  if (s < 1e-12) return c > 0 ? (v) => v : (v) => [v[0], -v[1], -v[2]];
  const a: Vec3 = [ax[0] / s, ax[1] / s, ax[2] / s];
  return (v) => {
    const k = dot(a, v) * (1 - c);
    const x = cross(a, v);
    return [v[0] * c + x[0] * s + a[0] * k, v[1] * c + x[1] * s + a[1] * k, v[2] * c + x[2] * s + a[2] * k];
  };
}
/** turned about z through the middle by `deg` (x toward y), set on the floor */
function turned(polys: Vec3[][], deg: number): Vec3[][] {
  const c = Math.cos(deg * D);
  const s = Math.sin(deg * D);
  const mid: Vec3 = [0, W / 2, 0];
  const r = polys.map((p) =>
    p.map((v): Vec3 => {
      const x = v[0] - mid[0];
      const y = v[1] - mid[1];
      return [x * c - y * s, x * s + y * c, v[2]];
    }),
  );
  const y0 = Math.min(...r.flat().map((v) => v[1]));
  return r.map((p) => p.map((v): Vec3 => [v[0], v[1] - y0, v[2]]));
}
function floored(points: Vec3[]): Vec3[] {
  const y0 = Math.min(...points.map((v) => v[1]));
  return points.map((v): Vec3 => [v[0], v[1] - y0, v[2]]);
}
const PHI = (1 + Math.sqrt(5)) / 2;
const ICO: Vec3[] = [];
for (const s1 of [1, -1]) for (const s2 of [1, -1]) ICO.push([0, s1, s2 * PHI], [s1, s2 * PHI, 0], [s1 * PHI, 0, s2]);
const OCT: Vec3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const DOD: Vec3[] = [];
for (const a of [1, -1]) for (const b of [1, -1]) for (const c of [1, -1]) DOD.push([a, b, c]);
for (const a of [1, -1]) for (const b of [1, -1]) DOD.push([0, a / PHI, b * PHI], [a / PHI, b * PHI, 0], [a * PHI, 0, b / PHI]);
const TET: Vec3[] = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
function onSphere(points: Vec3[], r: number, up?: Vec3): Vec3[] {
  const t = up ? toUp(up) : (v: Vec3) => v;
  return floored(points.map((v) => mul(unit(v), r)).map(t));
}
function boxPts(x: number, y: number, z: number): Vec3[] {
  const o: Vec3[] = [];
  for (const a of [-x / 2, x / 2]) for (const b of [0, y]) for (const c of [-z / 2, z / 2]) o.push([a, b, c]);
  return o;
}
function prismV(n: number, r: number, h: number): Vec3[] {
  const o: Vec3[] = [];
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * (k + 0.5)) / n;
    o.push([r * Math.cos(a), 0, r * Math.sin(a)], [r * Math.cos(a), h, r * Math.sin(a)]);
  }
  return o;
}
function frustum(b: number, t: number, h: number): Vec3[] {
  const o: Vec3[] = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) o.push([(sx * b) / 2, 0, (sz * b) / 2], [(sx * t) / 2, h, (sz * t) / 2]);
  return o;
}
function wedgeV(w: number, l: number, h: number): Vec3[] {
  const tri: [number, number][] = [[-w / 2, -l / 2], [w / 2, -l / 2], [0, l / 2]];
  return tri.flatMap(([x, z]): Vec3[] => [[x, 0, z], [x, h, z]]);
}
const house = (x: number, y: number, z: number, rise: number): Vec3[] => [...boxPts(x, y, z), [-x / 2, y + rise, 0], [x / 2, y + rise, 0]];
function cubeRot(deg: number, about: Vec3): Vec3[][] {
  const c = Math.cos(deg * D);
  const s = Math.sin(deg * D);
  const k = unit(about);
  const r = (v: Vec3): Vec3 => add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
  return hullPolys(floored(boxPts(W, W, W).map((v) => r([v[0], v[1] - 0.2415, v[2]]))));
}

/** the prototype's test table, in its order (`key`: the prototype's own key, where it has one) */
export const FREE_FACE_SHAPES: readonly { name: string; polys: () => Vec3[][]; key?: string }[] = [
  { name: "cube (Scene_1's box)", polys: () => hullPolys(boxPts(W, W, W)), key: "scene1" },
  { name: "heptagon lying, flat ends (Scene_0)", polys: () => tippedPolys(7, 0), key: "scene0" },
  { name: "heptagon lying with tips 120 mm (Scene_0bis)", polys: () => tippedPolys(7, 0.12), key: "scene0bis" },
  { name: "heptagon lying with tips, the apex 12.6 mm off centre", polys: () => tippedPolys(7, 0.12, false) },
  { name: "heptagon lying with STEEP tips 600 mm", polys: () => tippedPolys(7, 0.6) },
  { name: "triangle prism lying, flat ends (a steep roof)", polys: () => tippedPolys(3, 0) },
  { name: "triangle prism lying with tips (fans of 3)", polys: () => tippedPolys(3, 0.12), key: "fan3" },
  { name: "square prism lying with tips (fans of 4)", polys: () => tippedPolys(4, 0.12) },
  { name: "pentagon lying with tips, the apex 25 mm off centre", polys: () => tippedPolys(5, 0.12, false) },
  { name: "hexagon prism lying with tips", polys: () => tippedPolys(6, 0.12) },
  { name: "heptagon with tips, its axis 20° off the horizontal", polys: () => turned(tippedPolys(7, 0.12), 20), key: "tilt20" },
  { name: "heptagon with tips, its axis at 45°", polys: () => turned(tippedPolys(7, 0.12), 45) },
  { name: "heptagon with tips, upright", polys: () => turned(tippedPolys(7, 0.12), 90) },
  { name: "pentagon prism upright, flat caps", polys: () => turned(tippedPolys(5, 0), 90), key: "pentagon" },
  { name: "box with a shallow pyramid roof", polys: () => hullPolys([...boxPts(W, 0.3, W), [0, 0.45, 0]]) },
  { name: "box with a steep pyramid roof", polys: () => hullPolys([...boxPts(W, 0.3, W), [0, 0.8, 0]]), key: "pyramid" },
  {
    name: "shed (a box under one slanted roof, 60°)",
    polys: () => hullPolys([[-0.24, 0, -0.24], [0.24, 0, -0.24], [-0.24, 0, 0.24], [0.24, 0, 0.24], [-0.24, 0.2, -0.24], [0.24, 0.2, -0.24], [-0.24, 0.2 + 0.48 * Math.tan(60 * D), 0.24], [0.24, 0.2 + 0.48 * Math.tan(60 * D), 0.24]]),
    key: "shed",
  },
  { name: "house, shallow gable roof", polys: () => hullPolys(house(0.6, 0.3, W, 0.12)) },
  { name: "house, steep gable roof", polys: () => hullPolys(house(0.6, 0.3, W, 0.42)), key: "gable" },
  { name: "frustum, sides leaning in 30°", polys: () => hullPolys(frustum(W, 0.137, 0.3)), key: "frustum" },
  { name: "frustum upside down", polys: () => hullPolys(frustum(0.137, W, 0.3)) },
  { name: "triangle prism upright, flat caps", polys: () => hullPolys(prismV(3, 0.28, W)) },
  { name: "wedge upright (a 20° blade)", polys: () => hullPolys(wedgeV(0.15, 0.425, W)) },
  { name: "thin plate lying", polys: () => hullPolys(boxPts(W, 0.06, W)) },
  { name: "long box", polys: () => hullPolys(boxPts(0.8, 0.2, 0.2)) },
  { name: "cube turned 30° about a level axis (faces' edges 30° off level)", polys: () => cubeRot(30, [1, 0, 0]), key: "turned30" },
  { name: "cube on an edge (turned 45°)", polys: () => cubeRot(45, [1, 0, 0]) },
  { name: "cube on a corner", polys: () => hullPolys(onSphere(boxPts(1, 1, 1).map((v): Vec3 => [v[0], v[1] - 0.5, v[2]]), 0.4, [1, 1, 1])), key: "corner" },
  {
    name: "square antiprism",
    polys: () => hullPolys([...[0, 1, 2, 3].map((k): Vec3 => [0.3 * Math.cos((k * 90 + 45) * D), 0, 0.3 * Math.sin((k * 90 + 45) * D)]), ...[0, 1, 2, 3].map((k): Vec3 => [0.3 * Math.cos(k * 90 * D), 0.4, 0.3 * Math.sin(k * 90 * D)])]),
  },
  { name: "tetrahedron on a face", polys: () => hullPolys(onSphere(TET, 0.3, [-1, -1, -1])) },
  { name: "octahedron on a vertex", polys: () => hullPolys(onSphere(OCT, 0.25)) },
  { name: "octahedron on a face", polys: () => hullPolys(onSphere(OCT, 0.25, [1, 1, 1])) },
  { name: "icosahedron, a vertex up", polys: () => hullPolys(onSphere(ICO, 0.25, ICO[0]!)), key: "icosa" },
  {
    name: "dodecahedron, a face up",
    polys: () => {
      const h = hullPolys(onSphere(DOD, 0.25));
      const n = cross(sub(h[0]![1]!, h[0]![0]!), sub(h[0]![2]!, h[0]![0]!));
      return hullPolys(onSphere(DOD, 0.25, n));
    },
    key: "dodeca",
  },
  {
    name: "hull of two tipped heptagons crossed (fans on x and on z)",
    polys: () => {
      const sp = tippedPolys(7, 0.12).flat();
      return hullPolys([...sp, ...sp.map((v): Vec3 => [v[2], v[1], v[0]])]);
    },
  },
];
