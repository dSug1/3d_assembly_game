/**
 * ⭐⭐⭐ **AMENDMENT A15** — is the object still UNDER the finger that is carrying it?
 *
 * ⛔⛔ THE HOLE `A10` LEFT, and it is geometric rather than accidental. Depth translation
 * pushes the object **along the view direction**, so its projection slides and shrinks
 * while the finger holding it does not move at all — that is the whole point of the rule
 * (*"the finger on the object holds still"*). Push far enough and **the object is simply
 * not under the holder any more**, yet §4 latches a role at press for the touchpoint's
 * lifetime, so that finger kept carrying an object it was no longer touching.
 *
 * ⚠ The owner's words: *"it means the previously selected object is no longer under the
 * finger which used to control it."*
 *
 * ⭐⭐ THE TEST IS A RAYCAST AT ONE DISCRETE MOMENT — when the second touchpoint is
 * RELEASED. ⛔ Not per frame: re-deciding a role continuously is exactly what `IN2`'s latch
 * exists to prevent, and `METHOD` has the verdict twice over — *a mode may be keyed on
 * PRESENCE; never on MOTION*. A lift is discrete, deliberate and visible, which is the same
 * class of evidence `A14`'s grace is keyed on.
 *
 * ⭐⭐⭐ AND THE CONSEQUENCE IS DEFERRED, WHICH IS THE OWNER'S SECOND REQUIREMENT: the
 * binding is marked dead and **nothing happens yet**. The object does not jump, nothing is
 * deselected on screen, and the camera does not move. Only at the **next input event** does
 * the selection drop and the configuration re-resolve into whatever is actually down.
 * ⛔ *"Acting is irreversible; not knowing is not a reason to act"* (`METHOD`) — and here
 * there is a stronger reason: at the instant of the lift the user has given no new
 * instruction, so any visible change would be the program's idea rather than theirs.
 *
 * ⭐ WHAT IT BUYS, in the owner's own examples: a finger left over empty space becomes an
 * ORBIT driver, and a second finger pressed on a different object starts that object's
 * gesture — *"whatever the new input configuration is"*. Both fall out of re-latching; none
 * of it is a new rule.
 *
 * ⛔ HOW IT MEETS `A14`. A14 keeps a second touchpoint *held* for `secondTouchGraceMs` after
 * it lifts, so a lift-and-replace reads as ONE gesture. ⭐⭐ The two **partition** rather
 * than compete, and the raycast is what separates them: holder still on its object → A14's
 * grace, unchanged; holder no longer on it → there is no gesture left to preserve, because
 * the finger A14 protects is not touching the thing it was moving. ⚠ That is the same shape
 * as `A10` and rule 6 partitioning on the holder's stillness — one question, two disjoint
 * answers, nothing to arbitrate over time.
 *
 * ⛔ ENGINE-FREE and generic over the object handle, like `router.ts`: this file never
 * learns what a mesh or a ray is. The CALLER raycasts and hands over what it found.
 */

/** Whether a holding touchpoint still carries its object. */
export type HolderBinding =
  /** The object is under the finger. Everything proceeds as wired. */
  | "BOUND"
  /**
   * ⭐ The object is NOT under the finger, and the selection is **dead but not yet
   * collected**. ⛔ Deliberately not called "UNSELECTED": nothing has happened yet, and the
   * next input event is what makes it visible.
   */
  | "ORPHANED";

/** What the next input event is, for an orphaned holder. */
export type InputEvent =
  /** A delta position from a touchpoint already down. */
  | "MOVE"
  /** A new touchpoint went down — on an object or not. */
  | "PRESS"
  /** The orphaned holder itself lifted. */
  | "RELEASE";

/** What to do with the holder when that event arrives. */
export type OrphanAction =
  /** Nothing to collect. */
  | "KEEP"
  /**
   * ⭐ Drop the selection, re-latch every live touchpoint from what is under it NOW, and
   * let the event fall through to whatever rule the new configuration selects.
   */
  | "UNSELECT_AND_RERESOLVE"
  /**
   * ⛔ The holder lifted: drop the selection **without** running the §1.3 release verdict.
   * ⚠ That exclusion is the point — a flick-to-align or a tap belongs to a finger that was
   * still on its object, and running one here would align an object the user stopped
   * touching several hundred milliseconds ago.
   */
  | "DROP_WITHOUT_VERDICT";

/**
 * ⭐ Evaluate the binding at the moment a second touchpoint lifts.
 *
 * @param carried    the object this touchpoint has been carrying since its press.
 * @param underNow   what the caller's raycast found under that same finger, or `null` for
 *   a miss. ⛔ BOTH failure modes orphan, and the owner named them together: *"if the
 *   raycast hits nothing or another object"*. A different object is not a lesser miss —
 *   it is the case where acting on the old selection is most obviously wrong.
 */
export function bindingAfterSecondRelease<O>(carried: O, underNow: O | null): HolderBinding {
  return underNow !== null && underNow === carried ? "BOUND" : "ORPHANED";
}

/**
 * ⭐ What the next input event does to a holder in this binding.
 *
 * ⛔ A `BOUND` holder is untouched by every branch. That is asserted by its own vectors:
 * this amendment must be invisible to the gestures that already work.
 */
export function orphanAction(binding: HolderBinding, event: InputEvent): OrphanAction {
  if (binding === "BOUND") return "KEEP";
  return event === "RELEASE" ? "DROP_WITHOUT_VERDICT" : "UNSELECT_AND_RERESOLVE";
}
