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
import { convexHull3 } from "../src/core/hull3";
import { glbJson, readModelCatalog } from "../src/core/model_catalog";
import { B1_FIT_MM, checkProxyFaces, readPartSolids, type PartMesh, type PartSolids } from "../src/core/part_checks";
import { cross, dot, sub, type Vec3 } from "../src/core/vec";

/** a planar face from its outline (convex, any winding), turned to face `n` */
const face = (name: string, pts: Vec3[], n: Vec3): PartMesh => {
  const tris: [number, number, number][] = [];
  for (let k = 1; k + 1 < pts.length; k++) {
    const c = cross(sub(pts[k]!, pts[0]!), sub(pts[k + 1]!, pts[0]!));
    tris.push(dot(c, n) >= 0 ? [0, k, k + 1] : [0, k + 1, k]);
  }
  return { name, points: pts, triangles: tris };
};
/** a mesh of several faces (for a render) */
const mesh = (name: string, fs: PartMesh[]): PartMesh => {
  const points: Vec3[] = [];
  const triangles: [number, number, number][] = [];
  for (const f of fs) {
    const b = points.length;
    points.push(...f.points);
    for (const [a, c, d] of f.triangles) triangles.push([a + b, c + b, d + b]);
  }
  return { name, points, triangles };
};
const part = (id: string, proxy: PartMesh[], renders: PartMesh[]): PartSolids => ({ id, frozen: false, fitMm: B1_FIT_MM, pieces: [], proxy, renders });
const rules = (p: PartSolids, goals?: ReadonlyMap<string, Placement>) => checkProxyFaces([p], goals).map((f) => f.rule + (f.info ? "(info)" : ""));

// ── his three shapes, as clean reference parts ──
/** a shaft along x (length L), its proxy an n-gon (vertices at k·360/n — a hexagon: a face UP), its render a round 24-gon of radius R */
function shaft(n: number, R = 20, L = 200): PartSolids {
  const ring = (m: number, x: number, r: number) => Array.from({ length: m }, (_, k): Vec3 => [x, r * Math.sin((2 * Math.PI * k) / m), r * Math.cos((2 * Math.PI * k) / m)]);
  const sides = (m: number, r: number, tag: string) => Array.from({ length: m }, (_, k) => {
    const a = ring(m, 0, r), b = ring(m, L, r);
    const mid = (2 * Math.PI * (k + 0.5)) / m;
    return face(`${tag}_${k}`, [a[k]!, a[(k + 1) % m]!, b[(k + 1) % m]!, b[k]!], [0, Math.sin(mid), Math.cos(mid)]);
  });
  const proxy = [...sides(n, R, "UFM_S_side"), face("UFM_S_end0", ring(n, 0, R), [-1, 0, 0]), face("UFM_S_end1", ring(n, L, R), [1, 0, 0])];
  const render = mesh("S_render", [...sides(24, R, "r"), face("r0", ring(24, 0, R), [-1, 0, 0]), face("r1", ring(24, L, R), [1, 0, 0])]);
  return part("S", proxy, [render]);
}
/** a hollow case: a 100 × 60 × 80 box, a pocket 60 × 40 in x, z, 50 deep from its top — its proxy the box with its top a RING and the pocket CAPPED */
function hollowCase(capLift = 0): PartSolids {
  const Y = 60, X = 50, Z = 40, x = 30, z = 20;
  const up: Vec3 = [0, 1, 0];
  const ring = [
    face("UFM_C_top_f", [[-X, Y, -Z], [X, Y, -Z], [x, Y, -z], [-x, Y, -z]], up), face("UFM_C_top_b", [[-X, Y, Z], [X, Y, Z], [x, Y, z], [-x, Y, z]], up),
    face("UFM_C_top_l", [[-X, Y, -Z], [-x, Y, -z], [-x, Y, z], [-X, Y, Z]], up), face("UFM_C_top_r", [[X, Y, -Z], [x, Y, -z], [x, Y, z], [X, Y, Z]], up),
  ];
  const top = mesh("UFM_C_top", ring);
  const outer = [
    face("UFM_C_bottom", [[-X, 0, -Z], [X, 0, -Z], [X, 0, Z], [-X, 0, Z]], [0, -1, 0]),
    face("UFM_C_front", [[-X, 0, -Z], [X, 0, -Z], [X, Y, -Z], [-X, Y, -Z]], [0, 0, -1]), face("UFM_C_back", [[-X, 0, Z], [X, 0, Z], [X, Y, Z], [-X, Y, Z]], [0, 0, 1]),
    face("UFM_C_left", [[-X, 0, -Z], [-X, 0, Z], [-X, Y, Z], [-X, Y, -Z]], [-1, 0, 0]), face("UFM_C_right", [[X, 0, -Z], [X, 0, Z], [X, Y, Z], [X, Y, -Z]], [1, 0, 0]),
  ];
  const cap = face("UFM_C_cap", [[-x, Y + capLift, -z], [x, Y + capLift, -z], [x, Y + capLift, z], [-x, Y + capLift, z]], up);
  const pocket = [
    face("p_floor", [[-x, 10, -z], [x, 10, -z], [x, 10, z], [-x, 10, z]], up),
    face("p_f", [[-x, 10, -z], [x, 10, -z], [x, Y, -z], [-x, Y, -z]], [0, 0, 1]), face("p_b", [[-x, 10, z], [x, 10, z], [x, Y, z], [-x, Y, z]], [0, 0, -1]),
    face("p_l", [[-x, 10, -z], [-x, 10, z], [-x, Y, z], [-x, Y, -z]], [1, 0, 0]), face("p_r", [[x, 10, -z], [x, 10, z], [x, Y, z], [x, Y, -z]], [-1, 0, 0]),
  ];
  return part("C", [...outer, top, cap], [mesh("C_render", [...outer, ...ring, ...pocket])]);
}
/** a chamfered hull: a 200 × 80 × 120 body, its top edges along x chamfered at 60° of elevation (`rise` mm) — its proxy its hull's faces, one node each */
function hull(rise = 20, topLift = 0): PartSolids {
  const run = rise / Math.tan(Math.PI / 6);
  const pts: Vec3[] = [];
  for (const x of [-100, 100]) for (const zz of [-60, 60]) pts.push([x, 0, zz], [x, 80 - rise, zz], [x, 80, zz - Math.sign(zz) * run]);
  const h = convexHull3(pts)!;
  const groups = new Map<string, [number, number, number][]>();
  for (const t of h.triangles) {
    const [a, b, c] = t.map((i) => h.points[i]!) as [Vec3, Vec3, Vec3];
    const n = cross(sub(b, a), sub(c, a));
    const l = Math.hypot(n[0], n[1], n[2]);
    const k = n.map((v) => (v / l).toFixed(3)).join(",");
    groups.set(k, [...(groups.get(k) ?? []), [t[0], t[1], t[2]]]);
  }
  const proxy = [...groups.entries()].map(([k, tris], i): PartMesh => {
    const lift = k === "0.000,1.000,0.000" ? topLift : 0;
    return { name: `UFM_H_${i}`, points: h.points.map((p): Vec3 => [p[0], p[1] + (p[1] > 79.999 ? lift : 0), p[2]]), triangles: tris };
  });
  return part("H", proxy, [{ name: "H_render", points: h.points, triangles: h.triangles.map((t) => [t[0], t[1], t[2]]) }]);
}
const at0 = (id: string) => new Map([[id, { position: [0, 0, 0] as Vec3, rotation: [1, 0, 0, 0] as const }]]);

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
