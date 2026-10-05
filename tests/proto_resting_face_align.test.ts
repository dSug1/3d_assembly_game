/**
 * ⭐⭐⭐ prototype — PRIORITY 1 BY THE PINK FACE (`1.0.59q-`; `Claude/40_RENDER_SCENE/spec/RESTING_FACE_ALIGNMENT.md` §2; the owner,
 * 2026-10-05): the resting face ANTI-ALIGNED with the pink face (or the first frozen body's), then the two faces' long axes made parallel
 * — the most parallel pair, a tie to the closest ends — by the smallest turn about the pink normal.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { faceLongAxes, restAlignToFace, type LongAxes } from "../src/core/resting_face";
import { dot, qFromAxisAngle, qRotate, type Quat, type Vec3 } from "../src/core/vec";
import { greenBootOrientation } from "../src/input/green_box";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const D = Math.PI / 180;
const W = 51.75, Dd = 22.5;
// the green frustum's bottom, its own frame (normal −y): one long axis, its length
const bottomPts: Vec3[] = [[-W, 0, -Dd], [W, 0, -Dd], [W, 0, Dd], [-W, 0, Dd]];
const bottom = faceLongAxes(bottomPts, [0, -1, 0], 0.5);
const restLong: LongAxes = { axes: bottom.axes, ends: bottom.ends };

describe("⭐⭐⭐ prototype — the resting-face alignment by the pink face", () => {
  it("⭐ a long axis's END points are where it meets its two edges — the green bottom's: the middles of its two short edges", () => {
    expect(bottom.ends).toHaveLength(1);
    const e = [...bottom.ends[0]!].sort((a, b) => a[0] - b[0]);
    for (const [p, x] of [[e[0]!, -W], [e[1]!, W]] as const) {
      expect(p[0]).toBeCloseTo(x, 9);
      expect(p[1]).toBeCloseTo(0, 9);
      expect(p[2]).toBeCloseTo(0, 9);
    }
  });

  it("⭐⭐⭐ against a VERTICAL pink face, from the tumbled boot pose: the resting face anti-parallel to it, the long axes parallel", () => {
    // a 0.3 × 0.1 pink face in the plane z = 0, facing +z; its long axis along x, tilted 20° in its plane
    const n: Vec3 = [0, 0, 1];
    const a = qRotate(qFromAxisAngle(n, 20 * D), [1, 0, 0]);
    const pink: LongAxes = { axes: [a], ends: [[[-0.15 * a[0], -0.15 * a[1], 0], [0.15 * a[0], 0.15 * a[1], 0]]] };
    const { q, restAxis, pinkAxis } = restAlignToFace(greenBootOrientation("Scene_1"), [0.2, 0.1, 0.8], [0, -1, 0], restLong, n, pink);
    expect([restAxis, pinkAxis]).toEqual([0, 0]);
    expect(dot(qRotate(q, [0, -1, 0]), n)).toBeCloseTo(-1, 9); // the resting face ANTI-parallel to the pink face
    expect(Math.abs(dot(qRotate(q, bottom.axes[0]!), a))).toBeCloseTo(1, 9); // the long axes parallel
  });

  it("⭐ no pink face: the first frozen body's face (the floor's top, +y) — the resting face DOWN, the long axis along the floor's", () => {
    const floor: LongAxes = { axes: [[1, 0, 0]], ends: [[[-1, 0, 0], [1, 0, 0]]] };
    const { q } = restAlignToFace(greenBootOrientation("Scene_1"), [0, 0.5, 0], [0, -1, 0], restLong, [0, 1, 0], floor);
    expect(dot(qRotate(q, [0, -1, 0]), [0, -1, 0])).toBeCloseTo(1, 9);
    expect(Math.abs(dot(qRotate(q, bottom.axes[0]!), [1, 0, 0]))).toBeCloseTo(1, 9);
  });

  it("⭐⭐ several long axes: the MOST PARALLEL pair; a tie goes to the pair whose ENDS are closest", () => {
    // a square resting face (two equal axes, x and z) already down; a square pink floor face (x and z) — every pairing parallel or
    // perpendicular: the parallel pairs tie, and the ends decide
    const sq = faceLongAxes([[-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1]], [0, -1, 0], 1e-6);
    expect(sq.axes).toHaveLength(2);
    const square: LongAxes = { axes: sq.axes, ends: sq.ends };
    // the pink face's x axis lies far away, its z axis right under the piece: the pair with the z axis wins
    const pink: LongAxes = {
      axes: [[1, 0, 0], [0, 0, 1]],
      ends: [
        [[100, 0, 0], [102, 0, 0]],
        [[0, -1, -1], [0, -1, 1]],
      ],
    };
    const r = restAlignToFace([1, 0, 0, 0] as Quat, [0, 0, 0], [0, -1, 0], square, [0, 1, 0], pink);
    expect(r.pinkAxis).toBe(1);
    expect(Math.abs(dot(qRotate(r.q, sq.axes[r.restAxis]!), [0, 0, 1]))).toBeCloseTo(1, 9);
    // already parallel: no turn at all
    expect(2 * Math.acos(Math.min(1, Math.abs(r.q[0])))).toBeCloseTo(0, 6);
  });

  it("⭐⭐ several long axes: the pair that MINIMIZES the turn (the owner: *\"which nullify or minimize the rotation\"*) — a hexagon end's three axes, never past 30°", () => {
    const hex: Vec3[] = [0, 60, 120, 180, 240, 300].map((a) => [Math.cos(a * D), 0, Math.sin(a * D)]);
    const h = faceLongAxes(hex, [0, -1, 0], 1e-6);
    expect(h.axes).toHaveLength(3);
    const longH: LongAxes = { axes: h.axes, ends: h.ends };
    for (const deg of [0, 17, 44, 71, 95, 133, 160]) {
      const a = qRotate(qFromAxisAngle([0, 1, 0], deg * D), [1, 0, 0]);
      const pink: LongAxes = { axes: [a], ends: [[[0, 0, 0], a]] };
      const r = restAlignToFace([1, 0, 0, 0] as Quat, [0, 0, 0], [0, -1, 0], longH, [0, 1, 0], pink);
      expect((2 * Math.acos(Math.min(1, Math.abs(r.q[0])))) / D).toBeLessThanOrEqual(30 + 1e-6); // 3 axes, 6 directions: ≤ 30°
      expect(Math.abs(dot(qRotate(r.q, h.axes[r.restAxis]!), a))).toBeCloseTo(1, 9);
    }
  });

  it("⭐ the turn about the pink normal is the SMALLEST — never past 90° (an axis has no direction of its own)", () => {
    for (const deg of [10, 80, 100, 170, -120]) {
      const a = qRotate(qFromAxisAngle([0, 1, 0], deg * D), [1, 0, 0]);
      const pink: LongAxes = { axes: [a], ends: [[[0, 0, 0], a]] };
      const r = restAlignToFace([1, 0, 0, 0] as Quat, [0, 0, 0], [0, -1, 0], restLong, [0, 1, 0], pink);
      expect((2 * Math.acos(Math.min(1, Math.abs(r.q[0])))) / D).toBeLessThanOrEqual(90 + 1e-6);
    }
  });

  it("⭐⭐ wired: the face aligned to — the pink face, else the first frozen body's face toward the piece; the target by the pink face", () => {
    const w = code("render/green_box_wiring.ts");
    expect(w).toMatch(/let id: ObjectId \| null = st\.pinkFace\?\.objectId \?\? null;/);
    expect(w).toMatch(/for \(const \[oid, o\] of st\.world\.objects\) \{\s*if \(o\.frozen !== true\) continue;/);
    expect(w).toMatch(/const r = restAlignToFace\(q, \[pos\.x, pos\.y, pos\.z\], p\.restingFace\.normal, p\.restingLong, target\.normal, target\.long\);/);
    expect(w).not.toMatch(/restAlignToEdge\(/); // ⛔ the edges version is superseded
  });
});
