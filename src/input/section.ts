/**
 * ⭐⭐⭐ (2026-11-07, `TILTED_ORBIT_REBUILD_SCOPE.md` §30.3 S1 – S3) **THE SECTION, EXACT** — a section's plane cutting the placed parts, engine-free.
 * * S1 — each part is convex: its cut by the plane is the convex hull of the crossings of its vertex pairs (exact for a convex body — every pair's segment
 *   lies inside it, the edges' crossings are the extreme ones); a CAST is the first crossing of a line of the plane with those polygons.
 * * S3 — THE FILL (the owner's D2b1: *"the green section fills the void (what is between the edge of the void and the green section)"*): a point of the
 *   plane is filled when parts lie on BOTH sides of it along the plane's normal (the other section's way — their shadows along it) and either the line
 *   through it along `c` (the wall's normal axis in the plane) is clear of every cut — a void the other section bridges (D2a) — or the gap between those
 *   parts along the normal is narrower than the piece (`w` — Q1c: the other section bridges a recess the piece does not fit).
 * * S2's support — the extreme point of the cut and of the fill in a direction (each face's run is bounded by its corners' supports).
 * ⛔ ENGINE-FREE. Convex hulls, Cyrus–Beck clipping, Sutherland–Hodgman — textbook.
 */
import { cross, dot, normalize, type Vec3 } from "../core/vec";
import type { CutLoop, Plane } from "./plane_cut";
import type { Landing, RopePlace } from "./rope";

type P2 = readonly [number, number];

/** ⭐ A part's shadow along the plane's normal: its 2D hull, the part's extent along the normal (signed, from the plane), its index. */
interface Shadow {
  readonly poly: readonly P2[];
  readonly lo: number;
  readonly hi: number;
  readonly part: number;
  readonly box: readonly [number, number, number, number];
}

/** ⭐ A section: its plane, an in-plane frame (`o`, `u`, `v`), the parts' cuts (2D convex, counter-clockwise) and shadows, the piece's width. */
export interface Section {
  readonly plane: Plane;
  readonly o: Vec3;
  readonly u: Vec3;
  readonly v: Vec3;
  readonly cuts: readonly { readonly poly: readonly P2[]; readonly part: number; readonly box: readonly [number, number, number, number] }[];
  readonly shadows: readonly Shadow[];
  readonly w: number;
}

const EPS = 1e-9;
/** ⭐ A part lying within this of the plane (m) counts as crossing it (no side for the fill). */
const SIDE_EPS_M = 1e-6;

const cross2 = (a: P2, b: P2): number => a[0] * b[1] - a[1] * b[0];

/** ⭐ The 2D convex hull, counter-clockwise (monotone chain); fewer than three distinct points: `[]`. */
export function hull2(pts: readonly P2[]): P2[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return [];
  const turn = (o: P2, a: P2, b: P2): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: P2[] = [];
  for (const q of p) {
    while (lower.length >= 2 && turn(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 1e-15) lower.pop();
    lower.push(q);
  }
  const upper: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]!;
    while (upper.length >= 2 && turn(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 1e-15) upper.pop();
    upper.push(q);
  }
  const h = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  return h.length >= 3 ? h : [];
}

const boxOf2 = (poly: readonly P2[]): [number, number, number, number] => {
  let a = Infinity;
  let b = Infinity;
  let c = -Infinity;
  let d = -Infinity;
  for (const q of poly) {
    a = Math.min(a, q[0]);
    b = Math.min(b, q[1]);
    c = Math.max(c, q[0]);
    d = Math.max(d, q[1]);
  }
  return [a, b, c, d];
};

/** ⭐ An in-plane frame for a plane's normal. */
function frameOf(n: Vec3): { u: Vec3; v: Vec3 } {
  const ref: Vec3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = normalize(cross(ref, n)) ?? [1, 0, 0];
  const v = normalize(cross(n, u)) ?? [0, 0, 1];
  return { u, v };
}

