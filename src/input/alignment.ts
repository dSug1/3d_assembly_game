/**
 * ⭐⭐⭐ **THE ALIGNMENT RULES — the owner's, as pure decisions.**
 *
 * Design of record: [`Claude/10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`] — dictated
 * 2026-09-16, with §7 recording which readings the owner confirmed and §10 what a device pass
 * should ask.
 *
 * ⭐⭐ **IT WAS `fork_c.ts` UNTIL 2026-09-17**, when forks A and B were deleted and this became
 * the input model rather than one of three. ⭐ Keeping every decision of the set in ONE file
 * is what made that deletion a `rm` plus a barrel line — `D28`'s previous fork removal cost 44
 * vectors spread over four modules — and the file keeps that shape now that it has won.
 *
 * ⭐⭐ WHAT IT IS, IN ONE SENTENCE: *hold one object, **TAP** a face on another, and the
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
import { qconj, qmul, type Quat, type Vec3 } from "../core/vec";
import type { Behaviour } from "./mode_toggle";

/**
 * ⭐⭐ The alignment a tap pushes — *"FollowerFace normal aligns with PioneerFace normal"*.
 *
 * ⛔⛔ **PARALLEL, NOT ANTI-PARALLEL, AND THE OWNER CHOSE THAT KNOWING THE CONSEQUENCE.** A
 * mate is anti-parallel (`CLAUDE.md` rule 4, §4's `6quater`): two faces that meet flush point
 * *at* each other. Parallel is the CAD **align** operation — same facing, as in levelling two
 * top faces — so after this rule the held object presents its *opposite* side toward the
 * face that was tapped. ⚠ It is therefore an ORIENTING rule, not a joining one; how a mate is
 * ever asserted at all is open (`ALIGNMENT_RULES.md` §7.12).
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

/**
 * What a tap means. ⭐ **Four** actions now, and each alignment one carries the MODE it asks
 * for — see `tapMeaning`.
 */
export type TapAction =
  /** Align these two faces, in `mode`. ⚠ Replaces any existing alignment (the cap of one). */
  | "ALIGN"
  /** Keep the alignment, change only its MODE — the other gesture on the same face. */
  | "SWITCH"
  /** Let it go: the same gesture again on the same face. */
  | "UNALIGN"
  /** `D28`'s movement-mode toggle, which every other tap still means. */
  | "TOGGLE";

/** What a tap decided. ⛔ `mode` is `null` for `UNALIGN` and `TOGGLE`, which need none. */
export interface TapMeaning {
  readonly action: TapAction;
  readonly mode: AlignMode | null;
}

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
  /** ⭐ Which gesture this was. `D28`'s toggle is unchanged for every tap that is not an
   * alignment; what a DOUBLE tap means on another object's face is new (2026-09-17). */
  readonly kind: "TAP" | "DOUBLE_TAP";
  /** The live alignment's mode, or `null` when the held object is not aligned. */
  readonly alignMode: AlignMode | null;
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
 * either way; here it also gets an alignment.
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
  const toggle: TapMeaning = { action: "TOGGLE", mode: null };
  if (ctx.mode !== "ROTATE") return toggle;
  if (ctx.heldObject === null || ctx.tappedObject === null) return toggle;
  if (ctx.tappedObject === ctx.heldObject) return toggle;

  const asked = modeForTap(ctx.kind);
  const sameFace =
    ctx.pioneer !== null &&
    ctx.tappedObject === ctx.pioneer.objectId &&
    ctx.tappedFace !== null &&
    ctx.tappedFace === ctx.pioneer.faceId;

  if (!sameFace) return { action: "ALIGN", mode: asked };
  // ⭐⭐ THE SAME FACE AGAIN, AND THE GESTURE DECIDES WHICH OF TWO THINGS IT MEANS:
  // ⛔ the SAME gesture that made this alignment lets it go — `D39`'s toggle-off, preserved;
  // ⭐ the OTHER gesture switches the mode, which is the owner's *"toggle to behaviors
  // accordingly"*. ⚠ Switching keeps the constraint and moves nothing: only what the
  // alignment MEANS changes, and the colours say so.
  return ctx.alignMode === asked
    ? { action: "UNALIGN", mode: null }
    : { action: "SWITCH", mode: asked };
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
 * flick-to-align. ⛔ This model has **no flick alignment at all**, so that conflict cannot
 * arise — which is why the reset came back with it (`D37`) and why the flick now means one
 * thing only. Forks A and B are deleted (`D40`); what is left is not a fork.
 */
