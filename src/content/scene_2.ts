/**
 * ⭐ **`Scene_2` — AN EMPTY SCENE** (the owner, 2026-11-12: *"create a scene 2 of World 0 in the level menu"* → *"Empty scene"*):
 * `Scene_1`'s frozen floor, lights, orbit rig, units and play volume — no pieces, no goal. A blank level to populate.
 * ⭐ Everything is READ from `SCENE_1` (never retyped): a change to the painting's floor or lights reaches this scene too.
 *
 * ⚠ Engine-free data. Nothing here may import the renderer.
 */
import type { SceneDescriptor } from "../core/game_structure";
import { SCENE_1 } from "./scene_1";

const FLOOR = SCENE_1.bodies.find((b) => b.id === "Floor" && b.frozen);
if (FLOOR === undefined) throw new Error("Scene_2: Scene_1 has no frozen Floor to copy");

// ⭐ Scene_1 without its pieces and its goals (the play volume, units, boot view, lighting and rig carried)
const { bodies: _bodies, final: _final, orbitGoals: _orbitGoals, ...shared } = SCENE_1;

export const SCENE_2: SceneDescriptor = {
  ...shared,
  id: "Scene_2",
  title: "Scene 2 — the engine", // ⭐ (2026-11-12, the owner: "Level 2 - Scene 2 - the engine"); still empty
  bodies: [FLOOR],
  final: null,
};
