/**
 * ⭐⭐⭐ prototype — THE RESTING-FACE SELECTOR (`core/resting_face.ts`, `Claude/40_RENDER_SCENE/spec/RESTING_FACE.md`; the owner,
 * 2026-10-04/05). The expected values are the spec's §8, computed independently (a throwaway script over explicit vertices).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { meshTopology } from "../src/core/mesh_topology";
import { chooseInGroup, hull2, massProperties, mirrorPlanes, pickWinner, restingFaces, RESTING_DEFAULTS, type RestingGroup } from "../src/core/resting_face";
import { dot, qFromAxisAngle, qRotate, type Quat, type Vec3 } from "../src/core/vec";
import { greenBootOrientation } from "../src/input/green_box";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const scene = new Scene(new NullEngine());
const topoOf = (m: Mesh) => meshTopology(new Float32Array(m.getVerticesData(VertexBuffer.PositionKind)!), m.getIndices()!);

// the green frustum, mm, origin at its bottom face's centre (103.5 × 41.25 × 45, the top halved)
function frustum() {
  const W = 51.75, D = 22.5, H = 41.25, w = 25.875, d = 11.25;
  const c: Vec3[] = [[-W, 0, -D], [W, 0, -D], [w, H, -d], [-w, H, -d], [-W, 0, D], [W, 0, D], [w, H, d], [-w, H, d]];
  const tris = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5];
  return meshTopology(new Float32Array(c.flat()), tris);
}
// a flat-shaded n-gon prism along y (Babylon's cylinder)
function prism(n: number, length: number, diameter: number) {
  const m = CreateCylinder("p", { height: length, diameter, tessellation: n }, scene);
  m.convertToFlatShadedMesh();
  return topoOf(m);
}
const faceNormals = (t: ReturnType<typeof frustum>, ids: readonly number[]) => ids.map((i) => t.faces[i]!.normal);

describe("⭐⭐⭐ prototype — the resting-face selector", () => {
  it("⭐⭐ the green frustum rests on its BOTTOM: M 2 (ties the top), score 0.597 against 0.413; the slants M 1; the short ends below the gate", () => {
    const t = frustum();
    const r = restingFaces(t.positions, t.faces);
    expect(r.com[1]).toBeCloseTo(16.205, 3); // ⚠ not the box centre, 20.625
    const w = r.winner!;
    expect(w.members).toHaveLength(1);
    expect(w.members[0]!.normal[1]).toBeCloseTo(-1, 9); // the bottom
    expect(w.mirrors).toBe(2);
    expect(w.score).toBeCloseTo(0.597, 3);
    expect(w.members[0]!.thetaDeg).toBeCloseTo(54.2, 1);
    expect(w.h).toBeCloseTo(16.205, 3);
    const top = r.groups[1]!;
    expect(top.members[0]!.normal[1]).toBeCloseTo(1, 9);
    expect([top.mirrors, Number(top.score.toFixed(3)), Number(top.members[0]!.thetaDeg.toFixed(1))]).toEqual([2, 0.413, 24.2]);
    // the two long slants: ONE group, M 1, θ 50.6°
    const slants = r.groups[2]!;
    expect(slants.members).toHaveLength(2);
    expect(slants.mirrors).toBe(1);
    expect(slants.members[0]!.thetaDeg).toBeCloseTo(50.6, 1);
    // the two short ends: θ 12.0°, refused by the 15° gate
    expect(r.rejected).toHaveLength(2);
    for (const c of r.rejected) expect(c.thetaDeg).toBeCloseTo(12.0, 1);
    expect(r.ambiguous).toBeNull();
    // the principal axis: its length (x)
    expect(Math.abs(r.principalAxis![0])).toBeCloseTo(1, 6);
  });

  it("⭐⭐ the turquoise hexagonal prism STANDS on an end (the owner's rule): M 6 against the sides' 2, though a side is stabler (30° vs 23.4°)", () => {
    const t = prism(6, 103.5, 51.75);
    const r = restingFaces(t.positions, t.faces);
    const w = r.winner!;
    expect(w.members).toHaveLength(2); // the two ends, ONE group
    expect(w.mirrors).toBe(6);
    expect(w.members[0]!.thetaDeg).toBeCloseTo(23.4, 1);
    expect(w.score).toBeCloseTo(0.493, 3);
    expect(w.h).toBeCloseTo(51.75, 6);
    const sides = r.groups[1]!;
    expect(sides.members).toHaveLength(6);
    expect(sides.mirrors).toBe(2);
    expect(sides.members[0]!.thetaDeg).toBeCloseTo(30, 6);
    expect(Math.abs(r.principalAxis![1])).toBeCloseTo(1, 6); // its own axis
  });

  it("⭐⭐ the 15° gate: a round (24-sided) bottle 3× as tall as wide STANDS (18.3°: its d_min is the APOTHEM, cos 7.5° r; M 24 on its end)", () => {
    const tall3 = restingFaces(...(({ positions, faces }) => [positions, faces] as const)(prism(24, 6, 2)));
    expect(tall3.winner!.mirrors).toBe(24);
    expect(Math.abs(tall3.winner!.members[0]!.normal[1])).toBeCloseTo(1, 9);
    expect(tall3.winner!.members[0]!.thetaDeg).toBeCloseTo((Math.atan2(Math.cos(Math.PI / 24), 3) * 180) / Math.PI, 5); // float32 vertices
    expect(tall3.belowGate).toBe(false);
  });

  it("⭐⭐ the gate decides on a SQUARE-section bottle: 2× as tall as wide stands on its end (M 4), 3× lies down (the end at 13.3° refused; a side at 45°)", () => {
    // 4 sides, 2 across the corners: the apothem is √2/2
    const stand = restingFaces(...(({ positions, faces }) => [positions, faces] as const)(prism(4, 4, 2)));
    expect(Math.abs(stand.winner!.members[0]!.normal[1])).toBeCloseTo(1, 9);
    expect(stand.winner!.mirrors).toBe(4);
    const lie = restingFaces(...(({ positions, faces }) => [positions, faces] as const)(prism(4, 6, 2)));
    expect(Math.abs(lie.winner!.members[0]!.normal[1])).toBeLessThan(1e-9); // on a side
    expect(lie.winner!.members[0]!.thetaDeg).toBeCloseTo(45, 5);
    expect(lie.rejected.map((c) => Number(c.thetaDeg.toFixed(1)))).toEqual([13.3, 13.3]);
  });

  it("⚠ a ROUND bottle 4× as tall has NO face above the gate (ends 13.9°, sides 7.5° = half a facet): the least tippable is taken, flagged", () => {
    const r = restingFaces(...(({ positions, faces }) => [positions, faces] as const)(prism(24, 8, 2)));
    expect(r.belowGate).toBe(true);
    expect(Math.abs(r.winner!.members[0]!.normal[1])).toBeCloseTo(1, 9); // an end, the largest θ
    expect(r.winner!.members[0]!.thetaDeg).toBeCloseTo(13.9, 1);
    expect(r.rejected).toHaveLength(26);
    expect(Math.min(...r.rejected.map((c) => c.thetaDeg))).toBeCloseTo(7.5, 4);
  });

  it("⭐ the mirror planes read the vertex set within a tolerance: a corner moved less than it keeps them, more removes them", () => {
    const corners: Vec3[] = [[-1, -0.5, -1.5], [1, -0.5, -1.5], [1, 0.5, -1.5], [-1, 0.5, -1.5], [-1, -0.5, 1.5], [1, -0.5, 1.5], [1, 0.5, 1.5], [-1, 0.5, 1.5]];
    const g: Vec3 = [0, 0, 0];
    expect(mirrorPlanes(corners, g, 0.02, 1)).toHaveLength(3); // a box: its three
    const nudge = (k: number): Vec3[] => corners.map((p, i) => (i === 6 ? [p[0] + k, p[1], p[2]] : p));
    expect(mirrorPlanes(nudge(0.01), g, 0.02, 1)).toHaveLength(3);
    expect(mirrorPlanes(nudge(0.1), g, 0.02, 1)).toHaveLength(0); // all three broken: none maps the moved corner onto a vertex
  });

  it("⭐ the principal axis is null when no axis is distinguished — a cube; the volume and centre of mass of a box", () => {
    const cube = topoOf(CreateBox("c", { size: 2 }, scene));
    const r = restingFaces(cube.positions, cube.faces);
    expect(r.principalAxis).toBeNull();
    expect(r.winner!.members).toHaveLength(6); // every face, one group
    expect(r.winner!.mirrors).toBe(4);
    const mp = massProperties(cube.positions, cube.faces.flatMap((f) => f.triangles));
    expect(mp.volume).toBeCloseTo(8, 9);
    for (const k of mp.com) expect(k).toBeCloseTo(0, 9);
  });

  it("⭐ inside the ambiguity band the LOWER centre of mass wins (and the other is reported); another M, or outside the band: rank order", () => {
    const g = (mirrors: number, score: number, h: number): RestingGroup => ({ members: [], mirrors, score, h });
    const a = g(2, 0.6, 20);
    const b = g(2, 0.58, 15);
    expect(pickWinner([a, b], 0.05)).toEqual({ groups: [b, a], ambiguous: a });
    expect(pickWinner([a, b], 0.01)).toEqual({ groups: [a, b], ambiguous: null });
    const c = g(1, 0.59, 10);
    expect(pickWinner([a, c], 0.05)).toEqual({ groups: [a, c], ambiguous: null });
  });

  it("⭐ the hull of a support's contact points, counter-clockwise, inner and collinear points dropped", () => {
    expect(hull2([[0, 0], [2, 0], [2, 2], [0, 2], [1, 1], [1, 0]])).toEqual([[0, 0], [2, 0], [2, 2], [0, 2]]);
  });

  it("⭐⭐ the face chosen in a group: the smallest turn from the pose — the member whose world normal points most DOWN", () => {
    const t = prism(6, 103.5, 51.75);
    const ends = restingFaces(t.positions, t.faces).winner!;
    const down = (q: Quat) => dot(qRotate(q, chooseInGroup(ends, q).normal), [0, -1, 0]);
    // upright: the bottom end; upside down: the other one — always the nearer
    expect(chooseInGroup(ends, [1, 0, 0, 0]).normal[1]).toBeCloseTo(-1, 9);
    expect(chooseInGroup(ends, qFromAxisAngle([1, 0, 0], Math.PI)).normal[1]).toBeCloseTo(1, 9);
    const q = greenBootOrientation("Scene_1");
    for (const m of ends.members) expect(down(q)).toBeGreaterThanOrEqual(dot(qRotate(q, m.normal), [0, -1, 0]) - 1e-12);
    expect(RESTING_DEFAULTS.thetaFloorDeg).toBe(15); // ⭐ fixed (the owner: "fix. we can later make a slider")
    void faceNormals;
  });

  it("⭐⭐⭐ WHEN it runs (the owner: *\"at boot for every part … not seated … at the moment it is unseated\"*; a part in its goal IS seated)", async () => {
    const { restingFaceFrame } = await import("../src/render/resting_face_wiring");
    const cube = topoOf(CreateBox("c2", { size: 2 }, scene));
    const obj = (id: string, frozen = false) => ({ id, local: { position: [0, 0, 0] as Vec3, orientation: [1, 0, 0, 0] as Quat }, parent: null, faces: [], connectors: [], constraints: [], frozen });
    const ids = ["A", "B", "C", "floor"];
    const seated = new Set(["B"]); // B seated on a Pioneer
    const placed = new Set(["C"]); // C placed in its goal
    let never = true;
    const st = {
      world: { objects: new Map(ids.map((id) => [id, obj(id, id === "floor")])) },
      links: { isSeated: (id: string) => seated.has(id) },
      goalCommit: { has: (id: string) => placed.has(id), get never() { return never; } },
      sceneSpec: { final: {} },
      meshOf: new Map(ids.map((id) => [id, {}])),
      topoOf: new Map(ids.map((id) => [id, cube])),
      restingFaces: new Map(),
      restingShapes: new Map(),
      restingSeated: null as Set<string> | null,
      restingLast: null as string | null,
      hudDirty: false,
    };
    restingFaceFrame(st as never);
    expect(st.restingFaces.size).toBe(0); // ⭐ waits for the goal's baseline (a placed part is seated)
    never = false;
    restingFaceFrame(st as never);
    expect([...st.restingFaces.keys()]).toEqual(["A"]); // B seated, C placed, the floor frozen: A alone
    expect(st.restingFaces.get("A").why).toBe("BOOT");
    expect(st.restingShapes.size).toBe(1); // one shape, computed once
    restingFaceFrame(st as never);
    expect(st.restingFaces.size).toBe(1); // nothing changed: nothing asked
    seated.delete("B"); // B unseated (an unsnap, an unalign, an undo — whichever)
    restingFaceFrame(st as never);
    expect(st.restingFaces.get("B").why).toBe("UNSEATED");
    placed.delete("C"); // C leaves its goal
    restingFaceFrame(st as never);
    expect(st.restingFaces.get("C").why).toBe("UNSEATED");
    expect(st.restingFaces.has("floor")).toBe(false);
    expect(st.restingShapes.size).toBe(1);
  });

  it("⭐⭐ wired: after the goal commit each frame; the orbited pieces' resting face at creation, chosen from the BOOT pose, filled YELLOW", () => {
    const loop = code("render/render_loop.ts");
    expect(loop).toMatch(/goalCommitFrame\(st\);\s*\/\/[^\n]*\n\s*restingFaceFrame\(st\);/);
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/const restingFace = resting\.winner === null \? null : chooseInGroup\(resting\.winner, greenBootOrientation\(st\.sceneSpec\.id\)\);/);
    // ⭐ 2026-10-06: PINK, the pink ring's own constant (it was yellow) — the fill and its see-through twin
    expect(w).toMatch(/const RESTING_COLOUR = PINK;/);
    expect(w).not.toMatch(/RESTING_YELLOW/);
    expect(w).toMatch(/ mat\.emissiveColor = RESTING_COLOUR\.clone\(\);/);
    expect(w).toMatch(/tm\.emissiveColor = RESTING_COLOUR\.clone\(\);/);
    expect(w.indexOf("const PINK = new Color3(1, 0.6, 0.9);")).toBeLessThan(w.indexOf("const RESTING_COLOUR = PINK;"));
    expect(w).toMatch(/\.\.\.restingOf\(st, box\) \}\);/);
    expect(w).toMatch(/\.\.\.restingOf\(st, hex\) \}\);/);
    expect(w).toMatch(/pinkRingFrame\(st\);\s*counterYawFrame\(st\);\s*restAlignFrame\(st, now\);\s*restingFillFrame\(st\);/);
  });

  it("⭐⭐ the yellow face is seen faintly THROUGH its own piece, never through another (the owner, 2026-10-05) — by draw order", () => {
    const w = code("render/green_box_wiring.ts");
    // 1. the piece: in the transparent pass (after every opaque body), writing NO depth
    expect(w).toMatch(/own\.transparencyMode = Material\.MATERIAL_ALPHABLEND;[^\n]*\n\s*own\.disableDepthWrite = true;\s*m\.alphaIndex = RESTING_ORDER;/);
    // 2. the faint twin: depth-tested against the other bodies only, after the piece
    expect(w).toMatch(/tm\.alpha = RESTING_XRAY_ALPHA;\s*tm\.disableDepthWrite = true;/);
    expect(w).toMatch(/twin\.alphaIndex = RESTING_ORDER \+ 1;/);
    expect(w).toMatch(/const RESTING_XRAY_ALPHA = 0\.25;/);
    // 3. the piece's depth, restored after the twin — FORCED, the transparent pass writes none otherwise (seen on a screenshot)
    expect(w).toMatch(/dm\.disableColorWrite = true;\s*dm\.forceDepthWrite = true;/);
    expect(w).toMatch(/depth\.alphaIndex = RESTING_ORDER \+ 2;/);
    // 4. the full fill keeps the default index: after all three
    expect(w).not.toMatch(/fill\.alphaIndex/);
  });

  it("⭐⭐ engine-free (rule 1)", () => {
    expect(code("core/resting_face.ts")).not.toMatch(/@babylonjs/);
  });
});
