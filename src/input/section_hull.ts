/**
 * ⭐⭐⭐ prototype (2026-10-29, the owner: *"why can't each degree of pitch slide it 0.27m * 1 degree and then clamp it between -90 +90 degrees of red
 * section ?"* → *"overhang or concave shape: propose something to drive the gizmo. Same if the overhang or concave is met on the dx yaw orbit"* → *"build
 * it with the clamp and ±90°"*; and *"there are moment when the gizmo is not at the intersection of the green and red sections"*) — **THE GIZMO'S CARRIER
 * ON THE SECTION'S HULL**:
 * * the RED section is the yaw plane's cut of the placed parts (`sectionPoints`: each part's convex hull cut by the plane); its CONVEX HULL (`hull2`) has
 *   no hollow and no overhang; the half of it facing the piece (`facingChain`) runs from the BOTTOM CENTRE (under the centre) up to the TOP CENTRE (over
 *   it) — the ±90° of pitch's two ends, the clamp;
 * * a CARRIER rides that chain: dy slides it by the assembly's half-size per radian of pitch (`chainStep`), clamped at both centres, and it never ENTERS an
 *   edge turned away from the piece (`facesPiece`) — it waits at its start;
 * * dx turns the yaw plane: the carrier is found again on the new chain (`remapOnChain`) — on a SIDE at its HEIGHT (the green section: round the
 *   assembly at constant height), on a TOP / BOTTOM at its distance from the axis (round the axis on the face);
 * * the GIZMO is the carrier DROPPED onto the real surface (`dropRay`): on a side horizontally toward the axis at its height, on a top straight down, on
 *   a bottom straight up — so it is ALWAYS in the yaw plane (the red section) AND at its height on the green one: at their intersection, by construction.
 * ⛔ ENGINE-FREE. A plane cut of convex parts, Andrew's monotone chain (1979), arc length — textbook; no licence, no patent.
 */
import type { Vec3 } from "../core/vec";

/** ⭐ A point in the yaw plane: `r` along the heading from the axis (the piece's side +), `y` up from the centre. */
export type P2 = readonly [number, number];

/** ⭐ A ray: from `origin` along `dir` (unit), `length` long. */
export interface SectionRay {
  readonly origin: Vec3;
  readonly dir: Vec3;
  readonly length: number;
}

/** ⭐ The yaw plane at `yaw`: its heading `h` (the orbit's own azimuth convention: x = cos, z = sin) and its normal `axis` (the pitch's axis). */
export function yawFrame(yaw: number): { readonly h: Vec3; readonly axis: Vec3 } {
  return { h: [Math.cos(yaw), 0, Math.sin(yaw)], axis: [-Math.sin(yaw), 0, Math.cos(yaw)] };
}

/** ⭐ `p` in the yaw plane through `c` at `yaw` (its offset along the plane's normal dropped). */
export function toPlane(p: Vec3, c: Vec3, yaw: number): P2 {
  const { h } = yawFrame(yaw);
  return [(p[0] - c[0]) * h[0] + (p[2] - c[2]) * h[2], p[1] - c[1]];
}

/** ⭐ …and back to the world. */
export function fromPlane(q: P2, c: Vec3, yaw: number): Vec3 {
  const { h } = yawFrame(yaw);
  return [c[0] + h[0] * q[0], c[1] + q[1], c[2] + h[2] * q[0]];
}

/**
 * ⭐⭐ THE SECTION'S POINTS: each part (its vertices — a convex body) cut by the vertical plane through `c` at `yaw` — the vertices on it and every segment
 * between two vertices on either side of it, where it crosses (a segment between two vertices of a convex body lies inside it, and the cut's corners are
 * where its edges cross, so the hull of these points IS the cut).
 */
export function sectionPoints(parts: readonly (readonly Vec3[])[], c: Vec3, yaw: number): P2[] {
  const { axis } = yawFrame(yaw);
  const out: P2[] = [];
  for (const vs of parts) {
    const d = vs.map((v) => (v[0] - c[0]) * axis[0] + (v[2] - c[2]) * axis[2]);
    for (let i = 0; i < vs.length; i++) {
      const di = d[i]!;
      const vi = vs[i]!;
      if (Math.abs(di) < 1e-12) out.push(toPlane(vi, c, yaw));
      for (let j = i + 1; j < vs.length; j++) {
        const dj = d[j]!;
        if (!((di > 1e-12 && dj < -1e-12) || (di < -1e-12 && dj > 1e-12))) continue;
        const vj = vs[j]!;
        const t = di / (di - dj);
        out.push(toPlane([vi[0] + (vj[0] - vi[0]) * t, vi[1] + (vj[1] - vi[1]) * t, vi[2] + (vj[2] - vi[2]) * t], c, yaw));
      }
    }
  }
  return out;
}

