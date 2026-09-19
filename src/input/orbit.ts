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
 * ✅ THE FIX IS **MONOTONE (shape-preserving) INTERPOLATION**, Fritsch–Carlson. A plain
 * quadratic wanders between its points; a monotone cubic cannot, and it puts any
 * extremum AT a ring. ⭐ That is the owner's *"three rigs, therefore two transitions"*
 * stated as mathematics.
 *
 * ⚠⚠ AND IT IS APPLIED TO (RADIUS, HEIGHT), NOT TO (DISTANCE, ANGLE) — a choice that
 * was made, measured, REVERSED, and measured again. Interpolating the camera's own
 * (distance, angle) also gives a clean distance, and was shipped first for that
 * reason. ⛔ But it does not bound the result by the rings: on the owner's chosen
 * shape it swung the horizontal radius out to **0.532 m when no ring exceeds
 * 0.500 m**, which breaks *"not exceed these"* outright. Monotone cubic on the rings'
 * own coordinates cannot overshoot, because no-overshoot is exactly what
 * shape-preserving means.
 *
 * ⚠ NEITHER SCHEME IS UNIVERSALLY CLEAN, and pretending otherwise would be the
 * mistake. Measured over four ring shapes: in (radius, height) the DISTANCE can turn
 * more than once for a shape whose radius humps while its height climbs; in
 * (distance, angle) the horizontal radius overshoots. ⭐ The owner's shipped shape — a
 * WAIST, 0.5 → 0.36 → 0.5 m — is clean on every count in (radius, height), and
 * `validateGestureConfig` now REFUSES any ring set that is not, so the menu explains
 * the problem instead of leaving it to be rediscovered by finger.
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

  // ⭐ Interpolated in the rings' OWN coordinates, radius and height. Monotone cubic
  // has no overshoot, so the surface is BOUNDED BY THE RINGS — which is the owner's
  // requirement in their words: *"define height and radius of top and bottom rigs and
  // not exceed these."*
  const radius =
    throughThree(bottom.radiusM, middle.radiusM, top.radiusM, clamped) * zoom;
  const height =
    throughThree(bottom.heightM, middle.heightM, top.heightM, clamped) * zoom;

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

  /**
   * ⭐ Back to where the camera launched. §1.3's DOUBLE-TAP outside any object is the way
   * out of a view you have got lost in — and getting lost is easy, because yaw wraps
   * without limit while the elevation is clamped to its rings, so "spin back the way I
   * came" is not a thing a hand can reliably do.
   * ⛔ It snaps rather than blends. A blend is driven by finger TRAVEL (see
   * `OrbitCentreBlend`), and a double-tap supplies none — a reset that eased would
   * simply never arrive.
   */
  reset(yawRad: number, v: number): void {
    this.yawRad = yawRad;
    this.v = Math.min(1, Math.max(0, v));
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

  /**
   * @param yawOffsetRad ⭐⭐⭐ **AN ADDITIVE LEAN THAT THE CONTROLLER DOES NOT REMEMBER** — the
   *   approach swing (branch `1.0.18-`). ⛔ It is a parameter and **not** a field on purpose:
   *   the camera's own orbit is never written, so *"back to its original position"* is what
   *   passing `0` means rather than something a restore has to achieve. ⚠ A restore can be
   *   missed — a dropped frame, an early release, a body that never reaches contact — and
   *   leaves the camera somewhere nobody chose; an offset cannot.
   *   ⭐ It also rides on top of a hand orbiting meanwhile, instead of fighting it.
   */
  /**
   * @param vOffset ⭐⭐ **THE PITCH HALF OF THE APPROACH SWING**, in the ring surface's own `v`
   *   units. ⛔ Added here and clamped by `orbitOffset`, so the camera cannot leave the ring
   *   surface however large the swing is — which is what keeps it away from the pole where
   *   `A7`'s gesture frame does not exist. ⚠ Like `yawOffsetRad` it is a PARAMETER: the
   *   controller's own elevation is never written, so passing `0` is what *"back where it was"*
   *   means.
   */
  pose(zoom: number, yawOffsetRad = 0, vOffset = 0): OrbitPose {
    return orbitOffset(this.cfg, this.yawRad + yawOffsetRad, this.v + vOffset, zoom);
  }

  /**
   * ⭐ The elevation ANGLES of the bottom and top rings, in radians — what a pitch in degrees
   * has to be measured against before it can be turned into a `v`.
   * ⚠ Exposed here rather than recomputed by the caller: `rigsOf` is this file's own mapping
   * from config to rings, and a second reading of it elsewhere could drift.
   */
  ringElevationRad(): { bottom: number; top: number } {
    const { bottom, top } = rigsOf(this.cfg);
    return {
      bottom: Math.atan2(bottom.heightM, bottom.radiusM),
      top: Math.atan2(top.heightM, top.radiusM),
    };
  }
}


/**
 * How many times the camera's DISTANCE from the centre changes direction across the
 * whole sweep.
 *
 * ⭐⭐ THE OWNER'S REQUIREMENT, MADE CHECKABLE: *"there are only three rigs and
 * therefore two transitions."* Two transitions is one turning point. A ring set that
 * produces more is exactly the artefact they reported by finger on 2026-09-14, and
 * `validateGestureConfig` refuses it — so the tuning menu can say WHY a shape was
 * rejected, rather than letting the artefact be rediscovered on the glass.
 *
 * ⚠ Sampled, not solved. The closed form is a piecewise cubic in two components
 * combined under `hypot`; counting its extrema analytically is more machinery than
 * the answer is worth, and a 200-step sweep resolves a turn the eye could see many
 * times over. ⛔ It runs on config CHANGE, never per frame.
 */