/** ⭐⭐⭐ S1 — THE SECTION of the convex parts `parts` (each its vertices) by `plane`; `w` the piece's width (S3's narrow test). */
export function buildSection(parts: readonly (readonly Vec3[])[], plane: Plane, w: number): Section {
  const n = plane.n;
  const o: Vec3 = [n[0] * plane.d, n[1] * plane.d, n[2] * plane.d];
  const { u, v } = frameOf(n);
  const to2 = (p: Vec3): P2 => {
    const r: Vec3 = [p[0] - o[0], p[1] - o[1], p[2] - o[2]];
    return [dot(r, u), dot(r, v)];
  };
  const cuts: Section["cuts"][number][] = [];
  const shadows: Shadow[] = [];
  parts.forEach((vs, part) => {
    if (vs.length < 3) return;
    const s = vs.map((p) => dot(n, p) - plane.d);
    const lo = Math.min(...s);
    const hi = Math.max(...s);
    const sh = hull2(vs.map(to2));
    if (sh.length >= 3) shadows.push({ poly: sh, lo, hi, part, box: boxOf2(sh) });
    if (lo > SIDE_EPS_M || hi < -SIDE_EPS_M) return;
    const pts: P2[] = [];
    for (let i = 0; i < vs.length; i++) {
      if (Math.abs(s[i]!) <= SIDE_EPS_M) pts.push(to2(vs[i]!));
      for (let j = i + 1; j < vs.length; j++) {
        if (!((s[i]! > SIDE_EPS_M && s[j]! < -SIDE_EPS_M) || (s[i]! < -SIDE_EPS_M && s[j]! > SIDE_EPS_M))) continue;
        const t = s[i]! / (s[i]! - s[j]!);
        const a = vs[i]!;
        const b = vs[j]!;
        pts.push(to2([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]));
      }
    }
    const h = hull2(pts);
    if (h.length >= 3) cuts.push({ poly: h, part, box: boxOf2(h) });
  });
  return { plane, o, u, v, cuts, shadows, w };
}

/** ⭐ The 2D point of a 3D one (projected on the plane), and back. */
export function sectionTo2(sec: Section, p: Vec3): P2 {
  const r: Vec3 = [p[0] - sec.o[0], p[1] - sec.o[1], p[2] - sec.o[2]];
  return [dot(r, sec.u), dot(r, sec.v)];
}
export function sectionTo3(sec: Section, q: P2): Vec3 {
  return [sec.o[0] + sec.u[0] * q[0] + sec.v[0] * q[1], sec.o[1] + sec.u[1] * q[0] + sec.v[1] * q[1], sec.o[2] + sec.u[2] * q[0] + sec.v[2] * q[1]];
}

/** ⭐ Cyrus–Beck: the parameter interval of the line `o + t·d` inside the convex CCW polygon (any `t`); `null`: it misses. */
function clipLine(poly: readonly P2[], o: P2, d: P2): [number, number] | null {
  let t0 = -Infinity;
  let t1 = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    // inside: left of a→b (CCW): cross(b − a, p − a) ≥ 0
    const e: P2 = [b[0] - a[0], b[1] - a[1]];
    const num = cross2(e, [o[0] - a[0], o[1] - a[1]]);
    const den = cross2(e, d);
    if (Math.abs(den) < 1e-15) {
      if (num < 0) return null;
      continue;
    }
    const t = -num / den;
    if (den > 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return null;
  }
  return [t0, t1];
}

const inside = (poly: readonly P2[], p: P2): boolean => {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    if (cross2([b[0] - a[0], b[1] - a[1]], [p[0] - a[0], p[1] - a[1]]) < -1e-12) return false;
  }
  return true;
};

/** ⭐ A hit of a cast: the distance along it, the point, the part (its index) — `-1`: the fill. */
export interface SectionHit {
  readonly t: number;
  readonly point: Vec3;
  readonly part: number;
}

