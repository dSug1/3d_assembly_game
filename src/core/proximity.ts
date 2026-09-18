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

/** What `nearestCapture` found: the body, and how far its surface is. */
export interface Capture {
  readonly target: ObjectId;
  /** Surface-to-surface, metres. ⭐ Returned so the HUD prints the number the rule compared. */
  readonly gapM: number;
}

/**
 * ⭐⭐⭐ **THE NEAREST OTHER OBJECT WITHIN CAPTURE RANGE**, or `null` — `A16`'s range condition.
 *
 * ⛔ THE OWNER'S RULE IS *"within a SnapIsPossibleRadius of ANY other object (not necessarily
 * the object with PioneerFace)"*, so this looks at the whole scene and not at the alignment.
 * ⭐ The Pioneer answers *which way is up*; the target answers *what am I docking with*, and
 * keeping them independent is what lets a hand align against one part and assemble to another.
 *
 * ⚠⚠ **AN EXACT TIE KEEPS THE CURRENT TARGET, AND THAT IS ALL IT DOES.** ⛔ This comment used
 * to call it *"hysteresis by memory"* and the 2026-09-17 audit corrected it: the comparison is
 * `===`, so an incumbent at `0.1 + 1e-13` loses to a challenger at `0.1`. ⭐ It is a TIE-BREAK.
 * ⚠ Left as it is, deliberately: real hysteresis needs a margin in millimetres that no hand has
 * judged, and *a guessed number has been wrong every single time here*. If a device pass reports
 * the highlight flickering between two candidates, this is the place, and the fix ships with a
 * slider.
 *
 * ⚠ *Nearest* was my choice and is now the owner's rule (`A21`, 2026-09-17).
 *
 * @param offsetM the capture offset in METRES — how far apart two SURFACES may be and still
 *   capture. ⛔ Computed per frame from the camera distance (`input/highlight.ts`), so it is not
 *   a constant: the owner's rule is that it shrinks as the camera comes in.
 * @param current last frame's target, for the tie rule. `null` on the first frame.
 * @param gapOf how to measure — `surfaceGap` in the product. ⭐ Injected so the tie rule and the
 *   threshold can be vectored against a stub, without building a world of geometry to do it.
 */
export function nearestCapture(
  world: World,
  held: ObjectId,
  offsetM: number,
  current: ObjectId | null,
  gapOf: (a: ObjectId, b: ObjectId) => number | null,
): Capture | null {
  let best: Capture | null = null;
  let bestGap = Infinity;
  for (const id of world.objects.keys()) {
    if (id === held) continue;
    const d = gapOf(held, id);
    if (d === null || d > offsetM) continue;
    // ⭐ Strictly nearer wins; an exact tie leaves `best` alone unless it is the incumbent.
    // ⚠ `<` and not `<=` IS the tie rule.
    if (d < bestGap) {
      best = { target: id, gapM: d };
      bestGap = d;
    } else if (d === bestGap && id === current) {
      best = { target: id, gapM: d };
    }
  }
  return best;
}
