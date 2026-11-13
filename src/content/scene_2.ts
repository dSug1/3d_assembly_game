/**
 * ⭐ **`Scene_2` — THE ENGINE** (the owner, 2026-11-12: *"create a scene 2 of World 0 in the level menu"*; the plan:
 * `30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md`): `Scene_1`'s frozen floor, lights, orbit rig, units and play volume — no pieces of its own, no goal yet.
 * ⭐ Everything is READ from `SCENE_1` (never retyped): a change to the painting's floor or lights reaches this scene too.
 * ⭐⭐ (2026-11-13, W4 — the FINAL STAGE, `SCENE_WORKFLOW.md` §6.4: *"have a look at the scene in its final stage because that's the goal the player
 * has to achieve"*): the engine's `.glb` (W3's export), every part assembled at its goal — to settle the scale, the lights and the background. ⚠ Shown,
 * not played: the boot stage and the playable slice (the plinth, the lower case, the crankshaft, the pulley) follow.
 *
 * ⚠ Engine-free data. Nothing here may import the renderer.
 */
import type { SceneDescriptor } from "../core/game_structure";
import { SCENE_1 } from "./scene_1";
// ⭐ The file Vite serves (hashed in the build); fetched only when this level is played.
import ENGINE_GLB from "../../Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb?url";

const FLOOR = SCENE_1.bodies.find((b) => b.id === "Floor" && b.frozen);
if (FLOOR === undefined) throw new Error("Scene_2: Scene_1 has no frozen Floor to copy");

// ⭐ Scene_1 without its pieces and its goals (the play volume, units, boot view, lighting and rig carried)
const { bodies: _bodies, final: _final, orbitGoals: _orbitGoals, ...shared } = SCENE_1;

export const SCENE_2: SceneDescriptor = {
  ...shared,
  id: "Scene_2",
  title: "Scene 2 — the engine", // ⭐ (2026-11-12, the owner: "Level 2 - Scene 2 - the engine")
  bodies: [FLOOR],
  final: null,
  // ⭐ The final stage: every part (no slice yet).
  model: { url: ENGINE_GLB },
};
