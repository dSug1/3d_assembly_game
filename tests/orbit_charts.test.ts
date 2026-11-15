/**
 * GOLDEN VECTORS — **THE ORBIT ON CHARTS, STEP 1.2** (2026-11-15, `Claude/40_RENDER_SCENE/spec/ORBIT_CHARTS.md` §2.3, §2.5, §3, §7.2): the assignment of
 * the contour's faces to charts (`src/input/orbit_charts.ts`), not wired yet.
 * * A box: four cells and two caps under gravity, no frame added; each cap's four square layouts, their exits one with no turn, two a quarter, one a half.
 * * `Scene_0`'s lying heptagon: six cells, the two ends BENT, the bottom a cap — gravity serves all.
 * * `Scene_0bis` (the same with pyramid tips): the 14 tip faces FANS of the frame about the long axis, held WORLD; by the whole rule all 21 faces served by
 *   it; the apex 12.6 mm off centre — the SAME frame (⛔ today: the zone's axis from the rim's centroid, snapped).
 * * A lying triangle prism with tips: a fan of THREE is a fan (⛔ today: `valenceMin` 5).
 * * An icosahedron, a vertex up: no fan is taken round a corner whose star gravity partly serves — its broken faces on the rings.
 * * A dodecahedron: every face on the rings. A cube on a corner: two frames, both held WORLD — the border peel's choice (4 + 2 faces).
 * The whole comparison with the prototype (`scripts/probes/chart_lib.ts`) on 35 shapes: `scripts/probes/chart_assign_check.ts`. RED on the mutants
 * recorded in the step's report.
 */
import { describe, expect, it } from "vitest";
import { buildFaceMap } from "../src/input/face_map";
import { assignCharts, chartContour, seamTurn, type ChartAssignment, type ChartFace } from "../src/input/orbit_charts";
import type { Vec3 } from "../src/core/vec";
import { boxPolys, CUBE, DOD, DOD_FACE, heptagonPolys, hullPolys, ICO, onSphere, solid, tippedPolys } from "./helpers/chart_shapes";

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/** the contour and its assignment of a solid given by its polygons */
function assigned(polys: readonly (readonly Vec3[])[]): { C: ChartFace[]; A: ChartAssignment } {
  const s = solid(polys);
  const C = chartContour(buildFaceMap(s.faces, s.box));
  return { C, A: assignCharts(C) };
}
/** two faces share an edge: two corners in common */
const adjacent = (f: ChartFace, g: ChartFace): boolean => f.pts.filter((p) => g.pts.some((q) => dist(p, q) < 5e-4)).length >= 2;
const tips = (C: readonly ChartFace[]): number[] => C.map((f, i) => (f.pts.length === 3 ? i : -1)).filter((i) => i >= 0);

