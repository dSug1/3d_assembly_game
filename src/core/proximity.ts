/**
 * ⭐⭐⭐ **PROXIMITY — how near is the nearest other object, and is it near enough?**
 *
 * Design of record: [`Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`] (`D46` §1, `A16`).
 *
 * ⛔⛔ **THIS SLICE IS THE HIGHLIGHTS AND NOTHING ELSE.** There is no approach, no hold-off, no
 * `SnapIsAuthorized`, no snap and no mate — so there is no closest-face pair and no face-normal
 * angle in here either. ⭐ The previous attempt built two slices deep before a hand saw any of
 * it, and the first device look overturned a rule in the first slice. This module ends where
 * something a finger can judge ends.
 *
 * ⚠⚠ `CENTRES-FOR-NOW` — the owner's note: *"for the moment we use centers of objects, later
 * in we will use distances between faces."* ⛔ Every place that would change carries that word,
 * so the switch is one search.
 *
 * ⛔ ENGINE-FREE, and every function is a QUESTION about the world rather than a change to it.
 */
import type { ObjectId, World } from "./object_model";
import { worldPlacementOf } from "./object_model";
import { sub } from "./vec";

/**
 * ⭐⭐⭐ **THE CAPTURE RADIUS — `4L`, AN ABSOLUTE DISTANCE** (the owner, 2026-09-17: *"set
 * capture radius at 4L"*), where `L` is the scene's base module.
 *
 * ⛔⛔ **THIS REPLACED A PER-OBJECT RULE, AND THE TRADE IS WORTH STATING.** The radius used to
 * be `objectSpan(candidate) × factor` — scale-free, so a bigger part captured from further away
 * with no second rule. ⚠ `4L` is one distance for the whole scene, so that property is **gone**:
 * a large part and a small one now capture at the same range.
 * ⭐ Why it is still the right call for now: `L` is the module the owner designs in — the
 * bodies are `L × 2L × 3L`, they boot `3L` apart, and the radius is `4L`. One unit, four
 * numbers, all comparable by eye at debug. ⛔ A per-object radius would have made *"4L"*
 * mean a different distance for each body, which is exactly what a debug pass does not want.
 * ⚠ If parts of very different sizes arrive, this is the thing to revisit — and
 * `objectSpan` was **deleted with the rule it served**, not left dormant.
 */
export function captureRadiusM(baseLengthM: number, factor: number): number {
  return baseLengthM * factor;
}

/** ⚠ `CENTRES-FOR-NOW`. Centre to centre, in metres. `null` if either object is gone. */
export function centreDistance(world: World, a: ObjectId, b: ObjectId): number | null {
  const pa = worldPlacementOf(world, a);
  const pb = worldPlacementOf(world, b);
  if (!pa || !pb) return null;
  const d = sub(pb.position, pa.position);
  return Math.hypot(d[0], d[1], d[2]);
}

/**
 * ⭐⭐⭐ **THE NEAREST OTHER OBJECT WITHIN CAPTURE RANGE**, or `null` — `A16`'s third condition.
 *
 * ⛔ THE OWNER'S RULE IS *"within a SnapIsPossibleRadius of ANY other object (not necessarily
 * the object with PioneerFace)"*, so this looks at the whole scene and not at the alignment.
 * ⭐ The Pioneer answers *which way is up*; the target answers *what am I docking with*, and
 * keeping them independent is what lets a hand align against one part and assemble to another.
 *
 * ⚠⚠ **AN EXACT TIE KEEPS THE CURRENT TARGET, AND THAT IS ALL IT DOES.**
 *
 * ⛔⛔ **THIS COMMENT CLAIMED MORE THAN THE CODE DELIVERS AND WAS CORRECTED BY AUDIT,
 * 2026-09-17.** It said *"two objects at the same distance would otherwise swap every frame as
 * the last bit of a float wobbled"* and called the rule *"hysteresis by MEMORY rather than by a
 * second threshold"*. ⚠ The rule compares with `===`, so it holds the incumbent only when the
 * two distances are bit-for-bit equal: an incumbent at `0.1 + 1e-13` loses to a challenger at
 * `0.1`, measured. ⭐ So it is a TIE-BREAK, not hysteresis, and it does not do the job the
 * sentence promised.
 *
 * ⚠ **Left as it is, deliberately.** Real hysteresis needs a margin — *how much nearer must a
 * challenger be to take the target* — and that is a distance in millimetres that no hand has
 * judged. ⛔ `IN5`: a guessed number has been wrong every single time here. ⭐ The honest state
 * is a rule that does what it says and a comment that does not oversell it; if a device pass
 * reports the highlight flickering between two candidates, this is the place, and the fix is a
 * slider shipped WITH the rule.
 *
 * ⚠ *Nearest* is my choice and not the owner's — `D46` §6.1 records that, and a device pass can
 * overturn it.
 *
 * @param radiusM the capture radius in METRES — `4L` = 320 mm on this scene. ⚠ One distance
 *   for every candidate since 2026-09-17; see `captureRadiusM` for what that gave up.
 * @param current last frame's target, for the tie rule. `null` on the first frame.
 */
export function nearestCapture(
  world: World,
  held: ObjectId,
  radiusM: number,
  current: ObjectId | null,
): ObjectId | null {
  let best: ObjectId | null = null;
  let bestDistance = Infinity;
  for (const id of world.objects.keys()) {
    if (id === held) continue;
    const d = centreDistance(world, held, id);
    if (d === null || d > radiusM) continue;
    // ⭐ Strictly nearer wins; an exact tie leaves `best` alone unless it is the incumbent.
    // ⚠ `<` and not `<=` IS the tie rule.
    if (d < bestDistance) {
      best = id;
      bestDistance = d;
    } else if (d === bestDistance && id === current) {
      best = id;
    }
  }
  return best;
}
