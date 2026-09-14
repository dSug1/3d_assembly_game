/**
 * MEASURES `pointerNoiseMm` — the one number several other thresholds are only
 * defensible relative to.
 *
 * ⭐⭐ IT IS THE FIRST `IN5` ROW, and it is first because the **sagitta criterion**
 * depends on it: a chord of length `L` across a circle of radius `R` bows from the
 * straight line by `L²/(8R)`, and if that bow does not clear the pointer's own noise
 * the measured curvature is noise. ⛔ Getting it wrong once already took roll off the
 * device entirely — a slow circular sweep registered 0.0° after 300° of travel.
 *
 * ⛔⛔ THE STATISTIC IS THE POINT, AND IT IS EASY TO MEASURE THE WRONG ONE.
 * A finger resting on glass produces two different things at once:
 *
 *   * **sensor noise** — high frequency, sample to sample, which is what
 *     `pointerNoiseMm` means and what the sagitta criterion is judged against;
 *   * **hand tremor and drift** — low frequency, often much larger, and NOT a
 *     property of the digitiser at all.
 *
 * ⭐ A naive spread over a long hold measures mostly tremor and would overstate the
 * noise several times over — which would then forbid perfectly good configs through
 * the sagitta rule. So deviation is taken from a **short trailing mean**: over a
 * fraction of a second a hand barely drifts, and what remains is the sensor.
 *
 * ⭐⭐ AND THE ANSWER IS THE **MINIMUM** OBSERVED, not the average. Any movement can
 * only *raise* a reading, never lower it below the sensor's own floor — so the
 * quietest window during a hold is the best estimate, and the measurement cannot be
 * spoiled by a finger that shifts halfway through. ⚠ `METHOD`: *the instrument is a
 * suspect* — this one is built so that the common ways of holding a finger badly
 * produce an obviously WORSE number rather than a plausible wrong one.
 */
import { pxToMm } from "../core/units";
import type { Sample } from "./motion";

/**
 * Samples per trailing window. ⚠ Not a tunable: at 60–120 Hz this is roughly a
 * quarter of a second, chosen so a hand cannot drift far within one window while
 * still leaving enough samples for an RMS to mean anything.
 */
const WINDOW = 32;

/** Below this the window has not filled and any statistic from it is noise about noise. */
const MIN_SAMPLES = 8;

export class PointerNoiseMeter {
  private window: Sample[] = [];
  private floor = Number.POSITIVE_INFINITY;
  private total = 0;

  reset(): void {
    this.window = [];
    this.floor = Number.POSITIVE_INFINITY;
    this.total = 0;
  }

  push(s: Sample): void {
    this.window.push(s);
    if (this.window.length > WINDOW) this.window.shift();
    this.total++;
    const rms = this.rmsMm;
    if (Number.isFinite(rms)) this.floor = Math.min(this.floor, rms);
  }

  get samples(): number {
    return this.total;
  }

  /**
   * RMS distance of the trailing window from its own mean, in millimetres —
   * the *current* reading, which rises the moment the finger moves.
   */
  get rmsMm(): number {
    const n = this.window.length;
    if (n < MIN_SAMPLES) return Number.NaN;
    let mx = 0;
    let my = 0;
    for (const p of this.window) {
      mx += p.x;
      my += p.y;
    }
    mx /= n;
    my /= n;
    let sq = 0;
    for (const p of this.window) {
      const dx = p.x - mx;
      const dy = p.y - my;
      sq += dx * dx + dy * dy;
    }
    // ⚠ Distance from the mean POINT, not per-axis: the sagitta criterion compares it
    // against a bow measured in the plane, so a per-axis figure would be the wrong
    // quantity by a factor of √2 and nothing would notice.
    return pxToMm(Math.sqrt(sq / n));
  }

  /**
   * ⭐ THE ANSWER: the quietest trailing window seen since the last reset. `NaN` until
   * enough samples have arrived to mean anything — never 0, which would look like a
   * perfect sensor rather than an absent measurement.
   */
  get floorMm(): number {
    return Number.isFinite(this.floor) ? this.floor : Number.NaN;
  }
}
