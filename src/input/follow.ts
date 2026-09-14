/**
 * INERTIA — a MASS PULLED BY A FORCE, which is what Unity's rigid bodies are.
 *
 * ⭐⭐ THE OWNER'S BRIEF: *"a bit like physics applying a force to the object with some
 * inertia"*, and after the first attempt, *"it needs probably more acceleration catch-up
 * after the inertia is overcome. Check how Unity is doing rigid body translation with
 * force and reapply the same if this is not patented or licensed."*
 *
 * ## What Unity actually does, and whether we may use it
 *
 * Unity's 3D physics is **NVIDIA PhysX**, which has been **open source under the
 * BSD-3-Clause licence since 4.0 (December 2018)** — including, since the later update,
 * the GPU source. ⭐ So there is no licence bar and no patent claim asserted over it:
 * `N13` is satisfied either way, because what is reapplied here is the MODEL, which is
 * Newton, not anybody's code.
 *
 * PhysX integrates a body with **semi-implicit (symplectic) Euler**, and applies linear
 * damping as a per-step multiplier. From `DyBodyCoreIntegrator.h`:
 *
 * ```
 *   v += (F/m)·dt
 *   v *= max(0, 1 − linearDamping·dt)      // bodyCoreComputeUnconstrainedVelocity
 *   x += v·dt                              // integrateCore
 * ```
 *
 * ⛔⛔ **AND THAT DAMPING TERM IS TIMESTEP-DEPENDENT — a known flaw, raised upstream.**
 * `(1 − c·dt)` is the first two terms of `e^(−c·dt)`, so the same drag setting decays
 * differently at 30 Hz and at 120 Hz, and at `dt > 1/c` it clamps to a dead stop. Unity
 * only gets away with it by running physics at a **FIXED 0.02 s timestep** decoupled
 * from rendering.
 *
 * ⭐⭐ SO THIS REAPPLIES UNITY'S MODEL AND NOT UNITY'S ARITHMETIC: the same mass-spring-
 * damper a dragged rigid body obeys, integrated by its **exact analytic solution**
 * instead of a first-order approximation that needs a fixed timestep to stay honest.
 * The two agree in the limit, and a vector MEASURES the difference at Unity's own
 * 0.02 s step rather than asserting it. ⚠ We have no fixed-timestep loop to hide behind
 * — this runs on the render frame, which stutters — so frame-rate independence is not a
 * nicety here, it is the requirement.
 *
 * ## The parameter that produces "catch-up"
 *
 * Force toward the target and damping opposing velocity give
 * `ẍ = −ω²·(x − target) − 2ζω·ẋ`, where `ω = 1/τ` and `ζ` is the damping ratio —
 * exactly `AddForce` with `linearDamping = 2ζω`.
 *
 * ⭐ **`ζ` IS THE KNOB THE OWNER IS ASKING FOR.** At `ζ = 1` (critical damping, the
 * first attempt) the object takes the slowest path that never overshoots: it eases in
 * and, dragged at a steady rate, trails by `2τ·rate` for ever. Below 1 it builds more
 * speed, closes the gap — trailing only `2ζτ·rate` — and arrives with a small overshoot.
 * That acceleration *through* the gap is what a mass on a spring does and what
 * "catch-up after the inertia is overcome" describes.
 * ⚠ Far below 1 it rings, which reads as a bug rather than as weight. The slider exists
 * to find the line; `ζ` is not a number anyone should guess.
 *
 * ⛔ ENGINE-FREE, and SCALAR: a linear ODE solves componentwise, so the caller runs one
 * per axis and the three cannot disagree.
 */

export interface FollowState {
  /** Current value. */
  readonly x: number;
  /** Current rate of change, per second. */
  readonly v: number;
}

