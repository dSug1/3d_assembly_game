/**
 * ⭐⭐⭐ **A ROTATION ENDS ON A MULTIPLE** — the owner, 2026-09-22, second formulation:
 * *"any rotation stops at a degree which is a multiple of the incrmt … Just make sure the end
 * of the rotation is by increment."*
 *
 * ⛔⛔ **THE FIRST FORMULATION WAS BUILT AND REJECTED**, and these vectors are shaped by why:
 * it quantised the turn *as it happened*, so the body could only move as fast as its queue
 * drained and a brisk drag outran it. ⭐ The property that replaces it is not *the steps are
 * smaller* — it is that **nothing is quantised during the drag at all**. So what is tested here
 * is a single END correction, and the vectors say out loud that the correction is at most half
 * an increment, which is what keeps the settle short.
 */
import { describe, expect, it } from "vitest";
import {
  RotationTally,
  incrementRadians,
  REST_WINDOW_MS,
  RotationSpeed,
  restThresholdRadPerS,
  truncateCorrection,
} from "../src/input/rotation_increment";
import {
  IDENTITY,
  qAngle,
  qFromAxisAngle,
  qRotate,
  qmul,
  type Quat,
  type Vec3,
} from "../src/core/vec";

const DEG = Math.PI / 180;
const Y: Vec3 = [0, 1, 0];
const X: Vec3 = [1, 0, 0];

/** The angle between two orientations, in degrees. */
function apart(a: Quat, b: Quat): number {
  const inv: Quat = [a[0], -a[1], -a[2], -a[3]];
  return qAngle(qmul(b, inv)) / DEG;
}

describe("⭐ incrementRadians — the flag and the angle in one slider", () => {
  it("⛔ 0 is OFF — the current build, untouched", () => {
    expect(incrementRadians(0)).toBeNull();
  });

  it("⛔ a negative or unusable angle is OFF, never an absolute value", () => {
    for (const bad of [-5, -0.001, NaN, Infinity, -Infinity]) {
      expect(incrementRadians(bad)).toBeNull();
    }
  });

  it("converts the slider's own range", () => {
    expect(incrementRadians(5)).toBeCloseTo(5 * DEG, 12);
    expect(incrementRadians(45)).toBeCloseTo(45 * DEG, 12);
  });
});

describe("⭐⭐⭐ truncateCorrection — back to the increment the turn already passed", () => {
  const INC = 5 * DEG;

  it("is ZERO when the turn already landed on a multiple", () => {
    for (const deg of [0, 5, -5, 45, -120]) {
      expect(truncateCorrection(deg * DEG, INC)).toBeCloseTo(0, 12);
    }
  });

  it("⭐⭐⭐ gives BACK the remainder — 23° returns to 20°, never on to 25°", () => {
    // ⛔⛔ **THE CORRECTION THE FIRST BUILD GOT WRONG.** It ROUNDED, so 23° went forward to
    // 25° — carrying the body somewhere the finger never took it. ⭐ The owner: *"smoothly
    // truncated to the nearest past increment"*.
    expect(truncateCorrection(23 * DEG, INC) / DEG).toBeCloseTo(-3, 9);
    expect(truncateCorrection(21 * DEG, INC) / DEG).toBeCloseTo(-1, 9);
    // ⚠ 44° with a 45° increment gives the whole gesture back. That IS the rule: nothing
    // past the first increment was ever reached.
    expect(truncateCorrection(44 * DEG, 45 * DEG) / DEG).toBeCloseTo(-44, 9);
  });

  it("⛔⛔ TRUNCATES TOWARD THE START, so a NEGATIVE turn behaves like a positive one", () => {
    // ⭐ `Math.trunc`, not `Math.floor`. Flooring sends −23° to −25° — FURTHER than the finger
    // went, and inverted relative to the positive case. ⚠ *An invariant tested on one axis is
    // not tested*: this is the same shape, one sign over.
    expect(truncateCorrection(-23 * DEG, INC) / DEG).toBeCloseTo(+3, 9);
    expect(truncateCorrection(-21 * DEG, INC) / DEG).toBeCloseTo(+1, 9);
  });

  it("⭐⭐ NEVER carries the body FORWARD — the property the whole rule is about", () => {
    // ⛔ The correction always opposes the turn, and the truncated total is never larger in
    // magnitude than the demanded one. A rounding rule fails both of these for half its inputs.
    const inc = 15 * DEG;
    for (let d = -400; d <= 400; d += 0.37) {
      const total = d * DEG;
      const c = truncateCorrection(total, inc);
      if (Math.abs(c) < 1e-12) continue;
      expect(Math.sign(c)).toBe(-Math.sign(total));
      expect(Math.abs(total + c)).toBeLessThanOrEqual(Math.abs(total) + 1e-12);
      expect(Math.abs(c)).toBeLessThan(inc);
    }
  });

  it("⭐ lands exactly on a multiple, for any starting angle", () => {
    const inc = 15 * DEG;
    for (let d = -200; d <= 200; d += 1.3) {
      const total = d * DEG;
      const landed = (total + truncateCorrection(total, inc)) / inc;
      expect(landed - Math.round(landed)).toBeCloseTo(0, 9);
    }
  });

  it("⛔ refuses rather than dividing by a bad increment", () => {
    for (const bad of [0, -5, NaN, Infinity]) expect(truncateCorrection(1, bad)).toBe(0);
    for (const bad of [NaN, Infinity]) expect(truncateCorrection(bad, INC)).toBe(0);
  });
});

