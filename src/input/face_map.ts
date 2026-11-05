/**
 * ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, STEP 4c-bis; the owner: *"propose another way to construct the gizmo so it truly reflects the dy and dx
 * inputs …"* → *"close the holes for the moment"*) — **THE FACE MAP**: the gizmo a FUNCTION of the orbit's angles, no carrier, no state.
 * ⭐⭐⭐ (2026-11-04, STEP 5 — scope §5, §16.1 D3 / D5; the owner: *"step 5: ok"*) **ON THE FACES CONTOUR, NO LONGER THE CORE BOX**:
 *
 * 1. **The facets** (`buildFaceMap`): the placed parts' faces clustered by normal (within `mergeDeg`, the largest face's normal first — snapped onto a world
 *    axis when it is one); each cluster a candidate FACET: its STACK — every face within `mergeDeg` of its normal, grouped by plane (`MAP_COPLANAR_M`) and,
 *    in a plane, by contact (the slide's own regions, grown `MAP_GROW_M`), **every hole inside a group CLOSED** (`filledRegion`) — and its plane the MAIN
 *    group's (the largest closed region: the painting's front, never a part sticking out of it — Step 4c-bis's core box, generalised). The contour is the
 *    intersection of the facets' half-spaces (CONVEX by construction — a constant input turns one way round, I3), bounded by the parts' box; each facet's
 *    polygon on it. ⭐ A facet is kept only when its real face (its main region) covers `minShare` of its polygon (D5) — a frustum's slanted side, whose
 *    plane cuts across the contour, never tilts the orbit; on a box exactly the six faces.
 * 2. **The upright frame** (Step 5: no frame turn yet): the CAPS — the facet nearest straight up / down (a virtual one at the box's top / bottom if none);
 *    the COLUMNS — the other facets clustered by heading (`mergeDeg`), each column a SLICE of the yaw from halfway to each neighbour's heading (Step 4b's
 *    slices; on a box 4 × 90°), its facets stacked by elevation, each a band of the pitch from halfway to each neighbour's elevation (on a box ±45°); the
 *    caps' quarters beyond, concentric to the top / bottom centre at ±90° — as Step 4c-bis.
 * 3. **The place** (`mapTarget`): in the facet's own frame — `t` the way the yaw turns across it (horizontal), `b` up its slope (`t × n`), `n` out —
 *    across it by the yaw (`edgeMap`), up it by the pitch (`edgeMap`); within `edgeDeg` of a slice's / band's end over the facet's last `edgeMm`: through an
 *    edge the gizmo moves slowly — never a wait. So a dx moves the place along `t` (the green: the plane of `t` and `n`) and a dy along `b` (the red: the
 *    plane of `b` and `n`) — I1 in the facet frame, by construction; on a vertical facet the world's horizontal and vertical.
 * 4. **The gizmo** (`stackDepthAt`): on the facet's stack, the FRONTMOST group whose closed region holds the place; none: the NEAREST group's plane (the gizmo
 *    beside the real face, in its plane). The wiring then casts the ray along the normal for the REAL depth (D3: over an empty slot its bottom).
 * ⛔ ENGINE-FREE. Rectangles, a flood fill, convex polygon clipping (Sutherland–Hodgman, 1974), piecewise-linear maps — textbook; no licence, no patent.
 */
import type { Vec3 } from "../core/vec";
import type { ShellBox } from "./orbit_shell";
import type { Rect2 } from "./hover";

/** ⭐ The default merge angle (deg) — `facetMergeDeg`'s default: `Scene_1`'s slanted block (15° off −z) is the front's. */
export const MAP_AXIS_DEG = 20;
/** ⭐ Two faces on one plane: their levels this close (m) — the slide's `COPLANAR_M`. */
export const MAP_COPLANAR_M = 0.0005;
/** ⭐ Each face's rectangle grown by this (m) — the slide's `OUTLINE_GROW_M`: the 3 mm joints between the coloured cores close. */
export const MAP_GROW_M = 0.0016;

/** ⭐ A placed part's face, in the world, on the part's MODEL pose. */
export interface MapFace {
  readonly normal: Vec3;
  readonly centre: Vec3;
  readonly tris: readonly (readonly [Vec3, Vec3, Vec3])[];
}

/**
 * ⭐ A group's region with its holes closed: the cells between its rectangles' edges, each filled (in a rectangle, or enclosed by them) or not; `real` the
 * cells in a rectangle (a face is there — a filled cell not real is a hole, a void closed all round).
 */
export interface FilledRegion {
  readonly xs: readonly number[];
  readonly ys: readonly number[];
  readonly filled: Uint8Array;
  readonly real: Uint8Array;
}

/** ⭐ One plane's group: its level along the facet's normal (outward +), its closed region on the facet's (`t`, `b`). */
export interface MapGroup {
  readonly depth: number;
  readonly region: FilledRegion;
}

/** ⭐ The faces contour's knobs (D5): the merge angle (deg) and the real face share a facet needs (0 … 1). */
export interface FacetOpts {
  readonly mergeDeg: number;
  readonly minShare: number;
}
export const DEFAULT_FACET_OPTS: FacetOpts = { mergeDeg: MAP_AXIS_DEG, minShare: 0.25 };

/**
 * ⭐⭐⭐ A FACET of the faces contour: its outward normal `n`, its frame (`t` the way the yaw turns across it — horizontal —, `b` = `t × n` up its slope),
 * its plane `n·p = e`, its stack (`groups`, frontmost first), its polygon on the contour and that polygon's extents along `t` and `b`, the share of it real
 * face covers; `kind` the band it serves; `real` false for a virtual cap.
 */
export interface Facet {
  readonly n: Vec3;
  readonly t: Vec3;
  readonly b: Vec3;
  readonly e: number;
  readonly kind: "SIDE" | "TOP" | "BOTTOM";
  readonly groups: readonly MapGroup[];
  readonly poly: readonly Vec3[];
  readonly tLo: number;
  readonly tHi: number;
  readonly bLo: number;
  readonly bHi: number;
  readonly share: number;
  readonly real: boolean;
}

/** ⭐ A COLUMN of facets: its slice of the yaw (`mid` ± `hw`), its facets bottom → top and the pitch bands' bounds between them (one more than facets). */
export interface Column {
  readonly mid: number;
  readonly hw: number;
  readonly facets: readonly number[];
  readonly bounds: readonly number[];
}

/** ⭐ The face map: the placed parts' box, the contour's bounding box (`core` — Step 4c-bis's core box on a box), the facets, the columns, the caps. */
export interface FaceMap {
  readonly box: ShellBox;
  readonly core: ShellBox;
  readonly facets: readonly Facet[];
  readonly columns: readonly Column[];
  readonly top: number;
  readonly bottom: number;
}

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const Q = Math.PI / 4;
const H = Math.PI / 2;
const wrapPi = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * ⭐⭐ THE REGION, ITS HOLES CLOSED: the rectangles' edges cut the plane into cells; a cell is in a rectangle or not; the cells not in one and reachable
 * from outside (a flood fill from a border round them all) are the outside — every other cell is FILLED: in a rectangle, or a hole enclosed by them.
 */
