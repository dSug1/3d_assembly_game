/**
 * ⭐⭐⭐ (2026-11-13, `Claude/40_RENDER_SCENE/spec/POLAR_ZONES.md` — the owner: *"if the faces contour is small and many faces converge to a singularity,
 * polar orbit shall be the only way"*, *"the polar orbit has to snap its pole to the local pole"*) THE POLAR ZONES of the faces contour, engine-free:
 *
 *  * WHERE (§3.2 – §3.3): a corner where ≥ `valenceMin` REAL facets meet (T1 — Blender's pole), off the orbit's own pole, whose star's facets are SMALL
 *    (T3: 2·area / perimeter under `facetMinRatio` × the smallest side of the PLACED set's box — D-Z1, the owner: the assembly as it stands, not the
 *    finished one, never the held piece) seeds a zone; the facets touching it that fail T2 (a slanted edge to the facet above / below in their column)
 *    or T3 join it; zones that touch merge; a failing facet with no pole stays tilted (D-Z4).
 *  * ITS AXIS (§3.4): from the zone's rim's centroid to its pole, snapped onto a world axis within `snapDeg` (D-Z2); two zones on one line are one zone
 *    with two poles (`Scene_0bis`: the line through both apexes).
 *  * ITS FRAME F (F → world, by rows like `orbit_tilt`'s `Mat3`): F's vertical the axis, F's yaw 0 the world axis most square to it.
 *  * ITS ORIENTATION (§3.5, D-Z6): ≤ `uprightMaxDeg` from the vertical UPRIGHT (S1, today's tilted), ≥ `spitMinDeg` SPIT (S2, the rotisserie), between: the
 *    author's tag, untagged UPRIGHT.
 *  * ITS EXTENT (D-Z5): the WHOLE assembly in F when the zone's facets and the facets whose sections are the same in F and in the world cover more than
 *    `wholeShare` of the contour's area.
 *
 * The runtime helpers: which zone the gizmo is in with the exit's hysteresis (`zoneAt`, D-Z7), the finger read in F's upright screen (`fingerInFrame`), and
 * the zenith edge crossed as on `Scene_0` (`spitSide`, `spitHeading`, `crossingHold` — the owner: *"the dy hold happens after the crossing, not before
 * the crossing"*, *"I want to replicate the behavior of scene 0 when crossing the zenith edge"*).
 */
import type { Vec3 } from "../core/vec";
import type { FaceMap, Facet } from "./face_map";
import type { Mat3 } from "./orbit_tilt";

/** ⭐ The zones' knobs — each a `GestureConfig` field with a slider (`zoneOptsOf` in the wiring). */
export interface ZoneOpts {
  /** T1: a corner where at least this many real facets meet is a pole (Blender's: 5) */
  readonly valenceMin: number;
  /** T3: a facet is small under this share of the placed set's box's smallest side (0.22) */
  readonly facetMinRatio: number;
  /** the axis snapped onto a world axis within this (deg) */
  readonly snapDeg: number;
  /** S1 up to this angle from the vertical (deg) */
  readonly uprightMaxDeg: number;
  /** S2 from this angle from the vertical (deg) */
  readonly spitMinDeg: number;
  /** F for the whole assembly over this share of the contour's area (0 … 1; above 1: never) */
  readonly wholeShare: number;
}

export const DEFAULT_ZONE_OPTS: ZoneOpts = { valenceMin: 5, facetMinRatio: 0.22, snapDeg: 10, uprightMaxDeg: 30, spitMinDeg: 60, wholeShare: 0.5 };

export type ZoneOrientation = "UPRIGHT" | "SPIT";

