/**
 * ⭐⭐ **THE SCENE REGISTRY** — every playable scene, by index (the owner, 2026-09-27: *"make the
 * structure modular so that I can toggle with a slider between Scene_0 and Scene_1"*).
 *
 * ⭐ The index is the `sceneIndex` tunable (URL `?sceneIndex=1`, and the slider at the top of the
 * tuning menu, which reboots the page on the chosen scene).
 *
 * ⭐⭐ `D144`: **the list is DERIVED from the catalogue** (`content/worlds.ts`), in reading order — it
 * used to be a second hand-written list of the same scenes. ⛔ A new scene is one data file and one
 * level in `worlds.ts`; nothing here and nothing in `render/` names a scene.
 */
import type { SceneDescriptor } from "../core/game_structure";
import { levelsOf, resolveSceneIndex, scenesOf } from "../core/game_route";
import { withDemoPlan } from "../core/demo_plan";
import { GAME_CONTENT } from "./worlds";

export const SCENES: readonly SceneDescriptor[] = scenesOf(GAME_CONTENT);

/** ⭐ The scene an index names — ⚠ an index out of range falls back to the first, never throws. */
export function sceneAt(index: number): SceneDescriptor {
  return SCENES[resolveSceneIndex(GAME_CONTENT, index)]!;
}

/**
 * ⭐⭐ `D173`: the scene an index names, READY to boot — a demo level's plan is fetched now (its own file) and applied;
 * any other level resolves at once. ⚠ An index out of range falls back to the first, as `sceneAt`.
 */
export async function sceneReady(index: number): Promise<SceneDescriptor> {
  const level = levelsOf(GAME_CONTENT)[resolveSceneIndex(GAME_CONTENT, index)]!;
  return level.demoPlan ? withDemoPlan(level.scene, await level.demoPlan()) : sceneAt(index);
}
