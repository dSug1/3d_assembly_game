/**
 * ⭐⭐ **THE GAME'S CONTENT** — worlds and levels (the owner, 2026-09-26: *"We will later populate
 * them"*). ⛔ One world, one level, `Scene_0`: a scaffold, not a catalogue. A new level is a new
 * `SceneDescriptor` and one entry here; a new world is one more object in `worlds`.
 * ⭐ `D144`: this is the ONE scene list — the scene slider's index counts these levels in reading
 * order (`content/scenes.ts`), so a level's position here is its `?sceneIndex=`.
 *
 * ⚠ Engine-free data. Nothing here may import the renderer.
 */
import type { GameContent } from "../core/game_structure";
import { SCENE_0 } from "./scene_0";
import { SCENE_1 } from "./scene_1";
import { loadScene1DemoPlan, SCENE1_DEMO } from "./scene1_demo";

export const GAME_CONTENT: GameContent = {
  title: "3D Assembly",
  tagline: "Pick up, align, snap.",
  // ⭐ `D180`: the UI's graphics style — a theme id from `content/ui_themes.ts` (`?uiTheme=` overrides it).
  uiTheme: "night",
  worlds: [
    {
      id: "World_0",
      title: "World 0",
      levels: [
        { id: "Level_0", title: "Level 0", scene: SCENE_0 },
        { id: "Level_1", title: "Level 1 — the painting", scene: SCENE_1 },
        // ⭐ `D170`: the painting assembling itself (`DEMO_SCENE.md`) — `?sceneIndex=2`.
        { id: "Level1_demo", title: "Demo — the painting", scene: SCENE1_DEMO, demoPlan: loadScene1DemoPlan },
      ],
    },
  ],
};