/** ⭐ The convex hull of `pts`, counter-clockwise (r right, y up), no collinear point (Andrew's monotone chain). Fewer than 3 distinct points: them. */
export function hull2(pts: readonly P2[]): P2[] {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const u: P2[] = [];
  for (const p of s) if (u.length === 0 || Math.abs(u[u.length - 1]![0] - p[0]) > 1e-12 || Math.abs(u[u.length - 1]![1] - p[1]) > 1e-12) u.push(p);
  if (u.length < 3) return u;
  const cr = (o: P2, a: P2, b: P2): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: P2[] = [];
  for (const p of u) {
    while (lower.length >= 2 && cr(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 1e-15) lower.pop();
    lower.push(p);
  }
  const upper: P2[] = [];
  for (let i = u.length - 1; i >= 0; i--) {
    const p = u[i]!;
    while (upper.length >= 2 && cr(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 1e-15) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** ⭐ The chain the carrier rides: its points in order, their arc length from the first, the whole length. */
export interface SectionChain {
  readonly pts: readonly P2[];
  readonly cum: readonly number[];
  readonly total: number;
}

/** ⭐ A chain through `pts` (a point closer than 1e-9 to the last one dropped). */
export function chainOf(pts: readonly P2[]): SectionChain {
  const p: P2[] = [];
  for (const q of pts) if (p.length === 0 || Math.hypot(q[0] - p[p.length - 1]![0], q[1] - p[p.length - 1]![1]) > 1e-9) p.push(q);
  const cum = [0];
  for (let i = 1; i < p.length; i++) cum.push(cum[i - 1]! + Math.hypot(p[i]![0] - p[i - 1]![0], p[i]![1] - p[i - 1]![1]));
  return { pts: p, cum, total: cum[cum.length - 1]! };
}

/**
 * ⭐⭐ THE HALF OF THE HULL FACING THE PIECE: the hull clipped to `r ≥ r0` (`r0` 0 — the vertical through the centre — or the hull's own nearest side to
 * the piece when the axis lies outside it; its middle when the axis lies beyond its far side), walked counter-clockwise from the BOTTOM point on the cut to the TOP one — up the piece's side, the clamp at
 * both ends (the ±90° of pitch: under the centre, over it). `null`: no area.
 */
export function facingChain(hull: readonly P2[]): SectionChain | null {
  if (hull.length < 3) return null;
  // ⭐⭐⭐ (2026-11-04, Step 4) the whole hull BEHIND the axis (its far side toward the piece at r ≤ 0): clipped at its middle — ⛔ `null`: in Scene_1 the
  // axis lies on the painting's back face, a world plane x = c seen from +z had no facing area, the carrier kept a stale plane, every drop held
  const rMin = Math.min(...hull.map((p) => p[0]));
  const rMax = Math.max(...hull.map((p) => p[0]));
  const r0 = rMax > 1e-9 ? Math.max(0, rMin) : (rMin + rMax) / 2;
  // ⭐ Sutherland–Hodgman against the one half-plane r ≥ r0
  const clip: P2[] = [];
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]!;
    const b = hull[(i + 1) % hull.length]!;
    const ina = a[0] >= r0 - 1e-12;
    const inb = b[0] >= r0 - 1e-12;
    if (ina) clip.push(a);
    if (ina !== inb) {
      const t = (r0 - a[0]) / (b[0] - a[0]);
      clip.push([r0, a[1] + (b[1] - a[1]) * t]);
    }
  }
  const poly = chainOf([...clip, clip[0]!]).pts.slice(0, -1);
  if (poly.length < 3) return null;
  let ib = -1;
  let it = -1;
  for (let i = 0; i < poly.length; i++) {
    if (Math.abs(poly[i]![0] - r0) > 1e-9) continue;
    if (ib < 0 || poly[i]![1] < poly[ib]![1]) ib = i;
    if (it < 0 || poly[i]![1] > poly[it]![1]) it = i;
  }
  if (ib < 0) return null;
  const out: P2[] = [poly[ib]!];
  for (let k = 1; k <= poly.length; k++) {
    const i = (ib + k) % poly.length;
    out.push(poly[i]!);
    if (i === it) break;
  }
  return chainOf(out);
}

/** ⭐ The chain's edge holding arc length `s` (clamped), and the point there. */
export function chainAt(ch: SectionChain, s: number): { readonly p: P2; readonly edge: number } {
  const n = ch.pts.length;
  if (n === 1) return { p: ch.pts[0]!, edge: 0 };
  const x = Math.min(ch.total, Math.max(0, s));
  let i = 0;
  while (i < n - 2 && x > ch.cum[i + 1]!) i++;
  const a = ch.pts[i]!;
  const b = ch.pts[i + 1]!;
  const len = ch.cum[i + 1]! - ch.cum[i]!;
  const t = len > 0 ? (x - ch.cum[i]!) / len : 0;
  return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], edge: i };
}