export interface PolarZone {
  /** the contour's facets in the zone (the WORLD map's indices) */
  readonly facets: readonly number[];
  /** its poles (the convergence corners), one or two */
  readonly poles: readonly Vec3[];
  /** its axis, unit (UPRIGHT: pointing up) */
  readonly axis: Vec3;
  /** F → world, by rows (`mulM(frame, vF)` is the world's) — F's vertical the axis */
  readonly frame: Mat3;
  readonly orientation: ZoneOrientation;
  /** F for the whole assembly (D-Z5) */
  readonly whole: boolean;
  /** which check put the facets in: the pole's star, T2, T3 */
  readonly reason: { readonly pole: readonly number[]; readonly t2: readonly number[]; readonly t3: readonly number[] };
}

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 | null => {
  const l = len(a);
  return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : null;
};
const D = Math.PI / 180;
/** ⭐ two corners within this are one (m) */
const CORNER_TOL_M = 0.0005;
/** ⭐ T2: an edge is level within this (deg) — `RIDGE_TIE_DEG`'s */
const LEVEL_DEG = 1;
/** ⭐ D-Z5: a facet's section is the same in F and in the world when its normal is square to the axis within this (deg) */
const ALIKE_DEG = 10;

/** ⭐ The facets that count: real, with a polygon. */
function realFacets(map: FaceMap): number[] {
  const out: number[] = [];
  map.facets.forEach((f, i) => {
    if (f.real && f.poly.length >= 3) out.push(i);
  });
  return out;
}

/** ⭐ A facet's polygon without repeated points. */
function polyOf(f: Facet): Vec3[] {
  const P = f.poly;
  return P.filter((p, k) => len(sub(p, P[(k + 1) % P.length]!)) > 1e-7);
}

/** ⭐ T3's size: 2 · area / perimeter (a disc's radius, a square's half side). */
export function facetSize(f: Facet): number {
  const P = polyOf(f);
  if (P.length < 3) return 0;
  let a: Vec3 = [0, 0, 0];
  let per = 0;
  for (let k = 0; k < P.length; k++) {
    const p = P[k]!;
    const q = P[(k + 1) % P.length]!;
    a = [a[0] + p[1] * q[2] - p[2] * q[1], a[1] + p[2] * q[0] - p[0] * q[2], a[2] + p[0] * q[1] - p[1] * q[0]];
    per += len(sub(q, p));
  }
  const area = len(a) / 2;
  return per > 0 ? (2 * area) / per : 0;
}

function facetArea(f: Facet): number {
  const P = polyOf(f);
  let a: Vec3 = [0, 0, 0];
  for (let k = 0; k < P.length; k++) {
    const p = P[k]!;
    const q = P[(k + 1) % P.length]!;
    a = [a[0] + p[1] * q[2] - p[2] * q[1], a[1] + p[2] * q[0] - p[0] * q[2], a[2] + p[0] * q[1] - p[1] * q[0]];
  }
  return len(a) / 2;
}

/** ⭐ The contour's corners: polygon vertices that are corners (not on a straight side), merged within `CORNER_TOL_M`, with the facets around each. */
export function contourCorners(map: FaceMap): { readonly p: Vec3; readonly facets: readonly number[] }[] {
  const out: { p: Vec3; facets: number[] }[] = [];
  for (const i of realFacets(map)) {
    const Q = polyOf(map.facets[i]!);
    for (let k = 0; k < Q.length; k++) {
      const a = Q[(k - 1 + Q.length) % Q.length]!;
      const p = Q[k]!;
      const b = Q[(k + 1) % Q.length]!;
      const u = sub(a, p);
      const w = sub(b, p);
      const c = dot(u, w) / (len(u) * len(w));
      if (!(c > -1 + 1e-9)) continue; // a point on a straight side
      let v = out.find((x) => len(sub(x.p, p)) < CORNER_TOL_M);
      if (v === undefined) {
        v = { p, facets: [] };
        out.push(v);
      }
      if (!v.facets.includes(i)) v.facets.push(i);
    }
  }
  return out;
}

/** ⭐ Two facets share an edge: two of their polygons' points in common (within `CORNER_TOL_M`) — the shared points, or `null`. */
function sharedEdge(a: Facet, b: Facet): [Vec3, Vec3] | null {
  const A = polyOf(a);
  const B = polyOf(b);
  const common: Vec3[] = [];
  for (const p of A) if (B.some((q) => len(sub(p, q)) < CORNER_TOL_M) && !common.some((c) => len(sub(c, p)) < CORNER_TOL_M)) common.push(p);
  if (common.length < 2) return null;
  // the two farthest apart
  let best: [Vec3, Vec3] = [common[0]!, common[1]!];
  for (let i = 0; i < common.length; i++)
    for (let j = i + 1; j < common.length; j++) if (len(sub(common[i]!, common[j]!)) > len(sub(best[0], best[1]))) best = [common[i]!, common[j]!];
  return best;
}

