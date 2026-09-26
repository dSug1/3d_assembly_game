/**
 * THE ALIGNMENT WIRING — `alignFollowerToPioneer` and every path that releases, seats or unseats. ⛔ The decisions are `input/alignment.ts`'s and `core/alignment_links.ts`'s; this file holds the state and the calls.
 *
 * ⭐ Split out of `scene.ts` on 2026-09-26 (the owner: *"make everything as much modular as
 * possible"*). Every function takes the scene's `st: SceneState` first.
 */
import { isTapRelease, tapReleaseToggles, toggleBehaviour, faceAlignConstraint, squaringTwist, type AlignMode, type Sample } from "../input";
import { detach, worldPlacementOf, type ObjectId } from "../core/object_model";
import { mmToPx } from "../core/units";
import { incrementRadians } from "../input/rotation_increment";
import { singleAlignment, solve } from "../core/constraint_stack";
import { clearObjectConstraints, evictObjectConstraints, faceWorld, pushObjectConstraint } from "../core/object_model";
import { IDENTITY, qmul } from "../core/vec";
import { assemblyRoot } from "../input/assembly";
import { ALIGN_SNAP_FRACTION, type Held, type SceneState } from "./scene_state";
import { modelOrientation, setModelOrientation } from "./bodies";
import { paintHighlightColours } from "./markers";

