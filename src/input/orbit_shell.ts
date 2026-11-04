/**
 * ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 2; the owner: *"include the concept of the shell offset: it was good to filter out the bumps due to
 * protrusions or holes on the section contours"*) — **THE SHELL**, engine-free (ported from the suspended branch's 2026-11-02 build, `1.0.92-`): how far
 * from its gizmo the orbited piece stands. The piece is on the ray from the gizmo along its direction `u`; how far along that ray is read off a SMOOTH
 * SHELL round the placed parts' bounding box — the points whose Euclidean distance to the box is a level (`shellLevel`: flat over a face, round over an
 * edge and a corner), never off the gizmo alone:
 * * beyond the shell's OFFSET (`orbitShellOffsetMm`) the piece is where the ray from the gizmo reaches the shell at the approach's distance — so a gizmo
 *   that steps in DEPTH (a protrusion's edge, a recess, a notch) leaves the piece and the camera where they are: the ray from the new gizmo reaches the
 *   same shell;
 * * within the offset it comes down onto the gizmo itself (smoothstep, `gizmoShare`) — at the contact on the real surface.
 * The orbit's centre (the piece's, the camera's) is the gizmo's FOOT (`shellAnchor`: the piece's place less the approach's distance along `u`); the
 * gizmo itself, its ring, stay on the real surface.
 * ⛔ (2026-11-02, built first on the suspended branch, REVERTED there) the piece placed on the shell by the orbit's direction from the centre, the gizmo a
 * readout: the red section's plane rolled off the vertical. The shell decides a DISTANCE here, nothing else.
 * ⛔ ENGINE-FREE. A box's distance, bisection — textbook; no licence, no patent.
 */
import { qconj, qRotate, type Quat, type Vec3 } from "../core/vec";

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

/** ⭐ The piece's REACH toward the gizmo — the farthest of its hull's points (`points`, the piece's frame, turned by `q`) along `−u`; none: 0. */
export function pieceReach(points: readonly Vec3[], q: Quat, u: Vec3): number {
  const l = qRotate(qconj(q), [-u[0], -u[1], -u[2]]); // −u in the piece's frame
  let m = 0;
  for (const p of points) m = Math.max(m, p[0] * l[0] + p[1] * l[1] + p[2] * l[2]);
  return m;
}

/** ⭐ The gizmo's share of the piece's distance at the approach's distance `d`: 1 at the contact, 0 from the shell's offset out (smoothstep). */
export function gizmoShare(d: number, offsetM: number): number {
  if (!(offsetM > 0)) return d <= 0 ? 1 : 0;
  const x = Math.min(1, Math.max(0, d / offsetM));
  return 1 - x * x * (3 - 2 * x);
}

/**
 * ⭐⭐ HOW FAR ALONG `u` FROM THE GIZMO `g` THE PIECE STANDS at the approach's distance `d`: the ray reaching the shell at `max(d, offset)`, blended within
 * the offset onto `d` itself (the gizmo's share) — on the gizmo at the contact. No box: `d` (the old rule). ⭐ The share read from the piece's SURFACE:
 * `reachM` (the piece's own extent toward the gizmo) taken off `d` — ⛔ (2026-11-04, probed) read from its centre, at the contact (`d` 43 mm, the piece's
 * thickness) the foot stood 81 % on the shell: the piece 14–30 mm off the face, the slide never latched, the piece jumped with the held gizmo.
 */
export function pieceAlong(g: Vec3, u: Vec3, d: number, offsetM: number, b: ShellBox | null, reachM: number = 0): number {
  if (b === null) return d;
  const w = gizmoShare(Math.max(0, d - Math.max(0, reachM)), offsetM);
  return (1 - w) * rayToLevel(g, u, b, Math.max(d, offsetM)) + w * d;
}

/**
 * ⭐⭐⭐ THE GIZMO'S FOOT — the orbit's centre the piece and the camera read: the piece's place on the shell (`pieceAlong`) less the approach's distance
 * along `u` — so the piece is `foot + u·d` as before, and a step of the gizmo in depth moves the gizmo, never the foot. ⭐ The foot's shift CAPPED at the
 * offset (the scope: *"a notch shallower than the offset"*): ⛔ uncapped, a direction grazing the gizmo's face (a drop held on a face turned away, at the
 * contact) ran the ray through the box — the foot swung with the direction, the piece jumped 40 mm, the camera 25 cm (probed, Scene_1).
 */
export function shellAnchor(g: Vec3, u: Vec3, d: number, offsetM: number, b: ShellBox | null, reachM: number = 0): Vec3 {
  const e = pieceAlong(g, u, d, offsetM, b, reachM) - d;
  return [g[0] + u[0] * e, g[1] + u[1] * e, g[2] + u[2] * e];
}
