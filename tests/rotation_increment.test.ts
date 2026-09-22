/**
 * ⭐⭐⭐ **THE BODY IS ALWAYS ON AN INCREMENT** — the owner, 2026-09-22, rejecting the third
 * formulation: *"the object rotates then rotates back in the reverse direction to snap the
 * increment. This is not what I want: I want the object to stop to an increment and not rotate
 * further if the delta position input becomes too weak."*
 *
 * ⛔⛔ **FOUR FORMULATIONS, AND THESE VECTORS ARE SHAPED BY WHY THE FIRST THREE FAILED.**
 * Quantising the turn as it happened queued the increments and lagged the finger; rounding at
 * the release carried the body forward of it; truncating back when the finger rested made it
 * reverse. ⭐ All three let the body reach a pose it was not allowed to hold, then argued about
 * how to get it back. So the properties tested here are **never past the demand** and **never
 * backwards** — and a fifth formulation that broke either would redden, whatever else it fixed.
 */
import { describe, expect, it } from "vitest";
import { RotationTally, incrementRadians } from "../src/input/rotation_increment";
import {
  IDENTITY,
  qAngle,
  qFromAxisAngle,
  qRotate,
  qmul,
  type Quat,
  type Vec3,
} from "../src/core/vec";
import { screenPlaneRotation } from "../src/input/screen_rotate";
import { rotateAboutAxis } from "../src/input/anchor_rotate";
import { gravityFrame } from "../src/input/gravity_frame";

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

describe("⭐⭐⭐ advance — the body steps to the increment the finger is in", () => {
  const INC = 5 * DEG;

  it("does NOTHING until a boundary is crossed — *not rotate further if the input is weak*", () => {
    // ⛔ THE OWNER'S SENTENCE, as a vector. 4° of demand at a 5° detent moves nothing at all;
    // the body holds exactly where it is, with no correction to make because it never left.
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 4 * DEG);
    expect(t.advance("a", INC)).toBeNull();
    expect(t.applied("a", "yaw")).toBe(0);
  });

  it("⭐⭐ steps EXACTLY one increment when one boundary is crossed", () => {
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 6 * DEG);
    expect(qAngle(t.advance("a", INC) as Quat) / DEG).toBeCloseTo(5, 6);
    expect(t.applied("a", "yaw") / DEG).toBeCloseTo(5, 6);
    // ⚠ And the 1° left over is kept, so the next boundary arrives on time.
    expect(t.demanded("a", "yaw") / DEG).toBeCloseTo(6, 6);
  });

  it("⭐⭐⭐ NEVER goes past the demand, and NEVER backwards — over a whole sweep", () => {
    // ⛔⛔ **THE TWO PROPERTIES THE FIRST THREE FORMULATIONS BROKE**, stated as one loop.
    // Rounding at the release broke the first; truncating back on rest broke the second.
    // ⭐ A fifth formulation that reintroduced either would redden here.
    for (const sign of [+1, -1]) {
      const t = new RotationTally<string>();
      let applied = 0;
      for (let i = 1; i <= 200; i++) {
        t.add("a", "yaw", Y, sign * 0.37 * DEG);
        t.advance("a", INC);
        const now = t.applied("a", "yaw");
        const demanded = t.demanded("a", "yaw");
        // never past the demand
        expect(Math.abs(now)).toBeLessThanOrEqual(Math.abs(demanded) + 1e-12);
        // never backwards
        expect(Math.abs(now)).toBeGreaterThanOrEqual(Math.abs(applied) - 1e-12);
        // always ON an increment
        const k = now / INC;
        expect(k - Math.round(k)).toBeCloseTo(0, 9);
        applied = now;
      }
    }
  });

  it("⭐⭐ JUMPS SEVERAL INCREMENTS AT ONCE — which is why it cannot build a backlog", () => {
    // ⛔ THE DIFFERENCE FROM FORMULATION 1, as a number. A frame whose demand crossed four
    // boundaries advances FOUR at once. The queue that played them one at a time is what
    // lagged the finger, and there is no queue here to grow.
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    expect(qAngle(t.advance("a", INC) as Quat) / DEG).toBeCloseTo(20, 6);
    expect(t.applied("a", "yaw") / DEG).toBeCloseTo(20, 6);
  });

  it("⛔ is symmetric in sign — `trunc`, not `floor`", () => {
    // ⚠ `Math.floor` sends −23° to −25°, PAST the demand and inverted relative to the positive
    // case. *An invariant tested on one axis is not tested*, one sign over.
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, -23 * DEG);
    expect(qAngle(t.advance("a", INC) as Quat) / DEG).toBeCloseTo(20, 6);
    expect(t.applied("a", "yaw") / DEG).toBeCloseTo(-20, 6);
  });

  it("⭐ a REVERSAL steps back down through the detents, never past the demand", () => {
    // ⚠ Turning back is the user's own doing, not a correction: the demand itself fell.
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    t.advance("a", INC); // at 20°
    t.add("a", "yaw", Y, -10 * DEG); // demand now 13°
    t.advance("a", INC);
    expect(t.applied("a", "yaw") / DEG).toBeCloseTo(10, 6);
  });

  it("⛔ NULL when nothing was crossed, not an identity quaternion", () => {
    // ⚠ The caller must tell *nothing to do* from *a tiny step*: starting an animation to where
    // the body already is would still cancel whatever else was in flight.
    const t = new RotationTally<string>();
    expect(t.advance("never-touched", INC)).toBeNull();
    t.add("a", "yaw", Y, 12 * DEG);
    expect(t.advance("a", INC)).not.toBeNull();
    expect(t.advance("a", INC)).toBeNull(); // asked twice, nothing new crossed
  });

  it("⛔ refuses a bad increment rather than dividing by it", () => {
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    for (const bad of [0, -5, NaN, Infinity]) expect(t.advance("a", bad)).toBeNull();
  });

  it("⭐ keeps axes INDEPENDENT, and latches each axis on first contact", () => {
    // ⚠ A camera orbit mid-drag would otherwise redefine what *this rotation* was about.
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 12 * DEG);
    t.add("a", "yaw", X, 13 * DEG); // a DIFFERENT axis under the same name
    t.add("a", "pitch", X, 4 * DEG);
    const q = t.advance("a", INC) as Quat;
    expect(q).not.toBeNull();
    // ⭐ The pitch crossed nothing, so it contributes nothing; the yaw turns about Y.
    expect(t.applied("a", "pitch")).toBe(0);
    const moved = qRotate(q, [0, 0, 1]);
    expect(Math.abs(moved[1])).toBeCloseTo(0, 9);
  });

  it("`clear` forgets the gesture", () => {
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    expect(t.touched("a")).toBe(true);
    t.clear("a");
    expect(t.touched("a")).toBe(false);
    expect(t.advance("a", INC)).toBeNull();
  });

  it("⭐⭐⭐ COMPOSED: the body's NET turn is the increment, measured on the body", () => {
    // ⛔ Not the arithmetic — the pose. Demand 23°, step, and the body has turned 20°.
    const t = new RotationTally<string>();
    t.add("a", "yaw", Y, 23 * DEG);
    const landed = qmul(t.advance("a", INC) as Quat, IDENTITY);
    expect(apart(IDENTITY, landed)).toBeCloseTo(20, 6);
  });
});

