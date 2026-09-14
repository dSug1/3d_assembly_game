/**
 * INERTIA — a CRITICALLY DAMPED follower, so a dragged object accelerates into motion
 * and decelerates out of it instead of teleporting with the finger.
 *
 * ⭐⭐ THE OWNER'S WORDS: *"a bit like physics applying a force to the object with some
 * inertia."* That is a second-order system, not a smoothing filter — a filter lags but
 * has no momentum, and the difference is exactly what "inauthentic" describes.
 *
 * ⛔⛔ CRITICALLY DAMPED, NOT UNDER-DAMPED. Under-damping overshoots and wobbles, which
 * reads as a bug in a manipulation tool ("it slid past where I put it"); over-damping is
 * just lag. Critical damping is the fastest approach with NO overshoot, which is the
 * only one of the three a person would call "weighty" rather than "broken".
 *
 * ⛔⛔ THE STEP IS THE EXACT ANALYTIC SOLUTION, NOT AN EULER INTEGRATION.
 * For `y = x − target` with natural frequency `ω = 1/τ`, critical damping gives
 *
 * ```
 *   y(t) = (y₀ + (v₀ + ω·y₀)·t) · e^(−ω·t)
 *   v(t) = (v₀ − ω·(v₀ + ω·y₀)·t) · e^(−ω·t)
 * ```
 *
 * which is textbook mathematics (the repeated-root case of a linear second-order ODE)
 * and therefore carries no licence — see `N13` and `THIRD_PARTY_NOTICES.md`. ⭐ It is
 * used because it is **unconditionally stable and frame-rate independent**: an explicit
 * Euler step with `dt` larger than `2τ` diverges, and a dropped frame on a tablet is
 * exactly when that happens. ⚠ Two frames of 8 ms must land in the same place as one
 * frame of 16 ms, or the feel of the drag becomes a function of the frame rate — a
 * composition nobody would think to check.
 *
 * ⛔ ENGINE-FREE, and SCALAR: a linear ODE solves componentwise, so the caller runs one
 * of these per axis and the three cannot disagree.
 */

export interface FollowState {
  /** Current value. */
  readonly x: number;
  /** Current rate of change, per second. */
  readonly v: number;
}

/**
 * Advance a critically damped follower towards `target` by `dtSec`.
 *
 * @param tauSec the time constant. ⭐ Roughly "how long the object takes to catch up":
 *   it covers ~63 % of the remaining gap in one `tau` from rest, and settles in ~5.
 *   ⛔ `0` (or less) means NO inertia — the follower snaps to the target exactly, which
 *   is the behaviour that shipped before this existed and must stay reachable, because
 *   it is the only setting that can be checked against the tracking factor.
 */
export function advanceFollow(
  state: FollowState,
  target: number,
  tauSec: number,
  dtSec: number,
): FollowState {
  // ⚠ A non-positive or non-finite dt happens for real — a duplicated timestamp, a tab
  // returning from the background. Do nothing rather than integrate nonsense; one NaN
  // written into a position is permanent.
  if (!(dtSec > 0) || !Number.isFinite(dtSec)) return state;
  if (!(tauSec > 0)) return { x: target, v: 0 };

  const omega = 1 / tauSec;
  const y0 = state.x - target;
  const v0 = state.v;
  // ⚠ `exp(-omega*dt)` underflows to 0 for a long stall, which is CORRECT here: the
  // object simply arrives. No special case needed, and no divergence.
  const decay = Math.exp(-omega * dtSec);
  const c = v0 + omega * y0;
  return {
    x: target + (y0 + c * dtSec) * decay,
    v: (v0 - omega * c * dtSec) * decay,
  };
}

/**
 * Is the follower close enough to stop integrating?
 * ⭐ Purely an optimisation hint for the caller — the maths converges on its own, and
 * nothing depends on the exact threshold.
 */
export function isSettled(state: FollowState, target: number, epsilon: number): boolean {
  return Math.abs(state.x - target) < epsilon && Math.abs(state.v) < epsilon;
}
