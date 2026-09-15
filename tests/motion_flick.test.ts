import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import { MotionTracker, type MotionState, type Sample } from "../src/input/motion";
import { detectFlick, terminalSpeedPxPerS, trimBuffer } from "../src/input/flick";
import { mmToPx } from "../src/core/units";

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
