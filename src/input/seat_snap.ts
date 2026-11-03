/**
 * ⭐⭐ **THE SEAT'S POSITION LERP** — the owner, 2026-09-26: *"all the movements to be lerp and
 * slerp."* The orientation half of a snap is `AlignSnaps`' slerp, already built; this is the
 * position half: the FollowerFace centre travelling onto the PioneerFaceCursor.
 *
 * ⭐ Same shape as `AlignSnaps` — one flight per body, replaced by a newer one, cancelled by a
 * release, landed EXACTLY on `to` — and the same clock and duration, so the two halves of one
 * snap arrive together. ⛔ It carries no parent: the caller seats the body when `done` comes back.
 *
 * ⛔ ENGINE-FREE.
 */

/**
 * ⭐⭐ **THE MAGNET'S EASING** — accelerating INTO contact, the reverse of the camera's `easeInOut`:
 * a magnet pulls harder the nearer the part gets, so the second half of the flight covers three
 * quarters of the distance and the body arrives with a thump rather than settling.
 */
export function magnetEase(u: number): number {
  const k = Math.min(1, Math.max(0, u));
  return k * k;
}
