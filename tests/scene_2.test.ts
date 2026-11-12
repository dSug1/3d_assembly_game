import { describe, expect, it } from "vitest";
import { SCENE_1 } from "../src/content/scene_1";
import { SCENE_2 } from "../src/content/scene_2";
import { SCENES } from "../src/content/scenes";
import { GAME_CONTENT } from "../src/content/worlds";
import { parseSceneDescriptor, serializeSceneDescriptor } from "@core/game_structure";

describe("⭐ `Scene_2` — an empty scene, World 0's fourth level (the owner, 2026-11-12: \"Empty scene\")", () => {
  it("⭐ listed after the demo, so `?sceneIndex=3`; the earlier indices unchanged", () => {
    const w0 = GAME_CONTENT.worlds.find((w) => w.id === "World_0")!;
    expect(w0.levels.map((l) => l.id)).toEqual(["Level_0", "Level_1", "Level1_demo", "Level_2"]);
    expect(SCENES.map((s) => s.id)).toEqual(["Scene_0", "Scene_1", "Scene1_demo", "Scene_2"]);
  });

  it("⭐ the floor alone, frozen — no pieces, no goal", () => {
    expect(SCENE_2.bodies).toHaveLength(1);
    expect(SCENE_2.bodies[0]).toMatchObject({ id: "Floor", frozen: true });
    expect(SCENE_2.final).toBeNull();
    expect(SCENE_2.orbitGoals).toBeUndefined();
  });

  it("⭐ Scene_1's floor, lights, rig, units and volume — read, never retyped", () => {
    expect(SCENE_2.bodies[0]).toBe(SCENE_1.bodies.find((b) => b.id === "Floor"));
    expect(SCENE_2.lighting).toBe(SCENE_1.lighting);
    expect(SCENE_2.orbit).toBe(SCENE_1.orbit);
    expect(SCENE_2.unitM).toBe(SCENE_1.unitM);
    expect(SCENE_2.playVolume).toBe(SCENE_1.playVolume);
  });

  it("⭐ round-trips through the scene's JSON seam", () => {
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE_2))).toEqual(SCENE_2);
  });
});
