/**
 * ⭐⭐⭐ **THE APPROACH SWING — the camera looks around the join and comes back.**
 *
 * ⚠⚠ **A TRIAL, ON BRANCH `1.0.18-`.** The owner: *"Let's try a fork of the build here … If the
 * trial is not successful, I will just discard the branch later on."* ⛔ So this file is written
 * to be **deletable in one commit**: nothing else depends on it, and the wiring in `scene.ts` is
 * two call sites. It is not a flag — `D28` and `D40` deleted the last of those — the BRANCH is
 * the fork.
 *
 * > *"When the offset radius is crossed … while the translation of the Follower continues with
 * > the same user dx delta position movement, the camera orbits opposite to the dx movement …
 * > When the offset is half what it initially was, the camera orbit reverses so the camera aims
 * > at coming back to its original orbit. When the offset is null (contact of both objects), the
 * > camera shall be back to its original position."* — the owner, 2026-09-19
 *
 * ⭐⭐ **WHAT IT IS FOR**: parallax. A face-to-face approach seen head-on gives a hand almost no
 * depth cue — which is the same degeneracy `D46` was built around, one sense over. Swinging the
 * view out and back while the gap closes shows the join from a changing angle **without leaving
 * the hand anywhere new**, because the swing returns to zero exactly as contact is made.
 *
 * ⛔⛔⛔ **THE RETURN IS BY CONSTRUCTION, NOT BY A RESTORE.** The owner described it as a
 * SNAPSHOT of the camera taken at the trigger and restored at contact. ⚠ This computes an
 * **additive yaw offset** that is zero at both ends instead, and the difference matters:
 *
 *   • a restore fights the hand — orbit the camera yourself mid-approach and a restore would
 *     yank it back to where it was before you did;
 *   • a restore has to run, so a lost frame, an early release or a body that never reaches
 *     contact all leave the camera somewhere nobody chose;
 *   • an offset that is zero at `p = 0` and `p = 1` **cannot** leave it anywhere, and it rides
 *     on top of whatever the hand does with the orbit meanwhile.
 *
 * ⭐ `LESSONS_CARRIED`'s own shape: *make the bad state unrepresentable rather than guarded.*
 * ⚠ The cost, stated: if the hand orbits during the approach, contact returns the camera to
 * **its own orbit**, not to the snapshot. That is a real difference from the dictation and it is
 * the first thing to judge.
 *
 * ⛔ ENGINE-FREE. It knows a gap, an angle and a sign; it moves nothing.
 */

/** What the swing remembers, latched when the capture first triggers. */
export interface SwingLatch {
  /**
   * The surface gap at the instant the capture triggered, in metres — the swing's whole
   * parameterisation. ⛔ LATCHED, never re-read: the capture offset is recomputed every frame
   * from the camera distance (`D49`), and the camera is about to move, so a live offset would
   * make the progress depend on the swing the progress is driving.
   */
  readonly gapAtTriggerM: number;
  /**
   * Which way to swing. ⭐ *"opposite to the dx movement"*, decided once.
   * ⚠ Latched for the same reason `D57`'s roll sign is: recomputed per frame it would flip
   * whenever the finger paused or jittered across zero, at full amplitude.
   *
   * ⛔⛔⛔ **`null` MEANS *NO DIRECTION WAS AVAILABLE*, AND THEN THERE IS NO SWING** —
   * device-reported, 2026-09-20: *"sometimes the yaw is to the left bottom, sometimes it is to
   * the right up for the same delta position x."*
   *
   * ⚠⚠ The first build read the sign from `scene.ts`'s *last non-zero horizontal travel ever
   * applied*, a module variable that was **never reset** — not per gesture, not per approach,
   * not per object. ⛔ And the capture's rising edge needs **no motion at all** to fire
   * (`highlightedPair` sets `inRange` before it ever looks at the movement mode), so an
   * approach could arm on a PRESS inside the band, on a rotation that moved the closest points,
   * or on a pinch that rescaled `D49`'s threshold — and take the direction of a drag that
   * belonged to a different gesture, minutes earlier, in the opposite direction.
   *
   * ⭐⭐ So the direction is now **the travel that crossed the threshold**, and nothing else:
   * zero travel on the crossing frame means `null`, which means the approach runs with no lean.
   * ⛔ Not a fallback to `+1`, which is what the first build declared — *"suppress, do not
   * guess"* (`LESSONS_CARRIED` §6). A guessed direction is a 30° camera motion nobody asked
   * for, and it is indistinguishable on the glass from the rule working.
   */
  readonly sign: 1 | -1 | null;
  /**
   * ⚠ The travel the sign was taken from, in metres — **for the READOUT only**, so a hand can
   * see what the arming frame saw. ⛔ Nothing reads it to decide anything: it is here because
   * this defect took two screenshots and a numeric probe to resolve without it.
   * ⭐ BOTH components since 2026-09-21: `dx` alone said *"no direction"* without saying whether
   * the finger had moved at all, which is the difference between *no swing* and *a swing the
   * arithmetic could not aim*.
   */
  readonly armTravelM: number;
  /** The vertical half of the same reading, in metres. Readout only. */
  readonly armTravelUpM: number;
  /**
   * ⭐⭐⭐ **THE CAPTURE THRESHOLD, FROZEN FOR THE APPROACH** — and the PITCH half is what made
   * this necessary.
   *
   * ⛔⛔ `D49` scales the capture offset by the camera's distance to its focus, deliberately, so
   * a hand gets the same APPARENT clearance at every zoom. ⚠ A yaw-only swing keeps that
   * distance constant. **A pitch does not**: the ring surface has a different radius at every
   * elevation, so leaning the camera up or down moves it nearer or further — measured on the
   * tablet, the printed threshold went `172mm → 345mm` mid-approach.
   *
   * ⛔⛔⛔ **AND THE FAILURE MODE IS NOT COSMETIC.** Where the swing moves the camera CLOSER the
   * threshold shrinks, and if it shrinks past the current gap the capture **drops** — which
   * disarms the swing, which snaps the camera back, which restores the threshold, which
   * re-captures. ⭐ A feedback loop in which the camera's own motion decides whether the rule
   * that is moving it still applies.
   *
   * ⭐ Freezing it is also what `D49` MEANT: the offset tracks *the hand's* zoom, and during an
   * approach the camera is being driven by the game.
   */
  readonly offsetAtTriggerM: number;
}

