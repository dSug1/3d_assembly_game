import { describe, expect, it } from "vitest";
import { SCENE_1 } from "../src/content/scene_1";
import { SCENE_2 } from "../src/content/scene_2";
import { SCENES } from "../src/content/scenes";
import { GAME_CONTENT } from "../src/content/worlds";
import { parseSceneDescriptor, serializeSceneDescriptor } from "@core/game_structure";
import { menuLevels } from "@core/game_route";
import { readFileSync } from "node:fs";

describe("⭐ `Scene_2` — an empty scene, World 0's fourth level (the owner, 2026-11-12: \"Empty scene\")", () => {
  it("⭐ listed after the demo, so `?sceneIndex=3`; the earlier indices unchanged", () => {
    const w0 = GAME_CONTENT.worlds.find((w) => w.id === "World_0")!;
    expect(w0.levels.map((l) => l.id)).toEqual(["Level_0", "Level_1", "Level1_demo", "Level_2", "Level_0bis"]);
    expect(SCENES.map((s) => s.id)).toEqual(["Scene_0", "Scene_1", "Scene1_demo", "Scene_2", "Scene_0bis"]);
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

describe("⭐ World 0's level menu (the owner, 2026-11-12): the demo on top, each button its level's title", () => {
  const w0 = () => GAME_CONTENT.worlds.find((w) => w.id === "World_0")!;
  it("⭐ the buttons, in the owner's order and words", () => {
    expect(menuLevels(w0()).map((l) => l.title)).toEqual([
      "Demo - the painting",
      "Level 0 - Scene 0 - the workbench",
      "Level 0bis - Scene 0bis - the heptagon with tips", // ⭐ (2026-11-12) after Level 0
      "Level 1 - Scene 1 - the painting",
      "Level 2 - Scene 2 - the engine",
    ]);
  });
  it("⛔ the menu only: the `?sceneIndex=` order unchanged (0 the workbench, 1 the painting, 2 the demo, 3 Scene_2)", () => {
    expect(SCENES.map((s) => s.id)).toEqual(["Scene_0", "Scene_1", "Scene1_demo", "Scene_2", "Scene_0bis"]);
  });
  it("⭐ menuLevels: listed first, the rest in catalogue order, unknown and repeated ids ignored", () => {
    const lv = (id: string) => ({ id, title: id, scene: SCENE_2 });
    const w = { id: "W", title: "W", levels: [lv("a"), lv("b"), lv("c")] };
    expect(menuLevels(w).map((l) => l.id)).toEqual(["a", "b", "c"]);
    expect(menuLevels({ ...w, menuOrder: ["c", "x", "c"] }).map((l) => l.id)).toEqual(["c", "a", "b"]);
  });
  it("⭐ wired: the level screen lists menuLevels, each button the level's title alone", () => {
    const s = readFileSync(new URL("../src/render/screens.ts", import.meta.url), "utf8");
    expect(s).toContain("for (const l of world ? menuLevels(world) : []) panel.append(button(l.title, () => flow.openLevel(l.id)));");
  });
});

describe("⭐ `Scene_2`'s model (2026-11-13, W4 — the final stage)", () => {
  it("⭐ the engine's .glb, every part (no slice yet), carried through the JSON seam", () => {
    expect(SCENE_2.model?.url).toMatch(/world0_scene_2_engine.*\.glb/);
    expect(SCENE_2.model?.parts).toBeUndefined();
    const sliced = { ...SCENE_2, model: { url: "x.glb", parts: ["E01", "E02"] } };
    expect(parseSceneDescriptor(serializeSceneDescriptor(sliced))).toEqual(sliced);
  });
  it("⛔ a model without a url, or with parts not ids, refused by name", () => {
    const j = (model: unknown) => JSON.stringify({ ...JSON.parse(serializeSceneDescriptor(SCENE_2)), model });
    expect(() => parseSceneDescriptor(j({ parts: ["E01"] }))).toThrow(/model.url/);
    expect(() => parseSceneDescriptor(j({ url: "x.glb", parts: [1] }))).toThrow(/model.parts/);
  });
});
