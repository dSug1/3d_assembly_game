/**
 * ⭐⭐⭐ **THE TRANSLATION AXES OF AN ALIGNED FOLLOWER** — the owner, 2026-09-26:
 *
 * > *"those axis are displayed whenever the aligned follower object is touched or left clicked
 * > (not necessarily when a movement occurs) in whichever mode. If in horizontal plane translation
 * > (first touch or left click without shift), always show the red and blue axis. If in gravity
 * > axis translation (second touch or left click + shift), always show the green axis, or only the
 * > grey axis if the roll rotation is ongoing."*
 *
 * > *"Do not show the axis as full screen length … for each axis, show length corresponding to the
 * > segment between the FollowerFace center (the origin of the axis) and the projection of the
 * > position of the PioneerFaceCursor onto this axis."*
 *
 * ⛔⛔ **THE ROTATION AXES ARE NOT THIS RULE'S** — *"do not modify anything about the rules for the
 * display of the rotation axis."* The grey, purple and maroon lines stay `displayedAxes`'s; this
 * only decides the red, green and blue ones, and reads the grey's answer to know whether a roll is
 * on screen.
 *
 * ⭐⭐ **IT READS WHICH TOUCHES ARE DOWN, NOT WHAT MOVED** — the opposite of `displayedAxes`, on
 * purpose: *"not necessarily when a movement occurs"*. A held aligned Follower shows its axes the
 * instant it is held, and a still finger keeps them.
 *
 * ⛔ ENGINE-FREE.
 */
import { add, dot, normalize, scale, sub, type Vec3 } from "../core/vec";
import { MOUSE_SECOND_ID } from "./mouse_second_touch";

/** ⭐ `[x (red), gravity (green), depth (blue)]` — the order `frameAxisDriven` already uses. */
export type TravelAxes = readonly [boolean, boolean, boolean];

/**
 * ⭐⭐⭐ Which translation axes a HELD aligned Follower shows.
 *
 * @param secondTouchDown a second touch is down — a finger, or the mouse's Shift touchpoint.
 * @param rollOngoing the grey roll line is on screen AND a roll turned this body during THIS hold.
 *   ⚠ The second half matters: the rotation rule keeps its last answer across holds, and a roll
 *   from an earlier gesture must not hide the green on a fresh one.
 */
export function alignedTravelAxes(
  secondTouchDown: boolean,
  rollOngoing: boolean,
): TravelAxes {
  // ⭐ Gravity translation: the green — or nothing of this family while the roll owns the screen.
  if (secondTouchDown) return [false, !rollOngoing, false];
  // ⭐ Horizontal-plane translation: red and blue, always, moving or not.
  return [true, false, true];
}

/**
 * ⭐⭐⭐ **IS A SECOND TOUCH DOWN, AS THIS RULE MEANS IT?**
 *
 * > *"in desktop mode, when I release the shift and left click is still pressed, the gizmo is stuck
 * > on the green and does not toggle back to red and blue"* — the owner, 2026-09-26
 *
 * ⛔⛔ The mouse's Shift touchpoint (`MOUSE_SECOND_ID`) is tied to the LEFT button, not to Shift:
 * it lifts with the left button, so a Shift released mid-drag hands the moves back to the first
 * touch WITHOUT a lift that could read as a tap (`mouse_second_touch.ts`). ⚠ So its mere presence
 * is not the answer — it counts only while Shift is HELD, which is what drives it.
 * ⭐ Any other `OUTSIDE` touchpoint (a real finger) and a finger on the same body always count.
 */
export function secondTouchDown(
  outsideIds: readonly number[],
  secondOnSameBody: boolean,
  shiftHeld: boolean,
): boolean {
  if (secondOnSameBody) return true;
  return outsideIds.some((id) => id !== MOUSE_SECOND_ID || shiftHeld);
}

/**
 * ⭐⭐⭐ **THE SEGMENT AN AXIS IS DRAWN AS** — from the FollowerFace centre (the axis's origin) to
 * the PioneerFaceCursor's projection onto the axis, so its length reads *how far the cursor is
 * along this axis*.
 *
 * ⚠ SIGNED: the end lies on whichever side of the origin the cursor is. A cursor ON the axis's
 * perpendicular plane gives a zero-length segment, which is the honest answer — nothing to travel.
 * ⛔ An axis with no direction returns the origin twice rather than a `NaN`.
 */
export function segmentTowardCursor(
  origin: Vec3,
  axis: Vec3,
  cursor: Vec3,
): readonly [Vec3, Vec3] {
  const a = normalize(axis);
  if (a === null) return [origin, origin];
  return [origin, add(origin, scale(a, dot(sub(cursor, origin), a)))];
}
