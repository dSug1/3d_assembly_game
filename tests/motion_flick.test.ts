import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { MotionTracker, type MotionState, type Sample } from "../src/input/motion";
import { detectFlick, terminalSpeedPxPerS, trimBuffer } from "../src/input/flick";
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

/**
 * ⭐⭐ `moveExitDistance`, WIRED BY `IN1` — and the vector that proves it does
 * something. `IN0` left the tunable DECLARED AND UNUSED: the exit path keyed on
 * `stillSpeed` + `stillTime` alone, so `IN5` would have gone and measured a number
 * that changed nothing.
 *
 * ⛔ Project rule 2: a new vector must be SHOWN TO FAIL AGAINST THE OLD CODE before
 * it is trusted. So the old exit rule is reproduced below, and the test asserts the
 * two implementations DISAGREE on this specimen. If someone later reverts the
 * excursion term, this vector goes red — and it says why.
 */

/** The pre-`IN1` exit rule: speed alone, sustained for `stillTime`. */
class SpeedOnlyExit {
  state: MotionState = "MOVING";
  private last: Sample | null = null;
  private stillSince: number | null = null;
  constructor(private readonly c: typeof cfg) {}
  push(s: Sample): MotionState {
    const prev = this.last;
    this.last = s;
    if (!prev || this.state === "STATIONARY") return this.state;
    const dt = s.t - prev.t;
    const speedPxPerS = dt > 0 ? (Math.hypot(s.x - prev.x, s.y - prev.y) / dt) * 1000 : 0;
    if (speedPxPerS <= mmToPx(this.c.stillSpeed)) {
      this.stillSince ??= prev.t;
      if (s.t - this.stillSince >= this.c.stillTime) this.state = "STATIONARY";
    } else {
      this.stillSince = null;
    }
    return this.state;
  }
}

describe("moveExitDistance — the slow creep an instantaneous speed test cannot see", () => {
  /** Fast enough to be MOVING, then a creep that never exceeds `stillSpeed`. */
  function dragThenCreep(creepMmPerS: number): { drag: Sample[]; creep: Sample[] } {
    const drag = run(100, 100);
    const last = drag[drag.length - 1]!;
    const creep: Sample[] = [];
    for (let t = 10; t <= 600; t += 10) {
      creep.push({ x: last.x + mmToPx((creepMmPerS * t) / 1000), y: 0, t: last.t + t });
    }
    return { drag, creep };
  }

  // ⚠ 5.7 mm/s sits inside the only band where the two rules can differ:
  // (moveExitDistance / stillTime, stillSpeed) = (5.33, 6) mm/s with these
  // defaults. That band is 0.67 mm/s WIDE — a direct consequence of the config
  // being only barely self-consistent (6 × 0.150 = 0.9 mm against a 0.8 mm bound).
  // ⛔ It is an `IN5` measurement question, not a result. See queue_notes/IN1.md.
  const CREEP_MM_PER_S = 5.7;

  it("a slow PERSISTENT creep stays MOVING — it is not at rest", () => {
    const m = new MotionTracker(cfg);
    const { drag, creep } = dragThenCreep(CREEP_MM_PER_S);
    for (const s of drag) m.push(s);
    expect(m.current).toBe("MOVING");
    for (const s of creep) m.push(s);
    expect(m.current).toBe("MOVING");
  });

  it("⛔ ...and THE OLD SPEED-ONLY RULE calls the same creep STATIONARY", () => {
    const old = new SpeedOnlyExit(cfg);
    const { drag, creep } = dragThenCreep(CREEP_MM_PER_S);
    for (const s of [...drag, ...creep]) old.push(s);
    expect(old.state).toBe("STATIONARY"); // the defect, pinned
  });

  it("a finger that actually STOPS still latches STATIONARY", () => {
    // ⭐ The other half. Without this the fix would have traded one failure for its
    // opposite — a tracker that can never come to rest is as broken as one that
    // always does, and `IN0` recorded exactly this trap.
    const m = new MotionTracker(cfg);
    const drag = run(100, 100);
    for (const s of drag) m.push(s);
    expect(m.current).toBe("MOVING");
    const last = drag[drag.length - 1]!;
    for (let t = 10; t <= 600; t += 10) m.push({ x: last.x, y: 0, t: last.t + t });
    expect(m.current).toBe("STATIONARY");
  });

  it("⛔ a config where the exit distance CANNOT BIND is rejected loudly", () => {
    // `stillSpeed × stillTime` bounds how far sub-threshold motion can travel, so if
    // that product does not exceed `moveExitDistance` the tunable is decorative in
    // every possible wiring. These were the SHIPPED defaults: 6 mm/s × 80 ms =
    // 0.48 mm against a 0.8 mm bound.
    expect(() => new MotionTracker({ ...cfg, stillTime: 80 })).toThrow(/can never bind/);
  });

  it("the shipped defaults satisfy it", () => {
    expect((cfg.stillSpeed * cfg.stillTime) / 1000).toBeGreaterThan(cfg.moveExitDistance);
  });
});

