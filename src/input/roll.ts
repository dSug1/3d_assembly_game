/**
 * §1.3 — ROLL DETECTION (rule 2quinte), running inside `COMMITTED_CONTINUOUS`.
 *
 * ⭐⭐ THE SPEC'S QUANTITY WAS RIGHT ALL ALONG; ONLY ITS ESTIMATOR WAS WRONG.
 * §1.3 asks for *"signed angle accumulated about the running centroid of the path"*.
 * The **centroid** cannot serve: for a uniform arc of total angle `2α` at radius `R`
 * the centroid sits at `R·sin(α)/α` from the true centre, so at the 60° `rollAngle`
 * commits at it is at **0.955 R — essentially ON the path**, and the angle measured
 * about it is not the swept angle at all.
 *
 * ⛔⛔ BUT ACCUMULATING THE PATH'S TURNING ANGLE INSTEAD — which this file did for
 * three device passes — SILENTLY CHANGES THE QUANTITY, and reversals expose it.
 * Device-reported 2026-09-14: *"when I roll in one direction and then roll in the
 * other direction, there is a jump of the cube when I change the roll directions."*
 *
 * Retrace an arc backwards and the TANGENT flips by 180° at the cusp, while the
 * angle about the centre simply runs back down. Measured on a 200° sweep reversed:
 * the angle **froze for twelve samples**, then jumped **+150° in a single step**, and
 * 200° out plus 200° back finished **180° from where it started** instead of at zero.
 *
 * ⭐⭐ SO THE CENTRE IS ESTIMATED PROPERLY — a closed-form least-squares CIRCLE FIT
 * (Kåsa) over the trailing path — and the roll is the angle swept about it, exactly
 * as §1.3 says. Retracing the same arc fits the **same circle**, so the centre holds
 * still and the angle reverses smoothly through zero.
 * ⭐ Closed form, not a search: a numeric fit would introduce a step size, and a step
 * size is a threshold nobody measured (the same reasoning as `bestTwist`).
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ⛔⛔ THE MEASUREMENT ADVANCES ON PATH PROGRESS, NEVER ON ARRIVING SAMPLES.
 * Device-reported earlier: *"while rolling the cube jitters, if I pause the circular
 * finger movement and start again, the cube also jitters a lot."* A stationary finger
 * still emits samples, and reading an angle from them measures noise. ⭐ A new
 * reading is taken only once the finger has advanced `rollUpdateDistance`, so a
 * paused finger contributes nothing — no special case for pauses, it falls out of
 * the geometry. Measured drift across a pause before this existed: **−46.3°**.
 *
 * ⛔⛔ AND THE SAGITTA GOVERNS WHETHER ANY OF IT IS MEASURABLE. A chord of length `L`
 * across a circle of radius `R` bows from the straight line by `L²/(8R)`, and that
 * bow IS the curvature signal. Below the pointer's own noise the fit is fitting
 * noise. At a 3 mm span on a 15 mm circle it is 0.075 mm against ~0.15 mm of noise,
 * and the symptom was that a SLOW sweep never registered as a roll at all: 300°
 * swept, 0.0° read. `validateGestureConfig` now refuses such a config outright.
 *
 * ⛔ SIGN, DECLARED, BECAUSE A SIGN IS NOT TESTED BY TESTING THE MAGNITUDE:
 * screen coordinates run x right and **y DOWN**, so sweeping from +x toward +y is
 * increasing angle — which is **CLOCKWISE AS SEEN ON THE SCREEN**.
 *
 *     accumulatedDeg > 0  ⇒  CLOCKWISE on screen
 *     accumulatedDeg < 0  ⇒  COUNTER-CLOCKWISE on screen
 *
 * ⭐ ROLL RELEASES when the path stops being circular (`rollReleaseDistance`). Rule
 * 2quinte's own condition is *"circular movement"*, so when the movement stops being
 * circular the rule stops applying. Commit is the entry hysteresis; this is the exit,
 * the same shape as §1.1's `STATIONARY`/`MOVING`. ⚠ §1.3 reads as a latch, so that is
 * a spec amendment and the owner's to ratify — see `Claude/10_INPUT_TOUCH/INDEX.md`.
 */
import { mmToPx, pxToMm } from "../core/units";
import type { GestureConfig } from "./gestureConfig";
import type { Sample } from "./motion";
import { OneEuroFilter } from "./one_euro";

