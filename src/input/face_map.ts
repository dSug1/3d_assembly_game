/**
 * ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, STEP 4c-bis; the owner: *"propose another way to construct the gizmo so it truly reflects the dy and dx
 * inputs …"* → *"close the holes for the moment"*) — **THE FACE MAP**: the gizmo a FUNCTION of the orbit's angles, no carrier, no state.
 * ⭐⭐⭐ (2026-11-04, STEP 5 — scope §5, §16.1 D3 / D5; the owner: *"step 5: ok"*) **ON THE FACES CONTOUR, NO LONGER THE CORE BOX**:
 *
 * 1. **The facets** (`buildFaceMap`): the placed parts' faces clustered by normal (within `mergeDeg`, the largest face's normal first — snapped onto a world
 *    axis when it is one); each cluster a candidate FACET: its STACK — every face within `mergeDeg` of its normal, grouped by plane (`MAP_COPLANAR_M`) and,
 *    in a plane, by contact (the slide's own regions, grown `MAP_GROW_M`), **every hole inside a group CLOSED** (`filledRegion`) — and its plane the MAIN
 *    group's (the largest closed region: the painting's front, never a part sticking out of it — Step 4c-bis's core box, generalised) — ⭐⭐⭐ (§22.1 G1) then
 *    pushed out to the parts' support along its normal: the contour clear of every part. The contour is the
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
  // ⭐⭐⭐ (2026-11-06, scope §22.1 G1 — the owner: *"build it"*, then the rebuild) THE CONTOUR CLEAR OF EVERY PART: each chosen facet's plane pushed out to the placed parts'
  // SUPPORT along its normal (the farthest vertex) — the same normals (D5's choice of facets kept: no tilt), convex, every part inside it by construction:
  // the orbit's path never meets a part (⛔ at the main region's plane, a part proud of the face — `Scene_1`'s Piece44 over the front, Piece3 off the −x
  // side — stood across the piece's path close in: the solver pinned it, *"almost stuck"*). The approach alone goes in, to the real contact (§22.6).
  const supportOf = (n: Vec3): number => {
    let m = -Infinity;
    for (const f of faces) for (const tr of f.tris) for (const v of tr) m = Math.max(m, dot(n, v));
    return m;
  };
  const all: Candidate[] = [...sides, capT, capB].map((c) => {
    const sup = supportOf(c.n);
    return Number.isFinite(sup) && sup > c.e ? { ...c, e: sup } : c;
  });
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
      kind: i < sides.length ? "SIDE" : i === sides.length ? "TOP" : "BOTTOM",
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

/** ⭐ The map's knobs: the edge's slow stretch on each face (`edgeMm`) and the angle (deg) before a slice's end it is crossed in. */
export interface MapOpts {
  readonly edgeMm: number;
  readonly edgeDeg: number;
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

