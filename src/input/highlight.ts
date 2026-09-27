/**
 * ⭐⭐ **TWO DECISIONS LEFT FROM `A16`'s HIGHLIGHT MODULE**: `captureOffsetM` (the capture offset
 * in world metres — the snap's reach) and `translatesOnDrag` (does this drag translate or rotate).
 *
 * ⛔ The white capture highlight itself — `highlightedPair`, its outlines and its zone edge — is
 * DELETED (`D120`), and `alignmentMatchesTarget` with it. The file keeps its name because both
 * survivors were born here. Design history: `Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md` §12.
 *
 * ⛔ ENGINE-FREE. Every function DECIDES; the caller acts.
 */
import type { Behaviour } from "./mode_toggle";
import { mmToPx } from "../core/units";
import { trackingMetresPerPx } from "./translate";

/**
 * ⭐⭐⭐ **THE CAPTURE OFFSET IN WORLD METRES, FROM A DISTANCE ON THE GLASS** (`D49`, the owner:
 * *"the offset distance shall depend on the camera position and focus … or more or less the
 * same in pixels although I do not want to use pixel since this may vary depending on device
 * screens"*).
 *
 * ⭐⭐ **THAT REQUEST HAS AN EXACT ANSWER ALREADY IN THIS CODEBASE.** `trackingMetresPerPx` is
 * the world displacement that keeps an object under a moving finger — computed from the
 * camera's field of view, its distance and the viewport height. ⛔ Composing it with `mmToPx`
 * turns *millimetres of finger travel* into *metres of world*, which is precisely
 * *"the same apparent size at every zoom, authored in millimetres and never in pixels"*:
 *
 * * **close camera ⇒ a smaller world offset**, far camera ⇒ larger, proportionally;
 * * **device-independent**, because the viewport height and field of view are in the formula —
 *   which is the half of the request raw pixels could not satisfy;
 * * ⭐ **no new constant.** `referenceCameraDistance`'s ratio form was deliberately superseded
 *   for rule 6 by this same computation (`translate.ts`), and the sway already scales this way
 *   so it looks the same size at every zoom. Three rules, one factor.
 *
 * ⚠⚠ **THE DISTANCE IS THE CAMERA'S TO ITS FOCUS, NOT TO EACH BODY** — which is what the owner
 * asked for (*"camera and focus"*) and is one number for the whole scene. ⛔ A per-body distance
 * would make two bodies at different depths capture at different world gaps, so a pair could be
 * *in range* measured from one and *out of range* measured from the other — a rule with two
 * answers. ⭐ Stated because it is a modelling choice, not an approximation.
 *
 * ⭐ Its readers today are the snap (`D100`, a Follower captures within this reach of its cursor)
 * and the sway's assembly test.
 * ⛔ Returns 0 for a degenerate viewport or camera, which reads as *nothing captures* — the
 * safe direction, and the same convention `trackingMetresPerPx` already uses.
 */
export function captureOffsetM(
  offsetMm: number,
  cameraDistanceM: number,
  fovRad: number,
  viewportHeightPx: number,
): number {
  if (!(offsetMm > 0)) return 0;
  return mmToPx(offsetMm) * trackingMetresPerPx(cameraDistanceM, fovRad, viewportHeightPx);
}

/**
 * ⭐⭐⭐ **DOES THIS DRAG TRANSLATE?** — born as `A16`'s condition 2 (*"translation by one
 * touchpoint or two touchpoints"*), the highlight it once gated being deleted (`D120`).
 *
 * ⛔⛔ **THIS IS THE ONE PLACE THAT RULE LIVES**, and `pointer_wiring.ts` reads it. ⭐ `METHOD`'s
 * shape: *one constant lives in exactly one place*, and so does one rule.
 *
 * ⭐ Why two held objects translate in EITHER mode: they are two holders, and the mode is
 * overridden because a pair being moved together is a translation by construction. ⚠ Two
 * fingers on the SAME object are a holder plus a `SECOND` (roll or depth), not a pair — the
 * caller must pass DISTINCT objects, which is why this takes a count of objects and not of
 * touchpoints.
 */
/**
 * ⭐⭐⭐ **`D60` — AND A SECOND TOUCH THAT OWNS ROLL *AND* DEPTH TAKES THE MODE'S PLACE.**
 *
 * > *"whatever translation mode, when an object is aligned as follower the second touch shall
 * > control the depth and the roll … **and the first touch shall control the translation with
 * > delta position x and y** (which is currently the case in translation mode but not in rotation
 * > mode)."* — the owner, 2026-09-19
 *
 * ⭐⭐ **IT IS THE SAME RULE THIS FUNCTION ALREADY HAD, WITH ITS REASON GENERALISED.** Two held
 * objects translate in either mode because *a pair being moved together is a translation by
 * construction*. ⛔ That is also why the owner saw the behaviour they wanted **only** when the
 * second touch hit the Pioneer: that is two held objects, so `heldObjectCount >= 2` already fired.
 * ⚠ A second touch **outside** leaves the count at one, and the mode decided — which is the case
 * they are correcting.
 *
 * ⭐⭐⭐ **THE REAL CONDITION IS A DOF BUDGET, AND NOW IT READS AS ONE.** When the second touch
 * owns roll **and** depth (`D59`), the two fingers already cover the body's whole remaining
 * freedom: first touch x/y in the screen plane, second touch roll + depth. ⛔ Leaving the first
 * touch on the twist would put **two fingers on one DOF**, which is precisely the conflict the
 * owner reported: *"… and conflicts with the dx or dy of the first touch."*
 *
 * ⚠ **KEYED ON PRESENCE, NEVER ON MOTION**, and this obeys it: the second
 * touchpoint being DOWN is a discrete fact, so the first touch's job changes when a finger lands
 * or lifts and never because something moved.
 */
export function translatesOnDrag(
  heldObjectCount: number,
  mode: Behaviour,
  /**
   * ⭐⭐ `D108` (the owner, 2026-09-27): an ALIGNED Follower is MODE-LESS on both devices — its
   * first touch always slides it in its horizontal plane; the second touch lifts it and spins it
   * about the aligned normal. ⛔ It was *"does a second touch currently own roll and depth"*, which
   * on the tablet left a one-finger aligned body twisting in `ROTATE` — two channels for one DOF.
   */
  heldIsAlignedFollower = false,
): boolean {
  if (heldObjectCount >= 2) return true;
  // ⛔ `D60`: the second touch has taken the rotational freedom, so the first takes translation
  // — whatever the mode says. ⚠ Defaulted to `false` so every caller that does not know about a
  // second touch keeps exactly the behaviour it had.
  if (heldIsAlignedFollower) return true;
  return mode === "TRANSLATE";
}

