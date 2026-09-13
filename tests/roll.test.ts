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
    // A 3 mm baseline on a 15 mm circle is 2·asin(3/30) = 11.5° of arc.
    const swept = 50;
    const measured = feed(
      arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 10, clockwise: true }),
    ).accumulatedDeg;
    const lost = swept - measured;
    expect(lost).toBeGreaterThan(0);
    expect(lost).toBeLessThan(20);
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
    const coarse = arc({ radiusMm: 15, startDeg: 0, stepDeg: 20, steps: 12, clockwise: true });
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

  it("a committed roll LATCHES, and a straight continuation adds no turning", () => {
    // ⚠ An earlier version of this vector TELEPORTED the finger to a far-away point
    // to make its "straight run". That is ~6000 mm/s and no finger does it; the
    // detector rightly read the jump as a direction change. `METHOD`: a fixture must
    // be a specimen the product would accept. This one continues TANGENTIALLY from
    // where the circle ended, which is what a real finger straightening out does.
    const circle = arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 30, clockwise: true });
    const d = feed(circle);
    expect(d.committed).toBe(true);
    const at = d.accumulatedDeg;

    const last = circle[circle.length - 1]!;
    const prev = circle[circle.length - 2]!;
    const ux = last.x - prev.x;
    const uy = last.y - prev.y;
    const n = Math.hypot(ux, uy);
    const straightTo = (i: number) => ({
      x: last.x + (ux / n) * i * 4,
      y: last.y + (uy / n) * i * 4,
      t: last.t + i * 10,
    });
    for (let i = 1; i <= 10; i++) d.push(straightTo(i));
    const afterTen = d.accumulatedDeg;
    for (let i = 11; i <= 40; i++) d.push(straightTo(i));
    const afterForty = d.accumulatedDeg;

    expect(d.committed).toBe(true); // ⛔ nothing un-commits a roll

    // ⭐⭐ THE CLAIM THAT MATTERS: a straight path does not accumulate. Thirty more
    // samples of it must add nothing, so no gate is needed to stop them.
    expect(Math.abs(afterForty - afterTen)).toBeLessThan(0.5);

    // ⚠ There IS a one-off step of ~5° as the path straightens, and it is inherent,
    // not a defect. A trailing chord LAGS the true tangent by half the arc it spans
    // (here 11.5°/2 ≈ 5.8°), and straightening pays that lag off exactly once. The
    // lag is the price of measuring direction over a baseline instead of between two
    // adjacent samples, which is what killed the jitter. Pinned so it stays one-off.
    expect(Math.abs(afterTen - at)).toBeLessThan(8);
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
