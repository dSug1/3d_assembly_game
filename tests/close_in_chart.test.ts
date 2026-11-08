// ⭐⭐⭐ (2026-11-08, scope §32) GOLDEN VECTORS — THE CLOSE-IN CHART (`src/input/close_in_chart.ts`, K1 – K8, C1, C4), wired by `render/assembly_wiring.ts`.
// RED against `d926b88` (the module did not exist; §29's ropes cast per place). Each rule has its counter-case; mutants run 2026-11-08 (scope §32.6):
// the step test removed, the bridge removed, the shift dropped, the hysteresis removed, the accepted depth unlimited — each RED here.
import { describe, expect, it } from "vitest";
import { allowedShare, anchorChart, castHulls, chartAllows, chartFilled, chartGizmo, chartLines, chartRing, chartUV, CLOSE_IN_HYST_M, closeInDir, closeInNext, facetAccept, facetGrid, fillChart, fillGrid, gridDone, hullParts, hullPlanes, type Chart, type ChartFacet, type HullPart } from "../src/input/close_in_chart";
import type { Vec3 } from "../src/core/vec";

const box = (lo: Vec3, hi: Vec3): Vec3[] => [0, 1, 2, 3, 4, 5, 6, 7].map((c) => [c & 1 ? hi[0] : lo[0], c & 2 ? hi[1] : lo[1], c & 4 ? hi[2] : lo[2]]);

// A painting seen from the front (−z): its face at z = 0 (x 0 … 0.5, y 0 … 0.3), a part proud of it by 30 mm (x 0.30 … 0.40, y 0.10 … 0.20), a groove
// 20 mm wide down the painting at x 0.10 … 0.12 (narrower than the 45 mm piece), a slot 60 mm wide at x 0.20 … 0.26 (wider), and a protrusion far behind
// past the painting's right edge (x 0.55 … 0.70 at z 0.40 … 0.50 — a landing 43 cm deep).
const PARTS: Vec3[][] = [
  box([0, 0, 0], [0.1, 0.3, 0.05]),
  box([0.12, 0, 0], [0.2, 0.3, 0.05]),
  box([0.26, 0, 0], [0.5, 0.3, 0.05]),
  box([0.1, 0, 0.03], [0.12, 0.3, 0.05]), // the groove's floor, 30 mm in
  box([0.2, 0, 0.04], [0.26, 0.3, 0.05]), // the slot's floor, 40 mm in
  box([0.3, 0.1, -0.03], [0.4, 0.2, 0]), // the proud part
  box([0.55, 0, 0.4], [0.7, 0.3, 0.5]), // far behind
];
const IDS = ["left", "mid", "right", "groove", "slot", "proud", "far"];
const hulls: HullPart[] = hullParts(PARTS, IDS);
// the shell's front facet: outward −z, at the parts' support (the proud part's face, z = −0.03: n·p = 0.03), x 0 … 0.7, y 0 … 0.3
const F: ChartFacet = { n: [0, 0, -1], t: [1, 0, 0], b: [0, 1, 0], es: 0.03, tLo: 0, tHi: 0.7, bLo: 0, bHi: 0.3 };
const W = 0.045;
const on = (x: number, y: number): Vec3 => [x, y, -0.03];
const filled = (C: Chart): Chart => {
  while (!chartFilled(C)) fillChart(C, hulls, 100000);
  return C;
};
const acc = facetAccept(hulls, F);

describe("⭐⭐⭐ K1 — the casts: each part's convex hull, exact", () => {
  it("⭐ a box's hull is its six planes, outward; a cast meets the first part, its entering face's normal", () => {
    const P = hullPlanes(box([0, 0, 0], [1, 2, 3]));
    expect(P.length).toBe(6);
    for (const q of P) expect(q.n[0] * 0.5 + q.n[1] * 1 + q.n[2] * 1.5).toBeLessThan(q.d); // the centre inside every one
    const h = castHulls(hulls, [0.35, 0.15, -1], [0, 0, 1], 2)!;
    expect(h.id).toBe("proud");
    expect(h.point[2]).toBeCloseTo(-0.03, 12);
    h.normal.forEach((x, k) => expect(x).toBeCloseTo([0, 0, -1][k]!, 12));
    expect(castHulls(hulls, [0.52, 0.15, -1], [0, 0, 1], 2)).toBeNull(); // between the painting and the far part: nothing within 2 m? the far part is at x ≥ 0.55
  });
  it("⭐ a slanted face (a frustum's side) is met where it slopes", () => {
    const fr = hullParts([[[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 2], [1, 1, 2]]], ["fr"]);
    const h = castHulls(fr, [0.5, 0.5, 5], [0, 0, -1], 10)!;
    expect(h.point[2]).toBeCloseTo(1.5, 9);
  });
});

