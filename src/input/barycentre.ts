/**
 * A RAY in world metres — what the assembly orbit casts (`render/assembly_wiring.ts`).
 * ⛔ (2026-11-14, CL1) §2 rule 1's barycentre centre (`barycentreCandidates`, `orbitCentre`, `nearestPairCentre`, `distanceToRay`) deleted: its one
 * caller, the empty-space press's retarget, was switched off on 2026-10-02 (the code at `7c38150`).
 */
import type { Vec3 } from "../core/vec";

/** A ray in world metres. ⚠ `direction` need not be normalised. */
export interface Ray {
  readonly origin: Vec3;
  readonly direction: Vec3;
}
