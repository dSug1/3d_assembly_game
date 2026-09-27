/**
 * ⭐⭐ **A FROZEN BODY SEEN FROM BELOW TURNS TRANSPARENT** (`D121`, the owner, 2026-09-27: *"if the
 * camera passes below the bottom face of a frozen object (i.e. the camera look upwards and sees the
 * bottom face of the frozen object), the frozen object shall become transparent"*). Engine-free.
 *
 * ⭐ *"Sees the bottom face"* is read literally: the camera is on the OUTSIDE of that face's plane.
 * The bottom face is the one whose world normal points most DOWN (and it must point down at all).
 */
import { faceWorld, type ObjectId, type World } from "./object_model";
import type { Vec3 } from "./vec";

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

/** ⭐ The whole rule, for one body. */
export function seenFromBelow(world: World, id: ObjectId, camera: Vec3): boolean {
  const f = bottomFaceWorld(world, id);
  return f !== null && seesFace(camera, f);
}
