/**
 * ⭐⭐⭐ (2026-11-02, branch `1.0.90-`) **THE FACE-SPAN GIZMO** — engine-free (the owner: *"once the orbit is tilted to follow a face orientation, the red and
 * green sections do not need to fully circumference the assembly, but they only need to span the hosting coplanar faces"* → `FACE_SPAN_2026-11-02.md`).
 *
 * Within the engage distance the gizmo is a POINT IN A PLANE: the hosting face's, its REGION the connected coplanar faces of the placed parts (`spanRegion`,
 * each face's convex hull, joined within `SPAN_GROW_M` — the 3 mm between two cores bridged). ⭐⭐⭐ (second pass, the owner: *"I want to keep what was done
 * for commit ff2fca2 in terms of gizmo leading … face-span should not impact the behavior of the gizmo and the behavior of the piece and the camera relative
 * to the gizmo"*) the ORBIT runs as it always did and moves the gizmo by its SOLVED yaw and pitch steps along the face's LEVEL AXES (third pass, ff2fca2's relation:
 * `faceAxes`, `axisSense`, `spanAxisStep`, `greenPaceOf`), clamped to the region (`clampSlide`), riding over what stands on it (`coveredTop`, `rideStep`), caught at its edge then onto the
 * face across (`spanMove`, `wrapCandidate` — convex, concave judged near the edge, a GLUED contact face replaced by the face it stands on, `gluedPartners`,
 * `hiddenGlued`). Over a top / bottom the roll of branch 1.0.83 at the zenith (`zenithCrossing`, `zenithRollStep`). The red and green lines: the region's
 * run through the gizmo (`regionRun`, `spanPolyline`). Textbook geometry only: convex hulls, point–segment and point–triangle distances (Ericson),
 * barycentric heights, bisection, golden section.
 */
import { cross, dot, normalize, type Vec3 } from "../core/vec";
import { boundStep, convexHull2D, convexOverlap2D } from "./hover";

export type P2 = readonly [number, number];
export type Tri = readonly [Vec3, Vec3, Vec3];

/** ⭐ Out of face-span past this × the engage distance (the hysteresis — no flicker at the threshold). */
export const SPAN_RELEASE_FACTOR = 1.2;
/** ⭐ The faces joined when this close (each side, m) — the painting's cores stand 3 mm apart (`OUTLINE_GROW_M`'s value). */
export const SPAN_GROW_M = 0.0016;
/** ⭐ Coplanar: normals within ~1.1° and planes within 0.5 mm (the hover's `coplanarFaces`). */
export const SPAN_COPLANAR_COS = 0.9998;
export const SPAN_COPLANAR_M = 0.0005;
/** ⭐ A face within 40° of vertical is a WALL: its input axes levelled, the screen's up the world's (`TILT_ON_DEG`'s complement). */
export const SPAN_VERTICAL_SIN = Math.sin((50 * Math.PI) / 180);
/** ⭐ A part counts as standing on the plane (ridden over) when it reaches this far in front of it (m), TOUCHES it (its nearest point within
 * `SPAN_TOUCH_M` of the plane — ⛔ a part across a 16 mm empty slot read as a protrusion: the gizmo leapt onto its far side) and lies within the slab. */
export const SPAN_RIDE_MIN_M = 0.0005;
export const SPAN_TOUCH_M = 0.0025; // a seated part stands one contour margin (1.5 mm on Scene_1) off its host's core
export const SPAN_RIDE_SLAB_M = 0.25;
/** ⭐ The tops read beside the point this far each way (m) — a gap between a protrusion's cores bridged. */
export const SPAN_COVER_M = 0.002;
/** ⭐ The face across an edge: within this of the edge point (m). */
export const SPAN_WRAP_REACH_M = 0.008;
/** ⭐ With no finger, a blend (the engage's turn, the ride) goes on by time: about whole in this (ms). */
export const SPAN_REST_MS = 300;
/** ⭐ The lines lifted off the surface (m) — never in it. */
export const SPAN_LINE_LIFT_M = 0.002;

const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];

// ───────────────────────────── the plane ─────────────────────────────

/** ⭐ The hosting plane: a point on it, its normal, two in-plane axes (`a` horizontal where it can be). */
export interface SpanPlane {
  readonly origin: Vec3;
  readonly n: Vec3;
  readonly a: Vec3;
  readonly b: Vec3;
}

export function spanPlane(n: Vec3, origin: Vec3): SpanPlane {
  const nn = normalize(n) ?? [0, 0, 1];
  const a = normalize(cross([0, 1, 0], nn)) ?? normalize(cross([0, 0, 1], nn)) ?? [1, 0, 0];
  const b = normalize(cross(nn, a)) ?? [0, 1, 0];
  return { origin, n: nn, a, b };
}
export function toP2(pl: SpanPlane, p: Vec3): [number, number] {
  const d = sub3(p, pl.origin);
  return [dot(d, pl.a), dot(d, pl.b)];
}
export function heightOf(pl: SpanPlane, p: Vec3): number {
  return dot(sub3(p, pl.origin), pl.n);
}
export function fromP2(pl: SpanPlane, q: P2, h = 0): Vec3 {
  return add3(pl.origin, add3(add3(mul3(pl.a, q[0]), mul3(pl.b, q[1])), mul3(pl.n, h)));
}
export function toPlaneDir(pl: SpanPlane, v: Vec3): [number, number] {
  return [dot(v, pl.a), dot(v, pl.b)];
}

