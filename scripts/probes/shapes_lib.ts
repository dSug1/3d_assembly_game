// ⭐ Synthetic convex shapes for the orbit's offline probes (`calm_study.ts`): each a list of polygons, read through the REAL face map
// (`src/input/face_map.ts`). No engine, no browser.
import { buildFaceMap, type MapFace, type FaceMap } from "../../src/input/face_map";
import { prismOutline } from "../../src/core/prism";
import { convexHull3 } from "../../src/core/hull3";

export type V = readonly [number, number, number];
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V) => Math.hypot(a[0], a[1], a[2]);
export const unit = (a: V): V => { const l = len(a); return l > 1e-15 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 1, 0]; };
export const D = Math.PI / 180;
export const ang = (a: V, b: V): number => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (len(a) * len(b))))) / D;
export const dirOf = (yaw: number, pitch: number): V => [Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), Math.cos(pitch) * Math.sin(yaw)];

function face(vs: V[], mid: V): MapFace {
  const c = cross(sub(vs[1]!, vs[0]!), sub(vs[2]!, vs[0]!));
  const l = len(c);
  const tris: [V, V, V][] = [];
  for (let i = 1; i + 1 < vs.length; i++) tris.push([vs[0]!, vs[i]!, vs[i + 1]!]);
  const centre = [0, 1, 2].map((k) => vs.reduce((s, v) => s + v[k]!, 0) / vs.length) as unknown as V;
  let n: V = [c[0] / l, c[1] / l, c[2] / l];
  if (dot(n, sub(centre, mid)) < 0) n = [-n[0], -n[1], -n[2]];
  return { normal: n, centre, tris, part: "p" } as MapFace;
}

export const W = 0.483;
export const HX = 0.245;

/** polygons of an N-gon prism along x, flat ends (tip 0) or pyramid tips; `centred`: the apex on the polygon's own centre */
export function tippedPolys(sides: number, tip: number, centred = true): V[][] {
  const prof = prismOutline(sides, W, W)!.map(([z, y]) => [z, y + W / 2] as [number, number]);
  const at = (x: number, k: number): V => [x, prof[k]![1], prof[k]![0]];
  const n = prof.length;
  const out: V[][] = [];
  for (let k = 0; k < n; k++) out.push([at(-HX, k), at(-HX, (k + 1) % n), at(HX, (k + 1) % n), at(HX, k)]);
  if (tip > 0)
    for (const s of [1, -1]) {
      const cy = centred ? prof.reduce((t, q) => t + q[1], 0) / n : W / 2;
      const cz = centred ? prof.reduce((t, q) => t + q[0], 0) / n : 0;
      const apex: V = [s * (HX + tip), cy, cz];
      for (let k = 0; k < n; k++) out.push([at(s * HX, k), at(s * HX, (k + 1) % n), apex]);
    }
  else {
    out.push([...Array(n)].map((_, k) => at(HX, k)));
    out.push([...Array(n)].map((_, k) => at(-HX, k)));
  }
  return out;
}

/** every point turned by the rotation bringing the unit vector `from` onto +y, then set on the floor (y ≥ 0), centred in x / z */
export function toUp(from: V): (v: V) => V {
  const f = unit(from);
  const ax = cross(f, [0, 1, 0]);
  const s = len(ax);
  const c = f[1];
  if (s < 1e-12) return c > 0 ? (v) => v : (v) => [v[0], -v[1], -v[2]];
  const a: V = [ax[0] / s, ax[1] / s, ax[2] / s];
  return (v) => { const k = dot(a, v) * (1 - c); const x = cross(a, v); return [v[0] * c + x[0] * s + a[0] * k, v[1] * c + x[1] * s + a[1] * k, v[2] * c + x[2] * s + a[2] * k] as V; };
}
export function inFrame(polys: V[][], axis: V): V[][] {
  const t = toUp(axis);
  const r = polys.map((p) => p.map(t));
  const y0 = Math.min(...r.flat().map((v) => v[1]));
  return r.map((p) => p.map((v) => [v[0], v[1] - y0, v[2]] as V));
}
/** turned about z through the middle by `deg` (x toward y), set on the floor */
export function turned(polys: V[][], deg: number): V[][] {
  const c = Math.cos(deg * D);
  const s = Math.sin(deg * D);
  const mid: V = [0, W / 2, 0];
  const r = polys.map((p) => p.map((v) => { const x = v[0] - mid[0]; const y = v[1] - mid[1]; return [x * c - y * s, x * s + y * c, v[2]] as V; }));
  const y0 = Math.min(...r.flat().map((v) => v[1]));
  return r.map((p) => p.map((v) => [v[0], v[1] - y0, v[2]] as V));
}

