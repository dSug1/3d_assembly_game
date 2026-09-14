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
/**
 * ⛔⛔ THE CAMERA'S NEAR PLANE, IN METRES — duplicated here ON PURPOSE so the config
 * validator can refuse a zoom range that would clip the scene away.
 *
 * ⚠ `render/scene.ts` is where it is actually SET on the camera, because `minZ` is a
 * per-camera Babylon property and this layer imports no engine. Keeping the number in
 * two places is exactly what `one constant, one place` forbids, so it is exported
 * from here and `scene.ts` reads it — it does not keep its own copy.
 */
import { distanceTurningPoints } from "./orbit";

export const CAMERA_NEAR_PLANE_M = 0.01;

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
  /**
   * §2bis free rotation: RADIANS of object rotation per MILLIMETRE of finger travel.
   * ⛔ Per millimetre, never per pixel — a pixel means something different on a phone
   * and a tablet, and the whole gesture set is threshold-driven (`core/units.ts`).
   * ⚠ Until `IN3` builds rule 2bis properly, the diagnostic rotation in
   * `render/scene.ts` reads this, so tuning it by hand tunes the real thing.
   */
  gainRotateFree: number;
  gainRotateConstrained: number;
  /**
   * §2quinte roll: a dimensionless multiplier on the swept angle.
   * ⛔ It scales what the object is TURNED BY, never what the commit threshold reads —
   * scaling the latter would silently move `rollAngle` as well. See `roll.ts`.
   */
  gainRoll: number;
  /**
   * §4 rule 6 — screen-plane translation. ⭐⭐ DIMENSIONLESS, and **1 means the object
   * stays exactly under the finger**.
   * ⛔ It is a MULTIPLIER on a computed tracking factor, not metres per millimetre. The
   * factor comes from the camera's field of view, its distance and the viewport height
   * (`input/translate.ts`), because the honest value spans **20× across the zoom clamp**
   * and another 1.6× across plausible screen sizes — no constant can serve both.
   * ⭐ THE FIRST GAIN IN THIS FILE WITH A CORRECT VALUE RATHER THAN A PREFERRED ONE.
   * Above 1 the object outruns the finger; below 1 it lags. Both are tastes, and 1 is
   * the answer to "where should it be".
   */
  gainTranslateScreen: number;
  /**
   * ms — the TIME CONSTANT of rule 6's inertia. ⭐ The owner asked for the object to
   * behave *"a bit like physics applying a force to the object with some inertia"*
   * rather than teleporting with the finger, so it follows a CRITICALLY DAMPED target
   * (`input/follow.ts`): it accelerates out of rest and decelerates into place, and
   * never overshoots.
   * ⛔ `0` disables it exactly — the object is pinned to the finger, which is the only
   * setting that can be checked against rule 6's tracking factor. Keep it reachable.
   * ⚠ A GUESS, and on this project's record almost certainly the wrong one: every gain
   * set by hand was raised from mine. `IN5`, by slider.
   */
  translateInertiaMs: number;
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
   * ⚠ A rule requiring this to stay below `rollRadiusMin` once lived in
   * `validateGestureConfig` and WAS DELETED with the estimator it belonged to — under
   * a circle fit a long span relative to the radius conditions the fit BETTER. This
   * line claimed the assertion still existed long after it did not (13 mm vs a 5 mm
   * `rollRadiusMin`); a doc that describes a guard which is not there is worse than
   * no doc, because it is believed.
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
   * Degrees of arc the fit window holds once a roll is COMMITTED.
   * ⭐⭐ SHORTER THAN `rollFitArcDeg`, and deliberately so. A long arc is what makes
   * the DECISION "is this a swirl?" reliable — but once that decision is made it is
   * not re-asked, and the window only has to TRACK a centre. A long tracking window
   * is pure release lag: a committed roll cannot let go until enough of it has
   * flushed. Splitting the two is what buys reactiveness without losing detection.
   */
  rollTrackArcDeg: number;
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

  // ── §2 rule 4 — pinch zoom ───────────────────────────────────────
  /**
   * mm the finger separation must change before zoom engages.
   * ⚠ Crossing it RE-ANCHORS the gesture, so the zoom does not jump by the deadband
   * at the moment it starts. See pinch.ts.
   */
  pinchDeadband: number;
  /**
   * Zoom gain, applied as an EXPONENT on the separation ratio — the quantity is a
   * ratio, so a multiplier would be dimensionally wrong. `1` is the plain physical
   * mapping: fingers twice as far apart halve the camera radius.
   */
  gainZoom: number;
  /**
   * Metres. ⛔⛔ THE NEAR-PLANE FLOOR, AND IT IS LOAD-BEARING. `render/scene.ts` sets
   * the camera's `minZ` to 0.01 m because Babylon's default of 1 put this
   * metre-scale scene entirely inside the near plane — a black page with no error
   * anywhere. A zoom able to drive the radius below the near plane recreates that
   * silently, so this must stay comfortably above it.
   */
  cameraRadiusMinM: number;
  /** Metres. The far end of the zoom. */
  cameraRadiusMaxM: number;

  // ── §2 rule 1 — camera orbit, on a three-ring surface ───────────────────
  // ⭐⭐ THE ORBIT STOPS SHORT, and these six numbers are what it stops at. Three
  // rings — TOP, MIDDLE, BOTTOM — each with a RADIUS and a HEIGHT about the orbit
  // centre. The camera rides a quadratic surface through all three and cannot leave
  // it, so there is no pole to gimbal at: the poles are simply not reachable.
  // ⚠ Owner's request, 2026-09-14. Heights must increase bottom → middle → top or
  // the surface folds back on itself; asserted in `validateGestureConfig`.
  /** Metres. Radius of the BOTTOM ring — the lowest the camera may orbit. */
  orbitBottomRadiusM: number;
  /** Metres. Height of the BOTTOM ring, below the orbit centre (so negative). */
  orbitBottomHeightM: number;
  /** Metres. Radius of the MIDDLE ring — the camera passes through it, level on. */
  orbitMiddleRadiusM: number;
  /** Metres. Height of the MIDDLE ring. `0` puts it level with the orbit centre. */
  orbitMiddleHeightM: number;
  /** Metres. Radius of the TOP ring. ⚠ `0` is legal: directly overhead. */
  orbitTopRadiusM: number;
  /** Metres. Height of the TOP ring — the highest the camera may orbit. */
  orbitTopHeightM: number;
  /**
   * mm of finger travel over which the orbit CENTRE migrates to a newly chosen
   * barycentre, instead of teleporting there.
   * ⛔ Millimetres, not milliseconds: a time-based blend keeps moving after the finger
   * lifts, and the owner asked for it to follow *"the progress of the delta
   * position"*. ⚠ `0` is legal and reproduces the old jump, for an A/B.
   */
  orbitBlendDistanceMm: number;
  /** Radians of yaw per MILLIMETRE of finger travel. ⛔ Never per pixel. */
  gainOrbitYaw: number;
  /** Elevation parameter (0 = bottom ring, 1 = top) per MILLIMETRE of finger travel. */
  gainOrbitElevation: number;

  // ── §2 / §4 rules ───────────────────────────────────────────────────────
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
  // ⭐⭐ 0.07 rad/mm — CHOSEN ON THE DEVICE by the owner, 2026-09-14, with the menu
  // slider. ⚠ It replaces 0.03, which was not a judgement at all: it was the
  // hard-coded diagnostic constant `scene.ts` used to carry (0.008 rad/px x 3.78
  // px/mm), converted exactly so the feel would not change as it moved into the
  // config. ⭐ A hand says the object should turn more than twice as fast as the
  // number nobody had ever chosen — which is the whole argument for the slider.
  gainRotateFree: 0.07,
  gainRotateConstrained: 0.6,
  // ⭐ 1 is DIRECT MANIPULATION: the cube turns exactly as far as the finger swept,
  // and it is what shipped up to now. ⚠ Anything else means the object stops tracking
  // the fingertip — a real trade, and the owner's to make on the glass. `IN5`.
  gainRoll: 1,
  gainTranslateScreen: 1,
  // ⚠ A GUESS. ~90 ms reads as weight without reading as lag in the literature on
  // direct manipulation, but this project's record on guessed numbers is three for
  // three too slow — it ships with a slider for exactly that reason.
  translateInertiaMs: 90,
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
  // ⛔⛔ THE ROLL NUMBERS ARE COUPLED AND ARE SWEPT TOGETHER, against REALISTIC
  // gestures (ellipses with drifting centres) and realistic NEGATIVES (wiggles,
  // sloppy arcs, zigzags). ⚠ Still placeholders — swept against synthetic humanity,
  // not measured on a hand.
  //
  // ⭐⭐ 60°, back down from 120°. The 120° existed because KÅSA could not tell a
  // lazy S-shaped drag from a swirl, so only a large swept angle could. With the
  // HYPER fit the centre estimate does that work instead: swept from 50° to 120°,
  // **every value gives 4/4 realistic swirls and ZERO false positives.** The
  // threshold was paying for a bad estimator, and it cost 16 mm of engagement lag.
  rollAngle: 60,
  // ⭐ A wide band. A finger swirls anywhere from a tight 5 mm to a lazy 60 mm, and
  // the old [10, 30] silently excluded both ends.
  rollRadiusMin: 5,
  rollRadiusMax: 60,
  rollStepDistance: 13,
  // ⚠ 150° to DECIDE, swept: the shortest arc at which every realistic swirl
  // commits while no wiggle or sloppy arc does. ⭐ The release cost that used to carry
  // is now paid by `rollTrackArcDeg` instead — see below.
  rollFitArcDeg: 150,
  rollTrackArcDeg: 130,
  rollUpdateDistance: 0.5,
  rollReleaseDistance: 12,
  rollFitResidualFraction: 0.25,
  // ⭐⭐ SHIPPED AS `beta = 0` ON DEVICE EVIDENCE, AGAINST MY OWN MEASUREMENT.
  // A/B'd by finger on 2026-09-14 (`?rollFilterBeta=0` vs the default) and the
  // filtered version was judged better. ⛔ My metric said the opposite — it scored
  // `beta = 0` as removing 13% of the noise for ~30° per gesture of LAG — and the
  // metric is what was wrong. Two reasons, both mine:
  //   * the synthetic swirl rolled at ~500 deg/s, roughly twice what a hand does, so
  //     the predicted lag (`slope x tau`) was inflated by about the same factor;
  //   * an error-against-ground-truth metric cannot score "feels steady", which is
  //     the thing actually being traded for.
  // ⚠ `beta` is kept, not deleted: the paper's tuning procedure needs it, and `IN5`
  // still has to measure both numbers. `?rollFilterBeta=0.05` makes it transparent
  // again for a future comparison.
  rollFilterMinCutoff: 3.0,
  rollFilterBeta: 0,
  // ⭐⭐ MEASURED on the device 2026-09-14, not guessed: the owner held one finger
  // still and read the meter's floor (`src/input/noise_meter.ts`). FIVE TIMES the
  // 0.15 placeholder that preceded it.
  // ⚠ IT IS A RESTING-FINGER FLOOR, AND GAMEPLAY IS NOT A RESTING FINGER. A moving
  // contact patch is a different regime, and nothing here should be retuned around
  // this number as though it described one. It is used for exactly one thing — the
  // sagitta criterion below — and there it is the conservative direction: too large
  // a noise can only make that rule stricter.
  pointerNoiseMm: 0.761,

  tapMaxDuration: 250,
  doubleTapWindow: 300,
  doubleTapSlop: 8,

  evictOnOverflow: false,
  matePriorityOverAnchor: false,

  // ⭐⭐ CHOSEN BY THE OWNER ON THE DEVICE, 2026-09-14, with the tuning menu — the
  // first numbers in this file that are a JUDGEMENT rather than a guess.
  // ⭐ The shape is an ASYMMETRIC WAIST, pinching to 0.36 m level with the objects and
  // opening out at both ends — so the camera is closest looking straight on and draws
  // back as it swings under or over, keeping the whole scene in frame at the extremes.
  // ⚠ ASYMMETRIC since the owner raised the top ring to 1.0 m / 0.55 m on 2026-09-14:
  // the eye is now **1.14 m out at the top against 0.71 m at the bottom**, so a
  // top-down view frames far wider than a bottom-up one. That is the judgement, not a
  // slip — but it means the two extremes are no longer interchangeable, and anything
  // later keyed to "how much of the scene is visible" must ask WHICH end.
  // ⚠ The distance turns exactly once, near the middle ring (the minimum sits at
  // v ≈ 0.42, not exactly 0.5, because the two ends are now unequal) — the
  // two-transitions property the owner asked for, and it holds because the
  // interpolation is shape-preserving. ⭐ Enforced, not assumed: `validateGestureConfig`
  // scans the sweep with `distanceTurningPoints` and refuses more than one.
  // ⚠ Still not a MEASUREMENT: chosen by feel, on one device, at one screen size.
  orbitBottomRadiusM: 0.5,
  orbitBottomHeightM: -0.5,
  orbitMiddleRadiusM: 0.36,
  orbitMiddleHeightM: 0.1,
  orbitTopRadiusM: 1.0,
  orbitTopHeightM: 0.55,
  // ⭐ Chosen on the device by the owner, 2026-09-14. ⚠ `0` reproduces the old jump.
  orbitBlendDistanceMm: 30,
  // ⭐⭐ 0.054 rad/mm — CHOSEN ON THE DEVICE, 2026-09-14, with the menu slider. That is
  // ~3.1° of yaw per mm, so a full turn of the camera takes ~116 mm of drag.
  // ⚠ It replaces 0.016 (~0.9°/mm), which I had guessed — a hand wants the camera to
  // swing more than THREE TIMES faster. The same story as `gainRotateFree`, which a
  // hand more than doubled: a guessed gain is reliably too slow, and only a slider
  // finds that out.
  gainOrbitYaw: 0.054,
  // ⭐ CHOSEN ON THE DEVICE 2026-09-14. A full bottom-to-top sweep in 50 mm.
  // ⚠ It replaces the 0.01 I guessed (~100 mm per sweep) — DOUBLED by a hand, and the
  // guess had already been flagged on the row as "probably slow" for exactly this
  // reason. THIRD FOR THREE: every gain guessed on this project has been too slow,
  // by ×3.4, ×2.3 and now ×2. ⛔ Stop guessing gains; ship the slider with the rule.
  gainOrbitElevation: 0.02,

  // ⚠ Placeholders like everything else. `IN5` measures them — and can now do it by
  // finger, since tunables override from the URL (`?pinchDeadband=1`).
  pinchDeadband: 2,
  gainZoom: 1,
  // ⛔ 0.15 m is 15x the camera's 0.01 m near plane. See the field comment.
  cameraRadiusMinM: 0.15,
  cameraRadiusMaxM: 3,

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
  // ⚠ A rule once required `rollReleaseDistance > rollStepDistance`, reasoning that
  // a roll "cannot be released before the path has travelled far enough to measure
  // its shape". ⛔ DELETED: the shape is measured by the fit WINDOW, not by the
  // release distance, and the two answer different questions. Keeping it capped how
  // fast a committed roll could hand back to yaw/pitch, for no geometric reason.
  if (cfg.rollReleaseDistance <= cfg.rollUpdateDistance) {
    throw new Error(
      `rollReleaseDistance (${cfg.rollReleaseDistance} mm) must exceed ` +
        `rollUpdateDistance (${cfg.rollUpdateDistance} mm), or release could be ` +
        "decided before a single new reading has been taken.",
    );
  }
  if (cfg.rollTrackArcDeg > cfg.rollFitArcDeg) {
    throw new Error(
      `rollTrackArcDeg (${cfg.rollTrackArcDeg}°) exceeds rollFitArcDeg ` +
        `(${cfg.rollFitArcDeg}°): tracking an already-decided roll cannot need MORE ` +
        "arc than deciding it did.",
    );
  }
  // ⛔⛔ THE RINGS MUST CLIMB. If the heights do not increase bottom → middle → top
  // the surface folds back through itself, and the elevation parameter stops meaning
  // "how high the camera is" — it would move the camera DOWN over part of its range,
  // which no amount of gain tuning can fix because the geometry is wrong.
  if (
    !(cfg.orbitBottomHeightM < cfg.orbitMiddleHeightM &&
      cfg.orbitMiddleHeightM < cfg.orbitTopHeightM)
  ) {
    throw new Error(
      `orbit ring heights must increase bottom → middle → top, got ` +
        `${cfg.orbitBottomHeightM} / ${cfg.orbitMiddleHeightM} / ${cfg.orbitTopHeightM} m: ` +
        "the orbit surface would fold back through itself.",
    );
  }
  // ⛔⛔ THE OWNER'S "TWO TRANSITIONS" RULE, ENFORCED. Reported by finger on
  // 2026-09-14: *"there are only three rigs and therefore two transitions"* — and a
  // ring set can still produce three, if its radius humps while its height climbs.
  // ⭐ Checked here so the TUNING MENU can explain a refusal, instead of leaving the
  // artefact to be rediscovered on the glass. See orbit.ts.
  // ⚠ Deferred import: `orbit.ts` imports only the TYPE from this file, so there is
  // no runtime cycle.
  const turns = distanceTurningPoints(cfg);
  if (turns > 1) {
    throw new Error(
      `these rings make the camera distance change direction ${turns} times; three ` +
        "rings allow only two transitions, so it would swing in and out again on one " +
        "sweep. Try a radius that does not hump while the height climbs.",
    );
  }

  // ⚠ A radius of 0 is legal (directly overhead); a negative one is not a radius.
  for (const [name, r] of [
    ["orbitBottomRadiusM", cfg.orbitBottomRadiusM],
    ["orbitMiddleRadiusM", cfg.orbitMiddleRadiusM],
    ["orbitTopRadiusM", cfg.orbitTopRadiusM],
  ] as const) {
    if (!(r >= 0)) throw new Error(`${name} (${r} m) cannot be negative.`);
  }
  if (cfg.cameraRadiusMinM >= cfg.cameraRadiusMaxM) {
    throw new Error(
      `cameraRadiusMinM (${cfg.cameraRadiusMinM} m) must be below cameraRadiusMaxM ` +
        `(${cfg.cameraRadiusMaxM} m), or the zoom has no range to work in.`,
    );
  }
  // ⛔⛔ See `cameraRadiusMinM`: a radius at or inside the near plane renders a black
  // page with no error at all, which is the single most expensive failure this
  // project has already had. The near plane is 0.01 m in `render/scene.ts`.
  if (cfg.cameraRadiusMinM < 10 * CAMERA_NEAR_PLANE_M) {
    throw new Error(
      `cameraRadiusMinM (${cfg.cameraRadiusMinM} m) is too close to the camera near ` +
        `plane (${CAMERA_NEAR_PLANE_M} m): zooming in would clip the scene away and ` +
        "render a black page with no error. Keep at least 10x the near plane.",
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
  //
  // ⛔⛔ IT IS MEASURED OVER THE WINDOW THE CODE ACTUALLY SPANS, and for a long time it
  // was not. The rule used to read `rollStepDistance² / (8 × rollRadiusMax)` — a FIXED
  // 13 mm chord at the LARGEST radius, giving 0.352 mm. But `roll.ts`'s `windowTargetPx`
  // sizes the window as `max(rollStepDistance, radius × arc)`: at a 60 mm radius the
  // window holds 130° of arc, which is 136 mm of path and bows by 32 mm, not 0.352 mm.
  // The rule was reading a span the product never uses, at the radius where that span
  // never binds. ⚠ Mistake shape 2 — a substituted quantity — inside the very check
  // written to catch mistakes. It surfaced only when `pointerNoiseMm` was finally
  // MEASURED (0.15 → 0.761) and the check rejected a configuration seven device passes
  // had already accepted. ⭐ `METHOD`: when the device and the metric disagree, suspect
  // the metric.
  //
  // ⚠ And the binding radius is the SMALLEST, not the largest: an arc-sized window bows
  // in proportion to its radius, so a tight swirl is now the hard case. The old rule had
  // this backwards too. The range is scanned rather than reasoned about — a composition
  // is a thing to measure.
  const arcRad = (Math.min(cfg.rollFitArcDeg, cfg.rollTrackArcDeg) * Math.PI) / 180;
  let sagittaMm = Number.POSITIVE_INFINITY;
  let sagittaAtRadiusMm = cfg.rollRadiusMin;
  for (let r = cfg.rollRadiusMin; r <= cfg.rollRadiusMax; r += 0.05) {
    // The arc the window holds at this radius, capped at a full turn.
    const theta = Math.min(Math.max(arcRad, cfg.rollStepDistance / r), 2 * Math.PI);
    const sag = r * (1 - Math.cos(theta / 2));
    if (sag < sagittaMm) {
      sagittaMm = sag;
      sagittaAtRadiusMm = r;
    }
  }
  if (sagittaMm < 2 * cfg.pointerNoiseMm) {
    throw new Error(
      `the roll fit window is too short to measure curvature: at its worst radius ` +
        `(${sagittaAtRadiusMm.toFixed(1)} mm) it holds ` +
        `${Math.min(cfg.rollFitArcDeg, cfg.rollTrackArcDeg)}° of arc and bows by only ` +
        `${sagittaMm.toFixed(3)} mm against ${cfg.pointerNoiseMm} mm of pointer noise. ` +
        `Lengthen rollTrackArcDeg, raise rollRadiusMin, or measure a smaller noise.`,
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
