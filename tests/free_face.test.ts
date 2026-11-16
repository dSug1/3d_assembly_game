/**
 * GOLDEN VECTORS — **THE GEOMETRY OF A FREE FACE, STEP C2** (2026-11-16, `Claude/40_RENDER_SCENE/spec/TILTED_POLE_CLOSE_IN.md` §2.1, §3, §7):
 * `src/input/free_face.ts`, not wired yet.
 * * Against the reference (`scripts/probes/free_face_study.ts`, Part A — its `isFree`, `unfoldedUp`, `edgesOf` copied below because a test must not
 *   import from `scripts/`) on the 35 shapes of `scripts/probes/chart_lib.ts` (rebuilt in `helpers/free_face_shapes.ts`, read through the real face map
 *   and `chartContour`): the free faces of every shape (41), every exit's turn, every heading square to its side, into a top face and out of a bottom.
 * * A cube (`Scene_1`'s box): onto the top / the bottom from each side; the exits 0, π/2, π/2, π.
 * * `Scene_0bis`: one free face (the bottom, 4 sides) — from a tip's triangle the heading along the axis, from a long side across it.
 * * A concave edge: a level floor against a RISING far wall (0) and a FALLING one (π).
 * * A zone held by its axis: the cube about +x.
 * * `nearestHeading`, `turnHolds`; the module imports no engine (`boundary.test.ts`).
 * RED on the mutants recorded in the step's report.
 */
import { describe, expect, it } from "vitest";
import { buildFaceMap } from "../src/input/face_map";
import { chartContour, type ChartFace } from "../src/input/orbit_charts";
import { entryHeading, exitTurnRad, freeEdges, freeFaces, isFreeFace, nearestHeading, turnHolds, type FreeEdge } from "../src/input/free_face";
import type { Vec3 } from "../src/core/vec";
import { boxPolys, solid } from "./helpers/chart_shapes";
import { FREE_FACE_SHAPES } from "./helpers/free_face_shapes";

const D = Math.PI / 180;
const H = Math.PI / 2;
const Y: Vec3 = [0, 1, 0];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => {
  const l = len(a);
  return l > 1e-15 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 1, 0];
};
const dist = (a: Vec3, b: Vec3) => len(sub(a, b));
const contour = (polys: readonly (readonly Vec3[])[]): ChartFace[] => {
  const s = solid(polys);
  return chartContour(buildFaceMap(s.faces, s.box));
};

// ── THE REFERENCE, copied from `scripts/probes/free_face_study.ts` (2026-11-16, `ad33775`) — `isFree`, `unfoldedUp`, `edgesOf`, its `angDeg` ──────────
const REF_TOL = 5e-4;
const REF_LEVEL_COS = Math.cos(1 * D);
const refRot = (v: Vec3, k: Vec3, th: number): Vec3 => add(add(mul(v, Math.cos(th)), mul(cross(k, v), Math.sin(th))), mul(k, dot(k, v) * (1 - Math.cos(th))));
const refAngDeg = (a: Vec3, b: Vec3): number => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (len(a) * len(b))))) / D;
const refIsFree = (f: ChartFace): boolean => Math.abs(f.n[1]) >= REF_LEVEL_COS;
function refUnfoldedUp(F: ChartFace, G: ChartFace, a: Vec3, b: Vec3): Vec3 | null {
  const w = sub(Y, mul(G.n, G.n[1]));
  if (len(w) < 1e-6) return null;
  const d = unit(sub(b, a));
  const th = Math.atan2(dot(d, cross(G.n, F.n)), dot(G.n, F.n));
  return unit(refRot(unit(w), d, th));
}
function refEdgesOf(faces: readonly ChartFace[], i: number): { a: Vec3; b: Vec3; g: number; h: Vec3 | null }[] {
  const F = faces[i]!;
  const out: { a: Vec3; b: Vec3; g: number; h: Vec3 | null }[] = [];
  for (let k = 0; k < F.pts.length; k++) {
    const a = F.pts[k]!, b = F.pts[(k + 1) % F.pts.length]!;
    const g = faces.findIndex((G, j) => j !== i && G.pts.some((p) => dist(p, a) < REF_TOL) && G.pts.some((p) => dist(p, b) < REF_TOL));
    out.push({ a, b, g, h: g < 0 ? null : refUnfoldedUp(F, faces[g]!, a, b) });
  }
  return out;
}

