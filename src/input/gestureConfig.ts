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
  // ── §1.1 motion state, a POSITION DEADBAND ──────────────────────────────
  /**
   * ⭐⭐⭐ THE DEAD RADIUS, in millimetres on the glass. A finger inside it of its anchor
   * is `STATIONARY` and emits NOTHING; beyond it, rules receive the **excess only**.
   *
   * ⛔⛔ IT IS THE ONLY MOTION THRESHOLD, and it replaced four — `stillSpeed`,
   * `stillTime`, `moveEnterDistance` and `moveExitDistance`. The owner's model (A11):
   * *"stationary should mean a deadband around the touchpoint position (independently of
   * the time)."*
   *
   * ⭐ It is also **A9's deadband**, so no rule needs a second one: the excess-only form
   * is what stops a still finger turning a held object, and it is applied once, at the
   * source, for every rule at the same time.
   *
   * ⚠ It must exceed the MEASURED `pointerNoiseMm` by `SETTLE_NOISE_MULTIPLE`, or a
   * resting finger reads as moving. Asserted in `validateGestureConfig`.
   */
  motionDeadbandMm: number;
  /**
   * ms — how long a finger must emit NOTHING before `MOVING` gives way to `STATIONARY`.
   *
   * ⛔ NOT a settle timer, and not on the path a hand complained about: LEAVING
   * `STATIONARY` is instantaneous, and the deadbanded delta never waits for this.
   * ⭐ It exists for one structural reason: while the finger moves, the anchor is dragged
   * to sit **exactly on** the dead radius, so when the finger stops it rests ON the
   * boundary and the measured noise straddles it. Without this, the state flickers on
   * roughly half of all samples — and a bigger radius does not help, because the anchor
   * follows it out.
   * ⚠ Small on purpose: a tenth of the settle timer it replaced. `IN5`, by slider.
   */
  restConfirmMs: number;
  /**
   * ⭐⭐⭐ AMENDMENT A14 — ms for which a second touchpoint still counts as HELD after it
   * lifts, so that **lifting it and putting it down again is ONE gesture**.
   *
   * ⛔ Without it, the interval between the lift and the press has genuinely one touchpoint
   * down, so `A13` translates through the middle of a swap — 150-300 ms of it, which is
   * very visible if the holder happens to be moving at the time.
   * ⭐ Keyed on a LIFT: discrete, deliberate and visible, never on a motion state.
   * ⚠ THE COST: going back to one-touchpoint translation is delayed by this much, which is
   * a real delay on a deliberate act. ⭐ `0` restores the old behaviour exactly.
   */
  secondTouchGraceMs: number;
  /**
   * ⭐⭐⭐ **THE `1.0.5` A/B/C — WHICH RULE TABLE IS IN FORCE.**
   *
   * * `0` — **fork A**, `A13`/`D23`: one touchpoint translates, a second held still rotates.
   *   **The default, and the only reading a hand has judged.**
   * * `1` — **fork B**, the **spec's original**: one touchpoint rotates, two translate.
   * * `2` — **fork C**: a second touchpoint **TAPPED** toggles the ongoing drag between
   *   those two behaviours; a second touchpoint **PRESSED** keeps every meaning it has now.
   *
   * ⚠ It was called `translateNeedsSecondTouch` while there were two forks. Renamed when
   * fork C arrived, because that name answers a yes/no question and this is a three-way
   * choice — `router.ts` states the rule it follows: *a name that describes its consumer
   * goes stale the moment the consumer changes.* ⛔ The old key is now REPORTED as unknown
   * rather than silently ignored, which is `config_override`'s contract.
   *
   * ⭐ It exists as a flag rather than a fork because the entire difference is **one
   * inversion** in `holderDrive`: depth, roll, `A14`'s grace and `A15`'s orphan check all key
   * on *the holder is still*, which neither reading touches. ⚠ So both forks get every later
   * row for free, and they can be A/B'd **by the same hand in the same minute**.
   * ⛔⛔ It LATCHES ONLY WHILE NOTHING IS TOUCHING THE GLASS (owner, 2026-09-16) — nothing
   * down is the only state in which no gesture can be in flight. See `input/assignment.ts`.
   * ⚠ Numeric, not boolean, so the URL override and the menu slider reach it with no new
   * machinery: `?touchpointAssignment=1`.
   */
  touchpointAssignment: number;

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
  /**
   * ⭐⭐⭐ AMENDMENT A12 — DEGREES of roll per MILLIMETRE of the SECOND touchpoint's
   * HORIZONTAL travel, while the finger on the object is held still.
   *
   * ⛔ Millimetres, rule 3: a degrees-per-pixel gain would roll a phone and a tablet by
   * different amounts for the same hand movement.
   * ⚠ A GUESS, and on this project's record almost certainly too small — every gain a hand
   * has set was raised from mine, and the last one was moved by a factor of four. Slider.
   * ⚠ SIGN: positive x (dragging right) rolls clockwise on screen. An arbitrary choice
   * between two self-consistent conventions, exactly like the orbit inversion — a hand
   * decides, and no amount of sign-checking can.
   */
  gainRollDrag: number;
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
  /**
   * The DAMPING RATIO of rule 6's inertia — Unity's `linearDamping`, expressed
   * dimensionlessly so it means the same thing at every `translateInertiaMs`.
   * ⭐⭐ THE KNOB FOR "CATCH-UP". `1` is critically damped: the slowest approach that
   * never overshoots, and dragged at a steady rate the object trails for ever by
   * `2·τ·rate`. **Below 1 it accelerates through the gap**, trailing only `2·ζ·τ·rate`,
   * and arrives with a small overshoot — which is what a mass on a spring does and what
   * the owner meant by *"more acceleration catch-up after the inertia is overcome"*.
   * ⚠ Far below 1 it RINGS, and ringing reads as a bug rather than as weight. `IN5`, by
   * slider — nobody should guess this one.
   */
  translateDampingRatio: number;
  /**
   * ms — how far AHEAD of the finger rule 6's phantom target sits, along the finger's
   * own smoothed motion.
   * ⭐⭐ IT HAS A DISTINGUISHED VALUE, not a taste: the follower trails by `2·ζ·τ·rate`
   * and the phantom leads by `lead·rate`, so at **`lead = 2·ζ·τ`** the two cancel
   * EXACTLY and the object sits on the finger at every drag speed — while keeping all
   * its mass in the transients. For the shipped `τ=7.6 ms, ζ=0.2` that is **3.04 ms** —
   * ⚠ and the shipped lead is 0.2 ms, a fifteenth of it. The landmark is real and the hand
   * did not want it.
   * ⚠ Above it the object runs AHEAD of the finger; below, it still trails. The price of
   * any lead is overshoot when the finger stops dead, because the phantom is still out
   * in front. ⛔ `0` disables it exactly, and that is the behaviour every rule-6 vector
   * written before this existed was measured against.
   */
  translateLeadMs: number;
  /**
   * mm ON THE SCREEN — how far every OTHER object drifts **the same way as** the held one
   * when it starts, resumes or turns, before springing back to exactly where it was.
   * ⚠ Alongside, not against. It was built opposite for one round on a request that was
   * then corrected; the sign lives in `swayWorldDirection` and nowhere else.
   * ⭐⭐ THE SCENE REACTS INSTEAD OF STANDING FROZEN around the one thing that moves.
   * ⛔ Screen millimetres, not world metres, and converted through the SAME tracking
   * factor rule 6 uses (`input/translate.ts`) — so the sway is the same size to the eye
   * whatever the zoom. A world-metre amplitude would vanish zoomed out and swamp the
   * scene zoomed in. ⚠ Rule 3 of the project: thresholds are millimetres on the glass.
   * ⛔ `0` disables it exactly.
   */
  translateSwayMm: number;
  /**
   * ms — the softness of that spring: its time constant, and also exactly when the drift
   * reaches its peak (see `impulseForPeak`). Bigger is slower and lazier.
   * ⚠ IT HAS ITS OWN SLIDER EVEN THOUGH ONLY ONE WAS ASKED FOR, and the reason is this
   * project's own record: **every guessed number here has been wrong** — four gains moved
   * by a hand, a simulated recommendation halved, a computed landmark rejected. A
   * softness nobody can reach is a softness that stays at my guess.
   */
  translateSwayTauMs: number;
  /**
   * degrees — how far a drag must swing before the scene reacts AGAIN, mid-drag.
   * ⛔ Without this the sway fired only when the finger started moving, and
   * `motionState` does not fall back to STATIONARY until 150 ms below 6 mm/s — so a hand
   * reversing at speed never went still and the scene sat frozen through the whole
   * shake. ⚠ Found by finger, not by a suite.
   */
  swayTurnDeg: number;
  /**
   * mm/s — the drag speed at which `translateSwayMm` is the amplitude you get.
   * ⭐⭐ THE SWAY SCALES WITH HOW FAST THE OBJECT SETS OFF: the impulse is proportional
   * to the drag speed, as a viscous coupling would be, so a slow drag nudges the scene
   * gently and slowly while a fast one throws it further AND quicker — the excursion
   * still peaks at `translateSwayTauMs`, so a bigger one covers that ground faster.
   * ⚠ Clamped to ×0.3…×3 (`input/sway.ts`): a flick reaches twenty times this and would
   * otherwise fling the rest of the scene across the view.
   */
  swayReferenceSpeedMmPerS: number;
  /**
   * degrees — how far the rest of the scene swings when the held object starts turning
   * or turns the other way, before springing back.
   * ⭐⭐ AS A BLOCK, rigidly: every other object ORBITS the held object's centre and
   * SPINS on its own by the same angle, about the axis the held object is turning on.
   * ⛔ Orbiting without spinning would shear the group — things sliding past each other
   * rather than one scene reacting.
   */
  rotateSwayDeg: number;
  /** ms — the softness of that spring, and when the swing peaks. */
  rotateSwayTauMs: number;
  /**
   * degrees — how far the rotation AXIS must swing before the scene reacts again.
   * ⚠ A reversal is a 180° axis change, so anything below that catches a change of hand.
   */
  rotateSwayTurnDeg: number;
  /** degrees/s — the turn rate at which `rotateSwayDeg` is the amplitude you get. */
  rotateSwayReferenceDegPerS: number;
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

  // ── §2 rule 2septies, as amended: THE EVICTION SHAKE ──────────────────────────
  // Design of record: `Claude/10_INPUT_TOUCH/AMENDMENTS_R5.md` A4 (`D15`).
  // ⛔⛔ ALL FOUR ARE `IN5` PLACEHOLDERS AND EACH NEEDS A SLIDER. The whole safety of
  // this gesture is the gap between a SHAKE and a corrective NUDGE, and that gap is a
  // hand's judgement: "left a bit, right a bit" during fine positioning is a genuine
  // back-and-forth, and no simulation can say where the boundary sits.

  /** Reversals required to evict. A4: 2 — out, back, out. */
  evictShakeReversals: number;
  /**
   * They must all fall inside this window, in milliseconds.
   * ⚠ Too long and a slow fidget accumulates into an eviction; too short and the
   * gesture demands a speed not everyone has. ⭐ The audience includes youth (`D2`).
   */
  evictShakeWindowMs: number;
  /**
   * Minimum travel back from an extremum before a reversal counts, in millimetres.
   * ⭐ It is the HYSTERESIS as well as the amplitude floor — one number, because they
   * are the same question asked twice: *is this a leg, or is it jitter?*
   * ⛔ `validateGestureConfig` refuses a value that does not clear the MEASURED
   * `pointerNoiseMm`.
   */
  evictShakeLegMm: number;
  /**
   * Maximum excursion PERPENDICULAR to the shake axis, as a fraction of the along-axis
   * amplitude.
   * ⛔⛔ THIS IS WHAT SEPARATES A SHAKE FROM A CIRCLE, and it is not optional: **a
   * circle projects to a back-and-forth on EVERY axis**. Since `A3`/`D14` made roll a
   * legitimate control on exactly the objects eviction applies to, a detector without
   * this would destroy an alignment every time someone spun a part to look at it.
   */
  evictShakeStraightness: number;
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
  /**
   * ms — how long §2 rule 1 WAITS before committing to a new orbit centre, in case a
   * second touchpoint is on its way down outside any object.
   * ⭐⭐ TWO FINGERS OUTSIDE IS A PINCH (rule 4), NOT AN ORBIT. They never land at the
   * same instant, so the first one arriving alone is indistinguishable from the start of
   * an orbit — and rule 1 would pick a barycentre, move the marker and retarget the
   * camera for a gesture the user meant as a zoom. ⚠ Waiting a beat costs nothing: the
   * centre blend takes 30 mm of finger travel anyway, so a retarget deferred by a tenth
   * of a second is invisible.
   * ⛔ `0` commits immediately — the behaviour before this existed, and the only setting
   * where a press and a retarget are the same event.
   */
  orbitCentreGraceMs: number;
  /**
   * ms — how long the double-tap camera reset takes to fly home.
   * ⭐ It EASES the orbit parameters (yaw, elevation, zoom, centre) rather than the
   * camera's transform, so the camera stays on the orbit surface the whole way — the
   * same path a finger could have dragged. ⚠ Yaw takes the short way round and zoom
   * interpolates geometrically; see `input/camera_reset.ts` for why neither is a lerp.
   * ⛔ `0` snaps, which is the behaviour before this existed.
   */
  cameraResetMs: number;
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
  // ⭐⭐⭐ ONE RADIUS REPLACED FOUR THRESHOLDS (A11, the owner's model). Everything below
  // about re-sizing applies to it, and the reasoning is kept because it is why the number
  // is 2.4 and not 0.8. ⚠ A DEVICE MUST JUDGE IT: it is the commit threshold, the rest
  // test and the jitter deadband all at once now.
  // ⭐⭐ SET BY THE OWNER ON THE GLASS — 2.3 mm on 2026-09-15, raised to **3.5 mm** on
  // 2026-09-16. ⚠ It now sits comfortably above the validator floor (3 x the measured
  // 0.761 mm = 2.283 mm) rather than 0.017 mm above it, so a future re-measurement of
  // `pointerNoiseMm` has room before it refuses the config.
  // ⚠ THE COST, STATED: this is the travel before an object starts moving AT ALL, and it is
  // paid once per axis per gesture — 3.5 mm of dead travel entering a drag, and a 45°
  // entry pays it on both axes. ⭐ It buys a wider axis-purity corridor (A11): a drag
  // wanders further off-axis before the other axis wakes up.
  motionDeadbandMm: 3.5,
  // ⭐ SET BY THE OWNER, 2026-09-15 — a quarter of my guess, which is the fourth time a
  // hand has moved one of my numbers a long way. It only confirms the way BACK to
  // STATIONARY; at 30 ms it is roughly two frames, so the depth gate opens almost as soon
  // as the finger stops. ⛔ Low enough that boundary chatter is the thing to watch for on
  // the next device pass: if depth flickers on and off while the holder rests, this is the
  // number that is too small.
  restConfirmMs: 30,
  // ⚠ A guess, with a slider. Long enough for a deliberate lift-and-replace, short enough
  // that a genuine lift to one finger does not feel stuck. IN5.
  secondTouchGraceMs: 250,
  // ⭐ Fork A, the judged one. 1 = the spec's assignment, 2 = fork C's tap toggle.
  touchpointAssignment: 0,

  // ⛔⛔ THE HISTORY, KEPT — all four were re-sized 2026-09-15 against the measured floor
  // is a FEEL CHANGE the device must judge: a drag now commits after 3.2 mm instead of
  // 1.5 mm. ⭐ The previous set was sized when `pointerNoiseMm` was BELIEVED to be
  // 0.15 mm; it was measured at 0.761 mm on 2026-09-14 and these were never re-checked.
  // ⚠ Measuring it already exposed one defect in the sagitta guard. This is the second,
  // and it is the same shape: a threshold sized against a number that later changed.
  //
  // ⛔ The binding constraint is the EXCURSION BOUND, which must sit above the noise or
  // STATIONARY is unreachable — 19 consecutive samples must all land inside it, so it
  // needs roughly 3x the RMS floor, not 1x. Everything else follows:
  //   the radius      >= 3 x 0.761  = 2.28 -> 2.4
  //   moveEnterDistance >  moveExitDistance  -> 3.2 (a real gap, or the state chatters)
  //   stillSpeed x stillTime > moveExitDistance -> 6 mm/s x 0.45 s = 2.7 > 2.4
  //
  // ⛔⛔ AND  STAYS AT 6, WHICH IS WHY  HAD TO TRIPLE. Raising
  // the SPEED instead was the first attempt and two existing vectors caught it: at
  // 18 mm/s a deliberate 12 mm/s drag becomes a settle candidate, and it covers only
  // 1.8 mm in 150 ms — so a REAL SLOW DRAG would latch STATIONARY, which under A10 means
  // it would read as a request for DEPTH. ⭐ The discrimination matters more than the
  // latency, so the latency is where the cost was taken.
  // ⚠ THE COST, STATED: after the holder has moved, STATIONARY now takes 450 ms to latch,
  // so depth is available ~0.45 s after a drag ends. ⭐ A finger that is placed and NOT
  // moved starts STATIONARY and waits for nothing, which is the ordinary case.
  // ⭐ Every one has a slider, because IN5 says the slider ships WITH the rule and these
  // four are now load-bearing for a MODE, not only for a flick test.

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
  // ⚠ A12, a guess with a slider. 2 deg/mm means a 45 mm drag rolls the object 90°.
  gainRollDrag: 2,
  gainRoll: 1,
  gainTranslateScreen: 1.17,
  // ⭐ CHOSEN ON THE DEVICE, 2026-09-14, together with the damping ratio and the lead
  // below — the three only mean anything as a set. My 90 ms guess read as LAG: at ζ=1 it
  // put the object 17 mm behind the finger at 100 mm/s, and the TRAIL is what a hand
  // judges, not the millisecond count. ⚠ The owner ended up well below my 30 ms
  // recommendation and at a third of my damping ratio — a much lighter, snappier object
  // than the simulation argued for.
  translateInertiaMs: 7.6,
  // ⭐ CHOSEN ON THE DEVICE, 2026-09-14. Less than HALF the 0.65 I suggested — a hand
  // wanted far more catch-up, and more overshoot, than the numbers alone argued for.
  // ⚠ At τ=8 ms the overshoot this buys stays under the measured pointer noise
  // (`pointerNoiseMm` 0.761 mm) at ordinary speeds: felt as acceleration, not seen as a
  // bounce. ⛔ Its slider now stops at 0.5, so ζ=1 — critical damping, the reference
  // every overshoot vector is written against — is reachable only from the URL.
  translateDampingRatio: 0.2,
  // ⭐ 0.5 ms, chosen on the device 2026-09-14 — under a SIXTH of the neutral lead
  // (`2·ζ·τ` = 3.04 ms for the pair above, where a steady drag would leave no gap at
  // all). ⚠ So the answer to "should the object sit exactly on the finger?" is NO: a
  // hand wants it to trail, and wants only a touch of anticipation. The computed
  // landmark turned out to mark the wrong end of the range — worth knowing, since it was
  // the one number here that looked like it did not need a device.
  // ⚠ The HUD prints `lead <set>/<neutral>` so the landmark stays visible as the other
  // two sliders move it.
  translateLeadMs: 0.2,
  // ⭐ 0.8 mm CHOSEN ON THE DEVICE — and it lands almost exactly on the measured pointer
  // noise (0.761 mm), so at an ordinary drag speed the other objects move by about as
  // much as the digitiser's own jitter. ⚠ That is not a coincidence worth reading too
  // much into, but it does say the effect is meant to be felt rather than seen: the
  // ×0.3…×4.5 speed scaling is what makes it visible on a fast drag.
  translateSwayMm: 0.8,
  // ⚠ Still a guess, with a slider.
  translateSwayTauMs: 180,
  // ⚠ Guesses, both with sliders. 50° is "a deliberate change of heading, not a wobble";
  // 120 mm/s is an ordinary drag — the owner's existing amplitude was judged right at
  // *"medium translation velocities"*, so that is the speed it is anchored to.
  swayTurnDeg: 50,
  swayReferenceSpeedMmPerS: 120,
  // ⭐ CHOSEN ON THE DEVICE, over two passes. The amplitude ended at a QUARTER of my
  // guess (1.2° → 0.45° → 0.3°) — the swing wanted to be barely there.
  // ⭐ And the reference landed at 90°/s, which is where the NOISE FLOOR puts the
  // slowest turn that can register at all (92°/s): so the gentlest turn that fires does
  // so at about ×1, and the scaling runs upward from the nominal amplitude rather than
  // starting part-way up it. ⚠ That alignment is worth keeping if either number moves.
  rotateSwayDeg: 0.3,
  rotateSwayReferenceDegPerS: 90,
  // ⚠ Still guesses, with sliders.
  rotateSwayTauMs: 180,
  // ⛔ 60° for the re-trigger, NOT 170°: yaw and pitch change axis continuously as a
  // hand curves, so only a reversal would ever register at a near-180° threshold.
  rotateSwayTurnDeg: 60,
  gainTranslateAxis: 1,
  // ⭐⭐ A6. **1.0 is the COMPUTED value** — it moves the object as far into the scene as
  // rule 6 moves it across, from the same tracking factor pointed along the ground.
  // ⛔⛔ THE SHIPPED DEFAULT IS 3.0, SET BY A HAND, AND THE GAP IS THE FINDING.
  // Depth is VISUALLY FORESHORTENED: an object pushed along the ground covers world
  // distance while its picture barely changes, so a world-consistent gain reads as
  // sluggish even though it is, in metres, exactly as strong as a drag. ⭐ Equal WORLD
  // motion is not equal PERCEIVED motion, and the eye is what is being served.
  // ⚠ Four gains on this project have now been raised by a hand from a derived or guessed
  // value (×3.4, ×2.3, ×2, and this ×3). ⛔ **A guessed number has been wrong every time;
  // this is the second time a COMPUTED one has been moved too** — the first was rule 6's
  // phantom lead, cut to a fifteenth of its landmark. A computation tells you where a
  // meaningful zero is; it does not tell you where a hand wants to stand.
  gainTranslateDepth: 3,
  // ⚠ Both placeholders, and a guessed number has been wrong every time on this project.
  // ±35% is a guess at how closely a hand holds two fingers in step.

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

  // ── The eviction shake (A4). ⚠ Four placeholders; none is measured. ───────────
  evictShakeReversals: 2,
  // ⚠ 600 ms is roughly three unhurried legs. Untested by any hand.
  evictShakeWindowMs: 600,
  // ⚠ 8 mm is ~10× the measured 0.761 mm noise floor — chosen to be obviously clear of
  // jitter, NOT because 8 is known to be the boundary with a corrective nudge.
  evictShakeLegMm: 8,
  // ⚠ 0.4 admits a hand's natural bow and refuses a circle. ⛔ The gap between those two
  // is the whole question, and it is a finger's to answer.
  evictShakeStraightness: 0.4,
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
  // ⚠ A GUESS, with a slider. Two fingers of one hand land within roughly 30–80 ms of
  // each other; 120 covers that with margin without being long enough to notice.
  orbitCentreGraceMs: 120,
  // ⚠ A GUESS, with a slider. Long enough to read as a movement rather than a cut, short
  // enough not to feel like waiting for a cutscene.
  cameraResetMs: 450,
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
/**
 * How many times the MEASURED pointer noise the settle-excursion bound must exceed.
 *
 * ⭐ 3, because the bound must hold for EVERY sample across the whole `stillTime`, not on
 * average — and a still finger's radial excursion is distributed, not constant. ⚠ At 1x it
 * is satisfied about half the time per sample, and ~19 consecutive halves is never.
 * ⛔ Measured, not argued: at the old 0.8 mm against a 0.761 mm floor, a finger that had
 * moved did not return to STATIONARY in four seconds of rest.
 */
