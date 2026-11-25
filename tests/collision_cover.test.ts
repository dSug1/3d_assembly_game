/**
 * ⭐⭐⭐ (2026-11-23, S6 packet 3 — `30_OBJECTS_3D/spec/PROXY_AND_COLLISION_RULES.md` §3 C-R2 – C-R4, §7.1 rows 8, 10, §7.3 Q4, §8 decision 5 — DECIDED) THE
 * COLLISION PIECES TRUE TO THE PART BOTH WAYS, AND THE RESTING CANDIDATES — `checkCollisionPieces`: (a) no render outside the pieces (strict: a thin
 * feature circumscribed); (b) no piece sticking out of the part past τc — over a curve, a RING's facet within ±30° exempt within its GEOMETRIC sagitta;
 * `restingCandidates`: the real flat proxy faces on the hull, ≥ ¼ of the largest.
 * V1 PASSING controls; V2 one planted defect each; V3 `Scene_2`'s quick parts (the whole scene by `check_part_solids.ts`, ≈ 29 s). Each RED on its mutant
 * first (the rules study §9.5).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { glbBin } from "../src/core/glb_geometry";
import { glbJson, readModelCatalog } from "../src/core/model_catalog";
import { readPartSolids, type PartSolids } from "../src/core/part_checks";
import { checkCollisionPieces, restingCandidates } from "../src/core/collision_cover";
import { boxPiece, face, hollowCase, hull, ngonPiece, pocketBox, shaft, tube, withPieces } from "./helpers/proxy_shapes";

const rules = (p: PartSolids) => checkCollisionPieces([p]).map((f) => `${f.rule}${f.info ? "(info)" : ""} ${f.node}`);
const T = 60_000;
/** the case's five slabs round its pocket (the pocket OPEN, the slabs face to face) */
const slabs = () => [
  boxPiece("UCX_C_bottom", [-50, 0, -40], [50, 10, 40]), boxPiece("UCX_C_f", [-50, 10, -40], [50, 60, -20]), boxPiece("UCX_C_b", [-50, 10, 20], [50, 60, 40]),
  boxPiece("UCX_C_l", [-50, 10, -20], [-30, 60, 20]), boxPiece("UCX_C_r", [30, 10, -20], [50, 60, 20]),
];
const R = "REST(info) its proxy";

describe("⭐⭐⭐ V1 — PASSING controls", () => {
  it("the hollow case as five slabs, its pocket OPEN (a cavity a part enters left open; the slabs' shared faces inside the part)", () => expect(rules(withPieces(hollowCase(), slabs()))).toEqual([R]), T);
  it("the shaft in a CIRCUMSCRIBED 12-gon (C-R4: the render inside, 0.7 mm out at most)", () => expect(rules(withPieces(shaft(6), [ngonPiece("UCX_S", 12, 20 / Math.cos(Math.PI / 12))]))).toEqual([R]), T);
  it("the chamfered hull as its own hull", () => expect(rules(withPieces(hull(), [{ ...hull().renders[0]!, name: "UCX_H" }]))).toEqual([R]), T);
  it("⭐ a tube's bore lined by a RING of six slabs (the angle rule: each chord 2.7 mm off the bore — its sagitta, exempt; the lens at the tube's ends too)", () => expect(rules(tube(6))).toEqual([R]), T);
});

