/**
 * ⭐⭐ **HOW FAR A HIGHLIGHT FLOATS OFF WHAT IT MARKS** — the owner, 2026-09-27: *"would that work if
 * I set the offset to 1 pixel?"*, then *"do that change for highlights and outline"*.
 *
 * ⛔ It was a WORLD distance — 1.5 mm for every face marker, 2 % of the body's half-size for the
 * aligned outline — so on the glass it was 10–20 pixels up close and a fraction of one far away.
 * ⭐ Now it is a distance ON THE GLASS (`highlightLiftMm`, one CSS pixel by default), turned into
 * metres at the body's own camera distance every frame, so it looks the same at every zoom.
 *
 * ⭐ Why one pixel is enough: the offset only has to beat the depth buffer. With the 1 cm near plane
 * and a 24-bit buffer, one pixel is ~60× the depth step at the farthest zoom (3 m) and ~1200× at
 * the nearest (0.15 m).
 *
 * ⛔ ENGINE-FREE: the render layer supplies the distance and the view, this decides.
 */
import { mmToPx } from "../core/units";
import { trackingMetresPerPx } from "./translate";

/** ⭐ The lift in METRES for a highlight on a body `cameraDistanceM` away. `0` for a degenerate view. */
export function highlightLiftM(
  liftMm: number,
  cameraDistanceM: number,
  fovRad: number,
  viewportHeightPx: number,
): number {
  return trackingMetresPerPx(cameraDistanceM, fovRad, viewportHeightPx) * mmToPx(liftMm);
}

/**
 * ⭐ An outline's offset is BAKED into its line geometry (a face offset of a hull is not a scale), so
 * it is rebuilt only when the wanted offset leaves `±tolerance` of the one it was built with — in
 * practice, during a zoom. ⚠ `null`: never built.
 */
export function outlineOffsetStale(builtM: number | null, wantM: number, tolerance = 0.05): boolean {
  if (builtM === null) return true;
  if (!(wantM > 0)) return builtM !== wantM;
  return Math.abs(builtM - wantM) > tolerance * wantM;
}
