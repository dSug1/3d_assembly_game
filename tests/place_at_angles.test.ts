/**
 * ⭐⭐⭐ THE PIECE'S PLACE FOR THE ORBIT'S ANGLES, AROUND THE GIZMO AT THOSE ANGLES (2026-11-05, branch `1.0.100-`; the owner on the phone: *"when I move
 * with a mix of dx and dy the gizmo goes to the black face then jumps back and forth before continuing its travel"*).
 * Probed (`orbit_probe.mjs`, `DIAG=1`, seed 7): on each frame with a pointer move the piece met a part and slid down its ring (v 0.6865 → 0.6808); on the
 * next frame the way back to the height kept lifted it straight back (0.6865) — the gizmo, read from the angles, down and up every two frames. ⭐ The
 * flaw: since Step 4c-bis the gizmo is a FUNCTION of the angles, but every angle the solver tried was placed round the gizmo of the FRAME's angles — the
 * last frame's result. After a slide the gizmo was re-read lower, the way back tried round it — a place lower than the real one, free — and taken.
 * Fixed at the one point every caller shares (`placeOffset` → `placeAtAngles`): an angle's place is a function of the angle alone.
 * The toy: the ring of radius 1 about the vertical (`piece_orbit_solver.test.ts`'s), a ball of a piece, a BOX's edge ahead (an overhang's front edge —
 * a box's edge, not a ball: on a ball's round side the way back is refused either way), the gizmo rising 3 × as fast as the ring's height.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Vec3 } from "../src/core/vec";
import { placeAtAngles } from "../src/input/orbit_shell";
import { orbitFrame, type OrbitQ, type SolverEnv } from "../src/input/piece_orbit_solver";

const R = 0.1;
const LO: Vec3 = [-0.5, 0.1, 0.8];
const HI: Vec3 = [0.0, 0.5, 1.2];
const OPT = { gapM: 0.001, maxQueries: 400 };
const RELOCATE = { stepM: 0.01, maxM: 0.4 };
const V0 = 0.04;
const K = 3;
const gizmoAt = (q: OrbitQ): Vec3 => [0, K * (q.v - V0), 0];
const dirAt = (q: OrbitQ): Vec3 => [Math.cos(q.yaw), q.v, Math.sin(q.yaw)];
const foot = (g: Vec3): Vec3 => g;

function env(anchor: (q: OrbitQ) => Vec3): SolverEnv {
  const closest = (a: Vec3): Vec3 => [0, 1, 2].map((i) => Math.min(HI[i]!, Math.max(LO[i]!, a[i]!))) as unknown as Vec3;
  return {
    anchor,
    gap(at) {
      const a = anchor(at);
      const c = closest(a);
      return Math.max(0, Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]) - R);
    },
    normal(at) {
      const a = anchor(at);
      const c = closest(a);
      const d = Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]);
      return d > 1e-12 ? [(a[0] - c[0]) / d, (a[1] - c[1]) / d, (a[2] - c[2]) / d] : null;
    },
  };
}

/**
 * The wiring's loop (`green_box_wiring.ts`): a yaw step on every other frame (the browser's pointer cadence), the env built each frame; `frameGizmo`:
 * every angle placed round the gizmo of the FRAME's angles (⛔ the flaw), else round its own (`placeAtAngles`). The heights the piece took.
 */
function run(frameGizmo: boolean): number[] {
  let at: OrbitQ = { yaw: 1.35, v: V0, zoom: 1 };
  let orbit = at;
  let userV: number | null = null;
  let prevRaw: { yaw: number; v: number } | null = null;
  const vs: number[] = [];
  for (let f = 0; f < 240; f++) {
    if (f % 2 === 0) orbit = { ...orbit, yaw: orbit.yaw + 0.004 };
    const g0 = gizmoAt(at);
    const anchor = (q: OrbitQ): Vec3 => placeAtAngles(q, frameGizmo ? () => g0 : gizmoAt, dirAt, foot, 1);
    const fr = orbitFrame({ q: at, target: orbit, userV, prevRaw }, env(anchor), OPT, RELOCATE);
    orbit = fr.target;
    prevRaw = { yaw: orbit.yaw, v: orbit.v };
    at = fr.q;
    userV = fr.userV;
    vs.push(at.v);
  }
  return vs;
}

/** How many times the height turns back (a rise after a fall, a fall after a rise — each over 1e-6). */
function reversals(vs: readonly number[]): number {
  let n = 0;
  let last = 0;
  for (let i = 1; i < vs.length; i++) {
    const d = vs[i]! - vs[i - 1]!;
    if (Math.abs(d) < 1e-6) continue;
    if (last !== 0 && Math.sign(d) !== last) n++;
    last = Math.sign(d);
  }
  return n;
}

describe("⭐⭐⭐ the piece's place for the orbit's angles — round the gizmo AT those angles (the back-and-forth on the phone, 2026-11-05)", () => {
  it("⭐⭐⭐ a dx along an overhang's edge, a pointer move every other frame: the piece slides under it and never turns back — ⛔ round the frame's gizmo, down and up again and again", () => {
    const own = run(false);
    expect(Math.min(...own)).toBeLessThan(V0 - 0.005); // it met the edge and slid down
    expect(reversals(own)).toBe(0); // ✅
    expect(reversals(run(true))).toBeGreaterThan(10); // ⛔ the flaw, reproduced: 40 turns back
  });
  it("⭐⭐ `placeAtAngles`: the foot of the gizmo at the angles, along their direction at the distance", () => {
    const p = placeAtAngles({ yaw: 0, v: 0.2, zoom: 1 }, (q) => [0, q.v, 0], (q) => [Math.cos(q.yaw), 0, Math.sin(q.yaw)], (g, u) => [g[0] + u[0] * 0.1, g[1], g[2]], 2);
    expect(p).toEqual([2.1, 0.2, 0]);
  });
  it("⭐ wired: `placeOffset` — every caller's place (the solver's queries, the camera, the slide) — reads the gizmo at its own angles", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("const p = placeAtAngles({ yaw, v }, (q) => gizmoAtAngles(st, q.yaw, q.v), (q) => dirAt(st, q.yaw, q.v), (g, u) => footOf(st, g, u, d), d);");
    expect(a).toContain("if (yaw === q0.yaw && v === q0.v && st.asmG !== null) return st.asmG;"); // the frame's own angles: the frame's gizmo exactly
    expect(a).not.toContain("const g = footOf(st, gizmoFor(st), u, d);"); // ⛔ the frame's gizmo for every angle
  });
});
