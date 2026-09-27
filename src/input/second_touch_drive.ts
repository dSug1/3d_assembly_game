/**
 * ⭐⭐⭐ **WHAT A SECOND TOUCH DRIVES — one axis the mode picks, or both at once.**
 *
 * ⛔⛔ **THE PINNED PIONEER IS DELETED** (`D109`, the owner, 2026-09-27: *"5- OK to delete"*). It
 * was `D51`'s flag (`pioneerTranslates = 0`): a finger on a held Follower's Pioneer stopped the
 * Pioneer and drove the Follower's roll and depth together. ⭐ `D59` had already generalised its
 * reason — an aligned Follower has ONE rotational DOF left, so there is nothing for a mode to pick
 * — and `D108` made that body mode-less everywhere, so the pinned pair was a second route to the
 * answer every aligned Follower now gets.
 * ⚠ A Pioneer held beside its Follower now TRANSLATES, like any held body.
 *
 * ⛔ ENGINE-FREE, and every function answers a question rather than changing anything.
 */
import type { MotionState } from "./motion";

/**
 * ⭐⭐⭐ **AN ALIGNED FOLLOWER'S SECOND FINGER DRIVES BOTH AXES AT ONCE** (`D59`, `D108`).
 *
 * ⛔ Contrast `secondFingerDrive`, which returns one axis and zero for the other because the
 * movement mode picks between them. ⚠ The difference is the owner's, stated in the same
 * sentence that asked for this rule, and it is recorded at the top of this file.
 *
 * ⭐ Per axis, the question is only *is this axis moving?* — `A11`'s hysteretic state, never a
 * speed invented here. ⛔ A second definition of *moving* would be free to disagree with the one
 * every other rule is judged by.
 */
export function bothAxesSecondDrive(
  axes: { readonly x: MotionState; readonly y: MotionState },
  step: { readonly dx: number; readonly dy: number },
): { readonly rollDxPx: number; readonly depthDyPx: number } {
  return {
    rollDxPx: axes.x === "MOVING" ? step.dx : 0,
    depthDyPx: axes.y === "MOVING" ? step.dy : 0,
  };
}

/** Where the driving second touch went down. ⛔ `IN2`'s roles, named for what they MEAN here. */
export type SecondTouchPlace =
  /** Outside every object — `A10`'s anchor, and the commonest second finger. */
  | "OUTSIDE"
  /** On the very object the first touch is carrying — `A12`'s finger, `IN2`'s `SECOND` role. */
  | "SAME_OBJECT";

/**
 * ⭐⭐⭐ **`D59` — DOES THE SECOND TOUCH GIVE BOTH AXES, OR DOES THE MODE PICK ONE?**
 *
 * > *"whatever translation mode, when an object is aligned as follower the second touch shall
 * > control the depth and the roll (as this is currently the case when the second touch hit the
 * > Pioneer object)"* — the owner, 2026-09-19
 *
 * ⛔⛔ **THE RULE IS NOW ABOUT THE BODY, NOT ABOUT WHERE THE FINGER LANDED.** `D51` gave both
 * axes to a finger on the **Pioneer**; the owner has generalised the reason behind it — *an
 * aligned Follower has one rotational DOF left, so there is nothing for a mode to choose between.*
 * ⭐ A free body still has three, and `A16`'s split still earns its keep there.
 *
 * ⭐⭐ **AND IT SETTLES THE `A16` COLLISION `D58` OPENED, FOR ALIGNED BODIES.** `D58` flips the
 * movement mode when a finger presses outside; `secondFingerDrive` used that same mode to pick
 * roll-or-depth, so the channel alternated on every touch. ⛔ Where the mode no longer picks,
 * that cannot happen. ⚠ **The collision survives on a FREE body**, which this rule does not
 * reach — stated because it is the part a device pass must still judge.
 *
 * ⚠⚠ **WHAT IT DOES *NOT* FIX, AND THE OWNER NAMED IT**: *"rotation mode: the second touch
 * drives only the roll … and conflicts with the dx or dy of the first touch."* ⛔ In `ROTATE` an
 * aligned body's FIRST touch twists about the same constraint axis the second's `dx` turns, so two
 * fingers drive **one DOF**. ⭐ Matching the Pioneer case preserves that overlap rather than
 * removing it — it is present there too, and removing it is a separate rule about what the first
 * touch does while a second is down.
 *
 * ⛔ `SAME_OBJECT` is deliberately untouched: the owner's sentence says *outside any object*, and
 * `A12`'s finger shares a body with the holder where a diagonal would smear one axis into the
 * other by accident — the argument `bothAxesSecondDrive` opens this file with.
 */
export function secondTouchDrive(
  _place: SecondTouchPlace,
  heldIsAlignedFollower: boolean,
): "BOTH" | "MODE_PICKS" {
  // ⭐⭐ `D108`: on an aligned Follower the second touch drives gravity + spin WHEREVER it lands —
  // on empty space or on the body itself — because the body has no mode left to pick one.
  if (heldIsAlignedFollower) return "BOTH";
  return "MODE_PICKS";
}
