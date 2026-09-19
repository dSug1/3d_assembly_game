/**
 * ⭐⭐⭐ **WHO IS ALIGNED TO WHOM — a two-way index, built to scale with the scene.**
 *
 * > *"for each aligned object, track its pioneer object. If the said pioneer object is later
 * > shaken, the alignment of the aligned object shall be released … when I shake the pioneer
 * > object it shall release all the follower objects"* — the owner, 2026-09-17
 *
 * > *"make sure the tracking of pioneer and follower objects can be later scaled when there are
 * > several objects in the scene"* — the owner, same day
 *
 * ⛔⛔ **WHY THIS IS REMEMBERED AT ALL, WHEN ALMOST NOTHING ELSE HERE IS.** A `FACE_ALIGN`
 * stores a **frozen world direction**, not a reference to another body — deliberately, because
 * that is what lets an alignment survive the Pioneer moving away, turning, or being deleted.
 * ⚠ So *"which body did this alignment come from"* is genuinely absent from the model and
 * cannot be derived. It is the one fact that has to be kept.
 *
 * ⭐⭐⭐ **WHAT MAKES IT SCALE: BOTH DIRECTIONS ARE INDEXED.**
 *
 * | question | cost |
 * |---|---|
 * | *what is this follower aligned to, and on which face?* | O(1) |
 * | *which followers does this Pioneer own?* | **O(followers of that Pioneer)** |
 * | *which bodies are aligned at all?* | O(aligned), not O(scene) |
 * | *which Pioneer FACES must be outlined?* | O(aligned), de-duplicated |
 *
 * ⛔⛔ **THE PIONEER *FACE* IS CARRIED TOO** (the owner: *"the pioneerFaces and FollowerFaces
 * tracking shall be scalable"*). ⚠ The FollowerFace needs no storage at all — it is derivable
 * from the constraint's own `localNormal`, which is why `alignedFaceOf` exists. ⭐ The Pioneer
 * face is the opposite case: like the Pioneer's identity, it is **absent from the model** and
 * has to be remembered. ⛔ `pioneerFaces()` returns the distinct pairs, so two followers
 * aligned to the SAME face of the same Pioneer are outlined once, not twice.
 *
 * ⛔ The first implementation kept only `follower → pioneer` and answered the second question
 * by scanning every entry. ⚠ That is fine for three bodies and wrong in shape: the shake
 * handler and the per-frame highlight pass would both have walked the whole scene, and the
 * **render pass is the one that matters** — it runs 60 times a second whatever the hand is
 * doing. ⭐ `alignedObjects()` is what lets the caller iterate the handful of aligned bodies
 * instead of every body in the world.
 *
 * ⛔⛔ **AND A TWO-WAY INDEX IS EXACTLY WHERE A LEAK HIDES**: the forward map is easy and the
 * reverse set is the one a re-align or an unlink forgets to update. ⚠ Every vector in
 * `tests/alignment_links.test.ts` that looks redundant is checking the reverse side.
 *
 * ⛔ ENGINE-FREE, and world-free: `prune` takes a PREDICATE rather than a `World`, so the one
 * piece of lifetime management has no dependency to go stale.
 */
import type { FaceId, ObjectId } from "./object_model";
import type { Quat } from "./vec";

/** What a follower's alignment points at. ⚠ None of it is recoverable from the model. */
export interface PioneerRef {
  readonly objectId: ObjectId;
  readonly faceId: FaceId;
  /**
   * ⭐⭐⭐ **THE PIONEER'S ORIENTATION AS LAST SEEN BY THIS FOLLOWER** — the baseline the
   * *"did the Pioneer turn?"* test compares against.
   *
   * ⛔⛔ **PER LINK, NOT ONE GLOBAL BASELINE, AND THAT IS WHAT MAKES CHAINS WORK.** The owner,
   * 2026-09-17: *"while the initial follower object is blue, if the pioneer object is rotated
   * because it is aligned with another object, the alignment of the initial follower object
   * shall be released."* ⭐ A `FOLLOW` body rotates when ITS pioneer turns; anything aligned to
   * it in `SNAPSHOT` must then release. ⚠ With a single baseline only the ACTIVE alignment was
   * watched, so a chain was invisible.
   *
   * ⭐⭐ **AND WATCHING THE ORIENTATION IS CAUSE-AGNOSTIC, which is the whole reason the rule
   * is expressed this way**: a finger, a twist, a rotation reset, a slerp, or another
   * alignment's `FOLLOW` all move the Pioneer, and comparing poses catches every one without
   * enumerating them. ⛔ The same discipline as `A15`'s raycast: *ask the state, not the
   * gesture.*
   *
   * ⛔⛔ **IT IS A *WORLD* ORIENTATION, THROUGH THE PARENT CHAIN — NOT `local`.** An audit on
   * 2026-09-17 found the scene writing `local.orientation` here while `resolvePioneerTurns`
   * compared it against `worldPlacementOf(…).orientation`. ⚠ The two agree exactly while every
   * body is unparented, which is the whole scene before `3D2` — so the defect is silent today
   * and fires on the first assembly: a parented Pioneer reads as *turned* by its parent's whole
   * orientation on the very first frame, releasing every `SNAPSHOT` follower and spinning every
   * `FOLLOW` one, with nothing having moved. ⭐ Said in the type, because *"an orientation"* is
   * not one quantity.
   */
  readonly orientation: Quat;
}