/** ⭐ Edge `i`'s outward normal (the chain runs counter-clockwise: the outside on its right). */
export function edgeNormal(ch: SectionChain, i: number): P2 {
  const a = ch.pts[Math.max(0, Math.min(ch.pts.length - 2, i))]!;
  const b = ch.pts[Math.max(1, Math.min(ch.pts.length - 1, i + 1))]!;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  return l > 0 ? [dy / l, -dx / l] : [1, 0];
}

/** ⭐ An edge's kind by its normal: a TOP (within 45° of up), a BOTTOM (of down), else a SIDE. */
export type EdgeKind = "SIDE" | "TOP" | "BOTTOM";
export function edgeKind(n: P2): EdgeKind {
  return n[1] > Math.SQRT1_2 ? "TOP" : n[1] < -Math.SQRT1_2 ? "BOTTOM" : "SIDE";
}

/** ⭐ Does an edge of normal `n` face the piece at `pitch` (its direction `cos·h + sin·up`)? */
export function facesPiece(n: P2, pitch: number): boolean {
  return n[0] * Math.cos(pitch) + n[1] * Math.sin(pitch) >= -1e-9;
}

/**
 * ⭐⭐⭐ THE PITCH'S STEP: the carrier at `s` slid by `ds` along the chain (+ up toward the top centre), clamped at both ends — and it never ENTERS an edge
 * turned away from the piece at `pitch`: it waits at that edge's start (moving inside one it already is on, it is free).
 */
export function chainStep(ch: SectionChain, s: number, ds: number, pitch: number): number {
  const edges = ch.pts.length - 1;
  if (ds === 0 || edges < 1) return Math.min(ch.total, Math.max(0, s));
  const faces = (i: number): boolean => facesPiece(edgeNormal(ch, i), pitch);
  let x = Math.min(ch.total, Math.max(0, s));
  if (ds > 0) {
    const target = Math.min(ch.total, x + ds);
    let i = 0;
    while (i < edges - 1 && x > ch.cum[i + 1]!) i++; // ⭐ at a corner: on the edge it came along (the next one is ENTERED)
    for (;;) {
      const end = ch.cum[i + 1]!;
      if (target <= end) return target;
      x = end;
      i++;
      if (i >= edges) return ch.total;
      if (!faces(i)) return x;
    }
  }
  const target = Math.max(0, x + ds);
  let i = edges - 1;
  while (i > 0 && x < ch.cum[i]!) i--; // ⭐ at a corner: on the edge it came along
  for (;;) {
    const start = ch.cum[i]!;
    if (target >= start) return target;
    x = start;
    i--;
    if (i < 0) return 0;
    if (!faces(i)) return x;
  }
}

/** ⭐ The arc length of the chain's point nearest `p`. */
export function nearestOnChain(ch: SectionChain, p: P2): number {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < ch.pts.length - 1; i++) {
    const a = ch.pts[i]!;
    const b = ch.pts[i + 1]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    const t = l2 > 0 ? Math.min(1, Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
    const d = Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1]);
    if (d < bd) {
      bd = d;
      best = ch.cum[i]! + t * Math.sqrt(l2);
    }
  }
  return best;
}

// ⛔ (2026-10-29) `remapOnChain` (dx as a turn of the yaw plane through the centre) is deleted — dx goes BY DISTANCE round the green loop (`loopStep`).

/**
 * ⭐⭐ THE DROP: the ray that puts the gizmo on the real surface from the carrier `q` on an edge of `kind` (`reach`: from how far outside) — a SIDE:
 * horizontal in the yaw plane at `q`'s height, from outside toward the axis; a TOP: straight down at `q`'s distance from the axis; a BOTTOM: straight up.
 * Always in the yaw plane — and on a side at the carrier's height.
 */
export function dropRay(q: P2, kind: EdgeKind, c: Vec3, yaw: number, reach: number): SectionRay {
  const { h } = yawFrame(yaw);
  if (kind === "TOP") return { origin: fromPlane([q[0], reach], c, yaw), dir: [0, -1, 0], length: reach * 2 };
  if (kind === "BOTTOM") return { origin: fromPlane([q[0], -reach], c, yaw), dir: [0, 1, 0], length: reach * 2 };
  return { origin: fromPlane([reach, q[1]], c, yaw), dir: [-h[0], 0, -h[2]], length: reach * 2 };
}

/** ⭐ The gizmo's real face TURNED AWAY from the piece (its normal against the piece's direction `u`) — the gizmo then holds where it was. */
export function faceTurnedAway(n: Vec3 | null, u: Vec3): boolean {
  return n !== null && n[0] * u[0] + n[1] * u[1] + n[2] * u[2] < 0;
}

/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"propose another way to smooth the travel of the red and green section without compromising the fact that the gizmo is always
 * at the intersection of the green and red sections, even through discontinuities such as edges"* → *"build it (option A, symetric)"*) — **THE SECTIONS
 * DRAWN THROUGH THE GIZMO**. Each line's own samples are FIXED on it — `n` evenly spread parameters (`sectionFixed`: arc lengths along an open red chain,
 * ends included; along a closed green loop, or angles round the axis over a top) — and dropped once per line (`sectionRedKey`, `sectionGreenKey`): a dx
 * reshapes only the red, a dy only the green. The gizmo's EXACT point is then INSERTED in both (`insertIndex`), every frame — so the ring is a vertex of
 * both lines by construction, through edges and held drops alike. ⛔ (2026-11-01, reverted) the lines and the ring were three separate drops: the carrier's
 * own replaced a sample, the green's started at the carrier, and they parted wherever the drops differed (an edge, a held drop).
 */