// ───────────────────────────── the region ─────────────────────────────

/** ⭐ A face of a placed part: its normal and its triangles (the world's, on the part's model pose). */
export interface SpanFace {
  readonly normal: Vec3;
  readonly tris: readonly Tri[];
}

/** ⭐ The region: the plane, the member faces' convex hulls on it (CCW), joined within `grow` (each side). */
export interface SpanRegion {
  readonly plane: SpanPlane;
  readonly polys: readonly (readonly P2[])[];
  readonly members: readonly number[];
  readonly grow: number;
}

/** ⭐ The faces lying in the plane (normal within `SPAN_COPLANAR_COS`, every vertex within `SPAN_COPLANAR_M`). */
export function coplanarIndices(faces: readonly SpanFace[], pl: SpanPlane): number[] {
  const out: number[] = [];
  faces.forEach((f, i) => {
    if (dot(f.normal, pl.n) < SPAN_COPLANAR_COS || f.tris.length === 0) return;
    if (f.tris.every((t) => t.every((p) => Math.abs(heightOf(pl, p)) <= SPAN_COPLANAR_M))) out.push(i);
  });
  return out;
}

/** ⭐ A point's distance to a convex polygon (CCW): 0 inside or on it. */
export function polyDistance(poly: readonly P2[], p: P2): number {
  const n = poly.length;
  if (n === 0) return Infinity;
  if (n === 1) return Math.hypot(p[0] - poly[0]![0], p[1] - poly[0]![1]);
  let inside = n >= 3;
  let best = Infinity;
  for (let i = 0; i < n; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % n]!;
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    if (ex * (p[1] - a[1]) - ey * (p[0] - a[0]) < -1e-12) inside = false;
    const l2 = ex * ex + ey * ey;
    const t = l2 > 0 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / l2)) : 0;
    best = Math.min(best, Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ey * t));
  }
  return inside ? 0 : best;
}

/** ⭐ The gap between two convex polygons: 0 when they overlap or touch. */
export function polyGap(a: readonly P2[], b: readonly P2[]): number {
  if (a.length >= 3 && b.length >= 3 && convexOverlap2D(a, b, -1e-12)) return 0;
  let best = Infinity;
  for (const p of a) best = Math.min(best, polyDistance(b, p));
  for (const p of b) best = Math.min(best, polyDistance(a, p));
  return best;
}

/**
 * ⭐⭐ THE REGION seeded at face `seed`: the coplanar faces' hulls, the ones joined to the seed's step by step (a gap of at most twice `grow`). `null`
 * when the seed does not lie in the plane.
 */
export function spanRegion(faces: readonly SpanFace[], seed: number, pl: SpanPlane, grow: number = SPAN_GROW_M): SpanRegion | null {
  const idx = coplanarIndices(faces, pl);
  if (!idx.includes(seed)) return null;
  const hulls = new Map<number, P2[]>();
  for (const i of idx) hulls.set(i, convexHull2D(faces[i]!.tris.flatMap((t) => t.map((p) => toP2(pl, p)))));
  const inSet = new Set<number>([seed]);
  const stack = [seed];
  while (stack.length > 0) {
    const i = stack.pop()!;
    for (const j of idx) {
      if (inSet.has(j)) continue;
      if (polyGap(hulls.get(i)!, hulls.get(j)!) <= 2 * grow + 1e-9) {
        inSet.add(j);
        stack.push(j);
      }
    }
  }
  const members = [...inSet].sort((x, y) => x - y);
  return { plane: pl, polys: members.map((i) => hulls.get(i)!), members, grow };
}

/** ⭐ The region's area (m², its members' hulls summed — they do not overlap on a real assembly). */
export function regionArea(r: SpanRegion): number {
  let s = 0;
  for (const poly of r.polys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]!;
      const b = poly[(i + 1) % poly.length]!;
      s += a[0] * b[1] - a[1] * b[0];
    }
  }
  return Math.abs(s) / 2;
}

/** ⭐ A point's distance to the region (plane coordinates): 0 inside (within `grow` of a member). */
export function regionDistance(r: SpanRegion, p: P2): number {
  let best = Infinity;
  for (const poly of r.polys) best = Math.min(best, polyDistance(poly, p));
  return Math.max(0, best - r.grow);
}

/**
 * ⭐⭐ A STEP CLAMPED TO THE REGION from `from` (inside): as far along it as it stays inside, then what is left slid along each plane axis in turn (the
 * longer first) — a slanted push reaches the edge and slides along it. ⛔ `boundStep`'s axis slide alone held a slanted push short of the edge for good
 * (the slide along the axis that stayed inside won, every frame). From outside: `boundStep` (never farther out).
 */
