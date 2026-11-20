// ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §15 – §16 — packet H2, switch `followTop`) THE TOP AND BOTTOM FAR OUT, the pure
// rules (`src/input/camera_follow.ts`): the calm's levelled reading (carried where it has none), the height capped, the edge's turn by close in's functions
// (its angle, its band, its clock, the gizmo waiting, his pace), the dy hold after a half turn (D-T4's two conditions), one frame of the follower.
import { describe, expect, it } from "vitest";
import {
  dirAtHeading,
  followTopStep,
  followTopTarget,
  followTurnDegS,
  followTurnDelta,
  followTurnHold,
  followTurnHoldsGizmo,
  followTurnStart,
  followTurnStep,
  headingOf,
  levelledHeading,
  type FollowState,
  type FollowTop,
  type FollowTopIn,
} from "../src/input/camera_follow";
import { vOfPitch } from "../src/input/assembly_orbit";
import { calmShown, type CalmState } from "../src/input/orbit_calm";
import { mulT, type Mat3 } from "../src/input/orbit_tilt";

type V = [number, number, number];
const D = Math.PI / 180;
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
const nrm = (a: V): V => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};
// a vertical side facet facing +z in the world (the orbit's yaw π/2), the calm's middle share, the cap's whole vertical share (as `calmTargets` asks it)
const SIDE: CalmState = { n: [0, 0, 1], sH: 0.25, sV: 1, wA: 0 };
// a spit's frame (F → world): F's up the world's x (the heptagon's axis), F's x the world's y
const SPIT: Mat3 = [
  [0, 1, 0],
  [1, 0, 0],
  [0, 0, -1],
];
const RIDGE_W = nrm([0, Math.cos(26 * D), Math.sin(26 * D)]); // a ridge face of the lying heptagon, 26° off the vertical
const RIDGE: CalmState = { n: mulT(SPIT, RIDGE_W), sH: 1, sV: 0.25, wA: 0, poleFade: false };

describe("H2 — the calm's LEVELLED reading (`levelledHeading`)", () => {
  it("over a cap, reading a side's calm (ACROSS, `wA` 1, as at a side's top edge; or not): a PURE dy up to the pole never moves the heading (A1)", () => {
    const yaw = Math.PI / 2 + 20 * D;
    for (const c of [SIDE, { ...SIDE, wA: 1 }, { ...SIDE, wA: 0.5, poleFade: true }]) {
      const h65 = levelledHeading(yaw, vOfPitch(65 * D), c, null, 30)!;
      for (const p of [70, 80, 84, 89.95, 90]) expect(levelledHeading(yaw, vOfPitch(p * D), c, null, 30)!).toBeCloseTo(h65, 9);
      // ⭐ the calm's share of the yaw's angle off the face (20° → 5°), the same side as the yaw (its own heading −20°)
      expect(h65 / D).toBeCloseTo(-5, 6);
    }
  });

  it("a dx turns it with the red section by the calm's share: 8° of yaw off the face's middle → 2° of heading", () => {
    const a = levelledHeading(Math.PI / 2 + 10 * D, vOfPitch(75 * D), SIDE, null, 30)!;
    const b = levelledHeading(Math.PI / 2 + 18 * D, vOfPitch(75 * D), SIDE, null, 30)!;
    expect((b - a) / D).toBeCloseTo(-2, 6);
  });

  it("on a vertical facet: the asked direction's own heading, whatever its vertical share (a dy never yaws there already)", () => {
    const c: CalmState = { n: [0, 0, 1], sH: 0.4, sV: 0.3, wA: 0, poleFade: false };
    const yaw = Math.PI / 2 - 25 * D;
    const v = vOfPitch(35 * D);
    const p = 35 * D;
    const u: V = [Math.cos(p) * Math.cos(yaw), Math.sin(p), Math.cos(p) * Math.sin(yaw)];
    expect(levelledHeading(yaw, v, c, null, 30)!).toBeCloseTo(headingOf(calmShown(u, c))!, 9);
  });

  it("in a spit (F's up the axis): the ridge face's own heading — a dy round the axis and a dx along it move nothing", () => {
    for (const [yawDeg, pDeg] of [
      [-20, 0],
      [-40, 0],
      [-30, 25],
      [-30, -25],
    ]) {
      const yaw = yawDeg! * D;
      expect(levelledHeading(yaw, vOfPitch(pDeg! * D), RIDGE, SPIT, 30)!).toBeCloseTo(0, 9);
    }
  });

  it("kept on its FACE'S side of the vertical (A2): the orbit 2° past the ridge's vertical still reads the ridge face's 0°, never 180°", () => {
    // u in the world (0, cos 2°, −sin 2°): past the vertical toward −z — in F (cos 2°, 0, sin 2°): yaw 2°, pitch 0; the calm whole (sH 1)
    expect(levelledHeading(2 * D, vOfPitch(0), RIDGE, SPIT, 30)!).toBeCloseTo(0, 9);
    // the face beyond (its normal toward −z) reads 180° at the same place
    const beyond: CalmState = { ...RIDGE, n: mulT(SPIT, nrm([0, Math.cos(26 * D), -Math.sin(26 * D)])) };
    expect(Math.abs(levelledHeading(2 * D, vOfPitch(0), beyond, SPIT, 30)!) / D).toBeCloseTo(180, 6);
  });

  it("CARRIED (null): the calm's facet level in the world (a spit's bottom); no calm within `poleDeg` of the vertical; else the orbit's own heading", () => {
    const bottom: CalmState = { n: mulT(SPIT, [0, -1, 0]), sH: 0.25, sV: 0.25, wA: 0, poleFade: false };
    expect(levelledHeading(-1, vOfPitch(10 * D), bottom, SPIT, 30)).toBeNull();
    expect(levelledHeading(0.3, vOfPitch(70 * D), null, null, 30)).toBeNull();
    expect(levelledHeading(0.3, vOfPitch(50 * D), null, null, 30)!).toBeCloseTo(Math.PI / 2 - 0.3, 9);
  });
});

