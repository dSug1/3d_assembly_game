/**
 * EVERY TUNABLE, AS PLAIN DATA. ⛔ No engine types, no imports from the renderer.
 *
 * ⭐⭐ ONE CONSTANT LIVES IN EXACTLY ONE PLACE. Carried rule (`L1`): when a tuning
 * value existed in both a debug tool and production, the two silently drifted. The
 * debug sliders must write THESE fields; nothing may keep its own copy.
 *
 * ⛔ ALL DISTANCES ARE MILLIMETRES ON THE PHYSICAL SCREEN (`core/units.ts`), never
 * pixels. All angles are DEGREES. All times are MILLISECONDS.
 *
 * ⚠ NOT ONE OF THESE NUMBERS IS MEASURED YET. They are starting points so the build
 * runs, and every one is a `MEASURE` row in the queue. Do not quote them as if they
 * were derived — the previous project's most expensive constant was borrowed from
 * another row's derivation and inherited that row's question, not just its number.
 */
export interface GestureConfig {
  // ── §1.1 motion states, hysteretic ──────────────────────────────────────
  /** mm/s below which a touchpoint counts as resting. */
  stillSpeed: number;
  /** ms it must stay there before STATIONARY latches. */
  stillTime: number;
  /** mm of accumulated travel to enter MOVING. */
  moveEnterDistance: number;
  /**
   * mm. The EXCURSION BOUND during settle candidacy: once speed drops below
   * `stillSpeed`, the finger must stay within this of where it slowed down, for
   * the whole `stillTime`, before STATIONARY latches.
   * ⛔ Must be < moveEnterDistance or the state chatters.
   * ⛔⛔ AND `stillSpeed * stillTime` must EXCEED it, or it can never bind --
   * asserted in MotionTracker's constructor. See motion.ts.
   */
  moveExitDistance: number;

  // ── §1.2 gains ──────────────────────────────────────────────────────────
  /** Metres. Translation gains scale by cameraDistance / this. */
  referenceCameraDistance: number;
  gainRotateFree: number;
  gainRotateConstrained: number;
  gainRoll: number;
  gainTranslateScreen: number;
  gainTranslateAxis: number;
  gainTranslateDepth: number;
  gainTranslateMutual: number;

