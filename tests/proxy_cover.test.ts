/**
 * ⭐⭐⭐ (2026-11-23, S6 packet 2 — `30_OBJECTS_3D/spec/PROXY_AND_COLLISION_RULES.md` §3 R1, R1b, R2; §7.1 rows 4, 5, 9; §7.3 Q3, DECIDED) THE PROXY
 * COVERS ITS PART, IS CLOSED, AND CAPS ITS HOLLOWS — `checkProxyCover`: the render closed at ρ (an opening under 2ρ bridged), each outer point's sky
 * (an undercut, a cavity deeper than its mouth is wide: a flush cap; the borderline amber), the outer surface covered (a curve's facet by its
 * sagitta), every edge shared, a cap's rim on the real edges.
 * V1 PASSING controls (his three shapes and the shapes the rules leave open); V2 one planted defect each reads exactly its rule; V3 `Scene_2`'s report
 * on its quick parts (the whole scene by `scripts/surface/check_part_solids.ts`: ≈ 46 s). Each RED on its mutant first (the rules study §9.3).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { glbBin } from "../src/core/glb_geometry";
import { glbJson, readModelCatalog } from "../src/core/model_catalog";
import { readPartSolids, type PartSolids } from "../src/core/part_checks";
import { checkProxyCover } from "../src/core/proxy_cover";
import { cellPart, face, hollowCase, hull, mesh, part, pocketBox, prismPart, shaft } from "./helpers/proxy_shapes";

const rules = (p: PartSolids) => checkProxyCover([p]).map((f) => f.rule + (f.info ? "(info)" : ""));
const T = 60_000;

/** a plinth-like box (100 × 60 × 80) whose proxy is its TOP only — his plinth's defect */
const topOnly = (): PartSolids => {
  const B = [
    face("b", [[-50, 0, -40], [50, 0, -40], [50, 0, 40], [-50, 0, 40]], [0, -1, 0]), face("t", [[-50, 60, -40], [50, 60, -40], [50, 60, 40], [-50, 60, 40]], [0, 1, 0]),
    face("f", [[-50, 0, -40], [50, 0, -40], [50, 60, -40], [-50, 60, -40]], [0, 0, -1]), face("k", [[-50, 0, 40], [50, 0, 40], [50, 60, 40], [-50, 60, 40]], [0, 0, 1]),
    face("l", [[-50, 0, -40], [-50, 0, 40], [-50, 60, 40], [-50, 60, -40]], [-1, 0, 0]), face("r", [[50, 0, -40], [50, 0, 40], [50, 60, 40], [50, 60, -40]], [1, 0, 0]),
  ];
  return part("P", [face("UFM_P_top", [[-50, 60, -40], [50, 60, -40], [50, 60, 40], [-50, 60, 40]], [0, 1, 0])], [mesh("P_render", B)]);
};
/** a T-slot in a 60 × 40 × 60 block of 5 mm cells: a 10-wide mouth 10 deep over a 30-wide chamber 10 tall, 40 long, closed at its ends — an UNDERCUT */
const tSlot = () =>
  cellPart("T", 5, [12, 8, 12], (i, j, k) => {
    const inZ = k >= 2 && k < 10;
    return !((inZ && j >= 6 && i >= 5 && i < 7) || (inZ && j >= 4 && j < 6 && i >= 3 && i < 9));
  });
const V = (halfTop: number, apexY: number, top: number) => prismPart("V", [[-50, 0], [50, 0], [50, top], [halfTop, top], [0, apexY], [-halfTop, top], [-50, top]]);
const tan15 = Math.tan(Math.PI / 12);

describe("⭐⭐⭐ V1 — PASSING controls: his three shapes, and what the rules leave open", () => {
  it("his three shapes — the hexagon shaft (its facets' sagitta exempt), the hollow case CAPPED (the cap a wall), the chamfered hull", () => {
    expect(rules(shaft(6))).toEqual([]);
    expect(rules(hollowCase())).toEqual([]);
    expect(rules(hull())).toEqual([]);
  }, T);
  it("an L's inner corner, a 90° V, a pocket shallower than wide — followed, never capped (R1b: an open concavity)", () => {
    expect(rules(prismPart("L", [[-50, 0], [50, 0], [50, 20], [-30, 20], [-30, 60], [-50, 60]]))).toEqual([]);
    expect(rules(V(20, 20, 40))).toEqual([]);
    expect(rules(pocketBox({ proxy: "follow", depth: 10 }))).toEqual([]);
  }, T);
  it("a 5 mm slot BRIDGED by the ρ-closing (under 2ρ = 7 mm): one face over it is the outer surface", () => expect(rules(pocketBox({ proxy: "span", x: 2.5, depth: 20 }))).toEqual([]), T);
  it("a 9 mm slot 20 deep, CAPPED flush", () => expect(rules(pocketBox({ proxy: "cap", x: 4.5, depth: 20 }))).toEqual([]), T);
  it("⭐ a pocket 0.6 as deep as wide: its wall's foot sees (90° − atan 0.6) / 2 = 29.5° (worked by hand), past the amber line — clean (the sky REFINED at the line: the coarse sphere alone reads amber from 0.5)", () => {
    expect(rules(pocketBox({ proxy: "follow", depth: 24 }))).toEqual([]);
  }, T);
  it("⭐ a pocket 0.75 as deep as wide: its wall's foot ±26.6° — the amber line exactly: never DEEP", () => {
    expect(rules(pocketBox({ proxy: "follow", depth: 30 })).filter((r) => r === "R1b")).toEqual([]);
  }, T);
});

