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
 * ⛔ Contrast `secondFingerDrive` (`depth_translate.ts`), which returns one axis and zero for the
 * other because the movement mode picks between them — used when `secondTouchDrive` answers
 * `MODE_PICKS`.
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

// ⛔ `SecondTouchPlace` is DELETED (audit 2026-09-27): since `D108` the drive depends on the BODY and the
// mode, never on where the finger landed, and the parameter was ignored.
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
 * ⭐ A free body in `ROTATE` still has the mode's pick; in `TRANSLATE` it takes both (`D123`).
 *
 * ⚠ History: `D58`'s press toggle made the picked channel alternate on every touch (deleted with
 * the press toggle, `D66`), and in `ROTATE` an aligned body's FIRST touch once twisted about the
 * same axis as the second's `dx` — two fingers on one DOF — until `D108` made an aligned body
 * mode-less (its first touch always translates).
 *
 * ⭐ Where the finger landed no longer matters (`D108`): a second finger on the held body itself
 * (`A12`'s `SECOND`) is decided by this same table as one on empty space.
 */
export function secondTouchDrive(
  heldIsAlignedFollower: boolean,
  /**
   * ⭐⭐ `D123` (the owner, 2026-09-27: *"If an object is not aligned, I cannot reach the roll around
   * gravity axis … I should be able to roll the object around the gravity axis (same as what is
   * possible when the object is aligned)"*): a FREE body in `TRANSLATE` takes both too — `dy` lifts
   * it, `dx` spins it about GRAVITY, the aligned body's pair with gravity for the normal.
   * ⛔ `ROTATE` keeps the mode's pick (roll about the depth axis), so all three turns stay reachable.
   */
  mode: "TRANSLATE" | "ROTATE",
): "BOTH" | "MODE_PICKS" {
  // ⭐⭐ `D108`: on an aligned Follower the second touch drives gravity + spin WHEREVER it lands —
  // on empty space or on the body itself — because the body has no mode left to pick one.
  if (heldIsAlignedFollower) return "BOTH";
  if (mode === "TRANSLATE") return "BOTH";
  return "MODE_PICKS";
}
