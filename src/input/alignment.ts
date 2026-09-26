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
import {
  IDENTITY,
  cross,
  dot,
  normalize,
  qFromAxisAngle,
  qRotate,
  qconj,
  qmul,
  type Quat,
  type Vec3,
} from "../core/vec";

/**
 * ⭐⭐⭐ **THE DIRECTION AN ALIGNED FOLLOWER FACE MUST END UP POINTING** — and the ONE place
 * that knows the sign.
 *
 * > *"when the user aligns a follower object, the direction of the FollowerFace shall be
 * > anti-normal to the direction of the PioneerFace"* — the owner, 2026-09-23
 *
 * ⛔⛔⛔ **THIS REVERSES `D37`, AND THE REVERSED TEXT IS KEPT BECAUSE IT IS THE MORE USEFUL
 * ENTRY.** The rule was **PARALLEL** — the CAD *align* sense, *"chosen over a mate"* — and its
 * consequence was written down here for a week: *the held object presents its opposite side
 * toward the face that was tapped*, which makes it an ORIENTING rule that can never join
 * anything. ⭐ Anti-parallel is the MATE sense: two faces that meet flush point **at** each
 * other, which is `CONSTRAINTS` §7 and the geometry `mate_connector.ts` has held since day one.
 *
 * ⭐⭐ **SO THE SIGN LIVES HERE AND NOWHERE ELSE**, which is §7's own instruction — *a
 * connector stores the TRUE OUTWARD NORMAL, and one place knows that sign*. ⛔ Both entry
 * points below take **the Pioneer's normal** and negate it themselves; neither can be handed a
 * ready-made target. ⚠ That is deliberate: a caller that could pass a direction could pass the
 * un-negated one, and a mate's sign error *"cost a live session in the predecessor"*.
 *
 * ⚠ **What it does NOT do**: it does not make a mate. Nothing is seated, no position is held,
 * and `3D2`'s seat is still what a joint needs — this only changes which way the body faces.
 */
export function alignTargetFor(pioneerWorldNormal: Vec3): Vec3 {
  return [
    -pioneerWorldNormal[0],
    -pioneerWorldNormal[1],
    -pioneerWorldNormal[2],
  ];
}

/**
 * ⭐⭐ The alignment a tap pushes — the Follower's face turned **anti-normal** to the tapped
 * one (the owner, 2026-09-23; it was parallel until then — see `alignTargetFor`).
 *
 * ⛔ The target is the Pioneer normal **in world, frozen at the tap** — §1.4's doctrine, and
 * the owner's own *"then the PioneerFace resets as null"* says the same thing: there is no
 * live relationship to the other object afterwards, so moving the other object does not drag
 * this alignment with it.
 *
 * @param followerLocalNormal the held object's tapped-face normal, in its LOCAL frame — the
 *   quantity `core/face_pick.ts` returns, never a world normal.
 * @param pioneerWorldNormal the other object's face normal, in WORLD, at the moment of the tap.
 *   ⛔ **THE FACE'S OWN NORMAL, NOT A TARGET** — the negation is this module's, once.
 */
