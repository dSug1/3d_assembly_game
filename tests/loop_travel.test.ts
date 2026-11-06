/**
 * ⭐⭐⭐ THE TRAVEL ON THE LOOPS (2026-11-06, the rebuild — `TILTED_ORBIT_REBUILD_SCOPE.md` §22.2, T1 – T5): `src/input/loop_travel.ts`. The place moves
 * along the plane cut of G1 that runs along the face's right (dx) or up (dy); each face crossed in its share of the turn (a box: a quarter turn of finger
 * per face, whatever its size); one crossing event; a cap's only way out its entry wall. RED against `8dfa635` (the module absent: the place a function
 * of the orbit's angles, the frame turned at a crossing).
 */
import { describe, expect, it } from "vitest";
import { capAxis, travelAt, travelLoops, travelStep, type Travel, type TravelFacet, type TravelOpts } from "../src/input/loop_travel";
import { loopLength } from "../src/input/plane_cut";
import type { Vec3 } from "../src/core/vec";

/** a box's six facets (half sizes `h`, centre `c`) as G1 */
function box(h: Vec3, c: Vec3 = [0, 0, 0]): TravelFacet[] {
  const f: TravelFacet[] = [];
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
      f.push({ n: n as unknown as Vec3, poly, cap: a === 1 });
    }
  return f;
}
const O: TravelOpts = { degPerMm: 5, edgeM: 0.01, edgeRad: (10 * Math.PI) / 180 };
/** `Scene_1`-like: 50 × 48 × 3.3 cm */
const PAINT = box([0.25, 0.24, 0.0165], [0, 0.24, -0.0335]);
const front = (fs: TravelFacet[]) => fs.findIndex((f) => f.n[2] < -0.9);
const at = (fs: TravelFacet[], p: Vec3): Travel => travelAt(fs, p, front(fs));
const run = (fs: TravelFacet[], tr: Travel, comp: "x" | "y", mm: number, step = 0.5) => {
  let t = tr;
  const held: string[] = [];
  for (let m = 0; m < Math.abs(mm) - 1e-9; m += step) {
    const r = travelStep(fs, t, comp, Math.sign(mm) * step, O);
    if (r.held) held.push(r.held);
    t = r.travel;
  }
  return { t, held };
};
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe("⭐⭐⭐ the travel on the loops (§22.2)", () => {
  it("⭐⭐⭐ T2 — dx round the walls: on the level loop (the height kept), a quarter turn of finger per face whatever its width, back to the start after a full turn; never held", () => {
    const t0 = at(PAINT, [0.05, 0.3, -0.05]);
    const quarter = 90 / O.degPerMm; // 18 mm
    const r = run(PAINT, t0, "x", 4 * quarter);
    expect(r.held).toEqual([]);
    expect(dist(r.t.p, t0.p)).toBeLessThan(1e-6);
    let t = t0;
    let worst = 0;
    for (let k = 0; k < 4 * quarter / 0.5; k++) {
      t = travelStep(PAINT, t, "x", 0.5, O).travel;
      worst = Math.max(worst, Math.abs(t.p[1] - 0.3));
    }
    expect(worst).toBeLessThan(1e-9);
    // the slim side (3.3 cm) and the wide front (50 cm) each a quarter turn: from the front's right edge, one quarter crosses the whole side
    const edge = at(PAINT, [0.25 - 1e-7, 0.3, -0.05]);
    const side = run(PAINT, edge, "x", quarter);
    expect(side.t.p[2]).toBeGreaterThan(-0.0175 - 1e-3); // at the side's far end (the back's edge)
  });

  it("⭐⭐⭐ dy up the front onto the top: the entry wall and the up carried over its edge (+z) — the place across the top with the red loop's x kept (⭐ the hold is the VIEW's now: `view_reach.test.ts`)", () => {
    const up = run(PAINT, at(PAINT, [0.05, 0.4, -0.05]), "y", 25);
    expect(PAINT[up.t.facet]!.cap).toBe(true);
    expect(up.t.p[1]).toBeCloseTo(0.48, 9);
    expect(up.t.entry).toEqual([0, 0, -1]);
    expect(up.t.axis![2]).toBeCloseTo(1, 9);
    expect(up.t.p[0]).toBeCloseTo(0.05, 9);
    const back = run(PAINT, up.t, "y", -25);
    expect(PAINT[back.t.facet]!.n[2]).toBeCloseTo(-1, 9);
  });


  it("⭐⭐ the slow stretch at an edge: a 1 mm finger step moves the place less near the edge than in the face's middle; a step never jumps (continuous through the corners)", () => {
    const t0 = at(PAINT, [0, 0.3, -0.05]);
    const mid = dist(travelStep(PAINT, t0, "x", 1, O).travel.p, t0.p);
    const nearEdge = at(PAINT, [0.245, 0.3, -0.05]);
    const ed = dist(travelStep(PAINT, nearEdge, "x", 1, O).travel.p, nearEdge.p);
    expect(ed).toBeLessThan(mid);
    let t = t0;
    let worst = 0;
    for (let k = 0; k < 4 * 18 * 4; k++) {
      const n = travelStep(PAINT, t, "x", 0.25, O).travel;
      worst = Math.max(worst, dist(n.p, t.p));
      t = n;
    }
    expect(worst).toBeLessThan(0.0125 + 1e-6); // the front's middle: 0.48 m over 70° at 1.25°: ~8.6 mm
  });

  it("⭐ the loops through the place: the green level, the red vertical through it; each closed (the box's girth)", () => {
    const t0 = at(PAINT, [0.05, 0.3, -0.05]);
    const { green, red } = travelLoops(PAINT, t0);
    expect(loopLength(green!)).toBeCloseTo(2 * (0.5 + 0.033), 6);
    expect(loopLength(red!)).toBeCloseTo(2 * (0.48 + 0.033), 6);
    for (const q of green!.pts) expect(q[1]).toBeCloseTo(0.3, 9);
    for (const q of red!.pts) expect(q[0]).toBeCloseTo(0.05, 9);
    expect(capAxis([0, 1, 0], [0, 0, -1])).toEqual([expect.closeTo(0, 12), expect.closeTo(0, 12), expect.closeTo(1, 12)]);
  });
});