/** ⭐ T2 fails: in a column the facet meets the facet above / below along an edge that is not level. */
function t2Fails(map: FaceMap, fi: number): boolean {
  const f = map.facets[fi]!;
  for (const col of map.columns) {
    const k = col.facets.indexOf(fi);
    if (k < 0) continue;
    for (const j of [col.facets[k - 1], col.facets[k + 1]]) {
      if (j === undefined || j === fi) continue;
      const g = map.facets[j]!;
      if (!g.real) continue;
      const e = sharedEdge(f, g);
      if (e === null) continue;
      const d = unit(sub(e[1], e[0]));
      if (d !== null && Math.abs(d[1]) > Math.sin(LEVEL_DEG * D)) return true;
    }
  }
  return false;
}

/** ⭐ The axis `a` snapped onto the nearest world axis within `deg`. */
export function snapToWorldAxis(a: Vec3, deg: number): Vec3 {
  const axes: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (const e of axes) {
    const c = dot(a, e);
    if (Math.abs(c) >= Math.cos(deg * D)) return c > 0 ? e : [-e[0], -e[1], -e[2]];
  }
  return a;
}

/** ⭐ F → world for the axis `a` (by rows): F's y the axis, F's x the world axis most square to it (ties: y, x, z) laid square to it, F's z = x × y. */
export function zoneFrame(a: Vec3): Mat3 {
  const ey = unit(a) ?? [0, 1, 0];
  const cand: Vec3[] = [[0, 1, 0], [1, 0, 0], [0, 0, 1]];
  let best = cand[0]!;
  for (const e of cand) if (Math.abs(dot(e, ey)) < Math.abs(dot(best, ey)) - 1e-9) best = e;
  const k = dot(best, ey);
  const ex = unit([best[0] - k * ey[0], best[1] - k * ey[1], best[2] - k * ey[2]]) ?? [1, 0, 0];
  const ez = cross(ex, ey);
  return [
    [ex[0], ey[0], ez[0]],
    [ex[1], ey[1], ez[1]],
    [ex[2], ey[2], ez[2]],
  ];
}

/** ⭐ S1 / S2 from the axis's angle with the world's vertical (D-Z6); the band between: the tag, else S1. */
export function zoneOrientation(a: Vec3, o: ZoneOpts, tag: ZoneOrientation | null = null): ZoneOrientation {
  const ang = Math.acos(Math.min(1, Math.abs(a[1]))) / D;
  if (ang <= o.uprightMaxDeg) return "UPRIGHT";
  if (ang >= o.spitMinDeg) return "SPIT";
  return tag ?? "UPRIGHT";
}

/** ⭐ The zone's rim's centroid: its facets' edges not shared with another of its facets, weighted by length. */
function rimCentroid(map: FaceMap, facets: readonly number[]): Vec3 | null {
  let s: Vec3 = [0, 0, 0];
  let w = 0;
  for (const i of facets) {
    const P = polyOf(map.facets[i]!);
    for (let k = 0; k < P.length; k++) {
      const p = P[k]!;
      const q = P[(k + 1) % P.length]!;
      const inner = facets.some((j) => {
        if (j === i) return false;
        const Q = polyOf(map.facets[j]!);
        return Q.some((x) => len(sub(x, p)) < CORNER_TOL_M) && Q.some((x) => len(sub(x, q)) < CORNER_TOL_M);
      });
      if (inner) continue;
      const l = len(sub(q, p));
      s = [s[0] + ((p[0] + q[0]) / 2) * l, s[1] + ((p[1] + q[1]) / 2) * l, s[2] + ((p[2] + q[2]) / 2) * l];
      w += l;
    }
  }
  return w > 0 ? [s[0] / w, s[1] / w, s[2] / w] : null;
}

