/**
 * ⭐⭐⭐ prototype — **THE GIZMO'S SUPPORTING FACE AS THE MATING FACE** (2026-10-14, the owner: *"when there is no quad shown, the yellow
 * highlight appears on the surface supporting the yellow gizmo and this surface serves as the mating face (therefore, a tap on the piece's face
 * will align with this mating face instead of the quad which is not shown, etc.), when the quads reappear the yellow highlight fades from the
 * part's face and the rotation is done on the quad (same as current). This will therefore toggle the piece rotation between quad and part's
 * face."*; `RESTING_FACE_ALIGNMENT.md` §26). Pure: the face found, the direction shown.
 */
import type { Vec3 } from "../core/vec";
import { distanceToTriangles } from "./hover";

/** ⭐ The gizmo lies on a face within this of its plane and of its outline (m): it sits on the coloured face, 1.5 mm inside the contour. */
export const SUPPORT_TOL_M = 0.003;

export interface SupportCandidate {
  /** the face's outward normal and a point of its plane (the collision contour's) */
  readonly normal: Vec3;
  readonly centre: Vec3;
  /** the face as drawn (the coloured core's triangles) */
  readonly triangles: readonly (readonly [Vec3, Vec3, Vec3])[];
}

/**
 * ⭐ The face SUPPORTING the gizmo at `g`: within `tolM` of its plane and of its triangles (laid on its plane), the nearest plane first; `-1`
 * with none (the gizmo in the air).
 */
export function supportFaceIndex(g: Vec3, faces: readonly SupportCandidate[], tolM = SUPPORT_TOL_M): number {
  let best = -1;
  let bestD = Infinity;
  faces.forEach((f, i) => {
    const d = Math.abs(f.normal[0] * (g[0] - f.centre[0]) + f.normal[1] * (g[1] - f.centre[1]) + f.normal[2] * (g[2] - f.centre[2]));
    if (d > tolM || d >= bestD) return;
    const s = f.normal[0] * (g[0] - f.centre[0]) + f.normal[1] * (g[1] - f.centre[1]) + f.normal[2] * (g[2] - f.centre[2]);
    const on: Vec3 = [g[0] - f.normal[0] * s, g[1] - f.normal[1] * s, g[2] - f.normal[2] * s];
    if (f.triangles.length > 0 && distanceToTriangles(on, f.normal, f.triangles) > tolM) return;
    best = i;
    bestD = d;
  });
  return best;
}

/**
 * ⭐⭐ The direction SHOWN — the one a tap on empty space, on a quad's side or on the piece's face aligns to: with the quads HIDDEN (the piece
 * near the gizmo) the gizmo's supporting face (`supportTag`, when the level has its direction), else the one tapped, else the candidate; `-1`
 * with none.
 */
export function shownDirectionTag(quadsShown: boolean, supportTag: number, clickedTag: number | null, candidate: number): number {
  if (!quadsShown && supportTag >= 0) return supportTag;
  return clickedTag ?? candidate;
}

/** ⭐ The support face's yellow, faded in while the quads are hidden and out when they show: `alpha` moved toward its target at `1 / fadeMs`. */
export const SUPPORT_FADE_MS = 250;
export function supportAlpha(alpha: number, visible: boolean, dtMs: number, fadeMs = SUPPORT_FADE_MS): number {
  const step = fadeMs > 0 ? Math.max(0, dtMs) / fadeMs : 1;
  return visible ? Math.min(1, alpha + step) : Math.max(0, alpha - step);
}
