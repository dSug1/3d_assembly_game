/**
 * ⭐⭐⭐ (2026-11-02, branch `1.0.90-`) **THE FACE-SPAN GIZMO** — engine-free (`FACE_SPAN_2026-11-02.md`). ⭐⭐⭐ (2026-11-03, branch `1.0.91-`, the owner: *"I
 * want to make the red and green contours strictly in their respectively single plan which strictly corresponds to the section cut of the assembly by a vertical
 * or horizontal plane … if a overhanging face would be hidden if the camera view was anti-aligned with the normal of the face, the red or green contour shall
 * ignore this face and the gizmo shall behave like a shadow (ie jumping over the discontinuity). Also, a slanted face shall behave as its projection … Also,
 * no tilt of the curve"*) — **THE SHADOW GIZMO**, close in and far out alike: the gizmo is a POINT ON A BASE — one of the six directions of the assembly's box
 * (`boxDirs`: the vertical and the two axes of its plan's smallest rectangle) — moved by the orbit's SOLVED yaw and pitch steps along the base's LEVEL AXES
 * (ff2fca2's relation: `faceAxes`, `axisSense`, `spanAxisStep`, `greenPaceOf`) in straight lines; its depth the SHADOW's (`shadowMap`, `shadowAt`: the
 * frontmost surface along the base's normal, a gap narrower than the bridge filled) — a step in it is a jump; clamped to the shadow's outline (`clampSlide`),
 * caught there, then onto the next base at 90° (`spanMove`, `snapDir`). Over a top / bottom the roll of branch 1.0.83 at the zenith (`zenithCrossing`,
 * `zenithRollStep`). The red and green lines: the shadow's profile through the gizmo in the level and the vertical plane (`shadowRun`, `spanPolyline` — a step a
 * connector). Textbook geometry only: convex hulls, rotating calipers, barycentric heights, a raster's one-dimensional closing, bisection.
 */
import { cross, dot, normalize, type Vec3 } from "../core/vec";
import { convexHull2D } from "./hover";

export type P2 = readonly [number, number];
export type Tri = readonly [Vec3, Vec3, Vec3];

/** ⭐ The calm's weight falls to 0 at this × the engage distance (`calmWeight`). */
export const SPAN_RELEASE_FACTOR = 1.2;
/** ⭐ A face within 40° of vertical is a WALL: its input axes levelled, the screen's up the world's (`TILT_ON_DEG`'s complement). */
export const SPAN_VERTICAL_SIN = Math.sin((50 * Math.PI) / 180);
/** ⭐ The lines lifted off the surface (m) — never in it. */
export const SPAN_LINE_LIFT_M = 0.002;

const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];

// ───────────────────────────── the plane ─────────────────────────────

/** ⭐ The base plane: a point on it, its normal, two in-plane axes (`a` horizontal where it can be). */
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

/** ⭐ A face of a placed part: its normal and its triangles (the world's, on the part's model pose). */
export interface SpanFace {
  readonly normal: Vec3;
  readonly tris: readonly Tri[];
}

// ───────────────────────────── the assembly's box: the six base directions ─────────────────────────────

/**
 * ⭐⭐⭐ (2026-11-03, the owner: *"the red and green contours strictly in their respectively single plan which strictly corresponds to the section cut of the
 * assembly by a vertical or horizontal plane"*) — **THE SIX BASES**: the gizmo's face is always one of the assembly's BOX's — the vertical, and the two
 * horizontal axes of the smallest rectangle round the placed parts' plan (rotating calipers over its convex hull, textbook) — so its normal never tilts
 * with a slanted face (no frame switch, no roll). Order: +x, −x, +z, −z, +y, −y. No plan (fewer than three points apart): the world's axes.
 */