/**
 * ⭐⭐ **WHERE THE APPROACH HAS GOT TO — `0` at the trigger, `1` at contact.**
 *
 * ⛔ CLAMPED AT BOTH ENDS. Past contact the bodies interpenetrate and `gapBetween` returns `0`,
 * so `1` is the most this can mean; and pulling back **beyond** the trigger gap must not drive
 * the swing the other way — it returns to zero and stays there, which is what a hand backing off
 * expects to see.
 *
 * ⚠ A non-positive `gapAtTriggerM` is degenerate — it would divide by zero, and it means the
 * capture triggered at contact, where there is no approach left to show. ⭐ Returns `1`, so the
 * swing is already home: the one answer that cannot move the camera.
 */
export function swingProgress(gapM: number, latch: SwingLatch): number {
  const g0 = latch.gapAtTriggerM;
  if (!(g0 > 0) || !Number.isFinite(g0) || !Number.isFinite(gapM)) return 1;
  const p = (g0 - gapM) / g0;
  return p <= 0 ? 0 : p >= 1 ? 1 : p;
}

/**
 * ⭐⭐⭐ **THE SWING ITSELF — out, then back, with the reversal at half the gap.**
 *
 * ⛔⛔ **A HALF SINE, NOT A TRIANGLE.** Both peak at `p = 0.5` and both end at zero, and the
 * owner's words (*"the camera orbit reverses"*) fit either. ⭐ The sine is chosen because its
 * VELOCITY is continuous at the reversal: a triangle changes the camera's angular speed
 * instantaneously at the halfway point, which on glass reads as a knock exactly when the hand is
 * concentrating on the last millimetres. ⚠ A hand may disagree; it is one line.
 *
 * ⛔⛔⛔ **EXACTLY ZERO AT BOTH ENDS, AND THAT IS NOT PEDANTRY.** `Math.sin(Math.PI)` is
 * `1.2246e-16`, not `0`. ⭐ The owner's requirement is *"the camera shall be back to its original
 * position"*, and a residual — however small — makes that a near-miss rather than a fact.
 * `AlignSnaps.advance` lands on its solved orientation for the same reason, and says so.
 *
 * ⛔⛔⛔ **AND A `null` SIGN IS ZERO, HERE, RATHER THAN A BRANCH IN `scene.ts`.** An approach
 * whose threshold was not crossed by a horizontal translation has no direction to lean in, and
 * *the rule that says so has to be interrogable*: written as an `if` in the render file it would
 * be the eighth mutant of this trial that the whole suite cannot see.
 */
export function swingYawRad(
  progress: number,
  amplitudeRad: number,
  sign: 1 | -1 | null,
): number {
  if (sign === null) return 0;
  if (!(progress > 0) || progress >= 1) return 0;
  return sign * amplitudeRad * Math.sin(Math.PI * progress);
}

