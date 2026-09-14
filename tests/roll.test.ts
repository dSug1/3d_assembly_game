/**
 * GOLDEN VECTORS — roll detection (§1.3 / rule 2quinte).
 *
 * ⭐⭐ THE SIGN IS ASSERTED AGAINST DECLARED TRUTH, ON FOUR STARTING PHASES AND BOTH
 * CHIRALITIES. `METHOD`: a sign is not tested by any amount of testing the
 * magnitude, and an invariant tested on one axis is not tested. A roll that
 * accumulates the right NUMBER of degrees with the wrong sign rolls the object the
 * wrong way, and every magnitude assertion in the world passes while it does.
 *
 * Declared truth, from `src/input/roll.ts`: screen y runs DOWN, so
 * `accumulatedDeg > 0` is CLOCKWISE ON SCREEN.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import type { Sample } from "../src/input/motion";
import { RollDetector, fitCircle } from "../src/input/roll";
import { MotionTracker } from "../src/input/motion";
import { mmToPx, pxToMm } from "../src/core/units";

const cfg = DEFAULT_CONFIG;

/**
 * An arc of `steps` samples at `stepDeg` each, radius `radiusMm`, starting at
 * `startDeg`. ⭐ `clockwise` is in SCREEN terms: with y down, increasing the
 * parameter angle sweeps right → down → left, which is clockwise as seen.
 */
function arc(opts: {
  radiusMm: number;
  startDeg: number;
  stepDeg: number;
  steps: number;
  clockwise: boolean;
  stepMs?: number;
}): Sample[] {
  const { radiusMm, startDeg, stepDeg, steps, clockwise } = opts;
  const stepMs = opts.stepMs ?? 10;
  const r = mmToPx(radiusMm);
  const dir = clockwise ? 1 : -1;
  const out: Sample[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((startDeg + dir * stepDeg * i) * Math.PI) / 180;
    out.push({ x: 200 + r * Math.cos(a), y: 200 + r * Math.sin(a), t: i * stepMs });
  }
  return out;
}

function feed(samples: readonly Sample[], config = cfg): RollDetector {
  const d = new RollDetector(config);
  for (const s of samples) d.push(s);
  return d;
}

