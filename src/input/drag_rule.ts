/**
 * ⭐⭐⭐ **`IN3` — WHAT DOES A ONE-TOUCHPOINT DRAG DO TO *THIS* OBJECT?**
 *
 * §2's rules 2bis and 2sexte are written as two rules with opposite preconditions:
 *
 * > **2bis** — one selected object **with an empty constraint stack** && delta position
 * > => the selected object rotates in yaw and pitch.
 * > **2sexte** — one selected object **with a non-empty constraint stack** && delta position
 * > => the object rotates **about the remaining free DOF only**; with two constraints there
 * > is no free rotational DOF and the drag is ignored.
 *
 * ⛔⛔ **AND THE SPEC NEVER SAYS HOW THEY MEET THE MOVEMENT MODE**, because the mode did not
 * exist when it was written. That gap is this file. The mode (`A16`) says whether a drag
 * TRANSLATES or ROTATES; the stack says what a ROTATION is allowed to be. ⭐ So the two
 * compose in one direction only, and stating it once here is cheaper than discovering it
 * three times at three call sites:
 *
 * | mode | stack | what the drag does |
 * |---|---|---|
 * | `TRANSLATE` | anything | **translate** — §1.4's solver consumes **rotational** DOF, so a constraint says nothing about where an object may be |
 * | `ROTATE` | empty | **free rotation** (2bis) — yaw about the world vertical, pitch about the horizontal |
 * | `ROTATE` | one entry | **constrained rotation** (2sexte) about the one remaining DOF |
 * | `ROTATE` | two or more | ⛔ **refused**: no free rotational DOF remains |
 *
 * ⚠⚠ **THE `TRANSLATE` ROW IS A CLAIM, NOT AN OMISSION.** An anchored object can still be
 * carried across the scene: §1.4's entries remove *rotational* freedom (a swing, then a
 * twist), and nothing in the spec ties a face's alignment to a position. ⭐ If a hand
 * disagrees — if anchoring ought to pin an object in place — that is a new decision, and this
 * table is where it would be made rather than a behaviour that leaked out of an `if`.
 *
 * ⛔ **AND `REFUSED` MUST NOT FALL THROUGH TO FREE ROTATION.** That is the whole reason this
 * returns four values instead of a boolean: a third constraint, or an unwired driver, has to
 * end in *nothing happens and the readout says why* — never in the object quietly breaking
 * the anchor the user set. §1.4 asks for a short negative haptic there (`IN7`).
 *
 * ⛔ ENGINE-FREE. It reads only the stack's LENGTH, so it cannot depend on what a constraint
 * happens to be — which is what keeps `MATE` from needing a special case here.
 */
import type { Constraint } from "../core/constraint_stack";
import type { Behaviour } from "./mode_toggle";

/** What a one-touchpoint drag on a selected object resolves to. */
export type DragRule =
  /** Rule 6: the object moves in the screen plane. ⭐ Unaffected by the stack. */
  | "TRANSLATE"
  /** §2 rule 2bis: free yaw/pitch, on an unconstrained object. */
  | "FREE_ROTATE"
  /** §2 rule 2sexte: rotation about the one remaining DOF. */
  | "CONSTRAINED_ROTATE"
  /**
   * ⛔ Two or more constraints: no free rotational DOF. **Nothing happens**, and the caller
   * must say so rather than falling back to a rotation that would break the anchor.
   */
  | "ROTATE_REFUSED";

/**
 * Resolve the drag.
 *
 * @param mode  the live movement mode (`A16`).
 * @param stack the object's constraint stack, oldest first (§1.4). ⚠ Only its LENGTH is
 *   read: *how many rotational DOF are left* is the only question this rule asks.
 */
export function dragRule(mode: Behaviour, stack: readonly Constraint[]): DragRule {
  if (mode === "TRANSLATE") return "TRANSLATE";
  if (stack.length === 0) return "FREE_ROTATE";
  if (stack.length === 1) return "CONSTRAINED_ROTATE";
  return "ROTATE_REFUSED";
}

/**
 * ⭐ Is this rule one the build can currently DRIVE?
 *
 * ⛔⛔ It exists so an unwired rule cannot be mistaken for an inert one. `CONSTRAINED_ROTATE`
 * is recognised by `dragRule` and its driver (`anchor_rotate.ts`, 25 vectors) is **built but
 * not wired** — blocked on a decision `A12` reopened by moving roll to the second touchpoint.
 * ⚠ So the honest behaviour today is *nothing happens, and the readout names the rule that
 * would have run*. ⭐ Without this distinction the HUD would say `CONSTRAINED_ROTATE` while
 * the object sat still, and a device pass would read that as a defect in 2sexte rather than
 * as work not yet done.
 */
export function isDriven(rule: DragRule): boolean {
  return rule === "TRANSLATE" || rule === "FREE_ROTATE";
}