describe("⭐⭐⭐ V2 — one planted defect each reads exactly its rule", () => {
  it("R1b — the case's pocket (50 deep, 40 wide) FOLLOWED, not capped: deeper than its mouth is wide", () => expect(rules(pocketBox({ proxy: "follow" }))).toEqual(["R1b"]), T);
  it("R1b — a 30° V 60 deep (after the ρ-closing fills its apex: 46.5 deep, 32 wide)", () => expect(rules(V(60 * tan15, 20, 80))).toEqual(["R1b"]), T);
  it("⭐ R1b — the deep line in a V (60 deep from its apex, 120 long): after the ρ-closing lifts its floor, a 44° V is 1.05 as deep as its mouth is wide — DEEP; a 50° V 0.93 — amber, never deep", () => {
    const v = (phi: number) => {
      const t = Math.tan(((phi / 2) * Math.PI) / 180) * 60;
      return prismPart("V", [[-60, 0], [60, 0], [60, 80], [t, 80], [0, 20], [-t, 80], [-60, 80]], 60);
    };
    expect(rules(v(44))).toEqual(["R1b"]);
    expect(rules(v(50))).toEqual(["R1b(info)"]);
  }, T);
  it("R1b — a T-slot's chamber: an UNDERCUT (no straight way out)", () => {
    const f = checkProxyCover([tSlot()]);
    expect(f.map((x) => x.rule)).toEqual(["R1b"]);
    expect(f[0]!.detail).toContain("UNDERCUT");
  }, T);
  it("R1b (amber) — a pocket 0.9 as deep as wide: borderline, information", () => expect(rules(pocketBox({ proxy: "follow", depth: 36 }))).toEqual(["R1b(info)"]), T);
  it("R1b + R1 — a 9 mm slot (over 2ρ: open) under a REAL face: not capped, its walls not covered", () => expect(rules(pocketBox({ proxy: "span", x: 4.5, depth: 20 }))).toEqual(["R1b", "R1"]), T);
  it("R1 + R2 — his plinth's defect: a box whose proxy is its TOP only (its sides and bottom not covered; the proxy open)", () => expect(rules(topOnly())).toEqual(["R1", "R2"]), T);
  it("R1 + R2 — the hull with its top face missing", () => {
    const h = hull();
    expect(rules({ ...h, proxy: h.proxy.filter((f) => !f.triangles.every((t) => t.every((i) => f.points[i]![1] > 79.999))) })).toEqual(["R1", "R2"]);
  }, T);
  it("R1 — a part whose proxy is only a RESTING face (virtual): none of its outer surface covered", () => {
    const p = shaft(6);
    expect(rules({ ...p, proxy: [face("UFM_S_rest", [[0, 30, -10], [10, 30, -10], [10, 30, 10], [0, 30, 10]], [0, 1, 0])] })).toEqual(["R1"]);
  }, T);
  it("R2 + R1b — the case's cap lifted 1 mm: its edges unshared, its rim off the ring's edges", () => {
    const f = checkProxyCover([hollowCase(1)]);
    expect(f.map((x) => x.rule)).toEqual(["R2", "R1b"]);
    expect(f[1]!.node).toBe("UFM_C_cap");
  }, T);
});

describe("⭐⭐ V3 — `Scene_2`'s report on its quick parts (not rebuilt here — its findings for the future workflows)", () => {
  it("the plinth (E01): its sides and bottom NOT COVERED, its proxy OPEN — his issue at its root; the pistons and E15 / E16 a resting face only; the heads' hollows deeper than wide, uncapped", () => {
    const bytes = new Uint8Array(readFileSync(new URL("../Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb", import.meta.url)));
    const j = glbJson(bytes);
    if (!("json" in j)) throw new Error(j.refusal);
    const { catalog } = readModelCatalog(j.json);
    if (catalog === null) throw new Error("refused");
    const quick = new Set(["E01", "E03", "E04", "E07", "E08", "E09", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17"]);
    const parts = readPartSolids(j.json, glbBin(bytes), catalog).filter((p) => quick.has(p.id));
    const f = checkProxyCover(parts);
    expect(f.map((x) => `${x.rule}${x.info ? "(info)" : ""} ${x.part}`)).toEqual(PINNED);
    expect(f.find((x) => x.part === "E01" && x.rule === "R1")!.detail).toMatch(/NOT COVERED by the proxy: ≈ \d+ mm² \(58\.\d %/);
  }, 120_000);
});
/** E01 the plinth; E03 the crankshaft (its nose disc only); E04 an outer surface in one node; E07 – E12 the pistons and E15 / E16 a resting face only; E13 /
 * E14 the heads (their ports and pockets deeper than wide); E17 (its proxy half inward) */
const PINNED = ["R1 E01", "R2 E01", "R1 E03", "R2 E03", "R1 E04", "R2 E04", "R1 E07", "R1 E08", "R1 E09", "R1 E10", "R1 E11", "R1 E12", "R1b E13", "R1b(info) E13", "R1 E13", "R2 E13",
  "R1b E14", "R1b(info) E14", "R1 E14", "R2 E14", "R1 E15", "R1 E16", "R1 E17", "R2 E17"];
