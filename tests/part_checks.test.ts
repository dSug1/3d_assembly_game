/**
 * ⭐⭐⭐ (2026-11-23, package S5 — `ORBIT_SURFACE_PART_CHECKS.md`; his word *"Game side first"*) B1, THE SOLIDS, on the game's side — V1 `Scene_2`'s
 * report pinned (⭐ the plinth's proxy NOT complete — his word: *"Make sure the same is detected by your scripts"*); V2 a clean part passes and each
 * check's CONTROL — one planted defect each — reads exactly that check (*"a check never seen failing is not trusted"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { glbBin } from "../src/core/glb_geometry";
import { convexHull3 } from "../src/core/hull3";
import { glbJson, readModelCatalog } from "../src/core/model_catalog";
import { B1_FIT_MM, checkSolids, readPartSolids, UCX_MAX_VERTICES, type PartMesh, type PartSolids } from "../src/core/part_checks";
import type { Vec3 } from "../src/core/vec";

const GLB = new URL("../Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb", import.meta.url);

describe("⭐⭐⭐ V1 — B1 on `Scene_2`'s exported file", () => {
  const bytes = new Uint8Array(readFileSync(GLB));
  const j = glbJson(bytes);
  if (!("json" in j)) throw new Error(j.refusal);
  const { catalog } = readModelCatalog(j.json);
  if (catalog === null) throw new Error("refused");
  const findings = checkSolids(readPartSolids(j.json, glbBin(bytes), catalog));
  it("⭐ THE PLINTH (E01): its top's proxy NOT complete — a HOLE inside the face it lies on (its four corners cut), not only a strip at its edges", () => {
    const h = findings.find((f) => f.check === "B1h" && f.part === "E01");
    expect(h, "the plinth's incomplete proxy must be found").toBeDefined();
    expect(h!.detail).toMatch(/INSIDE the faces \(a hole in the proxy\)/);
  });
  it("the report, pinned (each a finding for his word — the file or an exemption, `ORBIT_SURFACE_BUILD.md` §8)", () => {
    expect(findings.map((f) => `${f.check} ${f.part} ${f.node}`)).toEqual([
      "B1e E01 UFM_E01_top", "B1h E01 UFM_*", "B1e E02 UFM_E02_outer", "B1e E03 UFM_E03_rest", "B1h E03 UFM_*", "B1e E04 UFM_E04_outer",
      "B1e E05 UFM_E05_outer", "B1e E06 UFM_E06_outer", "B1e E07 UFM_E07_rest", "B1e E08 UFM_E08_rest", "B1e E09 UFM_E09_rest", "B1e E10 UFM_E10_rest",
      "B1e E11 UFM_E11_rest", "B1e E12 UFM_E12_rest", "B1e E13 UFM_E13_rest", "B1h E13 UFM_*", "B1e E14 UFM_E14_rest", "B1h E14 UFM_*",
      "B1e E17 UFM_E17_faces", "B1f E17 UFM_E17_faces", "B1h E17 UFM_*",
    ]);
  });
  it("its collision pieces: convex, closed, with volume, within the budget (B1a – B1d: none found)", () => {
    expect(findings.filter((f) => ["B1a", "B1b", "B1c", "B1d"].includes(f.check))).toEqual([]);
  });
});

// a clean part: a 100 × 100 × 40 mm box (its hull: closed, outward), its proxy its top (two triangles, wound up)
const boxPiece = (name: string, x: number, y: number, z0: number, z1: number): PartMesh => {
  const pts: Vec3[] = [];
  for (const a of [-x, x]) for (const b of [-y, y]) for (const c of [z0, z1]) pts.push([a, b, c]);
  const h = convexHull3(pts)!;
  return { name, points: h.points, triangles: h.triangles };
};
const quad = (name: string, x0: number, y0: number, x1: number, y1: number, z: number, flip = false): PartMesh => ({
  name,
  points: [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]],
  triangles: flip ? [[0, 2, 1], [0, 3, 2]] : [[0, 1, 2], [0, 2, 3]],
});
const part = (pieces: PartMesh[], proxy: PartMesh[]): PartSolids => ({ id: "P", frozen: false, fitMm: B1_FIT_MM, pieces, proxy });
const BOX = boxPiece("UCX_P", 50, 50, 0, 40);
const TOP = quad("UFM_P_top", -50, -50, 50, 50, 40);
const checks = (p: PartSolids) => checkSolids([p]).map((f) => f.check);

describe("⭐⭐⭐ V2 — each check's CONTROL: a clean part passes; one planted defect each reads exactly its check", () => {
  it("the clean part: no finding", () => expect(checkSolids([part([BOX], [TOP])])).toEqual([]));
  it("B1a — a piece with a point inside its hull (not convex)", () => {
    expect(checks(part([{ ...BOX, points: [...BOX.points, [0, 0, 20]] }], [TOP]))).toEqual(["B1a"]);
  });
  it("B1b — a triangle missing (not closed)", () => {
    expect(checks(part([{ ...BOX, triangles: BOX.triangles.slice(1) }], [TOP]))).toEqual(["B1b"]);
  });
  it("B1c — a flat piece (no volume): reported, and the part's proxy then has no solid to be read on", () => {
    const flat: PartMesh = { name: "UCX_P_flat", points: [[-50, -50, 0], [50, -50, 0], [50, 50, 0], [-50, 50, 0]], triangles: [[0, 1, 2], [0, 2, 3]] };
    expect(checks(part([flat], [TOP]))).toEqual(["B1c"]);
  });
  it(`B1d — a dense piece (a 15-sided prism: 30 vertices, over ${UCX_MAX_VERTICES})`, () => {
    const pts: Vec3[] = [];
    for (let k = 0; k < 15; k++) for (const z of [0, 40]) pts.push([50 * Math.cos((2 * Math.PI * k) / 15), 50 * Math.sin((2 * Math.PI * k) / 15), z]);
    const h = convexHull3(pts)!;
    expect(checks(part([{ name: "UCX_P", points: h.points, triangles: h.triangles }], []))).toEqual(["B1d"]);
  });
  it("B1e — the proxy lifted twice the fit off its solid (and its solid's top then uncovered: B1h)", () => {
    expect(checks(part([BOX], [quad("UFM_P_top", -50, -50, 50, 50, 40 + 2 * B1_FIT_MM)]))).toEqual(["B1e"]);
  });
  it("B1f — the proxy flipped (facing into its solid; facing down it lies on no face of its solid: B1h does not read it)", () => {
    expect(checks(part([BOX], [quad("UFM_P_top", -50, -50, 50, 50, 40, true)]))).toEqual(["B1f"]);
  });
  it("⭐ B1h — a corner cut from the proxy (the plinth's case): a HOLE inside the face", () => {
    const cut: PartMesh = { name: "UFM_P_top", points: [[-50, -50, 40], [50, -50, 40], [50, 20, 40], [20, 50, 40], [-50, 50, 40]], triangles: [[0, 1, 2], [0, 2, 3], [0, 3, 4]] };
    const f = checkSolids([part([BOX], [cut])]);
    expect(f.map((x) => x.check)).toEqual(["B1h"]);
    expect(f[0]!.detail).toMatch(/INSIDE the faces/);
  });
  it("B1h — the proxy set in 2 mm from its face's edges: a STRIP, none inside", () => {
    const f = checkSolids([part([BOX], [quad("UFM_P_top", -48, -48, 48, 48, 40)])]);
    expect(f.map((x) => x.check)).toEqual(["B1h"]);
    expect(f[0]!.detail).toMatch(/none inside the faces \(a strip along their edges\)/);
  });
});
