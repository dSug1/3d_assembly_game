/**
 * ⭐⭐⭐ **THE PIONEERFACECURSORS** — the owner, 2026-09-25: *"when aligning, create an object
 * PioneerFaceCursor: it shall be a green ring and it shall be placed at the center of the
 * PioneerFace by default. Destroy it … when un-alignment occurs and this PioneerFace is
 * cancelled."*
 *
 * ## ⛔⛔ ONE CURSOR PER ALIGNMENT, KEYED BY THE WHOLE COUPLE
 *
 * > *"there can be several PioneerFaceCursors (if the pioneer object is pioneer for several
 * > follower objects) and they can also have the same position (if the same pioneerface is
 * > shared for several followers)"*
 *
 * ⭐ So a cursor is NOT one per Pioneer face (`AlignmentLinks.pioneerFaces()` de-duplicates, which
 * is right for a contour and wrong here): two Followers on one face own two cursors at one
 * position. ⭐⭐ And the key is the full **follower + FollowerFace + pioneer + PioneerFace**
 * couple, not the follower alone: *"if a follower object aligned another followerface, the
 * PioneerFaceCursor shall be properly tracked"* — a re-align on another face (either side) is a
 * different couple, so the old cursor is destroyed and a new one is made at the new face.
 *
 * ## ⭐⭐ RECONCILED, NEVER NOTIFIED
 *
 * `reconcile` takes the couples that exist NOW (derived from the model every frame) and returns
 * what to create and what to destroy. ⛔ No release path has to remember to call anything — the
 * 2026-09-17 lesson (*retire by membership, never by what a path happened to report*): a shake, a
 * re-tap, a turned Pioneer, a prune or a swap all retire the cursor the same way, by its couple no
 * longer being in the set.
 *
 * ⭐ A surviving cursor is the SAME object across frames, so its position — the Pioneer face's
 * centre *by default*, in the Pioneer's LOCAL frame — can later be moved and will persist.
 *
 * ⚠ The owner then corrected the colour: *"the ring shall be amber instead of green"*.
 *
 * ⛔ ENGINE-FREE. The render layer owns the meshes and disposes what `destroyed` names.
 */
import type { FaceId, ObjectId } from "./object_model";
import type { Vec3 } from "./vec";

/** ⭐ One live alignment, as the cursor sees it. */
export interface AlignmentCouple {
  readonly followerId: ObjectId;
  readonly followerFaceId: FaceId;
  readonly pioneerId: ObjectId;
  readonly pioneerFaceId: FaceId;
}

export interface PioneerFaceCursor extends AlignmentCouple {
  /** ⭐ The couple's key — unique per cursor, even when two cursors share a position. */
  readonly key: string;
  /** ⭐ Where it sits, in the PIONEER's local frame. Starts at the PioneerFace centre. */
  position: Vec3;
  /** ⭐ The PioneerFace normal, local — the ring lies in the face's plane. */
  readonly normal: Vec3;
}

/** ⚠ `\u0000` separated: ids are free strings, and `a/b` + `c` must not equal `a` + `b/c`. */
export function coupleKey(c: AlignmentCouple): string {
  return [c.followerId, c.followerFaceId, c.pioneerId, c.pioneerFaceId].join(
    "\u0000",
  );
}

/** ⭐ A local face centre and normal, or `null` when the face cannot be read yet. */
export type FaceFrameOf = (
  objectId: ObjectId,
  faceId: FaceId,
) => { readonly centre: Vec3; readonly normal: Vec3 } | null;

export interface CursorChanges {
  readonly created: PioneerFaceCursor[];
  readonly destroyed: PioneerFaceCursor[];
}

export class PioneerFaceCursors {
  private readonly byKey = new Map<string, PioneerFaceCursor>();

  /**
   * ⭐⭐⭐ Make the cursor set equal to `couples`. ⚠ A couple whose face cannot be read is NOT
   * created and is retried on the next call, rather than being given a stand-in position.
   */
  reconcile(
    couples: readonly AlignmentCouple[],
    faceFrameOf: FaceFrameOf,
  ): CursorChanges {
    const want = new Map<string, AlignmentCouple>();
    for (const c of couples) want.set(coupleKey(c), c);

    const destroyed: PioneerFaceCursor[] = [];
    for (const [key, cur] of this.byKey) {
      if (want.has(key)) continue;
      destroyed.push(cur);
    }
    // ⚠ Deleted after the walk, not during it.
    for (const cur of destroyed) this.byKey.delete(cur.key);

    const created: PioneerFaceCursor[] = [];
    for (const [key, c] of want) {
      if (this.byKey.has(key)) continue;
      const frame = faceFrameOf(c.pioneerId, c.pioneerFaceId);
      if (frame === null) continue;
      const cur: PioneerFaceCursor = {
        followerId: c.followerId,
        followerFaceId: c.followerFaceId,
        pioneerId: c.pioneerId,
        pioneerFaceId: c.pioneerFaceId,
        key,
        position: [frame.centre[0], frame.centre[1], frame.centre[2]],
        normal: [frame.normal[0], frame.normal[1], frame.normal[2]],
      };
      this.byKey.set(key, cur);
      created.push(cur);
    }
    return { created, destroyed };
  }

  /** ⭐ The live cursors. ⚠ A copy — the caller may reconcile while holding it. */
  all(): PioneerFaceCursor[] {
    return [...this.byKey.values()];
  }

  /** ⭐ The cursor of one follower's alignment, or `null` — a follower has at most one. */
  ofFollower(followerId: ObjectId): PioneerFaceCursor | null {
    for (const cur of this.byKey.values())
      if (cur.followerId === followerId) return cur;
    return null;
  }

  get size(): number {
    return this.byKey.size;
  }
}