/**
 * ⭐⭐⭐ **WHICH WAY THE CAMERA SWINGS — AND THIS SHIPPED INVERTED.**
 *
 * > *"I have seen a case where the follower object was within the offset radius and was
 * > translating delta position x negative and the camera orbited to the left and bottom. how is
 * > that possible? (i thought delta position x negative would trigger camera orbit to the right
 * > and up)."* — the owner, 2026-09-19
 *
 * ⛔⛔⛔ **THE DEFECT WAS A DOUBLE NEGATION, AND `orbit.ts` WARNS ABOUT IT BY NAME**: *"`IN1`
 * shipped yaw AND pitch inverted for exactly that reason, twice."* ⚠ I read the owner's
 * *"opposite to the dx movement"* and negated — without checking that **the yaw axis is already
 * opposite**. `OrbitController.drag` does `yawRad -= dxMm · gain` precisely so that the camera
 * moves against the finger, so a positive yaw is ALREADY the answer to a rightward drag.
 *
 * ⭐⭐ **MEASURED, NOT REASONED, THIS TIME.** At the boot pose the camera sits on `+z` looking at
 * the origin, so `+x` is screen-right; `orbitOffset` then gives
 *
 *     yaw +30°  →  x = −0.667   (the camera moves LEFT)
 *     yaw −30°  →  x = +0.667   (RIGHT)
 *
 * ⛔ So **`+yaw` is LEFT**, and *"opposite to dx"* is `yaw = +A·sign(dx)`: a rightward finger
 * (`dx > 0`) swings the camera left, a leftward finger swings it right. ⚠ That is the identity
 * on `sign(dx)`, not its negation — the whole defect is one missing insight, and no amount of
 * internal consistency could have revealed it. `METHOD`: *a sign is not tested by any amount of
 * testing the magnitude.*
 *
 * ⛔⛔⛔ **AND IT SHIPPED A SECOND DEFECT UNDER THE FIRST — device-reported, 2026-09-20.**
 *
 * > *"sometimes the yaw is to the left bottom, sometimes it is to the right up for the same
 * > delta position x."* — the owner
 *
 * ⚠⚠ **THE ARITHMETIC WAS RIGHT AND THE ARGUMENT WAS WRONG.** `sign(dx)` is the correct answer
 * to *"which way is opposite to this travel"* — but what was passed in was **not this
 * approach's travel**. `scene.ts` kept the last non-zero horizontal travel it had ever applied,
 * in a variable **nothing ever reset**, and the capture's rising edge fires with **no motion at
 * all** — a press inside the band, a rotation that moved the closest points, a pinch that
 * rescaled `D49`'s threshold. ⛔ So the lean's direction could be inherited from a previous
 * gesture, on a different body, in the opposite direction, and the same `dx` then leaned either
 * way depending on how the band had been entered.
 *
 * ⭐⭐ **MISTAKE SHAPE 2, EXACTLY**: *measuring a DIFFERENT QUANTITY than the one asked for.*
 * The question is *which way is this approach travelling*; the answer given was *which way did
 * anything last travel*. ⚠ And the zero case made it worse rather than safer: the old
 * `+1` fallback turned *"I have no idea"* into a confident 30° lean.
 *
 * ⭐ So: **`null` when there is no travel to read**, and the caller does not swing.
 * `LESSONS_CARRIED` §6 — *suppress, do not guess; a degenerate input returns `null`, never a
 * default.* ⚠ The cost, stated: an approach that crosses the threshold without a horizontal
 * translation — depth, a rotation, a press already inside the band — gets **no swing at all**,
 * and a hand has to pull apart past the offset and come back in to arm one. ⛔ That is the
 * honest reading of the owner's own dictation, which is about *"the translation of the
 * Follower … on the camera x horizontal axis"* and about nothing else.
 *
 * ⛔ **NO MAGNITUDE THRESHOLD, AND THAT IS `A11` DOING ITS JOB.** §1.1's deadband emits the
 * excess only, so a resting finger emits **exactly zero** and any non-zero travel is already
 * motion a hand committed to. ⚠ A second threshold here would be a number nobody measured,
 * guarding against noise that has already been removed.
 *
 * ⛔⛔⛔ **AND A PURELY VERTICAL APPROACH GETS A SWING — device-reported, 2026-09-21.**
 *
 * > *"Sometimes, when the follower enters the offset radius by a vertical translation (delta
 * > position dy) the camera orbit swing is not triggered."* — the owner, with the HUD showing
 * > `sign⛔? p=0.29 yaw=0.0° dxArm=0.00mm`
 *
 * ⚠⚠ **THE FIRST BUILD READ ONLY `dx`, AND A VERTICAL DRAG HAS NONE.** So the crossing was
 * driven by a real translation, the progress ran, and the lean stayed at zero — listed as a
 * *cost* when the rule shipped and judged a **bug** by the hand that met it.
 *
 * ⭐⭐ **THE DISTINCTION THAT MATTERS IS NOT *dx OR NOT*, IT IS *WAS THERE A TRANSLATION AT
 * ALL*.** A press, a rotation or a pinch crossing the threshold still gets **no swing** — that
 * is the defect of 2026-09-20 and it stays fixed. ⛔ But a finger that really did carry the body
 * into range has earned the parallax, and only its **aim** is in question.
 *
 * ⭐ So: a horizontal component decides the direction when there is one; a purely vertical
 * travel takes a **declared default**, `+1`. ⚠ That is NOT the guess this function was written
 * to remove: there, a direction existed and was read from the wrong gesture. Here the yaw is
 * **symmetric by construction** — the two bodies are stacked on the screen axis the swing turns
 * about, so either side shows the join equally, and *no* answer is available from the finger.
 * ⛔ A stated constant is the honest form of that, and it is one line to mirror.
 */
export function swingSignFor(travelRight: number, travelUp = 0, travelDepth = 0): 1 | -1 | null {
  if (!Number.isFinite(travelRight) || !Number.isFinite(travelUp)) return null;
  if (!Number.isFinite(travelDepth)) return null;
  if (travelRight !== 0) return travelRight < 0 ? -1 : 1;
  // ⭐ A translation with no horizontal component: the swing is earned, the aim is symmetric.
  if (travelUp !== 0) return 1;
  // ⛔⛔ **AND A TRAVEL STRAIGHT ALONG THE VIEW EARNS ONE TOO.** `right` and `up` span the
  // SCREEN, so a body pushed along the gravity frame's own DEPTH leaves no trace in either —
  // which is what the holder's `dy` does at a LEVEL camera, where its plane is edge-on and the
  // judged fixed rate takes over. ⭐ Without this, defect 65's backfill has nothing to read there
  // and the swing stays signless for the whole approach. ⛔ Same answer as the vertical case, on
  // the same argument: the swing is earned and the aim is symmetric.
  if (travelDepth !== 0) return 1;
  // ⛔ No travel at all — a press, a rotation, a pinch. No swing, which is the 2026-09-20 rule.
  return null;
}

