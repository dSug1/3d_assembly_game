/**
 * ⭐ (2026-11-04, the audit) THE BOX ROUND A SET OF POINTS — each placed part's model-space box. ⛔ (2026-11-07, §30 S1) `rayMeetsBox`, the mesh casts'
 * slab pre-reject — DELETED with the casts (the sections are exact cuts of the parts' vertices).
 *
 * ⛔ ENGINE-FREE.
 */
import type { Vec3 } from "../core/vec";

export interface Box3 {
  readonly lo: Vec3;
  readonly hi: Vec3;
}

/** ⭐ The box round a set of points; `null` for none. */
export function boxOf(points: readonly Vec3[]): Box3 | null {
  if (points.length === 0) return null;
  const lo: [number, number, number] = [Infinity, Infinity, Infinity];
  const hi: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const p of points) {
    for (let i = 0; i < 3; i++) {
      if (p[i]! < lo[i]!) lo[i] = p[i]!;
      if (p[i]! > hi[i]!) hi[i] = p[i]!;
    }
  }
  return { lo, hi };
}
