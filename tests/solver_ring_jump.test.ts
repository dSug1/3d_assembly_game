// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §5, R4) A RING DISCONTINUITY IS NOT A WALL. RED against `7d0d01d`: the conservative advancement shrank every
// stride whose arc held the anchor's jump below the clearance — the piece converged onto the jump, never crossed it, 24 queries a frame `deferred` for
// ever (the walks: the solved yaw locked at the cube's 90° seam for 350 – 2100 frames, every distance; close in, at every groove and protrusion step), and
// the frame kept the whole backlog: the orbit's target ran hundreds of degrees ahead and a dy carried with it was dead too.
import { describe, expect, it } from "vitest";
import { orbitFrame, ringJump, solveOrbitStep, type OrbitQ, type SolverEnv } from "../src/input/piece_orbit_solver";

const opt = { gapM: 0.001, maxQueries: 24 };
/** a ring along x whose anchor JUMPS by `J` at yaw = 1 (the gizmo map's seam), free everywhere (gap `g`), or a wall over `wall` */
function env(J: number, g = 0.3, wall?: (q: OrbitQ) => boolean): SolverEnv {
  return {
    anchor: (q) => [q.yaw + (q.yaw >= 1 ? J : 0), q.v, 0],
    gap: (q) => (wall?.(q) ? 0 : g),
    normal: () => null,
  };
}
const at = (yaw: number, v = 0.5): OrbitQ => ({ yaw, v, zoom: 1 });

describe("⭐⭐⭐ (2026-11-09, R4) the solver crosses a ring discontinuity when its landing is admissible", () => {
  it("⭐⭐⭐ a jump larger than the clearance's stride: crossed in one solve (RED: converged onto yaw 1, deferred, 24 queries)", () => {
    const r = solveOrbitStep(at(0.99), [0.05, 0], env(0.5), opt);
    expect(r.q.yaw).toBeCloseTo(1.04, 9);
    expect(r.deferred).toBe(false);
    expect(r.blocked).toBe(false);
    expect(r.queries).toBeLessThanOrEqual(6);
  });

  it("⭐⭐ a dy carried with the dx across the jump advances too (RED: v frozen with the yaw)", () => {
    const r = solveOrbitStep(at(0.99, 0.5), [0.05, 0.1], env(0.5), opt);
    expect(r.q.yaw).toBeCloseTo(1.04, 9);
    expect(r.q.v).toBeCloseTo(0.6, 9);
  });

  it("⭐⭐ the landing must be admissible: a part across the jump still stops the piece before it", () => {
    const r = solveOrbitStep(at(0.99), [0.05, 0], env(0.5, 0.3, (q) => q.yaw >= 1), opt);
    expect(r.q.yaw).toBeLessThan(1);
  });

  it("⭐ a smooth ring is untouched: no jump found where the anchor is continuous (`ringJump` null), the step as before", () => {
    const e = env(0);
    expect(ringJump(e, at(0.99), [0.05, 0], 0.2, 0.27)).toBeNull();
    expect(solveOrbitStep(at(0.99), [0.05, 0], e, opt).q.yaw).toBeCloseTo(1.04, 12);
  });

  it("⭐⭐ the frame: a deferred solve that made NO progress keeps no backlog beyond this frame's input (RED: the target ran away with the whole rest)", () => {
    // a ring the solver cannot cross at all (the landing in a part): 10 frames of +0.05 each
    const e = env(0.5, 0.3, (q) => q.yaw >= 1 && q.yaw < 1.6);
    let q = at(0.99);
    let target = at(0.99);
    let prev: { yaw: number; v: number } | null = null;
    for (let k = 0; k < 10; k++) {
      target = { ...target, yaw: target.yaw + 0.05 };
      const fr = orbitFrame({ q, target, userV: null, prevRaw: prev }, e, opt, { stepM: 0.004, maxM: 0.05, from: -1 });
      q = fr.q;
      target = fr.target;
      prev = { yaw: target.yaw, v: target.v };
    }
    expect(target.yaw - q.yaw).toBeLessThanOrEqual(0.05 + 1e-9);
  });
});