/** A fitted circle, in CSS pixels, with the RMS residual of the points about it. */
export interface Circle {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  /** RMS of |distance-to-centre − r|, px. ⭐ How circular the path ACTUALLY is. */
  readonly residualPx: number;
}

/**
 * The fewest points the window keeps, so a circle fit always has something to fit.
 * ⚠ Not a tunable: four points is the algebraic minimum for a least-squares circle,
 * and eight is a modest margin over it. Bounding the window by PATH LENGTH is what
 * controls the estimate; this only stops that bound emptying the window.
 */
const MIN_FIT_POINTS = 8;

/**
 * How far a measured turn may exceed what the chord between two readings could
 * subtend on the fitted circle before it is discarded as inconsistent.
 * ⚠ Not a tunable: 1 is the exact geometric bound for points lying ON the circle;
 * the slack only covers points sitting slightly off it.
 */
const TURN_CHORD_SLACK = 1.5;

const dist = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

/**
 * THE **HYPER** ALGEBRAIC CIRCLE FIT — Al-Sharadqah & Chernov, *"Error analysis for
 * circle fitting algorithms"*, Electronic J. Statistics 3 (2009) 886–911,
 * [arXiv:0907.0421](https://arxiv.org/abs/0907.0421).
 *
 * ⛔⛔ IT REPLACES A KÅSA FIT, WHICH THE LITERATURE RATES THE WORST OF THE STANDARD
 * ALGEBRAIC FITS. Kåsa is **severely biased toward small circles on short arcs** —
 * exactly the regime here, where the window holds an arc, never a whole circle. A
 * biased, high-variance centre is what makes the per-step angle jump, and it makes
 * the estimated radius wander across `rollRadiusMin`/`rollRadiusMax`, flapping the
 * gesture in and out of band. Chernov's own ranking: Kåsa poor, Pratt moderate,
 * Taubin good, **Hyper best — zero essential bias, and better than the iterative
 * geometric fit.**
 *
 * ✅ LICENCE (`N13`): published mathematics. No licence attaches to a formula, and no
 * patent is asserted. This is an independent implementation from the paper's
 * algebraic form; the citation is attribution. Recorded in `THIRD_PARTY_NOTICES`.
 *
 * ⚠ "Non-iterative" in the literature's sense: there is no search over the data and
 * no step size. It solves one quartic by Newton from a guaranteed-convergent start,
 * which is a deterministic root-find — not the grid search `bestTwist`'s comment
 * warns about. Typically five to ten iterations.
 *
 * `null` when the points are collinear — the correct answer for a straight drag.
 */
export function fitCircle(pts: readonly Sample[]): Circle | null {
  const n = pts.length;
  if (n < 4) return null;

  let mx = 0;
  let my = 0;
  for (const p of pts) {
    mx += p.x;
    my += p.y;
  }
  mx /= n;
  my /= n;

  // Moments about the centroid, all normalised by n.
  let mxx = 0;
  let myy = 0;
  let mxy = 0;
  let mxz = 0;
  let myz = 0;
  let mzz = 0;
  for (const p of pts) {
    const xi = p.x - mx;
    const yi = p.y - my;
    const zi = xi * xi + yi * yi;
    mxx += xi * xi;
    myy += yi * yi;
    mxy += xi * yi;
    mxz += xi * zi;
    myz += yi * zi;
    mzz += zi * zi;
  }
  mxx /= n;
  myy /= n;
  mxy /= n;
  mxz /= n;
  myz /= n;
  mzz /= n;

  const mz = mxx + myy;
  const covXY = mxx * myy - mxy * mxy;
  const varZ = mzz - mz * mz;

  // ⭐ THE HYPER CONSTRAINT. `a2` is where this differs from Taubin, and it is the
  // whole of the bias correction — get it wrong and you have silently built a
  // different, worse estimator. Pinned by a vector against an exact circle.
  const a2 = 4 * covXY - 3 * mz * mz - mzz;
  const a1 = varZ * mz + 4 * covXY * mz - mxz * mxz - myz * myz;
  const a0 =
    mxz * (mxz * myy - myz * mxy) + myz * (myz * mxx - mxz * mxy) - varZ * covXY;
  const a22 = a2 + a2;

  // Newton on P(x) = 4x⁴ + a2·x² + a1·x + a0, started at x = 0, which the paper
  // shows converges to the required root.
  let x = 0;
  let y = a0;
  for (let i = 0; i < 99; i++) {
    const dy = a1 + x * (a22 + 16 * x * x);
    if (dy === 0) break;
    const xNext = x - y / dy;
    if (xNext === x || !Number.isFinite(xNext)) break;
    const yNext = a0 + xNext * (a1 + xNext * (a2 + 4 * xNext * xNext));
    // ⚠ Stop as soon as the residual stops shrinking. Without this a flat region can
    // walk the root away from the answer it had already found.
    if (Math.abs(yNext) >= Math.abs(y)) break;
    x = xNext;
    y = yNext;
  }

  const det = x * x - x * mz + covXY;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) return null;
  const cx = (mxz * (myy - x) - myz * mxy) / (det * 2);
  const cy = (myz * (mxx - x) - mxz * mxy) / (det * 2);
  const r2 = cx * cx + cy * cy + mz + 2 * x;
  if (!(r2 > 0) || !Number.isFinite(r2)) return null;
  const r = Math.sqrt(r2);

  const centreX = cx + mx;
  const centreY = cy + my;

  // ⛔⛔ A FIT WITHOUT A RESIDUAL IS NOT A TEST. Any algebraic fit returns *a* circle
  // for any point set, so accepting it on radius alone accepts paths that are not
  // circular: a golden vector caught a side-to-side WIGGLE committing as a roll.
  let sq = 0;
  for (const p of pts) {
    const e = Math.hypot(p.x - centreX, p.y - centreY) - r;
    sq += e * e;
  }
  return { cx: centreX, cy: centreY, r, residualPx: Math.sqrt(sq / n) };
}

