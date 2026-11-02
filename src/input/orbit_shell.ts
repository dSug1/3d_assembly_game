/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"if the piece is orbiting close to the assembly and pass next to a protruding part, the orbit stops … it's a
 * no-man's-land"*; *"I do not like the fact that there is no continuity in the movement of the piece if I keep orbiting in one direction … the orbit
 * direction can be thrown off quite a bit despite the user keeping a constant delta position direction and pace"* → *"Build the shell"*; *"Add a slider
 * for the shell offset in the camera orbit around center menu"*) — **THE SHELL**: the piece is driven on a SMOOTH CONVEX SHELL round the assembly, never
 * on the parts.
 * * The shell at level `s`: the points `s` from the placed parts' BOUNDING BOX (about the assembly's centre: `shellBox`) — the EUCLIDEAN distance
 *   (`shellLevel`): flat over a face, a cylinder over an edge, a sphere over a corner. Convex and smooth (C¹) at every level, its levels parallel: no
 *   overhang, no step, no inner corner. ⛔ (built first) the norm of the overshoots of a 26-sided bound's planes: away from the assembly a point stands
 *   in front of half of them — the level counted ~2× the distance, the piece at half its approach's distance and twice the pace.
 * * THE BASE POINT (`basePoint`): the orbit's direction `u` spread by the box's proportions at its level (`chartDir` — a flat assembly's face is covered
 *   evenly, ⛔ from its centre the ray grazed it: 87° of direction for a 27 cm half-face) onto the shell at the approach's
 *   distance `d` beyond the OFFSET (`orbitShellOffsetMm`), at the offset within it (`baseLevel`), with its normal `n`. ⛔ (built first) always at the
 *   offset: 6 m out along the normal of a 6 cm rounding, the piece swung round a whole edge in a few centimetres of the base point — 23° a frame.
 * * THE PIECE (`placeAlong`): the base point beyond the offset; within it along `n`, blended (smoothstep) toward the REAL surface under the piece
 *   (`groundDepth`: how deep under the base point along `n`), on it at the contact. The
 *   approach goes STRAIGHT IN along the shell's normal; the geometry changes how far along it, never the way the piece moves: that is the finger's.
 * * The screen's up CARRIED with the motion (`carryUp`: no roll while the finger moves — over the top the view goes on as a loop), levelled to gravity
 *   once nothing moves (`levelUp`, `easeUp`).
 * ⛔ ENGINE-FREE. A bounding box's distance, a scaled direction, bisection, a minimal rotation — textbook; no licence, no patent.
 */
import { cross, dot, normalize, qFromAxisAngle, qRotate, shortestArc, type Vec3 } from "../core/vec";

/** ⭐ The shell's box: the placed parts' extent from the centre (`lo` ≤ 0 ≤ `hi` per axis, m). */
export interface ShellBox {
  readonly lo: Vec3;
  readonly hi: Vec3;
}

/** ⭐ The placed parts' bounding box about the centre `c`. */
export function shellBox(parts: readonly (readonly Vec3[])[], c: Vec3): ShellBox {
  const lo = [0, 0, 0];
  const hi = [0, 0, 0];
  for (const vs of parts) for (const v of vs) for (let k = 0; k < 3; k++) {
    const x = v[k]! - c[k]!;
    lo[k] = Math.min(lo[k]!, x);
    hi[k] = Math.max(hi[k]!, x);
  }
  return { lo: [lo[0]!, lo[1]!, lo[2]!], hi: [hi[0]!, hi[1]!, hi[2]!] };
}

/** ⭐ How far `p` (from the centre) stands outside the box, per axis (0 inside its slab). */
function outside(p: Vec3, b: ShellBox): Vec3 {
  const o = (k: 0 | 1 | 2): number => (p[k] > b.hi[k] ? p[k] - b.hi[k] : p[k] < b.lo[k] ? p[k] - b.lo[k] : 0);
  return [o(0), o(1), o(2)];
}

/** ⭐ The shell's level at `p` (from the centre): its Euclidean distance to the box — 0 inside it. */
export function shellLevel(p: Vec3, b: ShellBox): number {
  const o = outside(p, b);
  return Math.hypot(o[0], o[1], o[2]);
}

/** ⭐ The shell's outward normal at `p` (from the nearest point of the box); `null` inside it. */
export function shellNormal(p: Vec3, b: ShellBox): Vec3 | null {
  return normalize(outside(p, b));
}