/** ⭐ The same offer as keys, as the PRESS path needs it (the frozen-face exception). */
export function alignFollowerToPioneer(st: SceneState, followerPointerId: number,
  followerGrip: Held,
  mode: AlignMode,
  /**
   * ⭐⭐⭐ **THE FINGER THAT IS ABOUT TO GO AWAY**, named by the caller because only the caller
   * knows. ⛔ Its `pressFace` is wiped at the end; the other grip's is left alone.
   *
   * ⚠⚠ It was `followerGrip`, hard-coded, and that was true only of `D67`'s press path. The two
   * call sites disagree about which finger is transient — on a PRESS the Pioneer's touch is the
   * new one, on a RELEASE the follower's is the one lifting — so a fixed answer is wrong for one
   * of them whichever way it points. ⭐ `METHOD`: *when two callers disagree about a fact, the
   * fact is an argument, not a constant.*
   */
  transientGrip: Held,) : boolean {
  const followerId = st.idOf.get(followerGrip.mesh);
  if (followerId === undefined || followerGrip.pressFace === null) {
    st.lastVerdict = "align: press resolved no face — toggled instead";
    return false;
  }
  // ⛔⛔ EXACTLY ONE OTHER HOLDER. The rule names a *first* and a *second* object; with
  // two other objects held, *which* one is the Follower has no answer worth trusting, and
  // guessing would align an object the hand did not mean to move. ⭐ Same discipline as
  // `A15`'s *"every remaining holder is evaluated, not a guessed pairing"*.
  const others = [...st.held.entries()].filter(
    ([pid]) => pid !== followerPointerId,
  );
  if (others.length !== 1) {
    st.lastVerdict =
      others.length === 0
        ? "align: nothing held — the tap toggled the mode"
        : `align: ${others.length} objects held — no Pioneer can be chosen, toggled instead`;
    return false;
  }
  const pioneerGrip = others[0]![1];
  const pioneerId = st.idOf.get(pioneerGrip.mesh);
  if (pioneerId === undefined || pioneerGrip.pressFace === null) {
    // ⚠ `D67`: the held body IS the Pioneer, so this is *the first touch never resolved a
    // PioneerFace* — the one thing the whole gesture stands on.
    st.lastVerdict =
      "align: the held object has no resolved PioneerFace — toggled instead";
    return false;
  }

  // ⭐⭐ **A FROZEN BODY CANNOT BE A FOLLOWER** — refused here only so the HUD can SAY so.
  // ⛔⛔ THE GUARANTEE ITSELF IS IN `core/object_model.ts`: `pushObjectConstraint` refuses a
  // frozen body, so even if this check were deleted the plate could not be aligned. ⚠ What
  // would be lost is the EXPLANATION — the tap would silently do nothing, and *"tapping the
  // plate does nothing"* is precisely the shape this file has been burned by twice today.
  // ⭐ A frozen body remains a perfectly good PIONEER; only the Follower role is refused.
  if (st.world.objects.get(followerId)?.frozen === true) {
    st.lastVerdict = `align: ${followerId} is FROZEN — it cannot be a follower`;
    // ⚠ `false`: the tap was NOT consumed, so it still falls through to the mode toggle.
    // ⛔ Unlike the cycle case there is nothing to undo here, and a tap that did absolutely
    // nothing would be the readout-that-lies shape again.
    return false;
  }

  // ⭐⭐⭐ **A LOOP IS SEVERED AND THE ALIGNMENT IS THEN MADE — `D90`, THE SWAP.**
  //
  // > *"a follower cannot become the pioneer of its own pioneer. in such case, the tap
  // > triggering this configuration shall instead break the initial alignment"* — the owner,
  // > 2026-09-17, and it said BREAK and stop
  //
  // > *"I first press the pioneer and second press the follower … why is there no swap between
  // > the pioneer and the follower? This conflicts with the rule I set."* — the owner,
  // > 2026-09-25, choosing break **and re-make**
  //
  // ⛔⛔ **BOTH TEXTS STAND, AND THE SECOND IS IN FORCE.** The first was written under `D67`,
  // where the held body was the PIONEER, so *hold B, press A* named the relation that already
  // existed; inverted, the same fingers name the OPPOSITE one, which is a swap the hand asked
  // for explicitly. ⭐ `METHOD`: *a ruling is made about a gesture, and an inversion changes
  // what the gesture says — so the ruling has to be asked again, not carried.*
  //
  // ⭐⭐ **ONE RELEASE ALWAYS SUFFICES**, and that is why this is not a loop: a body has at most
  // one Pioneer, so the chain leaving the prospective Pioneer is unique and cutting its first
  // edge severs every cycle through it. ⚠ `F → P1 → P2` then making `P2` follow `F` drops
  // `F → P1`, exactly as the two-body case drops `A → B`.
  //
  // ⛔ A cycle is not cosmetic — `resolvePioneerTurns` is a fixed point over these links, so a
  // ring of orange bodies would take each other's rotation for ever. ⭐ Severing first makes the
  // state unrepresentable rather than capped.
  // ⭐⭐ THE DECISION IS `cycleBreaker`'s, in `core/alignment_links.ts`, where a vector reaches
  // it. ⛔ This file holds the CALL and nothing else — the 2026-09-19 lesson, which cost seven
  // mutants that survived the whole suite.
  const swapped = st.links.cycleBreaker(followerId, pioneerId);
  if (swapped !== null) {
    // ⛔⛔ **AND THEN IT FALLS THROUGH.** ⚠ It used to `return true` here, which is the *break
    // only* reading — the owner's 2026-09-17 sentence — and it left the hand repeating the
    // gesture to get the relation it had just asked for.
    releaseAlignmentOf(st, swapped);
  }

  // ⭐ The Pioneer normal is read in WORLD **now** and then frozen — §1.4's doctrine, and
  // the owner's own *"the PioneerFace resets as null"*. There is no live relationship
  // afterwards: moving the other object later does not drag this alignment with it.
  const pioneerWorld = faceWorld(
    st.world,
    pioneerId,
    pioneerGrip.pressFace.faceId,
  )?.normal;
  const followerLocal = st.world.objects
    .get(followerId)
    ?.faces.find((f) => f.id === followerGrip.pressFace!.faceId)?.normal;
  if (!pioneerWorld || !followerLocal) {
    st.lastVerdict = "align: face lookup failed — toggled instead";
    return false;
  }

  const capped = singleAlignment(
    st.world.objects.get(followerId)?.constraints ?? [],
    faceAlignConstraint(followerLocal, pioneerWorld),
  );
  if (capped.refused) {
    // ⛔ A `MATE` holds the stack. Unreachable today (§4's `6quater` is the only rule that
    // pushes one and fork C has no flick), and reported rather than silently overridden.
    st.lastVerdict = "align: REFUSED — a MATE holds the stack";
    return false;
  }
  // ⚠ `clear` then `push` IS the setter, and it is safe *because* of the refusal above:
  // with no mate on the stack there is nothing `clear` can destroy that the cap would have
  // kept. ⛔ Written as two calls rather than a new core API, so the object model gains no
  // surface for one caller.
  st.world = clearObjectConstraints(st.world, followerId);
  st.world = pushObjectConstraint(st.world, followerId, capped.stack[0]!, false);

  // ⭐⭐ **SOLVED FROM THE LAST *ALIGNED* ORIENTATION** — the owner, 2026-09-26: *"the rotation
  // shall be minimum from its last aligned quaternion."* ⛔ Mid-snap, the drawn pose is only part
  // of the way there, and a swing from it would keep the unfinished part of the previous turn.
  // ⚠ The new snap still STARTS at the drawn pose, so nothing jumps.
  const drawn = modelOrientation(st, followerGrip.mesh);
  const before = st.alignSnaps.targetOf(followerId) ?? drawn;
  const solved = solve(capped.stack, before, {
    evictOnOverflow: st.cfg.evictOnOverflow,
  });
  if (solved.rejected) {
    st.lastVerdict = "align: solver refused the alignment";
    return false;
  }
  // ⭐ ONE alignment, so this is §1.4's entry 1: the MINIMAL swing — *"rotation on the
  // minimum number of axis"* — and the spin about the aligned normal stays free.
  // ⭐⭐ PLAYED AS A SLERP over `cameraResetMs`, not applied in one frame (owner, 2026-09-17).
  // ⛔⛔ **THE DURATION IS THE CAMERA RESET'S, ON PURPOSE**: *"use the available sliders so we
  // do not inflate the numbers of tuning parameters sliders."* ⭐ They are the same KIND of
  // number — how long a discrete, hand-requested snap takes — and the camera's is the only
  // one in the config. ⚠ Moving that slider moves both, which is the cost of not adding a
  // knob; splitting them later is one field and one line.
  // ⚠ At `0` the slider means *no animation*, exactly as it does for the camera.
  // ⭐⭐⭐ **AND THEN SQUARED TO THE PIONEER** — the owner, 2026-09-26: *"add that squaring
  // twist"*. ⛔ A turn about the aligned normal only (≤ 45°), so the constraint just pushed is
  // untouched; the decision is `squaringTwist`'s (`input/alignment.ts`).
  const swung = qmul(solved.rotation, before);
  const pioneerOrientation = worldPlacementOf(st.world, pioneerId)?.orientation;
  const target =
    pioneerOrientation === undefined
      ? swung
      : qmul(
          squaringTwist(capped.stack[0]!.targetWorld, swung, pioneerOrientation),
          swung,
        );
  const snapMs = st.cfg.cameraResetMs * ALIGN_SNAP_FRACTION;
  if (snapMs > 0) {
    st.alignSnaps.start(followerId, drawn, target, performance.now());
  } else {
    setModelOrientation(st, followerGrip.mesh, target);
    st.alignSnaps.cancel(followerId);
  }
  if (swapped !== null) {
    st.lastVerdict = `align: SWAP — released ${swapped}'s own alignment, ${followerId}→${pioneerId}`;
  }
  followerGrip.alignmentTouched = true;
  // ⭐⭐ THE HIGHLIGHT IS THE ALIGNMENT'S STATE, not the press's: it appears HERE and dies
  // with the constraint (`D35`, and the owner's *"until un-highlight occurs"*).
  // ⚠ Captured BEFORE the grip's face is cleared below — the readout names the face this
  // alignment was actually made on, and reading it back off a cleared grip is how a verdict
  // line starts lying.
  const followerFaceId = followerGrip.pressFace.faceId;
  st.selectedFace = {
    objectId: followerId,
    faceId: followerFaceId,
    cos: followerGrip.pressFace.cos,
  };
  // ⛔⛔ *"THEN THE PIONEERFACE RESETS AS NULL"* WAS AMENDED THE SAME DAY. The owner now
  // wants its **contour highlighted until the alignment is broken**, and a re-tap on that
  // same face to break it — so the face's identity is REMEMBERED where it can be drawn and
  // compared. ⭐ What *is* still discarded is the grip's own `pressFace`: a Pioneer's grip
  // is being released, and a stale face on a dead grip is the kind of thing a later rule
  // picks up by accident.
  const pioneerFaceId = pioneerGrip.pressFace.faceId;
  // ⛔⛔⛔ **THE FACE CLEARED IS THE *TRANSIENT* GRIP'S — AND `D87` MOVED WHICH FINGER THAT IS.**
  //
  // ⭐ The rule has never changed: *a transient grip must not leave a stale face behind.* ⛔ Under
  // `D67` the transient finger was the FOLLOWER's second touch, so this line cleared
  // `followerGrip`. Inverted, the transient finger is the **PIONEER's** — and the line went on
  // clearing the follower, which is now the finger that must KEEP its face for the whole hold.
  //
  // ⚠⚠ **IT COST THE UNDO** (the owner, 2026-09-25: *"if I press again a followerFace and its
  // pioneerface, the follower simply rotates"*). With the held grip's face wiped, `pressMeaning`
  // read `heldPressFace = null` against a live `alignedFaceOfHeld`, so *this body already
  // follows this face* could never be true and `D39`'s re-press never undid anything — and the
  // NEXT press on the same hold died at `align: press resolved no face` instead.
  //
  // ⭐⭐ `METHOD`: **the comment right above this line already warned about it, aimed the other
  // way** — *"clearing the held grip's face instead would make the second Follower fail"*. An
  // inversion does not have to touch a line to break it; it only has to change which finger the
  // line names. ⛔ Nothing here can go red, which is why it reached the glass.
  transientGrip.pressFace = null;
  // ⚠ KEYED BY OBJECT, so it survives the fingers moving on — `alignMode` alone is the
  // ACTIVE alignment's mode and would recolour an older object's highlight.
  st.alignModeOf.set(followerId, mode);
  // ⛔ And WHO it was aligned to, which the constraint itself does not record.
  // ⚠ `link` MOVES an existing link rather than adding a second — a body has one alignment,
  // so re-aligning it must remove it from its previous Pioneer's set.
  // ⛔⛔⛔ **THE BASELINE IS A *WORLD* ORIENTATION — AUDIT FIX, 2026-09-17.**
  //
  // ⚠⚠ It stored `local.orientation` and the cascade compares it against
  // `worldPlacementOf(…).orientation`. ⭐ The two are IDENTICAL while every body has
  // `parent === null`, which is the whole scene today — so the mismatch is invisible and
  // waits for `3D2`. ⛔ The first PARENTED Pioneer then reads as *turned* on frame one, by
  // its parent's entire orientation: every `SNAPSHOT` follower releases itself and every
  // `FOLLOW` follower spins, with nothing having moved.
  // ⭐⭐ `METHOD`: *a quantity measured in someone else's frame is a different quantity.*
  // The parameter now says which frame it wants, in `AlignmentLinks` as well as here.
  // ⚠ `link` now REFUSES a cycle itself (audit, 2026-09-17), so the verdict is checked
  // rather than discarded. ⛔ It cannot fire here — `wouldCycle` was asked above and acted on
  // with the owner's *"break the initial alignment instead"* policy — which is exactly why a
  // silent `false` would be the worst outcome: the constraint would be pushed and the body
  // would have no link, so nothing would ever release it and `prune` would not know.
  // ⭐ `D100`: a re-aligned Follower leaves its seat first — a child of one Pioneer cannot be
  // aligned to another through the tree.
  unseatWorld(st, followerId);
  const linked = st.links.link(
    followerId,
    pioneerId,
    pioneerFaceId,
    worldPlacementOf(st.world, pioneerId)?.orientation ?? IDENTITY,
    // ⭐ `D69` — the move cascade's baseline, read at the same instant as the orientation so
    // the two halves of the link describe ONE moment.
    worldPlacementOf(st.world, pioneerId)?.position ?? [0, 0, 0],
  );
  if (!linked) {
    st.lastVerdict = `align: REFUSED — ${followerId}→${pioneerId} would close a cycle`;
    st.hudDirty = true;
  }
  paintHighlightColours(st);
  // ⛔⛔⛔ **THE MODE NO LONGER SWITCHES — the owner removed that clause, 2026-09-16:**
  //
  // > *"the mode shall not switch automatically to translation mode after an alignment in
  // > rotation mode. It makes the game too complicated. Ignore this rule... This will also
  // > allow me to test the flick after an alignment."*
  //
  // ⭐⭐ AND IT COSTS ME AN ARGUMENT I HAD LIKED: the tap's two meanings *coincided* while
  // the alignment ended in `TRANSLATE`, because that was the same flip `D28`'s toggle would
  // have made — so both rules could own the gesture without a hand seeing a contradiction.
  // ⛔ They no longer coincide: **the alignment CONSUMES the tap** and the mode stays
  // `ROTATE`. That is a real override of `D28`, not a coincidence, and it is the owner's.
  // ⚠ Nothing is trapped by it: a tap on empty space or on the held object still toggles,
  // so `TRANSLATE` is one tap away — and staying in `ROTATE` is what makes the rotation
  // reset testable straight after an alignment.
  st.lastVerdict =
    `align: ${mode} ${followerId}/${followerFaceId} → ` +
    `${pioneerId}/${pioneerFaceId} · ${solved.freeDof} DOF free · stays ${st.behaviour}`;
  return true;
}