/**
 * ⭐⭐⭐ **HOW FAST THE APPROACH IS — the fastest finger DRIVING this body, not the holder's.**
 *
 * ⛔⛔⛔ `swingAmplitudeRad` was fed `grip.rec.speedMmPerS` — **the HOLDER's finger** — while the
 * body could be translated by the SECOND touchpoint. ⚠ The holder is then genuinely still, so the
 * law read `speed = 0`, which it answers with *the widest look* (`0` is its documented maximum,
 * and correct for a stopped hand). ⭐ So a second-finger approach swung at **full amplitude
 * regardless of how fast it was pushed**, and the two dials a hand tuned on the glass —
 * `approachSwingSpeedGain` and `…Exponent` — were bypassed entirely.
 *
 * ⭐⭐ **THE SHAPE IS DEFECT 55's**: a rule that names ONE finger inherits every later arrangement
 * in which a different finger does the work. `A10` gave the second touchpoint a translation
 * channel after this law was written, and nobody re-read the law.
 *
 * ⚠ **`max`, and the reason is stated**: the channels SUM (`D43`), so a body driven by both
 * fingers moves faster than either — but the amplitude law's knee was tuned against *a finger's*
 * speed, and the fastest finger is the one a hand would name if asked how fast it was pushing.
 * ⛔ Summing would double the reading whenever two fingers move together.
 *
 * ⭐ All-still still means `0` → the maximum, which is the judged behaviour for a stopped hand.
 */
export function approachSpeedMmPerS(speeds: readonly number[]): number {
  let fastest = 0;
  for (const s of speeds) {
    if (Number.isFinite(s) && s > fastest) fastest = s;
  }
  return fastest;
}

/**
 * ⭐⭐⭐ **A SWING THAT ARMED WITHOUT A DIRECTION ACQUIRES ONE LATER — defect 65.**
 *
 * ⛔⛔⛔ **THE SIGN WAS A ONE-FRAME LOTTERY.** `frameTravelRightM/UpM` are consumed every frame,
 * so the arming edge sees only the travel applied since the previous frame — and if the capture
 * crosses on a frame that carried none (no pointer event landed in that interval, or the deadband
 * emitted nothing), `swingSignFor` answers `null`, correctly. ⚠ That answer was then **latched
 * for the whole approach**: the progress climbed while the yaw stayed at zero. The swing ran, and
 * pointed nowhere.
 *
 * ⭐⭐ **A `null` SIGN IS NOW PROVISIONAL, NOT PERMANENT.** The 2026-09-20 rule it comes from is
 * still right — *the threshold can be crossed with no travel at all, and then there is no swing* —
 * but it answers *"is there a direction YET"*, not *"was there one at that instant"*.
 *
 * ⛔⛔ **AND IT RE-BASES WHEN THE DIRECTION ARRIVES**, which is the half that keeps it honest: the
 * gap has closed meanwhile, so adopting the sign without re-basing would jump the camera straight
 * to `yaw(p)` — and *"the camera shall not jump"* is a device report already paid for.
 * ⭐ Re-basing the trigger gap to the CURRENT gap restarts the lean at zero and grows it from
 * there, over whatever gap is left.
 * ⚠ The cost, stated: a swing that finds its direction late completes its out-and-back in less
 * distance, so it is faster. That beats both alternatives — a jump, or no swing at all.
 *
 * @returns the replacement latch, or `null` when nothing should change — already signed, or still
 *   no travel to read. ⛔ Never re-signs a swing that HAS a direction: latching it for the
 *   approach is what fixed *"sometimes the yaw is to the left bottom, sometimes to the right up
 *   for the same delta position x"* (2026-09-20), and this must not undo it.
 */
export function acquireSwingSign(
  latch: SwingLatch,
  travelRightM: number,
  travelUpM: number,
  gapNowM: number,
  travelDepthM = 0,
): SwingLatch | null {
  if (latch.sign !== null) return null;
  const sign = swingSignFor(travelRightM, travelUpM, travelDepthM);
  if (sign === null) return null;
  // ⚠ A gap that is not a positive number leaves the latch alone rather than re-basing to it:
  // `gapAtTriggerM` divides the progress, and a zero there is an infinity on the camera.
  if (!Number.isFinite(gapNowM) || !(gapNowM > 0)) return null;
  return {
    ...latch,
    sign,
    gapAtTriggerM: gapNowM,
    armTravelM: travelRightM,
    armTravelUpM: travelUpM,
  };
}

/**
 * ⭐⭐ **THE PITCH ALWAYS LEANS THE SAME WAY — UP.**
 *
 * ⛔ The owner's expectation names one direction for both axes: *"delta position x negative
 * would trigger camera orbit to the right **and up**"*. ⚠ Sharing the yaw's signed angle would
 * make the pitch mirror with the drag direction — right-and-up one way, left-and-**down** the
 * other — so `+x` and `−x` approaches would be shown from opposite sides vertically, and a hand
 * comparing them would be comparing two different views.
 * ⭐ Taking the magnitude keeps the vertical parallax the same whichever way the part travels.
 * ⚠ Mirroring is one line if a hand prefers it; this is the reading of the owner's sentence.
 */