export function sectionFixed(total: number, n: number, closed: boolean): number[] {
  const out: number[] = [];
  if (n <= 0) return out;
  if (closed) for (let k = 0; k < n; k++) out.push((total * k) / n);
  else for (let k = 0; k < n; k++) out.push(n > 1 ? (total * k) / (n - 1) : 0);
  return out;
}
/**
 * ⭐⭐ (2026-11-02) The segments drawn around the gizmo's vertex: each neighbour by the line's own rule (`joinsPrev`, `joinsNext` — `joins`); cut off on
 * BOTH sides (it sits across a jump), the NEARER neighbour joined anyway — the ring always on a drawn line (measured: 2 frames of 953 left it 30 mm off).
 */
export function gizmoJoins(joinsPrev: boolean, joinsNext: boolean, distPrev: number, distNext: number): [boolean, boolean] {
  if (joinsPrev || joinsNext) return [joinsPrev, joinsNext];
  return distPrev <= distNext ? [true, false] : [false, true];
}
/** ⭐ Where `p` goes among the sorted `params`: after every one not past it. */
export function insertIndex(params: readonly number[], p: number): number {
  let i = 0;
  while (i < params.length && params[i]! <= p) i++;
  return i;
}
/** ⭐ The red line's identity: the placed set, the plane's yaw and the origin it goes through — a dy (along the same chain) keeps it. */
export function sectionRedKey(partsKey: string, yaw: number, origin: Vec3): string {
  return `${partsKey}#${yaw.toFixed(6)}#${origin.map((x) => x.toFixed(6)).join(",")}`;
}
/**
 * ⭐ The green line's identity: the placed set and, on a side, the loop's height (exact — a dx keeps it, a dy moves it); over a top / under a bottom, the
 * distance from the axis and the height to the millimetre (the carrier's projection drifts it by less under a dx).
 */
export function sectionGreenKey(partsKey: string, kind: string, w: Vec3, centre: Vec3): string {
  const mm = (x: number): string => (Math.round(x * 1000) / 1000).toFixed(3);
  return kind === "SIDE" ? `${partsKey}#SIDE#${w[1].toFixed(6)}` : `${partsKey}#${kind}#${mm(Math.hypot(w[0] - centre[0], w[2] - centre[2]))}#${mm(w[1])}`;
}

/**
 * ⭐⭐⭐ (2026-10-29, the owner: *"on dy, it is quite easy to reach any place on the vertical axis. On dx, there is a large angular range spent on little
 * travel in the middle of the face … Can't the dx replicate what dy does so that each place can be reached easily ?"* → *"agreed"*) — **dx BY
 * DISTANCE ON THE GREEN SECTION** (⛔ the yaw plane's cut at the gizmo's height: 2 cm × tan(yaw) along the painting's face — 0.4 cm at 10°, the edge only at
 * 87°). The GREEN section is the horizontal cut of the placed parts at height `y` (`greenPoints`: each part's convex hull cut by the plane), its convex
 * hull (`hull2`, in (x, z) — counter-clockwise turns the way the yaw does); the carrier rides it as a closed loop (`loopStep`) at its perimeter per turn
 * (`greenPace`) — once round per turn of yaw, so it stays on the piece's side — and never ENTERS an edge turned away from the piece (it waits there).
 */
export function greenPoints(parts: readonly (readonly Vec3[])[], y: number): P2[] {
  const out: P2[] = [];
  for (const vs of parts) {
    for (let i = 0; i < vs.length; i++) {
      const vi = vs[i]!;
      const di = vi[1] - y;
      if (Math.abs(di) < 1e-12) out.push([vi[0], vi[2]]);
      for (let j = i + 1; j < vs.length; j++) {
        const vj = vs[j]!;
        const dj = vj[1] - y;
        if (!((di > 1e-12 && dj < -1e-12) || (di < -1e-12 && dj > 1e-12))) continue;
        const t = di / (di - dj);
        out.push([vi[0] + (vj[0] - vi[0]) * t, vi[2] + (vj[2] - vi[2]) * t]);
      }
    }
  }
  return out;
}

/** ⭐ The green hull as a CLOSED loop (its first point repeated at the end); `null`: no area. */
export function loopOf(hull: readonly P2[]): SectionChain | null {
  if (hull.length < 3) return null;
  return chainOf([...hull, hull[0]!]);
}

/** ⭐ The pace of dx on a loop: its perimeter per turn of yaw (m per radian). */
export function greenPace(loop: SectionChain): number {
  return loop.total / (2 * Math.PI);
}