describe("roll detection", () => {
  // ⭐ Four starting phases. A detector that only works when the gesture happens to
  // begin on the +x side is not a detector, and one starting phase cannot tell.
  for (const startDeg of [0, 90, 180, 270]) {
    it(`a CLOCKWISE circle started at ${startDeg}° commits, with a POSITIVE angle`, () => {
      const d = feed(arc({ radiusMm: 15, startDeg, stepDeg: 5, steps: 70, clockwise: true }));
      expect(d.committed).toBe(true);
      expect(d.accumulatedDeg).toBeGreaterThan(0);
      expect(Math.abs(d.accumulatedDeg)).toBeGreaterThanOrEqual(cfg.rollAngle);
    });

    it(`a COUNTER-CLOCKWISE circle started at ${startDeg}° commits, with a NEGATIVE angle`, () => {
      const d = feed(arc({ radiusMm: 15, startDeg, stepDeg: 5, steps: 70, clockwise: false }));
      expect(d.committed).toBe(true);
      expect(d.accumulatedDeg).toBeLessThan(0);
    });
  }

  it("⭐⭐ EQUAL EXTRA SWEEP GIVES EQUAL EXTRA ANGLE — the identity, stated cleanly", () => {
    // The turning angle of a circular arc equals its central angle EXACTLY, which is
    // the whole reason for departing from §1.3's centroid (it sits at 0.955 R and
    // cannot produce it). See src/input/roll.ts.
    //
    // ⚠ It cannot be asserted as one absolute number any more. The direction is
    // measured over a TRAILING BASELINE, so the first `rollStepDistance` of travel
    // establishes it and its turning is never counted. That startup arc is real and
    // unavoidable. ⭐ So the identity is stated as a RATE: two arcs differing by 50°
    // of sweep, sharing an identical start, must differ by 50° of measured angle.
    const at = (steps: number) =>
      feed(arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps, clockwise: true })).accumulatedDeg;
    const extra = at(30) - at(20); // ten more 5° steps
    // ⚠ Tolerance is one evaluation cadence: the last evaluation lands wherever the
    // finger had travelled `rollUpdateDistance`, not exactly on the final sample.
    expect(Math.abs(extra - 50)).toBeLessThan(3);
  });

  it("the startup transient is ONE baseline of arc, and no more", () => {
    // ⚠ Pinned so the lag is a known quantity rather than a surprise on a device.
    // The roll cannot begin reading until the baseline is spanned, and that arc is
    // never counted. A `rollStepDistance` chord on a 15 mm circle subtends
    // 2·asin(L/30), so the loss is predictable from the config rather than guessed.
    const swept = 100;
    const measured = feed(
      arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 20, clockwise: true }),
    ).accumulatedDeg;
    const lost = swept - measured;
    const expectedLostDeg =
      (2 * Math.asin(Math.min(1, cfg.rollStepDistance / 30)) * 180) / Math.PI;
    expect(lost).toBeGreaterThan(0);
    // Within one evaluation cadence of the geometric prediction.
    expect(Math.abs(lost - expectedLostDeg)).toBeLessThan(8);
  });

  it("⭐ the angle KEEPS accumulating past the commit threshold", () => {
    // ⛔ Only the DECISION latches. 2quinte rotates the object BY this value, so a
    // detector that froze it at `rollAngle` would let the object roll 60° and then
    // stop dead while the finger kept circling.
    const d = feed(arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 70, clockwise: true }));
    expect(d.committed).toBe(true);
    expect(d.accumulatedDeg).toBeGreaterThan(cfg.rollAngle);
  });

  it("⛔⛔ a COARSE sample stream still detects roll — it must not go silent", () => {
    // A fast swirl, or a 60 Hz digitiser, puts consecutive samples FURTHER APART than
    // `rollStepDistance`. An earlier window pruned itself to two samples in that
    // case, every evaluation was rejected, and roll detection stopped working
    // entirely while reporting "no roll". `METHOD`: a guard that turns a missing
    // case into silence is worse than a failure.
    // ⚠ The fixture must be coarse RELATIVE TO `rollStepDistance`, so it is derived
    // from the config rather than hard-coded — an earlier version stopped being
    // coarse at all when the baseline was lengthened, and silently tested nothing.
    const stepDeg =
      (2 * Math.asin(Math.min(0.95, (cfg.rollStepDistance * 1.3) / 30)) * 180) / Math.PI;
    const coarse = arc({ radiusMm: 15, startDeg: 0, stepDeg, steps: 12, clockwise: true });
    const stepMm = Math.hypot(coarse[1]!.x - coarse[0]!.x, coarse[1]!.y - coarse[0]!.y) / mmToPx(1);
    expect(stepMm).toBeGreaterThan(cfg.rollStepDistance); // the fixture IS coarse
    const d = feed(coarse);
    expect(d.committed).toBe(true);
    expect(d.accumulatedDeg).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ⭐ THE COUNTER-EXAMPLES. A test that cannot FAIL is not a test, so each guard
  // gets a specimen it must reject.

  it("⛔ a STRAIGHT drag never commits — the false positive the centroid reading has", () => {
    // Under §1.3's centroid reading the bearing FLIPS BY 180° as the path passes
    // the centroid, exactly where the measured radius is smallest. Here the
    // circumradius is unbounded, so nothing accumulates at all.
    const straight: Sample[] = [];
    for (let i = 0; i <= 40; i++) straight.push({ x: 100 + i * 4, y: 200, t: i * 10 });
    const d = feed(straight);
    expect(d.committed).toBe(false);
    expect(d.accumulatedDeg).toBe(0);
  });

  it("⛔ a diagonal straight drag never commits either", () => {
    const straight: Sample[] = [];
    for (let i = 0; i <= 40; i++) straight.push({ x: 100 + i * 3, y: 100 + i * 3, t: i * 10 });
    expect(feed(straight).committed).toBe(false);
  });

  it("⛔ a TIGHT scribble is below rollRadiusMin and does not commit", () => {
    const d = feed(arc({ radiusMm: 2, startDeg: 0, stepDeg: 20, steps: 40, clockwise: true }));
    expect(d.committed).toBe(false);
  });

  it("⛔ a GENTLE curve is above rollRadiusMax and does not commit", () => {
    const d = feed(arc({ radiusMm: 120, startDeg: 0, stepDeg: 1.5, steps: 60, clockwise: true }));
    expect(d.committed).toBe(false);
  });

  it("⛔ a back-and-forth WIGGLE does not add up to a roll", () => {
    // ⚠ THE FIRST VERSION OF THIS VECTOR WAS INVALID AND IT COMMITTED. It spliced a
    // 2 mm scribble straight onto a 60 mm sweep, so the joint TELEPORTED ~60 mm in
    // one 10 ms sample -- about 6000 mm/s. `METHOD`: a golden vector's fixture must
    // be a specimen the product would accept, and no finger produces that. The
    // fixture was wrong, not the detector.
    //
    // ⭐ This is the honest version: a real side-to-side wiggle whose curvature at
    // the peaks lands INSIDE the roll band (~15 mm), so the band alone cannot reject
    // it. It must not commit, because its turning angle keeps changing sign.
    const amplitudeMm = 3;
    const wavelengthMm = 2 * Math.PI * Math.sqrt(15 * amplitudeMm);
    const wiggle: Sample[] = [];
    for (let i = 0; i <= 120; i++) {
      const xMm = i * 1.2;
      wiggle.push({
        x: 100 + mmToPx(xMm),
        y: 200 + mmToPx(amplitudeMm * Math.sin((2 * Math.PI * xMm) / wavelengthMm)),
        t: i * 10,
      });
    }
    const d = feed(wiggle);
    expect(d.committed).toBe(false);
    expect(Math.abs(d.accumulatedDeg)).toBeLessThan(cfg.rollAngle);
  });

  it("⭐⭐ a SHORT straight wobble does not release a roll, but a SUSTAINED one does", () => {
    // ⚠ THE BEHAVIOUR CHANGED HERE, ON DEVICE EVIDENCE. The commit used to latch
    // for the whole gesture, so a straight drag after a circle was still read as
    // roll -- and the turn from the circle's tangent onto the new line is a large
    // GENUINE direction change, applied in one step. The owner felt it as "an
    // erratic movement which jitters and snaps with big amplitude".
    //
    // ⭐ Rule 2quinte applies to "circular movement", so when the movement stops
    // being circular the rule stops applying. Commit is the entry hysteresis;
    // `rollReleaseDistance` is the exit. Both halves are asserted here -- an exit
    // with no hysteresis would chatter between roll and yaw/pitch on every wobble.
    const circle = arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 70, clockwise: true });
    const last = circle[circle.length - 1]!;
    const prev = circle[circle.length - 2]!;
    const ux = last.x - prev.x;
    const uy = last.y - prev.y;
    const n = Math.hypot(ux, uy);
    const straightFor = (travelMm: number): Sample[] => {
      const out: Sample[] = [];
      const stepPx = mmToPx(travelMm) / 20;
      for (let i = 1; i <= 20; i++) {
        out.push({
          x: last.x + (ux / n) * i * stepPx,
          y: last.y + (uy / n) * i * stepPx,
          t: last.t + i * 10,
        });
      }
      return out;
    };

    const short = feed([...circle, ...straightFor(cfg.rollReleaseDistance * 0.5)]);
    expect(short.committed).toBe(true); // a wobble must not drop the roll

    const long = feed([...circle, ...straightFor(150)]);
    expect(long.committed).toBe(false); // sustained straight travel hands back
    expect(long.accumulatedDeg).toBe(0); // and a new roll must earn rollAngle again

    // ⛔⛔ A KNOWN COST, PINNED RATHER THAN HIDDEN. Release is NOT governed by
    // `rollReleaseDistance` alone: the fit window holds `rollFitArcDeg` of arc, and a
    // committed roll only lets go once enough of that has flushed for the fitted
    // radius to leave the band. Measured at **~83 mm** of straight drag against an
    // 18 mm release distance. ⚠ That is the sluggish roll-to-yaw/pitch handover the
    // owner reported; the arc length is what buys detection of a lazy wide swirl, so
    // the two are in direct tension and only a device can settle it. `IN5`.
    const mid = feed([...circle, ...straightFor(40)]);
    expect(mid.committed).toBe(true); // ⚠ still rolling after 40 mm of straight drag
  });

  it("a duplicated sample is skipped, not read as a zero turn", () => {
    const circle = arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 10, clockwise: true });
    const withDupes: Sample[] = [];
    for (const s of circle) {
      withDupes.push(s);
      withDupes.push({ ...s, t: s.t + 1 }); // same position, later timestamp
    }
    // ⭐ The claim is that duplicates change NOTHING, so it is asserted against the
    // clean arc rather than against a number copied out of a previous run.
    expect(feed(withDupes).accumulatedDeg).toBeCloseTo(feed(circle).accumulatedDeg, 9);
  });
});

