/**
 * AMENDMENT **A5** (`D16`) — **TWO TOUCHPOINTS ON THE SAME OBJECT ARE A DEPTH PINCH.**
 *
 * Design of record: `Claude/10_INPUT_TOUCH/AMENDMENTS_R5.md` A5. Pinch in to push the
 * object away, pinch out to bring it closer. It supersedes `D10` (*ignore the second
 * touchpoint*) and closes §5's last undefined configuration.
 *
 * ⭐⭐ IT CAME FROM A HAND. The `3D1` device pass asked whether depth is got by ORBITING or
 * by PUSHING with rule 6's anchor finger, and the answer was neither — a fourth outcome the
 * question did not offer. §3.2 DS3 is declined as a result.
 *
 * ## ⛔⛔ "DEPTH" IS HORIZONTAL, NOT ALONG THE VIEW AXIS — and this is the whole rule
 *
 * The object moves along the **camera's view direction projected onto the ground plane**:
 * the view axis with its gravity component removed. ⚠ Not along the camera ray, which was
 * the first build and which the owner corrected:
 *
 * > *"I want the depth to be always orthogonal to the gravity direction, whichever the
 * > camera orbit position is … pushing an object on the camera view axis, except for
 * > scaling the object, does not provide much visual feedback."*
 *
 * ⭐ That reason is right, and there is a stronger one underneath it. **GRAVITY IS THE
 * PRIMARY CONSTRAINT IN THIS GAME**: §2 rule 2ter anchors a face to it, 2sexte rotates
 * about it, and parts are assembled standing on a working plane. Pushing along the camera
 * ray with the camera tilted down — which is the normal way to look at a build — drives the
 * part **into the floor**, or under a lower camera, up into the air. ⛔ A gesture for *"put
 * this further away"* must not silently change an object's HEIGHT.
 *
 * ⭐⭐ So the rule keeps three things separate, and all three are asserted:
 *
 *   * the object's **height never changes** — the push direction is perpendicular to gravity
 *     by construction, so there is no height term to get wrong;
 *   * its offset **across** the view stays put;
 *   * only its **horizontal depth** — how far into the scene it is — scales.
 *
 * ⚠ And the owner's reason shows up as the payoff: an object pushed along the ground both
 * shrinks AND climbs toward the horizon on screen, so the gesture has visible feedback
 * rather than a size change nobody can judge.
 *
 * ## ⭐⭐ THE GAIN WAS COMPUTED BEFORE IT WAS WRITTEN
 *
 * Apparent size goes as `1/distance`, so keeping the object under the two fingers fixes the
 * mapping — **the depth scales by the inverse of the separation ratio**, which is precisely
 * what `PinchTracker` already returns for the camera. `gainPinchDepth` is a **multiplier on
 * a computed factor and 1.0 is the CORRECT value**, not a preferred one. ⛔ Rule 6's lesson
 * applied before the fact: a metres-per-millimetre constant cannot serve both ends of a 20×
 * zoom clamp.
 *
 * ⚠ Horizontal depth is not the same as distance-from-camera, so **1.0 tracks the fingers
 * exactly only for an object at the camera's own height**. The lower the camera, the closer
 * the two agree; a steeply tilted camera trades a little tracking for keeping the part on
 * its plane, which is the right trade in an assembly game.
 *
 * ## ⛔ THE MECHANISM IS REUSED, NOT REBUILT
 *
 * `PinchTracker` already does the hard part: a RATIO measured from the gesture's start
 * (never accumulated per frame, so a pinch out and back returns exactly), with a deadband
 * that RE-ANCHORS when crossed so the first live frame does not jump. ⭐ `METHOD`: a second
 * implementation is a thing that can silently disagree.
 *
 * ⛔ ENGINE-FREE: plain vectors and a plain config.
 */
import { CAMERA_NEAR_PLANE_M, type GestureConfig } from "./gestureConfig";
import { PinchTracker } from "./pinch";
import { add, dot, normalize, scale, sub, type Vec3 } from "../core/vec";

/**
 * How near and how far a pinch may drive an object, in metres of HORIZONTAL depth.
 *
 * ⛔⛔ BOTH BOUNDS ARE DERIVED FROM NUMBERS THAT ALREADY EXIST, deliberately — two invented
 * tunables here would be two more things `IN5` has to measure for no reason.
 *
 * * **The floor is twice the near plane.** `pinch.ts` records why this matters: the near
 *   plane is load-bearing, and a zoom that can cross it produces *a black page with no
 *   error at all*. An object pushed onto the camera would clip through and invert behind
 *   it — the same silent failure, one object at a time.
 * * **The ceiling is the camera's own maximum orbit radius.** Beyond it the object cannot
 *   be brought back into view even by zooming all the way out, so it is lost rather than
 *   far away. ⚠ A gesture must not be able to reach a state the user cannot undo.
 *
 * ⚠⚠ **THE CEILING IS TIGHT, AND IT IS A DEVICE QUESTION.** Because it IS the camera's max
 * radius, how far a pinch can push depends on where the camera already is. ⛔ If the gesture
 * feels like it *sticks*, that is the ceiling and not the gain — raising `gainPinchDepth`
 * would only reach the same wall sooner.
 */