export class RollDetector {
  /** One position per EVALUATION — spaced by real travel, so a pause adds none. */
  private evalPts: Sample[] = [];
  /** Where the finger was when the angle was last read. The progress gate. */
  private lastEvalAt: Sample | null = null;
  /** Travel, in px, since the path last looked circular. Hysteresis both ways. */
  private offBandPx = 0;
  /** Path length currently held in `evalPts`, px. Maintained incrementally. */
  private windowPathPx = 0;
  /** Radius of the last accepted fit, px. Sizes the window. See `windowTargetPx`. */
  private lastRadiusPx: number | null = null;
  /** ⚠ The previous POSITION, not the previous angle. See `push`. */
  private prevPos: Sample | null = null;
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
   * ⭐ Signed: positive is CLOCKWISE on screen. See the header. This is both what
   * the COMMIT decision reads and what rule 2quinte rotates the object BY.
   *
   * ⚠ IT IS DELIBERATELY UNFILTERED. A 1€ filter (Casiez et al., CHI 2012) was
   * fitted here and then REVERTED, because on this estimator it measured no
   * improvement — 5.80°→5.78°, 3.03°→2.91°, and 3.54°→4.70° WORSE on a wide
   * circle. It had been compensating for a bad estimator; fixing the estimator
   * removed the need for it, and a filter that measures nothing only adds lag.
   * `METHOD`: measure or revert, and record the null result. See
   * `Claude/00_CORE/queue_notes/IN1.md`.
   */
  get accumulatedDeg(): number {
    return this.accumDeg;
  }

  /**
   * ⭐⭐ THE ANGLE TO ROTATE BY — 1€-filtered (`one_euro.ts`). Heavy smoothing while
   * the roll is slow, where the eye sees jitter; almost none while it is fast, where
   * the eye sees lag. The device reported exactly that asymmetry.
   * ⛔ The COMMIT threshold reads `accumulatedDeg`, raw, on purpose: lagging a
   * threshold crossing makes the gesture feel late.
   */
  get smoothedDeg(): number {
    return this.smoothDeg;
  }

  /**
   * ⭐⭐ THE ANGLE THE OBJECT IS ACTUALLY TURNED BY — the smoothed sweep times
   * `gainRoll`. At the default of 1 the cube turns exactly as far as the finger
   * swept, which is direct manipulation and is what shipped up to now.
   *
   * ⛔ THE GAIN IS DELIBERATELY **NOT** APPLIED TO `accumulatedDeg`, which is what the
   * COMMIT threshold reads. Scaling that would silently move `rollAngle` too: a gain
   * of 2 would commit a roll after half the sweep, coupling "how far the cube turns"
   * to "how much of a circle counts as a roll" — two questions that have nothing to do
   * with each other. Keeping them apart is why this is a third channel and not a
   * multiplication at the source.
   *
   * ⚠ A gain other than 1 means the cube turns by a different amount than the finger
   * swept, so the object stops tracking the fingertip. That is a real trade and the
   * owner's to make on the glass — `IN5`.
   */
  get appliedDeg(): number {
    return this.smoothDeg * this.cfg.gainRoll;
  }

