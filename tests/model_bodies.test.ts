/**
 * ⭐⭐⭐ A scene's `.glb` parts as bodies (`core/model_bodies.ts`; `PICK_AND_PLACE.md`): the two frames, the body's pose both ways, the pickable rule,
 * the put-down's spot and least turn. Each rule with a counter-example that fails on a wrong rule.
 */
import { describe, expect, it } from "vitest";
import { bodyFrame, bodyPoseOf, mirrorQ, outlinesOverlap, pickableParts, placementOf, putDownPlacement, toScene, toWorld, type PutDownRule } from "../src/core/model_bodies";
import { qFromAxisAngle, qmul, qRotate, add, sub, cross, normalize, dot, type Quat, type Vec3 } from "../src/core/vec";
import type { Placement } from "../src/core/glb_geometry";

const U = 0.14;
const near = (a: readonly number[], b: readonly number[], eps = 1e-9) => a.every((v, i) => Math.abs(v - b[i]!) <= eps);
const sameTurn = (a: Quat, b: Quat, eps = 1e-9) => near(a, b, eps) || near(a, b.map((v) => -v), eps);
const cube = (h: number): Vec3[] => [-h, h].flatMap((x) => [-h, h].flatMap((y) => [-h, h].map((z) => [x, y, z] as Vec3)));
const apply = (t: Placement, p: Vec3): Vec3 => add(qRotate(t.rotation, p), t.position);

// a part: a box 0.4 × 0.2 × 0.3, its face proxy one triangle of its top
const piece: Vec3[] = [-0.2, 0.2].flatMap((x) => [-0.1, 0.1].flatMap((y) => [-0.15, 0.15].map((z) => [x, y, z] as Vec3)));
const tri = { positions: [[0, 0.1, 0], [0.2, 0.1, 0], [0, 0.1, 0.15]] as Vec3[], indices: [0, 2, 1] }; // wound so its normal is +y (part frame)
const goal: Placement = { position: [1, 0.5, -2], rotation: qFromAxisAngle([0, 1, 0], 0.7) };
const F = bodyFrame("P", goal, [piece], tri, U);

describe("the two frames: world = unitM · (−x, y, z)", () => {
  it("a point and back; a rotation across the mirror is its own inverse and acts as the mirrored rotation", () => {
    const p: Vec3 = [0.3, -1.2, 2.5];
    expect(near(toScene(toWorld(p, U), U), p, 1e-12)).toBe(true);
    const q = qFromAxisAngle(normalize([0.3, 0.8, -0.5])!, 1.1);
    expect(sameTurn(mirrorQ(mirrorQ(q)), q)).toBe(true);
    // M·R·M on a vector: mirror, turn, mirror = the mirrored turn
    const v: Vec3 = [0.4, 0.2, -0.7];
    const M = (x: Vec3): Vec3 => [-x[0], x[1], x[2]];
    expect(near(qRotate(mirrorQ(q), v), M(qRotate(q, M(v))), 1e-12)).toBe(true);
    // ⛔ counter-example: the plain rotation is NOT the mirrored one
    expect(near(qRotate(q, v), M(qRotate(q, M(v))), 1e-6)).toBe(false);
  });
});