describe("⭐⭐⭐ K2 — the boot pass: a facet's own landings, its depth limit", () => {
  it("⭐⭐ the painting, its groove, its slot and the proud part are the facet's own; the protrusion 43 cm behind is NOT (⛔ any depth: §29.4 M1's plunges)", () => {
    expect(acc.maxDepth).toBeGreaterThan(0.069); // the slot's floor 70 mm below the shell
    expect(acc.maxDepth).toBeLessThan(0.1);
    expect(acc.cells.some((c) => c.u > 0.55)).toBe(false);
  });
});

describe("⭐⭐⭐ K3 – K6 — the region: continuous by construction; the singularities outside it", () => {
  const C = filled(anchorChart(hulls, 0, F, acc, on(0.05, 0.15), W)!);
  it("⭐⭐⭐ anchored on the painting: the painting's face is in, the proud part's step (30 mm) and the wide slot are OUT, the far protrusion OUT", () => {
    expect(chartAllows(C, 0.05, 0.15)).toBe(true);
    expect(chartAllows(C, 0.15, 0.25)).toBe(true); // across the narrow groove (bridged), on the painting
    expect(chartAllows(C, 0.45, 0.25)).toBe(false); // ⛔ beyond the wide slot: it cuts the painting top to bottom — another chart's
    expect(chartAllows(C, 0.35, 0.15)).toBe(false); // ⛔ the step up onto the proud part
    expect(chartAllows(C, 0.23, 0.15)).toBe(false); // ⛔ the slot, wider than the piece
    expect(chartAllows(C, 0.6, 0.15)).toBe(false); // ⛔ the far protrusion
    expect(chartAllows(C, 0.52, 0.15)).toBe(false); // ⛔ the void past the edge
  });
  it("⭐⭐⭐ K4 — the groove NARROWER than the piece is bridged (the gizmo over it at the rims' depth, no part); the slot wider than the piece is not", () => {
    const g = chartGizmo(C, 0.11, 0.15)!;
    expect(g).not.toBeNull();
    expect(g.point[2]).toBeCloseTo(0, 9); // level with the rims, not the groove's floor
    expect(g.normal).toBeNull();
  });
  it("⭐⭐⭐ THE GIZMO IS A FUNCTION OF THE PLACE: walked across the region 1 mm at a time, it never steps more than the place (plus the allowed slope) — no jump", () => {
    let prev: Vec3 | null = null;
    for (let x = 0.002; x < 0.5; x += 0.001) {
      const g = chartGizmo(C, x, 0.05);
      if (g === null) {
        prev = null;
        continue;
      }
      if (prev !== null) expect(Math.hypot(g.point[0] - prev[0], g.point[1] - prev[1], g.point[2] - prev[2])).toBeLessThan(0.0021);
      prev = g.point;
    }
  });
  it("⭐⭐⭐ K7 — the two lines lie in their planes through the gizmo EXACTLY, the gizmo a vertex of both, each at most the half-length each side", () => {
    const L = chartLines(C, 0.07, 0.12, 0.05);
    const g = chartGizmo(C, 0.07, 0.12)!.point;
    for (const p of L.green) expect(p[1]).toBeCloseTo(g[1], 12); // the green: the plane y = G's
    for (const p of L.red) expect(p[0]).toBeCloseTo(g[0], 12); // the red: the plane x = G's
    expect(L.green.some((p) => p === g || (p[0] === g[0] && p[1] === g[1] && p[2] === g[2]))).toBe(true);
    expect(L.red.some((p) => p[0] === g[0] && p[1] === g[1] && p[2] === g[2])).toBe(true);
    for (const p of [...L.green, ...L.red]) expect(Math.hypot(p[0] - g[0], p[1] - g[1])).toBeLessThan(0.0501);
    // ends at the region's edge: the red runs down to the painting's bottom (y 0) and stops
    expect(Math.min(...L.red.map((p) => p[1]))).toBeGreaterThan(-0.002);
  });
  it("⭐⭐⭐ (§32.10) K8 — THE RING: in the open painting ONE closed circle of the radius round the gizmo; near the region's border cut by it — never outside the region", () => {
    // the gizmo in the painting's open left face (x 0 … 0.1 — the groove bridged beyond): a 30 mm ring is a circle
    const open = chartRing(C, 0.05, 0.15, 0.03);
    expect(open.length).toBe(1);
    const g = chartGizmo(C, 0.05, 0.15)!.point;
    for (const p of open[0]!) expect(Math.hypot(p[0] - g[0], p[1] - g[1])).toBeGreaterThan(0.0285);
    for (const p of open[0]!) expect(Math.hypot(p[0] - g[0], p[1] - g[1])).toBeLessThan(0.0301);
    for (const p of open[0]!) expect(p[2]).toBeCloseTo(0, 9); // on the painting's face
    // near the painting's bottom edge (y 0): the ring cut flat there — no point below the region's border, the rest the circle
    const cut = chartRing(C, 0.05, 0.01, 0.03);
    expect(cut.length).toBe(1);
    expect(Math.min(...cut[0]!.map((p) => p[1]))).toBeGreaterThan(-0.0026);
    expect(Math.max(...cut[0]!.map((p) => p[1]))).toBeGreaterThan(0.038);
    // a region smaller than the ring (the proud part's top, 100 × 100 mm, a 200 mm ring): the ring is the region's own border
    const P = filled(anchorChart(hulls, 0, F, acc, on(0.35, 0.15), W)!);
    const small = chartRing(P, 0.35, 0.15, 0.2);
    expect(small.length).toBe(1);
    const xs = small[0]!.map((p) => p[0]);
    const ys = small[0]!.map((p) => p[1]);
    expect(Math.min(...xs)).toBeGreaterThan(0.297);
    expect(Math.max(...xs)).toBeLessThan(0.403);
    expect(Math.min(...ys)).toBeGreaterThan(0.097);
    expect(Math.max(...ys)).toBeLessThan(0.203);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.095);
  });
  it("⭐⭐⭐ (§32.10) THE ATLAS: the facet's grid cast in the background; a chart on it floods the cached landings with NO cast, its region the same as by its own casts", () => {
    const G = facetGrid(hulls, F);
    let n = 0;
    while (!gridDone(G)) n += fillGrid(G, hulls, 5000);
    expect(n).toBe(G.nu * G.nv);
    const A = anchorChart(hulls, 0, F, acc, on(0.05, 0.15), W, G)!;
    const spent = fillChart(A, hulls, 600);
    expect(spent).toBe(0);
    expect(chartFilled(A)).toBe(true); // whole in ONE call (⛔ grown 600 casts a frame: a diamond growing on the glass)
    expect(Math.abs(A.cells.size - C.cells.size)).toBeLessThan(C.cells.size * 0.01);
    for (const [x, y] of [[0.05, 0.15], [0.15, 0.25], [0.35, 0.15], [0.23, 0.15]] as const) expect(chartAllows(A, x, y)).toBe(chartAllows(C, x, y));
  });
  it("⭐⭐⭐ (§32.10) THE RING FIXED WHERE CLOSE IN WAS ENTERED — the area is the region INSIDE it: the gizmo, the lines and the stop end at the ring (⛔ the whole region: the patch's far border)", () => {
    const R = 0.04;
    const K = filled(anchorChart(hulls, 0, F, acc, on(0.05, 0.15), W, null, R)!);
    expect(K.cu).toBeCloseTo(0.05, 12);
    expect(K.cv).toBeCloseTo(0.15, 12);
    expect(chartAllows(K, 0.05 + 0.039, 0.15)).toBe(true);
    expect(chartAllows(K, 0.05 + 0.041, 0.15)).toBe(false); // ⛔ inside the region, outside the ring
    expect(chartAllows(C, 0.05 + 0.041, 0.15)).toBe(true); // (the region without a ring holds it)
    expect(K.cells.size).toBeLessThan((Math.PI * R * R) / (0.0025 * 0.0025) + 100); // the flood stays in the ring
    // the lines from a gizmo moved off the centre stop at the ring, not at ±50 mm nor at the region's far border
    const Ls = chartLines(K, 0.07, 0.15, 0.05);
    expect(Math.max(...Ls.green.map((p) => p[0]))).toBeLessThan(0.05 + R + 1e-9);
    expect(Math.max(...Ls.green.map((p) => p[0]))).toBeGreaterThan(0.05 + R - 0.003);
    // the ring drawn is the anchor's circle, whatever the gizmo's place now
    const ring = chartRing(K, K.cu, K.cv, K.ringR);
    expect(ring.length).toBe(1);
    for (const p of ring[0]!) expect(Math.abs(Math.hypot(p[0] - 0.05, p[1] - 0.15) - R)).toBeLessThan(0.0015);
    // a region smaller than the ring: the area is the region (the proud part's top inside a 200 mm ring)
    const P = filled(anchorChart(hulls, 0, F, acc, on(0.35, 0.15), W, null, 0.2)!);
    expect(chartAllows(P, 0.39, 0.19)).toBe(true);
    expect(chartAllows(P, 0.45, 0.15)).toBe(false);
  });
  it("⭐⭐⭐ the singularity is reached by ANOTHER chart: anchored over the proud part, its top is the region (the painting around it out)", () => {
    const P = filled(anchorChart(hulls, 0, F, acc, on(0.35, 0.15), W)!);
    expect(chartAllows(P, 0.35, 0.15)).toBe(true);
    expect(chartAllows(P, 0.05, 0.15)).toBe(false);
    const S = filled(anchorChart(hulls, 0, F, acc, on(0.23, 0.15), W)!); // into the wide slot
    expect(chartGizmo(S, 0.23, 0.15)!.point[2]).toBeCloseTo(0.04, 9); // its floor
  });
  it("⭐⭐⭐ K5 — a place over nothing accepted: the chart SHIFTED onto the nearest accepted landing — the gizmo there at once, moving with the place", () => {
    const S = filled(anchorChart(hulls, 0, F, acc, on(0.62, 0.15), W)!); // in front of the far protrusion: refused (K2)
    const uv = chartUV(S, on(0.62, 0.15));
    const g = chartGizmo(S, uv[0], uv[1])!;
    expect(g.point[0]).toBeLessThan(0.51); // on the painting's right edge, not 43 cm behind
    expect(g.point[2]).toBeLessThan(0.01);
    const uv2 = chartUV(S, on(0.61, 0.15));
    expect(chartGizmo(S, uv2[0], uv2[1])!.point[0]).toBeCloseTo(g.point[0] - 0.01, 9);
  });
});

