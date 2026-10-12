/**
 * ⭐⭐⭐ prototype — the level's set of orientations as a polyhedron (`RESTING_FACE_ALIGNMENT.md` §21; the owner, 2026-10-12: *"Make sure that
 * the cube gets updated to the proper polyhedron with the distinct face directions in the scene"*).
 */
import { describe, expect, it } from "vitest";
import { distinctDirections, facetPolytope } from "../src/core/orientation_set";
import { dot, length, type Vec3 } from "../src/core/vec";

const AXES: Vec3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

describe("⭐⭐⭐ the level's distinct face directions", () => {
  it("⭐ normals within the tolerance are ONE direction; its axes the union of theirs, deduplicated up to sign", () => {
    const d = distinctDirections([
      { normal: [0, 1, 0], axes: [[1, 0, 0], [0, 0, 1]] },
      { normal: [0.0001, 1, 0], axes: [[-1, 0, 0]] }, // the same direction, the same axis reversed
      { normal: [1, 0, 0], axes: [[0, 1, 0]] },
      { normal: [0, 1, 0], axes: [[0.7071, 0, 0.7071]] }, // a third axis on +y (a part yawed 45°)
    ]);
    expect(d).toHaveLength(2);
    expect(d[0]!.axes).toHaveLength(3);
    expect(d[1]!.axes).toHaveLength(1);
  });
  it("⭐ an axis is laid in its direction's plane", () => {
    const d = distinctDirections([{ normal: [0, 1, 0], axes: [[1, 0.2, 0]] }]);
    expect(dot(d[0]!.axes[0]!, [0, 1, 0])).toBeCloseTo(0, 12);
  });
});

describe("⭐⭐⭐ the polyhedron of the directions", () => {
  it("⭐⭐ the six world directions make a CUBE: six facets, one per direction, each a square of side 2 at unit distance", () => {
    const f = facetPolytope(AXES);
    expect(f).toHaveLength(6);
    expect(f.map((x) => x.tag).sort()).toEqual([0, 1, 2, 3, 4, 5]);
    for (const x of f) {
      expect(x.vertices).toHaveLength(4);
      for (const v of x.vertices) expect(dot(v, AXES[x.tag]!)).toBeCloseTo(1, 9);
      for (const v of x.vertices) expect(length(v)).toBeCloseTo(Math.sqrt(3), 9);
    }
  });
  it("⭐ an open set (only +y) keeps the bounding box's other faces, tagged -1 — not a direction", () => {
    const f = facetPolytope([[0, 1, 0]]);
    expect(f.filter((x) => x.tag === 0)).toHaveLength(1);
    expect(f.filter((x) => x.tag === -1)).toHaveLength(5);
  });
  it("⭐ a seventh direction (a 45° part) cuts a new facet off the cube — every direction a facet", () => {
    const s = Math.SQRT1_2;
    const f = facetPolytope([...AXES, [s, s, 0]]);
    expect(new Set(f.map((x) => x.tag))).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));
    const cut = f.find((x) => x.tag === 6)!;
    expect(cut.vertices).toHaveLength(4);
    for (const v of cut.vertices) expect(dot(v, [s, s, 0])).toBeCloseTo(1, 9);
  });
  it("⭐ facet vertices are counter-clockwise seen from outside", () => {
    for (const x of facetPolytope(AXES)) {
      const [a, b, c] = x.vertices as [Vec3, Vec3, Vec3];
      const n: Vec3 = [
        (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
        (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
      ];
      expect(dot(n, x.normal)).toBeGreaterThan(0);
    }
  });
});

import { readFileSync } from "node:fs";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");

describe("⭐⭐⭐ the orientation cube, wired (2026-10-12, *\"Start with 2, sit against this face\"*)", () => {
  it("⭐ the slider: 0–200 %, 100 by default, 0 hides the window", () => {
    expect(DEFAULT_CONFIG.orientCubeSizePct).toBe(100);
    expect(code("render/tuning_menu.ts")).toContain('"orientCubeSizePct", 0, 200, 10)');
    expect(code("render/orient_cube.ts")).toContain("const show = c !== null && pct > 0 && st.greenBox !== null;");
  });
  it("⭐⭐ rebuilt at the boot's goal baseline and at every goal commit; from the SEATED parts and the frozen bodies only, never the orbited pieces", () => {
    expect(code("render/goal_commit_wiring.ts")).toMatch(/const reached = st\.goalCommit\.commit\([^)]*\);\s*(?:\/\/[^\n]*\n\s*)*st\.orientDirty = true;/);
    expect(code("render/orient_cube.ts")).toContain("if (st.orientDirty) rebuild(st);");
    const g = code("render/green_box_wiring.ts");
    expect(g).toContain("if (orbited.has(id)) continue;");
    expect(g).toContain("if (o.frozen !== true && !st.goalCommit.has(id)) continue;");
  });
  it("⭐⭐ a facet is a VIRTUAL pink face — the resting face sits against it (`alignFaceOf` reads it first); the lit facet tapped again rolls", () => {
    const g = code("render/green_box_wiring.ts");
    expect(g).toMatch(/if \(!frozenOnly && st\.pinkDir !== null\) \{\s*const d = st\.pinkDir;\s*return \{\s*label: `cube \$\{dirLabel\(d\.normal\)\}`,/);
    expect(g).toContain("st.pinkTargetNormal = target?.normal ?? null;");
    const c = code("render/orient_cube.ts");
    expect(c).toMatch(/if \(st\.restAligned && st\.restRoll !== null && dirIndex\(st, st\.pinkTargetNormal\) === tag\) \{\s*acted = rollRestingFace\(st, now, 1\);/);
    expect(c).toMatch(/st\.pinkDir = dir;\s*st\.pinkFace = null;[^\n]*\n\s*acted = alignRestingFace\(st, now\);/);
    // ⭐ a part's face taken by the second touch gives the cube's way, and the boot's
    expect(code("render/hold_wiring.ts")).toContain("st.pinkDir = null; // ⭐ (2026-10-12) a part's face taken");
    expect(g).toContain("st.pinkDir = null; // ⭐ (2026-10-12) the cube's facet gives way");
  });
  it("⭐ a press in its window is the cube's, before the router (no orbit, no grab)", () => {
    const p = code("render/pointer_wiring.ts");
    expect(p.indexOf("if (orientCubePointer(st, info.type, e)) {")).toBeGreaterThan(0);
    expect(p.indexOf("if (orientCubePointer(st, info.type, e)) {")).toBeLessThan(p.indexOf("if (cursorPointer(st, info.type, e)) {"));
  });
});
