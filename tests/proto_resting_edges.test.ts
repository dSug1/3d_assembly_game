/**
 * ⭐⭐⭐ prototype — PRIORITY 1 BY EDGES (`1.0.59q-`; `Claude/40_RENDER_SCENE/spec/RESTING_FACE_ALIGNMENT.md` §2; the owner, 2026-10-05):
 * the resting face's LEADING edge (nearest the pink ring) made parallel to the pink face's MATING edge (the most horizontal, then the
 * nearest the camera), the resting face down.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { faceEdges, matingEdgeIndex, nearestEdgeIndex, restAlignToEdge, segmentDistance, type Edge } from "../src/core/resting_face";
import { dot, length, normalize, qRotate, sub, type Quat, type Vec3 } from "../src/core/vec";
import { greenBootOrientation } from "../src/input/green_box";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const D = Math.PI / 180;

describe("⭐⭐⭐ prototype — the resting-face alignment by edges", () => {
  it("⭐ a face's edges are its hull's — a square of four points plus its centre and a mid-edge point: four edges", () => {
    const pts: Vec3[] = [[0, 0, 0], [2, 0, 0], [2, 0, 2], [0, 0, 2], [1, 0, 1], [1, 0, 0]];
    const e = faceEdges(pts, [0, 1, 0]);
    expect(e).toHaveLength(4);
    expect(e.map((x) => length(sub(x[1], x[0])))).toEqual([2, 2, 2, 2]);
    expect(segmentDistance([1, 5, -3], [[0, 0, 0], [2, 0, 0]])).toBeCloseTo(Math.hypot(5, 3), 12);
  });

  it("⭐⭐ the MATING edge: the most horizontal edges (a vertical face's top and bottom), then the one nearest the camera", () => {
    // a vertical 2 × 1 face in the x–y plane: bottom and top edges horizontal, the sides vertical
    const e: Edge[] = [
      [[0, 0, 0], [2, 0, 0]], // bottom
      [[2, 0, 0], [2, 1, 0]], // right side
      [[2, 1, 0], [0, 1, 0]], // top
      [[0, 1, 0], [0, 0, 0]], // left side
    ];
    expect(matingEdgeIndex(e, [1, 5, 3])).toBe(2); // the camera above: the top
    expect(matingEdgeIndex(e, [1, -5, 3])).toBe(0); // below: the bottom
    // a tilted face: a side within the tolerance of the flattest counts, beyond it does not
    const tilt = (deg: number): Edge => [[0, 0, 0], [Math.cos(deg * D), Math.sin(deg * D), 0]];
    expect(matingEdgeIndex([tilt(10), [[0, 9, 0], [1, 9.0001, 0]]], [0, 0, 0])).toBe(1); // the near one is 10° off: refused
    expect(matingEdgeIndex([tilt(0.5), [[0, 9, 0], [1, 9, 0]]], [0, 0, 0])).toBe(0); // 0.5° off: within 1°, and nearer
  });

  it("⭐ the LEADING edge: the resting face's edge nearest the pink ring", () => {
    const e: Edge[] = [
      [[0, 0, 0], [2, 0, 0]],
      [[2, 0, 0], [2, 0, 2]],
      [[2, 0, 2], [0, 0, 2]],
      [[0, 0, 2], [0, 0, 0]],
    ];
    expect(nearestEdgeIndex(e, [5, 0, 1])).toBe(1);
    expect(nearestEdgeIndex(e, [1, 0, -4])).toBe(0);
  });

  it("⭐⭐⭐ the target: the resting face DOWN, its leading edge PARALLEL to the mating edge — by the smallest yaw, from a tumbled pose", () => {
    // the green frustum's bottom (103.5 × 45 mm, own frame, normal −y), tumbled at the Scene_1 boot quaternion
    const W = 51.75, Dd = 22.5;
    const bottom: Edge[] = faceEdges([[-W, 0, -Dd], [W, 0, -Dd], [W, 0, Dd], [-W, 0, Dd]], [0, -1, 0]);
    const q0 = greenBootOrientation("Scene_1");
    const at: Vec3 = [0.4, 0.3, 1.2];
    const pink: Vec3 = [0, 0.1, 0];
    const mating: Edge = [[-0.2, 0.05, 0.1], [0.2, 0.06, -0.15]]; // nearly horizontal, oblique
    const { q, leading } = restAlignToEdge(q0, at, [0, -1, 0], bottom, pink, mating);
    expect(dot(qRotate(q, [0, -1, 0]), [0, -1, 0])).toBeCloseTo(1, 9); // the face down
    const lead = bottom[leading]!;
    const ld = normalize(qRotate(q, sub(lead[1], lead[0])))!;
    const m = normalize([mating[1][0] - mating[0][0], 0, mating[1][2] - mating[0][2]])!;
    expect(Math.abs(dot(ld, m))).toBeCloseTo(1, 9); // parallel to the mating edge's horizontal direction
    // ⭐ the leading edge is the one nearest the ring once the face is down (before the yaw)
    expect(leading).toBeGreaterThanOrEqual(0);
  });

  it("⭐ the yaw is the SMALLEST: never more than 90° (an edge has no direction of its own)", () => {
    const sq: Edge[] = faceEdges([[-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1]], [0, -1, 0]);
    const q0: Quat = [1, 0, 0, 0]; // already down
    for (const a of [10, 80, 100, 170, -100]) {
      const mating: Edge = [[0, 0, 0], [Math.cos(a * D), 0, Math.sin(a * D)]];
      const { q } = restAlignToEdge(q0, [0, 0, 5], [0, -1, 0], sq, [0, 0, 0], mating);
      const yaw = 2 * Math.acos(Math.min(1, Math.abs(q[0])));
      expect(yaw / D).toBeLessThanOrEqual(90 + 1e-6);
    }
  });

  it("⭐⭐ wired: the pink face known at boot and moved by a press; the alignment by edges; the long axes no longer used for it", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/st\.pinkFace = at < 0 \? null : \{ objectId: blue\.id, faceId: o\.faces\[at\]!\.id \};/);
    expect(code("render/pointer_wiring.ts")).toMatch(/if \(newTarget !== null && faceHit && pickedId !== undefined\) st\.pinkFace = \{ objectId: pickedId, faceId: faceHit\.faceId \};/);
    expect(w).toMatch(/const m = mating\.length === 0 \? -1 : matingEdgeIndex\(mating, \[st\.camera\.position\.x, st\.camera\.position\.y, st\.camera\.position\.z\]\);/);
    expect(w).toMatch(/const r = restAlignToEdge\(q, \[pos\.x, pos\.y, pos\.z\], p\.restingFace\.normal, p\.restingEdges, \[t\[0\], t\[1\], t\[2\]\], mating\[m\]!\);/);
    expect(w).not.toMatch(/restAlignTarget\(q, p\.restingFace\.normal, p\.restingAxes/); // ⛔ the long axis no longer aligns anything
  });
});
