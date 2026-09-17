/**
 * ⭐⭐⭐ **`A16` — WHEN THE TWO WHITE HIGHLIGHTS APPEAR, AND WHEN THEY DO NOT.**
 *
 * Design of record: [`Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`] §12 (`A16`).
 *
 * > *"two highlights possible only when the first object is aligned && translation by one
 * > touchpoint or two touchpoints and distance below threshold"* — the owner, 2026-09-17
 *
 * > *"modify the rule: the white contour does not necessitate the object to be aligned to
 * > toggle on and off. I want to remove the 'object is aligned' from the approach logic (we
 * > will see how to handle the alignment for the mate logic later on)"* — the owner, same day
 *
 * ⛔⛔ **SO THE RULE IS NOW TWO CONDITIONS, NOT THREE**: a drag that TRANSLATES, and a body
 * within the radius. ⚠ The alignment requirement was added and removed within the day, and the
 * sequence is worth keeping because neither end of it was arbitrary:
 *
 * 1. The first build hung the contours on **proximity alone**, in any movement mode.
 * 2. A hand rejected that: *"highlight both objects even if they are not aligned: this is
 *    NOK"*, then *"that's also the case with single object translation."*
 * 3. I read that as *require the alignment* — and it did fix the symptom.
 * 4. ⭐⭐ The owner then removed the alignment and KEPT the translation condition, which
 *    suggests the real objection in (2) was the contours appearing during a **rotation**, not
 *    their appearing unaligned. ⚠ Condition 2 did not exist when the complaint was made, so
 *    both readings fitted the evidence and I picked the stronger one without saying so.
 *
 * ⭐⭐ **WHAT WHITE MEANS NOW, IN ONE SENTENCE**: *these two bodies are close enough to
 * approach, and the drag in progress could move them.* ⛔ The alignment is no longer part of it
 * — it returns for the MATE, which is a different and irreversible act.
 * ⚠ `alignmentMatchesTarget` below is therefore **kept and NOT WIRED**, declared rather than
 * deleted; see its header.
 *
 * ⛔ ENGINE-FREE. Every function DECIDES; the caller draws.
 */
import type { ObjectId, World } from "../core/object_model";
import { faceWorld } from "../core/object_model";
import type { Constraint } from "../core/constraint_stack";
import type { Behaviour } from "./mode_toggle";
import { nearestCapture } from "../core/proximity";
import { dot, normalize } from "../core/vec";

/** ⚠ Both are `D46` §1 placeholders, flagged for fine-tuning by the owner. */
export interface HighlightNumbers {
  /**
   * `SnapIsPossibleRadius` in **METRES** — `4L` = 320 mm on this scene (the owner,
   * 2026-09-17: *"set capture radius at 4L"*). ⚠ An absolute distance, not a multiple of each
   * object's own size; `captureRadiusM` records what that gave up.
   */
  readonly snapRadiusM: number;
  /**
   * How near parallel the alignment axis must be to a target face normal, in radians.
   * ⚠ NO LONGER READ BY `highlightedPair` — kept because `alignmentMatchesTarget` takes it and
   * the mate will. ⛔ See that function's header for why it is declared, not deleted.
   */
  readonly alignMatchRad: number;
}

/** The pair to outline. ⛔ `null` everywhere else — there is no partial state. */
export interface HighlightPair {
  /** The *"first object"* — the one carrying the alignment. */
  readonly subject: ObjectId;
  /** The `TargetObject` it is aligned to and near. */
  readonly target: ObjectId;
}

/**
 * ⭐⭐⭐ **THE VERDICT, WITH ITS REASONS** — and the reasons are not a luxury.
 *
 * ⛔⛔ **THREE CONDITIONS AND THEY ARE AN `AND`, SO A MISSING HIGHLIGHT LOOKS IDENTICAL
 * WHICHEVER ONE IS FALSE.** ⚠ *"I forgot to align"*, *"I am in rotation mode"* and *"they are
 * too far apart"* are one symptom with three causes, and this project has spent whole device
 * passes on exactly that ambiguity.
 *
 * ⭐⭐ THEY ARE RETURNED RATHER THAN RECOMPUTED BY THE READOUT, which is the part that
 * matters: a HUD that derived its own answer would be a **second implementation**, free to
 * disagree with the product while both show green. ⛔ One computation, one truth, printed.
 */
export interface HighlightVerdict {
  /** The pair to outline, or `null`. ⭐ This is what is DRAWN. */
  readonly pair: HighlightPair | null;
  /** The TRANSLATION condition. */
  readonly translating: boolean;
  /** The RANGE condition — another body is within the radius of at least one held body. */
  readonly inRange: boolean;
}

/**
 * ⭐⭐⭐ **`A16`'s CONDITION 2 — *"translation by one touchpoint or two touchpoints"*.**
 *
 * ⛔⛔ **THIS IS THE ONE PLACE THAT RULE LIVES, AND `scene.ts` NOW READS IT TOO.** The render
 * file already decided the same thing for its own purposes
 * (`mode = objects().length === 1 ? behaviour : "TRANSLATE"`), and a second copy here would be
 * two implementations of one rule — free to disagree, with nothing to catch it. ⭐ `METHOD`'s
 * shape: *one constant lives in exactly one place*, and so does one rule.
 *
 * ⭐ Why two held objects translate in EITHER mode: they are two holders, and the mode is
 * overridden because a pair being moved together is a translation by construction. ⚠ Two
 * fingers on the SAME object are a holder plus a `SECOND` (roll or depth), not a pair — the
 * caller must pass DISTINCT objects, which is why this takes a count of objects and not of
 * touchpoints.
 */