describe("⭐⭐⭐ V2 — one planted defect each reads exactly its rule", () => {
  it("C-R2 (b) — the case as ONE box: it fills the pocket, its top 20 mm and more over the pocket's mouth (a false contact)", () => expect(rules(withPieces(hollowCase(), [boxPiece("UCX_C_box", [-50, 0, -40], [50, 60, 40])]))).toEqual([R, "C-R2 UCX_C_box"]), T);
  it("C-R2 (a) — the shaft in an INSCRIBED hexagon: the render 2.7 mm outside its piece (a thin feature circumscribed)", () => expect(rules(withPieces(shaft(6), [ngonPiece("UCX_S", 6, 20)]))).toEqual([R, "C-R2 its pieces"]), T);
  it("C-R2 (a) — the case's bottom slab inset 3 mm: the render outside it", () => {
    expect(rules(withPieces(hollowCase(), [...slabs().slice(1), boxPiece("UCX_C_bottom", [-47, 3, -37], [47, 10, 37])]))).toEqual([R, "C-R2 its pieces"]);
  }, T);
  it("C-R2 — no collision piece at all", () => expect(rules(hollowCase())).toEqual([R, "C-R2 its pieces"]), T);
  it("⭐ C-R2 (b) — the bore's ring of THREE slabs: 120° chords turn ±60° from the bore, 9.9 mm off it (the angle rule: ±30° at most)", () => expect(rules(tube(3))).toEqual([R, "C-R2 UCX_T_0", "C-R2 UCX_T_1", "C-R2 UCX_T_2"]), T);
  it("⭐ C-R2 (b) — one slab of the six pushed 5 mm into the bore: its span still ±30°, but past its GEOMETRIC sagitta (never the measured distance)", () => expect(rules(tube(6, 20, 40, 120, 5))).toEqual([R, "C-R2 UCX_T_0"]), T);
  it("REST — a part whose proxy is only a RESTING face: no candidate (it cannot be laid down by the rule)", () => {
    const p = withPieces(shaft(6), [ngonPiece("UCX_S", 12, 20 / Math.cos(Math.PI / 12))]);
    expect(rules({ ...p, proxy: [face("UFM_S_rest", [[0, 30, -10], [10, 30, -10], [10, 30, 10], [0, 30, 10]], [0, 1, 0])] })).toEqual(["REST its proxy"]);
  }, T);
  it("REST — the candidates: the hull's faces ≥ ¼ of its bottom (its 6 mm chamfers left out), the largest first", () => {
    const c = restingCandidates(hull(3));
    expect(c.length).toBe(6);
    expect(c[0]!.areaMm2).toBeCloseTo(24000, 0);
  }, T);
  it("REST — only faces ON the hull: the case's pocket faces (followed) are no candidates", () => {
    expect(restingCandidates(pocketBox({ proxy: "follow" })).map((c) => c.name)).toEqual(["UFM_C_bottom", "UFM_C_front", "UFM_C_back", "UFM_C_top", "UFM_C_left", "UFM_C_right"]);
  }, T);
});

describe("⭐⭐ V3 — `Scene_2`'s quick parts (not rebuilt here — its findings for the future workflows)", () => {
  it("the plinth's piece short of its render; the crankshaft's pieces 3 – 5.6 mm out of its webs; a piston's pieces 9 – 15 mm out (its skirt filled) and its render up to 29 mm outside them; E17", () => {
    const bytes = new Uint8Array(readFileSync(new URL("../Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb", import.meta.url)));
    const j = glbJson(bytes);
    if (!("json" in j)) throw new Error(j.refusal);
    const { catalog } = readModelCatalog(j.json);
    if (catalog === null) throw new Error("refused");
    const quick = new Set(["E01", "E03", "E07", "E17"]);
    const f = checkCollisionPieces(readPartSolids(j.json, glbBin(bytes), catalog).filter((p) => quick.has(p.id)));
    expect(f.map((x) => `${x.rule}${x.info ? "(info)" : ""} ${x.part} ${x.node}`)).toEqual(PINNED);
  }, 120_000);
});
const PINNED = ["REST(info) E01 its proxy", "C-R2 E01 its pieces", "REST(info) E03 its proxy", ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => `C-R2 E03 UCX_E03_${String(k).padStart(2, "0")}`),
  "REST E07 its proxy", "C-R2 E07 its pieces", "C-R2 E07 UCX_E07_00", "C-R2 E07 UCX_E07_01", "REST(info) E17 its proxy", "C-R2 E17 its pieces", "C-R2 E17 UCX_E17_00"];