/** the reference's free faces per shape (Part A, run 2026-11-16) — a change to the rule or to the contour shows here */
const FREE_COUNT: Record<string, number> = {
  "cube (Scene_1's box)": 2,
  "heptagon lying, flat ends (Scene_0)": 1,
  "heptagon lying with tips 120 mm (Scene_0bis)": 1,
  "heptagon lying with tips, the apex 12.6 mm off centre": 1,
  "heptagon lying with STEEP tips 600 mm": 1,
  "triangle prism lying, flat ends (a steep roof)": 1,
  "triangle prism lying with tips (fans of 3)": 1,
  "square prism lying with tips (fans of 4)": 2,
  "pentagon lying with tips, the apex 25 mm off centre": 1,
  "hexagon prism lying with tips": 2,
  "heptagon with tips, its axis 20° off the horizontal": 0,
  "heptagon with tips, its axis at 45°": 0,
  "heptagon with tips, upright": 0,
  "pentagon prism upright, flat caps": 2,
  "box with a shallow pyramid roof": 1,
  "box with a steep pyramid roof": 1,
  "shed (a box under one slanted roof, 60°)": 1,
  "house, shallow gable roof": 1,
  "house, steep gable roof": 1,
  "frustum, sides leaning in 30°": 2,
  "frustum upside down": 2,
  "triangle prism upright, flat caps": 2,
  "wedge upright (a 20° blade)": 2,
  "thin plate lying": 2,
  "long box": 2,
  "cube turned 30° about a level axis (faces' edges 30° off level)": 0,
  "cube on an edge (turned 45°)": 0,
  "cube on a corner": 0,
  "square antiprism": 2,
  "tetrahedron on a face": 1,
  "octahedron on a vertex": 0,
  "octahedron on a face": 2,
  "icosahedron, a vertex up": 0,
  "dodecahedron, a face up": 2,
  "hull of two tipped heptagons crossed (fans on x and on z)": 2,
};

/** every heading of a free face: a unit vector in its plane, square to its own side, INTO a top face and OUT of a bottom one (about `up`) */
function checkHeadings(F: ChartFace, E: readonly FreeEdge[], up: Vec3): void {
  for (const e of E) {
    if (e.heading === null) continue;
    const h = e.heading;
    expect(len(h)).toBeCloseTo(1, 12);
    expect(Math.abs(dot(h, F.n))).toBeLessThan(1e-9);
    expect(Math.abs(dot(h, unit(sub(e.b, e.a))))).toBeLessThan(1e-9);
    const inward = dot(h, sub(F.c, mul(add(e.a, e.b), 0.5))) > 0;
    expect(inward).toBe(dot(F.n, up) > 0);
  }
}

describe("⭐⭐⭐ against the reference on the 35 shapes (the world's hold)", () => {
  it("the table has the 35 shapes, the 41 free faces", () => {
    expect(FREE_FACE_SHAPES.length).toBe(35);
    expect(FREE_FACE_SHAPES.map((s) => s.name)).toEqual(Object.keys(FREE_COUNT));
    expect(Object.values(FREE_COUNT).reduce((t, n) => t + n, 0)).toBe(41);
  });
  for (const s of FREE_FACE_SHAPES) {
    it(s.name, () => {
      const C = contour(s.polys());
      const free = freeFaces(C, Y);
      expect(free).toEqual(C.map((_, i) => i).filter((i) => refIsFree(C[i]!)));
      expect(free.length).toBe(FREE_COUNT[s.name]);
      for (const i of free) {
        expect(isFreeFace(C[i]!.n, Y)).toBe(true);
        const E = freeEdges(C, i, Y);
        const R = refEdgesOf(C, i);
        expect(E.map((e) => e.to)).toEqual(R.map((r) => r.g));
        expect(E.map((e) => e.heading === null)).toEqual(R.map((r) => r.h === null));
        checkHeadings(C[i]!, E, Y);
        for (const r of R) {
          if (r.h === null) continue;
          for (const x of R) {
            if (x.h === null) continue;
            const t = exitTurnRad(entryHeading(E, r.g)!, E, x.g)!;
            // the true angle between the reference's two unfolded ups, everywhere…
            expect(Math.abs(t - Math.atan2(len(cross(r.h, x.h)), dot(r.h, x.h)))).toBeLessThan(1e-12);
            // …and the reference's own figure: within 1e-9 — but at 0 and π, where its `acos` keeps √ε of rounding (measured: 2.1e-8 rad), within 1e-7
            const ref = refAngDeg(r.h, x.h) * D;
            const atEnd = ref < 1e-6 || ref > Math.PI - 1e-6;
            expect(Math.abs(t - ref)).toBeLessThan(atEnd ? 1e-7 : 1e-9);
          }
        }
      }
    });
  }
});