export function filledRegion(rects: readonly Rect2[]): FilledRegion {
  if (rects.length === 0) return { xs: [], ys: [], filled: new Uint8Array(0), real: new Uint8Array(0) };
  const x0 = Math.min(...rects.map((r) => r.x0)) - 1;
  const y0 = Math.min(...rects.map((r) => r.y0)) - 1;
  const x1 = Math.max(...rects.map((r) => r.x1)) + 1;
  const y1 = Math.max(...rects.map((r) => r.y1)) + 1;
  const xs = [...new Set([x0, x1, ...rects.flatMap((r) => [r.x0, r.x1])])].sort((a, b) => a - b);
  const ys = [...new Set([y0, y1, ...rects.flatMap((r) => [r.y0, r.y1])])].sort((a, b) => a - b);
  const nx = xs.length - 1;
  const ny = ys.length - 1;
  const inRect = new Uint8Array(nx * ny);
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const cx = (xs[i]! + xs[i + 1]!) / 2;
      const cy = (ys[j]! + ys[j + 1]!) / 2;
      if (rects.some((r) => cx > r.x0 && cx < r.x1 && cy > r.y0 && cy < r.y1)) inRect[i * ny + j] = 1;
    }
  // the outside: from the border cells (the padding round the rectangles), through cells in no rectangle
  const outside = new Uint8Array(nx * ny);
  const stack: number[] = [];
  const seed = (i: number, j: number): void => {
    const k = i * ny + j;
    if (i < 0 || j < 0 || i >= nx || j >= ny || outside[k] === 1 || inRect[k] === 1) return;
    outside[k] = 1;
    stack.push(k);
  };
  for (let i = 0; i < nx; i++) {
    seed(i, 0);
    seed(i, ny - 1);
  }
  for (let j = 0; j < ny; j++) {
    seed(0, j);
    seed(nx - 1, j);
  }
  while (stack.length > 0) {
    const k = stack.pop()!;
    const i = Math.floor(k / ny);
    const j = k % ny;
    seed(i - 1, j);
    seed(i + 1, j);
    seed(i, j - 1);
    seed(i, j + 1);
  }
  const filled = new Uint8Array(nx * ny);
  for (let k = 0; k < nx * ny; k++) filled[k] = outside[k] === 1 ? 0 : 1;
  return { xs, ys, filled, real: inRect };
}

/** ⭐ The cell index of `v` among the sorted cuts `cs` (the cell `[cs[i], cs[i+1]]` holding it; on a cut, the cell after it); −1 outside. */
function cellOf(cs: readonly number[], v: number): number {
  if (cs.length < 2 || v < cs[0]! || v > cs[cs.length - 1]!) return -1;
  let lo = 0;
  let hi = cs.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (cs[m]! <= v) lo = m;
    else hi = m;
  }
  return lo;
}

/** ⭐ Is (`x`, `y`) in the region (its holes closed)? On a cell's edge, either neighbour filled counts. */
export function regionContains(r: FilledRegion, x: number, y: number): boolean {
  const i = cellOf(r.xs, x);
  const j = cellOf(r.ys, y);
  if (i < 0 || j < 0) return false;
  const ny = r.ys.length - 1;
  const at = (a: number, b: number): boolean => a >= 0 && b >= 0 && a < r.xs.length - 1 && b < ny && r.filled[a * ny + b] === 1;
  if (at(i, j)) return true;
  // on a cut: the cell before it too
  const onX = Math.abs(x - r.xs[i]!) < 1e-12;
  const onY = Math.abs(y - r.ys[j]!) < 1e-12;
  return (onX && at(i - 1, j)) || (onY && at(i, j - 1)) || (onX && onY && at(i - 1, j - 1));
}

/** ⭐ Is a FACE at (`x`, `y`) — a cell in one of the region's rectangles (not a hole)? On a cell's edge, either neighbour counts. */
export function regionReal(r: FilledRegion, x: number, y: number): boolean {
  const i = cellOf(r.xs, x);
  const j = cellOf(r.ys, y);
  if (i < 0 || j < 0) return false;
  const ny = r.ys.length - 1;
  const at = (a: number, b: number): boolean => a >= 0 && b >= 0 && a < r.xs.length - 1 && b < ny && r.real[a * ny + b] === 1;
  if (at(i, j)) return true;
  const onX = Math.abs(x - r.xs[i]!) < 1e-12;
  const onY = Math.abs(y - r.ys[j]!) < 1e-12;
  return (onX && at(i - 1, j)) || (onY && at(i, j - 1)) || (onX && onY && at(i - 1, j - 1));
}

/**
 * ⭐⭐⭐ (2026-11-05) THE VOID CLOSED ON A TRAVEL: the regions `rs` (one plane's) hold (`x`, `y`) between them along `x` — a filled cell before it and one
 * after it on the line `y` — or along `y` (the line `x`). On a facet `x` is its `t` (the green's travel on a side) and `y` its `b` (the red's).
 */
export function closedAlong(rs: readonly FilledRegion[], x: number, y: number): { readonly x: boolean; readonly y: boolean } {
  let xLo = false;
  let xHi = false;
  let yLo = false;
  let yHi = false;
  for (const r of rs) {
    const ny = r.ys.length - 1;
    const i = cellOf(r.xs, x);
    const j = cellOf(r.ys, y);
    if (j >= 0)
      for (let a = 0; a < r.xs.length - 1; a++) {
        if (r.filled[a * ny + j] !== 1) continue;
        if (r.xs[a]! < x) xLo = true;
        if (r.xs[a + 1]! > x) xHi = true;
      }
    if (i >= 0)
      for (let b = 0; b < ny; b++) {
        if (r.filled[i * ny + b] !== 1) continue;
        if (r.ys[b]! < y) yLo = true;
        if (r.ys[b + 1]! > y) yHi = true;
      }
  }
  return { x: xLo && xHi, y: yLo && yHi };
}

/** ⭐ The distance from (`x`, `y`) to the region (its holes closed): 0 inside, else to its nearest filled cell. */
export function regionDistance(r: FilledRegion, x: number, y: number): number {
  if (regionContains(r, x, y)) return 0;
  const ny = r.ys.length - 1;
  let best = Infinity;
  for (let i = 0; i < r.xs.length - 1; i++)
    for (let j = 0; j < ny; j++) {
      if (r.filled[i * ny + j] !== 1) continue;
      const dx = Math.max(r.xs[i]! - x, 0, x - r.xs[i + 1]!);
      const dy = Math.max(r.ys[j]! - y, 0, y - r.ys[j + 1]!);
      best = Math.min(best, Math.hypot(dx, dy));
    }
  return best;
}

