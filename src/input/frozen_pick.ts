/**
 * ⭐⭐⭐ **A SECOND TOUCH ON A FROZEN BODY IS A MISS.**
 *
 * > *"If any frozen object receives a second touch, treat this second touch as if it was not
 * > raycast hitting any object (therefore, this second touch could for example move another
 * > object)."* — the owner, 2026-09-23
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
 * touchpoint that landed on nothing, which is exactly what the owner asked for. ⛔ One place,
 * before the latch, so there is no state that could disagree with the role afterwards.
 *
 * ## ⭐⭐ WHAT IT BUYS, IN THE OWNER'S OWN WORDS
 *
 * *"this second touch could for example move another object"* — an `OUTSIDE` touchpoint is a
 * working second finger: it drives the held body's **roll** or **depth** by the mode, and it is
 * what rule 6's second touchpoint has always been. ⛔ Before this, a finger landing on the base
 * plate was a touch on a BODY, so it tried to become a Follower (which `frozen` then refused)
 * and its channel was lost for the duration of the hold. ⚠ The plate is the one thing on the
 * glass a hand is most likely to rest a finger on, which is what makes this worth a rule.
 *
 * ## ⚠ THE FIRST TOUCH IS UNAFFECTED, AND THAT IS DELIBERATE
 *
 * A frozen body may still be **picked up as a Pioneer** — `D67` makes *hold the plate FIRST*
 * the way to align a part to it, and `frozen` was never about selection: it refuses to MOVE
 * (`object_model.ts`, at its writers) and to be a Follower. ⛔ Filtering the first touch too
 * would delete the base plate from the alignment model entirely.
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
 *   means this is the first touch. ⛔ It is a COUNT and not a boolean *is this the second*,
 *   because the rule binds the third and fourth finger too — a hand resting on the plate does
 *   not stop being a hand resting on the plate at the third finger.
 */
export function pressHit<O>(
  hit: O | null,
  isFrozen: boolean,
  touchpointsAlreadyDown: number,
): O | null {
  if (hit === null) return null;
  if (!isFrozen) return hit;
  // ⚠ `> 0` — the first touch keeps its hit, so a frozen body can still be held as a Pioneer.
  // ⛔ A negative or non-finite count is treated as *first touch*: the conservative direction is
  // to leave the pick alone, because dropping one is the change of behaviour.
  return touchpointsAlreadyDown > 0 ? null : hit;
}