/** ⭐ (2026-11-04, Step 3) The pitch's pace keeps the carrier this far inside the red chain's ends (m): a drop never grazes the edge an end lies on. */
export const RED_END_INSET_M = 0.001;

/**
 * ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 3) THE PITCH'S PACE ON THE RED CHAIN — the arc length a pitch step `dPitch` (from `pitchBefore`) asks
 * of the carrier at `s`: what is LEFT of the chain toward the end it goes to (the top centre up, the bottom centre down) over what is left of the pitch to
 * ±90° — so the gizmo reaches the top centre exactly as the orbit reaches +90° (the bottom at −90°), whatever it started from. In step with the pitch it is
 * the chain's length per half turn (`total / π`: one loop of the gizmo one turn of the orbit, as dx's `greenPace`). ⛔ (ff2fca2) the assembly's half-size per
 * radian: on a thin section the gizmo went round in less than the orbit's turn, on a wide one it never reached the top centre at 90°.
 */
export function redPace(ch: SectionChain, s: number, pitchBefore: number, dPitch: number): number {
  if (dPitch === 0) return 0;
  // ⭐ the ends kept RED_END_INSET_M inside the chain — ⛔ (probed, Scene_1) the top centre lay exactly on the painting's back top edge (the assembly's
  // centre line, its box's): the drop grazed the edge and found nothing, the gizmo held 29 mm short of it
  const lo = Math.min(RED_END_INSET_M, ch.total / 2);
  const hi = ch.total - lo;
  const x = Math.min(ch.total, Math.max(0, s));
  const room = dPitch > 0 ? Math.PI / 2 - pitchBefore : pitchBefore + Math.PI / 2;
  const left = dPitch > 0 ? Math.max(0, hi - x) : Math.max(0, x - lo);
  if (!(room > 1e-9)) return dPitch > 0 ? left : -left;
  const share = Math.min(1, Math.abs(dPitch) / room);
  return (dPitch > 0 ? 1 : -1) * left * share;
}

/** ⭐ An arc length brought onto the loop's one lap [0, total). */
export function wrapOn(loop: SectionChain, s: number): number {
  const t = loop.total;
  return t > 0 ? ((s % t) + t) % t : 0;
}

/** ⭐ An angle brought into (−π, π]. */
function wrapPi(a: number): number {
  const t = 2 * Math.PI;
  const r = ((a % t) + t) % t;
  return r > Math.PI ? r - t : r;
}

/**
 * ⭐⭐⭐ (2026-11-04, branch `1.0.95-`, the owner: *"why the gizmo cannot be synchronized with the orbit? I am ok if the linear speed of the gizmo is not
 * constant"*) THE GIZMO'S PLACE ON THE GREEN LOOP FROM THE YAW ALONE — each edge owns a SLICE of the turn: from halfway between its outward normal and the
 * previous edge's to halfway between its normal and the next one's (the slices tile the turn: a convex loop's normals go once round, in order). Inside its
 * slice the carrier crosses the edge linearly with the yaw — at the slice's start the edge's start corner, at its end the edge's end. ⭐ The same yaw is
 * always the same place (nothing to drift), a corner reached exactly as the yaw crosses into the next edge's slice, and the edge it is on always FACES the
 * piece (inside its slice the yaw is less than half an exterior angle — under 90° — from the edge's normal). ⚠ The speed along the loop is not even: a wide
 * face and a narrow one get slices of the same order (on a box, 90° each). Returns the arc length.
 */
export function loopAtYaw(loop: SectionChain, yaw: number): number {
  const fs = loopFacets(loop);
  if (fs === null) return 0;
  let best = 0;
  let bestOut = Infinity;
  for (let j = 0; j < fs.length; j++) {
    const f = fs[j]!;
    const lo = -f.din / 2;
    const hi = f.dout / 2;
    const x = wrapPi(yaw - f.th);
    if (x >= lo && x < hi) return wrapOn(loop, f.s0 + ((x - lo) / (hi - lo)) * f.len);
    const out = x < lo ? lo - x : x - hi;
    if (out < bestOut) { bestOut = out; best = j; }
  }
  // ⭐ a rounding gap between two slices: the nearer slice's own end
  const f = fs[best]!;
  return wrapOn(loop, wrapPi(yaw - f.th) < 0 ? f.s0 : f.s0 + f.len);
}

/** ⭐ A FACET of the loop: its edges in line (one normal — a face split by slivers is one facet), its normal's angle, where it starts, its length, the
 * turn from the previous facet's normal to its own (`din`) and on to the next's (`dout`), counter-clockwise, in (0, π). */
interface Facet { readonly th: number; readonly s0: number; len: number; readonly din: number; dout: number }

