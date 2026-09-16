/**
 * ⭐⭐⭐ **FORK C — the owner's anchor and alignment rules, as pure decisions.**
 *
 * Design of record: [`Claude/10_INPUT_TOUCH/spec/FORK_C_ANCHOR_RULES.md`] — the rules are the
 * owner's, dictated 2026-09-16, and §7 there records which readings they confirmed.
 *
 * ⛔⛔ **EVERY RULE OF THIS FORK THAT IS A DECISION LIVES IN THIS ONE FILE, ON PURPOSE.** `D28`
 * is the precedent: the day one fork is chosen the others are **deleted**, and the last
 * deletion cost 44 vectors spread across four modules. ⭐ One file per fork means the
 * deletion is a `rm` and a barrel line, not an archaeology exercise.
 *
 * ⭐⭐ WHAT FORK C IS, IN ONE SENTENCE: *hold one object, **TAP** a face on another, and the
 * held object turns the minimum amount that makes its own face point the same way.* No
 * flick anywhere — which is the whole reason the owner left fork B:
 *
 * > *"difficult for user to implement, and releases the finger from the object it is
 * > tracking"*
 *
 * ⛔ A release-time trigger has both faults by construction: the release IS the trigger, so
 * the finger must leave, and the gesture must be performed to a threshold specification
 * rather than simply chosen. A tap by a **second** touchpoint has neither: the first finger
 * never lets go.
 *
 * ⛔ ENGINE-FREE, and every function here is a decision rather than an action — the caller
 * applies, exactly as `drag_rule.ts` and `mode_toggle.ts` are shaped.
 */
import type { Constraint } from "../core/constraint_stack";
import type { Vec3 } from "../core/vec";
import type { Behaviour } from "./mode_toggle";

/**
 * ⭐⭐ The alignment fork C pushes — *"FollowerFace normal aligns with PioneerFace normal"*.
 *
 * ⛔⛔ **PARALLEL, NOT ANTI-PARALLEL, AND THE OWNER CHOSE THAT KNOWING THE CONSEQUENCE.** A
 * mate is anti-parallel (`CLAUDE.md` rule 4, §4's `6quater`): two faces that meet flush point
 * *at* each other. Parallel is the CAD **align** operation — same facing, as in levelling two
 * top faces — so after this rule the held object presents its *opposite* side toward the
 * face that was tapped. ⚠ It is therefore an ORIENTING rule, not a joining one; how a mate is
 * ever asserted in fork C is open (`FORK_C_ANCHOR_RULES.md` §7.12).
 *
 * ⛔ The target is the Pioneer normal **in world, frozen at the tap** — §1.4's doctrine, and
 * the owner's own *"then the PioneerFace resets as null"* says the same thing: there is no
 * live relationship to the other object afterwards, so moving the other object does not drag
 * this alignment with it.
 *
 * @param followerLocalNormal the held object's tapped-face normal, in its LOCAL frame — the
 *   quantity `core/face_pick.ts` returns, never a world normal.
 * @param pioneerWorldNormal the other object's face normal, in WORLD, at the moment of the tap.
 */
export function faceAlignConstraint(
  followerLocalNormal: Vec3,
  pioneerWorldNormal: Vec3,
): Constraint {
  return {
    kind: "FACE_ALIGN",
    localNormal: followerLocalNormal,
    targetWorld: pioneerWorldNormal,
  };
}

/** What a tap means in fork C. ⭐ **Three** meanings, one gesture — see `tapMeaning`. */
export type TapMeaning = "ALIGN" | "UNALIGN" | "TOGGLE";

/**
 * Everything the tap's meaning depends on. ⛔ An object rather than five positional
 * arguments, because four of them are strings and `tapMeaning(mode, a, b, c, d)` is exactly
 * how a caller swaps two of them silently.
 */
export interface TapContext {
  /** The live movement mode. */
  readonly mode: Behaviour;
  /** The object the tap's PRESS hit, or `null` for empty space. */
  readonly tappedObject: string | null;
  /** The face that press resolved, or `null` if none did. */
  readonly tappedFace: string | null;
  /** The object another touchpoint is carrying, or `null` if none. */
  readonly heldObject: string | null;
  /**
   * ⭐⭐ The face whose tap CREATED the held object's current alignment — remembered, not
   * discarded. ⚠ The owner's first dictation said *"the PioneerFace resets as null"*; the
   * amendment of 2026-09-16 keeps it, because both the Pioneer's contour highlight and the
   * re-tap that breaks the alignment need to know which face it was.
   * ⛔ It is a VISUAL and GESTURAL record only. The constraint itself still stores a **frozen
   * world direction** (§1.4), so moving the Pioneer's object does not drag the alignment.
   */
  readonly pioneer: { readonly objectId: string; readonly faceId: string } | null;
}