export function clampSlide(from: P2, step: P2, dist: (q: P2) => number): [number, number] {
  if (dist(from) > 0) return boundStep(from, [from[0] + step[0], from[1] + step[1]], (u, v) => dist([u, v]));
  const far = (p: P2, d: P2): number => {
    if (dist([p[0] + d[0], p[1] + d[1]]) <= 0) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 30; i++) {
      const m = (lo + hi) / 2;
      if (dist([p[0] + d[0] * m, p[1] + d[1] * m]) <= 0) lo = m;
      else hi = m;
    }
    return lo;
  };
  const t = far(from, step);
  let p: [number, number] = [from[0] + step[0] * t, from[1] + step[1] * t];
  const rem: P2 = [step[0] * (1 - t), step[1] * (1 - t)];
  for (const k of Math.abs(rem[0]) >= Math.abs(rem[1]) ? [0, 1] : [1, 0]) {
    const d: P2 = k === 0 ? [rem[0], 0] : [0, rem[1]];
    if (d[k] === 0) continue;
    const s = far(p, d);
    p = [p[0] + d[0] * s, p[1] + d[1] * s];
  }
  return p;
}

/** ⭐ A point brought into the region: itself inside, else bisected toward `inside` (a point known inside). */
export function intoRegion(r: SpanRegion, p: P2, inside: P2): [number, number] {
  if (regionDistance(r, p) <= 0) return [p[0], p[1]];
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (regionDistance(r, [inside[0] + (p[0] - inside[0]) * m, inside[1] + (p[1] - inside[1]) * m]) <= 0) lo = m;
    else hi = m;
  }
  return [inside[0] + (p[0] - inside[0]) * lo, inside[1] + (p[1] - inside[1]) * lo];
}

/** ⭐ A point inside the region: the first member hull's centroid. */
export function regionInside(r: SpanRegion): [number, number] {
  const poly = r.polys[0] ?? [];
  if (poly.length === 0) return [0, 0];
  return [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];
}

/**
 * ⭐⭐ THE RUN through `p` along the unit `d`: the interval [t0, t1] of the line `p + t·d` inside the region and connected to `t = 0` — each member's own
 * interval (its distance minus `grow` is convex along a line: its minimum by golden section, its two roots by bisection), merged outward from 0. `[0, 0]`
 * when `p` is outside.
 */
export function regionRun(r: SpanRegion, p: P2, d: P2, reach = 4): [number, number] {
  const ivs: [number, number][] = [];
  for (const poly of r.polys) {
    const f = (t: number): number => polyDistance(poly, [p[0] + d[0] * t, p[1] + d[1] * t]) - r.grow;
    let a = -reach;
    let b = reach;
    const g = (Math.sqrt(5) - 1) / 2;
    let c = b - g * (b - a);
    let e = a + g * (b - a);
    for (let i = 0; i < 80; i++) {
      if (f(c) <= f(e)) b = e;
      else a = c;
      c = b - g * (b - a);
      e = a + g * (b - a);
    }
    const tm = (a + b) / 2;
    if (f(tm) > 1e-9) continue;
    const root = (lo: number, hi: number, insideAtHi: boolean): number => {
      for (let i = 0; i < 60; i++) {
        const m = (lo + hi) / 2;
        if ((f(m) <= 0) === insideAtHi) hi = m;
        else lo = m;
      }
      return insideAtHi ? hi : lo;
    };
    ivs.push([f(-reach) <= 0 ? -reach : root(-reach, tm, true), f(reach) <= 0 ? reach : root(tm, reach, false)]);
  }
  const at0 = ivs.filter((iv) => iv[0] <= 1e-9 && iv[1] >= -1e-9);
  if (at0.length === 0) return [0, 0];
  let lo = Math.min(...at0.map((iv) => iv[0]));
  let hi = Math.max(...at0.map((iv) => iv[1]));
  for (let grew = true; grew; ) {
    grew = false;
    for (const iv of ivs) {
      if (iv[1] >= lo - 1e-9 && iv[0] <= hi + 1e-9 && (iv[0] < lo - 1e-12 || iv[1] > hi + 1e-12)) {
        lo = Math.min(lo, iv[0]);
        hi = Math.max(hi, iv[1]);
        grew = true;
      }
    }
  }
  return [Math.min(0, lo), Math.max(0, hi)];
}

// ───────────────────────────── the tops ridden over ─────────────────────────────

/** ⭐ A part standing on the plane, in plane coordinates (x, y, height): its 2-D box and its triangles. */
export interface SpanSolid {
  readonly box: readonly [number, number, number, number];
  readonly tris: readonly (readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]])[];
}