export function boxDirs(points: readonly Vec3[]): Vec3[] {
  const hull = convexHull2D(points.map((p) => [p[0], p[2]] as [number, number]));
  let best: { area: number; e: [number, number] } | null = null;
  for (let i = 0; i < hull.length && hull.length >= 3; i++) {
    const p = hull[i]!;
    const q = hull[(i + 1) % hull.length]!;
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (!(l > 1e-9)) continue;
    const e: [number, number] = [(q[0] - p[0]) / l, (q[1] - p[1]) / l];
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const r of hull) {
      const a = r[0] * e[0] + r[1] * e[1];
      const b = -r[0] * e[1] + r[1] * e[0];
      a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b);
    }
    const area = (a1 - a0) * (b1 - b0);
    if (best === null || area < best.area - 1e-12) best = { area, e };
  }
  // the axis nearer the world's x first (a box already square to the world keeps its axes as they are)
  let e = best?.e ?? [1, 0];
  const cands: [number, number][] = [e, [-e[1], e[0]], [-e[0], -e[1]], [e[1], -e[0]]];
  e = cands.reduce((m, c) => (c[0] > m[0] + 1e-12 ? c : m), cands[0]!);
  const x: Vec3 = [e[0], 0, e[1]];
  const z: Vec3 = [-e[1], 0, e[0]];
  return [x, mul3(x, -1), z, mul3(z, -1), [0, 1, 0], [0, -1, 0]];
}

/** ⭐ The base direction nearest `v` among `dirs` — none within 25° of `not` (or its opposite): a wrap turns to another base. `null`: `v` zero. */
export function snapDir(v: Vec3, dirs: readonly Vec3[], not: Vec3 | null = null): Vec3 | null {
  let best: Vec3 | null = null;
  let bd = -Infinity;
  for (const d of dirs) {
    if (not !== null && Math.abs(dot(d, not)) > 0.9) continue;
    const c = dot(d, v);
    if (c > bd) {
      bd = c;
      best = d;
    }
  }
  return Math.hypot(v[0], v[1], v[2]) > 1e-12 ? best : null;
}

// ───────────────────────────── the shadow ─────────────────────────────

/** ⭐ A triangle not edge-on seen along the base (plane coordinates and the height in front of the plane), its world normal and its part. */
export interface ShadowTri {
  readonly p: readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]];
  readonly box: readonly [number, number, number, number];
  readonly n: Vec3;
  readonly owner: number;
}

/**
 * ⭐⭐⭐ **THE SHADOW** of the placed parts on a base (the owner: *"if an overhanging face would be hidden if the camera view was anti-aligned with the normal of
 * the face, the red or green contour shall ignore this face and the gizmo shall behave like a shadow … a slanted face shall behave as its projection"*): what a
 * ray along −n from outside meets first — the FRONTMOST height over each point of the plane. Its plane at the parts' outermost extent along `n` (heights ≤ 0),
 * its triangles bucketed; and a raster of it (`cell` m) on which the gaps narrower than `bridgeM` along either axis of the plane are BRIDGED — a cell whose
 * nearest higher cells each side stand no farther apart than `bridgeM` is filled to the lower of the two (the owner: *"ignore gaps narrower than a slider
 * value"*). Exact on the real surface (`shadowAt` reads the triangles), a point over nothing measured on them too; the raster only fills a recess.
 */
export interface ShadowMap {
  readonly plane: SpanPlane;
  readonly tris: readonly ShadowTri[];
  readonly x0: number;
  readonly y0: number;
  readonly cell: number;
  readonly nx: number;
  readonly ny: number;
  readonly raw: Float64Array;
  readonly closed: Float64Array;
  /** the bridge (m) — a point over nothing is measured on the triangles themselves (`shadowAt`) */
  readonly bridge: number;
  readonly buckets: readonly (readonly number[])[];
  readonly bx: number;
  readonly by: number;
  readonly bcell: number;
}

/** ⭐ Below this (|cos| with the base's normal) a triangle is edge-on: it hides nothing. */
const SHADOW_FACING = 1e-4;
/** ⭐ A cell filled by less than this (m) is not a gap: the exact surface is read there. */
const SHADOW_FILL_TOL_M = 0.001;
/** ⭐ The raster's cells per side at most. */
const SHADOW_MAX_CELLS = 200;
const BUCKETS = 48;

