/**
 * ⭐⭐⭐ **WHAT A TURNED PIONEER DOES TO ITS FOLLOWERS — INCLUDING DOWN A CHAIN.**
 *
 * > *"if a previous pioneer P1 has a follower F1 and if P1 becomes the follower of P2: if P1 is
 * > orange, P2 rotation shall trigger rotation of P1 which in turn shall cascade to rotation of
 * > F1; if P1 is blue, P2 rotation shall release the alignment of P1 with P2 but not the
 * > alignment of F1 with P1"* — the owner, 2026-09-17
 *
 * > *"if the pioneer object rotates, all its blue follower shall be released from alignment"*
 *
 * ⛔⛔⛔ **THIS EXISTS BECAUSE THE RULE WAS UNTESTABLE WHERE IT LIVED.** It was a loop inside
 * `render/scene.ts`, so no vector could reach it — and when a hand reported *"the release of
 * the cyan follower objects by the rotation of the pioneer is not working"* there was **no way
 * to ask the code what it thought**, only to re-read it. ⚠ That is the real defect: a RULE in a
 * render file is a rule nothing can interrogate. ⭐ `METHOD`: *a composition is a thing to
 * MEASURE* — and a cascade is a composition of the worst kind, because its output feeds its
 * own input.
 *
 * ⭐⭐ **THE CASCADE RESOLVES WITHIN ONE CALL, not one level per frame.** The previous version
 * compared each follower against a remembered pose, so a chain unwound at one link per frame.
 * ⛔ That was defensible for two bodies and wrong for the owner's rule, which says P1's
 * rotation *"shall cascade to rotation of F1"* — as one consequence, not as a sequence a hand
 * can watch crawl.
 *
 * ⛔ ENGINE-FREE. It reads orientations through a callback and returns a PLAN; it moves nothing.
 */
import type { ObjectId } from "../core/object_model";
import type { Quat, Vec3 } from "../core/vec";
import { qmul } from "../core/vec";
import type { AlignMode } from "./alignment";
import { pioneerMoved, pioneerTurned } from "./alignment";

/** One follower's link, as this resolver needs it. */
export interface FollowerLink {
  readonly follower: ObjectId;
  readonly pioneer: ObjectId;
  /** The Pioneer's orientation as this follower last saw it. */
  readonly baseline: Quat;
  /** `SNAPSHOT` (cyan) releases on a turn; `FOLLOW` (orange) takes the turn. */
  readonly mode: AlignMode;
}

export type CascadeStep =
  /** ⭐ Cyan: the alignment goes, and **the body does not move** (`D41`'s C1). */
  | { readonly kind: "RELEASE"; readonly follower: ObjectId }
  /** ⭐ Orange: the body takes the Pioneer's WORLD rotation (`D41`'s C2). */
  | { readonly kind: "ROTATE"; readonly follower: ObjectId; readonly delta: Quat };

export interface CascadePlan {
  /** In the order they must be applied. ⚠ A `ROTATE` may precede a `RELEASE` it caused. */
  readonly steps: readonly CascadeStep[];
  /** Follower → the Pioneer pose it should now be baselined against. */
  readonly baselines: ReadonlyMap<ObjectId, Quat>;
}

/**
 * ⭐⭐⭐ **RESOLVE EVERY CONSEQUENCE OF EVERY PIONEER'S CURRENT POSE.**
 *
 * ⭐ The algorithm is a fixed point: a follower that rotates becomes a Pioneer whose pose has
 * changed, so the pass repeats until nothing more moves. ⛔ **CAPPED**, because a cycle is
 * expressible — A aligned to B and B aligned to A — and an uncapped fixed point on a cycle is
 * a hung render loop rather than a wrong answer. ⚠ The cap is one pass per link plus one: a
 * chain of `n` links needs at most `n` passes, so the cap cannot cut a legitimate cascade short.
 *
 * @param orientationOf the CURRENT world orientation of a body, or `null` if it is gone.
 *   ⚠ Called for Pioneers and for followers that rotate; the resolver keeps its own view of
 *   anything it moves, so the caller's world need not be updated between steps.
 */