export function driveBodyOf(st: SceneState, id: ObjectId) : ObjectId {
return assemblyRoot(
    id,
    (f) => st.links.pioneerFor(f)?.objectId ?? null,
    (f) => st.links.isSeated(f),
    (b) => st.world.objects.get(b)?.frozen === true,
  );
}

/** ⭐ Un-parent a follower in the WORLD and drop its flights. ⚠ The link's own flag is `links`'. */
export function unseatWorld(st: SceneState, followerId: ObjectId) : void {
  if (st.world.objects.get(followerId)?.parent !== null) {
    st.world = detach(st.world, followerId);
    st.hudDirty = true;
  }
  st.seatSnaps.cancel(followerId);
  const cur = st.pioneerCursors.ofFollower(followerId);
  if (cur !== null) {
    st.snapArming.forget(cur.key);
    st.unsnapDetectors.delete(cur.key);
  }
}

/** ⭐ Are these two bodies a seated couple, either way round? — what a press must not break. */
export function isSeatedCouple(st: SceneState, a: ObjectId | null, b: ObjectId | null) : boolean {
  if (a === null || b === null) return false;
  return (
    (st.links.isSeated(a) && st.links.pioneerFor(a)?.objectId === b) ||
    (st.links.isSeated(b) && st.links.pioneerFor(b)?.objectId === a)
  );
}