export class AlignmentLinks {
  /** follower → its Pioneer object AND face. ⭐ One alignment per body, so a plain map. */
  private readonly forward = new Map<ObjectId, PioneerRef>();
  /** Pioneer OBJECT → its followers. ⚠ Kept in step with `forward` by `link`/`unlink` ONLY. */
  private readonly reverse = new Map<ObjectId, Set<ObjectId>>();

  /**
   * ⭐⭐ Record that `follower` is aligned to `pioneer`.
   *
   * ⛔ **RE-ALIGNING MOVES THE LINK, it does not add a second one.** A body has at most one
   * alignment (`singleAlignment`'s cap), so aligning it to a new Pioneer must remove it from
   * the old Pioneer's set. ⚠ Forgetting that is the classic two-way-index leak: shaking the
   * OLD Pioneer would then release a body that is no longer aligned to it.
   */
  link(
    follower: ObjectId,
    pioneer: ObjectId,
    pioneerFace: FaceId,
    /** ⛔ The Pioneer's **WORLD** orientation — see `PioneerRef.orientation`. Never `local`. */
    pioneerOrientation: Quat,
  ): boolean {
    // ⛔⛔⛔ **THE CYCLE CHECK LIVES HERE, NOT AT THE CALL SITE — AUDIT, 2026-09-17.**
    //
    // ⚠⚠ This class's header claimed `wouldCycle` *"makes the state unrepresentable"*. It did
    // not: it made the state DETECTABLE, and only for a caller that remembered to ask. ⛔ The
    // proof was in this module's own suite, where a vector built `a→b` then `b→a` through the
    // public API to check the walk did not hang — constructing the illegal state to test the
    // detector for it.
    // ⭐⭐ `object_model.ts` already argues the general form for `frozen`: *a constraint
    // enforced at the one place the quantity is stored is an INVARIANT; enforced anywhere else
    // it is a convention, and the next caller added will not know about it.* A cycle here is
    // worse than a wrong pose — `resolvePioneerTurns` is a fixed point over these links, so a
    // ring of `FOLLOW` bodies takes each other's rotation for ever and the glass FREEZES.
    // ⚠ The resolver's cap and the walk's own `seen` set both stay: they are now defence in
    // depth rather than the only defence.
    //
    // ⛔ **BEFORE `unlink`, which is the whole subtlety.** `link` MOVES a link rather than
    // adding one, so it begins by unlinking the follower — and a refusal that had already run
    // that unlink would destroy a perfectly good alignment as a side effect of rejecting a
    // different one. ⭐ Refused means *nothing happened*, not *nearly happened*.
    //
    // ⚠ The POLICY for what a cycling tap should do instead — the owner's *"the tap shall
    // instead break the initial alignment"* — is the caller's, and `render/scene.ts` still asks
    // `wouldCycle` first to carry it out. This is the floor under that policy, not a
    // replacement for it.
    if (this.wouldCycle(follower, pioneer)) return false;
    this.unlink(follower);
    this.forward.set(follower, {
      objectId: pioneer,
      faceId: pioneerFace,
      orientation: pioneerOrientation,
    });
    let set = this.reverse.get(pioneer);
    if (set === undefined) {
      set = new Set<ObjectId>();
      this.reverse.set(pioneer, set);
    }
    set.add(follower);
    return true;
  }