export function boxOf(polys: V[][]): { lo: V; hi: V } {
  const vs = polys.flat();
  return { lo: [Math.min(...vs.map((v) => v[0])), Math.min(...vs.map((v) => v[1])), Math.min(...vs.map((v) => v[2]))], hi: [Math.max(...vs.map((v) => v[0])), Math.max(...vs.map((v) => v[1])), Math.max(...vs.map((v) => v[2]))] };
}
/** the polygons as `MapFace`s (outward from the box's middle) and their box — what `mapOf` builds the face map from */
export function facesOf(polys: V[][]): { faces: MapFace[]; box: { lo: V; hi: V } } {
  const b = boxOf(polys);
  const mid: V = [(b.lo[0] + b.hi[0]) / 2, (b.lo[1] + b.hi[1]) / 2, (b.lo[2] + b.hi[2]) / 2];
  return { faces: polys.map((p) => face(p, mid)), box: b };
}
export function mapOf(polys: V[][]): FaceMap {
  const { faces, box } = facesOf(polys);
  return buildFaceMap(faces, { lo: box.lo as any, hi: box.hi as any });
}
export function hullPolys(points: V[]): V[][] {
  const h = convexHull3(points)!;
  return h.triangles.map(([a, b, c]) => [h.points[a]!, h.points[b]!, h.points[c]!] as V[]);
}
/** the points set on the floor (y ≥ 0) */
export function floored(points: V[]): V[] {
  const y0 = Math.min(...points.map((v) => v[1]));
  return points.map((v) => [v[0], v[1] - y0, v[2]] as V);
}

const PHI = (1 + Math.sqrt(5)) / 2;
export const ICO: V[] = [];
for (const s1 of [1, -1]) for (const s2 of [1, -1]) { ICO.push([0, s1, s2 * PHI]); ICO.push([s1, s2 * PHI, 0]); ICO.push([s1 * PHI, 0, s2]); }
export const OCT: V[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
export const DOD: V[] = [];
for (const a of [1, -1]) for (const b of [1, -1]) for (const c of [1, -1]) DOD.push([a, b, c]);
for (const a of [1, -1]) for (const b of [1, -1]) { DOD.push([0, a / PHI, b * PHI]); DOD.push([a / PHI, b * PHI, 0]); DOD.push([a * PHI, 0, b / PHI]); }
export const TET: V[] = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
export function onSphere(points: V[], r: number, up?: V): V[] {
  const t = up ? toUp(up) : (v: V) => v;
  return floored(points.map((v) => mul(unit(v), r)).map(t));
}

/** a box lo … hi */
export function boxPts(x: number, y: number, z: number): V[] {
  const o: V[] = [];
  for (const a of [-x / 2, x / 2]) for (const b of [0, y]) for (const c of [-z / 2, z / 2]) o.push([a, b, c]);
  return o;
}
/** a vertical N-gon prism (circumradius r, height h), optionally a pyramid tip of height `tipUp` on top and `tipDown` below */
export function prismV(n: number, r: number, h: number, tipUp = 0, tipDown = 0): V[] {
  const o: V[] = [];
  for (let k = 0; k < n; k++) { const a = (2 * Math.PI * (k + 0.5)) / n; o.push([r * Math.cos(a), tipDown, r * Math.sin(a)]); o.push([r * Math.cos(a), tipDown + h, r * Math.sin(a)]); }
  if (tipUp > 0) o.push([0, tipDown + h + tipUp, 0]);
  if (tipDown > 0) o.push([0, 0, 0]);
  return o;
}
/** a square frustum: bottom side `b`, top side `t`, height `h` */
export function frustum(b: number, t: number, h: number): V[] {
  const o: V[] = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { o.push([(sx * b) / 2, 0, (sz * b) / 2]); o.push([(sx * t) / 2, h, (sz * t) / 2]); }
  return o;
}
/** a wedge standing on its triangular end: the triangle (base `w` on −z … apex at +z, length `l`) extruded up by `h` */
export function wedgeV(w: number, l: number, h: number): V[] {
  const tri: [number, number][] = [[-w / 2, -l / 2], [w / 2, -l / 2], [0, l / 2]];
  return tri.flatMap(([x, z]) => [[x, 0, z] as V, [x, h, z] as V]);
}
/** a house: a box (x, y, z) with a gable roof along x rising `rise` */
export function house(x: number, y: number, z: number, rise: number): V[] {
  return [...boxPts(x, y, z), [-x / 2, y + rise, 0], [x / 2, y + rise, 0]];
}
