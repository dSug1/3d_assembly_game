/**
 * ⭐⭐⭐ **THE RESTING-FACE SELECTOR, WIRED** for the scene's parts (`Claude/40_RENDER_SCENE/spec/RESTING_FACE.md` §11, §13; the
 * owner, 2026-10-04/05: *"the selector shall be implemented at boot for every part in the game which is not seated … If a part is
 * unseated, the selector shall be implemented at the moment it is unseated"* — *"part placed in its goal: for me, this is a seated
 * part"*). ⛔ The rule is `core/resting_face.ts`'s; this file holds WHEN it runs and what it keeps.
 *
 * * **SEATED** = seated on a Pioneer (`st.links`) OR placed in its goal (the committed status, `st.goalCommit`).
 * * ⭐⭐ (2026-10-09, the owner: *"add the resting face to the object model so that each object in the scene has a resting face identified
 *   and tracked"*) — the answer is RECORDED IN THE OBJECT MODEL (`setRestingFace`; `restingFaceWorld` tracks it), and a FROZEN body is
 *   asked too, once at boot (it never moves and is never seated) — ⛔ it reverses `RESTING_FACE.md` §13.1. Nothing is highlighted for
 *   the scene's parts (*"no need to highlight the resting faces of any part, excep the green and turquoise pieces"*).
 * * **Boot** — once the goal's baseline is committed (its first frame), EVERY object (2026-10-09; it was every part not seated).
 * * **Every frame after** — the seated set is DIFFED: a part that was seated and is not any more gets its resting face THAT frame.
 *   ⭐ One funnel for every path that frees a part — the unsnap, an unalign, a dissolve, an UNDO that restores the links or the goal
 *   wholesale — so no path can miss it (the spec's first plan, a call in `unseatWorld`, would have missed the undo).
 * * ⭐ What depends on the mesh alone is computed once per SHAPE (identical pieces share it); at each call only the face chosen inside
 *   the winning group (`chooseInGroup`) is taken again, from the part's pose AT THAT MOMENT.
 */
import { chooseInGroup, restingFaceRecord, restingFaces, type RestingCandidate, type RestingResult } from "../core/resting_face";
import { setRestingFace, worldPlacementOf, type ObjectId } from "../core/object_model";
import type { MeshTopology } from "../core/mesh_topology";
import { topologyOfBody } from "./bodies";
import type { SceneState } from "./scene_state";

/** ⭐ One part's resting face: the rule's answer for its shape, the face chosen at that moment, and why it was asked. */
export interface RestingEntry {
  readonly result: RestingResult;
  readonly chosen: RestingCandidate | null;
  readonly why: "BOOT" | "UNSEATED";
}

/** ⭐ A shape's key: its welded positions to the micrometre and its face count — identical pieces share one computation. */
function shapeKey(t: MeshTopology): string {
  return `${t.faces.length}|${t.positions.map((p) => p.map((x) => Math.round(x * 1e6)).join(",")).join(";")}`;
}

/** ⭐ Is the part seated — on a Pioneer, or placed in its goal (the owner: *"for me, this is a seated part"*)? */
export function isSeatedPart(st: SceneState, id: ObjectId): boolean {
  return st.links.isSeated(id) || st.goalCommit.has(id);
}

/** ⭐ The selector for ONE part, now: its shape's answer (cached) and the face chosen from its pose. `null` with no mesh. */
export function restingFaceFor(st: SceneState, id: ObjectId, why: RestingEntry["why"]): RestingEntry | null {
  const mesh = st.meshOf.get(id);
  if (mesh === undefined) return null;
  const topo = st.topoOf.get(id) ?? topologyOfBody(st, mesh);
  const key = shapeKey(topo);
  let result = st.restingShapes.get(key);
  if (result === undefined) {
    result = restingFaces(topo.positions, topo.faces);
    st.restingShapes.set(key, result);
  }
  const pose = worldPlacementOf(st.world, id);
  const chosen = result.winner === null || pose === null ? null : chooseInGroup(result.winner, pose.orientation);
  const entry: RestingEntry = { result, chosen, why };
  st.restingFaces.set(id, entry);
  // ⭐ …and in the object model, where it is tracked with the body
  const rec = chosen === null ? null : restingFaceRecord(topo.positions, topo.faces, chosen);
  if (rec !== null) st.world = setRestingFace(st.world, id, { ...rec, why });
  st.restingLast = id;
  st.hudDirty = true;
  return entry;
}

/** ⭐ Every frame (after the goal commit): the boot pass once the goal's baseline exists, then the seated set diffed. */
export function restingFaceFrame(st: SceneState): void {
  if (st.restingSeated === null) {
    // ⭐ the goal's baseline first — a part placed in its goal at boot is seated, so it must be known before the boot pass
    if (st.sceneSpec.final && st.goalCommit.never) return;
    const seated = new Set<ObjectId>();
    for (const [id, o] of st.world.objects) {
      if (o.orbited === true) continue; // ⭐ its resting face was recorded when it joined the model (`registerOrbitPieces`)
      if (o.frozen !== true && isSeatedPart(st, id)) seated.add(id);
      // ⭐ (2026-10-09) EVERY object at boot — seated, placed in its goal or frozen too (*"each object in the scene has a resting face"*;
      // it reverses §13.1–§13.2's exclusions); an unseat still chooses again, from the pose of that moment
      restingFaceFor(st, id, "BOOT");
    }
    st.restingSeated = seated;
    return;
  }
  const now = new Set<ObjectId>();
  for (const [id, o] of st.world.objects) if (o.frozen !== true && o.orbited !== true && isSeatedPart(st, id)) now.add(id);
  for (const id of st.restingSeated) if (!now.has(id) && st.world.objects.has(id)) restingFaceFor(st, id, "UNSEATED");
  st.restingSeated = now;
}