/** ⭐ A closed region's area (m²): its filled cells'. */
export function regionArea(r: FilledRegion): number {
  const ny = r.ys.length - 1;
  let a = 0;
  for (let i = 0; i < r.xs.length - 1; i++) for (let j = 0; j < ny; j++) if (r.filled[i * ny + j] === 1) a += (r.xs[i + 1]! - r.xs[i]!) * (r.ys[j + 1]! - r.ys[j]!);
  return a;
}

/** ⭐ The rectangles joined to each other (touching or overlapping, grown already) — the connected groups, as index lists. */
function components(rects: readonly Rect2[]): number[][] {
  const touch = (a: Rect2, b: Rect2) => a.x0 <= b.x1 + 1e-9 && b.x0 <= a.x1 + 1e-9 && a.y0 <= b.y1 + 1e-9 && b.y0 <= a.y1 + 1e-9;
  const seen = new Set<number>();
  const out: number[][] = [];
  for (let s = 0; s < rects.length; s++) {
    if (seen.has(s)) continue;
    const comp = [s];
    seen.add(s);
    for (let q = 0; q < comp.length; q++)
      for (let j = 0; j < rects.length; j++)
        if (!seen.has(j) && touch(rects[comp[q]!]!, rects[j]!)) {
          seen.add(j);
          comp.push(j);
        }
    out.push(comp);
  }
  return out;
}

/**
 * ⭐⭐ ACROSS A FACE: `s` (−1 … 1, the slice's own) to an offset from the face's middle (−`half` … `half`): linear over the face less its last `ke` on each
 * side while |s| ≤ 1 − `band`, then over that last `ke` — the slow stretch through the edge. `ke` at most a third of the face (a thin face keeps a
 * middle); no band, no stretch.
 */
export function edgeMap(s: number, band: number, half: number, keM: number): number {
  const x = Math.min(1, Math.max(-1, s));
  const ke = band > 0 ? Math.max(0, Math.min(keM, (2 * half) / 3)) : 0;
  const a = Math.abs(x);
  const sg = x < 0 ? -1 : 1;
  if (a <= 1 - band) return sg * (band < 1 ? (a / (1 - band)) * (half - ke) : 0);
  return sg * (half - ke + ((a - (1 - band)) / band) * ke);
}

/** ⭐ …and back: the offset `off` from the face's middle to `s`. */
export function edgeUnmap(off: number, band: number, half: number, keM: number): number {
  const ke = band > 0 ? Math.max(0, Math.min(keM, (2 * half) / 3)) : 0;
  const a = Math.min(half, Math.abs(off));
  const sg = off < 0 ? -1 : 1;
  if (a <= half - ke) return sg * (half - ke > 1e-12 ? (a / (half - ke)) * (1 - band) : 0);
  return sg * Math.min(1, 1 - band + (ke > 1e-12 ? ((a - (half - ke)) / ke) * band : band));
}

/**
 * ⭐ Over a top / under a bottom: `f` (0 at the edge, 1 at the centre) to the share of the way in — its first `band` over the first `ke` of the shortest
 * way in (`dMin`), the rest linear; the same share for every side (the quarters meet on their diagonals).
 */
export function topIn(f: number, band: number, keM: number, dMin: number): number {
  const x = Math.min(1, Math.max(0, f));
  const k = band > 0 && dMin > 1e-9 ? Math.min(keM / dMin, 1 / 3) : 0;
  if (k === 0) return x;
  if (x <= band) return (x / band) * k;
  return k + ((x - band) / (1 - band)) * (1 - k);
}

/** ⭐ …and back. */
export function topOut(g: number, band: number, keM: number, dMin: number): number {
  const x = Math.min(1, Math.max(0, g));
  const k = band > 0 && dMin > 1e-9 ? Math.min(keM / dMin, 1 / 3) : 0;
  if (k === 0) return x;
  if (x <= k) return (x / k) * band;
  return band + ((x - k) / (1 - k)) * (1 - band);
}

/**
 * ⭐⭐ OUT OF STEP, NO JUMP (after the slide — the map's angles put where the slide left the gizmo): the map's angle `m` follows the orbit's `target` by
 * the orbit's own step `d`, faster (× 1 + `catchUp`) while the orbit runs away from it, slower (× 1 − `catchUp`) while it comes back — never against the
 * finger, never a jump; caught up, exactly the orbit's. `wrap`: a yaw (the gap read round the circle).
 */
export function syncAngle(m: number, target: number, d: number, catchUp: number, wrap: boolean): number {
  const gapOf = (x: number): number => (wrap ? wrapPi(target - x) : target - x);
  const gap = gapOf(m);
  if (Math.abs(gap) < 1e-9) return target;
  if (d === 0) return m;
  const f = Math.sign(d) === Math.sign(gap) ? 1 + catchUp : 1 - catchUp;
  const m2 = m + d * f;
  // the gap closed or crossed: on the orbit
  return Math.sign(gapOf(m2)) !== Math.sign(gap) ? target : m2;
}
/** ⭐ A normal within 1e-9 of a world axis: that axis EXACTLY (a box's face read on a turned pose carries 1e-16 of noise — the box's numbers kept exact). */
export function snapAxis(n: Vec3): Vec3 {
  const l = Math.hypot(n[0], n[1], n[2]);
  if (!(l > 1e-12)) return [0, 1, 0];
  const u: Vec3 = [n[0] / l, n[1] / l, n[2] / l];
  for (const k of [0, 1, 2] as const)
    if (Math.abs(u[k]) > 1 - 1e-9) {
      const r: [number, number, number] = [0, 0, 0];
      r[k] = u[k] > 0 ? 1 : -1;
      return r;
    }
  return u;
}

/**
 * ⭐⭐ A FACET'S FRAME: `t` horizontal, the way the yaw turns across it (`n × ŷ`, normalised — on a box Step 4c-bis's side axis), `b = t × n` up its slope
 * (on a vertical facet the world's up). Straight up / down (a cap): `t` = +x.
 */
export function facetFrame(n: Vec3): { readonly t: Vec3; readonly b: Vec3 } {
  const h = Math.hypot(n[0], n[2]);
  const t: Vec3 = h > 1e-6 ? [-n[2] / h + 0, 0, n[0] / h + 0] : [1, 0, 0];
  return { t, b: cross(t, n) };
}

/** ⭐ A face's area (m²): its triangles'. */
function faceArea(f: MapFace): number {
  let a = 0;
  for (const [p, q, r] of f.tris) {
    const c = cross([q[0] - p[0], q[1] - p[1], q[2] - p[2]], [r[0] - p[0], r[1] - p[1], r[2] - p[2]]);
    a += Math.hypot(c[0], c[1], c[2]) / 2;
  }
  return a;
}

/**
 * ⭐⭐⭐ A FACET'S STACK (Step 4c-bis's per axis, now per facet): every face within the merge angle of `n` (`cosMax`), by plane (`MAP_COPLANAR_M`, a face's
 * level at its centre), each plane's faces by contact (their rectangles on (`t`, `b`) grown `MAP_GROW_M`); each group's region closed (`filledRegion`). A
 * group's depth: its plane's level along `n`. Frontmost first.
 */
