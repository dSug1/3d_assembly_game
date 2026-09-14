/**
 * THE PHANTOM TARGET — rule 6's velocity lead.
 *
 * ⭐⭐ THE OWNER'S BRIEF: *"create a phantom target with the current motion and the cube
 * slerps to this target, with a slider."* So the object no longer chases the finger; it
 * chases a point **projected ahead of the finger along the finger's current motion**,
 * and the mass-spring-damper of `follow.ts` is the thing that does the chasing.
 *
 * ⛔⛔ WHY THIS IS NOT JUST "A STIFFER SPRING". It is worth stating, because the cheap
 * version of this idea is exactly that and it buys nothing. Deriving the lead from the
 * gap — `phantom = target + k·(target − x)` — gives `(1+k)·(target − x)`, which is
 * algebraically a spring with a different `ω` and `ζ`. It is the knobs we already have,
 * wearing a hat. ⭐ A REAL lead needs an INDEPENDENT signal, and that signal is the
 * **target's own velocity**: feed-forward, not more feedback.
 *
 * ⭐⭐ AND THERE IS A DISTINGUISHED VALUE, not a matter of taste. Dragged at a steady
 * rate, the follower trails by `2·ζ·τ·rate` (see `follow.ts`). The phantom leads by
 * `lead·rate`. So at
 *
 * ```
 *   lead = 2·ζ·τ
 * ```
 *
 * the two cancel **exactly** and the object sits ON the finger during a steady drag —
 * while keeping all of its mass in the transients, which is the part that was wanted.
 * ⚠ Above that it runs AHEAD of the finger, which looks eager; below, it still trails.
 * ⛔ For the shipped pair (τ = 15 ms, ζ = 0.35) that value is **10.5 ms**.
 *
 * ⛔⛔ THE VELOCITY IS SMOOTHED, AND THE BASELINE IS STATED.
 * ⚠ **MISTAKE SHAPE 1** — *a rate estimated over the shortest available baseline* — has
 * cost this project three defects already, and a lead built on a two-sample difference
 * would be the fourth: the difference is noise divided by a few milliseconds, and it
 * gets MULTIPLIED here and written straight into where the object is drawn. So the
 * velocity is an exponential average over the object's OWN time constant. ⭐ That also
 * means no second slider: the lead is estimated at the timescale the object moves at,
 * which is the only timescale that can matter to it.
 *
 * ⛔ ENGINE-FREE and scalar, like everything else in this folder.
 */

/**
 * Exponentially smooth `value` into `prev` with time constant `tauSec`.
 *
 * ⛔ `1 − e^(−dt/τ)`, NOT a fixed per-frame fraction. A fixed fraction makes the
 * smoothing depend on the frame rate — the same defect PhysX's damping has (see
 * `follow.ts`), and the same reason it was not copied.
 */
export function exponentialSmooth(
  prev: number,
  value: number,
  tauSec: number,
  dtSec: number,
): number {
  if (!(dtSec > 0) || !Number.isFinite(dtSec)) return prev;
  if (!(tauSec > 0)) return value;
  return prev + (value - prev) * (1 - Math.exp(-dtSec / tauSec));
}

/**
 * Where the phantom sits: the target, projected along its own smoothed velocity.
 *
 * @param velocity units per second, already smoothed
 * @param leadSec  how far ahead to project. `0` = no phantom, the object chases the
 *   finger itself — ⛔ which must stay exactly reachable, since it is the behaviour
 *   every earlier vector was written against.
 */
export function phantomTarget(target: number, velocity: number, leadSec: number): number {
  if (!(leadSec > 0) || !Number.isFinite(velocity)) return target;
  return target + velocity * leadSec;
}

/**
 * The lead at which a steady drag leaves NO gap between object and finger.
 * ⭐ Exposed so the readout and the docs can state it rather than restate the algebra,
 * and so the slider has a landmark instead of a range of equally arbitrary numbers.
 */
export function neutralLeadSec(tauSec: number, zeta: number): number {
  return 2 * zeta * tauSec;
}
