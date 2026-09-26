/**
 * ⭐⭐ **THE GAME'S CONTENT** — worlds and levels (the owner, 2026-09-26: *"We will later populate
 * them"*). ⛔ One world, one level, `Scene_0`: a scaffold, not a catalogue. A new level is a new
 * `SceneDescriptor` and one entry here; a new world is one more object in `worlds`.
 *
 * ⚠ Engine-free data. Nothing here may import the renderer.
 */
import type { GameContent } from "../core/game_structure";
import { SCENE_0 } from "./scene_0";

export const GAME_CONTENT: GameContent = {
  title: "3D Assembly",
  tagline: "Pick up, align, snap.",
  worlds: [
    {
      id: "World_0",
      title: "World 0",
      levels: [{ id: "Level_0", title: "Level 0", scene: SCENE_0 }],
    },
  ],
};
