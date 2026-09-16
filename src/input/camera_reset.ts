/**
 * THE CAMERA RESET, ANIMATED — §1.3's double-tap, eased instead of teleported.
 *
 * ⭐⭐ It interpolates the ORBIT PARAMETERS, not the camera's transform. Yaw, elevation,
 * zoom and centre are what the orbit surface is defined on (`orbit.ts`), so easing those
 * keeps the camera ON that surface for the whole trip — the same path a finger would have
 * dragged. ⛔ Slerping the camera's quaternion and lerping its position instead would cut
 * a chord through the middle of the scene: the camera would dive toward the objects and
 * back out, which is not a movement the rules can produce and reads as a glitch.
 *
 * ⛔⛔ THREE OF THE FOUR CHANNELS NEED SOMETHING OTHER THAN A PLAIN LERP:
 *
 *   * **Yaw takes the SHORT way.** It accumulates without limit — a few enthusiastic
 *     drags and it is several turns from where it started — so a straight lerp would
 *     unwind every one of them. ⚠ Three revolutions in half a second is not a reset, it
 *     is a fairground ride.
 *   * **Zoom interpolates GEOMETRICALLY.** It is a scale factor: halfway between ×0.25
 *     and ×4 is ×1, not ×2.125. A linear lerp spends most of its time near the far end
 *     and arrives in a rush.
 *   * **The curve is EASED at both ends**, so the camera neither leaves nor arrives with
 *     a velocity step.
 *
 * ⛔ ENGINE-FREE: it is four numbers and a clock.
 */
import type { Vec3 } from "../core/vec";

export interface CameraPose {
  /** Radians, unbounded — it accumulates as the finger drags. */
  readonly yawRad: number;
  /** 0 at the bottom ring, 1 at the top. */
  readonly elevation: number;
  /** Multiplier on the orbit surface. ⚠ Strictly positive. */
  readonly zoom: number;
  readonly centreM: Vec3;
}

/**
 * The signed angle from `from` to `to`, wrapped into `(−π, π]`.
 * ⭐ THE SHORT WAY, always. A yaw of `−π/2 + 6π` is the same heading as `−π/2`, and a
 * reset from it must not travel three turns to say so.
 */
export function shortestAngleDelta(fromRad: number, toRad: number): number {
  const twoPi = Math.PI * 2;
  let d = (toRad - fromRad) % twoPi;
  if (d <= -Math.PI) d += twoPi;
  if (d > Math.PI) d -= twoPi;
  return d;
}

/**
 * Smoothstep. ⚠ Zero velocity at both ends, which is what stops the reset looking like
 * it was fired out of a catapult and hit a wall.
 */
export function easeInOut(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** One reset in flight. ⚠ Created per reset; there is never more than one. */
export class CameraResetAnimation {
  private elapsedMs = 0;

  constructor(
    private readonly from: CameraPose,
    private readonly to: CameraPose,
    private readonly durationMs: number,
  ) {}

  /** ⭐ `true` once the last frame has been handed out — the caller then drops it. */
  get done(): boolean {
    return !(this.durationMs > 0) || this.elapsedMs >= this.durationMs;
  }

  /**
   * Advance the clock and return where the camera should be.
   * ⚠ A non-positive or non-finite `dtMs` advances nothing — a duplicated timestamp must
   * not teleport a camera — but it still returns a pose, so the caller has nothing to
   * special-case.
   */
  advance(dtMs: number): CameraPose {
    if (dtMs > 0 && Number.isFinite(dtMs)) this.elapsedMs += dtMs;
    // ⛔ A zero duration is a legal setting and means "snap" — it is how the pre-animation
    // behaviour is reproduced, so it must not divide by zero.
    const t = this.durationMs > 0 ? easeInOut(this.elapsedMs / this.durationMs) : 1;
    return {
      // ⭐ The short way round, and the interpolation runs along that delta — so the
      // camera never passes through a heading it had no reason to visit.
      yawRad: this.from.yawRad + shortestAngleDelta(this.from.yawRad, this.to.yawRad) * t,
      elevation: this.from.elevation + (this.to.elevation - this.from.elevation) * t,
      // ⭐ GEOMETRIC: a constant proportional rate, so the zoom looks like it is moving
      // at one speed rather than crawling then rushing.
      zoom: geometricLerp(this.from.zoom, this.to.zoom, t),
      centreM: [
        this.from.centreM[0] + (this.to.centreM[0] - this.from.centreM[0]) * t,
        this.from.centreM[1] + (this.to.centreM[1] - this.from.centreM[1]) * t,
        this.from.centreM[2] + (this.to.centreM[2] - this.from.centreM[2]) * t,
      ],
    };
  }
}

/**
 * Interpolate a SCALE factor. ⚠ Falls back to a plain lerp if either end is not positive:
 * a logarithm of zero is not a number, and one of those written into a camera radius is
 * a black screen with no error.
 */
export function geometricLerp(from: number, to: number, t: number): number {
  if (!(from > 0) || !(to > 0)) return from + (to - from) * t;
  return from * Math.pow(to / from, t);
}