export function shadowMap(n0: Vec3, parts: readonly (readonly Tri[])[], bridgeM: number, cell = 0.004): ShadowMap | null {
  const n = normalize(n0);
  if (n === null) return null;
  let top = -Infinity;
  for (const tris of parts) for (const t of tris) for (const p of t) top = Math.max(top, dot(p, n));
  if (!Number.isFinite(top)) return null;
  const plane = spanPlane(n, mul3(n, top));
  const tris: ShadowTri[] = [];
  parts.forEach((pt, owner) => {
    for (const t of pt) {
      // ⭐ either winding (⛔ the inward-wound meshes' BACK faces were taken: the gizmo 33 mm inside the painting, its lines hidden) — a closed part's frontmost
      // surface along the base is its front, whichever way its triangles turn; the normal turned toward the base
      const n0 = normalize(cross(sub3(t[1], t[0]), sub3(t[2], t[0])));
      if (n0 === null || Math.abs(dot(n0, n)) <= SHADOW_FACING) continue;
      const nn = dot(n0, n) > 0 ? n0 : mul3(n0, -1);
      const p = t.map((v) => { const q = toP2(plane, v); return [q[0], q[1], heightOf(plane, v)] as const; }) as unknown as ShadowTri["p"];
      const xs = p.map((v) => v[0]);
      const ys = p.map((v) => v[1]);
      tris.push({ p, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], n: nn, owner });
    }
  });
  if (tris.length === 0) return null;
  const pad = Math.max(0, bridgeM) + 0.01;
  const lo = [Math.min(...tris.map((t) => t.box[0])) - pad, Math.min(...tris.map((t) => t.box[1])) - pad];
  const hi = [Math.max(...tris.map((t) => t.box[2])) + pad, Math.max(...tris.map((t) => t.box[3])) + pad];
  const c = Math.max(cell, (hi[0]! - lo[0]!) / SHADOW_MAX_CELLS, (hi[1]! - lo[1]!) / SHADOW_MAX_CELLS);
  const nx = Math.max(1, Math.ceil((hi[0]! - lo[0]!) / c));
  const ny = Math.max(1, Math.ceil((hi[1]! - lo[1]!) / c));
  const bcell = Math.max((hi[0]! - lo[0]!) / BUCKETS, (hi[1]! - lo[1]!) / BUCKETS, 1e-6);
  const bx = Math.ceil((hi[0]! - lo[0]!) / bcell);
  const by = Math.ceil((hi[1]! - lo[1]!) / bcell);
  const buckets: number[][] = Array.from({ length: bx * by }, () => []);
  tris.forEach((t, i) => {
    const i0 = Math.max(0, Math.floor((t.box[0] - lo[0]!) / bcell));
    const i1 = Math.min(bx - 1, Math.floor((t.box[2] - lo[0]!) / bcell));
    const j0 = Math.max(0, Math.floor((t.box[1] - lo[1]!) / bcell));
    const j1 = Math.min(by - 1, Math.floor((t.box[3] - lo[1]!) / bcell));
    for (let j = j0; j <= j1; j++) for (let k = i0; k <= i1; k++) buckets[j * bx + k]!.push(i);
  });
  const m0 = { plane, tris, x0: lo[0]!, y0: lo[1]!, cell: c, nx, ny, buckets, bx, by, bcell };
  const raw = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) raw[j * nx + i] = frontRaw(m0, [lo[0]! + (i + 0.5) * c, lo[1]! + (j + 0.5) * c]).h;
  const closed = new Float64Array(raw);
  if (bridgeM > 0) {
    // ⭐ along each axis: the nearest cell each side standing HIGHER (any cell, over nothing); the gap between them no wider than the bridge — filled to the
    // lower of the two (⛔ a window of the bridge each side filled gaps twice as wide: the middle of a 50 mm gap saw both walls within 30 mm)
    const k = Math.ceil(bridgeM / c) + 1;
    const pass = (len: number, at: (s: number) => number): void => {
      for (let s0 = 0; s0 < len; s0++) {
        const f = raw[at(s0)]!;
        const higher = (v: number): boolean => (f === -Infinity ? v > -Infinity : v > f + SHADOW_FILL_TOL_M);
        let ql = 0;
        let qr = 0;
        let hl = -Infinity;
        let hr = -Infinity;
        for (let q = 1; q <= k && s0 - q >= 0; q++) if (higher(raw[at(s0 - q)]!)) { ql = q; hl = raw[at(s0 - q)]!; break; }
        if (ql === 0) continue;
        for (let q = 1; q <= k && s0 + q < len; q++) if (higher(raw[at(s0 + q)]!)) { qr = q; hr = raw[at(s0 + q)]!; break; }
        if (qr === 0 || (ql + qr - 1) * c > bridgeM) continue;
        const fill = Math.min(hl, hr);
        if (fill > closed[at(s0)]!) closed[at(s0)] = fill;
      }
    };
    for (let j = 0; j < ny; j++) pass(nx, (s0) => j * nx + s0);
    for (let i = 0; i < nx; i++) pass(ny, (s0) => s0 * nx + i);
  }
  return { ...m0, raw, closed, bridge: Math.max(0, bridgeM) };
}