/** ⭐ S3's test at a 2D point: parts on both sides along the normal and (the line along `c` clear of every cut, or the gap narrower than `w`). */
function filledAt(sec: Section, p: P2, c: P2 | null): boolean {
  let dl = Infinity;
  let dr = Infinity;
  for (const s of sec.shadows) {
    if (s.lo <= SIDE_EPS_M && s.hi >= -SIDE_EPS_M) continue; // crossing the plane: its cut is solid already
    if (p[0] < s.box[0] - EPS || p[0] > s.box[2] + EPS || p[1] < s.box[1] - EPS || p[1] > s.box[3] + EPS || !inside(s.poly, p)) continue;
    if (s.hi < 0) dl = Math.min(dl, -s.hi);
    else dr = Math.min(dr, s.lo);
  }
  if (!(dl < Infinity && dr < Infinity)) return false;
  if (dl + dr < sec.w) return true;
  if (c === null) return false;
  for (const k of sec.cuts) if (clipLine(k.poly, p, c) !== null) return false;
  return true;
}

/** ⭐ The axis `c` of S3 in the plane's 2D frame (none: `null`). */
function axis2(sec: Section, c: Vec3 | null): P2 | null {
  if (c === null) return null;
  const k = dot(c, sec.plane.n);
  const q: Vec3 = [c[0] - k * sec.plane.n[0], c[1] - k * sec.plane.n[1], c[2] - k * sec.plane.n[2]];
  const a: P2 = [dot(q, sec.u), dot(q, sec.v)];
  const l = Math.hypot(a[0], a[1]);
  return l > 1e-6 ? [a[0] / l, a[1] / l] : null;
}

/**
 * ⭐⭐⭐ S1 + S3 — THE CAST: from `origin` along `dir` (both in the plane), as far as `length`: the first part's cut met, or the first point of the fill
 * (`c` S3's axis; `fill` false: the parts only). `null`: nothing.
 */
export function sectionCast(sec: Section, origin: Vec3, dir: Vec3, length: number, c: Vec3 | null, fill: boolean = true): SectionHit | null {
  const o = sectionTo2(sec, origin);
  const dd: P2 = [dot(dir, sec.u), dot(dir, sec.v)];
  const dl = Math.hypot(dd[0], dd[1]);
  if (dl < 1e-9) return null;
  const d: P2 = [dd[0] / dl, dd[1] / dl];
  let best: { t: number; part: number } | null = null;
  for (const k of sec.cuts) {
    const r = clipLine(k.poly, o, d);
    if (r === null || r[1] < 0 || r[0] > length) continue;
    const t = Math.max(0, r[0]);
    if (best === null || t < best.t) best = { t, part: k.part };
  }
  if (fill) {
    const lim = best === null ? length : best.t;
    const f = fillEntry(sec, o, d, lim, axis2(sec, c));
    if (f !== null && (best === null || f < best.t - 1e-9)) best = { t: f, part: -1 };
  }
  if (best === null) return null;
  return { t: best.t, point: sectionTo3(sec, [o[0] + d[0] * best.t, o[1] + d[1] * best.t]), part: best.part };
}

/** ⭐ The first `t` in [0, lim] where the fill holds along `o + t·d` (exact up to its breakpoints); `null`: none. */
function fillEntry(sec: Section, o: P2, d: P2, lim: number, c: P2 | null): number | null {
  const ts: number[] = [0, lim];
  let any = false;
  for (const s of sec.shadows) {
    if (s.lo <= SIDE_EPS_M && s.hi >= -SIDE_EPS_M) continue;
    const r = clipLine(s.poly, o, d);
    if (r === null || r[1] < 0 || r[0] > lim) continue;
    any = true;
    ts.push(r[0], r[1]);
  }
  if (!any) return null;
  // the line along `c` through o + t·d meets a cut for t in an interval: its ends are breakpoints too
  if (c !== null && Math.abs(cross2(d, c)) > 1e-9) {
    for (const k of sec.cuts) {
      let a = Infinity;
      let b = -Infinity;
      for (const q of k.poly) {
        const t = cross2([q[0] - o[0], q[1] - o[1]], c) / cross2(d, c);
        a = Math.min(a, t);
        b = Math.max(b, t);
      }
      ts.push(a, b);
    }
  }
  const cut = [...new Set(ts.filter((t) => t >= 0 && t <= lim))].sort((x, y) => x - y);
  for (let i = 0; i + 1 < cut.length; i++) {
    const a = cut[i]!;
    const b = cut[i + 1]!;
    if (b - a < 1e-7) continue;
    const m = (a + b) / 2;
    if (filledAt(sec, [o[0] + d[0] * m, o[1] + d[1] * m], c)) return a;
  }
  return null;
}

