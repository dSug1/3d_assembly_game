/**
 * GOLDEN VECTORS — **`Scene_0bis`, THE HEPTAGON WITH TIPS** (the owner, 2026-11-12: *"create a Level 0 Scene 0bis and copy the scene 0 into it. Then
 * modify the heptagon of scene 0bis so that the two lateral faces have a tip, as attachment"*).
 * ⛔ RED before: `content/scene_0bis.ts`, `axisVertices` / `raiseTips` and `BodySpec.prismTip` absent.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { axisVertices, prismOutline, raiseTips } from "@core/prism";
import { levelOf, parseSceneDescriptor, serializeSceneDescriptor } from "@core/game_structure";
import { menuLevels } from "@core/game_route";
import { greenBootOrientation } from "@input/green_box";
import { SCENE_0, SCENE_0_HEPTAGON_DIMS, SCENE_0_HEPTAGON_POSITION, SCENE_0_ORBIT_GOALS, heptagonGoalFace } from "../src/content/scene_0";
import { SCENE_0BIS, SCENE_0BIS_BODY_DIMS, SCENE_0BIS_HEPTAGON_DIMS, SCENE_0BIS_ORBIT_GOALS, SCENE_0BIS_TIP, heptagon0bisGoalFace } from "../src/content/scene_0bis";
import { SCENES } from "../src/content/scenes";
import { GAME_CONTENT } from "../src/content/worlds";

const code = (p: string): string => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

/** ⭐ A prism as Babylon's cylinder lays it out once stretched: a hub at each cap's centre, then the cap's ring; the sides' rings after. */
function tippable(sides: number, w: number, h: number, len: number): number[] {
  const ring = prismOutline(sides, w, h)!;
  const c = [ring.reduce((s, p) => s + p[0], 0) / sides, ring.reduce((s, p) => s + p[1], 0) / sides];
  const pos: number[] = [];
  for (const z of [-len / 2, len / 2]) {
    pos.push(c[0]!, c[1]!, z); // the hub
    for (const p of ring) pos.push(p[0], p[1], z);
  }
  for (const z of [-len / 2, len / 2]) for (const p of ring) pos.push(p[0], p[1], z); // the sides
  return pos;
}

describe("⭐ core/prism.ts — the tips: each cap's hub pushed out along the extrusion", () => {
  it("⭐ the hubs are the two vertices ON the axis (read before the stretch, the axis the origin's)", () => {
    // a unit ring round the z axis, a hub at each end
    const pos = [0, 0, -1, 1, 0, -1, 0, 1, -1, -1, 0, -1, 0, 0, 1, 1, 0, 1, 0, 1, 1, -1, 0, 1];
    expect(axisVertices(pos)).toEqual([0, 4]);
    expect(axisVertices([1, 0, 1, 0, 1, 1])).toEqual([]); // a ring alone: no hub
    expect(axisVertices([0, 0, 1, 0, 0, -1])).toEqual([]); // nothing off the axis: degenerate
  });

  it("⭐ raised: each hub goes OUT by the tip, away from the middle — the box grows 2 × tip along z, nothing else moves", () => {
    const pos = tippable(7, 4.83, 4.83, 4.9);
    const before = [...pos];
    expect(raiseTips(pos, [0, 8], 1.2)).toBe(true);
    expect(pos[2]).toBeCloseTo(-2.45 - 1.2, 12);
    expect(pos[8 * 3 + 2]).toBeCloseTo(2.45 + 1.2, 12);
    // ⭐ the apex on the polygon's centre: x and y kept
    for (const v of [0, 8]) {
      expect(pos[v * 3]).toBe(before[v * 3]);
      expect(pos[v * 3 + 1]).toBe(before[v * 3 + 1]);
    }
    // every other vertex unmoved
    pos.forEach((x, i) => {
      if (Math.floor(i / 3) !== 0 && Math.floor(i / 3) !== 8) expect(x).toBe(before[i]);
    });
    const zs = pos.filter((_, i) => i % 3 === 2);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(4.9 + 2 * 1.2, 12);
  });

  it("⛔ refused, nothing moved: a negative tip, a hub at the middle", () => {
    const pos = tippable(7, 1, 1, 2);
    const before = [...pos];
    expect(raiseTips(pos, [0, 8], -0.1)).toBe(false);
    expect(raiseTips([0, 0, 0, 0, 0, 1], [0, 1], 0.5)).toBe(false);
    expect(pos).toEqual(before);
  });

  it("⭐ wired: the prism fits the box LESS the tips, then raises the hubs found before the turn; scene.ts passes the tip in metres", () => {
    const b = code("render/bodies.ts");
    expect(b).toContain("const dims: readonly [number, number, number] = [whole[0], whole[1], whole[2] - 2 * tip];");
    expect(b).toContain("const hubs = tip > 0 ? axisVertices(at()) : [];");
    expect(b).toContain("if (raiseTips(pos, hubs, tip)) m.setVerticesData(VertexBuffer.PositionKind, pos);");
    // ⛔ raised BEFORE the flat shading (its normals are read off the raised positions)
    expect(b.indexOf("raiseTips(pos, hubs, tip)")).toBeLessThan(b.indexOf("m.convertToFlatShadedMesh();"));
    expect(code("render/scene.ts")).toContain("      b.prismSides,\n      (b.prismTip ?? 0) * unitM,\n    );");
  });
});

