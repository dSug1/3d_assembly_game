import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { MotionTracker, type MotionState, type Sample } from "../src/input/motion";
import { detectFlick, terminalSpeedPxPerS, trimBuffer } from "../src/input/flick";
import { mmToPx, pxToMm } from "../src/core/units";

const cfg = DEFAULT_CONFIG;

/**
 * ⛔ The pre-A11 §1.1 thresholds, kept ONLY to drive the counter-examples below. They are
 * literals on purpose: a pinned defect that reads its numbers from the live config stops
 * being a fixed point the moment the config moves.
 */
const OLD_STILL_SPEED_MM_PER_S = 6;
const OLD_STILL_TIME_MS = 450;
const OLD_MOVE_EXIT_MM = 2.4;

/** A straight run of samples at a constant speed, in mm/s along +x. */
function run(speedMmPerS: number, ms: number, stepMs = 10, x0 = 0, t0 = 0): Sample[] {
  const out: Sample[] = [];
  for (let t = 0; t <= ms; t += stepMs) {
    out.push({ x: x0 + mmToPx((speedMmPerS * t) / 1000), y: 0, t: t0 + t });
  }
  return out;
}

describe("motion state", () => {
  it("⛔ refuses a dead radius the MEASURED noise does not fit inside", () => {
    // ⭐⭐ A11 left ONE motion threshold, so this is the only consistency rule there is —
    // and it is the one that was missing. ⚠ The rule it replaced (enter > exit, or the
    // state chatters) went with the pair: a single radius has nothing to chatter against.
    expect(() => new MotionTracker({ ...cfg, motionDeadbandMm: 0.8 })).toThrow(
      /STATIONARY is unreachable/,
    );
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

  // ════════════════════════════════════════════════════════════════════════════
  // ⭐⭐⭐ THE FLICK IS THE **TAIL**, AND THIS IS THE DEVICE REPORT THAT SAID SO
  // ════════════════════════════════════════════════════════════════════════════

  it("⛔⛔ A FLICK AT THE END OF AN ONGOING ROTATION IS A FLICK — the reported defect", () => {
    // ⛔ *"the flick should be triggerable during an ongoing rotation (it seems the flick only
    // triggers if the touchpoint presses and directly do a flick)"* — device, 2026-09-16.
    // ⭐⭐ THE CAUSE WAS THE BASELINE, NOT THE THRESHOLDS: travel and purity were measured
    // from `buffer[0]`, the oldest sample still inside `flickWindow`. On a press-and-flick
    // that sample is the flick's own start; at the end of a rotation it is in the middle of
    // the rotation, so the NET displacement is short and its direction is a mixture.
    // ⛔⛔ AND MY FIRST FIXTURE FOR THIS DID NOT REPRODUCE IT — mistake shape 5, caught by
    // the mutant. A slow rotation finished with a fast run in a DIFFERENT direction passes
    // the old whole-window test too (the slow part contributes little, so purity survives).
    // ⭐⭐ The reported gesture is a REVERSAL: a hand turning an object and then flicking a
    // face upward drags one way and flicks back the other. Over the whole 120 ms window the
    // two legs CANCEL — net travel ≈ 0 — so the old test refused it however hard the flick
    // was. ⭐ That is why the report said *"only if the touchpoint presses and directly do a
    // flick"*: only then is there nothing in the window to cancel against.
    const rotate: Sample[] = [];
    for (let t = 0; t <= 200; t += 10) rotate.push({ x: 0, y: mmToPx((400 * t) / 1000), t });
    const last = rotate[rotate.length - 1]!;
    const lastY = last.y;
    const flick: Sample[] = [];
    for (let k = 1; k <= 6; k++) {
      flick.push({ x: 0, y: lastY - mmToPx((400 * (k * 10)) / 1000), t: last.t + k * 10 });
    }
    const buf = trimBuffer([...rotate, ...flick], cfg);
    // ⚠ STATE THE CANCELLATION, so the vector shows WHY the old baseline failed rather than
    // asserting the outcome alone: the window's net travel is under the 6 mm bar.
    const netMm = Math.hypot(buf[buf.length - 1]!.x - buf[0]!.x, buf[buf.length - 1]!.y - buf[0]!.y) / mmToPx(1);
    expect(netMm).toBeLessThan(cfg.flickDistance);
    const f = detectFlick(buf, cfg);
    expect(f).not.toBeNull();
    expect(f!.axis).toBe("VERTICAL");
    expect(f!.sign).toBe(-1); // ⚠ screen y grows downward, so −1 is upward
    expect(f!.travelMm).toBeGreaterThan(cfg.flickDistance);
  });

  it("⭐ the tail it reports is the LONGEST one that passes, not the shortest", () => {
    // ⛔ A shortest-tail scan would report ~2 samples of travel for every flick, because a
    // short tail is the easiest thing in the world to make look pure — and `IN3` reads
    // `travelMm` nowhere yet, so a wrong value here would be silent until something did.
    // ⭐ On a wholly straight stroke the answer must be the whole window, which is also the
    // proof that the scan did not stop early.
    const buf = trimBuffer(run(400, 120), cfg);
    const whole = Math.hypot(
      buf[buf.length - 1]!.x - buf[0]!.x,
      buf[buf.length - 1]!.y - buf[0]!.y,
    ) / mmToPx(1);
    expect(detectFlick(buf, cfg)!.travelMm).toBeCloseTo(whole, 6);
  });

  it("⛔ a TWO-SAMPLE jump is not a flick — the tail has a minimum span", () => {
    // ⭐⭐ THE GUARD THAT MAKES THE SCAN SAFE, and it is the same discipline the lift speed
    // already has: the displacement may not be measured over a shorter baseline than the
    // speed is. ⛔ Without it, one coalesced 30 mm pointer jump — which browsers do emit
    // under load — would be perfectly pure, plenty far, and a flick.
    // ⚠ `flickLiftWindow` is 40 ms, so a 30 ms pair must be refused however fast it is.
    const jump: Sample[] = [
      { x: 0, y: 0, t: 0 },
      { x: mmToPx(30), y: 0, t: 30 },
    ];
    expect(detectFlick(jump, cfg)).toBeNull();
    // ⭐ AND THE COUNTER-EXAMPLE: the same travel over a span that DOES clear the window is
    // a flick — so the refusal above is about the baseline and not about the fixture.
    const spanned: Sample[] = [
      { x: 0, y: 0, t: 0 },
      { x: mmToPx(15), y: 0, t: 25 },
      { x: mmToPx(30), y: 0, t: 50 },
    ];
    expect(detectFlick(spanned, cfg)).not.toBeNull();
  });

  it("⚠ a slow rotation with NO fast tail is still not a flick — the lift speed is untouched", () => {
    // ⭐ `METHOD`: *a guard that cannot fail is not a guard.* The tail scan makes flicks
    // EASIER to reach, so the vector that shows the speed test still refuses is what keeps
    // the change honest — the scan does not run at all below the lift threshold.
    const slow: Sample[] = [];
    for (let t = 0; t <= 400; t += 10) slow.push({ x: mmToPx((30 * t) / 1000), y: 0, t });
    expect(detectFlick(trimBuffer(slow, cfg), cfg)).toBeNull();
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
  constructor(_c: typeof cfg) {}
  push(s: Sample): MotionState {
    const prev = this.last;
    this.last = s;
    if (!prev || this.state === "STATIONARY") return this.state;
    const dt = s.t - prev.t;
    const speedPxPerS = dt > 0 ? (Math.hypot(s.x - prev.x, s.y - prev.y) / dt) * 1000 : 0;
    // ⚠ The DEFECT, pinned: an instantaneous speed test with no excursion term. Its
    // thresholds are the pre-A11 shipped ones, hard-coded here because the config no
    // longer carries them — the counter-example must not drift with the product.
    if (speedPxPerS <= mmToPx(OLD_STILL_SPEED_MM_PER_S)) {
      this.stillSince ??= prev.t;
      if (s.t - this.stillSince >= OLD_STILL_TIME_MS) this.state = "STATIONARY";
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
    // ⚠ DERIVED from the config, not a literal — a literal went stale twice already.
    // ⭐ Under A11 this is fast: leaving MOVING costs one `restConfirmMs`, not a settle.
    const restMs = 4 * cfg.restConfirmMs;
    for (let t = 10; t <= restMs; t += 10) m.push({ x: last.x, y: 0, t: last.t + t });
    expect(m.current).toBe("STATIONARY");
  });

  it("⭐ the shipped radius clears the measured noise", () => {
    // ⭐⭐ The only consistency rule A11 left, asserted on the SHIPPED numbers rather than
    // only on a rejection — a guard nobody checks against the defaults is a guard that can
    // be satisfied by a config nobody ships.
    expect(cfg.motionDeadbandMm).toBeGreaterThanOrEqual(3 * cfg.pointerNoiseMm);
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

// ══════════════════════════════════════════════════════════════════════════════
// ⛔⛔⛔ CAN A FINGER THAT HAS MOVED EVER BE STILL AGAIN?
//
// Found 2026-09-15, building A10's depth gate — the first rule that asks. The answer
// was NO, for any real finger, and it had been no since `pointerNoiseMm` was MEASURED
// on 2026-09-14. ⭐ Not one of eight device passes could have shown it: the commit
// threshold reads the MOVING transition, rule 6 reads presence, and the flick test reads
// lift speed. Nothing shipped depended on RE-ENTERING STATIONARY.
//
// ⭐⭐ THE CAUSE IS MISTAKE SHAPE 1 IN THE FILE THAT DEFINES *moving*: the speed was
// estimated over ONE SAMPLE PAIR. 0.761 mm of noise across 8 ms is ~95 mm/s of apparent
// speed at rest, against a 6 mm/s threshold.
// ══════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ a finger AT REST returns to STATIONARY — with the MEASURED noise on it", () => {
  /**
   * Uniform per-axis amplitude reproducing an RMS RADIAL displacement of `pointerNoiseMm`.
   * ⭐ `noise_meter.ts` reports the RMS distance from the window mean, which is a RADIUS —
   * so a per-axis amplitude of the same number would be a different, smaller quantity.
   * ⚠ For uniform ±A on two axes the RMS radius is `A·√(2/3)`, hence the division.
   */
  const AMP_MM = DEFAULT_CONFIG.pointerNoiseMm / Math.sqrt(2 / 3);

  const resting = (seedStart: number) => {
    let seed = seedStart;
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return mmToPx(((seed / 0x7fffffff) * 2 - 1) * AMP_MM);
    };
  };

  /** Drag, then hold the finger still for `restMs` with real noise on every sample. */
  const dragThenRest = (restMs: number, seed: number) => {
    const jit = resting(seed);
    const m = new MotionTracker(cfg);
    for (let i = 0; i < 40; i++) m.push({ x: 400 + mmToPx(i * 2), y: 400, t: i * 8 });
    const movingAfterDrag = m.current;
    let firstStationaryAtMs: number | null = null;
    for (let i = 0; i * 8 < restMs; i++) {
      const t = 320 + i * 8;
      const st = m.push({ x: 400 + mmToPx(80) + jit(), y: 400 + jit(), t });
      if (st === "STATIONARY" && firstStationaryAtMs === null) firstStationaryAtMs = i * 8;
    }
    return { movingAfterDrag, firstStationaryAtMs, final: m.current };
  };

  it("⭐⭐ it comes back, and within a second", () => {
    const r = dragThenRest(2000, 12345);
    expect(r.movingAfterDrag).toBe("MOVING");
    expect(r.firstStationaryAtMs).not.toBeNull();
    // ⚠ Longer than `stillTime` on purpose: the window must FILL before the speed estimate
    // means anything, and settle candidacy restarts while it does.
    expect(r.firstStationaryAtMs!).toBeLessThan(1000);
    expect(r.final).toBe("STATIONARY");
  });

  it("⭐ it comes back whatever the noise happens to do — four seeds", () => {
    for (const seed of [1, 777, 20260915, 99991]) {
      const r = dragThenRest(2000, seed);
      expect(r.final, `seed ${seed}`).toBe("STATIONARY");
    }
  });

  it("⛔⛔ COUNTER-EXAMPLE: the OLD per-pair speed estimate never comes back", () => {
    // ⭐ The defect, pinned, so the fix cannot be quietly undone. This is what the shipped
    // code did until 2026-09-15 — and it is a rate over the shortest available baseline.
    const jit = resting(12345);
    let state: MotionState = "MOVING";
    let prev: Sample = { x: 400 + mmToPx(80), y: 400, t: 320 };
    let settleAnchor: Sample | null = null;
    let stillSince: number | null = null;
    let cameBack = false;
    for (let i = 1; i < 500; i++) {
      const s: Sample = { x: 400 + mmToPx(80) + jit(), y: 400 + jit(), t: 320 + i * 8 };
      const dt = s.t - prev.t;
      const speed = (Math.hypot(s.x - prev.x, s.y - prev.y) / dt) * 1000;
      if (speed <= mmToPx(OLD_STILL_SPEED_MM_PER_S)) {
        if (settleAnchor === null) {
          settleAnchor = prev;
          stillSince = prev.t;
        }
        const ex = Math.hypot(s.x - settleAnchor.x, s.y - settleAnchor.y);
        if (ex > mmToPx(OLD_MOVE_EXIT_MM)) {
          settleAnchor = s;
          stillSince = s.t;
        } else if (s.t - stillSince! >= OLD_STILL_TIME_MS) {
          state = "STATIONARY";
          cameBack = true;
        }
      } else {
        stillSince = null;
        settleAnchor = null;
      }
      prev = s;
    }
    expect(cameBack, "the old estimate must NOT come back — that is the defect").toBe(false);
    expect(state).toBe("MOVING");
  });

  it("⛔ and the config now REFUSES a settle bound the noise cannot fit inside", () => {
    // ⭐ The guard, so this cannot regress by someone lowering one number.
    expect(() => validateGestureConfig({ ...cfg, motionDeadbandMm: 0.8 })).toThrow(
      /STATIONARY is unreachable/,
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ A11 — THE DEADBAND ITSELF: what it emits, not only what state it reports
// ══════════════════════════════════════════════════════════════════════════════

describe("⭐⭐ the position deadband emits the EXCESS, and emits it exactly", () => {
  const BAND_PX = mmToPx(cfg.motionDeadbandMm);

  /** Walk a finger in a straight line, summing what the tracker actually emitted. */
  const walk = (stepMm: number, n: number) => {
    const m = new MotionTracker(cfg);
    let x = 500;
    let emitted = 0;
    m.push({ x, y: 400, t: 0 });
    for (let i = 1; i <= n; i++) {
      x += mmToPx(stepMm);
      m.push({ x, y: 400, t: i * 8 });
      emitted += m.step.dx;
    }
    return { emitted, travelled: mmToPx(stepMm) * n, state: m.current };
  };

  it("⭐⭐ TOTAL EMITTED TRAVEL = TRUE TRAVEL − ONE RADIUS. Not one per sample", () => {
    // ⛔⛔ THE VECTOR THAT SEPARATES THE THREE DEADBAND FORMS, and the reason A9's dossier
    // insisted on it: *"small deltas do nothing"* passes for the BROKEN form too. A hard
    // deadband loses everything below the radius; a per-sample subtraction taxes every
    // sample; only the trailing anchor charges the radius ONCE.
    const fast = walk(4, 50);
    expect(fast.emitted).toBeCloseTo(fast.travelled - BAND_PX, 6);
  });

  it("⭐⭐ A SLOW DRAG COVERS ITS FULL DISTANCE — it just arrives later", () => {
    // ⚠ 0.3 mm per sample, far below the 2.4 mm radius: every single step is inside the
    // band, and a deadband that re-centred on the finger would emit NOTHING for ever.
    const slow = walk(0.3, 200);
    expect(slow.emitted).toBeCloseTo(slow.travelled - BAND_PX, 6);
    expect(slow.state).toBe("MOVING");
  });

  it("⛔⛔ COUNTER-EXAMPLE: re-centring inside the band loses the whole slow drag", () => {
    // ⭐ The trap, pinned. This is the obvious implementation and it is silently wrong.
    let anchorX = 500;
    let x = 500;
    let emitted = 0;
    for (let i = 1; i <= 200; i++) {
      x += mmToPx(0.3);
      const d = Math.abs(x - anchorX);
      if (d > BAND_PX) {
        emitted += d - BAND_PX;
        anchorX = x - BAND_PX;
      } else {
        anchorX = x; // ⛔ the mistake
      }
    }
    expect(emitted).toBe(0);
  });

  it("⭐ it LEAVES ZERO CONTINUOUSLY — no step at the crossing", () => {
    // ⛔ A hard deadband inserts a jump of exactly one radius the moment it is crossed.
    const m = new MotionTracker(cfg);
    let x = 500;
    m.push({ x, y: 400, t: 0 });
    const first: number[] = [];
    for (let i = 1; i <= 40; i++) {
      x += mmToPx(0.2);
      m.push({ x, y: 400, t: i * 8 });
      if (m.step.dx !== 0) first.push(m.step.dx);
    }
    expect(first.length).toBeGreaterThan(0);
    expect(first[0]!).toBeLessThan(mmToPx(0.25)); // a fifth of a millimetre, not 2.4 mm
  });

  it("⭐⭐ A STILL FINGER EMITS NOTHING, with the MEASURED noise on it", () => {
    // ⭐ This is amendment A9's whole purpose, met by §1.1 itself: the jitter that turned
    // a held object while nobody was moving never reaches a rule.
    let seed = 4242;
    const jit = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return mmToPx(((seed / 0x7fffffff) * 2 - 1) * (cfg.pointerNoiseMm / Math.sqrt(2 / 3)));
    };
    const m = new MotionTracker(cfg);
    m.push({ x: 500, y: 400, t: 0 });
    let emitted = 0;
    for (let i = 1; i <= 600; i++) {
      m.push({ x: 500 + jit(), y: 400 + jit(), t: i * 8 });
      emitted += Math.hypot(m.step.dx, m.step.dy);
    }
    expect(emitted).toBe(0);
    expect(m.current).toBe("STATIONARY");
  });

  it("⭐⭐ LEAVING rest is IMMEDIATE — the owner's complaint was about the other way", () => {
    // ⚠ *"if I switch from depth to x/y translation, the switch is immediate"* — that half
    // was always true and must stay true. ⛔ No timer stands in front of MOVING.
    const m = new MotionTracker(cfg);
    m.push({ x: 500, y: 400, t: 0 });
    m.push({ x: 500 + BAND_PX + mmToPx(1), y: 400, t: 8 });
    expect(m.current).toBe("MOVING");
  });

  it("⭐⭐ RETURNING to rest costs ONE restConfirmMs, not a settle timer", () => {
    // ⛔⛔ THE REPORTED DEFECT: *"when I switch from x/y to depth translation… there is no
    // depth translation for a while and then suddenly it is triggered."* That was ~900 ms
    // of settle. ⭐ Now it is `restConfirmMs`, and the vector pins it.
    const m = new MotionTracker(cfg);
    let x = 500;
    m.push({ x, y: 400, t: 0 });
    for (let i = 1; i <= 30; i++) {
      x += mmToPx(3);
      m.push({ x, y: 400, t: i * 8 });
    }
    expect(m.current).toBe("MOVING");
    const stoppedAt = 30 * 8;
    let restoredAt: number | null = null;
    for (let i = 1; i <= 200; i++) {
      const t = stoppedAt + i * 8;
      if (m.push({ x, y: 400, t }) === "STATIONARY" && restoredAt === null) restoredAt = t - stoppedAt;
    }
    expect(restoredAt).not.toBeNull();
    expect(restoredAt!).toBeLessThanOrEqual(cfg.restConfirmMs + 16);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ⛔⛔⛔ A STILL FINGER EMITS NO EVENTS — SO NOTHING ASKS THE QUESTION
//
// Found 2026-09-15, from a device report that survived two fixes: *"I still experience
// issue passing from x/y translation to depth translation (sometimes, it is blocked) while
// passing from depth translation to x/y translation is smooth and instantaneous: there is
// something wrong you did not explain nor check."* ⭐ Correct on every count.
//
// ⛔⛔ THE STATE MACHINE IS DRIVEN BY `push`, AND `push` IS DRIVEN BY `pointermove`. A
// finger resting on glass generates NO pointermove events — that is what resting means. So
// the tracker is FROZEN at whatever it last was, and `MOVING` is exactly what it last was.
//
// ⭐⭐ THE ASYMMETRY IS THEREFORE STRUCTURAL AND INVERTED:
//
//   MOVING     is entered by an event that NECESSARILY EXISTS — the finger moved.
//   STATIONARY must be entered by an event that BY DEFINITION MAY NOT ARRIVE.
//
// ⚠ And it explains *"sometimes"* exactly: the only thing that thaws the tracker is a stray
// jitter sample crossing the digitizer's own threshold, which arrives at random. Hence
// blocked for a while, then suddenly triggered.
//
// ⭐ ELAPSED TIME WITH NO SAMPLE IS THE STRONGEST EVIDENCE OF STILLNESS THERE IS — stronger
// than samples inside the dead radius. It just has to be ASKED FOR.
// ══════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ rest must be reachable WITHOUT further events", () => {
  const drag = (m: MotionTracker) => {
    let x = 500;
    m.push({ x, y: 400, t: 0 });
    for (let i = 1; i <= 30; i++) {
      x += mmToPx(3);
      m.push({ x, y: 400, t: i * 8 });
    }
    return { x, t: 30 * 8 };
  };

  it("⭐⭐ a finger that STOPS DEAD becomes STATIONARY on the clock alone", () => {
    // ⛔ THE DEFECT, STATED AS THE PRODUCT'S REQUIREMENT: not one further sample arrives,
    // because the finger is not moving. The state must still come back.
    const m = new MotionTracker(cfg);
    const end = drag(m);
    expect(m.current).toBe("MOVING");
    m.tick(end.t + cfg.restConfirmMs + 1);
    expect(m.current).toBe("STATIONARY");
  });

  it("⛔ …and NOT before restConfirmMs has actually passed", () => {
    const m = new MotionTracker(cfg);
    const end = drag(m);
    m.tick(end.t + cfg.restConfirmMs - 10);
    expect(m.current).toBe("MOVING");
  });

  it("⭐ a tick does not resurrect a finger that never moved", () => {
    const m = new MotionTracker(cfg);
    m.push({ x: 500, y: 400, t: 0 });
    m.tick(5000);
    expect(m.current).toBe("STATIONARY");
  });

  it("⛔⛔ a tick emits NOTHING — it decides a state, it never moves an object", () => {
    // ⚠ A tick that produced travel would let a dropped frame translate the object.
    const m = new MotionTracker(cfg);
    const end = drag(m);
    m.tick(end.t + cfg.restConfirmMs + 1);
    expect(m.step.dx).toBe(0);
    expect(m.step.dy).toBe(0);
  });

  it("⭐ ticks BETWEEN samples of a continuing drag change nothing", () => {
    // ⛔ The render loop ticks every frame, including mid-drag. A tick must never
    // interrupt a gesture that is still delivering events.
    const m = new MotionTracker(cfg);
    let x = 500;
    m.push({ x, y: 400, t: 0 });
    // ⚠ DERIVED from the band, not a literal: at a literal 3 mm/sample this vector went
    // red the moment the owner raised the band to 3.5 mm, for no reason but the fixture.
    const stepMm = cfg.motionDeadbandMm + 1;
    for (let i = 1; i <= 30; i++) {
      x += mmToPx(stepMm);
      m.push({ x, y: 400, t: i * 8 });
      m.tick(i * 8 + 4);
      expect(m.current, `tick after sample ${i}`).toBe("MOVING");
    }
  });

  it("⭐⭐ and the finger resumes IMMEDIATELY after a tick put it to rest", () => {
    // ⚠ The half the owner said already worked, asserted so it stays working: leaving rest
    // must never wait for anything.
    const m = new MotionTracker(cfg);
    const end = drag(m);
    m.tick(end.t + cfg.restConfirmMs + 1);
    expect(m.current).toBe("STATIONARY");
    m.push({ x: end.x + mmToPx(cfg.motionDeadbandMm + 1), y: 400, t: end.t + 1000 });
    expect(m.current).toBe("MOVING");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ⛔⛔⛔ THE DEADBAND MUST GATE ENTRY INTO MOTION, NOT THE MOTION ITSELF
//
// Device report: *"does your deadband impact the sway and the damping: the object
// translation is less fluid than when we had no depth translation built in."* ⭐ It did,
// and the cost was MEASURED before it was fixed:
//
//   dead travel entering a drag  = 1 band = 2.5 mm
//   dead travel at a REVERSAL    = 2 bands = 5.0 mm   ⛔ 88 ms of lag at 50 mm/s
//
// ⚠ The trailing anchor sits one radius BEHIND the finger, so reversing means crossing the
// whole dead circle — the far side, not the near one. ⛔ Against rule 6's tuned follower
// (τ = 7.6 ms, lead = 0.2 ms) that is more than TEN TIMES the entire time constant, in
// pure dead time, in front of it. No damping value can hide that.
//
// ⭐⭐ THE FIX IS A DISTINCTION THE FIRST VERSION MISSED: a finger that has ALREADY PROVEN
// it is moving needs no further proof. The deadband exists to reject the jitter of a finger
// at REST — so it gates the transition out of rest, and once out, travel passes through
// undiminished. ⛔ The state machine is unchanged: rest is still detected by the same
// trailing anchor and the same `restConfirmMs`.
// ══════════════════════════════════════════════════════════════════════════════

describe("⭐⭐ once MOVING, travel passes through undiminished", () => {
  const BAND = cfg.motionDeadbandMm;

  /** Drag out `n` samples, reverse, and report the dead travel on each side. */
  const outAndBack = (stepMm: number, n = 80) => {
    const m = new MotionTracker(cfg);
    let x = 500;
    let t = 0;
    m.push({ x, y: 400, t });
    let startDead: number | null = null;
    for (let i = 1; i <= n; i++) {
      x += mmToPx(stepMm);
      t += 8;
      m.push({ x, y: 400, t });
      if (m.step.dx !== 0 && startDead === null) startDead = stepMm * i;
    }
    let reverseDead: number | null = null;
    for (let i = 1; i <= n; i++) {
      x -= mmToPx(stepMm);
      t += 8;
      m.push({ x, y: 400, t });
      if (m.step.dx !== 0 && reverseDead === null) reverseDead = stepMm * i;
    }
    return { startDead, reverseDead, state: m.current };
  };

  it("⭐⭐ A REVERSAL COSTS ONE SAMPLE, not two dead radii", () => {
    // ⛔⛔ THE DEFECT, PINNED AS A NUMBER: it used to cost 5.0 mm — the finger had to cross
    // the whole dead circle, because the anchor trails on the far side.
    const r = outAndBack(0.5);
    expect(r.reverseDead).toBeCloseTo(0.5, 6);
  });

  it("⭐ entering a drag still costs one band — that is the whole point", () => {
    // ⚠ This half must NOT be removed: it is what rejects a resting finger's jitter, and
    // it is paid ONCE per gesture rather than at every change of direction.
    const r = outAndBack(0.5);
    // ⚠ `>=`, not `>`: the first emitting sample can land EXACTLY on the band when the
    // step divides it, which is a property of the fixture's arithmetic and not of the rule.
    expect(r.startDead).toBeGreaterThanOrEqual(BAND);
    expect(r.startDead).toBeLessThanOrEqual(BAND + 0.5);
  });

  it("⭐⭐ a slow reversal is as immediate as a fast one", () => {
    // ⚠ The old cost was WORST where it hurt most: 88 ms of lag at 50 mm/s against 24 ms
    // at 200 mm/s, because a fixed distance costs more time the slower you go.
    for (const step of [0.2, 0.5, 1.6, 3.2]) {
      const r = outAndBack(step);
      expect(r.reverseDead, `step ${step} mm`).toBeCloseTo(step, 6);
    }
  });

  it("⛔ a STILL finger still emits nothing — the deadband's actual job", () => {
    let seed = 90210;
    const jit = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return mmToPx(((seed / 0x7fffffff) * 2 - 1) * (cfg.pointerNoiseMm / Math.sqrt(2 / 3)));
    };
    const m = new MotionTracker(cfg);
    m.push({ x: 500, y: 400, t: 0 });
    let emitted = 0;
    for (let i = 1; i <= 600; i++) {
      m.push({ x: 500 + jit(), y: 400 + jit(), t: i * 8 });
      emitted += Math.hypot(m.step.dx, m.step.dy);
    }
    expect(emitted).toBe(0);
    expect(m.current).toBe("STATIONARY");
  });

  it("⛔⛔ and a finger that STOPS still comes to rest — the state is unchanged", () => {
    // ⚠ Pass-through must not cost the depth gate: A10 reads this state, and it is still
    // decided by the trailing anchor and `restConfirmMs`.
    const m = new MotionTracker(cfg);
    let x = 500;
    let t = 0;
    m.push({ x, y: 400, t });
    for (let i = 1; i <= 40; i++) {
      x += mmToPx(3);
      t += 8;
      m.push({ x, y: 400, t });
    }
    expect(m.current).toBe("MOVING");
    m.tick(t + cfg.restConfirmMs + 1);
    expect(m.current).toBe("STATIONARY");
  });

  it("⭐ total emitted travel is still the true travel minus ONE band", () => {
    // ⭐⭐ The continuity property survives pass-through: the band is charged once, on the
    // way out of rest, and never again.
    const m = new MotionTracker(cfg);
    let x = 500;
    let emitted = 0;
    m.push({ x, y: 400, t: 0 });
    for (let i = 1; i <= 100; i++) {
      x += mmToPx(1.5);
      m.push({ x, y: 400, t: i * 8 });
      emitted += m.step.dx;
    }
    expect(pxToMm(emitted)).toBeCloseTo(150 - BAND, 6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ THE DEADBAND IS PER AXIS, AND THE REASON IS NOT NOISE — IT IS AXIS PURITY
//
// > *"I would expect a deadband on delta position x and a deadband on delta position y
// > (even if both are equal). So I could have a pure movement on x or y by filtering out
// > the delta position which does not cross its deadband."*
//
// ⛔⛔ THIS PROJECT ARGUED AGAINST PER-AXIS ONCE, IN `IN12`'s DOSSIER, AND THE ARGUMENT WAS
// ABOUT THE WRONG THING. It said a square band makes a diagonal drag travel 1.41× further
// before it starts — true, and a cost worth paying, because what the square buys is a
// CORRIDOR along each axis in which the other axis emits NOTHING.
//
// ⭐ A radial band cannot do that at any radius: the moment the finger leaves the circle,
// BOTH components are live. Axis purity is a property of the SHAPE, not of the size.
//
// ⭐⭐ AND EACH AXIS CARRIES ITS OWN STATE, which is what makes the purity last: an axis
// that has not broken out stays silent for as long as the hand keeps it inside its band —
// not merely until the other axis moves.
// ══════════════════════════════════════════════════════════════════════════════

describe("⭐⭐⭐ a deadband PER AXIS — a nearly-horizontal drag is purely horizontal", () => {
  const BAND = cfg.motionDeadbandMm;

  /** Drag `n` samples with a per-sample step in each axis, summing what was emitted. */
  const drag = (stepXMm: number, stepYMm: number, n = 120) => {
    const m = new MotionTracker(cfg);
    let x = 500;
    let y = 400;
    m.push({ x, y, t: 0 });
    let ex = 0;
    let ey = 0;
    for (let i = 1; i <= n; i++) {
      x += mmToPx(stepXMm);
      y += mmToPx(stepYMm);
      m.push({ x, y, t: i * 8 });
      ex += m.step.dx;
      ey += m.step.dy;
    }
    return { ex: pxToMm(ex), ey: pxToMm(ey), state: m.current };
  };

  it("⭐⭐ A DRAG THAT STAYS INSIDE THE Y BAND EMITS **NO Y AT ALL**", () => {
    // ⛔⛔ THE WHOLE POINT, AND THE THING A RADIAL BAND CANNOT DO. 60 mm of x, and a y
    // wobble that never leaves its own band: the object slides purely horizontally.
    const r = drag(0.5, 0.015, 120); // 60 mm of x, 1.8 mm of y — inside a 2.3 mm band
    expect(r.ey).toBe(0);
    expect(r.ex).toBeCloseTo(60 - BAND, 6);
    expect(r.state).toBe("MOVING");
  });

  it("⭐⭐ and purely VERTICALLY, the same way", () => {
    const r = drag(0.015, 0.5, 120);
    expect(r.ex).toBe(0);
    expect(r.ey).toBeCloseTo(60 - BAND, 6);
  });

  it("⛔⛔ COUNTER-EXAMPLE: a RADIAL band leaks the y component from the first step", () => {
    // ⭐ The claim stated as a number, so *"per axis gives axis purity"* is checkable
    // rather than an assertion. A circular dead zone emits the FULL direction vector the
    // moment the finger leaves it — there is no radius that suppresses one component.
    const band = mmToPx(BAND);
    let ax = 500;
    let ay = 400;
    let x = 500;
    let y = 400;
    let leakedY = 0;
    for (let i = 1; i <= 120; i++) {
      x += mmToPx(0.5);
      y += mmToPx(0.015);
      const dx = x - ax;
      const dy = y - ay;
      const d = Math.hypot(dx, dy);
      if (d > band) {
        const over = d - band;
        leakedY += (dy / d) * over;
        ax = x - (dx / d) * band;
        ay = y - (dy / d) * band;
      }
    }
    expect(pxToMm(leakedY)).toBeGreaterThan(1.5); // the wobble reaches the object
  });

  it("⭐ a DELIBERATE y move still breaks out — this is a filter, not a lock", () => {
    const r = drag(0.5, 0.5, 120);
    expect(r.ex).toBeCloseTo(60 - BAND, 6);
    expect(r.ey).toBeCloseTo(60 - BAND, 6);
  });

  it("⭐⭐ each axis pays its band ONCE, and independently", () => {
    // ⚠ The stated cost of a square band: a 45° drag pays one band on EACH axis, so it
    // travels 1.41× further than a radial one before it starts. ⭐ That is the price of
    // the corridor, and it is paid once per axis per gesture — never at a reversal.
    const r = drag(1, 1, 60);
    expect(r.ex).toBeCloseTo(60 - BAND, 6);
    expect(r.ey).toBeCloseTo(60 - BAND, 6);
  });

  it("⭐⭐ THE PURITY LASTS — the silent axis does not wake up when the other moves", () => {
    // ⛔ If the two axes shared one state, breaking out in x would let y through, and the
    // corridor would exist only until the drag began. Each axis carries its own.
    // ⚠⚠ THE Y AXIS MUST WOBBLE, NOT SIT STILL. My first version held y at a LITERAL
    // constant, so a broken implementation that let y through emitted zero anyway and the
    // vector could not fail — mistake shape 3, and shape 5, in one line. The wobble stays
    // inside the band and is exactly what a real hand does over 200 mm of travel.
    const m = new MotionTracker(cfg);
    let x = 500;
    m.push({ x, y: 400, t: 0 });
    let emittedY = 0;
    for (let i = 1; i <= 400; i++) {
      x += mmToPx(0.5); // 200 mm of travel in x
      const y = 400 + mmToPx(Math.sin(i / 9) * (cfg.motionDeadbandMm * 0.45));
      m.push({ x, y, t: i * 8 });
      emittedY += Math.abs(m.step.dy);
    }
    expect(emittedY).toBe(0);
  });

  it("⛔ a still finger still emits nothing on either axis", () => {
    let seed = 31337;
    const jit = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return mmToPx(((seed / 0x7fffffff) * 2 - 1) * (cfg.pointerNoiseMm / Math.sqrt(2 / 3)));
    };
    const m = new MotionTracker(cfg);
    m.push({ x: 500, y: 400, t: 0 });
    let emitted = 0;
    for (let i = 1; i <= 600; i++) {
      m.push({ x: 500 + jit(), y: 400 + jit(), t: i * 8 });
      emitted += Math.abs(m.step.dx) + Math.abs(m.step.dy);
    }
    expect(emitted).toBe(0);
    expect(m.current).toBe("STATIONARY");
  });

  it("⭐⭐ a reversal on a MOVING axis still costs one sample", () => {
    // ⚠ The fluidity fix must survive going per-axis: the band gates entry, per axis, and
    // an axis that is already moving passes travel through undiminished.
    const m = new MotionTracker(cfg);
    let x = 500;
    let t = 0;
    m.push({ x, y: 400, t });
    for (let i = 1; i <= 60; i++) {
      x += mmToPx(0.5);
      t += 8;
      m.push({ x, y: 400, t });
    }
    x -= mmToPx(0.5);
    t += 8;
    m.push({ x, y: 400, t });
    expect(pxToMm(m.step.dx)).toBeCloseTo(-0.5, 6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ⛔⛔⛔ A TRACKER THAT OUTLIVES ITS FINGER READS `MOVING` THE INSTANT A NEW ONE LANDS
//
// Device report, 2026-09-16: *"Two touchpoints on respective objects && both delta
// positions -> translation of both objects -> OK. Then I release the second touchpoint and
// press it outside any object while the first touchpoint remains pressed -> this should
// control immediately rotation of the first object. However, I see that the first object
// continues translation and then switch to rotation."*
//
// ⭐⭐ THE MECHANISM, PINNED HERE: a `MotionTracker` keeps an ANCHOR POSITION. Feed it a
// sample from somewhere else on the glass — which is what a NEW finger reusing an old
// pointer id does — and the displacement from that stale anchor is enormous, so it reads
// `MOVING` at once and stays there until `restConfirmMs` of quiet. ⛔ Under A13 that means
// the second finger is judged to be MOVING, so the holder TRANSLATES instead of ROTATING,
// and it flips only once the new finger settles. Exactly the report.
// ══════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ a stale tracker makes a NEW finger read as MOVING", () => {
  it("⭐⭐ the mechanism: a far-away sample in an old tracker is instantly MOVING", () => {
    const m = new MotionTracker(cfg);
    // A finger lives at one corner and comes to rest there.
    m.push({ x: 200, y: 200, t: 0 });
    m.tick(cfg.restConfirmMs + 1);
    expect(m.current).toBe("STATIONARY");
    // ⛔ A DIFFERENT finger now lands 90 mm away and is perfectly still.
    m.push({ x: 200 + mmToPx(90), y: 200, t: 100 });
    expect(m.current, "the new finger has not moved at all").toBe("MOVING");
  });

  it("⭐ a FRESH tracker calls the same landing STATIONARY, which is the fix", () => {
    // ⭐⭐ The whole difference is WHICH tracker the second finger gets, so the fix is to
    // key them by something that is never reused. The router publishes `seq` — monotone
    // press order — precisely because *"Map iteration order would look like press order
    // right up until an id is reused."*
    const fresh = new MotionTracker(cfg);
    fresh.push({ x: 200 + mmToPx(90), y: 200, t: 100 });
    expect(fresh.current).toBe("STATIONARY");
  });

  it("⛔ and contact settling under one band does NOT wake a fresh tracker", () => {
    // ⚠ A finger landing on glass reports a centroid that shifts as the contact area
    // grows. Under one dead band that must read as still, or every placement would start
    // a translation.
    const m = new MotionTracker(cfg);
    let x = 400;
    m.push({ x, y: 400, t: 0 });
    for (let i = 1; i <= 6; i++) {
      x += mmToPx(cfg.motionDeadbandMm / 8);
      m.push({ x, y: 400 + mmToPx(0.2), t: i * 8 });
    }
    expect(m.current).toBe("STATIONARY");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ⛔⛔⛔ A FINGER THAT STOPS DEAD RESTS **EXACTLY ON** THE BAND BOUNDARY
//
// Found 2026-09-16, by raising the band from 2.3 mm to 3.5 mm: a vector that had passed
// for a day went red, and it was not the fixture.
//
// ⭐⭐ While an axis moves, its anchor is dragged to trail by EXACTLY one band. So the
// instant the finger stops, its displacement from the anchor is EXACTLY the band — the
// `<=` boundary, on every single sample. ⛔ If that comparison lands on the wrong side, the
// axis never becomes STATIONARY at all: `restingSinceMs` is never set, and the rest timer
// never starts.
//
// ⚠ Computing the anchor as `p - band` and then re-deriving `p - anchor` is a ROUND TRIP
// through floating point, and it does not return exactly `band` — at p ≈ 400 px it comes
// back about 1e-14 too large, which is on the wrong side of `<=`. ⭐ Tracking the signed
// OFFSET directly and clamping it removes the round trip, so a still sample adds exactly
// zero and the offset stays exactly at the boundary.
// ══════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ stopping ON the boundary still counts as rest", () => {
  it("⭐⭐ a finger that stops dead settles — at ANY position on the glass", () => {
    // ⚠ Swept over positions on purpose: the defect depended on the MAGNITUDE of the
    // coordinate, so a fixture at one convenient x could pass while the product failed.
    for (const x0 of [0, 137, 400, 1023.5, 4096]) {
      const m = new MotionTracker(cfg);
      let x = x0;
      let t = 0;
      m.push({ x, y: 400, t });
      for (let i = 1; i <= 30; i++) {
        x += mmToPx(0.8);
        t += 10;
        m.push({ x, y: 400, t });
      }
      expect(m.current, `x0=${x0} must be moving`).toBe("MOVING");
      // ⛔ Dead stop: the same coordinate, again and again, for well over restConfirmMs.
      for (let i = 1; i <= 20; i++) m.push({ x, y: 400, t: t + i * 10 });
      expect(m.current, `x0=${x0} must come to rest`).toBe("STATIONARY");
    }
  });

  it("⭐ and it settles at a band of ANY size", () => {
    // ⚠ The defect was invisible at 2.3 mm and appeared at 3.5 mm — the comparison landed
    // on the lucky side for one value and not the other. Sweep the slider's range.
    for (const band of [0.9, 2.3, 3.5, 5.0, 7.75]) {
      const c = { ...cfg, motionDeadbandMm: band, pointerNoiseMm: Math.min(cfg.pointerNoiseMm, band / 3) };
      const m = new MotionTracker(c);
      let x = 400;
      let t = 0;
      m.push({ x, y: 400, t });
      for (let i = 1; i <= 40; i++) {
        x += mmToPx(band / 3);
        t += 10;
        m.push({ x, y: 400, t });
      }
      expect(m.current, `band=${band}`).toBe("MOVING");
      for (let i = 1; i <= 20; i++) m.push({ x, y: 400, t: t + i * 10 });
      expect(m.current, `band=${band} must come to rest`).toBe("STATIONARY");
    }
  });
});

// ⭐⭐⭐ ═══════════════════════════════════════════════════════════════════════════════════
// ⛔⛔ THE SAMPLE THAT CONFIRMS REST IS STILL A SAMPLE — its travel is REAL and is emitted.
// ═══════════════════════════════════════════════════════════════════════════════════════
//
// ⛔⛔ **FOUND BY AUDIT 2026-09-17, AND IT IS §1.1's FIFTH CORRECTION.** The `MOVING` branch
// inside the band emitted raw travel on every sample — except the one on which the rest
// clock happened to expire, which returned **zero** and re-centred the band. ⚠ That sample's
// travel was not deferred, it was **destroyed**: up to two whole bands (7 mm at the shipped
// 3.5 mm) of finger motion vanished from the gesture.
//
// ⭐⭐ **WHY NO HAND EVER REPORTED IT AND NO VECTOR EVER SAW IT**: the branch needs a
// `pointermove` that lands after `restConfirmMs` (30 ms) of quiet but BEFORE the frame `tick`
// that would have confirmed rest with no sample at all — a window at most one frame wide.
// ⚠ So it is intermittent by construction: the same gesture, made twice, loses the travel
// once. That is the report a hand cannot reproduce and a suite cannot schedule.
//
// ⭐⭐ THE FIX SEPARATES TWO THINGS THAT WERE ONE STATEMENT: *where the band now sits*
// (`offset = 0`, re-centred — correct, and kept) and *what this sample travelled* (emitted,
// because it was measured while the axis was MOVING). ⛔ `METHOD`: *a state transition and a
// measurement are different quantities; a branch that returns one while deciding the other
// will eventually drop it.*
describe("⛔⛔ the rest-confirming sample's travel is EMITTED, not swallowed", () => {
  const BAND = cfg.motionDeadbandMm;

  /**
   * Drive one axis out of the band, let it rest for just under `restConfirmMs`, then deliver
   * ONE sample that both carries `reverseMm` of travel and lands after the clock expires.
   */
  const reversalOnTheConfirmingSample = (reverseMm: number) => {
    const m = new MotionTracker(cfg);
    let x = 500;
    let t = 0;
    m.push({ x, y: 400, t });
    // ⭐ Out of the band, so the axis is MOVING and has paid its one band.
    for (let i = 0; i < 4; i++) {
      x += mmToPx(BAND);
      t += 8;
      m.push({ x, y: 400, t });
    }
    expect(m.current).toBe("MOVING");
    // ⭐ Quiet samples INSIDE the band, stopping one sample short of `restConfirmMs`.
    const anchor = x;
    for (t += 8; t < cfg.restConfirmMs + 32; t += 8) m.push({ x: anchor, y: 400, t });
    expect(m.current, "rest must not be confirmed yet").toBe("MOVING");
    // ⛔ THE SAMPLE: a real reversal that arrives once the rest clock has expired.
    m.push({ x: anchor - mmToPx(reverseMm), y: 400, t: t + 8 });
    return pxToMm(m.step.dx);
  };

  it("⛔⛔ a reversal on that exact sample used to lose up to TWO BANDS of travel", () => {
    // ⚠ 1.9 bands: large enough to be a deliberate flick of the finger, small enough that the
    // offset still lands INSIDE the band and so takes the swallowing branch.
    const emitted = reversalOnTheConfirmingSample(BAND * 1.9);
    expect(emitted).toBeCloseTo(-BAND * 1.9, 6);
  });

  it("⭐ and the ordinary quiet sample is emitted too — the same branch, no special case", () => {
    // ⚠ Noise-sized travel, which is what the branch sees in ordinary play. It is emitted
    // for the same reason: every other sample of this drag was.
    const emitted = reversalOnTheConfirmingSample(cfg.pointerNoiseMm);
    expect(emitted).toBeCloseTo(-cfg.pointerNoiseMm, 6);
  });

  it("⛔⛔ a sample carrying more than a WHOLE BAND does not confirm rest at all", () => {
    // ⭐⭐ THE SECOND HALF, AND IT IS THE ONE THAT KEEPS A DRAG ALIVE. Emitting the travel
    // and still latching `STATIONARY` would stall the drag: the axis would have to re-earn
    // its band before the next sample emitted anything. ⛔ A sample that moved further than
    // one whole deadband IS motion, whatever the clock says — so the rest clock restarts
    // instead. ⚠ No new tunable: it is the band, compared against itself.
    const m = new MotionTracker(cfg);
    let x = 500;
    let t = 0;
    m.push({ x, y: 400, t });
    for (let i = 0; i < 4; i++) {
      x += mmToPx(BAND);
      t += 8;
      m.push({ x, y: 400, t });
    }
    const anchor = x;
    for (t += 8; t < cfg.restConfirmMs + 32; t += 8) m.push({ x: anchor, y: 400, t });
    m.push({ x: anchor - mmToPx(BAND * 1.9), y: 400, t: t + 8 });
    expect(m.current, "a 6.65 mm sample is not a resting finger").toBe("MOVING");
    // ⭐ And the drag continues at full rate, with no band re-paid.
    m.push({ x: anchor - mmToPx(BAND * 1.9) - mmToPx(0.4), y: 400, t: t + 16 });
    expect(pxToMm(m.step.dx)).toBeCloseTo(-0.4, 6);
  });

  it("⭐ rest is still reachable the ordinary way — by SILENCE", () => {
    // ⚠ The guard above must not make `STATIONARY` unreachable: a finger that stops emits
    // nothing, and `tick` is what confirms it. That is §1.1's own defect from 2026-09-16.
    const m = new MotionTracker(cfg);
    let x = 500;
    let t = 0;
    m.push({ x, y: 400, t });
    for (let i = 0; i < 4; i++) {
      x += mmToPx(BAND);
      t += 8;
      m.push({ x, y: 400, t });
    }
    expect(m.current).toBe("MOVING");
    m.tick(t + cfg.restConfirmMs + 1);
    expect(m.current).toBe("STATIONARY");
  });
});
