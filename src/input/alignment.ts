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
 * ✅ **AND IT WORKS IN BOTH MOVEMENT MODES SINCE 2026-09-17** (owner). ⚠ What still protects
 * `D28`'s toggle from being unreachable is narrower than the condition I first wrote: a tap on
 * **empty space or on the held object** toggles, in every mode. Only a tap on another object's
 * face is claimed — so `ROTATE` is always one tap away.
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
  // ✅✅ **THE MOVEMENT MODE NO LONGER GATES THIS — owner, 2026-09-17**: *"in translation
  // mode, a tap or a double tap on the second object PioneerFace also toggles the alignment
  // logic (same as for rotation)."*
  // ⛔⛔ I HAD CALLED THE `ROTATE` CONDITION *LOAD-BEARING*, AND IT WAS OVER-BROAD. The real
  // requirement is that **some** tap still reaches `D28`'s toggle, or `ROTATE` becomes
  // unreachable — and that holds: a tap on empty space, or on the held object, still toggles.
  // ⭐ Only a tap on ANOTHER OBJECT'S FACE is claimed, in either mode, which is a much smaller
  // claim than the one I was defending.
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

/**
 * Everything the PRESS's meaning depends on. ⚠ Deliberately NOT `TapContext`: a press has no
 * tap kind and no `alignMode` to compare against, and reusing that shape would have invited a
 * caller to pass a `kind` the press cannot know.
 */
export interface PressContext {
  /** The object this press landed on, or `null` for empty space. */
  readonly pressedObject: string | null;
  /** The face that press resolved, or `null` if none did. */
  readonly pressedFace: string | null;
  /**
   * The objects OTHER touchpoints are already carrying. ⛔ Every one of them, not a count:
   * the rule needs to know both *how many* and *which*, and a count cannot answer the second.
   */
  readonly heldObjects: readonly string[];
  /**
   * What the single held body is currently aligned to — **the object AND the face** — or
   * `null`. ⚠ It carries the face because `A22` has to ask *is this press on the SAME face?*,
   * which is the very test `tapMeaning` makes at the release; the two must agree.
   */
  readonly pioneerOfHeld: { readonly objectId: string; readonly faceId: string } | null;
  /**
   * ⛔⛔ What the **PRESSED** body is aligned to — *the other direction of the same question*,
   * and leaving it out was a real defect, caught on the glass within minutes of `D55` landing:
   *
   * > `align: objectA→objectB would cycle — broke objectB's own alignment instead`
   *
   * ⚠ With `A→B` already live, **picking the pair up in the other order** — hold `B`, press
   * `A` — is not a fresh relation at all, but only `pioneerOfHeld` was consulted, so it read as
   * one. `wouldCycle` then did exactly its job and **destroyed the alignment the hand was
   * holding**. ⭐ Before `D55` that took a deliberate tap; a press made it an accident.
   * ⭐⭐ `METHOD`: *a substituted quantity* — *"is the held body related to the pressed one?"*
   * stood in for *"are these two bodies related?"*, and the two agree in one direction only.
   */
  readonly pioneerOfPressed: string | null;
  /** The held body's current alignment mode, or `null` when it is not aligned. */
  readonly alignModeOfHeld: AlignMode | null;
  /**
   * ⭐⭐ **WOULD THIS PRESS COMPLETE A DOUBLE TAP?** — `TapHistory.wouldPair`, asked on the way
   * down. ⛔ A boolean and not a `kind`: the press is not a tap and never will be if the finger
   * stays down, so naming it `kind: "DOUBLE_TAP"` would claim a verdict that has not happened.
   */
  readonly completesDoubleTap: boolean;
}