/** ⭐ How far along the unit ray `w` from the centre the shell at level `s` (> 0) lies (m) — by halving between the box's own limits. */
export function shellRadius(w: Vec3, b: ShellBox, s: number): number {
  const lv = Math.max(1e-6, s);
  // the distance lies between the largest axis's overshoot and √3 × it: the root between where that reaches lv / √3 and lv
  let lo = Infinity;
  let hi = Infinity;
  for (let k = 0; k < 3; k++) {
    const c = w[k]!;
    if (Math.abs(c) <= 1e-9) continue;
    const face = c > 0 ? b.hi[k]! : -b.lo[k]!;
    const a = Math.abs(c);
    hi = Math.min(hi, (lv + face) / a);
    lo = Math.min(lo, (lv / Math.sqrt(3) + face) / a);
  }
  if (!Number.isFinite(hi)) return 0;
  lo = Math.max(0, lo);
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    if (shellLevel([w[0] * m, w[1] * m, w[2] * m], b) < lv) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/** ⭐ The box's half-sizes from the centre + `s` (the chart's spread). */
function spread(b: ShellBox, s: number): Vec3 {
  return [Math.max(-b.lo[0], b.hi[0]) + s, Math.max(-b.lo[1], b.hi[1]) + s, Math.max(-b.lo[2], b.hi[2]) + s];
}

/** ⭐ The orbit's direction `u` spread by the box's proportions (at the offset `s`): the ray from the centre the base point lies on. */
export function chartDir(u: Vec3, b: ShellBox, s: number): Vec3 {
  const e = spread(b, s);
  return normalize([u[0] * e[0], u[1] * e[1], u[2] * e[2]]) ?? u;
}

/** ⭐ …and back: the orbit's direction whose ray is `w`. */
export function chartInverse(w: Vec3, b: ShellBox, s: number): Vec3 {
  const e = spread(b, s);
  return normalize([w[0] / e[0], w[1] / e[1], w[2] / e[2]]) ?? w;
}

/**
 * ⭐ THE BASE POINT at the orbit's direction `u`: on the shell at the level `s` along `chartDir` (from the centre — spread at the OFFSET `spreadS` whatever
 * the level, so the approach keeps to one ray: ⛔ spread at its own level, the ray turned as the piece came in — it landed 22 cm aside of the gizmo), and
 * the shell's normal there.
 */
export function basePoint(u: Vec3, b: ShellBox, s: number, spreadS: number = s): { readonly p: Vec3; readonly n: Vec3 } {
  const w = chartDir(u, b, spreadS);
  const r = shellRadius(w, b, s);
  const p: Vec3 = [w[0] * r, w[1] * r, w[2] * r];
  return { p, n: shellNormal(p, b) ?? w };
}

/** ⭐ The real surface's share of the piece's place at the approach's distance `d`: 1 at the contact, 0 from the shell's offset out. */
export function groundShare(d: number, offsetM: number): number {
  if (!(offsetM > 0)) return d <= 0 ? 1 : 0;
  const x = Math.min(1, Math.max(0, d / offsetM));
  return 1 - x * x * (3 - 2 * x);
}

/** ⭐ The shell's level the base point lies on at the approach's distance `d`: the piece's own beyond the offset, the offset within it. */
export function baseLevel(d: number, offsetM: number): number {
  return Math.max(d, offsetM);
}

/**
 * ⭐⭐ THE PIECE ALONG THE NORMAL from its base point (m, out positive) at the approach's distance `d`: none beyond the offset (the base point is on the
 * shell at level `d`: `baseLevel`); within it `d − offset`, blended toward `d − depth` (`depth`: the real surface under the base point along the normal;
 * `null`: none, the shell alone) — on the parts at the contact.
 */
export function placeAlong(d: number, offsetM: number, depth: number | null): number {
  if (d >= offsetM) return 0;
  const shell = d - offsetM;
  if (depth === null) return shell;
  const w = groundShare(d, offsetM);
  return (1 - w) * shell + w * (d - depth);
}

/**
 * ⭐ The real surface's lag eased out: fast where the surface comes OUT toward the piece (a protrusion — the piece rises over it before its side reaches
 * it), slower where it goes back (a recess).
 */
export const GROUND_OUT_TAU_MS = 40;
export const GROUND_IN_TAU_MS = 150;
export function easeLag(lag: number, dtMs: number): number {
  if (!(dtMs > 0)) return lag;
  // a positive lag: the surface stands out nearer than drawn (its depth has shrunk, the lag holds the old one) — eased fast
  const tau = lag > 0 ? GROUND_OUT_TAU_MS : GROUND_IN_TAU_MS;
  const next = lag * Math.exp(-dtMs / tau);
  return Math.abs(next) < 1e-6 ? 0 : next;
}

/**
 * ⭐ THE REAL SURFACE UNDER THE PIECE, as a plane (`p` a point on it, `m` its normal — both from the centre) and a `lag` (m) still eased out: how deep
 * under the base point `b` along the normal `n` it lies (`groundDepth`). A plane, not a point: across a flat face the depth follows exactly (no lag); a
 * normal grazing it is held to `GROUND_GRAZE` of its cosine.
 */
export interface GroundPlane {
  readonly p: Vec3;
  readonly m: Vec3;
  readonly lag: number;
}
export const GROUND_GRAZE = 0.2;
export function groundDepth(b: Vec3, n: Vec3, g: GroundPlane): number {
  const k = (b[0] - g.p[0]) * g.m[0] + (b[1] - g.p[1]) * g.m[1] + (b[2] - g.p[2]) * g.m[2];
  return k / Math.max(GROUND_GRAZE, dot(n, g.m)) + g.lag;
}

/**
 * ⭐ The ground after a frame: the plane found (`hit`, `null`: none — kept), its lag carried so the depth under (`b`, `n`) does not jump where the plane
 * changes (a step, an edge — eased out: `easeLag`), eased over `dtMs`.
 */
export function groundAfter(g: GroundPlane | null, hit: { p: Vec3; m: Vec3 } | null, b: Vec3, n: Vec3, dtMs: number): GroundPlane | null {
  let next: GroundPlane | null = g;
  if (hit !== null) {
    const same = g !== null && dot(g.m, hit.m) > 0.9999 && Math.abs(dot(g.m, g.p) - dot(hit.m, hit.p)) < 1e-4;
    if (g === null) next = { p: hit.p, m: hit.m, lag: 0 };
    else if (!same) next = { p: hit.p, m: hit.m, lag: groundDepth(b, n, g) - groundDepth(b, n, { p: hit.p, m: hit.m, lag: 0 }) };
  }
  if (next === null) return null;
  return { ...next, lag: easeLag(next.lag, dtMs) };
}

/**
 * ⭐ THE SURFACE UNDER THE PIECE'S FOOTPRINT, from the parts themselves (each a convex body's vertices, from the centre): of the parts whose outline across
 * the normal `n` overlaps the disc of `radiusM` round the base point `b` (their box there against the disc), the outermost along `n` — how far out from
 * `b` it stands (m, `null`: none). A protrusion anywhere under the disc lifts the piece; a part is taken whole (a slanted face as its outermost corner).
 * ⛔ (built first) rays down the normal in rings: a 4 cm overhang just above the piece passed between them.
 */
export function footprintHeight(parts: readonly (readonly Vec3[])[], b: Vec3, n: Vec3, radiusM: number): number | null {
  const ax = normalize(cross(n, [0, 1, 0])) ?? normalize(cross(n, [1, 0, 0])) ?? [1, 0, 0];
  const bx = normalize(cross(n, ax)) ?? [0, 0, 1];
  let best: number | null = null;
  for (const vs of parts) {
    let lo0 = Infinity, hi0 = -Infinity, lo1 = Infinity, hi1 = -Infinity, h = -Infinity;
    for (const v of vs) {
      const d: Vec3 = [v[0] - b[0], v[1] - b[1], v[2] - b[2]];
      const x = dot(d, ax);
      const y = dot(d, bx);
      lo0 = Math.min(lo0, x);
      hi0 = Math.max(hi0, x);
      lo1 = Math.min(lo1, y);
      hi1 = Math.max(hi1, y);
      h = Math.max(h, dot(d, n));
    }
    // the disc against the part's box across the normal
    const cx = Math.min(hi0, Math.max(lo0, 0));
    const cy = Math.min(hi1, Math.max(lo1, 0));
    if (cx * cx + cy * cy > radiusM * radiusM) continue;
    if (best === null || h > best) best = h;
  }
  return best;
}

/** ⭐ `v` laid square to the unit `dir`, unit; `null` along it. */
function flat(v: Vec3, dir: Vec3): Vec3 | null {
  const k = dot(v, dir);
  return normalize([v[0] - k * dir[0], v[1] - k * dir[1], v[2] - k * dir[2]]);
}

/** ⭐ THE SCREEN'S UP CARRIED from the view `from` to the view `to` (unit): turned with it by the least rotation — no roll while the finger moves. */
export function carryUp(up: Vec3, from: Vec3, to: Vec3): Vec3 {
  const r = qRotate(shortestArc(from, to), up);
  return flat(r, to) ?? flat(up, to) ?? flat([0, 1, 0], to) ?? [1, 0, 0];
}

/** ⭐ The view's LEVEL up: the world's up laid square to `dir` while the view is more than `LEVEL_STEEP_DEG` off the vertical; `null` steeper. */
export const LEVEL_STEEP_DEG = 30;
export function levelUp(dir: Vec3): Vec3 | null {
  if (Math.abs(dir[1]) > Math.cos((LEVEL_STEEP_DEG * Math.PI) / 180)) return null;
  return flat([0, 1, 0], dir);
}

/** ⭐ The up eased toward `target` about the view `dir` (τ `tauMs`). */
export const LEVEL_TAU_MS = 150;
export function easeUp(cur: Vec3, target: Vec3, dir: Vec3, dtMs: number, tauMs: number = LEVEL_TAU_MS): Vec3 {
  const a = flat(cur, dir);
  const b = flat(target, dir);
  if (a === null || b === null) return b ?? cur;
  const ang = Math.atan2(dot(cross(a, b), dir), dot(a, b));
  // no time, no change; no τ, at once
  const k = !(dtMs > 0) ? 0 : tauMs > 0 ? 1 - Math.exp(-dtMs / tauMs) : 1;
  return Math.abs(ang) < 1e-4 ? b : qRotate(qFromAxisAngle(dir, ang * k), a);
}

/** ⭐ A step `v` laid along the surface whose normal is `n` (its part along `n` dropped). */
export function alongSurface(v: Vec3, n: Vec3): Vec3 {
  const k = dot(v, n);
  return [v[0] - n[0] * k, v[1] - n[1] * k, v[2] - n[2] * k];
}