/** ⭐ The placed parts (each its closed triangles) that stand on the plane: reaching more than `SPAN_RIDE_MIN_M` in front, touching it (`SPAN_TOUCH_M`), within the slab. */
export function spanSolids(pl: SpanPlane, parts: readonly (readonly Tri[])[]): SpanSolid[] {
  const out: SpanSolid[] = [];
  for (const tris of parts) {
    if (tris.length === 0) continue;
    const pts = tris.map((t) => t.map((p) => { const q = toP2(pl, p); return [q[0], q[1], heightOf(pl, p)] as const; }) as unknown as readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]]);
    const hs = pts.flatMap((t) => t.map((p) => p[2]));
    if (!(Math.max(...hs) > SPAN_RIDE_MIN_M) || Math.min(...hs) > SPAN_TOUCH_M || Math.min(...hs) < -SPAN_RIDE_SLAB_M) continue;
    const xs = pts.flatMap((t) => t.map((p) => p[0]));
    const ys = pts.flatMap((t) => t.map((p) => p[1]));
    out.push({ box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], tris: pts });
  }
  return out;
}

/** ⭐ The FRONTMOST height over plane point `q` (≥ 0: the plane itself) — the highest triangle above it (barycentric), of the parts standing on it. */
export function topAt(solids: readonly SpanSolid[], q: P2): number {
  let best = 0;
  for (const s of solids) {
    if (q[0] < s.box[0] - 1e-9 || q[0] > s.box[2] + 1e-9 || q[1] < s.box[1] - 1e-9 || q[1] > s.box[3] + 1e-9) continue;
    for (const [a, b, c] of s.tris) {
      const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
      if (Math.abs(d) < 1e-14) continue;
      const l1 = ((b[1] - c[1]) * (q[0] - c[0]) + (c[0] - b[0]) * (q[1] - c[1])) / d;
      const l2 = ((c[1] - a[1]) * (q[0] - c[0]) + (a[0] - c[0]) * (q[1] - c[1])) / d;
      const l3 = 1 - l1 - l2;
      if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue;
      best = Math.max(best, l1 * a[2] + l2 * b[2] + l3 * c[2]);
    }
  }
  return best;
}

/** ⭐ The top read at `q` and `SPAN_COVER_M` beside it each way — the highest: a gap between a protrusion's cores bridged. */
export function coveredTop(solids: readonly SpanSolid[], q: P2, cover = SPAN_COVER_M): number {
  let h = topAt(solids, q);
  for (const o of [[cover, 0], [-cover, 0], [0, cover], [0, -cover]] as const) h = Math.max(h, topAt(solids, [q[0] + o[0], q[1] + o[1]]));
  return h;
}

/** ⭐ The ridden height shown, eased toward `target` by the finger's travel (`rideMm`) and, at rest, by time — never a jump. */
export function rideStep(shown: number, target: number, travelMm: number, rideMm: number, dtMs: number, atRest: boolean): number {
  const kt = rideMm > 0 ? 1 - Math.exp((-3 * Math.max(0, travelMm)) / rideMm) : 1;
  const kr = atRest ? 1 - Math.exp((-3 * Math.max(0, dtMs)) / SPAN_REST_MS) : 0;
  const k = Math.min(1, kt + kr - kt * kr);
  return shown + (target - shown) * k;
}

/**
 * ⭐⭐ THE LINE along a run: (t, height) points from `t0` to `t1` through `t = 0` (the gizmo, exact), `spacingM` apart, a step in height of more than
 * `stepTolM` refined by halving down to ~0.1 mm — a step comes out a near-vertical connector, a slope a fine slope; at most `maxPts`.
 */
export function spanPolyline(solids: readonly SpanSolid[], p: P2, d: P2, t0: number, t1: number, spacingM: number, stepTolM = 0.001, maxPts = 400): [number, number][] {
  const h = (t: number): number => coveredTop(solids, [p[0] + d[0] * t, p[1] + d[1] * t]);
  const ts: number[] = [];
  const n0 = Math.max(1, Math.ceil(-t0 / spacingM));
  for (let i = n0; i >= 1; i--) ts.push(t0 * (i / n0));
  ts.push(0);
  const n1 = Math.max(1, Math.ceil(t1 / spacingM));
  for (let i = 1; i <= n1; i++) ts.push(t1 * (i / n1));
  const uniq = ts.filter((t, i) => i === 0 || t > ts[i - 1]! + 1e-12);
  const out: [number, number][] = [];
  const refine = (ta: number, ha: number, tb: number, hb: number, depth: number): void => {
    if (out.length >= maxPts) return;
    if (Math.abs(hb - ha) > stepTolM && depth < 9 && tb - ta > 1e-4) {
      const tm = (ta + tb) / 2;
      const hm = h(tm);
      refine(ta, ha, tm, hm, depth + 1);
      out.push([tm, hm]);
      refine(tm, hm, tb, hb, depth + 1);
    }
  };
  let prev: [number, number] | null = null;
  for (const t of uniq) {
    const cur: [number, number] = [t, h(t)];
    if (prev !== null) refine(prev[0], prev[1], cur[0], cur[1], 0);
    if (out.length >= maxPts) break;
    out.push(cur);
    prev = cur;
  }
  return out;
}

