/**
 * ⭐⭐⭐ **THE PINNED PIONEER — a held Pioneer that drives the Follower instead of itself.**
 *
 * Design of record: [`Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`] §21 (`D51`).
 *
 * > *"At the moment, whatever the rotation or translation mode, if two touchpoints are on
 * > Pioneer and Follower object, both translate. I want to have a flag to toggle on or off the
 * > translation of the Pioneer object in this case … if it is toggled off … 1) the Pioneer
 * > cannot translate and 2) the second touchpoint controls both the depth translation and the
 * > roll of the Follower object (note, this is different from when there is a single touchpoint
 * > on follower object, the second touchpoint cannot control both the depth and the roll)"*
 * > — the owner, 2026-09-18
 *
 * ⭐⭐ **WHAT IT BUYS: A SECOND HAND THAT STEERS RATHER THAN CARRIES.** With the flag on, two
 * holders are two carriers — each finger moves its own body, and nothing controls the roll or
 * the depth of either without a third touch. ⛔ With it off the Pioneer stops being cargo and
 * becomes a **control surface**: it holds still in the world while its finger gives the Follower the
 * two axes a single holder cannot reach.
 *
 * ⛔⛔ **AND IT DELIBERATELY BREAKS `A16`'s ONE-AXIS RULE, WHICH THE OWNER NAMED HIMSELF.** A
 * second touchpoint on a *singly* held body drives **roll by its x OR depth by its y, never
 * both** — the mode picks one, and switching needs a tap (`A12` → `A16`). ⭐ Here both apply at
 * once. ⚠ That is not an inconsistency to be tidied away: the configurations differ by what the
 * OTHER finger is doing. A `SECOND` touchpoint shares a body with the holder and a diagonal
 * would smear roll into depth by accident; a finger on the **Pioneer** is a deliberate second
 * grip on a different body, and the hand that placed it there is asking for both.
 * ⛔ `A11`'s per-axis deadband is what keeps the two corridors independent — the same thing
 * `A12` relied on when it last allowed two axes at once.
 *
 * ⛔ ENGINE-FREE, and every function answers a question rather than changing anything.
 */
import type { ObjectId } from "../core/object_model";
import type { MotionState } from "./motion";

/** Two held bodies that stand in an alignment relationship. */
export interface PinnedPair {
  /** The aligned body — it keeps translating, whatever the movement mode. */
  readonly follower: ObjectId;
  /** The body it is aligned TO — the one the flag can stop from translating. */
  readonly pioneer: ObjectId;
}

/**
 * ⭐⭐ **ARE THESE TWO HELD BODIES A PIONEER AND ITS FOLLOWER?**
 *
 * ⛔ EXACTLY TWO, AND RELATED. ⚠ Three held bodies are not this configuration and must not be
 * forced into it: which of the two candidates is *the* Pioneer would have no trustworthy
 * answer, and `scene.ts` already refuses an alignment for the same reason when two other
 * bodies are held.
 *
 * ⭐ The direction is asked BOTH ways because the hand chooses which body to align, not which
 * to grab first — press order says nothing about who is the Pioneer.
 *
 * ⚠ A mutual pair (each the other's Pioneer) is unrepresentable: `A18`'s `wouldCycle` refuses
 * the tap that would create one. ⛔ The check below still resolves it deterministically rather
 * than relying on that invariant from another module — *a guard that assumes its neighbour's
 * invariant fails the day the neighbour changes.*
 *
 * @param pioneerFor the alignment index's forward lookup: *what is this body aligned to?*
 */
export function pinnedPair(
  held: readonly ObjectId[],
  pioneerFor: (follower: ObjectId) => ObjectId | null,
): PinnedPair | null {
  if (held.length !== 2) return null;
  const a = held[0];
  const b = held[1];
  if (a === undefined || b === undefined || a === b) return null;
  const aFollows = pioneerFor(a) === b;
  const bFollows = pioneerFor(b) === a;
  // ⚠ Both directions true would be a cycle. ⛔ Refuse rather than pick: the configuration is
  // meaningless, and silently choosing one would make the behaviour depend on press order.
  if (aFollows && bFollows) return null;
  if (aFollows) return { follower: a, pioneer: b };
  if (bFollows) return { follower: b, pioneer: a };
  return null;
}

/**
 * ⭐⭐⭐ **THE PINNED PIONEER'S FINGER DRIVES BOTH AXES AT ONCE.**
 *
 * ⛔ Contrast `secondFingerDrive`, which returns one axis and zero for the other because the
 * movement mode picks between them. ⚠ The difference is the owner's, stated in the same
 * sentence that asked for this rule, and it is recorded at the top of this file.
 *
 * ⭐ Per axis, the question is only *is this axis moving?* — `A11`'s hysteretic state, never a
 * speed invented here. ⛔ A second definition of *moving* would be free to disagree with the one
 * every other rule is judged by.
 */
export function pinnedSecondDrive(
  axes: { readonly x: MotionState; readonly y: MotionState },
  step: { readonly dx: number; readonly dy: number },
): { readonly rollDxPx: number; readonly depthDyPx: number } {
  return {
    rollDxPx: axes.x === "MOVING" ? step.dx : 0,
    depthDyPx: axes.y === "MOVING" ? step.dy : 0,
  };
}
