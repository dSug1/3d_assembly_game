/**
 * ⭐⭐ `core/model_catalog.ts` — a scene's `.glb` read as the game's data, and refused by name where it breaks a convention
 * (`PART_AUTHORING.md` §3, §4.4; W4 of `SCENE_WORKFLOW.md`). Read on the REAL file (`Scene_2`'s engine), then on broken copies of it:
 * ⛔ every guard is shown to FIRE on its own counter-example, else it is not trusted (`METHOD.md`: a test that cannot fail is not a test).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { catalogSlice, glbJson, layerOf, layersShown, readModelCatalog } from "../src/core/model_catalog";

const GLB = fileURLToPath(new URL("../Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb", import.meta.url));
const bytes = new Uint8Array(readFileSync(GLB));
const parsed = glbJson(bytes);
if (!("json" in parsed)) throw new Error(parsed.refusal);
const JSON0 = parsed.json as { nodes: { name: string; extras?: Record<string, unknown>; rotation?: number[] }[]; [k: string]: unknown };
const copy = (): typeof JSON0 => structuredClone(JSON0);
const node = (j: typeof JSON0, name: string) => {
  const n = j.nodes.find((x) => x.name === name);
  if (!n) throw new Error(`no node ${name}`);
  return n;
};

describe("Scene_2's engine — the real file", () => {
  const { catalog, refusals } = readModelCatalog(JSON0);

  it("reads with no refusal: one Y-up root, unitM 0.14, the 17 parts in the plan's order", () => {
    expect(refusals).toEqual([]);
    expect(catalog!.root).toBe("YUP_ROOT");
    expect(catalog!.unitM).toBe(0.14);
    expect(catalog!.parts.map((p) => p.id)).toEqual(
      ["E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08", "E09", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17"],
    );
  });

  it("⭐ the scene's FLOOR, designed in the Blender file: a child of the root, not a part", () => {
    expect(catalog!.floor).toBe("FLOOR");
    expect(catalog!.parts.some((p) => p.node === "FLOOR")).toBe(false);
  });

  it("the plinth is the one anchor; symmetries and kinds as the plan's catalogue", () => {
    expect(catalog!.parts.filter((p) => p.frozen).map((p) => p.id)).toEqual(["E01"]);
    const by = (id: string) => catalog!.parts.find((p) => p.id === id)!;
    expect(by("E02").symmetry).toBe("yawHalfTurn");
    expect(by("E17").symmetry).toBe("spinFree");
    expect(by("E05").kind).toBe("bank");
  });

  it("the crank's ghost at the tub's mouth: for E03, plunging 0.179 down onto MC_E02_crank", () => {
    const g = catalog!.parts.find((p) => p.id === "E02")!.ghosts;
    expect(g).toEqual([{ node: "UFM_E02_GHOST_crank", forPart: "E03", plunge: { axis: [0, -1, 0], depth: 0.179, to: "MC_E02_crank" } }]);
  });

  it("the upper case's slope ghosts BRIDGE for the banks (no plunge); the bores' ghosts plunge the pistons and valve sets", () => {
    const g = catalog!.parts.find((p) => p.id === "E04")!.ghosts;
    expect(g.map((x) => [x.node, x.forPart, x.plunge])).toEqual([
      ["UFM_E04_GHOST_slope_E05", "E05", null],
      ["UFM_E04_GHOST_slope_E06", "E06", null],
    ]);
    const bank = catalog!.parts.find((p) => p.id === "E05")!.ghosts;
    expect(bank.map((x) => x.forPart)).toEqual(["E07", "E08", "E09", "E13"]);
    expect(bank.every((x) => x.plunge !== null)).toBe(true);
  });

  it("the crank's seats, its collision pieces and faces; the pulley's seat faces the crank's nose (anti-parallel, coincident)", () => {
    const crank = catalog!.parts.find((p) => p.id === "E03")!;
    expect(crank.seats.map((s) => s.node)).toContain("MC_E03_nose");
    expect(crank.ucx.length).toBe(14);
    expect(crank.faces).toEqual(["UFM_E03_nose", "UFM_E03_rest"]);
    const nose = crank.seats.find((s) => s.node === "MC_E03_nose")!;
    const pulley = catalog!.parts.find((p) => p.id === "E17")!.seats.find((s) => s.node === "MC_E17_nose")!;
    expect(nose.normal.map((v, i) => v + pulley.normal[i]!).every((v) => Math.abs(v) < 1e-6)).toBe(true);
    expect(nose.position.map((v, i) => v - pulley.position[i]!).every((v) => Math.abs(v) < 1e-4)).toBe(true);
  });

  it("a piston's rod on its hinge, its cap appearing when seated, its number metadata", () => {
    const p = catalog!.parts.find((x) => x.id === "E07")!;
    expect(p.hinges.map((h) => h.node)).toEqual(["HINGE_E07_wrist"]);
    expect(p.renders.find((r) => r.node === "E07_rod_mesh")!.hinge).toBe("HINGE_E07_wrist");
    expect(p.renders.find((r) => r.node === "E07_rod_cap")!.appearsWhenSeated).toBe(true);
    expect(p.renders.find((r) => r.node === "E07_piston_number")!.metadata).toBe(true);
  });

  it("the slice — the plinth, the lower case, the crankshaft, the pulley — holds its anchor", () => {
    const s = catalogSlice(catalog!, ["E01", "E02", "E03", "E17"]);
    expect(s.refusals).toEqual([]);
    expect(s.parts.map((p) => p.id)).toEqual(["E01", "E02", "E03", "E17"]);
    expect(catalogSlice(catalog!, ["E02", "E03"]).refusals).toEqual(["the slice has no anchor (no frozen part)"]);
    expect(catalogSlice(catalog!, ["E01", "E99"]).refusals).toEqual(["the slice names E99: not a part of the file"]);
  });
});

describe("broken copies — each convention refused, by name", () => {
  const refused = (j: unknown): readonly string[] => {
    const r = readModelCatalog(j);
    expect(r.catalog).toBeNull();
    return r.refusals;
  };

  it("⭐ the AXES control: the root's +Y-up turn removed → every seat refused (its node no longer where its frame says)", () => {
    const j = copy();
    delete node(j, "YUP_ROOT").rotation;
    const r = refused(j);
    expect(r.filter((x) => /exported without \+Y up/.test(x)).length).toBeGreaterThanOrEqual(48);
  });

  it("a seat moved off its recorded place", () => {
    const j = copy();
    (node(j, "MC_E03_nose").extras!["position"] as number[])[0] = 1.4;
    expect(refused(j).some((x) => x.startsWith("MC_E03_nose: its node is at"))).toBe(true);
  });

  it("no unitM on the root", () => {
    const j = copy();
    delete node(j, "YUP_ROOT").extras!["unitM"];
    expect(refused(j)).toContain("root YUP_ROOT: no unitM > 0 in its extras");
  });

  it("a double-sided material, an animation, a camera", () => {
    const j = copy() as Record<string, unknown> & typeof JSON0;
    (j["materials"] as { doubleSided?: boolean }[])[0]!.doubleSided = true;
    j["animations"] = [{}];
    j["cameras"] = [{}];
    const r = refused(j);
    expect(r.some((x) => /double-sided/.test(x))).toBe(true);
    expect(r.some((x) => /animation/.test(x))).toBe(true);
    expect(r.some((x) => /camera/.test(x))).toBe(true);
  });

  it("an unknown role; a collision piece misnamed", () => {
    const j = copy();
    node(j, "UFM_E03_rest").extras!["role"] = "proxy";
    node(j, "UCX_E03_00").name = "COL_E03_00";
    const r = refused(j);
    expect(r).toContain('UFM_E03_rest (in E03_crankshaft): unknown role "proxy"');
    expect(r).toContain("COL_E03_00: role ucx but its name does not start with UCX_");
  });

  it("a ghost plunging onto a marker its host does not have; a ghost for a part not in the file", () => {
    const j = copy();
    node(j, "UFM_E02_GHOST_crank").extras!["plunge_to"] = "MC_E02_nowhere";
    node(j, "UFM_E02_GHOST_crank").extras!["for_part"] = "E99";
    const r = refused(j);
    expect(r).toContain("UFM_E02_GHOST_crank: plunge_to MC_E02_nowhere is not a seat marker of E02_lower_case");
    expect(r).toContain("UFM_E02_GHOST_crank: for_part E99 is not a part of the file");
  });

  it("half a plunge (an axis without its depth and target); a ghost without for_part", () => {
    const j = copy();
    node(j, "UFM_E04_GHOST_slope_E05").extras!["plunge_axis"] = [0, -1, 0];
    delete node(j, "UFM_E04_GHOST_slope_E06").extras!["for_part"];
    const r = refused(j);
    expect(r).toContain("UFM_E04_GHOST_slope_E05: half a plunge (plunge_axis): plunge_axis, plunge and plunge_to go together");
    expect(r).toContain("UFM_E04_GHOST_slope_E06: ghost without for_part");
  });

  it("a part_id used twice; a part without a step", () => {
    const j = copy();
    node(j, "E17_pulley").extras!["part_id"] = "E03";
    delete node(j, "E02_lower_case").extras!["step"];
    const r = refused(j);
    expect(r).toContain("E17_pulley: part_id E03 used twice");
    expect(r).toContain("E02_lower_case: no step (a whole number ≥ 1)");
  });

  it("two floors; a floor without a mesh", () => {
    const j = copy() as typeof JSON0 & { scenes: { nodes: number[] }[] };
    const fi = j.nodes.findIndex((n) => n.name === "FLOOR");
    const rootNode = node(j, "YUP_ROOT") as { children?: number[] };
    j.nodes.push({ ...structuredClone(j.nodes[fi]!), name: "FLOOR2" });
    rootNode.children!.push(j.nodes.length - 1);
    delete (j.nodes[fi] as { mesh?: number }).mesh;
    const r = refused(j);
    expect(r).toContain("2 floors (FLOOR, FLOOR2): at most one");
    expect(r).toContain("FLOOR: role floor without a mesh");
  });

  it("not a .glb at all", () => {
    const bad = bytes.slice();
    bad[0] = 0;
    expect(glbJson(bad)).toEqual({ refusal: "not a .glb: no 'glTF' magic" });
    expect(glbJson(new Uint8Array(4))).toEqual({ refusal: "not a .glb: 4 bytes" });
  });
});

describe("the debug layers (the modelLayers slider)", () => {
  it("each mesh's layer from its name; a ghost told from a real face by the catalogue", () => {
    const ghosts = new Set(["UFM_E02_GHOST_crank"]);
    expect(layerOf("E03_crankshaft_mesh", ghosts)).toBe("render");
    expect(layerOf("UCX_E03_00", ghosts)).toBe("ucx");
    expect(layerOf("UFM_E02_outer", ghosts)).toBe("face");
    expect(layerOf("UFM_E02_GHOST_crank", ghosts)).toBe("ghost");
  });
  it("0 the look only, 1 + collision, 2 + proxies and ghosts, 3 all", () => {
    const s = (v: number) => [...layersShown(v)].sort();
    expect(s(0)).toEqual(["render"]);
    expect(s(1)).toEqual(["render", "ucx"]);
    expect(s(2)).toEqual(["face", "ghost", "render"]);
    expect(s(3)).toEqual(["face", "ghost", "render", "ucx"]);
  });
});