export function stackOf(faces: readonly MapFace[], n: Vec3, t: Vec3, b: Vec3, cosMax: number): MapGroup[] {
  const mine = faces.filter((f) => dot(f.normal, n) >= cosMax && f.tris.length > 0);
  const planes: { level: number; faces: MapFace[] }[] = [];
  for (const f of mine) {
    const level = dot(f.centre, n);
    const p = planes.find((q) => Math.abs(q.level - level) <= MAP_COPLANAR_M);
    if (p === undefined) planes.push({ level, faces: [f] });
    else p.faces.push(f);
  }
  const groups: MapGroup[] = [];
  for (const p of planes) {
    const rects: Rect2[] = p.faces.map((f) => {
      const xs = f.tris.flatMap((tr) => tr.map((v) => dot(v, t)));
      const ys = f.tris.flatMap((tr) => tr.map((v) => dot(v, b)));
      return { x0: Math.min(...xs) - MAP_GROW_M, x1: Math.max(...xs) + MAP_GROW_M, y0: Math.min(...ys) - MAP_GROW_M, y1: Math.max(...ys) + MAP_GROW_M };
    });
    for (const comp of components(rects)) groups.push({ depth: p.level, region: filledRegion(comp.map((k) => rects[k]!)) });
  }
  groups.sort((a, c) => c.depth - a.depth);
  return groups;
}

/** ⭐ The MAIN group of a stack: the largest closed region (ties: the frontmost) — its depth is the facet's plane; its area the real face behind it. */
function mainOf(groups: readonly MapGroup[]): { readonly depth: number; readonly area: number } | null {
  let best: { depth: number; area: number } | null = null;
  for (const g of groups) {
    const a = regionArea(g.region);
    if (best === null || a > best.area + 1e-12) best = { depth: g.depth, area: a };
  }
  return best;
}

interface Plane {
  readonly n: Vec3;
  readonly e: number;
}

/** ⭐ The parts' box as six half-spaces (`n·p ≤ e`) — every facet's polygon is bounded by it. */
function boxPlanes(box: ShellBox): Plane[] {
  return [
    { n: [1, 0, 0], e: box.hi[0] },
    { n: [-1, 0, 0], e: -box.lo[0] },
    { n: [0, 1, 0], e: box.hi[1] },
    { n: [0, -1, 0], e: -box.lo[1] },
    { n: [0, 0, 1], e: box.hi[2] },
    { n: [0, 0, -1], e: -box.lo[2] },
  ];
}

/**
 * ⭐⭐ A FACET'S POLYGON ON THE CONTOUR: a square of side `2·size` in its plane, clipped by every other half-space (Sutherland–Hodgman, 1974 — a convex
 * polygon by a plane; a point within 1e-9 of a plane kept).
 */
export function facetPolygon(n: Vec3, e: number, planes: readonly Plane[], size: number): Vec3[] {
  const { t, b } = facetFrame(n);
  const c: Vec3 = [n[0] * e, n[1] * e, n[2] * e];
  let poly: Vec3[] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([x, y]) => [c[0] + (t[0] * x! + b[0] * y!) * size, c[1] + (t[1] * x! + b[1] * y!) * size, c[2] + (t[2] * x! + b[2] * y!) * size] as Vec3);
  for (const pl of planes) {
    if (poly.length === 0) break;
    const out: Vec3[] = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]!;
      const q = poly[(i + 1) % poly.length]!;
      const dp = dot(pl.n, p) - pl.e;
      const dq = dot(pl.n, q) - pl.e;
      const ip = dp <= 1e-9;
      if (ip) out.push(p);
      if (ip !== dq <= 1e-9) {
        const s = dp / (dp - dq);
        out.push([p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s, p[2] + (q[2] - p[2]) * s]);
      }
    }
    poly = out;
  }
  return poly;
}

/** ⭐ A planar polygon's area along its normal `n` (m²). */
export function polygonArea(poly: readonly Vec3[], n: Vec3): number {
  let s: Vec3 = [0, 0, 0];
  for (let i = 0; i < poly.length; i++) {
    const c = cross(poly[i]!, poly[(i + 1) % poly.length]!);
    s = [s[0] + c[0], s[1] + c[1], s[2] + c[2]];
  }
  return Math.abs(dot(s, n)) / 2;
}

interface Candidate {
  readonly n: Vec3;
  readonly e: number;
  readonly groups: readonly MapGroup[];
  readonly area: number;
  readonly real: boolean;
}

/**
 * ⭐⭐⭐ THE FACES CONTOUR AND ITS MAP (scope §5 Step 5) — see the module's header: the faces clustered into candidate facets (largest face first, within
 * `mergeDeg`), each at its main group's plane; the half-spaces' intersection in the box; the candidates taken largest real face first, each kept only
 * while every kept one's real face covers `minShare` of its polygon (a plane cutting across the contour covers little of its own); the caps (the
 * facet nearest straight up / down beyond 45°, else a virtual one at the box), the columns (the rest by heading, their yaw slices and pitch bands). No
 * side facet at all: the box's four sides, virtual. `core`: the polygons' bounding box.
 */