  // ── §1.3 the recognizer ─────────────────────────────────────────────────
  /** ms of motion buffer the flick test reads. */
  flickWindow: number;
  /** mm/s at lift, below which it is a drag that stopped — never a flick. */
  flickLiftSpeed: number;
  /**
   * ms. The trailing window the LIFT SPEED is averaged over.
   * ⛔⛔ NOT THE LAST SAMPLE PAIR. A browser emits `pointerup` at whatever position
   * and time it likes — very often repeating the last `pointermove` coordinates —
   * and a two-sample estimator reads that as a dead stop and throws the flick away.
   * Device-confirmed as the cause of inconsistent rollback. See flick.ts.
   */
  flickLiftWindow: number;
  /** mm of travel within the window. */
  flickDistance: number;
  /** max(|dx|,|dy|) / (min(|dx|,|dy|) + eps). One ratio, no undefined wedge. */
  flickPurity: number;
  /** degrees of accumulated signed angle to commit to roll. */
  rollAngle: number;
  /** mm. Below this the path curls too tightly to be a deliberate roll. */
  rollRadiusMin: number;
  /** mm. Above this the path is too straight to be a roll at all. */
  rollRadiusMax: number;
  /**
   * mm — the MINIMUM SPAN of the circle-fit window before any angle is read.
   * ⛔⛔ THE BASELINE THE ROLL GEOMETRY IS ESTIMATED OVER. Between consecutive
   * pointer samples the baseline is a few pixels, so digitiser noise dominates the
   * angle: a clean circle stepping 5.0° per sample measured up to 46.3° per sample
   * with ±0.5 px of noise. Device-confirmed as the cause of roll jitter, and of the
   * snap-back when a circling finger pauses. See roll.ts.
   * ⚠ Must stay below `rollRadiusMin`, or the tightest allowed roll cannot be
   * sampled finely enough to be one. Asserted in `validateGestureConfig`.
   */
  rollStepDistance: number;
  /**
   * Degrees of ARC the circle fit is taken over — the window is sized as
   * `rollFitArcDeg` of arc at the radius last measured, never shorter than
   * `rollStepDistance`.
   * ⛔⛔ AN ANGLE, NOT A LENGTH. What conditions a circle fit is angular extent: a
   * fixed 30 mm window is 215° of a tight 8 mm swirl and 49° of a lazy 35 mm one, and
   * measured, no fixed length served both — the wide swirl needed 100 mm, which
   * pushed the release out to 84 mm of straight drag. See roll.ts.
   */
  rollFitArcDeg: number;
  /**
   * mm the newest point must itself advance before the direction is re-measured.
   * ⛔ THE CADENCE, and it is NOT the baseline. A direction depends on both ends of
   * its baseline: with no progress gate a paused finger keeps producing new
   * estimates while the baseline start creeps along the arc behind it, and the roll
   * drifted +30.2° across one pause. ⭐ Smaller = the object follows the finger more
   * finely; it does NOT make the angle noisier, which is `rollStepDistance`'s job.
   * ⚠ Must stay below `rollStepDistance`. Asserted in `validateGestureConfig`.
   */
  rollUpdateDistance: number;
  /**
   * mm of sustained NON-circular travel that releases a committed roll.
   * ⭐ The exit hysteresis for 2quinte, matching §1.1's `STATIONARY`/`MOVING` pair.
   * ⛔ Without it the commit latches for the whole gesture, so a straight drag after
   * a circle is still read as roll — and the turn from the circle's tangent onto the
   * new line is a large genuine direction change applied in one step, which is felt
   * as a violent snap. Device-confirmed. ⚠ §1.3 reads as a latch, so this is a spec
   * amendment; see `Claude/10_INPUT_TOUCH/INDEX.md`.
   */
  rollReleaseDistance: number;
  /**
   * The circle fit's RMS residual may reach this FRACTION OF THE FITTED RADIUS before
   * the path stops counting as circular.
   * ⛔⛔ A FRACTION OF THE RADIUS, NOT A MULTIPLE OF `pointerNoiseMm`. Tying it to
   * noise was a category error that took roll off the device completely: the residual
   * measures how non-circular the HAND'S PATH is — millimetres — while pointer noise
   * is a sensor property in fractions of a millimetre. A human circle is an ellipse
   * with a drifting centre, so at a 0.45 mm tolerance nothing a hand can draw
   * qualified. ⭐ Dimensionless, so one tolerance judges a tight swirl and a lazy one.
   */
  rollFitResidualFraction: number;
  /**
   * Hz. 1€ filter floor cutoff for the roll angle — governs JITTER at slow roll.
   * ⭐ Lower = quieter when the finger creeps. See `one_euro.ts` for the citation and
   * the licence (BSD/MIT reference implementations, no patent asserted).
   * ⚠ Tune on a device with `rollFilterBeta` at 0 first, per the paper. `IN5`.
   */
  rollFilterMinCutoff: number;
  /**
   * 1€ filter speed coefficient for the roll angle — governs LAG at fast roll.
   * ⭐ Raise until a fast swirl stops lagging. ⚠ Tuned second, per the paper. `IN5`.
   */
  rollFilterBeta: number;
  /**
   * mm. Typical position noise of ONE pointer sample from a resting finger.
   * ⭐⭐ A DEVICE PROPERTY, not a preference, and it is what decides whether a
   * curvature can be measured at all. ⚠ Measured trivially on a device: hold still
   * and read the spread. `IN5`, and it is the first one to measure — several other
   * thresholds are only defensible relative to it.
   */
  pointerNoiseMm: number;

  // ── §1.3 taps ──────────────────────────────────────────────────
  // ⭐ NOT IN THE SPEC, AND §1.4 DOES NOT WORK WITHOUT THEM. §1.4 / rule 2septies
  // make a double-tap the ONLY way a constraint is ever evicted, and §1.3's state
  // machine stops at TAP. Recorded in `Claude/10_INPUT_TOUCH/INDEX.md`.

  /**
   * ms. A press released LATER than this, having never moved, is a HOLD -- not a
   * TAP. ⛔ §1.3 bounds TAP only by distance, so without this a finger resting for
   * ten seconds and lifting is a tap, and two of those clear a constraint stack.
   */
  tapMaxDuration: number;
  /** ms from the first tap's RELEASE to the second tap's PRESS. */
  doubleTapWindow: number;
  /** mm between the two taps' press points. */
  doubleTapSlop: number;

  // ── §1.4 constraints ────────────────────────────────────────────────────
  evictOnOverflow: boolean;
  matePriorityOverAnchor: boolean;

  // ── §2 / §4 rules ───────────────────────────────────────────────────────
  /** degrees of device tilt below which the orbit ignores it. */
  tiltDeadband: number;
  /** §1: the barycentre candidate set grows as 2^N − N − 1. Cap it. */
  maxBarycenterCandidates: number;
  /** §6bis A/B. "rotated" is the spec's default; "direct" is the comparison arm. */
  axisMappingMode: "rotated" | "direct";
  /** §6quater directedness, against the screen projection of AxisBtwFaces. */
  mateDirectionPurity: number;

  // ── mate geometry ───────────────────────────────────────────────────────
  /** ⛔ NEGATIVE. A mate is anti-parallel; see core/mate_connector.ts. */
  mateFacingCos: number;
  /** Residual at which a mate breaks — metres and radians, judged separately. */
  mateBreakLinear: number;
  mateBreakAngular: number;
}

