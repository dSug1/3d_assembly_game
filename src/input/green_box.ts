/**
 * ⭐⭐ **THE GREEN BOX** (`D191`, the owner, 2026-09-30: *"add a green box in the scene. same dimensions as the smallest
 * yellow box. the green box shall always be positioned midway between the yellow target and the camera"*).
 *
 * ⭐ The *yellow target* is the orbit-centre marker (the barycentre the camera orbits, `camera_rig.ts`'s `syncCentre`); the
 * box sits at the MIDPOINT of that marker and the camera, every frame, whatever moved either. ⭐ Its size is the smallest
 * yellow body's own `dims` (the coloured core, not its transparent contour), by volume — read from the scene's data, so a
 * scene with no yellow body has no box. ⛔ A display object: not a piece, not pickable, no collision, not in the goal.
 *
 * ⛔ ENGINE-FREE.
 */
import type { BodySpec, Triple } from "../core/game_structure";
import type { Vec3 } from "../core/vec";

/** ⭐ The smallest body of `colour` (by volume) — `null` when the scene has none. Frozen bodies are not candidates. */
export function smallestOfColour(bodies: readonly BodySpec[], colour: readonly [number, number, number]): BodySpec | null {
  let best: BodySpec | null = null;
  let bestVolume = Infinity;
  for (const b of bodies) {
    if (b.frozen || !b.colour.every((c, i) => c === colour[i])) continue;
    const v = b.dims[0] * b.dims[1] * b.dims[2];
    if (v < bestVolume) {
      best = b;
      bestVolume = v;
    }
  }
  return best;
}

/** The box's size in metres — the body's authored `dims` × the scene's `unitM`. */
export function sizeM(dims: Triple, unitM: number): Vec3 {
  return [dims[0] * unitM, dims[1] * unitM, dims[2] * unitM];
}