export function buildFaceMap(faces: readonly MapFace[], box: ShellBox, fo: FacetOpts = DEFAULT_FACET_OPTS): FaceMap {
  const cosM = Math.cos((Math.max(0, fo.mergeDeg) * Math.PI) / 180);
  const bp = boxPlanes(box);
  const size = 2 * Math.hypot(box.hi[0] - box.lo[0], box.hi[1] - box.lo[1], box.hi[2] - box.lo[2]) + 1;
  const sized = faces.filter((f) => f.tris.length > 0).map((f) => ({ f, a: faceArea(f), n: snapAxis(f.normal) }));
  sized.sort((x, y) => y.a - x.a);
  const seeds: Vec3[] = [];
  for (const w of sized) if (!seeds.some((s) => dot(s, w.n) >= cosM)) seeds.push(w.n);
  const candOf = (n: Vec3, real: boolean, fallbackE: number): Candidate => {
    const { t, b } = facetFrame(n);
    const groups = stackOf(faces, n, t, b, cosM);
    const m = mainOf(groups);
    return { n, e: m === null ? fallbackE : m.depth, groups, area: m === null ? 0 : m.area, real };
  };
  const cands = seeds.map((n) => candOf(n, true, 0));
  const polyOf = (c: Candidate, others: readonly Candidate[]): Vec3[] =>
    facetPolygon(c.n, c.e, [...others.filter((o) => o !== c).map((o) => ({ n: o.n, e: o.e })), ...bp], size);
  const shareOf = (c: Candidate, poly: readonly Vec3[]): number => {
    const A = polygonArea(poly, c.n);
    return A > 1e-12 ? Math.min(1, c.area / A) : 0;
  };
  // ⭐ D5, GREEDY: the candidates by their real face, largest first; one is ACCEPTED when its real face covers `minShare` of its polygon among those
  // accepted and every one accepted still does (⛔ all at once, then the worst dropped: on `Scene_1` a frustum's slanted plane cut the painting's front away
  // whole — its share 0, the front dropped first, the contour three slanted planes)
  const kept: Candidate[] = [];
  for (const c of [...cands].sort((x, y) => y.area - x.area)) {
    const trial = [...kept, c];
    if (trial.every((k) => shareOf(k, polyOf(k, trial)) >= Math.max(fo.minShare, 1e-9))) kept.push(c);
  }
  // the caps: the facet nearest straight up / down beyond 45° — else a virtual one at the box (its stack still read)
  const elev = (n: Vec3): number => Math.asin(Math.max(-1, Math.min(1, n[1])));
  const capOf = (up: boolean): Candidate => {
    let best: Candidate | null = null;
    for (const c of kept) if ((up ? elev(c.n) : -elev(c.n)) > Q + 1e-12 && (best === null || (up ? c.n[1] > best.n[1] : c.n[1] < best.n[1]))) best = c;
    if (best !== null) return best;
    // ⭐ virtual: AT THE BOX (⛔ at a dropped candidate's own plane — the plane D5 refused would cut the contour again)
    return { ...candOf([0, up ? 1 : -1, 0], false, 0), e: up ? box.hi[1] : -box.lo[1] };
  };
  const capT = capOf(true);
  const capB = capOf(false);
  let sides = kept.filter((c) => c !== capT && c !== capB);
  if (sides.length === 0)
    sides = ([[1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1]] as Vec3[]).map((n) => {
      const c = candOf(n, false, 0);
      return { ...c, e: n[0] > 0 ? box.hi[0] : n[0] < 0 ? -box.lo[0] : n[2] > 0 ? box.hi[2] : -box.lo[2] };
    });
  const all: Candidate[] = [...sides, capT, capB];
  const planes = all;
  const facets: Facet[] = all.map((c, i) => {
    const { t, b } = facetFrame(c.n);
    const poly = facetPolygon(c.n, c.e, [...planes.filter((o) => o !== c).map((o) => ({ n: o.n, e: o.e })), ...bp], size);
    const ts = poly.map((v) => dot(v, t));
    const bs = poly.map((v) => dot(v, b));
    const ext = (xs: number[], lo: boolean): number => (xs.length === 0 ? 0 : lo ? Math.min(...xs) : Math.max(...xs));
    return {
      n: c.n,
      t,
      b,
      e: c.e,
      kind: i < sides.length ? "SIDE" : c === capT ? "TOP" : "BOTTOM",
      groups: c.groups,
      poly,
      tLo: ext(ts, true),
      tHi: ext(ts, false),
      bLo: ext(bs, true),
      bHi: ext(bs, false),
      share: shareOf(c, poly),
      real: c.real,
    };
  });
  // ⭐ the columns: the side facets by heading (the largest real face first, within `mergeDeg`); each a slice of the yaw from halfway to each neighbour's
  const heading = (n: Vec3): number => {
    const h = Math.atan2(n[2], n[0]);
    return h < 0 ? h + 2 * Math.PI : h;
  };
  const order = sides.map((_, i) => i).sort((x, y) => sides[y]!.area - sides[x]!.area);
  const cols: { h: number; members: number[] }[] = [];
  const mergeRad = (Math.max(0, fo.mergeDeg) * Math.PI) / 180;
  for (const i of order) {
    const h = heading(sides[i]!.n);
    const c = cols.find((k) => Math.abs(wrapPi(h - k.h)) <= mergeRad + 1e-12);
    if (c === undefined) cols.push({ h, members: [i] });
    else c.members.push(i);
  }
  cols.sort((x, y) => x.h - y.h);
  const columns: Column[] = cols.map((c, k) => {
    const prev = cols.length === 1 ? c.h - 2 * Math.PI : k === 0 ? cols[cols.length - 1]!.h - 2 * Math.PI : cols[k - 1]!.h;
    const next = cols.length === 1 ? c.h + 2 * Math.PI : k === cols.length - 1 ? cols[0]!.h + 2 * Math.PI : cols[k + 1]!.h;
    const lo = (prev + c.h) / 2;
    const hi = (c.h + next) / 2;
    const fs = [...c.members].sort((x, y) => elev(sides[x]!.n) - elev(sides[y]!.n));
    const els = fs.map((i) => elev(sides[i]!.n));
    const bounds = [(-H + els[0]!) / 2, ...els.slice(1).map((e, j) => (els[j]! + e) / 2), (els[els.length - 1]! + H) / 2];
    return { mid: (lo + hi) / 2, hw: (hi - lo) / 2, facets: fs, bounds };
  });
  const vs = facets.flatMap((f) => f.poly);
  const core: ShellBox =
    vs.length === 0
      ? box
      : {
          lo: [Math.min(...vs.map((v) => v[0])), Math.min(...vs.map((v) => v[1])), Math.min(...vs.map((v) => v[2]))],
          hi: [Math.max(...vs.map((v) => v[0])), Math.max(...vs.map((v) => v[1])), Math.max(...vs.map((v) => v[2]))],
        };
  return { box, core, facets, columns, top: sides.length, bottom: sides.length + 1 };
}

/**
 * ⭐⭐ THE GIZMO'S PLANE on a facet's stack at (`x`, `y`) (its `t`, `b` coordinates): the FRONTMOST group whose closed region holds the point (`inside`);
 * none, the NEAREST group (ties: the frontmost) — the gizmo beside the real face, in its plane. `null`: no face in that stack.
 * ⭐⭐⭐ (2026-11-05, the owner: *"in attachment 2 the void is closed on the green section travel so the green section and the gizmo shall go through"*) —
 * THE VOID ON THE FACET'S PLANE (`e`: the main group's level — the facet's plane): no protrusion there and no face of that plane under the point, but the
 * plane's faces on both sides of it along `t` or along `b` (`closedAlong` — a hole, a slot, a notch closed on the green's or the red's travel): the gizmo
 * goes STRAIGHT THROUGH on the facet's plane (`bridged`, never cast — ⛔ D3 put it at the void's bottom: the green dipped and climbed back). A void open
 * on both travels keeps its depth until the frame turn (Steps 6–7: the orbit tilts at the real edge).
 */
