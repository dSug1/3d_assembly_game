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
 * What a tap means. ⭐ **Three** actions since `D67`, and the alignment one carries the MODE it
 * asks for — see `tapMeaning`.
 *
 * ⛔⛔ **`SWITCH` IS DELETED.** It changed an alignment's MODE in place, because the second
 * touch's tap count used to ask for one. ⚠ The owner moved that decision to the Pioneer's own
 * press (*"the first touch shall be double tap without final release"*), so no touch on a
 * Follower asks for a mode any more and nothing can return it. ⭐ Deleted rather than left in
 * the union: an action nothing produces is a branch every reader must consider and no hand can
 * reach — `D28`'s and `D40`'s rule about dormant forks, one type-level down.
 */
export type TapAction =
  /** Align these two faces, in `mode`. ⚠ Replaces any existing alignment (the cap of one). */
  | "ALIGN"
  /** Let it go: the same gesture again on the same FollowerFace. */
  | "UNALIGN"
  /** `D28`'s movement-mode toggle, which every other tap still means. */
  | "TOGGLE"
  /**
   * ⭐ **DO NOTHING AT ALL** — `D55`'s press verdict when the configuration is not a fresh
   * relation. ⛔ Distinct from `TOGGLE`: a press must not flip the movement mode, which is a
   * RELEASE's job, so the two cannot share a name.
   */
  | "NOTHING";

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
  /** The body the finger tapped — the **FOLLOWER** since `D67`; its face is the FollowerFace. */
  readonly tappedObject: string | null;
  readonly tappedFace: string | null;
  /** The body the OTHER finger is carrying — the **PIONEER**. */
  readonly heldObject: string | null;
  /** The tapped body's current Pioneer, if it has one. */
  readonly pioneerOfTapped: string | null;
  /** The tapped body's current FollowerFace, derived from its constraint (`alignedFaceOf`). */
  readonly alignedFaceOfTapped: string | null;
  /**
   * ⭐⭐⭐ **DID THE PIONEER'S OWN PRESS COMPLETE A DOUBLE TAP?** — the owner, 2026-09-21:
   * *"to reach the orange, the first touch shall be double tap without final release [on] the
   * pioneer object and the second touch shall hit follower object's FollowerFace while first
   * touch is still pressed on PioneerFace."*
   * ⛔ So the MODE is a property of the PIONEER's grip, not of this tap. ⚠ That is also what
   * lets several Followers be added in one hold and all come out the same colour.
   */
  readonly pioneerPressWasDoubleTap: boolean;
}

/**
 * ⭐⭐⭐ **WHAT A TAP ON A SECOND BODY MEANS, WITH THE ROLES INVERTED (`D67`).**
 *
 * > *"Currently, the follower face selection comes with the first touch and the pioneer face
 * > selection comes with the second touch. Can i invert? First the Pioneer & PioneerFace, second
 * > the Follower & the FollowerFace."* — the owner, 2026-09-21
 *
 * ⛔⛔ **THE HELD BODY IS THE PIONEER AND THE TAPPED ONE IS THE FOLLOWER**, the mirror of every
 * version before it. ⭐ The release still owns the way OUT: a tap on the **FollowerFace of a
 * body already following this Pioneer** breaks that alignment — `D39`'s re-tap, moved onto the
 * face the second touch now selects.
 *
 * ⚠ Everything else is unchanged: nothing held, nothing tapped, or a tap on the held body
 * itself is `TOGGLE`, which is `D28`'s mode flip and `D66`'s only remaining trigger.
 */
export function tapMeaning(ctx: TapContext): TapMeaning {
  const toggle: TapMeaning = { action: "TOGGLE", mode: null };
  if (ctx.heldObject === null || ctx.tappedObject === null) return toggle;
  if (ctx.tappedObject === ctx.heldObject) return toggle;
  // ⛔ THE UNDO, ON THE FACE THE SECOND TOUCH NOW SELECTS: this body already follows this
  // Pioneer, on this very face, so the same gesture again lets it go (`D39`).
  const sameRelationSameFace =
    ctx.pioneerOfTapped === ctx.heldObject &&
    ctx.tappedFace !== null &&
    ctx.alignedFaceOfTapped === ctx.tappedFace;
  if (sameRelationSameFace) return { action: "UNALIGN", mode: null };
  // ⭐ Any other face, or any other body, is a fresh alignment — and `A23`'s re-point falls out
  // of it: a different face of a body already aligned simply re-aligns on that face.
  return { action: "ALIGN", mode: alignModeFor(ctx.pioneerPressWasDoubleTap) };
}

/**
 * Everything the PRESS's meaning depends on. ⚠ Deliberately NOT `TapContext`: a press has no
 * tap kind and no `alignMode` to compare against, and reusing that shape would have invited a
 * caller to pass a `kind` the press cannot know.
 */
