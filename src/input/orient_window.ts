/**
 * ⭐⭐ prototype — **THE CANDIDATE DIRECTION** (`RESTING_FACE_ALIGNMENT.md` §21, §25). ⛔ (2026-10-12) the orientation window it once placed is
 * deleted (its boot corner, its two-cursor slider, its overlay clearance, its cursor follow); the candidate stays — the PINK direction of the
 * resting-face quads. ⛔ No engine, no DOM.
 */

/**
 * ⭐⭐ (2026-10-12, the owner: *"the face of the cube which normal is pointing the most to the camera is the candidate support face"*) — of the
 * facets (as drawn: world normal and centre), the one whose normal points most toward `eye` (seen from its own centre); a facet that stands for
 * no direction (`tag < 0`) is never one. −1 with none.
 */
export function candidateFace(
  facets: readonly { readonly tag: number; readonly normal: readonly [number, number, number]; readonly centre: readonly [number, number, number] }[],
  eye: readonly [number, number, number],
): number {
  let cand = -1;
  let best = -Infinity;
  for (const f of facets) {
    if (f.tag < 0) continue;
    const t = [eye[0] - f.centre[0], eye[1] - f.centre[1], eye[2] - f.centre[2]];
    const len = Math.hypot(t[0]!, t[1]!, t[2]!) || 1;
    const k = (f.normal[0] * t[0]! + f.normal[1] * t[1]! + f.normal[2] * t[2]!) / len;
    if (k > best) {
      best = k;
      cand = f.tag;
    }
  }
  return cand;
}

/**
 * ⭐⭐ (2026-10-12, the owner: *"make sure that the radius and height of the 1st and 4th rings are such that the horizontal quad can become yellow
 * when the piece is at the maximum distance … it shall remain the case for max distance = 5m or whatever the max distance is"* → *"capture that
 * last point in the md files so that there is an alert if the 1st and 4th rings radius and heights are changed by the sliders"*) — the vertical
 * direction is the candidate at SOME yaw when the camera, seen from the resting face, stands more than `atan(1/√2)` = 35.26° above (or below)
 * it: at a diagonal yaw a side reads `cos(el)/√2`, the top `sin(el)`. `elevationDeg` the camera's elevation from the resting face.
 */
export const HORIZONTAL_QUAD_MIN_ELEVATION_DEG = (Math.atan(Math.SQRT1_2) * 180) / Math.PI;
export function horizontalQuadReachable(elevationDeg: number): boolean {
  return Math.abs(elevationDeg) > HORIZONTAL_QUAD_MIN_ELEVATION_DEG;
}
