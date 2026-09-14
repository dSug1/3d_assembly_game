/**
 * §4 RULE 6 — SCREEN-PLANE TRANSLATION, and the composition it sits inside.
 *
 * *"one touchpoint on object && one touchpoint outside of any object && the touchpoint
 * on the object is `MOVING` && the touchpoint outside any object is `STATIONARY` => the
 * selected object translates in x and y in the screen view plane."*
 *
 * ⛔⛔ THE GAIN WAS COMPUTED BEFORE IT WAS WRITTEN, because this rule is
 * `translate × zoom × orbit` and that is mistake shape 4's exact territory. What one
 * millimetre of finger must move the object, for the object to stay UNDER that finger:
 *
 * ```
 *                     d=0.15 m   d=0.37 m   d=0.6 m   d=1.14 m   d=3 m     (camera distance)
 *   viewport  640 px    0.75 mm    1.85 mm   3.00 mm    5.69 mm   14.98 mm
 *   viewport  800 px    0.60 mm    1.48 mm   2.40 mm    4.55 mm   11.98 mm
 *   viewport 1024 px    0.47 mm    1.15 mm   1.87 mm    3.56 mm    9.36 mm
 * ```
 *
 * ⭐ **A TWENTYFOLD RANGE ACROSS THE ZOOM CLAMP ALONE** (0.15 m to 3 m). A fixed
 * metres-per-millimetre gain cannot serve both ends: tuned where it feels right zoomed
 * out, the object barely creeps when zoomed in, and vice versa. ⚠ And the orbit surface
 * moves the distance too, asymmetrically — 1.14 m at the top ring against 0.71 m at the
 * bottom — so the same drag would behave differently looking down than looking up.
 *
 * ⭐⭐ SO THE GAIN IS NOT A NUMBER, IT IS A MULTIPLIER ON A COMPUTED FACTOR.
 * `trackingMetresPerPx` below returns the exact displacement that keeps the object under
 * the finger, from the camera's field of view, its distance, and the viewport height.
 * `gainTranslateScreen` multiplies it: **1.0 means the object follows the finger
 * exactly.** ⛔ That is the first gain on this project with a CORRECT value rather than
 * a preferred one — everything else here was a matter of taste, and three of those were
 * guessed too slow.
 *
 * ⚠⚠ IT SUPERSEDES §1.2's `cameraDistance / referenceCameraDistance` FOR THIS RULE.
 * The ratio form is right in shape — it is proportional to distance, which is what keeps
 * the object under the finger — but it is only CORRECT on the one screen it was tuned
 * on: the exact factor varies by 1.6× across plausible viewport heights (0.0030 /
 * 0.0024 / 0.0019 m per finger-mm at the reference distance). Computing it removes both
 * the device dependence and the reference constant.
 *
 * ⚠ AND §1.2'S STATED RATIONALE IS BACKWARDS. It says the scaling exists *"so that one
 * millimetre of finger travel maps to a constant world displacement regardless of
 * zoom"*. Scaling by distance does the opposite: the WORLD displacement grows with
 * distance, and it is the SCREEN displacement that stays constant. The formula is the
 * useful one; the sentence explaining it is not. Recorded rather than silently followed.
 *
 * ⛔ ENGINE-FREE: it takes a field of view and a viewport height, not a camera.
 */

/**
 * Metres of world displacement per CSS pixel of finger travel, for an object at
 * `cameraDistanceM` to stay exactly under the finger.
 *
 * ⛔ The vertical field of view, because that is the axis a perspective projection is
 * defined on in every engine that fixes one (Babylon's `FOVMODE_VERTICAL_FIXED` is the
 * default). ⚠ The full-height world extent at distance `d` is `2·d·tan(fov/2)`; divide
 * by the viewport height in pixels and that is one pixel's worth.
 *
 * ⚠ `viewportHeightPx` must be in **CSS pixels**, matching pointer coordinates — not
 * device pixels. On a 3× display those differ by 3×, and the object would move a third
 * as far as the finger with nothing to say why.
 */
export function trackingMetresPerPx(
  cameraDistanceM: number,
  fovRad: number,
  viewportHeightPx: number,
): number {
  // ⛔ Degenerate inputs return 0 rather than Infinity or NaN: a zero-height viewport
  // happens for real, in the frame before a canvas is laid out, and one NaN written
  // into a pose is permanent — it never washes out of a quaternion.
  if (!(viewportHeightPx > 0) || !(fovRad > 0) || !(cameraDistanceM > 0)) return 0;
  return (2 * cameraDistanceM * Math.tan(fovRad / 2)) / viewportHeightPx;
}

export interface ScreenTranslation {
  /** Metres along the camera's RIGHT axis. */
  readonly rightM: number;
  /** Metres along the camera's UP axis. */
  readonly upM: number;
}

/**
 * Rule 6's displacement for one frame, in the camera's screen plane.
 *
 * @param dxPx  finger travel, CSS pixels, screen x (rightwards positive)
 * @param dyPx  finger travel, CSS pixels, screen y (DOWNWARDS positive — the browser's
 *              convention, and the opposite of the camera's up axis)
 * @param gain  `gainTranslateScreen`. ⭐ Dimensionless: 1 = the object stays under the
 *              finger. Above 1 it outruns the finger, below 1 it lags behind.
 */
export function screenTranslation(
  dxPx: number,
  dyPx: number,
  cameraDistanceM: number,
  fovRad: number,
  viewportHeightPx: number,
  gain: number,
): ScreenTranslation {
  const perPx = trackingMetresPerPx(cameraDistanceM, fovRad, viewportHeightPx) * gain;
  return {
    rightM: dxPx * perPx,
    // ⛔ NEGATED. Screen y grows downwards and the camera's up axis grows upwards; a
    // missing sign here is the single most common defect in a drag, and it looks
    // exactly like "the controls are inverted" rather than like a bug.
    upM: -dyPx * perPx,
  };
}