export function distanceTurningPoints(cfg: GestureConfig, steps = 200): number {
  let previous = Number.NaN;
  let direction = 0;
  let turns = 0;
  for (let i = 0; i <= steps; i++) {
    const d = orbitOffset(cfg, 0, i / steps, 1).radiusM;
    if (Number.isFinite(previous)) {
      const delta = d - previous;
      // ⚠ Ignore steps too small to be a real change, or float noise at an extremum
      // would be counted as a turn and this would measure rounding.
      if (Math.abs(delta) > 1e-9) {
        const next = Math.sign(delta);
        if (direction !== 0 && next !== direction) turns++;
        direction = next;
      }
    }
    previous = d;
  }
  return turns;
}

/**
 * MIGRATES THE ORBIT CENTRE instead of teleporting it.
 *
 * ⛔⛔ §2 rule 1 re-chooses a barycentre on every press, so aiming at a different pair
 * of objects picks a different centre — and the camera, which is placed relative to
 * that centre, JUMPED. Device-reported 2026-09-14: *"I do not want this jump. I want
 * the camera quaternion and position to blend to the new orbit along the progress of
 * the delta position."*
 *
 * ⭐ Blending the CENTRE blends both at once. The camera sits at `centre + offset` and
 * looks at `centre`, so a centre that travels smoothly carries the position and the
 * orientation with it — there is no second interpolation to keep in step, and no
 * chance of the two disagreeing.
 *
 * ⭐⭐ PROGRESS IS FINGER TRAVEL IN MILLIMETRES, not milliseconds. Three reasons, and
 * the first is the owner's own framing (*"along the progress of the delta position"*):
 *   * a time-based blend keeps moving after the finger lifts, which is a camera that
 *     drifts on its own;
 *   * every threshold in this project is millimetres on the physical screen
 *     (`core/units.ts`), so a millimetre budget is comparable with everything else;
 *   * it makes the blend a property of the GESTURE — a slow careful drag arrives
 *     slowly, a fast one arrives fast, and neither surprises the hand.
 *
 * ⛔ RETARGETING STARTS FROM WHERE THE CENTRE ACTUALLY IS, not from the previous
 * target. Interrupt a half-finished blend and the old target is a point the camera
 * never reached; resuming from it would put back the jump this class exists to
 * remove. ⭐ Third instance of the same lesson on this project: *a difference is only
 * meaningful when both of its ends are current.*
 */
export class OrbitCentreBlend {
  private fromM: Vec3;
  private toM: Vec3;
  private travelledMm = 0;

  constructor(
    private readonly cfg: GestureConfig,
    startM: Vec3 = [0, 0, 0],
  ) {
    this.fromM = startM;
    this.toM = startM;
  }

  /**
   * Put the centre somewhere with NO blend — both ends of the interpolation at once.
   * ⭐ For a reset, where there is no finger travel to drive a blend with.
   */
  snapTo(centreM: Vec3): void {
    this.fromM = centreM;
    this.toM = centreM;
    // ⚠ The counter is left SPENT, not rewound. `isBlending` asks whether the travel
    // budget has run out, not whether the centre is actually moving — so a rewound
    // counter would have the readout announcing a blend that is going nowhere, which is
    // exactly the kind of instrument that describes itself rather than the scene.
    this.travelledMm = this.cfg.orbitBlendDistanceMm;
  }

  /** ⭐ Eased, so the centre neither starts nor arrives with a velocity step. */
  get progress(): number {
    const budget = this.cfg.orbitBlendDistanceMm;
    // ⚠ A budget of zero is legal and means "no blend" — it is how the old jumping
    // behaviour is reproduced for an A/B, so it must not divide by zero.
    if (budget <= 0) return 1;
    const t = Math.min(1, this.travelledMm / budget);
    return t * t * (3 - 2 * t);
  }

  /** Where the camera should orbit around right now. */
  get centreM(): Vec3 {
    const t = this.progress;
    return [
      this.fromM[0] + (this.toM[0] - this.fromM[0]) * t,
      this.fromM[1] + (this.toM[1] - this.fromM[1]) * t,
      this.fromM[2] + (this.toM[2] - this.fromM[2]) * t,
    ];
  }

  /**
   * The centre most recently CHOSEN, reached or not.
   *
   * ⭐ The diagnostic marker is drawn here rather than at `centreM`, on the owner's
   * instruction: the marker exists to show which barycentre §2 rule 1 SELECTED, and a
   * marker that crawls along with the camera makes that selection harder to read, not
   * easier. ⚠ So the marker is the target and the camera visibly travels to it — the
   * migration is legible as the gap between the two.
   */
  get targetM(): Vec3 {
    return this.toM;
  }

  /** True while the centre is still on its way — the readout shows it. */
  get isBlending(): boolean {
    return this.progress < 1;
  }

  /** Aim at a new centre, starting from wherever the centre is NOW. */
  retarget(nextM: Vec3): void {
    this.fromM = this.centreM;
    this.toM = nextM;
    this.travelledMm = 0;
  }

  /** Feed one frame's finger travel, in millimetres. */
  advance(travelMm: number): void {
    if (travelMm > 0) this.travelledMm += travelMm;
  }
}
