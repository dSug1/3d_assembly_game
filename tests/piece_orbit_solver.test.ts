/**
 * ⭐⭐⭐ prototype — THE ORBITED PIECE'S SOLVER (`COLLISION.md` §12, 2026-10-13: the rebuild after the audit). A toy ring — a circle of radius 1
 * about the vertical, its height `v` — and a ball of a piece among ball obstacles: every number below can be checked by hand.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { springOrbit } from "../src/input/follow_camera";
import type { Vec3 } from "../src/core/vec";
import {
  nearestFree,
  pieceRespawnArmed,
  keepSense,
  orbitFrame,
  STUCK_FRESH,
  stuckNext,
  stuckRecord,
  turnStepHeld,
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

  it("⭐⭐⭐ a slide never goes AGAINST the finger (⛔ *\"at the moment the piece collides, there is a jittery shake\"*: a dy wobble pressing down on a sloped part slid the piece back along its yaw)", () => {
    const J: [Vec3, Vec3] = [[1, 0, 0], [0, 1, 0]];
    const slope: Vec3 = [0.5, Math.sqrt(3) / 2, 0]; // a surface descending toward +yaw
    const dq = [-0.1, -1] as const; // the finger: a little −yaw, a lot of −v (down onto it)
    const exact = projectExact(dq, J, [slope]);
    expect(exact[0]).toBeGreaterThan(0); // ⛔ the exact slide runs back along +yaw
    expect(keepSense(exact, dq, J, [slope])).toEqual([0, 0]); // nothing goes against the finger: it stops
    // a yaw push into the slope still rides along it (the input left v at zero)
    const ride = projectExact([-1, 0], J, [slope]);
    expect(keepSense(ride, [-1, 0], J, [slope])).toEqual(ride);
    expect(ride[1]).toBeGreaterThan(0);
    // in the solver: a wobbling finger against a ball beside the ring never moves the piece back along its yaw
    const e = env([{ c: [0, -0.12, 1], r: 0.1 }]);
    let at = solveOrbitStep(q(0), [Math.PI / 2 - 0.25, 0], e, OPT).q;
    for (let i = 0; i < 40; i++) {
      const r = solveOrbitStep(at, [0.01, i % 2 ? 0.02 : -0.02], e, OPT);
      expect(r.q.yaw).toBeGreaterThanOrEqual(at.yaw - 1e-12);
      at = r.q;
    }
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
    // ⭐⭐ (the second audit) DEEP inside — the gap 0 everywhere: refused (it passed as free: no red quad, no pop-up, no respawn)
    expect(turnSweepFree(() => 0, 1, 0.2, GAP)).not.toBeNull();
  });

  it("⭐⭐⭐ the EYE smooths the finger's own dy wobble — the orbit's spring toward the solved place (⛔ *\"when the piece orbit anywhere … the piece jitters, and so do the quads\"*: the eye that FOLLOWED the solver's path shook with every wobble)", () => {
    // a drag along yaw whose dy wobbles ±0.004 of the ring each event (a real finger), an event a frame
    let sp = { at: q(0, 0.5), velYaw: 0, velV: 0, velLnZoom: 0 };
    let lo = Infinity;
    let hi = -Infinity;
    for (let f = 0; f < 120; f++) {
      const target = { yaw: f * 0.01, v: 0.5 + (f % 2 ? 0.004 : -0.004), zoom: 1 };
      sp = springOrbit(sp, target, 16.7, 30);
      if (f > 30) {
        lo = Math.min(lo, sp.at.v);
        hi = Math.max(hi, sp.at.v);
      }
    }
    // the input swings 0.008; what the eye shows swings well under a third of it (a path follower would show all of it)
    expect(hi - lo).toBeLessThan(0.008 / 3);
  });
  it("⭐ wired: the eye's spring aims at the SOLVED place — the follower and its path are deleted", () => {
    const g = readFileSync(new URL("../src/render/green_box_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(g).toContain("st.pieceQ = fr.q; rig = { ...fr.q };");
    expect(g).toContain("st.boxSpring = st.boxSpring === null ? { at: rig, velYaw: 0, velV: 0, velLnZoom: 0 } : springOrbit(st.boxSpring, rig, dtSec * 1000, st.cfg.boxSmoothMs / 2); st.boxOrbit = st.boxSpring.at;");
    expect(g).not.toMatch(/followPath|followSpring|piecePath/);
  });

  describe("⭐⭐⭐ the second audit (2026-10-13)", () => {
    const relocate = { stepM: 0.01, maxM: 0.4 };
    const F = (qq: OrbitQ, target: OrbitQ, userV: number | null = null, prevRawV: number | null = null) => ({ q: qq, target, userV, prevRawV });

    it("⭐⭐ ONE FRAME: free — the piece goes to the target, nothing reset", () => {
      const e = env([AHEAD]);
      const r = orbitFrame(F(q(0), q(0.2)), e, OPT, relocate);
      expect(r.q.yaw).toBeCloseTo(0.2, 12);
      expect(r.target).toEqual(q(0.2));
      expect(r.blocked).toBe(false);
      expect(r.stopCoast).toBe(false);
    });
    it("⭐⭐ ONE FRAME: blocked — the target becomes the piece (what pushed in discarded); a push that moved nothing stops the coast", () => {
      const e = env([AHEAD]);
      const at = solveOrbitStep(q(0), [Math.PI / 2, 0], e, OPT).q;
      const r = orbitFrame(F(at, q(at.yaw + 0.2, at.v)), e, OPT, relocate);
      expect(r.blocked).toBe(true);
      expect(r.target).toEqual(r.q);
      expect(r.stopCoast).toBe(true);
      // no input: no verdict on the input
      expect(orbitFrame(F(at, at), e, OPT, relocate).blocked).toBeNull();
    });
    it("⭐⭐ ONE FRAME: the work cap — the target becomes the PROJECTED rest, never dropped", () => {
      const e = env([{ c: [0, -0.15, 1], r: 0.1 }]);
      const r = orbitFrame(F(q(0), q(Math.PI)), e, { gapM: GAP, maxQueries: 6 }, relocate);
      expect(r.deferred).toBe(true);
      expect(r.target.yaw).toBeGreaterThan(r.q.yaw);
    });
    it("⭐⭐⭐ ONE FRAME: the ring moved the piece INTO a part — relocated, the target moved WITH it, the height kept shifted ONCE (⛔ twice before)", () => {
      // a ball just above the piece (v 0.5 → anchor y 0.5): it relocates DOWN the ring
      const e = env([{ c: [1, 0.55, 0], r: 0.1 }]);
      const r = orbitFrame(F(q(0, 0.5), q(0, 0.5), 0.5, 0.5), e, OPT, relocate);
      expect(r.relocated).toBe(true);
      expect(e.gap(r.q)).toBeGreaterThanOrEqual(GAP);
      expect(r.q.v).toBeLessThan(0.36);
      // the target moved by exactly the relocation; the height kept moved ONCE — where the piece went (twice, it would sit ~0.15 lower)
      expect(r.target).toEqual(r.q);
      expect(r.userV).toBeCloseTo(r.q.v, 9);
    });
    it("⭐⭐ ONE FRAME: the height kept — back to it when the way is free, waiting when it is not", () => {
      const e = env([]);
      const r = orbitFrame(F(q(0, 0.5), q(0, 0.5), 0.4, 0.5), e, OPT, relocate);
      expect(r.q.v).toBeCloseTo(0.4, 12);
      expect(r.target.v).toBeCloseTo(0.4, 12);
      // a ball just below: the way down is not free — it waits
      const below = env([{ c: [1, 0.26, 0], r: 0.1 }]); // v 0.5 → anchor y 0.5, 0.24 from the ball (free); at v 0.35, 0.09 (into it)
      const w = orbitFrame(F(q(0, 0.5), q(0, 0.5), 0.35, 0.5), below, OPT, relocate);
      expect(w.q.v).toBeCloseTo(0.5, 12);
    });

    it("⭐⭐⭐ a finger's wobble on a sloped slide, DEADBANDED at the source, advances EVERY event (⛔ raw, it advanced every other one)", () => {
      // the audit's sequence: a ball ahead and below; yaw pushed, the ring height wobbling ±0.0002 a step
      const e = env([{ c: [0, -0.12, 1], r: 0.1 }]);
      // 60 small yaw events from open air, up and over the ball's slope (contact from yaw ≈ 1.465)
      const advances = (wobble: number) => {
        const out: number[] = [];
        let p = q(1.4, 0.05);
        let touched = 0;
        for (let i = 0; i < 60; i++) {
          const r = solveOrbitStep(p, [0.003, i % 2 ? wobble : -wobble], e, OPT);
          if (r.touched) touched++;
          out.push(r.q.yaw - p.yaw);
          p = r.q;
        }
        expect(touched).toBeGreaterThan(5); // the run does ride the slope
        return out;
      };
      // the raw wobble: some events advance nothing (the stutter the audit measured)
      expect(advances(0.0002).some((d) => d < 1e-6)).toBe(true);
      // what the deadband emits for a wobble inside its band: zero — every event advances
      expect(advances(0).every((d) => d > 1e-4)).toBe(true);
    });

    it("⭐⭐ the deadband is wired on the orbit drag (§1.1's per-axis step, not the raw pixels)", () => {
      const p = readFileSync(new URL("../src/render/pointer_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
      expect(p).toContain("const db = st.orbitMotion.tracker.step; st.orbit.drag(-db.dx * st.cfg.boxGainYaw * g.yaw * st.pieceYawGainDrag, (dxOnly ? 0 : db.dy) * st.cfg.boxGainPitch * g.pitch);");
    });

    it("⭐⭐⭐ THE STUCK CHECK SCHEDULED: at most one check every interval, and a verdict is FINAL for its key (⛔ every frame for ever: ~60–90 gap queries a frame at rest)", () => {
      let s = STUCK_FRESH;
      let checks = 0;
      // 120 frames (2 s) at rest, everything blocked, 7 checks to a round, one every 100 ms
      for (let f = 0; f < 120; f++) {
        const n = stuckNext(s, "k", f * 16.7, 100);
        s = n.s;
        if (n.check !== null) {
          checks++;
          s = stuckRecord(s, n.check, true, 7);
        }
      }
      expect(checks).toBe(7); // the round, then nothing
      expect(s.position && s.turns && s.done).toBe(true);
      // a free check ends the round: not stuck, and nothing more for that key
      let t = STUCK_FRESH;
      let c2 = 0;
      for (let f = 0; f < 120; f++) {
        const n = stuckNext(t, "k", f * 16.7, 100);
        t = n.s;
        if (n.check !== null) {
          c2++;
          t = stuckRecord(t, n.check, n.check !== 2, 7);
        }
      }
      expect(c2).toBe(3);
      expect(t.turns).toBe(false);
      // the key changed (the piece moved, a part moved): a new round
      expect(stuckNext(s, "k2", 5000, 100).check).toBe(0);
    });

    it("⭐⭐ a piece DEEP inside a part: stuck AND every turn refused — the pop-up and the respawn can arm (⛔ silent before)", () => {
      const e = env([{ c: [1, 0, 0], r: 0.5 }]);
      expect(stuckProbe(q(0), e, OPT, 0.003)).toBe(true);
      expect(turnSweepFree(() => 0, Math.PI / 2, 0.2, GAP)).not.toBeNull();
      expect(pieceRespawnArmed(true, turnSweepFree(() => 0, Math.PI / 2, 0.2, GAP) !== null)).toBe(true);
    });

    it("⭐⭐ a turn's work under the frame's cap (⛔ ~61 gap queries at the gap kept)", () => {
      let n = 0;
      turnSweepFree(() => (n++, GAP), Math.PI / 2, 0.07, GAP, 24);
      expect(n).toBeLessThanOrEqual(24);
    });

    it("⭐⭐ the turn in flight HELD where the orbit carried the piece toward a part — never deeper, resumed once the way opens", () => {
      expect(turnStepHeld(0.0003, 0.002, GAP)).toBe(true); // under the margin and closer: held
      expect(turnStepHeld(0.0003, 0.0002, GAP)).toBe(false); // inside already, opening: goes on
      expect(turnStepHeld(0.004, 0.002, GAP)).toBe(false);
      // a toy frame loop: the orbit drives the piece 5 mm a frame toward a wall while a turn plays; the gap at every frame stays ≥ half the gap kept
      let wall = 0.012; // the gap at the shown rotation
      let u = 0;
      for (let f = 0; f < 10; f++) {
        const turn = (x: number) => 0.01 * x; // the turn swings a corner 10 mm closer over its whole length
        wall = Math.max(GAP + turn(u), wall - 0.002); // the orbit carries it 2 mm closer — the solver keeps the gap ≥ GAP at the current rotation
        const gapAtTurn = (x: number) => wall - turn(x);
        const next = Math.min(1, u + 0.15);
        if (!turnStepHeld(gapAtTurn(next), gapAtTurn(u), GAP)) u = next;
        expect(gapAtTurn(u)).toBeGreaterThanOrEqual(GAP / 2 - 1e-12);
      }
    });

    it("⭐⭐ a small intrusion relocates STRAIGHT OUT, by a few gaps (⛔ the 1 cm grid in a fixed order)", () => {
      // the piece 0.6 mm into a big ball beside it
      const e = env([{ c: [1, 0, 0.5994], r: 0.5 }]);
      expect(e.gap(q(0))).toBe(0);
      const to = nearestFree(q(0), e, GAP, 0.01, 0.4)!;
      expect(e.gap(to)).toBeGreaterThanOrEqual(GAP);
      const moved = Math.hypot(...(anchor(to).map((x, i) => x - anchor(q(0))[i]!) as [number, number, number]));
      expect(moved).toBeLessThan(0.0025);
    });
  });
});
