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
 * ## ⭐⭐ THE GAIN WAS COMPUTED BEFORE IT WAS WRITTEN
 *
 * Apparent size goes as `1/distance`, so keeping the object under the two fingers fixes the
 * mapping exactly — **the object's distance scales by the inverse of the separation
 * ratio**, which is precisely what `PinchTracker` already returns for the camera. So
 * `gainPinchDepth` is a **multiplier on a computed factor and 1.0 is the CORRECT value**,
 * not a preferred one. ⛔ It is rule 6's lesson applied before the fact instead of after: a
 * metres-per-millimetre constant cannot serve both ends of a 20× zoom clamp.
 *
 * ## ⭐⭐ AND SCALING ALONG THE RAY ANSWERS A QUESTION A5 LEFT OPEN
 *
 * A5 deliberately did not decide whether the pinch should also translate in the screen
 * plane. ⭐ **It does not, by construction**: moving the object along the line from the
 * camera through the object leaves it on the SAME RAY, so its screen position is unchanged
 * and only its distance moves. The object stays exactly where it looks like it is, and gets
 * nearer or further. ⛔ That is a property of the geometry, not a rule anybody has to
 * enforce — and `tests/depth_pinch.test.ts` asserts it rather than assuming it.
 *
 * ## ⛔ THE MECHANISM IS REUSED, NOT REBUILT
 *
 * `PinchTracker` already does the hard part: a RATIO measured from the gesture's start
 * (never accumulated per frame, so a pinch out and back returns exactly), with a deadband
 * that RE-ANCHORS when crossed so the first live frame does not jump. ⭐ `METHOD`: a second
 * implementation is a thing that can silently disagree. This module adds only what is new —
 * where the object goes, and how far it may be pushed.
 *
 * ⛔ ENGINE-FREE: plain vectors and a plain config.
 */
import { CAMERA_NEAR_PLANE_M, type GestureConfig } from "./gestureConfig";
import { PinchTracker } from "./pinch";
import { add, length, normalize, scale, sub, type Vec3 } from "../core/vec";

/**
 * How near and how far a pinch may drive an object, in metres.
 *
 * ⛔⛔ BOTH BOUNDS ARE DERIVED FROM NUMBERS THAT ALREADY EXIST, and that is deliberate —
 * two invented tunables here would be two more things `IN5` has to measure for no reason.
 *
 * * **The floor is twice the near plane.** `pinch.ts` records why this matters: the near
 *   plane is load-bearing, and a zoom that can cross it produces *a black page with no
 *   error at all*. An object pushed to the camera would clip through it and then invert
 *   behind it — the same silent failure, one object at a time.
 * * **The ceiling is the camera's own maximum orbit radius.** Beyond it the object cannot
 *   be brought back into view even by zooming all the way out, so it is lost rather than
 *   far away. ⚠ A gesture must not be able to reach a state the user cannot undo.
 *
 * ⚠⚠ **THE CEILING IS TIGHT, AND IT IS A DEVICE QUESTION.** Because the ceiling IS the
 * camera maximum radius, how far a pinch can push depends on where the camera already is:
 * an object 2.4 m out cannot be pushed even 1.25x before it stops. ⛔ If the gesture feels
 * like it STICKS, that is the ceiling and not the gain — do not answer it by raising
 * gainPinchDepth, which would only reach the same wall sooner.
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
 * Where the object goes for a pinch `factor` (as returned by `PinchTracker.scale`).
 *
 * ⚠ `factor` above 1 pushes the object AWAY — fingers coming together make it smaller,
 * which is what a hand means by *"zoom it out"*. Below 1 it comes closer. That is the same
 * sense `PinchTracker` already gives the camera, so the two rules agree by construction
 * rather than by a sign someone remembered to flip.
 *
 * ⛔ Returns the object's position UNCHANGED when it sits on the camera: there is no ray
 * to scale along, and a normalise-by-zero here would write a `NaN` into a placement, which
 * never washes out. `LESSONS_CARRIED` §6 — suppress, do not substitute.
 */
export function depthPinchPosition(
  cameraPosition: Vec3,
  objectPosition: Vec3,
  factor: number,
  minM: number,
  maxM: number,
): Vec3 {
  const ray = sub(objectPosition, cameraPosition);
  const distance = length(ray);
  const direction = normalize(ray);
  if (!direction || !(distance > 0) || !(factor > 0) || !Number.isFinite(factor)) {
    return objectPosition;
  }
  const clamped = Math.min(maxM, Math.max(minM, distance * factor));
  return add(cameraPosition, scale(direction, clamped));
}