export function stackDepthAt(
  s: { readonly groups: readonly MapGroup[]; readonly e?: number },
  x: number,
  y: number,
): { readonly depth: number; readonly group: number; readonly inside: boolean; readonly bridged?: true } | null {
  let front = -1;
  for (let g = 0; g < s.groups.length; g++)
    if (regionContains(s.groups[g]!.region, x, y)) {
      front = g;
      break;
    }
  const e = s.e;
  if (e !== undefined && (front < 0 || s.groups[front]!.depth <= e + MAP_COPLANAR_M)) {
    const mine = s.groups.map((gr, g) => ({ gr, g })).filter((q) => Math.abs(q.gr.depth - e) <= MAP_COPLANAR_M);
    if (mine.length > 0 && !mine.some((q) => regionReal(q.gr.region, x, y))) {
      const c = closedAlong(mine.map((q) => q.gr.region), x, y);
      if (c.x || c.y) return { depth: mine[0]!.gr.depth, group: mine[0]!.g, inside: false, bridged: true };
    }
  }
  if (front >= 0) return { depth: s.groups[front]!.depth, group: front, inside: true };
  let best: { depth: number; group: number; d: number } | null = null;
  s.groups.forEach((gr, g) => {
    const d = regionDistance(gr.region, x, y);
    if (best === null || d < best.d - 1e-9) best = { depth: gr.depth, group: g, d };
  });
  const b = best as { depth: number; group: number; d: number } | null;
  return b === null ? null : { depth: b.depth, group: b.group, inside: false };
}

/** ⭐ The map's knobs: the edge's slow stretch on each face (`edgeMm`) and the angle (deg) before a slice's end it is crossed in. */
export interface MapOpts {
  readonly edgeMm: number;
  readonly edgeDeg: number;
}

/** ⭐ The share of a span (its half-width `half`, rad) an edge band of `E` rad takes: at most half. */
function bandFor(E: number, half: number): number {
  return half > 1e-12 ? Math.min(0.5, Math.max(0, E / half)) : 0;
}

/** ⭐ The facet's point at `L` along `t` and `s` along `b`, in its plane. */
function facetAt(f: Facet, L: number, s: number): Vec3 {
  return [f.n[0] * f.e + f.t[0] * L + f.b[0] * s, f.n[1] * f.e + f.t[1] * L + f.b[1] * s, f.n[2] * f.e + f.t[2] * L + f.b[2] * s];
}

/** ⭐ Where the angles put the gizmo: the band, the column (`side`), the facet (`stack`), its normal, the place on its plane, and across it (the calm). */
export interface MapTarget {
  readonly band: "SIDE" | "TOP" | "BOTTOM";
  /** the column whose slice the yaw is in */
  readonly side: number;
  /** the facet the place is on (`FaceMap.facets`) */
  readonly stack: number;
  /** the facet's outward normal */
  readonly normal: Vec3;
  /** the place on the facet's plane */
  readonly surface: Vec3;
  /** across the column's facet: its place `L` in the facet's span `lo` … `hi` (along its `t`) */
  readonly across: { readonly L: number; readonly lo: number; readonly hi: number };
}

/** ⭐ The yaw's column (its index) and its place across the column's slice (−1 … 1). */
export function columnAt(map: FaceMap, yaw: number): { readonly k: number; readonly a: number } {
  let best = { k: 0, a: 0, r: Infinity };
  map.columns.forEach((c, k) => {
    const d = wrapPi(yaw - c.mid);
    const r = Math.abs(d) / c.hw;
    if (r < best.r - 1e-12) best = { k, a: Math.max(-1, Math.min(1, d / c.hw)), r };
  });
  return { k: best.k, a: best.a };
}

/**
 * ⭐⭐ THE CAP'S EDGE ACROSS A COLUMN'S FACET: the cap's EDGE toward the facet (its vertices outermost along the facet's level normal — on the facet's
 * plane where they meet) and that edge's extent along the facet's `t` — the rim of the cap's quarter runs over it, not over the facet's own width (⛔ a
 * hexagonal end is ±R wide at mid-height, its bottom edge ±R/2: the quarter ran outside the cap, over its neighbour's — probed by the round trip; ⛔ the
 * whole cap's extent: on a vertical hexagon twice the facet's edge, the quarters' corners parted — probed, 176 mm). `toCap` / `fromCap` map a place
 * across the facet onto it and back — on a box the same extent: unchanged.
 */
function capSpan(map: FaceMap, f: Facet, cap: Facet): { readonly toCap: (L: number) => number; readonly fromCap: (L: number) => number } {
  const nh = Math.hypot(f.n[0], f.n[2]);
  const out = (v: Vec3): number => (nh > 1e-9 ? (v[0] * f.n[0] + v[2] * f.n[2]) / nh : 0);
  const m = cap.poly.length === 0 ? 0 : Math.max(...cap.poly.map(out));
  const ts = cap.poly.filter((v) => out(v) >= m - 1e-6).map((v) => dot(v, f.t));
  const lo = ts.length === 0 ? f.tLo : Math.min(...ts);
  const hi = ts.length === 0 ? f.tHi : Math.max(...ts);
  const same = Math.abs(lo - f.tLo) < 1e-9 && Math.abs(hi - f.tHi) < 1e-9;
  const w = f.tHi - f.tLo;
  if (same || !(w > 1e-12) || !(hi - lo > 1e-12)) return { toCap: (L) => L, fromCap: (L) => L };
  void map;
  return { toCap: (L) => lo + ((L - f.tLo) / w) * (hi - lo), fromCap: (L) => f.tLo + ((L - lo) / (hi - lo)) * w };
}

/** ⭐ The cap's centre the quarters converge to: the contour's middle in x / z, on the cap's plane. */
function capCentre(map: FaceMap, cap: Facet): Vec3 {
  const cx = (map.core.lo[0] + map.core.hi[0]) / 2;
  const cz = (map.core.lo[2] + map.core.hi[2]) / 2;
  const cy = Math.abs(cap.n[1]) > 1e-9 ? (cap.e - cap.n[0] * cx - cap.n[2] * cz) / cap.n[1] : (map.core.lo[1] + map.core.hi[1]) / 2;
  return [cx, cy, cz];
}

/**
 * ⭐⭐⭐ THE PLACE ON THE FACES CONTOUR for the orbit's `yaw` and `pitch` (the orbit's convention: x = cos, z = sin; pitch up +) — see the module's header. In
 * a column's band: across the facet by the yaw, up it by the pitch (`edgeMap` each — the slow stretch through an edge). Beyond the column's top / bottom
 * band: the column's top (bottom) facet's edge at the yaw, drawn in toward the cap's centre by the pitch (`topIn`) — at ±90° the centre, whatever the yaw.
 * On a box exactly Step 4c-bis's core box map.
 */
