/**
 * ⭐⭐⭐ (2026-11-02) **THE SHELL**, engine-free: how far from its gizmo the orbited piece stands. The piece is on the ray from the gizmo along its direction
 * `u` (the camera behind it, the sections under it — as before); how far along that ray is read off a SMOOTH SHELL round the placed parts' bounding box —
 * the points whose Euclidean distance to the box is a level (`shellLevel`: flat over a face, round over an edge and a corner), never off the gizmo alone:
 * * beyond the shell's OFFSET (`orbitShellOffsetMm`) the piece is where the ray from the gizmo reaches the shell at the approach's distance — so a gizmo
 *   that steps in DEPTH (an overhang's edge, a recess) leaves the piece where it is: the ray from the new gizmo reaches the same shell;
 * * within the offset it comes down onto the gizmo itself (smoothstep) — at the contact on the parts.
 * A step in depth close in is taken into the approach (`alongToDistance` inverts `pieceAlong`, `approachOfDistance` the approach's curve).
 * ⛔ (2026-11-02, built first, REVERTED) the piece placed on the shell by the orbit's direction from the centre, the finger moving it along the screen and
 * the gizmo a readout: the red section's plane rolled off the vertical, the camera's up with it. The shell decides a DISTANCE here, nothing else. ⚠ The
 * floor does not stop the orbit (seen from below it is see-through, it collides with nothing): the piece orbits under it, the camera follows.
 * ⛔ ENGINE-FREE. A box's distance, bisection — textbook; no licence, no patent.
 */
import type { Vec3 } from "../core/vec";

/** ⭐ The shell's box: the placed parts' extent in the world. */
export interface ShellBox {
  readonly lo: Vec3;
  readonly hi: Vec3;
}

/** ⭐ The placed parts' bounding box (each part a list of its vertices); `null` with none. */
export function shellBox(parts: readonly (readonly Vec3[])[]): ShellBox | null {
  let lo: number[] | null = null;
  let hi: number[] | null = null;
  for (const vs of parts) for (const v of vs) {
    lo = lo === null ? [v[0], v[1], v[2]] : [Math.min(lo[0]!, v[0]), Math.min(lo[1]!, v[1]), Math.min(lo[2]!, v[2])];
    hi = hi === null ? [v[0], v[1], v[2]] : [Math.max(hi[0]!, v[0]), Math.max(hi[1]!, v[1]), Math.max(hi[2]!, v[2])];
  }
  return lo === null || hi === null ? null : { lo: [lo[0]!, lo[1]!, lo[2]!], hi: [hi[0]!, hi[1]!, hi[2]!] };
}

/** ⭐ The shell's level at `p`: its Euclidean distance to the box (0 inside it). */
export function shellLevel(p: Vec3, b: ShellBox): number {
  let s = 0;
  for (let k = 0; k < 3; k++) {
    const o = p[k]! > b.hi[k]! ? p[k]! - b.hi[k]! : p[k]! < b.lo[k]! ? p[k]! - b.lo[k]! : 0;
    s += o * o;
  }
  return Math.sqrt(s);
}

/**
 * ⭐ How far along the unit `u` from `g` the shell reaches `level` (m) — the level only grows along a ray leaving the box, so by halving between 0 and where
 * the box's own extent plus the level is surely passed; `g` already beyond it: 0.
 */
export function rayToLevel(g: Vec3, u: Vec3, b: ShellBox, level: number): number {
  if (shellLevel(g, b) >= level) return 0;
  const diag = Math.hypot(b.hi[0] - b.lo[0], b.hi[1] - b.lo[1], b.hi[2] - b.lo[2]);
  let lo = 0;
  let hi = level + diag;
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    if (shellLevel([g[0] + u[0] * m, g[1] + u[1] * m, g[2] + u[2] * m], b) < level) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/** ⭐ The gizmo's share of the piece's distance at the approach's distance `d`: 1 at the contact, 0 from the shell's offset out (smoothstep). */
export function gizmoShare(d: number, offsetM: number): number {
  if (!(offsetM > 0)) return d <= 0 ? 1 : 0;
  const x = Math.min(1, Math.max(0, d / offsetM));
  return 1 - x * x * (3 - 2 * x);
}

/**
 * ⭐⭐ HOW FAR ALONG `u` FROM THE GIZMO `g` THE PIECE STANDS at the approach's distance `d`: the ray reaching the shell at `max(d, offset)`, blended within
 * the offset onto `d` itself (the gizmo's share) — on the gizmo at the contact. No box: `d` (the old rule).
 */
export function pieceAlong(g: Vec3, u: Vec3, d: number, offsetM: number, b: ShellBox | null): number {
  if (b === null) return d;
  const w = gizmoShare(d, offsetM);
  return (1 - w) * rayToLevel(g, u, b, Math.max(d, offsetM)) + w * d;
}

/** ⭐ …and back: the approach's distance (in [0, `maxD`]) at which the piece stands `want` along `u` from `g` (`pieceAlong` grows with it: by halving). */
export function alongToDistance(g: Vec3, u: Vec3, want: number, offsetM: number, b: ShellBox | null, maxD: number): number {
  let lo = 0;
  let hi = maxD;
  if (pieceAlong(g, u, lo, offsetM, b) >= want) return lo;
  if (pieceAlong(g, u, hi, offsetM, b) <= want) return hi;
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    if (pieceAlong(g, u, m, offsetM, b) < want) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

