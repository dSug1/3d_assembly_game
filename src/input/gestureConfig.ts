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
   * ⭐⭐⭐ **HOW MANY OF A POINTER'S OWN EVENT INTERVALS OF SILENCE MEAN IT HAS STOPPED.**
   *
   * > *"Make sure we pick a ms number which will be OK for all the mobile devices when I deploy my
   * > game, not only for my tablet today."* — the owner, 2026-09-24
   *
   * ⛔⛔ **A FIXED MILLISECOND THRESHOLD CANNOT BE RIGHT FOR BOTH ENDS OF THE MOBILE RANGE.**
   * Browsers dispatch pointer input once per frame per pointer, so the interval between a
   * pointer's events is the FRAME interval: ~8 ms on a 120 Hz phone, **47–87 ms measured on the
   * owner's tablet** (production build, one and two fingers). ⚠ Any constant is either unsafe
   * there or sluggish on the phone. ⭐ So the rest window is `factor × this pointer's median
   * interval`, floored at `restConfirmMs` and capped at `REST_CEIL_MS`.
   *
   * ⚠ `2.5` survives one or two missed dispatches. ⛔ Below `2` a single dropped frame reads as a
   * stop, which is the defect this replaces; the validator refuses it.
   */
  restGapFactor: number;

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
  /**
   * ⭐⭐ 2sexte's gain — **radians of twist per MILLIMETRE** of finger travel along the
   * direction the anchored object's near side would move (`A3`).
   * ⛔ A GAIN, not a tracking factor: `anchor_rotate.ts` explains why the honest tracking
   * mapping (`1/(r·sin α)`) cannot be used — it diverges as the constraint axis swings toward
   * the camera, so the drag *goes quiet* over a range before it degenerates, which is what
   * the second touchpoint's roll chart is for.
   *
   * ⛔⛔ **IT WAS DECLARED TWICE, UNDER TWO NAMES, FOR A DAY** — this one (the spec's own, in
   * §2 2sexte) sat unread in `config_debt`'s PENDING list while I wired a `gainAnchorDrag` I
   * had invented. ⭐ One number, one name, and the SPEC's name wins: the other was mine and
   * newer. ⚠ Found by the orphan scan of 2026-09-17, not by a hand and not by the guard —
   * `config_debt` cannot see a duplicate, only a dead one.
   */
  gainRotateConstrained: number;
  /**
   * ⭐⭐⭐ **A ROTATION ENDS ON A MULTIPLE OF THIS** (the owner, 2026-09-22): *"any rotation
   * stops at a degree which is a multiple of the incrmt … the equivalent of the mathematical
   * modulo function"*, with the landing slerped so there is no hard stop.
   *
   * ⛔⛔ **`0` IS THE CURRENT BUILD, NO CHANGE.** One slider carries the flag and the angle,
   * which is this project's idiom for a trial — the approach swing and the orbit centre blend
   * both work that way, and it is what lets a hand compare the two modes in the same minute.
   *
   * ⚠⚠ **AND ONLY THE END IS QUANTISED.** An earlier formulation quantised the turn *as it
   * happened* and was rejected on the device — *"it creates too much lag in the rotation vs. the
   * finger movement"*. ⭐ Nothing here touches the gains, the deadband or the smoothing: the drag
   * is the current build exactly, and the increment is a single correction at the gesture's end.
   */
  rotationIncrementDeg: number;
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
  /**
   * ms from the first tap's RELEASE to the second tap's PRESS.
   *
   * ⚠⚠ **IT BRIEFLY GATED THE MODE TOGGLE, AND NO LONGER DOES.** A tap cannot be known to
   * be single until this window passes with no second one, so the toggle was held for it —
   * and a hand rejected the lag: *"it shall be immediate."* ⛔ So this number decides ONE
   * thing again, §1.3's double tap — which in this model is the difference between one mode
   * switch and a switch-back plus a camera reset.
   * ⚠ Unity's equivalent (`InputSettings.multiTapDelayTime`) defaults to 750 ms and
   * `MultiTapInteraction.tapDelay` to 2 × the tap time; ours is 300 ms against a 250 ms tap.
   */
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

  // ── `A16` — THE HIGHLIGHT CONDITION ───────────────────────────────────
  // Design of record: `Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md` §1, §12, §19.
  // ⚠⚠ **BOTH ARE FLAGGED FOR FINE-TUNING** (the owner: *"to be finetuned later"*).
  // ⚠ `MinDistanceBeforeSnapIsConfirmed` is deliberately ABSENT — the hold-off is not
  // built in this slice, and `config_debt.test.ts` refuses a tunable nothing reads.

  /**
   * ⭐⭐⭐ **THE CAPTURE OFFSET, IN MILLIMETRES ON THE GLASS** (`D49`, 2026-09-18).
   *
   * ⛔⛔ **IT REPLACED `snapRadiusFactor`, AND IT ANSWERS A DIFFERENT QUESTION.** That field
   * asked *how far apart may two CENTRES be*, in multiples of the scene module `L`; this one
   * asks *how far apart may two SURFACES be*. ⚠ Its `4L` value carries **no information** here
   * — a constant borrowed across a change of question inherits that question, which `METHOD`
   * names as a trap — so this starts from a fresh guess and a hand moves it.
   *
   * ⭐⭐ **MILLIMETRES ON THE GLASS, NOT IN THE WORLD, and that is the owner's rule**: *"if the
   * camera and focus is close to an object, the offset distance in mm shall be less than if the
   * camera and focus are far."* ⛔ `captureOffsetM` converts it per frame through the same
   * tracking factor rule 6 uses, so the offset keeps a constant APPARENT size while never being
   * authored in pixels — `CONSTRAINTS` §6 holds, and the device dependence pixels would have
   * carried is removed by the field of view and viewport height being in the formula.
   *
   * ⭐ **IT HAS A SLIDER**, at the owner's request (*"I want the offset distance to be manually
   * adjustable by slider"*) — the same exception `BreakThreshold` was granted in §8 of the
   * spec. ⚠ Also on the URL as `?captureOffsetMm=12`.
   *
   * ⚠⚠ **15 mm — THE OWNER'S NUMBER, 2026-09-18** (*"set default capture offset to 15mm"*),
   * replacing my 8 mm placeholder. ⛔ It is a JUDGEMENT, not a measurement: nothing here has been
   * put under a finger yet, and the slider is how it gets judged.
   * ⭐ What it means on the glass: at the boot camera (radius 1.5 m) 15 mm works out near **60 mm**
   * of world clearance — three quarters of the `L` = 80 mm module, and still comfortably inside
   * the **148 mm** of air under the parts, so nothing captures at rest.
   * ⚠ A vector asserts that last property against **this** field rather than against a literal,
   * so raising the default far enough to capture the base plate at boot reddens the suite.
   */
  captureOffsetMm: number;
  /**
   * ⭐⭐⭐ **THE APPROACH SWING'S AMPLITUDE, IN DEGREES OF CAMERA YAW** — the trial on branch
   * `1.0.18-`. ⛔ How far the camera leans out at HALF the trigger gap; it is back on its own
   * orbit at the trigger and at contact, by construction.
   *
   * ⚠⚠ **GUESSED, AND THEREFORE SHIPPED WITH A SLIDER** — `METHOD`'s hardest-won rule here:
   * *a guessed number has been wrong every single time* (four gains raised ×3.4, ×2.3 and ×2 by a
   * hand; a computed landmark rejected in favour of a fifteenth of it). ⭐ `0` disables the swing
   * entirely, which is how to A/B the whole mechanism by finger without a rebuild.
   * ⚠ Also on the URL as `?approachSwingDeg=0`.
   */
  approachSwingDeg: number;
  /**
   * ⭐⭐ **THE SWING'S SPEED DIVISOR: `gain × speed^exponent`** — the owner, 2026-09-19:
   * *"make it A ∝ 1/(slider multiple gain × speed^slider expon gain) so I can finetune."*
   * ⛔ Damping begins at **`speed = 1/gain` mm/s, whatever the exponent** — the product is
   * grouped before the power so the two dials do not fight.
   * ⚠ At the defaults that knee is **67 mm/s** (`1/0.015`), chosen by the owner on the glass.
   */
  approachSwingSpeedGain: number;
  /**
   * ⭐⭐ The exponent in that divisor. ⛔ **`1` makes the camera's angular rate independent of
   * hand speed** (it cancels `dp/dt` — `approach_swing.ts` derives it); **`0` removes the speed
   * dependence entirely**, which is how to A/B the idea by finger; above 1 the camera slows as
   * the hand speeds up.
   */
  approachSwingSpeedExponent: number;
  /**
   * ⭐⭐⭐ **NOT A TUNABLE, A RULE SELECTOR** — like `pioneerTranslates`, and for the same
   * reason: every other control here changes a NUMBER, this one changes what the camera DOES.
   *
   * ⛔ `0` = **case 1**, the current build: the orbit centre is whatever rule 1 last chose.
   * ⛔ `1` = **case 2**: the instant the Pioneer and Follower enter the offset radius, the yellow
   * target switches to **their** barycentre — through the same `retarget` + blend a finger uses,
   * so the camera migrates rather than jumping and the marker moves at once.
   *
   * ⚠ A 0/1 slider because the menu has no other kind of control (`D26`'s shape), and
   * `validateGestureConfig` refuses anything between — a half-set selector must not read as
   * `truthy` and ship one behaviour while the readout claims another.
   */
  approachRetargetsOrbit: number;
  /**
   * ⭐⭐⭐ **MAY A HELD **PIONEER** TRANSLATE?** `1` yes (today's behaviour), `0` no (`D51`).
   *
   * > *"I want to have a flag to toggle on or off the translation of the Pioneer object in this
   * > case"* — the owner, 2026-09-18
   *
   * ⛔ At `0`, two touchpoints on a Pioneer and its Follower give: the **Follower translates**
   * exactly as now, whatever the movement mode; the **Pioneer does not move at all**; and the
   * finger on the Pioneer drives the Follower's **roll (x) and depth (y) together**.
   * ⚠ Both axes at once is deliberate and is NOT what a second touchpoint on a singly-held body
   * does — `input/pinned_pioneer.ts` argues why the two configurations differ.
   *
   * ⚠⚠ **A NUMBER, NOT A BOOLEAN, AND ONLY BECAUSE OF THE MENU.** Every control in the tuning
   * panel is a numeric slider, and the fork selector took the same 0/1 shape for the same reason
   * (`D26`). ⛔ The validator refuses anything between, so a half-set flag cannot masquerade as
   * the default.
   *
   * ⚠⚠ **AND THIS PROJECT HAS DELETED EVERY FLAG IT HAS BUILT** — `D26`→`D28`, `D29`→`D40`,
   * `D41`→`D42`, each within days, because *a dormant fork is a trap*. ⭐ That is not an argument
   * against this one: those were built to let a hand COMPARE, and every one was deleted the day
   * the hand chose. Expect the same here — the flag is how the comparison is made, not a setting
   * the game ships with two of.
   */
  pioneerTranslates: number;
  /**
   * ⭐⭐⭐ **WHERE THE OBJECT AXES COME FROM OUTSIDE THE CAPTURE ZONE** — `NOT A TUNABLE, A
   * RULE SELECTOR`, the third of them, and the owner's flag of 2026-09-22.
   *
   * > *"WorldAxisA — toggle off: current build (no change). WorldAxisB — toggle on: the world
   * > x, world gravity and world depth axis are created at scene boot as per camera position
   * > at scene boot and are fixed forever for this scene."*
   *
   * ⛔ `0` = **WorldAxisA**: the axes are the camera's, recomputed as it orbits — today's
   * build, where a drag is always referred to the screen in front of you.
   * ⛔ `1` = **WorldAxisB**: the axes are the boot camera's, **frozen for the whole scene** —
   * so a body keeps moving along the same world directions however the camera is flown, and a
   * push that went "right" before an orbit still goes the same way in the world afterwards.
   *
   * ⭐⭐ **DEFAULT `1`, THE OWNER'S CHOICE** (*"Default at scene boot: WorldAxisB is toggled
   * on"*). ⚠ That makes the NEW rule the one that boots, which is the opposite of how the
   * swing and `approachRetargetsOrbit` shipped — recorded because it is deliberate, and
   * `?worldAxisB=0` is the A/B a hand needs to judge it.
   *
   * ⚠⚠ **IT DOES NOT SELECT THE *REMAP*.** The holder's `dy` drives the object's DEPTH axis
   * and the second touchpoint's `dy` drives its GRAVITY axis in **both** settings — that part
   * of the dictation is unconditional. This flag chooses only which triple of world directions
   * the channels are projected onto.
   *
   * ⭐⭐⭐ **AND SINCE 2026-09-23 IT GOVERNS THE *ROTATION* BASIS OF A FREE BODY TOO** — the owner
   * asked why translation followed the world axes while rotation followed the camera, and the
   * answer was that the dictation had simply never reached the rotation. ⛔ *"Do the change"*: at
   * `1` an unaligned body PITCHES and ROLLS about the boot camera's frame as well, so one flag
   * answers *which camera does this body obey* for both gestures. ⚠ The YAW is unaffected either
   * way — a gravity frame's `up` is the world vertical by definition. ⭐ The rule and its cost are
   * `rotationFrame` in `object_axes.ts`; a TWIST on an ALIGNED body is untouched, because it turns
   * about the constraint and never read a camera frame.
   *
   * ⚠ A 0/1 slider because the menu has no other kind of control (`D26`'s shape), and the
   * validator refuses anything between: a half-set selector must not read as `truthy` and ship
   * one behaviour while the readout claims another.
   */
  worldAxisB: number;
  /**
   * ⭐⭐⭐ **DOES CROSSING INTO THE OFFSET RADIUS ZONE CALL `CameraOffsetZoneEnter`?** —
   * the owner, 2026-09-22: *"if CameraOffsetZoneEnterSetupB is toggled on — launch the
   * CameraOffsetZoneEnter method (we will define it later on)."*
   *
   * ⛔⛔ **THE METHOD IS NOT DEFINED YET, SO THE DEFAULT IS `0` AND THE HOOK DOES NOTHING.**
   * ⚠ That is the honest state and it is written here rather than left to be inferred: the
   * flag, its slider and its call site exist so that the behaviour can be dropped into one
   * place when it is dictated — and until then, turning it on changes nothing but the HUD.
   * ⭐ `zoneEdge`'s ENTER is the event; `object_axes.ts` owns it, and the axes update on the
   * same edge whether or not this is on.
   *
   * ⛔ A 0/1 selector, refused in between, exactly as `worldAxisB`.
   */
  cameraOffsetZoneEnterSetupB: number;
  /**
   * ⭐⭐⭐ **WHAT THE HOLDER'S TWO NUMBERS DRIVE** — a RULE SELECTOR, after the device look of
   * 2026-09-23: *"the dx continues to move on the x world axis and dy on the world depth axis,
   * which feels strange … the input axis and movements axis seem inverted."*
   *
   * ⛔ `1` = **`PLANE`** (the default): the 2D delta is decomposed onto BOTH horizontal axes, so
   * the body moves inside its own horizontal plane and its image follows the finger exactly.
   * Nothing can feel inverted, because the body goes where the finger goes.
   * ⛔ `0` = **`CHANNELS`**: the dictation's literal pairing, `dx`→x and `dy`→depth, each now
   * tracking exactly along its own axis (which is Blender's `G X`, applied twice).
   *
   * ⭐⭐ **BLENDER MAKES NO SUCH PAIRING AT ALL** — an unconstrained move follows the mouse in
   * the view plane, and a constrained one maps the WHOLE mouse delta onto the one axis the user
   * chose. ⚠ So this flag is where the comparison is made, not a setting the game ships two of.
   */
  translatePairing: number;
  /**
   * ⭐⭐⭐ **HOW NEAR THE VIEW DIRECTION AN AXIS MAY COME BEFORE EXACT TRACKING IS ABANDONED**,
   * in degrees.
   *
   * ⛔⛔ Tracking the finger exactly means dividing by the axis's screen foreshortening, and that
   * **explodes** as the axis turns to face the camera — for the horizontal plane that is an
   * ordinary **level camera**. ⭐ **5° IS BLENDER'S OWN NUMBER** (`axisProjection`, which switches
   * to a plain projection below it), adopted rather than guessed — ⚠ and where Blender then lets
   * the object nearly STOP, this falls back to `depthTranslate`'s fixed-rate push, which a device
   * look closed on 2026-09-16. That is the owner's report 3: *"I would expect the object to
   * continue translating with dy input."*
   *
   * ⚠ `0` disables the fallback, which is how to see the runaway a hand is being protected from.
   * ⭐ A slider, and on the URL as `?axisTrackingConeDeg=10`.
   */
  axisTrackingConeDeg: number;
  /**
   * ⭐⭐⭐ **SEE THE FOLLOWERFACE THROUGH ITS OWN BODY** — the owner, 2026-09-23: *"Add a flag to
   * see the followerface through the object even if it is occluded by the object (transparent
   * overlay or other solution)."*
   *
   * ⛔ The opacity of an **X-RAY TWIN** of the FollowerFace marker, drawn after everything else
   * so no geometry can hide it. ⚠ `0` is OFF and is today's build exactly — the twin is not
   * drawn at all, not drawn invisibly — which is what makes this one control both the flag the
   * owner asked for and the number a hand judges it by. ⭐ The same shape as `approachSwingDeg`,
   * where `0` disables the swing outright.
   *
   * ⭐⭐ **THE ORIGINAL MARKER IS UNTOUCHED AND STILL OPAQUE.** Where the face is in plain sight
   * you see it as you always did, with the twin blending over it; where the body occludes it,
   * the twin is all there is. ⛔ One draw at a lowered alpha would have made a face you can
   * already see *worse*, which is the cost a hand would have reported next.
   *
   * ⚠⚠ **THE VALUE IS A GUESS AND THEREFORE A SLIDER** — `METHOD`'s hardest-won rule here: *a
   * guessed number has been wrong every single time on this project*. ⭐ Also on the URL as
   * `?followerFaceXrayAlpha=0.3`.
   */
  followerFaceXrayAlpha: number;
  /**
   * Degrees. How near parallel the alignment axis must be to one of the target's face
   * normals for `A16`'s condition 1 to hold.
   * ⚠ A DIFFERENT QUESTION from the (unbuilt) snap threshold even though both are angular
   * slack: this asks *have we entered the mechanism*, that asks *may an irreversible move
   * fire*. Coupling them would make tuning one silently move the other.
   */
  alignMatchDeg: number;

  /**
   * ⭐⭐ The seed for the boot scene's three random orientations.
   *
   * ⛔ SEEDED so the scene is REPRODUCIBLE — `?sceneSeed=7` rolls a new one, and the one that
   * showed a defect can always be reloaded. ⚠ Not a gesture tunable and not a slider; it lives
   * here only because this is where URL overrides are parsed and validated.
   * ⛔ `core/random_pose.ts` argues the case.
   */
  sceneSeed: number;
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
  // ⚠⚠ TRIAL, 2026-09-24. ⭐⭐ DOSE-RESPONSE CONFIRMED on the tablet: 10 ms = rapid toggle and
  // worse jitter, 30 ms = the reported jitter, 50 and 80 ms = holds at MOVING, clean.
  //
  // ⛔⛔⛔ **THE BOUND IS THE FRAME RATE, NOT THE TOUCH PANEL.** Browsers coalesce pointer input
  // and dispatch it ONCE PER FRAME PER POINTER — which is why `getCoalescedEvents()` exists in
  // the W3C Pointer Events spec at all. ⚠ So the interval between two of a pointer's events is
  // the FRAME interval, and a rest timeout shorter than that declares a moving finger still.
  //
  //   60 fps -> 16.7 ms   30 fps -> 33.3 ms   20 fps -> 50 ms   + a dropped frame doubles it
  //
  // ⭐ 100 ms is three frames at 30 fps, or two at 20 fps — a 3D scene on a mid-range phone or a
  // thermally throttled tablet lives in that range, and one hitch must not read as a stop.
  // ⭐⭐⭐ **THE FLOOR AND THE SEED, NOT THE THRESHOLD** (2026-09-24). The rest window is now
  // derived per pointer from its own dispatch interval — see `restGapFactor`. ⚠ This value is
  // what a pointer gets before it has any history, and the shortest window any device may use.
  // ⛔ It was **30 ms** and that was below even a ONE-finger dispatch gap on the owner's tablet
  // (47–68 ms measured), so a steadily moving finger was being declared STOPPED mid-drag.
  // ⭐ 50 ms is three frames at 60 Hz — crisp on a fast phone, and the floor never binds on a
  // slow one because the derived value is larger there.
  restConfirmMs: 50,
  // ⚠ A judgement, with a slider: 2.5 intervals of silence. ⛔ No hand has judged it yet.
  restGapFactor: 2.5,
  // ⚠ A guess, with a slider. Long enough for a deliberate lift-and-replace, short enough
  // that a genuine lift to one finger does not feel stuck. IN5.

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
  // ⚠ A GUESS, equal to `gainRotateFree` on purpose: one free DOF should not feel like a
  // different control from three. ⛔ It carried the value the wired gain had (0.07), NOT the
  // 0.6 this name was declared with and nobody ever ran.
  // ⚠⚠ **400 rad/mm WAS TRIED AND REVERTED THE SAME HOUR, 2026-09-18** — the owner asked for
  // it as a default with a 0–500 slider, then asked for both back. ⛔ Kept as a one-line record
  // rather than a dossier: nothing was MEASURED, so it is not a rejected experiment.
  // ⭐ What the attempt is worth remembering for: the near-side direction is a UNIT screen
  // vector, so this really is radians per millimetre — 400 would be 63 full turns per
  // millimetre, which no hand could want. ⚠ If the anchored twist still feels sluggish at 0.07,
  // the gain is the wrong suspect and the thing to chase is what OVERWRITES the twist
  // downstream (the alignment solve re-projecting it, as the snap once ate the roll).
  gainRotateConstrained: 0.07,
  // ⛔ OFF by default — a trial ships off, so what it is compared against is what a hand knows.
  rotationIncrementDeg: 0,
  // ⭐ 1 is DIRECT MANIPULATION: the cube turns exactly as far as the finger swept,
  // and it is what shipped up to now. ⚠ Anything else means the object stops tracking
  // the fingertip — a real trade, and the owner's to make on the glass. `IN5`.
  // ⚠ A12, a guess with a slider. 2 deg/mm means a 45 mm drag rolls the object 90°.
  gainRollDrag: 2,
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
  // ⛔⛔ THE SHIPPED DEFAULT WAS 3.0, SET BY A HAND — ⚠ REVERSED 2026-09-18, see below.
  // Depth is VISUALLY FORESHORTENED: an object pushed along the ground covers world
  // distance while its picture barely changes, so a world-consistent gain reads as
  // sluggish even though it is, in metres, exactly as strong as a drag. ⭐ Equal WORLD
  // motion is not equal PERCEIVED motion, and the eye is what is being served.
  // ⚠ Four gains on this project have now been raised by a hand from a derived or guessed
  // value (×3.4, ×2.3, ×2, and this ×3). ⛔ **A guessed number has been wrong every time;
  // this is the second time a COMPUTED one has been moved too** — the first was rule 6's
  // phantom lead, cut to a fifteenth of its landmark. A computation tells you where a
  // meaningful zero is; it does not tell you where a hand wants to stand.
  // ⭐⭐⭐ **1.17 — THE OWNER'S NUMBER, 2026-09-18**: *"set the default depth gain to 1.17
  // (same as screen-plane gain)."* ⛔ It REPLACES the 3.0 argued for immediately above, and
  // the paragraph is kept because a reversed judgement is worth more than a deleted one.
  //
  // ⚠⚠ **WHAT PROMPTED IT WAS A REPORT ABOUT FEEL, NOT ABOUT TRAVEL**: *"the depth
  // translation by the second touchpoint is less lerp and inertia than the translation in x and
  // y by the first touchpoint — did we wire differently the lerp and inertia for each
  // touchpoint?"* ✅ **No**: there is ONE follower per body, over all three world axes, with one
  // set of constants, and it cannot tell which finger moved the target.
  // ⭐⭐ The asymmetry was the same foreshortening the 3.0 note describes, read the other way
  // round: depth covers world distance that barely changes the picture, so the follower's lag
  // is just as real in metres and much smaller on screen — which reads as *less inertia*.
  // ⚠ Matching the gain does NOT add inertia; it makes a millimetre of finger mean the same
  // travel either way. If the lag still looks different afterwards, that is the foreshortening
  // and no gain can equalise it — only a depth-aware lead could, and none is built.
  //
  // ⭐ **IT ALSO MAKES `depth_translate.ts`'s HEADER TRUE AGAIN.** That file claims *"a given
  // finger travel moves the object as far INTO the scene as it would move it ACROSS"* — which
  // was false by a factor of 2.56 for as long as the two gains differed. ⛔ A comment that
  // states an invariant the constants break is the shape this project keeps paying for.
  gainTranslateDepth: 1.17,
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
  // ⭐ A wide band. A finger swirls anywhere from a tight 5 mm to a lazy 60 mm, and
  // the old [10, 30] silently excluded both ends.
  // ⚠ 150° to DECIDE, swept: the shortest arc at which every realistic swirl
  // commits while no wiggle or sloppy arc does. ⭐ The release cost that used to carry

  // ── The eviction shake (A4). ⚠ Four placeholders; none is measured. ───────────
  evictShakeReversals: 2,
  // ⭐⭐ **300 ms — THE OWNER'S NUMBER, 2026-09-17**, and the first of these four a hand has
  // chosen. ⚠ It replaces my 600 ms, which was *"roughly three unhurried legs"* and untested.
  // ⛔ Halving it makes the gesture CRISPER and harder to reach by accident: two reversals now
  // have to fall inside 300 ms, so a leisurely reposition cannot accumulate into an eviction.
  evictShakeWindowMs: 300,
  // ⭐ **6 mm — the owner's, 2026-09-17.** ⚠ Mine was 8 mm, *"~10× the measured 0.761 mm
  // noise floor"*, and admittedly not known to be the boundary with a corrective nudge.
  // ⛔ It still clears the validator's floor (3× the measured noise = 2.28 mm) with room, so a
  // reversal cannot be jitter — and a shorter leg pairs with the shorter window: the gesture
  // gets smaller and faster rather than smaller and slower.
  evictShakeLegMm: 6,
  // ⭐ **0.45 — the owner's, 2026-09-17**, slightly looser than my 0.4. ⚠ It admits a hand's
  // natural bow and must still refuse a circle; ⛔ the gap between those two is the whole
  // question, and it is a finger's to answer. `shake.test.ts` keeps the circle counter-example
  // at its own fixture values, so the refusal is still proven whatever this number becomes.
  evictShakeStraightness: 0.45,
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
  // ⛔ Fork A — today's behaviour, the only set a hand has closed. 1 = `IN3`,
  // 2 = the owner's third set (inert until specified). See `input/anchor_fork.ts`.

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

  // ⚠ A PLACEHOLDER with a slider — millimetres on the GLASS, converted per frame against the
  // camera distance. ⛔ Not carried over from `snapRadiusFactor`: that was 4L between CENTRES
  // and this is a gap between SURFACES, so the old value would be a number answering the old
  // question. See the field's header.
  captureOffsetMm: 15,
  // ✅ **CHOSEN BY THE OWNER ON THE GLASS, 2026-09-19**, replacing my guess of 25°. ⛔ It is the
  // swing at or below the knee (67 mm/s); above it the speed divisor takes over.
  approachSwingDeg: 30,
  // ✅ **CHOSEN BY THE OWNER ON THE GLASS, 2026-09-19** — and that matters more than where they
  // came from: the previous pair were my guesses, borrowed from `swayReferenceSpeedMmPerS`.
  // ⛔ The knee is `1/gain` = **67 mm/s**, so damping now begins at about half the hand speed it
  // used to, and the 1.7 exponent makes it bite faster above that — a quarter of the swing at
  // twice the knee, where the old pair left a half.
  approachSwingSpeedGain: 0.015,
  approachSwingSpeedExponent: 1.7,
  // ⚠ `0` = the current build, so the trial's existing behaviour is what boots and case 2 is
  // something a hand turns on to compare — the comparison that settled `D28` and `IN13`.
  approachRetargetsOrbit: 0,
  // ⭐⭐ **0 — PINNED, BY THE OWNER'S CHOICE (2026-09-18)**: *"set the default at boot:
  // Pioneer translates = 0 (-> pinned)."*
  // ⚠⚠ **AND IT OVERRULES THE CAUTION I SHIPPED IT WITH.** This read `1` with a comment
  // saying *a new rule does not become the default before a device pass says so*. ⛔ `D38`
  // settled that argument once already and the answer has not changed: **the owner IS the
  // hand**, and a default he has chosen on the glass outranks a default I chose on principle.
  // ⭐ `?pioneerTranslates=1` restores the old behaviour, and the menu toggles it live.
  pioneerTranslates: 0,
  // ⭐⭐ **1 — THE OWNER'S CHOICE AT BOOT** (*"Default at scene boot: WorldAxisB is toggled
  // on"*), so the world-fixed axes are what a hand meets first and `?worldAxisB=0` is the way
  // back to the camera-referred build. ⚠ The reverse of how a trial normally ships here, and
  // deliberate: it is a dictated default, not a caution I chose.
  worldAxisB: 1,
  // ⛔ `0` because `CameraOffsetZoneEnter` HAS NO DEFINITION YET. Turning it on today changes
  // nothing except what the HUD says, and shipping it on would be a slider that does nothing —
  // the exact shape `config_debt.test.ts` exists to refuse.
  cameraOffsetZoneEnterSetupB: 0,
  // ⭐⭐ `1` = PLANE, and it is the DEFAULT because a hand reported the other one as inverted
  // (2026-09-23). ⚠ `?translatePairing=0` is the way back to the dictated channels, now that
  // they track exactly — the comparison the owner should make with a finger.
  translatePairing: 1,
  // ⭐ Blender's number, not mine.
  axisTrackingConeDeg: 5,
  // ✅ **0.05 — THE OWNER'S NUMBER, 2026-09-23** (*"Set the default transparency to 0.05"*),
  // replacing my guess of 0.45 on the first look at it. ⚠ It is a JUDGEMENT, not a measurement,
  // and it is a tenth of what I shipped — ⭐ the sixth time a guessed number has been corrected
  // by a hand on this project, and the first that was too STRONG rather than too weak.
  // ⛔ `0` still restores the build before the flag, which is the A/B.
  followerFaceXrayAlpha: 0.05,
  // ⚠ Placeholder. Deliberately tight: entering the docking mechanism should mean the hand
  // really did align against this thing.
  alignMatchDeg: 15,
  // ⚠ Arbitrary, and that is the point: any fixed value gives three arbitrary poses. Changed
  // by the URL when a different scene is wanted.
  sceneSeed: 20260917,
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
  // ⛔ Below 2 intervals, a single dropped frame reads as a stop — the exact defect the adaptive
  // window replaces. ⭐ The floor is a design bound, not a taste, so the validator holds it.
  if (!(cfg.restGapFactor >= 2) || !Number.isFinite(cfg.restGapFactor)) {
    throw new Error(
      `restGapFactor (${cfg.restGapFactor}) must be a finite number >= 2: it multiplies a ` +
        "pointer's median event interval to decide how much silence means rest, and below two " +
        "intervals one missed dispatch is indistinguishable from a finger stopping.",
    );
  }

  // ⛔⛔⛔ **THE PLAIN RANGES — ADDED BY AUDIT, 2026-09-17.**
  //
  // ⚠⚠ **EVERY RULE BELOW THIS BLOCK IS A *RELATION* BETWEEN TWO TUNABLES**, and that is
  // exactly how the gap survived: the validator was written to catch the subtle
  // configurations (a deadband under the noise floor, rings that fold, a lift window wider
  // than the buffer) and never asked whether a duration was a duration at all. ⭐ So
  // `?tapMaxDuration=-1` passed every check in this function and made **every tap a HOLD**,
  // which makes `D28`'s mode toggle unreachable — the whole input model, disabled by one URL
  // parameter, with a green suite and nothing on the glass.
  //
  // ⛔⛔ **AND `pointerNoiseMm` IS THE LOAD-BEARING ONE.** Three rules here are MULTIPLES of
  // it, so `pointerNoiseMm=0` does not merely set a number to zero — it silently satisfies
  // `evictShakeLegMm ≥ 3×0` and `motionDeadbandMm ≥ 3×0`, disabling two guards that exist to
  // protect the user's work from jitter. ⭐ `METHOD`: *a threshold defined as a multiple of a
  // measurement inherits that measurement's failure modes* — including zero.
  const positiveMs: ReadonlyArray<readonly [string, number]> = [
    ["tapMaxDuration", cfg.tapMaxDuration],
    ["flickWindow", cfg.flickWindow],
    ["flickLiftWindow", cfg.flickLiftWindow],
  ];
  for (const [name, ms] of positiveMs) {
    if (!(ms > 0)) {
      throw new Error(
        `${name} (${ms} ms) must be POSITIVE: a window of zero or less can never contain a ` +
          "sample, so the gesture it measures becomes unrecognisable rather than strict.",
      );
    }
  }
  const nonNegativeMs: ReadonlyArray<readonly [string, number]> = [
    ["doubleTapWindow", cfg.doubleTapWindow],
    ["restConfirmMs", cfg.restConfirmMs],
  ];
  for (const [name, ms] of nonNegativeMs) {
    if (!(ms >= 0)) {
      throw new Error(
        `${name} (${ms} ms) cannot be NEGATIVE: a duration below zero compares as already ` +
          "elapsed, so the rule it gates fires on the first sample it ever sees.",
      );
    }
  }
  if (!(cfg.pointerNoiseMm > 0)) {
    throw new Error(
      `pointerNoiseMm (${cfg.pointerNoiseMm} mm) must be POSITIVE — it is a MEASURED floor ` +
        "(0.761 mm on the reference tablet, 2026-09-14) and three rules in this validator are " +
        "multiples of it. At zero they all pass trivially, so one URL parameter would disable " +
        "the shake's noise guard and the deadband's floor at the same time.",
    );
  }
  if (!(cfg.motionDeadbandMm > 0)) {
    throw new Error(
      `motionDeadbandMm (${cfg.motionDeadbandMm} mm) must be POSITIVE: at zero every rule ` +
        "reads raw pointer noise, which is the defect §1.1 exists to prevent.",
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

  // ⛔⛔ THE RINGS MUST CLIMB. If the heights do not increase bottom → middle → top
  // the surface folds back through itself, and the elevation parameter stops meaning
  // "how high the camera is" — it would move the camera DOWN over part of its range,
  // which no amount of gain tuning can fix because the geometry is wrong.
  if (!(
    cfg.orbitBottomHeightM < cfg.orbitMiddleHeightM &&
    cfg.orbitMiddleHeightM < cfg.orbitTopHeightM
  )) {
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

  // ⛔⛔⛔ **A RING RADIUS MUST BE POSITIVE, AND THE OLD RULE SAID `>= 0`** — audit, 2026-09-17.
  //
  // ⚠⚠ **TWO COMPONENTS ASSERTED OPPOSITE INVARIANTS ABOUT THE SAME CONFIGURATION.** This
  // rule admitted a radius of zero, and `tests/orbit.test.ts` pinned that as deliberate:
  // *"ACCEPTS a top radius of zero — directly overhead is a legal orbit."* ⛔ Meanwhile
  // `render/scene.ts`'s `requireGestureFrame` THROWS when the view runs along gravity, with
  // the comment *"the orbit surface is supposed to make this unreachable — see A7."*
  // ⭐⭐ Both were reasonable in isolation and they cannot both be true: `?orbitTopRadiusM=0`
  // plus a drag to the top ring puts the camera exactly overhead, `gravityFrame` returns
  // `null`, and **every press throws** — one of two components had to yield.
  // ⭐ The FRAME wins, because the degeneracy is real: directly overhead, the view axis is the
  // world vertical, the roll axis *"flattened onto the ground"* is the zero vector, and there
  // is no horizontal heading to call depth. No gain can repair a basis that does not exist.
  // ⚠ So the surface is kept away from the pole instead, which is what `A7` already claimed.
  for (const [name, r] of [
    ["orbitBottomRadiusM", cfg.orbitBottomRadiusM],
    ["orbitMiddleRadiusM", cfg.orbitMiddleRadiusM],
    ["orbitTopRadiusM", cfg.orbitTopRadiusM],
  ] as const) {
    if (!(r > 0)) {
      throw new Error(
        `${name} (${r} m) must be POSITIVE: a ring of radius zero sits on the vertical axis ` +
          "through the target, where the camera looks exactly along gravity. There the " +
          "gesture frame has no roll axis and no depth heading, so gravityFrame returns null " +
          "and every press throws — see A7.",
      );
    }
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
  // ⚠ RESTORED 2026-09-16: this rule has nothing to do with roll and was removed by
  // accident — the sweep that deleted the roll validator matched on the COMMENT above it,
  // which mentioned `rollStepDistance`. ⛔ A bulk deletion keyed on prose deletes prose's
  // neighbours; the vector `a lift window wider than the motion buffer is rejected loudly`
  // is what caught it, one run later.
  if (cfg.flickLiftWindow > cfg.flickWindow) {
    throw new Error(
      `flickLiftWindow (${cfg.flickLiftWindow} ms) exceeds flickWindow ` +
        `(${cfg.flickWindow} ms): the lift-speed window would read samples the ` +
        "motion buffer has already discarded.",
    );
  }
  // ── `A16`'s two, and each one can really fail ───────────────────────────
  //
  // ⭐ `METHOD`: *a guard that cannot fail is not a guard.* Both configurations below are
  // reachable from the URL and both leave every individual function CORRECT while making the
  // mechanism unusable — the class a green suite cannot see.
  // ⚠⚠ THIS RULE WAS REWRITTEN 2026-09-17 AND THE OLD VERSION IS THE INTERESTING PART: it
  // said `> 1`, reasoning that 1.0 × an object's span is exactly where two CUBES touch. ⛔ That
  // reasoning died with the per-object radius — the factor now multiplies the scene's module
  // `L`, not a body's span, so "1" no longer names contact and the old bound was arithmetic
  // about a quantity this field no longer holds. ⭐ A stale guard that still passes is worse
  // than none: it looks like the number has been thought about.
  if (cfg.approachRetargetsOrbit !== 0 && cfg.approachRetargetsOrbit !== 1) {
    throw new Error(
      `approachRetargetsOrbit (${cfg.approachRetargetsOrbit}) must be exactly 0 or 1: it selects ` +
        "a RULE, not a quantity, and a value in between would read as `truthy` and silently " +
        "ship one of the two behaviours while the readout claimed a third.",
    );
  }
  if (cfg.pioneerTranslates !== 0 && cfg.pioneerTranslates !== 1) {
    throw new Error(
      `pioneerTranslates (${cfg.pioneerTranslates}) must be exactly 0 or 1: it selects a RULE, ` +
        "not a quantity, and a value in between would read as `truthy` and silently ship one " +
        "of the two behaviours while the readout claimed a third.",
    );
  }
  if (cfg.worldAxisB !== 0 && cfg.worldAxisB !== 1) {
    throw new Error(
      `worldAxisB (${cfg.worldAxisB}) must be exactly 0 or 1: it selects WHICH BASIS a body is ` +
        "translated along (the boot camera's, frozen, or the live camera's), not a quantity — " +
        "and a value in between would read as `truthy` and freeze the axes while the readout " +
        "claimed the camera was still steering them.",
    );
  }
  // ⛔ An alpha outside [0, 1] is not a stronger overlay: above 1 Babylon clamps and the mesh
  // stops blending, which reads as *the flag stopped working* rather than as a bad number.
  // ⚠ `0` is meaningful (the twin is not drawn), so this is a RANGE and not a positivity test.
  if (!(cfg.followerFaceXrayAlpha >= 0) || !(cfg.followerFaceXrayAlpha <= 1)) {
    throw new Error(
      `followerFaceXrayAlpha (${cfg.followerFaceXrayAlpha}) must be in [0, 1]: it is an OPACITY ` +
        "for the x-ray twin of the FollowerFace marker, 0 being off. NaN fails this too — it " +
        "would silently disable the overlay while the readout claimed a value.",
    );
  }
  if (cfg.translatePairing !== 0 && cfg.translatePairing !== 1) {
    throw new Error(
      `translatePairing (${cfg.translatePairing}) must be exactly 0 or 1: it selects WHICH RULE ` +
        "maps the holder's two numbers onto the object axes (the plane solve or the dictated " +
        "channels), not a quantity.",
    );
  }
  // ⛔ A cone wider than 90° would swallow every axis and leave nothing but the fixed-rate push,
  // which is a state no slider should be able to reach by accident. ⚠ `0` is meaningful (no
  // fallback at all), so this is a RANGE and not a positivity test.
  if (!(cfg.axisTrackingConeDeg >= 0) || !(cfg.axisTrackingConeDeg < 90)) {
    throw new Error(
      `axisTrackingConeDeg (${cfg.axisTrackingConeDeg}) must be in [0, 90): it is a half-angle ` +
        "around the view direction, and at 90 every axis is inside it — exact tracking would be " +
        "unreachable and every translation would run at the fallback rate. NaN fails this too.",
    );
  }
  if (
    cfg.cameraOffsetZoneEnterSetupB !== 0 &&
    cfg.cameraOffsetZoneEnterSetupB !== 1
  ) {
    throw new Error(
      `cameraOffsetZoneEnterSetupB (${cfg.cameraOffsetZoneEnterSetupB}) must be exactly 0 or 1: ` +
        "it selects whether the zone's ENTER edge calls CameraOffsetZoneEnter, which is a RULE " +
        "and not a quantity.",
    );
  }
  // ⛔ `0` is MEANINGFUL here (the swing off), so the rule is a range and not a positivity
  // test — the opposite of `captureOffsetMm` below, where zero would mean *nothing ever
  // captures* and is a mistake rather than a setting.
  if (
    !(cfg.approachSwingSpeedGain >= 0) ||
    !(cfg.approachSwingSpeedExponent >= 0)
  ) {
    throw new Error(
      `approachSwingSpeedGain (${cfg.approachSwingSpeedGain}) and ` +
        `approachSwingSpeedExponent (${cfg.approachSwingSpeedExponent}) must both be >= 0: ` +
        "they form a DIVISOR, and a negative one would mirror the swing mid-approach rather " +
        "than damping it. NaN fails this too — it would silently disable the swing.",
    );
  }
  if (!(cfg.approachSwingDeg >= 0) || cfg.approachSwingDeg > 90) {
    throw new Error(
      `approachSwingDeg (${cfg.approachSwingDeg}) is outside 0..90: the approach swing is a ` +
        "camera lean, and beyond a quarter turn it swings past the join rather than looking " +
        "at it. NaN fails this too, which is the point — it would silently disable the swing.",
    );
  }
  // ⛔ `0` is legal and means OFF, so this is a RANGE and not a positivity test. ⚠ NaN fails
  // it too, which is the point: a bad URL override must be refused out loud rather than quietly
  // turning the mechanism off and looking exactly like the current build.
  if (!(cfg.rotationIncrementDeg >= 0) || cfg.rotationIncrementDeg > 45) {
    throw new Error(
      `rotationIncrementDeg (${cfg.rotationIncrementDeg}) is outside 0..45: 0 is OFF (the ` +
        "unquantised build) and 45 is the coarsest increment the owner asked for.",
    );
  }
  if (!(cfg.captureOffsetMm > 0)) {
    throw new Error(
      `captureOffsetMm (${cfg.captureOffsetMm}) is not positive: a zero or negative capture ` +
        "offset makes every gap test fail, so no pair could ever be highlighted and the whole " +
        "mechanism would be silently unreachable with nothing on the glass to say why.",
    );
  }
  // ⚠⚠ **AND THERE IS DELIBERATELY NO CROSS-TUNABLE RULE FOR IT YET, WHICH IS WORTH STATING.**
  // ⭐ The number it will be coupled to is `MinDistanceBeforeSnapIsConfirmed`, the hold-off —
  // `APPROACH_AND_MATE.md` §1 already records that the two cannot be chosen independently,
  // because a hold-off outside the capture band means nothing can ever dock. ⛔ That field does
  // not exist yet, so a rule relating them would be arithmetic about a quantity this config
  // does not hold. ⚠ The same reasoning retired the old `> 1` bound on `snapRadiusFactor`, and
  // a stale guard that still passes is worse than none: it looks like the number was thought
  // about.
  if (!(cfg.alignMatchDeg > 0 && cfg.alignMatchDeg < 90)) {
    throw new Error(
      `alignMatchDeg (${cfg.alignMatchDeg}°) is outside (0, 90): at 0 no alignment could ever ` +
        "match and the highlights would never appear; at 90 every orientation matches and " +
        "condition 1 stops meaning anything — a whole condition deleted by a number.",
    );
  }

  // ⛔⛔ THE SAGITTA CRITERION WAS DELETED HERE, 2026-09-16, WITH THE GESTURE IT GUARDED.
  //
  // ⭐ It was the one rule in this validator derived from physics rather than chosen: a
  // chord of length L across a circle of radius R bows by L²/(8R), and that bow IS the
  // curvature signal — if it does not clear the pointer's own noise, the measured radius is
  // noise. ⚠ It guarded the CIRCULAR roll's fit, and `A12` retired that gesture; the owner
  // then asked for the roll to be cleaned out of every fork, so the detector, its six
  // tunables and this check went together.
  //
  // ⭐⭐ ITS HISTORY IS WORTH MORE THAN THE RULE, and it is kept in
  // `Claude/10_INPUT_TOUCH/INDEX.md` and `queue_notes/IN5.md`: the check itself carried
  // mistake shape 2 for eight device passes — it read `rollStepDistance² / (8 ×
  // rollRadiusMax)`, a span the product never used at the radius where it never binds, and
  // had the binding radius backwards. ⛔ It surfaced only when `pointerNoiseMm` was finally
  // MEASURED (0.15 → 0.761) and the check rejected a configuration seven device passes had
  // accepted. ⭐ `METHOD`: when the device and the metric disagree, suspect the metric.
}