/** ⭐ The seated root above a body — itself when it is not seated. */
export function seatedRootOf(st: SceneState, id: ObjectId) : ObjectId {
  let x = id;
  for (let i = 0; i < 16 && st.links.isSeated(x); i++) {
    const p = st.links.pioneerFor(x)?.objectId;
    if (p === undefined) break;
    x = p;
  }
  return x;
}

/** ⭐ Is `id` seated in the same assembly as `mover`? — the sway treats it as one body. */
export function inAssemblyWith(st: SceneState, mover: ObjectId | null, id: ObjectId) : boolean {
  if (mover === null || mover === id) return false;
  if (!st.links.isSeated(mover) && !st.links.isSeated(id)) return false;
  return seatedRootOf(st, mover) === seatedRootOf(st, id);
}


// ⛔⛔⛔ **`bootAlignment` STOOD HERE AND IS DELETED** — the owner, 2026-09-25: *"boot the scene
// with no aligned object."* ⚠ It pushed a `FACE_ALIGN` on `objectB` toward `objectA`'s bottom
// face and linked the pair as `SNAPSHOT`, so the scene opened with a cyan/amber pair already on
// the glass. ⭐ Deleted, not disabled (`D28`/`D40`: *a dormant fork is a trap*).
//
// ⭐⭐ **IT NEVER MOVED ANYTHING**, which is what makes this a state change and not a visual one:
// both parts boot square, `A`'s bottom is `−y`, `B`'s top is `+y`, and the alignment is
// anti-parallel — so the constraint was satisfied the instant it was pushed.
export function releaseAlignmentOf(st: SceneState, followerId: ObjectId) : void {
  // ⚠ A release can be decided by the render loop (a turned Pioneer, a prune), where no
  // pointer event follows to repaint the HUD. See `hudDirty`.
  st.hudDirty = true;
  const ev = evictObjectConstraints(st.world, followerId);
  st.world = ev.world;
  cancelAlignAnim(st, followerId);
  // ⭐ `D100`: a released alignment takes its seat with it — the body keeps its world pose.
  unseatWorld(st, followerId);
  st.links.unlink(followerId);
  st.alignModeOf.delete(followerId);
  // ⚠ The ACTIVE-alignment records are cleared only if this body is the one they name: the
  // tap, shake and flick rules read them, and wiping them for an unrelated body would make
  // the next gesture on the ACTIVE follower behave as though nothing were aligned.
  if (st.selectedFace?.objectId === followerId) {
    st.selectedFace = null;
  }
}


