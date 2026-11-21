// ⭐⭐⭐ (2026-11-21, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §17.3, §18 — packet H3) THE FIX ROUND F-1 – F-3 on the follower's turn at an edge
// far out, the pure rules (`src/input/camera_follow.ts`): F-1 a turn only where the levelled reading ITSELF jumps across the edge (the camera's lag left to
// the spring — a vertical edge between two sides gives none: his point 1); F-2 the turn's speed his FINGER's pace (floored at close in's 360°/s) and clamped by
// `followTurnMaxDegS` (his point 2); F-3 `started`, the frame a turn starts (the wiring's rebase).
import { describe, expect, it } from "vitest";
import {
  dirAtHeading,
  followFingerPace,
  followTopStep,
  followTurnDegS,
  followTurnHoldsGizmo,
  headingOf,
  followStart,
  type FollowTop,
  type FollowTopIn,
  type FollowTopKnobs,
} from "../src/input/camera_follow";

type V = [number, number, number];
const D = Math.PI / 180;
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
const nrm = (a: V): V => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const H2: FollowTopKnobs = { tauMs: 120, poleDeg: 30, minDeg: 10, rollDegS: 360, paceShare: 1 };
const H3: FollowTopKnobs = { ...H2, onJump: true, finger: true, degPerMm: 5, maxDegS: 520 };
const SA: V = [0, 0, 1]; // a side of `Scene_1`'s cube
const SB: V = [1, 0, 0]; // the next side round (a vertical edge between them)
const TOP: V = [0, 1, 0];
const FAR: V = [0, 0, -1];
const O: V = nrm([0, 0.2, 1]); // the orbit's place, still (the orbit's direction's pace none)
const UPS: V = nrm([0, 0.5, -0.866]);
/** the camera drawn at `drawnDeg`, the reading last frame `psiT` on the facet `nW` — the spring's lag behind his dx = psiT − drawn */
const lagging = (drawnDeg: number, elDeg: number, psiT: number, nW: V, step = 0.01) => ({
  s: followStart(dirAtHeading(drawnDeg * D, elDeg * D)),
  top: { psiT, nW, turn: null, step, orbitWas: O, pace: 0 } as FollowTop,
});

describe("H3 F-1 — a turn only where the levelled reading ITSELF jumps (D-H9)", () => {
  it("a vertical edge (side → side), the reading continuous (0° → 2°), the camera 20° behind it: NO turn, no wait, no hold — H2 turned the lag (22°)", () => {
    const { s, top } = lagging(-20, 10, 0, SA);
    const inp: FollowTopIn = { ask: dirAtHeading(2 * D, 10 * D), orbit: O, psiL: 2 * D, nW: SB, upShown: UPS, dySign: 0 };
    const r = followTopStep(s, top, inp, 7, H3);
    expect(r.top.turn).toBeNull();
    expect(r.started).toBe(false);
    expect(followTurnHoldsGizmo(r.top.turn)).toBe(false);
    expect(r.hold).toBe(0);
    expect(r.delta! / D).toBeCloseTo(2, 9); // the jump read, not the lag
    // ⭐ the follower exactly as with no facet change at all: the spring pays the lag (`de4a10e`'s transition)
    const same = followTopStep(s, top, { ...inp, nW: SA }, 7, H3);
    expect(r.s.d).toEqual(same.s.d);
    expect(r.s.v).toEqual(same.s.v);
    // H2 (from the heading drawn): the lag paid as a turn with the gizmo waiting
    const h2 = followTopStep(s, top, inp, 7, H2);
    expect(Math.abs(h2.delta!) / D).toBeCloseTo(22, 6);
    expect(h2.started).toBe(true);
    expect(followTurnHoldsGizmo(h2.top.turn)).toBe(true);
  });

  it("a real jump (over the top: the reading 0° → 180°), the camera 30° off it: the turn is the JUMP (180°) from the heading drawn — the lag kept for the spring", () => {
    const { s, top } = lagging(30, 50, 0, TOP);
    const inp: FollowTopIn = { ask: dirAtHeading(Math.PI, 50 * D), orbit: O, psiL: Math.PI, nW: FAR, upShown: UPS, dySign: 1 };
    let r = followTopStep(s, top, inp, 7, H3);
    expect(r.started).toBe(true);
    expect(Math.abs(r.top.turn!.delta) / D).toBeCloseTo(180, 6);
    expect(r.top.turn!.psi0 / D).toBeCloseTo(30, 6);
    expect(r.hold).toBe(1); // a half turn the dy pushed: held after it (D-H8)
    for (let i = 0; i < 200 && r.top.turn !== null; i++) r = followTopStep(r.s, r.top, inp, 7, H3);
    // whole: 30° + 180° = 210° (the lag of 30° left to the spring, never paid at the turn's speed)
    expect(Math.abs(wrap(headingOf(r.s.dir)! - 210 * D)) / D).toBeLessThan(0.01);
    // H2: the turn from the heading drawn to the reading — 150°, the lag folded in
    const h2 = followTopStep(s, top, inp, 7, H2);
    expect(Math.abs(h2.top.turn!.delta) / D).toBeCloseTo(150, 6);
  });

  it("the dy hold (D-H8) read on the JUMP: a 70° jump with the camera 50° behind holds nothing (H2 read 120° and held the dy)", () => {
    const { s, top } = lagging(-50, 50, 0, TOP);
    const inp: FollowTopIn = { ask: dirAtHeading(70 * D, 50 * D), orbit: O, psiL: 70 * D, nW: FAR, upShown: UPS, dySign: 1 };
    const r = followTopStep(s, top, inp, 7, H3);
    expect(r.started).toBe(true);
    expect(r.hold).toBe(0);
    const h2 = followTopStep(s, top, inp, 7, H2);
    expect(Math.abs(h2.delta!) / D).toBeCloseTo(120, 6);
    expect(h2.hold).toBe(1);
  });

  it("inside a running turn: a facet change under the band leaves it running (no new start); a new jump over the band starts one, the rest carried", () => {
    const { s, top } = lagging(0, 50, 0, TOP);
    const inp: FollowTopIn = { ask: dirAtHeading(Math.PI, 50 * D), orbit: O, psiL: Math.PI, nW: FAR, upShown: UPS, dySign: 0 };
    let r = followTopStep(s, top, inp, 7, H3);
    for (let i = 0; i < 30; i++) r = followTopStep(r.s, r.top, inp, 7, H3);
    const t = r.top.turn!;
    expect(t.k).toBeGreaterThan(0.2);
    expect(t.k).toBeLessThan(0.8);
    // a facet change, the reading moving 3°: the turn goes on, its own angle and start unchanged
    const q = followTopStep(r.s, r.top, { ...inp, psiL: Math.PI + 3 * D, nW: [0, -0.2, -0.98] }, 7, H3);
    expect(q.started).toBe(false);
    expect(q.top.turn!.psi0).toBe(t.psi0);
    expect(q.top.turn!.delta).toBe(t.delta);
    expect(q.top.turn!.k).toBeGreaterThan(t.k);
    // a facet change, the reading jumping 90° again: a new turn from where the camera is, its angle the rest + the jump
    const j = followTopStep(r.s, r.top, { ...inp, psiL: Math.PI + 90 * D, nW: [1, 0, 0] }, 7, H3);
    expect(j.started).toBe(true);
    expect(j.top.turn!.psi0).toBeCloseTo(t.psi0 + t.k * t.delta, 12);
    expect(j.top.turn!.delta).toBeCloseTo((1 - t.k) * t.delta + 90 * D, 12);
  });

  it("`started` only on the frame a turn starts — never on its later frames, nor without a facet change", () => {
    const { s, top } = lagging(0, 50, 0, TOP);
    const inp: FollowTopIn = { ask: dirAtHeading(Math.PI, 50 * D), orbit: O, psiL: Math.PI, nW: FAR, upShown: UPS, dySign: 0 };
    const a = followTopStep(s, top, inp, 7, H3);
    expect(a.started).toBe(true);
    const b = followTopStep(a.s, a.top, inp, 7, H3);
    expect(b.top.turn).not.toBeNull();
    expect(b.started).toBe(false);
    expect(followTopStep(s, top, { ...inp, nW: TOP }, 7, H3).started).toBe(false);
  });
});

