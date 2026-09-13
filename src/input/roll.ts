/**
 * §1.3 — ROLL DETECTION (rule 2quinte), running inside `COMMITTED_CONTINUOUS`.
 *
 * ⛔⛔ THE SPEC'S READING CANNOT FIRE AT `rollAngle`, AND THIS IS THE DEPARTURE.
 * §1.3 asks for *"signed angle accumulated about the running centroid of the path"*.
 * **The centroid of an ARC is not its centre.** For a uniform arc of total angle
 * `2α` at radius `R`, the centroid sits at `R·sin(α)/α` from the true centre — so at
 * the 60° `rollAngle` wants to commit at, the running centroid is at **0.955 R**:
 * essentially ON the path, not at its centre. The angle measured about it is not the
 * swept angle at all; it only becomes one as the gesture approaches a FULL turn,
 * where the centroid finally reaches the centre. Committing at a sixth of a turn
 * about a centroid sitting on the arc measures noise.
 *
 * ⭐ SO THIS ACCUMULATES THE SIGNED TURNING ANGLE OF THE PATH — the change in the
 * path's direction. For a circular arc that **equals its central angle exactly**,
 * and it needs no centre estimate at all.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ⛔⛔ AND DIRECTION IS MEASURED OVER A BASELINE OF `rollStepDistance`, NEVER
 * BETWEEN CONSECUTIVE SAMPLES. Device-reported 2026-09-13: *"while rolling the cube
 * jitters, if I pause the circular finger movement and start again, the cube also
 * jitters a lot."*
 *
 * Consecutive pointer samples are a few pixels apart, so ±0.5 px of digitiser noise
 * swings each tiny segment's direction by several degrees and the TURN between two
 * of them by several more. ⭐ Measured: a clean circle steps 5.0° per sample; the
 * same circle with ±0.5 px of noise produced steps of up to **46.3°** — nine times
 * the true value, applied straight to the object every frame.
 *
 * ⛔⛔ A PAUSED FINGER WAS THE WORSE CASE. Three near-coincident noisy points have a
 * meaningless circumradius; it fell below `rollRadiusMin`, which ZEROED the
 * accumulator, and the object snapped back to where the roll began. Measured drift
 * across one pause: **−46.3°**, for a finger that was holding still.
 *
 * ⭐⭐ THE BASELINE IS A TRAILING WINDOW, AND IT IS RE-MEASURED EVERY SAMPLE. An
 * earlier fix only emitted a direction once per `rollStepDistance` travelled; that
 * killed the noise and the pause drift outright, but the object then turned in
 * ~15° QUANTISED JUMPS, which trades jitter for judder. Measuring the newest sample
 * against the most recent sample at least `rollStepDistance` behind it gives a full
 * baseline on EVERY sample: smooth, and still noise-bounded by the baseline the
 * caller chose rather than by whatever the digitiser happened to do.
 *
 * ⛔⛔ AND THE ESTIMATE IS RE-EVALUATED ON PATH PROGRESS, NOT ON ARRIVING SAMPLES.
 * The trailing window alone still drifted **+30.2° across a pause**, and the reason
 * is subtle: the direction depends on BOTH ends of the baseline. When the finger
 * stops, the newest point holds still while the baseline START keeps creeping
 * forward along the arc already travelled, so the measured direction swings although
 * the path is not turning at all. The accumulated angle then counts the baseline's
 * own motion as if the finger had made it.
 *
 * ⭐ So a new estimate is taken only once the newest point has itself advanced
 * `rollUpdateDistance`. Both ends of the baseline then move together, which is the
 * only condition under which the difference of two direction estimates is the turn
 * of the path. A paused finger produces no evaluation at all, so nothing accumulates.
 *
 * ⭐⭐ THE TWO DISTANCES ARE INDEPENDENT AND BOTH ARE NEEDED: `rollStepDistance` is
 * the BASELINE, and it sets how much digitiser noise reaches the angle;
 * `rollUpdateDistance` is the CADENCE, and it sets how finely the object follows the
 * finger. Collapsing them into one number is what forced the earlier choice between
 * a jittery roll and a juddering one.
 *
 * ⚠ This is the same correction `flick.ts` needed for its lift speed, and `METHOD`
 * names it: *print the aggregation, not just the value.* A single sample pair is the
 * noisiest possible estimator of any rate, and no threshold rescues one.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐⭐ ROLL RELEASES WHEN THE PATH STOPS BEING CIRCULAR. Device-reported
 * 2026-09-13: *"when I do a circular finger movement followed immediately by a
 * linear finger movement, there is no smooth transition between roll and yaw/pitch:
 * the linear finger movement instead control an erratic movement which jitters and
 * snaps with big amplitude."*
 *
 * ⛔ The commit used to LATCH for the whole gesture, so a straight drag after a
 * circle was still read as roll — and the turn from the circle's tangent onto the
 * new line is a large, genuine direction change, applied in one step. That is the
 * "snap with big amplitude".
 *
 * ⭐ Rule 2quinte's own condition is *"delta position has a circular movement"*, so
 * when the movement stops being circular the rule should stop applying. Commit is
 * the ENTRY hysteresis; `rollReleaseDistance` is the EXIT hysteresis — the same
 * shape as §1.1's `STATIONARY`/`MOVING` pair, which the project already accepts.
 * ⚠ §1.3 reads as a latch, so this is a spec amendment and the owner's to ratify.
 * Recorded in `Claude/10_INPUT_TOUCH/INDEX.md`.
 *
 * ⛔ SIGN, DECLARED, BECAUSE A SIGN IS NOT TESTED BY TESTING THE MAGNITUDE:
 * screen coordinates run x right and **y DOWN**, so a positive cross product is a
 * turn from +x toward +y — which is **CLOCKWISE AS SEEN ON THE SCREEN**.
 *
 *     accumulatedDeg > 0  ⇒  CLOCKWISE on screen
 *     accumulatedDeg < 0  ⇒  COUNTER-CLOCKWISE on screen
 */
