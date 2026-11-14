/** ⭐ `core/hull3.ts` — the 3D convex hull (the boot heaps' resting faces). Each claim shown on its counter-example. */
import { describe, expect, it } from "vitest";
import { convexHull3 } from "../src/core/hull3";
import { cross, dot, sub, type Vec3 } from "../src/core/vec";

const cube: Vec3[] = [];
for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) cube.push([x, y, z]);

function outwardAndContaining(pts: readonly Vec3[], input: readonly Vec3[]): boolean {
  const h = convexHull3(input)!;
  return h.triangles.every(([i, j, k]) => {
    const c = cross(sub(h.points[j]!, h.points[i]!), sub(h.points[k]!, h.points[i]!));
    const l = Math.hypot(c[0], c[1], c[2]);
    if (l === 0) return true;
    const n: Vec3 = [c[0] / l, c[1] / l, c[2] / l];
    return pts.every((p) => dot(n, sub(p, h.points[i]!)) <= 1e-4); // the joggle's own scale (≈ 1e-5 of the size)
  });
}

function volume(input: readonly Vec3[]): number {
  const h = convexHull3(input)!;
  return h.triangles.reduce((s, [i, j, k]) => s + dot(h.points[i]!, cross(h.points[j]!, h.points[k]!)) / 6, 0);
}

describe("the 3D convex hull", () => {
  it("a cube: its 8 corners, 12 triangles, volume 1, every face outward", () => {
    const h = convexHull3(cube)!;
    expect(h.points.length).toBe(8);
    expect(h.triangles.length).toBe(12);
    expect(volume(cube)).toBeCloseTo(1, 9);
    expect(outwardAndContaining(cube, cube)).toBe(true);
  });

  it("points INSIDE and on faces are dropped; duplicates ignored", () => {
    const pts: Vec3[] = [...cube, [0.5, 0.5, 0.5], [0.2, 0.7, 0.1], [0.5, 0.5, 0], [1, 1, 1], [0, 0, 0]];
    const h = convexHull3(pts)!;
    expect(h.points.length).toBe(8);
    expect(volume(pts)).toBeCloseTo(1, 9);
  });

  it("a random cloud: every input point inside or on the hull (and NOT for a point added outside it)", () => {
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const pts: Vec3[] = Array.from({ length: 300 }, () => [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]);
    expect(outwardAndContaining(pts, pts)).toBe(true);
    expect(outwardAndContaining([...pts, [3, 0, 0]], pts)).toBe(false); // the counter-example
  });

  it("a flat set has no hull", () => {
    expect(convexHull3([[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]])).toBeNull();
  });
});

describe("⛔ (2026-11-13) many near-COPLANAR points — the valves' and exhausts' round pieces (20,000 triangles for 271 points, a broken hull)", () => {
  // stacked rings of a cylinder in float32, rotated off the axes: coplanar points in every cap and along the sides
  const ring = (cx: number, cy: number, cz: number, r: number, h: number, n: number): Vec3[] =>
    Array.from({ length: n * 2 }, (_, i) => {
      const a = (2 * Math.PI * (i % n)) / n;
      const y = i < n ? cy : cy + h;
      const p: Vec3 = [cx + r * Math.cos(a), y, cz + r * Math.sin(a)];
      const c = Math.cos(0.3), s = Math.sin(0.3);
      return [Math.fround(p[0] * c - p[1] * s), Math.fround(p[0] * s + p[1] * c), Math.fround(p[2])];
    });
  const pts = [...ring(0, 0, 0, 0.1, 0.3, 12), ...ring(0.5, 0.2, 0.1, 0.06, 0.2, 12), ...ring(-0.3, 0.1, 0.4, 0.08, 0.4, 16), ...ring(0.2, 0.5, -0.3, 0.12, 0.1, 24)];
  it("a closed hull: triangles = 2 × vertices − 4; every point inside", () => {
    const h = convexHull3(pts)!;
    expect(h.triangles.length).toBe(2 * h.points.length - 4);
    expect(outwardAndContaining(pts, pts)).toBe(true);
  });
});
