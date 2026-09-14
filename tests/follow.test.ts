/**
 * GOLDEN VECTORS — the inertia follower.
 *
 * ⛔ The two that matter are FRAME-RATE INDEPENDENCE and STABILITY. Everything else here
 * is arithmetic; those two are the ones that turn into "it feels different on the tablet
 * than on the laptop" and "it exploded when a frame dropped", neither of which reads as
 * a numerical-integration problem when you are holding the device.
 */
import { describe, expect, it } from "vitest";
import { advanceFollow, isSettled, type FollowState } from "../src/input/follow";

const REST: FollowState = { x: 0, v: 0 };

/** Integrate from rest to a fixed target in `n` equal steps totalling `totalSec`. */
function run(target: number, tau: number, totalSec: number, n: number): FollowState {
  let s = REST;
  for (let i = 0; i < n; i++) s = advanceFollow(s, target, tau, totalSec / n);
  return s;
}

describe("inertia — the follower", () => {
  it("⭐⭐ FRAME-RATE INDEPENDENT: 120 Hz and 30 Hz land in the same place", () => {
    // ⛔ THE REASON THE STEP IS THE ANALYTIC SOLUTION. With an Euler step these differ,
    // and the drag would feel different on a device that renders slower — a difference
    // nobody would attribute to the integrator while holding a tablet.
    const a = run(1, 0.09, 0.5, 60); // 120 Hz
    const b = run(1, 0.09, 0.5, 15); // 30 Hz
    const c = run(1, 0.09, 0.5, 4); // a badly stuttering 8 Hz
    expect(a.x).toBeCloseTo(b.x, 12);
    expect(a.x).toBeCloseTo(c.x, 12);
    expect(a.v).toBeCloseTo(c.v, 12);
  });

  it("⛔⛔ STABLE for a dt far larger than the time constant", () => {
    // ⚠ A tab returning from the background delivers one enormous frame. Explicit Euler
    // diverges for dt > 2τ; this must simply arrive.
    const s = advanceFollow(REST, 1, 0.09, 30);
    expect(Number.isFinite(s.x)).toBe(true);
    expect(s.x).toBeCloseTo(1, 9);
    expect(s.v).toBeCloseTo(0, 9);
  });

  it("⛔⛔ CRITICALLY DAMPED: it never overshoots the target", () => {
    // ⚠ Overshoot in a manipulation tool reads as a bug — "it slid past where I put it".
    let s = REST;
    for (let i = 0; i < 400; i++) {
      s = advanceFollow(s, 1, 0.09, 1 / 120);
      expect(s.x).toBeLessThanOrEqual(1 + 1e-12);
    }
    expect(s.x).toBeCloseTo(1, 9);
  });

  it("⭐ it ACCELERATES: the first instants move less than direct tracking", () => {
    // ⛔ The whole point of the feature — the owner asked for acceleration, not lag.
    // From rest, a critically damped system leaves with ZERO velocity and builds up.
    const early = run(1, 0.09, 0.01, 1);
    expect(early.x).toBeLessThan(0.1);
    expect(early.v).toBeGreaterThan(0);
    // …and it is most of the way there after a few time constants.
    expect(run(1, 0.09, 0.27, 32).x).toBeGreaterThan(0.75);
  });

  it("⭐ it DECELERATES: velocity falls as it arrives", () => {
    let s = REST;
    let peak = 0;
    for (let i = 0; i < 200; i++) {
      s = advanceFollow(s, 1, 0.09, 1 / 120);
      peak = Math.max(peak, s.v);
    }
    expect(peak).toBeGreaterThan(0);
    expect(s.v).toBeLessThan(peak / 100); // arrived, and slow
  });

  it("⛔⛔ tau = 0 is EXACT TRACKING — the pre-inertia behaviour stays reachable", () => {
    // ⭐ It is the only setting that can be checked against rule 6's tracking factor, so
    // it must be exact, not merely fast: a 'very small tau' would quietly break that.
    for (const tau of [0, -1]) {
      const s = advanceFollow({ x: 5, v: 99 }, 12.5, tau, 1 / 60);
      expect(s.x).toBe(12.5);
      expect(s.v).toBe(0);
    }
  });

  it("⛔ a non-positive or non-finite dt changes nothing", () => {
    // ⚠ Duplicated timestamps are real. One NaN in a position is permanent.
    for (const dt of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(advanceFollow({ x: 3, v: 2 }, 9, 0.09, dt)).toEqual({ x: 3, v: 2 });
    }
  });

  it("⭐ a MOVING target is followed, not just a step", () => {
    // The finger does not teleport — it drags. The follower must track a ramp with a
    // bounded lag rather than falling ever further behind.
    let s = REST;
    let target = 0;
    for (let i = 0; i < 600; i++) {
      target += 0.01; // 1.2 units/s at 120 Hz
      s = advanceFollow(s, target, 0.09, 1 / 120);
    }
    // Steady-state lag of a critically damped follower on a ramp is 2·τ·rate — minus
    // half a step, because this loop advances the target BEFORE integrating, so the
    // target is on average half a frame ahead of the continuous ramp.
    // ⚠ The half-step is written out rather than absorbed into a loose tolerance: a
    // tolerance wide enough to hide it would also hide a wrong time constant.
    const rate = 1.2;
    const dt = 1 / 120;
    expect(target - s.x).toBeCloseTo(2 * 0.09 * rate - (rate * dt) / 2, 6);
  });

  it("isSettled reports arrival", () => {
    expect(isSettled({ x: 1.0001, v: 0.0001 }, 1, 0.01)).toBe(true);
    expect(isSettled({ x: 1.5, v: 0 }, 1, 0.01)).toBe(false);
    expect(isSettled({ x: 1, v: 5 }, 1, 0.01)).toBe(false);
  });
});
