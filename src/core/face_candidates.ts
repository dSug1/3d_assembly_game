/**
 * ⭐⭐⭐ **WHICH FACES ON OTHER BODIES THE HELD ONE IS NEARLY READY TO MATE WITH.**
 *
 * > *"during the rotation of the object, highlight in fuchsia any face of any other object which
 * > normal is aligned within xx degrees of the normal of the HitFace."* — the owner, 2026-09-24
 *
 * ## ⛔⛔⛔ *ALIGNED* IS READ AS **ANTI-PARALLEL**, AND THIS IS THE ONE THING TO CHECK FIRST
 *
 * ⚠ The word admits two readings and they differ by 180°. This module implements the **MATE**
 * sense — the candidate face pointing back **at** the HitFace — for three reasons, and if the
 * owner meant the other one it is a single sign in `facesMate` below:
 *
 * 1. ⭐⭐ `D78` made the alignment itself anti-parallel: *"the direction of the FollowerFace shall
 *    be anti-normal to the direction of the PioneerFace."* A highlight that used the other sense
 *    would light the faces a tap is about to turn the body **away** from.
 * 2. ⭐ It makes the gesture mean something: rotate until a face lights up, and the body is
 *    already nearly in the pose that face wants. Under the parallel reading the highlight would
 *    appear exactly when a 180° flip is still needed.
 * 3. ⛔ `alignTargetFor` negates the Pioneer normal in ONE place and this module must not be a
 *    second one — so it asks its question directly of the two face normals, not of a target.
 *
 * ⛔ ENGINE-FREE. Reads the object model and nothing else.
 */
import type { FaceId, ObjectId, World } from "./object_model";
import { faceWorld } from "./object_model";
import { dot, type Vec3 } from "./vec";

/** ⭐ One face of one body — the pair every caller here passes around. */
export interface FaceRef {
  readonly objectId: ObjectId;
  readonly faceId: FaceId;
}

/**
 * ⭐⭐ **DO THESE TWO WORLD NORMALS FACE EACH OTHER, WITHIN `coneDeg`?**
 *
 * ⛔ The test is on the angle between `candidate` and **minus** `hit`: two faces that meet flush
 * point at each other. ⚠ `coneDeg = 0` admits only the exact anti-parallel case, which is the
 * honest OFF for the owner's slider — not *everything*.
 *
 * ⚠ Degenerate normals (zero length, NaN) answer `false` rather than throwing: this runs per face
 * per frame, and a body whose geometry could not be read must not take the render loop down.
 */
export function facesMate(
  hitWorldNormal: Vec3,
  candidateWorldNormal: Vec3,
  coneDeg: number,
): boolean {
  const hl = Math.hypot(...hitWorldNormal);
  const cl = Math.hypot(...candidateWorldNormal);
  if (!Number.isFinite(hl) || !Number.isFinite(cl) || hl <= 0 || cl <= 0)
    return false;
  const cone = Math.max(0, Math.min(180, Number.isFinite(coneDeg) ? coneDeg : 0));
  // ⭐ `-dot` because the mate sense is anti-parallel: exactly opposed gives `+1` here.
  const cosBetween = -dot(hitWorldNormal, candidateWorldNormal) / (hl * cl);
  // ⚠ Clamped before `acos` — floating point can hand it 1.0000000000000002.
  const clamped = Math.max(-1, Math.min(1, cosBetween));
  return (Math.acos(clamped) * 180) / Math.PI <= cone + 1e-9;
}

/**
 * ⭐⭐⭐ **EVERY FACE, ON EVERY OTHER BODY, THAT THE HELD BODY'S HITFACE IS WITHIN `coneDeg` OF
 * MATING WITH** — in a stable order, so a marker pool keyed on the result does not churn.
 *
 * ⛔⛔ **THE HELD BODY IS EXCLUDED, AND SO IS NOTHING ELSE.** ⚠ A FROZEN body is deliberately
 * still a candidate: `D77` says *a frozen body remains a perfectly good PIONEER; only the Follower
 * role is refused*, and the base plate is the thing most parts will be aligned to.
 *
 * ⭐ Bodies already aligned elsewhere are candidates too — being someone's Follower does not stop
 * a body being another's Pioneer, and the cycle guard is `pressMeaning`'s job at the press, not a
 * silent omission from a highlight.
 *
 * @param hit the face the first touch raycast hit at press, on the held body.
 * @returns `[]` when the hit face cannot be resolved — never a partial answer.
 */
export function mateCandidateFaces(
  world: World,
  hit: FaceRef,
  coneDeg: number,
): FaceRef[] {
  const hitWorld = faceWorld(world, hit.objectId, hit.faceId);
  if (hitWorld === null) return [];
  const out: FaceRef[] = [];
  for (const [objectId, object] of world.objects) {
    if (objectId === hit.objectId) continue;
    for (const face of object.faces) {
      const w = faceWorld(world, objectId, face.id);
      if (w === null) continue;
      if (facesMate(hitWorld.normal, w.normal, coneDeg))
        out.push({ objectId, faceId: face.id });
    }
  }
  return out;
}
