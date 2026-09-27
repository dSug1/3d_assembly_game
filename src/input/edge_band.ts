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

/**
 * ⭐⭐⭐ **THE BAND OPENS ONLY WHEN THERE IS NO EMPTY SPACE** (`D114`, the owner, 2026-09-27: *"set
 * the band width to zero, unless there is no empty space on screen (in such case, band = 6mm)"*).
 *
 * ⭐ `emptySpaceVisible` is the render layer's probe (`probeGrid` points picked against the scene):
 * a point counts as empty when a FIRST touch there would be a miss — nothing hit, or a frozen body
 * a first touch cannot hold (`D89`). ⛔ The probe ignores the band itself, so opening it cannot
 * close it again on the next probe.
 */
export function effectiveBandMm(bandWhenNeededMm: number, emptySpaceVisible: boolean): number {
  return emptySpaceVisible ? 0 : Math.max(0, bandWhenNeededMm);
}

/**
 * The probe points, canvas-relative, one every `spacingPx` — cell CENTRES, so the edges are
 * probed half a cell in. ⭐ The spacing is a fingertip (`D114`: 10 mm): a gap smaller than a finger
 * is not empty space a hand can use. ⛔ Capped, so a tiny spacing cannot make a probe of millions.
 */
export function probeGrid(
  width: number,
  height: number,
  spacingPx: number,
  maxPoints = 2000,
): [number, number][] {
  if (!(width > 0) || !(height > 0) || !(spacingPx > 0)) return [];
  const nx = Math.max(1, Math.round(width / spacingPx));
  const ny = Math.max(1, Math.round(height / spacingPx));
  if (nx * ny > maxPoints) return probeGrid(width, height, spacingPx * 2, maxPoints);
  const pts: [number, number][] = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) pts.push([((i + 0.5) * width) / nx, ((j + 0.5) * height) / ny]);
  return pts;
}