import { mmToPx, pxToMm } from "../core/units";
import type { GestureConfig } from "./gestureConfig";
import type { Sample } from "./motion";
import { OneEuroFilter } from "./one_euro";

/** Guards the degenerate circumradius only; the baseline gate handles the rest. */
const EPSILON_PX = 1e-9;

/**
 * ⚠ A hard cap so a long pause cannot grow the window without bound. Reaching it
 * drops the baseline, so the direction becomes unavailable and the roll HOLDS —
 * which is the correct reading of a finger that has stopped for that long.
 */
const MAX_WINDOW_SAMPLES = 256;

const dist = (a: Sample, b: Sample): number => Math.hypot(a.x - b.x, a.y - b.y);

export class RollDetector {
  /** Trailing samples, oldest first. `[0]` is the baseline start once it spans. */
  private window: Sample[] = [];
  /** Where the newest point was when the direction was last evaluated. */
  private lastEvalAt: Sample | null = null;
  /** Path travelled, in px, since the path last looked circular. Exit hysteresis. */
  private offBandPx = 0;
  private prevDirRad: number | null = null;
  private accumDeg = 0;
  private smoothDeg = 0;
  private committedFlag = false;
  private readonly filter: OneEuroFilter;

  constructor(private readonly cfg: GestureConfig) {
    this.filter = new OneEuroFilter({
      minCutoff: cfg.rollFilterMinCutoff,
      beta: cfg.rollFilterBeta,
      dCutoff: 1.0,
    });
  }

  /**
   * ⭐ Signed: positive is CLOCKWISE on screen. See the header.
   * ⚠ RAW — this is what the COMMIT decision reads, deliberately unfiltered so the
   * threshold is not delayed by smoothing.
   */
  get accumulatedDeg(): number {
    return this.accumDeg;
  }

