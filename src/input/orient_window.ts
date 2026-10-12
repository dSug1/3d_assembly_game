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