/**
 * ⭐⭐⭐ **THE TAP'S TWO MEANINGS — and the collision that resolves itself.**
 *
 * ⛔⛔ `D27`/`D28` MADE **ANY SINGLE TAP ANYWHERE** FLIP THE MOVEMENT MODE, immediately, for
 * the session. Fork C's alignment trigger *is* a tap. So the two rules want the same gesture,
 * and one of them has to yield.
 *
 * ⭐⭐ THEY DO NOT ACTUALLY CONTRADICT, WHICH IS WHY BOTH CAN STAND: the alignment fires only
 * while the mode is `ROTATE`, and it **ends by switching to `TRANSLATE`** — which is exactly
 * the flip the toggle would have produced. A hand that taps in `ROTATE` gets `TRANSLATE`
 * either way; in fork C it also gets an alignment.
 *
 * ⛔ THE `ROTATE` CONDITION IS LOAD-BEARING, not decoration. In `TRANSLATE` the same tap must
 * still toggle — otherwise the only way back to `ROTATE` is gone, and the fork becomes a trap
 * after its first alignment.
 *
 * ⚠ A tap on the held object itself, or on empty space, is a plain toggle: the rule needs
 * *another* object's face, because a Pioneer and a Follower on one object is not a relation.
 *
 * ⭐⭐⭐ **AND A THIRD MEANING SINCE 2026-09-16 — `UNALIGN`, on the owner's amendment:**
 *
 * > *"in addition to the shake, the alignment can be toggled off by taping another time to
 * > the same PioneerFace."*
 *
 * ⭐⭐ THE SAME FACE IS THE WHOLE TEST, and it makes the gesture a **toggle** rather than a
 * second command to remember: tap a face to align to it, tap it again to let go. ⛔ A tap on
 * a DIFFERENT face is still `ALIGN`, which replaces — the cap of one — so nothing is
 * ambiguous and nothing accumulates.
 * ⚠ The owner's reason for wanting it is recorded because it will decide the shake's future:
 * *"We will later see if we keep the shake, as this is a complicated movement to execute by
 * the user; for the moment, we keep it."*
 */
export function tapMeaning(ctx: TapContext): TapMeaning {
  if (ctx.mode !== "ROTATE") return "TOGGLE";
  if (ctx.heldObject === null || ctx.tappedObject === null) return "TOGGLE";
  if (ctx.tappedObject === ctx.heldObject) return "TOGGLE";
  if (
    ctx.pioneer !== null &&
    ctx.tappedObject === ctx.pioneer.objectId &&
    ctx.tappedFace !== null &&
    ctx.tappedFace === ctx.pioneer.faceId
  ) {
    return "UNALIGN";
  }
  return "ALIGN";
}

/** What a flick must do to the object it was made on. ⭐ Both fields, always both. */
export interface ResetPlan {
  /** Restore the orientation captured at the press — ⚠ orientation only, never position. */
  readonly restoreOrientation: boolean;
  /** Also clear the alignment, because the pose being restored predates it. */
  readonly dropAlignment: boolean;
}

/**
 * ⭐⭐⭐ **THE ROTATION RESET, SCOPED THE WAY THE OWNER SCOPED IT.**
 *
 * > *"reinstate the rotation reset by flick which was previously implemented"* — and then,
 * > asked what it should do while an alignment holds: *"If the object was already aligned
 * > when the rotation was started, reset to the beginning of the rotation (therefore the
 * > alignment is conserved). If the alignment occurred during the rotation, reset the
 * > rotation (therefore this looses the alignment)."*
 *
 * ⭐⭐ **THAT IS A SHARPER RULE THAN THE THREE I OFFERED, AND IT IS WHY THIS FUNCTION EXISTS.**
 * I had framed the question as a property of the STATE (*is it aligned?*); the owner answered
 * with a property of the GESTURE (*when did the alignment happen?*). The state cannot tell the
 * two cases apart, and the gesture can — so the recogniser's snapshot is exactly the right
 * reference, and no new geometry is needed:
 *
 * * the alignment predates the press ⇒ the snapshot **satisfies** the constraint, so restoring
 *   it conserves the alignment for free. Nothing special happens; it simply works.
 * * the alignment was made during this gesture ⇒ the snapshot **predates** it, so restoring it
 *   would leave the object disagreeing with its own constraint. The constraint goes too.
 *
 * ⛔ Which is also why the flag is *"an alignment was pushed or replaced during this
 * gesture"* and not *"was it aligned at press"*: a tap that REPLACES an older alignment
 * mid-gesture leaves the snapshot satisfying a constraint that is no longer on the stack, and
 * that is the same case, not a third one.
 *
 * ⚠ `D36` deleted this rollback GLOBALLY at the owner's instruction because it fought fork B's
 * flick-to-align. Fork C has no flick alignment, so the conflict does not exist here — and it
 * returns **as a fork C rule**, not as a restored global behaviour. Fork A shipped without it.
 */
export function flickResetPlan(alignmentTouchedThisGesture: boolean): ResetPlan {
  return {
    restoreOrientation: true,
    dropAlignment: alignmentTouchedThisGesture,
  };
}
