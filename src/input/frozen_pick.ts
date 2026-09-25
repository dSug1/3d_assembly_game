/**
 * ⭐⭐⭐ **A TOUCH ON A FROZEN BODY THAT COULD NOT DO ANYTHING IS HANDED OVER AS A MISS.**
 *
 * > *"If any frozen object receives a second touch, treat this second touch as if it was not
 * > raycast hitting any object (therefore, this second touch could for example move another
 * > object)."* — the owner, 2026-09-23, `D77`
 *
 * ## ⛔⛔⛔ `D89` — THE CARVE-OUT FOLLOWS THE **ROLE**, AND `D87` MOVED IT
 *
 * ⚠⚠ `D77` discarded the **second** touch and spared the **first**, for exactly one reason: `D67`
 * had put the **Pioneer** on the first touch, so the plate had to stay holdable or it would have
 * left the alignment model entirely. ⛔ `D87` reversed those roles — the Pioneer is the body being
 * **pressed** now — and `D77` went on guarding the finger the Pioneer had left.
 *
 * ⭐⭐ **SO THE TWO TOUCHES SWAP.** A **first** touch on a frozen body is the useless one now: a
 * held body is the FOLLOWER, and a frozen body is refused that role, so holding the plate can no
 * longer produce any alignment at all. ⭐ It becomes the miss, and that finger goes to work as an
 * `OUTSIDE` touchpoint — which is the whole of `D77`'s intent, aimed at the finger that now
 * qualifies. ⛔ A **second** touch keeps its hit, because that is the press that names a Pioneer.
 *
 * ⭐⭐⭐ `METHOD`: *a guard written in terms of WHICH FINGER is a guard that a role inversion
 * silently aims at the wrong one.* ⚠ Neither `D77` nor `D87` mentions the other, and nothing could
 * go red: the rule was still true as written, about a finger that had stopped mattering.
 *
 * ⚠⚠ **WHAT IT COSTS, AND `D77` WAS WRITTEN FOR EXACTLY THIS**: a finger resting on the plate
 * while a part is held now latches the plate (role `OBJECT`) and selects it as a Pioneer, instead
 * of driving the held part's roll or depth. ⭐ The owner chose it with that named: *the plate is
 * the thing most parts are aligned to*, and an alignment you cannot reach is worse than a channel
 * you can reach another way.
 *
 * ## ⛔⛔ WHY IT IS DECIDED HERE AND NOT IN THE ROUTER
 *
 * `PointerRouter` is generic over an **opaque** object handle: it knows that two touchpoints
 * landed on the same thing, and deliberately nothing else. ⚠ Teaching it about `frozen` would
 * make `IN2`'s role table depend on the object model, and the roles are the one part of the
 * input layer that has no opinions about geometry.
 *
 * ⭐ So the pick is filtered **on the way in**: the router is handed `null`, and every rule
 * downstream — the role latch, `A12`'s roll, `A10`'s depth, the `SECOND` pairing — sees a
 * touchpoint that landed on nothing. ⛔ One place, before the latch, so there is no state that
 * could disagree with the role afterwards.
 *
 * ⛔ ENGINE-FREE, and generic over the handle for the same reason the router is.
 */

/**
 * The hit to hand `PointerRouter.press`, given what the ray found.
 *
 * @param hit what the ray hit, or `null`.
 * @param isFrozen whether THAT body is frozen. ⚠ Asked of the caller rather than read here:
 *   this module has no world, which is what keeps it a decision instead of a lookup.
 * @param touchpointsAlreadyDown how many touchpoints were live **before** this press. ⭐ `0`
 *   means this is the first touch, and since `D89` that is the one dropped on a frozen body.
 *   ⛔ It is a COUNT and not a boolean, because the rule has to answer the third and fourth
 *   finger too — and those are presses that CAN name a Pioneer, so they keep their hit.
 */
export function pressHit<O>(
  hit: O | null,
  isFrozen: boolean,
  touchpointsAlreadyDown: number,
): O | null {
  if (hit === null) return null;
  if (!isFrozen) return hit;
  // ⛔ A negative or non-finite count cannot say which touch this is, and DROPPING a pick is the
  // change of behaviour — so a count that makes no sense leaves the pick alone.
  if (!Number.isFinite(touchpointsAlreadyDown) || touchpointsAlreadyDown < 0)
    return hit;
  // ⭐ `> 0` — every touch but the first keeps its hit, so the plate is pressable as a Pioneer.
  return touchpointsAlreadyDown > 0 ? hit : null;
}