describe("⭐⭐ Scene_0bis — Scene_0 copied, its heptagon's two lateral faces tipped", () => {
  const hep = SCENE_0BIS.bodies.find((b) => b.id === "Heptagon")!;

  it("⭐ the heptagon: Scene_0's prism, a tip of 1.2 units at each end — its whole box 2 × 1.2 longer along the extrusion", () => {
    expect(SCENE_0BIS_TIP).toBe(1.2);
    expect(hep.prismTip).toBe(SCENE_0BIS_TIP);
    expect(hep.prismSides).toBe(7);
    expect(SCENE_0BIS_HEPTAGON_DIMS).toEqual(SCENE_0_HEPTAGON_DIMS);
    expect(SCENE_0BIS_BODY_DIMS).toEqual([SCENE_0_HEPTAGON_DIMS[0], SCENE_0_HEPTAGON_DIMS[1], SCENE_0_HEPTAGON_DIMS[2] + 2.4]);
    expect(hep.dims).toEqual(SCENE_0BIS_BODY_DIMS);
    expect(hep.position).toEqual(SCENE_0_HEPTAGON_POSITION);
  });

  it("⭐ everything else is Scene_0's: the goal face, the green piece's goals, the anchor, the floor, the final, the rig", () => {
    expect(heptagon0bisGoalFace()).toEqual(heptagonGoalFace());
    expect(SCENE_0BIS_ORBIT_GOALS).toEqual(SCENE_0_ORBIT_GOALS);
    const rest = (s: typeof SCENE_0) => s.bodies.filter((b) => b.id !== "Heptagon");
    expect(rest(SCENE_0BIS)).toEqual(rest(SCENE_0));
    expect(SCENE_0BIS.final).toEqual(SCENE_0.final);
    expect(SCENE_0BIS.orbit).toEqual(SCENE_0.orbit);
    expect(SCENE_0BIS.orbitPieceRefDims).toEqual(SCENE_0.orbitPieceRefDims);
    expect(SCENE_0BIS.playVolume).toEqual(SCENE_0.playVolume);
    // ⛔ and Scene_0 itself is untouched: flat ends
    expect(SCENE_0.bodies.find((b) => b.id === "Heptagon")!.prismTip).toBeUndefined();
  });

  it("⭐ its own id and title; the green piece boots as Scene_0's", () => {
    expect(SCENE_0BIS.id).toBe("Scene_0bis");
    expect(SCENE_0BIS.title).toBe("Scene 0bis — the heptagon with tips");
    expect(greenBootOrientation("Scene_0bis")).toEqual(greenBootOrientation("Scene_0"));
  });

  it("⭐ round-trips through the scene's JSON seam, the tip carried", () => {
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE_0BIS))).toEqual(SCENE_0BIS);
  });

  it("⛔ a bad tip is refused, named: negative, on a box, as long as half the body", () => {
    const ok = JSON.parse(serializeSceneDescriptor(SCENE_0BIS));
    const k = ok.bodies.findIndex((b: { id: string }) => b.id === "Heptagon");
    const bad = (mutate: (b: any) => void): string => {
      const o = JSON.parse(JSON.stringify(ok));
      mutate(o.bodies[k]);
      return JSON.stringify(o);
    };
    expect(() => parseSceneDescriptor(bad((b) => (b.prismTip = -1)))).toThrow(/Heptagon: prismTip/);
    expect(() => parseSceneDescriptor(bad((b) => delete b.prismSides))).toThrow(/Heptagon: prismTip/);
    expect(() => parseSceneDescriptor(bad((b) => (b.prismTip = b.dims[2] / 2)))).toThrow(/Heptagon: prismTip/);
    expect(() => parseSceneDescriptor(bad((b) => (b.prismTip = "1")))).toThrow(/Heptagon: prismTip/);
  });
});

describe("⭐ Level_0bis — appended (`?sceneIndex=4`), in the menu after Level 0", () => {
  const w0 = GAME_CONTENT.worlds.find((w) => w.id === "World_0")!;
  it("⭐ the catalogue: appended, the earlier indices unchanged", () => {
    expect(SCENES.map((s) => s.id)).toEqual(["Scene_0", "Scene_1", "Scene1_demo", "Scene_2", "Scene_0bis"]);
    expect(levelOf(GAME_CONTENT, "World_0", "Level_0bis")?.scene).toBe(SCENE_0BIS);
  });
  it("⭐ the menu: the demo, Level 0, Level 0bis, Level 1, Level 2", () => {
    expect(menuLevels(w0).map((l) => l.title)).toEqual([
      "Demo - the painting",
      "Level 0 - Scene 0 - the workbench",
      "Level 0bis - Scene 0bis - the heptagon with tips",
      "Level 1 - Scene 1 - the painting",
      "Level 2 - Scene 2 - the engine",
    ]);
  });
});
