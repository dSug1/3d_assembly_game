/**
 * ⭐⭐⭐ **PROXIMITY — how near is the nearest other object, and is it near enough?**
 *
 * Design of record: [`Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`] (`D46` §1, `A16`,
 * and **`D49` §19** for the surface rule).
 *
 * ⛔⛔ **IT IS A SURFACE GAP NOW, NOT A CENTRE DISTANCE** (the owner, 2026-09-18: *"I want to
 * modify that to an offset to the faces of the object"*). ⭐ The base plate is what forced it
 * and the audit had already measured the damage: a `6L × 0.3L × 9L` body has its centre `3L`
 * below its own top face, so a part **resting on the plate** read as 312 mm away while a part
 * hovering high above its middle read as near. ⚠ **No radius value fixes that** — the error is
 * the body's own half-extent, which differs per body, per axis and per orientation.
 *
 * ⭐⭐⭐ **BUT ONLY THE DISTANCE MOVED TO SURFACES — THE DIRECTION MUST NOT.** `D46` replaced
 * the earlier `TargetPosition` design precisely because a finger mapped onto a *face-to-face*
 * direction collapses to noise exactly at contact, where precision matters most. ⛔ Centres
 * cannot meet, so the approach direction stays centre-to-centre and `centreDistance` below is
 * kept for it. ⚠ `APPROACH_AND_MATE.md` §18 flagged this migration as *not a free upgrade* for
 * exactly this reason; splitting the two quantities is what makes it one.
 *
 * ⚠⚠ **AND IT QUIETLY GIVES BACK THE SCALE-FREEDOM `4L` GAVE UP, WHICH IS A REAL CHANGE.** An
 * absolute centre radius meant a big part and a small part captured at the same *centre
 * separation*; a surface offset means they capture at the same *clearance*. ⭐ That is almost
 * certainly what a hand wants — a plate should capture at the same visible gap as a part — but
 * it reverses a decision taken deliberately on 2026-09-17, so it is stated rather than
 * discovered. ⛔ The number's MEANING changed with it, so its old value carries no information.
 *
 * ⛔ ENGINE-FREE, and every function is a QUESTION about the world rather than a change to it.
 */
import { gapBetween } from "./collision_shape";
import type { ObjectId, World } from "./object_model";
import { worldPlacementOf } from "./object_model";
import type { Vec3 } from "./vec";
import { add, qRotate, sub } from "./vec";

/**
 * ⭐⭐ **NOT WIRED — RESERVED FOR THE APPROACH DIRECTION, AND DECLARED RATHER THAN DELETED.**
 *
 * ⛔⛔ Nothing calls this today; `A16`'s capture test reads `surfaceGap` instead. ⚠ It is kept
 * because `D46` §4b.1 maps the finger's travel onto the **centre → centre** line, and that is
 * the one quantity in this mechanism that must NOT become face-based: a face-to-face direction
 * shrinks to noise at contact, which is the degeneracy the whole design was rebuilt to remove.
 * ⭐ Same precedent as `alignmentMatchesTarget` in `input/highlight.ts`: a pure predicate that
 * nothing calls cannot change behaviour, and *deleted, not disabled* is a rule about forks,
 * flags and detectors that own a verdict.
 *
 * Centre to centre, in metres. `null` if either object is gone.
 */
export function centreDistance(world: World, a: ObjectId, b: ObjectId): number | null {
  const pa = worldPlacementOf(world, a);
  const pb = worldPlacementOf(world, b);
  if (!pa || !pb) return null;
  const d = sub(pb.position, pa.position);
  return Math.hypot(d[0], d[1], d[2]);
}

/**
 * A body's collision points in WORLD space, or `null` if it has no shape or no placement.
 *
 * ⛔ IT READS THE MODEL, NOT THE DISPLAY POSE. The sway and the follower are decoration —
 * `display_pose.ts` owns `SWAY ∘ FOLLOW ∘ model`, and what the eye sees is deliberately not
 * where the object IS. ⚠ Measuring capture against the swayed pose would make a highlight
 * flicker with an animation nobody asked it to track, and the barycentre already learned this.
 */
export function worldShapePoints(world: World, id: ObjectId): Vec3[] | null {
  const o = world.objects.get(id);
  if (!o?.shape || o.shape.points.length === 0) return null;
  const at = worldPlacementOf(world, id);
  if (!at) return null;
  return o.shape.points.map((p) => add(at.position, qRotate(at.orientation, p)));
}

/**
 * ⭐⭐⭐ **THE GAP BETWEEN TWO BODIES' SURFACES, IN METRES** — `0` when they touch or overlap,
 * `null` when either body is missing, unplaced, or has no shape.
 *
 * ⛔ `null` is *out of range*, never *in range*. A body whose shape failed to build would
 * otherwise capture everything in the scene from any distance, and the failure would look like
 * a feature. `LESSONS_CARRIED` §6: a degenerate input returns null, never a default.
 */
export function surfaceGap(world: World, a: ObjectId, b: ObjectId): number | null {
  const pa = worldShapePoints(world, a);
  const pb = worldShapePoints(world, b);
  if (!pa || !pb) return null;
  return gapBetween(pa, pb);
}

