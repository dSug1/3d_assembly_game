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
import { RollDetector } from "../src/input/roll";
import { MotionTracker } from "../src/input/motion";
import { mmToPx } from "../src/core/units";

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

function feed(samples: readonly Sample[]): RollDetector {
  const d = new RollDetector(cfg);
  for (const s of samples) d.push(s);
  return d;
}

describe("roll detection", () => {
  // ⭐ Four starting phases. A detector that only works when the gesture happens to
  // begin on the +x side is not a detector, and one starting phase cannot tell.
  for (const startDeg of [0, 90, 180, 270]) {
    it(`a CLOCKWISE circle started at ${startDeg}° commits, with a POSITIVE angle`, () => {
      const d = feed(arc({ radiusMm: 15, startDeg, stepDeg: 5, steps: 30, clockwise: true }));
      expect(d.committed).toBe(true);
      expect(d.accumulatedDeg).toBeGreaterThan(0);
      expect(Math.abs(d.accumulatedDeg)).toBeGreaterThanOrEqual(cfg.rollAngle);
    });

    it(`a COUNTER-CLOCKWISE circle started at ${startDeg}° commits, with a NEGATIVE angle`, () => {
      const d = feed(arc({ radiusMm: 15, startDeg, stepDeg: 5, steps: 30, clockwise: false }));
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
    const d = feed(arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 30, clockwise: true }));
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
    const d = feed(arc({ radiusMm: 60, startDeg: 0, stepDeg: 3, steps: 40, clockwise: true }));
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
    const circle = arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 30, clockwise: true });
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

    const long = feed([...circle, ...straightFor(cfg.rollReleaseDistance * 3)]);
    expect(long.committed).toBe(false); // sustained straight travel hands back
    expect(long.accumulatedDeg).toBe(0); // and a new roll must earn rollAngle again
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
    const circling = noisyCircle(30, 0.5);
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
    const circling = noisyCircle(30, 0.5);
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
 * ⭐ THE 1€ FILTER on the displayed roll angle. Casiez, Roussel & Vogel, CHI 2012.
 * See `src/input/one_euro.ts` for the citation, the licence (BSD/MIT reference
 * implementations, no patent asserted) and why it was chosen over Kalman and DES.
 */
describe("1€-filtered roll angle", () => {
  it("⭐ the smoothed angle tracks the raw one — smoothing is not drift", () => {
    // A filter that was quiet because it stopped following would pass a jitter test
    // and be useless. Over a long sweep the two must agree closely.
    const d = feed(arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 60, clockwise: true }));
    expect(Math.abs(d.smoothedDeg - d.accumulatedDeg)).toBeLessThan(10);
  });

  it("⭐ it reduces noise on a noisy sweep", () => {
    // ⚠ Compared against the RAW channel on the SAME detector, so the two differ
    // only by the filter — not by a second implementation that could disagree.
    let seed = 11;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed / 0x7fffffff) * 2 - 1;
    };
    const r = mmToPx(15);
    const clean: Sample[] = [];
    const noisy: Sample[] = [];
    for (let i = 0; i <= 60; i++) {
      const a = (5 * i * Math.PI) / 180;
      const x = 300 + r * Math.cos(a);
      const y = 300 + r * Math.sin(a);
      clean.push({ x, y, t: i * 8 });
      noisy.push({ x: x + rnd() * 0.5, y: y + rnd() * 0.5, t: i * 8 });
    }
    const c = new RollDetector(cfg);
    const n = new RollDetector(cfg);
    let rawErr = 0;
    let smoothErr = 0;
    for (let i = 0; i <= 60; i++) {
      c.push(clean[i]!);
      n.push(noisy[i]!);
      if (!c.committed || !n.committed) continue;
      rawErr = Math.max(rawErr, Math.abs(n.accumulatedDeg - c.accumulatedDeg));
      smoothErr = Math.max(smoothErr, Math.abs(n.smoothedDeg - c.smoothedDeg));
    }
    expect(smoothErr).toBeLessThan(rawErr);
  });

  it("a released roll resets the filter, so the next one does not race back", () => {
    const circle = arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 40, clockwise: true });
    const d = feed(circle);
    expect(d.committed).toBe(true);
    const last = circle[circle.length - 1]!;
    const prev = circle[circle.length - 2]!;
    const ux = (last.x - prev.x) / Math.hypot(last.x - prev.x, last.y - prev.y);
    const uy = (last.y - prev.y) / Math.hypot(last.x - prev.x, last.y - prev.y);
    for (let i = 1; i <= 60; i++) {
      d.push({ x: last.x + ux * i * 4, y: last.y + uy * i * 4, t: last.t + i * 10 });
    }
    expect(d.committed).toBe(false);
    expect(d.accumulatedDeg).toBe(0);
    expect(d.smoothedDeg).toBe(0); // ⛔ not left primed with the abandoned angle
  });
});