/**
 * ⭐⭐ THE DEVICE-CONFIRMED JITTER, 2026-09-13. Owner: *"while rolling the cube
 * jitters, if I pause the circular finger movement and start again, the cube also
 * jitters a lot."*
 *
 * Both symptoms had one root: direction was estimated between CONSECUTIVE SAMPLES,
 * a baseline of a few pixels, so digitiser noise dominated the angle. The same
 * failure shape as `flick.ts`'s last-sample-pair lift speed, and `METHOD` names it:
 * *print the aggregation, not just the value.*
 */
describe("⛔⛔ roll under digitiser noise", () => {
  /** A circle carrying per-sample pointer noise, as a real digitiser produces. */
  function noisyCircle(steps: number, noisePx: number, t0 = 0): Sample[] {
    let seed = 7;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed / 0x7fffffff) * 2 - 1;
    };
    const r = mmToPx(15);
    const out: Sample[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = (5 * i * Math.PI) / 180;
      out.push({
        x: 300 + r * Math.cos(a) + rnd() * noisePx,
        y: 300 + r * Math.sin(a) + rnd() * noisePx,
        t: t0 + i * 8,
      });
    }
    return out;
  }

  /** The biggest single jump in the accumulated angle — what the object jerks by. */
  function worstStep(samples: readonly Sample[]): number {
    const d = new RollDetector(cfg);
    let prev = 0;
    let worst = 0;
    for (const s of samples) {
      d.push(s);
      worst = Math.max(worst, Math.abs(d.accumulatedDeg - prev));
      prev = d.accumulatedDeg;
    }
    return worst;
  }

  it("⭐ noise does not multiply the per-step angle", () => {
    // ⛔ MEASURED BEFORE THE FIX: a clean circle stepped 5.0° per sample and the
    // same circle with ±0.5 px of noise stepped up to 46.3° — NINE TIMES the true
    // value, applied straight to the cube every frame. That is the jitter.
    const clean = worstStep(noisyCircle(48, 0));
    const noisy = worstStep(noisyCircle(48, 0.5));
    expect(noisy).toBeLessThan(clean * 3);
  });

  it("⭐ noise does not change the TOTAL angle either", () => {
    // Not just smoothness: an estimator can be smooth and wrong. The cube must end
    // up where the finger put it.
    const clean = feed(noisyCircle(48, 0)).accumulatedDeg;
    const noisy = feed(noisyCircle(48, 0.5)).accumulatedDeg;
    expect(Math.abs(noisy - clean)).toBeLessThan(5);
  });

  it("⭐⭐ a PAUSED finger accumulates NOTHING", () => {
    // ⛔ MEASURED BEFORE THE FIX: −46.3° of drift across one pause, for a finger
    // holding still. Three near-coincident noisy points have a meaningless
    // circumradius; it fell below rollRadiusMin, which zeroed the accumulator, and
    // the cube snapped back to where the roll began.
    const circling = noisyCircle(70, 0.5);
    const d = new RollDetector(cfg);
    for (const s of circling) d.push(s);
    expect(d.committed).toBe(true);
    const before = d.accumulatedDeg;

    const last = circling[circling.length - 1]!;
    for (let i = 1; i <= 60; i++) {
      // Holding still is not holding STILL: a resting finger jitters, which is the
      // whole reason §1.1 exists. ⚠ A pause fixture without jitter would prove
      // nothing, because the defect was the jitter being read as motion.
      d.push({ x: last.x + (i % 3) * 0.4 - 0.4, y: last.y + (i % 2) * 0.4, t: last.t + i * 8 });
    }
    expect(Math.abs(d.accumulatedDeg - before)).toBeLessThan(1);
  });

  it("⭐ ...and the roll RESUMES cleanly after the pause", () => {
    // The other half: a detector that ignored everything after a pause would pass
    // the test above and be useless.
    const circling = noisyCircle(70, 0.5);
    const d = new RollDetector(cfg);
    for (const s of circling) d.push(s);
    const last = circling[circling.length - 1]!;
    for (let i = 1; i <= 60; i++) {
      d.push({ x: last.x + (i % 3) * 0.4 - 0.4, y: last.y + (i % 2) * 0.4, t: last.t + i * 8 });
    }
    const afterPause = d.accumulatedDeg;

    // Resume the same circle from where it stopped.
    const r = mmToPx(15);
    for (let i = 31; i <= 60; i++) {
      const a = (5 * i * Math.PI) / 180;
      d.push({ x: 300 + r * Math.cos(a), y: 300 + r * Math.sin(a), t: last.t + 600 + i * 8 });
    }
    expect(d.accumulatedDeg - afterPause).toBeGreaterThan(100); // ~150° more swept
  });
});