function loopFacets(loop: SectionChain): Facet[] | null {
  const edges = loop.pts.length - 1;
  if (edges < 1 || !(loop.total > 0)) return null;
  const th = Array.from({ length: edges }, (_, i) => { const n = edgeNormal(loop, i); return Math.atan2(n[1], n[0]); });
  // ⭐ two edges in line (a face split by a sliver: the funnel's 0.9 mm next to its 100 mm side) turn by 0 and make ONE facet, their slice shared by length —
  // ⛔ the zero turn read as a full turn (2π): the slices no longer tiled the circle, the carrier jumped 49 mm for 2.9° (probed); ⛔ as two slices: the
  // sliver got half the face's turn
  const d = th.map((t, i) => { const g = wrapPi(t - th[(i - 1 + edges) % edges]!); return g < -1e-6 ? g + 2 * Math.PI : g; });
  const first = d.findIndex((g) => g > 1e-6);
  if (first < 0) return null;
  const fs: Facet[] = [];
  for (let k = 0; k < edges; k++) {
    const i = (first + k) % edges;
    const len = loop.cum[i + 1]! - loop.cum[i]!;
    if (d[i]! > 1e-6) fs.push({ th: th[i]!, s0: loop.cum[i]!, len, din: d[i]!, dout: 0 });
    else fs[fs.length - 1]!.len += len;
  }
  for (let j = 0; j < fs.length; j++) fs[j]!.dout = fs[(j + 1) % fs.length]!.din;
  return fs;
}

/** ⭐ A RUN of the gizmo along a face: its distance to the run's nearer end, the run's length, the face's outward normal (horizontal, world). */
export interface FaceRun { readonly dEdge: number; readonly run: number; readonly n: Vec3 }

/**
 * ⭐⭐ (2026-11-04, `1.0.95-`, the calm) dx's run for the calm (`orbit_calm.ts`): among the green loop's facets (its edges in line one facet) FACING the way
 * of the real face under the gizmo (`nWant`, the accepted drop's normal — within 45°), the one nearest the gizmo `p` (x, z); its distance to the nearer end,
 * its length, its normal. ⛔ The nearest facet alone: where a part sticks out of the front (Scene_1, z −0.092 at 0.145–0.217 m) the hull bridges to it and
 * the gizmo on the real front (z −0.05) is INSIDE the hull, nearer its BACK (3.2 cm against 4): the calm took the back's normal, the camera swung behind
 * the painting (probed, 121° off the front's normal).
 */
export function facetRunToward(loop: SectionChain, p: P2, nWant: Vec3): FaceRun | null {
  const fs = loopFacets(loop);
  if (fs === null) return null;
  const nl = Math.hypot(nWant[0], nWant[2]);
  if (!(nl > 1e-9)) return null;
  let best: FaceRun | null = null;
  let bestD = Infinity;
  for (const f of fs) {
    const c = Math.cos(f.th);
    const sn = Math.sin(f.th);
    if ((c * nWant[0] + sn * nWant[2]) / nl < Math.SQRT1_2) continue;
    const a = chainAt(loop, f.s0).p;
    const e = chainAt(loop, wrapOn(loop, f.s0 + f.len - 1e-12)).p;
    const dx = e[0] - a[0];
    const dz = e[1] - a[1];
    const l2 = dx * dx + dz * dz;
    const t = l2 > 0 ? Math.min(1, Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2)) : 0;
    const d = Math.hypot(a[0] + dx * t - p[0], a[1] + dz * t - p[1]);
    if (d < bestD) {
      bestD = d;
      best = { dEdge: Math.min(t, 1 - t) * f.len, run: f.len, n: [c, 0, sn] };
    }
  }
  return best;
}

/** ⭐⭐ (2026-11-04, `1.0.95-`, the calm) The stretch of the red chain at `s` whose edges are in line (one normal) — dy's run for the calm. */
export function chainRun(ch: SectionChain, s: number): { dEdge: number; run: number } | null {
  const edges = ch.pts.length - 1;
  if (edges < 1) return null;
  const at = chainAt(ch, s);
  const inLine = (i: number, j: number): boolean => { const a = edgeNormal(ch, i); const b = edgeNormal(ch, j); return Math.abs(a[0] * b[1] - a[1] * b[0]) < 1e-6 && a[0] * b[0] + a[1] * b[1] > 0; };
  let i0 = at.edge;
  while (i0 > 0 && inLine(i0 - 1, at.edge)) i0--;
  let i1 = at.edge;
  while (i1 < edges - 1 && inLine(i1 + 1, at.edge)) i1++;
  const lo = ch.cum[i0]!;
  const hi = ch.cum[i1 + 1]!;
  const x = Math.min(hi, Math.max(lo, s));
  return { dEdge: Math.min(x - lo, hi - x), run: hi - lo };
}

