/**
 * GOLDEN VECTORS — the `pointerNoiseMm` measurement.
 *
 * ⭐ `METHOD`: *the instrument is a suspect, always.* This one measures the number the
 * **sagitta criterion** is judged against, and getting that wrong once already took
 * roll off the device entirely. So the vectors check it recovers a KNOWN injected
 * noise, and that the two ways of holding a finger badly — drifting and moving —
 * produce an obviously worse reading rather than a plausible wrong one.
 */
import { describe, expect, it } from "vitest";
import { PointerNoiseMeter } from "../src/input/noise_meter";
import { mmToPx } from "../src/core/units";
import type { Sample } from "../src/input/motion";

/** Gaussian-ish noise from a deterministic source, so a vector cannot flap. */
function noisy(sigmaMm: number, n: number, driftMmPerSample = 0): Sample[] {
  let seed = 20260914;
  const rnd = () => {
    // Sum of three uniforms ≈ normal, scaled to unit variance.
    let u = 0;
    for (let i = 0; i < 3; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      u += (seed / 0x7fffffff) * 2 - 1;
    }
    return u;
  };
  const out: Sample[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: 400 + mmToPx(rnd() * sigmaMm + i * driftMmPerSample),
      y: 300 + mmToPx(rnd() * sigmaMm),
      t: i * 8,
    });
  }
  return out;
}

const feed = (samples: readonly Sample[]) => {
  const m = new PointerNoiseMeter();
  for (const s of samples) m.push(s);
  return m;
};

describe("pointer noise meter", () => {
  it("⭐ recovers a KNOWN injected noise, within a factor of two", () => {
    // ⚠ A factor of two is the honest tolerance: the estimate is an RMS over 32
    // samples of a synthetic distribution, and `pointerNoiseMm` feeds a criterion
    // that uses it with a 2× margin anyway. Precision beyond that would be theatre.
    for (const sigma of [0.05, 0.15, 0.4]) {
      const got = feed(noisy(sigma, 400)).floorMm;
      expect(got).toBeGreaterThan(sigma / 2);
      expect(got).toBeLessThan(sigma * 2);
    }
  });

  it("⭐⭐ a DRIFTING finger does not inflate the answer much", () => {
    // ⛔ THE REASON THE MEAN IS TRAILING AND SHORT. Hand tremor and drift are low
    // frequency and are NOT a property of the digitiser; a naive spread over a long
    // hold would measure mostly those and overstate the noise several times over —
    // which would then forbid good configs through the sagitta rule.
    const still = feed(noisy(0.1, 400)).floorMm;
    const drifting = feed(noisy(0.1, 400, 0.02)).floorMm; // 8 mm of drift over the hold
    expect(drifting).toBeLessThan(still * 2);
  });

  it("⭐⭐ MOVING can only RAISE the reading, never lower it", () => {
    // The floor is the quietest window seen, so a finger that shifts halfway through
    // cannot spoil a measurement taken while it was still.
    const m = new PointerNoiseMeter();
    for (const s of noisy(0.1, 200)) m.push(s);
    const quiet = m.floorMm;
    for (let i = 0; i < 200; i++) m.push({ x: 400 + i * 20, y: 300, t: 2000 + i * 8 });
    expect(m.rmsMm).toBeGreaterThan(quiet * 5); // the CURRENT reading shows the motion
    expect(m.floorMm).toBe(quiet); // …but the answer is unchanged
  });

  it("⭐⭐ a hold that SETTLES improves the answer — the window must be trailing", () => {
    // ⛔ THE VECTOR THAT CAUGHT A REAL HOLE. Taking the minimum over a window that only
    // ever GROWS looks equivalent: the earliest windows are short, so the drifting and
    // moving vectors both still pass. But every later window then contains the noisy
    // start, so the floor is fixed in the first fraction of a second and can never
    // improve — and a finger that is still settling when it lands would pin a wrong,
    // permanently high answer with no way for the person holding it to fix it.
    const m = new PointerNoiseMeter();
    for (let i = 0; i < 60; i++) m.push({ x: 400 + mmToPx(i % 2 ? 1.2 : -1.2), y: 300, t: i * 8 });
    const settled = feed(noisy(0.08, 300));
    for (const s of noisy(0.08, 300)) m.push({ ...s, t: s.t + 1000 });
    expect(m.floorMm).toBeLessThan(settled.floorMm * 1.5);
  });

  it("⛔ reports NaN until it has enough samples — never a fake zero", () => {
    // A zero would read as a perfect sensor rather than an absent measurement, and
    // would sail through the sagitta criterion by making every config look fine.
    const m = new PointerNoiseMeter();
    expect(Number.isNaN(m.floorMm)).toBe(true);
    for (const s of noisy(0.1, 4)) m.push(s);
    expect(Number.isNaN(m.floorMm)).toBe(true);
  });

  it("⛔ measures distance from the mean POINT, not per axis", () => {
    // ⚠ A per-axis figure would be the wrong quantity by √2 against the sagitta,
    // which is a bow measured in the plane — and nothing would have noticed.
    // Noise on ONE axis only: the planar RMS must equal that axis's RMS.
    const oneAxis: Sample[] = [];
    for (let i = 0; i < 200; i++) {
      oneAxis.push({ x: 400 + mmToPx(i % 2 === 0 ? 0.1 : -0.1), y: 300, t: i * 8 });
    }
    // ⚠ 0.0994, not 0.1000: the quietest window is the SHORTEST one (9 samples), whose
    // mean is not exactly zero for an alternating signal. A ~0.6 % bias on a number
    // used with a 2× margin — worth knowing, not worth chasing.
    expect(feed(oneAxis).floorMm).toBeCloseTo(0.1, 2);
  });

  it("resets cleanly between measurements", () => {
    const m = feed(noisy(0.3, 200));
    expect(m.floorMm).toBeGreaterThan(0);
    m.reset();
    expect(Number.isNaN(m.floorMm)).toBe(true);
    expect(m.samples).toBe(0);
  });
});
