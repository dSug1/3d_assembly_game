import { describe, expect, it } from "vitest";
import {
  IDENTITY,
  canon,
  dot,
  normalize,
  qAngle,
  qFromAxisAngle,
  qRotate,
  qSlerp,
  qconj,
  qmul,
  shortestArc,
  type Quat,
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

// ══════════════════════════════════════════════════════════════════════════════
// ⭐⭐ qSlerp — the alignment's animated snap (`D45`)
// ══════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ qSlerp — constant angular speed, and the DOUBLE COVER", () => {
  const axis: Vec3 = [0.3, 0.8, -0.5];

  it("⭐ the endpoints are exact — nothing drifts at t=0 or t=1", () => {
    const a = qFromAxisAngle(axis, 0.4);
    const b = qFromAxisAngle(axis, 2.1);
    qSlerp(a, b, 0).forEach((v, i) => expect(v).toBeCloseTo(a[i]!, 12));
    qSlerp(a, b, 1).forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 12));
  });

  it("⭐⭐ half-way is HALF THE ANGLE — the property a lerp does not have", () => {
    // ⛔ A straight lerp between two quaternions cuts the chord: it arrives, but not at a
    // constant rate, which is exactly what an animated snap would show as a slow-fast-slow
    // wobble on top of its easing. ⭐ So the test is on the ANGLE, not on the components.
    const a = qFromAxisAngle(axis, 0);
    const b = qFromAxisAngle(axis, 1.6);
    expect(qAngle(qmul(qSlerp(a, b, 0.5), qconj(a)))).toBeCloseTo(0.8, 9);
    expect(qAngle(qmul(qSlerp(a, b, 0.25), qconj(a)))).toBeCloseTo(0.4, 9);
  });

  it("⛔⛔ IT TAKES THE SHORT WAY ROUND when the inputs differ in SIGN", () => {
    // ⭐⭐ `q` and `−q` are the SAME rotation, and a caller cannot know which it holds. ⛔
    // Without the negation this would travel the long way — up to 360° to express a small
    // turn — and the object would spin right round on its way to an alignment 10° away.
    const a = qFromAxisAngle(axis, 0.2);
    const b = qFromAxisAngle(axis, 0.6);
    const flipped: Quat = [-b[0]!, -b[1]!, -b[2]!, -b[3]!];
    const viaFlipped = qSlerp(a, flipped, 0.5);
    const direct = qSlerp(a, b, 0.5);
    viaFlipped.forEach((v, i) => expect(v).toBeCloseTo(direct[i]!, 12));
    // and the travel really is the short arc, not its 2π complement
    expect(qAngle(qmul(viaFlipped, qconj(a)))).toBeCloseTo(0.2, 9);
  });

  it("⭐ every result is a UNIT quaternion — including the near-parallel fallback", () => {
    // ⚠ The fallback is a LERP, which cuts the chord and is NOT unit until normalised. ⛔ A
    // non-unit orientation scales every vector it rotates, which reads as a gain defect.
    const a = qFromAxisAngle(axis, 1.0);
    for (const sep of [1e-5, 1e-3, 0.5, 2.5]) {
      const b = qFromAxisAngle(axis, 1.0 + sep);
      for (const t of [0, 0.13, 0.5, 0.87, 1]) {
        const q = qSlerp(a, b, t);
        expect(Math.hypot(q[0], q[1], q[2], q[3])).toBeCloseTo(1, 12);
      }
    }
  });

  it("⚠ t is CLAMPED — an overrun cannot fling the object past its target", () => {
    // ⭐ A frame can arrive late, so `(now - t0) / ms` exceeding 1 is ordinary, not a bug.
    const a = qFromAxisAngle(axis, 0.2);
    const b = qFromAxisAngle(axis, 1.2);
    qSlerp(a, b, 1.9).forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 12));
    qSlerp(a, b, -0.4).forEach((v, i) => expect(v).toBeCloseTo(a[i]!, 12));
  });
});
