/**
 * §2 RULE 4 — PINCH ZOOM. *"no raycast hit on any object && pinching => zoom the
 * camera orbit in or out."*
 *
 * ⭐⭐ THE MAPPING IS A RATIO OF SEPARATIONS, NOT A RATE. That is deliberate, and it
 * is the one design choice here that matters.
 *
 * `IN1`'s most expensive recurring defect was estimating a RATE over the shortest
 * available baseline — flick lift speed from one sample pair, roll direction from
 * consecutive samples, roll curvature from a sagitta under the noise floor. Each time
 * the fix was to state a longer baseline, and each time that cost lag.
 *
 * ⭐ A pinch needs none of that. The separation between two touchpoints is an
 * ABSOLUTE distance, tens of millimetres wide, so the signal sits three orders of
 * magnitude above pointer noise and needs no differentiation at all. Zoom is
 * `startSeparation / currentSeparation`, which is scale-free: moving the fingers
 * twice as far apart halves the camera radius, whatever the screen or the DPI.
 *
 * ⛔⛔ AND IT IS MEASURED FROM THE GESTURE'S START, NEVER ACCUMULATED PER FRAME.
 * An incremental mapping integrates its own rounding, so a pinch out and back does
 * not return to where it began. A ratio against a stored start is exact by
 * construction — the same reasoning that made the roll angle a swept angle about a
 * fitted centre rather than a sum of per-frame turns.
 *
 * ⛔ THE DEADBAND RE-ANCHORS WHEN IT IS CROSSED. Without that, the instant the pinch
 * exceeds `pinchDeadband` the zoom jumps by exactly the deadband — a visible snap at
 * the start of every gesture. `IN1` hit that shape of defect three times (the stale
 * reference, the creeping baseline, the moving centre): **a change is only meaningful
 * when it is measured from something current.**
 */
import { mmToPx } from "../core/units";
import type { GestureConfig } from "./gestureConfig";
import type { Sample } from "./motion";

/** Below this the two touchpoints are effectively one point and the ratio explodes. */
const MIN_SEPARATION_PX = 1;

const separation = (a: Sample, b: Sample): number =>
  Math.max(MIN_SEPARATION_PX, Math.hypot(a.x - b.x, a.y - b.y));

export class PinchTracker {
  /** Separation when the gesture started, or when the deadband was crossed. */
  private anchorPx: number | null = null;
  /** True once the deadband has been crossed and zoom is live. */
  private live = false;

  /**
   * @param gain the exponent on the separation ratio. ⭐ A PARAMETER so that rule 4 and
   *   amendment A5 (`depth_pinch.ts`) share ONE implementation of the ratio, the deadband
   *   and the re-anchoring — `METHOD`: a second implementation can silently disagree.
   *   ⚠ Defaults to `gainZoom`, so every existing caller is unchanged.
   */
  constructor(
    private readonly cfg: GestureConfig,
    private readonly gain: number = cfg.gainZoom,
  ) {}

  get isZooming(): boolean {
    return this.live;
  }

  /** Both touchpoints went down (and neither hit an object). */
  begin(a: Sample, b: Sample): void {
    this.anchorPx = separation(a, b);
    this.live = false;
  }

  end(): void {
    this.anchorPx = null;
    this.live = false;
  }

  /**
   * The factor to multiply the camera radius by, relative to the radius when this
   * pinch started. `null` while the gesture is still inside the deadband — which is
   * NOT zero: a caller must leave the camera alone, not scale it by one and accrue
   * rounding.
   *
   * ⚠ Fingers moving APART return a factor below 1: the camera comes closer, which
   * is what "zoom in" means to a hand.
   */
  scale(a: Sample, b: Sample): number | null {
    const anchor = this.anchorPx;
    if (anchor === null) return null;
    const now = separation(a, b);

    if (!this.live) {
      if (Math.abs(now - anchor) < mmToPx(this.cfg.pinchDeadband)) return null;
      // ⛔ RE-ANCHOR HERE, at the moment of crossing. Keeping the original anchor
      // would make the first live frame jump by the whole deadband.
      this.anchorPx = now;
      this.live = true;
      return 1;
    }

    // ⭐ The gain is an EXPONENT, not a multiplier, because the quantity is a ratio.
    // A multiplier would be dimensionally wrong: doubling a ratio is not doubling a
    // movement. At `gainZoom = 1` this is the plain physical mapping.
    return Math.pow(anchor / now, this.gain);
  }
}

/**
 * ⛔⛔ CLAMPED, AND THE CLAMP IS LOAD-BEARING. The scene is in METRES and Babylon's
 * near plane is a per-camera property: `render/scene.ts` sets `minZ = 0.01` precisely
 * because the default of 1 put the whole scene inside the near plane and produced a
 * black page with no error at all. A zoom that can drive the radius below the near
 * plane reintroduces exactly that failure, silently.
 */
export function clampCameraRadiusM(radiusM: number, cfg: GestureConfig): number {
  return Math.min(cfg.cameraRadiusMaxM, Math.max(cfg.cameraRadiusMinM, radiusM));
}