describe("H2 — the height capped, the turn's angle, band, clock, speed, the gizmo waiting, the hold", () => {
  it("the spring's target: the heading given, the asked elevation capped 90° − `followPoleDeg` either way (D-H1)", () => {
    const t = followTopTarget(1, dirAtHeading(0.2, 80 * D), 30);
    expect(Math.asin(t[1]) / D).toBeCloseTo(60, 9);
    expect(headingOf(t)!).toBeCloseTo(1, 9);
    expect(Math.asin(followTopTarget(1, dirAtHeading(0.2, -89 * D), 30)[1]) / D).toBeCloseTo(-60, 9);
    expect(Math.asin(followTopTarget(1, dirAtHeading(0.2, 35 * D), 30)[1]) / D).toBeCloseTo(35, 9);
  });

  it("the turn's angle (O2): the heading drawn to the reading beyond; the half turn's tie the way the heading was going", () => {
    expect(followTurnDelta(10 * D, 100 * D, 0) / D).toBeCloseTo(90, 9);
    expect(followTurnDelta(0, 179 * D, -1) / D).toBeCloseTo(-181, 9);
    expect(followTurnDelta(0, 179 * D, 1) / D).toBeCloseTo(179, 9);
    expect(followTurnDelta(0, 120 * D, -1) / D).toBeCloseTo(120, 9);
  });

  it("the band (`followTurnMinDeg`): none under it — the spring pays; from it, a turn whose duration is its angle at the speed (close in's `rollDurationMs`)", () => {
    expect(followTurnStart(0, 9.9 * D, 10, 360)).toBeNull();
    const t = followTurnStart(0.5, -Math.PI, 10, 360)!;
    expect(t.durMs).toBeCloseTo(500, 9);
    expect(t.k).toBe(0);
    expect(followTurnStart(0, 90 * D, 10, 720)!.durMs).toBeCloseTo(125, 9);
  });

  it("the clock: k the time run over the duration, whole at its end; the gizmo WAITS while k < 1, free at 1 and with no turn", () => {
    let t = followTurnStart(0, Math.PI, 10, 360)!;
    expect(followTurnHoldsGizmo(t)).toBe(true);
    t = followTurnStep(t, 125);
    expect(t.k).toBeCloseTo(0.25, 12);
    expect(followTurnHoldsGizmo(t)).toBe(true);
    t = followTurnStep(t, 374);
    expect(followTurnHoldsGizmo(t)).toBe(true);
    t = followTurnStep(t, 2);
    expect(t.k).toBe(1);
    expect(followTurnHoldsGizmo(t)).toBe(false);
    expect(followTurnHoldsGizmo(null)).toBe(false);
  });

  it("his pace (D-H6): never slower than close in's speed; his own when faster (share 1); close in's at share 0; between, between", () => {
    expect(followTurnDegS(200 * D, 360, 1)).toBeCloseTo(360, 9);
    expect(followTurnDegS(900 * D, 360, 1)).toBeCloseTo(900, 9);
    expect(followTurnDegS(900 * D, 360, 0)).toBeCloseTo(360, 9);
    expect(followTurnDegS(900 * D, 360, 0.5)).toBeCloseTo(630, 9);
  });

  it("the dy hold (D-H8 = D-T4): only a turn OVER 90° with the crossing's own hold (the dy that pushed out and would bring it back)", () => {
    expect(followTurnHold(Math.PI, 1)).toBe(1);
    expect(followTurnHold(-Math.PI, -1)).toBe(-1);
    expect(followTurnHold(Math.PI / 2, 1)).toBe(0);
    expect(followTurnHold(Math.PI, 0)).toBe(0);
  });
});