  /** ⭐ Forget a follower's alignment. ⚠ Safe to call for a body that has none. */
  unlink(follower: ObjectId): void {
    const previous = this.forward.get(follower);
    if (previous === undefined) return;
    this.forward.delete(follower);
    // ⚠ The reverse index is keyed by the Pioneer OBJECT, never by the face — the shake rule
    // acts on a body, and a body's faces must not each own a separate follower set.
    const set = this.reverse.get(previous.objectId);
    if (set === undefined) return;
    set.delete(follower);
    // ⚠ Drop the empty set rather than leaving it: otherwise `reverse` grows to one entry per
    // body that has EVER been a Pioneer, which is the slow leak this class exists to avoid.
    if (set.size === 0) this.reverse.delete(previous.objectId);
  }

  /** The Pioneer object AND face this body is aligned to, or `null`. */
  pioneerFor(follower: ObjectId): PioneerRef | null {
    return this.forward.get(follower) ?? null;
  }

  /**
   * ⭐⭐ Re-baseline a follower's view of its Pioneer, after the turn has been accounted for.
   *
   * ⚠ Called EVERY frame for every link, so it must be cheap and must not allocate a new link.
   * ⛔ A follower that has no link is ignored rather than created — a `noteOrientation` that
   * could bring a link into being would be a second, silent `link`.
   */
  noteOrientation(follower: ObjectId, orientation: Quat): void {
    const ref = this.forward.get(follower);
    if (ref === undefined) return;
    this.forward.set(follower, { ...ref, orientation });
  }

  /**
   * ⭐⭐⭐ **THE DISTINCT PIONEER FACES TO OUTLINE** — one entry per face, however many
   * followers point at it.
   *
   * ⛔ De-duplicated on purpose: two bodies aligned to the SAME face of the same Pioneer must
   * not stack two contours on it. ⚠ At one pixel wide they would be indistinguishable from
   * one, so the bug would be invisible until the day the markers gained a width or an alpha.
   */
  pioneerFaces(): PioneerRef[] {
    // ⚠ Keyed on object+face ONLY. ⛔ Including the orientation would defeat the de-duplication
    // the moment two followers' baselines drifted apart by a single frame, and two contours
    // would stack on one face again.
    const seen = new Map<string, PioneerRef>();
    for (const ref of this.forward.values()) {
      seen.set(`${ref.objectId}\u0000${ref.faceId}`, ref);
    }
    return [...seen.values()];
  }

  /**
   * ⭐⭐⭐ **WHO MAY THIS BODY APPROACH?** — the capture restriction, from the index that owns
   * both directions of the relation.
   *
   * > *"the white highlight should be reserved only for Pioneer-Follower duo."*
   * > — the owner, 2026-09-19
   *
   * ⭐⭐ **A FOLLOWER'S ANSWER IS ITS PIONEER; A PIONEER'S IS ITS FOLLOWERS; ANYONE ELSE GETS
   * NOTHING.** ⛔ The empty answer is the rule, not an omission: an unaligned body has no duo, so
   * it has nothing to approach.
   *
   * ⛔⛔ **IT LIVES HERE BECAUSE IT WAS IN `scene.ts` AND A MUTANT PROVED THAT WAS WRONG.** The
   * first build restricted only the Follower and let a **Pioneer** fall through to the whole
   * scene — which is the defect the owner reported — and reintroducing that defect left all 944
   * vectors green, because the lookup was a lambda in the render file. ⭐ `pioneer_cascade.ts`'s
   * standing rule: *a RULE in a render file is a rule nothing can interrogate.*
   *
   * ⚠ A body cannot be both a Follower and a Pioneer's partner in one answer — the branch is
   * exclusive, and that is deliberate: a body that follows something is approaching **that**,
   * whatever else happens to follow it.
   */
  partnersOf(id: ObjectId): ObjectId[] {
    const p = this.pioneerFor(id);
    return p !== null ? [p.objectId] : this.followersOf(id);
  }

  /**
   * ⭐⭐⭐ **EVERY FOLLOWER OF THIS PIONEER** — the owner's *"release all the follower objects"*.
   *
   * ⚠ Returned as a NEW array, deliberately: the caller releases these, and releasing mutates
   * the index. ⛔ Handing back the live `Set` would have the caller deleting from the
   * collection it is iterating, which in JS silently skips entries rather than throwing.
   */
  followersOf(pioneer: ObjectId): ObjectId[] {
    const set = this.reverse.get(pioneer);
    return set === undefined ? [] : [...set];
  }