export const DEFAULT_CONFIG: GestureConfig = {
  stillSpeed: 6,
  // ⚠ MOVED 80 -> 150 by IN1, and it is NOT a measurement. `stillSpeed * stillTime`
  // must exceed `moveExitDistance` or the exit threshold can never bind: 6 mm/s x
  // 80 ms = 0.48 mm against a 0.8 mm bound made it decorative. A placeholder moved
  // to make another placeholder reachable. IN5 measures both.
  stillTime: 150,
  moveEnterDistance: 1.5,
  moveExitDistance: 0.8,

  referenceCameraDistance: 0.6,
  gainRotateFree: 1,
  gainRotateConstrained: 0.6,
  gainRoll: 1,
  gainTranslateScreen: 1,
  gainTranslateAxis: 1,
  gainTranslateDepth: 1,
  gainTranslateMutual: 0.5,

  flickWindow: 120,
  flickLiftSpeed: 250,
  // ⚠ Placeholder, like every number here. Long enough to span several pointer
  // samples at 60-120 Hz, short enough to still mean "at lift". IN5 measures it.
  flickLiftWindow: 40,
  flickDistance: 6,
  flickPurity: 2.5,
  // ⛔⛔ ALL SIX ROLL NUMBERS MOVED TOGETHER ON 2026-09-14, because roll had
  // DISAPPEARED on the device: only a mathematically perfect circle qualified. They
  // are coupled and were swept together against REALISTIC gestures (ellipses with
  // drifting centres) and against realistic NEGATIVES (wiggles, sloppy arcs).
  // ⚠ Still placeholders — swept against synthetic humanity, not measured on a hand.
  // ⭐ 120°, not 60°: one half-period of a lazy 8 mm x 90 mm wiggle contains ~67° of
  // genuine arc, so a 60° threshold cannot tell a deliberate swirl from a sloppy
  // S-shaped drag. Measured: the false positive disappears at 90°.
  rollAngle: 120,
  // ⭐ A wide band. A finger swirls anywhere from a tight 5 mm to a lazy 60 mm, and
  // the old [10, 30] silently excluded both ends.
  rollRadiusMin: 5,
  rollRadiusMax: 60,
  rollStepDistance: 13,
  // ⚠ 150°, swept: it is the shortest arc at which EVERY realistic swirl in
  // tests/roll.test.ts commits (a tight R=8 and a slow R=12 are the demanding ones)
  // while no wiggle or sloppy arc does. ⛔ The cost is a slow RELEASE — ~83 mm of
  // straight drag before a committed roll hands back to yaw/pitch, against a
  // rollReleaseDistance of 18 mm, because the window must flush before the fitted
  // radius leaves the band. Known, reported, and the next device pass judges it.
  rollFitArcDeg: 150,
  rollUpdateDistance: 0.5,
  rollReleaseDistance: 18,
  rollFitResidualFraction: 0.25,
  // ⚠⚠ MEASURED AT EVERY SETTING AND IT EARNS NOTHING ON THIS SIGNAL. The roll
  // angle is a fast RAMP (hundreds of deg/s), and low-passing a ramp costs
  // `slope x tau` of lag. Swept on realistic gestures against the Hyper estimator:
  //   beta 0     -> 13% less noise, but ~30° per gesture of LAG
  //   beta 0.01  -> 0.3% less noise (nothing), ~13° of lag
  //   beta 0.02  -> noise WORSE, ~8.5° of lag
  // ⭐ What actually removed the jitter was the ESTIMATOR (Hyper, the consistency
  // guard, and the stale-reference fix), not a filter. Kept wired so it can be A/B'd
  // by finger: raise `beta` toward 0.05 to make it transparent, drop it to 0 for
  // maximum smoothing and maximum lag. `IN5` settles it.
  rollFilterMinCutoff: 3.0,
  rollFilterBeta: 0.01,
  pointerNoiseMm: 0.15,

  tapMaxDuration: 250,
  doubleTapWindow: 300,
  doubleTapSlop: 8,

  evictOnOverflow: false,
  matePriorityOverAnchor: false,

  tiltDeadband: 2,
  maxBarycenterCandidates: 8,
  axisMappingMode: "rotated",
  mateDirectionPurity: 2,

  mateFacingCos: -0.85,
  mateBreakLinear: 0.02,
  mateBreakAngular: 0.35,
};

/**
 * ⭐⭐ EVERY CONSISTENCY RULE BETWEEN TUNABLES, IN ONE PLACE.
 *
 * ⛔ A config can be individually plausible and jointly impossible, and when it is,
 * the threshold that cannot bind simply does nothing while `IN5` goes off and
 * measures it. `METHOD`: a guard that turns a broken state into silence is worse
 * than a failure. Each rule here depends on TWO numbers, which is exactly why no
 * single-value vector catches it.
 *
 * Called from `MotionTracker`'s constructor, which every `Recognizer` builds.
 */