export function resolvePioneerTurns(
  linksIn: readonly FollowerLink[],
  orientationOf: (id: ObjectId) => Quat | null,
): CascadePlan {
  const steps: CascadeStep[] = [];
  const baselines = new Map<ObjectId, Quat>();
  /** The resolver's own view of every pose it has moved. */
  const pose = new Map<ObjectId, Quat>();
  const now = (id: ObjectId): Quat | null => pose.get(id) ?? orientationOf(id);

  /** Links still to resolve. ⚠ A released one is removed; a rotated one is re-baselined. */
  let pending = linksIn.map((l) => ({ ...l }));
  const cap = linksIn.length + 1;

  for (let pass = 0; pass < cap; pass++) {
    let moved = false;
    const survivors: typeof pending = [];
    for (const link of pending) {
      const pioneerNow = now(link.pioneer);
      if (pioneerNow === null) {
        // ⚠ The Pioneer is gone. ⛔ The alignment does NOT go with it — §1.4 stores a frozen
        // world direction precisely so an alignment survives its Pioneer being deleted.
        survivors.push(link);
        continue;
      }
      const turn = pioneerTurned(link.baseline, pioneerNow, link.mode);
      if (turn.kind === "NONE") {
        survivors.push(link);
        continue;
      }
      if (turn.kind === "RELEASE") {
        // ⛔⛔ THE BODY IS NOT MOVED, so it is NOT a changed Pioneer for anything aligned to
        // IT. ⭐ That is exactly the owner's second clause: *"if P1 is blue, P2 rotation shall
        // release the alignment of P1 with P2 but not the alignment of F1 with P1."* ⚠ It falls
        // out of the geometry rather than needing a rule — F1's baseline for P1 still holds,
        // because P1 never turned.
        steps.push({ kind: "RELEASE", follower: link.follower });
        // ⚠ NOT pushed to survivors, and NOT baselined: the link is about to cease to exist.
        moved = true;
        continue;
      }
      // ⭐ `FOLLOW`. The delta is a WORLD rotation, so it composes on the left.
      // ⚠ `PioneerTurn.delta` is typed `Quat | null` across all three verdicts, so it is
      // CHECKED rather than asserted — a `!` here would be an assertion about another
      // module's invariant, and this file would not notice if that invariant changed.
      if (turn.delta === null) {
        survivors.push(link);
        continue;
      }
      steps.push({ kind: "ROTATE", follower: link.follower, delta: turn.delta });
      const before = now(link.follower);
      if (before !== null) pose.set(link.follower, qmul(turn.delta, before));
      // ⛔⛔ RE-BASELINED IMMEDIATELY, inside the pass. ⚠ Without this the same turn would be
      // re-applied on every subsequent pass and the body would spin away — the fixed point
      // would never be reached and the cap would silently truncate it.
      survivors.push({ ...link, baseline: pioneerNow });
      baselines.set(link.follower, pioneerNow);
      // ⭐ THIS is what makes it cascade: `link.follower` has moved, so anything aligned to it
      // sees a changed Pioneer on the next pass.
      moved = true;
    }
    pending = survivors;
    if (!moved) break;
  }

  // ⭐ Everything still pending is baselined against what its Pioneer looks like now, so a turn
  // is never counted twice. ⚠ Including the `NONE` cases, where it is a no-op by construction.
  for (const link of pending) {
    const pioneerNow = now(link.pioneer);
    if (pioneerNow !== null) baselines.set(link.follower, pioneerNow);
  }
  return { steps, baselines };
}