/**
 * ⭐⭐⭐ **THE ALIGNMENT NOW TOGGLES ON AT THE *PRESS*, NOT AT THE TAP** (`D55`).
 *
 * > *"when first touch is pressed on first object, as soon as a second touch is pressed on
 * > second object (= a tap or a continued press), the Pioneer - Follower mechanism toggles on.
 * > To toggle off, the rule stays unchanged."* — the owner, 2026-09-19
 *
 * ⭐⭐ **WHAT IT BUYS: A TWO-HANDED GRAB *IS* THE RELATION.** Until now the relation cost a
 * deliberate tap, so `D51`'s pinned Pioneer — the posture where the second finger steers the
 * Follower's depth and roll — was reachable only after one. ⛔ Now picking the second body up
 * **is** the gesture, and with `pioneerTranslates = 0` at boot that second body stops being
 * cargo and becomes a control surface the moment it is touched.
 *
 * ⛔⛔⛔ **THIS FUNCTION ONLY EVER TURNS THE MECHANISM *ON*, AND THAT IS THE WHOLE DESIGN.**
 * The owner's second sentence is a constraint on this one: the ways OUT — a shake, or the same
 * gesture again on the same face — all live on the RELEASE, in `tapMeaning`, untouched. ⚠ So a
 * press that could *replace* or *break* an alignment must return `NOTHING` and let the release
 * decide, or the press would silently own a second meaning the owner did not give it.
 * ⭐ That is why a held body **already aligned to the pressed body** is refused here: grabbing
 * an aligned pair by its two bodies must not re-point, and must not destroy, the relation the
 * hand is holding. ⚠ Re-pointing to a DIFFERENT face of the same Pioneer is still reachable —
 * by the tap, exactly as before.
 *
 * ⛔⛔ **IT WAS `SNAPSHOT` UNCONDITIONALLY, ON THE GROUND THAT A PRESS CANNOT KNOW THE TAP
 * COUNT — AND `A22` MADE THAT FALSE FOUR HOURS LATER.** `D42` gave the gesture the choice — a
 * single tap makes a `SNAPSHOT`, a double tap a `FOLLOW` — and `TapHistory.wouldPair` now answers
 * it on the way down. ✅ Corrected 2026-09-19 after a device report; see the `ALIGN` return. ⭐ The double tap still lands on `FOLLOW`, by a
 * route that already existed: press #1 aligns as `SNAPSHOT`, and the second tap's release is a
 * `DOUBLE_TAP` on the same face, which `tapMeaning` reads as `SWITCH`. ⚠ The visible cost is a
 * **cyan flash between the two taps** — honest, because for that moment the alignment really is
 * a snapshot. ⛔ `SNAPSHOT` is also the conservative one to be wrong about: it leaves the
 * Follower's rotation independent, where a wrong `FOLLOW` would spin a body the hand did not
 * aim at.
 *
 * ⚠ A press that resolves NO face aligns nothing. ⛔ Silence, not a default face: `D49` and
 * `LESSONS_CARRIED` §6 both say a degenerate input returns nothing rather than a stand-in.
 *
 * ⚠ EXACTLY ONE other held body, for the reason `alignFollowerToPioneer` already gives: with
 * two, *which* is the Follower has no answer worth trusting.
 *
 * ⭐⭐⭐ **`A23`, 2026-09-19 — AND A NEW FACE OF THE *CURRENT* PIONEER RE-POINTS ON THE PRESS.**
 *
 * > *"currently, a tap on a new face on pioneer object triggers the switch to this new
 * > PioneerFace and new alignment of the Follower object: add a continued press to also trigger
 * > this switch"* — the owner
 *
 * ⭐ It is `D55` finishing its own sweep: *tap or continued press* now governs the three things
 * a press can do to an alignment — **make** it (`D55`), **upgrade** it (`A22`), **re-point** it
 * (`A23`) — while the two ways OUT stay on the release, untouched, exactly as required.
 *
 * ⚠⚠ **AND IT REVERSES A GUARD, DELIBERATELY — STATED BECAUSE IT HAS A COST.** Until now a
 * press on ANY face of the current Pioneer did nothing, so the Pioneer could be picked up
 * anywhere without disturbing the relation. ⛔ Now only its **aligned face** is a safe handhold:
 * grabbing it elsewhere re-points the alignment onto the face under the finger. ⭐ That is the
 * rule as dictated, and the owner has it in writing; it is also recoverable in one gesture,
 * which the destroyed-alignment case it replaces was not.
 */