// ───────────────────────────── the input — the ORBIT's own step ─────────────────────────────

/** ⭐ A wall: within 40° of vertical (its normal within 50° of horizontal). */
export function isWall(n: Vec3): boolean {
  return Math.abs(n[1]) < SPAN_VERTICAL_SIN;
}

/** ⭐ `v` laid on the plane of `n`, unit; `null` square to it. */
export function onPlane(v: Vec3, n: Vec3): Vec3 | null {
  return normalize(sub3(v, mul3(n, dot(v, n))));
}

/**
 * ⭐⭐⭐ (2026-11-02, third pass, the owner: *"when the hosting face is vertical, a dy shall move the gizmo vertically and a dx shall move the gizmo
 * horizontally. when the hosting face is horizontal, both dy and dx shall move the gizmo on the horizontal plane at 90 degrees each … analyze how the gizmo
 * moved with the dy and dx inputs of the orbit in ff2fca2 … this is what I want"*) — **THE FACE'S LEVEL AXES**: on a wall (the slanted frusta included) `h`
 * its level line (horizontal) and `v` its steepest line (up); on a top / bottom `h` the screen's right laid on it (latched by the caller) and `v` square to
 * it in the plane. ⛔ (second pass) the gizmo moved along the orbit's step laid on the face — on an oblique view the lines and the steps came out tilted.
 */
export function faceAxes(n: Vec3, right: Vec3): { readonly h: Vec3; readonly v: Vec3 } {
  if (isWall(n)) {
    const h = normalize(cross([0, 1, 0], n)) ?? onPlane(right, n) ?? [1, 0, 0];
    const v = onPlane([0, 1, 0], n) ?? normalize(cross(n, h)) ?? [0, 1, 0];
    return { h, v };
  }
  const h = onPlane(right, n) ?? onPlane([1, 0, 0], n) ?? [0, 0, 1];
  return { h, v: normalize(cross(n, h)) ?? [0, 0, 1] };
}

/**
 * ⭐ An axis's SENSE for an orbit step: +1 when the orbit's step (`stepW`, world — its yaw's or its pitch's) goes along `e`, −1 against; kept (`prev`) near
 * square (no flicker). On an upright front view this is ff2fca2's: +yaw round the green loop the way the yaw turns, +pitch up the red chain.
 */
export function axisSense(prev: 1 | -1, e: Vec3, stepW: Vec3): 1 | -1 {
  const l = Math.hypot(stepW[0], stepW[1], stepW[2]);
  if (!(l > 1e-9)) return prev;
  const c = dot(e, stepW) / l;
  return Math.abs(c) < 0.2 ? prev : c > 0 ? 1 : -1;
}

/**
 * ⭐⭐⭐ THE GIZMO'S STEP — ff2fca2's relation: the orbit's yaw step `dYaw` (rad) moves it along `h` at `paceH` (m/rad — ff2fca2's green loop: its
 * perimeter / 2π), its pitch step `dPitch` along `v` at `paceV` (m/rad — ff2fca2's red chain: the assembly's radius), each in its sense.
 */
export function spanAxisStep(dYaw: number, dPitch: number, paceH: number, paceV: number, h: Vec3, v: Vec3, sh: 1 | -1, sv: 1 | -1): Vec3 {
  const a = dYaw * paceH * sh;
  const b = dPitch * paceV * sv;
  return [h[0] * a + v[0] * b, h[1] * a + v[1] * b, h[2] * a + v[2] * b];
}

/** ⭐ ff2fca2's dx pace: the perimeter of the placed parts' horizontal convex hull / 2π (m per radian of yaw) — the green loop's, taken at the hull. */
export function greenPaceOf(points: readonly Vec3[]): number {
  const hull = convexHull2D(points.map((p) => [p[0], p[2]] as [number, number]));
  let per = 0;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]!;
    const b = hull[(i + 1) % hull.length]!;
    per += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return per / (2 * Math.PI);
}

// ───────────────────────────── the shown direction — the slide's calm in the middle of a face (fourth pass) ─────────────────────────────

/**
 * ⭐⭐⭐ (2026-11-03, fourth pass, the owner: *"I want a mix of the slide of the gizmo of commit 3286ed5 and this implementation of commit 46ee3a2 … add some
 * slide of the gizmo and follow by the piece and camera as per 3286ed5 … so that the gizmo can reach close to the edges without the camera view being too
 * slanted … but I like the smooth transition over the edge as done in commit 46ee3a2"*) — **THE SHARE OF THE ORBIT'S ANGLE SHOWN** along one axis of the
 * face, from the gizmo's distance to the NEARER end of its run along that axis (`dEdgeM`) and the run's length (`runM`): `interior` in the middle, rising by
 * a smoothstep to 1 within the edge zone (`zonePct` % of the run, at least `zoneMinM`); 1 at the edge — so the crossing is exactly the orbit's. A face too
 * thin for two zones: 1 everywhere. Position only: reversible, no hysteresis.
 */
