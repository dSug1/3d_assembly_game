/**
 * ⭐⭐⭐ prototype — **THE ORBIT AROUND THE PIECE** (the owner, 2026-10-06: *"when resting face is aligned, the orbit center moves to the
 * piece, the rest orbit around the piece"*; then: the piece *"still pushed by dy"*; dx / dy drive the *"camera on rings"* — dx turns it
 * around the piece, dy moves it through the rings' pitches — *"dy also pushes"* the piece toward the pink gizmo; the move *"the same as
 * when the orbit center is moved in the scene (camera catches up while orbiting, etc.)"*; the pink ring *"stays at the old centre"*; back
 * *"never automatically"*).
 *
 * From the resting-face alignment on:
 * - the PIECE is pushed along a STRAIGHT LINE through the orbit centre (the pink gizmo) — the direction it had at the alignment, frozen —
 *   at the distance the rings give it at the rig's ring parameter (`orbitOffset`'s length, as today): dy moves it exactly as fast as
 *   before, dx no longer moves it;
 * - the CAMERA's orbit centre glides from the old centre to the piece, by FINGER TRAVEL over `orbitBlendDistanceMm` (eased — the scene's
 *   own centre move, `OrbitCentreBlend`), and then follows the piece; the camera orbits it at the rings' angles (dx yaw, dy pitch) and
 *   looks at it.
 *
 * ⛔ ENGINE-FREE.
 */
import type { Vec3 } from "../core/vec";

/** ⭐ The mode's state: the frozen push direction (unit, from the orbit centre out to the piece), where the camera's centre glides from,
 * and the finger travel fed to that glide so far. */
export interface PieceOrbit {
  readonly dir: Vec3;
  readonly fromM: Vec3;
  readonly travelledMm: number;
}

/** ⭐ At the alignment: the push direction from the orbit centre to the piece (`fallbackDir` when the piece sits ON the centre), the
 * glide starting at the orbit centre itself — so nothing moves on the frame it starts. */
export function startPieceOrbit(centre: Vec3, piece: Vec3, fallbackDir: Vec3): PieceOrbit {
  const v: Vec3 = [piece[0] - centre[0], piece[1] - centre[1], piece[2] - centre[2]];
  const n = Math.hypot(v[0], v[1], v[2]);
  const dir: Vec3 = n > 1e-9 ? [v[0] / n, v[1] / n, v[2] / n] : fallbackDir;
  return { dir, fromM: centre, travelledMm: 0 };
}

/** ⭐ One step of finger travel, millimetres (the drag that drives the orbit). */
export function advancePieceOrbit(p: PieceOrbit, travelMm: number): PieceOrbit {
  return travelMm > 0 ? { ...p, travelledMm: p.travelledMm + travelMm } : p;
}

/** ⭐ The glide's share, eased in and out (smoothstep, as `OrbitCentreBlend`); a budget of zero is no glide. */
export function pieceOrbitProgress(p: PieceOrbit, budgetMm: number): number {
  if (budgetMm <= 0) return 1;
  const t = Math.min(1, p.travelledMm / budgetMm);
  return t * t * (3 - 2 * t);
}

/** ⭐ The piece: on the frozen line through the orbit centre, at `distM` from it. */
export function pushedPiece(centre: Vec3, dir: Vec3, distM: number): Vec3 {
  return [centre[0] + dir[0] * distM, centre[1] + dir[1] * distM, centre[2] + dir[2] * distM];
}

/** ⭐ The camera's orbit centre: from where the glide started to the piece AS IT IS NOW — so once there it follows the piece. */
export function cameraCentre(p: PieceOrbit, piece: Vec3, budgetMm: number): Vec3 {
  const t = pieceOrbitProgress(p, budgetMm);
  return [p.fromM[0] + (piece[0] - p.fromM[0]) * t, p.fromM[1] + (piece[1] - p.fromM[1]) * t, p.fromM[2] + (piece[2] - p.fromM[2]) * t];
}