describe("⭐⭐⭐ a cube (`Scene_1`'s box)", () => {
  const C = contour(boxPolys(0.483, 0.483, 0.483));
  const top = C.findIndex((f) => f.n[1] > 0.999);
  const bottom = C.findIndex((f) => f.n[1] < -0.999);
  it("its two free faces are the top and the bottom", () => {
    expect(freeFaces(C, Y).sort()).toEqual([top, bottom].sort());
  });
  for (const [name, i, sign] of [["the top", top, -1], ["the BOTTOM", bottom, 1]] as const) {
    it(`onto ${name} from each of the four sides: the heading ${sign < 0 ? "away from" : "back toward"} that side; the exits 0, π/2, π/2, π`, () => {
      const E = freeEdges(C, i, Y);
      expect(E.length).toBe(4);
      checkHeadings(C[i]!, E, Y);
      const sides = E.map((e) => e.to);
      expect(new Set(sides).size).toBe(4);
      for (const g of sides) {
        const h = entryHeading(E, g)!;
        // the side's outward normal: away from it is against it, back toward it along it
        expect(dot(h, C[g]!.n)).toBeCloseTo(sign, 12);
        const turns = sides.map((x) => exitTurnRad(h, E, x)!).sort((a, b) => a - b);
        expect(turns[0]!).toBeLessThan(1e-12);
        expect(turns[1]!).toBeCloseTo(H, 12);
        expect(turns[2]!).toBeCloseTo(H, 12);
        expect(turns[3]!).toBeCloseTo(Math.PI, 12);
        expect(exitTurnRad(h, E, g)!).toBeLessThan(1e-12);
      }
    });
  }
  it("no side shared with a face: no entry, no exit", () => {
    const E = freeEdges(C, top, Y);
    expect(entryHeading(E, bottom)).toBeNull();
    expect(exitTurnRad([1, 0, 0], E, bottom)).toBeNull();
    expect(exitTurnRad([1, 0, 0], E, -1)).toBeNull();
  });
  it("⭐ a cap tolerance of its own: a face 2° off level is free under 3°, bound under the default (1°)", () => {
    const n: Vec3 = [Math.sin(2 * D), Math.cos(2 * D), 0];
    expect(isFreeFace(n, Y)).toBe(false);
    expect(isFreeFace(n, Y, 3)).toBe(true);
    expect(isFreeFace([0, -1, 0], Y)).toBe(true);
    expect(isFreeFace([Math.sin(0.5 * D), -Math.cos(0.5 * D), 0], Y)).toBe(true);
  });
});