export function pitchAngleFor(yawAngleRad: number): number {
  return Math.abs(yawAngleRad);
}

/**
 * ⭐⭐⭐ **THE PITCH HALF OF THE SWING, IN THE RING SURFACE'S OWN UNITS.**
 *
 * > *"add a swing of the camera in the other orthogonal directions … also add a pitch swing of
 * > the same value. The idea is that the swing of the camera helps the user visualize the
 * > alignment in the directions orthogonal to the translation approach."* — the owner, 2026-09-19
 *
 * ⭐⭐ **WHY A CONVERSION EXISTS AT ALL.** The yaw is radians and can be added straight to the
 * camera's angle. The ELEVATION is not an angle: it is `v ∈ [0, 1]` along a monotone cubic
 * through three tuned rings (`orbit.ts`), so *"a pitch swing of the same value"* has to be
 * expressed in `v` before it means anything.
 *
 * ⛔⛔⛔ **AND IT MUST STAY IN `v`, NOT BECOME A FREE ROTATION OF THE CAMERA.** Pitching the
 * camera off the ring surface would let it approach the pole — and `requireGestureFrame()`
 * **throws** when the view axis lies along gravity, because `A7`'s basis does not exist there.
 * ⚠ That throw would land on the next PRESS, not on the swing, so the crash would look like it
 * came from the finger that touched the glass rather than from the camera that moved. ⭐ The ring
 * surface exists precisely to make that unreachable; `orbitOffset` clamps `v` itself, so
 * saturating against a ring is the worst this can do.
 *
 * ⚠ **THE CONVERSION IS LINEAR AND THE SURFACE IS NOT.** `v` runs through a cubic, so equal
 * steps in `v` are not equal angles except near the middle ring. ⛔ Stated rather than corrected:
 * inverting the cubic per frame would buy an exactness the eye cannot see, and the amplitude is a
 * slider a hand will set by feel anyway.
 *
 * @param bottomRad elevation angle of the bottom ring, `atan2(height, radius)`.
 * @param topRad    the same for the top ring.
 * @returns the offset to add to `v`. ⛔ `0` when the rings are degenerate or coincident — no
 *   span means no pitch is expressible, and improvising one would move the camera by an amount
 *   nothing chose.
 */
export function pitchOffsetV(pitchRad: number, bottomRad: number, topRad: number): number {
  const span = topRad - bottomRad;
  if (!Number.isFinite(span) || Math.abs(span) < 1e-6 || !Number.isFinite(pitchRad)) return 0;
  return pitchRad / span;
}

/**
 * ⭐⭐⭐ **WHAT ENDING AN APPROACH OWES — the absorb, and the BASIS the game just invalidated.**
 *
 * > *"There can be cases where the follower enters the offset radius with one translation on an
 * > axis … and then exit the offset radius by another translation on a different axis (for
 * > example depth): if the camera has significantly orbited already when the follower exits the
 * > offset radius, the delta position axis ends up being quite off vs the camera axis and
 * > therefore the user feels a disconnect between the touch input axis and the follower
 * > translation axis."* — the owner, 2026-09-20
 *
 * ⭐⭐⭐ **THE RULE THIS ANSWERS WITH: THE GAME MAY NOT MOVE THE CAMERA UNDER A LIVE GESTURE
 * WITHOUT TELLING THE GESTURE.** `A7`'s basis is latched at the PRESS, and that latch is
 * deliberate — *"an orbit that happens mid-drag cannot redefine which way `right` is"*. ⛔ But
 * it was written against the **HAND's** orbit, which is something the user did on purpose. The
 * swing is the **GAME's** orbit: the user never asked for it, and while the lean is live it is
 * bounded and returns to zero, so the mismatch is transient and self-correcting. ⚠⚠ **`absorb`
 * is what makes it permanent** — it folds the lean into the orbit so the pose does not jump, and
 * from that instant the camera is somewhere new **for good** while the basis still describes
 * where it was.
 *
 * ⭐ So the ending is the moment to hand the live grips a new basis, and it is the RIGHT moment
 * on three counts: it is **discrete** (a capture edge, never a continuous reading — `METHOD`),
 * it is the instant the displacement stops being temporary, and it moves **nothing** — a basis
 * decides where the NEXT travel goes, so re-deriving it cannot make an object jump.
 *
 * ⛔ **AND ONLY WHEN THE ABSORB IS NOT A NO-OP.** At contact and on a clean separation the lean
 * is already exactly zero, the camera is on its own orbit, and the latched basis is still
 * correct — re-deriving there would throw away a latch that is doing its job for nothing.
 *
 * ⚠ The two halves are computed HERE, together, because they are one fact about one instant:
 * `scene.ts` used to build the `vOffset` inline at the call site, which is the shape that has
 * already cost this trial seven mutants nothing in the suite could see.
 *
 * @param appliedYawRad the lean actually on the camera at the ending — `0` for a no-op ending.
 */
export interface SwingEnding {
  /** Yaw to fold into the orbit, in radians. */
  readonly yawRad: number;
  /** Elevation to fold in, in the ring surface's `v`. ⛔ The MAGNITUDE's — the pitch never mirrors. */
  readonly vOffset: number;
  /**
   * ⭐⭐ Does every live grip owe itself a fresh `A7` basis? ⛔ True exactly when the camera has
   * been permanently displaced by the game — i.e. when this ending is not a no-op.
   */
  readonly rebaseFrames: boolean;
}

