/**
 * GOLDEN VECTORS — the phantom target (rule 6's velocity lead).
 *
 * ⭐ The first vector is the one that justifies the feature existing at all: the lead
 * must do something the spring's own knobs cannot. If it could be reproduced by changing
 * τ or ζ, it would be a third name for a thing we already have twice.
 */
import { describe, expect, it } from "vitest";
import { exponentialSmooth, phantomTarget, neutralLeadSec } from "../src/input/lead";
import { advanceFollow, type FollowState } from "../src/input/follow";

const DT = 1 / 120;

/**
 * A drag at a steady rate, with the whole pipeline: finger → smoothed velocity →
 * phantom → spring → object. Returns the trail and the overshoot after a dead stop.
 */
function pipeline(tau: number, zeta: number, leadSec: number, rateMmPerS: number) {
  let s: FollowState = { x: 0, v: 0 };
  let target = 0;
  let lastTarget = 0;
  let vT = 0;
  let trail = 0;
  for (let t = 0; t < 1.5; t += DT) {
    // ⚠ THE TARGET IS SAMPLED AT THE STEP'S MIDPOINT, not its end. Advancing it first
    // and integrating after puts the target half a sample ahead of the continuous
    // finger, and that bias — exactly `rate·dt/2`, 0.21 mm at 50 mm/s — is otherwise
    // indistinguishable from a lead that does not quite cancel. The fixture was wrong,
    // not the code; a looser tolerance would have hidden the difference for ever.
    target = rateMmPerS * (t + DT / 2);
    vT = exponentialSmooth(vT, (target - lastTarget) / DT, tau, DT);
    lastTarget = target;
    s = advanceFollow(s, phantomTarget(target, vT, leadSec), tau, zeta, DT);
    // ⚠ COMPARED AT THE SAME INSTANT. `s.x` is the object at the END of the step, so it
    // is judged against where the finger is at the END of the step — not against
    // `target`, which is the step's MIDPOINT value the spring was driven with. Those
    // differ by exactly `rate·dt/2`, and reading the trail off the wrong one made a
    // perfect cancellation look like a 0.21 mm residual. Mistake shape 2, in a fixture.
    // ⚠ The window opens at 1.2 s, not 0.35 s. Two transients have to finish first —
    // the spring's (~4τ/ζ) AND the velocity smoother's (~4τ) — and they compound. At
    // τ=90 ms that is over 0.7 s, so a window opening at 0.35 s caught the tail of the
    // transient and reported it as a 1.7 mm steady-state residual. ⭐ The giveaway was
    // that it did NOT shrink when the timestep was quartered: discretisation error does,
    // an unfinished transient does not.
    if (t > 1.2) trail = Math.max(trail, Math.abs(rateMmPerS * (t + DT) - s.x));
  }
  const stopAt = target;
  let overshoot = 0;
  for (let i = 0; i < 600; i++) {
    vT = exponentialSmooth(vT, 0, tau, DT); // the finger stopped: velocity decays
    s = advanceFollow(s, phantomTarget(stopAt, vT, leadSec), tau, zeta, DT);
    overshoot = Math.max(overshoot, s.x - stopAt);
  }
  return { trail, overshoot, final: s.x, stopAt };
}

