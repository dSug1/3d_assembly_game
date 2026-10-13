/**
 * ⭐⭐⭐ prototype — THE ORBITED PIECE'S SOLVER (`COLLISION.md` §12, 2026-10-13: the rebuild after the audit). A toy ring — a circle of radius 1
 * about the vertical, its height `v` — and a ball of a piece among ball obstacles: every number below can be checked by hand.
 */
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import {
  followPath,
  followSpring,
  nearestFree,
  pieceRespawnArmed,
  projectExact,
  solveOrbitStep,
  stuckProbe,
  turnSweepFree,
  type OrbitQ,
  type SolverEnv,
} from "../src/input/piece_orbit_solver";

const PIECE_R = 0.1;
const GAP = 0.001;
const OPT = { gapM: GAP, maxQueries: 400 };
const anchor = (q: OrbitQ): Vec3 => [Math.cos(q.yaw), q.v, Math.sin(q.yaw)];
const q = (yaw: number, v = 0): OrbitQ => ({ yaw, v, zoom: 1 });

function env(balls: { c: Vec3; r: number }[], anchorOf: (q: OrbitQ) => Vec3 = anchor): SolverEnv & { calls: number } {
  const e = {
    calls: 0,
    anchor: anchorOf,
    gap(at: OrbitQ) {
      e.calls++;
      const a = anchorOf(at);
      let g = 10;
      for (const b of balls) g = Math.min(g, Math.hypot(a[0] - b.c[0], a[1] - b.c[1], a[2] - b.c[2]) - b.r - PIECE_R);
      return Math.max(0, g);
    },
    normal(at: OrbitQ): Vec3 | null {
      const a = anchorOf(at);
      let best: { d: number; n: Vec3 } | null = null;
      for (const b of balls) {
        const v: Vec3 = [a[0] - b.c[0], a[1] - b.c[1], a[2] - b.c[2]];
        const d = Math.hypot(v[0], v[1], v[2]);
        if (best === null || d - b.r < best.d) best = { d: d - b.r, n: [v[0] / d, v[1] / d, v[2] / d] };
      }
      return best?.n ?? null;
    },
  };
  return e;
}

// ⭐ a ball on the ring at yaw 90°, the ring's height 0: head-on for a yaw step from 0
const AHEAD = { c: [0, 0, 1] as Vec3, r: 0.1 };
const headOnStopYaw = Math.PI / 2 - 2 * Math.asin((2 * PIECE_R + GAP) / 2); // the chord between the centres is 0.201