describe("⭐⭐ the TALLY — what one gesture asked for, and the retreat it owes", () => {
  const INC = 5 * DEG;

  it("accumulates one axis across many frames", () => {
    const t = new RotationTally<string>();
    for (let i = 0; i < 12; i++) t.add("a", "yaw", Y, 1 * DEG);
    expect(t.total("a", "yaw") / DEG).toBeCloseTo(12, 9);
  });

  it("⭐ keeps axes INDEPENDENT", () => {
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 12 * DEG);
    t.add("a", "pitch", X, 7 * DEG);
    expect(t.total("a", "yaw") / DEG).toBeCloseTo(12, 9);
    expect(t.total("a", "pitch") / DEG).toBeCloseTo(7, 9);
  });

  it("⛔⛔ LATCHES the axis on first contact and never re-reads it", () => {
    // ⚠ A camera orbit mid-drag would otherwise redefine what "this rotation" was about.
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 10 * DEG);
    t.add("a", "yaw", X, 13 * DEG); // a DIFFERENT axis under the same name
    const q = t.truncate("a", INC) as Quat;
    expect(q).not.toBeNull();
    // ⭐ The retreat turns about Y — the axis the gesture STARTED about — not about X.
    const moved = qRotate(q, [0, 0, 1]);
    expect(Math.abs(moved[1])).toBeCloseTo(0, 9);
  });

  it("⭐⭐ the retreat is the remainder, turned the other way", () => {
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    expect(qAngle(t.truncate("a", INC) as Quat) / DEG).toBeCloseTo(3, 6);
  });

  it("⭐⭐⭐ REBASES, so a drag that rests three times does not drift", () => {
    // ⛔⛔ THE PROPERTY THAT MAKES A REPEATED REST SAFE, and the one a bookkeeping slip would
    // lose. After truncating, the gesture really HAS turned the truncated amount — so the next
    // rest must measure from there. ⚠ Left un-rebased, each of three pauses would give back its
    // own remainder again and the body would walk backwards.
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    t.truncate("a", INC);
    expect(t.total("a", "yaw") / DEG).toBeCloseTo(20, 6);
    // ⭐ Resting again with nothing new demanded gives back NOTHING.
    expect(t.truncate("a", INC)).toBeNull();
    // ⭐ And the drag carries on from the increment: +7° more reaches 27°, back to 25°.
    t.add("a", "yaw", Y, 7 * DEG);
    expect(t.total("a", "yaw") / DEG).toBeCloseTo(27, 6);
    t.truncate("a", INC);
    expect(t.total("a", "yaw") / DEG).toBeCloseTo(25, 6);
  });

  it("⛔ NULL when there is nothing to give back, not an identity quaternion", () => {
    const t = new RotationTally<string>();
    expect(t.truncate("never-touched", INC)).toBeNull();
    t.add("a", "yaw", Y, 10 * DEG); // already a multiple of 5°
    expect(t.truncate("a", INC)).toBeNull();
  });

  it("⛔ an increment of zero is refused rather than divided by", () => {
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    expect(t.truncate("a", 0)).toBeNull();
  });

  it("`clear` forgets the gesture", () => {
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    expect(t.touched("a")).toBe(true);
    t.clear("a");
    expect(t.touched("a")).toBe(false);
    expect(t.truncate("a", INC)).toBeNull();
  });

  it("⭐⭐⭐ COMPOSED, ONE AXIS: the body's NET turn is exactly the past increment", () => {
    // ⛔ Measured on the body rather than on the arithmetic: turn 23°, rest, and the body has
    // turned 20° — not 23° and, crucially, not 25°.
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    const landed = qmul(t.truncate("a", INC) as Quat, qFromAxisAngle(Y, 23 * DEG));
    expect(apart(IDENTITY, landed)).toBeCloseTo(20, 6);
  });
});

