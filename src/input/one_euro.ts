/**
 * THE 1€ FILTER — an adaptive low-pass filter for noisy interactive input.
 *
 * ⭐⭐ THIS IS THE `METHOD`-SANCTIONED KIND OF FIX: *"a reconsidered model with
 * literature backing"*, not a special-case rule bolted onto an output to patch one
 * observed failure. Three rounds of device feedback had me tuning an estimator
 * against a noise model I had invented, which is precisely the trap.
 *
 * ⭐ Casiez, Roussel & Vogel, **"1€ Filter: A Simple Speed-based Low-pass Filter for
 * Noisy Input in Interactive Systems"**, CHI 2012 (ACM, doi 10.1145/2207676.2208639).
 * Reference implementations at https://gery.casiez.net/1euro/ — the TypeScript, JS,
 * Java, C++, Python and Arduino ones are **BSD**, the C and C++-template ones
 * **MIT**, and **no patent restriction is asserted** on the algorithm or the code.
 *
 * ⚠ THIS IS AN INDEPENDENT IMPLEMENTATION FROM THE PAPER, not copied code, so no
 * licence text attaches to it. The citation stands regardless — it is the authors'
 * algorithm. Recorded in `THIRD_PARTY_NOTICES` per `SEC0`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ⭐⭐ WHY THIS ONE, AND WHY IT FITS WHAT THE DEVICE REPORTED.
 *
 * The owner's two observations were: *"while rolling the cube jitters"* at slow
 * speed, and *"fast swirl is working OK (it is actually better than slow roll
 * because any jitter is masked by the fast movement)"*.
 *
 * That asymmetry IS the filter's premise. People are sensitive to **jitter at low
 * speed** and to **lag at high speed**, and a fixed low-pass cannot serve both. The
 * 1€ filter varies its cutoff with the signal's own speed: low speed ⇒ low cutoff ⇒
 * heavy smoothing; high speed ⇒ high cutoff ⇒ little lag.
 *
 * ⭐ In a published comparison it showed the smallest standard error of the filters
 * tried — ahead of LaViola's double exponential smoothing, a moving average, a
 * Kalman filter, and single exponential smoothing.
 *
 * ⛔ WHAT WAS REJECTED, AND WHY (state of the art, briefly):
 * * **Kalman filter** — needs a motion model for a finger, which nobody has; more
 *   parameters to tune blind, ~100× slower in the DES comparison, and it measured
 *   no better here. A model nobody can justify is not an improvement.
 * * **Double exponential smoothing** (LaViola, IPT/EGVE 2003) — genuinely good and
 *   far cheaper than Kalman, but measured slightly worse than 1€, and its single
 *   smoothing factor cannot be jitter-quiet AND lag-free at once. That is the exact
 *   trade this problem is stuck on.
 * * **A longer estimation baseline** — measured: it buys about 25–30% and costs
 *   responsiveness linearly. Not the lever.
 * * **Least-squares / circle fitting** — measured: ~25% better than endpoint
 *   direction, and a fitted centre's own noise eats the radius lever-arm it was
 *   supposed to buy. Not the lever either.
 *
 * ⚠ TWO PARAMETERS, AND THE PAPER'S OWN TUNING ADVICE: set `beta` to 0 first and
 * lower `minCutoff` until slow-movement jitter is acceptable; then raise `beta`
 * until fast movement has no perceptible lag. ⛔ That is a DEVICE procedure, so both
 * numbers are `IN5` rows like every other tunable here.
 */

/** ⚠ Cutoffs are in Hz; `beta` is in units of 1/(signal unit), both data-dependent. */
export interface OneEuroConfig {
  /** Hz. The floor cutoff, which governs jitter when the signal is slow. */
  readonly minCutoff: number;
  /** Speed coefficient. Raise it until fast movement stops lagging. */
  readonly beta: number;
  /** Hz. Cutoff for the internal speed estimate. The paper's default is 1.0. */
  readonly dCutoff: number;
}

/** A plain first-order low-pass, holding only its own last output. */
class LowPass {
  private y: number | null = null;

  reset(): void {
    this.y = null;
  }

  get last(): number | null {
    return this.y;
  }

  filter(x: number, alpha: number): number {
    this.y = this.y === null ? x : alpha * x + (1 - alpha) * this.y;
    return this.y;
  }
}

const alphaFor = (cutoffHz: number, dtSeconds: number): number => {
  const tau = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + tau / dtSeconds);
};

export class OneEuroFilter {
  private readonly x = new LowPass();
  private readonly dx = new LowPass();
  private prevX: number | null = null;
  private prevT: number | null = null;

  constructor(private readonly cfg: OneEuroConfig) {}

  reset(): void {
    this.x.reset();
    this.dx.reset();
    this.prevX = null;
    this.prevT = null;
  }

  /** `t` in milliseconds, to match every other timestamp in this project. */
  filter(value: number, t: number): number {
    const prevT = this.prevT;
    this.prevT = t;

    // ⚠ First sample, or a duplicated/backwards timestamp: there is no interval to
    // divide by. Pass the value through rather than inventing a rate — a fabricated
    // speed would drive the cutoff, which is the one thing this filter decides on.
    if (prevT === null || t <= prevT) {
      this.prevX = value;
      return this.x.filter(value, 1);
    }

    const dt = (t - prevT) / 1000;
    const rate = this.prevX === null ? 0 : (value - this.prevX) / dt;
    this.prevX = value;

    const smoothedRate = this.dx.filter(rate, alphaFor(this.cfg.dCutoff, dt));
    // ⭐ THE WHOLE IDEA, IN ONE LINE: the cutoff rises with the signal's own speed.
    const cutoff = this.cfg.minCutoff + this.cfg.beta * Math.abs(smoothedRate);
    return this.x.filter(value, alphaFor(cutoff, dt));
  }
}
