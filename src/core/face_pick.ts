/**
 * ⭐⭐⭐ **`IN3`, RULE 2 — WHICH FACE DID THE FINGER LAND ON?**
 *
 * §2 rule 2: *"one raycast hit on one object => the hit object is selected and the hit face
 * is selected."* Everything else in `IN3` reads that face: 2ter anchors it to gravity,
 * 2quater to a world axis, `MATE` joins two of them, and §4's 6bis builds its axis from two
 * face centres.
 *
 * ⛔⛔ **IT IS DRIVEN BY THE PICKED NORMAL, NOT BY A TRIANGLE INDEX.** Babylon hands back a
 * `faceId` that is a **triangle** number: a box face is two of them, an imported mesh face
 * is arbitrarily many, and the ordering is a detail of however the geometry was built.
 * ⭐ `object_model.ts` says exactly this at the `Face` type and refuses to learn that
 * triangles exist. ⚠ A triangle→face table would have to be rebuilt for every mesh `3D4`
 * imports, and would break silently the first time an exporter reordered its indices.
 *
 * ⭐⭐ **THE NORMAL IS GEOMETRY, AND IT IS WHAT THE USER AIMED AT.** So: take the hit's
 * surface normal and choose the face whose own outward normal points most nearly the same
 * way. ⛔ The comparison happens in **ONE frame** — the object's LOCAL frame — because a face
 * normal is stored local and a pick arrives in world. Rotating one into the other IS the
 * mapping, and doing it in the wrong direction is the silent sign error that only appears
 * once an object has been turned, which here is every object in the scene.
 *
 * ⚠ **What this deliberately does NOT do**: it does not judge whether a face is a good
 * anchor, whether the object is constrained, or whether a very oblique pick should be
 * refused. Those belong to the rules that CONSUME a face — mixing them in would make
 * *"which face"* depend on *"what for"*.
 *
 * ⛔ ENGINE-FREE: the caller raycasts and hands over a plain world-space normal.
 */
import type { FaceId, ObjectId, World } from "./object_model";
import { worldPlacementOf } from "./object_model";
import type { Vec3 } from "./vec";
import { dot, normalize, qRotate, qconj, qmul, shortestArc } from "./vec";
import type { Quat } from "./vec";

/**
 * The face of `id` whose outward normal best matches a world-space `pickedNormal`.
 *
 * @param pickedNormal the surface normal at the hit, in WORLD space. ⚠ Need not be unit — it
 *   is normalised here, and a degenerate (zero) normal returns `null` rather than a default:
 *   `LESSONS_CARRIED` §6, *a degenerate input must return `null`, never a default*.
 * @returns the winning face and its cosine against the pick, or `null` if the object is
 *   unknown, has no faces, or the normal is degenerate.
 *
 * ⭐ The cosine is returned because a caller may later want to refuse a grazing pick — and
 * **nothing here refuses one**. ⛔ Handing back the evidence beats burying a threshold in a
 * function whose job is *which face*.
 */
export function faceFromPickedNormal(
  world: World,
  id: ObjectId,
  pickedNormal: Vec3,
): { faceId: FaceId; cos: number } | null {
  const o = world.objects.get(id);
  if (!o || o.faces.length === 0) return null;

  const n = normalize(pickedNormal);
  if (!n) return null;

  // ⛔ `worldPlacementOf` walks the parent chain (`parent ≠ root`), and a face PICK must
  // follow the same chain a face CENTRE does — `faceWorld` uses it too. Duplicating the walk
  // is how two answers to *"where is this object?"* start disagreeing on child objects.
  const here = worldPlacementOf(world, id);
  if (!here) return null;

  // ⛔⛔ The pick is rotated by the INVERSE of the object's world orientation to meet the
  // local face normals; `qconj` is that inverse for a unit quaternion. ⚠ Rotating the faces
  // forward instead would be equally correct and six times the work.
  const local = qRotate(qconj(here.orientation), n);

  let best: { faceId: FaceId; cos: number } | null = null;
  for (const f of o.faces) {
    const fn = normalize(f.normal);
    if (!fn) continue; // ⚠ a malformed face is skipped, never allowed to win with a NaN
    const cos = dot(fn, local);
    if (best === null || cos > best.cos) best = { faceId: f.id, cos };
  }
  return best;
}

/**
 * ⭐⭐⭐ **THE ORIENTATION A FACE MARKER MUST TAKE — and the defect it was written for.**
 *
 * ⛔⛔ **DEVICE-REPORTED, 2026-09-16**: *"the highlighted face does not rotate as the cube's
 * face: consequently, there is a growing mismatch between their respective quaternion."*
 *
 * ⭐⭐ THE CAUSE IS WORTH MORE THAN THE FIX. The first version aligned the marker's facing
 * with the face's world **normal** — `shortestArc([0,0,1], worldNormal)`. That is correct
 * about *where the marker points* and says **nothing about its spin**: the shortest arc
 * fixes ONE axis and leaves the roll about it free. ⛔ So when the object turns **about that
 * face's own normal**, the normal does not change, the marker does not follow, and the
 * mismatch accumulates exactly as the owner described.
 *
 * ⭐⭐⭐ **A DIRECTION TEST CANNOT SEE A ROLL.** It is the same family as `METHOD`'s *a sign
 * is not tested by any amount of testing the magnitude*: the quantity I checked (does the
 * marker face the right way?) was true in every frame while the quantity that mattered (is
 * it oriented like the face?) was drifting.
 *
 * ⭐ So the marker does not derive an orientation at all: it **inherits the object's**, and
 * adds the ONE constant rotation that takes the marker's `+z` onto that face's LOCAL normal.
 * ⛔ Constant per face, so nothing can drift — the object's own spin is carried verbatim.
 *
 * @param objectOrientation the object's orientation as DRAWN. ⚠ The mesh's, not the model's:
 *   what the eye sees is `SWAY ∘ FOLLOW ∘ model`, and a marker that took the model's
 *   orientation would lag the face it marks by the follower's time constant.
 * @param faceNormalLocal the face's outward normal in the object's LOCAL frame.
 */
export function faceMarkerOrientation(objectOrientation: Quat, faceNormalLocal: Vec3): Quat {
  // ⛔ `qmul(b, a)` applies `a` first: the constant local alignment, then the object's own
  // orientation. The other order would rotate the offset by nothing and the object by the
  // offset — right only when the object is unrotated, which is the state every naive test
  // starts in.
  return qmul(objectOrientation, shortestArc([0, 0, 1], faceNormalLocal));
}
