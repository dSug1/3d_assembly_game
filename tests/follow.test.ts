/**
 * GOLDEN VECTORS — the inertia follower.
 *
 * ⛔ The two that matter are FRAME-RATE INDEPENDENCE and STABILITY. Everything else here
 * is arithmetic; those two are the ones that turn into "it feels different on the tablet
 * than on the laptop" and "it exploded when a frame dropped", neither of which reads as
 * a numerical-integration problem when you are holding the device.
 */
import { describe, expect, it } from "vitest";
import {
  advanceFollow,
  impulseForPeak,
  isSettled,
  type FollowState,
} from "../src/input/follow";

const REST: FollowState = { x: 0, v: 0 };

/** Integrate from rest to a fixed target in `n` equal steps totalling `totalSec`. */
function run(target: number, tau: number, totalSec: number, n: number, zeta = 1): FollowState {
  let s = REST;
  for (let i = 0; i < n; i++) s = advanceFollow(s, target, tau, zeta, totalSec / n);
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
    const s = advanceFollow(REST, 1, 0.09, 1, 30);
    expect(Number.isFinite(s.x)).toBe(true);
    expect(s.x).toBeCloseTo(1, 9);
    expect(s.v).toBeCloseTo(0, 9);
  });

  it("⛔⛔ CRITICALLY DAMPED: it never overshoots the target", () => {
    // ⚠ Overshoot in a manipulation tool reads as a bug — "it slid past where I put it".
    let s = REST;
    for (let i = 0; i < 400; i++) {
      s = advanceFollow(s, 1, 0.09, 1, 1 / 120);
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
      s = advanceFollow(s, 1, 0.09, 1, 1 / 120);
      peak = Math.max(peak, s.v);
    }
    expect(peak).toBeGreaterThan(0);
    expect(s.v).toBeLessThan(peak / 100); // arrived, and slow
  });

  it("⛔⛔ tau = 0 is EXACT TRACKING — the pre-inertia behaviour stays reachable", () => {
    // ⭐ It is the only setting that can be checked against rule 6's tracking factor, so
    // it must be exact, not merely fast: a 'very small tau' would quietly break that.
    for (const tau of [0, -1]) {
      const s = advanceFollow({ x: 5, v: 99 }, 12.5, tau, 1, 1 / 60);
      expect(s.x).toBe(12.5);
      expect(s.v).toBe(0);
    }
  });

  it("⛔ a non-positive or non-finite dt changes nothing", () => {
    // ⚠ Duplicated timestamps are real. One NaN in a position is permanent.
    for (const dt of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(advanceFollow({ x: 3, v: 2 }, 9, 0.09, 1, dt)).toEqual({ x: 3, v: 2 });
    }
  });

  it("⭐ a MOVING target is followed, not just a step", () => {
    // The finger does not teleport — it drags. The follower must track a ramp with a
    // bounded lag rather than falling ever further behind.
    let s = REST;
    let target = 0;
    for (let i = 0; i < 600; i++) {
      target += 0.01; // 1.2 units/s at 120 Hz
      s = advanceFollow(s, target, 0.09, 1, 1 / 120);
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

/**
 * ⭐⭐ THE DAMPING RATIO — the parameter the owner asked for when direct tracking and
 * critical damping both felt wrong. It is what separates "a mass on a spring" from
 * "a smoothing filter".
 */
describe("inertia — the damping ratio, and Unity's model", () => {
  it("⭐⭐ UNDER-DAMPED CATCHES UP: less lag on a steady drag than critical", () => {
    // ⛔ THE OWNER'S REQUEST, MADE MEASURABLE: "more acceleration catch-up after the
    // inertia is overcome". Dragged at a constant rate, a follower trails by 2·ζ·τ·rate.
    // Halving ζ halves the trail — the object accelerates THROUGH the gap instead of
    // settling into it, which is what a mass does and what a filter cannot do.
    const drag = (zeta: number) => {
      let s = REST;
      let target = 0;
      for (let i = 0; i < 600; i++) {
        target += 0.01;
        s = advanceFollow(s, target, 0.09, zeta, 1 / 120);
      }
      return target - s.x;
    };
    const critical = drag(1);
    const catchUp = drag(0.5);
    expect(catchUp).toBeLessThan(critical * 0.6);
    expect(catchUp).toBeGreaterThan(0); // ⚠ it still trails — it is not direct tracking
  });

  it("⭐ UNDER-DAMPED OVERSHOOTS, and over-damped never does", () => {
    // ⚠ The overshoot is the price of the catch-up and the reason ζ is a slider: far
    // below 1 it rings, which reads as a bug rather than as weight.
    const peak = (zeta: number) => {
      let s = REST;
      let hi = 0;
      for (let i = 0; i < 400; i++) {
        s = advanceFollow(s, 1, 0.09, zeta, 1 / 120);
        hi = Math.max(hi, s.x);
      }
      return hi;
    };
    expect(peak(0.4)).toBeGreaterThan(1.2);
    expect(peak(0.8)).toBeGreaterThan(1);
    expect(peak(1)).toBeLessThanOrEqual(1 + 1e-12);
    expect(peak(2)).toBeLessThanOrEqual(1 + 1e-12);
  });

  it("⛔⛔ the three regimes AGREE at the boundary — no discontinuity at zeta = 1", () => {
    // ⚠ THREE DIFFERENT CLOSED FORMS, one physical system. Both non-critical forms
    // divide by a frequency that vanishes at ζ=1, so the seam is exactly where a naive
    // implementation produces a jump or a NaN — and a slider crosses it.
    const at = (zeta: number) => run(1, 0.09, 0.2, 24, zeta).x;
    const critical = at(1);
    const gap = (zeta: number) => Math.abs(at(zeta) - critical);

    // ⚠ THE TEST IS THAT THE GAP SCALES WITH Δζ, not that it is tiny. A gap of 4e-4 at
    // ζ=0.999 is REAL PHYSICS — the response genuinely depends on ζ — and an assertion
    // that it be smaller would be demanding the wrong thing, then be "fixed" by widening
    // a tolerance until the seam could hide inside it. A numerical discontinuity would
    // show up as a gap that does NOT shrink with Δζ.
    // ⚠ Sampled WELL OUTSIDE the critical band: `Math.abs(0.999 - 1)` is 9.99999…e-4 in
    // binary and `Math.abs(1.001 - 1)` is 1.00000…e-3, so the band's edge is not
    // symmetric and one of that pair silently takes the critical branch. Harmless in the
    // product — the two forms agree there to five places — but it would make this test
    // divide by zero, which is how the wart was found.
    for (const side of [-1, 1]) {
      expect(gap(1 + side * 0.1) / gap(1 + side * 0.01)).toBeGreaterThan(5);
      expect(gap(1 + side * 0.1) / gap(1 + side * 0.01)).toBeLessThan(20);
    }
    // …and the two sides approach the SAME value, from opposite directions.
    expect(gap(0.99)).toBeLessThan(1e-2);
    expect(gap(1.01)).toBeLessThan(1e-2);

    for (const z of [0.05, 0.2, 0.5, 0.9, 1, 1.1, 2, 5, 50]) {
      expect(Number.isFinite(at(z))).toBe(true);
    }
  });

  it("⭐⭐ it MATCHES PhysX's own integration at Unity's fixed 0.02 s timestep", () => {
    // ⛔ THE CLAIM "same model as Unity" IS MEASURED, NOT ASSERTED. PhysX, per
    // DyBodyCoreIntegrator.h: v += (F/m)·dt; v *= max(0, 1 − damping·dt); x += v·dt,
    // with force toward the target. Unity runs that at a FIXED 0.02 s step.
    const TAU = 0.09;
    const ZETA = 0.6;
    const omega = 1 / TAU;
    const physx = (dt: number, steps: number) => {
      let x = 0;
      let v = 0;
      for (let i = 0; i < steps; i++) {
        v += omega * omega * (1 - x) * dt; // AddForce, ForceMode.Acceleration
        v *= Math.max(0, 1 - 2 * ZETA * omega * dt); // linearDamping
        x += v * dt;
      }
      return x;
    };
    const dt = 0.02; // Unity's default fixed timestep
    const steps = 25; // half a second
    const ours = run(1, TAU, dt * steps, steps, ZETA).x;
    // ⚠ 8 % is the honest bar: this compares an EXACT solution against a first-order
    // one, and the gap IS PhysX's integration error, not ours. It is stated as a
    // measured difference rather than hidden in a loose tolerance.
    expect(Math.abs(ours - physx(dt, steps))).toBeLessThan(0.08);

    // ⭐ AND THE GAP IS PHYSX'S: as its timestep shrinks, it converges on us.
    const coarse = Math.abs(ours - physx(dt, steps));
    const fine = Math.abs(ours - physx(dt / 40, steps * 40));
    expect(fine).toBeLessThan(coarse / 10);
  });

  it("⛔ PhysX's damping formula is TIMESTEP-DEPENDENT — ours is not", () => {
    // ⚠ THE REASON UNITY'S ARITHMETIC WAS NOT COPIED. `(1 − c·dt)` is two terms of
    // `e^(−c·dt)`: the same drag decays differently at 30 Hz and 120 Hz, and at
    // dt > 1/c it clamps to a dead stop. Unity hides this behind a fixed timestep.
    // We render on a frame that stutters, so we cannot.
    const TAU = 0.09;
    const ZETA = 0.6;
    const omega = 1 / TAU;
    const physx = (dt: number, total: number) => {
      let x = 0;
      let v = 0;
      for (let i = 0; i < Math.round(total / dt); i++) {
        v += omega * omega * (1 - x) * dt;
        v *= Math.max(0, 1 - 2 * ZETA * omega * dt);
        x += v * dt;
      }
      return x;
    };
    // PhysX at two frame rates: visibly different trajectories.
    expect(Math.abs(physx(1 / 30, 0.3) - physx(1 / 120, 0.3))).toBeGreaterThan(0.02);
    // Ours at the same two frame rates: identical to twelve places.
    expect(run(1, TAU, 0.3, 9, ZETA).x).toBeCloseTo(run(1, TAU, 0.3, 36, ZETA).x, 12);
  });
});

describe("the sympathetic sway", () => {
  it("⭐⭐ the kick peaks at EXACTLY the asked-for displacement", () => {
    // ⛔ The property that makes the slider mean millimetres rather than coefficients.
    for (const [peak, tau] of [
      [2, 0.18],
      [0.5, 0.3],
      [8, 0.05],
    ]) {
      let s: FollowState = { x: 0, v: impulseForPeak(peak!, tau!) };
      let high = 0;
      const dt = 1 / 240;
      for (let i = 0; i < 4000; i++) {
        s = advanceFollow(s, 0, tau!, 1, dt);
        high = Math.max(high, s.x);
      }
      expect(high).toBeCloseTo(peak!, 3);
    }
  });

  it("⛔ it RETURNS to where it started, and does not overshoot the other way", () => {
    // ⚠ "Before returning to their initial position" — an object that settled anywhere
    // else would have silently moved the scene, and barycentres are computed from these
    // positions.
    let s: FollowState = { x: 0, v: impulseForPeak(3, 0.18) };
    let low = 0;
    for (let i = 0; i < 2000; i++) {
      s = advanceFollow(s, 0, 0.18, 1, 1 / 240);
      low = Math.min(low, s.x);
    }
    expect(low).toBeGreaterThanOrEqual(-1e-12); // ⛔ never crosses back past home
    expect(s.x).toBeCloseTo(0, 9);
    expect(s.v).toBeCloseTo(0, 9);
  });

  it("⛔ a zero or negative time constant yields no kick, not an infinity", () => {
    expect(impulseForPeak(2, 0)).toBe(0);
    expect(impulseForPeak(2, -1)).toBe(0);
    expect(impulseForPeak(Number.NaN, 0.18)).toBe(0);
  });
});
