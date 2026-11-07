/**
 * ⭐⭐⭐ §30 THE SECTION, EXACT (2026-11-07, `TILTED_ORBIT_REBUILD_SCOPE.md` §30.3 S1 – S3, `src/input/section.ts`) — each vector is RED against `d926b88`
 * (no section: the ropes landed by a mesh cast anywhere — R1's "any surface, at any depth" — on a top, the back's protrusion 48 cm below; no fill: the red
 * line stopped at a lower part's top beside a gap the green bridges).
 */
import { describe, expect, it } from "vitest";
import { buildSection, faceWidth, sectionCast, sectionLanding, sectionRuns, sectionSupport } from "../src/input/section";
import { planeThrough, type CutLoop } from "../src/input/plane_cut";
import { travelAcross, travelAt } from "../src/input/loop_travel";
import type { Vec3 } from "../src/core/vec";

/** an axis-aligned box's eight corners */
const box = (lo: Vec3, hi: Vec3): Vec3[] => {
  const out: Vec3[] = [];
  for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) out.push([x, y, z]);
  return out;
};
const close = (a: Vec3, b: Vec3, d = 9) => a.forEach((x, k) => expect(x).toBeCloseTo(b[k]!, d));

// Scene_1's painting in miniature: a 33 mm slab, a part proud of its BACK at the bottom (the protrusion 48 cm below the top in the probes)
const PAINTING = box([-0.5, 0, -0.0165], [0.5, 0.45, 0.0165]);
const BACK_PROTRUSION = box([-0.5, 0, -0.1], [0.5, 0.05, -0.0165]);

describe("⭐⭐⭐ §30 S1 — the section of convex parts, exact", () => {
  it("⭐ a box cut square to an axis is its face's rectangle; a cast from outside meets its face", () => {
    const sec = buildSection([box([0, 0, 0], [1, 1, 1])], planeThrough([0.5, 0, 0], [1, 0, 0]), 0);
    expect(sec.cuts.length).toBe(1);
    expect(sec.cuts[0]!.poly.length).toBe(4);
    const h = sectionCast(sec, [0.5, 0.5, 3], [0, 0, -1], 6, null)!;
    close(h.point, [0.5, 0.5, 1]);
    expect(h.part).toBe(0);
    expect(sectionCast(sec, [0.5, 1.5, 3], [0, 0, -1], 6, null)).toBeNull(); // above it: nothing
  });
  it("⭐ a slanted plane: the cut is the hull of the edges' crossings (a hexagon through a cube's centre)", () => {
    const sec = buildSection([box([0, 0, 0], [1, 1, 1])], planeThrough([0.5, 0.5, 0.5], [1, 1, 1]), 0);
    expect(sec.cuts[0]!.poly.length).toBe(6);
  });
});

describe("⭐⭐⭐ §30 S2 — each face owns its run (⛔ §29.4 M1: the plunges)", () => {
  // the red plane x = 0; the shell loop round the painting and its protrusion: front (z = +0.05), top (y = 0.5), back (z = −0.15), bottom (y = −0.05)
  const loop: CutLoop = {
    pts: [[0, -0.05, 0.05], [0, 0.5, 0.05], [0, 0.5, -0.15], [0, -0.05, -0.15]],
    facet: [0, 1, 2, 3],
  };
  const facets = [
    { n: [0, 0, 1] as Vec3, cap: false },
    { n: [0, 1, 0] as Vec3, cap: true },
    { n: [0, 0, -1] as Vec3, cap: false },
    { n: [0, -1, 0] as Vec3, cap: true },
  ];
  const sec = buildSection([PAINTING, BACK_PROTRUSION], planeThrough([0, 0, 0], [1, 0, 0]), 0.05);
  const runs = sectionRuns(sec, loop, facets);
  it("⭐⭐ the top's run ends at the painting's top-back corner — the support in the top/back bisector — never at the protrusion beyond it", () => {
    close(sectionSupport(sec, [0, 1, -1], null)!, [0, 0.45, -0.0165]);
    const top = runs.get(1)!;
    expect(top.hi - top.lo).toBeCloseTo(0.033, 9); // the painting's 33 mm
  });
  it("⛔⛔ a top place beyond the painting's back (z = −0.05): no landing — a void at the contour's edge (R3 rounds); ⛔ `d926b88` landed on the protrusion, 40 cm down", () => {
    const q = { p: [0, 0.5, -0.05] as Vec3, facet: 1, n: [0, 1, 0] as Vec3 };
    expect(sectionLanding(sec, runs.get(1), true, q, ["painting", "protrusion"])).toBeNull();
    // the same cast unrestricted: the plunge
    const plunge = sectionLanding(sec, undefined, true, q, ["painting", "protrusion"])!;
    expect(plunge.point[1]).toBeCloseTo(0.05, 9);
    expect(plunge.host).toBe("protrusion");
    // over the painting: its top
    const on = sectionLanding(sec, runs.get(1), true, { p: [0, 0.5, 0], facet: 1, n: [0, 1, 0] }, ["painting", "protrusion"])!;
    close(on.point, [0, 0.45, 0]);
    expect(on.host).toBe("painting");
  });
  it("⭐ the protrusion's top belongs to the BACK's run (the back's casts reach it)", () => {
    const back = runs.get(2)!;
    const x = (p: Vec3) => back.t[0] * p[0] + back.t[1] * p[1] + back.t[2] * p[2];
    expect(x([0, 0.05, -0.15])).toBeGreaterThanOrEqual(back.lo - 1e-9);
    expect(x([0, 0.05, -0.15])).toBeLessThanOrEqual(back.hi + 1e-9);
  });
});

