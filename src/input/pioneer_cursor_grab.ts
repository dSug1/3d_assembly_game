/**
 * ⭐⭐⭐ **WHICH PIONEERFACECURSOR DOES THIS PRESS GRAB?** — the owner, 2026-09-25: *"when left
 * button clicked inside the PioneerFaceCursor (desktop) or first or second touch pressed within a
 * certain distance from the PioneerFaceCursor (mobile) (in such case, the distance shall be a
 * slider starting from the radius of the PioneerFaceCursor up to 10 times this radius)"*.
 *
 * ⭐⭐ **TWO REACHES, ONE RULE.** A mouse is precise, so it must land INSIDE the ring; a finger
 * covers the ring it is aiming at, so it gets `pioneerCursorGrabRadii` × the radius, clamped to
 * the owner's `1…10`. ⭐ The NEAREST cursor in reach wins; coincident cursors (two Followers on one
 * PioneerFace) resolve to the first listed, and dragging it off separates them.
 *
 * ⛔ Never the mouse's synthesised second touch (`MOUSE_SECOND_ID`, the Shift / right-button
 * touchpoint), and never a mouse button other than the LEFT — *"left button clicked"*.
 * ⚠ The radius is the ring's, in CSS px, because the ring is DRAWN at a constant pixel size; the
 * slider is a RATIO of it, so no new pixel threshold is authored here.
 *
 * ⛔ ENGINE-FREE.
 */
import { MOUSE_SECOND_ID } from "./mouse_second_touch";

/** ⭐ The ring's DIAMETER on screen, in CSS px — what the scene draws and what reach is built on. */
export const PIONEER_CURSOR_PX = 16;

/** ⭐ The owner's slider range, in ring radii. */
export const GRAB_RADII_MIN = 1;
export const GRAB_RADII_MAX = 10;

export interface CursorPress {
  readonly x: number;
  readonly y: number;
  readonly pointerType: string;
  readonly pointerId: number;
  /** ⚠ `PointerEvent.button`: 0 is the left button. */
  readonly button: number;
}

export interface CursorOnScreen {
  readonly key: string;
  readonly x: number;
  readonly y: number;
}

/** ⭐ The key of the grabbed cursor, or `null` — the press then goes on to the ordinary rules. */
export function grabbedCursor(
  press: CursorPress,
  cursors: readonly CursorOnScreen[],
  radiusPx: number,
  grabRadii: number,
): string | null {
  if (press.pointerId === MOUSE_SECOND_ID) return null;
  const mouse = press.pointerType === "mouse";
  if (mouse && press.button !== 0) return null;
  const k = Number.isFinite(grabRadii)
    ? Math.min(GRAB_RADII_MAX, Math.max(GRAB_RADII_MIN, grabRadii))
    : GRAB_RADII_MIN;
  const reach = mouse ? radiusPx : radiusPx * k;
  let best: string | null = null;
  let bestD = Infinity;
  for (const c of cursors) {
    const d = Math.hypot(c.x - press.x, c.y - press.y);
    if (d <= reach && d < bestD) {
      bestD = d;
      best = c.key;
    }
  }
  return best;
}
