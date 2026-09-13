import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { MotionTracker, type Sample } from "../src/input/motion";
import { detectFlick, trimBuffer } from "../src/input/flick";
import { mmToPx } from "../src/core/units";

const cfg = DEFAULT_CONFIG;

/** A straight run of samples at a constant speed, in mm/s along +x. */
function run(speedMmPerS: number, ms: number, stepMs = 10, x0 = 0, t0 = 0): Sample[] {
  const out: Sample[] = [];
  for (let t = 0; t <= ms; t += stepMs) {
    out.push({ x: x0 + mmToPx((speedMmPerS * t) / 1000), y: 0, t: t0 + t });
  }
  return out;
}

describe("motion state", () => {
  it("refuses a config that would chatter", () => {
    expect(
      () => new MotionTracker({ ...cfg, moveEnterDistance: 1, moveExitDistance: 1 }),
    ).toThrow();
  });

  it("a resting, jittering finger stays STATIONARY -- for a LONG time", () => {
    const m = new MotionTracker(cfg);
    // ⛔⛔ THE TEST THAT FOUND THE SPEC DEFECT. Ten seconds of sub-deadband jitter.
    // With the spec's literal "accumulated travel" the PATH LENGTH is a random walk
    // and grows without bound, so this crossed the threshold in under half a second
    // and every resting finger read MOVING. Net displacement from the anchor is
    // bounded, so it does not. See src/input/motion.ts.
    for (let t = 0; t < 10_000; t += 10) {
      m.push({ x: (t % 20) * 0.05, y: (t % 30) * 0.03, t });
    }
    expect(m.current).toBe("STATIONARY");
  });

  it("...but a slow DELIBERATE drag still becomes MOVING", () => {
    // ⭐ The other half: net displacement must still catch a real move, or the fix
    // would have traded one failure for the opposite one.
    // ⚠ It must be faster than `stillSpeed` (6 mm/s) to BE a move by this config.
    // A first version drifted at ~2 px/s -- below the still threshold -- and was
    // rightly reported STATIONARY. The test premise was wrong, not the tracker.
    const m = new MotionTracker(cfg);
    for (const s of run(12, 1500)) m.push(s);
    expect(m.current).toBe("MOVING");
  });

  it("a real drag becomes MOVING", () => {
    const m = new MotionTracker(cfg);
    for (const s of run(40, 200)) m.push(s);
    expect(m.current).toBe("MOVING");
  });
});

describe("flick test", () => {
  it("a fast stroke still moving at lift IS a flick", () => {
    const buf = trimBuffer(run(400, 120), cfg);
    const f = detectFlick(buf, cfg);
    expect(f).not.toBeNull();
    expect(f!.axis).toBe("HORIZONTAL");
    expect(f!.sign).toBe(1);
  });

  // ⭐⭐ THE WHOLE POINT OF THE TEST. Previously every drag ended in a release, so
  // every drag could satisfy a flick rule and the two competed. Terminal speed is
  // the discriminator.
  it("a drag that DECELERATES to a stop and lifts is NOT a flick", () => {
    const fast = run(400, 100);
    const last = fast[fast.length - 1]!;
    // ...then three near-stationary samples before the lift.
    const settled: Sample[] = [
      { x: last.x + 0.2, y: 0, t: last.t + 10 },
      { x: last.x + 0.3, y: 0, t: last.t + 20 },
      { x: last.x + 0.35, y: 0, t: last.t + 30 },
    ];
    expect(detectFlick(trimBuffer([...fast, ...settled], cfg), cfg)).toBeNull();
  });

  it("a diagonal stroke fails the purity ratio", () => {
    const buf: Sample[] = [];
    for (let t = 0; t <= 120; t += 10) {
      const d = mmToPx((400 * t) / 1000) / Math.SQRT2;
      buf.push({ x: d, y: d, t });
    }
    expect(detectFlick(buf, cfg)).toBeNull();
  });

  it("a short fast twitch fails the travel threshold", () => {
    // ⚠ 400 mm/s for 10 ms is 4 mm, under the 6 mm bar. The first version used
    // 20 ms — 8 mm — and failed because the ARITHMETIC was wrong, not the code.
    expect(detectFlick(trimBuffer(run(400, 10), cfg), cfg)).toBeNull();
  });

  it("trimBuffer keeps only the flick window", () => {
    const buf = run(100, 1000);
    const kept = trimBuffer(buf, cfg);
    const span = kept[kept.length - 1]!.t - kept[0]!.t;
    expect(span).toBeLessThanOrEqual(cfg.flickWindow);
  });
});