/**
 * ⭐⭐ THE SAGITTA CRITERION, AND THE SLOW-ROLL DEFECT IT EXPLAINS.
 *
 * A chord of length L across a circle of radius R bows away from the straight line
 * by L²/(8R). That bow IS the curvature signal. If it does not clear the pointer's
 * own noise, the measured radius is noise — and every decision keyed on it is a coin
 * toss. This is the one config rule here derived from physics rather than chosen.
 */
describe("⛔⛔ slow roll, and the curvature signal-to-noise that governs it", () => {
  function slowCircle(steps: number, noisePx: number): Sample[] {
    let seed = 7;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed / 0x7fffffff) * 2 - 1;
    };
    const r = mmToPx(15);
    const out: Sample[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = (2.5 * i * Math.PI) / 180; // a DELIBERATE, slow sweep
      out.push({
        x: 300 + r * Math.cos(a) + rnd() * noisePx,
        y: 300 + r * Math.sin(a) + rnd() * noisePx,
        t: i * 16,
      });
    }
    return out;
  }

  it("⭐⭐ a SLOW noisy sweep still commits — it used to never commit at all", () => {
    // ⛔ THE DEFECT, MEASURED: 300° swept, 0.0° read, never committed. Two causes,
    // both fixed. (1) At a 3 mm baseline the sagitta on a 15 mm circle is 0.075 mm
    // against ~0.15 mm of noise, so the radius estimate was pure noise. (2) A single
    // out-of-band reading ZEROED the accumulator, and a slow sweep produces many
    // more evaluations per degree — so many more chances to be unlucky.
    const d = feed(slowCircle(120, 0.5));
    expect(d.committed).toBe(true);
    expect(Math.abs(d.accumulatedDeg)).toBeGreaterThan(200);
  });

  it("⛔ a config whose curvature signal is below the noise is REJECTED", () => {
    // ⭐ This validator would have caught the defect above at construction, instead
    // of it costing a device session. The shipped config had an SNR of 0.2.
    expect(
      () => new MotionTracker({ ...cfg, rollStepDistance: 3, rollRadiusMax: 40 }),
    ).toThrow(/sagitta/);
  });

  it("the shipped config clears the sagitta bar", () => {
    const sagitta = (cfg.rollStepDistance * cfg.rollStepDistance) / (8 * cfg.rollRadiusMax);
    expect(sagitta).toBeGreaterThanOrEqual(2 * cfg.pointerNoiseMm);
  });
});

/**
 * ⭐⭐ THE 1€ FILTER WAS FITTED HERE AND THEN REVERTED, and the null result is kept
 * on purpose. `METHOD`: *a change must show a MEASURED improvement on identical
 * recorded input, or be reverted — a null result is recorded, not shipped hopefully.*
 *
 * Casiez, Roussel & Vogel, CHI 2012, is the right filter for the jitter-vs-lag trade
 * and its licence was clear (BSD/MIT, no patent asserted). It measurably helped the
 * OLD turning-angle estimator. Against the circle-fit estimator it measured
 * **5.80°→5.78°, 3.03°→2.91°, and 3.54°→4.70° — worse — on a wide circle.**
 *
 * ⭐ The lesson is the useful part: the filter had been compensating for a bad
 * ESTIMATOR. Fixing the estimator removed the need for it, and a filter that measures
 * nothing is pure lag. Reach for the estimator before the filter.
 */
describe("roll angle is deliberately unfiltered", () => {
  it("⭐ the raw angle is already smooth enough that a filter earned nothing", () => {
    // The property that made the filter redundant: a circle fit over a trailing
    // window is inherently steady, because every point in the window constrains the
    // centre. Consecutive readings must not jump.
    let seed = 11;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed / 0x7fffffff) * 2 - 1;
    };
    const r = mmToPx(15);
    const d = new RollDetector(cfg);
    let prev = 0;
    let worst = 0;
    for (let i = 0; i <= 80; i++) {
      const a = (5 * i * Math.PI) / 180;
      d.push({ x: 300 + r * Math.cos(a) + rnd() * 0.5, y: 300 + r * Math.sin(a) + rnd() * 0.5, t: i * 8 });
      if (d.committed) worst = Math.max(worst, Math.abs(d.accumulatedDeg - prev));
      prev = d.accumulatedDeg;
    }
    // The true step is 5° per sample. Noise must not multiply it.
    expect(worst).toBeLessThan(15);
  });
});

/**
 * ⭐⭐ THE REVERSAL, device-reported 2026-09-14: *"when I roll in one direction and
 * then roll in the other direction, there is a jump of the cube when I change the
 * roll directions."*
 *
 * ⛔ It was not a tuning problem. The detector accumulated the TURNING OF THE
 * TANGENT, and retracing an arc backwards flips the tangent by 180° at the cusp.
 * Measured on a 200° sweep reversed: the angle FROZE for twelve samples, jumped
 * **+150° in one step**, and finished **180° from where it started**.
 *
 * ⭐ The owner's §1.3 asked for the *"angle about the centroid"* all along — the
 * QUANTITY was right, only the estimator was wrong. The angle about a properly
 * fitted centre runs smoothly back down through zero.
 */