  /**
   * Latches until the path stops being circular. ⚠ `accumulatedDeg` keeps changing
   * afterwards, because 2quinte needs an ongoing angle to roll BY. §1.3: once roll is
   * committed the flick test is skipped.
   */
  get committed(): boolean {
    return this.committedFlag;
  }

  reset(): void {
    this.evalPts = [];
    this.lastEvalAt = null;
    this.offBandPx = 0;
    this.windowPathPx = 0;
    this.lastRadiusPx = null;
    this.prevPos = null;
    this.accumDeg = 0;
    this.smoothDeg = 0;
    this.committedFlag = false;
    this.filter.reset();
  }

  /**
   * How much PATH the fit window should hold, in px.
   *
   * ⛔⛔ IT SCALES WITH THE RADIUS, because what conditions a circle fit is ANGULAR
   * EXTENT, not distance. A fixed 30 mm window is 215° of a tight 8 mm swirl and
   * only 49° of a lazy 35 mm one — and measured, the wide swirl simply would not
   * roll at any fixed length that also kept the release responsive: it needed 100 mm,
   * which pushed the release out to 84 mm of straight drag.
   * ⭐ `rollFitArcDeg` of arc at the radius last measured gives every swirl the same
   * quality of fit, and makes a big gesture's window big and a small one's small.
   */
  private windowTargetPx(): number {
    const seedPx = mmToPx((this.cfg.rollRadiusMin + this.cfg.rollRadiusMax) / 2);
    const radiusPx = this.lastRadiusPx ?? seedPx;
    // ⭐ A shorter window once committed: the long arc exists to make the DECISION
    // reliable, and that decision is already made. See `rollTrackArcDeg`.
    const arcDeg = this.committedFlag ? this.cfg.rollTrackArcDeg : this.cfg.rollFitArcDeg;
    const arcRad = (arcDeg * Math.PI) / 180;
    // ⚠ Never shorter than the minimum span, or the window could not satisfy the
    // sagitta criterion it is bounded by in the first place.
    return Math.max(mmToPx(this.cfg.rollStepDistance), radiusPx * arcRad);
  }

  /**
   * RMS deviation of the most recent `rollStepDistance` of path from `fit`.
   * ⚠ Deliberately the RECENT path only — see the note at the call site. Always at
   * least four points, so a single stray sample cannot decide it.
   */
  private recentResidualPx(fit: Circle): number {
    const wantPx = mmToPx(this.cfg.rollStepDistance);
    let walked = 0;
    let i = this.evalPts.length - 1;
    while (i > 0 && walked < wantPx) {
      walked += dist(this.evalPts[i - 1]!, this.evalPts[i]!);
      i--;
    }
    i = Math.min(i, this.evalPts.length - 4);
    if (i < 0) i = 0;
    let sq = 0;
    let n = 0;
    for (let k = i; k < this.evalPts.length; k++) {
      const p = this.evalPts[k]!;
      const e = Math.hypot(p.x - fit.cx, p.y - fit.cy) - fit.r;
      sq += e * e;
      n++;
    }
    return n === 0 ? Infinity : Math.sqrt(sq / n);
  }

  /** ⚠ DIAGNOSTIC ONLY, for probes. Not used by the product. */
  debugFit(): { rMm: number; recentResidualRatio: number } | null {
    const fit = fitCircle(this.evalPts);
    if (fit === null) return null;
    return { rMm: pxToMm(fit.r), recentResidualRatio: this.recentResidualPx(fit) / fit.r };
  }

