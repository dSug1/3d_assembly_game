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
    // ⭐ `3D7`: the level's walls — one more blocker to the same rule.
    ...(st.playVolume ? { volume: st.playVolume } : {}),
    exempt: (a, b) => {
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

/*
 * ⛔ `D182`: the unsnap GRACE is deleted — `graceAfterUnsnap`, `pruneCollisionGrace`, `st.collisionGrace`. A just-released
 * couple was exempt from each other until it had separated past the skin; `D136` (contact allowed, only a DEEPER push
 * refused) made it unnecessary, and it let a Follower be pushed INTO its former Pioneer for as long as it was pushed —
 * the gap never grew, so the grace never ended (`COLLISION.md` §5, §11).
 */
