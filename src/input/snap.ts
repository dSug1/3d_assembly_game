/**
 * ⭐⭐⭐ **THE SNAP** — the owner, 2026-09-26:
 *
 * > *"Snap conditions: if the center of the followerFace is within an offset radius distance from
 * > the PioneerFaceCursor, and the anti-normals of the pioneerface and followerface are within the
 * > fuchsia angle cone, the followerface snaps the pioneerface. Snap = followerface normal
 * > anti-align with PioneerFace normal and followerFace center sets at the position of the
 * > PioneerFaceCursor which consequently drives the position of the follower object. All the
 * > movements to be lerp and slerp. Once snapped, the follower object follows the transform of the
 * > Pioneer object (= similar to a child object) and can still be rotated around the followerFace
 * > center around the followerFace normal axis."*
 *
 * ⭐ This file holds the two DECISIONS: *does this couple snap now* and *may it snap at all*.
 * The distance is the capture offset in world metres (`captureOffsetM`, mm on the glass scaled by
 * the camera) and the cone is `snapConeDeg` — the fuchsia offer's cone, renamed when the offer was deleted (`D109`).
 *
 * ⛔⛔ **RE-ARM ON EXIT.** An unsnapped couple is still inside the radius — it was seated there —
 * so without a hold-off it would snap back on the next frame. ⭐ `D182`: an UNSNAP (and an undo) holds off; a blocked
 * flight never does (`snapPathBlockedBy`). `SnapArming` holds a couple off
 * after an unsnap until its distance has EXCEEDED the radius once (`3D3`'s *re-arm on exit*).
 *
 * ⛔ ENGINE-FREE.
 */
import { dot, normalize, sub, type Vec3 } from "../core/vec";
import { resolveMove, type CollisionSetup } from "../core/collision";
import type { ObjectId, World } from "../core/object_model";
import type { Placed } from "../core/mate_connector";

/**
 * ⭐⭐⭐ Does the couple meet the snap conditions NOW?
 *
 * @param faceCentreW the FollowerFace centre, WORLD.
 * @param cursorW the PioneerFaceCursor, WORLD.
 * @param offsetM the capture offset in world metres — the *"offset radius"*.
 * @param followerNormalW the FollowerFace's outward normal, WORLD.
 * @param pioneerNormalW the PioneerFace's outward normal, WORLD.
 * @param coneRad the snap cone (`snapConeDeg`): how far from exactly ANTI-parallel the two may be.
 */
export function snapConditionMet(
  faceCentreW: Vec3,
  cursorW: Vec3,
  offsetM: number,
  followerNormalW: Vec3,
  pioneerNormalW: Vec3,
  coneRad: number,
): boolean {
  if (!(offsetM > 0) || !Number.isFinite(coneRad) || coneRad < 0) return false;
  const d = sub(faceCentreW, cursorW);
  const dist = Math.sqrt(dot(d, d));
  if (!Number.isFinite(dist) || dist > offsetM) return false;
  const nf = normalize(followerNormalW);
  const np = normalize(pioneerNormalW);
  if (nf === null || np === null) return false;
  // ⭐ ANTI-parallel is the mate's sense (`D78`): the follower normal against the pioneer's NEGATED.
  const c = Math.max(-1, Math.min(1, -dot(nf, np)));
  return Math.acos(c) <= coneRad;
}

/**
 * ⭐⭐⭐ `D182` — **A SNAP STARTS ONLY IF ITS FLIGHT IS CLEAR** (the owner, 2026-09-30: *"Build the fix"*, after the
 * reproduction). Which body — or wall — would stop the follower's straight flight to its seat, or `null` when the path is
 * free, judged by the one collision rule (`resolveMove`: along the path, the couple exempt through `setup`).
 * ⛔ The cause it removes: a snap started from beside a zero-clearance slot flew into a neighbour, was CANCELLED, and the
 * cancel HELD the couple off until it left the capture radius — so a piece slid in horizontally, sitting on its Pioneer,
 * never snapped (measured on `Scene_1`'s Piece1/Piece22: 28 steps held; a lift re-armed it). ⭐ Now a blocked flight is
 * never started, and nothing is held: the snap fires on the first frame its path is clear, from any direction.
 */
export function snapPathBlockedBy(world: World, followerId: ObjectId, seat: Placed, setup: CollisionSetup): ObjectId | null {
  return resolveMove(world, followerId, seat, setup).blockedBy;
}

/**
 * ⭐⭐ Per-couple arming: `HELD_OFF` after an unsnap until the couple has left the radius once.
 * ⚠ A couple never unsnapped is armed. Keyed by the cursor's couple key.
 */
export class SnapArming {
  private readonly heldOff = new Set<string>();

  /** ⭐ After an unsnap: no re-snap until `exited` has seen the couple outside the radius. */
  holdOff(key: string): void {
    this.heldOff.add(key);
  }

  /**
   * ⭐ Feed the couple's current distance; returns whether it may snap. ⛔ Re-arms only on a
   * distance STRICTLY beyond the radius — sitting exactly on it is still inside.
   */
  armed(key: string, distanceM: number, offsetM: number): boolean {
    if (!this.heldOff.has(key)) return true;
    if (Number.isFinite(distanceM) && distanceM > offsetM) {
      this.heldOff.delete(key);
      return true;
    }
    return false;
  }

  /** ⚠ A couple whose alignment is gone takes its hold-off with it. */
  forget(key: string): void {
    this.heldOff.delete(key);
  }

  /** ⭐ `D111`'s undo: the couples held off after an unsnap. */
  snapshot(): string[] {
    return [...this.heldOff];
  }

  restore(keys: readonly string[]): void {
    this.heldOff.clear();
    for (const k of keys) this.heldOff.add(k);
  }

  isHeldOff(key: string): boolean {
    return this.heldOff.has(key);
  }
}