export function validateGestureConfig(cfg: GestureConfig): void {
  if (cfg.moveEnterDistance <= cfg.moveExitDistance) {
    throw new Error(
      "moveEnterDistance must exceed moveExitDistance, or the motion state chatters.",
    );
  }
  // Motion held below `stillSpeed` for `stillTime` cannot cover more ground than
  // their product, so below it the exit distance is decorative in EVERY wiring.
  const reachableMm = (cfg.stillSpeed * cfg.stillTime) / 1000;
  if (reachableMm <= cfg.moveExitDistance) {
    throw new Error(
      `moveExitDistance (${cfg.moveExitDistance} mm) can never bind: motion held ` +
        `below stillSpeed (${cfg.stillSpeed} mm/s) for stillTime (${cfg.stillTime} ms) ` +
        `covers at most ${reachableMm.toFixed(3)} mm. Raise stillTime or lower moveExitDistance.`,
    );
  }
  if (cfg.rollReleaseDistance <= cfg.rollStepDistance) {
    throw new Error(
      `rollReleaseDistance (${cfg.rollReleaseDistance} mm) must exceed ` +
        `rollStepDistance (${cfg.rollStepDistance} mm): a roll cannot be released ` +
        "before the path has travelled far enough to measure its shape at all.",
    );
  }
  if (cfg.rollFitArcDeg < 45 || cfg.rollFitArcDeg > 360) {
    throw new Error(
      `rollFitArcDeg (${cfg.rollFitArcDeg}°) is outside 45–360°: below 45° a circle ` +
        "fit is too ill-conditioned to locate a centre, and beyond a full turn the " +
        "window stops being able to follow a gesture whose circle changes.",
    );
  }
  if (cfg.rollUpdateDistance >= cfg.rollStepDistance) {
    throw new Error(
      `rollUpdateDistance (${cfg.rollUpdateDistance} mm) must stay below ` +
        `rollStepDistance (${cfg.rollStepDistance} mm): the cadence cannot be coarser ` +
        "than the baseline it re-measures, or the two ends stop moving together.",
    );
  }
  // ⭐⭐ THE SAGITTA CRITERION — the one config rule here derived from physics
  // rather than chosen. A chord of length L across a circle of radius R bows away
  // from the straight line by a SAGITTA of L²/(8R). That bow IS the entire curvature
  // signal: if it does not clear the pointer's own noise, the measured radius is
  // noise, and every decision keyed on it is a coin toss.
  //
  // ⛔ IT WOULD HAVE CAUGHT A REAL DEFECT AT CONSTRUCTION. With a 3 mm baseline and
  // a 40 mm maximum radius the sagitta was 0.028 mm against ~0.15 mm of noise — a
  // signal-to-noise ratio of 0.2 — and the symptom on the device was that a SLOW
  // circular sweep never registered as a roll at all: 300° swept, 0.0° read.
  //
  // ⚠ The binding case is the LARGEST radius, not the smallest: sagitta shrinks as
  // R grows, so a lazy wide swirl is the hard one to detect, not a tight scribble.
  const sagittaMm = (cfg.rollStepDistance * cfg.rollStepDistance) / (8 * cfg.rollRadiusMax);
  if (sagittaMm < 2 * cfg.pointerNoiseMm) {
    throw new Error(
      `rollStepDistance (${cfg.rollStepDistance} mm) is too short to measure curvature ` +
        `at rollRadiusMax (${cfg.rollRadiusMax} mm): the chord's sagitta is ` +
        `${sagittaMm.toFixed(3)} mm against ${cfg.pointerNoiseMm} mm of pointer noise. ` +
        `Lengthen the baseline, lower rollRadiusMax, or measure a smaller noise.`,
    );
  }
  // ⚠ A rule once lived here requiring `rollStepDistance < rollRadiusMin`, on the
  // grounds that a chord that long "stops being a tangent". ⛔ IT WAS DELETED WITH
  // THE ESTIMATOR IT BELONGED TO: nothing uses a chord as a tangent any more, and
  // under a CIRCLE FIT a long span relative to the radius is BETTER, not worse —
  // more arc conditions the fit. Keeping it would have capped the span at the
  // tightest roll radius and locked out every lazy wide swirl.
  if (cfg.flickLiftWindow > cfg.flickWindow) {
    throw new Error(
      `flickLiftWindow (${cfg.flickLiftWindow} ms) exceeds flickWindow ` +
        `(${cfg.flickWindow} ms): the lift-speed window would read samples the ` +
        "motion buffer has already discarded.",
    );
  }
}
