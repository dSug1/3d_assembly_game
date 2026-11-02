/**
 * ⭐⭐⭐ (2026-11-02, branch `1.0.90-`) **THE FACE-SPAN GIZMO** — engine-free (the owner: *"once the orbit is tilted to follow a face orientation, the red and
 * green sections do not need to fully circumference the assembly, but they only need to span the hosting coplanar faces: this way, this will avoid
 * intricate green and red contours and jumps of gizmo over singularities such as edge, etc."* → the design `FACE_SPAN_2026-11-02.md`, built on the owner's
 * answers: *"1- Leaving a face: Option B. Design the tilt and catch properly so the movements of the piece and camera are blended properly"*, *"2- …
 * make a slider. I prefer to engage as far as reasonably possible"*, *"3- constant gizmo speed, which shall follow the current orbit angular speed on dy
 * and dx"*, *"4- … the behavior of the gizmo in commit 65a691a was OK (gizmo following the orbit). I want to keep this behavior."*, *"5- Gizmo shall pass
 * over the protruding part. Blend the movements to avoid jumps"*).
 *
 * Within the engage distance the gizmo is a POINT IN A PLANE: the plane of the hosting face, the REGION the connected coplanar faces of the placed parts
 * (`spanRegion`, each face's convex hull, joined within `SPAN_GROW_M` — the 3 mm between two cores bridged), the gizmo moved by the orbit's own step
 * (`spanStepOf`: the orbit's yaw and pitch × the assembly's radius, along the directions the orbit moved it at the engage — `spanAxes`), clamped to the
 * region (`boundStep`: slides along its edge), riding over what stands on the plane (`coveredTop`, a protrusion's top read off its triangles — no ray
 * pick), eased by travel (`rideStep`). At the region's edge a push goes on into a CATCH (`spanMove`, `clampSlide`: `catchMm` of the finger), then the WRAP onto the face
 * across the edge (`wrapCandidate` — convex or concave), turned by the finger's travel (`turnMm`), reversible. The red and green lines: the run of the
 * region through the gizmo along each input axis, over the tops (`regionRun`, `spanPolyline` — steps drawn as near-vertical connectors, never a stray
 * segment). Textbook geometry only: convex hulls, point–segment and point–triangle distances (Ericson), barycentric heights, bisection.
 */
import { cross, dot, normalize, qFromAxisAngle, qRotate, type Vec3 } from "../core/vec";
import { boundStep, convexHull2D, convexOverlap2D, slerpDir } from "./hover";

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

// ───────────────────────────── the input ─────────────────────────────

/** ⭐ A wall: within 40° of vertical (its normal within 50° of horizontal). */
export function isWall(n: Vec3): boolean {
  return Math.abs(n[1]) < SPAN_VERTICAL_SIN;
}

/** ⭐ `v` laid on the plane of `n`, unit; `null` square to it. */
export function onPlane(v: Vec3, n: Vec3): Vec3 | null {
  return normalize(sub3(v, mul3(n, dot(v, n))));
}

/** ⭐ On a wall the input axes LEVELLED — the yaw's horizontal, the pitch's along the wall's up, each keeping its sense (verticals respected). */
export function levelAxes(n: Vec3, eYaw: Vec3, ePitch: Vec3): { eYaw: Vec3; ePitch: Vec3 } {
  const h = normalize(cross([0, 1, 0], n));
  const v = onPlane([0, 1, 0], n);
  if (h === null || v === null) return { eYaw, ePitch };
  return { eYaw: dot(eYaw, h) < 0 ? mul3(h, -1) : h, ePitch: dot(ePitch, v) < 0 ? mul3(v, -1) : v };
}

/**
 * ⭐⭐⭐ THE INPUT AXES at the engage — the owner's *"gizmo following the orbit"*: the directions the orbit's yaw and pitch steps moved the piece (and the
 * gizmo under it) — `yawStep`, `pitchStep` (world, per radian) — laid on the plane, square to each other (the yaw's first), each keeping its sense; one
 * that lies across the view falls back on the screen's right / up. On a wall, levelled (`levelAxes`).
 */
export function spanAxes(n: Vec3, yawStep: Vec3, pitchStep: Vec3, screenRight: Vec3, screenUp: Vec3): { eYaw: Vec3; ePitch: Vec3 } {
  const py = sub3(yawStep, mul3(n, dot(yawStep, n)));
  const pp = sub3(pitchStep, mul3(n, dot(pitchStep, n)));
  const ly = Math.hypot(...py);
  const lp = Math.hypot(...pp);
  let eYaw: Vec3;
  let ePitch: Vec3;
  if (ly >= lp * 0.2 && ly > 1e-6) {
    eYaw = mul3(py, 1 / ly);
    const s = cross(n, eYaw);
    const ref = lp > 1e-6 ? pp : (onPlane(screenUp, n) ?? s);
    ePitch = dot(s, ref) < 0 ? mul3(s, -1) : s;
  } else if (lp > 1e-6) {
    ePitch = mul3(pp, 1 / lp);
    const s = cross(ePitch, n);
    const ref = onPlane(screenRight, n) ?? s;
    eYaw = dot(s, ref) < 0 ? mul3(s, -1) : s;
  } else {
    eYaw = onPlane(screenRight, n) ?? normalize(cross([0, 1, 0], n)) ?? [1, 0, 0];
    const s = cross(n, eYaw);
    ePitch = dot(s, screenUp) < 0 ? mul3(s, -1) : s;
  }
  return isWall(n) ? levelAxes(n, eYaw, ePitch) : { eYaw, ePitch };
}