export function mapTarget(map: FaceMap, yaw: number, pitch: number, opts: MapOpts): MapTarget {
  const E = (Math.max(0, opts.edgeDeg) * Math.PI) / 180;
  const ke = Math.max(0, opts.edgeMm) / 1000;
  const { k, a } = columnAt(map, yaw);
  const col = map.columns[k]!;
  const bandY = bandFor(E, col.hw);
  const B = col.bounds;
  const lo = B[0]!;
  const hi = B[B.length - 1]!;
  const p = Math.max(-H, Math.min(H, pitch));
  const across = (f: Facet): number => (f.tLo + f.tHi) / 2 + edgeMap(a, bandY, (f.tHi - f.tLo) / 2, ke);
  if (p <= hi + 1e-12 && p >= lo - 1e-12) {
    let i = 0;
    while (i < col.facets.length - 1 && p > B[i + 1]!) i++;
    const fi = col.facets[i]!;
    const f = map.facets[fi]!;
    const L = across(f);
    const pm = (B[i]! + B[i + 1]!) / 2;
    const ph = (B[i + 1]! - B[i]!) / 2;
    const s = (f.bLo + f.bHi) / 2 + edgeMap(ph > 1e-12 ? (p - pm) / ph : 0, bandFor(E, ph), (f.bHi - f.bLo) / 2, ke);
    return { band: "SIDE", side: k, stack: fi, normal: f.n, surface: facetAt(f, L, s), across: { L, lo: f.tLo, hi: f.tHi } };
  }
  const up = p > hi;
  const f = map.facets[up ? col.facets[col.facets.length - 1]! : col.facets[0]!]!;
  const L = across(f);
  const capI = up ? map.top : map.bottom;
  const cap = map.facets[capI]!;
  const rim = facetAt(f, capSpan(map, f, cap).toCap(L), up ? f.bHi : f.bLo);
  const C = capCentre(map, cap);
  const span = up ? H - hi : lo + H;
  const dMin = Math.min(map.core.hi[0] - map.core.lo[0], map.core.hi[2] - map.core.lo[2]) / 2;
  const g = topIn(span > 1e-12 ? (up ? p - hi : lo - p) / span : 1, bandFor(E, span), ke, dMin);
  return {
    band: up ? "TOP" : "BOTTOM",
    side: k,
    stack: capI,
    normal: cap.n,
    surface: [C[0] + (rim[0] - C[0]) * (1 - g), C[1] + (rim[1] - C[1]) * (1 - g), C[2] + (rim[2] - C[2]) * (1 - g)],
    across: { L, lo: f.tLo, hi: f.tHi },
  };
}

/**
 * ⭐⭐ …AND BACK: the angles whose place is nearest `p` on facet `fi` (a point on its plane) — after the slide, the map is put where the slide left the gizmo
 * (no jump). A column's facet: across and up it (`edgeUnmap`); a cap: the quarter it is in (the column whose edge it is most toward), its share of the way
 * in, its place across.
 */
export function mapAngles(map: FaceMap, p: Vec3, fi: number, opts: MapOpts): { readonly yaw: number; readonly pitch: number } {
  const E = (Math.max(0, opts.edgeDeg) * Math.PI) / 180;
  const ke = Math.max(0, opts.edgeMm) / 1000;
  const yawOf = (col: Column, f: Facet, L: number): number => col.mid + edgeUnmap(L - (f.tLo + f.tHi) / 2, bandFor(E, col.hw), (f.tHi - f.tLo) / 2, ke) * col.hw;
  if (fi === map.top || fi === map.bottom) {
    const up = fi === map.top;
    const cap = map.facets[fi]!;
    const C = capCentre(map, cap);
    const qx = p[0] - C[0];
    const qz = p[2] - C[2];
    let best = { k: 0, r: -Infinity };
    map.columns.forEach((col, k) => {
      const s = map.facets[up ? col.facets[col.facets.length - 1]! : col.facets[0]!]!;
      const nh = Math.hypot(s.n[0], s.n[2]);
      if (!(nh > 1e-9)) return;
      const R = facetAt(s, (s.tLo + s.tHi) / 2, up ? s.bHi : s.bLo);
      const D = (s.n[0] * (R[0] - C[0]) + s.n[2] * (R[2] - C[2])) / nh;
      const r = D > 1e-12 ? (qx * s.n[0] + qz * s.n[2]) / nh / D : -Infinity;
      if (r > best.r) best = { k, r };
    });
    const col = map.columns[best.k]!;
    const s = map.facets[up ? col.facets[col.facets.length - 1]! : col.facets[0]!]!;
    const r = Math.min(1, Math.max(0, best.r));
    const ct = s.t[0] * C[0] + s.t[2] * C[2];
    const L = capSpan(map, s, cap).fromCap(r > 1e-9 ? ct + (qx * s.t[0] + qz * s.t[2]) / r : ct);
    const B = col.bounds;
    const edge = up ? B[B.length - 1]! : B[0]!;
    const span = up ? H - edge : edge + H;
    const dMin = Math.min(map.core.hi[0] - map.core.lo[0], map.core.hi[2] - map.core.lo[2]) / 2;
    const g = topOut(1 - r, bandFor(E, span), ke, dMin);
    return { yaw: yawOf(col, s, L), pitch: up ? edge + g * span : edge - g * span };
  }
  const f = map.facets[fi]!;
  for (const col of map.columns) {
    const i = col.facets.indexOf(fi);
    if (i < 0) continue;
    const pm = (col.bounds[i]! + col.bounds[i + 1]!) / 2;
    const ph = (col.bounds[i + 1]! - col.bounds[i]!) / 2;
    const s = dot(f.b, p);
    return { yaw: yawOf(col, f, dot(f.t, p)), pitch: pm + edgeUnmap(s - (f.bLo + f.bHi) / 2, bandFor(E, ph), (f.bHi - f.bLo) / 2, ke) * ph };
  }
  return { yaw: 0, pitch: 0 };
}

/**
 * ⭐⭐⭐ THROUGH AN EDGE, NO JUMP (the edge bands — `edgeDeg` before a slice's / band's end): the gizmo of the facet being left and the gizmo where the next
 * one starts can differ — the real outline is not the contour's (a column standing out 45 mm, a top 41 mm above the core's: probed on `Scene_1`). In the
 * band the gizmo is BLENDED toward the next facet's first point, `w` rising (smoothstep) to ½ at the end — where both sides meet: the gizmo crosses the edge
 * continuously. `h`: across the column's slice end (the yaw `yawThere` just inside the next column); `v`: across a pitch bound of the column — a facet to the
 * next up / down it, or a cap (`pitchThere` just past it). `null`: not in that band (or no band).
 */
