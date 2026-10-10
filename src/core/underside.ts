/**
 * ⭐⭐ **A FROZEN BODY SEEN FROM BELOW DISAPPEARS** (`D128`, the owner, 2026-09-28: *"when a frozen
 * object is seen from below, it keeps its material (it does not become transparent) but it
 * disappears from the scene (so I can reach other objects)"*). ⛔ It reverses `D121`'s transparency
 * (2026-09-27: *"… the frozen object shall become transparent"*); the test of *below* is unchanged.
 * ⚠ It leaves the RENDER and the PICK only — the model, its collision and its alignments stand.
 * Engine-free.
 *
 * ⭐ *"Sees the bottom face"* is read literally: the camera is on the OUTSIDE of that face's plane.
 * The bottom face is the one whose world normal points most DOWN (and it must point down at all).
 */
import { faceWorld, type ObjectId, type World } from "./object_model";
import { add, qRotate, type Quat, type Vec3 } from "./vec";

/** The body's bottom face in world coordinates — `null` when no face points downward. */
export function bottomFaceWorld(world: World, id: ObjectId): { centre: Vec3; normal: Vec3 } | null {
  const o = world.objects.get(id);
  if (!o) return null;
  let best: { centre: Vec3; normal: Vec3 } | null = null;
  for (const f of o.faces) {
    const w = faceWorld(world, id, f.id);
    if (!w || !(w.normal[1] < 0)) continue;
    if (best === null || w.normal[1] < best.normal[1]) best = w;
  }
  return best;
}

/** ⭐ Is the camera on the outside of that face — can it see it? */
export function seesFace(camera: Vec3, face: { centre: Vec3; normal: Vec3 }): boolean {
  const d: Vec3 = [camera[0] - face.centre[0], camera[1] - face.centre[1], camera[2] - face.centre[2]];
  return d[0] * face.normal[0] + d[1] * face.normal[1] + d[2] * face.normal[2] > 0;
}

/** ⭐ Does the camera see this body's bottom face? */
export function seenFromBelow(world: World, id: ObjectId, camera: Vec3): boolean {
  const f = bottomFaceWorld(world, id);
  return f !== null && seesFace(camera, f);
}

/** ⭐⭐ The whole rule, for one body: FROZEN and seen from below → hidden (`D128`). */
export function hiddenFromBelow(world: World, id: ObjectId, camera: Vec3): boolean {
  return world.objects.get(id)?.frozen === true && seenFromBelow(world, id, camera);
}

/**
 * ⭐⭐ `D196` — **THE TOP FACE'S CONTOUR, SHOWN WHEN THE FROZEN BODY IS HIDDEN FROM BELOW** (the owner, 2026-10-02: *"when the
 * camera is below the floor, show the contour of the top face of the floor in sand yellow (just show the contour, but the
 * contour can't interact with nothing)"*). `D128` removes the floor from the render and the pick when it is seen from below,
 * and with it every sense of where the floor IS; its top face's outline gives that back without blocking anything.
 * ⭐ The corners are the body's own hull points that sit HIGHEST in the world (within `epsM`), ordered around their centre and
 * CLOSED (the first point repeated) — a line loop. `null` when fewer than three points are at the top (no top FACE: a body
 * turned onto an edge). ⛔ Read from the hull, so it is the real mesh's top face, not a box assumed from its dimensions.
 */
export function topFaceOutline(
  localPoints: readonly Vec3[],
  pose: { readonly position: Vec3; readonly orientation: Quat },
  epsM = 1e-6,
): Vec3[] | null {
  const w = localPoints.map((p) => add(pose.position, qRotate(pose.orientation, p)));
  if (w.length === 0) return null;
  const top = Math.max(...w.map((p) => p[1]));
  const ring = w.filter((p) => p[1] >= top - epsM);
  // ⚠ One corner each: a mesh splits its vertices (a box has 24 for 8 corners), so the same corner appears several times.
  const unique: Vec3[] = [];
  for (const p of ring) {
    if (!unique.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < epsM)) unique.push(p);
  }
  if (unique.length < 3) return null;
  const cx = unique.reduce((s, p) => s + p[0], 0) / unique.length;
  const cz = unique.reduce((s, p) => s + p[2], 0) / unique.length;
  const sorted = [...unique].sort((a, b) => Math.atan2(a[2] - cz, a[0] - cx) - Math.atan2(b[2] - cz, b[0] - cx));
  return [...sorted, sorted[0]!];
}