export function edgeShare(dEdgeM: number, runM: number, interior: number, zonePct: number, zoneMinM: number): number {
  const zone = Math.max((Math.max(0, zonePct) / 100) * runM, Math.max(0, zoneMinM));
  if (!(runM > 2 * zone)) return 1;
  const x = Math.min(1, Math.max(0, 1 - Math.max(0, dEdgeM) / zone));
  const k = Math.min(1, Math.max(0, interior));
  return k + (1 - k) * x * x * (3 - 2 * x);
}

/**
 * ⭐⭐⭐ THE PIECE'S SHOWN DIRECTION: the orbit's direction `u` read as two angles off the face's normal `n` — `α` toward `h` (dx's axis), `β` toward `v`
 * (dy's) — and shown at `sH·α`, `sV·β` (`edgeShare`'s). Both shares 1: `u` itself (46ee3a2 exactly). The piece, the camera, the approach and the solve
 * read it; the gizmo is still moved by the orbit's own angles.
 */
export function shownDir(u: Vec3, n: Vec3, h: Vec3, v: Vec3, sH: number, sV: number): Vec3 {
  if (sH >= 1 && sV >= 1) return u;
  const a = Math.atan2(dot(u, h), dot(u, n));
  const b = Math.asin(Math.max(-1, Math.min(1, dot(u, v))));
  const a1 = a * Math.min(1, Math.max(0, sH));
  const b1 = b * Math.min(1, Math.max(0, sV));
  const cb = Math.cos(b1);
  return [
    n[0] * cb * Math.cos(a1) + h[0] * cb * Math.sin(a1) + v[0] * Math.sin(b1),
    n[1] * cb * Math.cos(a1) + h[1] * cb * Math.sin(a1) + v[1] * Math.sin(b1),
    n[2] * cb * Math.cos(a1) + h[2] * cb * Math.sin(a1) + v[2] * Math.sin(b1),
  ];
}

/** ⭐ How much of the shares' calm is applied (0 … 1): the engage's ramp (`ramp`, by travel) × the distance's (0 at the release, 1 from 0.8 × the engage in). */
export function calmWeight(ramp: number, distM: number, engageM: number, releaseFactor: number): number {
  const top = engageM * releaseFactor;
  const low = engageM * 0.8;
  const x = Math.min(1, Math.max(0, (top - distM) / Math.max(1e-9, top - low)));
  return Math.min(1, Math.max(0, ramp)) * x * x * (3 - 2 * x);
}

/** ⭐ An orbit step read as the finger's travel (mm) at the orbit's pace (`degPerMm`). */
export function spanMmOf(dYaw: number, dPitch: number, degPerMm: number): number {
  return degPerMm > 0 ? Math.hypot(dYaw, dPitch) / ((degPerMm * Math.PI) / 180) : 0;
}

// ───────────────────────────── the top face's roll — branch 1.0.83's, at the zenith ─────────────────────────────

/** ⭐ The zenith's cone: a crossing counts within this of the face's normal (rad). */
export const SPAN_ZENITH_CONE_RAD = (30 * Math.PI) / 180;

/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"do the roll as it was previously implemented on branch 1.0.83"* — its top face pause: *"the piece travel is paused when it
 * crosses the gizmo … the camera does the half round turn … If the dy reverse at any time, the travel of the camera or piece is reversed"*) — **WHERE THE
 * ORBIT STEP CROSSES THE ZENITH** over a top / bottom: the piece's direction from `u0` to `u1`, the face's normal `n`, the crossing axis `e` (in the plane):
 * the step's share `k` (0 … 1) where the direction passes the plane square to `e` through `n` (`u·e` = 0), and the side it goes to (+1 / −1); `null`: no
 * crossing in this step (leaving the zenith itself is none), or outside the zenith's cone.
 */
export function zenithCrossing(u0: Vec3, u1: Vec3, n: Vec3, e: Vec3, cone = SPAN_ZENITH_CONE_RAD): { readonly k: number; readonly side: 1 | -1 } | null {
  const s0 = dot(u0, e);
  const s1 = dot(u1, e);
  if (s0 === 0 || s0 === s1 || s0 * s1 > 0) return null;
  const k = s0 / (s0 - s1);
  const at = normalize(add3(mul3(u0, 1 - k), mul3(u1, k)));
  if (at === null || dot(at, n) < Math.cos(cone)) return null;
  return { k, side: s1 > 0 ? 1 : -1 };
}

/**
 * ⭐⭐ THE ROLL'S SHARE STEPPED by the finger's travel `alongMm` (signed: toward the rolled side positive — a dx is 0: held mid-roll) over `rollMm` (half a
 * turn at the orbit's pace): held to [0, 1]; the travel left over once it lands at an end (the orbit goes on with it — reversible anywhere).
 */