describe("⭐⭐⭐ §12 — the orbited piece's solver", () => {
  it("⭐⭐ (audit 1) a head-on push RESTS at the gap kept — never touching, never inside", () => {
    const e = env([AHEAD]);
    const r = solveOrbitStep(q(0), [Math.PI / 2, 0], e, OPT);
    expect(r.blocked).toBe(true);
    const g = e.gap(r.q);
    expect(g).toBeGreaterThanOrEqual(GAP / 2);
    expect(g).toBeLessThan(GAP + 0.0005);
    expect(r.q.yaw).toBeCloseTo(headOnStopYaw, 3);
  });

  it("⭐⭐⭐ (audit 3) REVERSIBLE: from the rest of a head-on push, the step back is taken WHOLE", () => {
    const e = env([AHEAD]);
    const at = solveOrbitStep(q(0), [Math.PI / 2, 0], e, OPT).q;
    const back = solveOrbitStep(at, [-0.3, 0], e, OPT);
    expect(back.blocked).toBe(false);
    expect(back.touched).toBe(false);
    expect(back.q.yaw).toBeCloseTo(at.yaw - 0.3, 12);
  });

  it("⭐⭐ (audit 2) admissibility reads the POSE alone: the same place reached two ways answers the same step the same way", () => {
    const e = env([AHEAD]);
    const a = solveOrbitStep(q(0), [Math.PI / 2, 0], e, OPT).q; // pushed head-on
    const b = solveOrbitStep(q(a.yaw - 0.2), [0.2, 0], e, OPT).q; // arrived exactly there, no push
    for (const s of [[-0.05, 0], [0.05, 0], [0, 0.05], [0, -0.05]] as const) {
      expect(solveOrbitStep(a, s, e, OPT).q.yaw).toBeCloseTo(solveOrbitStep(b, s, e, OPT).q.yaw, 4);
    }
  });

  it("⭐⭐ (audit 4) every point of the path is ON the ring and admissible — the eye never sees a pose the rule refused", () => {
    const e = env([AHEAD, { c: [0.6, 0.15, 0.85], r: 0.05 }]);
    const r = solveOrbitStep(q(0), [Math.PI / 2, 0.02], e, OPT);
    expect(r.path.length).toBeGreaterThan(1);
    for (const p of r.path) expect(e.gap(p)).toBeGreaterThanOrEqual(GAP / 2);
  });

  it("⭐⭐⭐ (audit 5) the step is checked along the ARC, not its chord — a half turn whose chord misses the ball stops at it", () => {
    // ⛔ the chord from yaw 0 to 180° passes through the ring's centre, 1 m from the ball: a chord check lets it through
    const e = env([AHEAD]);
    const r = solveOrbitStep(q(0), [Math.PI, 0], e, OPT);
    expect(r.blocked).toBe(true);
    expect(r.q.yaw).toBeCloseTo(headOnStopYaw, 3);
  });

  it("⭐⭐ an OBLIQUE push SLIDES: the ball below the ring — the yaw goes on, the piece rides up over it", () => {
    const e = env([{ c: [0, -0.15, 1], r: 0.1 }]);
    const r = solveOrbitStep(q(0), [Math.PI, 0], e, OPT);
    expect(r.touched).toBe(true);
    expect(r.q.yaw).toBeGreaterThan(Math.PI / 2); // past the ball
    for (const p of r.path) expect(e.gap(p)).toBeGreaterThanOrEqual(GAP / 2);
  });

  it("⭐⭐⭐ the slide is EXACT at a crease — the least change, whatever the order the contacts were met (⛔ the sequential projection was not)", () => {
    const J: [Vec3, Vec3] = [[1, 0, 0], [0, 1, 0]];
    const n1: Vec3 = [1, 0, 0];
    const n2: Vec3 = [Math.SQRT1_2, Math.SQRT1_2, 0];
    for (const ns of [[n1, n2], [n2, n1]]) {
      const s = projectExact([-1, -3], J, ns);
      expect(s[0]).toBeCloseTo(1, 12);
      expect(s[1]).toBeCloseTo(-1, 12);
    }
    // a corner both ways: nothing left
    expect(projectExact([-1, 0], J, [n1, [0, 1, 0]])).toEqual([0, 0]);
    // nothing into a contact: the step whole
    expect(projectExact([0.5, 0.2], J, [n1])).toEqual([0.5, 0.2]);
  });

  it("⭐⭐ (audit 6) STUCK is the solver's answer — a pocket: stuck; one side opened: not", () => {
    const pocket = (open: boolean) => {
      const a = anchor(q(0));
      const d = PIECE_R + 0.05 + GAP; // each ball at the gap kept
      const balls = [
        { c: [a[0], a[1], a[2] + d] as Vec3, r: 0.05 }, // yaw +
        { c: [a[0], a[1] + d, a[2]] as Vec3, r: 0.05 }, // v +
        { c: [a[0], a[1] - d, a[2]] as Vec3, r: 0.05 }, // v −
      ];
      if (!open) balls.push({ c: [a[0], a[1], a[2] - d], r: 0.05 }); // yaw −
      return env(balls, (x) => anchor({ ...x, v: x.v - 0.5 }));
    };
    expect(stuckProbe(q(0, 0.5), pocket(false), OPT, 0.003)).toBe(true);
    expect(stuckProbe(q(0, 0.5), pocket(true), OPT, 0.003)).toBe(false);
  });

  it("⭐⭐ the respawn is armed only when the position AND every turn are blocked (⛔ it read one flag twice)", () => {
    expect(pieceRespawnArmed(true, true)).toBe(true);
    expect(pieceRespawnArmed(true, false)).toBe(false);
    expect(pieceRespawnArmed(false, true)).toBe(false);
  });

  it("⭐⭐ (audit 7) the WORK CAP: cut short, the solve says so and stops where it got — continued, it lands where the whole solve does", () => {
    const e = env([{ c: [0, -0.15, 1], r: 0.1 }]);
    const whole = solveOrbitStep(q(0), [Math.PI, 0], e, OPT);
    const capped = solveOrbitStep(q(0), [Math.PI, 0], e, { gapM: GAP, maxQueries: 6 });
    expect(capped.deferred).toBe(true);
    expect(capped.queries).toBeLessThanOrEqual(8);
    expect(capped.q.yaw).toBeLessThan(whole.q.yaw);
    // the caller keeps the PROJECTED rest (what pushed in discarded, as the whole solve does), frame after frame
    let r = capped;
    for (let i = 0; i < 100 && r.deferred; i++) r = solveOrbitStep(r.q, r.rest, e, { gapM: GAP, maxQueries: 6 });
    expect(r.deferred).toBe(false);
    expect(r.q.yaw).toBeCloseTo(whole.q.yaw, 2);
    expect(r.q.v).toBeCloseTo(whole.q.v, 2);
  });

  it("⭐ started INSIDE the margin (the ring moved under it): a step that opens the gap is taken, one that closes it is not", () => {
    const e = env([{ c: [1, 0, 0.2], r: 0.1 }]); // the piece at yaw 0 overlaps it
    expect(e.gap(q(0))).toBe(0);
    const away = solveOrbitStep(q(0), [-0.3, 0], e, OPT);
    expect(away.q.yaw).toBeCloseTo(-0.3, 12);
    expect(solveOrbitStep(q(0), [0.3, 0], e, OPT).q.yaw).toBe(0);
  });

  it("⭐⭐ the ring's NEAREST FREE place: a piece the ring moved into a part goes to the closest place with the gap kept", () => {
    const e = env([{ c: [1, 0, 0.05], r: 0.1 }]);
    const to = nearestFree(q(0), e, GAP, 0.01, 0.5)!;
    expect(to).not.toBeNull();
    expect(e.gap(to)).toBeGreaterThanOrEqual(GAP);
    expect(Math.hypot(...(anchor(to).map((x, i) => x - anchor(q(0))[i]!) as [number, number, number]))).toBeLessThan(0.3);
    expect(nearestFree(q(0), env([{ c: [1, 0, 0], r: 2 }]), GAP, 0.01, 0.2)).toBeNull();
  });

  it("⭐⭐ a TURN by the same rule: refused where the gap falls under half the gap kept; a turn starting inside may not go closer", () => {
    // the gap along the turn: 10 mm down to 0 at u = 0.5, back up
    const gapAt = (u: number) => Math.abs(u - 0.5) * 0.02;
    const u = turnSweepFree(gapAt, Math.PI / 2, 0.2, GAP)!;
    expect(u).not.toBeNull();
    expect(gapAt(u)).toBeLessThan(GAP / 2);
    expect(u).toBeLessThan(0.5);
    expect(turnSweepFree((x) => 0.01 + x * 0.01, Math.PI / 2, 0.2, GAP)).toBeNull();
    // inside: may open, may not close
    expect(turnSweepFree((x) => 0.0001 + x * 0.001, 1, 0.2, GAP)).toBeNull();
    expect(turnSweepFree((x) => 0.0001 * (1 - x), 1, 0.2, GAP)).not.toBeNull();
  });

  it("⭐ the eye follows the PATH — round the corner the solver went, never across it — on a spring with no speed jump", () => {
    const len = (a: OrbitQ, b: OrbitQ) => Math.hypot(b.yaw - a.yaw, b.v - a.v);
    const path = [q(0, 0), q(1, 0), q(1, 1)];
    expect(followPath(path, 1.5, len).at).toEqual({ yaw: 1, v: 0.5, zoom: 1 });
    expect(followPath(path, 5, len).left).toEqual([q(1, 1)]);
    // the spring: never past the end; the rate carried across frames
    const a = followSpring(1, 0, 16, 50);
    expect(a.go).toBeGreaterThan(0);
    expect(a.go).toBeLessThan(1);
    const b = followSpring(1 - a.go + 1, a.vel, 16, 50); // more path added: the rate carries on
    expect(b.vel).toBeGreaterThan(0);
    expect(followSpring(0.001, 50, 1000, 50).go).toBeCloseTo(0.001, 12);
  });
});