export function edgeBlend(
  map: FaceMap,
  yaw: number,
  pitch: number,
  opts: MapOpts,
): { readonly h: { readonly w: number; readonly yawThere: number } | null; readonly v: { readonly w: number; readonly pitchThere: number } | null } {
  const E = (Math.max(0, opts.edgeDeg) * Math.PI) / 180;
  if (!(E > 0)) return { h: null, v: null };
  const ease = (u: number): number => {
    const x = Math.min(1, Math.max(0, u));
    return 0.5 * x * x * (3 - 2 * x);
  };
  const EPS = 1e-7;
  const p = Math.max(-H, Math.min(H, pitch));
  const { k, a } = columnAt(map, yaw);
  const col = map.columns[k]!;
  const B = col.bounds;
  const lo = B[0]!;
  const hi = B[B.length - 1]!;
  const spanT = H - hi;
  const spanB = lo + H;
  let h: { w: number; yawThere: number } | null = null;
  // across: in the column's bands, and over a cap while still in its first band (the slice's end is blended in there) — ⭐ (Step 5) at EVERY pitch where
  // the next column's caps start at another pitch (a hexagonal prism's end column tops out at 45°, its slanted one at 60°: their quarters' places differ
  // at the slice's end, so the blend carries them through; on a box the bounds are equal — Step 4c-bis's rule, unchanged)
  const bandY = bandFor(E, col.hw);
  if (bandY > 0 && Math.abs(a) > 1 - bandY) {
    const sg = a < 0 ? -1 : 1;
    const yawThere = col.mid + sg * (col.hw + EPS);
    const nb = map.columns[columnAt(map, yawThere).k]!.bounds;
    const same = Math.abs(nb[0]! - lo) < 1e-12 && Math.abs(nb[nb.length - 1]! - hi) < 1e-12;
    if (!same || (p <= hi + Math.min(0.5 * spanT, E) + 1e-12 && p >= lo - Math.min(0.5 * spanB, E) - 1e-12))
      h = { w: ease((Math.abs(a) - (1 - bandY)) / bandY), yawThere };
  }
  let v: { w: number; pitchThere: number } | null = null;
  for (let j = 0; j < B.length && v === null; j++) {
    const sb = j === 0 ? spanB : (B[j]! - B[j - 1]!) / 2;
    const sa = j === B.length - 1 ? spanT : (B[j + 1]! - B[j]!) / 2;
    const db = Math.min(0.5 * sb, E);
    const da = Math.min(0.5 * sa, E);
    // ⭐ the bound itself on the side `mapTarget` puts it: the facet below an inner bound and the top's, the facet ABOVE the bottom's (⛔ read as the
    // bottom cap's: on a hexagonal end, whose bottom edge is narrower than the end, a 41 mm step there — probed)
    const below = j === 0 ? p < B[j]! : p <= B[j]!;
    if (db > 0 && below && p > B[j]! - db) v = { w: ease((p - (B[j]! - db)) / db), pitchThere: B[j]! + EPS };
    else if (da > 0 && !below && p < B[j]! + da) v = { w: ease((B[j]! + da - p) / da), pitchThere: B[j]! - EPS };
  }
  return { h, v };
}

/**
 * ⭐⭐⭐ THE PLACE THROUGH AN EDGE, NO JUMP (`edgeBlend` applied): `here` (the point at the angles) blended toward the next facet's first point — up / down
 * a column (`v`) and across a slice's end (`h`, of the up / down blends at both yaws, each read in ITS column — a column's pitch bounds are its own) — to
 * their middle at the end. `at`: the point at other angles (the wiring's gizmo, a vector's place); `null` there leaves the point as it is.
 * ⭐⭐⭐ (2026-11-05, the probes: a close-in dx stalled 630 frames at `Scene_1`'s front-left corner) — **A BLENDED PLACE IS A PLACE; ITS DEPTH IS CAST**:
 * the two points are on two REAL faces (the D3 depth), and where the real outline stands out past the contour's edge (Piece3, 45 mm proud of the −x side)
 * their CHORD runs through the part — the gizmo 2.8 mm inside it, the piece riding it close in, blocked. `cast` (the wiring's ray along the blended
 * normal onto the blended place, from `reach` in front of it — half the chord, the deepest a chord can cut, + 5 mm: never a part standing far out): a
 * surface IN FRONT of the chord takes the gizmo — never deeper (a concave chord stays in the air; a void stays bridged). Both sides of an edge blend to the
 * same place and normal: no jump.
 */
export function blendThroughEdges(
  map: FaceMap,
  yaw: number,
  pitch: number,
  opts: MapOpts,
  here: Vec3,
  at: (yaw: number, pitch: number) => Vec3 | null,
  cast?: (p: Vec3, n: Vec3, reach: number) => Vec3 | null,
): Vec3 {
  const eb = edgeBlend(map, yaw, pitch, opts);
  if (eb.h === null && eb.v === null) return here;
  const mix = (a: Vec3, b: Vec3, w: number): Vec3 => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
  const nAt = (yw: number, pt: number): Vec3 => mapTarget(map, yw, pt, opts).normal;
  let chord = 0; // the longest chord blended across — the sagitta's bound: a part the chord cuts lies within half of it in front
  const span = (a: Vec3, b: Vec3): void => {
    chord = Math.max(chord, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
  };
  const upDown = (yw: number, q: Vec3, n: Vec3, v: { readonly w: number; readonly pitchThere: number } | null): { p: Vec3; n: Vec3 } => {
    if (v === null) return { p: q, n };
    const o = at(yw, v.pitchThere);
    if (o === null) return { p: q, n };
    span(q, o);
    return { p: mix(q, o, v.w), n: mix(n, nAt(yw, v.pitchThere), v.w) };
  };
  let r = upDown(yaw, here, nAt(yaw, pitch), eb.v);
  if (eb.h !== null) {
    const o = at(eb.h.yawThere, pitch);
    if (o !== null) {
      const there = upDown(eb.h.yawThere, o, nAt(eb.h.yawThere, pitch), edgeBlend(map, eb.h.yawThere, pitch, opts).v);
      span(r.p, there.p);
      r = { p: mix(r.p, there.p, eb.h.w), n: mix(r.n, there.n, eb.h.w) };
    }
  }
  if (cast !== undefined) {
    const l = Math.hypot(r.n[0], r.n[1], r.n[2]);
    if (l > 1e-9) {
      const nb: Vec3 = [r.n[0] / l, r.n[1] / l, r.n[2] / l];
      const h = chord > 0 ? cast(r.p, nb, chord / 2 + BLEND_REACH_M) : null;
      if (h !== null && dot([h[0] - r.p[0], h[1] - r.p[1], h[2] - r.p[2]], nb) > BLEND_FRONT_M) return h;
    }
  }
  return r.p;
}
/** ⭐ (2026-11-05) a cast's hit takes a blended place only this far (m) in front of it — the chord itself on a face is kept. */
export const BLEND_FRONT_M = 0.0001;
/** ⭐ …and the cast reaches this far (m) beyond half the chord — never a part standing far out along the blended normal (a jump onto it). */
export const BLEND_REACH_M = 0.005;

/** ⭐ The facet a gizmo's face is on: the facet whose normal is nearest its normal (the slide's face); no normal — the facet whose plane is nearest `p`. */
export function facetOfNormal(map: FaceMap, n: Vec3 | null, p: Vec3): number {
  let best = { i: 0, s: -Infinity };
  if (n !== null && Math.hypot(n[0], n[1], n[2]) > 1e-9) {
    map.facets.forEach((f, i) => {
      const s = dot(n, f.n);
      if (s > best.s) best = { i, s };
    });
    return best.i;
  }
  map.facets.forEach((f, i) => {
    const s = -Math.abs(dot(f.n, p) - f.e);
    if (s > best.s) best = { i, s };
  });
  return best.i;
}