export function pressMeaning(ctx: PressContext): TapMeaning {
  const nothing: TapMeaning = { action: "NOTHING", mode: null };
  if (ctx.pressedObject === null || ctx.pressedFace === null) return nothing;
  if (ctx.heldObjects.length !== 1) return nothing;
  const heldObject = ctx.heldObjects[0]!;
  // ⚠ A press on the body that is ALREADY held is `SECOND`'s configuration, not this one —
  // and a Pioneer and a Follower on one body is not a relation.
  if (heldObject === ctx.pressedObject) return nothing;
  // ⛔⛔ **THE SAME FACE OF THE SAME PIONEER — the one configuration a press does not align.**
  // ⚠ Narrowed by `A23` (2026-09-19): it used to cover **every** face of the current Pioneer,
  // to keep an ordinary grab from disturbing the relation. The owner asked for the opposite on
  // a NEW face — see below — so only the face already aligned is held back, where there is
  // nothing to re-point to anyway.
  if (
    ctx.pioneerOfHeld !== null &&
    ctx.pioneerOfHeld.objectId === ctx.pressedObject &&
    ctx.pressedFace === ctx.pioneerOfHeld.faceId
  ) {
    // ⭐⭐⭐ **`A22` (amending `D55`) — THE UPGRADE TO `FOLLOW` FIRES ON THE WAY DOWN TOO.**
    //
    // > *"why a single tap followed by a rapid press (the equivalent of double tap where the
    // > final release is not done) doesn't trigger a switch to orange?"* — the owner
    //
    // ⛔ It did not, and the answer was simply that `D55` moved half the gesture. The ALIGN
    // went to the press; the mode SWITCH stayed on the release, where `TapHistory.record` asks
    // the double-tap question — so a second touch that is **pressed and held** never asked it.
    // ⭐ Now it does, and the two halves obey one rule: *a tap or a continued press*.
    //
    // ⛔⛔ **NARROW ON PURPOSE: ONLY THE SECOND OF A RAPID PAIR, ONLY ONTO `FOLLOW`.**
    // ⚠ A *plain* press on the Pioneer's aligned face must keep meaning nothing: it is the one
    // safe handhold left on a Pioneer, and the grab that `D51` makes ordinary.
    // ⛔ And it never switches BACK to `SNAPSHOT`: `modeForTap("DOUBLE_TAP")` is `FOLLOW`, so
    // a double tap onto a `FOLLOW` alignment is *the same gesture again*, which is `D39`'s
    // toggle-OFF — and toggling off stays on the release, unchanged, as the owner required.
    if (ctx.completesDoubleTap && ctx.alignModeOfHeld !== "FOLLOW") {
      return { action: "SWITCH", mode: "FOLLOW" };
    }
    return nothing;
  }
  // ⛔⛔ **THE REVERSE DIRECTION IS STILL REFUSED, AND IT IS NOT THE SAME QUESTION.**
  // ⚠ Here the **pressed** body follows the **held** one, so aligning held→pressed would close
  // a cycle — the defect the glass found within minutes of `D55`:
  // `align: objectA→objectB would cycle — broke objectB's own alignment instead`.
  // ⛔ `A23` does NOT relax this: re-pointing onto a new face is a request the hand can make
  // of its own Pioneer, while this configuration has no valid alignment to make at all.
  if (ctx.pioneerOfPressed === heldObject) return nothing;
  // ⭐⭐⭐ **THE PRESS *CAN* KNOW THE TAP COUNT, AND `D55` SAID IT COULD NOT.**
  //
  // ⛔⛔ DEVICE-REPORTED, 2026-09-19: *"if the Follower object is cyan highlighted, a new double
  // tap on the same PioneerFace should toggle follower object to orange highlighted. This is not
  // the case right now."* ⚠ Traced, and the fault was this line.
  //
  // ⭐ The sequence: tap #1 of the pair lands on the aligned face and `tapMeaning` reads it as
  // `UNALIGN` — `D39`, correct and unchanged — so the alignment is GONE by press #2. Press #2
  // therefore makes a **fresh** alignment here, and it used to make a `SNAPSHOT`, while its
  // release was spent by `D55`. ⛔ So the `DOUBLE_TAP` that used to upgrade it never ran, and the
  // body stayed cyan. Before `D55` the same gesture worked by a two-step route: tap #1 unaligned
  // and tap #2 re-aligned with `modeForTap("DOUBLE_TAP")`.
  //
  // ⛔⛔⛔ **`D55`'s STATED REASON WAS *"a press cannot know the tap count"*, AND `A22` MADE IT
  // FALSE FOUR HOURS LATER.** `TapHistory.wouldPair` answers exactly that question on the way
  // down, and `completesDoubleTap` has been in this context since — used on the SWITCH path and
  // left unread here. ⭐ `METHOD`: *a premise recorded as a reason has to be re-checked when the
  // thing it claimed was impossible gets built.* The comment outlived its own truth.
  //
  // ⚠ It also removes `D55`'s cyan flash for a double tap on a **fresh** face: press #2 there is
  // the SWITCH path, which was already immediate, and press #1 is genuinely not a pair yet.
  return { action: "ALIGN", mode: ctx.completesDoubleTap ? "FOLLOW" : "SNAPSHOT" };
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