describe("H2 — one frame of the follower with the top's rule (`followTopStep`)", () => {
  const K = { tauMs: 120, poleDeg: 30, minDeg: 10, rollDegS: 360, paceShare: 1 };
  const TOP: V = [0, 1, 0];
  const FAR: V = [0, 0, -1];
  const O: V = nrm([0, 0.9, 0.3]); // the orbit's place, still (his pace none)
  const UPS: V = nrm([0, 0.5, -0.866]); // the glass's up drawn from the +z side, looking down over the top
  const run = (s: FollowState | null, top: FollowTop | null, inp: FollowTopIn, n: number, dt = 7) => {
    let r = followTopStep(s, top, inp, dt, K);
    for (let i = 1; i < n; i++) r = followTopStep(r.s, r.top, inp, dt, K);
    return r;
  };

  it("settled on a face: the heading the reading, the height the asked one capped (80° asked → 60°)", () => {
    const r = run(null, null, { ask: dirAtHeading(0.3, 80 * D), orbit: dirAtHeading(0.3, 80 * D), psiL: 0.3, nW: TOP, upShown: UPS, dySign: 0 }, 400);
    expect(headingOf(r.s.dir)!).toBeCloseTo(0.3, 6);
    expect(Math.asin(r.s.dir[1]) / D).toBeCloseTo(60, 4);
    expect(r.top.turn).toBeNull();
  });

  it("a facet change with the reading 180° away: ONE turn, the heading exactly ψ0 + k·Δ (the turn owns it), the gizmo waiting, whole after |Δ| / speed", () => {
    const a = run(null, null, { ask: dirAtHeading(0, 50 * D), orbit: O, psiL: 0, nW: TOP, upShown: UPS, dySign: 1 }, 400);
    const inp: FollowTopIn = { ask: dirAtHeading(Math.PI, 50 * D), orbit: O, psiL: Math.PI, nW: FAR, upShown: UPS, dySign: 1 };
    let r = followTopStep(a.s, a.top, inp, 7, K);
    expect(Math.abs(r.delta!) / D).toBeCloseTo(180, 3);
    expect(r.hold).toBe(1); // a half turn the dy pushed: that dy held after it
    const t0 = r.top.turn!;
    expect(t0.durMs).toBeCloseTo(500, 1); // still asked: close in's 360°/s
    expect(followTurnHoldsGizmo(r.top.turn)).toBe(true);
    for (let i = 0; i < 40; i++) {
      const t = r.top.turn!;
      expect(wrap(headingOf(r.s.dir)! - (t.psi0 + t.k * t.delta))).toBeCloseTo(0, 9);
      r = followTopStep(r.s, r.top, inp, 7, K);
    }
    for (let i = 0; i < 40; i++) r = followTopStep(r.s, r.top, inp, 7, K);
    expect(r.top.turn).toBeNull();
    expect(Math.abs(wrap(headingOf(r.s.dir)! - Math.PI))).toBeLessThan(1e-6);
  });

  it("a facet change the reading crosses at once (a quarter, crossed by a dx): a turn, no hold; under the band: no turn, the spring pays", () => {
    const a = run(null, null, { ask: dirAtHeading(0, 40 * D), orbit: O, psiL: 0, nW: TOP, upShown: UPS, dySign: 0 }, 400);
    const q = followTopStep(a.s, a.top, { ask: dirAtHeading(0, 40 * D), orbit: O, psiL: Math.PI / 2, nW: [1, 0, 0], upShown: UPS, dySign: 0 }, 7, K);
    expect(q.top.turn).not.toBeNull();
    expect(q.hold).toBe(0);
    const n = followTopStep(a.s, a.top, { ask: dirAtHeading(0, 40 * D), orbit: O, psiL: 5 * D, nW: FAR, upShown: UPS, dySign: 1 }, 7, K);
    expect(n.top.turn).toBeNull();
    expect(n.hold).toBe(0);
  });

  it("no facet change, no turn and no hold — whatever the reading does (no turn in the middle of a face, T4)", () => {
    const a = run(null, null, { ask: dirAtHeading(0, 40 * D), orbit: O, psiL: 0, nW: TOP, upShown: UPS, dySign: 1 }, 400);
    const r = followTopStep(a.s, a.top, { ask: dirAtHeading(0, 40 * D), orbit: O, psiL: 3, nW: TOP, upShown: UPS, dySign: 1 }, 7, K);
    expect(r.top.turn).toBeNull();
    expect(r.hold).toBeUndefined();
  });

  it("CARRIED: no reading keeps the heading target; his pace raises the turn's speed (900°/s asked → a half turn in 200 ms)", () => {
    const a = run(null, null, { ask: dirAtHeading(0.7, 40 * D), orbit: O, psiL: 0.7, nW: TOP, upShown: UPS, dySign: 0 }, 300);
    const c = run(a.s, a.top, { ask: dirAtHeading(2, 40 * D), orbit: O, psiL: null, nW: TOP, upShown: UPS, dySign: 0 }, 300);
    expect(c.top.psiT).toBeCloseTo(0.7, 12);
    expect(headingOf(c.s.dir)!).toBeCloseTo(0.7, 6);
    // the orbit's direction moving at 900°/s on the crossing frame (6.3° in 7 ms)
    const b = followTopStep(c.s, { ...c.top, orbitWas: dirAtHeading(0.7, 40 * D) }, { ask: dirAtHeading(0.7, 46.3 * D), orbit: dirAtHeading(0.7, 46.3 * D), psiL: 0.7 + Math.PI, nW: FAR, upShown: UPS, dySign: 0 }, 7, K);
    expect(b.top.turn!.durMs).toBeCloseTo(200, 0);
  });
});