describe("⛔⛔ THE SIGNS THE INCREMENT PATH RESTATES", () => {
  /**
   * ⚠⚠ **WHY THIS BLOCK EXISTS.** With increments ON, `scene.ts` does not call
   * `screenPlaneRotation` — a tally needs the AXIS and the ANGLE, not their product — so it
   * restates both. ⛔ That is a duplicated definition, and two definitions of one fact drift.
   * ⭐ `METHOD`: *a sign is not tested by any amount of testing the magnitude.*
   */
  const frame = gravityFrame([0, 0, 1], [0, -1, 0]);
  if (frame === null) throw new Error("the fixture's own frame is degenerate");
  // ⚠ NOT the identity: a sign error vanishes there.
  const base = qFromAxisAngle([0.3, 0.5, 0.8], 0.7);

  it("the free YAW/PITCH tally states `screenPlaneRotation`'s own angles", () => {
    const r = 0.004;
    for (const [dx, dy] of [
      [30, 12],
      [-30, 12],
      [30, -12],
      [200, 150],
    ] as const) {
      const viaProduct = screenPlaneRotation(base, frame, dx, dy, r);
      // ⭐ base, then PITCH about `right`, then YAW about `up` — the order matters and is
      // asserted, because swapping it is wrong only away from the identity.
      const viaTally = rotateAboutAxis(
        rotateAboutAxis(base, frame.right, -dy * r),
        frame.up,
        -dx * r,
      );
      expect(apart(viaProduct, viaTally)).toBeCloseTo(0, 9);
    }
  });

  it("⛔ and the ORDER is what makes the vector above bite", () => {
    // ⚠ Driven hard on purpose: two rotations commute to first order, so at a realistic frame's
    // few degrees the disagreement is a third of a degree and a threshold picked by eye lands
    // on the wrong side of it.
    const r = 0.004;
    const [dx, dy] = [200, 150];
    const wrongOrder = rotateAboutAxis(
      rotateAboutAxis(base, frame.up, -dx * r),
      frame.right,
      -dy * r,
    );
    expect(apart(screenPlaneRotation(base, frame, dx, dy, r), wrongOrder)).toBeGreaterThan(5);
  });
});