/**
 * ⭐⭐⭐ THE ZONES of the map (the WORLD's face map of the placed set, recomputed at each seat — the cache's key is the map's). `tags`: the author's
 * orientation per zone where its pole lies within 1 mm of the tag's point (none yet: the proxies' `orbit:` tag is `3d_assembly_game-scene2`'s, §4.3).
 */
export function polarZones(map: FaceMap, o: ZoneOpts = DEFAULT_ZONE_OPTS, tags: readonly { readonly at: Vec3; readonly orientation: ZoneOrientation }[] = []): PolarZone[] {
  const real = realFacets(map);
  if (real.length === 0) return [];
  const b = map.box;
  const minSide = Math.min(b.hi[0] - b.lo[0], b.hi[1] - b.lo[1], b.hi[2] - b.lo[2]);
  const sMin = o.facetMinRatio * minSide;
  const size = new Map<number, number>();
  for (const i of real) size.set(i, facetSize(map.facets[i]!));
  const small = (i: number): boolean => (size.get(i) ?? Infinity) < sMin;
  // ── T1: the poles — off the orbit's own pole (the vertical line through the box's centre, at its top or bottom)
  const cx = (b.lo[0] + b.hi[0]) / 2;
  const cz = (b.lo[2] + b.hi[2]) / 2;
  const onOrbitPole = (p: Vec3): boolean => Math.hypot(p[0] - cx, p[2] - cz) < 0.001 && (Math.abs(p[1] - b.hi[1]) < 0.001 || Math.abs(p[1] - b.lo[1]) < 0.001);
  const poles = contourCorners(map).filter((c) => c.facets.length >= o.valenceMin && !onOrbitPole(c.p));
  // ── the seeds: a pole's star, when its facets are small (T3 — the median)
  interface Z { facets: Set<number>; poles: Vec3[]; pole: Set<number>; t2: Set<number>; t3: Set<number> }
  const zs: Z[] = [];
  for (const c of poles) {
    const ss = c.facets.map((i) => size.get(i) ?? Infinity).sort((x, y) => x - y);
    if (!(ss[Math.floor(ss.length / 2)]! < sMin)) continue;
    zs.push({ facets: new Set(c.facets), poles: [c.p], pole: new Set(c.facets), t2: new Set(), t3: new Set() });
  }
  if (zs.length === 0) return [];
  // ── the growth: a facet touching a zone that fails T2 or T3 joins it (repeated until none joins)
  const touches = (i: number, z: Z): boolean => [...z.facets].some((j) => j !== i && sharedEdge(map.facets[i]!, map.facets[j]!) !== null);
  for (const z of zs) {
    let grew = true;
    while (grew) {
      grew = false;
      for (const i of real) {
        if (z.facets.has(i) || !touches(i, z)) continue;
        const f3 = small(i);
        const f2 = !f3 && t2Fails(map, i);
        if (!f2 && !f3) continue;
        z.facets.add(i);
        (f3 ? z.t3 : z.t2).add(i);
        grew = true;
      }
    }
  }
  // ── zones that touch (a facet in common, or an edge) merge
  const merged: Z[] = [];
  for (const z of zs) {
    const m = merged.find((y) => [...z.facets].some((i) => y.facets.has(i) || touches(i, y)));
    if (m === undefined) merged.push(z);
    else {
      for (const i of z.facets) m.facets.add(i);
      for (const p of z.poles) if (!m.poles.some((q) => len(sub(p, q)) < CORNER_TOL_M)) m.poles.push(p);
      for (const i of z.pole) m.pole.add(i);
      for (const i of z.t2) m.t2.add(i);
      for (const i of z.t3) m.t3.add(i);
    }
  }
  // ── each zone's axis: rim centroid → pole, snapped
  const withAxis = merged.map((z) => {
    const f = [...z.facets];
    const c = rimCentroid(map, f);
    let a: Vec3 | null = c === null ? null : unit(sub(z.poles[0]!, c));
    if (a === null) {
      let n: Vec3 = [0, 0, 0];
      for (const i of f) n = [n[0] + map.facets[i]!.n[0], n[1] + map.facets[i]!.n[1], n[2] + map.facets[i]!.n[2]];
      a = unit(n) ?? [0, 1, 0];
    }
    return { z, a: snapToWorldAxis(a, o.snapDeg) };
  });
  // ── two zones on one line (axes within the snap, each pole on the other's line): ONE zone with two poles, its axis pole to pole
  const diag = Math.hypot(b.hi[0] - b.lo[0], b.hi[1] - b.lo[1], b.hi[2] - b.lo[2]);
  const lineDist = (p: Vec3, q: Vec3, a: Vec3): number => len(cross(sub(p, q), a));
  const groups: { z: Z; a: Vec3 }[] = [];
  for (const w of withAxis) {
    const g = groups.find((y) => Math.abs(dot(y.a, w.a)) >= Math.cos(o.snapDeg * D) && lineDist(w.z.poles[0]!, y.z.poles[0]!, y.a) < 0.05 * diag);
    if (g === undefined) {
      groups.push({ z: w.z, a: w.a });
      continue;
    }
    for (const i of w.z.facets) g.z.facets.add(i);
    for (const p of w.z.poles) g.z.poles.push(p);
    for (const i of w.z.pole) g.z.pole.add(i);
    for (const i of w.z.t2) g.z.t2.add(i);
    for (const i of w.z.t3) g.z.t3.add(i);
    const ab = unit(sub(g.z.poles[g.z.poles.length - 1]!, g.z.poles[0]!));
    if (ab !== null) g.a = snapToWorldAxis(ab, o.snapDeg);
  }
  // ── the frame, the orientation, the extent
  let total = 0;
  for (const i of real) total += facetArea(map.facets[i]!);
  return groups.map(({ z, a: a0 }) => {
    const tag = tags.find((t) => z.poles.some((p) => len(sub(p, t.at)) < 0.001))?.orientation ?? null;
    const orientation = zoneOrientation(a0, o, tag);
    // UPRIGHT: the axis up (the screen's up in F is F's vertical); SPIT: as found (P− → P+)
    const a: Vec3 = orientation === "UPRIGHT" && a0[1] < 0 ? [-a0[0], -a0[1], -a0[2]] : a0;
    let share = 0;
    for (const i of real) {
      const f = map.facets[i]!;
      const alike = !z.facets.has(i) && f.kind === "SIDE" && Math.abs(f.n[1]) <= Math.SQRT1_2 && Math.abs(dot(f.n, a)) < Math.sin(ALIKE_DEG * D) && Math.abs(a[1]) < Math.sin(ALIKE_DEG * D);
      if (z.facets.has(i) || alike) share += facetArea(f);
    }
    const whole = total > 0 && share / total > o.wholeShare;
    const facets = [...z.facets].sort((x, y) => x - y);
    return {
      facets,
      poles: z.poles,
      axis: a,
      frame: zoneFrame(a),
      orientation,
      whole,
      reason: { pole: [...z.pole].sort((x, y) => x - y), t2: [...z.t2].sort((x, y) => x - y), t3: [...z.t3].sort((x, y) => x - y) },
    };
  });
}

