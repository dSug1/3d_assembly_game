/**
 * ⭐ prototype — **THE PIECE'S PLACE ROUND THE ORBIT CENTRE** — what the old ORBIT AROUND THE PIECE (2026-10-06 … 10-12, `PIECE_ORBIT.md`) left
 * that the game still reads: the piece's heading round the centre (`counterYawFrame`) and the rings' distance range (`pieceRingRangeM`).
 * ⛔ (2026-11-14, CL1) its way in / out, aim, roll steps, pushed line, scaled gap and the yaw gain round the piece were deleted — no live caller
 * since the way in was parked on 2026-10-12 (the code at `7c38150`).
 *
 * ⛔ ENGINE-FREE.
 */
import type { Vec3 } from "../core/vec";

/**
 * ⭐⭐ The piece's HEADING round the orbit centre (radians about +y, the convention of an orbit offset's `atan2(x, z)`) — read from where the
 * piece IS, so the spin with the orbit (`counterYawFrame`) follows what is drawn (2026-10-08).
 */
export function headingAbout(centre: Vec3, piece: Vec3): number {
  return Math.atan2(piece[0] - centre[0], piece[2] - centre[2]);
}

/** ⭐ The rings' closest and farthest distance from the centre (`radiusOf(v)` sampled over the whole rig). */
export function ringDistanceRange(radiusOf: (v: number) => number, samples = 64): { readonly minM: number; readonly maxM: number } {
  let minM = Infinity;
  let maxM = 0;
  for (let i = 0; i <= samples; i++) {
    const r = radiusOf(i / samples);
    minM = Math.min(minM, r);
    maxM = Math.max(maxM, r);
  }
  return { minM, maxM };
}
