/**
 * ⭐⭐⭐ **A TOUCH ON A FROZEN BODY IS HANDED OVER AS A MISS — EVERY TOUCH, SINCE `D119`.**
 *
 * > *"If any frozen object receives a second touch, treat this second touch as if it was not
 * > raycast hitting any object (therefore, this second touch could for example move another
 * > object)."* — the owner, 2026-09-23, `D77`
 *
 * ⭐⭐ `D119` (2026-09-27) generalised it: the first touch AND the second are misses, so a finger
 * over the plate drives the held body's gravity and roll like empty space, and a **TAP** on the
 * plate aligns the held body to the face under it (resolved at the release). ⚠ The one exception
 * is the caller's: a frozen body carrying a SEATED follower is holdable, the unsnap's first touch.
 *
 * ⚠ History: `D89` (2026-09-25) had swapped `D77`'s carve-out after `D87` inverted the roles —
 * the FIRST touch became the miss and the second kept its hit to press the plate as a Pioneer.
 * ⭐ `METHOD` from it: *a guard written in terms of WHICH FINGER is a guard that a role inversion
 * silently aims at the wrong one.* `D119`'s tap-to-align made the carve-out unnecessary.
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
 */
export function pressHit<O>(hit: O | null, isFrozen: boolean): O | null {
  // ⭐⭐ `D119` (the owner, 2026-09-27): a FROZEN body is a miss for EVERY touch — the second finger
  // over it drives the held body's gravity and roll like empty space. ⛔ `D89` kept the second touch's
  // hit so the plate could be pressed as a Pioneer; a TAP on it still aligns (resolved at release).
  // ⚠ The unsnap's first touch on a loaded plate is admitted by the caller (`isFrozen` false).
  if (hit === null) return null;
  return isFrozen ? null : hit;
}

/**
 * ⭐⭐⭐ **`D124` — A SECOND PRESS ON ANOTHER BODY STEERS; IT NEVER GRABS IT** (the owner, 2026-09-27:
 * *"In mobile, I can translate two objects at the same time which is a possibility not available in
 * desktop. Therefore, if a first touch is hold on an object, a second touch hold on another object
 * should not translate the other object, it shall serve as gravity / roll input to the first object
 * movement. Note that I am not referring to a second touch tap (which serves to align)"*).
 *
 * ⭐ With a body already held, a press on a DIFFERENT body is routed as empty space — it drives the
 * held body's gravity / roll — and its face is remembered, so a TAP there still aligns (`D119`).
 * ⛔ Two exceptions, both kept on purpose: the held body ITSELF (`SECOND`, `A12`'s finger), and the held
 * body's SEATED PARTNER — the unsnap's second touch lands on the seated Follower.
 * ⚠ Narrowed by the 2026-09-27 audit: it was *the held body's whole ASSEMBLY*, so two parts seated on
 * the one plate were siblings, and holding one and pressing the other still GRABBED it.
 */
export function pressSteers(f: {
  readonly holdersBefore: number;
  readonly hitIsHeld: boolean;
  readonly seatedPartnerOfHeld: boolean;
}): boolean {
  return f.holdersBefore > 0 && !f.hitIsHeld && !f.seatedPartnerOfHeld;
}
