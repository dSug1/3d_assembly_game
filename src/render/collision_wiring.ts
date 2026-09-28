/**
 * ⭐⭐⭐ `3D6` — **COLLISION, WIRED.** The rules are `core/collision.ts`'s; this file only chooses
 * the two SOURCES (the composition seam) and supplies the scene's facts.
 *
 * ⭐⭐ **THE ONE LINE THAT CHANGES WHEN BLENDER SHAPES LAND** (`3D8`, `3D9`): `SHAPES` and `BOUNDS`
 * below. Everything else — the rule, its vectors, every writer — stays as it is.
 */
import { boundsFromShapes, hullAtSpawn, resolveMove, type CollisionSetup, type MoveVerdict } from "../core/collision";
import type { ObjectId } from "../core/object_model";
import type { Placed } from "../core/mate_connector";
import { surfaceGap } from "../core/proximity";
import { mmToPx } from "../core/units";
import { trackingMetresPerPx } from "../input/translate";
import type { SceneState } from "./scene_state";

// ⭐⭐ THE SEAMS — today the hull computed at spawn, and its box.
const SHAPES = hullAtSpawn;
const BOUNDS = boundsFromShapes(SHAPES);

const pairKey = (a: ObjectId, b: ObjectId): string => (a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`);

/**
 * The collision ALLOWANCE in world metres — how far a body may sink into another (`D136`):
 * millimetres on the glass through the camera's tracking factor (rule 3).
 */
export function skinM(st: SceneState): number {
  return (
    mmToPx(st.cfg.collisionSkinMm) *
    trackingMetresPerPx(st.camera.radius, st.camera.fov, st.canvas.clientHeight)
  );
}

export function collisionSetup(
  st: SceneState,
  /**
   * ⭐ A couple exempt for THIS write only — the snap's own lerp names its Follower and Pioneer.
   * ⛔⛔ It must not be inferred from `seatSnaps.has`: `SeatSnaps.advance` removes a snap BEFORE it
   * hands back the landing step, so the last write of every snap was tested against its own
   * Pioneer and CANCELLED (the owner's three reports of 2026-09-27, one cause).
   */
  alsoExempt: readonly [ObjectId, ObjectId] | null = null,
): CollisionSetup {
  return {
    shapes: SHAPES,
    bounds: BOUNDS,
    skinM: skinM(st),
    exempt: (a, b) => {
      if (st.collisionGrace.has(pairKey(a, b))) return true;
      if (alsoExempt !== null && pairKey(a, b) === pairKey(alsoExempt[0], alsoExempt[1])) return true;
      // ⭐ SNAPPING: the couple is MEANT to meet at gap 0 (`COLLISION.md` §5).
      const snapping = (f: ObjectId, p: ObjectId) =>
        st.seatSnaps.has(f) && st.links.pioneerFor(f)?.objectId === p;
      return snapping(a, b) || snapping(b, a);
    },
  };
}

/** ⭐ The guarded move — what `setModelPose` writes instead of the asked pose. */
export function guardMove(
  st: SceneState,
  id: ObjectId,
  target: Placed,
  alsoExempt: readonly [ObjectId, ObjectId] | null = null,
): MoveVerdict {
  const v = resolveMove(st.world, id, target, collisionSetup(st, alsoExempt));
  if (v.blockedBy !== null) {
    st.lastCollision = `${id}⟂${v.blockedBy} ${Math.round(v.t * 100)}%${v.slid ? " slid" : ""}`;
    st.lastCollisionAt = performance.now();
    st.hudDirty = true;
  }
  return v;
}

/**
 * ⭐ A couple that has JUST unsnapped starts at gap 0: it is exempt from each other until it has
 * separated past the skin once (`COLLISION.md` §5), then ordinary.
 */
export function graceAfterUnsnap(st: SceneState, follower: ObjectId, pioneer: ObjectId): void {
  st.collisionGrace.add(pairKey(follower, pioneer));
}

/** Once a frame: a grace pair that has separated past the skin is ordinary again. */
export function pruneCollisionGrace(st: SceneState): void {
  if (st.collisionGrace.size === 0) return;
  const skin = skinM(st);
  for (const key of [...st.collisionGrace]) {
    const [a, b] = key.split("\u0000") as [ObjectId, ObjectId];
    const g = surfaceGap(st.world, a, b);
    if (g === null || g > skin) st.collisionGrace.delete(key);
  }
}