/** ⭐ The distance (m) from `p` to the nearest of the facets' polygons (in its plane inside it, else to its sides). */
export function distanceToFacets(map: FaceMap, facets: readonly number[], p: Vec3): number {
  let best = Infinity;
  for (const i of facets) {
    const f = map.facets[i];
    if (f === undefined) continue;
    const P = polyOf(f);
    if (P.length < 3) continue;
    const h = dot(p, f.n) - f.e;
    const q: Vec3 = [p[0] - f.n[0] * h, p[1] - f.n[1] * h, p[2] - f.n[2] * h];
    // inside: on the same side of every edge (a convex facet)
    let inside = true;
    let sg = 0;
    for (let k = 0; k < P.length; k++) {
      const s = dot(cross(sub(P[(k + 1) % P.length]!, P[k]!), sub(q, P[k]!)), f.n);
      if (Math.abs(s) < 1e-12) continue;
      if (sg === 0) sg = Math.sign(s);
      else if (Math.sign(s) !== sg) {
        inside = false;
        break;
      }
    }
    if (inside) {
      best = Math.min(best, Math.abs(h));
      continue;
    }
    for (let k = 0; k < P.length; k++) {
      const a = P[k]!;
      const e = sub(P[(k + 1) % P.length]!, a);
      const t = Math.max(0, Math.min(1, dot(sub(p, a), e) / Math.max(1e-18, dot(e, e))));
      best = Math.min(best, len(sub(p, [a[0] + e[0] * t, a[1] + e[1] * t, a[2] + e[2] * t])));
    }
  }
  return best;
}

