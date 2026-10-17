/**
 * ⭐⭐⭐ (2026-10-17, the owner: *"if I position the gizmo on top face of piece 25 and slide the green piece on top face of piece 3, after the sliding is
 * toggled off, the orbit is blocked and I need to go a lot of back and forth to unlock the green piece. Why is that ?"* → *"build the fix"*) — the
 * contact slide's SECOND-PART clamp binds only a step that CLOSES on a part. Reproduced in the real app: the slide left the piece at the kept gap over two
 * FLUSH tops (Piece3 0.499 m, Piece30 0.498 m — both 1.08 mm off), and the clamp `(secondGap − gap) × 0.9` allowed 0.07 mm a step: the way back covered
 * 0.7 % of its 24 mm, the orbit froze through 60 mm of finger — while every step it refused stayed 1.08 mm clear of both.
 */
import { describe, expect, it } from "vitest";
import { projectExact, solveOrbitStep, type OrbitQ, type SolverEnv } from "../src/input/piece_orbit_solver";
import type { Vec3 } from "../src/core/vec";

const KEPT = 0.001;
// the piece's anchor: yaw → x (0.1 m a radian), v → y
const anchor = (q: OrbitQ): Vec3 => [q.yaw * 0.1, (q.v - 0.5) * 0.1, 0];

/** two flush tops under the piece, both at the slide's resting gap — and, optionally, a wall ahead at `wallX` */
function flushEnv(wallX: number | null): SolverEnv {
  const parts = (q: OrbitQ): { g: number; n: Vec3 }[] => {
    const a = anchor(q);
    const lift = 0.00108 + a[1];
    const out = [{ g: lift, n: [0, 1, 0] as Vec3 }, { g: lift, n: [0, 1, 0] as Vec3 }];
    if (wallX !== null) out.push({ g: Math.max(0, wallX - a[0]), n: [-1, 0, 0] });
    return out.sort((x, y) => x.g - y.g);
  };
  return {
    anchor,
    gap: (q) => parts(q)[0]!.g,
    secondGap: (q) => parts(q)[1]!.g,
    normal: (q) => parts(q)[0]!.n,
  };
}

describe("⭐⭐⭐ the contact slide over FLUSH tops (2026-10-17)", () => {
  it("⭐⭐⭐ a slide ALONG two flush tops at the kept gap makes its whole step inside the frame's 24 queries (⛔ 0.07 mm a sub-step: the orbit froze)", () => {
    const r = solveOrbitStep({ yaw: 0, v: 0.5, zoom: 1 }, [0.2, 0], flushEnv(null), { gapM: KEPT, maxQueries: 24 });
    expect(r.q.yaw).toBeCloseTo(0.2, 6); // 2 cm across the tops
    expect(r.deferred).toBe(false);
  });
  it("⭐⭐ the way back RISING off them: the whole step too", () => {
    const r = solveOrbitStep({ yaw: 0, v: 0.5, zoom: 1 }, [0.2, 0.04], flushEnv(null), { gapM: KEPT, maxQueries: 24 });
    expect(r.q.yaw).toBeCloseTo(0.2, 6);
    expect(r.q.v).toBeCloseTo(0.54, 6);
  });
  it("⭐⭐ the clamp's own job kept: a WALL ahead (a part the step closes on) still stops the slide, never sunk into", () => {
    const env = flushEnv(0.02);
    let q: OrbitQ = { yaw: 0, v: 0.5, zoom: 1 };
    for (let f = 0; f < 20; f++) q = solveOrbitStep(q, [0.4 - q.yaw, 0], env, { gapM: KEPT, maxQueries: 24 }).q;
    const wallGap = 0.02 - anchor(q)[0];
    expect(wallGap).toBeGreaterThanOrEqual(KEPT / 2 - 1e-9); // admissible (half the kept gap)
    expect(anchor(q)[0]).toBeGreaterThan(0.015); // and it got there (slid up to the wall)
  });
  it("⭐⭐⭐ THE WAY BACK AFTER A SLIDE (one coordinate — its share): starting in contact, a step LEAVING the surface goes through (⛔ the singular metric was refused before asking whether the step pushed in — blocked in 2 queries, the gap only growing)", () => {
    // the way back's line: share 1 → 0 carries the anchor from the slid place up and away (the real one: 12.2, −3.9, 20.4 mm)
    const off: Vec3 = [0.0122, -0.0039, 0.0204];
    const env: SolverEnv = {
      anchor: (q) => [off[0] * q.yaw, off[1] * q.yaw, off[2] * q.yaw],
      gap: (q) => 0.00108 + (1 - q.yaw) * 0.0039,
      secondGap: (q) => 0.00108 + (1 - q.yaw) * 0.0039,
      normal: () => [0, 1, 0],
    };
    const r = solveOrbitStep({ yaw: 1, v: 0.5, zoom: 1 }, [-1, 0], env, { gapM: KEPT, maxQueries: 24 });
    expect(r.blocked).toBe(false);
    expect(r.q.yaw).toBeLessThan(0.5); // most of the way in one frame (⛔ none: share 1, blocked)
    let q = r.q;
    for (let f = 0; f < 5 && q.yaw > 1e-6; f++) q = solveOrbitStep(q, [-q.yaw, 0], env, { gapM: KEPT, maxQueries: 24 }).q;
    expect(q.yaw).toBeLessThan(1e-6); // and all of it within a few frames
    // and the projection itself: a feasible step with a SINGULAR metric is the step
    expect(projectExact([-1, 0], [[0.0122, -0.0039, 0.0204], [0, 0, 0]], [[0, 1, 0]])).toEqual([-1, 0]);
  });
});