export function flickResetPlan(alignmentTouchedThisGesture: boolean): ResetPlan {
  return {
    restoreOrientation: true,
    dropAlignment: alignmentTouchedThisGesture,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ WHEN THE **PIONEER'S** OBJECT IS TURNED WHILE THE FOLLOWER IS ALIGNED
// ══════════════════════════════════════════════════════════════════════════════
//
// ⛔⛔ THE CASE HAD NO RULE AT ALL UNTIL 2026-09-17, AND ITS ABSENCE WAS NOT VISIBLE. An
// alignment stores a **frozen world direction** (§1.4) — deliberately, so a later camera orbit
// cannot redefine it. ⚠ The price is that turning the object the direction was READ FROM
// leaves the constraint pointing where that face *used to* look: the Follower still obeys a
// target nothing on the glass corresponds to any more, and neither highlight says so.
//
// ⭐ The owner's two readings, behind one flag, because they are opposite answers to *what
// does an alignment MEAN* — a snapshot of a direction, or a relationship between two faces:

/**
 * ⭐⭐⭐ **WHAT AN ALIGNMENT *IS* — and since 2026-09-17 the GESTURE says which, not a flag.**
 *
 * ⛔⛔ THESE WERE `D41`'s FORKS C1 AND C2, chosen by `?pioneerTurnRule`. The owner merged them
 * the same day: *"one single tap on the second object PioneerFace: the logic is as fork C1 …
 * one double tap … the logic is as fork C2"*. ⭐⭐ So the reading is no longer a setting a
 * session picks — it is **a property of each alignment**, chosen when it is made and readable
 * on the glass, because the two modes are drawn in different colours.
 */
export type AlignMode =
  /**
   * ⭐ **SNAPSHOT — made by a SINGLE TAP.** The alignment is a snapshot of a direction:
   * turning the Pioneer invalidates it, so it is released, the Follower is **not** rotated,
   * and both highlights go. ⚠ Drawn in **two colours** — the two faces are related only by
   * the moment the tap happened.
   */
  | "SNAPSHOT"
  /**
   * ⭐ **FOLLOW — made by a DOUBLE TAP.** The alignment is a relationship: turning the
   * Pioneer turns the Follower by the same rotation, the target is re-read from the Pioneer's
   * face every frame, and the highlights stay. ⚠ Drawn in **one colour**, because the two
   * faces are now one thing — the owner's own instruction, and the only way a hand can tell
   * which mode an alignment is in.
   */
  | "FOLLOW";

/** ⭐ Which mode a tap of this kind asks for. ⛔ One place, so the mapping cannot drift. */
export function modeForTap(kind: "TAP" | "DOUBLE_TAP"): AlignMode {
  return kind === "DOUBLE_TAP" ? "FOLLOW" : "SNAPSHOT";
}

/** What the Pioneer's turn costs the Follower. ⭐ A decision; the caller acts. */
export interface PioneerTurn {
  readonly kind: "NONE" | "RELEASE" | "FOLLOW";
  /**
   * `FOLLOW` only: the **world** rotation to apply to the Follower, and the one to compose
   * onto its orientation — `qmul(delta, follower)`, never the other order.
   */
  readonly delta: Quat | null;
}

/**
 * ⚠ Below this, a difference is float noise rather than a hand: ~0.006°, which is four orders
 * of magnitude under the smallest deliberate twist and well above the error of composing
 * quaternions. ⛔ NOT a tunable — it guards arithmetic, not feel, and a slider on it would
 * invite someone to tune away a rule instead of a threshold.
 */
export const PIONEER_TURN_EPSILON_RAD = 1e-4;

/**
 * Did the Pioneer's object turn, and what follows from it?
 *
 * ⭐⭐ THE DELTA IS A **WORLD** ROTATION — `now ∘ before⁻¹` — which is what makes `FOLLOW`
 * exact rather than approximate: applying the same world rotation to both objects preserves
 * the angle between any two of their directions, so the Follower's aligned normal stays
 * parallel to the Pioneer's face normal without solving anything.
 * ⛔ The opposite composition (`before⁻¹ ∘ now`) is the rotation expressed in the OBJECT's
 * own frame, and using it here would turn the Follower about the Pioneer's axes — a sign
 * error with no symptom at the identity, which is `METHOD`'s favourite shape.
 *
 * @param before the Pioneer's orientation when it was last observed.
 * @param now its orientation this frame.
 */
export function pioneerTurned(
  before: Quat,
  now: Quat,
  mode: AlignMode,
): PioneerTurn {
  const delta = qmul(now, qconj(before));
  // ⭐ The turn angle of a unit quaternion is `2·acos|w|`; the absolute value folds the
  // double cover, so `q` and `−q` — the same rotation — cannot read as 360° apart.
  const angle = 2 * Math.acos(Math.min(1, Math.abs(delta[0])));
  if (angle < PIONEER_TURN_EPSILON_RAD) return { kind: "NONE", delta: null };
  return mode === "SNAPSHOT" ? { kind: "RELEASE", delta: null } : { kind: "FOLLOW", delta };
}

/**
 * ⭐ Re-read an alignment's target from where the Pioneer's face points **now** (`FOLLOW`).
 *
 * ⚠ It keeps §1.4's doctrine rather than breaking it: the constraint still holds a WORLD
 * direction, and a camera orbit still cannot redefine it. What changes is that the direction
 * is refreshed from the face it was taken from — which is the whole difference between the
 * owner's two readings, expressed as one field.
 */
export function retargetAlignment(c: Constraint, targetWorld: Vec3): Constraint {
  return { ...c, targetWorld };
}
