/**
 * §2 RULE 1 — CAMERA ORBIT, on a THREE-RIG surface that the orbit cannot leave.
 *
 * ⛔⛔ THE OWNER AMENDED THIS RULE, 2026-09-14. §2 rule 1 as written orbits *"by the
 * value of yaw and pitch of the DEVICE TILT"*, with touch as a clutch whose delta is
 * explicitly unused. **The orbit is now driven by the DELTA POSITION** of one
 * touchpoint that hits no object — a drag, not a tilt. Recorded in
 * `Claude/10_INPUT_TOUCH/INDEX.md`; `DeviceOrientation` leaves the critical path.
 *
 * ⭐⭐ THE ORBIT STOPS SHORT, BY CONSTRUCTION. The camera rides a surface defined by
 * three rings — TOP, MIDDLE, BOTTOM — each with its own **radius** and **height**
 * about the orbit centre. Elevation is a parameter `v` in `[0, 1]`: 0 is the bottom
 * ring, 0.5 the middle, 1 the top. ⛔ `v` is CLAMPED, so the camera can never pass
 * over the top or under the bottom. There is no pole to gimbal at, because the poles
 * are not reachable — which is the point of stopping short.
 *
 * ⭐ THE SURFACE PASSES THROUGH ALL THREE RINGS. A quadratic through three points, in
 * closed form:
 *
 *     f(v) = a·(2v−1)(v−1)  +  b·4v(1−v)  +  c·v(2v−1)
 *
 * with `a` at v=0, `b` at v=0.5, `c` at v=1. ⚠ A Bézier would have been wrong here: a
 * Bézier control point is NOT on its curve, so the middle ring would be a hint rather
 * than a ring the camera actually visits — and the owner asked for three rings to
 * tune, not two rings and a bias.
 *
 * ⭐ Closed form, not a search: a numeric solve introduces a step size, and a step
 * size is a threshold nobody measured. Same reasoning as `bestTwist` and the circle fit.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ⛔⛔ LICENCE, per `N13`. This is the same *idea* as Unity Cinemachine's FreeLook
 * three-rig orbit, and the owner asked whether that is patented. ✅ **No patent was
 * found** — orbit radius as a function of elevation is generic parametric geometry.
 * ⛔ **But Cinemachine's CODE is under the Unity Companion License**, which permits
 * use only in applications dependent on a valid Unity engine licence. This project is
 * on Babylon, so **porting or copying that source would breach `N13`.** Nothing here
 * is derived from it: the maths below is written from the geometry. Recorded in
 * `THIRD_PARTY_NOTICES`.
 */
import { mmToPx } from "../core/units";
import type { GestureConfig } from "./gestureConfig";
import type { Vec3 } from "../core/vec";

/** One ring of the orbit surface. Both in metres, about the orbit centre. */
export interface OrbitRig {
  readonly radiusM: number;
  readonly heightM: number;
}

/** Where the camera should sit, in world metres. */
export interface OrbitPose {
  /** Offset from the orbit centre. Add the centre to get a world position. */
  readonly offsetM: Vec3;
  /** Distance from the centre — what the near-plane clamp is judged against. */
  readonly radiusM: number;
}

/**
 * Quadratic through three values at v = 0, 0.5, 1. ⭐ Passes through ALL THREE, which
 * a Bézier would not. See the header.
 */
const throughThree = (atBottom: number, atMiddle: number, atTop: number, v: number): number =>
  atBottom * (2 * v - 1) * (v - 1) + atMiddle * 4 * v * (1 - v) + atTop * v * (2 * v - 1);

export function rigsOf(cfg: GestureConfig): {
  bottom: OrbitRig;
  middle: OrbitRig;
  top: OrbitRig;
} {
  return {
    bottom: { radiusM: cfg.orbitBottomRadiusM, heightM: cfg.orbitBottomHeightM },
    middle: { radiusM: cfg.orbitMiddleRadiusM, heightM: cfg.orbitMiddleHeightM },
    top: { radiusM: cfg.orbitTopRadiusM, heightM: cfg.orbitTopHeightM },
  };
}

/**
 * The camera offset for a yaw and an elevation parameter.
 *
 * ⚠ `zoom` scales the WHOLE surface, radius and height together, so zooming changes
 * the distance without changing the angle you are looking from. Pinch zoom (rule 4)
 * and the orbit therefore compose instead of fighting over one radius.
 */
export function orbitOffset(
  cfg: GestureConfig,
  yawRad: number,
  v: number,
  zoom: number,
): OrbitPose {
  const { bottom, middle, top } = rigsOf(cfg);
  // ⛔ CLAMPED. This is the whole of "stop short": v cannot leave [0, 1], so the
  // camera cannot pass the top or bottom ring, and never reaches a pole.
  const clamped = Math.min(1, Math.max(0, v));
  const radius = throughThree(bottom.radiusM, middle.radiusM, top.radiusM, clamped) * zoom;
  const height = throughThree(bottom.heightM, middle.heightM, top.heightM, clamped) * zoom;
  // ⚠ A ring's radius may legitimately be ~0 (a camera directly overhead), so the
  // horizontal part can vanish. The height is what keeps the pose away from the
  // centre there, which is why the distance is computed from both.
  return {
    offsetM: [radius * Math.cos(yawRad), height, radius * Math.sin(yawRad)],
    radiusM: Math.hypot(radius, height),
  };
}

/**
 * Drives yaw and elevation from one touchpoint's drag.
 *
 * ⭐ A DISPLACEMENT SCALED BY A GAIN — no rate, no baseline, no filter. `IN1` spent
 * five device passes learning that a rate estimated over a short baseline is the
 * expensive mistake; a drag-driven orbit needs none of it, for the same reason pinch
 * zoom did not: the quantity is a position difference, not a derivative.
 */
export class OrbitController {
  private yawRad: number;
  private v: number;

  constructor(
    private readonly cfg: GestureConfig,
    startYawRad = 0,
    startV = 0.5,
  ) {
    this.yawRad = startYawRad;
    this.v = Math.min(1, Math.max(0, startV));
  }

  get yaw(): number {
    return this.yawRad;
  }

  /** ⭐ 0 is the bottom ring, 1 the top. Always inside `[0, 1]`. */
  get elevation(): number {
    return this.v;
  }

  /** True once the elevation is pinned against a ring — the readout shows it. */
  get atLimit(): boolean {
    return this.v <= 0 || this.v >= 1;
  }

  /**
   * Apply one frame's drag, in CSS pixels. ⚠ `dyPx` is positive DOWNWARD, as screen
   * coordinates are.
   */
  drag(dxPx: number, dyPx: number): void {
    // ⛔ Gains are per MILLIMETRE of finger travel, never per pixel: a pixel means
    // something different on a phone and a tablet, and the whole gesture set is
    // threshold-driven. `core/units.ts`.
    const dxMm = dxPx / mmToPx(1);
    const dyMm = dyPx / mmToPx(1);
    this.yawRad += dxMm * this.cfg.gainOrbitYaw;
    // ⚠ Dragging DOWN lowers the camera, so the scene appears to tip up — the same
    // direction convention rule 2bis settled on the device, where an internally
    // consistent sign shipped inverted twice.
    this.v = Math.min(1, Math.max(0, this.v - dyMm * this.cfg.gainOrbitElevation));
  }

  pose(zoom: number): OrbitPose {
    return orbitOffset(this.cfg, this.yawRad, this.v, zoom);
  }
}