describe("⛔⛔ roll reversal", () => {
  /** Sweep clockwise to `forwardDeg`, then retrace counter-clockwise. */
  function reversal(forwardDeg: number, backDeg: number, stepDeg = 5): Sample[] {
    const r = mmToPx(15);
    const out: Sample[] = [];
    let t = 0;
    const at = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      out.push({ x: 300 + r * Math.cos(a), y: 300 + r * Math.sin(a), t: (t += 8) });
    };
    for (let d = 0; d <= forwardDeg; d += stepDeg) at(d);
    for (let d = forwardDeg - stepDeg; d >= forwardDeg - backDeg; d -= stepDeg) at(d);
    return out;
  }

  it("⭐⭐ reversing direction produces NO jump", () => {
    // ⛔ THE DEFECT, PINNED: the worst single step used to be 150°. The true step is
    // 5°, so anything beyond a small multiple of it is the cusp being read as a turn.
    const d = new RollDetector(cfg);
    let prev = 0;
    let worst = 0;
    for (const s of reversal(200, 200)) {
      d.push(s);
      worst = Math.max(worst, Math.abs(d.accumulatedDeg - prev));
      prev = d.accumulatedDeg;
    }
    expect(worst).toBeLessThan(15);
  });

  it("⭐ the angle actually REVERSES — it does not merely stop", () => {
    // A detector that froze on reversal would pass the jump test above and still be
    // useless. The angle must come back DOWN.
    const d = new RollDetector(cfg);
    const samples = reversal(200, 200);
    let peak = 0;
    for (const s of samples) {
      d.push(s);
      peak = Math.max(peak, d.accumulatedDeg);
    }
    expect(peak).toBeGreaterThan(100); // it rose on the way out
    expect(d.accumulatedDeg).toBeLessThan(peak - 150); // and fell on the way back
  });

  it("⭐ a reversal stays committed — it is still a roll", () => {
    // ⛔ Reversing is not "no longer circular": it is the SAME circle traced the
    // other way. Releasing here would hand a deliberate roll back to yaw/pitch.
    const d = new RollDetector(cfg);
    for (const s of reversal(200, 120)) d.push(s);
    expect(d.committed).toBe(true);
  });

  it("⛔ the roll does not track the finger during the un-measured startup arc", () => {
    // ⚠ INHERENT, and pinned so it is not later mistaken for a defect. Nothing can
    // be read until the fit window spans `rollStepDistance`, so a symmetric
    // out-and-back does NOT return the object to its starting orientation — the
    // outward leg is measured from later than the return leg finishes.
    const d = new RollDetector(cfg);
    for (const s of reversal(200, 200)) d.push(s);
    expect(d.accumulatedDeg).toBeLessThan(0); // short by the startup arc
    expect(Math.abs(d.accumulatedDeg)).toBeLessThan(60); // but only by that much
  });
});

/**
 * ⭐⭐⭐ THE VECTORS THAT WOULD HAVE CAUGHT THE WORST REGRESSION OF THIS ROW.
 *
 * 2026-09-14, on the deployed page: **roll had disappeared entirely.** Every vector
 * above was green. The reason is the predecessor's most expensive lesson, in the
 * exact form `METHOD` warns about: *a golden vector's fixture must be a specimen the
 * product would accept* — and every roll fixture here was a MATHEMATICALLY PERFECT
 * CIRCLE, which is a specimen no hand will ever produce.
 *
 * ⛔ A human "circle" is an ellipse with a drifting centre and a wobbling radius. The
 * circle fit's residual tolerance had been tied to POINTER NOISE (0.45 mm) — a
 * category error, because the residual measures how non-circular the HAND is, not how
 * noisy the sensor is. Nothing a hand can draw qualified.
 *
 * ⭐ So these fixtures are deliberately imperfect, and they are the primary guard:
 * any future change to the roll geometry must keep ALL of them rolling and NONE of
 * the negatives rolling.
 */