export function zenithRollStep(share: number, alongMm: number, rollMm: number): { readonly share: number; readonly leftMm: number } {
  if (!(rollMm > 0)) return { share: alongMm > 0 ? 1 : alongMm < 0 ? 0 : share, leftMm: alongMm };
  const want = share + alongMm / rollMm;
  if (want >= 1) return { share: 1, leftMm: (want - 1) * rollMm };
  if (want <= 0) return { share: 0, leftMm: want * rollMm };
  return { share: want, leftMm: 0 };
}

// ───────────────────────────── the edge: catch and wrap ─────────────────────────────

/** ⭐ The face across an edge. */
export interface SpanCandidate {
  readonly index: number;
  readonly normal: Vec3;
  readonly kind: "CONVEX" | "CONCAVE";
  readonly dist: number;
}

/** ⭐ The closest point of triangle `t` to `p` (Ericson, *Real-Time Collision Detection* §5.1.5). */
export function closestOnTriangle(p: Vec3, t: Tri): Vec3 {
  const [a, b, c] = t;
  const ab = sub3(b, a);
  const ac = sub3(c, a);
  const ap = sub3(p, a);
  const d1 = dot(ab, ap);
  const d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub3(p, b);
  const d3 = dot(ab, bp);
  const d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return add3(a, mul3(ab, d1 / (d1 - d3)));
  const cp = sub3(p, c);
  const d5 = dot(ab, cp);
  const d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return add3(a, mul3(ac, d2 / (d2 - d6)));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return add3(b, mul3(sub3(c, b), (d4 - d3) / (d4 - d3 + (d5 - d6))));
  const den = 1 / (va + vb + vc);
  return add3(a, add3(mul3(ab, vb * den), mul3(ac, vc * den)));
}

export function distanceToTris(p: Vec3, tris: readonly Tri[]): number {
  let best = Infinity;
  for (const t of tris) {
    const q = closestOnTriangle(p, t);
    best = Math.min(best, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]));
  }
  return best;
}

/**
 * ⭐⭐ (2026-11-02, the owner: *"slanted parts should stay faces the gizmo can stand on. implement the fix"*) — GLUED FACES: a face pressed against another
 * part's face (anti-parallel within ~1.1°, every vertex of the other within `SPAN_TOUCH_M` of its plane, overlapping on it) — each face's partner (the
 * largest); which of a pair is HIDDEN (never a host; a step onto it lands on its partner — the face the part stands on) is the caller's: the one whose
 * coplanar region is the smaller (`hiddenGlued`). ⛔ Off a seated frustum's side the face across its top edge was its own hidden small face:
 * the gizmo went round the frustum's faces for ever (36 of 36 exits, measured). `owner[i]`: the part of face `i`. Each face's partner, `-1` for none.
 */
export function gluedPartners(faces: readonly SpanFace[], owner: readonly string[]): number[] {
  const out = faces.map(() => -1);
  const areaOf = (h: readonly P2[]): number => {
    let a = 0;
    for (let q = 0; q < h.length; q++) {
      const p0 = h[q]!;
      const p1 = h[(q + 1) % h.length]!;
      a += p0[0] * p1[1] - p0[1] * p1[0];
    }
    return Math.abs(a) / 2;
  };
  faces.forEach((f, i) => {
    if (f.tris.length === 0) return;
    const pl = spanPlane(f.normal, f.tris[0]![0]);
    const hull = convexHull2D(f.tris.flatMap((t) => t.map((p) => toP2(pl, p))));
    let best = -1;
    let bestArea = -1;
    faces.forEach((g, j) => {
      if (j === i || owner[j] === owner[i] || g.tris.length === 0 || dot(f.normal, g.normal) > -SPAN_COPLANAR_COS) return;
      if (!g.tris.every((t) => t.every((p) => Math.abs(heightOf(pl, p)) <= SPAN_TOUCH_M))) return;
      const h2 = convexHull2D(g.tris.flatMap((t) => t.map((p) => toP2(pl, p))));
      if (!(hull.length >= 3 && h2.length >= 3 && convexOverlap2D(hull, h2))) return;
      const area = areaOf(h2);
      if (area > bestArea) {
        bestArea = area;
        best = j;
      }
    });
    out[i] = best;
  });
  return out;
}

/**
 * ⭐⭐⭐ THE FACE ACROSS THE EDGE at the edge point `B` (world), the push going along `D` (world, in the plane of `n`): among the faces not in the region
 * (`exclude`), within `reach` of `B` — CONVEX, a face turned toward the push lying behind the plane (a box's next side); CONCAVE, a face turned against the
 * push standing in front of it NEAR THE EDGE (⭐ 2026-11-02: its vertices within 5 cm of `B` — ⛔ every vertex: a large face a part stands on straddled a
 * slanted side's plane and was refused). A GLUED face (`partner[i]` ≥ 0) is replaced by its partner (never itself). The nearest; a tie to the one more
 * square to the push. `null`: nothing there (the edge stops).
 */
