/**
 * ⭐⭐⭐ **THE MOUSE WHEEL ZOOMS** — the owner, 2026-09-25: *"add the zoom with the mouse roller for
 * desktop."*
 *
 * ## ⛔⛔ IT WRITES THE SAME QUANTITY THE PINCH WRITES, AND NOTHING ELSE
 *
 * Rule 4's pinch sets the orbit's `zoom` multiplier, and `applyCamera()` turns it into a camera
 * position. ⭐ The wheel sets that same multiplier through that same call — so the orbit rings, the
 * near-plane clamp and the pinch that follows all see one zoom, not two. ⚠ An earlier build
 * synthesised a two-finger pinch for the wheel instead; its two extra pointers tangled with every
 * press, and it was taken out. This needs no pointer at all.
 *
 * ⭐ One notch is a fixed RATIO, because a pinch is a ratio of separations: zooming feels the same
 * at every distance, and N notches in then N out returns exactly where it started.
 *
 * ⛔⛔ **CLAMPED TO THE CAMERA'S RADIUS LIMITS, ON THE MULTIPLIER ITSELF.** `applyCamera` clamps the
 * camera position, but not `zoom` — so an unclamped wheel would keep accumulating zoom the camera
 * cannot show, and the hand would then scroll back through a dead band where nothing moves.
 *
 * ⛔ ENGINE-FREE and DOM-free.
 */

/** ⚠ One notch in or out changes the radius by this ratio. A guess, and the only number here. */
export const WHEEL_ZOOM_STEP = 1.1;

/**
 * ⭐ Signed notches from a `WheelEvent`, POSITIVE = zoom IN (scroll up, `deltaY < 0`).
 * ⚠ `deltaMode`: 0 pixels (≈100 per notch), 1 lines (≈3 per notch), 2 pages.
 */
export function wheelNotches(deltaY: number, deltaMode: number): number {
  if (!Number.isFinite(deltaY) || deltaY === 0) return 0;
  const perNotch = deltaMode === 1 ? 3 : deltaMode === 2 ? 1 : 100;
  return -deltaY / perNotch;
}

/**
 * ⭐⭐ The new zoom multiplier. ⚠ Zooming IN makes the radius SMALLER, so a positive notch
 * divides. `minZoom` / `maxZoom` are the multipliers at which the camera radius reaches its limits.
 */
export function wheelZoom(
  zoom: number,
  notches: number,
  minZoom: number,
  maxZoom: number,
): number {
  if (!Number.isFinite(zoom) || !Number.isFinite(notches) || notches === 0) return zoom;
  const next = zoom * Math.pow(WHEEL_ZOOM_STEP, -notches);
  const lo = Math.min(minZoom, maxZoom);
  const hi = Math.max(minZoom, maxZoom);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return next;
  return Math.min(hi, Math.max(lo, next));
}