describe("⭐⭐⭐ REALISTIC gestures — imperfect, as hands actually are", () => {
  /** An ellipse with a drifting centre, a wobbling radius, and pointer noise. */
  function humanSwirl(o: {
    steps: number;
    radiusMm: number;
    aspect: number;
    driftMm: number;
    wobbleMm: number;
    stepDeg: number;
  }): Sample[] {
    let seed = 13;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed / 0x7fffffff) * 2 - 1;
    };
    const out: Sample[] = [];
    for (let i = 0; i <= o.steps; i++) {
      const a = (o.stepDeg * i * Math.PI) / 180;
      const rr = o.radiusMm + o.wobbleMm * Math.sin(a * 2.3);
      const drift = (o.driftMm * i) / o.steps;
      out.push({
        x: 400 + mmToPx(rr * o.aspect * Math.cos(a) + drift) + rnd() * 0.5,
        y: 400 + mmToPx(rr * Math.sin(a)) + rnd() * 0.5,
        t: i * 10,
      });
    }
    return out;
  }

  const MUST_ROLL: [string, Sample[]][] = [
    ["a near-circle with noise", humanSwirl({ steps: 80, radiusMm: 15, aspect: 1, driftMm: 0, wobbleMm: 0, stepDeg: 5 })],
    ["an ellipse, 1.3:1", humanSwirl({ steps: 80, radiusMm: 15, aspect: 1.3, driftMm: 0, wobbleMm: 0, stepDeg: 5 })],
    ["ellipse + wobble + 8mm drift", humanSwirl({ steps: 80, radiusMm: 15, aspect: 1.3, driftMm: 8, wobbleMm: 2, stepDeg: 5 })],
    ["a lazy WIDE swirl, R=35", humanSwirl({ steps: 80, radiusMm: 35, aspect: 1.2, driftMm: 5, wobbleMm: 3, stepDeg: 5 })],
    ["a TIGHT swirl, R=8", humanSwirl({ steps: 80, radiusMm: 8, aspect: 1.2, driftMm: 3, wobbleMm: 1, stepDeg: 5 })],
    ["a SLOW small swirl, R=12", humanSwirl({ steps: 160, radiusMm: 12, aspect: 1.25, driftMm: 4, wobbleMm: 1.5, stepDeg: 2.5 })],
  ];

  for (const [name, gesture] of MUST_ROLL) {
    it(`⭐ rolls: ${name}`, () => {
      expect(feed(gesture).committed).toBe(true);
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ⛔ AND THE NEGATIVES, WHICH ARE THE OTHER HALF. A detector that rolls on
  // everything passes every test above and ruins every drag.

  function alongX(amplitudeMm: number, wavelengthMm: number, steps: number): Sample[] {
    const out: Sample[] = [];
    for (let i = 0; i <= steps; i++) {
      const xMm = i * 1.2;
      out.push({
        x: 100 + mmToPx(xMm),
        y: 200 + mmToPx(amplitudeMm * Math.sin((2 * Math.PI * xMm) / wavelengthMm)),
        t: i * 10,
      });
    }
    return out;
  }

  it("⛔ does NOT roll: a small side-to-side wiggle", () => {
    expect(feed(alongX(3, 42, 200)).committed).toBe(false);
  });

  it("⛔ does NOT roll: a BIG lazy S-shaped drag", () => {
    // ⚠ THE HARDEST NEGATIVE, and it set `rollAngle`. One half-period of an
    // 8 mm × 90 mm wiggle contains ~67° of GENUINE arc at ~25 mm radius — it is not
    // distinguishable from a swirl by shape at all. Only the total swept angle
    // separates them, which is why the commit threshold moved 60° → 120°.
    expect(feed(alongX(8, 90, 200)).committed).toBe(false);
  });

  it("⛔ does NOT roll: a single gentle curved drag", () => {
    const out: Sample[] = [];
    for (let i = 0; i <= 120; i++) {
      const a = (i * 0.4 * Math.PI) / 180; // ~48° of sweep at R=90mm
      out.push({ x: 300 + mmToPx(90 * Math.cos(a)), y: 300 + mmToPx(90 * Math.sin(a)), t: i * 10 });
    }
    expect(feed(out).committed).toBe(false);
  });

  it("⛔ the residual tolerance is a FRACTION OF RADIUS, not a noise multiple", () => {
    // ⭐ The category error, pinned. Tying it to `pointerNoiseMm` gave a ~0.45 mm
    // tolerance, and roll vanished from the device. Scale-free is the point: one
    // tolerance must judge a tight swirl and a lazy wide one alike.
    expect(cfg.rollFitResidualFraction).toBeLessThan(1);
    const tight = humanSwirl({ steps: 80, radiusMm: 8, aspect: 1.2, driftMm: 3, wobbleMm: 1, stepDeg: 5 });
    const wide = humanSwirl({ steps: 80, radiusMm: 35, aspect: 1.2, driftMm: 5, wobbleMm: 3, stepDeg: 5 });
    expect(feed(tight).committed).toBe(true);
    expect(feed(wide).committed).toBe(true);
  });
});

/**
 * ⭐⭐ THE CIRCLE FIT ITSELF, PINNED AGAINST CIRCLES WHOSE ANSWER IS KNOWN EXACTLY.
 *
 * The estimator is the **Hyper** algebraic fit (Al-Sharadqah & Chernov 2009). Its
 * bias correction lives entirely in one coefficient, `a2 = 4·Cov_xy − 3·Mz² − Mzz`,
 * which is also the only thing separating it from Taubin — get it wrong and you have
 * silently built a different, worse estimator that still returns plausible circles.
 *
 * ⛔ It replaced a Kåsa fit, which the literature rates the WORST of the standard
 * algebraic fits: severely biased toward small circles on SHORT ARCS, which is
 * exactly the regime here. These vectors exist so that bias cannot creep back in
 * unnoticed — an estimator that is merely *plausible* passes every gesture test.
 */
describe("⭐⭐ Hyper circle fit — exact recovery", () => {
  function arcPoints(cxMm: number, cyMm: number, rMm: number, fromDeg: number, toDeg: number, n: number): Sample[] {
    const out: Sample[] = [];
    for (let i = 0; i <= n; i++) {
      const a = ((fromDeg + ((toDeg - fromDeg) * i) / n) * Math.PI) / 180;
      out.push({ x: mmToPx(cxMm + rMm * Math.cos(a)), y: mmToPx(cyMm + rMm * Math.sin(a)), t: i * 10 });
    }
    return out;
  }

  it("recovers the centre and radius of a FULL circle exactly", () => {
    const fit = fitCircle(arcPoints(50, 70, 15, 0, 360, 40));
    expect(fit).not.toBeNull();
    expect(pxToMm(fit!.cx)).toBeCloseTo(50, 6);
    expect(pxToMm(fit!.cy)).toBeCloseTo(70, 6);
    expect(pxToMm(fit!.r)).toBeCloseTo(15, 6);
    expect(fit!.residualPx).toBeCloseTo(0, 6);
  });

  it("⭐⭐ recovers a SHORT ARC exactly — the regime Kåsa gets wrong", () => {
    // ⛔ THE WHOLE REASON FOR THE CHANGE. A 40° arc is what the fit window actually
    // holds, and it is where Kåsa's bias toward small circles bites hardest.
    const fit = fitCircle(arcPoints(20, -30, 35, 10, 50, 25));
    expect(fit).not.toBeNull();
    expect(pxToMm(fit!.r)).toBeCloseTo(35, 4);
    expect(pxToMm(fit!.cx)).toBeCloseTo(20, 4);
    expect(pxToMm(fit!.cy)).toBeCloseTo(-30, 4);
  });

  it("recovers a range of radii on short arcs without systematic shrinkage", () => {
    // ⚠ Asserted as a RATIO, so a bias shows up as a consistent under-estimate
    // rather than hiding inside a per-case tolerance.
    for (const rMm of [5, 8, 15, 35, 60]) {
      const fit = fitCircle(arcPoints(0, 0, rMm, 0, 45, 20));
      expect(fit).not.toBeNull();
      expect(pxToMm(fit!.r) / rMm).toBeCloseTo(1, 3);
    }
  });

  it("⛔ returns null for collinear points — a straight drag has no circle", () => {
    const line: Sample[] = [];
    for (let i = 0; i <= 20; i++) line.push({ x: 100 + i * 5, y: 200 + i * 2, t: i * 10 });
    expect(fitCircle(line)).toBeNull();
  });

  it("⛔ returns null when there are too few points to determine a circle", () => {
    expect(fitCircle([{ x: 0, y: 0, t: 0 }, { x: 1, y: 1, t: 1 }, { x: 2, y: 0, t: 2 }])).toBeNull();
  });
});

/**
 * ⭐⭐ TRANSITION COST — how far the finger must travel before roll engages, and
 * before it hands back. Device-reported 2026-09-14: *"the lag at transition between
 * linear to circular finger movements and between circular to linear finger
 * movements is too big."*
 *
 * ⭐ Both were paid for by numbers chosen to compensate for the OLD Kåsa estimator:
 *   * `rollAngle` was 120° because Kåsa could not tell a lazy S-drag from a swirl.
 *     With Hyper, every value from 50° to 120° gives 4/4 swirls and ZERO false
 *     positives — the threshold was paying for a bad estimator, at 16 mm of lag.
 *   * the fit window was one length for both deciding AND tracking. A long arc makes
 *     the DECISION reliable; once decided it is only tracking a centre, and a long
 *     tracking window is pure release lag.
 *
 * ⛔ These are BUDGETS, not exact values — they move when the geometry is retuned.
 * They exist so a retune cannot quietly make the gesture sluggish again.
 */
describe("⭐⭐ transition cost budgets", () => {
  /** Straight lead-in, then a swirl. Returns mm of swirl travelled before commit. */
  function engageAfterMm(radiusMm: number): number {
    const d = new RollDetector(cfg);
    let t = 0;
    for (let i = 1; i <= 40; i++) d.push({ x: 100 + mmToPx(i * 0.8), y: 300, t: (t += 10) });
    const startX = 100 + mmToPx(32);
    let travel = 0;
    for (let i = 0; i <= 500; i++) {
      const a = (3 * i * Math.PI) / 180;
      if (i > 0) travel += (radiusMm * 3 * Math.PI) / 180;
      d.push({
        x: startX + mmToPx(radiusMm * Math.cos(a) - radiusMm),
        y: 300 + mmToPx(radiusMm * Math.sin(a)),
        t: (t += 10),
      });
      if (d.committed) return travel;
    }
    return Infinity;
  }

  /** Swirl to commit, then depart straight. Returns mm of straight travel to release. */
  function releaseAfterMm(radiusMm: number): number {
    const d = new RollDetector(cfg);
    let t = 0;
    const pts: Sample[] = [];
    for (let i = 0; i <= 200; i++) {
      const a = (5 * i * Math.PI) / 180;
      pts.push({
        x: 400 + mmToPx(radiusMm * Math.cos(a)),
        y: 400 + mmToPx(radiusMm * Math.sin(a)),
        t: (t += 10),
      });
    }
    for (const p of pts) d.push(p);
    expect(d.committed).toBe(true);
    const last = pts[pts.length - 1]!;
    const prev = pts[pts.length - 2]!;
    const n = Math.hypot(last.x - prev.x, last.y - prev.y);
    for (let i = 1; i <= 800; i++) {
      const travel = i * 0.5;
      d.push({
        x: last.x + ((last.x - prev.x) / n) * mmToPx(travel),
        y: last.y + ((last.y - prev.y) / n) * mmToPx(travel),
        t: (t += 10),
      });
      if (!d.committed) return travel;
    }
    return Infinity;
  }

  it("⭐ roll ENGAGES within a reasonable stretch of swirl", () => {
    // ⛔ Was 44 mm at the old rollAngle of 120°. The budget guards the improvement.
    // ⭐ MEASURED: 43.6 mm at R=8, 28.3 at R=15, 29.3 at R=35 — down from 44 mm at
    // R=15 under the old 120° threshold. The budget carries margin over the worst.
    for (const r of [8, 15, 35]) expect(engageAfterMm(r)).toBeLessThan(50);
  });

  it("⭐ roll RELEASES within a reasonable stretch of straight drag", () => {
    // ⛔ Was ~40 mm with one window for both deciding and tracking, and ~83 mm before
    // that. ⚠ It cannot go much lower: a lazy WIDE swirl and a straight line are
    // genuinely similar over a short window, and narrowing the radius band to
    // separate them was measured to drop 4/4 detection to 2/4.
    // ⭐ MEASURED on an identical fixture, old settings vs new:
    //     R= 8mm   57.0 → 47.0
    //     R=15mm   67.5 → 56.0
    //     R=35mm   70.5 → 56.0
    // ⚠ ~18%, and that is close to the structural limit. A shorter tracking arc
    // releases faster but makes committed rolls DROP OUT mid-swirl: 130° holds 4/4
    // realistic swirls, 110° loses the tight one. And narrowing the radius band to
    // separate a lazy wide swirl from a straight line was measured to take detection
    // from 4/4 to 2/4. ⛔ The two are in genuine tension; only a device settles it.
    for (const r of [8, 15, 35]) expect(releaseAfterMm(r)).toBeLessThan(65);
  });

  it("⛔ the tracking window is SHORTER than the deciding window", () => {
    // The whole basis of the release improvement, asserted so a retune keeps it.
    expect(cfg.rollTrackArcDeg).toBeLessThan(cfg.rollFitArcDeg);
  });
});

/**
 * ⭐⭐ THE SHIPPED ROLL SMOOTHING, AND WHY IT CONTRADICTS MY OWN MEASUREMENT.
 *
 * A/B'd by finger on 2026-09-14 (`?rollFilterBeta=0` against the default) and the
 * filtered version was judged better. ⛔ My metric had scored it as removing 13% of
 * the noise for ~30° per gesture of LAG, i.e. a bad trade. The metric was wrong:
 *
 * 1. the synthetic swirl rolled at ~500 deg/s, about twice what a hand does, so the
 *    predicted lag (`slope × τ`) was inflated by roughly the same factor;
 * 2. an error-against-ground-truth metric cannot score *"feels steady"*, which is
 *    the thing actually being traded for.
 *
 * ⭐ Third time on this row that a device judgement has overturned a confident
 * synthetic number. These vectors pin the shipped setting so it is not "tidied" back
 * by someone reading the old measurement.
 */
describe("⭐⭐ shipped roll smoothing", () => {
  it("⛔ the filter SHIPS ENGAGED — beta is 0, which is full smoothing", () => {
    expect(cfg.rollFilterBeta).toBe(0);
    expect(cfg.rollFilterMinCutoff).toBeGreaterThan(0);
  });

  it("the smoothed channel actually differs from the raw one", () => {
    // ⚠ A filter shipped "on" that produced an identical signal would be the 2026-09-14
    // defect all over again — beta so high the filter was never switched on, and a
    // null result reported as if it meant something.
    const d = feed(arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 70, clockwise: true }));
    expect(d.committed).toBe(true);
    expect(d.smoothedDeg).not.toBe(d.accumulatedDeg);
  });

  it("...but still tracks it — smoothing must not become drift", () => {
    const d = feed(arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 90, clockwise: true }));
    expect(Math.abs(d.smoothedDeg - d.accumulatedDeg)).toBeLessThan(40);
    // Same sign and same order of magnitude: it is a lag, not a different answer.
    expect(Math.sign(d.smoothedDeg)).toBe(Math.sign(d.accumulatedDeg));
  });

  it("⭐ the COMMIT threshold still reads the RAW angle, unlagged", () => {
    // Lagging a threshold crossing makes the gesture feel late, which is a different
    // complaint from the one the filter is there to answer.
    const d = feed(arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 70, clockwise: true }));
    expect(Math.abs(d.accumulatedDeg)).toBeGreaterThanOrEqual(cfg.rollAngle);
  });
});