/**
 * ⭐⭐⭐ **THE LINK LIST THE RESOLVER EATS, BUILT FROM THE INDEX.**
 *
 * ⛔⛔ **IT WAS AN INLINE `flatMap` IN `render/scene.ts` UNTIL 2026-09-17**, and an audit found
 * what that cost: `tests/pioneer_release_wiring.test.ts` had to RE-TYPE the assembly to test it,
 * and its copy gave **one mode to every link** while the product reads `alignModeOf` per link.
 * ⚠ So the test that existed to prove the wiring could not have caught a wiring defect in the
 * one field the wiring is about — a harness that recomputes what the product computed is a
 * second implementation that can silently disagree.
 *
 * ⭐ `METHOD`, and this module's own header: *a RULE in a render file is a rule nothing can
 * interrogate.* The resolver was extracted for that reason; the thing that FEEDS it had stayed
 * behind.
 *
 * ⛔ The default matters and is stated here rather than at the call site: a body whose mode has
 * been forgotten is treated as **`SNAPSHOT`**, the reading that RELEASES rather than the one
 * that keeps rotating something. ⚠ A lost mode must fail safe toward *let go*.
 *
 * @param aligned every body that carries an alignment — `AlignmentLinks.alignedObjects()`.
 * @param pioneerOf that body's Pioneer and the baseline it was last seen at. ⚠ The orientation
 *   is a WORLD one; see `PioneerRef.orientation`.
 * @param modeOf what the alignment MEANS for that body, or `undefined` if it is not known.
 */
export function followerLinksFrom(
  aligned: readonly ObjectId[],
  pioneerOf: (follower: ObjectId) => { readonly objectId: ObjectId; readonly orientation: Quat } | null,
  modeOf: (follower: ObjectId) => AlignMode | undefined,
): FollowerLink[] {
  const out: FollowerLink[] = [];
  for (const follower of aligned) {
    const ref = pioneerOf(follower);
    // ⚠ A body listed as aligned whose link has gone is skipped, not defaulted: the two are
    // reconciled every frame by `prune`, and inventing a Pioneer here would outlive it.
    if (ref === null) continue;
    out.push({
      follower,
      pioneer: ref.objectId,
      baseline: ref.orientation,
      mode: modeOf(follower) ?? "SNAPSHOT",
    });
  }
  return out;
}


/** One body's link, for the TRANSLATION cascade. ⭐ `D69`'s mirror of `FollowerLink`. */
export interface FollowerMoveLink {
  readonly follower: ObjectId;
  readonly pioneer: ObjectId;
  /** Where the Pioneer was when this link was last settled. */
  readonly baseline: Vec3;
  /**
   * ⭐⭐ `D70` — the MODE, which `D69` deliberately left out and was wrong to. ⛔ A `SNAPSHOT` is
   * a copy taken once: when the Pioneer's pose changes the copy is stale, whether the change was
   * a turn or a move.
   */
  readonly mode: AlignMode;
}

/** What a translated Pioneer owes one Follower. ⭐ `D70`: the same two outcomes a turn has. */
export type MoveStep =
  | { readonly kind: "RELEASE"; readonly follower: ObjectId }
  | { readonly kind: "TRANSLATE"; readonly follower: ObjectId; readonly delta: Vec3 };

export interface MovePlan {
  readonly steps: readonly MoveStep[];
  readonly baselines: ReadonlyMap<ObjectId, Vec3>;
}

