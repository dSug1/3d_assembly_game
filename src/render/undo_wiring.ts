/**
 * ⭐⭐⭐ `D111` — **THE UNDO, WIRED**: a snapshot at the start of every gesture, an entry at its
 * end when the model changed, and a restore on a double tap on a body.
 *
 * ⛔ The decisions are `core/undo_history.ts`'s (what an action is, whether it changed anything);
 * this file only reads the scene's state into a snapshot and writes one back — the 2026-09-19
 * lesson, *a rule written in the render layer is a rule nothing can interrogate*.
 */
import type { ObjectId } from "../core/object_model";
import type { LinksSnapshot } from "../core/alignment_links";
import { coupleKey, type PioneerFaceCursor } from "../core/pioneer_face_cursors";
import { bodiesTouched, modelsDiffer, undoAllowedOn, type CursorsState, type LinksState, type ModelSnapshot } from "../core/undo_history";
import type { World } from "../core/object_model";
import { syncPioneerCursors } from "./markers";
import type { SceneState } from "./scene_state";

/** Everything an action can change — the model and the three indexes beside it. */
export interface SceneSnapshot {
  readonly world: World;
  readonly links: LinksSnapshot;
  readonly cursors: readonly PioneerFaceCursor[];
  readonly heldOff: readonly string[];
  /** ⭐ `D141`: the bodies the action this snapshot precedes TOUCHED — set when the action is recorded. */
  readonly touched?: readonly ObjectId[];
}

export function takeSnapshot(st: SceneState): SceneSnapshot {
  return {
    // ⭐ `World` is immutable — every rule writes a NEW one — so the reference IS the snapshot.
    world: st.world,
    links: st.links.snapshot(),
    cursors: st.pioneerCursors.snapshot(),
    heldOff: st.snapArming.snapshot(),
  };
}

function plain(s: SceneSnapshot): ModelSnapshot<LinksState, CursorsState, unknown> {
  return {
    world: s.world,
    links: {
      forward: s.links.forward.map(([f, ref]) => [f, ref.objectId, ref.faceId] as const),
      seated: s.links.seated,
    },
    cursors: s.cursors.map((c) => [c.key, c.position] as const),
    heldOff: s.heldOff,
  };
}

/** ⭐ The first pointer down: remember the model as it stands. */
export function beginGesture(st: SceneState): void {
  st.gestureBefore = takeSnapshot(st);
  st.gestureUndid = false;
}

/**
 * ⭐ The last pointer up: an ACTION if the model changed. ⛔ Not when the gesture WAS an undo —
 * recording the undo as an action would make the next double tap redo it.
 */
export function endGesture(st: SceneState): void {
  const before = st.gestureBefore;
  st.gestureBefore = null;
  if (before === null || st.gestureUndid) return;
  const after = takeSnapshot(st);
  // ⭐ `D141`: remembered WITH the entry, so a double tap can ask whether it names a body that moved.
  if (modelsDiffer(plain(before), plain(after)))
    st.undo.push({ ...before, touched: bodiesTouched(plain(before), plain(after)) });
}

/**
 * ⭐⭐ **THE RESTORE.** The model is authoritative — the render loop re-reads it every frame — so
 * writing the old `World` back is what moves the bodies; the damped followers carry them there.
 *
 * ⛔ In-flight animations are CANCELLED first: a slerp or a seat lerp still running would write
 * the pose it was chasing straight back over the restored one.
 * ⛔ Every unseated couple is HELD OFF from snapping (`SnapArming`, re-armed once it leaves the
 * radius): undoing a snap puts the Follower back where it was, often still inside the radius, and
 * the snap would otherwise fire again on the next frame.
 */
export function undoLast(st: SceneState, tapped: ObjectId | null = null): boolean {
  // ⭐⭐ `D141`: a double tap undoes only on a body the last action MOVED — asked on the entry left in
  // place, so a refused undo loses nothing.
  const top = st.undo.peek();
  if (top !== null && tapped !== null && !undoAllowedOn(tapped, top.touched ?? [])) {
    st.lastVerdict = `undo: refused — the last action moved ${(top.touched ?? []).join(", ") || "nothing"}, not ${tapped}`;
    st.hudDirty = true;
    return false;
  }
  const s = st.undo.pop();
  if (s === null) {
    st.lastVerdict = "undo: nothing to undo";
    st.hudDirty = true;
    return false;
  }
  const ids: ObjectId[] = [...st.meshOf.keys()];
  for (const id of ids) {
    st.alignSnaps.cancel(id);
    st.seatSnaps.cancel(id);
    st.rotationFollower.cancel(id);
    st.rotationTally.clear(id);
    // ⭐ The restore is a DECLARED discontinuity; the jump readout is for undeclared ones.
    st.jumpWatch.forget(id);
  }
  st.unsnapDetectors.clear();
  st.world = s.world;
  st.links.restore(s.links);
  // ⚠ The rings are MESHES made on reconcile: clear them all, let the reconcile rebuild the set the
  // restored links name, then put each ring back where the snapshot had it (Free Flow drags it).
  for (const m of st.pioneerCursorMeshes.values()) m.dispose(false, false);
  st.pioneerCursorMeshes.clear();
  st.pioneerCursors.restore([]);
  syncPioneerCursors(st);
  for (const c of s.cursors) {
    const now = st.pioneerCursors.get(c.key);
    if (now !== null) now.position = [c.position[0], c.position[1], c.position[2]];
  }
  st.snapArming.restore(s.heldOff);
  for (const c of st.pioneerCursors.all())
    if (!st.links.isSeated(c.followerId)) st.snapArming.holdOff(coupleKey(c));
  st.gestureUndid = true;
  st.lastVerdict = `undo: the scene is back before the last action (${st.undo.size} more)`;
  st.hudDirty = true;
  return true;
}