/**
 * Advance a mass-spring-damper towards `target` by `dtSec`.
 *
 * @param tauSec the time constant `1/ω`. ⭐ Roughly how long the object takes to catch
 *   up. ⛔ `0` or less means NO inertia — it snaps to the target exactly. That setting
 *   must stay reachable: it is the only one that can be checked against rule 6's
 *   tracking factor.
 * @param zeta the damping ratio. `1` = critically damped (no overshoot, slowest
 *   non-overshooting approach), `< 1` = under-damped (accelerates through the gap and
 *   overshoots a little — the "catch-up"), `> 1` = over-damped (sluggish).
 *   ⚠ Clamped to be positive: zero would be a frictionless spring that oscillates for
 *   ever, which is not a thing anyone wants to drag.
 */
export function advanceFollow(
  state: FollowState,
  target: number,
  tauSec: number,
  zeta: number,
  dtSec: number,
): FollowState {
  // ⚠ A non-positive or non-finite dt happens for real — a duplicated timestamp, a tab
  // returning from the background. Do nothing rather than integrate nonsense; one NaN
  // written into a position is permanent.
  if (!(dtSec > 0) || !Number.isFinite(dtSec)) return state;
  if (!(tauSec > 0)) return { x: target, v: 0 };

  const omega = 1 / tauSec;
  const z = Math.max(1e-4, zeta);
  const y0 = state.x - target;
  const v0 = state.v;

  // ⚠ The three regimes are three DIFFERENT closed forms — the characteristic equation
  // has a repeated root only at exactly ζ=1. A band around 1 uses the critical form,
  // because both other forms divide by a damped frequency that goes to zero there and
  // the arithmetic loses all its precision long before the root is actually repeated.
  if (Math.abs(z - 1) < 1e-3) {
    const decay = Math.exp(-omega * dtSec);
    const c = v0 + omega * y0;
    return {
      x: target + (y0 + c * dtSec) * decay,
      v: (v0 - omega * c * dtSec) * decay,
    };
  }

  if (z < 1) {
    // Under-damped: it rings as it decays. THE REGIME THAT CATCHES UP.
    const wd = omega * Math.sqrt(1 - z * z);
    const decay = Math.exp(-z * omega * dtSec);
    const cos = Math.cos(wd * dtSec);
    const sin = Math.sin(wd * dtSec);
    return {
      x: target + decay * (y0 * cos + ((v0 + z * omega * y0) / wd) * sin),
      v: decay * (v0 * cos - ((omega * omega * y0 + z * omega * v0) / wd) * sin),
    };
  }

  // Over-damped: two real roots, no oscillation, slower than critical.
  const s = omega * Math.sqrt(z * z - 1);
  const r1 = -z * omega + s;
  const r2 = -z * omega - s;
  const a = (v0 - r2 * y0) / (r1 - r2);
  const b = y0 - a;
  const e1 = Math.exp(r1 * dtSec);
  const e2 = Math.exp(r2 * dtSec);
  return {
    x: target + a * e1 + b * e2,
    v: a * r1 * e1 + b * r2 * e2,
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

/**
 * The velocity kick that makes a follower at rest swing out to `peak` and come back.
 *
 * ⭐⭐ THE SYMPATHETIC SWAY. When the held object starts moving, every OTHER object is
 * nudged the same way and springs home — so the scene reacts instead of standing frozen
 * around the one thing that moves.
 *
 * ⛔ A VELOCITY, NOT A DISPLACEMENT. Setting the offset to `peak` outright would be a
 * JUMP, which is the opposite of subtle; kicking the velocity makes the object drift out
 * and ease back, which is what a soft spring does and what was asked for.
 *
 * ⚠ Critically damped, from rest at the origin, the response to a kick is
 * `x(t) = v₀·t·e^(−t/τ)`, whose maximum is at `t = τ` and equals `v₀·τ/e`. So the kick
 * for a wanted peak is `v₀ = peak·e/τ` — ⭐ closed form, so the slider's number IS the
 * millimetres the other objects will move, not a coefficient that has to be discovered.
 * ⚠ It is exact only at `ζ = 1`; softer or stiffer damping changes the peak, which is
 * why the sway runs critically damped and only its amplitude and softness are tunable.
 */
export function impulseForPeak(peak: number, tauSec: number): number {
  if (!(tauSec > 0) || !Number.isFinite(peak)) return 0;
  return (peak * Math.E) / tauSec;
}