/**
 * ⭐⭐⭐ **`D69` — A TRANSLATED PIONEER CARRIES EVERY FOLLOWER, DOWN THE CHAIN.**
 *
 * > *"Currently, if in rotation mode, a rotation of the pioneer controls the same rotation of
 * > all the orange follower objects. Do the same with translation: a translation of pioneer
 * > controls the same translation of all the follower objects."* — the owner, 2026-09-21
 *
 * ⛔⛔ **ALL FOLLOWERS, NOT ONLY THE ORANGE ONES — AND THAT IS THE OWNER'S OWN CONTRAST.** The
 * sentence names *"all the **orange** follower objects"* for the rotation and *"all the follower
 * objects"* for the translation, one clause apart. ⭐ It is also the reading that makes `D67`'s
 * multi-select worth having: several bodies chosen in one hold move as a group.
 * ⚠ And it costs nothing geometrically — `SNAPSHOT` versus `FOLLOW` is a statement about what a
 * **turn** costs, and `FACE_ALIGN` constrains a normal, which no translation can disturb.
 *
 * ⭐⭐ **A STATE COMPARISON, EXACTLY LIKE `resolvePioneerTurns`.** Each link remembers where its
 * Pioneer was; the delta is *where it is now* minus that. ⛔ Not a delta routed from the gesture:
 * a Pioneer may move by a finger, by depth, by a snap or by ITS own Pioneer, and a rule that
 * listened to one of those would silently miss the others — which is the *substituted quantity*
 * shape this project keeps paying for.
 *
 * ⭐ Chains fall out of the passes: a Follower moved in pass 1 is a Pioneer whose position has
 * changed, so pass 2 sees it. ⚠ The pass cap is `links + 1`, as the turn cascade's is, so a ring
 * cannot spin forever — `AlignmentLinks.link` refuses cycles, and this refuses to depend on it.
 *
 * ⚠ A Pioneer whose position cannot be read leaves its link untouched: *suppress, do not guess*.
 */
export function resolvePioneerMoves(
  linksIn: readonly FollowerMoveLink[],
  positionOf: (id: ObjectId) => Vec3 | null,
): MovePlan {
  const steps: MoveStep[] = [];
  const baselines = new Map<ObjectId, Vec3>();
  const pose = new Map<ObjectId, Vec3>();
  const now = (id: ObjectId): Vec3 | null => pose.get(id) ?? positionOf(id);
  let pending = linksIn.map((l) => ({ ...l }));
  const cap = linksIn.length + 1;
  for (let pass = 0; pass < cap; pass++) {
    let moved = false;
    const survivors: typeof pending = [];
    for (const link of pending) {
      const pioneerNow = now(link.pioneer);
      if (pioneerNow === null) {
        survivors.push(link);
        continue;
      }
      // ⛔⛔ THE DECISION IS `pioneerMoved`'s, beside `pioneerTurned`, so the two channels of
      // ONE question — *what does a Pioneer's pose change cost this Follower?* — cannot drift.
      const move = pioneerMoved(link.baseline, pioneerNow, link.mode);
      if (move.kind === "NONE") {
        survivors.push(link);
        continue;
      }
      if (move.kind === "RELEASE") {
        // ⭐ `D70`: a cyan alignment is a copy taken once, and a moved Pioneer makes it stale.
        // ⚠ No baseline is recorded: the link is about to go, and writing to it would leave the
        // index describing a relation that no longer exists.
        steps.push({ kind: "RELEASE", follower: link.follower });
        moved = true;
        continue;
      }
      const delta = move.delta!;
      steps.push({ kind: "TRANSLATE", follower: link.follower, delta });
      baselines.set(link.follower, pioneerNow);
      const followerNow = now(link.follower);
      if (followerNow !== null) {
        pose.set(link.follower, [
          followerNow[0] + delta[0],
          followerNow[1] + delta[1],
          followerNow[2] + delta[2],
        ]);
      }
      moved = true;
    }
    pending = survivors;
    if (!moved || pending.length === 0) break;
  }
  return { steps, baselines };
}

/** ⭐ `D69` — the move cascade's input, built from the same index the turn cascade reads. */
export function followerMoveLinksFrom(
  aligned: readonly ObjectId[],
  pioneerOf: (follower: ObjectId) => { readonly objectId: ObjectId; readonly position: Vec3 } | null,
  modeOf: (follower: ObjectId) => AlignMode | undefined,
): FollowerMoveLink[] {
  const out: FollowerMoveLink[] = [];
  for (const follower of aligned) {
    const ref = pioneerOf(follower);
    if (ref === null) continue;
    // ⚠ `SNAPSHOT` is the default for a body whose mode was never recorded, exactly as the turn
    // cascade assumes: the weaker relation is the safe one to assume.
    out.push({
      follower,
      pioneer: ref.objectId,
      baseline: ref.position,
      mode: modeOf(follower) ?? "SNAPSHOT",
    });
  }
  return out;
}
