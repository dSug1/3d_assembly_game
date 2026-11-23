/**
 * ⭐⭐⭐ (2026-11-23, S6 — `30_OBJECTS_3D/spec/PROXY_AND_COLLISION_RULES.md` §7.3, his decisions; packet 1) THE PROXY'S OWN RULES — R7 one planar face a
 * node, R3 no travelled face under 10 mm (a riser apart), R4 neighbours one face or ≥ 30° apart and no face within 15° of 45° of elevation, R2 a
 * planar face ON its flat real face (0.25 mm) and a curve's facet within ±30° of it; the virtual faces (a resting proxy, a cap) exempt.
 * V1 his three shapes as CLEAN reference parts (a shaft — a hexagon face up over a round render; a hollow case — its pocket capped; a chamfered
 * hull) pass; V2 one planted defect each reads exactly its rule; V3 `Scene_2`'s report pinned. Each RED on its mutant first (§9).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { glbBin, partGeometry, type Placement } from "../src/core/glb_geometry";
import { glbJson, readModelCatalog } from "../src/core/model_catalog";
import { checkProxyFaces, readPartSolids, type PartMesh, type PartSolids } from "../src/core/part_checks";
import type { Vec3 } from "../src/core/vec";
import { at0, face, hollowCase, hull, mesh, part, pocketBox, shaft } from "./helpers/proxy_shapes";

const rules = (p: PartSolids, goals?: ReadonlyMap<string, Placement>) => checkProxyFaces([p], goals).map((f) => f.rule + (f.info ? "(info)" : ""));

describe("⭐⭐⭐ V1 — his three shapes, CLEAN: every rule passes", () => {
  it("a shaft — a HEXAGON, a face up, over its round render (its facets within ±30° of the curve, their sagitta exempt; no face near 45°)", () => {
    expect(rules(shaft(6), at0("S"))).toEqual([]);
  });
  it("a hollow case — its pocket CAPPED (the cap virtual: no fidelity, no split with the ring around it)", () => expect(rules(hollowCase(), at0("C"))).toEqual([]));
  it("a chamfered hull — faces 30° and 60° apart, its chamfers at 60° of elevation", () => expect(rules(hull(), at0("H"))).toEqual([]));
});

describe("⭐⭐⭐ V2 — one planted defect each reads exactly its rule", () => {
  it("R7 — two of the shaft's faces in ONE node (not one planar face)", () => {
    const p = shaft(6);
    const two = mesh("UFM_S_two", [p.proxy[0]!, p.proxy[1]!]);
    expect(rules({ ...p, proxy: [two, ...p.proxy.slice(2)] })).toEqual(["R7"]);
  });
  it("R7 — the hull's top split into two coplanar nodes (one face in two)", () => {
    const p = hull();
    const top = p.proxy.find((f) => f.points.length > 0 && f.triangles.every((t) => t.every((i) => f.points[i]![1] > 79.999)))!;
    const halves = top.triangles.map((t, k): PartMesh => ({ name: `UFM_H_top${k}`, points: top.points, triangles: [t] }));
    expect(rules({ ...p, proxy: [...p.proxy.filter((f) => f !== top), ...halves] })).toEqual(["R7"]);
  });
  it("R3 — a chamfer 6 mm across (under 10 mm, between faces that are not parallel: no riser)", () => {
    expect(rules(hull(3))).toEqual(["R3", "R3"]);
  });
  it("R3 — a 5 mm RISER between two parallel faces: information, not a failure", () => {
    const up: Vec3 = [0, 1, 0];
    const p = part("R", [face("UFM_R_low", [[-100, 60, -50], [0, 60, -50], [0, 60, 50], [-100, 60, 50]], up), face("UFM_R_high", [[0, 65, -50], [100, 65, -50], [100, 65, 50], [0, 65, 50]], up), face("UFM_R_step", [[0, 60, -50], [0, 65, -50], [0, 65, 50], [0, 60, 50]], [-1, 0, 0])], []);
    expect(rules(p)).toEqual(["R3(info)"]);
  });
  it("R4 — two neighbours 19° apart (one face, or 30° at least)", () => {
    const a = Math.PI * (19 / 180);
    const p = part("Q", [face("UFM_Q_a", [[0, 0, -50], [100, 0, -50], [100, 0, 50], [0, 0, 50]], [0, 1, 0]), face("UFM_Q_b", [[-100 * Math.cos(a), 100 * Math.sin(a), -50], [0, 0, -50], [0, 0, 50], [-100 * Math.cos(a), 100 * Math.sin(a), 50]], [Math.sin(a), Math.cos(a), 0])], []);
    expect(rules(p)).toEqual(["R4"]);
  });
  it("R4 — a face at 45° of elevation at its goal (B6)", () => {
    const s = Math.SQRT1_2;
    const p = part("E", [face("UFM_E_a", [[0, 0, -50], [100, 100, -50], [100, 100, 50], [0, 0, 50]], [-s, s, 0])], []);
    expect(rules(p, at0("E"))).toEqual(["R4"]);
  });
  it("R2 — the hull's top proxy 0.5 mm off its FLAT real face (ON it: 0.25 mm)", () => {
    expect(rules(hull(20, 0.5))).toEqual(["R2"]);
  });
  it("R2 — a SQUARE over a round shaft: each facet spans ±45° of the curve (the hexagon's ±30° at most)", () => {
    expect(rules(shaft(4))).toEqual(["R2", "R2", "R2", "R2"]);
  });
  it("⭐ R2 against the ρ-CLOSING (§7.1 row 4): one face over a 5 mm slot (under 2ρ: bridged) is ON the outer surface — no finding; over a 9 mm slot (open) its floor 20 mm under it — R2", () => {
    expect(rules(pocketBox({ proxy: "span", x: 2.5, depth: 20 }))).toEqual([]);
    expect(rules(pocketBox({ proxy: "span", x: 4.5, depth: 20 }))).toEqual(["R2"]);
  }, 60_000);
  it("a VIRTUAL face exempt: the case's cap lifted 30 mm off its mouth, and a resting proxy floating — no finding", () => {
    const p = hollowCase(30);
    const rest = face("UFM_C_rest", [[-10, 200, -10], [10, 200, -10], [10, 200, 10], [-10, 200, 10]], [0, 1, 0]);
    expect(rules({ ...p, proxy: [...p.proxy, rest] })).toEqual([]);
  });
});

describe("⭐⭐ V3 — `Scene_2`'s report (not rebuilt here — its findings for the future workflows)", () => {
  it("four proxy NODES holding many faces (R7: E02, E04, E05, E06); E03's nose disc over its render's OPEN end (R2: ±89°); E17's proxy half turned inward (R2: ±180°); its resting proxies exempt", () => {
    const bytes = new Uint8Array(readFileSync(new URL("../Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb", import.meta.url)));
    const j = glbJson(bytes);
    if (!("json" in j)) throw new Error(j.refusal);
    const { catalog } = readModelCatalog(j.json);
    if (catalog === null) throw new Error("refused");
    const bin = glbBin(bytes);
    const goals = new Map(partGeometry(j.json, bin, catalog).map((g) => [g.id, { position: [0, 0, 0] as Vec3, rotation: g.goal.rotation }]));
    const f = checkProxyFaces(readPartSolids(j.json, bin, catalog), goals);
    expect(f.map((x) => `${x.rule} ${x.part} ${x.node}`)).toEqual(["R7 E02 UFM_E02_outer", "R2 E03 UFM_E03_nose", "R7 E04 UFM_E04_outer", "R7 E05 UFM_E05_outer", "R7 E06 UFM_E06_outer", "R2 E17 UFM_E17_faces"]);
  });
});
