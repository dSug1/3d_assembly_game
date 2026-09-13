/**
 * GOLDEN VECTORS — the recognizer state machine (§1.3), `IN1`.
 *
 * ⭐⭐ THE VECTOR THAT MATTERS MOST IS THE ROLLBACK ONE. §1.3 exists because every
 * drag ends in a release, so before it every drag could satisfy a flick rule and the
 * two competed for the same gesture. The proof that they are now separable is that
 * a flick RESTORES the press snapshot and a drag does not — asserted on the pose
 * port itself, not inferred from the verdict string.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import type { Sample } from "../src/input/motion";
import { detectFlick, trimBuffer, type Flick } from "../src/input/flick";
import {
  NO_RELEASE_CONTEXT,
  Recognizer,
  TapHistory,
  resolveDiscreteRule,
  type PosePort,
  type ReleaseContext,
} from "../src/input/recognizer";
import { mmToPx } from "../src/core/units";

const cfg = DEFAULT_CONFIG;

/**
 * A recording pose port. ⭐ It records what the RECOGNIZER actually did to the pose,
 * rather than a second implementation recomputing what it should have done —
 * `METHOD`: record the value the product actually used.
 */
function recordingPose() {
  let pose = 0;
  const restored: number[] = [];
  const port: PosePort<number> = {
    snapshot: () => pose,
    restore: (p) => {
      pose = p;
      restored.push(p);
    },
  };
  return {
    port,
    restored,
    /** Stand-in for a continuous rule moving the object provisionally. */
    moveProvisionally: (to: number) => {
      pose = to;
    },
    current: () => pose,
  };
}

/** A straight run at a constant speed in mm/s, along +x unless `vertical`. */
function run(opts: {
  speedMmPerS: number;
  ms: number;
  x0?: number;
  y0?: number;
  t0?: number;
  stepMs?: number;
  vertical?: boolean;
}): Sample[] {
  const { speedMmPerS, ms } = opts;
  const x0 = opts.x0 ?? 100;
  const y0 = opts.y0 ?? 100;
  const t0 = opts.t0 ?? 0;
  const stepMs = opts.stepMs ?? 10;
  const out: Sample[] = [];
  for (let t = 0; t <= ms; t += stepMs) {
    const d = mmToPx((speedMmPerS * t) / 1000);
    out.push({ x: x0 + (opts.vertical ? 0 : d), y: y0 + (opts.vertical ? d : 0), t: t0 + t });
  }
  return out;
}

/** Press, feed every sample but the last as moves, release on the last. */
function gesture(
  rec: Recognizer<number>,
  samples: readonly Sample[],
  ctx: ReleaseContext = NO_RELEASE_CONTEXT,
) {
  rec.press(samples[0]!);
  for (let i = 1; i < samples.length - 1; i++) rec.move(samples[i]!);
  return rec.release(samples[samples.length - 1]!, ctx);
}

function fresh() {
  const pose = recordingPose();
  const taps = new TapHistory(cfg);
  return { pose, taps, rec: new Recognizer(cfg, pose.port, taps) };
}

describe("recognizer — the commit point", () => {
  it("a press that never travels stays PRESSED", () => {
    const { rec } = fresh();
    rec.press({ x: 100, y: 100, t: 0 });
    // Jitter well under moveEnterDistance (1.5 mm).
    for (let t = 10; t <= 200; t += 10) rec.move({ x: 100 + (t % 3) * 0.4, y: 100, t });
    expect(rec.currentPhase).toBe("PRESSED");
  });

  it("crossing moveEnterDistance commits, exactly once, to COMMITTED_CONTINUOUS", () => {
    const { rec } = fresh();
    const samples = run({ speedMmPerS: 40, ms: 200 });
    rec.press(samples[0]!);
    expect(rec.currentPhase).toBe("PRESSED");
    for (const s of samples.slice(1)) rec.move(s);
    expect(rec.currentPhase).toBe("COMMITTED_CONTINUOUS");
  });

  it("⛔ COMMITTED_CONTINUOUS is ONE-WAY: settling mid-drag does not un-commit", () => {
    // The pose has already moved provisionally. A recognizer that fell back to
    // PRESSED would strand it half-applied, with no snapshot restore and no
    // discrete rule — the object simply keeps an edit nobody asked for.
    const { rec } = fresh();
    const moving = run({ speedMmPerS: 40, ms: 200 });
    rec.press(moving[0]!);
    for (const s of moving.slice(1)) rec.move(s);
    expect(rec.currentPhase).toBe("COMMITTED_CONTINUOUS");
    const last = moving[moving.length - 1]!;
    for (let i = 1; i <= 60; i++) rec.move({ x: last.x, y: last.y, t: last.t + i * 10 });
    expect(rec.motionState).toBe("STATIONARY"); // the FINGER settled...
    expect(rec.currentPhase).toBe("COMMITTED_CONTINUOUS"); // ...the GESTURE did not
  });
});

