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
 * ⛔ The orange half is history: `FOLLOW` is deleted (`D106`), so a turned Pioneer now only
 * RELEASES its unseated followers, and a seated one is carried by the tree.
 *
 * ⛔⛔⛔ **THIS EXISTS BECAUSE THE RULE WAS UNTESTABLE WHERE IT LIVED.** It was a loop inside
 * `render/scene.ts`, so no vector could reach it — and when a hand reported *"the release of
 * the cyan follower objects by the rotation of the pioneer is not working"* there was **no way
 * to ask the code what it thought**, only to re-read it. ⚠ That is the real defect: a RULE in a
 * render file is a rule nothing can interrogate. ⭐ `METHOD`: *a composition is a thing to
 * MEASURE* — and a cascade is a composition of the worst kind, because its output feeds its
 * own input.
 *
 * ⭐⭐ **ONE CALL, ONE PASS.** With nothing rotated by the cascade any more, no follower's pose
 * changes during the resolve, so a single pass over the links settles them all.
 *
 * ⛔ ENGINE-FREE. It reads orientations through a callback and returns a PLAN; it moves nothing.
 */
import type { ObjectId } from "../core/object_model";
import type { Quat, Vec3 } from "../core/vec";
import { pioneerMoved, pioneerTurned } from "./alignment";

/** One follower's link, as this resolver needs it. */
export interface FollowerLink {
  readonly follower: ObjectId;
  readonly pioneer: ObjectId;
  /**
   * ⭐ A SEATED follower is carried by the tree, never released by this rule — but its baseline is
   * still REFRESHED, or the moment its seat ends (an unsnap) the stale baseline reads as *the Pioneer
   * turned* and the alignment is released too. ⛔ It was skipped outright, baseline and all.
   */
  readonly seated?: boolean;
  /** The Pioneer's orientation as this follower last saw it. */
  readonly baseline: Quat;
}

/** ⭐ The alignment goes, and **the body does not move** (`D41`'s C1; C2 went with `FOLLOW`, `D106`). */
export type CascadeStep = { readonly kind: "RELEASE"; readonly follower: ObjectId };

export interface CascadePlan {
  /** In the order they must be applied. */
  readonly steps: readonly CascadeStep[];
  /** Follower → the Pioneer pose it should now be baselined against. */
  readonly baselines: ReadonlyMap<ObjectId, Quat>;
}

/**
 * ⭐⭐⭐ **RESOLVE EVERY CONSEQUENCE OF EVERY PIONEER'S CURRENT POSE.**
 *
 * ⭐ One pass: a turned Pioneer releases each UNSEATED follower; every other link is re-baselined.
 * ⚠ It was a capped fixed point while `FOLLOW` rotated followers (a rotated follower was a
 * Pioneer whose pose had changed); since `D106` nothing here moves a body.
 *
 * @param orientationOf the CURRENT world orientation of a body, or `null` if it is gone.
 */
export function resolvePioneerTurns(
  linksIn: readonly FollowerLink[],
  orientationOf: (id: ObjectId) => Quat | null,
): CascadePlan {
  // ⭐ Since `D106` nothing moves a follower here, so one pass settles every link: a turned
  // Pioneer releases its (unseated) followers, and every other link is re-baselined.
  const steps: CascadeStep[] = [];
  const baselines = new Map<ObjectId, Quat>();
  for (const link of linksIn) {
    const pioneerNow = orientationOf(link.pioneer);
    if (pioneerNow === null) continue;
    if (!link.seated && pioneerTurned(link.baseline, pioneerNow).kind === "RELEASE") {
      steps.push({ kind: "RELEASE", follower: link.follower });
      continue;
    }
    baselines.set(link.follower, pioneerNow);
  }
  return { steps, baselines };
}

/**
 * ⭐⭐⭐ **THE LINK LIST THE RESOLVER EATS, BUILT FROM THE INDEX.**
 *
 * ⛔⛔ **IT WAS AN INLINE `flatMap` IN `render/scene.ts` UNTIL 2026-09-17**, and an audit found
 * what that cost: `tests/pioneer_release_wiring.test.ts` had to RE-TYPE the assembly to test it,
 * and its copy gave **one mode to every link** while the product then read the mode per link
 * (the mode itself is deleted since, `D106`).
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
  /**
   * ⭐⭐ `D100` — a SEATED Follower is carried by the tree, so the cascade must neither rotate it
   * (it already turned with its parent) nor release it (a turned Pioneer keeps its seat).
   */
  isSeated: (follower: ObjectId) => boolean = () => false,
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
      seated: isSeated(follower),
    });
  }
  return out;
}