describe("⭐⭐⭐ THE REST THRESHOLD SCALES WITH THE DETENT (2026-09-22)", () => {
  /**
   * The owner: *"The threshold shall probably depend on the increment value (harder to move 45
   * degree increment than 1 degree increment)."*
   *
   * ⛔⛔ **AND THE ARITHMETIC SAYS BY HOW MUCH.** One detent is `increment / gain` of finger
   * travel — at `gainRotateFree` 0.07 rad/mm that is **1.25 mm** at 5° and **11.2 mm** at 45°.
   * Against §1.1's flat 3.5 mm band the detent is three bands wide at one end of the slider and
   * a third of a band at the other, so the SAME pause gives back 4° or **44°**. ⭐ A threshold
   * in increments per second cannot have that failure.
   */
  it("⭐⭐ a 45° detent tolerates NINE TIMES the speed of a 5° one", () => {
    // ⛔ THE RATIO IS THE ASSERTION. A fixed threshold gives 1 here, and that is the defect.
    const slow = restThresholdRadPerS(5 * DEG, 1);
    const fast = restThresholdRadPerS(45 * DEG, 1);
    expect(fast / slow).toBeCloseTo(9, 9);
  });

  it("is linear in the fraction, so the slider means what it says", () => {
    expect(restThresholdRadPerS(5 * DEG, 2) / restThresholdRadPerS(5 * DEG, 1)).toBeCloseTo(2, 9);
    // ⚠ `1` is literally *one increment per second*.
    expect(restThresholdRadPerS(5 * DEG, 1)).toBeCloseTo(5 * DEG, 12);
  });

  it("⛔ refuses what it cannot vouch for, rather than returning a usable-looking number", () => {
    for (const bad of [0, -1, NaN, Infinity]) {
      expect(restThresholdRadPerS(bad, 1)).toBe(0);
      expect(restThresholdRadPerS(5 * DEG, bad)).toBe(0);
    }
  });
});

describe("⭐⭐ RotationSpeed — the demand over a stated window", () => {
  it("reports demand per second over the window", () => {
    const v = new RotationSpeed<string>();
    // Six samples of 1° inside one window = 6° per window = 60°/s at a 100 ms window.
    for (let i = 0; i < 6; i++) v.add("a", i * 10, 1 * DEG);
    expect((v.speed("a", 50) / DEG) * (REST_WINDOW_MS / 1000)).toBeCloseTo(6, 6);
  });

  it("⛔⛔⛔ A SILENT WINDOW READS ZERO — the defect §1.1 shipped twice", () => {
    // ⛔⛔ **THE ONE THAT MATTERS.** If the rate were divided by the span between surviving
    // samples rather than by the WINDOW, then as the finger stops and samples stop arriving the
    // span would collapse and the computed rate would RISE — so rest becomes unreachable exactly
    // when it is true. ⚠ That is `QUEUE`'s first mistake shape, and §1.1 met it twice: once as
    // *"STATIONARY was unreachable for any real finger"*, once as a tracker advanced only by
    // `pointermove` that froze at MOVING. ⭐ A fixed divisor makes silence read as stillness.
    const v = new RotationSpeed<string>();
    v.add("a", 0, 10 * DEG);
    expect(v.speed("a", 0)).toBeGreaterThan(0);
    // … and now nothing arrives for longer than the window.
    expect(v.speed("a", REST_WINDOW_MS + 1)).toBe(0);
  });

  it("drops samples older than the window, and keeps the ones inside it", () => {
    const v = new RotationSpeed<string>();
    v.add("a", 0, 10 * DEG); // will fall out
    v.add("a", REST_WINDOW_MS - 10, 2 * DEG); // will survive
    const kept = (v.speed("a", REST_WINDOW_MS) * REST_WINDOW_MS) / 1000;
    expect(kept / DEG).toBeCloseTo(2, 6);
  });

  it("⚠ counts a REVERSAL as motion — the sign is dropped", () => {
    // ⛔ A hand shaking the object back and forth is not at rest, and a signed sum would cancel
    // to zero and truncate in the middle of the shake.
    const v = new RotationSpeed<string>();
    v.add("a", 0, +5 * DEG);
    v.add("a", 10, -5 * DEG);
    expect(v.speed("a", 20)).toBeGreaterThan(0);
  });

  it("ignores what it cannot use, and forgets on `clear`", () => {
    const v = new RotationSpeed<string>();
    v.add("a", 0, NaN);
    v.add("a", NaN, 5 * DEG);
    v.add("a", 0, 0);
    expect(v.speed("a", 0)).toBe(0);
    v.add("a", 0, 5 * DEG);
    expect(v.speed("a", 0)).toBeGreaterThan(0);
    v.clear("a");
    expect(v.speed("a", 0)).toBe(0);
  });

  it("⭐ bodies are independent", () => {
    const v = new RotationSpeed<string>();
    v.add("a", 0, 5 * DEG);
    expect(v.speed("b", 0)).toBe(0);
  });
});