describe("⭐⭐⭐ `Scene_0bis` (the world's hold)", () => {
  const C = contour(FREE_FACE_SHAPES.find((s) => s.key === "scene0bis")!.polys());
  const free = freeFaces(C, Y);
  it("one free face: the bottom, four sides — two tips' triangles, two long sides", () => {
    expect(free.length).toBe(1);
    const i = free[0]!;
    expect(C[i]!.n[1]).toBeLessThan(-0.999);
    const E = freeEdges(C, i, Y);
    expect(E.length).toBe(4);
    expect(E.map((e) => C[e.to]!.pts.length).sort()).toEqual([3, 3, 4, 4]);
    checkHeadings(C[i]!, E, Y);
  });
  it("entered from a tip's triangle the heading lies along the axis (x) — back toward that tip; from a long side across it (z); the exits", () => {
    const i = free[0]!;
    const E = freeEdges(C, i, Y);
    const tips = E.map((e) => e.to).filter((g) => C[g]!.pts.length === 3);
    const longs = E.map((e) => e.to).filter((g) => C[g]!.pts.length === 4);
    for (const g of tips) {
      const h = entryHeading(E, g)!;
      expect(Math.abs(h[0])).toBeCloseTo(1, 12);
      expect(Math.sign(h[0])).toBe(Math.sign(C[g]!.c[0]));
      expect(exitTurnRad(h, E, g)!).toBeLessThan(1e-12);
      expect(exitTurnRad(h, E, tips.find((x) => x !== g)!)!).toBeCloseTo(Math.PI, 12);
      for (const x of longs) expect(exitTurnRad(h, E, x)!).toBeCloseTo(H, 12);
    }
    for (const g of longs) {
      const h = entryHeading(E, g)!;
      expect(Math.abs(h[2])).toBeCloseTo(1, 12);
      expect(Math.sign(h[2])).toBe(Math.sign(C[g]!.c[2] - C[i]!.c[2]));
      expect(exitTurnRad(h, E, g)!).toBeLessThan(1e-12);
      expect(exitTurnRad(h, E, longs.find((x) => x !== g)!)!).toBeCloseTo(Math.PI, 12);
      for (const x of tips) expect(exitTurnRad(h, E, x)!).toBeCloseTo(H, 12);
    }
  });
});

describe("⭐⭐ a concave edge (§2.2 O11): a level floor, its near side a wall FALLING from it, its far side a wall RISING from it — or falling", () => {
  const face = (index: number, n: Vec3, pts: Vec3[]): ChartFace => {
    const c = mul(pts.reduce<Vec3>((t, p) => add(t, p), [0, 0, 0]), 1 / pts.length);
    return { index, n, pts, area: 1, c };
  };
  // the floor: y 0, x 0 … 1, z 0 … 1 (the near side z 0, the far side z 1)
  const floor = face(0, [0, 1, 0], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]);
  // the near side: a wall FALLING from the floor (a convex edge, its outward normal −z)
  const near = face(1, [0, 0, -1], [[0, 0, 0], [1, 0, 0], [1, -1, 0], [0, -1, 0]]);
  // the far side RISING: a wall standing on the floor's far edge, its outward normal −z — facing back over the floor
  const rising = face(2, [0, 0, -1], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]);
  // the far side FALLING: a wall going down from the floor's far edge, its outward normal +z
  const falling = face(2, [0, 0, 1], [[0, 0, 1], [1, 0, 1], [1, -1, 1], [0, -1, 1]]);
  it("entered over the near side, the exit onto the RISING far wall turns 0 — the wall faces the camera", () => {
    const F = [floor, near, rising];
    expect(freeFaces(F, Y)).toEqual([0]);
    const E = freeEdges(F, 0, Y);
    expect(E.map((e) => e.to)).toEqual([1, -1, 2, -1]);
    const h = entryHeading(E, 1)!;
    expect(h[2]).toBeCloseTo(1, 12);
    expect(exitTurnRad(h, E, 2)!).toBeLessThan(1e-12);
  });
  it("…onto a FALLING far wall, π", () => {
    const F = [floor, near, falling];
    const E = freeEdges(F, 0, Y);
    checkHeadings(floor, E, Y);
    expect(exitTurnRad(entryHeading(E, 1)!, E, 2)!).toBeCloseTo(Math.PI, 12);
  });
  it("a level neighbour gives no layout; several sides shared with one neighbour: the entry reads the FIRST", () => {
    const step = face(1, [0, 1, 0], [[0, 0, 0], [1, 0, 0], [1, 0, -1], [0, 0, -1]]);
    const S = freeEdges([floor, step], 0, Y);
    expect(S[0]!).toMatchObject({ to: 1, heading: null });
    expect(entryHeading(S, 1)).toBeNull();
    expect(exitTurnRad([0, 0, 1], S, 1)).toBeNull();
    const E: FreeEdge[] = [
      { a: [0, 0, 0], b: [1, 0, 0], to: 5, heading: [0, 0, 1] },
      { a: [1, 0, 0], b: [1, 0, 1], to: 5, heading: [-1, 0, 0] },
    ];
    expect(entryHeading(E, 5)).toEqual([0, 0, 1]);
    expect(exitTurnRad([0, 0, 1], E, 5)!).toBeLessThan(1e-12);
  });
});

