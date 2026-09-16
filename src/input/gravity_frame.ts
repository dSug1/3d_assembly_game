/**
 * AMENDMENT **A7** — **THE GRAVITY FRAME**: the world-referenced basis every object
 * gesture is expressed in.
 *
 * Design of record: `Claude/10_INPUT_TOUCH/AMENDMENTS_R5.md` A7.
 *
 * ```
 *   right  — the camera's right, which is ALWAYS horizontal
 *   up     — straight up. The opposite of gravity, whatever the camera is doing
 *   depth  — the camera's view direction, FLATTENED onto the ground plane
 * ```
 *
 * ## ⭐⭐ THE THREE ARE ORTHONORMAL AT EVERY CAMERA ELEVATION, AND THAT IS THE POINT
 *
 * ⛔⛔ THE ARGUMENT IS ORTHOGONALITY, NOT TIDINESS. Before A7 an object yawed about the
 * CAMERA's up and rolled about the CAMERA's view axis. Tilt the camera and the view axis
 * acquires a vertical component — so **roll stops being independent of yaw**, the two
 * gestures partly do the same thing, and the overlap grows with the tilt. There is no gain
 * that fixes that; it is a basis that is not a basis.
 *
 * ⭐ Flattening the roll axis and standing yaw on gravity restores independence: `right` is
 * horizontal by construction (the camera carries no roll, so its right is
 * `worldUp × forward`), `up` is vertical by definition, and `depth` is the forward with
 * everything vertical removed — perpendicular to both.
 *
 * ## ⭐ ONE BASIS FOR TRANSLATION **AND** ROTATION
 *
 * | finger | translates along | rotates about |
 * |---|---|---|
 * | delta x | `right` | `up` — yaw |
 * | delta y | `up` — vertical | `right` — pitch |
 * | delta y, BOTH fingers (A6) | `depth` | — |
 * | a circle (2quinte) | — | `depth` — roll |
 *
 * ⭐ **The axis you push along is the axis you can turn about.** A hand learns one frame
 * instead of two, and it is the frame the WORLD is built in: §2 rule 2ter anchors a face to
 * gravity and parts are assembled on a working plane, so gravity is the thing the user is
 * already reasoning about.
 *
 * ## ⚠ WHAT IT COSTS, AND THE THIRD ONE IS THE ONE TO WATCH
 *
 * 1. **Vertical translation goes quiet looking straight down** — gravity projects to a
 *    point, so a finger moving up and down moves the object toward and away from the
 *    camera, invisibly.
 * 2. **The roll axis vanishes there too**, for the same reason, and the frame returns
 *    `null` rather than guessing.
 * 3. ⚠ **THE ROLL LOOKS DIFFERENT WHEN THE CAMERA IS TILTED — but the GESTURE does not.**
 *    ⛔ Stated carefully because the first wording here was WRONG, and the owner corrected
 *    it: *"we do not project the delta position so the input is still a circular movement,
 *    we only modify the axis of rotation."* Exactly so. `degClockwise` is the signed angle
 *    accumulated about a FITTED CENTRE — a pure screen-space measurement — so the circle is
 *    no harder to sweep and the amount of rotation is identical. ⭐ Only the AXIS changes.
 *
 *    What changes is the PICTURE: the object's points now turn in planes perpendicular to
 *    `depth`, tilted from the screen plane by the camera's elevation, so those circles
 *    project to ELLIPSES squashed by `cos(elevation)` — 100% level, ~71% at 45°, ~31% at
 *    the top ring. The coupling between the finger's circle and the picture loosens; the
 *    control does not.
 *
 *    ⭐⭐ AND IT BUYS SOMETHING THE OLD AXIS COULD NOT: **the roll becomes REPRODUCIBLE IN
 *    WORLD TERMS.** Roll 90°, orbit the camera, roll 90° again — about the view axis those
 *    are two DIFFERENT world rotations; about `depth` they are the same one. For getting a
 *    part into a specific orientation that is worth more than screen fidelity.
 *
 * ⭐ Costs 1 and 2 are the *"goes quiet before it fails"* shape for the third and fourth
 * time on this project (after A3's handover and A6's depth). ⚠ It is now a pattern rather
 * than a coincidence: **every rule referenced to a world axis weakens as the camera lines
 * up with that axis.** Expect it, and check for it in the next one.
 *
 * ⛔ ENGINE-FREE.
 */