describe("⭐⭐⭐ §30 S3 — THE FILL (the owner's D2b1, Q3): the void beside a lower part, up to where the other line stops bridging", () => {
  // Piece22 in miniature: a lower part C between two taller ones, A (top 0.45) and B (top 0.44); the red plane through C (x = 0)
  const A = box([-0.3, 0, -0.0165], [-0.05, 0.45, 0.0165]);
  const C = box([-0.05, 0, -0.0165], [0.05, 0.413, 0.0165]);
  const B = box([0.05, 0, -0.0165], [0.3, 0.44, 0.0165]);
  const sec = buildSection([A, C, B], planeThrough([0, 0, 0], [1, 0, 0]), 0.05);
  it("⭐⭐ the front's cast above C's top lands on the fill's front (the green bridges there) — up to the LOWER lip (B's 0.44), not past it", () => {
    const h = sectionCast(sec, [0, 0.43, 0.2], [0, 0, -1], 1, [0, 0, 1])!;
    close(h.point, [0, 0.43, 0.0165]);
    expect(h.part).toBe(-1);
    expect(sectionCast(sec, [0, 0.443, 0.2], [0, 0, -1], 1, [0, 0, 1])).toBeNull(); // above the lower lip: one side only
  });
  it("⭐⭐ the top's cast lands on the filled top at the lip — not on C's top 27 mm below (the tilt at the lip, Q3)", () => {
    const h = sectionCast(sec, [0, 1, 0], [0, -1, 0], 2, [0, 0, 1])!;
    expect(h.point[1]).toBeCloseTo(0.44, 9);
    expect(h.part).toBe(-1);
    // the parts only: C's top
    expect(sectionCast(sec, [0, 1, 0], [0, -1, 0], 2, [0, 0, 1], false)!.point[1]).toBeCloseTo(0.413, 9);
  });
  it("⭐ the support of the front / top corner is the fill's corner at the lip (the front's run reaches it)", () => {
    const s = sectionSupport(sec, [0, 1, 1], [0, 0, 1])!;
    close(s, [0, 0.44, 0.0165]);
  });
  it("⭐⭐ a SLOT with a back wall (a recess, not a void): filled only when narrower than the piece (Q1c)", () => {
    const L = box([-0.3, 0, -0.0165], [-0.025, 0.4, 0.0165]);
    const R = box([0.025, 0, -0.0165], [0.3, 0.4, 0.0165]);
    const W = box([-0.3, 0, -0.05], [0.3, 0.4, -0.0165]); // the back wall
    const narrowFits = buildSection([L, R, W], planeThrough([0, 0, 0], [1, 0, 0]), 0.06); // the piece 60 mm: the 50 mm slot is bridged
    expect(sectionCast(narrowFits, [0, 0.2, 0.2], [0, 0, -1], 1, [0, 0, 1])!.point[2]).toBeCloseTo(0.0165, 9);
    const wideFits = buildSection([L, R, W], planeThrough([0, 0, 0], [1, 0, 0]), 0.04); // the piece 40 mm: it fits — the slot's floor
    expect(sectionCast(wideFits, [0, 0.2, 0.2], [0, 0, -1], 1, [0, 0, 1])!.point[2]).toBeCloseTo(-0.0165, 9);
  });
});

describe("⭐ §30 R7's width — a face's narrowest width", () => {
  it("⭐ a 60 × 40 mm rectangle: 40 mm, whatever its turn in its plane", () => {
    const rect = (a: number): Vec3[][] => {
      const c = Math.cos(a);
      const s = Math.sin(a);
      const pts: Vec3[] = [[-0.03, 0, -0.02], [0.03, 0, -0.02], [0.03, 0, 0.02], [-0.03, 0, 0.02]].map(([x, , z]) => [x! * c - z! * s, 0, x! * s + z! * c]);
      return pts.map((p, i) => [p, pts[(i + 1) % 4]!]);
    };
    expect(faceWidth([0, 1, 0], rect(0))).toBeCloseTo(0.04, 9);
    expect(faceWidth([0, 1, 0], rect(0.7))).toBeCloseTo(0.04, 9);
  });
});

describe("⭐⭐⭐ §30 G (F2) — both lines through the gizmo: a line's travel moved ACROSS onto a point keeps its way along the line", () => {
  it("⭐⭐ on a front wall (normal +z), the red's plane (its normal the face's right, +x) moved through a point: the place takes the point's x only — its height and depth kept (⛔ projected onto the shell along the normal: the height taken too — the window's shift applied twice)", () => {
    const facets = [{ n: [0, 0, 1] as Vec3, poly: [[-1, -1, 0.1], [1, -1, 0.1], [1, 1, 0.1], [-1, 1, 0.1]] as Vec3[], cap: false }];
    const tr = travelAt(facets, [0.1, 0.2, 0.1], 0);
    const moved = travelAcross(facets, tr, [0.3, 0.5, -0.2], "y");
    close(moved.p, [0.3, 0.2, 0.1]);
    const red = moved.planes.find((pl) => Math.abs(pl.n[0]) > 0.99)!;
    expect(red.n[0] * 0.3 - red.d).toBeCloseTo(0, 12); // the moved plane holds the point
    // the other plane (the green's, horizontal) untouched
    const green = moved.planes.find((pl) => Math.abs(pl.n[1]) > 0.99)!;
    expect(Math.abs(green.d)).toBeCloseTo(0.2, 12);
  });
});