export function faceAlignConstraint(
  followerLocalNormal: Vec3,
  pioneerWorldNormal: Vec3,
): Constraint {
  return {
    kind: "FACE_ALIGN",
    localNormal: followerLocalNormal,
    targetWorld: alignTargetFor(pioneerWorldNormal),
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
  /**
   * ⛔⛔⛔ **`D90` — THE TAPPED BODY IS THE *PIONEER* NOW, AND ITS FACE IS THE PIONEERFACE.**
   * ⚠ Every field below is read off the other end than it was: this interface is `D87` arriving
   * at the RELEASE path, four days and four defects after it arrived at the press.
   */
  readonly tappedObject: string | null;
  readonly tappedFace: string | null;
  /** The body the OTHER finger is carrying — the **FOLLOWER** since `D87`. */
  readonly heldObject: string | null;
  /** The held body's current Pioneer, if it has one. */
  readonly pioneerOfHeld: string | null;
  /** The PioneerFace the held body follows — a face of the TAPPED body. */
  readonly pioneerFaceOfHeld: string | null;
  /** The held body's current FollowerFace, derived from its constraint (`alignedFaceOf`). */
  readonly alignedFaceOfHeld: string | null;
  /** The held body's HitFace — the FollowerFace a press would use. */
  readonly heldPressFace: string | null;
}



/**
 * ⭐⭐⭐ **WHAT THE SECOND TOUCH'S RELEASE MEANS — `D90`, AND IT NO LONGER ALIGNS ANYTHING.**
 *
 * ⛔⛔⛔ **THIS FUNCTION WAS THE LAST RULE STILL SPEAKING `D67`.** It read the tapped body as the
 * Follower and the held one as the Pioneer, and it kept an `ALIGN` of its own — so every press
 * that DECLINED handed the gesture to a rule that meant the opposite. ⚠ The owner found it by
 * gesture, 2026-09-25: *"I first press the pioneer and second press the follower … the pioneer and
 * the follower remain unchanged and the follower updates the followerface."* That update was this
 * function, quietly doing `D67`'s job on the way up.
 *
 * ⭐⭐ **SO THE ALIGN IS DELETED, NOT INVERTED.** Since `D87` the PRESS aligns, on the way down,
 * and `pressActed` spends the release (`D55`). The only press that declines and still wants a
 * consequence is the one that would change **nothing** — and that one wants `D39`'s undo. ⛔ A
 * second alignment path was never a feature; it was `D67`'s trigger left running.
 *
 * ⭐ Everything else is `D28`'s mode flip, which is what a tap has meant since the forks died.
 */
export function tapMeaning(ctx: TapContext): TapMeaning {
  const toggle: TapMeaning = { action: "TOGGLE", mode: null };
  if (ctx.heldObject === null || ctx.tappedObject === null) return toggle;
  if (ctx.tappedObject === ctx.heldObject) return toggle;
  // ⛔⛔ **THE UNDO, AND ITS THREE TERMS ARE `pressMeaning`'s EXACTLY** — deliberately, because it
  // exists to complete that function's one deliberate no-op. ⭐ The press saw an alignment it
  // would not change and did nothing; the release lets it go (`D39`), so pressing and HOLDING
  // never silently destroys the alignment a hand is looking at.
  // ⚠ Two of the three name faces of DIFFERENT bodies (defect 63), which is why the comparison is
  // written out rather than shortened.
  if (
    ctx.pioneerOfHeld === ctx.tappedObject &&
    ctx.pioneerFaceOfHeld === ctx.tappedFace &&
    ctx.alignedFaceOfHeld === ctx.heldPressFace
  ) {
    // ⭐⭐⭐ **THE BODY RELEASED IS THE HELD ONE.** It is the Follower under `D87`, and it owns the
    // alignment. ⛔ Releasing the TAPPED body — which this branch did until `D90` — broke the
    // PIONEER's own relation to some third body, one the hand never touched.
    return { action: "UNALIGN", mode: null };
  }
  return toggle;
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
  /** The PRESSED body's current FollowerFace (`alignedFaceOf`), if any. */
  /**
   * ⭐ The HELD body's current FollowerFace — it is the FOLLOWER now, so *already aligned to this
   * very face* is a question about IT, not about the body under the finger.
   */
  readonly alignedFaceOfHeld: string | null;
  /**
   * ⭐⭐ **THE PIONEERFACE THE HELD BODY CURRENTLY FOLLOWS** — a face of the PRESSED body, so it is
   * the only thing `pressedFace` may be compared against. ⛔ `alignedFaceOfHeld` is a face of the
   * HELD body and lives in a different namespace; comparing the two was `D87`'s first defect.
   */
  readonly pioneerFaceOfHeld: string | null;
  /**
   * ⭐ The HELD body's HITFACE — the FollowerFace this press would use. ⚠ If it differs from
   * `alignedFaceOfHeld`, the press RE-POINTS the alignment onto it rather than doing nothing.
   */
  readonly heldPressFace: string | null;
  /** ⭐ The mode comes from the PIONEER's press — see `TapContext`. */
  /**
   * ⭐⭐ **THIS PRESS'S OWN double tap.** ⛔ `D67` read it off the HELD grip because the held body
   * was the Pioneer; with `D87`'s inversion the Pioneer is the body being pressed, so the mode
   * comes from the touch that selects it.
   */
  readonly pressWasDoubleTap: boolean;
}

/**
 * ⛔⛔⛔ **`D87` REVERSES `D67`: FIRST TOUCH THE **FOLLOWER**, SECOND THE **PIONEER**.**
 *
 * > *"currently, the pioneer is pressed first and the follower is pressed second. Invert that
 * > order. That will allow to align a hitface with a pioneer face."* — the owner, 2026-09-25
 *
 * ⭐⭐ **IT MAKES THE HITFACE GESTURE AND THIS ONE THE SAME RULE.** The fuchsia offer is defined
 * on the HELD body's HitFace and lights faces on other bodies; under `D67`'s ordering the press
 * that accepted an offer had to mean the opposite of the press that made it. ⚠ One ordering, one
 * meaning: *hold the part, press what you want it aligned to.*
 *
 * ⚠⚠ **WHAT IT COSTS, AND `D67` WAS CHOSEN FOR EXACTLY THIS**: several Followers could be aligned
 * to one Pioneer **in one hold** — press one Follower's face, release, press the next. Inverted,
 * each alignment needs its own hold, because the single held body is now the Follower and a
 * Follower is capped at one alignment. ⛔ The pairs are still reachable, just not in one gesture.
 *
 * ⚠ **AND THE FROZEN GUARD CHANGES SIDES AGAIN.** Under `D67` the plate was HELD (`D77` leaves the
 * first touch alone). Inverted, the plate is PRESSED — and `D77` turns a second touch on a frozen
 * body into a MISS unless that face is one the product is currently OFFERING. ⭐ So aligning to
 * the plate now reads: turn the part until the plate's face lights fuchsia, then press it.
 *
 * ⭐ `D67`'s own text, kept because a reversal is only legible beside what it reverses:
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
  // ⚠ The PRESSED body supplies the PioneerFace, so without one there is nothing to aim at.
  if (ctx.pressedObject === null || ctx.pressedFace === null) return nothing;
  // ⛔ Exactly one held body, or *which Follower?* has no answer.
  if (ctx.heldObjects.length !== 1) return nothing;
  const follower = ctx.heldObjects[0]!;
  // ⚠ A press on the body that is already held is `SECOND`'s configuration, not this one — and
  // a Pioneer and a Follower on one body is not a relation.
  if (follower === ctx.pressedObject) return nothing;
  // ⛔⛔ **THE ONE CONFIGURATION A PRESS DOES NOT ALIGN**: the press would produce EXACTLY the
  // alignment that already exists — same Pioneer, same PioneerFace, same FollowerFace. ⭐ Then it
  // does nothing and the RELEASE undoes it (`D39`), so a hand that presses and holds has not
  // silently lost the alignment it is looking at.
  //
  // ⛔⛔⛔ **ALL THREE, AND THE MISSING TWO WERE A REAL DEFECT** (the owner, 2026-09-25: *"instead
  // of aligning, it disengages the alignment"*). `D87`'s first build compared
  // `alignedFaceOfHeld` — the FOLLOWER's face — against `pressedFace`, the PIONEER's. ⚠ Under
  // `D67` both named faces of the SAME body; inverted, they name faces of two different bodies,
  // and face ids are per-body (`f0…fN`), so `objectB/f4` and `objectA/f4` collide as strings.
  // ⭐ `METHOD`: *inverting a rule's roles re-points every field in it — a comparison that
  // survives the edit unchanged is the one to distrust.*
  //
  // ⚠ And the THIRD term is what the owner asked for: with a NEW HitFace the press re-points the
  // alignment onto it, because the result would differ. Only an identical outcome is a no-op.
  if (
    ctx.pioneerOfHeld === ctx.pressedObject &&
    ctx.pioneerFaceOfHeld === ctx.pressedFace &&
    ctx.alignedFaceOfHeld === ctx.heldPressFace
  ) {
    return nothing;
  }
  // ⭐⭐⭐ **`D90` — THE PRESSED BODY ALREADY FOLLOWS THE HELD ONE: THAT IS A *SWAP*, NOT A CYCLE.**
  //
  // > *"I first press the pioneer and second press the follower … why is there no swap between
  // > the pioneer and the follower? This conflicts with the rule I set."* — the owner, 2026-09-25
  //
  // ⛔⛔ A guard stood here and **refused** this configuration. It was right under `D67`, where
  // the held body was the PIONEER: *hold B, press A* then meant `A→B`, the relation that already
  // existed, and letting `wouldCycle` fire on it broke the pair the hand was holding. ⚠ Inverted,
  // the identical finger pattern means `B→A` — the OPPOSITE relation, and a fresh one.
  //
  // ⭐⭐ **A SWAP CANNOT CLOSE A LOOP, BECAUSE A FOLLOWER IS CAPPED AT ONE ALIGNMENT**: `B→A` only
  // makes a ring if `A→B` survives it, and the rule replaces rather than adds. ⛔ `scene.ts`
  // releases the prospective Pioneer's own link and then makes the new one — one gesture, one net
  // relation, the roles exchanged. ⭐ That is the owner's *"the first touch is on the hitface which
  // potentially becomes a followerface"* holding **without an exception**, which is the whole
  // argument: a rule with one configuration it silently refuses is a rule a hand cannot trust.
  return { action: "ALIGN", mode: alignModeFor(ctx.pressWasDoubleTap) };
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
export function flickResetPlan(
  alignmentTouchedThisGesture: boolean,
): ResetPlan {
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
 * the angle between any two of their directions, so the Follower's aligned normal keeps its
 * **anti-parallel** relation to the Pioneer's face normal without solving anything.
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
  return mode === "SNAPSHOT"
    ? { kind: "RELEASE", delta: null }
    : { kind: "FOLLOW", delta };
}

/**
 * ⚠ Below this, a difference is float noise rather than a hand: **one micron**, at metre-scale
 * world coordinates. ⛔ NOT a tunable, for `PIONEER_TURN_EPSILON_RAD`'s reason — it guards
 * arithmetic, not feel, and a slider on it would invite someone to tune away a rule instead of
 * a threshold.
 */
export const PIONEER_MOVE_EPSILON_M = 1e-6;

/** What a Pioneer's MOVE costs one Follower. ⭐ The mirror of `PioneerTurn`. */
export interface PioneerMove {
  readonly kind: "NONE" | "RELEASE" | "FOLLOW";
  /** `FOLLOW` only: the world translation to add to the Follower's position. */
  readonly delta: Vec3 | null;
}

/**
 * ⭐⭐⭐ **`D70` — A MOVED PIONEER COSTS A FOLLOWER EXACTLY WHAT A TURNED ONE DOES.**
 *
 * > *"in rotation mode, when a follower is cyan, a rotation of the pioneer releases the
 * > alignment … Any other orange follower instead rotates to follow the pioneer. In translation
 * > mode, when a follower is cyan, it follows the translation of the pioneer. This is not OK: a
 * > translation of the pioneer should break the alignment of the cyan."* — the owner, 2026-09-21
 *
 * ⛔⛔ **`D69` READ *"all the follower objects"* LITERALLY AND THAT WAS THE WRONG READING.** The
 * owner's sentence contrasted *"all the **orange** follower objects"* with *"all the follower
 * objects"* one clause apart, and I took the contrast for the rule. ⚠ It was flagged at the time
 * — *"tell me if you wanted orange only and it comes back"* — and the answer is sharper than
 * that: cyan does not merely sit still, it **breaks**.
 *
 * ⭐⭐ **THE REAL RULE IS THE ONE THAT WAS ALREADY THERE**: `SNAPSHOT` means *I copied your pose
 * once*, so the moment the Pioneer's pose changes the copy is stale and the relation ends;
 * `FOLLOW` means *I am tied to you*, so it moves. ⛔ Position and orientation are two components
 * of one pose, and a rule that answered differently for each was **the asymmetry**, not the fix.
 * ⭐ `METHOD`: *when two channels exist, the correction belongs to the RULE* — so this function
 * sits beside `pioneerTurned` and answers in the same three verdicts.
 *
 * @param before the Pioneer's position when it was last observed.
 * @param now its position this frame.
 */
export function pioneerMoved(
  before: Vec3,
  now: Vec3,
  mode: AlignMode,
): PioneerMove {
  const delta: Vec3 = [
    now[0] - before[0],
    now[1] - before[1],
    now[2] - before[2],
  ];
  // ⚠ The squared length, so no root is taken 60 times a second for every aligned body.
  const d2 = delta[0] * delta[0] + delta[1] * delta[1] + delta[2] * delta[2];
  if (d2 < PIONEER_MOVE_EPSILON_M * PIONEER_MOVE_EPSILON_M)
    return { kind: "NONE", delta: null };
  return mode === "SNAPSHOT"
    ? { kind: "RELEASE", delta: null }
    : { kind: "FOLLOW", delta };
}

/**
 * ⭐ Re-read an alignment's target from where the Pioneer's face points **now** (`FOLLOW`).
 *
 * ⚠ It keeps §1.4's doctrine rather than breaking it: the constraint still holds a WORLD
 * direction, and a camera orbit still cannot redefine it. What changes is that the direction
 * is refreshed from the face it was taken from — which is the whole difference between the
 * owner's two readings, expressed as one field.
 *
 * @param pioneerWorldNormal ⛔⛔ **THE PIONEER'S FACE NORMAL, NOT A TARGET.** It goes through
 *   `alignTargetFor` exactly as the tap does, so the anti-parallel sign is applied in ONE place
 *   for both paths. ⚠ It took a `targetWorld` until 2026-09-23, and leaving it that way would
 *   have meant a `FOLLOW` cascade quietly re-aligning its followers PARALLEL one frame after a
 *   tap aligned them anti-parallel — a sign error with no symptom until the Pioneer moves.
 */
export function retargetAlignment(
  c: Constraint,
  pioneerWorldNormal: Vec3,
): Constraint {
  return { ...c, targetWorld: alignTargetFor(pioneerWorldNormal) };
}

/**
 * ⭐⭐⭐ **A TAP ON EMPTY SPACE WHILE HOLDING AN ALIGNED BODY RELEASES ITS ALIGNMENT** — `D95`.
 *
 * > *"Add the following conditions to unalign an aligned object: first touch pressed on aligned
 * > object and single tap with second touch not raycast hitting any object (for mobile device);
 * > right button clicked and hold on aligned object and then left click not raycast hitting any
 * > object (for desktop)."* — the owner, 2026-09-25
 *
 * ⭐⭐ **ONE RULE SERVES BOTH, BECAUSE THEY ARE ONE CONFIGURATION.** On the desktop the right button's
 * hold IS the first touch (`D94`) and a left click that hits nothing IS a second touch routed
 * `OUTSIDE` — so the mouse needs no rule of its own. ⛔ A second, desktop-only copy would be two
 * implementations of one gesture, free to disagree.
 *
 * ⛔ Exactly ONE held body, and it must be ALIGNED. ⚠ With nothing aligned the tap keeps its old
 * meaning — `D28`'s mode toggle — so this adds an unalign without taking a toggle away from any
 * configuration that had one to spare. ⚠ With two held bodies *which one?* has no answer.
 *
 * ⚠ The tap is CONSUMED: it releases the alignment and does NOT also toggle the mode — one gesture,
 * one consequence, the rule `D38` set for the alignment tap.
 */
export function outsideTapReleases(
  heldObjectCount: number,
  heldIsAligned: boolean,
): boolean {
  return heldObjectCount === 1 && heldIsAligned;
}

/**
 * ⭐⭐⭐ **THE SQUARING TWIST** — the owner, 2026-09-26: *"add that squaring twist"*.
 *
 * > *"I have seen cases where one follower face is aligned to a rectangle face (which removes the
 * > initial roll gap) and when I align the same follower face to another rectangle face, the roll
 * > reappears and I lose the perpendicularity."*
 *
 * ⛔⛔ **THE MINIMAL SWING CANNOT KEEP IT, MEASURED**: a Follower square to the plate, swung onto a
 * face of the grey part (booted 30° roll + 30° pitch), lands 8.2°–30° off square to it — two turns
 * about different axes carry a twist about the face normal that no single shortest swing can
 * reproduce (spec §11.12). ⭐ So after the swing the Follower turns ABOUT THE ALIGNED NORMAL by the
 * smallest angle that puts its edges square to the Pioneer's — **at most 45°**, the nearest of the
 * four square positions. ⚠ The total turn is no longer strictly minimal; the owner chose that.
 *
 * ⭐ It turns about the aligned normal only, so the alignment itself is untouched, and the spin
 * about that normal stays FREE afterwards (`D37`'s cap is unchanged).
 *
 * ⭐ A face's edge direction is the body axis lying most nearly IN its plane, projected onto it —
 * exact for a box face and for the pyramid's slanted sides, whose body `z` lies in their plane.
 * ⛔ A projection that collapses returns `IDENTITY`: suppress, do not guess.
 *
 * @param axis the aligned normal in WORLD — the Follower face's direction after the swing.
 * @param follower the Follower's WORLD orientation after the swing.
 * @param pioneer the Pioneer's WORLD orientation.
 * @returns the world rotation to compose on the LEFT of the swung orientation.
 */
export function squaringTwist(axis: Vec3, follower: Quat, pioneer: Quat): Quat {
  const n = normalize(axis);
  if (n === null) return IDENTITY;
  const edgeOf = (q: Quat): Vec3 | null => {
    let best: Vec3 | null = null;
    let bestK = Infinity;
    for (const e of [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ] as const) {
      const v = qRotate(q, e as Vec3);
      const k = Math.abs(dot(v, n));
      if (k < bestK) {
        bestK = k;
        best = v;
      }
    }
    if (best === null) return null;
    const k = dot(best, n);
    return normalize([best[0] - n[0] * k, best[1] - n[1] * k, best[2] - n[2] * k]);
  };
  const f = edgeOf(follower);
  const p = edgeOf(pioneer);
  if (f === null || p === null) return IDENTITY;
  const angle = Math.atan2(dot(cross(f, p), n), dot(f, p));
  // ⭐ Square, not parallel: edges a quarter turn apart are already square, so only the remainder
  // modulo 90° is turned — which is what bounds the twist at 45°.
  const quarter = Math.PI / 2;
  return qFromAxisAngle(n, angle - quarter * Math.round(angle / quarter));
}
