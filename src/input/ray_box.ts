/**
 * ⭐⭐ (2026-11-04, the audit) **DOES A RAY SEGMENT MEET A BOX?** — the slab test, the face map's pre-reject: a section line casts up to ~600 rays a frame,
 * each against every placed part (`modelCast`, `render/assembly_wiring.ts`); a part whose model-space box the ray misses is skipped before any mesh test.
 * ⚠ CONSERVATIVE by `margin` (a hit on the box's skin is never refused); a zero direction component is a slab the origin must lie in.
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

