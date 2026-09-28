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
 */
import type { ObjectId } from "../core/object_model";

/** ⭐ Which seated followers dissolve now — each seated follower the goal check has in place. */
export function followersToDissolve(
  seatedFollowers: readonly ObjectId[],
  inPlace: ReadonlySet<ObjectId>,
): ObjectId[] {
  return seatedFollowers.filter((f) => inPlace.has(f));
}
