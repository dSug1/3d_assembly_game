/**
 * ⭐⭐⭐ **`D142` — A SEATED FOLLOWER IN ITS GOAL POSE LETS GO OF ITS PIONEER** (the owner, 2026-09-28:
 * *"when a follower object has snapped and is in its goal transform, unhighlight the pioneer and the
 * follower and reset the pioneer and follower so that the couple pioneer - follower disappear"*, and
 * *"when dissolve on goal, make a pop up in the HUD so the user can see one piece has reached its
 * goal"*). ENGINE-FREE.
 *
 * ⭐ The couple has done its job — the piece is where the level wants it — so the alignment, the seat,
 * the highlights and the cursor go, and the piece stays exactly where it is. ⭐ "In its goal transform"
 * is `core/goal.ts`'s verdict: in place RELATIVE to the others, a box's face or its opposite, within
 * the goal tolerances. ⛔ Only a SEATED follower ("has snapped"): an aligned one still on its way keeps
 * its couple.
 *
 * ⭐⭐ **`D143` — AND AT THAT MOMENT A MATE SETS THE SPIN** (the owner, 2026-09-28: *"complete D142 by
 * adding a mate which orients the spin to the correct angle at the moment the follower-pioneer is
 * dissolved"*). The goal accepts a piece within its margins (the snap cone since `D183`); the mate removes what is left of
 * the error about the FollowerFace normal — the one degree of freedom the snap leaves free — so the
 * piece lands on its goal spin exactly. ⛔ ONLY the spin: the face stays flush (its normal unchanged)
 * and its centre stays where the snap put it, because the turn is about that normal, through that
 * centre. ⛔ Any tilt left in the error is not the mate's to correct: the snap owns the normal.
 */
import type { Placed } from "../core/mate_connector";
import type { ObjectId } from "../core/object_model";
import { add, dot, normalize, qmul, qconj, qRotate, sub, type Quat, type Vec3 } from "../core/vec";

/** ⭐ Which seated followers dissolve now — each seated follower the goal check has in place. */
export function followersToDissolve(
  seatedFollowers: readonly ObjectId[],
  inPlace: ReadonlySet<ObjectId>,
): ObjectId[] {
  return seatedFollowers.filter((f) => inPlace.has(f));
}

/**
 * ⭐⭐ `D143`: the pose after the mate — `pose` turned about the world `faceNormal`, through the world
 * `faceCentre`, by the TWIST part of the turn onto `target` (a swing–twist split about the normal).
 * ⛔ A degenerate normal, or a target a half-turn off about an axis square to the normal (no twist is
 * defined), returns `pose` unchanged — never a guessed spin.
 */
export function mateSpin(pose: Placed, faceCentre: Vec3, faceNormal: Vec3, target: Quat): Placed {
  const n = normalize(faceNormal);
  if (!n) return pose;
  const d = qmul(target, qconj(pose.orientation));
  const along = dot([d[1], d[2], d[3]], n);
  const m = Math.hypot(d[0], along);
  if (!(m > 1e-9)) return pose;
  const twist: Quat = [d[0] / m, (along * n[0]) / m, (along * n[1]) / m, (along * n[2]) / m];
  return {
    position: add(faceCentre, qRotate(twist, sub(pose.position, faceCentre))),
    orientation: qmul(twist, pose.orientation),
  };
}

