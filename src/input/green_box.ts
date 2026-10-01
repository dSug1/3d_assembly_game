/**
 * ⭐⭐ **THE GREEN BOX** (prototype (green box), the owner, 2026-09-30: *"add a green box in the scene. same dimensions as the smallest
 * yellow box. the green box shall always be positioned midway between the yellow target and the camera"*).
 *
 * ⭐ The *yellow target* is the orbit-centre marker (the barycentre the camera orbits, `camera_rig.ts`'s `syncCentre`); the
 * box sits at the MIDPOINT of that marker and the camera, every frame, whatever moved either. ⭐ Its size is the smallest
 * yellow body's own `dims` (the coloured core, not its transparent contour), by volume — read from the scene's data, so a
 * scene with no yellow body has no box. ⛔ A display object: not a piece, no collision, not in the goal — and since
 * 2026-10-01 SOLID to the finger: a press on it is EMPTY SPACE (`throughGreenBox`).
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

/**
 * ⭐⭐ prototype (green box) — **A PRESS ON THE GREEN BOX IS EMPTY SPACE** (the owner, 2026-10-01: *"when I click on the green
 * box, the raycast hits the piece behind"* → *"option 1: implement"*). ⛔ The box was unpickable, so the ray went THROUGH it
 * and grabbed the piece behind. ✅ It is pickable now, so the ray STOPS there — and this turns that hit into a MISS before
 * any rule reads it: the finger orbits, as on empty space, and the box is never held, aligned or steered like a piece.
 */
export function throughGreenBox<M>(hit: M | null, greenBox: M | null): M | null {
  return hit !== null && greenBox !== null && hit === greenBox ? null : hit;
}

/**
 * ⭐ prototype (green box) — **THE GREEN PYRAMID'S SOURCE** (the owner, 2026-10-02: *"replace the green box by a green trapezoidal
 * pyramid (same type as the one in scene 0). Dimensions = 150 % dimensions of the piece 17"*): the body named `id`, or `null`
 * when the scene has none (then there is no green piece at all).
 */
export function bodyNamed(bodies: readonly BodySpec[], id: string): BodySpec | null {
  return bodies.find((b) => b.id === id) ?? null;
}

/**
 * ⭐ The green pyramid's size, metres: the body's core `dims` × `unitM` × 150 % on every side (the owner, 2026-10-02), then
 * the HEIGHT halved (*"divide the height of the green piece by 2"*, the same day) — so the height is × 0.75 — and the LENGTH
 * (its longest side, the width) cut by 25 % (*"reduce the length of the green piece by 25%"*) — so the width is × 1.125.
 */
export function greenPyramidSizeM(dims: Triple, unitM: number): Vec3 {
  const [w, h, d] = sizeM(dims, unitM);
  return [w * 1.5 * 0.75, (h * 1.5) / 2, d * 1.5];
}

/** One hit along the camera's ray to the yellow target: how far, and whether it is the green piece. */
export interface RingHit {
  readonly distanceM: number;
  readonly isGreenBox: boolean;
}

/**
 * ⭐⭐ prototype (green box) — **THE PINK RING'S OCCLUSION** (the owner, 2026-10-02: *"The pink gizmo ring is occludable by any
 * other object except frozen object. If the green box occludes the pink gizmo ring, the pink gizmo ring becomes slightly
 * translucent (to show that it is masked by the green box but still visible)"*). `hits` are what the camera's ray meets on
 * the way to the target — frozen bodies already left out by the caller. A hit counts only if it is NEARER than the target by
 * more than `epsM`: the piece the target sits ON is met right at it, and must not hide it.
 * * any piece in front → `HIDDEN`; * only the green piece → `TRANSLUCENT`; * nothing → `VISIBLE`.
 */
export function pinkRingVisibility(
  hits: readonly RingHit[],
  targetDistM: number,
  epsM: number,
): "VISIBLE" | "TRANSLUCENT" | "HIDDEN" {
  let green = false;
  for (const h of hits) {
    if (!(h.distanceM < targetDistM - epsM)) continue;
    if (!h.isGreenBox) return "HIDDEN";
    green = true;
  }
  return green ? "TRANSLUCENT" : "VISIBLE";
}
