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

/**
 * ⭐⭐⭐ (2026-11-05, the probes: a close-in dx stalled at `Scene_1`'s front-left corner, the piece against Piece3's front) — **THE PIECE'S SUPPORT AT THE
 * GIZMO, NOT ITS RESTING FACE'S CENTRE**: the piece is placed by its resting face's centre (`placeByFaceCentre`), and the approach's end put that centre ON
 * the gizmo whatever the direction — a contact only while the direction is the face's normal (a face's middle, the calm). Round an edge the direction
 * turns, the resting face not yet: its centre on a side's gizmo, the rest of the face behind the front's plane — in the part. The lift: how far the
 * piece's hull (`points`, its frame, turned by `q`) reaches past its resting face's centre `rc` toward the gizmo (along `−u`) — 0 square to the face
 * (unchanged in a face's middle), the face's overhang as the direction tilts: the piece's nearest point, not its face's centre, is the approach's
 * distance from the gizmo. A convex edge is then rounded with the piece's support on it — never into the next face. Smooth in `u`: no jump.
 */
export function faceLift(points: readonly Vec3[], q: Quat, rc: Vec3, u: Vec3): number {
  const l = qRotate(qconj(q), [-u[0], -u[1], -u[2]]); // −u in the piece's frame
  let m = 0;
  for (const p of points) m = Math.max(m, (p[0] - rc[0]) * l[0] + (p[1] - rc[1]) * l[1] + (p[2] - rc[2]) * l[2]);
  return m;
}