describe("⭐⭐⭐ gravity's chart serves every face it does not break (§3 1.)", () => {
  it("a box: four CELLS, two CAPS, nothing broken, no frame added", () => {
    const { C, A } = assigned(boxPolys(0.483, 0.483, 0.483));
    expect(C.length).toBe(6);
    expect([...A.gravity.kinds].sort()).toEqual(["CAP", "CAP", "CELL", "CELL", "CELL", "CELL"]);
    expect(A.brokenByGravity).toBe(0);
    expect(A.used).toEqual([]);
    for (const h of A.home) expect(h).toMatchObject({ frame: -1, rings: false, mode: "WORLD" });
  });
  it("⭐ a box's caps: four square layouts each (two frames × AXIS+ / AXIS-); a layout's exits — one with no turn, two a quarter turn, one a half (§3 6.)", () => {
    const { C, A } = assigned(boxPolys(0.483, 0.483, 0.483));
    expect([...A.layouts.keys()].sort()).toEqual(C.map((_, i) => i).filter((i) => A.kind[i] === "CAP"));
    expect(A.layouts.size).toBe(2);
    for (const [cap, layouts] of A.layouts) {
      expect(layouts.length).toBe(4);
      expect(layouts.map((h) => h.mode)).toEqual(["AXIS+", "AXIS-", "AXIS+", "AXIS-"]);
      const sides = C.map((_, g) => g).filter((g) => g !== cap && adjacent(C[cap]!, C[g]!));
      expect(sides.length).toBe(4);
      for (const h of layouts) {
        const turns = sides.map((g) => seamTurn(C[cap]!.n, h, C[g]!.n, A.home[g]!)).sort((x, y) => x - y);
        // (deg; `acos` near ±1 keeps ~1e-6° of the rounding)
        [0, 90, 90, 180].forEach((t, k) => expect(turns[k]!).toBeCloseTo(t, 4));
      }
      // one frame held either way up: a half turn wherever the axis crosses the edge's view
      for (let k = 0; k < 4; k += 2) {
        const [up, down] = [layouts[k]!, layouts[k + 1]!];
        const across = sides.filter((g) => Math.abs(C[g]!.n[0] * up.axis[0] + C[g]!.n[1] * up.axis[1] + C[g]!.n[2] * up.axis[2]) < 1e-9);
        expect(across.length).toBe(2);
        for (const g of across) expect(seamTurn(C[cap]!.n, up, C[g]!.n, down)).toBeCloseTo(180, 4);
      }
    }
  });
  it("`Scene_0`'s lying heptagon, flat ends: six CELLS, the two ends BENT, the bottom a CAP — all served by gravity", () => {
    const { C, A } = assigned(heptagonPolys());
    expect(C.length).toBe(9);
    const ends = C.map((f, i) => (Math.abs(f.n[0]) > 0.999 ? i : -1)).filter((i) => i >= 0);
    expect(ends.length).toBe(2);
    for (const i of ends) expect(A.gravity.kinds[i]).toBe("BENT");
    const bottom = C.findIndex((f) => f.n[1] < -0.999);
    expect(A.gravity.kinds[bottom]).toBe("CAP");
    expect(A.gravity.kinds.filter((k) => k === "CELL").length).toBe(6);
    expect(A.gravity.top.kind).toBe("EDGE");
    expect(A.brokenByGravity).toBe(0);
    expect(A.used).toEqual([]);
    expect([...A.layouts.keys()]).toEqual([bottom]);
  });
});

describe("⭐⭐⭐ the fans: the frame in which the rim is level — found, not snapped (§3 3.)", () => {
  it("⭐ `Scene_0bis`: the 14 tip faces FANS of the frame about the long axis, held WORLD; by the whole rule all 21 faces served by that frame", () => {
    const { C, A } = assigned(tippedPolys(7, 0.12));
    expect(C.length).toBe(21);
    const T = tips(C);
    expect(T.length).toBe(14);
    for (const i of T) expect(A.gravity.kinds[i]).toBe("BROKEN");
    // the bottom a cap the tips' columns do not reach along a level edge: broken too (15)
    expect(A.gravity.kinds[C.findIndex((f) => f.n[1] < -0.999)]).toBe("BROKEN");
    expect(A.brokenByGravity).toBe(15);
    expect(A.used.length).toBe(1);
    const u = A.used[0]!;
    expect(u.home.mode).toBe("WORLD");
    expect(Math.abs(u.home.axis[0])).toBeCloseTo(1, 12);
    for (const i of T) expect(A.frames[u.home.frame]!.kinds[i]).toBe("FAN");
    expect(new Set(u.faces).size).toBe(21);
    for (let i = 0; i < 21; i++) expect(A.home[i]).toEqual(u.home);
    for (const i of T) expect(A.kind[i]).toBe("FAN");
    expect(A.home.some((h) => h.rings)).toBe(false);
  });
  it("⭐ the tips' apex 12.6 mm off the polygon's centre: the SAME frame (⛔ today: the axis from the rim's centroid, snapped within 10°)", () => {
    const centred = assigned(tippedPolys(7, 0.12)).A;
    const off = assigned(tippedPolys(7, 0.12, false));
    const apex = off.C[tips(off.C)[0]!]!.pts.find((p) => Math.abs(p[0]) > 0.3)!;
    const prof = tippedPolys(7, 0).slice(0, 7).map((q) => q[0]!);
    const cy = prof.reduce((t, q) => t + q[1], 0) / 7;
    expect(Math.abs(apex[1] - cy)).toBeGreaterThan(0.012);
    expect(off.A.used.length).toBe(1);
    const a = off.A.used[0]!.home;
    const b = centred.used[0]!.home;
    expect(a.mode).toBe(b.mode);
    for (let k = 0; k < 3; k++) expect(Math.abs(a.axis[k]!)).toBeCloseTo(Math.abs(b.axis[k]!), 12);
    expect(new Set(off.A.used[0]!.faces).size).toBe(21);
  });
  it("⭐ a lying triangle prism with tips: a fan of THREE is a fan (⛔ today: `valenceMin` 5)", () => {
    const { C, A } = assigned(tippedPolys(3, 0.12));
    const T = tips(C);
    expect(T.length).toBe(6);
    expect(A.used.length).toBe(1);
    const h = A.used[0]!.home;
    for (const i of T) {
      expect(A.home[i]).toEqual(h);
      expect(A.kind[i]).toBe("FAN");
    }
    // each apex's star: three faces
    for (const s of [1, -1]) expect(T.filter((i) => C[i]!.pts.some((p) => s * p[0] > 0.3)).length).toBe(3);
  });
  it("⭐ an icosahedron, a vertex up: no fan round a corner whose star gravity partly serves — its broken faces go to the rings, no frame", () => {
    const { C, A } = assigned(hullPolys(onSphere(ICO, 0.25, ICO[0]!)));
    expect(C.length).toBe(20);
    expect(A.brokenByGravity).toBe(10);
    expect(A.used).toEqual([]);
    expect(A.home.filter((h) => h.rings).length).toBe(10);
    for (let i = 0; i < 20; i++) expect(A.home[i]!.rings).toBe(A.gravity.kinds[i] === "BROKEN");
  });
});