describe("H3 F-2 — the turn's speed: his FINGER's pace, floored at close in's, clamped (D-H10 + his clamp)", () => {
  it("his finger's pace: the deadbanded mm this frame a second × the orbit's degrees per mm (2 mm in 7 ms at 5°/mm = 1 428.6°/s)", () => {
    expect(followFingerPace(2, 0.007, 5) / D).toBeCloseTo(1428.571, 2);
    expect(followFingerPace(2, 0, 5)).toBe(0);
    expect(followFingerPace(-1, 0.007, 5)).toBe(0);
  });

  it("the speed: never under close in's 360°/s, his pace above it, ⭐ never over the clamp (0: none) — the clamp wins under the floor too", () => {
    expect(followTurnDegS(100 * D, 360, 1, 520)).toBeCloseTo(360, 9);
    expect(followTurnDegS(450 * D, 360, 1, 520)).toBeCloseTo(450, 9);
    expect(followTurnDegS(1500 * D, 360, 1, 520)).toBeCloseTo(520, 9);
    expect(followTurnDegS(1500 * D, 360, 1, 0)).toBeCloseTo(1500, 9);
    expect(followTurnDegS(1500 * D, 360, 1)).toBeCloseTo(1500, 9); // H2's call: no clamp
    expect(followTurnDegS(1500 * D, 360, 1, 200)).toBeCloseTo(200, 9);
  });

  const half = (k: FollowTopKnobs, fingerMm: number) => {
    const { s, top } = lagging(0.7 / D, 40, 0.7, TOP);
    // the orbit's own direction sweeping 3 000°/s on the crossing frame (21° in 7 ms) — what H2 read as his pace
    const orbitNow = dirAtHeading(0.7, 61 * D);
    return followTopStep(s, { ...top, orbitWas: dirAtHeading(0.7, 40 * D) }, { ask: dirAtHeading(0.7 + Math.PI, 40 * D), orbit: orbitNow, psiL: 0.7 + Math.PI, nW: FAR, upShown: UPS, dySign: 0, fingerMm }, 7, k);
  };

  it("a half turn at a crossing: his finger at 450°/s → 400 ms, whatever the orbit's direction sweeps (H2: 3 000°/s → 60 ms)", () => {
    expect(half(H3, (450 / 5) * 0.007).top.turn!.durMs).toBeCloseTo(400, 3);
    expect(half(H2, (450 / 5) * 0.007).top.turn!.durMs).toBeCloseTo(60, 0);
  });

  it("the finger still: close in's 360°/s (a half turn 500 ms); the finger fast (1 500°/s): the clamp's 520°/s (346 ms); the clamp 0: his 1 500°/s (120 ms)", () => {
    expect(half(H3, 0).top.turn!.durMs).toBeCloseTo(500, 3);
    expect(half(H3, (1500 / 5) * 0.007).top.turn!.durMs).toBeCloseTo((180 / 520) * 1000, 3);
    expect(half({ ...H3, maxDegS: 0 }, (1500 / 5) * 0.007).top.turn!.durMs).toBeCloseTo(120, 3);
  });
});