/** ⭐ The gizmo's step (m, world) for an orbit step of `dYaw` and `dPitch` (rad): the orbit's angular speed × the assembly's radius — constant. */
export function spanStepOf(dYaw: number, dPitch: number, radiusM: number, eYaw: Vec3, ePitch: Vec3): Vec3 {
  return add3(mul3(eYaw, dYaw * radiusM), mul3(ePitch, dPitch * radiusM));
}

/** ⭐ An orbit step read as the finger's travel (mm) at the orbit's pace (`degPerMm`). */
export function spanMmOf(dYaw: number, dPitch: number, degPerMm: number): number {
  return degPerMm > 0 ? Math.hypot(dYaw, dPitch) / ((degPerMm * Math.PI) / 180) : 0;
}

/**
 * ⭐ An axis's sense read off the screen, at rest: the axis (as the finger drives it — `sign` × it) going against the screen's way (`screenAxis`, its right
 * for the yaw, its up for the pitch) is turned round — after the screen rolled (a back face reached over the top), the finger again moves the gizmo the
 * way the orbit's own rule would (`signOnScreen`'s). Near square, kept.
 */
export function axisOnScreen(e: Vec3, sign: 1 | -1, screenAxis: Vec3): Vec3 {
  const l = Math.hypot(...screenAxis);
  if (!(l > 1e-9)) return e;
  return (sign * dot(e, screenAxis)) / l < -0.2 ? mul3(e, -1) : e;
}