/** ⭐ Sutherland–Hodgman: two convex CCW polygons' intersection. */
function clipPoly(a: readonly P2[], b: readonly P2[]): P2[] {
  let out: P2[] = [...a];
  for (let i = 0; i < b.length && out.length > 0; i++) {
    const p = b[i]!;
    const q = b[(i + 1) % b.length]!;
    const e: P2 = [q[0] - p[0], q[1] - p[1]];
    const side = (x: P2): number => cross2(e, [x[0] - p[0], x[1] - p[1]]);
    const inp = out;
    out = [];
    for (let k = 0; k < inp.length; k++) {
      const x = inp[k]!;
      const y = inp[(k + 1) % inp.length]!;
      const sx = side(x);
      const sy = side(y);
      if (sx >= 0) out.push(x);
      if ((sx >= 0) !== (sy >= 0)) {
        const t = sx / (sx - sy);
        out.push([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t]);
      }
    }
  }
  return out;
}

/**
 * ⭐⭐ S2's SUPPORT — the extreme point of the section in direction `dir` (in the plane): over the parts' cuts and the fill (`c` S3's axis: each pair of
 * shadows from both sides, their overlap's corners kept where the fill holds just inside). `null`: an empty section.
 */
export function sectionSupport(sec: Section, dir: Vec3, c: Vec3 | null): Vec3 | null {
  const g: P2 = [dot(dir, sec.u), dot(dir, sec.v)];
  let best: P2 | null = null;
  let bv = -Infinity;
  const take = (q: P2): void => {
    const val = q[0] * g[0] + q[1] * g[1];
    if (val > bv) {
      bv = val;
      best = q;
    }
  };
  for (const k of sec.cuts) for (const q of k.poly) take(q);
  const c2 = axis2(sec, c);
  const left = sec.shadows.filter((s) => s.hi < -SIDE_EPS_M);
  const right = sec.shadows.filter((s) => s.lo > SIDE_EPS_M);
  for (const a of left)
    for (const b of right) {
      if (a.box[0] > b.box[2] || b.box[0] > a.box[2] || a.box[1] > b.box[3] || b.box[1] > a.box[3]) continue;
      const q = clipPoly(a.poly, b.poly);
      if (q.length < 3) continue;
      const cx = q.reduce((s, x) => s + x[0], 0) / q.length;
      const cy = q.reduce((s, x) => s + x[1], 0) / q.length;
      for (const x of q) {
        const val = x[0] * g[0] + x[1] * g[1];
        if (val <= bv) continue;
        const inward: P2 = [x[0] + (cx - x[0]) * 1e-3, x[1] + (cy - x[1]) * 1e-3];
        if (filledAt(sec, inward, c2)) take(x);
      }
    }
  return best === null ? null : sectionTo3(sec, best);
}

/** ⭐ §30 S3's axis on a facet (normal `n`, a cap or not): a wall's own normal; a cap's — the plane's horizontal way (the walls' normal axis there). */
export function fillAxis(plane: Plane, n: Vec3, cap: boolean): Vec3 | null {
  return cap ? normalize(cross(plane.n, [0, 1, 0])) : n;
}

/** ⭐ A face's run: its way along the loop and its span along that way (m, absolute). */
export interface Run {
  readonly t: Vec3;
  readonly lo: number;
  readonly hi: number;
}

/** ⭐ A place nearer a run's end than this is out of it (m). */
export const RUN_TOL_M = 0.0005;

