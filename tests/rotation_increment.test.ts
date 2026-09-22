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
  snapCorrection,
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

describe("⭐⭐⭐ snapCorrection — the modulo, expressed as the angle still to travel", () => {
  const INC = 5 * DEG;

  it("is ZERO when the turn already landed on a multiple", () => {
    for (const deg of [0, 5, -5, 45, -120]) {
      expect(snapCorrection(deg * DEG, INC)).toBeCloseTo(0, 12);
    }
  });

  it("⭐ rounds to the NEAREST multiple, up or down", () => {
    // 23° → 25°, so the correction is +2°.
    expect(snapCorrection(23 * DEG, INC) / DEG).toBeCloseTo(2, 9);
    // 21° → 20°, so the correction is −1°.
    expect(snapCorrection(21 * DEG, INC) / DEG).toBeCloseTo(-1, 9);
  });

  it("⛔⛔ NEAREST and not DOWNWARD, which is the difference a hand would feel", () => {
    // ⚠ 44° with a 45° increment. Rounding down would throw the whole gesture away and spring
    // the body back to 0°; the owner's *"stops at a multiple"* plainly means the one it is at.
    const inc45 = 45 * DEG;
    expect(snapCorrection(44 * DEG, inc45) / DEG).toBeCloseTo(1, 9);
    expect(snapCorrection(44 * DEG, inc45)).toBeGreaterThan(0);
  });

  it("⭐⭐ is NEVER more than half an increment — which is why the settle is short", () => {
    // ⛔ The property that bounds the animation. A correction larger than half a step would
    // mean some nearer multiple had been passed over, and the settle would read as a second
    // gesture rather than as a landing.
    const inc = 45 * DEG;
    for (let d = -400; d <= 400; d += 0.37) {
      expect(Math.abs(snapCorrection(d * DEG, inc))).toBeLessThanOrEqual(inc / 2 + 1e-12);
    }
  });

  it("⭐ lands exactly on a multiple, for any starting angle", () => {
    // ⚠ The composition, not the arithmetic: total + correction must BE a multiple.
    const inc = 15 * DEG;
    for (let d = -200; d <= 200; d += 1.3) {
      const total = d * DEG;
      const landed = (total + snapCorrection(total, inc)) / inc;
      expect(landed - Math.round(landed)).toBeCloseTo(0, 9);
    }
  });

  it("⛔ refuses rather than dividing by a bad increment", () => {
    for (const bad of [0, -5, NaN, Infinity]) expect(snapCorrection(1, bad)).toBe(0);
    for (const bad of [NaN, Infinity]) expect(snapCorrection(bad, INC)).toBe(0);
  });
});

describe("⭐⭐ the TALLY — what one gesture asked for, per axis", () => {
  const INC = 5 * DEG;

  it("accumulates one axis across many frames", () => {
    const t = new RotationTally<string>();
    for (let i = 0; i < 12; i++) t.add("a", "yaw", Y, 1 * DEG);
    expect(t.total("a", "yaw") / DEG).toBeCloseTo(12, 9);
  });

  it("⭐ keeps axes INDEPENDENT — a yaw correction does not drag the pitch to a multiple", () => {
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 12 * DEG);
    t.add("a", "pitch", X, 7 * DEG);
    expect(t.total("a", "yaw") / DEG).toBeCloseTo(12, 9);
    expect(t.total("a", "pitch") / DEG).toBeCloseTo(7, 9);
  });

  it("⛔⛔ LATCHES the axis on first contact and never re-reads it", () => {
    // ⚠ A camera orbit mid-drag would otherwise redefine what "this rotation" was about, and
    // the correction would land the body on a multiple of an angle measured partly about one
    // axis and partly about another — invisible until someone orbits mid-gesture.
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 10 * DEG);
    t.add("a", "yaw", X, 10 * DEG); // a DIFFERENT axis under the same name
    const q = t.correction("a", 45 * DEG) as Quat;
    expect(q).not.toBeNull();
    // ⭐ The correction turns about Y — the axis the gesture STARTED about — not about X.
    const moved = qRotate(q, [0, 0, 1]);
    expect(Math.abs(moved[1])).toBeCloseTo(0, 9);
  });

  it("⭐⭐ the correction lands the gesture's whole turn on a multiple", () => {
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    const q = t.correction("a", INC) as Quat;
    // ⚠ 23° needs +2°, so the correction is a 2° turn about Y.
    expect(qAngle(q) / DEG).toBeCloseTo(2, 6);
  });

  it("⛔ NULL when there is nothing worth animating, not an identity quaternion", () => {
    // ⚠ The caller must be able to tell *nothing to do* from *a tiny settle*: a slerp to where
    // the body already is still costs a frame and still cancels whatever else was in flight.
    const t = new RotationTally<string>();
    expect(t.correction("never-touched", INC)).toBeNull();
    t.add("a", "yaw", Y, 10 * DEG); // already a multiple of 5°
    expect(t.correction("a", INC)).toBeNull();
  });

  it("⛔ an increment of zero is refused rather than divided by", () => {
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    expect(t.correction("a", 0)).toBeNull();
  });

  it("`clear` forgets the gesture", () => {
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    expect(t.touched("a")).toBe(true);
    t.clear("a");
    expect(t.touched("a")).toBe(false);
    expect(t.correction("a", INC)).toBeNull();
  });

  it("⭐⭐⭐ COMPOSED, ONE AXIS: the body's NET turn is exactly the multiple", () => {
    // ⛔ THE COMPOSITION THAT MATTERS, measured on the body rather than on the arithmetic:
    // turn 23°, apply the correction, and the body has turned 25° — not 23°, not 27°.
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    const gesture = qFromAxisAngle(Y, 23 * DEG);
    const landed = qmul(t.correction("a", INC) as Quat, gesture);
    expect(apart(IDENTITY, landed)).toBeCloseTo(25, 6);
  });

  it("⚠⚠ TWO AXES: the correction is the two per-axis corrections, composed", () => {
    // ⛔⛔ **AND THE LIMIT OF THE RULE IS WORTH STATING HERE, BECAUSE A READER WILL EXPECT
    // OTHERWISE.** Per-axis snapping is defined on what the gesture DEMANDED, not on the
    // orientation that comes out: rotations about different axes do not commute, so a body
    // that was turned 25° of yaw and 5° of pitch is NOT the same orientation as one built by
    // applying those two in the other order, and its net turn is neither 25° nor 30°.
    // ⚠ The first draft of this vector asserted exactly that equality and was wrong by 0.87° —
    // `METHOD`'s *a composition is a thing to MEASURE, not an emergent property*, aimed at my
    // own expectation rather than at the code.
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG); // → +2°
    t.add("a", "pitch", X, 7 * DEG); // → −2°
    const q = t.correction("a", INC) as Quat;
    expect(q).not.toBeNull();
    // ⭐ Insertion order: yaw was tallied first, so its correction is applied first and the
    // pitch's is composed on the left of it.
    const expected = qmul(qFromAxisAngle(X, -2 * DEG), qFromAxisAngle(Y, 2 * DEG));
    expect(apart(q, expected)).toBeCloseTo(0, 6);
  });
});