export interface PressContext {
  /** The body this press landed on — the **FOLLOWER** since `D67`. */
  readonly pressedObject: string | null;
  /** The face under it — the **FollowerFace**. */
  readonly pressedFace: string | null;
  /** The bodies already held. ⛔ Exactly one, and it is the **PIONEER**. */
  readonly heldObjects: readonly string[];
  /**
   * The HELD body's own Pioneer, if it has one — the cycle guard in the direction the inversion
   * puts it: if the Pioneer already follows the body being pressed, this would close a loop.
   */
  readonly pioneerOfHeld: string | null;
  /** The PRESSED body's current Pioneer, if any. */
  readonly pioneerOfPressed: string | null;
  /** The PRESSED body's current FollowerFace (`alignedFaceOf`), if any. */
  readonly alignedFaceOfPressed: string | null;
  /** ⭐ The mode comes from the PIONEER's press — see `TapContext`. */
  readonly pioneerPressWasDoubleTap: boolean;
}

/**
 * ⭐⭐⭐ **`D67` — THE ROLES ARE INVERTED: FIRST TOUCH THE PIONEER, SECOND THE FOLLOWER.**
 *
 * > *"First the Pioneer & PioneerFace, second the Follower & the FollowerFace … the following
 * > sequence becomes possible: first touch pressed on PioneerFace and remains pressed, second
 * > touch is pressed on first Follower object's FollowerFace and then released, second touch is
 * > then pressed on second Follower object's FollowerFace, etc. which enables to select several
 * > follower objects to the pioneer object in one go."* — the owner, 2026-09-21
 *
 * ⭐⭐ **THE MULTI-SELECT NEEDS NO MECHANISM — IT FALLS OUT.** `AlignmentLinks` has always been a
 * two-way index with a **set** of followers per Pioneer, and the cap of one alignment is per
 * FOLLOWER, never per Pioneer. ⛔ The only thing that had to become true is that the HELD grip
 * keeps its `pressFace` while fingers come and go — `scene.ts` now clears the **pressing**
 * grip's face instead of the held one, which is the same rule it always had (*a transient grip
 * must not leave a stale face behind*) pointed at the finger that is actually transient.
 *
 * ⚠⚠ **AND THE FROZEN GUARD CHANGES SIDES, WHICH A HAND MEETS IMMEDIATELY.** The base plate can
 * still be a Pioneer — by being touched **first** — and can never be a Follower. So *align a
 * part to the plate* becomes *hold the plate, then press the part*, the reverse of the habit.
 * ⛔ Stated here because it is the commonest gesture in this scene, not a corner case.
 *
 * ⚠ The refusals are the same four, each read from the other end: no face, not exactly one held
 * body, the same body twice, and the cycle.
 */
export function pressMeaning(ctx: PressContext): TapMeaning {
  const nothing: TapMeaning = { action: "NOTHING", mode: null };
  if (ctx.pressedObject === null || ctx.pressedFace === null) return nothing;
  // ⛔ Exactly one held body, or *which Pioneer?* has no answer.
  if (ctx.heldObjects.length !== 1) return nothing;
  const pioneer = ctx.heldObjects[0]!;
  // ⚠ A press on the body that is already held is `SECOND`'s configuration, not this one — and
  // a Pioneer and a Follower on one body is not a relation.
  if (pioneer === ctx.pressedObject) return nothing;
  // ⛔⛔ **THE ONE CONFIGURATION A PRESS DOES NOT ALIGN**: this body already follows this
  // Pioneer, on this very face. ⭐ The press does nothing and the RELEASE undoes it (`D39`), so
  // a hand that presses and holds has not silently lost the alignment it is looking at.
  if (ctx.pioneerOfPressed === pioneer && ctx.alignedFaceOfPressed === ctx.pressedFace) {
    return nothing;
  }
  // ⛔ THE CYCLE, in the direction the inversion puts it: the Pioneer already follows the body
  // being pressed, so aligning it back would close a loop. `scene.ts` handles deeper ones.
  if (ctx.pioneerOfHeld === ctx.pressedObject) return nothing;
  return { action: "ALIGN", mode: alignModeFor(ctx.pioneerPressWasDoubleTap) };
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

/**
 * ⭐ Which mode a gesture asks for. ⛔ ONE place, so the mapping cannot drift between the press
 * path and the release path — `CONSTRAINTS` §4.
 *
 * ⚠⚠ **`D67` MOVED WHICH FINGER ANSWERS IT**, and nothing else. It used to take the SECOND
 * touch's tap kind; it now takes the **Pioneer's own press** — *"the first touch shall be double
 * tap without final release [on] the pioneer object"* — so the parameter is a boolean about a
 * grip rather than a verdict about this touch. ⭐ The mapping itself is untouched: a pair means
 * a relationship, a single means a snapshot.
 */
export function alignModeFor(pioneerPressWasDoubleTap: boolean): AlignMode {
  return pioneerPressWasDoubleTap ? "FOLLOW" : "SNAPSHOT";
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