/**
 * ⭐⭐⭐ **ADVANCE THE BODY TO THE INCREMENT THE FINGER IS IN NOW.**
 *
 * The owner, 2026-09-22: *"I want the object to stop to an increment and not rotate further
 * if the delta position input becomes too weak."*
 *
 * ⛔⛔ **IT NEVER REVERSES, BECAUSE IT NEVER OVERSHOOTS.** The target is the last boundary
 * the demand has CROSSED, so the step is always in the direction of travel and the body is
 * always on an increment. ⚠ The three formulations before this one all let the body reach a
 * pose it was not allowed to hold and then argued about how to bring it back; the owner's
 * objection to the last of them — *"the object rotates then rotates back in the reverse
 * direction"* — is an objection to that whole family, not to one correction.
 *
 * ⭐⭐ **AND WEAK INPUT NEEDS NO RULE OF ITS OWN.** A demand that crosses no boundary advances
 * nothing, so the body simply stops where it is. ⛔ That is why the rest-speed detector this
 * function used to consult is **deleted** rather than retuned: it was answering a question
 * that only existed because the body was allowed to drift off the increment.
 *
 * ⚠ **THE ANIMATION RETARGETS, IT DOES NOT QUEUE**, and since 2026-09-22 retargeting is
 * free: the follower is an exponential approach with no start time, so moving the target
 * neither restarts a curve nor throws away the body's speed. ⛔ A backlog is unrepresentable,
 * which is exactly what formulation 1 could not say.
 *
 * ⛔ A body whose ALIGNMENT is travelling is skipped: the alignment is landing a constraint
 * the user asked for and must win, and two animations writing one orientation is the fight.
 */