describe("recognizer — provisional motion and rollback", () => {
  it("⭐⭐ a FLICK restores the press snapshot", () => {
    const { rec, pose } = fresh();
    const samples = run({ speedMmPerS: 400, ms: 120 });
    rec.press(samples[0]!);
    for (const s of samples.slice(1, -1)) rec.move(s);
    pose.moveProvisionally(42); // the continuous rule ran while committed
    const v = rec.release(samples[samples.length - 1]!);
    expect(v.kind).toBe("FLICK");
    expect(v.rolledBack).toBe(true);
    expect(pose.restored).toEqual([0]); // restored ONCE, to the press pose
    expect(pose.current()).toBe(0);
  });

  it("⭐⭐ a DRAG that decelerates keeps the provisional motion, untouched", () => {
    const { rec, pose } = fresh();
    const fast = run({ speedMmPerS: 400, ms: 100 });
    const last = fast[fast.length - 1]!;
    const settled: Sample[] = [
      { x: last.x + 0.2, y: last.y, t: last.t + 10 },
      { x: last.x + 0.3, y: last.y, t: last.t + 20 },
      { x: last.x + 0.35, y: last.y, t: last.t + 30 },
    ];
    rec.press(fast[0]!);
    for (const s of [...fast.slice(1), ...settled.slice(0, -1)]) rec.move(s);
    pose.moveProvisionally(42);
    const v = rec.release(settled[settled.length - 1]!);
    expect(v.kind).toBe("CONTINUOUS_KEPT");
    expect(v.rolledBack).toBe(false);
    expect(pose.restored).toEqual([]);
    expect(pose.current()).toBe(42);
  });

  it("a TAP never moved, so there is nothing to restore", () => {
    const { rec, pose } = fresh();
    const v = gesture(rec, [
      { x: 100, y: 100, t: 0 },
      { x: 100.5, y: 100, t: 40 },
      { x: 100, y: 100, t: 90 },
    ]);
    expect(v.kind).toBe("TAP");
    expect(pose.restored).toEqual([]);
  });
});