describe("the phantom target", () => {
  it("⭐⭐ at lead = 2·ζ·τ the object sits ON the finger during a steady drag", () => {
    // ⛔ THE DISTINGUISHED VALUE, AND THE REASON THIS IS NOT A TASTE KNOB. The follower
    // trails 2·ζ·τ·rate; the phantom leads lead·rate; at equality they cancel exactly,
    // at every drag speed — which a spring tuning cannot do, because its trail is
    // proportional to rate and its knobs are not.
    for (const [tau, zeta] of [
      [0.015, 0.35],
      [0.03, 0.65],
      [0.09, 1],
    ]) {
      const lead = neutralLeadSec(tau!, zeta!);
      for (const rate of [50, 100, 300]) {
        const withLead = pipeline(tau!, zeta!, lead, rate);
        const without = pipeline(tau!, zeta!, 0, rate);
        expect(withLead.trail).toBeLessThan(0.1 * rate * tau!); // ≈ gone
        expect(withLead.trail).toBeLessThan(without.trail / 4);
      }
    }
  });

  it("⭐ the cancellation holds at EVERY drag speed — a spring tuning cannot do that", () => {
    // ⚠ This is the vector that stops the feature being re-derived as "just stiffen it".
    const tau = 0.015;
    const zeta = 0.35;
    const lead = neutralLeadSec(tau, zeta);
    // ⭐ The bar SCALES WITH SPEED, because any residual must: what is being claimed is
    // that the trail no longer grows in proportion to the drag, so a fixed millimetre
    // bar would pass for a trivial reason at the slow end.
    for (const r of [40, 120, 400]) {
      expect(pipeline(tau, zeta, lead, r).trail).toBeLessThan(0.1 * r * tau);
    }
    // …whereas with no lead the trail grows in proportion to the speed.
    const bare = [40, 120, 400].map((r) => pipeline(tau, zeta, 0, r).trail);
    expect(bare[2]! / bare[0]!).toBeGreaterThan(5);
  });

  it("⛔ the price is OVERSHOOT on a dead stop, and it grows with the lead", () => {
    // ⚠ Named so it is not discovered on the device as a surprise: the phantom is still
    // out ahead when the finger stops, and the object has to come back.
    const tau = 0.015;
    const zeta = 0.35;
    const none = pipeline(tau, zeta, 0, 300).overshoot;
    const neutral = pipeline(tau, zeta, neutralLeadSec(tau, zeta), 300).overshoot;
    const eager = pipeline(tau, zeta, 3 * neutralLeadSec(tau, zeta), 300).overshoot;
    expect(neutral).toBeGreaterThan(none);
    expect(eager).toBeGreaterThan(neutral);
  });

  it("⛔⛔ it always comes to rest ON the finger, whatever the lead", () => {
    // ⭐ THE PROPERTY THAT MAKES IT SAFE. A lead that left a standing offset would mean
    // the object stops somewhere other than where you put it — unusable for assembly,
    // where the whole point is to place a part exactly.
    for (const lead of [0, 0.01, 0.05, 0.2]) {
      const r = pipeline(0.015, 0.35, lead, 300);
      expect(r.final).toBeCloseTo(r.stopAt, 6);
    }
  });

  it("⛔ lead = 0 is EXACTLY the old behaviour", () => {
    expect(phantomTarget(7, 1000, 0)).toBe(7);
    expect(phantomTarget(7, 1000, -1)).toBe(7);
  });
});

describe("the velocity estimate", () => {
  it("⛔⛔ it is SMOOTHED over a stated baseline — not a two-sample difference", () => {
    // ⚠ MISTAKE SHAPE 1, which has cost this project three defects. A raw difference of
    // two pointer samples is noise divided by a few milliseconds, and here it would be
    // MULTIPLIED by the lead and written straight into where the object is drawn.
    // Injected noise of ±0.5 mm on a steady 100 mm/s ramp:
    // ⭐⭐ AND THE QUANTITY MEASURED IS THE ONE THAT MATTERS: not the spread of the
    // velocity estimate, but how far that noise MOVES THE OBJECT once multiplied by the
    // lead — millimetres on the glass. Judging the velocity would be mistake shape 2,
    // measuring a different quantity than the one asked about.
    const LEAD = neutralLeadSec(0.015, 0.35);
    const jitter = (tauV: number) => {
      let seed = 7;
      const rnd = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return (seed / 0x7fffffff) * 2 - 1;
      };
      let v = 0;
      let prev = 0;
      let worst = 0;
      for (let i = 0; i < 400; i++) {
        const target = i * 100 * DT + rnd() * 0.5; // ±0.5 mm of pointer noise
        v = exponentialSmooth(v, (target - prev) / DT, tauV, DT);
        prev = target;
        if (i > 100) worst = Math.max(worst, Math.abs(v - 100) * LEAD);
      }
      return worst; // mm of phantom displacement caused by noise alone
    };
    const raw = jitter(0); // tau 0 = no smoothing at all: the two-sample difference
    const smoothed = jitter(0.015);
    expect(raw).toBeGreaterThan(1); // ⛔ mm of pure noise written into the position
    // ⚠ 2.5×, measured — not a round number chosen first. At τ=15 ms and 120 Hz the
    // smoother averages barely two samples, so it cannot do more, and saying "3×" would
    // be asserting a hope. The absolute bar below is the one that protects the feature.
    expect(smoothed).toBeLessThan(raw / 2.5);
    // ⚠ AND THE ABSOLUTE BAR: the lead must not add more jitter than the pointer's own
    // measured noise (`pointerNoiseMm` = 0.761 mm), or the feature makes the object
    // visibly shaky in exchange for removing a lag nobody could see.
    expect(smoothed).toBeLessThan(0.761);
  });

  it("⛔ the smoother is FRAME-RATE INDEPENDENT", () => {
    // ⚠ A fixed per-frame fraction would not be — the same defect PhysX's damping has.
    const converge = (n: number) => {
      let v = 0;
      for (let i = 0; i < n; i++) v = exponentialSmooth(v, 100, 0.015, 0.3 / n);
      return v;
    };
    expect(converge(36)).toBeCloseTo(converge(9), 9);
    expect(converge(144)).toBeCloseTo(converge(9), 9);
  });

  it("⛔ degenerate dt changes nothing; tau = 0 passes the value straight through", () => {
    for (const dt of [0, -1, Number.NaN]) {
      expect(exponentialSmooth(3, 99, 0.015, dt)).toBe(3);
    }
    expect(exponentialSmooth(3, 99, 0, DT)).toBe(99);
  });
});