/**
 * ⭐⭐⭐ (§3.3 5., D-Z7) THE ZONE THE GIZMO IS IN: the one holding its facet (`facet`, the world map's index); none — the zone it was in (`prev`) until it is
 * `exitMm` past its rim (`depthPastRimMm`, the wiring's `distanceToFacets`), then none. A whole-assembly zone is always in.
 */
export function zoneAt<Zt extends { readonly facets: readonly number[]; readonly whole: boolean }>(zones: readonly Zt[], facet: number, prev: Zt | null, depthPastRimMm: number, exitMm: number): Zt | null {
  const whole = zones.find((z) => z.whole);
  if (whole !== undefined) return whole;
  const here = zones.find((z) => z.facets.includes(facet));
  if (here !== undefined) return here;
  if (prev !== null && zones.includes(prev) && depthPastRimMm < exitMm) return prev;
  return null;
}

/**
 * ⭐⭐⭐ (§3.5, the swap) THE FINGER IN F's UPRIGHT SCREEN: the screen move (`dx` right, `dy` up — the orbit's `fdy`) on the camera looking along `view`
 * (toward the centre; the glass's right `up × view`, Babylon's left-handed axes — ⛔ the outward direction there mirrors the turn) with its up `up`, read in the screen of the camera upright in F (its up the axis `a` on the glass): there the rule is today's (dx
 * round the axis, dy pole to pole). In a spit (the camera upright in the WORLD, the axis across the glass) a dx goes pole to pole, a dy round — for any
 * roll between, the finger keeps its way on the glass. `a`: F's up in the world (the axis; the wiring gives the way toward the pole at the orbit's place,
 * defined at the pole too); none on the glass: the last angle (`prevAlpha`). Returns the move in F's screen and the angle of F's up on the glass (rad,
 * from the camera's up toward its right).
 */
export function fingerInFrame(dx: number, dy: number, view: Vec3, up: Vec3, a: Vec3, prevAlpha: number): { readonly dx: number; readonly dy: number; readonly alpha: number } {
  const V = unit(view) ?? [0, 0, -1];
  const k0 = dot(up, V);
  const U = unit([up[0] - k0 * V[0], up[1] - k0 * V[1], up[2] - k0 * V[2]]) ?? [0, 1, 0];
  const Rt = cross(U, V);
  const k = dot(a, V);
  const U1raw: Vec3 = [a[0] - k * V[0], a[1] - k * V[1], a[2] - k * V[2]];
  let alpha = prevAlpha;
  if (len(U1raw) > 0.05) {
    const U1u = unit(U1raw)!;
    alpha = Math.atan2(dot(U1u, Rt), dot(U1u, U));
  }
  const U1: Vec3 = [Math.cos(alpha) * U[0] + Math.sin(alpha) * Rt[0], Math.cos(alpha) * U[1] + Math.sin(alpha) * Rt[1], Math.cos(alpha) * U[2] + Math.sin(alpha) * Rt[2]];
  const Rt1 = cross(U1, V);
  const W: Vec3 = [dx * Rt[0] + dy * U[0], dx * Rt[1] + dy * U[1], dx * Rt[2] + dy * U[2]];
  return { dx: dot(W, Rt1), dy: dot(W, U1), alpha };
}

