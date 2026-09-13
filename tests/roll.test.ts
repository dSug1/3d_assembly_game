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

  it("the accumulated angle IS the swept angle, not an artefact of the centre estimate", () => {
    // ⭐⭐ THE REASON FOR THE DEPARTURE FROM §1.3, PINNED AS A NUMBER. The turning
    // angle of a circular arc equals its central angle EXACTLY — the spec's running
    // centroid sits at 0.955 R and cannot produce it. See src/input/roll.ts.
    // ⚠ Deliberately BELOW `rollAngle`, so the identity is read on its own: 10 steps
    // give 9 turns of 5° = 45°. An earlier version swept past the commit threshold
    // and read whatever the latch happened to stop at, which tested the latch, not
    // the identity.
    const d = feed(arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 10, clockwise: true }));
    expect(d.committed).toBe(false);
    expect(d.accumulatedDeg).toBeCloseTo(45, 6);
  });

  it("⭐ the angle KEEPS accumulating past the commit threshold", () => {
    // ⛔ Only the DECISION latches. 2quinte rotates the object BY this value, so a
    // detector that froze it at `rollAngle` would let the object roll 60° and then
    // stop dead while the finger kept circling.
    const d = feed(arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 14, clockwise: true }));
    expect(d.committed).toBe(true);
    expect(d.accumulatedDeg).toBeCloseTo(65, 6); // 13 turns of 5°
    expect(d.accumulatedDeg).toBeGreaterThan(cfg.rollAngle);
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

  it("a committed roll LATCHES — a later straight run cannot un-commit it", () => {
    const circle = arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 30, clockwise: true });
    const d = feed(circle);
    expect(d.committed).toBe(true);
    const at = d.accumulatedDeg;
    for (let i = 1; i <= 20; i++) d.push({ x: 500 + i * 8, y: 400, t: 400 + i * 10 });
    expect(d.committed).toBe(true);
    expect(d.accumulatedDeg).toBe(at);
  });

  it("a duplicated sample is skipped, not read as a zero turn", () => {
    const circle = arc({ radiusMm: 15, startDeg: 0, stepDeg: 5, steps: 10, clockwise: true });
    const withDupes: Sample[] = [];
    for (const s of circle) {
      withDupes.push(s);
      withDupes.push({ ...s, t: s.t + 1 }); // same position, later timestamp
    }
    const d = feed(withDupes);
    expect(d.accumulatedDeg).toBeCloseTo(45, 6); // identical to the clean arc
  });
});
