/**
 * ⭐⭐⭐ (2026-11-24, S7 — `ORBIT_SURFACE_PART_CHECKS.md` §14 – §15) B3 AND B5: at each stage, where the held piece first touches each exposed face (P2,
 * the game's landing map), and every exposed face that is no place with its reason. Small scenes of boxes, each verdict met once, each vector shown
 * RED on its mutant before it was trusted (§16).
 */
import { describe, expect, it } from "vitest";
import { landingPerStage, type B3Face } from "../src/core/landing_per_stage";
import { B1_FIT_MM, type PartMesh, type PartSolids } from "../src/core/part_checks";
import type { Vec3 } from "../src/core/vec";
import { facetsNearShare, facetTowardGoal, gameFaceMap, inGameFaceMap } from "../src/input/face_map_membership";
import type { StageFace } from "../src/core/landing_per_stage";
import { boxPiece, face } from "./helpers/proxy_shapes";

const at = (ids: string[]) => new Map(ids.map((id) => [id, { position: [0, 0, 0] as Vec3, rotation: [1, 0, 0, 0] as const }]));
/** the six faces of a box as proxy nodes `${tag}_top`, `_bottom`, `_px`, `_nx`, `_pz`, `_nz` (a `skip` left out) */
function boxFaces(tag: string, lo: Vec3, hi: Vec3, skip: readonly string[] = []): PartMesh[] {
  const [x0, y0, z0] = lo, [x1, y1, z1] = hi;
  const all: [string, Vec3[], Vec3][] = [
    ["top", [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0]],
    ["bottom", [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]],
    ["px", [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0]],
    ["nx", [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], [-1, 0, 0]],
    ["pz", [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1]],
    ["nz", [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1]],
  ];
  return all.filter(([k]) => !skip.includes(k)).map(([k, pts, n]) => face(`${tag}_${k}`, pts, n));
}
const solids = (id: string, pieces: PartMesh[], proxy: PartMesh[], frozen = false): PartSolids => ({ id, frozen, fitMm: B1_FIT_MM, pieces, proxy, renders: [] });
/** a box part, its proxy its six faces */
const boxPart = (id: string, lo: Vec3, hi: Vec3, frozen = false): PartSolids => solids(id, [boxPiece(`UCX_${id}`, lo, hi)], boxFaces(`UFM_${id}`, lo, hi), frozen);
/** the HELD piece: a box sx × sy × sz on its bottom, a virtual resting face `UFM_${id}_rest` `restDrop` mm below its piece's bottom */
const heldBox = (id: string, sx: number, sy: number, sz: number, restDrop = 0): PartSolids =>
  solids(id, [boxPiece(`UCX_${id}`, [-sx / 2, 0, -sz / 2], [sx / 2, sy, sz / 2])], [
    ...boxFaces(`UFM_${id}`, [-sx / 2, 0, -sz / 2], [sx / 2, sy, sz / 2], ["bottom"]),
    face(`UFM_${id}_rest`, [[-sx / 2, -restDrop, -sz / 2], [sx / 2, -restDrop, -sz / 2], [sx / 2, -restDrop, sz / 2], [-sx / 2, -restDrop, sz / 2]], [0, -1, 0]),
  ]);
/** a U: a floor slab and two walls in ONE part, the slot `w` mm wide along z (centred at z = 50), its floor's proxy the slot's only */
function uPart(id: string, w: number): PartSolids {
  const z0 = 50 - w / 2, z1 = 50 + w / 2;
  return solids(id, [boxPiece("UCX_floor", [0, 0, 0], [100, 20, 100]), boxPiece("UCX_wall1", [0, 20, 0], [100, 40, z0]), boxPiece("UCX_wall2", [0, 20, z1], [100, 40, 100])], [
    face(`UFM_${id}_slot`, [[0, 20, z0], [100, 20, z0], [100, 20, z1], [0, 20, z1]], [0, 1, 0]),
    face(`UFM_${id}_top1`, [[0, 40, 0], [100, 40, 0], [100, 40, z0], [0, 40, z0]], [0, 1, 0]),
    face(`UFM_${id}_top2`, [[0, 40, z1], [100, 40, z1], [100, 40, 100], [0, 40, 100]], [0, 1, 0]),
  ]);
}
const faceOf = (fs: readonly B3Face[], node: string): B3Face => {
  const f = fs.find((x) => x.node === node);
  if (f === undefined) throw new Error(`no exposed face ${node} (faces: ${fs.map((x) => x.node).join(", ")})`);
  return f;
};