export function endApproach(
  appliedYawRad: number,
  bottomRad: number,
  topRad: number,
): SwingEnding {
  // ⚠ A non-finite lean is not a displacement anyone can compensate for: absorb nothing, and
  // leave the basis alone rather than re-deriving it from a camera nothing moved.
  if (!Number.isFinite(appliedYawRad) || appliedYawRad === 0) {
    return { yawRad: 0, vOffset: 0, rebaseFrames: false };
  }
  return {
    yawRad: appliedYawRad,
    vOffset: pitchOffsetV(pitchAngleFor(appliedYawRad), bottomRad, topRad),
    rebaseFrames: true,
  };
}

/**
 * ⭐⭐⭐ **THE SWING IS DIVIDED BY THE FINGER'S SPEED, WITH A GAIN AND AN EXPONENT.**
 *
 * > *"I want to set the maximum approach swing with the slider, and divide it by the speed of the
 * > delta position so that there is not a very big camera orbit jump when the delta position is
 * > fast."* — then: *"make it `A ∝ 1/(slider multiple gain × speed^slider expon gain)` so I can
 * > finetune the effect."* — the owner, 2026-09-19
 *
 *     A = maxRad / max(1, gain × speed^exponent)
 *
 * ⭐⭐⭐ **WHY DIVIDING IS THE RIGHT SHAPE — AT `exponent = 1` IT MAKES THE CAMERA'S ANGULAR
 * RATE SPEED-INDEPENDENT.** The lean is `θ = A·sin(πp)`, so
 *
 *     dθ/dt = A · π · cos(πp) · dp/dt        and        dp/dt ∝ the finger's speed
 *
 * ⛔ With a FIXED `A` the camera's angular velocity is proportional to how fast the hand moves —
 * which is the *"very big camera orbit jump"*, named precisely. ⭐ `A ∝ 1/speed` cancels the
 * `dp/dt` exactly. The owner asked for it by feel; it falls out as the one choice that removes
 * the term, and a vector measures the cancellation across a 4× spread of hand speed.
 *
 * ⭐⭐ **SO THE EXPONENT IS A DIAL EITHER SIDE OF THAT.** `1` cancels; **`0` removes the speed
 * dependence entirely** (the swing becomes a constant `maxRad / max(1, gain)`), which is how to
 * A/B the whole idea by finger; above `1` the camera *decelerates* as the hand speeds up, which
 * may read as the scene bracing against a fast shove.
 *
 * ⛔⛔ **`max(1, …)` IS WHAT MAKES THE SLIDER A MAXIMUM**, and it is not decoration: the divisor
 * tends to **zero** as the hand slows, so without it a nearly-still finger would ask for an
 * unbounded lean. ⚠ It also means the gain has a KNEE rather than a uniform effect — damping
 * begins only where `(gain × speed)` passes 1, i.e. at **`speed = 1/gain`, whatever the
 * exponent**.
 * ⭐ At the shipped defaults the knee is **67 mm/s** (`1/0.015`) with an exponent of **1.7** —
 * both chosen by the owner on the glass, 2026-09-19, replacing my guesses.
 *
 * ⚠⚠ **WHAT TO WATCH ON THE GLASS: DECELERATING WIDENS THE SWING.** `A` rises as the hand
 * slows, so easing off mid-approach drifts the camera further out even though the gap has barely
 * changed. ⛔ A drift and not a jump — the speed estimate is windowed — but a motion the gap did
 * not ask for. ⭐ The one-line alternative if a hand dislikes it: latch `A` at the trigger.
 *
 * ⚠ A NEGATIVE or non-finite gain or exponent returns **0** — no swing. An unconfigured law is
 * not a reason to move the camera by an amount nobody chose (`LESSONS_CARRIED` §6), and a
 * negative divisor would mirror the swing mid-approach.
 * ⚠ A speed of zero gives the **maximum**: `0^exponent` is `0` for any positive exponent, the
 * divisor clamps to 1, and that is also what a stopped hand should see — the widest look.
 */
export function swingAmplitudeRad(
  maxRad: number,
  speedMmPerS: number,
  gain: number,
  exponent: number,
): number {
  if (!Number.isFinite(gain) || gain < 0) return 0;
  if (!Number.isFinite(exponent) || exponent < 0) return 0;
  if (!Number.isFinite(speedMmPerS) || speedMmPerS <= 0) return maxRad;
  // ⭐⭐⭐ **`(gain × speed)^exponent`, NOT `gain × speed^exponent` — SO THE TWO DIALS ARE
  // INDEPENDENT.** ⛔ Written the second way the knee sits at `(1/gain)^(1/exponent)`, so raising
  // the exponent DRAGS THE KNEE DOWN: measured at `gain = 0.0083` it falls from 120 mm/s to 11
  // at `exp = 2` and to 5 at `exp = 3`, and every real drag is then far past it — the swing
  // collapses to **1–3% of the slider** and the dial annihilates the effect instead of tuning it.
  // ⚠ That is also where `dA/A = −n·dspeed/speed` is steepest, which is what a hand sees as
  // jitter. ⭐ Grouping the product first pins the knee at `1/gain` for EVERY exponent, so
  // **gain chooses WHERE damping starts and exponent chooses HOW SHARPLY it bites** — which is
  // what *"so I can finetune the effect"* asks for.
  // ⚠ `x ** 0` is `1` for every `x`, so `exponent = 0` still means *no speed dependence at all*.
  const divisor = (gain * speedMmPerS) ** exponent;
  return !Number.isFinite(divisor) || divisor <= 1 ? maxRad : maxRad / divisor;
}