/** ⭐ The screen's up on a face: a wall's the world's (laid on the view square to it), else the up carried in (`upRef`) laid on the plane. */
export function spanUp(n: Vec3, upRef: Vec3): Vec3 {
  if (isWall(n)) return onPlane([0, 1, 0], n) ?? upRef;
  return onPlane(upRef, n) ?? upRef;
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
 * ⭐⭐⭐ THE FACE ACROSS THE EDGE at the edge point `B` (world), the push going along `D` (world, in the plane of `n`): among the faces not in the region
 * (`exclude`), within `reach` of `B` — CONVEX, a face turned toward the push lying behind the plane (a box's next side); CONCAVE, a face turned against the
 * push standing in front of it (an inner corner's wall). The nearest; a tie to the one more square to the push. `null`: nothing there (the edge stops).
 */
export function wrapCandidate(faces: readonly SpanFace[], exclude: ReadonlySet<number>, B: Vec3, n: Vec3, D: Vec3, reach = SPAN_WRAP_REACH_M): SpanCandidate | null {
  let best: SpanCandidate | null = null;
  let bestScore = Infinity;
  faces.forEach((f, i) => {
    if (exclude.has(i) || f.tris.length === 0) return;
    const m = f.normal;
    if (dot(m, n) > 0.98 || dot(m, n) < -0.98) return;
    const md = dot(m, D);
    const hs = f.tris.flatMap((t) => t.map((p) => dot(sub3(p, B), n)));
    let kind: "CONVEX" | "CONCAVE" | null = null;
    if (md > 0.3 && Math.max(...hs) <= 0.002) kind = "CONVEX";
    else if (md < -0.3 && Math.min(...hs) >= -0.002) kind = "CONCAVE";
    if (kind === null) return;
    const d = distanceToTris(B, f.tris);
    if (d > reach) return;
    const score = d - 1e-4 * Math.abs(md);
    if (score < bestScore) {
      bestScore = score;
      best = { index: i, normal: m, kind, dist: d };
    }
  });
  return best;
}

/** ⭐ The turn that takes `from` (a face's normal) onto `to` — about the edge, `angle` (rad); `null` for parallel ones. */
export function wrapTurn(from: Vec3, to: Vec3): { readonly axis: Vec3; readonly angle: number } | null {
  const axis = normalize(cross(from, to));
  if (axis === null) return null;
  return { axis, angle: Math.acos(Math.max(-1, Math.min(1, dot(from, to)))) };
}

export function turnVec(v: Vec3, axis: Vec3, angle: number): Vec3 {
  return qRotate(qFromAxisAngle(axis, angle), v);
}

/** ⭐ The gizmo's motion in the plane: where it is; the finger pushed past the edge (mm — the catch); a wrap under way. */
export interface SpanMotion {
  readonly at: P2;
  readonly overMm: number;
  readonly wrap: { readonly dir: P2; readonly share: number; readonly to: SpanCandidate } | null;
}

/**
 * ⭐⭐⭐ ONE STEP OF THE GIZMO — `step` (m, plane coordinates) for `stepMm` of the finger: inside, clamped by the region (`spanClampStep` — slid along the
 * edge); the part the edge refuses goes into the CATCH (`overMm`, back to 0 once the step leaves the edge); past `catchMm` the face across is asked for
 * (`findNext`, the edge point and the push's way out) — none, the edge holds; else the WRAP starts, its share the finger's travel along the push over
 * `turnMm` (back the other way: back to 0, onto this face again — reversible). `commit`: the wrap is whole (the caller moves onto the next face).
 */
export function spanMove(
  m: SpanMotion,
  step: P2,
  stepMm: number,
  dist: (q: P2) => number,
  catchMm: number,
  turnMm: number,
  findNext: (at: P2, out: P2) => SpanCandidate | null,
): { readonly motion: SpanMotion; readonly commit: boolean; readonly held: boolean } {
  const len = Math.hypot(step[0], step[1]);
  if (!(len > 1e-12) || !(stepMm > 0)) return { motion: m, commit: false, held: false };
  if (m.wrap !== null) {
    const along = ((step[0] * m.wrap.dir[0] + step[1] * m.wrap.dir[1]) / len) * stepMm;
    const share = m.wrap.share + (turnMm > 0 ? along / turnMm : Math.sign(along));
    if (share >= 1) return { motion: { ...m, wrap: { ...m.wrap, share: 1 } }, commit: true, held: false };
    if (share <= 0) return { motion: { at: m.at, overMm: 0, wrap: null }, commit: false, held: false };
    return { motion: { ...m, wrap: { ...m.wrap, share } }, commit: false, held: false };
  }
  const to: P2 = [m.at[0] + step[0], m.at[1] + step[1]];
  const nb = clampSlide(m.at, step, dist);
  const bl: P2 = [to[0] - nb[0], to[1] - nb[1]];
  const bll = Math.hypot(bl[0], bl[1]);
  if (bll <= 1e-9 * Math.max(1, len) || bll <= 1e-9) return { motion: { at: nb, overMm: 0, wrap: null }, commit: false, held: false };
  const out: P2 = [bl[0] / bll, bl[1] / bll];
  const over = m.overMm + (stepMm * bll) / len;
  if (over < catchMm) return { motion: { at: nb, overMm: over, wrap: null }, commit: false, held: false };
  const next = findNext(nb, out);
  if (next === null) return { motion: { at: nb, overMm: catchMm, wrap: null }, commit: false, held: true };
  const share = turnMm > 0 ? (over - catchMm) / turnMm : 1;
  return { motion: { at: nb, overMm: catchMm, wrap: { dir: out, share: Math.min(1, share), to: next } }, commit: share >= 1, held: false };
}

// ───────────────────────────── engage, direction, share ─────────────────────────────

/** ⭐ In face-span? On within `engageM` of the gizmo, off only past `SPAN_RELEASE_FACTOR` × it. */
export function spanEngaged(on: boolean, distM: number, engageM: number): boolean {
  return on ? distM <= engageM * SPAN_RELEASE_FACTOR : distM <= engageM;
}

/** ⭐ The engage distance used: the slider's, held so its release stays within the far orbit's reach (`farM` — else the far orbit could never come back). */
export function spanEngageM(sliderM: number, farM: number): number {
  return Math.max(0.05, Math.min(sliderM, farM / (SPAN_RELEASE_FACTOR * 1.02)));
}

/** ⭐ A blend's share after `travelMm` more of the finger over `spanMm` (0: whole at once), and by time at rest. */
export function spanShareAfter(share: number, travelMm: number, spanMm: number, dtMs: number, atRest: boolean): number {
  if (!(spanMm > 0)) return 1;
  return Math.min(1, share + Math.max(0, travelMm) / spanMm + (atRest ? Math.max(0, dtMs) / SPAN_REST_MS : 0));
}

/**
 * ⭐⭐ THE PIECE'S DIRECTION in face-span: the face's normal — turned about the edge by a wrap's share — and, while the engage's blend is under way, slerped
 * from the far orbit's direction at the engage (`u0`) by its share. The camera stands behind the piece along it: square to the face, no slant.
 */
export function spanDirection(n: Vec3, wrap: { readonly axis: Vec3; readonly angle: number; readonly share: number } | null, u0: Vec3 | null, engageShare: number): Vec3 {
  const f = wrap === null ? n : turnVec(n, wrap.axis, wrap.angle * wrap.share);
  return u0 !== null && engageShare < 1 ? slerpDir(u0, f, Math.max(0, engageShare)) : f;
}