describe("⭐⭐⭐ S7 — B3 (where the held piece lands) and B5 (the faces that are no place, and why)", () => {
  it("V1 — a box on the floor, a small piece held: the stage reads the part placed next; the top and the four sides LANDABLE, places; the bottom GLUED to the floor (never read)", () => {
    const st = landingPerStage([boxPart("A", [0, 0, 0], [100, 20, 100]), heldBox("B", 20, 10, 20)], at(["A", "B"]), new Set());
    expect(st.map((s) => [s.placed, s.held, s.resting])).toEqual([[["A"], "B", "UFM_B_rest"]]);
    const fs = st[0]!.faces;
    expect(fs.map((f) => f.node).sort()).toEqual(["UFM_A_nx", "UFM_A_nz", "UFM_A_px", "UFM_A_pz", "UFM_A_top"]);
    for (const f of fs) expect([f.node, f.landable, f.reason, f.below]).toEqual([f.node, true, null, 0]);
    expect(faceOf(fs, "UFM_A_top").turn).toBe(0);
  });
  it("V1b — the resting proxy 5 mm OFF its piece (as `Scene_2`'s, ledger row 14): the piece's own lowest point is read (its reach), the top still LANDABLE", () => {
    const st = landingPerStage([boxPart("A", [0, 0, 0], [100, 20, 100]), heldBox("B", 20, 10, 20, 5)], at(["A", "B"]), new Set());
    expect(faceOf(st[0]!.faces, "UFM_A_top")).toMatchObject({ landable: true, reason: null, below: 0 });
  });
  it("V2 — a slot 15 mm wide for a 20 × 40 piece: its floor CLOSED FOR THE PIECE (held up by its own part's walls, both turns); the walls' tops places", () => {
    const st = landingPerStage([uPart("A", 15), heldBox("B", 20, 10, 40)], at(["A", "B"]), new Set());
    const fs = st[0]!.faces;
    expect(faceOf(fs, "UFM_A_slot")).toMatchObject({ landable: false, turn: null, reason: "closed for the piece", below: 0 });
    expect(faceOf(fs, "UFM_A_top1")).toMatchObject({ landable: true, reason: null });
  });
  it("V3 — a slot 30 mm wide for a 20 × 40 piece: closed at 0°, the floor LANDABLE turned 90° (both turns read)", () => {
    const st = landingPerStage([uPart("A", 30), heldBox("B", 20, 10, 40)], at(["A", "B"]), new Set());
    expect(faceOf(st[0]!.faces, "UFM_A_slot")).toMatchObject({ landable: true, turn: 90, reason: null });
  });
  it("V4 — a table (another part) over a slab: the slab's top, exposed from the sides, UNDER AN OVERHANG (the piece meets the table first everywhere)", () => {
    const table = solids("C", [boxPiece("UCX_slab", [-20, 60, -20], [120, 70, 120]), boxPiece("UCX_leg1", [-20, 0, -20], [-10, 60, 120]), boxPiece("UCX_leg2", [110, 0, -20], [120, 60, 120])], boxFaces("UFM_C", [-20, 60, -20], [120, 70, 120]));
    const st = landingPerStage([boxPart("A", [0, 0, 0], [100, 20, 100]), table, heldBox("B", 20, 10, 20)], at(["A", "C", "B"]), new Set());
    const s = st.find((x) => x.held === "B")!;
    expect(s.placed).toEqual(["A", "C"]);
    expect(faceOf(s.faces, "UFM_A_top")).toMatchObject({ landable: false, reason: "under an overhang" });
    expect(faceOf(s.faces, "UFM_C_top")).toMatchObject({ landable: true, reason: null });
  });
  it("V5 — a pocket deeper than its mouth is wide, CAPPED at its mouth (R1b): its floor exposed and landable, its reason CAPPED (the cap is the place)", () => {
    const walls = [boxPiece("UCX_w1", [0, 10, 0], [30, 60, 100]), boxPiece("UCX_w2", [70, 10, 0], [100, 60, 100]), boxPiece("UCX_w3", [30, 10, 0], [70, 60, 30]), boxPiece("UCX_w4", [30, 10, 70], [70, 60, 100])];
    const A = solids("A", [boxPiece("UCX_floor", [0, 0, 0], [100, 10, 100]), ...walls], [
      face("UFM_A_pocket", [[30, 10, 30], [70, 10, 30], [70, 10, 70], [30, 10, 70]], [0, 1, 0]),
      face("UFM_A_cap", [[30, 60, 30], [70, 60, 30], [70, 60, 70], [30, 60, 70]], [0, 1, 0]),
    ]);
    const st = landingPerStage([A, heldBox("B", 20, 10, 20)], at(["A", "B"]), new Set());
    expect(faceOf(st[0]!.faces, "UFM_A_pocket")).toMatchObject({ landable: true, reason: "capped" });
    expect(st[0]!.faces.some((f) => f.node === "UFM_A_cap")).toBe(false);
  });
  it("V6 — a FROZEN part's faces: landable, their reason FROZEN (the game's face map skips them today — the ledger's row 6)", () => {
    const st = landingPerStage([boxPart("A", [0, 0, 0], [100, 20, 100], true), heldBox("B", 20, 10, 20)], at(["A", "B"]), new Set(["A"]));
    expect(faceOf(st[0]!.faces, "UFM_A_top")).toMatchObject({ landable: true, reason: "frozen" });
  });
  it("V7 — BELOW THE SHARE when the face map leaves a face out (the caller's map); the game's own map keeps a box's five faces, a frozen part's none", () => {
    const parts = [boxPart("A", [0, 0, 0], [100, 20, 100]), heldBox("B", 20, 10, 20)];
    const st = landingPerStage(parts, at(["A", "B"]), new Set(), { inFaceMap: (fs) => fs.map((f) => f.n[1] < 0.5) });
    expect(faceOf(st[0]!.faces, "UFM_A_top").reason).toBe("below the share");
    expect(faceOf(st[0]!.faces, "UFM_A_px").reason).toBeNull();
    let seen: boolean[] = [];
    landingPerStage(parts, at(["A", "B"]), new Set(), { inFaceMap: (fs) => (seen = inGameFaceMap(fs, new Set())) });
    expect(seen).toEqual([true, true, true, true, true]);
    landingPerStage(parts, at(["A", "B"]), new Set(), { inFaceMap: (fs) => (seen = inGameFaceMap(fs, new Set(["A"]))) });
    expect(seen).toEqual([false, false, false, false, false]);
    // a frozen part's faces stay OUT even where another part's facet shares their normal
    const both = [boxPart("A", [0, 0, 0], [100, 20, 100], true), boxPart("E", [150, 0, 0], [200, 20, 50]), heldBox("B", 20, 10, 20)];
    landingPerStage(both, at(["A", "E", "B"]), new Set(["A"]), { inFaceMap: (fs) => (seen = inGameFaceMap(fs, new Set(["A"]))) });
    expect(seen).toEqual([false, false, false, false, false, true, true, true, true, true]);
  });
  it("V8 — a held part with neither a resting proxy nor a resting candidate: NO ORIENTATION, its stage not read", () => {
    const D = solids("D", [boxPiece("UCX_D", [-10, 0, -10], [10, 10, 10])], [face("UFM_D_cap", [[-10, 10, -10], [10, 10, -10], [10, 10, 10], [-10, 10, 10]], [0, 1, 0])]);
    const st = landingPerStage([boxPart("A", [0, 0, 0], [100, 20, 100]), D], at(["A", "D"]), new Set());
    expect(st).toEqual([{ placed: ["A"], held: "D", resting: null, faces: [], ms: st[0]!.ms }]);
  });
  it("V10 — B4's reading (S8): the facet toward a goal along its way in — over the box's top a facet (0 mm out), past its edge 50 mm out, 15° off still it, 30° off none, a virtual facet never, a frozen part's map none", () => {
    let faces: readonly StageFace[] = [];
    landingPerStage([boxPart("A", [0, 0, 0], [100, 20, 100]), heldBox("B", 20, 10, 20)], at(["A", "B"]), new Set(), { inFaceMap: (fs) => ((faces = fs), fs.map(() => true)) });
    const map = gameFaceMap(faces, new Set());
    const r = (w: Vec3, p: Vec3) => facetTowardGoal(map, w, p);
    expect(r([0, 1, 0], [50, 20, 50])).toMatchObject({ n: [0, 1, 0], deg: 0, outMm: 0 });
    expect(r([0, 1, 0], [150, 20, 50])!.outMm).toBeCloseTo(50, 6);
    const c15 = Math.cos((15 * Math.PI) / 180), s15 = Math.sin((15 * Math.PI) / 180);
    expect(r([0, c15, s15], [50, 20, 50])).toMatchObject({ outMm: 0 });
    expect(r([0, c15, s15], [50, 20, 50])!.deg).toBeCloseTo(15, 6);
    expect(r([0, Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)], [50, 20, 50])).toBeNull();
    expect(r([0, -1, 0], [50, 0, 50])).toBeNull();
    expect(facetTowardGoal(gameFaceMap(faces, new Set(["A"])), [0, 1, 0], [50, 20, 50])).toBeNull();
  });
  it("V11 — B6 (S9) near the piece's size: a 22 mm slot for a 20 mm piece FITS BY LESS THAN THE MARGIN (2 mm), a 19 mm one HELD OUT BY LESS; 30 mm and 15 mm slots, a box's top: no threshold", () => {
    const slot = (w: number) => faceOf(landingPerStage([uPart("A", w), heldBox("B", 20, 10, 40)], at(["A", "B"]), new Set())[0]!.faces, "UFM_A_slot");
    expect(slot(22)).toMatchObject({ landable: true, turn: 90, threshold: "fits by less than the margin" });
    expect(slot(19)).toMatchObject({ landable: false, threshold: "held out by less than the margin" });
    expect(slot(30)).toMatchObject({ landable: true, threshold: null });
    expect(slot(15)).toMatchObject({ landable: false, threshold: null });
    const top = faceOf(landingPerStage([boxPart("A", [0, 0, 0], [100, 20, 100]), heldBox("B", 20, 10, 20)], at(["A", "B"]), new Set())[0]!.faces, "UFM_A_top");
    expect(top.threshold).toBeNull();
  });
  it("V12 — B6 (S9) near the share: two boxes' tops over a hull 26.8 % real JUST ABOVE the share (gone at 0.30), 23.9 % JUST BELOW it (there at 0.20)", () => {
    const near = (x: number) => {
      let faces: readonly StageFace[] = [];
      landingPerStage([boxPart("A", [0, 0, 0], [100, 20, 100]), boxPart("E", [x, 0, 0], [x + 10, 20, 100]), heldBox("B", 20, 10, 20)], at(["A", "E", "B"]), new Set(), { inFaceMap: (fs, placed) => (placed.length === 2 && (faces = fs), fs.map(() => true)), marginMm: 0 });
      return facetsNearShare(faces, new Set());
    };
    const up = (l: readonly { n: Vec3 }[]) => l.some((k) => k.n[1] > 1 - 1e-9);
    const a = near(400);
    expect([up(a.above), up(a.below)]).toEqual([true, false]);
    const b = near(450);
    expect([up(b.above), up(b.below)]).toEqual([false, true]);
    const c = near(100);
    expect([up(c.above), up(c.below)]).toEqual([false, false]);
  });
  it("V9 — a proxy 3 mm above its solid (B1e's defect): every sample falls BELOW the face, never landable", () => {
    // (3 mm: B2's grid is the solids' box grown by two cells — a proxy far past it reads sealed, never exposed)
    const A = solids("A", [boxPiece("UCX_A", [0, 0, 0], [100, 20, 100])], [face("UFM_A_top", [[0, 23, 0], [100, 23, 0], [100, 23, 100], [0, 23, 100]], [0, 1, 0])]);
    const st = landingPerStage([A, heldBox("B", 20, 10, 20)], at(["A", "B"]), new Set());
    const f = faceOf(st[0]!.faces, "UFM_A_top");
    expect(f).toMatchObject({ landable: false, reason: "closed for the piece" });
    expect(f.below).toBe(2 * f.samples);
  });
});