/**
 * ⭐⭐ THE DEVICE-CONFIRMED DEFECT: THE SAME FLICK, JUDGED DIFFERENTLY DEPENDING ON
 * WHAT THE BROWSER EMITTED AT LIFT. Reported from a Lenovo TB-X606F on 2026-09-13 —
 * "rollback is not consistent" — and reproduced here headlessly.
 *
 * A browser emits `pointerup` at a position and time of its own choosing, and very
 * commonly REPEATS the last `pointermove` coordinates. The old estimator read the
 * final pair, saw zero displacement, and called a 400 mm/s stroke a dead stop.
 *
 * ⛔ No value of `flickLiftSpeed` fixes this: the measurement itself was zero. That
 * is why the answer is the window the speed is averaged over, and not a tuned
 * threshold — the failure was in the instrument, as `METHOD` keeps warning.
 */

/** The pre-fix estimator: the last sample pair, and nothing else. */
function lastPairLiftPxPerS(buffer: readonly Sample[]): number {
  if (buffer.length < 2) return 0;
  const last = buffer[buffer.length - 1]!;
  const prev = buffer[buffer.length - 2]!;
  const dt = last.t - prev.t;
  if (dt <= 0) return 0;
  return (Math.hypot(last.x - prev.x, last.y - prev.y) / dt) * 1000;
}

describe("flick lift speed — the same gesture must survive any lift event", () => {
  /** One 400 mm/s horizontal stroke. `lift` decides only how it is RELEASED. */
  function stroke(lift: "clean" | "repeated-coords" | "tiny-step"): Sample[] {
    const b = run(400, 120);
    const last = b[b.length - 1]!;
    if (lift === "repeated-coords") b.push({ x: last.x, y: last.y, t: last.t + 8 });
    if (lift === "tiny-step") b.push({ x: last.x + 0.3, y: last.y, t: last.t + 1 });
    return b;
  }

  for (const lift of ["clean", "repeated-coords", "tiny-step"] as const) {
    it(`is a flick when the pointerup is "${lift}"`, () => {
      expect(detectFlick(trimBuffer(stroke(lift), cfg), cfg)).not.toBeNull();
    });
  }

  it("⛔ ...and THE OLD LAST-PAIR ESTIMATOR loses two of those three", () => {
    // The defect, pinned. Revert the window and this vector goes red with the
    // reason on it: the finger did the same thing all three times.
    const threshold = mmToPx(cfg.flickLiftSpeed);
    expect(lastPairLiftPxPerS(trimBuffer(stroke("clean"), cfg))).toBeGreaterThan(threshold);
    expect(lastPairLiftPxPerS(trimBuffer(stroke("repeated-coords"), cfg))).toBe(0);
    expect(lastPairLiftPxPerS(trimBuffer(stroke("tiny-step"), cfg))).toBeLessThan(threshold);
  });

  it("⭐ the three lifts now agree to within a few percent", () => {
    // Not just "all three pass" — a discriminator whose VALUE swings wildly while
    // happening to stay one side of a threshold is still fragile, and the next
    // config change would expose it. Assert the spread, not the verdict.
    const speeds = (["clean", "repeated-coords", "tiny-step"] as const).map((l) =>
      terminalSpeedPxPerS(trimBuffer(stroke(l), cfg), cfg),
    );
    const spread = (Math.max(...speeds) - Math.min(...speeds)) / Math.max(...speeds);
    expect(spread).toBeLessThan(0.25);
  });

  it("⛔ a decelerating drag is STILL not a flick — the fix did not buy sensitivity", () => {
    // The other half. A windowed estimator that made everything a flick would have
    // traded one failure for its opposite, and the rollback would fire on drags.
    const fast = run(400, 100);
    const last = fast[fast.length - 1]!;
    const settled: Sample[] = [];
    for (let i = 1; i <= 6; i++) settled.push({ x: last.x + i * 0.3, y: 0, t: last.t + i * 10 });
    expect(detectFlick(trimBuffer([...fast, ...settled], cfg), cfg)).toBeNull();
  });

  it("⛔ a lift window wider than the motion buffer is rejected loudly", () => {
    expect(
      () => new MotionTracker({ ...cfg, flickLiftWindow: cfg.flickWindow + 1 }),
    ).toThrow(/exceeds flickWindow/);
  });
});
