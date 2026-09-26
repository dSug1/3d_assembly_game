/**
 * ⭐⭐⭐ **A SEATED FOLLOWER'S PLACEMENT IS DERIVED, NOT STORED** — the owner, 2026-09-26: *"the
 * followerFace center sets at the position of the PioneerFaceCursor which consequently drives the
 * position of the follower object … once snapped, the follower object follows the transform of the
 * Pioneer object (= similar to a child object) and can still be rotated around the followerFace
 * center around the followerFace normal axis."*
 *
 * ⭐⭐ A seated Follower is a CHILD of its Pioneer in `object_model`'s tree (`3D1`, parent ≠
 * root), so *follows the transform* is the tree's doing. What this file adds is the one identity a
 * seat rests on: in the PIONEER's frame,
 *
 *     followerLocal.position = cursorLocal − rotate(followerLocal.orientation, faceCentreLocal)
 *
 * so the FollowerFace centre sits ON the cursor **whatever the orientation** — a twist about the
 * face normal changes the orientation, and re-deriving the position from this identity is what
 * makes it a turn *about the face centre* rather than about the body's own. ⛔ Recomputed every
 * frame from the cursor, so a dragged cursor (Free Flow) carries the body and nothing has to
 * remember to move it.
 *
 * ⛔ ENGINE-FREE.
 */
import type { Placed } from "./mate_connector";
import { qRotate, sub, type Quat, type Vec3 } from "./vec";

/**
 * ⭐ The Follower's local placement (in its Pioneer's frame) that puts `faceCentreLocal` (in the
 * FOLLOWER's frame) exactly on `cursorLocal` (in the PIONEER's frame) at `localOrientation`.
 */
export function seatedLocalPlacement(
  cursorLocal: Vec3,
  localOrientation: Quat,
  faceCentreLocal: Vec3,
): Placed {
  return {
    position: sub(cursorLocal, qRotate(localOrientation, faceCentreLocal)),
    orientation: localOrientation,
  };
}