  /**
   * ⭐⭐ THE ANGLE TO ROTATE BY. 1€-filtered (`one_euro.ts`): heavy smoothing while
   * the roll is slow, where the eye sees jitter; almost none while it is fast, where
   * the eye sees lag. The device reported exactly that asymmetry.
   * ⛔ Filtering the DISPLAYED angle and not the COMMIT signal is deliberate: the
   * commit is a threshold crossing, and lagging it would make the gesture feel late.
   */
  get smoothedDeg(): number {
    return this.smoothDeg;
  }

  /**
   * Latches — and only this latches. ⚠ `accumulatedDeg` keeps growing afterwards,
   * because 2quinte needs an ongoing angle to roll BY. §1.3: once roll is committed
   * the flick test is skipped.
   */
  get committed(): boolean {
    return this.committedFlag;
  }

  reset(): void {
    this.window = [];
    this.lastEvalAt = null;
    this.offBandPx = 0;
    this.prevDirRad = null;
    this.accumDeg = 0;
    this.smoothDeg = 0;
    this.committedFlag = false;
    this.filter.reset();
  }

  push(s: Sample): void {
    const baselinePx = mmToPx(this.cfg.rollStepDistance);
    this.window.push(s);
    // ⛔⛔ THE PROGRESS GATE. Without it a stationary finger still produces new
    // direction estimates, because the baseline START keeps advancing underneath it.
    // See the header: that alone drifted +30.2° across a single pause.
    if (
      this.lastEvalAt !== null &&
      dist(s, this.lastEvalAt) < mmToPx(this.cfg.rollUpdateDistance)
    ) {
      return;
    }
    // Keep the shortest trailing window that still spans the baseline: drop the
    // oldest while the next one is still far enough back to serve as the start.
    //
    // ⛔⛔ NEVER BELOW THREE SAMPLES, and that bound is load-bearing. With `>= 3`
    // here, a finger moving further than `rollStepDistance` BETWEEN SAMPLES pruned
    // the window down to two, the length check below then rejected every evaluation,
    // and roll detection stopped working ENTIRELY — silently, reporting "no roll".
    // A fast swirl, or a 60 Hz digitiser, reaches that in normal use. `METHOD`: a
    // guard that turns a missing case into silence is worse than a failure.
    // ⭐ Keeping three means the baseline simply spans more than asked for when
    // samples are coarse, which is the honest reading of the data available.
    while (this.window.length > 3 && dist(this.window[1]!, s) >= baselinePx) {
      this.window.shift();
    }
    if (this.window.length > MAX_WINDOW_SAMPLES) this.window.shift();

    const from = this.window[0]!;
    // ⛔ Not yet a full baseline — measuring over a shorter one is exactly the noise
    // this file exists to avoid, so nothing is measured at all.
    if (this.window.length < 3 || dist(from, s) < baselinePx) return;

    const stepPx = this.lastEvalAt === null ? 0 : dist(this.lastEvalAt, s);
    this.lastEvalAt = s;
    const dirRad = Math.atan2(s.y - from.y, s.x - from.x);
    const radiusMm = this.curvatureRadiusMm(from, s);
    const inBand =
      radiusMm >= this.cfg.rollRadiusMin && radiusMm <= this.cfg.rollRadiusMax;

    // ⭐⭐ THE RADIUS BAND IS A COMMIT CRITERION, NOT A TRACKING ONE. It answers
    // "is this gesture a roll?", and once that is answered the answer does not get
    // re-asked every sample. Gating the TRACKING on it meant a momentarily noisy
    // radius estimate froze the roll mid-gesture: measured at 18% of post-commit
    // samples held, which is felt as stutter. ⛔ A straight stretch needs no gate
    // anyway — it has no turning, so it accumulates nothing by itself.
    if (this.committedFlag) {
      // ⭐⭐ EXIT HYSTERESIS. A committed roll survives a brief wobble out of the
      // band, but a sustained non-circular stretch RELEASES it, so the gesture hands
      // back to yaw/pitch instead of reading a straight drag as an enormous turn.
      this.offBandPx = inBand ? 0 : this.offBandPx + stepPx;
      if (this.offBandPx >= mmToPx(this.cfg.rollReleaseDistance)) {
        this.committedFlag = false;
        // ⛔ Reset, so re-entering a circle must earn `rollAngle` again rather than
        // resuming from an angle the finger has since abandoned.
        this.accumDeg = 0;
        this.offBandPx = 0;
        this.prevDirRad = dirRad;
        // ⛔ The filter carries state; leaving it primed with the old angle would
        // make the next roll start by racing back to an angle nobody asked for.
        this.filter.reset();
        this.smoothDeg = 0;
        return;
      }
      this.accumDeg += this.turnDeg(dirRad);
    } else {
      // ⛔⛔ THE BAND IS HYSTERETIC ON THIS SIDE TOO, and it has to be. Zeroing on a
      // SINGLE out-of-band evaluation meant a slow sweep — which produces many more
      // evaluations per degree, and so many more chances to be unlucky — was reset
      // over and over and NEVER COMMITTED. Measured: 300° swept, 0.0° read.
      // ⭐ Entry already had hysteresis (`rollAngle` must accumulate); this gives the
      // same treatment to the exit, exactly as §1.1 does for STATIONARY/MOVING.
      this.offBandPx = inBand ? 0 : this.offBandPx + stepPx;
      if (this.offBandPx >= mmToPx(this.cfg.rollReleaseDistance)) {
        // A scribble and a straight run must not add up to a circle between them.
        this.accumDeg = 0;
        this.offBandPx = 0;
      } else if (inBand) {
        this.accumDeg += this.turnDeg(dirRad);
        if (Math.abs(this.accumDeg) >= this.cfg.rollAngle) this.committedFlag = true;
      }
    }

    // ⚠ Tracked even while out of band, so re-entering does not read the whole
    // excursion as one instantaneous turn.
    this.prevDirRad = dirRad;
    this.smoothDeg = this.filter.filter(this.accumDeg, s.t);
  }