/**
 * ⭐⭐⭐ §30 S2 — EACH FACE OWNS ITS RUN: for each side of the loop `loop` (by facet; `facets` their normals and caps), its way `t` and the run's span along it
 * — between the section's supports in its two corners' bisector directions (the cut and the fill, S3). ⛔ §29 R1 landed anywhere: a top's cast on the
 * back's protrusion 48 cm below.
 */
export function sectionRuns(sec: Section, loop: CutLoop, facets: readonly { readonly n: Vec3; readonly cap: boolean }[]): Map<number, Run> {
  const out = new Map<number, Run>();
  const n = loop.pts.length;
  for (let i = 0; i < n; i++) {
    const f = loop.facet[i]!;
    if (out.has(f)) continue;
    const a = loop.pts[i]!;
    const b = loop.pts[(i + 1) % n]!;
    const t = normalize([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    if (t === null) continue;
    const fp = loop.facet[(i - 1 + n) % n]!;
    const fn = loop.facet[(i + 1) % n]!;
    const nf = facets[f]!.n;
    const c = fillAxis(sec.plane, nf, facets[f]!.cap);
    const sup = (g: number): Vec3 | null => (g === f ? null : sectionSupport(sec, [nf[0] + facets[g]!.n[0], nf[1] + facets[g]!.n[1], nf[2] + facets[g]!.n[2]], c));
    const sp = sup(fp);
    const sn = sup(fn);
    let lo = sp === null ? -Infinity : dot(t, sp);
    let hi = sn === null ? Infinity : dot(t, sn);
    if (lo > hi) {
      const mid = (lo + hi) / 2;
      lo = mid;
      hi = mid;
    }
    out.set(f, { t, lo, hi });
  }
  return out;
}

/** ⭐ A cast's reach (m) — across any assembly — and how far outside the place it starts (m). */
const CAST_LEN_M = 6;
const CAST_OUT_M = 0.05;

/**
 * ⭐⭐⭐ §30 R1 + S2 — A PLACE's LANDING: inside its face's run (`run`), the first of a part or the fill straight in along the facet's normal (`q.n`; `cap`
 * the facet a cap — S3's axis); outside the run, or nothing hit: a void (`null`). `ids` the parts' ids (the landing's host; the fill: none).
 */
export function sectionLanding(sec: Section, run: Run | undefined, cap: boolean, q: RopePlace, ids: readonly (string | null)[]): Landing | null {
  if (run !== undefined) {
    const x = dot(run.t, q.p);
    // inside by the tolerance (⛔ outside by it: a cast at a run's very edge passed beside the corner — on a top, past an overhang's tip onto the part 30 cm below)
    if (x < run.lo + RUN_TOL_M || x > run.hi - RUN_TOL_M) return null;
  }
  const n = q.n;
  const h = sectionCast(sec, [q.p[0] + n[0] * CAST_OUT_M, q.p[1] + n[1] * CAST_OUT_M, q.p[2] + n[2] * CAST_OUT_M], [-n[0], -n[1], -n[2]], CAST_LEN_M, fillAxis(sec.plane, n, cap));
  return h === null ? null : { point: h.point, host: h.part >= 0 ? (ids[h.part] ?? null) : null };
}

/** ⭐ §30 R7's `w`: a face's narrowest width — over its edges' directions, the extent across them (`normal` the face's, `edges` its outline). */
export function faceWidth(normal: Vec3, edges: readonly (readonly Vec3[])[]): number {
  const pts = edges.flat();
  let best = Infinity;
  for (const e of edges) {
    if (e.length < 2) continue;
    const d = normalize([e[1]![0] - e[0]![0], e[1]![1] - e[0]![1], e[1]![2] - e[0]![2]]);
    const across = d === null ? null : normalize(cross(normal, d));
    if (across === null) continue;
    let lo = Infinity;
    let hi = -Infinity;
    for (const q of pts) {
      const x = dot(q, across);
      lo = Math.min(lo, x);
      hi = Math.max(hi, x);
    }
    if (hi > lo) best = Math.min(best, hi - lo);
  }
  return best < Infinity ? best : 0;
}
