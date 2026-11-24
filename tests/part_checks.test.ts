/**
 * ⭐⭐⭐ (2026-11-23, package S5 — `ORBIT_SURFACE_PART_CHECKS.md`; his word *"Game side first"*) B1, THE SOLIDS, on the game's side — V1 `Scene_2`'s
 * report pinned (⭐ the plinth's proxy NOT complete — his word: *"Make sure the same is detected by your scripts"*); V2 a clean part passes and each
 * check's CONTROL — one planted defect each — reads exactly that check (*"a check never seen failing is not trusted"*).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { glbBin, partGeometry } from "../src/core/glb_geometry";
import { convexHull3 } from "../src/core/hull3";
import { glbJson, readModelCatalog } from "../src/core/model_catalog";
import { B1_FIT_MM, checkSolids, exposedPerStage, readPartSolids, UCX_MAX_VERTICES, type PartMesh, type PartSolids } from "../src/core/part_checks";
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
      // ⛔ (2026-11-23, corrected) the RESTING PROXIES (`…_rest`) are VIRTUAL by design (the 11-13 principle): no longer read as off their solids
      "B1e E01 UFM_E01_top", "B1h E01 UFM_*", "B1e E02 UFM_E02_outer", "B1h E03 UFM_*", "B1e E04 UFM_E04_outer", "B1e E05 UFM_E05_outer",
      "B1e E06 UFM_E06_outer", "B1h E13 UFM_*", "B1h E14 UFM_*", "B1e E17 UFM_E17_faces", "B1f E17 UFM_E17_faces", "B1h E17 UFM_*",
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
const part = (pieces: PartMesh[], proxy: PartMesh[]): PartSolids => ({ id: "P", frozen: false, fitMm: B1_FIT_MM, pieces, proxy, renders: [] });
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

// ─────────────────────────────── B2 — EXPOSED PER STAGE, and B1i (D7, PROPOSED) ───────────────────────────────
const quadsOfBox = (name: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, faces = "xXyYzZ"): PartMesh => {
  const P: Vec3[] = [];
  const T: [number, number, number][] = [];
  const add = (q: Vec3[]) => { const b = P.length; P.push(...q); T.push([b, b + 1, b + 2], [b, b + 2, b + 3]); };
  if (faces.includes("x")) add([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]);
  if (faces.includes("X")) add([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]);
  if (faces.includes("y")) add([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]);
  if (faces.includes("Y")) add([[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]]);
  if (faces.includes("z")) add([[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]]);
  if (faces.includes("Z")) add([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]);
  return { name, points: P, triangles: T };
};
const solidBox = (name: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): PartMesh => {
  const pts: Vec3[] = [];
  for (const a of [x0, x1]) for (const b of [y0, y1]) for (const c of [z0, z1]) pts.push([a, b, c]);
  const h = convexHull3(pts)!;
  return { name, points: h.points, triangles: h.triangles };
};
const at0 = (ids: string[]) => new Map(ids.map((id) => [id, { position: [0, 0, 0] as Vec3, rotation: [1, 0, 0, 0] as const }]));
const solids = (id: string, pieces: PartMesh[], proxy: PartMesh[], frozen = false): PartSolids => ({ id, frozen, fitMm: B1_FIT_MM, pieces, proxy, renders: [] });

describe("⭐⭐⭐ V3 — B2 on `Scene_2`: the map per stage, and B1i (D7) on the plinth", () => {
  const bytes = new Uint8Array(readFileSync(GLB));
  const j = glbJson(bytes);
  if (!("json" in j)) throw new Error(j.refusal);
  const { catalog } = readModelCatalog(j.json);
  if (catalog === null) throw new Error("refused");
  const bin = glbBin(bytes);
  const mm = catalog.unitM * 1000;
  const goals = new Map(partGeometry(j.json, bin, catalog).map((g) => [g.id, { position: [g.goal.position[0] * mm, g.goal.position[1] * mm, g.goal.position[2] * mm] as Vec3, rotation: g.goal.rotation }]));
  const m = exposedPerStage(readPartSolids(j.json, bin, catalog), goals, new Set(catalog.parts.filter((p) => p.frozen).map((p) => p.id)));
  it("17 stages (the plinth placed from the start, then each part); the plinth's bottom GLUED to the floor, its top exposed", () => {
    expect(m.stages.map((s) => s.placed)).toEqual(["E01", ...Array.from({ length: 16 }, (_, k) => `E${String(k + 2).padStart(2, "0")}`)]);
    expect(m.stages[0]!.parts).toEqual([{ id: "E01", exposed: 34, glued: 0, buried: 0, sealed: 0 }]);
  });
  it("the last stage, pinned — ⭐ E03's nose GLUED once E17 seats on it (a seat that seals a face); E17's proxy half BURIED (the half B1f finds inward)", () => {
    const last = m.stages[m.stages.length - 1]!.parts.map((p) => `${p.id} e${p.exposed}/g${p.glued}/b${p.buried}/s${p.sealed}`).join(" ");
    expect(last).toBe("E01 e34/g0/b0/s0 E02 e54/g2/b0/s0 E03 e2/g14/b0/s0 E04 e177/g39/b0/s0 E05 e173/g7/b0/s0 E06 e173/g7/b0/s0 E07 e2/g0/b0/s0 E08 e2/g0/b0/s0 E09 e2/g0/b0/s0 E10 e2/g0/b0/s0 E11 e2/g0/b0/s0 E12 e2/g0/b0/s0 E13 e68/g0/b0/s0 E14 e68/g0/b0/s0 E15 e30/g0/b0/s0 E16 e30/g0/b0/s0 E17 e22/g0/b22/s0");
  });
  it("⭐ B1i (D7, PROPOSED) — the PLINTH's sides, which the outside reaches, have no proxy (his reading: *\"not a closed mesh but a quad\"*)", () => {
    const p = m.uncovered.find((f) => f.part === "E01");
    expect(p, "the plinth's open sides must be found").toBeDefined();
    expect(p!.detail).toMatch(/within -258…258 × 3…58 × -269…270 mm/); // its whole height: its four sides
    expect(m.uncovered.length).toBe(17); // ⚠ read literally D7 flags every part (each proxy a selection of faces) — his word owed on the rule
  });
});

describe("⭐⭐⭐ V4 — B2's and B1i's CONTROLS (one planted case each)", () => {
  it("EXPOSED and GLUED: two boxes side by side — the face between them glued, the others exposed (the bottoms glued to the floor)", () => {
    const a = solids("A", [solidBox("UCX_A", 0, 40, 0, 40, 0, 40)], [quadsOfBox("UFM_A", 0, 40, 0, 40, 0, 40, "XY")]);
    const b = solids("B", [solidBox("UCX_B", 40, 80, 0, 40, 0, 40)], [quadsOfBox("UFM_B", 40, 80, 0, 40, 0, 40, "y")]);
    const m = exposedPerStage([a, b], at0(["A", "B"]), new Set());
    expect(m.stages.map((s) => s.placed)).toEqual(["A", "B"]);
    expect(m.stages[0]!.parts).toEqual([{ id: "A", exposed: 4, glued: 0, buried: 0, sealed: 0 }]);
    expect(m.stages[1]!.parts).toEqual([{ id: "A", exposed: 2, glued: 2, buried: 0, sealed: 0 }, { id: "B", exposed: 0, glued: 2, buried: 0, sealed: 0 }]);
  });
  it("SEALED: a proxy on a cavity's floor once the lid closes it", () => {
    const walls = [solidBox("UCX_C1", 0, 80, 0, 8, 0, 80), solidBox("UCX_C2", 0, 8, 8, 60, 0, 80), solidBox("UCX_C3", 72, 80, 8, 60, 0, 80), solidBox("UCX_C4", 8, 72, 8, 60, 0, 8), solidBox("UCX_C5", 8, 72, 8, 60, 72, 80)];
    const box = solids("C", walls, [quadsOfBox("UFM_C", 8, 72, 0, 8, 8, 72, "Y")]);
    const lid = solids("L", [solidBox("UCX_L", 0, 80, 60, 68, 0, 80)], []);
    const m = exposedPerStage([box, lid], at0(["C", "L"]), new Set());
    expect(m.stages[0]!.parts[0]).toEqual({ id: "C", exposed: 2, glued: 0, buried: 0, sealed: 0 });
    expect(m.stages[1]!.parts[0]).toEqual({ id: "C", exposed: 0, glued: 0, buried: 0, sealed: 2 });
  });
  it("BURIED: a proxy turned into its own part", () => {
    const flipped = quadsOfBox("UFM_D", 0, 40, 0, 40, 0, 40, "Y");
    const d = solids("D", [solidBox("UCX_D", 0, 40, 0, 40, 0, 40)], [{ ...flipped, triangles: flipped.triangles.map(([x, y, z]) => [x, z, y] as [number, number, number]) }]);
    expect(exposedPerStage([d], at0(["D"]), new Set()).stages[0]!.parts[0]).toEqual({ id: "D", exposed: 0, glued: 0, buried: 2, sealed: 0 });
  });
  it("⭐ B1i: a box whose proxy is its top only — its sides reached, not covered; its proxy closed (the bottom on the floor apart) — none", () => {
    const top = solids("E", [solidBox("UCX_E", 0, 60, 0, 30, 0, 60)], [quadsOfBox("UFM_E", 0, 60, 0, 30, 0, 60, "Y")]);
    const m1 = exposedPerStage([top], at0(["E"]), new Set());
    expect(m1.uncovered.map((f) => f.check + " " + f.part)).toEqual(["B1i E"]);
    const closed = solids("E", [solidBox("UCX_E", 0, 60, 0, 30, 0, 60)], [quadsOfBox("UFM_E", 0, 60, 0, 30, 0, 60, "xXYzZ")]);
    expect(exposedPerStage([closed], at0(["E"]), new Set()).uncovered).toEqual([]);
  });
});
