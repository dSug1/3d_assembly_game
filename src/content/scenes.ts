/**
 * ⭐⭐ **THE SCENE REGISTRY** — every playable scene, by index (the owner, 2026-09-27: *"make the
 * structure modular so that I can toggle with a slider between Scene_0 and Scene_1"*).
 *
 * ⭐ The index is the `sceneIndex` tunable (URL `?sceneIndex=1`, and the slider at the top of the
 * tuning menu, which reboots the page on the chosen scene). ⛔ A new scene is one entry here and one
 * data file; nothing in `render/` names a scene.
 */
import type { SceneDescriptor } from "../core/game_structure";
import { SCENE_0 } from "./scene_0";
import { SCENE_1 } from "./scene_1";

export const SCENES: readonly SceneDescriptor[] = [SCENE_0, SCENE_1];

/** ⭐ The scene an index names — ⚠ an index out of range falls back to `Scene_0`, never throws. */
export function sceneAt(index: number): SceneDescriptor {
  return SCENES[Number.isInteger(index) && index >= 0 && index < SCENES.length ? index : 0]!;
}
