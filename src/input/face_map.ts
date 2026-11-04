/**
 * ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, STEP 4c-bis; the owner: *"propose another way to construct the gizmo so it truly reflects the dy and dx
 * inputs: … raycast … to position the gizmo, the orbit is defined by dy and dx inputs modulated by the calm and the tilt, the red and green sections are
 * computed after the gizmo is updated based on the geometry of the faces contour"* → *"can we use the contours used for the slide … to avoid the holes or
 * gaps ?"* → *"let the gizmo move slowly over the last and first few mm of the two faces during the arc"*, *"close the holes for the moment"*) — **THE FACE
 * MAP**: the gizmo a FUNCTION of the orbit's angles, no carrier, no state.
 *
 * 1. **The stacks** (`buildFaceMap`): the placed parts' faces sorted by the world axis they face (±x, ±y, ±z — within `MAP_AXIS_DEG`), each axis's faces
 *    grouped by plane (`MAP_COPLANAR_M`) and, in a plane, by contact — the slide's own regions (`coplanarBoundary`'s rectangles: each face's extent on
 *    the plane's axes, grown `MAP_GROW_M` so the 3 mm joints between the coloured cores close) — and **every hole inside a group CLOSED** (`filledRegion`:
 *    an empty slot, a gap the ray would fall through).
 * 2. **The place on the box** (`mapTarget`): the orbit's angles read on the placed parts' BOX — each side a slice of the turn (its normal ± 45° of yaw), the
 *    sides' band ± 45° of pitch, the top's and the bottom's quarters beyond (concentric squares to the top / bottom centre at ±90°). Inside a slice the
 *    place goes linearly across the face; within `edgeDeg` of a slice's end it goes over the face's LAST `edgeMm` (and the next face's FIRST): through an
 *    edge the gizmo moves slowly — never a wait. The same angles, the same place: nothing to drift, nothing to hold.
 * 3. **The gizmo** (`stackDepthAt`): on the stack the place faces — the FRONTMOST group whose closed region holds it (a protrusion's face over the face
 *    behind it); none: the NEAREST group's plane (the gizmo beside the real face, in its plane, never into the assembly). The wiring then casts the ray
 *    along the axis for the exact surface (a slanted block).
 * So on a side a dx keeps the gizmo's height (the green: a horizontal plane) and a dy its place across the face (the red: the world's vertical plane
 * square to the face) — by construction; the sections are DRAWN from the same function (`render/assembly_wiring.ts`).
 * ⛔ ENGINE-FREE. Rectangles, a flood fill, piecewise-linear maps — textbook; no licence, no patent.
 */
import type { Vec3 } from "../core/vec";
import type { ShellBox } from "./orbit_shell";
import type { Rect2 } from "./hover";

/** ⭐ A face within this angle of a world axis faces it (deg) — `Scene_1`'s slanted block (15° off −z) faces −z. */
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

/** ⭐ A group's region with its holes closed: the cells between its rectangles' edges, each filled (in a rectangle, or enclosed by them) or not. */
export interface FilledRegion {
  readonly xs: readonly number[];
  readonly ys: readonly number[];
  readonly filled: Uint8Array;
}

/** ⭐ One plane's group: its level along the stack's axis (outward +), its grown rectangles, its closed region. */
export interface MapGroup {
  readonly depth: number;
  readonly rects: readonly Rect2[];
  readonly region: FilledRegion;
}

/** ⭐ The faces facing one world axis (`axis` 0 x / 1 y / 2 z, `sign` ±1), their groups FRONTMOST first. */
export interface MapStack {
  readonly axis: 0 | 1 | 2;
  readonly sign: 1 | -1;
  readonly groups: readonly MapGroup[];
}

/**
 * ⭐ The face map: the placed parts' box, the six stacks (`stackIndex`), and the CORE box the angles are read on (`coreBox`: each side at its MAIN face).
 */
export interface FaceMap {
  readonly box: ShellBox;
  readonly core: ShellBox;
  readonly stacks: readonly MapStack[];
}