/** ⭐ The inverse of `loopAtYaw`: the yaw whose place is the arc length `s` (a corner: the boundary of its two slices). */
export function yawAtLoop(loop: SectionChain, s: number): number {
  const fs = loopFacets(loop);
  if (fs === null) return 0;
  const x = wrapOn(loop, s);
  let best = fs[0]!;
  let bestOut = Infinity;
  for (const f of fs) {
    const rel = wrapOn(loop, x - f.s0);
    const out = rel <= f.len ? 0 : Math.min(rel - f.len, loop.total - rel);
    if (out < bestOut) { bestOut = out; best = f; }
    if (out === 0) break;
  }
  // inside it, its share; a rounding step outside it, the nearer end
  const rel = wrapOn(loop, x - best.s0);
  const t = best.len > 0 ? (rel <= best.len ? rel / best.len : rel - best.len < loop.total - rel ? 1 : 0) : 0;
  return best.th - best.din / 2 + (t * (best.din + best.dout)) / 2;
}

/** ⭐ (2026-11-04, `1.0.95-`) Out of step, the share of the yaw's step the gizmo's own yaw gains on it (or gives back) a frame. */
export const SYNC_CATCH = 0.5;

/**
 * ⭐⭐⭐ (2026-11-04, `1.0.95-`) THE YAW'S STEP, SYNCHRONIZED — the carrier at `s`, the yaw turned by `dYaw` to `yaw`. In step it IS the yaw's place
 * (`loopAtYaw`). Out of step (after a dy onto another height's loop, the boot, the slide) the gap is read as an ANGLE — the carrier's own yaw (`yawAtLoop`)
 * against the yaw — and closed in that angle: ahead, its yaw turns at (1 − `SYNC_CATCH`) of the yaw's step, behind at (1 + `SYNC_CATCH`), until they meet.
 * ⭐ So it never jumps, never stops (⛔ a wait ahead held it half a turn while the orbit went on), never goes against the finger, and closes a gap at the
 * same rate in angle whatever the face's width (⛔ in arc length: millimetres per 90° along a 33 mm side).
 */
export function syncStep(loop: SectionChain, s: number, yaw: number, dYaw: number): number {
  if (dYaw === 0 || !(loop.total > 0)) return wrapOn(loop, s);
  const gap = wrapPi(yawAtLoop(loop, s) - (yaw - dYaw));
  if (Math.abs(gap) < 1e-9) return loopAtYaw(loop, yaw);
  const left = gap - Math.sign(gap) * Math.min(Math.abs(gap), SYNC_CATCH * Math.abs(dYaw));
  return loopAtYaw(loop, yaw + left);
}

/**
 * ⭐⭐⭐ THE YAW'S STEP on the closed green loop: the carrier at `s` moved by `ds` (+ the yaw's own sense), round and round — and it never ENTERS an edge
 * for which `faces` is false (it waits at that edge's start; inside one it is on, free). `ds` held to one lap.
 * ⚠ (2026-11-04, `1.0.95-`) NOT WIRED — dx is `loopAtYaw` + `syncStep` now; kept for the fallback (TILTED_ORBIT_REBUILD_SCOPE.md §13: by distance, paced to
 * reach each corner as its face starts facing the piece).
 */
export function loopStep(loop: SectionChain, s: number, ds: number, faces: (edge: number) => boolean): number {
  const edges = loop.pts.length - 1;
  if (ds === 0 || edges < 1 || !(loop.total > 0)) return wrapOn(loop, s);
  let left = Math.min(Math.abs(ds), loop.total);
  const dir = ds > 0 ? 1 : -1;
  let x = wrapOn(loop, s);
  // ⭐⭐⭐ (2026-11-04) within 1e-9 of a corner: ON it — ⛔ the carrier waiting at a corner is re-found each frame from its point (`nearestOnChain`), which
  // came back one rounding step short (0.4976450641787913 against the corner's 0.49764506417879134, probed): read as INSIDE the edge turned away, it ran
  // free along it — every drop turned away, the gizmo and the sections held at the corner behind it (the red gone from view), then a jump when it landed
  for (let k = 0; k <= edges; k++) if (Math.abs(x - loop.cum[k]!) < 1e-9) x = k === edges ? 0 : loop.cum[k]!;
  // ⭐ at a corner, on the edge it came along — forward the one ending there, backward the one starting there (the next one is ENTERED)
  let i = 0;
  if (dir > 0) while (i < edges - 1 && x > loop.cum[i + 1]!) i++;
  else while (i < edges - 1 && x >= loop.cum[i + 1]!) i++;
  for (let guard = 0; guard < edges * 2 + 2; guard++) {
    if (dir > 0) {
      const room = loop.cum[i + 1]! - x;
      if (left <= room) return wrapOn(loop, x + left);
      left -= room;
      const next = (i + 1) % edges;
      if (!faces(next)) return wrapOn(loop, loop.cum[i + 1]!);
      i = next;
      x = loop.cum[i]!;
    } else {
      const room = x - loop.cum[i]!;
      if (left <= room) return wrapOn(loop, x - left);
      left -= room;
      const prev = (i - 1 + edges) % edges;
      if (!faces(prev)) return wrapOn(loop, loop.cum[i]!);
      i = prev;
      x = loop.cum[i + 1]!;
    }
  }
  return wrapOn(loop, x);
}