describe("a part's body", () => {
  it("at its GOAL the body's pose is (goal centre, identity)", () => {
    const g = bodyPoseOf(F, goal, U);
    expect(near(g.position, F.goalCentre, 1e-12)).toBe(true);
    expect(sameTurn(g.orientation, [1, 0, 0, 0])).toBe(true);
  });

  it("anywhere: every point of the part lands where the scene placement puts it (world)", () => {
    const P: Placement = { position: [-2, 0.3, 1.5], rotation: qFromAxisAngle(normalize([1, 2, 0.5])!, 2.1) };
    const pose = bodyPoseOf(F, P, U);
    for (const p of piece) {
      const want = toWorld(apply(P, p), U);
      const local = sub(toWorld(apply(goal, p), U), F.goalCentre);
      expect(near(add(qRotate(pose.orientation, local), pose.position), want, 1e-12)).toBe(true);
    }
  });

  it("the pose's placement is the placement: both ways", () => {
    for (const ang of [0, 0.4, 2.9]) {
      const P: Placement = { position: [0.2, 1, -0.4], rotation: qmul(qFromAxisAngle([1, 0, 0], ang), qFromAxisAngle([0, 0, 1], 0.3)) };
      const back = placementOf(F, bodyPoseOf(F, P, U), U);
      expect(near(back.position, P.position, 1e-10)).toBe(true);
      expect(sameTurn(back.rotation, P.rotation, 1e-12)).toBe(true);
    }
  });

  it("⭐ the face proxy wound OUTWARD in the world — the mirror reverses a winding, the body swaps it back", () => {
    const [a, b, c] = F.faces.indices.slice(0, 3).map((i) => F.faces.positions[i]!) as [Vec3, Vec3, Vec3];
    const n = normalize(cross(sub(b, a), sub(c, a)))!;
    // the part's +y at its goal, in the world: the goal turns it, the mirror keeps y
    const up = qRotate(mirrorQ(goal.rotation), qRotate([1, 0, 0, 0], [0, 1, 0]));
    expect(dot(n, up)).toBeGreaterThan(0.999);
    // ⛔ counter-example: the indices as they came give the inward normal
    const [a2, b2, c2] = [0, 2, 1].map((i) => F.faces.positions[i]!) as [Vec3, Vec3, Vec3];
    expect(dot(normalize(cross(sub(b2, a2), sub(c2, a2)))!, up)).toBeLessThan(-0.999);
  });
});

describe("which parts may be picked — every earlier step placed", () => {
  const parts = [
    { id: "E01", step: 1 }, { id: "E02", step: 2 }, { id: "E03", step: 3 }, { id: "E05", step: 5 }, { id: "E06", step: 5 }, { id: "E07", step: 6 },
  ];
  it("the next step's parts only; a group together", () => {
    expect([...pickableParts(parts, new Set(["E01"]))]).toEqual(["E02"]);
    expect([...pickableParts(parts, new Set(["E01", "E02", "E03"]))].sort()).toEqual(["E05", "E06"]);
    expect([...pickableParts(parts, new Set(["E01", "E02", "E03", "E05"]))]).toEqual(["E06"]); // ⛔ not E07: its bank's twin is not placed
    expect([...pickableParts(parts, new Set(parts.map((p) => p.id)))]).toEqual([]);
  });
});

describe("the outline test", () => {
  const sq = (x: number, z: number, h = 1): [number, number][] => [[x - h, z - h], [x + h, z - h], [x + h, z + h], [x - h, z + h]];
  it("apart, touching, overlapping", () => {
    expect(outlinesOverlap(sq(0, 0), sq(3, 0))).toBe(false);
    expect(outlinesOverlap(sq(0, 0), sq(1.5, 0.5))).toBe(true);
    expect(outlinesOverlap(sq(0, 0), sq(2, 0))).toBe(true); // touching is an overlap…
    expect(outlinesOverlap(sq(0, 0), sq(2, 0), 1e-4)).toBe(false); // …unless a tolerance is allowed
    expect(outlinesOverlap(sq(0, 0), sq(1.9, 0), 1e-4)).toBe(true); // ⛔ deeper than it: an overlap
  });
});

