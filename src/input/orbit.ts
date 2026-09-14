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
 * ⭐ THE SURFACE PASSES THROUGH ALL THREE RINGS, via MONOTONE (shape-preserving)
 * cubic interpolation — see `throughThree` below for the citation and for why a plain
 * quadratic and a Bézier are both wrong here.
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
 * MONOTONE (shape-preserving) cubic through three values at v = 0, 0.5, 1 —
 * Fritsch & Carlson, *"Monotone Piecewise Cubic Interpolation"*, SIAM J. Numer. Anal.
 * 17 (1980). ✅ Textbook mathematics: no licence, no patent.
 *
 * ⭐ Passes through ALL THREE values, which a Bézier would not — a Bézier control
 * point is not on its curve, so the middle ring would be a bias rather than a ring
 * the camera visits, and the owner asked for three rings to tune.
 *
 * ⛔⛔ AND IT PUTS ANY EXTREMUM **AT** A RING, NEVER BETWEEN TWO. A plain quadratic
 * through three points wanders between them; shape-preserving interpolation cannot.
 * That property is the owner's requirement stated as mathematics: *"there are only
 * three rigs and therefore two transitions."*
 */
function throughThree(atBottom: number, atMiddle: number, atTop: number, v: number): number {
  const h = 0.5;
  const d1 = (atMiddle - atBottom) / h;
  const d2 = (atTop - atMiddle) / h;

  // ⛔⛔ THE MIDDLE TANGENT IS ZERO WHEN THE DATA TURNS. That single line is what
  // puts the extremum exactly AT the middle ring instead of somewhere between rings,
  // and it is the whole of "three rigs, therefore two transitions".
  let m1 = 0;
  if (d1 * d2 > 0) {
    const avg = (d1 + d2) / 2;
    // Fritsch–Carlson's limiter: a tangent steeper than three times the shallower
    // secant makes the cubic overshoot, which would carry the camera OUTSIDE the
    // rings it is supposed to stop at.
    const cap = 3 * Math.min(Math.abs(d1), Math.abs(d2));
    m1 = Math.sign(avg) * Math.min(Math.abs(avg), cap);
  }

  const [y0, y1, m0, mEnd] = v <= h ? [atBottom, atMiddle, d1, m1] : [atMiddle, atTop, m1, d2];
  const t = v <= h ? v / h : (v - h) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * y0! +
    (t3 - 2 * t2 + t) * h * m0! +
    (-2 * t3 + 3 * t2) * y1! +
    (t3 - t2) * h * mEnd!
  );
}

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
 * ⛔⛔ THE INTERPOLATION IS IN (DISTANCE, ELEVATION ANGLE) — **NOT** IN (RADIUS,
 * HEIGHT) — AND THAT DISTINCTION IS A DEVICE-CONFIRMED DEFECT.
 *
 * Reported 2026-09-14: *"when I move the finger up from bottom rig, the orbit radius
 * increases, decreases, increases: there should be only two changes, not three (there
 * are only three rigs and therefore two transitions)."*
 *
 * ⭐ The owner's reasoning is exactly right, and the arithmetic agrees. Interpolating
 * radius and height INDEPENDENTLY as two quadratics and then combining them with
 * `hypot` does **not** give a quadratic: measured on the shipped rings, the camera
 * distance rose to 0.615 m at v≈0.30, fell to 0.550 at v≈0.85, then rose again to
 * 0.583 — **two turning points, three monotone segments**, from three rings.
 *
 * ⭐⭐ THIS IS `METHOD`'s CARRIED RULE, VERBATIM: *"A COMPOSITION IS A THING TO
 * MEASURE, NOT AN EMERGENT PROPERTY. Ask what the whole chain does, in one
 * expression, and check it."* Each interpolation was defensible on its own; nobody
 * had computed what the pair did together. The predecessor project lost a week to the
 * same shape, in its rotation stack.
 *
 * ✅ TWO CHANGES WERE NEEDED, AND EITHER ALONE IS INSUFFICIENT — measured:
 *
 * 1. **Interpolate the coordinates the camera actually EXPERIENCES**: its DISTANCE
 *    from the centre and its ELEVATION ANGLE. The distance is what the eye reads as
 *    "how close am I", and it was the quantity with three segments. ⚠ The rings are
 *    still hit exactly — `(distance, angle)` and `(radius, height)` are the same point
 *    in two coordinate systems.
 * 2. **Interpolate MONOTONICALLY** (Fritsch–Carlson). A plain quadratic still wanders
 *    between its points: with all three radii EQUAL it gave the horizontal radius
 *    three turning points, when the honest answer is a constant.
 *
 * ⭐ Measured across six ring shapes including degenerate ones, the distance now turns
 * **at most once**, always at a ring. ⚠ Known limit: a pathological bulge (radii
 * 0.2 → 0.9 → 0.1 m) can still make the derived HEIGHT non-monotone, because a rising
 * distance at a negative elevation lowers the camera. Vectored and documented rather
 * than guarded, since no plausible ring set reaches it.
 *
 * ⚠ `zoom` scales the surface, so zooming changes the distance without changing the
 * angle you are looking from. Pinch zoom (rule 4) and the orbit therefore compose
 * instead of fighting over one radius.
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

  // Each ring, in the camera's own coordinates. ⚠ `radius >= 0` is enforced by the
  // config validator, so these angles stay inside [-pi/2, pi/2] and never wrap —
  // there is no branch cut for the interpolation to cross.
  const distance = throughThree(
    Math.hypot(bottom.radiusM, bottom.heightM),
    Math.hypot(middle.radiusM, middle.heightM),
    Math.hypot(top.radiusM, top.heightM),
    clamped,
  ) * zoom;
  const elevationRad = throughThree(
    Math.atan2(bottom.heightM, bottom.radiusM),
    Math.atan2(middle.heightM, middle.radiusM),
    Math.atan2(top.heightM, top.radiusM),
    clamped,
  );

  // ⚠ A ring's radius may legitimately be 0 (a camera directly overhead), in which
  // case the horizontal part vanishes and the height alone carries the distance.
  const radius = distance * Math.cos(elevationRad);
  const height = distance * Math.sin(elevationRad);
  return {
    offsetM: [radius * Math.cos(yawRad), height, radius * Math.sin(yawRad)],
    radiusM: distance,
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

    // ⛔⛔ THE CAMERA MOVES OPPOSITE THE FINGER, BY THE OWNER'S CHOICE (2026-09-14):
    // *"if fingers move up and right, camera orbits down and left"*.
    //
    // ⭐ This is the "grab the WORLD" convention, not "grab the camera" — the finger
    // pushes the scene and the camera swings the other way, so the object under the
    // thumb tracks with it. Both readings are defensible and the two are exact
    // opposites, which is precisely why it is a decision and not a detail: an
    // internally consistent sign cannot tell you which one a hand expects.
    // ⚠ `IN1` shipped yaw AND pitch inverted for exactly that reason, twice.
    this.yawRad -= dxMm * this.cfg.gainOrbitYaw;
    // ⚠ `dyPx` is positive DOWNWARD, so `+dyMm` here means a finger moving UP lowers
    // the camera — the same inversion, in the axis where screen coordinates already
    // point the other way.
    this.v = Math.min(1, Math.max(0, this.v + dyMm * this.cfg.gainOrbitElevation));
  }

  pose(zoom: number): OrbitPose {
    return orbitOffset(this.cfg, this.yawRad, this.v, zoom);
  }
}
