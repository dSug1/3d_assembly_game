/**
 * ⭐⭐⭐ THE SECTIONS AS PLANE CUTS (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21 — the owner: *"the contours shall be closed loops and cannot be infinite
 * loops due to throw off by singularities or slanted faces"*): `src/input/plane_cut.ts`, wired in `render/assembly_wiring.ts`. A plane through the inside of a
 * convex contour cuts ONE closed loop, a side per facet crossed; on a box a world-axis plane gives world-axis sides; a plane lying along a facet is kept 1 mm
 * inside it. RED against `8dfa635` (the module absent; the sections swept by the face map's angles).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CUT_INSIDE_M, cutLoop, insidePlane, planeThrough, type CutFacet } from "../src/input/plane_cut";
import type { Vec3 } from "../src/core/vec";

/** a box's six facets (outward normals, polygons) */
function box(h: Vec3, c: Vec3 = [0, 0, 0]): CutFacet[] {
  const f: CutFacet[] = [];
  for (let a = 0; a < 3; a++)
    for (const s of [-1, 1]) {
      const b = (a + 1) % 3;
      const e = (a + 2) % 3;
      const n = [0, 0, 0];
      n[a] = s;
      const poly: Vec3[] = [];
      for (const [p, q] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
        const v = [c[0], c[1], c[2]];
        v[a] = v[a]! + s * h[a]!;
        v[b] = v[b]! + p * h[b]!;
        v[e] = v[e]! + q * h[e]!;
        poly.push(v as unknown as Vec3);
      }
      f.push({ n: n as unknown as Vec3, poly });
    }
  return f;
}
/** a regular n-gon prism about y (radius r, half height h) */
function prism(k: number, r: number, h: number): CutFacet[] {
  const ring = (y: number) => Array.from({ length: k }, (_, i) => [r * Math.cos((2 * Math.PI * i) / k), y, r * Math.sin((2 * Math.PI * i) / k)] as Vec3);
  const lo = ring(-h);
  const hi = ring(h);
  const f: CutFacet[] = [{ n: [0, 1, 0], poly: hi }, { n: [0, -1, 0], poly: lo.slice().reverse() }];
  for (let i = 0; i < k; i++) {
    const j = (i + 1) % k;
    const m = (2 * Math.PI * (i + 0.5)) / k;
    f.push({ n: [Math.cos(m), 0, Math.sin(m)], poly: [lo[i]!, lo[j]!, hi[j]!, hi[i]!] });
  }
  return f;
}
const closeTo = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-9;

describe("the sections as plane cuts (§21)", () => {
  it("⭐⭐⭐ a box cut level: ONE closed loop of four world-axis sides, one per wall, on the plane", () => {
    const B = box([0.3, 0.2, 0.1]);
    const L = cutLoop(B, planeThrough([0.05, 0.07, 0], [0, 1, 0]))!;
    expect(L.pts.length).toBe(4);
    expect(new Set(L.facet).size).toBe(4);
    for (let i = 0; i < 4; i++) {
      const a = L.pts[i]!;
      const b = L.pts[(i + 1) % 4]!;
      expect(a[1]).toBeCloseTo(0.07, 12);
      const d = [b[0] - a[0], b[2] - a[2]];
      expect(Math.min(Math.abs(d[0]!), Math.abs(d[1]!))).toBeLessThan(1e-12); // a world axis
    }
  });

  it("⭐⭐ a vertical cut through a box: closed over the top and under the bottom, four sides; any heading's plane closes", () => {
    const B = box([0.3, 0.2, 0.1]);
    expect(cutLoop(B, planeThrough([0, 0, 0], [1, 0, 0]))!.pts.length).toBe(4);
    for (let a = 0; a < 180; a += 7) {
      const r = (a * Math.PI) / 180;
      const L = cutLoop(B, planeThrough([0.01, 0.02, 0.03], [Math.cos(r), 0.2, Math.sin(r)]));
      expect(L).not.toBeNull();
      expect(L!.pts.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("⭐⭐ a SLANTED contour (a hexagonal prism) cut level and tilted: closed, a side per facet crossed", () => {
    const P = prism(6, 0.2, 0.1);
    const L = cutLoop(P, planeThrough([0, 0.03, 0], [0, 1, 0]))!;
    expect(L.pts.length).toBe(6);
    const T = cutLoop(P, planeThrough([0, 0, 0], [0.3, 1, 0.2]))!;
    expect(T).not.toBeNull();
    expect(closeTo(T.pts[0]!, T.pts[0]!)).toBe(true);
  });

  it("⭐⭐⭐ THE 1 mm RULE: a plane ON a box's side (or within 1 mm of it) is kept 1 mm inside — a loop, never the whole facet; a plane missing the contour: no loop", () => {
    const B = box([0.3, 0.2, 0.1]);
    const on = planeThrough([0.3, 0, 0], [1, 0, 0]);
    const p = insidePlane(on, B);
    expect(p.d).toBeCloseTo(0.3 - CUT_INSIDE_M, 12);
    expect(cutLoop(B, p)!.pts.length).toBe(4);
    expect(insidePlane(planeThrough([-0.2995, 0, 0], [1, 0, 0]), B).d).toBeCloseTo(-0.3 + CUT_INSIDE_M, 12);
    const free = planeThrough([0.1, 0, 0], [1, 0, 0]);
    expect(insidePlane(free, B)).toBe(free);
    expect(cutLoop(B, planeThrough([0.5, 0, 0], [1, 0, 0]))).toBeNull();
  });

  it("⭐ wired: the lines the cuts through the gizmo's place (the frame's up, then the up and the facet's normal), each on the real surface", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("const loop = cutLoop(facets, insidePlane(plane, facets));");
    expect(a).not.toContain("section_hull");
  });
});