/**
 * ⭐⭐⭐ (2026-11-13, the owner: *"replicate the behavior of scene 0 when crossing the zenith edge"*) THE SPIT'S FINGER LOOKING DOWN: the swap itself, each
 * finger axis on ONE of F's — a dx along the axis only (F's pitch), a dy round it only (F's yaw), the signs the glass's (`alpha`, `fingerInFrame`'s). As on
 * `Scene_0`, where after the crossing a dx runs along the ridge and never back over it. ⛔ The glass's mix there (the view near the vertical, F's up a few
 * degrees off the glass's right): a dx leaked into the turn round the axis, the camera crossed back, turned round, the leak reversed — 9 crossings in one
 * diagonal (probed).
 */
export function fingerSwapped(dx: number, dy: number, alpha: number): { readonly dx: number; readonly dy: number } {
  const s = Math.sin(alpha) >= 0 ? 1 : -1;
  return { dx: -dy * s, dy: dx * s };
}

/**
 * ⭐⭐⭐ (2026-11-13, the owner: *"check what happens in scene 0 at the zenith edge: the dy hold happens after the crossing, not before the crossing … I
 * want to replicate the behavior of scene 0 when crossing the zenith edge"*) THE SPIT'S SIDE. On `Scene_0` (probed close in, `zen0c`) the gizmo crosses the
 * ridge, the camera makes ONE turn over it — about the edge's own line, 140° in ≈ 160 ms, its roll about the view < 1° — the gizmo held, THEN the dy that
 * crossed is held (§8). In the spit the camera is upright in the world: its heading is the SIDE of the axis it is on (in front of the body or behind it —
 * `spitSideRef` × the side), never its own direction's (that spun at the vertical: 100° in 12 frames, the "very rapid roll" with a dx). The side changes
 * only when the camera has passed over the axis (`spitSide`, a 2° hysteresis) — that change IS the crossing: one timed turn, the gizmo held, then the hold.
 */
export const SPIT_SIDE_HYST_DEG = 2;

/** ⭐ The horizontal direction square to the axis (the side "in front" when positive): `a × up`, laid level; a vertical axis: x. */
export function spitSideRef(a: Vec3): Vec3 {
  return unit([-a[2], 0, a[0]]) ?? [1, 0, 0];
}

/**
 * ⭐⭐⭐ THE SIDE the camera direction `u` (centre → camera) is on: the sign of its part square to the axis along `spitSideRef`, changed from `prev` only past
 * `hystDeg` (a camera straight over the axis keeps its side); looking along the axis (at a tip): `prev`. `prev` 0: none yet — read as it is.
 */
export function spitSide(u: Vec3, a: Vec3, prev: number, hystDeg: number = SPIT_SIDE_HYST_DEG): number {
  const k = dot(u, a);
  const r: Vec3 = [u[0] - k * a[0], u[1] - k * a[1], u[2] - k * a[2]];
  const lr = len(r);
  if (!(lr > 0.05)) return prev === 0 ? 1 : prev;
  const s = dot(r, spitSideRef(a)) / lr;
  if (prev === 0) return s < 0 ? -1 : 1;
  return Math.sign(s) !== prev && Math.abs(s) > Math.sin(hystDeg * D) ? -prev : prev;
}

/** ⭐ The spit camera's level heading (the orbit's convention: x = cos, z = sin) on `side`. */
export function spitHeading(a: Vec3, side: number): number {
  const r = spitSideRef(a);
  return Math.atan2(side * r[2], side * r[0]);
}

/** ⭐ The side's bias in the spit camera's heading (`spitCameraHeading`): the level part of a unit direction it outweighs — a view above ≈ 72° */
export const SPIT_SIDE_BIAS = 0.3;

/**
 * ⭐⭐⭐ THE SPIT CAMERA'S HEADING for its direction `u` (centre → camera): the heading of `u`'s level part plus the side's level direction × `SPIT_SIDE_BIAS`
 * — ONE continuous rule. Looking down (a small level part) the side wins: a dx along the axis at the top never spins the view (⛔ `u`'s own: 100° in 12
 * frames); level (round a tip) `u`'s own wins, and there the heading hardly turns the picture (`offsetFrame` weighs it by the view's sine). ⛔ Two readings
 * blended by the pitch (`Scene_0`'s 50° / 60°): near a tip they part by up to 80° — the picture rolled 70° in one finger event.
 */