export function wrapCandidate(faces: readonly SpanFace[], exclude: ReadonlySet<number>, B: Vec3, n: Vec3, D: Vec3, reach = SPAN_WRAP_REACH_M, partner: readonly number[] = []): SpanCandidate | null {
  let best: SpanCandidate | null = null;
  let bestScore = Infinity;
  faces.forEach((f, i) => {
    if (exclude.has(i) || f.tris.length === 0) return;
    const m = f.normal;
    if (dot(m, n) > 0.98 || dot(m, n) < -0.98) return;
    const md = dot(m, D);
    const vs = f.tris.flatMap((t) => [...t]);
    const hs = vs.map((p) => dot(sub3(p, B), n));
    const near = vs.filter((p) => Math.hypot(p[0] - B[0], p[1] - B[1], p[2] - B[2]) <= 0.05).map((p) => dot(sub3(p, B), n));
    let kind: "CONVEX" | "CONCAVE" | null = null;
    if (md > 0.3 && Math.max(...hs) <= 0.002) kind = "CONVEX";
    else if (md < -0.3 && (near.length > 0 ? Math.min(...near) : Math.min(...hs)) >= -0.002) kind = "CONCAVE";
    if (kind === null) return;
    const d = distanceToTris(B, f.tris);
    if (d > reach) return;
    const p = partner[i] ?? -1;
    if (p >= 0 && exclude.has(p)) return; // glued onto the region itself: no way out there
    const score = d - 1e-4 * Math.abs(md);
    if (score < bestScore) {
      bestScore = score;
      best = p >= 0 ? { index: p, normal: faces[p]!.normal, kind: "CONCAVE", dist: d } : { index: i, normal: m, kind, dist: d };
    }
  });
  return best;
}

/** ⭐ The gizmo's motion in the plane: where it is; the finger pushed past the edge (mm — the catch). */
export interface SpanMotion {
  readonly at: P2;
  readonly overMm: number;
}

/**
 * ⭐⭐⭐ ONE STEP OF THE GIZMO — `step` (m, plane coordinates) for `stepMm` of the finger: inside, clamped by the region (`clampSlide` — slid along the edge);
 * the part the edge refuses goes into the CATCH (`overMm`, back to 0 once the step leaves the edge); past `catchMm` the face across is asked for
 * (`findNext`) — `next`: the gizmo goes onto it at once (the piece and the camera are the orbit's: nothing turns about the edge, no wrap is ever left
 * pending); none, the edge holds (`held`).
 */
export function spanMove(
  m: SpanMotion,
  step: P2,
  stepMm: number,
  dist: (q: P2) => number,
  catchMm: number,
  findNext: (at: P2, out: P2) => SpanCandidate | null,
): { readonly motion: SpanMotion; readonly next: SpanCandidate | null; readonly held: boolean } {
  const len = Math.hypot(step[0], step[1]);
  if (!(len > 1e-12) || !(stepMm > 0)) return { motion: m, next: null, held: false };
  const to: P2 = [m.at[0] + step[0], m.at[1] + step[1]];
  const nb = clampSlide(m.at, step, dist);
  const bl: P2 = [to[0] - nb[0], to[1] - nb[1]];
  const bll = Math.hypot(bl[0], bl[1]);
  if (bll <= 1e-9 * Math.max(1, len) || bll <= 1e-9) return { motion: { at: nb, overMm: 0 }, next: null, held: false };
  const out: P2 = [bl[0] / bll, bl[1] / bll];
  const over = m.overMm + (stepMm * bll) / len;
  if (over < catchMm) return { motion: { at: nb, overMm: over }, next: null, held: false };
  const next = findNext(nb, out);
  if (next === null) return { motion: { at: nb, overMm: catchMm }, next: null, held: true };
  return { motion: { at: nb, overMm: 0 }, next, held: false };
}

/**
 * ⭐⭐ WHICH GLUED FACES ARE HIDDEN: a face with a partner whose coplanar region is no smaller (`regionAreaOf(i)`, the region seeded at face `i` in its own
 * plane) — so a seated part's contact face goes (Piece43's top under the painting's bottom, Piece45's under Piece10's front) and the face it stands on stays;
 * two neighbours' touching sides (equal) both go. ⛔ A face-level rule (the smaller face hidden) kept Piece43's top: it is wider than Piece19's bottom.
 */
export function hiddenGlued(partner: readonly number[], regionAreaOf: (i: number) => number): boolean[] {
  return partner.map((p, i) => p >= 0 && regionAreaOf(i) <= regionAreaOf(p) * 1.05);
}

// ───────────────────────────── engage ─────────────────────────────

/** ⭐ In face-span? On within `engageM` of the gizmo, off only past `SPAN_RELEASE_FACTOR` × it. */
export function spanEngaged(on: boolean, distM: number, engageM: number): boolean {
  return on ? distM <= engageM * SPAN_RELEASE_FACTOR : distM <= engageM;
}

/** ⭐ The engage distance used: the slider's, held so its release stays within the far orbit's reach (`farM` — else the far orbit could never come back). */
export function spanEngageM(sliderM: number, farM: number): number {
  return Math.max(0.05, Math.min(sliderM, farM / (SPAN_RELEASE_FACTOR * 1.02)));
}