/** One body's link, for the TRANSLATION cascade. ⭐ `D69`'s mirror of `FollowerLink`. */
export interface FollowerMoveLink {
  readonly follower: ObjectId;
  readonly pioneer: ObjectId;
  /** ⭐ As `FollowerLink.seated`: carried, never released, baseline refreshed. */
  readonly seated?: boolean;
  /** Where the Pioneer was when this link was last settled. */
  readonly baseline: Vec3;
}

/** What a translated Pioneer owes one Follower. ⭐ `D70`: the same two outcomes a turn has. */
export type MoveStep = { readonly kind: "RELEASE"; readonly follower: ObjectId };

export interface MovePlan {
  readonly steps: readonly MoveStep[];
  readonly baselines: ReadonlyMap<ObjectId, Vec3>;
}

/**
 * ⭐⭐⭐ **`D69` → `D70` — WHAT A TRANSLATED PIONEER COSTS ITS FOLLOWERS.** ⛔ Today: a moved
 * Pioneer RELEASES each unseated follower (`D70`), and a seated one rides the tree. What follows
 * is `D69`'s history, when every follower was carried.
 *
 * > *"Currently, if in rotation mode, a rotation of the pioneer controls the same rotation of
 * > all the orange follower objects. Do the same with translation: a translation of pioneer
 * > controls the same translation of all the follower objects."* — the owner, 2026-09-21
 *
 * ⛔⛔ **ALL FOLLOWERS, NOT ONLY THE ORANGE ONES — AND THAT IS THE OWNER'S OWN CONTRAST.** The
 * sentence names *"all the **orange** follower objects"* for the rotation and *"all the follower
 * objects"* for the translation, one clause apart. ⭐ It is also the reading that makes `D67`'s
 * multi-select worth having: several bodies chosen in one hold move as a group.
 * ⚠ And it costs nothing geometrically — `FACE_ALIGN` constrains a normal, which no translation
 * can disturb.
 *
 * ⭐⭐ **A STATE COMPARISON, EXACTLY LIKE `resolvePioneerTurns`.** Each link remembers where its
 * Pioneer was; the delta is *where it is now* minus that. ⛔ Not a delta routed from the gesture:
 * a Pioneer may move by a finger, by depth, by a snap or by ITS own Pioneer, and a rule that
 * listened to one of those would silently miss the others — which is the *substituted quantity*
 * shape this project keeps paying for.
 *
 * ⭐ One pass, as the turn cascade's: nothing here moves a body since `D70`/`D106`.
 *
 * ⚠ A Pioneer whose position cannot be read leaves its link untouched: *suppress, do not guess*.
 */
export function resolvePioneerMoves(
  linksIn: readonly FollowerMoveLink[],
  positionOf: (id: ObjectId) => Vec3 | null,
): MovePlan {
  // ⭐ Since `D106` a moved Pioneer only RELEASES its (unseated) followers; one pass settles it.
  const steps: MoveStep[] = [];
  const baselines = new Map<ObjectId, Vec3>();
  for (const link of linksIn) {
    const pioneerNow = positionOf(link.pioneer);
    if (pioneerNow === null) continue;
    if (!link.seated && pioneerMoved(link.baseline, pioneerNow).kind === "RELEASE") {
      steps.push({ kind: "RELEASE", follower: link.follower });
      continue;
    }
    baselines.set(link.follower, pioneerNow);
  }
  return { steps, baselines };
}

/** ⭐ `D69` — the move cascade's input, built from the same index the turn cascade reads. */
export function followerMoveLinksFrom(
  aligned: readonly ObjectId[],
  pioneerOf: (follower: ObjectId) => { readonly objectId: ObjectId; readonly position: Vec3 } | null,
  /**
   * ⭐⭐ `D100` — a SEATED Follower is carried by the tree, so the cascade must neither rotate it
   * (it already turned with its parent) nor release it (a turned Pioneer keeps its seat).
   */
  isSeated: (follower: ObjectId) => boolean = () => false,
): FollowerMoveLink[] {
  const out: FollowerMoveLink[] = [];
  for (const follower of aligned) {
    const ref = pioneerOf(follower);
    if (ref === null) continue;
    out.push({ follower, pioneer: ref.objectId, baseline: ref.position, seated: isSeated(follower) });
  }
  return out;
}