describe("recognizer — taps, and the double-tap §1.4 needs", () => {
  it("a short press with no travel is a TAP", () => {
    const { rec } = fresh();
    const v = gesture(rec, [
      { x: 100, y: 100, t: 0 },
      { x: 100, y: 100, t: 100 },
    ]);
    expect(v.kind).toBe("TAP");
    expect(v.rule).toBe("NONE"); // selection is rule 2, on press; a tap fires nothing
  });

  it("⛔ a LONG press with no travel is a HOLD, not a TAP", () => {
    // §1.3 bounds TAP only by distance. Without a duration bound, a finger resting
    // for ten seconds and lifting is a tap — and two of those clear a constraint
    // stack the user spent a gesture building.
    const { rec } = fresh();
    const v = gesture(rec, [
      { x: 100, y: 100, t: 0 },
      { x: 100, y: 100, t: 400 },
    ]);
    expect(v.kind).toBe("HOLD");
    expect(v.rule).toBe("NONE");
  });

  it("⭐ two taps on TWO DIFFERENT touchpoints are a DOUBLE_TAP → rule 2septies", () => {
    // ⛔ THE REASON TapHistory IS NOT IN THE RECOGNIZER: two taps are two pointer
    // ids, so the recognizer that saw the first is gone when the second presses.
    const pose = recordingPose();
    const taps = new TapHistory(cfg);
    const first = new Recognizer(cfg, pose.port, taps);
    const second = new Recognizer(cfg, pose.port, taps);
    expect(
      gesture(first, [
        { x: 100, y: 100, t: 0 },
        { x: 100, y: 100, t: 80 },
      ]).kind,
    ).toBe("TAP");
    const v = gesture(second, [
      { x: 100, y: 100, t: 300 },
      { x: 100, y: 100, t: 380 },
    ]);
    expect(v.kind).toBe("DOUBLE_TAP");
    expect(v.rule).toBe("2septies");
  });

  it("⛔ a third tap is a fresh TAP, not a second DOUBLE_TAP", () => {
    const pose = recordingPose();
    const taps = new TapHistory(cfg);
    const tap = (t: number) =>
      gesture(new Recognizer(cfg, pose.port, taps), [
        { x: 100, y: 100, t },
        { x: 100, y: 100, t: t + 60 },
      ]).kind;
    expect(tap(0)).toBe("TAP");
    expect(tap(200)).toBe("DOUBLE_TAP");
    expect(tap(400)).toBe("TAP");
  });

  it("⛔ two taps too far apart in TIME are two TAPs", () => {
    const pose = recordingPose();
    const taps = new TapHistory(cfg);
    const tap = (t: number) =>
      gesture(new Recognizer(cfg, pose.port, taps), [
        { x: 100, y: 100, t },
        { x: 100, y: 100, t: t + 60 },
      ]).kind;
    expect(tap(0)).toBe("TAP");
    expect(tap(600)).toBe("TAP"); // 540 ms after the first release
  });

  it("⛔ two taps too far apart in SPACE are two TAPs", () => {
    const pose = recordingPose();
    const taps = new TapHistory(cfg);
    const tap = (t: number, x: number) =>
      gesture(new Recognizer(cfg, pose.port, taps), [
        { x, y: 100, t },
        { x, y: 100, t: t + 60 },
      ]).kind;
    expect(tap(0, 100)).toBe("TAP");
    expect(tap(200, 100 + mmToPx(12))).toBe("TAP"); // 12 mm > doubleTapSlop (8 mm)
  });

  it("⛔ a DRAG between two taps breaks the chain", () => {
    const pose = recordingPose();
    const taps = new TapHistory(cfg);
    expect(
      gesture(new Recognizer(cfg, pose.port, taps), [
        { x: 100, y: 100, t: 0 },
        { x: 100, y: 100, t: 60 },
      ]).kind,
    ).toBe("TAP");
    gesture(new Recognizer(cfg, pose.port, taps), run({ speedMmPerS: 40, ms: 200, t0: 100 }));
    expect(
      gesture(new Recognizer(cfg, pose.port, taps), [
        { x: 100, y: 100, t: 400 },
        { x: 100, y: 100, t: 460 },
      ]).kind,
    ).toBe("TAP");
  });
});

