/**
 * ⭐⭐⭐ **THE EDGE BAND — empty space that cannot be covered** (`D113`, the owner, 2026-09-27).
 *
 * > *"Double tap on a body no longer resets the camera: we need a solution in case there is no
 * > empty space on the screen."* — and, of four options, *"Edge band"*.
 *
 * ⭐ A strip along the canvas edges is ALWAYS empty space: a press there is handed to the router
 * as a MISS, whatever is drawn under it. So the camera's own gestures — a double tap to reset, one
 * finger to orbit, two to pinch — stay reachable when a body fills the view, which is exactly when
 * they are needed. ⛔ It is decided at the press, like every role (`IN2`), and nothing else.
 * ⚠ Cost: a body cannot be grabbed through the band; an orbit or a zoom brings it inward.
 *
 * ⛔ ENGINE-FREE: the caller supplies the canvas rectangle and the band already in pixels.
 */

/** The canvas as the browser lays it out, in the same client pixels a pointer event carries. */
export interface CanvasRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * `true` when the point lies within `bandPx` of any edge of the canvas. ⛔ A point OUTSIDE the
 * canvas is not in the band — it is not on the glass this scene owns. `bandPx <= 0` disables it.
 */
export function inEdgeBand(x: number, y: number, rect: CanvasRect, bandPx: number): boolean {
  if (!(bandPx > 0) || !(rect.width > 0) || !(rect.height > 0)) return false;
  const lx = x - rect.left;
  const ly = y - rect.top;
  if (!(lx >= 0 && ly >= 0 && lx <= rect.width && ly <= rect.height)) return false;
  return (
    lx < bandPx || ly < bandPx || rect.width - lx < bandPx || rect.height - ly < bandPx
  );
}