import { cross, dot, normalize, scale, sub, type Vec3 } from "../core/vec";

/**
 * The basis an object gesture is expressed in. ⛔ Distinct from `ScreenFrame`, which is the
 * CAMERA's own axes and is still what A3's handover needs — it asks for the angle between
 * the view axis and a constraint axis, and a flattened view axis would answer a different
 * question. ⚠ Two frames, two purposes; conflating them is the defect this split prevents.
 */
export interface GravityFrame {
  /** Horizontal, across the screen. ⭐ The camera's own right: it carries no roll. */
  readonly right: Vec3;
  /** Straight up — the opposite of gravity. ⚠ NOT the camera's up. */
  readonly up: Vec3;
  /** Horizontal, into the scene: the view direction with everything vertical removed. */
  readonly depth: Vec3;
  /**
   * ⭐⭐ HOW THE CAMERA STANDS RELATIVE TO GRAVITY — `dot(viewAxis, gravityDown)`.
   * **+1 looking straight down, −1 looking straight up, 0 level.**
   *
   * ⛔⛔ IT IS THE SIGN A DEPTH GESTURE NEEDS, AND ITS ABSENCE WAS A DEFECT FOUND BY
   * FINGER: *"when the camera is on the bottom ring facing upwards, the depth translation
   * is chaotic."* An object pushed further away along the ground rises toward the horizon
   * when you look DOWN on the scene and **sinks** when you look UP at it — so a rule that
   * hard-codes *fingers-up means away* is correct on the top rings and **backwards on the
   * bottom one**, where every correction the hand makes goes the wrong way.
   *
   * ⚠ At 0 — a level camera — a depth change produces NO screen motion at all, so there is
   * no direction to follow and the gesture has nothing to show. ⭐ The fifth appearance of
   * the *"goes quiet before it fails"* shape, and the first where the quiet zone sits in the
   * MIDDLE of the range rather than at an end.
   */
  readonly towardGravity: number;
}

/**
 * Build the frame from the camera's forward and the world's gravity.
 *
 * ⛔ Returns `null` when the camera looks straight along gravity — there is no horizontal
 * component of the view direction to call "depth", and every direction across the screen
 * would be equally entitled to the name. `LESSONS_CARRIED` §6: suppress, do not substitute.
 *
 * @param viewAxis    the camera's forward, pointing INTO the screen.
 * @param gravityDown the world's down. ⚠ Passed in, never assumed — `WORLD_DOWN` is the
 *   object model's, and a second opinion about down would let a part be anchored to one
 *   vertical and pushed along another.
 */
export function gravityFrame(viewAxis: Vec3, gravityDown: Vec3): GravityFrame | null {
  const g = normalize(gravityDown);
  const v = normalize(viewAxis);
  if (!g || !v) return null;

  const depth = normalize(sub(v, scale(g, dot(v, g))));
  if (!depth) return null;

  const up = scale(g, -1);
  // ⭐ Derived from the two that are already fixed rather than taken from the camera, so
  // the basis is orthonormal BY CONSTRUCTION and cannot drift if the camera gains a roll.
  // ⚠⚠ `up × depth`, NOT `depth × up`. I wrote it the other way round first and the
  // vector caught it: the camera builds its right as `worldUp × forward`, so the gravity
  // frame must match or every horizontal drag would run BACKWARDS. ⛔ A sign is not tested
  // by any amount of testing the magnitude — `METHOD`, and this is the fifth time.
  const right = normalize(cross(up, depth));
  if (!right) return null;

  return { right, up, depth, towardGravity: dot(v, g) };
}

/**
 * ⭐ How well the camera can SHOW a motion along the world vertical — `|sin| of the angle
 * between the view axis and gravity`, 1 looking level and 0 looking straight down.
 *
 * ⛔ Published so the weakening is measurable rather than a thing users report as "it
 * stopped working". ⚠ It is the same quantity A6's depth is scaled by, from the other side:
 * where vertical translation goes quiet, depth is at its strongest, and the reverse.
 */
export function verticalVisibility(viewAxis: Vec3, gravityDown: Vec3): number | null {
  const g = normalize(gravityDown);
  const v = normalize(viewAxis);
  if (!g || !v) return null;
  const along = dot(v, g);
  return Math.sqrt(Math.max(0, 1 - along * along));
}
