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
   * ⚠ Clamped to ×0.3…×3 (`input/sway.ts`): a fast throw reaches twenty times this and would
   * otherwise fling the rest of the scene across the view.
   */
  swayReferenceSpeedMmPerS: number;
  /** ms — the softness of that spring, and when the swing peaks. */
  rotateSwayTauMs: number;


  // ── §1.3 the recognizer ─────────────────────────────────────────────────
  /**
   * ⭐⭐ **THE SNAP CONE, in degrees** — how far from ANTI-PARALLEL the FollowerFace and the
   * PioneerFace may be and the snap still fire (`D100`). ⛔ It was `pioneerCandidateConeDeg`, the
   * fuchsia offer's cone; the offer is DELETED (`D109`, the owner, 2026-09-27: *"Fuchsia cone is
   * used for snap: rename it snap cone angle and move it to snap slider"*) and the cone is the
   * snap's alone. ⚠ The HitFace's own fuchsia contour stays; it never read this. ⭐ *Aligned* is
   * read as **ANTI-PARALLEL** — the mate sense, `D78`'s.
   */
  snapConeDeg: number;
  /**
   * ⭐ `D125`: the opacity of a body's transparent CONTOUR — the margin around its coloured core,
   * tinted in the body's own colour. `0` hides it; `1` draws the whole body solid.
   */
  pieceContourAlpha: number;
  /**
   * ⭐ The scene's shadows: `0` off, `1` on, `2` **AUTO** (`D138`) — on, unless the device measures
   * too slow for them after boot (median frame time over `autoShadowBudgetMs`), then off for the
   * session. Only a scene with lighting casts any. (The owner, 2026-09-28: 10 fps → 20 fps without.)
   */
  shadowsOn: number;
  /** ⭐ `D138`: the median frame time, ms, a device must beat to keep AUTO shadows — 33 ≈ 30 fps. */
  autoShadowBudgetMs: number;
  // ⛔ `D183`: `goalPositionTolM` / `goalAngleTolDeg` are deleted — a GRABBED piece is placed within the snap's own
  // margins (`captureOffsetMm` on the glass, `snapConeDeg`); one never grabbed within the two below.
  /** ⭐ `D183`: mm ON THE GLASS a piece never grabbed may sit from its goal and count as placed (the owner: 1 mm). */
  ungrabbedGoalMm: number;
  /** ⭐ `D183`: degrees a piece never grabbed may be turned from its goal and count as placed (the owner: 1°). */
  ungrabbedGoalDeg: number;
  /**
   * ⭐ `D170`: a demo scene's duration, seconds, from its first move to its last (the 1 s lead-in not
   * counted). The owner: *"the complete demo can be adjusted to run between 10 s to 1 min"*.
   */
  demoDurationS: number;
  /**
   * ⭐ How far every highlight floats off the face or edge it marks, in mm ON THE GLASS — the face
   * fills and contours, the aligned outline, the PioneerFaceCursor (×3). One CSS pixel by default.
   */
  highlightLiftMm: number;
  /**
   * ⭐ `D165` — the OPACITY of the face fills: the cyan FollowerFace and the amber Pioneer face a press fills
   * (`D162`). `1` is the solid fill they were; lower lets the part show through (the owner, 2026-09-29: *"make
   * the amber and cyan face highlights less opaque (provide a slider for that below highlight offset slider)"*).
   */
  faceHighlightAlpha: number;
  /**
   * ⭐⭐ **THE COLLISION ALLOWANCE** (`3D6`, redefined by `D136`), millimetres on the glass: how far a
   * body may SINK into another — contact is allowed, only a deeper overlap is refused. It is the
   * margin a hand has to line a piece up within to slide it into a slot of zero clearance, and the
   * substep of the path check (so a move cannot tunnel). ⚠ Was *the gap every pair is kept apart*,
   * which made `Scene_1`'s touching slots unreachable. ⛔ Must be > 0. Name kept: renaming a tuned
   * number loses its baseline.
   */
  collisionSkinMm: number;
  /**
   * ⭐⭐ (prototype, 2026-10-13, `COLLISION.md` §12) THE ORBITED PIECE'S GAP, millimetres IN THE WORLD (not on the glass — it must not change
   * with the camera): the piece rests this far from any part it is pushed against, and is never closer than half of it. The owner: *"1- ok"*
   * to a fixed ~1 mm gap. ⛔ Must be > 0: at 0 the rule is the penetration test again, its history and its locks.
   */
  pieceGapMm: number;
  /**
   * ⭐ (prototype, 2026-10-13, §12) THE SOLVER'S WORK CAP — the most gap queries one frame's orbit step may make; past it the rest of the step
   * waits for the next frame (never dropped). It replaces the 4 ms clock budget: a count is the same on every device and in every test.
   */
  pieceSolverQueries: number;
  /**
   * ⭐ (prototype, 2026-10-13, the third audit; `COLLISION.md` §12quater) THE ORBIT DRAG'S OWN DEADBAND, mm on the glass — paid once when an axis
   * enters motion and again after each pause; smaller than `motionDeadbandMm` (3.5) so a restart costs less. ⛔ Never under 3× the measured
   * pointer noise (the audit's 1 mm would let a resting finger's noise leak through — the very wobble it exists to stop).
   */
  orbitDeadbandMm: number;
  /**
   * ⭐ (prototype, 2026-10-13, the fifth audit; `COLLISION.md` §12sexies) how long the orbit drag must PAUSE before its band re-arms, ms — a
   * hesitation shorter than this keeps the drag live (⛔ re-armed at the device's own rest window, a careful stop-and-go approach lost 46–87 %
   * of its travel, measured). ⚠ A guess with a slider.
   */
  orbitBandRestMs: number;
  /**
   * ⭐⭐ (prototype, 2026-10-14, the hover; `HOVER.md`) the owner: *"make a slider in object translation to toggle on or off the move of the
   * gizmo"* — 1: a hover drag slides the yellow GIZMO and the piece rides with it (every later orbit turns about the corrected centre); 0: the
   * piece alone, its offset dropped by the next orbit drag (*"Cleared on orbit"*).
   */
  hoverGizmoMove: number;
  /** ⭐ (2026-10-14) the hover's reach from where it began (mm, in the world) — *"from 10mm to 500 mm (in this last case … unlimited)"*. */
  hoverAmplitudeMm: number;
  /**
   * ⭐⭐⭐ (2026-11-01, the owner: *"the camera orbits gradually with the delta position until it reaches the clamped position"*) — the slide's LIMITED ORBIT:
   * the camera's turn per mm of finger (°/mm), the way the piece slides, up to the isometric corner (45° each way, `SLIDE_ORBIT_CLAMP_RAD`).
   */
  slideOrbitDegPerMm: number;
  /**
   * ⭐⭐ (2026-10-16, the owner: *"Add some inertia when sliding the green – turquoise piece. Propose to reapply what we did for translation of a part in world
   * translation."* → *"build the inertia. place the sliders in object translation under subfolder piece sliding"*) — the slide's drawn piece on the part
   * translation's follower: its inertia (ms), its damping ratio (< 1 overshoots a little) and its phantom lead (ms) — 60 ms / 0.5 / 0.2 by default (measured: the part's 7.6 ms smoothed nothing).
   */
  hoverInertiaMs: number;
  hoverDampingRatio: number;
  hoverLeadMs: number;
  /** ⭐⭐ (2026-10-16, the owner: *"can you also add some friction ? (different from inertia)"* → *"Kinetic (drag)"*) — the slide's kinetic friction, mm/s on
   * the glass: a finger step is scaled by speed / (speed + this); 0 = off. */
  hoverFrictionMmS: number;
  /** ⭐ (2026-10-14) the hover's gain — 1: the piece under the finger. */
  hoverGain: number;
  /**
   * ⭐⭐ (2026-10-14, the owner: *"In the attached configuration the green piece is declared having achieved its goal: this is wrong: not centered, not aligned in quad rotation."*) THE ORBITED PIECE'S GOAL MARGINS, IN THE WORLD — mm and degrees. ⛔ It was judged by a grabbed part's:
   * the snap's 10 mm ON THE GLASS at the camera's distance (182 mm at 4.25 m, measured) and 15° — loose on purpose for a part the capture then
   * pulls exactly, far too loose for a fine placement: 35 mm off and 12° off read as placed.
   */
  orbitGoalMm: number;
  /** ⭐⭐ (2026-10-14, *"I think the contact check is too strict. It is difficult for the user to judge the contact depending on the camera view. Also, it may be difficult to achieve the contact based only on orbit movement. Propose something to ease the contact and its perception by the user"* → *"Build A&B"*) the hover's REACH: a resting face looking at a part's face this close (mm, in the world) may hover — the piece settles onto it first. */
  hoverApproachMm: number;
  orbitGoalDeg: number;
  /** ms of motion buffer the release reads (`trimBuffer`) — the lift speed and the recognizer's speed. */
  flickWindow: number;
  /**
   * ms. The trailing window the LIFT SPEED is averaged over.
   * ⛔⛔ NOT THE LAST SAMPLE PAIR. A browser emits `pointerup` at whatever position
   * and time it likes — very often repeating the last `pointermove` coordinates —
   * and a two-sample estimator reads that as a dead stop. ⚠ It once decided the (since deleted,
   * `D110`) flick; it is a readout now. See flick.ts.
   */
  flickLiftWindow: number;
  // ⛔ `flickLiftSpeed`, `flickDistance`, `flickPurity` are DELETED with the flick (`D110`); the two
  // windows above survive — the release buffer and the lift-speed readout still read them.

  // ── THE UNSNAP'S RAPID MOVE (`D100`) ─────────────────────────────────────────
  // ⛔ These were the eviction shake's window and leg (`A4`); the shake is DELETED (`D107`) and the
  // unsnap, which borrowed them (*"same sliders as eviction shake"*), keeps them under its own name.

  /**
   * mm. Typical position noise of ONE pointer sample from a resting finger.
   * ⭐⭐ A DEVICE PROPERTY, not a preference, and it is what decides whether a
   * curvature can be measured at all. ⚠ Measured trivially on a device: hold still
   * and read the spread. `IN5`, and it is the first one to measure — several other
   * thresholds are only defensible relative to it.
   */
  pointerNoiseMm: number;

  // ── §1.3 taps ──────────────────────────────────────────────────
  // ⭐ NOT IN THE SPEC. They were added because §1.4 / rule 2septies made a double-tap the
  // way a constraint was evicted (deleted since: a double tap on a body is the undo, `D111`),
  // and §1.3's state machine stopped at TAP. Recorded in `Claude/10_INPUT_TOUCH/INDEX.md`.

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
  /**
   * ⭐ Prototype (green box), 2026-10-02: a FOURTH ring between the bottom and the middle (`orbitLower…`), on when 1 — four rings
   * evenly spaced in the elevation parameter (bottom 0, lower ⅓, middle ⅔, top 1). 0: the three rings as ever.
   */
  orbitLowerRingOn: number;
  /** Metres. Radius of the LOWER ring (the fourth, between the bottom and the middle), when on. */
  orbitLowerRadiusM: number;
  /** Metres. Height of the LOWER ring, when on — between the bottom's and the middle's. */
  orbitLowerHeightM: number;
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
  /** ⭐ Prototype (`input/follow_camera.ts`): degrees the green box may orbit away from the camera, per axis, before it drags the camera. */
  cameraLeashDeg: number;
  /** ⭐ Prototype: the camera's yaw offset from its orbit position, degrees — so the green box does not hide the yellow target. */
  cameraYawOffsetDeg: number;
  pieceOrbitGapMinPct: number;
  orbitPieceYawFactor: number;
  pieceOrbitEnterMm: number;
  /** ⭐⭐ (2026-10-18, the owner) THE TOP ROLL's band: over a crossing (a horizontal face) the half-round turns only while the view is within this
   * many degrees of straight above (below) — elsewhere the camera stays upright in the curve's vertical plane (°, 2–60). */
  topRollBandDeg: number;
  /** ⭐⭐ (2026-10-19, the owner) the YELLOW QUAD by yaw: each quad's slice of a lap at most this (°) — the lap a whole multiple of the quads (anchored). */
  quadSliceMaxDeg: number;
  /** ⭐⭐ (2026-10-19, the owner) THE TURN GOVERNOR on a curve that passes over the gizmo (a horizontal face): at most this many degrees of camera turn
   * (view and roll together) per mm of dy — the dy gain lowered where the camera would turn faster (°/mm). */
  /** ⭐⭐⭐ (2026-10-28, the owner) THE ORBIT: 0 — AROUND THE ASSEMBLY (dx yaw, dy pitch ±85°, two fingers' / Shift + drag's dy the approach to the gizmo the
   * ray finds — `input/assembly_orbit.ts`); 1 — along the gizmo's 2D curve, as built to 2026-10-25 (kept whole, *"I may revert later on"*). */
  orbitMode: number;
  /** ⭐ (2026-10-28) the look point is the gizmo within this distance of the piece (m) (`lookShare`) — ⛔ the close-in LOCK it once set is deleted (Step 1). */
  assemblyLockDistM: number;
  /** ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, Step 2) THE SHELL's offset (mm): the piece and the camera on the smooth shell round the placed parts' box beyond it, onto the gizmo within it (`input/orbit_shell.ts`). */
  orbitShellOffsetMm: number;
  /** ⭐⭐ (2026-11-04, `1.0.95-`, the owner: *"add a slider for gizmo position and one for orbit angles"*) THE PIECE'S LAG BEHIND THE GIZMO, in two parts:
   * the gizmo's position the piece and the camera follow (its foot on the shell), eased with this time constant (ms; 0: at once — the ring is never eased) */
  gizmoEaseMs: number;
  /** ⭐⭐ …and the orbit's angles (yaw, pitch, zoom), on a critically damped spring of this time constant (ms; 0: at once) — the travel counts that share the
   * orbit's spring with it (the piece's entry, its aim, the centre's return) */
  orbitSpringMs: number;
  /** ⭐⭐⭐ (2026-11-10, POLAR_ORBIT_CLEANUP.md §9.4 — the owner's TILTED POLE) a press on a cap tilts the orbit so the cap is a side (1); off (0): the polar cap as before. */
  tiltedPole: number;
  /** ⭐⭐⭐ (2026-11-10, the owner: *"limit the speed of the scene tilt at crossing"* → *"one speed for every tilt"*) EVERY tilt — the roll back to upright, the swing of a tilt just made — at this speed (°/s; 0: at once) — ⛔ `tiltRollMinMs` (a whole roll in 250 ms whatever its size) replaced. */
  tiltRollDegS: number;
  /** ⭐⭐⭐ (2026-11-10, the owner: *"at close distance (… xx% of the max distance, make a slider) it toggles on automatically"*) the tilt made by itself as the gizmo enters a top / bottom, within this % of the far distance (off beyond it + 5); 0: never (the press only). */
  tiltAutoM: number;
  /** ⭐⭐⭐ (2026-11-04, the tilted orbit's rebuild, STEP 5 — D5, the owner: *"step 5: ok"*) THE FACES CONTOUR: the placed parts' faces within this angle of
   * a facet's normal are that facet's (deg — `Scene_1`'s slanted block, 15° off −z, is the front's)… */
  facetMergeDeg: number;
  /** ⭐⭐⭐ …and a facet is kept only when the real face area in its plane (its main region, holes closed) is at least this share of its own polygon on the
   * contour (0 … 1) — a frustum's slanted side, a plane cutting the contour across, never tilts the orbit; `Scene_1` keeps exactly its six faces */
  facetMinShare: number;
  /** ⭐⭐⭐ THE CALM (58d86ff's face-span orbit share, ported 2026-11-04 `1.0.95-` — the owner: *"It shall stay"*): the share of the orbit's angle shown along
   * dx's axis in the middle of a face (0 … 1), its edge zone (% of the gizmo's run along it) and the zone's minimum (cm) */
  faceSpanShareH: number;
  faceSpanZoneHPct: number;
  faceSpanZoneMinHCm: number;
  /** ⭐⭐⭐ …dy's (1 on, 0 off), with dx's defaults */
  faceSpanShareVOn: number;
  faceSpanShareV: number;
  faceSpanZoneVPct: number;
  faceSpanZoneMinVCm: number;
  /** ⭐ (2026-10-28) at an edge the gizmo's face switches only once the ray lands this far past it (mm, in the world — an edge is a place on the assembly) — the quads do not flicker. */
  gizmoEdgeMarginMm: number;
  /** ⭐ (2026-10-28, the optional) the sections the gizmo travels along drawn — green the horizontal one, red the yaw plane's (1 on, 0 off). */
  sectionLines: number;
  orbitTurnCapDegMm: number;
  /** ⭐⭐ (2026-10-19) …and on any other curve (a vertical face, no face): the view between rings 2 and 3 slowed to this (°/mm). */
  orbitTurnCapVerticalDegMm: number;
  /** ⭐ Prototype (2026-10-11): the PINK GIZMO (the ring at the orbit centre) drawn (1) or hidden (0). */
  pinkGizmoVisible: number;
  /** ⭐⭐ (2026-10-15, the owner: *"make a slider for non-yellow quad highlight transparency (edges and fill)"*) the non-yellow quads' edge opacity (0 … 1); their fill a quarter of it (`QUAD_UNLIT_FILL_SHARE`). */
  quadUnlitAlpha: number;
  /** ⭐ Prototype (2026-10-12, §25): the resting-face quads' growth with the gizmo's distance — a LOGARITHM, ln(1 + k·t) / ln(1 + k), this its
   * steepness k (`quadSize`; it was a power, 3). */
  quadGrowthLogK: number;
  /** ⭐ Prototype (2026-10-12): the ORBITED PIECE's farthest distance from the orbit centre (m) — the rings beyond it are cut (`clampPieceRadiusM`). */
  pieceRadiusMaxM: number;
  /** ⭐ Prototype (2026-10-12): zoom → roll without lifting — how long the second finger must REST before the first finger's dx rolls (ms). */
  holdSwitchRestMs: number;
  pieceOrbitReturnMm: number;
  /** ⭐ Prototype: the camera's pitch offset from its orbit position, degrees (+ = above). */
  cameraPitchOffsetDeg: number;
  /** ⭐ Prototype: the camera's orbit radius = the green box's + this, millimetres (100–2000, the owner's range). */
  cameraRadiusOffsetMm: number;
  /** ⭐ Prototype: the green box orbit's YAW gain, a multiplier on `gainOrbitYaw` (the owner: *"the green box orbits too fast"*). */
  boxGainYaw: number;
  /** ⭐ Prototype: the green box orbit's PITCH gain, a multiplier on `gainOrbitElevation`. */
  boxGainPitch: number;
  /**
   * ⭐ Prototype: the box's gain while it is INSIDE the camera leash, a multiplier ramped up to 1 at the leash edge (the owner,
   * 2026-10-01: *"reduce the gains while the green box is within the leash zone … but maintain the orbit speed beyond"*).
   */
  boxGainInsideLeash: number;
  /** ⭐ Prototype: the zoom the scene BOOTS at (the owner, 2026-10-01: *"set the default zoom at 1.5"*). `0` = the derived rule (half the maximum radius). */
  bootZoom: number;
  /** ⭐ Prototype: `1` — a piece in its goal cannot be moved or turned (`goal_lock.ts`); `0` re-enables it. */
  lockPlacedPieces: number;
  /** ⭐ Prototype: the green box's ease after the rig, ms (an exponential time constant; 0 = none — it steps with the input events). */
  boxSmoothMs: number;
  /** ⭐ Prototype: how long an axis must stay still before the camera settles on it, ms. */
  cameraSettleDelayMs: number;
  /** ⭐ Prototype: when the orbit finger is LIFTED, a camera at rest realigns on a spring of this time constant, ms. */
  cameraCatchUpMs: number;
  /** ⭐ Prototype: the camera's TIME LAG on top of the leash — its follow time constant, ms (`cameraLag`); 0 = none. */
  cameraFollowMs: number;
  /**
   * ⭐ Prototype: how far the scene SWINGS about the yellow target when the green piece orbits, degrees — at the reference finger
   * speed; scaled by it like every sway (`swayScale`), on the sway's spring (`translateSwayTauMs`). 0 = none.
   */
  orbitSwayDeg: number;
  /** ⭐ Prototype: the orbit swing's softness, ms — when it peaks, and how fast it springs back (~5× this to settle). */
  orbitSwayTauMs: number;
  /** ⭐ Prototype: which orbit sway — 0 the swing, 1 the slide, 2 both (`orbitSwayKinds`). */
  orbitSwayKind: number;
  /** ⭐ Prototype: the orbit SLIDE's peak, mm on the glass, at the reference finger speed (scaled by it like every sway). */
  orbitSlideMm: number;
  /** ⭐ Prototype: the green piece's ORBIT INERTIA — its coast's time constant per cm³ of its volume, ms (`inertiaTauMs`); 0 = none. */
  orbitInertiaGain: number;
  /** ⭐ Prototype: the share of the half-view the green piece is kept inside (`minGreenZoom`) — 0.9 = the central 90 % (the owner, 2026-10-02; was 0.8). */
  greenKeepInViewMargin: number;
  /** ⭐ Prototype: WHICH piece the orbit carries — 0 the green frustum, 1 the turquoise hexagonal prism (the SCENE menu); a change respawns it as at boot. */
  orbitPieceKind: number;
  /** Radians of yaw per MILLIMETRE of finger travel. ⛔ Never per pixel. */
  gainOrbitYaw: number;
  /** Elevation parameter (0 = bottom ring, 1 = top) per MILLIMETRE of finger travel. */
  gainOrbitElevation: number;

  // ── §2 / §4 rules ───────────────────────────────────────────────────────
  /** §1: the barycentre candidate set grows as 2^N − N − 1. Cap it. */
  maxBarycenterCandidates: number;

  // ── mate geometry ───────────────────────────────────────────────────────
  /** ⛔ NEGATIVE. A mate is anti-parallel; see core/mate_connector.ts. */
  mateFacingCos: number;
  /** Residual at which a mate breaks — metres and radians, judged separately. */
  mateBreakLinear: number;
  mateBreakAngular: number;

  // ── THE CAPTURE OFFSET AND THE SNAP ────────────────────────────────────
  // Design of record: `Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md` §1, §12, §19. ⛔ Born as
  // `A16`'s highlight condition; the white highlight is deleted (`D120`) and the offset is the
  // snap's reach now.
  // ⚠ `MinDistanceBeforeSnapIsConfirmed` is deliberately ABSENT — the hold-off is not
  // built, and `config_debt.test.ts` refuses a tunable nothing reads.

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
   * ⭐⭐ **THE SNAP'S OWN TIME** — the owner, 2026-09-26: *"make the snap translation movement faster
   * and more abrupt so the user can feel as if there was a magnet effect."* ⚠ The position half of
   * a snap used to borrow the alignment's 129 ms; this is shorter and rides `magnetEase`, which
   * ACCELERATES into contact. `0` = arrive at once.
   */
  snapMs: number;

  /**
   * ⭐⭐ The seed for the boot scene's three random orientations.
   *
   * ⛔ SEEDED so the scene is REPRODUCIBLE — `?sceneSeed=7` rolls a new one, and the one that
   * showed a defect can always be reloaded. ⚠ Not a gesture tunable and not a slider; it lives
   * here only because this is where URL overrides are parsed and validated.
   * ⛔ `core/random_pose.ts` argues the case.
   */
  sceneSeed: number;
  /**
   * ⭐⭐ **WHICH SCENE BOOTS** — an index into `content/scenes.ts` (the owner, 2026-09-27: *"toggle with
   * a slider between Scene_0 and Scene_1. When the slider is toggled, the corresponding scene boot
   * from beginning"*). ⛔ Read ONCE, at boot: the slider rewrites `?sceneIndex=` and reloads the page,
   * so nothing — bodies, lights, seats, undo, the episode count — survives from the other scene.
   */
  sceneIndex: number;
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
  // four are now load-bearing for a MODE, not only for the (since deleted) flick test.

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
  // ⚠ Still guesses, with sliders.
  rotateSwayTauMs: 180,
  // ⚠ Both placeholders, and a guessed number has been wrong every time on this project.
  // ±35% is a guess at how closely a hand holds two fingers in step.


  // ⚠ The deleted fuchsia offer's 15°, inherited unjudged by the snap (`D109`).
  snapConeDeg: 15,
  // ⚠ A guess with a slider: faint enough to keep the gap between the cores, visible enough to show the faces.
  pieceContourAlpha: 0.1,
  // ⭐ `D138`: AUTO — the device's own frame time decides, once, after boot.
  shadowsOn: 2,
  // ⚠ A judgement with a slider: 30 fps is where a touch drag stops feeling direct.
  autoShadowBudgetMs: 33,
  // ⭐ `D183`, the owner, 2026-09-30: *"if a piece was never grabbed, the criteria shall restrict to 1mm on the glass and
  // 1 degree"* — so zooming out cannot place a piece nobody moved.
  ungrabbedGoalMm: 1,
  ungrabbedGoalDeg: 1,
  // ⭐ The owner, 2026-09-29: *"set default demo duration to 23 s"* (30 at `D170`, then 20); a slider in SCENE, 10–60 s.
  demoDurationS: 23,
  // ⭐ The owner, 2026-09-28: 0.1 mm (was one CSS pixel, 25.4 / 96 mm). ⭐ Measured safe: it stays ~67/d times
  // above a 24-bit depth buffer's resolution at d metres (the camera's 0.01–100 m planes) — 13× at 5 m, vectored.
  // ⚠ Raise it if a far zoom flickers (a device with a coarser depth buffer).
  highlightLiftMm: 0.1,
  // ⭐ `D165`: *"less opaque"* than the solid fill. ⭐ `D166`: the owner set it, 2026-09-29 — 0.17.
  faceHighlightAlpha: 0.17,
  // ⚠ A guess with a slider: small enough to read as contact, large enough to stay above GJK's noise.
  collisionSkinMm: 0.3,
  // ⭐ the owner's ~1 mm (2026-10-13)
  pieceGapMm: 1,
  // ⚠ a guess with a slider — each query is one GJK pass over the parts within reach
  pieceSolverQueries: 24,
  // ⭐ 3 × pointerNoiseMm (0.761), rounded up — the floor `motionDeadbandMm` is held to
  orbitDeadbandMm: 2.3,
  orbitBandRestMs: 400,
  // ⭐ (2026-10-14, the owner: *"Set default gizmo moves with hover off and hover distance is unlimited"*) the piece alone, unlimited
  hoverGizmoMove: 0,
  // ⚠ guesses with sliders
  hoverAmplitudeMm: 500,
  // ⚠ a guess with a slider: 45° in ~22 mm of finger (the orbit's own yaw is ~5.1°/mm — "gradually")
  slideOrbitDegPerMm: 2,
  // ⭐ (2026-10-16) MEASURED on a touch slide (headless): the part translation's 7.6 ms / 0.2 smoothed nothing — the per-frame solved steps showed through,
  // 42 mm in one frame; 60 ms / 0.5: the largest step 11.8 mm, an overshoot of 2.6 mm (under the 3 mm cap). The lead is the part's.
  // ⭐ (2026-10-16, the owner: *"set default slide inertia = 40 ms, slide damping ratio = 0.93, slide phantom lead raise the slider"*) — 40 ms / 0.93
  hoverInertiaMs: 40,
  hoverDampingRatio: 0.93,
  // ⭐ (2026-10-16, the owner: *"set the slide phantom lead to 9.75 ms and slide friction to 12.5 mm/s"*)
  hoverLeadMs: 9.75,
  // ⚠ (2026-10-16) a guess with a slider: at 10 mm/s a slow finger moves the piece half as far
  // ⭐ (2026-10-16, the owner: *"set the slide friction to 8 mm/s"*)
  hoverFrictionMmS: 8,
  hoverGain: 1,
  // ⚠ guesses with sliders: within the hover's reach; the quads turn exactly, so the angle is only room for rounding
  orbitGoalMm: 5,
  // ⚠ a guess with a slider
  hoverApproachMm: 20,
  orbitGoalDeg: 3,
  flickWindow: 120,
  // ⚠ Placeholder, like every number here. Long enough to span several pointer
  // samples at 60-120 Hz, short enough to still mean "at lift". IN5 measures it.
  flickLiftWindow: 40,
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

  // ⭐ the owner, 2026-10-05 (option 1): Unity's default tap time, for EVERY tap in the game (was 250) — a slider in SCENE
  tapMaxDuration: 200,
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
  // ⚠ 2026-09-28: the bottom ring lowered to −1.2 m — the eye is now √(0.5² + 1.2²) = 1.30 m out at the
  // bottom (was 0.71 m), so the waist is deeper and the "1.14 vs 0.71" asymmetry above is historical.
  orbitBottomRadiusM: 0.5,
  // ⭐ The owner, 2026-09-28: the bottom ring lowered to −1.2 m (was −0.5), in every scene's rig.
  orbitBottomHeightM: -1.2,
  orbitMiddleRadiusM: 0.36,
  orbitMiddleHeightM: 0.1,
  // ⭐ prototype (green box), 2026-10-02: no fourth ring by default — a scene turns it on (`OrbitRig.lowerRadiusM`).
  orbitLowerRingOn: 0,
  orbitLowerRadiusM: 0.36,
  orbitLowerHeightM: -0.1,
  orbitTopRadiusM: 1.0,
  orbitTopHeightM: 0.55,
  // ⭐ Chosen on the device by the owner, 2026-09-14. ⚠ `0` reproduces the old jump.
  orbitBlendDistanceMm: 30,
  // ⚠ A GUESS, with a slider. Two fingers of one hand land within roughly 30–80 ms of
  // each other; 120 covers that with margin without being long enough to notice.
  orbitCentreGraceMs: 120,
  // ⚠ Prototype guesses, with sliders in CAMERA.
  cameraLeashDeg: 0, // ⭐ the owner, 2026-10-02: 1.5, then 0.5, 0, 0.05, then back to 0 (was 3) — the camera right behind the box
  // ⚠ Prototype guesses, with sliders: enough to see the target past the box (~10° on screen), and half the orbit speed.
  // ⭐ The owner, 2026-10-01: *"Set camera yaw offset at 3 degrees, camera pitch offset at 2 degrees"*.
  cameraYawOffsetDeg: 2.5, // ⭐ the owner, 2026-10-05 (was 3)
  // ⭐ prototype, the owner 2026-10-06: around the piece, the gap at the rings' closest, % of the camera's distance from the piece at the
  // resting-face alignment (`scaledGap`)
  pieceOrbitGapMinPct: 50,
  // ⭐ prototype, the owner 2026-10-06: *"when in orbit around center, yaw rotate the piece in the other direction"*, *"rotate twice
  // faster"* — before the alignment the piece turns on itself this many times the orbit's turn, in its sense (−1 was the old "against")
  orbitPieceYawFactor: 3, // the owner, 2026-10-06: 3 (was 2)
  // ⭐ prototype, the owner 2026-10-08: the WAY IN (`PieceEntry`) — ONE value for the camera's move to the piece orbit's pose and its view
  // from the gizmo to the piece, the fingers keeping the centre orbit meanwhile; it replaced a 60 mm fade and a 10 mm slerp
  topRollBandDeg: 20, // ⭐ the owner, 2026-10-17/18
  quadSliceMaxDeg: 30, // ⭐ (2026-10-20, *"Same quad switch speed as current"*) 3 or 4 quads → 12 slices of 30°, as 6 quads at 40° (2026-10-19)
  orbitMode: 0, // ⭐⭐⭐ (2026-10-28) the orbit around the assembly
  assemblyLockDistM: 0.3, // ⭐ (2026-10-28) the look at the gizmo within 30 cm (the lock deleted 2026-11-04)
  orbitShellOffsetMm: 60, // ⭐⭐⭐ (2026-11-04, Step 2) the shell's offset
  gizmoEaseMs: 45, // ⭐⭐ (2026-11-04, the owner: *"update the lag the gizmo's position the piece follows to 45ms"*; 62, 55 before, the former GIZMO_TAU_MS 90)
  orbitSpringMs: 30, // ⭐⭐ (2026-11-04) the former boxSmoothMs / 2 for the orbit's spring
  tiltedPole: 1, // ⭐⭐⭐ (2026-11-10, §9.4) the tilted pole on
  tiltRollDegS: 360, // ⭐⭐⭐ (2026-11-10, *"yes"*) …its roll back at most 360°/s (a half turn 0.5 s, a side's 63° 0.18 s) — a guess until a hand sets it
  tiltAutoM: 0.3, // ⭐⭐⭐ (2026-11-10, the owner: *"instead Percent use m for the slider tilted pole automatic within this and set the default to 0.3 m"*) the automatic tilt within 0.3 m of the gizmo (off beyond 0.35 m) — 20 % of the far distance before (1.2 m on `Scene_1`), 30 % before that
  facetMergeDeg: 20, // ⭐⭐⭐ (2026-11-04, Step 5, D5) the faces contour: the faces within 20° of a facet's normal are its (MAP_AXIS_DEG's)…
  facetMinShare: 0.25, // …and a facet kept with a quarter of its polygon real face at least
  faceSpanShareH: 0.25, // ⭐⭐⭐ (58d86ff, *"1- ok as recommended"*) a quarter of the orbit's angle shown in the middle of a face
  faceSpanZoneHPct: 25, // ⭐⭐⭐ (58d86ff, *"2- ok as recommended"*) the edge zone a quarter of the run
  faceSpanZoneMinHCm: 3, // …at least 3 cm
  faceSpanShareVOn: 1, // ⭐⭐⭐ (58d86ff, *"3- make a slider to toggle on or off the dy"*) dy's angle compressed too
  faceSpanShareV: 0.25, // …with dx's defaults
  faceSpanZoneVPct: 25,
  faceSpanZoneMinVCm: 3,
  gizmoEdgeMarginMm: 5, // ⭐ (2026-10-28) the face's switch 5 mm past an edge
  sectionLines: 1, // ⭐ (2026-10-28) the sections drawn
  orbitTurnCapDegMm: 12.5, // ⭐ (2026-10-19, the owner: *"set the turn governor horizontal face to 12.5"*; first 40) the horizontal face's turn over the top (96°/mm at the shipped gains, view and roll) capped
  orbitTurnCapVerticalDegMm: 12.5, // ⭐ (2026-10-19, the owner: *"same for vertical faces"* — 12.5; first 10) the vertical face's view between rings 2 and 3 (20°/mm at the shipped gains) slowed
  pieceOrbitEnterMm: 12, // the owner, 2026-10-08: *"Set the way in to the orbit at 12 mm"* (was 60)
  // ⛔ (2026-10-12) the pink highlights' hold / fade (`highlightHoldMs`, `highlightFadeMs`) deleted with the pink face from a part
  // ⭐ prototype, the owner 2026-10-11: *"add a slider to hide the pink gizmo"* — shown by default (*"make the default pink gizmo hidden"*, then *"set the default : pink gizmo shown"*, the same day)
  pinkGizmoVisible: 1,
  // ⭐ the owner's 0.13 (2026-10-15, *"Set non-yellow quad opacity to 0.130"*; was 0.1) — the edges; the fill a quarter (0.0325)
  quadUnlitAlpha: 0.13,
  // ⭐ prototype, the owner 2026-10-12: *"change the power 1.5 of the quads scaling to 3, maintain the 1.4 max scale"* → *"create a slider for
  // the power of the scaling distance"* → *"instead of power 3 for the quad scale, use a logarythm curve so that the quads and resting face grow faster when they are small"* — the log curve's steepness
  quadGrowthLogK: 9,
  // ⭐ prototype, the owner 2026-10-12: *"modify the 1st and 4th ring so that the piece can go up to 6 m away from the yellow gizmo"* — it rode
  // the camera's maximum (`cameraRadiusMaxM`, 3 m) → 5 m, then *"revert to the 6m max distance geometry as it was in previous commit: this geometry allows each quad to become yellow during orbit at maximum distance"*
  pieceRadiusMaxM: 6,
  // ⭐ prototype, the owner 2026-10-12: *"Build with the 150ms rest"*
  holdSwitchRestMs: 150,
  // ⭐ prototype, the owner 2026-10-07: the way back to the centre orbit, ONE value for the move and the view (*"with 10mm and 60mm merged
  // into one single value"* — *"60 mm"*): finger travel, eased (`returnProgress`); 30 since 2026-10-08 (*"Set way out in 30mm"*)
  pieceOrbitReturnMm: 30,
  cameraPitchOffsetDeg: 2,
  // ⚠ 1500 mm: the boot view's distance under the rule it replaces (box 1.5 m out, camera 3.0 m) — so nothing jumps.
  cameraRadiusOffsetMm: 1250, // ⭐ the owner, 2026-10-01 (was 1500)
  boxGainYaw: 1.65,
  boxGainPitch: 0.5,
  // ⚠ A guess with a slider (0.05–1, step 0.05 — the owner's range).
  boxGainInsideLeash: 0.35, // ⭐ the owner, 2026-10-01 (was 0.5)
  bootZoom: 1, // ⭐ the owner, 2026-10-02: 1.00, with Scene_1's rings ×1.5 so the scene is unchanged (was 1.5)
  lockPlacedPieces: 1,
  // ⚠ About one pointer interval on the tablet (`D86`: 47–68 ms), so a step is covered by the next event.
  boxSmoothMs: 60,
  // ⭐ The owner: *"set camera settle delay after an input to zero"* (⚠ a frame with no pointer event then reads as stopped).
  cameraSettleDelayMs: 0,
  // ⚠ A guess with a slider: ~0.5 s to arrive (a critically damped spring covers 95 % in ~4.7 τ).
  cameraCatchUpMs: 120,
  // ⭐ The owner, 2026-10-02: *"set the default camera lag to 0"* (was 150 ms, a guess) — no lag; the slider still adds one.
  cameraFollowMs: 0,
  // ⚠ A guess with a slider (the owner, 2026-10-02: *"build 1-3"*) — the rotation sway's 0.3° is lost against an orbit.
  orbitSwayDeg: 4.5, // ⭐ the owner, 2026-10-03 (was 8; 2 before)
  // ⭐ The owner, 2026-10-02: *"I want the sway to resolve quickly"* — a third of the held piece's 180 ms (a guess, with a slider).
  orbitSwayTauMs: 70, // ⭐ the owner, 2026-10-03 (was 65; 60 before)
  // ⭐ Option 1 (the swing) unless switched; option 2's slide a guess, with a slider.
  orbitSwayKind: 0,
  orbitSlideMm: 5,
  // ⚠ A guess with a slider (the owner, 2026-10-02: *"add a slider for orbit inertia gain"*): ×182 cm³ → τ ≈ 180 ms, a ~1 s coast.
  orbitPieceKind: 0, // ⭐ prototype, the owner 2026-10-04: *"a slider in scene menu to choose between the green piece or the turquoise piece"*
  greenKeepInViewMargin: 0.9, // ⭐ prototype (green box), the owner 2026-10-02 (was 0.8, a guess)
  orbitInertiaGain: 0.15, // ⭐ the owner, 2026-10-02: 1, then 0.45, then 0.15 — τ ≈ 28 ms for the green piece
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

  mateFacingCos: -0.85,
  mateBreakLinear: 0.02,
  mateBreakAngular: 0.35,

  // ⚠ A PLACEHOLDER with a slider — millimetres on the GLASS, converted per frame against the
  // camera distance. ⛔ Not carried over from `snapRadiusFactor`: that was 4L between CENTRES
  // and this is a gap between SURFACES, so the old value would be a number answering the old
  // question. See the field's header.
  // ⛔⛔ **10 mm — THE OWNER, 2026-09-26** (*"set default capture offset to 10 mm"*), after 15 → 4 →
  // 5 → 15 the same day. ⚠ The radius is the SNAP's reach now (`D100`). At the boot camera 10 mm is
  // ~40 mm of world, so NOTHING captures at rest at boot (the tilted pyramid is 53 mm off the plate).
  captureOffsetMm: 10,
  // ⚠ A guess, with a slider — a magnet's pull is a feel only a hand can judge.
  snapMs: 60,
  // ⚠ Arbitrary, and that is the point: any fixed value gives three arbitrary poses. Changed
  // by the URL when a different scene is wanted.
  sceneSeed: 20260917,
  // ⭐ `D144`, the owner, 2026-09-28: *"Default screen boot = scene_1 for the moment."* — `Scene_1`, the
  // painting, is the level being built; `?sceneIndex=0` still boots the workbench.
  sceneIndex: 1,
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
  if (!Number.isInteger(cfg.sceneIndex) || cfg.sceneIndex < 0) {
    throw new Error(`sceneIndex (${cfg.sceneIndex}) must be a whole number ≥ 0 — an index into the scene registry.`);
  }


  if (!Number.isFinite(cfg.snapMs) || cfg.snapMs < 0 || cfg.snapMs > 400) {
    throw new Error(
      `snapMs (${cfg.snapMs}) must be between 0 and 400 ms: it is how long the FollowerFace ` +
        "centre takes to reach the PioneerFaceCursor once the snap fires.",
    );
  }

  // ⛔ The owner's range, and `grabbedCursor` clamps to it as well — a validator catches a URL typo
  // at boot instead of letting it ship as a silently different reach.
  if (!Number.isFinite(cfg.collisionSkinMm) || cfg.collisionSkinMm <= 0 || cfg.collisionSkinMm > 5) {
    throw new Error(
      `collisionSkinMm (${cfg.collisionSkinMm}) must be in (0, 5] mm: it is how far a body may sink ` +
        "into another (D136), and the path check's substep — at 0 nothing could be lined up into a slot.",
    );
  }

  if (!(cfg.pieceGapMm > 0 && cfg.pieceGapMm <= 20)) {
    throw new Error(`pieceGapMm (${cfg.pieceGapMm}) must be in (0, 20] mm: at 0 the orbited piece's clearance rule has no margin (COLLISION.md §12).`);
  }
  if (!(cfg.orbitDeadbandMm >= SETTLE_NOISE_MULTIPLE * cfg.pointerNoiseMm && cfg.orbitDeadbandMm <= 8)) {
    throw new Error(
      `orbitDeadbandMm (${cfg.orbitDeadbandMm}) must be in [${(SETTLE_NOISE_MULTIPLE * cfg.pointerNoiseMm).toFixed(2)}, 8] mm: under 3× the measured pointer noise a resting finger's wobble leaks through.`,
    );
  }
  if (!(cfg.hoverGizmoMove === 0 || cfg.hoverGizmoMove === 1)) throw new Error(`hoverGizmoMove (${cfg.hoverGizmoMove}) must be 0 or 1.`);
  if (!(cfg.topRollBandDeg >= 2 && cfg.topRollBandDeg <= 60)) throw new Error(`topRollBandDeg (${cfg.topRollBandDeg}) must be in [2, 60]°.`);
  if (!(cfg.quadSliceMaxDeg >= 10 && cfg.quadSliceMaxDeg <= 180)) throw new Error(`quadSliceMaxDeg (${cfg.quadSliceMaxDeg}) must be in [10, 180]°.`);
  if (cfg.orbitMode !== 0 && cfg.orbitMode !== 1) throw new Error(`orbitMode (${cfg.orbitMode}) must be 0 or 1.`);
  if (!(cfg.assemblyLockDistM >= 0.05 && cfg.assemblyLockDistM <= 2)) throw new Error(`assemblyLockDistM (${cfg.assemblyLockDistM}) must be in [0.05, 2] m.`);
  if (!(cfg.orbitShellOffsetMm >= 5 && cfg.orbitShellOffsetMm <= 300)) throw new Error(`orbitShellOffsetMm (${cfg.orbitShellOffsetMm}) must be in [5, 300] mm.`);
  for (const k of ["gizmoEaseMs", "orbitSpringMs"] as const) if (!(cfg[k] >= 0 && cfg[k] <= 500)) throw new Error(`${k} (${cfg[k]}) must be in [0, 500] ms.`);
  if (cfg.tiltedPole !== 0 && cfg.tiltedPole !== 1) throw new Error(`tiltedPole (${cfg.tiltedPole}) must be 0 or 1.`);
  if (!(cfg.tiltRollDegS >= 0 && cfg.tiltRollDegS <= 1440)) throw new Error(`tiltRollDegS (${cfg.tiltRollDegS}) must be in [0, 1440] °/s.`);
  if (!(cfg.tiltAutoM >= 0 && cfg.tiltAutoM <= 6)) throw new Error(`tiltAutoM (${cfg.tiltAutoM}) must be in [0, 6] m.`);
  if (!(cfg.facetMergeDeg >= 1 && cfg.facetMergeDeg <= 44)) throw new Error(`facetMergeDeg (${cfg.facetMergeDeg}) must be in [1, 44] °.`);
  if (!(cfg.facetMinShare >= 0 && cfg.facetMinShare <= 1)) throw new Error(`facetMinShare (${cfg.facetMinShare}) must be in [0, 1].`);
  for (const k of ["faceSpanShareH", "faceSpanShareV"] as const) if (!(cfg[k] >= 0 && cfg[k] <= 1)) throw new Error(`${k} (${cfg[k]}) must be in [0, 1].`);
  for (const k of ["faceSpanZoneHPct", "faceSpanZoneVPct"] as const) if (!(cfg[k] >= 0 && cfg[k] <= 50)) throw new Error(`${k} (${cfg[k]}) must be in [0, 50] %.`);
  for (const k of ["faceSpanZoneMinHCm", "faceSpanZoneMinVCm"] as const) if (!(cfg[k] >= 0 && cfg[k] <= 30)) throw new Error(`${k} (${cfg[k]}) must be in [0, 30] cm.`);
  if (cfg.faceSpanShareVOn !== 0 && cfg.faceSpanShareVOn !== 1) throw new Error(`faceSpanShareVOn (${cfg.faceSpanShareVOn}) must be 0 or 1.`);
  if (cfg.sectionLines !== 0 && cfg.sectionLines !== 1) throw new Error(`sectionLines (${cfg.sectionLines}) must be 0 or 1.`);
  if (!(cfg.gizmoEdgeMarginMm >= 0 && cfg.gizmoEdgeMarginMm <= 20)) throw new Error(`gizmoEdgeMarginMm (${cfg.gizmoEdgeMarginMm}) must be in [0, 20] mm.`);
  if (!(cfg.orbitTurnCapDegMm >= 5 && cfg.orbitTurnCapDegMm <= 300)) throw new Error(`orbitTurnCapDegMm (${cfg.orbitTurnCapDegMm}) must be in [5, 300]°/mm.`);
  if (!(cfg.orbitTurnCapVerticalDegMm >= 5 && cfg.orbitTurnCapVerticalDegMm <= 300)) throw new Error(`orbitTurnCapVerticalDegMm (${cfg.orbitTurnCapVerticalDegMm}) must be in [5, 300]°/mm.`);
  if (!(cfg.hoverInertiaMs > 0 && cfg.hoverInertiaMs <= 200)) throw new Error(`hoverInertiaMs (${cfg.hoverInertiaMs}) must be in (0, 200] ms.`);
  if (!(cfg.hoverDampingRatio > 0 && cfg.hoverDampingRatio <= 2)) throw new Error(`hoverDampingRatio (${cfg.hoverDampingRatio}) must be in (0, 2].`);
  if (!(cfg.hoverFrictionMmS >= 0 && cfg.hoverFrictionMmS <= 500)) throw new Error(`hoverFrictionMmS (${cfg.hoverFrictionMmS}) must be in [0, 500] mm/s.`);
  if (!(cfg.hoverLeadMs >= 0 && cfg.hoverLeadMs <= 200)) throw new Error(`hoverLeadMs (${cfg.hoverLeadMs}) must be in [0, 200] ms.`);
  if (!(cfg.hoverAmplitudeMm >= 10 && cfg.hoverAmplitudeMm <= 500)) throw new Error(`hoverAmplitudeMm (${cfg.hoverAmplitudeMm}) must be in [10, 500] mm (500: unlimited).`);
  if (!(cfg.slideOrbitDegPerMm >= 0 && cfg.slideOrbitDegPerMm <= 10)) throw new Error(`slideOrbitDegPerMm (${cfg.slideOrbitDegPerMm}) must be in [0, 10] °/mm.`);
  if (!(cfg.hoverGain > 0 && cfg.hoverGain <= 3)) throw new Error(`hoverGain (${cfg.hoverGain}) must be in (0, 3].`);
  if (!(cfg.orbitGoalMm > 0 && cfg.orbitGoalMm <= 50)) throw new Error(`orbitGoalMm (${cfg.orbitGoalMm}) must be in (0, 50] mm.`);
  if (!(cfg.hoverApproachMm >= 1.5 && cfg.hoverApproachMm <= 100)) throw new Error(`hoverApproachMm (${cfg.hoverApproachMm}) must be in [1.5, 100] mm: under 1.5 mm nothing short of contact may hover.`);
  if (!(cfg.quadUnlitAlpha >= 0 && cfg.quadUnlitAlpha <= 1)) throw new Error(`quadUnlitAlpha (${cfg.quadUnlitAlpha}) must be in [0, 1].`);
  if (!(cfg.orbitGoalDeg > 0 && cfg.orbitGoalDeg <= 30)) throw new Error(`orbitGoalDeg (${cfg.orbitGoalDeg}) must be in (0, 30]°.`);
  if (!(cfg.orbitBandRestMs >= 0 && cfg.orbitBandRestMs <= 3000)) {
    throw new Error(`orbitBandRestMs (${cfg.orbitBandRestMs}) must be in [0, 3000] ms: the pause that re-arms the orbit drag's band.`);
  }
  if (!(Number.isInteger(cfg.pieceSolverQueries) && cfg.pieceSolverQueries >= 4 && cfg.pieceSolverQueries <= 400)) {
    throw new Error(`pieceSolverQueries (${cfg.pieceSolverQueries}) must be an integer in [4, 400]: the orbit solver's work cap per frame.`);
  }

  if (!(cfg.highlightLiftMm > 0 && cfg.highlightLiftMm <= 5)) {
    throw new Error(
      `highlightLiftMm (${cfg.highlightLiftMm}) must be in (0, 5] mm: at 0 a highlight z-fights the face it marks.`,
    );
  }

  if (!(cfg.faceHighlightAlpha >= 0 && cfg.faceHighlightAlpha <= 1)) {
    throw new Error(
      `faceHighlightAlpha (${cfg.faceHighlightAlpha}) must be in [0, 1]: it is an OPACITY — 0 hides the fill, 1 is solid.`,
    );
  }

  if (!(cfg.boxSmoothMs >= 0 && cfg.boxSmoothMs <= 1000)) {
    throw new Error(`boxSmoothMs (${cfg.boxSmoothMs}) must be in [0, 1000] ms.`);
  }
  if (!(Math.abs(cfg.cameraYawOffsetDeg) <= 90) || !(Math.abs(cfg.cameraPitchOffsetDeg) <= 60)) {
    throw new Error(`cameraYawOffsetDeg / cameraPitchOffsetDeg (${cfg.cameraYawOffsetDeg} / ${cfg.cameraPitchOffsetDeg}) must be within ±90° / ±60°.`);
  }
  if (!(cfg.cameraRadiusOffsetMm >= 100 && cfg.cameraRadiusOffsetMm <= 2000)) {
    throw new Error(`cameraRadiusOffsetMm (${cfg.cameraRadiusOffsetMm}) must be in [100, 2000] mm.`);
  }
  if (!(cfg.boxGainYaw > 0 && cfg.boxGainYaw <= 4) || !(cfg.boxGainPitch > 0 && cfg.boxGainPitch <= 4)) {
    throw new Error(`boxGainYaw / boxGainPitch (${cfg.boxGainYaw} / ${cfg.boxGainPitch}) must be in (0, 4].`);
  }
  if (!(cfg.lockPlacedPieces === 0 || cfg.lockPlacedPieces === 1)) {
    throw new Error(`lockPlacedPieces (${cfg.lockPlacedPieces}) must be 0 or 1.`);
  }
  if (!(cfg.bootZoom === 0 || (cfg.bootZoom >= 0.1 && cfg.bootZoom <= 20))) {
    throw new Error(`bootZoom (${cfg.bootZoom}) must be 0 (derived) or in [0.1, 20].`);
  }
  if (!(cfg.boxGainInsideLeash >= 0.05 && cfg.boxGainInsideLeash <= 1)) {
    throw new Error(`boxGainInsideLeash (${cfg.boxGainInsideLeash}) must be in [0.05, 1].`);
  }
  if (!(cfg.cameraLeashDeg >= 0 && cfg.cameraLeashDeg <= 90)) {
    throw new Error(`cameraLeashDeg (${cfg.cameraLeashDeg}) must be in [0, 90]°.`);
  }
  if (cfg.orbitPieceKind !== 0 && cfg.orbitPieceKind !== 1) {
    throw new Error(`orbitPieceKind (${cfg.orbitPieceKind}) must be 0 (green) or 1 (turquoise).`);
  }
  if (!(cfg.greenKeepInViewMargin > 0 && cfg.greenKeepInViewMargin <= 1)) {
    throw new Error(`greenKeepInViewMargin (${cfg.greenKeepInViewMargin}) must be in (0, 1].`);
  }
  if (!(cfg.orbitInertiaGain >= 0 && cfg.orbitInertiaGain <= 50)) {
    throw new Error(`orbitInertiaGain (${cfg.orbitInertiaGain}) must be in [0, 50] ms/cm³.`);
  }
  if (!(cfg.orbitSwayKind === 0 || cfg.orbitSwayKind === 1 || cfg.orbitSwayKind === 2)) {
    throw new Error(`orbitSwayKind (${cfg.orbitSwayKind}) must be 0, 1 or 2.`);
  }
  if (!(cfg.orbitSlideMm >= 0 && cfg.orbitSlideMm <= 50)) {
    throw new Error(`orbitSlideMm (${cfg.orbitSlideMm}) must be in [0, 50] mm.`);
  }
  if (!(cfg.orbitSwayTauMs >= 10 && cfg.orbitSwayTauMs <= 1000)) {
    throw new Error(`orbitSwayTauMs (${cfg.orbitSwayTauMs}) must be in [10, 1000] ms.`);
  }
  if (!(cfg.orbitSwayDeg >= 0 && cfg.orbitSwayDeg <= 20)) {
    throw new Error(`orbitSwayDeg (${cfg.orbitSwayDeg}) must be in [0, 20]°.`);
  }
  if (!(cfg.cameraFollowMs >= 0 && cfg.cameraFollowMs <= 2000)) {
    throw new Error(`cameraFollowMs (${cfg.cameraFollowMs}) must be in [0, 2000] ms.`);
  }
  if (!(cfg.cameraCatchUpMs >= 10 && cfg.cameraCatchUpMs <= 2000)) {
    throw new Error(`cameraCatchUpMs (${cfg.cameraCatchUpMs}) must be in [10, 2000] ms.`);
  }
  if (!(cfg.cameraSettleDelayMs >= 0 && cfg.cameraSettleDelayMs <= 2000)) {
    throw new Error(`cameraSettleDelayMs (${cfg.cameraSettleDelayMs}) must be in [0, 2000] ms.`);
  }
  if (!(cfg.ungrabbedGoalMm > 0 && cfg.ungrabbedGoalMm <= cfg.captureOffsetMm)) {
    throw new Error(`ungrabbedGoalMm (${cfg.ungrabbedGoalMm}) must be in (0, captureOffsetMm]: stricter than a grabbed piece, never 0.`);
  }
  if (!(cfg.ungrabbedGoalDeg > 0 && cfg.ungrabbedGoalDeg <= 45)) {
    throw new Error(`ungrabbedGoalDeg (${cfg.ungrabbedGoalDeg}) must be in (0, 45]°: 0 places nothing.`);
  }
  if (!(cfg.demoDurationS >= 10 && cfg.demoDurationS <= 60)) {
    throw new Error(`demoDurationS (${cfg.demoDurationS}) must be in [10, 60] s — the owner's range.`);
  }
  if (cfg.shadowsOn !== 0 && cfg.shadowsOn !== 1 && cfg.shadowsOn !== 2) {
    throw new Error(`shadowsOn (${cfg.shadowsOn}) must be 0 (off), 1 (on) or 2 (auto, D138).`);
  }
  if (!(cfg.autoShadowBudgetMs > 0 && cfg.autoShadowBudgetMs <= 200)) {
    throw new Error(`autoShadowBudgetMs (${cfg.autoShadowBudgetMs}) must be in (0, 200] ms: a median frame time.`);
  }
  if (!(cfg.pieceContourAlpha >= 0 && cfg.pieceContourAlpha <= 1)) {
    throw new Error(`pieceContourAlpha (${cfg.pieceContourAlpha}) must be in [0, 1]: it is an opacity.`);
  }



  // ⛔ The owner's slider is 0–45. Past 90° a face pointing the SAME way would snap, which is the
  // reading a mate rejects (rule 4: anti-parallel).
  if (
    !Number.isFinite(cfg.snapConeDeg) ||
    cfg.snapConeDeg < 0 ||
    cfg.snapConeDeg > 45
  ) {
    throw new Error(
      `snapConeDeg (${cfg.snapConeDeg}) must be between 0 and 45 ` +
        "degrees: it is how far from ANTI-PARALLEL the two faces may be and the snap still " +
        "fire, and past 90 the test would admit faces pointing the same way.",
    );
  }

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
  // `motionDeadbandMm ≥ 3×0`, disabling a guard that exists to
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
        "the unsnap leg's noise guard and the deadband's floor at the same time.",
    );
  }
  if (!(cfg.motionDeadbandMm > 0)) {
    throw new Error(
      `motionDeadbandMm (${cfg.motionDeadbandMm} mm) must be POSITIVE: at zero every rule ` +
        "reads raw pointer noise, which is the defect §1.1 exists to prevent.",
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
  if (cfg.orbitLowerRingOn !== 0 && cfg.orbitLowerRingOn !== 1) {
    throw new Error(`orbitLowerRingOn (${cfg.orbitLowerRingOn}) must be 0 or 1.`);
  }
  // ⭐ With the fourth ring on, it must sit BETWEEN the bottom and the middle too.
  if (
    cfg.orbitLowerRingOn === 1 &&
    !(cfg.orbitBottomHeightM < cfg.orbitLowerHeightM && cfg.orbitLowerHeightM < cfg.orbitMiddleHeightM)
  ) {
    throw new Error(
      `orbit ring heights must increase bottom → lower → middle → top, got ` +
        `${cfg.orbitBottomHeightM} / ${cfg.orbitLowerHeightM} / ${cfg.orbitMiddleHeightM} / ${cfg.orbitTopHeightM} m: ` +
        "the orbit surface would fold back through itself.",
    );
  }
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
  // ⚠ So the surface is kept away from the pole instead, which is what `A7` already claimed. ⛔ (2026-11-04, the audit) `gravity_frame.ts` is deleted
  // (nothing read it since the parts' moves went, `5515502`); the rule stays — a camera straight overhead has no heading either.
  for (const [name, r] of [
    ["orbitBottomRadiusM", cfg.orbitBottomRadiusM],
    ["orbitMiddleRadiusM", cfg.orbitMiddleRadiusM],
    ["orbitLowerRadiusM", cfg.orbitLowerRingOn === 1 ? cfg.orbitLowerRadiusM : 1],
    ["orbitTopRadiusM", cfg.orbitTopRadiusM],
  ] as const) {
    if (!(r > 0)) {
      throw new Error(
        `${name} (${r} m) must be POSITIVE: a ring of radius zero sits on the vertical axis ` +
          "through the target, where the camera looks exactly along gravity. There the " +
          "camera has no horizontal heading (no up to roll about) — see A7.",
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
  if (!(cfg.captureOffsetMm > 0)) {
    throw new Error(
      `captureOffsetMm (${cfg.captureOffsetMm}) is not positive: a zero or negative capture ` +
        "offset makes every gap test fail, so no pair could ever be highlighted and the whole " +
        "mechanism would be silently unreachable with nothing on the glass to say why.",
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