  /** Signed turn since the last evaluation, degrees. `0` on the first one. */
  private turnDeg(dirRad: number): number {
    if (this.prevDirRad === null) return 0;
    let turn = dirRad - this.prevDirRad;
    // Shortest signed difference; a path cannot turn more than half a circle between
    // two evaluations without the sampling itself being broken.
    while (turn > Math.PI) turn -= 2 * Math.PI;
    while (turn < -Math.PI) turn += 2 * Math.PI;
    return (turn * 180) / Math.PI;
  }

  /**
   * Local radius of curvature, as the circumradius of the baseline's two ends and a
   * point near its middle. ⚠ The mid point is chosen by DISTANCE along the baseline,
   * not by index: during a pause the window fills with samples bunched at the newest
   * end, and taking the middle index would put all three points on top of each other.
   */
  private curvatureRadiusMm(from: Sample, s: Sample): number {
    const half = dist(from, s) / 2;
    let mid = this.window[1]!;
    let best = Infinity;
    for (const c of this.window) {
      const err = Math.abs(dist(from, c) - half);
      if (err < best) {
        best = err;
        mid = c;
      }
    }
    const l1 = dist(from, mid);
    const l2 = dist(mid, s);
    const chord = dist(from, s);
    const cross =
      (mid.x - from.x) * (s.y - mid.y) - (mid.y - from.y) * (s.x - mid.x);
    const area2 = Math.abs(cross);
    // Straight ⇒ zero area ⇒ infinite radius, which the band rejects as "too straight".
    if (area2 <= EPSILON_PX) return Infinity;
    return pxToMm((l1 * l2 * chord) / (2 * area2));
  }
}
