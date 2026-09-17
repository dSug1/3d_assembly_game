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
import { dot, normalize, qRotate, qconj, shortestArc } from "./vec";
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
 * ⭐⭐⭐ **THE MARKER'S ORIENTATION *WITHIN* ITS OBJECT** — one constant rotation per face,
 * taking the marker's `+z` onto that face's LOCAL normal.
 *
 * ⛔⛔ IT USED TO COMPOSE THE OBJECT'S ORIENTATION IN, and that half moved to the SCENE GRAPH
 * on 2026-09-17: the markers are **parented to the mesh**, so Babylon composes parent × child
 * every frame and the marker cannot be anywhere but on its face. ⭐ What is left here is the
 * part that is genuinely a computation, and it depends on the face alone.
 *
 * ⚠⚠ **THE DEFECT THIS SHAPE EXISTS TO PREVENT, KEPT ON THE RECORD**: the first version
 * aligned the marker's facing with the face's **world normal**, via `shortestArc`. That fixes
 * ONE axis and leaves the spin about it FREE — so turning the object about that face's own
 * normal moved the face and not the marker, device-reported as *"a growing mismatch between
 * their respective quaternion"*. ⭐⭐ *A DIRECTION TEST CANNOT SEE A ROLL*: the quantity I
 * checked (does it face the right way?) stayed true while the one that mattered drifted.
 * ✅ A constant offset under the object's own orientation cannot drift, by construction —
 * first by composing it here, and now by letting the graph compose it.
 */
export function faceMarkerLocalOrientation(faceNormalLocal: Vec3): Quat {
  return shortestArc([0, 0, 1], faceNormalLocal);
}

/**
 * ⭐⭐⭐ **HOW BIG THE MARKER ON A FACE HAS TO BE**, once the objects are not cubes.
 *
 * ⛔⛔ **IT IS DERIVED FROM THE MARKER'S OWN ORIENTATION, NOT GUESSED FROM THE NORMAL** — and
 * that is the whole point of this function existing instead of two lines at the call site.
 * ⚠⚠ I first wrote it as *"the two axes that are not the normal, in ascending order"*, which is
 * **wrong**: `faceMarkerLocalOrientation` is a `shortestArc`, so on a `+x` face the marker's
 * local `x` lands on the object's **−z**, not its `y`. ⭐ On an `L × 2L × 3L` body that swaps
 * `2L` and `3L`, and the marker is visibly the wrong shape on four of the six faces.
 *
 * ⭐⭐ `METHOD`: *a composition is a thing to MEASURE, not an emergent property.* The marker's
 * size depends on the quaternion the marker is actually given, so it is computed **from** that
 * quaternion — and then no convention inside `shortestArc` can make it wrong.
 *
 * @param dims the body's full extents along its own `x`, `y`, `z`.
 * @returns `u` and `v`, the marker's local `x` and `y` extents, in the same units as `dims`.
 */
export function faceMarkerExtent(
  faceNormalLocal: Vec3,
  dims: Vec3,
): { readonly u: number; readonly v: number } {
  const q = faceMarkerLocalOrientation(faceNormalLocal);
  // ⭐ Where the marker's own x and y point, in the BODY's frame.
  const ux = qRotate(q, [1, 0, 0]);
  const uy = qRotate(q, [0, 1, 0]);
  // ⚠ `|component| · dim`, summed: for an axis-aligned face this picks out exactly one
  // dimension, and for an oblique one it gives the honest projected extent rather than an
  // arbitrary pick. ⛔ No `Math.round`, no axis index — nothing that could disagree with `q`.
  const along = (v: Vec3) =>
    Math.abs(v[0]) * dims[0] + Math.abs(v[1]) * dims[1] + Math.abs(v[2]) * dims[2];
  return { u: along(ux), v: along(uy) };
}

/**
 * ⭐⭐⭐ **WHICH FACE CARRIES AN OBJECT'S ALIGNMENT** — derived from the constraint stack, so a
 * highlight built on it cannot outlive the alignment.
 *
 * > *"when an object is aligned, always maintain its FollowerFace highlighted (even if the
 * > touchpoints later select other objects) until its alignment is broken. This will help keep
 * > track of which objects are aligned even though the two touchpoints are on other objects"*
 * > — the owner, 2026-09-17
 *
 * ⛔⛔ **THE POINT IS THAT NOTHING IS REMEMBERED.** The previous build kept ONE `selectedFace`
 * record, so aligning a second object silently wiped the first object's highlight — and the
 * owner's whole reason for wanting it is to see *which objects are aligned*, plural. ⭐ A
 * `FACE_ALIGN` already stores the constrained face's **local normal**, so the face's identity
 * is in the model and needs no shadow copy. ⚠ A remembered map would be a second source of
 * truth for a fact the stack already holds, free to disagree after any eviction.
 *
 * ⛔ `null` when the object has no alignment — which is exactly when nothing should be drawn.
 *
 * @returns the id of the face whose LOCAL normal the alignment constrains.
 */
export function alignedFaceOf(world: World, id: ObjectId): FaceId | null {
  const o = world.objects.get(id);
  if (!o) return null;
  for (const c of o.constraints) {
    // ⚠ `FACE_ALIGN` only. A `MATE` also constrains a face, but it is a SEAT — marking it with
    // the alignment's highlight would report a relationship the user did not make.
    if (c.kind !== "FACE_ALIGN") continue;
    const want = normalize(c.localNormal);
    if (!want) continue;
    let best: FaceId | null = null;
    let bestDot = -Infinity;
    for (const f of o.faces) {
      const n = normalize(f.normal);
      if (!n) continue;
      // ⭐ SIGNED, and deliberately so: `+x` and `-x` are different FACES even though they are
      // one axis. ⛔ An `|dot|` here would light the face opposite the one the hand tapped,
      // roughly half the time, and on a cuboid that is immediately visible.
      const d = dot(want, n);
      if (d > bestDot) {
        bestDot = d;
        best = f.id;
      }
    }
    // ⚠ Nearest match rather than exact equality: the stored normal came from a face of this
    // object, so the winner is that face — but float equality on three components is the kind
    // of test that fails once in a thousand alignments for no visible reason.
    return best;
  }
  return null;
}