describe("⭐⭐⭐ C1, C4, K6 — close in, the piece's direction, the stop", () => {
  it("⭐⭐ C1 — entered at the distance, left only past it plus the hysteresis", () => {
    expect(closeInNext(false, 0.12, 0.12)).toBe(true);
    expect(closeInNext(false, 0.121, 0.12)).toBe(false);
    expect(closeInNext(true, 0.12 + CLOSE_IN_HYST_M - 0.001, 0.12)).toBe(true);
    expect(closeInNext(true, 0.12 + CLOSE_IN_HYST_M + 0.001, 0.12)).toBe(false);
  });
  it("⭐⭐ C4 — the view far out, the chart's normal at the shell, smooth between", () => {
    const u: Vec3 = [Math.SQRT1_2, 0, -Math.SQRT1_2];
    const n: Vec3 = [0, 0, -1];
    expect(closeInDir(u, n, 1)[0]).toBeCloseTo(u[0], 12);
    expect(closeInDir(u, n, 0)).toEqual([0, 0, -1]);
    const a = closeInDir(u, n, 0.5);
    expect(a[0]).toBeGreaterThan(0.1);
    expect(a[0]).toBeLessThan(u[0]);
  });
  it("⭐ K6 — the share of a step that keeps the place allowed: halved to the edge", () => {
    expect(allowedShare(() => true)).toBe(1);
    expect(allowedShare((t) => t <= 0.3)).toBeCloseTo(0.3, 2);
    expect(allowedShare(() => false)).toBe(0);
  });
});
