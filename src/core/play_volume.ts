/**
 * ⭐⭐⭐ `3D7` — **THE PLAY VOLUME** (`D181`; the playability program's build #3, `D116`; the owner, 2026-09-30: *"Build 3D7"*)
 * → `Claude/30_OBJECTS_3D/spec/COLLISION.md` §10.
 *
 * ⭐ `PLAYABILITY` §3: *"Nothing keeps a part inside the scene today: it can be dragged off-screen, far behind the camera
 * … A volume per level clamps translation (the same stop-and-slide as `3D6`, against the volume's walls); a lost part is
 * recoverable."* This file says WHERE the volume is; `core/collision.ts` enforces it (its walls are one more blocker).
 * ⭐ A level declares it as data — a box STANDING ON ITS FLOOR (the largest frozen body): the floor's footprint, from the
 * floor's top up `aboveFloor` authored units. A scene that declares none is unbounded (`Scene_0`, the workbench).
 * ⛔ Engine-free.
 */
import type { Aabb } from "./collision";
import { contourDims, type SceneDescriptor } from "./game_structure";

/** ⭐ The world-metre box no body may leave in `scene`, or `null` when the scene declares none (or has no floor). */
export function playVolumeOf(scene: SceneDescriptor): Aabb | null {
  const v = scene.playVolume;
  if (!v) return null;
  const floor = scene.bodies.filter((b) => b.frozen).sort((a, b) => Math.max(...contourDims(b)) - Math.max(...contourDims(a)))[0];
  if (!floor) return null;
  const u = scene.unitM ?? 1;
  const d = contourDims(floor);
  const top = floor.position[1] + d[1] / 2;
  return {
    min: [(floor.position[0] - d[0] / 2) * u, top * u, (floor.position[2] - d[2] / 2) * u],
    max: [(floor.position[0] + d[0] / 2) * u, (top + v.aboveFloor) * u, (floor.position[2] + d[2] / 2) * u],
  };
}