/** ⭐ The exact frontmost height over `q` (−∞: nothing there) and its triangle (−1: none). */
function frontRaw(m: Pick<ShadowMap, "tris" | "buckets" | "x0" | "y0" | "bx" | "by" | "bcell">, q: P2): { h: number; tri: number } {
  const i = Math.floor((q[0] - m.x0) / m.bcell);
  const j = Math.floor((q[1] - m.y0) / m.bcell);
  if (i < 0 || j < 0 || i >= m.bx || j >= m.by) return { h: -Infinity, tri: -1 };
  let best = -Infinity;
  let tri = -1;
  for (const ti of m.buckets[j * m.bx + i]!) {
    const t = m.tris[ti]!;
    if (q[0] < t.box[0] - 1e-9 || q[0] > t.box[2] + 1e-9 || q[1] < t.box[1] - 1e-9 || q[1] > t.box[3] + 1e-9) continue;
    const [a, b, c] = t.p;
    const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(d) < 1e-14) continue;
    const l1 = ((b[1] - c[1]) * (q[0] - c[0]) + (c[0] - b[0]) * (q[1] - c[1])) / d;
    const l2 = ((c[1] - a[1]) * (q[0] - c[0]) + (a[0] - c[0]) * (q[1] - c[1])) / d;
    const l3 = 1 - l1 - l2;
    if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue;
    const h = l1 * a[2] + l2 * b[2] + l3 * c[2];
    if (h > best) {
      best = h;
      tri = ti;
    }
  }
  return { h: best, tri };
}

/**
 * ⭐⭐⭐ THE SHADOW AT `q`: its height in front of the base's plane and the triangle there (`tri` −1: a bridged gap — its height the bridge's); `null`: nothing
 * (beyond the assembly's outline seen along the base). Exact on the real surface; a gap's fill read off the raster's cell.
 */
export function shadowAt(m: ShadowMap, q: P2): { readonly h: number; readonly tri: number } | null {
  const r = frontRaw(m, q);
  if (r.tri < 0) return gapAt(m, q);
  const i = Math.floor((q[0] - m.x0) / m.cell);
  const j = Math.floor((q[1] - m.y0) / m.cell);
  const inGrid = i >= 0 && j >= 0 && i < m.nx && j < m.ny;
  const rawC = inGrid ? m.raw[j * m.nx + i]! : -Infinity;
  const cl = inGrid ? m.closed[j * m.nx + i]! : -Infinity;
  // a recess narrower than the bridge (the raster's): filled to the lower of its two sides
  if (cl - rawC > SHADOW_FILL_TOL_M && cl - r.h > SHADOW_FILL_TOL_M) return { h: cl, tri: -1 };
  return r;
}

/** ⭐ The triangles' step (m) a point over nothing is measured at — a joint narrower than the raster's cell (the painting's 3 mm) is seen. */
const GAP_STEP_M = 0.002;

/**
 * ⭐ A point OVER NOTHING, measured on the triangles: along each axis of the plane the nearest surface each side; the gap between them no wider than the
 * bridge — bridged, at the lower of the two; else nothing (beyond the outline: one side has none — the outline never grows outward).
 */
function gapAt(m: ShadowMap, q: P2): { readonly h: number; readonly tri: number } | null {
  if (!(m.bridge > 0)) return null;
  const k = Math.ceil(m.bridge / GAP_STEP_M) + 1;
  let best = -Infinity;
  for (const e of [[1, 0], [0, 1]] as const) {
    const side = (sg: 1 | -1): { q: number; h: number } | null => {
      for (let i = 1; i <= k; i++) {
        const h = frontRaw(m, [q[0] + e[0] * sg * i * GAP_STEP_M, q[1] + e[1] * sg * i * GAP_STEP_M]).h;
        if (h > -Infinity) return { q: i, h };
      }
      return null;
    };
    const l = side(-1);
    if (l === null) continue;
    const r = side(1);
    if (r === null || (l.q + r.q - 1) * GAP_STEP_M > m.bridge) continue;
    best = Math.max(best, Math.min(l.h, r.h));
  }
  return best > -Infinity ? { h: best, tri: -1 } : null;
}

