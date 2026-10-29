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
 * the piece when the axis lies outside it), walked counter-clockwise from the BOTTOM point on the cut to the TOP one — up the piece's side, the clamp at
 * both ends (the ±90° of pitch: under the centre, over it). `null`: no area.
 */
export function facingChain(hull: readonly P2[]): SectionChain | null {
  if (hull.length < 3) return null;
  const r0 = Math.max(0, Math.min(...hull.map((p) => p[0])));
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
 * ⭐⭐ THE SECTION DRAWN — the path the gizmo takes: the RED one, `count` arc lengths along the chain (the carrier's own `s` in place of the nearest, so
 * the gizmo lies on the line exactly). (⛔ `greenYaws` deleted: the green line is the green loop now.)
 */
export function redSamples(total: number, s: number, count: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < count; k++) out.push(count > 1 ? (total * k) / (count - 1) : 0);
  if (count > 1) out[Math.min(count - 1, Math.max(0, Math.round((s / (total || 1)) * (count - 1))))] = Math.min(total, Math.max(0, s));
  return out;
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

/** ⭐ An arc length brought onto the loop's one lap [0, total). */
export function wrapOn(loop: SectionChain, s: number): number {
  const t = loop.total;
  return t > 0 ? ((s % t) + t) % t : 0;
}

/**
 * ⭐⭐⭐ THE YAW'S STEP on the closed green loop: the carrier at `s` moved by `ds` (+ the yaw's own sense), round and round — and it never ENTERS an edge
 * for which `faces` is false (it waits at that edge's start; inside one it is on, free). `ds` held to one lap.
 */
export function loopStep(loop: SectionChain, s: number, ds: number, faces: (edge: number) => boolean): number {
  const edges = loop.pts.length - 1;
  if (ds === 0 || edges < 1 || !(loop.total > 0)) return wrapOn(loop, s);
  let left = Math.min(Math.abs(ds), loop.total);
  const dir = ds > 0 ? 1 : -1;
  let x = wrapOn(loop, s);
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