export function depthPinchLimits(cfg: GestureConfig): { minM: number; maxM: number } {
  return { minM: 2 * CAMERA_NEAR_PLANE_M, maxM: cfg.cameraRadiusMaxM };
}

/**
 * The tracker for a depth pinch. ⭐ The same class rule 4 uses, with its own gain — so the
 * ratio, the deadband and the re-anchoring cannot drift apart between the two rules.
 */
export function depthPinchTracker(cfg: GestureConfig): PinchTracker {
  return new PinchTracker(cfg, cfg.gainPinchDepth);
}

/**
 * The direction a pinch pushes an object along: the camera's view direction with its
 * gravity component removed, normalised. `null` when there is none.
 *
 * ⛔⛔ IT VANISHES WHEN THE CAMERA LOOKS STRAIGHT DOWN, and that is a REAL configuration
 * here, not a corner case — the orbit surface's top ring is a steep look-down. ⭐ Same shape
 * as amendment A3's handover: the gesture does not fail suddenly at the pole, it **goes
 * quiet over a range before it**.
 *
 * ⚠⚠ BUT THE MECHANISM IS THE CAMERA'S **POSITION**, NOT ITS ANGLE, and the difference is
 * easy to get backwards. Flattening the view axis does not TURN it — a camera tilted 10° or
 * 80° about the same heading flattens to the same direction — so the push direction is
 * unaffected by tilt. What shrinks is the HORIZONTAL DISTANCE from camera to object as the
 * camera climbs the orbit surface toward being overhead, and it is that distance the ratio
 * scales. ⭐ So a pinch near the top ring moves the object barely at all: geometry, not a
 * bug. It is the second time this project has met the "goes quiet before it fails" shape,
 * and worth expecting a third.
 *
 * @param viewAxis   the camera's forward, pointing INTO the screen (`ScreenFrame`'s sense).
 * @param gravityDown the world gravity direction. ⚠ Passed in, never assumed: `GRAVITY_ALIGN`
 *   stores a world vector per constraint and this module does not get to invent a second
 *   opinion about which way is down.
 */
export function depthPushDirection(viewAxis: Vec3, gravityDown: Vec3): Vec3 | null {
  const g = normalize(gravityDown);
  const v = normalize(viewAxis);
  if (!g || !v) return null;
  // The view direction with everything vertical taken out of it.
  const along = dot(v, g);
  return normalize(sub(v, scale(g, along)));
}

/**
 * Where the object goes for a pinch `factor` (as returned by `PinchTracker.scale`).
 *
 * ⚠ `factor` above 1 pushes the object AWAY — fingers coming together make it smaller,
 * which is what a hand means by *"zoom it out"*. Below 1 it comes closer. The same sense
 * `PinchTracker` already gives the camera, so the two rules agree by construction rather
 * than by a sign someone remembered to flip.
 *
 * ⛔ Returns the position UNCHANGED, never a `NaN` and never a guess, when there is no push
 * direction (camera straight down), when the object is not in front of the camera
 * horizontally, or when the factor is not a usable number. `LESSONS_CARRIED` §6 — suppress,
 * do not substitute; one `NaN` written into a placement never washes out.
 */
export function depthPinchPosition(
  cameraPosition: Vec3,
  objectPosition: Vec3,
  viewAxis: Vec3,
  gravityDown: Vec3,
  factor: number,
  minM: number,
  maxM: number,
): Vec3 {
  const push = depthPushDirection(viewAxis, gravityDown);
  if (!push || !(factor > 0) || !Number.isFinite(factor)) return objectPosition;

  // How far into the scene the object is, measured along the ground, from the camera.
  const depth = dot(sub(objectPosition, cameraPosition), push);
  // ⛔ Behind the camera, or exactly beside it: a ratio has nothing to scale.
  if (!(depth > 0)) return objectPosition;

  const wanted = Math.min(maxM, Math.max(minM, depth * factor));
  // ⭐ ONLY the along-push component moves. Height and the across-view offset are untouched
  // because the displacement is a multiple of `push`, which is perpendicular to gravity.
  return add(objectPosition, scale(push, wanted - depth));
}