/** ⭐ A green edge's outward normal, in the world (horizontal): its 2D normal in (x, z). */
export function greenNormal(loop: SectionChain, i: number): Vec3 {
  const n = edgeNormal(loop, i);
  return [n[0], 0, n[1]];
}

/** ⭐ Does a green edge of world normal `n` face the piece at `yaw`, `pitch`? (`n · u ≥ 0` — at ±90° every one does) */
export function greenFaces(n: Vec3, yaw: number, pitch: number): boolean {
  return Math.cos(pitch) * (n[0] * Math.cos(yaw) + n[2] * Math.sin(yaw)) >= -1e-9;
}

/** ⭐ The GREEN drop: from the carrier `w` on an edge of normal `n`, the horizontal ray back along `−n` at its height, from `reach` outside. */
export function greenDrop(w: Vec3, n: Vec3, reach: number): SectionRay {
  return { origin: [w[0] + n[0] * reach, w[1], w[2] + n[2] * reach], dir: [-n[0], 0, -n[2]], length: reach * 2 };
}

/** ⭐ `p` turned about the vertical axis through `c` by `dYaw` (the orbit's own sense: x toward z). */
export function turnAbout(p: Vec3, c: Vec3, dYaw: number): Vec3 {
  const dx = p[0] - c[0];
  const dz = p[2] - c[2];
  const cs = Math.cos(dYaw);
  const sn = Math.sin(dYaw);
  return [c[0] + dx * cs - dz * sn, p[1], c[2] + dx * sn + dz * cs];
}

/**
 * ⭐⭐ THE RED PLANE THROUGH THE GIZMO: the vertical plane along the piece's heading at `yaw` through `w` — its origin, the point of the plane closest
 * to the assembly's axis through `c` (its "centre": the clamp's vertical). ⛔ Through the centre: with dx by distance the gizmo leaves it.
 */
export function redOrigin(w: Vec3, c: Vec3, yaw: number): Vec3 {
  const { axis } = yawFrame(yaw);
  const o = (w[0] - c[0]) * axis[0] + (w[2] - c[2]) * axis[2];
  return [c[0] + axis[0] * o, c[1], c[2] + axis[2] * o];
}

/** ⭐ A heading (the orbit's azimuth convention: x = cos, z = sin) snapped onto the nearest of the world's four horizontal axes (±x, ±z). */
export function snapHeading(a: number): number {
  return Math.round(a / (Math.PI / 2)) * (Math.PI / 2);
}

/**
 * ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 4) — **THE RED PLANE'S HEADING: A WORLD PLANE, SQUARE TO THE FACE'S LEVEL AXIS** (scope §5 Step 4,
 * I1). On a side (a face normal `n` more level than steep) the vertical plane along `n` snapped onto a world axis — the plane `x = c` on a ±z face, `z = c`
 * on a ±x face — so a dy goes straight up / down the face whatever the piece's heading; over a top / under a bottom (or no face) the orbit's `yaw` snapped
 * (until Step 5's x / z lines). ⛔ `ff2fca2`: the yaw plane at the piece's heading — at a heading along the face the dy slid the gizmo ACROSS it (136 mm
 * sideways down the painting's back face, probed).
 */
export function redHeading(n: Vec3 | null, yaw: number): number {
  if (n !== null && Math.hypot(n[0], n[2]) > Math.abs(n[1])) return snapHeading(Math.atan2(n[2], n[0]));
  return snapHeading(yaw);
}

/** ⭐ The arc length of the chain's point nearest `p` among its edges of `kind` (a TOP carrier kept on a top: turned past its edge, held at it); none of that kind: `nearestOnChain`. */
export function nearestOfKind(ch: SectionChain, p: P2, kind: EdgeKind): number {
  let best: number | null = null;
  let bd = Infinity;
  for (let i = 0; i < ch.pts.length - 1; i++) {
    if (edgeKind(edgeNormal(ch, i)) !== kind) continue;
    const a = ch.pts[i]!;
    const b = ch.pts[i + 1]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    const t = l2 > 0 ? Math.min(1, Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
    const d = Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1]);
    if (d < bd) {
      bd = d;
      best = ch.cum[i]! + t * Math.sqrt(l2);
    }
  }
  return best ?? nearestOnChain(ch, p);
}

/**
 * ⭐⭐ (2026-10-29, the owner: *"the green section has a strange shape. Is it OK and playable as such ?"* → *"build that"*) — **A DRAWN SECTION JOINS TWO
 * NEIGHBOURING POINTS ONLY WHEN THEY ARE NEAR**: no farther apart than 2.5 × the samples' spacing (+ 2 mm) — a step in depth (a drop into a missing piece's
 * slot, onto another surface) breaks the line. ⛔ The green joined every pair: one jump drew a straight segment across the face. (The red's own rule, shared.)
 */
export function joins(a: Vec3, b: Vec3, spacingM: number): boolean {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) <= 2.5 * spacingM + 0.002;
}