describe("⭐⭐ a zone held by its axis: the cube about +x", () => {
  const X: Vec3 = [1, 0, 0];
  const C = contour(boxPolys(0.483, 0.483, 0.483));
  it("its two x faces are the free ones; the headings by the same rule about x; the exits 0, π/2, π/2, π", () => {
    const free = freeFaces(C, X);
    expect(free.map((i) => Math.round(C[i]!.n[0])).sort()).toEqual([-1, 1]);
    for (const i of free) {
      const E = freeEdges(C, i, X);
      expect(E.length).toBe(4);
      expect(E.every((e) => e.heading !== null)).toBe(true);
      checkHeadings(C[i]!, E, X);
      for (const e of E) {
        const h = entryHeading(E, e.to)!;
        expect(dot(h, C[e.to]!.n)).toBeCloseTo(C[i]!.n[0] > 0 ? -1 : 1, 12);
        const turns = E.map((x) => exitTurnRad(h, E, x.to)!).sort((a, b) => a - b);
        [0, H, H, Math.PI].forEach((t, k) => expect(turns[k]!).toBeCloseTo(t, 12));
      }
    }
  });
});

describe("⭐⭐ `nearestHeading` — an entry with no edge (§2.2 O4)", () => {
  const C = contour(boxPolys(0.483, 0.483, 0.483));
  const top = C.findIndex((f) => f.n[1] > 0.999);
  const E = freeEdges(C, top, Y);
  const n = C[top]!.n;
  const turnY = (v: Vec3, deg: number): Vec3 => refRot(v, Y, deg * D);
  it("a direction 30° off a side's heading picks that side's — the shown direction laid into the face's plane first", () => {
    for (const e of E) {
      for (const deg of [30, -30]) {
        const shown = add(turnY(e.heading!, deg), [0, 2, 0]);
        expect(nearestHeading(E, shown, n)).toEqual(e.heading);
      }
    }
  });
  it("exactly between two (45°): the first in the polygon's order", () => {
    for (let k = 0; k < E.length; k++) {
      const a = E[k]!.heading!, b = E[(k + 1) % E.length]!.heading!;
      const shown = unit(add(a, b));
      expect(dot(a, b)).toBeCloseTo(0, 12);
      expect(nearestHeading(E, shown, n)).toEqual(k + 1 < E.length ? a : b);
    }
  });
  it("along the normal (nothing in the plane): the first", () => {
    expect(nearestHeading(E, [0, 1, 0], n)).toEqual(E[0]!.heading);
    expect(nearestHeading(E, [0, -3, 0], n)).toEqual(E[0]!.heading);
  });
  it("no layout at all: null", () => {
    expect(nearestHeading([{ a: [0, 0, 0], b: [1, 0, 0], to: -1, heading: null }], [1, 0, 0], n)).toBeNull();
  });
});

describe("⭐⭐ `turnHolds` — the dy hold over a threshold the caller chooses", () => {
  it("91° over 90 holds; exactly 90° does not (with its rounding); 100° over 120 does not; 121° over 120 holds; NaN never", () => {
    expect(turnHolds(91 * D, 90 * D)).toBe(true);
    expect(turnHolds(90 * D, 90 * D)).toBe(false);
    expect(turnHolds(H + 1e-12, H)).toBe(false);
    expect(turnHolds(100 * D, 120 * D)).toBe(false);
    expect(turnHolds(121 * D, 120 * D)).toBe(true);
    expect(turnHolds(Number.NaN, 90 * D)).toBe(false);
  });
  it("a cube's quarter turn, as computed, is not over 90°", () => {
    const C = contour(boxPolys(0.483, 0.483, 0.483));
    const top = C.findIndex((f) => f.n[1] > 0.999);
    const E = freeEdges(C, top, Y);
    for (const e of E) for (const x of E) {
      const t = exitTurnRad(e.heading!, E, x.to)!;
      if (Math.abs(t - H) < 1e-6) expect(turnHolds(t, H)).toBe(false);
    }
  });
});