export const SETTLE_NOISE_MULTIPLE = 3;

export function validateGestureConfig(cfg: GestureConfig): void {
  // ⛔⛔ THE ASSIGNMENT FLAG IS A CHOICE OF TWO, NOT A RANGE. A slider, a URL or a stray
  // edit can hand over 0.5 or 2, and `assignmentOf` would read anything but 1 as fork A —
  // so a half-set flag would LOOK like the default while the person setting it believed
  // they had changed the rule table. ⭐ Refused loudly instead, which is what this
  // validator is for: a config that is individually plausible and jointly impossible.
  if (![0, 1, 2].includes(cfg.touchpointAssignment)) {
    throw new Error(
      `touchpointAssignment (${cfg.touchpointAssignment}) must be 0 (fork A: one ` +
        "touchpoint translates), 1 (fork B, the spec: two translate) or 2 (fork C: a " +
        "tapped second touchpoint toggles). It selects a rule table, so there is no " +
        "meaning between the three.",
    );
  }
  // ⛔⛔ THE SHAKE'S LEG MUST CLEAR THE MEASURED NOISE, or eviction fires on jitter.
  // ⭐ Same shape as the sagitta rule below: a threshold is only defensible RELATIVE to
  // `pointerNoiseMm`, and this one destroys the user's work when it is wrong. The
  // multiple is `shake.ts`'s axis gate — a leg that cannot even establish a direction
  // cannot be a leg.
  if (cfg.evictShakeLegMm < 3 * cfg.pointerNoiseMm) {
    throw new Error(
      `evictShakeLegMm (${cfg.evictShakeLegMm} mm) does not clear 3× the measured ` +
        `pointer noise (${cfg.pointerNoiseMm} mm): a reversal could be jitter, and ` +
        "eviction destroys the user's alignments.",
    );
  }
  // ⚠ Two reversals is the minimum that distinguishes a shake from a single stroke that
  // merely came back. One would make every over-and-return drag an eviction.
  if (cfg.evictShakeReversals < 2) {
    throw new Error(
      `evictShakeReversals (${cfg.evictShakeReversals}) must be at least 2: one ` +
        "reversal is an ordinary drag that changed its mind.",
    );
  }
  // ⛔ A straightness of 1 or more admits a circle, whose transverse excursion equals
  // its along-axis amplitude. The guard would be decorative.
  if (!(cfg.evictShakeStraightness > 0 && cfg.evictShakeStraightness < 1)) {
    throw new Error(
      `evictShakeStraightness (${cfg.evictShakeStraightness}) must be in (0, 1): at 1 a ` +
        "CIRCLE passes, and a circle is the gesture that must not evict.",
    );
  }

  // ⭐⭐ THE OTHER SIDE OF THE SANDWICH, ADDED BY A10. A bound the noise cannot fit
  // inside is a bound a RESTING FINGER can never satisfy, so STATIONARY becomes
  // unreachable once anything has moved. ⛔ Nothing shipped before A10 depended on
  // re-entering STATIONARY, so eight device passes never showed it — and A10's depth
  // gate depends on nothing else.
  // ⚠ The multiple is 3 because the bound must hold for EVERY sample across the whole
  // `stillTime` (~19 of them at 8 ms), not on average: 1x the RMS floor is satisfied
  // about half the time, and half^19 is never.
  const settleFloorMm = SETTLE_NOISE_MULTIPLE * cfg.pointerNoiseMm;
  if (cfg.motionDeadbandMm < settleFloorMm) {
    throw new Error(
      `motionDeadbandMm (${cfg.motionDeadbandMm} mm) is below ${SETTLE_NOISE_MULTIPLE}x the ` +
        `measured pointerNoiseMm (${cfg.pointerNoiseMm} mm = ${settleFloorMm.toFixed(2)} mm), ` +
        `so a finger AT REST cannot stay inside it and STATIONARY is unreachable. ` +
        `Raise motionDeadbandMm.`,
    );
  }

  // ⛔ THE REACHABILITY RULE IS GONE WITH THE QUANTITIES IT GUARDED. It asserted that
  // `stillSpeed x stillTime` exceeded the excursion bound, so the bound was not decorative.
  // ⭐ A11 removed all three: a position deadband has no rate and no duration to be
  // inconsistent with, which is most of why it is the right shape. The rule ABOVE — the
  // radius must clear the measured noise — is the one that survived, and it is the one
  // that was missing.
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
