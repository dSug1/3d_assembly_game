import { describe, expect, it } from "vitest";
import {
  IDENTITY,
  canon,
  dot,
  normalize,
  qAngle,
  qFromAxisAngle,
  qRotate,
  qmul,
  shortestArc,
  type Vec3,
} from "../src/core/vec";

const X: Vec3 = [1, 0, 0];
const Y: Vec3 = [0, 1, 0];

describe("quaternions", () => {
  // ⛔⛔ THE DOUBLE COVER. `q` and `-q` are the same rotation, and the previous
  // project lost a day to a helper that always returned w >= 0 while the product
  // did not: a 15° turn read as −345° and a correction fired at full strength on
  // gestures that must receive none. It survived every suite because the suite
  // never fed a negated quaternion IN.
  it("canonicalises w >= 0, and a negated input is the SAME rotation", () => {
    const q = qFromAxisAngle(Y, Math.PI / 6);
    const negated = canon([-q[0], -q[1], -q[2], -q[3]]);
    expect(negated[0]).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < 4; i++) expect(negated[i]).toBeCloseTo(q[i]!, 12);
  });

  it("qmul output is always canonical, including for negated inputs", () => {
    const a = qFromAxisAngle(Y, 2.9);
    const b = qFromAxisAngle(X, 2.9);
    expect(qmul(a, b)[0]).toBeGreaterThanOrEqual(0);
    const negB = [-b[0], -b[1], -b[2], -b[3]] as const;
    expect(qmul(a, negB)[0]).toBeGreaterThanOrEqual(0);
  });

  it("angle is stable near identity", () => {
    expect(qAngle(IDENTITY)).toBeCloseTo(0, 12);
    expect(qAngle(qFromAxisAngle(Y, 1e-7))).toBeLessThan(1e-6);
  });
});

describe("shortestArc", () => {
  it("takes from onto to", () => {
    const q = shortestArc(X, Y);
    const got = qRotate(q, X);
    expect(dot(got, Y)).toBeCloseTo(1, 9);
  });

  it("is identity for parallel inputs", () => {
    expect(qAngle(shortestArc(X, X))).toBeCloseTo(0, 9);
  });

  // ⚠ ANTIPARALLEL IS A REAL INPUT, NOT AN EDGE CASE: a mate is anti-parallel by
  // definition, so this path runs constantly. Any perpendicular axis is correct;
  // what must not happen is NaN, identity, or a different answer each call.
  it("handles the antiparallel case deterministically", () => {
    const opposite: Vec3 = [-1, 0, 0];
    const q1 = shortestArc(X, opposite);
    const q2 = shortestArc(X, opposite);
    expect(q1).toEqual(q2);
    const got = qRotate(q1, X);
    expect(dot(got, opposite)).toBeCloseTo(1, 9);
  });

  it("refuses a degenerate input instead of guessing", () => {
    expect(normalize([0, 0, 0])).toBeNull();
    expect(qAngle(shortestArc([0, 0, 0], Y))).toBeCloseTo(0, 12);
  });
});
