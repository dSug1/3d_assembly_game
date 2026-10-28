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
  quadCheckBudget,
  stuckGate,
  turnSweep,
  relocationKey,
  stuckKeep,
  worldSignature,
  pieceTapAction,
  STUCK_FRESH,
  stuckNext,
  stuckRecord,
  turnStepHeld,
  projectExact,
  solveOrbitStep,
  stuckProbe,
  type OrbitQ,
  type SolverEnv,
} from "../src/input/piece_orbit_solver";

// ⭐ (the sixth audit) the whole-budget sweep — `turnSweep` with all of its budget (never PENDING then; read as refused if it were)
const turnSweepFree = (g: (u: number) => number, a: number, r: number, gap: number, m = 24): number | null => {
  const v = turnSweep(g, a, r, gap, m, m);
  return v === "PENDING" ? 0 : v;
};
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
    const to = nearestFree(q(0), e, GAP, 0.01, 0.5).to!;
    expect(to).not.toBeNull();
    expect(e.gap(to)).toBeGreaterThanOrEqual(GAP);
    expect(Math.hypot(...(anchor(to).map((x, i) => x - anchor(q(0))[i]!) as [number, number, number]))).toBeLessThan(0.3);
    expect(nearestFree(q(0), env([{ c: [1, 0, 0], r: 2 }]), GAP, 0.01, 0.2).to).toBeNull();
  });

  it("⭐⭐ a TURN by the same rule: refused where the gap falls under half the gap kept; a turn starting inside may not go closer", () => {
    // the gap along the turn: 10 mm down to 0 at u = 0.5, back up
    const gapAt = (u: number) => Math.abs(u - 0.5) * 0.02;
    const u = turnSweepFree(gapAt, Math.PI / 2, 0.2, GAP)!;
    expect(u).not.toBeNull();
    expect(gapAt(u)).toBeLessThan(GAP / 2);
    expect(u).toBeLessThanOrEqual(0.5);
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
    const F = (qq: OrbitQ, target: OrbitQ, userV: number | null = null, prevRawV: number | null = null) => ({
      q: qq,
      target,
      userV,
      prevRaw: prevRawV === null ? null : { yaw: target.yaw, v: prevRawV },
    });

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
      expect(p).toContain("const db = st.orbitMotion.band.step;"); expect(p).toContain("const dyPx = (dxOnly || shiftApproach ? 0 : db.dy) * st.cfg.boxGainPitch * g.pitch;"); // ⭐ (2026-10-28) Shift around the assembly: the approach instead // ⭐ (2026-10-19) the band's step, then the turn governor
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
      const to = nearestFree(q(0), e, GAP, 0.01, 0.4).to!;
      expect(e.gap(to)).toBeGreaterThanOrEqual(GAP);
      const moved = Math.hypot(...(anchor(to).map((x, i) => x - anchor(q(0))[i]!) as [number, number, number]));
      expect(moved).toBeLessThan(0.0025);
    });
  });

  describe("⭐⭐⭐ the third audit (2026-10-13)", () => {
    // a flat floor 2 mm under the ring's plane — a pass PARALLEL to a part
    const floorEnv = (gapBelowM: number, extra: { c: Vec3; r: number }[] = []): SolverEnv => {
      const balls = env(extra);
      const floorY = -PIECE_R - gapBelowM;
      return {
        anchor,
        gap: (x) => Math.min(Math.max(0, anchor(x)[1] - PIECE_R - floorY), balls.gap(x)),
        normal: (x) => {
          const fg = anchor(x)[1] - PIECE_R - floorY;
          return fg <= balls.gap(x) ? [0, 1, 0] : balls.normal(x);
        },
        secondGap: (x) => {
          const fg = Math.max(0, anchor(x)[1] - PIECE_R - floorY);
          const bg = balls.gap(x);
          return Math.max(fg, bg);
        },
      };
    };
    const CAP = { gapM: GAP, maxQueries: 24 };

    it("⭐⭐⭐ a swipe PARALLEL to a part, 2 mm off it, is not crept (⛔ 22 mrad of a 1 rad swipe in a frame: the scalar stride ignored the direction)", () => {
      const r = solveOrbitStep(q(0, 0), [1, 0], floorEnv(0.002), CAP);
      expect(r.q.yaw).toBeGreaterThan(0.2);
      // every point of it admissible
      for (const p of r.path) expect(floorEnv(0.002).gap(p)).toBeGreaterThanOrEqual(GAP / 2);
    });
    it("⭐⭐ the directional stride never tunnels a thin part of ANOTHER body (the fourth audit's fixture: the old one passed with the bound removed)", () => {
      // a 1 cm piece 2 mm over a floor, a 1 mm ball at the quarter point of a 4.5 cm stride, just off the path: the landing and the midpoint miss it
      const R = 0.01;
      const ball = { c: [Math.cos(0.01125), 0.011, Math.sin(0.01125)] as Vec3, r: 0.001 };
      const floorY = -R - 0.002;
      const ballGap = (x: OrbitQ) => {
        const p = anchor(x);
        return Math.max(0, Math.hypot(p[0] - ball.c[0], p[1] - ball.c[1], p[2] - ball.c[2]) - ball.r - R);
      };
      const floorGap = (x: OrbitQ) => Math.max(0, anchor(x)[1] - R - floorY);
      const e: SolverEnv = {
        anchor,
        gap: (x) => Math.min(floorGap(x), ballGap(x)),
        normal: (x) => {
          if (floorGap(x) <= ballGap(x)) return [0, 1, 0];
          const p = anchor(x);
          const v: Vec3 = [p[0] - ball.c[0], p[1] - ball.c[1], p[2] - ball.c[2]];
          const d = Math.hypot(v[0], v[1], v[2]);
          return [v[0] / d, v[1] / d, v[2] / d];
        },
        secondGap: (x) => Math.max(floorGap(x), ballGap(x)),
      };
      const r = solveOrbitStep(q(0, 0), [1, 0], e, { gapM: GAP, maxQueries: 400 });
      expect(r.q.yaw).toBeLessThan(0.0113);
      // the arc itself, finely: never under half the gap kept
      for (let i = 1; i < r.path.length; i++)
        for (let k = 0; k <= 20; k++) {
          const a0 = r.path[i - 1]!;
          const a1 = r.path[i]!;
          expect(e.gap({ yaw: a0.yaw + ((a1.yaw - a0.yaw) * k) / 20, v: a0.v + ((a1.v - a0.v) * k) / 20, zoom: 1 })).toBeGreaterThanOrEqual(GAP / 2 - 1e-9);
        }
    });
    it("⭐⭐⭐ a finger REVERSING after a capped swipe moves the piece back at once (⛔ it went on forward for 4 frames on the backlog)", () => {
      const e = floorEnv(0.0012);
      // a capped frame left a backlog: the last target 0.9 ahead of the piece
      const pieceAt = q(0.05, 0);
      const prevRaw = { yaw: 0.95, v: 0 };
      // the finger now moves back by 0.1
      const r = orbitFrame({ q: pieceAt, target: q(0.85, 0), userV: 0, prevRaw }, e, CAP, { stepM: 0.01, maxM: 0.4 });
      expect(r.q.yaw).toBeLessThan(pieceAt.yaw);
      // the same frame with the finger still going forward keeps the backlog
      const f = orbitFrame({ q: pieceAt, target: q(1.05, 0), userV: 0, prevRaw }, e, CAP, { stepM: 0.01, maxM: 0.4 });
      expect(f.q.yaw).toBeGreaterThan(pieceAt.yaw);
    });
    it("⭐⭐⭐ the relocation's search is under the frame's cap and RESUMES (⛔ ~280 gap queries a frame with nothing free within reach)", () => {
      let n = 0;
      const big = env([{ c: [1, 0, 0], r: 2 }]);
      const counted: SolverEnv = { anchor, gap: (x) => (n++, big.gap(x)), normal: (x) => (n++, big.normal(x)) };
      let from = 0;
      let frames = 0;
      for (; frames < 100; frames++) {
        n = 0;
        const r = nearestFree(q(0), counted, GAP, 0.01, 0.4, 24, from);
        expect(n).toBeLessThanOrEqual(25);
        if (r.next === null) {
          expect(r.to).toBeNull();
          break;
        }
        from = r.next;
      }
      expect(frames).toBeGreaterThan(5); // the search went on over frames — and ENDED
      // orbitFrame: exhausted is reported, and a search told to skip (from < 0) makes no query for it
      const stuckIn = orbitFrame({ q: q(0), target: q(0), userV: 0, prevRaw: { yaw: 0, v: 0 } }, big, CAP, { stepM: 0.01, maxM: 0.4 });
      expect(stuckIn.queries).toBeLessThanOrEqual(30);
      expect(stuckIn.relocateNext).not.toBeNull();
      const skip = orbitFrame({ q: q(0), target: q(0), userV: 0, prevRaw: { yaw: 0, v: 0 } }, big, CAP, { stepM: 0.01, maxM: 0.4, from: -1 });
      expect(skip.relocated).toBe(false);
      expect(skip.queries).toBeLessThanOrEqual(2);
    });
    it("⭐⭐⭐ the stuck schedule keeps its PACE and its VERDICT across a churning key (⛔ check 0 every frame, the pop-up off for ≥ 600 ms)", () => {
      // a stuck verdict reached
      let s = STUCK_FRESH;
      for (let f = 0; f < 60; f++) {
        const n = stuckNext(s, "k", f * 16.7, 100);
        s = n.s;
        if (n.check !== null) s = stuckRecord(s, n.check, true, 7);
      }
      expect(s.position && s.turns).toBe(true);
      // the key now changes EVERY frame (a turn playing, a part dragged, the sway): the verdict holds, and the pace too
      let checks = 0;
      for (let f = 60; f < 120; f++) {
        const n = stuckNext(s, "k" + f, f * 16.7, 100);
        s = n.s;
        expect(s.position && s.turns).toBe(true); // the pop-up never blinks off while every check still agrees
        if (n.check !== null) {
          checks++;
          s = stuckRecord(s, n.check, true, 7);
        }
      }
      expect(checks).toBeLessThanOrEqual(11);
      // a check that disagrees ends it
      const n = stuckNext(s, "k-free", 9999, 100);
      expect(stuckRecord(n.s, n.check!, false, 7).turns).toBe(false);
    });
    it("⭐⭐ a tap on the orbited piece: a double tap while armed respawns; a single tap while the pop-up shows is CONSUMED (⛔ it changed the face and disarmed the double)", () => {
      expect(pieceTapAction(true, true, true, true)).toBe("RESPAWN");
      expect(pieceTapAction(true, false, true, true)).toBe("CONSUME");
      expect(pieceTapAction(true, false, false, false)).toBe("FACE");
      expect(pieceTapAction(true, true, false, false)).toBe("FACE");
      expect(pieceTapAction(false, false, true, true)).toBe("NONE");
    });
    it("⭐⭐ the orbit drag's own deadband restarts after a pause for less (⛔ 3.5 mm a pause) — and never below 3× the pointer noise", async () => {
      const { MotionTracker } = await import("../src/input/motion");
      const { DEFAULT_CONFIG, validateGestureConfig } = await import("../src/input/gestureConfig");
      const { mmToPx } = await import("../src/core/units");
      const emitted = (bandMm: number) => {
        const tr = new MotionTracker({ ...DEFAULT_CONFIG, motionDeadbandMm: bandMm });
        let x = 0;
        let t = 0;
        let out = 0;
        // a drag, a pause of 400 ms, then 5 mm more
        for (let i = 0; i < 10; i++) {
          x += mmToPx(1);
          t += 16;
          tr.push({ x, y: 0, t });
        }
        t += 400;
        tr.tick(t);
        tr.push({ x, y: 0, t });
        for (let i = 0; i < 5; i++) {
          x += mmToPx(1);
          t += 16;
          tr.push({ x, y: 0, t });
          out += tr.step.dx;
        }
        return out / mmToPx(1);
      };
      expect(emitted(DEFAULT_CONFIG.orbitDeadbandMm)).toBeGreaterThan(emitted(DEFAULT_CONFIG.motionDeadbandMm) + 1);
      expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, orbitDeadbandMm: 1 })).toThrow(/orbitDeadbandMm/);
      const p = readFileSync(new URL("../src/render/pointer_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
      expect(p).toContain("band: new MotionTracker({ ...st.cfg, motionDeadbandMm: st.cfg.orbitDeadbandMm }, st.cfg.orbitBandRestMs, true)");
      expect(p).toContain("const db = st.orbitMotion.band.step;");
    });
  });

  describe("⭐⭐⭐ the fourth audit (2026-10-13)", () => {
    const floorAt = (gapBelowM: number): SolverEnv => {
      const floorY = -PIECE_R - gapBelowM;
      return {
        anchor,
        gap: (x) => Math.max(0, anchor(x)[1] - PIECE_R - floorY),
        normal: () => [0, 1, 0],
        secondGap: () => 10,
      };
    };
    it("⭐⭐⭐ a piece RESTING on a part slides along it at full stride (⛔ 0.048 rad a frame: 4 mm sub-steps at the gap kept)", () => {
      const e = floorAt(GAP);
      const r = solveOrbitStep(q(0, 0), [1, 0], e, { gapM: GAP, maxQueries: 24 });
      expect(r.q.yaw).toBeGreaterThan(0.2);
      for (const p of r.path) expect(e.gap(p)).toBeGreaterThanOrEqual(GAP / 2);
    });
    it("⭐⭐ the stuck probe's four solves SHARE the cap (⛔ each was given all of it)", () => {
      let n = 0;
      const e = env([AHEAD]);
      const at = solveOrbitStep(q(0), [Math.PI / 2, 0], e, OPT).q;
      const counted: SolverEnv = { anchor, gap: (x) => (n++, e.gap(x)), normal: (x) => (n++, e.normal(x)) };
      stuckProbe(at, counted, { gapM: GAP, maxQueries: 24 }, 0.003);
      expect(n).toBeLessThanOrEqual(24 + 4 * 2);
    });
    it("⭐⭐ an ARMED verdict gets ONE check at once on a key change — a freed piece hides the pop-up within a frame — then the pace", () => {
      const armed = { ...STUCK_FRESH, key: "k", position: true, turns: true, done: true, at: 1000 };
      const a = stuckNext(armed, "k2", 1010, 100);
      expect(a.check).toBe(0);
      const b = stuckNext(a.s, "k3", 1026, 100);
      expect(b.check).toBeNull();
      // a disagreeing check clears it
      expect(stuckRecord(a.s, 0, false, 7).position).toBe(false);
    });
    it("⭐⭐ the scene signature leaves the ORBITED pieces out (⛔ their easing pose restarted the relocation's search every frame)", () => {
      const mk = (pieceX: number, partX: number, partQ: number[] = [1, 0, 0, 0]) =>
        ({
          objects: new Map([
            ["piece", { local: { position: [pieceX, 0, 0], orientation: [1, 0, 0, 0] }, orbited: true }],
            ["part", { local: { position: [partX, 0, 0], orientation: partQ } }],
          ]),
        }) as unknown as Parameters<typeof worldSignature>[0];
      expect(worldSignature(mk(0, 0))).toBe(worldSignature(mk(0.3, 0)));
      expect(worldSignature(mk(0, 0))).not.toBe(worldSignature(mk(0, 0.001)));
      expect(worldSignature(mk(0, 0, [0.9998, 0.02, 0, 0]))).not.toBe(worldSignature(mk(0, 0))); // a part turned in place is seen
    });
    it("⭐ the orbit drag's band is TICKED with the camera's tracker (⛔ never ticked: a pause did not re-rest it)", () => {
      const g = readFileSync(new URL("../src/render/green_box_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
      expect(g).toMatch(/st\.orbitMotion\.tracker\.tick\(now\);[^;]*st\.orbitMotion\.band\.tick\(now\);/);
    });
  });

  describe("⭐⭐⭐ the fifth audit (2026-10-13)", () => {
    it("⭐⭐⭐ a careful STOP-AND-GO drag keeps its travel through the orbit band (⛔ re-armed at every hesitation: 46–87 % of it dead)", async () => {
      const { MotionTracker } = await import("../src/input/motion");
      const { DEFAULT_CONFIG } = await import("../src/input/gestureConfig");
      const { mmToPx } = await import("../src/core/units");
      const emitted = (minRestMs: number) => {
        const tr = new MotionTracker({ ...DEFAULT_CONFIG, motionDeadbandMm: DEFAULT_CONFIG.orbitDeadbandMm }, minRestMs);
        let x = 0;
        let t0 = 0;
        let out = 0;
        // a mouse: 10 bursts of 3 mm (5 events of 0.6 mm at 8 ms), a 200 ms hesitation between them (ticked every 16 ms, as the frame does)
        for (let b = 0; b < 10; b++) {
          for (let i = 0; i < 5; i++) {
            x += mmToPx(0.6);
            t0 += 8;
            tr.push({ x, y: 0, t: t0 });
            out += tr.step.dx;
          }
          for (let k = 0; k < 12; k++) {
            t0 += 16.7;
            tr.tick(t0);
          }
        }
        return out / x;
      };
      expect(emitted(DEFAULT_CONFIG.orbitBandRestMs)).toBeGreaterThan(0.8);
      expect(emitted(0)).toBeLessThan(0.5); // ⛔ the band re-armed at every hesitation
    });

    it("⭐⭐⭐ the PLANE BOUND stops a long slide where the ring bulges toward a part (⛔ nothing pinned it: with it removed every vector passed)", () => {
      // the ring's anchor bulges 2 mm toward a wall over v ∈ [0.40, 0.42]; the piece rests at the gap kept against it
      const bump = (v: number) => (v > 0.4 && v < 0.42 ? 0.002 * Math.sin((Math.PI * (v - 0.4)) / 0.02) : 0);
      const anchorB = (x: OrbitQ): Vec3 => [(1 + bump(x.v)) * Math.cos(x.yaw), x.v, (1 + bump(x.v)) * Math.sin(x.yaw)];
      const wallX = 1 + PIECE_R + GAP;
      const e: SolverEnv = {
        anchor: anchorB,
        gap: (x) => Math.max(0, wallX - anchorB(x)[0] - PIECE_R),
        normal: () => [-1, 0, 0],
        secondGap: () => 10,
      };
      const r = solveOrbitStep(q(0, 0.38), [0, 0.05], e, { gapM: GAP, maxQueries: 24 });
      expect(r.q.v).toBeLessThan(0.41); // ⛔ the unbounded long slide landed past the bulge, at 0.43, through the wall
      for (const p of r.path) expect(e.gap(p)).toBeGreaterThanOrEqual(GAP / 2);
    });

    it("⭐⭐ a nudge keeps the stuck verdict — only a real move (a quarter of the probe) drops it (⛔ any easing of the shown piece wiped it)", () => {
      expect(stuckKeep([0, 0, 0], [0.0002, 0, 0], 0.003)).toBe(true);
      expect(stuckKeep([0, 0, 0], [0.001, 0, 0], 0.003)).toBe(false);
      expect(stuckKeep(null, [1, 0, 0], 0.003)).toBe(true);
      const g = readFileSync(new URL("../src/render/green_box_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
      expect(g).toContain("if (!pieceShownAtRest(st, q)) { if (!stuckKeep(st.pieceStuck.anchor, ringAnchorAt(st, q), STUCK_PROBE_M)) st.pieceStuck = STUCK_FRESH; return; }");
    });

    it("⭐⭐ the relocation key carries the piece's TURN (⛔ an exhausted search was never retried after a turn in place)", () => {
      const a = relocationKey(q(0.1, 0.5), [1, 0, 0, 0], [0, 0, 0], "s");
      expect(relocationKey(q(0.1, 0.5), [0.9998, 0.02, 0, 0], [0, 0, 0], "s")).not.toBe(a);
      expect(relocationKey(q(0.1, 0.5), [1, 0, 0, 0], [0, 0, 0], "s")).toBe(a);
    });

    it("⭐⭐ a turn sampled near a part is refined where a sample reads close (⛔ a 2.5 mm spike between two samples passed)", () => {
      expect(turnSweepFree((u) => (Math.abs(u - 0.5) < 0.01 ? 0 : 0.001), Math.PI / 2, 0.08, 0.001, 24)).not.toBeNull();
      // free all the way: still free
      expect(turnSweepFree(() => 0.001, Math.PI / 2, 0.08, 0.001, 24)).toBeNull();
      // the work stays under the cap
      let n = 0;
      turnSweepFree(() => (n++, 0.001), Math.PI / 2, 0.08, 0.001, 24);
      expect(n).toBeLessThanOrEqual(24);
    });

    it("⭐ a COMPLETED stuck round re-arms the one quick check (each new burst of changes gets one)", () => {
      let s = { ...STUCK_FRESH, key: "k", fast: true };
      for (let k = 0; k < 7; k++) s = stuckRecord(s, k, true, 7);
      expect(s.position && s.turns && !s.fast).toBe(true);
    });

    it("⭐ the two paced checks never share a frame: the stuck check skips the frame the red quad's ran", () => {
      const g = readFileSync(new URL("../src/render/green_box_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
      // ⭐ (the sixth audit) read and cleared FIRST, before any early return
      expect(g).toContain("const quadRan = st.quadCheckRan; st.quadCheckRan = false;");
      expect(g).toContain("if (quadRan) return;");
      const c = readFileSync(new URL("../src/render/orient_cube.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
      expect(c).toContain("if (budget === null) return; st.quadCheckRan = true;");
    });
  });

  describe("⭐⭐⭐ the sixth audit (2026-10-13)", () => {
    it("⭐⭐⭐ THE STUCK GATE: in a pocket some wiggle steps ARE free while the piece is still stuck — they must not reset an armed verdict", () => {
      // the pocket at the gap kept on all four sides (the stuck vector's), a finger wiggling ±0.3 mm
      const a0 = anchor(q(0));
      const d = PIECE_R + 0.05 + GAP;
      const balls = [
        { c: [a0[0], a0[1], a0[2] + d] as Vec3, r: 0.05 },
        { c: [a0[0], a0[1] + d, a0[2]] as Vec3, r: 0.05 },
        { c: [a0[0], a0[1] - d, a0[2]] as Vec3, r: 0.05 },
        { c: [a0[0], a0[1], a0[2] - d] as Vec3, r: 0.05 },
      ];
      const e = env(balls, (x) => anchor({ ...x, v: x.v - 0.5 }));
      let at = q(0, 0.5);
      let free = 0;
      for (let i = 0; i < 30; i++) {
        const s = [((i * 7) % 3) - 1, ((i * 5) % 3) - 1] as const;
        const r = solveOrbitStep(at, [s[0] * 0.0003, s[1] * 0.0003], e, OPT);
        if (!r.blocked && (s[0] !== 0 || s[1] !== 0)) free++;
        at = r.q;
      }
      expect(free).toBeGreaterThan(0); // the premise: a "free" step happens …
      expect(stuckProbe(at, e, OPT, 0.003)).toBe(true); // … while the piece is stuck all along
      // the gate: a free step with an armed verdict that has not moved is a CHECK, not a RESET
      expect(stuckGate(false, false, true, [0, 0, 0], [0.0003, 0, 0], 0.003)).toBe("CHECK");
      expect(stuckGate(false, false, true, [0, 0, 0], [0.001, 0, 0], 0.003)).toBe("RESET");
      expect(stuckGate(false, false, false, null, [0, 0, 0], 0.003)).toBe("RESET");
      expect(stuckGate(true, false, false, null, [0, 0, 0], 0.003)).toBe("CHECK");
      expect(stuckGate(false, true, false, null, [0, 0, 0], 0.003)).toBe("CHECK");
    });

    it("⭐⭐⭐ the turn sweep is CERTIFIED by the gap's Lipschitz bound, else refined (⛔ a 5–8 mm notch passed as free between two samples)", () => {
      // a dip right after a near start
      const dip = (u: number) => (u < 0.03 ? 0.001 - u * 0.03 : u < 0.06 ? 0 : 0.005 + (u - 0.06) * 0.1);
      expect(turnSweepFree(dip, Math.PI / 2, 0.08, 0.001, 24)).not.toBeNull();
      // a 6 mm notch (a V of the gap's own slope) centred at u = 0.52
      const sweep = (Math.PI / 2) * 0.08;
      const notch = (u: number) => Math.max(0, Math.min(0.0015, Math.abs(u - 0.52) * sweep - 0.003));
      expect(turnSweepFree(notch, Math.PI / 2, 0.08, 0.001, 24)).not.toBeNull();
      // free all the way at the gap kept: free, under the cap
      let n = 0;
      expect(turnSweepFree(() => (n++, 0.0015), Math.PI / 2, 0.08, 0.001, 24)).toBeNull();
      expect(n).toBeLessThanOrEqual(24);
    });

    it("⭐⭐⭐ a resting finger's TREMOR re-rests the orbit band in time; a steady drag never rests (⛔ the tremor restarted the rest clock: 0.7–1.3 s)", async () => {
      const { MotionTracker } = await import("../src/input/motion");
      const { DEFAULT_CONFIG } = await import("../src/input/gestureConfig");
      const { mmToPx } = await import("../src/core/units");
      const cfg = { ...DEFAULT_CONFIG, motionDeadbandMm: DEFAULT_CONFIG.orbitDeadbandMm };
      let seed = 7;
      const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1;
      const restTime = (jitterRest: boolean) => {
        const tr = new MotionTracker(cfg, 400, jitterRest);
        let t = 0;
        let x = 0;
        for (let i = 0; i < 20; i++) {
          x += mmToPx(1);
          t += 60;
          tr.push({ x, y: 0, t }); // a drag at tablet rate …
        }
        const stop = t;
        for (let i = 0; i < 60; i++) {
          t += 60;
          tr.push({ x: x + mmToPx(0.76) * rnd(), y: 0, t }); // … then the finger rests, its tremor dispatching
          if (tr.axes.x === "STATIONARY") return t - stop;
        }
        return Infinity;
      };
      const times: number[] = [];
      for (let k = 0; k < 400; k++) times.push(restTime(true));
      // 400 ms of rest + the first in-band sample + the 60 ms event grid: measured p50 540, p95 600 (⛔ p50 840, p95 1440 before)
      const within = times.filter((ms) => ms <= 1.5 * 400).length;
      expect(within / times.length).toBeGreaterThanOrEqual(0.95);
      // ⛔ without it, the tremor keeps it moving far longer
      seed = 7;
      const old: number[] = [];
      for (let k = 0; k < 400; k++) old.push(restTime(false));
      expect(old.filter((ms) => ms <= 1.5 * 400).length / old.length).toBeLessThan(0.5);
      // a steady drag of 0.4 mm a sample at 16.7 ms never rests
      const tr = new MotionTracker(cfg, 400, true);
      let x = 0;
      let rested = false;
      for (let i = 0; i < 200; i++) {
        x += mmToPx(0.4);
        tr.push({ x, y: 0, t: i * 16.7 });
        if (i > 20 && tr.axes.x === "STATIONARY") rested = true;
      }
      expect(rested).toBe(false);
    });

    it("⭐⭐⭐ THE RED QUAD is asked while the piece MOVES, with what the frame's solve left (⛔ paused at > 3 mm a frame: red almost to the far ring)", () => {
      // due on a changed key after the pace, whatever the motion; the budget is the cap minus the solve's queries
      expect(quadCheckBudget(true, 120, 100, 24, 6)).toBe(18);
      expect(quadCheckBudget(true, 50, 100, 24, 6)).toBeNull(); // the pace
      expect(quadCheckBudget(false, 500, 100, 24, 0)).toBeNull(); // nothing changed
      expect(quadCheckBudget(true, 500, 100, 24, 23)).toBeNull(); // the solve took the frame
      // FREE AT ONCE when clear by more than the turn's whole sweep: one query
      let n = 0;
      expect(turnSweep(() => (n++, 0.2), Math.PI / 2, 0.08, 0.001, 24, 24)).toBeNull();
      expect(n).toBe(1);
      // a sweep the budget cuts answers PENDING (the colour kept, asked again), never free
      expect(turnSweep(() => 0.0015, Math.PI / 2, 0.08, 0.001, 24, 3)).toBe("PENDING");
    });
  });
});

describe("⭐⭐⭐ the tunnel through Piece10 (2026-10-15, the owner: *\"if I release and then press again and do dx, the piece continues to be blocked (which is OK). If I do dy instead, the piece goes through the blue part\"*)", () => {
  // ⭐ a ring whose speed changes sharply along v — as at a ring of the owner's rig (2nd and 3rd at 0.2 m): fast first, then slow
  const fastThenSlow = (x: OrbitQ): Vec3 => [x.v < 0.1 ? 4 * x.v : 0.4 + 0.02 * (x.v - 0.1), 0, 0];
  const WALL = { c: [0.2, 0, 0] as Vec3, r: 0.01 }; // a thin part across the path: the piece is inside it for x in [0.09, 0.31]
  it("⭐⭐⭐ a stride is measured on ITS OWN travel — ⛔ the whole step's length, scaled, let a fraction of the step carry the piece through a part", () => {
    const e = env([WALL], fastThenSlow);
    expect(e.gap(q(0, 0))).toBeCloseTo(0.09, 9);
    const r = solveOrbitStep(q(0, 0), [0, 0.5], e, OPT);
    for (const p of r.path) expect(fastThenSlow(p)[0]).toBeLessThan(0.09); // ✅ never past the wall's near side (⛔ it landed at x = 0.39, beyond it)
    expect(r.blocked).toBe(true);
    expect(e.gap(r.q)).toBeGreaterThanOrEqual(GAP / 2);
  });
  it("⭐⭐⭐ a piece INSIDE the margin leaves in short checked strides that open the gap — ⛔ one whole step that ended farther out was taken, through the part", () => {
    const line = (x: OrbitQ): Vec3 => [x.v, 0, 0];
    const e = env([WALL], line);
    expect(e.gap(q(0, 0.15))).toBe(0); // inside the wall
    const r = solveOrbitStep(q(0, 0.15), [0, 0.5], e, OPT);
    expect(r.q.v).toBeCloseTo(0.15, 12); // ✅ deep inside, no stride opens the gap: held (the ring's nearest free place is `nearestFree`'s job) — ⛔ it jumped to 0.65
    // a piece just inside the margin, the step leaving it: taken, and the rest of the step solved as usual
    const e2 = env([{ c: [0, 0, 0], r: 0.01 }], line);
    const r2 = solveOrbitStep(q(0, 0.1103), [0, 0.3], e2, OPT); // gap 0.3 mm < half the gap kept
    expect(e2.gap(q(0, 0.1103))).toBeLessThan(GAP / 2);
    expect(r2.q.v).toBeCloseTo(0.4103, 9);
  });
});

describe("⭐⭐ the audit of 2026-10-15 (Fable): the solver's CPU — its arc measured to 2 %, not 0.1 %", () => {
  it("⭐⭐ a slide along a wall on the real rig (Scene_1, the owner's 2nd and 3rd rings at 0.2 m) costs ≤ 3000 anchor evaluations a solve — ⛔ 6 719 (11 ms in Node): the 24-query cap did not bound the frame", async () => {
    const { orbitOffset } = await import("../src/input/orbit");
    const { sceneConfig } = await import("../src/input/scene_rig");
    const { DEFAULT_CONFIG } = await import("../src/input/gestureConfig");
    const { SCENE_1 } = await import("../src/content/scene_1");
    const cfg = { ...sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit), orbitMiddleRadiusM: 0.2, orbitLowerRadiusM: 0.2 };
    let anchors = 0;
    const A = (x: OrbitQ): Vec3 => {
      anchors++;
      return orbitOffset(cfg, x.yaw, x.v, 1).offsetM as unknown as Vec3;
    };
    let worst = 0;
    for (const [yaw, v, dv] of [[2.1, 0.4, 1], [2.1, 0.4, -1], [0.5, 0.6, -1], [2.1, 0.45, 0.3]] as const) {
      const a0 = orbitOffset(cfg, yaw, v, 1).offsetM as unknown as Vec3;
      const a1 = orbitOffset(cfg, yaw, Math.min(1, Math.max(0, v + 1e-3 * Math.sign(dv))), 1).offsetM as unknown as Vec3;
      const t = [a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]];
      const l = Math.hypot(t[0]!, t[1]!, t[2]!);
      for (const tilt of [0.2, 0.5, 1, 2, 4])
        for (const side of [[1, 0, 0], [0, 1, 0], [0, 0, 1]] as Vec3[]) {
          // a wall 1 mm ahead, tilted so the piece SLIDES along it
          const m: Vec3 = [-t[0]! / l + side[0] * tilt, -t[1]! / l + side[1] * tilt, -t[2]! / l + side[2] * tilt];
          const ml = Math.hypot(m[0], m[1], m[2]);
          if (ml < 1e-6) continue; // a tilt cancelling the motion: no wall
          const n: Vec3 = [m[0] / ml, m[1] / ml, m[2] / ml];
          const W: Vec3 = [a0[0] - n[0] * 0.001, a0[1] - n[1] * 0.001, a0[2] - n[2] * 0.001];
          const e: SolverEnv = { anchor: A, gap: (x) => { const a = A(x); return Math.max(0, (a[0] - W[0]) * n[0] + (a[1] - W[1]) * n[1] + (a[2] - W[2]) * n[2]); }, normal: () => n };
          anchors = 0;
          const r = solveOrbitStep({ yaw, v, zoom: 1 }, [0, dv], e, { gapM: 0.001, maxQueries: 24 });
          worst = Math.max(worst, anchors);
          expect(e.gap(r.q)).toBeGreaterThanOrEqual(0.0005); // still never inside
        }
    }
    expect(worst).toBeLessThanOrEqual(3000);
  });
});

describe("⭐ the audit of 2026-10-15 (Fable): inside the margin of TWO parts, a step leaving both is taken", () => {
  it("⭐ a corner: 0.3 mm from two walls, a step straight away from both moves — ⛔ blocked (the other part's clearance floored the stride at 0)", () => {
    // the toy ring at yaw 0, v 0: anchor (1, 0, 0); wall 1 normal +z at z = −0.3 mm, wall 2 normal +y at y = −0.3 mm
    const walls: { n: Vec3; d: number }[] = [{ n: [0, 0, 1], d: -0.0003 }, { n: [0, 1, 0], d: -0.0003 }];
    const dists = (x: OrbitQ) => { const a = anchor(x); return walls.map((w) => a[0] * w.n[0] + a[1] * w.n[1] + a[2] * w.n[2] - w.d).map((g) => Math.max(0, g)); };
    const e: SolverEnv = {
      anchor,
      gap: (x) => Math.min(...dists(x)),
      secondGap: (x) => Math.max(...dists(x)),
      normal: (x) => { const ds = dists(x); return walls[ds[0]! <= ds[1]! ? 0 : 1]!.n; },
    };
    expect(e.gap(q(0, 0))).toBeCloseTo(0.0003, 12);
    const r = solveOrbitStep(q(0, 0), [0.02, 0.02], e, OPT);
    expect(r.q.yaw).toBeGreaterThan(0.01); // ✅ it leaves (⛔ held at 0)
    expect(r.q.v).toBeGreaterThan(0.01);
    for (const p of r.path) expect(e.gap(p)).toBeGreaterThanOrEqual(0.0003 - 1e-12); // never closer than it started
  });
});