/**
 * ⭐⭐⭐ **HOW FAST THE SWING'S AMPLITUDE MAY CHASE THE SPEED — a time constant, in ms.**
 *
 * ⛔⛔ **DERIVED, NOT CHOSEN, AND NOT A FEEL KNOB.** The speed estimate is windowed over
 * `flickLiftWindow` (40 ms) while pointer samples arrive every ~8 ms, so it changes in STEPS as
 * samples enter and leave that window. ⭐ Three window-lengths is the standard rule of thumb for
 * a one-pole filter to swallow a step of that period — the same *×3 over the noise* reasoning
 * `scene.ts` uses for the spin-sway floor — which is 120 ms.
 *
 * ⚠ And it is small against what it must not blunt: an approach lasts of the order of a second,
 * so 120 ms is about a tenth of it. ⛔ The amplitude still follows a real change of hand speed
 * within a fifth of the approach; what it no longer follows is the estimator's own steps.
 */
export const SWING_TAU_MS = 120;

/**
 * ⭐⭐⭐ **SMOOTH THE AMPLITUDE — device-reported, 2026-09-19.**
 *
 * > *"when I increase the swing speed gain or the swing speed exponent, the orbit of the camera
 * > becomes jittery: there seems to be steps in the orbit and it goes back and forth during the
 * > delta position movement. especially the swing speed exponent."* — the owner
 *
 * ⭐⭐⭐ **AND THE ARITHMETIC PREDICTS *"ESPECIALLY THE EXPONENT"* EXACTLY.** Differentiating
 * `A = max / (gain · speed^n)`:
 *
 *     dA/A  =  −n · dspeed/speed
 *
 * ⛔ so the estimator's relative wobble is multiplied by the **exponent** before it reaches the
 * camera: at `n = 2` a 10% flutter in speed becomes 20% of amplitude. ⚠ And raising the GAIN
 * lowers the knee, which moves more of the drag out of the clamped region where speed changes do
 * nothing at all — so both dials make it worse, and the exponent makes it worse faster. The
 * report names the two symptoms a first-order filter is for: **steps** (the window) and **back
 * and forth** (the wobble, amplified).
 *
 * ⛔⛔ **IT SMOOTHS `A`, NOT THE SPEED.** Filtering the speed would put a lag inside a quantity
 * three other rules read, and `recognizer.ts` is emphatic that there is ONE definition of *how
 * fast is this finger*. ⭐ The lag belongs to the consumer that cannot tolerate the noise.
 *
 * ⚠ **THE ENDPOINTS ARE UNAFFECTED, WHICH IS WHY THIS IS SAFE.** `θ = A·sin(πp)` is exactly
 * zero at `p = 0` and `p = 1` **whatever `A` is**, so no amount of smoothing can leave the camera
 * off its orbit at the trigger or at contact.
 *
 * ⛔ Frame-rate independent by construction — `1 − e^(−dt/τ)`, not a fixed per-frame fraction. A
 * fixed fraction would smooth twice as hard at 120 fps as at 60, which is the shape that makes a
 * gesture feel different on two devices for no reason anyone can see.
 *
 * @param dtMs time since the last call. ⚠ Non-positive or non-finite returns `previous`
 *   unchanged: a frame that took no time cannot have moved anything.
 */
export function smoothAmplitude(
  previous: number,
  target: number,
  dtMs: number,
  tauMs: number = SWING_TAU_MS,
): number {
  if (!Number.isFinite(previous)) return target;
  if (!Number.isFinite(target)) return previous;
  if (!(dtMs > 0) || !Number.isFinite(dtMs)) return previous;
  // ⚠ A non-positive τ means *no smoothing*, which is a legitimate request and the honest
  // reading of a zero: follow the target exactly.
  if (!(tauMs > 0) || !Number.isFinite(tauMs)) return target;
  return previous + (target - previous) * (1 - Math.exp(-dtMs / tauMs));
}

/**
 * ⭐⭐⭐ **RE-BASE THE TRIGGER GAP SO A HELD SWING RESUMES WITHOUT A JUMP.**
 *
 * ⛔⛔ DEVICE-REPORTED, 2026-09-19: *"when the follower is orange and the mode is rotation and
 * pioneer and follower objects are within the offset radius, a rotation of the pioneer controls
 * the rotation of the follower (which is normal) but also controls the camera to orbit which is
 * not wanted."*
 *
 * ⭐⭐ **THE CAUSE IS THAT `p` IS A FUNCTION OF THE SURFACE GAP, AND ROTATION CHANGES THE GAP.**
 * Turning two boxes moves their closest points, so `gapBetween` returns something different — and
 * in `FOLLOW` **both** bodies turn, which is why the report names orange. ⚠ Nothing translated,
 * so nothing about the APPROACH changed, yet the swing advanced and took the camera with it.
 * ⛔ The owner's spec is explicit that the swing accompanies *"the translation of the Follower"*.
 *
 * ⭐ So the swing **freezes** whenever no translation is driving it. That alone removes the
 * unwanted orbit — but it leaves a second problem: while frozen, a rotation may have moved the
 * gap a long way, so resuming the drag would **jump** the camera to whatever the new gap implies.
 *
 * ⭐⭐⭐ **THIS IS THE CURE FOR THAT JUMP, AND IT IS ONE LINE OF ALGEBRA.** `p = (g0 − gap)/g0`,
 * so asking *which `g0` makes the CURRENT gap mean the progress we are already showing* gives
 *
 *     g0' = gap / (1 − p)
 *
 * ⛔ Re-latching to that makes the resumption **exactly continuous**: the same angle, from the
 * new geometry, with no motion at the moment the finger starts moving again.
 *
 * ⚠ `p ≥ 1` has no solution — the approach is already at contact, and there is no `g0` that
 * makes a positive gap read as finished. ⛔ Returns `null`, and the caller keeps the latch it
 * has: a swing that has arrived stays arrived.
 * ⚠ A non-finite gap or progress returns `null` for the same reason — refuse, never improvise.
 */