describe("⭐⭐ the put-down: the least turn, the nearest free spot by the boot's rules", () => {
  const box = { id: "B", step: 2, heap: "h", pieces: [cube(0.5)] };
  const rule: PutDownRule = { floorY: 0, floorHalf: 7, floorMargin: 0.2, perimeter: null, yawOriginDeg: null, stepU: 0.1, maxU: 6 };

  it("held a little tilted above an empty floor: it lies straight down below where it is, turned the least", () => {
    const tilt = qFromAxisAngle([1, 0, 0], 0.2);
    const now: Placement = { position: [1, 3, 2], rotation: tilt };
    const at = putDownPlacement(box, now, [], rule)!;
    expect(near([at.position[0], at.position[2]], [1, 2], 1e-9)).toBe(true);
    expect(at.position[1]).toBeCloseTo(0.5, 9); // on the floor
    // the least turn: the 0.2 rad tilt undone, nothing more (⛔ a face turned through 90° would be a bigger turn)
    const turn = qmul(at.rotation, [tilt[0], -tilt[1], -tilt[2], -tilt[3]]);
    expect(2 * Math.acos(Math.min(1, Math.abs(turn[0])))).toBeCloseTo(0.2, 6);
  });

  it("⛔ a part already there: the nearest spot beside it, never over it (one high)", () => {
    const now: Placement = { position: [1, 3, 2], rotation: [1, 0, 0, 0] };
    const other = cube(0.5).map((p) => add(p, [1, 0.5, 2]));
    const at = putDownPlacement(box, now, [other], rule)!;
    const d = Math.hypot(at.position[0] - 1, at.position[2] - 2);
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThan(1.25); // the nearest: one step past touching
  });

  it("⛔ the perimeter, the floor's margin and the front half are kept", () => {
    const now: Placement = { position: [0, 3, 0], rotation: [1, 0, 0, 0] };
    const at = putDownPlacement(box, now, [], { ...rule, perimeter: { x0: -1, x1: 1, z0: -1, z1: 1 }, yawOriginDeg: 90 })!;
    // outside the perimeter (its outline clear of the box ±1), in the front half (+z at 90°), the nearest such spot
    expect(Math.max(Math.abs(at.position[0]), Math.abs(at.position[2]))).toBeGreaterThan(1.5 - 1e-9);
    expect(at.position[2]).toBeGreaterThan(0);
    expect(Math.hypot(at.position[0], at.position[2])).toBeLessThan(1.62);
    // ⛔ counter-example: with no front half the spot ON the line (z = 0) is allowed
    const free = putDownPlacement(box, now, [], { ...rule, perimeter: { x0: -1, x1: 1, z0: -1, z1: 1 } })!;
    expect(free.position[2]).toBeCloseTo(0, 9);
    const edge = putDownPlacement(box, { position: [6.9, 3, 0], rotation: [1, 0, 0, 0] }, [], rule)!;
    expect(edge.position[0] + 0.5).toBeLessThanOrEqual(6.8 + 1e-9);
  });
});

describe("⭐⭐ on the real engine (`Scene_2`'s `.glb`)", async () => {
  const { readFileSync } = await import("node:fs");
  const { glbJson, readModelCatalog } = await import("../src/core/model_catalog");
  const { glbBin, partFaces, partGeometry } = await import("../src/core/glb_geometry");
  const bytes = new Uint8Array(readFileSync(new URL("../Assets/Blender/World0_Scene2_engine/world0_scene_2_engine.glb", import.meta.url)));
  const json = (glbJson(bytes) as { json: unknown }).json;
  const cat = readModelCatalog(json).catalog!;
  const geo = partGeometry(json, glbBin(bytes), cat);
  const faces = new Map(partFaces(json, glbBin(bytes), cat).map((f) => [f.id, f.mesh]));
  it("every part has a face proxy (triangles) and collision pieces; each triangle's normal in the body is its file normal, turned to the goal and mirrored", () => {
    // ⚠ a face proxy is NOT a closed solid (the pistons': one quad, the resting face they seat by — `PART_AUTHORING.md` §3): each triangle checked
    for (const g of geo) {
      const m = faces.get(g.id)!;
      expect(m.indices.length % 3).toBe(0);
      expect(m.indices.length).toBeGreaterThan(0);
      expect(g.pieces.length).toBeGreaterThan(0);
      const f = bodyFrame(g.id, g.goal, g.pieces, m, cat.unitM);
      for (let k = 0; k + 2 < m.indices.length; k += 3) {
        const [a, b, c] = [0, 1, 2].map((j) => m.positions[m.indices[k + j]!]!) as [Vec3, Vec3, Vec3];
        const n0 = normalize(cross(sub(b, a), sub(c, a)));
        if (n0 === null) continue;
        const w = qRotate(g.goal.rotation, n0);
        const want: Vec3 = [-w[0], w[1], w[2]];
        const [A, B, C] = [0, 1, 2].map((j) => f.faces.positions[f.faces.indices[k + j]!]!) as [Vec3, Vec3, Vec3];
        const n1 = normalize(cross(sub(B, A), sub(C, A)))!;
        expect(dot(n1, want), `${g.id} triangle ${k / 3}`).toBeGreaterThan(0.999);
      }
    }
  });
});