describe("recognizer — roll (2quinte) inside COMMITTED_CONTINUOUS", () => {
  /** A circular sweep, clockwise on screen, at 15 mm radius. */
  function circle(steps: number, clockwise: boolean, t0 = 0): Sample[] {
    const r = mmToPx(15);
    const dir = clockwise ? 1 : -1;
    const out: Sample[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = ((dir * 5 * i) * Math.PI) / 180;
      out.push({ x: 200 + r * Math.cos(a), y: 200 + r * Math.sin(a), t: t0 + i * 10 });
    }
    return out;
  }

  it("a clockwise sweep commits to roll, with a POSITIVE angle, and keeps its motion", () => {
    const { rec, pose } = fresh();
    const samples = circle(30, true);
    rec.press(samples[0]!);
    for (const s of samples.slice(1, -1)) rec.move(s);
    pose.moveProvisionally(42);
    const v = rec.release(samples[samples.length - 1]!);
    expect(v.kind).toBe("ROLL_KEPT");
    expect(v.rollDeg).toBeGreaterThan(0);
    expect(v.rolledBack).toBe(false);
    expect(pose.current()).toBe(42);
  });

  it("a counter-clockwise sweep commits with a NEGATIVE angle", () => {
    const { rec } = fresh();
    const v = gesture(rec, circle(30, false));
    expect(v.kind).toBe("ROLL_KEPT");
    expect(v.rollDeg).toBeLessThan(0);
  });

  it("⭐⭐ once roll is committed the FLICK TEST IS SKIPPED — proven, not assumed", () => {
    // §1.3 says a circular path fails the purity ratio anyway, so the skip could
    // look decorative. It is not: here the gesture ENDS with a fast straight run
    // that IS a flick on its own — asserted below as the counter-example — and the
    // recognizer must still report ROLL_KEPT and roll nothing back.
    const { rec, pose } = fresh();
    const swept = circle(30, true);
    const last = swept[swept.length - 1]!;
    const tail = run({
      speedMmPerS: 400,
      ms: 120,
      x0: last.x,
      y0: last.y,
      t0: last.t + 10,
    });
    expect(detectFlick(trimBuffer(tail, cfg), cfg)).not.toBeNull(); // the counter-example

    rec.press(swept[0]!);
    for (const s of [...swept.slice(1), ...tail.slice(0, -1)]) rec.move(s);
    pose.moveProvisionally(42);
    const v = rec.release(tail[tail.length - 1]!);
    expect(v.kind).toBe("ROLL_KEPT");
    expect(v.rolledBack).toBe(false);
    expect(pose.current()).toBe(42);
  });
});

describe("release-time priority (§1.3)", () => {
  const flick = (axis: "HORIZONTAL" | "VERTICAL"): Flick => ({
    axis,
    sign: 1,
    travelMm: 20,
    liftSpeedMmPerS: 400,
    purity: 9,
  });
  const ctx = (o: Partial<ReleaseContext>): ReleaseContext => ({
    ...NO_RELEASE_CONTEXT,
    ...o,
  });

  it("a DOUBLE_TAP fires 2septies", () => {
    expect(resolveDiscreteRule("DOUBLE_TAP", null, ctx({}), cfg)).toBe("2septies");
  });

  it("a VERTICAL flick on one object fires 2ter (gravity)", () => {
    const r = resolveDiscreteRule("FLICK", flick("VERTICAL"), ctx({ singleObjectSelected: true }), cfg);
    expect(r).toBe("2ter");
  });

  it("a HORIZONTAL flick on one object fires 2quater (world axis)", () => {
    const r = resolveDiscreteRule("FLICK", flick("HORIZONTAL"), ctx({ singleObjectSelected: true }), cfg);
    expect(r).toBe("2quater");
  });

  it("⭐ 6quater OUTRANKS 2ter when the mate context holds and the flick is directed", () => {
    const r = resolveDiscreteRule(
      "FLICK",
      flick("VERTICAL"),
      ctx({
        singleObjectSelected: true, // 2ter would otherwise fire
        mateContextAvailable: true,
        mateDirectionPurity: cfg.mateDirectionPurity + 1,
      }),
      cfg,
    );
    expect(r).toBe("6quater");
  });

  it("⚠ an UNDIRECTED flick in a mate context falls THROUGH to 2ter", () => {
    // It must not swallow the gesture: a user with two objects selected would then
    // have no way to set a gravity anchor at all.
    const r = resolveDiscreteRule(
      "FLICK",
      flick("VERTICAL"),
      ctx({
        singleObjectSelected: true,
        mateContextAvailable: true,
        mateDirectionPurity: cfg.mateDirectionPurity - 0.5,
      }),
      cfg,
    );
    expect(r).toBe("2ter");
  });

  it("a flick with nothing selected fires nothing", () => {
    expect(resolveDiscreteRule("FLICK", flick("VERTICAL"), ctx({}), cfg)).toBe("NONE");
  });

  it("⛔ EXACTLY ONE rule can come back — the kinds that keep motion fire none", () => {
    for (const kind of ["CONTINUOUS_KEPT", "ROLL_KEPT", "TAP", "HOLD"] as const) {
      expect(
        resolveDiscreteRule(
          kind,
          flick("VERTICAL"),
          ctx({ singleObjectSelected: true, mateContextAvailable: true, mateDirectionPurity: 9 }),
          cfg,
        ),
      ).toBe("NONE");
    }
  });
});