export function rebaseTriggerGap(currentGapM: number, heldProgress: number): number | null {
  if (!Number.isFinite(currentGapM) || !Number.isFinite(heldProgress)) return null;
  if (heldProgress >= 1 || heldProgress < 0) return null;
  if (!(currentGapM > 0)) return null;
  const g0 = currentGapM / (1 - heldProgress);
  return Number.isFinite(g0) && g0 > 0 ? g0 : null;
}

/**
 * ⭐⭐⭐ **WHICH HELD BODY, IF ANY, DRIVES THE SWING?** — the index of the first grip that is
 * TRANSLATING it, by **either channel**, or `-1`.
 *
 * ⛔⛔ **ONLY A TRANSLATION DRIVES IT.** The owner's spec has the swing accompanying *"the
 * translation of the Follower"*, and the device report is what a rotation costs when it is
 * allowed to: turning two bodies moves their closest points, so the surface gap changes and the
 * swing advances although nothing approached.
 *
 * ⛔⛔⛔ **AND `"DEPTH"` IS A TRANSLATION — DEVICE-REPORTED THREE TIMES, 2026-09-23.** *"Still no
 * swing of camera when follower enters offset radius zone from translation along gravity axis
 * towards bottom."* ⚠ This test named the **mode** rather than the **kind of motion**, and
 * `scene.ts` sets a holder's mode to `"DEPTH"` the moment the SECOND touchpoint drives its axis
 * — which is exactly the gesture the report describes. ⭐ So pushing a body along gravity
 * renamed the very grip the swing was looking for, the driver came back `-1`, and the swing
 * froze: `p` stuck at `0.00`, `yaw` at `0.0°`, and `gapAtTriggerM` **rebased to the live gap
 * every frame**, which is why the HUD showed `g0` tracking the approach down.
 *
 * ⭐⭐ **THE THREE HUD LINES THE OWNER SENT ARE THE WHOLE PROOF**, and they arrived in the right
 * order: `arm=(0.0,0.0)` said the travel was never fed (defect 53); `arm=(0.0,-11.6)` with
 * `p=0.00` said the travel was fed and the progress was frozen — one report, two different
 * causes, told apart by one number.
 *
 * ⚠ `METHOD`: *a rule keyed on a NAME inherits every later meaning of that name.* `"DEPTH"` did
 * not exist as a mode when this test was written; it arrived with `A10` and quietly took a
 * translation out of the set.
 *
 * ⚠⚠ **IT IS HERE AND NOT IN `scene.ts` BECAUSE A MUTANT PROVED IT HAD TO BE.** Written as a
 * `.find()` in the render file, deleting the mode test — which reinstates the rotation defect —
 * left the whole suite green. ⭐ *A RULE in a render file is a rule nothing can interrogate.*
 *
 * ⚠ Takes MODES rather than grips so it stays engine-free: the caller holds the objects, this
 * holds the decision.
 */
export function swingDriverIndex(modes: readonly (string | null)[]): number {
  // ⛔ `ROTATE` and `null` are the exclusions, and they are the ones the device report of
  // 2026-09-19 asked for. ⭐ Written as a SET of the motions that translate, so a channel added
  // later is a decision here rather than a silent omission.
  return modes.findIndex((m) => m === "TRANSLATE" || m === "DEPTH");
}

/**
 * ⭐⭐⭐ **THE FROZEN PROGRESS — CAPTURED ONCE, CLEARED WHEN DRIVING RESUMES.**
 *
 * ⛔⛔ **THE "ONCE" IS THE WHOLE RULE.** `rebaseTriggerGap(gap, p)` with `p` read from the LIVE
 * gap is algebraically the identity — `gap/(1−(g0−gap)/g0) = g0` — so recomputing it every frame
 * makes the re-base do **nothing at all**, and the camera still jumps when the drag resumes.
 * ⚠ That is how the first build of this fix failed, and it failed SILENTLY: the code looked
 * right, the suite was green, and the arithmetic quietly cancelled.
 *
 * @param current what was already captured, or `null` if nothing is frozen yet.
 * @param live    the progress the current geometry implies.
 * @param driven  is a translation driving the swing this frame?
 */
export function freezeProgress(
  current: number | null,
  live: number,
  driven: boolean,
): number | null {
  if (driven) return null;
  return current !== null ? current : live;
}