export function advanceRotation(st: SceneState, id: ObjectId | undefined) : void {
  if (id === undefined) return;
  const inc = incrementRadians(st.cfg.rotationIncrementDeg);
  if (inc === null || st.alignSnaps.has(id)) return;
  const step = st.rotationTally.advance(id, inc);
  const mesh = st.meshOf.get(id);
  if (step === null || !mesh) return;
  // ⭐ The target simply moves. There is no clock to restart, so a body already chasing a
  // detent keeps every bit of the speed it had — which is the whole point of the change.
  st.rotationFollower.push(id, step, modelOrientation(st, mesh));
}


/**
 * ⭐⭐ **DROP IT WHERE IT IS** — for every rule that RELEASES the alignment.
 *
 * ⛔⛔ THE DISTINCTION FROM `settleAlignAnim` IS THE WHOLE POINT, and it is the owner's own
 * rule: releasing an alignment *"does not rotate the first object"*. ⭐ So a shake, a re-tap
 * or a turned Pioneer that arrives mid-flight must **stop** the snap, not finish it —
 * finishing would be the alignment still acting after it was let go, which is the one thing
 * a release is supposed to guarantee against.
 * ⚠ The object keeps whatever orientation the snap had reached. That is a partial rotation
 * the hand can see and undo, which is honest; a jump back to the press pose would not be.
 */
export function cancelAlignAnim(st: SceneState, objectId: ObjectId) : void {
  st.alignSnaps.cancel(objectId);
}