/** ⭐ The stack of `axis` (0 x, 1 y, 2 z) and `sign`: +x 0, −x 1, +y 2, −y 3, +z 4, −z 5. */
export function stackIndex(axis: 0 | 1 | 2, sign: 1 | -1): number {
  return axis * 2 + (sign > 0 ? 0 : 1);
}

/** ⭐ A stack's plane coordinates: the two other world axes, in order (x: y, z — y: x, z — z: x, y). */
export function planeAxes(axis: 0 | 1 | 2): readonly [number, number] {
  return axis === 0 ? [1, 2] : axis === 1 ? [0, 2] : [0, 1];
}

/**
 * ⭐⭐ THE REGION, ITS HOLES CLOSED: the rectangles' edges cut the plane into cells; a cell is in a rectangle or not; the cells not in one and reachable
 * from outside (a flood fill from a border round them all) are the outside — every other cell is FILLED: in a rectangle, or a hole enclosed by them.
 */
export function filledRegion(rects: readonly Rect2[]): FilledRegion {
  if (rects.length === 0) return { xs: [], ys: [], filled: new Uint8Array(0) };
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
  return { xs, ys, filled };
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

/**
 * ⭐⭐⭐ THE CORE BOX — the angles are read on it (`mapTarget`): on each axis, each side at the plane of its stack's MAIN group (the largest closed region —
 * the painting's front, never a part sticking out of it), so a slice's end is the main body's REAL corner. ⛔ Read on the parts' whole box, a protrusion
 * widened the front: at the corner the side's ray passed in front of the painting and met that part's side, 25 cm in (probed). A side with no face, or
 * sides crossing: the whole box's.
 */
export function coreBox(stacks: readonly MapStack[], box: ShellBox): ShellBox {
  const lo: number[] = [box.lo[0], box.lo[1], box.lo[2]];
  const hi: number[] = [box.hi[0], box.hi[1], box.hi[2]];
  for (const axis of [0, 1, 2] as const) {
    const main = (sign: 1 | -1): number | null => {
      const s = stacks[stackIndex(axis, sign)];
      if (s === undefined || s.groups.length === 0) return null;
      let best: { a: number; d: number } | null = null;
      for (const g of s.groups) {
        const a = regionArea(g.region);
        if (best === null || a > best.a + 1e-12) best = { a, d: g.depth };
      }
      return best === null ? null : best.d * sign;
    };
    const h = main(1);
    const l = main(-1);
    if (h !== null && l !== null && h - l > 1e-6) {
      lo[axis] = l;
      hi[axis] = h;
    }
  }
  return { lo: [lo[0]!, lo[1]!, lo[2]!], hi: [hi[0]!, hi[1]!, hi[2]!] };
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
 * ⭐⭐⭐ THE STACKS: each face to the world axis it faces (within `MAP_AXIS_DEG`; others — a face along no axis — to none), by plane (`MAP_COPLANAR_M`, a
 * face's level at its centre), each plane's faces by contact (their rectangles grown `MAP_GROW_M`); each group's region closed (`filledRegion`). A group's
 * depth: its plane's level along the stack's outward axis. Frontmost first.
 */
export function buildFaceMap(faces: readonly MapFace[], box: ShellBox): FaceMap {
  const cosMax = Math.cos((MAP_AXIS_DEG * Math.PI) / 180);
  const stacks: MapStack[] = [];
  for (const axis of [0, 1, 2] as const)
    for (const sign of [1, -1] as const) {
      const [i0, i1] = planeAxes(axis);
      const mine = faces.filter((f) => f.normal[axis] * sign >= cosMax && f.tris.length > 0);
      // by plane: levels within MAP_COPLANAR_M of a plane's first face
      const planes: { level: number; faces: MapFace[] }[] = [];
      for (const f of mine) {
        const level = f.centre[axis] * sign;
        const p = planes.find((q) => Math.abs(q.level - level) <= MAP_COPLANAR_M);
        if (p === undefined) planes.push({ level, faces: [f] });
        else p.faces.push(f);
      }
      const groups: MapGroup[] = [];
      for (const p of planes) {
        const rects: Rect2[] = p.faces.map((f) => {
          const xs = f.tris.flatMap((t) => t.map((v) => v[i0]!));
          const ys = f.tris.flatMap((t) => t.map((v) => v[i1]!));
          return { x0: Math.min(...xs) - MAP_GROW_M, x1: Math.max(...xs) + MAP_GROW_M, y0: Math.min(...ys) - MAP_GROW_M, y1: Math.max(...ys) + MAP_GROW_M };
        });
        for (const comp of components(rects)) {
          const rs = comp.map((k) => rects[k]!);
          groups.push({ depth: p.level, rects: rs, region: filledRegion(rs) });
        }
      }
      groups.sort((a, b) => b.depth - a.depth);
      stacks[stackIndex(axis, sign)] = { axis, sign, groups };
    }
  return { box, core: coreBox(stacks, box), stacks };
}

/**
 * ⭐⭐ THE GIZMO'S PLANE on a stack at (`x`, `y`) (the stack's plane coordinates): the FRONTMOST group whose closed region holds the point (`inside`); none,
 * the NEAREST group (ties: the frontmost) — the gizmo beside the real face, in its plane. `null`: no face faces that axis.
 */
export function stackDepthAt(s: MapStack, x: number, y: number): { readonly depth: number; readonly group: number; readonly inside: boolean } | null {
  for (let g = 0; g < s.groups.length; g++) if (regionContains(s.groups[g]!.region, x, y)) return { depth: s.groups[g]!.depth, group: g, inside: true };
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

/** ⭐ A side's frame: its outward normal `n` and the way the yaw turns across it `t` (both horizontal), its stack. */
export function sideFrame(k: number): { readonly n: Vec3; readonly t: Vec3; readonly stack: number } {
  const c = [1, 0, -1, 0][k & 3]!;
  const s = [0, 1, 0, -1][k & 3]!;
  const n: Vec3 = [c, 0, s];
  const t: Vec3 = [-s, 0, c];
  return { n, t, stack: c !== 0 ? stackIndex(0, c > 0 ? 1 : -1) : stackIndex(2, s > 0 ? 1 : -1) };
}

/** ⭐ The box's extent along a horizontal unit axis `a` (a world axis or its opposite): [lo, hi]. */
function extentAlong(box: ShellBox, a: Vec3): readonly [number, number] {
  const p = a[0] * box.lo[0] + a[2] * box.lo[2];
  const q = a[0] * box.hi[0] + a[2] * box.hi[2];
  return p <= q ? [p, q] : [q, p];
}

/** ⭐ The angle's share of a slice's end it is crossed in: `edgeDeg` of the slice's 45°, at most half. */
function bandOf(opts: MapOpts): number {
  return Math.min(0.5, Math.max(0, opts.edgeDeg / 45));
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

/** ⭐ Where the angles put the gizmo on the box: the band, the side's slice, the stack it faces, the box's point, and across the side (for the calm). */
export interface MapTarget {
  readonly band: "SIDE" | "TOP" | "BOTTOM";
  /** the side whose slice the yaw is in (0 +x, 1 +z, 2 −x, 3 −z) */
  readonly side: number;
  readonly stack: number;
  /** the outward axis of the stack */
  readonly normal: Vec3;
  /** the place on the box's surface */
  readonly surface: Vec3;
  /** across the side: its place `L` in the face's span `lo` … `hi` (the side's axis `t`) */
  readonly across: { readonly L: number; readonly lo: number; readonly hi: number };
}

const Q = Math.PI / 4;
const wrapPi = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/** ⭐ The yaw's side (0 … 3, its normal at k·90°) and its place across the slice (−1 … 1). */
export function sideOfYaw(yaw: number): { readonly k: number; readonly a: number } {
  const w = ((yaw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const k = Math.round(w / (2 * Q)) & 3;
  return { k, a: Math.max(-1, Math.min(1, wrapPi(yaw - k * 2 * Q) / Q)) };
}

/**
 * ⭐⭐⭐ THE PLACE ON THE BOX for the orbit's `yaw` and `pitch` (the orbit's convention: x = cos, z = sin; pitch up +) — see the module's header. A side:
 * across it by the yaw (`edgeMap`), up it by the pitch over the box's height (`edgeMap`, ±45°); a top / bottom: the side's rim point at the yaw, drawn in
 * toward the centre by the pitch beyond 45° (`topIn`) — at ±90° the centre, whatever the yaw.
 */
export function mapTarget(box: ShellBox, yaw: number, pitch: number, opts: MapOpts): MapTarget {
  const band = bandOf(opts);
  const ke = Math.max(0, opts.edgeMm) / 1000;
  const { k, a } = sideOfYaw(yaw);
  const { n, t, stack } = sideFrame(k);
  const [lo, hi] = extentAlong(box, t);
  const half = (hi - lo) / 2;
  const mid = (lo + hi) / 2;
  const L = mid + edgeMap(a, band, half, ke);
  const e = extentAlong(box, n)[1];
  const across = { L, lo, hi };
  const rim = (y: number): Vec3 => [n[0] * e + t[0] * L, y, n[2] * e + t[2] * L];
  const p = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
  if (Math.abs(p) <= Q + 1e-12) {
    const yh = (box.hi[1] - box.lo[1]) / 2;
    const y = (box.lo[1] + box.hi[1]) / 2 + edgeMap(p / Q, band, yh, ke);
    return { band: "SIDE", side: k, stack, normal: n, surface: rim(y), across };
  }
  const up = p > 0;
  const cx = (box.lo[0] + box.hi[0]) / 2;
  const cz = (box.lo[2] + box.hi[2]) / 2;
  const dMin = Math.min(box.hi[0] - box.lo[0], box.hi[2] - box.lo[2]) / 2;
  const g = topIn((Math.abs(p) - Q) / Q, band, ke, dMin);
  const y = up ? box.hi[1] : box.lo[1];
  const r = rim(y);
  return {
    band: up ? "TOP" : "BOTTOM",
    side: k,
    stack: stackIndex(1, up ? 1 : -1),
    normal: [0, up ? 1 : -1, 0],
    surface: [cx + (r[0] - cx) * (1 - g), y, cz + (r[2] - cz) * (1 - g)],
    across,
  };
}

/**
 * ⭐⭐ …AND BACK: the angles whose place is nearest `p` on the face of stack `stack` (a point on the box's surface or in a face's plane) — after the slide,
 * the map is put where the slide left the gizmo (no jump). A side: across and up it (`edgeUnmap`); a top / bottom: the quarter it is in (the side whose
 * rim it is most toward), its share of the way in, its place across.
 */
export function mapAngles(box: ShellBox, p: Vec3, stack: number, opts: MapOpts): { readonly yaw: number; readonly pitch: number } {
  const band = bandOf(opts);
  const ke = Math.max(0, opts.edgeMm) / 1000;
  const unmapAcross = (k: number, L: number): number => {
    const { t } = sideFrame(k);
    const [lo, hi] = extentAlong(box, t);
    return edgeUnmap(L - (lo + hi) / 2, band, (hi - lo) / 2, ke);
  };
  if (stack === stackIndex(1, 1) || stack === stackIndex(1, -1)) {
    const up = stack === stackIndex(1, 1);
    const cx = (box.lo[0] + box.hi[0]) / 2;
    const cz = (box.lo[2] + box.hi[2]) / 2;
    const qx = p[0] - cx;
    const qz = p[2] - cz;
    let best = { k: 0, r: -Infinity };
    for (let k = 0; k < 4; k++) {
      const { n } = sideFrame(k);
      const D = extentAlong(box, n)[1] - (n[0] * cx + n[2] * cz);
      const r = D > 1e-12 ? (qx * n[0] + qz * n[2]) / D : -Infinity;
      if (r > best.r) best = { k, r };
    }
    const r = Math.min(1, Math.max(0, best.r));
    const { t } = sideFrame(best.k);
    const ct = t[0] * cx + t[2] * cz;
    const L = r > 1e-9 ? ct + (qx * t[0] + qz * t[2]) / r : ct;
    const dMin = Math.min(box.hi[0] - box.lo[0], box.hi[2] - box.lo[2]) / 2;
    const f = topOut(1 - r, band, ke, dMin);
    const pitch = (up ? 1 : -1) * (Q + f * Q);
    return { yaw: best.k * 2 * Q + unmapAcross(best.k, L) * Q, pitch };
  }
  const k = [stackIndex(0, 1), stackIndex(2, 1), stackIndex(0, -1), stackIndex(2, -1)].indexOf(stack);
  const side = k < 0 ? 0 : k;
  const { t } = sideFrame(side);
  const yh = (box.hi[1] - box.lo[1]) / 2;
  const b = edgeUnmap(p[1] - (box.lo[1] + box.hi[1]) / 2, band, yh, ke);
  return { yaw: side * 2 * Q + unmapAcross(side, t[0] * p[0] + t[2] * p[2]) * Q, pitch: b * Q };
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

/**
 * ⭐⭐⭐ THROUGH AN EDGE, NO JUMP (the edge bands — `edgeDeg` before a slice's end): the gizmo of the face being left and the gizmo where the next face starts
 * can differ — the real outline at that height is not the core box's (a column standing out 45 mm, a top 41 mm above the core's: probed on `Scene_1`). In
 * the band the gizmo is BLENDED toward the next face's first point, `w` rising (smoothstep) to ½ at the slice's end — where both sides meet: the gizmo
 * crosses the corner continuously, never jumps. `h`: across a side's end (the yaw `yawThere` just inside the next side); `v`: up a side to the top / down
 * to the bottom (`pitchThere` just past the band's end) or back from it. `null`: not in that band (or no band).
 */
export function edgeBlend(yaw: number, pitch: number, opts: MapOpts): { readonly h: { readonly w: number; readonly yawThere: number } | null; readonly v: { readonly w: number; readonly pitchThere: number } | null } {
  const band = bandOf(opts);
  if (!(band > 0)) return { h: null, v: null };
  const ease = (u: number): number => {
    const x = Math.min(1, Math.max(0, u));
    return 0.5 * x * x * (3 - 2 * x);
  };
  const E = 1e-7;
  const p = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
  let h: { w: number; yawThere: number } | null = null;
  // across: in a side's band, and over a top / under a bottom while still in its first band (the side's end is blended in there)
  if (Math.abs(p) <= Q * (1 + band) + 1e-12) {
    const { k, a } = sideOfYaw(yaw);
    if (Math.abs(a) > 1 - band) {
      const sg = a < 0 ? -1 : 1;
      h = { w: ease((Math.abs(a) - (1 - band)) / band), yawThere: k * 2 * Q + sg * (Q + E) };
    }
  }
  let v: { w: number; pitchThere: number } | null = null;
  const sg = p < 0 ? -1 : 1;
  const b = Math.abs(p) / Q;
  if (b <= 1 && b > 1 - band) v = { w: ease((b - (1 - band)) / band), pitchThere: sg * (Q + E) };
  else if (b > 1 && b < 1 + band) v = { w: ease((1 + band - b) / band), pitchThere: sg * (Q - E) };
  return { h, v };
}

/** ⭐ The stack a gizmo's face is on: its normal's nearest world axis (the slide's face); no normal — the box's face nearest `p`. */
export function stackOfNormal(n: Vec3 | null, p: Vec3, box: ShellBox): number {
  if (n !== null && Math.hypot(n[0], n[1], n[2]) > 1e-9) {
    const ax = ([0, 1, 2] as const).reduce<0 | 1 | 2>((m, k) => (Math.abs(n[k]) > Math.abs(n[m]) ? k : m), 0);
    return stackIndex(ax, n[ax] >= 0 ? 1 : -1);
  }
  let best = { k: 0, d: Infinity };
  for (const ax of [0, 1, 2] as const)
    for (const sg of [1, -1] as const) {
      const d = Math.abs(p[ax] - (sg > 0 ? box.hi[ax] : box.lo[ax]));
      if (d < best.d) best = { k: stackIndex(ax, sg), d };
    }
  return best.k;
}