/**
 * ⭐⭐ `gainRoll`, wired 2026-09-14 on the owner's instruction. It had been declared
 * and unused, which `tests/config_debt.test.ts` exists to catch — and did.
 *
 * ⛔ The point of these vectors is the SEPARATION: the gain scales what the object is
 * turned by, and must not touch what the COMMIT threshold reads.
 */
describe("⭐⭐ roll gain", () => {
  const swirl = (c = cfg) =>
    feed(arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 70, clockwise: true }), c);

  it("⭐ the DEFAULT is direct manipulation — the cube turns as far as the finger swept", () => {
    expect(cfg.gainRoll).toBe(1);
    const d = swirl();
    expect(d.appliedDeg).toBeCloseTo(d.smoothedDeg, 9);
  });

  it("⭐ a gain scales the APPLIED angle", () => {
    const doubled = swirl({ ...cfg, gainRoll: 2 });
    const plain = swirl();
    expect(doubled.appliedDeg).toBeCloseTo(plain.appliedDeg * 2, 6);
  });

  it("⛔⛔ but it does NOT move the commit threshold", () => {
    // ⚠ THE REASON THE GAIN IS A THIRD CHANNEL AND NOT A MULTIPLICATION AT THE SOURCE.
    // Scaling `accumulatedDeg` would silently scale `rollAngle` too: a gain of 2 would
    // commit a roll after HALF the sweep, coupling "how far the cube turns" to "how
    // much of a circle counts as a roll" — two unrelated questions.
    const plain = swirl();
    const doubled = swirl({ ...cfg, gainRoll: 2 });
    expect(doubled.accumulatedDeg).toBeCloseTo(plain.accumulatedDeg, 9);
  });

  it("⛔ and it does not change WHEN a roll commits", () => {
    // The same gesture must become a roll at the same moment, whatever the gain.
    const commitStep = (gain: number) => {
      const d = new RollDetector({ ...cfg, gainRoll: gain });
      const samples = arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 70, clockwise: true });
      for (let i = 0; i < samples.length; i++) {
        d.push(samples[i]!);
        if (d.committed) return i;
      }
      return -1;
    };
    expect(commitStep(2)).toBe(commitStep(1));
    expect(commitStep(0.25)).toBe(commitStep(1));
  });

  it("⭐ a gain below 1 makes the object turn LESS than the finger", () => {
    const slow = swirl({ ...cfg, gainRoll: 0.25 });
    expect(Math.abs(slow.appliedDeg)).toBeLessThan(Math.abs(slow.smoothedDeg));
    // ⚠ Sign must survive — a gain is a magnitude, not a direction.
    expect(Math.sign(slow.appliedDeg)).toBe(Math.sign(slow.smoothedDeg));
  });
});