  push(s: Sample): void {
    // ⛔⛔ THE PROGRESS GATE. See the header: without it a stationary finger keeps
    // producing readings, and those readings are noise.
    const stepPx = this.lastEvalAt === null ? 0 : dist(this.lastEvalAt, s);
    if (this.lastEvalAt !== null && stepPx < mmToPx(this.cfg.rollUpdateDistance)) return;
    this.lastEvalAt = s;

    if (this.evalPts.length > 0) this.windowPathPx += stepPx;
    this.evalPts.push(s);
    // ⛔⛔ BOUNDED BY PATH LENGTH — not by a chord, and not by a point COUNT.
    // * Not a chord from the oldest point: on a reversal the finger comes back over
    //   its own path, so the chord shrinks exactly when the window needs to move on.
    // * Not a count: evaluations are spaced by AT LEAST `rollUpdateDistance`, never
    //   exactly it, so a fast finger packed 162 mm of path into a window meant to
    //   hold 30 mm — and a committed roll then refused to release across a straight
    //   drag three times longer than `rollReleaseDistance`.
    // ⭐ Path length is the quantity `rollFitWindow` actually names, it keeps growing
    // through a reversal, and a resting finger cannot inflate it because evaluations
    // only exist where the finger travelled.
    while (this.evalPts.length > MIN_FIT_POINTS && this.windowPathPx > this.windowTargetPx()) {
      this.windowPathPx -= dist(this.evalPts[0]!, this.evalPts[1]!);
      this.evalPts.shift();
    }

    const fit = fitCircle(this.evalPts);
    // ⛔ Below the minimum span the sagitta is under the noise floor and the fit is
    // fitting noise. Reading an angle off it is worse than reading nothing.
    //
    // ⛔⛔ MEASURED ALONG THE PATH, NOT AS THE CHORD FROM THE OLDEST POINT. A golden
    // vector caught the chord version: ON A REVERSAL the finger comes back towards
    // where the window began, so the chord SHRINKS while the arc actually fitted
    // keeps growing. The span then read as "too short", the roll was released
    // mid-gesture, and the accumulated angle was zeroed — a 35° jump, at the one
    // moment the reversal fix was supposed to be smooth.
    // ⭐ Path length is the honest measure of how much arc the fit has to work with;
    // divided by the radius it IS the angular extent, which is what conditions a
    // circle fit. And it cannot be inflated by a resting finger, because evaluations
    // only exist where the finger actually travelled.
    let windowPathPx = 0;
    for (let i = 1; i < this.evalPts.length; i++) {
      windowPathPx += dist(this.evalPts[i - 1]!, this.evalPts[i]!);
    }
    const spanned = windowPathPx >= mmToPx(this.cfg.rollStepDistance);
    const radiusMm = fit === null ? Number.NaN : pxToMm(fit.r);
    // ⭐ Circularity is TWO questions, and the band only answers one. "Is the circle
    // the right size?" is the radius; "is the path actually ON a circle at all?" is
    // the residual — and that one is asked of the RECENT path, not the whole window.
    //
    // ⛔⛔ JUDGING IT OVER THE WHOLE WINDOW MAKES RELEASE HOPELESSLY SLOW. The window
    // holds a full arc's worth of path, so a straight departure only dominates it
    // once nearly all of it has been flushed: measured at **83 mm of straight drag**
    // before a committed roll let go, against a `rollReleaseDistance` of 18 mm. The
    // owner had already reported that exact sluggishness as roll and yaw/pitch not
    // handing over cleanly.
    // ⭐ The fit still uses the WHOLE window — it needs the arc to locate a centre —
    // but whether the finger is STILL ON that circle is a question only the recent
    // path can answer, and it answers immediately.
    //
    // ⛔⛔ AND THE RESIDUAL IS A FRACTION OF THE FITTED RADIUS, NOT A MULTIPLE OF THE
    // POINTER NOISE. Tying it to noise was a category error and it took roll off the
    // device entirely: the residual measures HOW NON-CIRCULAR THE HAND'S PATH IS,
    // which is a shape property measured in millimetres, while pointer noise is a
    // sensor property measured in fractions of one. A human "circle" is an ellipse
    // with a drifting centre; at a 0.45 mm tolerance NOTHING a hand can draw
    // qualified, and only a mathematically perfect circle rolled.
    // ⭐ As a fraction of the radius it is dimensionless and scale-free: the same
    // tolerance judges a tight swirl and a lazy wide one.
    const residualOk =
      fit !== null &&
      this.recentResidualPx(fit) <= this.cfg.rollFitResidualFraction * fit.r;
    const inBand =
      fit !== null &&
      spanned &&
      residualOk &&
      radiusMm >= this.cfg.rollRadiusMin &&
      radiusMm <= this.cfg.rollRadiusMax;

    if (!inBand || fit === null) {
      // ⭐ Hysteresis on BOTH sides. Acting on a SINGLE out-of-band reading meant a
      // slow sweep — which produces many more readings per degree, so many more
      // chances to be unlucky — was reset over and over and NEVER COMMITTED.
      // ⛔⛔ THE REFERENCE POINT MUST NOT GO STALE. An earlier version returned from
      // here without touching `prevPos`, so an excursion out of band — which happens
      // transiently at a direction reversal and at the roll-to-yaw/pitch handover —
      // left the reference behind while the finger kept moving. The whole excursion
      // was then collected into ONE step on re-entry, which is a jump of arbitrary
      // size. Device-reported as *"big jumps when I switch from roll to yaw/pitch or
      // when I change roll directions."*
      // ⭐ Third time this row has had the same bug shape: a difference means
      // something only when BOTH ends of it are current.
      this.prevPos = s;
      this.offBandPx += stepPx;
      if (this.offBandPx >= mmToPx(this.cfg.rollReleaseDistance)) {
        // The gesture has stopped being circular: hand back to yaw/pitch, and make a
        // scribble plus a straight run unable to add up to a circle between them.
        this.committedFlag = false;
        this.accumDeg = 0;
        this.smoothDeg = 0;
        this.offBandPx = 0;
        this.prevPos = null;
        // ⛔ The filter carries state; leaving it primed with the abandoned angle
        // would make the next roll start by racing back to it.
        this.filter.reset();
      }
      return;
    }

    this.offBandPx = 0;
    this.lastRadiusPx = fit.r;
    // ⭐⭐ THE SPEC'S QUANTITY: the angle about the CENTRE, not the turning of the
    // tangent. This is what reverses smoothly instead of flipping 180° at a cusp.
    //
    // ⛔⛔ BOTH ANGLES ARE TAKEN ABOUT THE **SAME** CENTRE — the current one — which
    // is why the PREVIOUS POSITION is stored rather than the previous angle. A
    // difference of two angles measured about two different centres is not a swept
    // angle at all; it conflates the finger's motion with the CENTRE'S. The fit's
    // centre genuinely does move: on a side-to-side wiggle it jumps clean across the
    // path each time the window slides over an inflection, and storing the previous
    // angle let that jump accumulate — a sloppy lazy drag committed as a roll.
    // ⭐ Re-measuring the previous point about the current centre makes centre motion
    // cancel exactly. Same principle as the progress gate: a difference only means
    // something when both ends of it move together.
    const angleRad = Math.atan2(s.y - fit.cy, s.x - fit.cx);
    if (this.prevPos !== null) {
      const prevAngleRad = Math.atan2(this.prevPos.y - fit.cy, this.prevPos.x - fit.cx);
      let turn = angleRad - prevAngleRad;
      // Shortest signed difference.
      while (turn > Math.PI) turn -= 2 * Math.PI;
      while (turn < -Math.PI) turn += 2 * Math.PI;

      // ⭐⭐ A CONSISTENCY CHECK BETWEEN TWO INDEPENDENT MEASUREMENTS, and the only
      // guard that can catch a wrap landing on the wrong branch. Two points on a
      // circle of radius `r` separated by a chord `c` subtend exactly
      // `2·asin(c / 2r)`, so the angle is NOT free to disagree with the distance the
      // finger actually travelled. When it does, the pair is not describing motion
      // along this circle, and the honest reading of it is none.
      // ⚠ Not a tunable: 1 is the exact geometric bound for points lying ON the
      // circle, and the slack only covers points sitting slightly off it — which the
      // residual test already bounds independently.
      const chord = dist(this.prevPos, s);
      const maxTurn = 2 * Math.asin(Math.min(1, chord / (2 * fit.r))) * TURN_CHORD_SLACK;
      if (Math.abs(turn) <= maxTurn) {
        const turnDeg = (turn * 180) / Math.PI;
        this.accumDeg += turnDeg;
        if (Math.abs(this.accumDeg) >= this.cfg.rollAngle) this.committedFlag = true;

      }
    }
    this.prevPos = s;
    // ⚠ THE FILTER SITS ON THE ANGLE, NOT ON THE PER-STEP TURN. Filtering the turns
    // and integrating them was tried and is WORSE — measured 6.8° → 17.7° of error.
    // Evaluations here are gated by DISTANCE, so they are irregular in time, and a
    // time-based low-pass over irregular increments does not preserve their sum: the
    // residual bias integrates into unbounded drift.
    this.smoothDeg = this.filter.filter(this.accumDeg, s.t);
  }
}