export function translatesOnDrag(heldObjectCount: number, mode: Behaviour): boolean {
  if (heldObjectCount >= 2) return true;
  return mode === "TRANSLATE";
}

/**
 * ⭐⭐ **NOT WIRED — RESERVED FOR THE MATE, AND DECLARED HERE RATHER THAN DELETED.**
 *
 * ⛔⛔ Nothing calls this today. It was `A16`'s condition 1 until the owner removed the
 * alignment from the approach: *"we will see how to handle the alignment for the mate logic
 * later on."* ⭐ So the debt is made EXPLICIT, in the same spirit as `config_debt.test.ts`
 * declaring an unread tunable, rather than the function quietly sitting here looking live.
 *
 * ⚠ WHY IT IS KEPT AT ALL, since this project's discipline is *deleted, not disabled*: that
 * rule exists for **forks, flags and detectors that own a verdict** — defect 40 was a retired
 * detector still vetoing a live gesture. ⛔ A pure predicate that nothing calls cannot change
 * behaviour, and its vectors encode two lessons that were expensive to learn: that this test
 * must be GEOMETRY and not identity, and that `|dot|` cannot be pinned with a cube fixture.
 * ⚠ If the mate turns out not to need it, delete it **with** its vectors.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *
 * Is this object's alignment pointed along one of `target`'s face normals?
 *
 * ⛔⛔ **IT IS GEOMETRY, NOT IDENTITY, AND THAT IS DELIBERATE.** The obvious implementation is
 * *"is the target the same object the alignment was tapped on?"* — and it is wrong, because
 * `D46` §2 says the target is *"any other object, **not necessarily the object with
 * PioneerFace**"*. ⭐ A hand may align a part against one block and then carry it to a different
 * block that happens to share the orientation, which is ordinary in assembly and which an
 * identity test would silently refuse.
 *
 * ⚠ `|dot|`, so parallel and anti-parallel both match: which sign a frozen alignment vector
 * carries is an accident of which face was tapped. ⛔ On a **cube** that makes no difference —
 * every face has an opposite — so the vector that pins it uses a body with no opposite face.
 */
export function alignmentMatchesTarget(
  world: World,
  constraints: readonly Constraint[],
  target: ObjectId,
  alignMatchRad: number,
): boolean {
  const o = world.objects.get(target);
  if (!o) return false;
  const threshold = Math.cos(alignMatchRad);
  for (const c of constraints) {
    // ⛔ Only an ALIGNMENT counts. A `MATE` is a seat, not an orientation to dock along, and
    // its `targetWorld` is a real direction that a looser test would happily accept.
    if (c.kind !== "FACE_ALIGN" && c.kind !== "WORLD_AXIS_ALIGN") continue;
    const axis = normalize(c.targetWorld);
    if (!axis) continue;
    for (const f of o.faces) {
      const w = faceWorld(world, target, f.id);
      if (!w) continue;
      const n = normalize(w.normal);
      if (!n) continue;
      if (Math.abs(dot(axis, n)) >= threshold) return true;
    }
  }
  return false;
}

/**
 * ⭐⭐⭐ **THE WHOLE OF `A16`, AS ONE ANSWER** — the pair to outline, or `null`.
 *
 * ⛔⛔ **ALL THREE CONDITIONS, IN ONE FUNCTION, ON PURPOSE.** They are an AND, and an AND is a
 * composition — `METHOD`: *a composition is a thing to MEASURE, not an emergent property*.
 * ⚠ Assembling it from three separate green tests inside a 3000-line render file is exactly how
 * `A7`'s gravity frame ended up with four correct parts and an untested whole, which then cost a
 * false defect report.
 *
 * ⭐ Order of the checks is cheapest-first, but the ANSWER does not depend on the order — each
 * is necessary.
 *
 * @param heldIds the DISTINCT held objects, in press order.
 * @param translating `translatesOnDrag(...)` — condition 2, decided by the caller because only
 *   it knows the session mode.
 * @param current last frame's target, for `nearestCapture`'s tie rule. The ONLY memory.
 */
export function highlightedPair(
  world: World,
  heldIds: readonly ObjectId[],
  translating: boolean,
  n: HighlightNumbers,
  current: ObjectId | null,
): HighlightVerdict {
  let inRange = false;
  let pair: HighlightPair | null = null;
  for (const subject of heldIds) {
    // ⛔ THE RANGE CONDITION — distance below the threshold, inside `nearestCapture`.
    const target = nearestCapture(world, subject, n.snapRadiusM, current);
    if (target === null) continue;
    inRange = true;
    // ⛔ THE TRANSLATION CONDITION, checked second so the readout can still report the range
    // while it is false. ⚠ The ORDER does not change the answer — both are necessary — but it
    // changes how much the HUD can say about a rotation-mode drag, which is the state a hand
    // hits most often.
    if (translating) {
      pair = { subject, target };
      break;
    }
  }
  return { pair, translating, inRange };
}