describe("⭐⭐⭐ the rings, the tilted rectangles (§3 3., 5.)", () => {
  it("a dodecahedron, a face up: every face on the rings — the caps the rings' caps, without a square layout", () => {
    const { C, A } = assigned(hullPolys(onSphere(DOD, 0.25, DOD_FACE)));
    expect(C.length).toBe(12);
    expect(A.brokenByGravity).toBe(12);
    expect(A.used).toEqual([]);
    for (const h of A.home) expect(h).toMatchObject({ frame: -1, rings: true });
    expect(A.kind.filter((k) => k === "CAP").length).toBe(2);
    expect(A.kind.filter((k) => k === "SKEW").length).toBe(10);
    for (const l of A.layouts.values()) expect(l).toEqual([]);
  });
  it("a cube standing on a corner: every face broken under gravity, TWO frames serve all six — none on the rings", () => {
    const { C, A } = assigned(hullPolys(onSphere(CUBE, 0.4, [1, 1, 1])));
    expect(C.length).toBe(6);
    expect(A.brokenByGravity).toBe(6);
    expect(A.used.length).toBe(2);
    expect(A.used.flatMap((u) => u.faces).sort()).toEqual([0, 1, 2, 3, 4, 5]);
    expect(A.home.some((h) => h.rings)).toBe(false);
    for (let i = 0; i < 6; i++) expect(A.kind[i]).toBe("CELL");
  });
  it("⭐ the cube on a corner, what the border PEEL decides: both frames held WORLD (⛔ the first AXIS- would turn the camera > 30° at its border); the first takes the four faces round its axis, the second the opposite pair left", () => {
    const { C, A } = assigned(hullPolys(onSphere(CUBE, 0.4, [1, 1, 1])));
    const sq = (n: Vec3, a: Vec3): number => Math.abs(n[0] * a[0] + n[1] * a[1] + n[2] * a[2]);
    // the reference's (`scripts/probes/chart_lib.ts`, `assignCharts`): [-0.7887, -0.5774, 0.2113] WORLD four faces, [-0.2113, 0.5774, 0.7887] WORLD two
    const ref: [Vec3, number][] = [[[-0.7887, -0.5774, 0.2113], 4], [[-0.2113, 0.5774, 0.7887], 2]];
    expect(A.used.length).toBe(2);
    A.used.forEach((u, k) => {
      const [axis, count] = ref[k]!;
      expect(u.home.mode).toBe("WORLD");
      for (let j = 0; j < 3; j++) expect(u.home.axis[j]!).toBeCloseTo(axis[j]!, 4);
      expect(u.faces.length).toBe(count);
      for (const i of u.faces) expect(sq(C[i]!.n, u.home.axis)).toBeLessThan(1e-9);
    });
    const pair = A.used[1]!.faces;
    expect(sq(C[pair[0]!]!.n, C[pair[1]!]!.n)).toBeCloseTo(1, 9);
  });
});