export function spitCameraHeading(u: Vec3, a: Vec3, side: number): number {
  const r = spitSideRef(a);
  // ⭐ (2026-11-14, the walks: 105 – 112 ROLL events, the camera standing 5 – 17° off upright for hundreds of frames at mid height) the bias faded in
  // from `SPIT_BIAS_FROM_RAD` (60°) to `SPIT_BIAS_FULL_RAD` (75°) of the view's pitch: below, the camera plainly upright (its own direction's heading)
  const p = Math.asin(Math.min(1, Math.abs(u[1]) / Math.max(1e-12, len(u))));
  const x = Math.min(1, Math.max(0, (p - SPIT_BIAS_FROM_RAD) / (SPIT_BIAS_FULL_RAD - SPIT_BIAS_FROM_RAD)));
  const b = SPIT_SIDE_BIAS * x * x * (3 - 2 * x);
  const hx = u[0] + side * b * r[0];
  const hz = u[2] + side * b * r[2];
  return Math.hypot(hx, hz) > 1e-9 ? Math.atan2(hz, hx) : spitHeading(a, side);
}

/** ⭐ The side's bias faded in from this pitch of the view … */
export const SPIT_BIAS_FROM_RAD = (60 * Math.PI) / 180;
/** ⭐ … whole from this one. */
export const SPIT_BIAS_FULL_RAD = (75 * Math.PI) / 180;
/** ⭐ A side change is a CROSSING (the turn, the hold) only seen from this pitch up / down: below it the heading is the direction's own (`spitCameraHeading`). */
export const SPIT_CROSSING_PITCH_RAD = SPIT_BIAS_FROM_RAD;

/** ⭐ (2026-11-14) the part of a unit direction square to the axis under this, the direction is round a TIP (within 30° of the axis): no crossing there */
export const SPIT_OVER_AXIS_MIN = 0.5;

/**
 * ⭐⭐⭐ (2026-11-14) HOW STEEPLY THE DIRECTION `u` PASSES THE AXIS `a`: the pitch (rad) of its part SQUARE to the axis — a side change with it steep
 * (≥ `SPIT_CROSSING_PITCH_RAD`) is the camera passing OVER or UNDER the axis (the zenith edge, the bottom face's middle: a crossing — the turn, the hold);
 * 0 round a tip (that part under `SPIT_OVER_AXIS_MIN`: its way means nothing there — a silent change). ⛔ (the same day) the pitch of `u` itself: on the
 * bottom face off its middle `u` leans along the axis (41° toward a tip, 2026-11-14's walk) though it passes under the axis — read as "round a tip", the
 * side flipped with no turn and no hold, the finger's mapping with it: the gizmo bounced across the middle every few frames.
 */
export function overAxisPitch(u: Vec3, a: Vec3): number {
  const k = dot(u, a);
  const r: Vec3 = [u[0] - k * a[0], u[1] - k * a[1], u[2] - k * a[2]];
  const lr = len(r);
  return lr >= SPIT_OVER_AXIS_MIN ? Math.asin(Math.min(1, Math.abs(r[1]) / lr)) : 0;
}

/**
 * ⭐⭐⭐ (§8's hold, after the crossing) THE DY HOLD once the side changed: at the gizmo `g0` on its face (normal `n`), into the face beyond square to the
 * edge (toward the new `side`, along the face) — the dy sign that crossed (`sign`, the finger's last) held until the gizmo is `edgeHoldMm` deep. `null`: no
 * dy to hold, or no way along the face.
 */
export function crossingHold(g0: Vec3, n: Vec3 | null, a: Vec3, side: number, sign: number): { readonly g0: Vec3; readonly d: Vec3; readonly sign: 1 | -1; readonly back: number } | null {
  if (sign === 0 || n === null) return null;
  const s = spitSideRef(a);
  const w: Vec3 = [s[0] * side, s[1] * side, s[2] * side];
  const k = dot(w, n);
  const d = unit([w[0] - k * n[0], w[1] - k * n[1], w[2] - k * n[2]]);
  return d === null ? null : { g0, d, sign: sign > 0 ? 1 : -1, back: 0 };
}