/** ⭐ Is `q` in the shadow (on the assembly as seen along the base, a bridged gap included)? */
export function shadowCovers(m: ShadowMap, q: P2): boolean {
  return shadowAt(m, q) !== null;
}

/** ⭐ The nearest point of the shadow to `q` (itself when covered): the raster's covered cells, nearest first, its centre. `null`: no shadow. */
export function nearestCovered(m: ShadowMap, q: P2): [number, number] | null {
  if (shadowCovers(m, q)) return [q[0], q[1]];
  let best: [number, number] | null = null;
  let bd = Infinity;
  for (let j = 0; j < m.ny; j++)
    for (let i = 0; i < m.nx; i++) {
      if (!(m.closed[j * m.nx + i]! > -Infinity)) continue;
      const c: [number, number] = [m.x0 + (i + 0.5) * m.cell, m.y0 + (j + 0.5) * m.cell];
      const d = Math.hypot(c[0] - q[0], c[1] - q[1]);
      if (d < bd && shadowCovers(m, c)) {
        bd = d;
        best = c;
      }
    }
  return best;
}

/**
 * ⭐⭐ THE RUN through `p` (covered) along the unit `d`: the interval [t0, t1] of the line `p + t·d` in the shadow and connected to `t = 0` — marched a cell
 * at a time, its ends bisected. `[0, 0]` when `p` is not covered.
 */
export function shadowRun(m: ShadowMap, p: P2, d: P2, reach = 4): [number, number] {
  const at = (t: number): P2 => [p[0] + d[0] * t, p[1] + d[1] * t];
  if (!shadowCovers(m, p)) return [0, 0];
  const end = (s: 1 | -1): number => {
    let t = 0;
    for (;;) {
      const t1 = t + s * m.cell;
      if (Math.abs(t1) > reach) return s * reach;
      if (!shadowCovers(m, at(t1))) {
        let a = t;
        let b = t1;
        for (let k = 0; k < 12; k++) {
          const c = (a + b) / 2;
          if (shadowCovers(m, at(c))) a = c;
          else b = c;
        }
        return a;
      }
      t = t1;
    }
  };
  return [end(-1), end(1)];
}

/** ⭐ A step clamped to the shadow's covered points (`clampSlide`'s distance: 0 in it, 1 out). */
export function shadowDist(m: ShadowMap): (q: P2) => number {
  return (q) => (shadowCovers(m, q) ? 0 : 1);
}

/**
 * ⭐⭐ A STEP CLAMPED TO THE SHADOW from `from` (inside): as far along it as it stays inside, then what is left slid along each plane axis in turn (the longer
 * first) — a slanted push reaches the edge and slides along it. From outside: not moved.
 */
export function clampSlide(from: P2, step: P2, dist: (q: P2) => number): [number, number] {
  if (dist(from) > 0) return [from[0], from[1]];
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

/**
 * ⭐⭐ THE LINE along a run: (t, height) points from `t0` to `t1` through `t = 0` (the gizmo, exact), `spacingM` apart, a step in height of more than
 * `stepTolM` refined by halving down to ~0.1 mm — ⭐⭐⭐ (2026-11-03, the owner: *"a step but the gizmo acts as a break"*) a step comes out a near-vertical
 * connector in the line's own plane, a slope a fine slope; at most `maxPts`.
 */
export function spanPolyline(h: (t: number) => number, t0: number, t1: number, spacingM: number, stepTolM = 0.001, maxPts = 400): [number, number][] {
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

/** ⭐ The base across the outline: its normal (one of the box's, `snapDir`). */
export interface SpanCandidate {
  readonly normal: Vec3;
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

// ───────────────────────────── engage ─────────────────────────────

/** ⭐ The engage distance used: the slider's, held so its release stays within the far orbit's reach (`farM` — else the far orbit could never come back). */
export function spanEngageM(sliderM: number, farM: number): number {
  return Math.max(0.05, Math.min(sliderM, farM / (SPAN_RELEASE_FACTOR * 1.02)));
}