  /** ⭐ Every body that carries an alignment. ⚠ A copy, for the same reason as above. */
  alignedObjects(): ObjectId[] {
    return [...this.forward.keys()];
  }

  /**
   * ⭐⭐⭐ **WOULD LINKING `follower → pioneer` CLOSE A CYCLE?**
   *
   * > *"a follower cannot become the pioneer of its own pioneer. in such case, the tap
   * > triggering this configuration shall instead break the initial alignment"* — the owner,
   * 2026-09-17
   *
   * ⛔⛔ **IT WALKS THE WHOLE PIONEER CHAIN, NOT JUST ONE STEP.** The owner named the
   * two-body case — `F` aligned to `P`, then `P` aligned to `F` — which is the one a hand
   * reaches by accident. ⚠ But `F → P1 → P2` then `P2 → F` is the same defect one link
   * further out, and a one-step check would wave it through.
   *
   * ⭐⭐ **AND A CYCLE IS NOT A COSMETIC PROBLEM.** `resolvePioneerTurns` is a fixed point over
   * these links: a cycle of `FOLLOW` bodies would each take the other's rotation, for ever.
   * ⛔ That is why the resolver is capped — the cap stops a hung render loop, which is the
   * worst failure this project can ship because the glass simply freezes with no error.
   * ⭐ This method makes the state **unrepresentable** instead, which is the better half of the
   * defence: `METHOD`'s *prefer the structure that cannot express the defect.* ⚠ The cap stays
   * anyway — two guards against a frozen screen is not one too many.
   *
   * ⛔⛔ **AND SINCE 2026-09-17 `link` CALLS THIS ITSELF, WHICH IS WHAT MAKES THE SENTENCE
   * ABOVE TRUE.** It was written when the only caller was `render/scene.ts`, so the guarantee
   * was really *"unrepresentable, provided every caller remembers to ask"* — a convention, not
   * an invariant. ⚠ An audit found this module's own suite building `a→b→a` through the public
   * API to test that the walk does not hang.
   *
   * ⚠ `follower === pioneer` answers `true`: a body aligned to itself is the degenerate cycle.
   */
  wouldCycle(follower: ObjectId, pioneer: ObjectId): boolean {
    let at: ObjectId | null = pioneer;
    // ⛔ A pre-existing cycle must not hang THIS walk either — the guard cannot assume the
    // invariant it exists to maintain.
    const seen = new Set<ObjectId>();
    while (at !== null) {
      if (at === follower) return true;
      if (seen.has(at)) return false;
      seen.add(at);
      at = this.pioneerFor(at)?.objectId ?? null;
    }
    return false;
  }

  /** ⚠ Diagnostics only — how many links are held. */
  get size(): number {
    return this.forward.size;
  }

  /**
   * ⭐⭐⭐ **RECONCILE AGAINST THE MODEL** — the only lifetime rule, and it runs every frame.
   *
   * ⛔⛔ THIS IS WHAT KEEPS A REMEMBERED FACT HONEST. The constraint stack is authoritative: a
   * shake, a re-tap, a rotation reset or an eviction can drop an alignment through paths this
   * class never sees. ⭐ So rather than asking every one of them to call `unlink`, the index is
   * checked against the model each frame and anything the model no longer supports is dropped.
   * ⚠ `METHOD`: *prefer the structure that cannot express the defect* — a link cannot outlive
   * its constraint, because its existence is re-justified continuously.
   *
   * @param isStillAligned asked of each follower. ⚠ A PREDICATE, not a `World`, so this file
   *   stays free of the object model's shape and the check can be vectored without one.
   * @returns the followers that were dropped, so the caller can retire whatever it drew for
   *   them. ⭐ Returning them is what lets the render pass avoid a second sweep.
   */
  prune(isStillAligned: (follower: ObjectId) => boolean): ObjectId[] {
    const dropped: ObjectId[] = [];
    // ⚠ Snapshot the keys first — `unlink` mutates `forward`.
    for (const follower of [...this.forward.keys()]) {
      if (isStillAligned(follower)) continue;
      this.unlink(follower);
      dropped.push(follower);
    }
    return dropped;
  }
}