/**
 * ⭐⭐⭐ **THE ONE PLACE A TAP FLIPS THE MODE — and it records the fact `D68` reads.**
 *
 * ⛔⛔ **DEVICE-REPORTED, 2026-09-23**: *"When i double tap on the pioneer to change
 * followerface, the translation/rotation mode also toggles."* ⚠ `D68` is the rule that stops
 * exactly that, and it was **dead for this gesture**: the revert fires only when
 * `lastTapToggled` says the first tap flipped something, and there were **two** places that
 * flipped it — `noteTap`, for a touchpoint routed `OUTSIDE` or `SECOND`, which set the flag,
 * and the OBJECT release below, which did not.
 *
 * ⭐⭐ A double tap on the **Pioneer** is a tap on an OBJECT by definition, so it took the one
 * path that forgot to arm: tap 1 flipped the mode, the press completing the pair found
 * `lastTapToggled === false` and reverted nothing, and the gesture ended one toggle out.
 * ⛔ Every earlier double tap in the input model went through `noteTap`, which is why `D68`
 * looked correct on the glass for two days.
 *
 * ⭐⭐⭐ `METHOD`: *a composition is a thing to MEASURE* — and the composition here is **two
 * writers of one fact**, which is the same shape as the render loop drawing only the objects
 * that happened to have a follower. ⚠ The fix is not the missing line; it is that there is
 * now one writer and a second cannot be added by accident.
 */
export function toggleByTap(st: SceneState, why: string, pointerId: number) : void {
  // ⛔⛔⛔ **AND THE OTHER HALF OF `D68` WAS DEAD TOO — `pairReverted` WAS WRITTEN AND NEVER
  // READ.** Its own comment says *"their own release must add nothing, or a full double tap
  // would end up flipped by one"*, and nothing consulted the set: a **completed** double tap
  // therefore went toggle → revert → **toggle**, and finished one out. ⚠ That is the DEAD
  // INSTRUMENT shape at its purest — a guard that cannot fire, described in prose as though
  // it does — and it is the third time on this project (`METHOD`).
  // ⭐ Consumed with `delete`, so the entry cannot survive into the next gesture and eat a
  // tap that has nothing to do with it.
  // ⭐ THE DECISION IS `tapReleaseToggles`'s; this reads the two facts and obeys. ⚠ The
  // alignment's own consumption is applied by its caller (`alignedByThisTap`), which is why
  // `false` is passed here — this helper is only ever reached when the tap was not spent that
  // way, and threading it twice would give the rule two masters.
  if (!tapReleaseToggles(st.pairReverted.delete(pointerId), false)) {
    st.lastVerdict = `${why} — release spent (its press reverted the pair)`;
    return;
  }
  st.behaviour = toggleBehaviour(st.behaviour);
  st.lastTapToggled = true;
  st.lastVerdict = `${why} → ${st.behaviour}`;
}


// ⛔⛔ **`pressToggled` AND `secondTouch` ARE DELETED WITH `D66`.** The first existed only
// because a press could toggle; the second (`D65`) only because a press toggling made a
// second touch's LIFT ambiguous. ⭐ With the press inert, a tap is a tap again — *"as per
// present rule for tap"* — and `noteTap` needs no verdict from anyone.
export function noteTap(st: SceneState, pressed: Sample,
  released: Sample,
  pointerId: number,) : "TAP" | "DOUBLE_TAP" | null {
  const wasTap = isTapRelease(
    pressed.t,
    pressed.x,
    pressed.y,
    released.t,
    released.x,
    released.y,
    st.cfg.tapMaxDuration,
    mmToPx(st.cfg.doubleTapSlop),
  );
  if (!wasTap) return null;
  // ⛔ The history is kept for §1.3's double tap whatever the fork, and the toggle depends
  // on neither its verdict nor on anything being held: *"a single tap by one only
  // touchpoint ANYWHERE also toggles"* (owner, 2026-09-16).
  const verdict = st.taps.record(pressed, released.t);
  // ⛔⛔ EVERY tap toggles — *"a single tap by one only touchpoint anywhere"* — with no
  // condition left: not the fork (there is one model now), and not whether anything is
  // held, since the mode is what the NEXT grab inherits.
  // ⛔⛔ **AND NOTHING SPENDS IT ANY MORE** (`D66`). Two rules used to: a press that had
  // already toggled (`D58`), and a second touch that had driven the body (`D64`). Both are
  // gone with the press toggle — *"a tap by the second touchpoint can [toggle], as per
  // present rule for tap"*. ⚠ The history is recorded first, as it always was: it is what the
  // double tap and the camera reset read.
  // ⭐ `D68`: this tap DID toggle, so a press that completes the pair may undo it — and the
  // arming is `toggleByTap`'s, not this function's, so the OBJECT path cannot disagree.
  toggleByTap(st, "tap", pointerId);
  return verdict;
}
