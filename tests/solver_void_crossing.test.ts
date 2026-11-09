// ⭐⭐⭐ (2026-11-09, POLAR_ORBIT_CLEANUP.md §6 (b)) A NARROW VOID IS TWO JUMPS. RED against `05117a6`: R4 crossed a ring jump only onto an admissible
// landing; where the landing was refused (the gizmo at a groove's real depth, D3 — the piece in the groove's lips) the stride CONVERGED onto the jump,
// 24 queries a frame, `deferred` for ever: the walks' blocked stalls under the cube's bottom groove (x 104 – 117), the piece still in free air (16.8 mm of gap).
import { describe, expect, it } from "vitest";
import { solveOrbitStep, voidCrossing, type OrbitQ, type SolverEnv } from "../src/input/piece_orbit_solver";

const opt = { gapM: 0.001, maxQueries: 24 };
const at = (yaw: number, v = 0.5): OrbitQ => ({ yaw, v, zoom: 1 });
/** a ring along x whose anchor LIFTS by 44 mm over yaw [1, 1 + w) (a groove's real depth), in a part there; free elsewhere (16.8 mm), or a wall from `wallFrom` */
function env(w: number, wallFrom = Infinity): SolverEnv {
  const inVoid = (q: OrbitQ) => q.yaw >= 1 && q.yaw < 1 + w;
  return {
    anchor: (q) => [q.yaw, q.v + (inVoid(q) ? 0.044 : 0), 0],
    gap: (q) => (inVoid(q) || q.yaw >= wallFrom ? 0 : 0.0168),
    normal: () => null,
  };
}

describe("⭐⭐⭐ (2026-11-09, §6 (b)) a narrow void the piece cannot enter is crossed whole; a wall is BLOCKED, never deferred", () => {
  it("⭐⭐⭐ an 8 mm void across the step: crossed in one solve (RED: converged onto yaw 1, deferred)", () => {
    const r = solveOrbitStep(at(0.99), [0.05, 0], env(0.008), opt);
    expect(r.q.yaw).toBeCloseTo(1.04, 9);
    expect(r.deferred).toBe(false);
    expect(r.blocked).toBe(false);
  });

  it("⭐⭐ a void whose far side is a part too: BLOCKED before the jump (RED: deferred, converging)", () => {
    const r = solveOrbitStep(at(0.99), [0.05, 0], env(0.008, 1), opt);
    expect(r.q.yaw).toBeLessThan(1);
    expect(r.blocked).toBe(true);
    expect(r.deferred).toBe(false);
  });

  it("⭐⭐ a void WIDER than the clearance's straight move (40 mm against 14 mm): a wall, BLOCKED (RED: deferred)", () => {
    const r = solveOrbitStep(at(0.99), [0.08, 0], env(0.04), opt);
    expect(r.q.yaw).toBeLessThan(1);
    expect(r.blocked).toBe(true);
    expect(r.deferred).toBe(false);
  });

  it("⭐ `voidCrossing`: the share past the jump back when the straight move fits; none on a ring with no way back, or beyond the move's bound", () => {
    const e = env(0.008);
    const q = at(0.9995);
    const tb = voidCrossing(e, q, [0.05, 0], 0.01, 0.0142);
    expect(tb).not.toBeNull();
    expect(0.9995 + 0.05 * tb!).toBeCloseTo(1.008, 6);
    expect(voidCrossing(env(10), q, [0.05, 0], 0.01, 0.0142)).toBeNull();
    expect(voidCrossing(e, q, [0.05, 0], 0.01, 0.005)).toBeNull();
  });
});
