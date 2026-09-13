import { describe, expect, it } from "vitest";
import {
  type Constraint,
  push,
  solve,
} from "../src/core/constraint_stack";
import { IDENTITY, dot, qRotate, qmul, type Vec3 } from "../src/core/vec";

const UP: Vec3 = [0, 1, 0];
const RIGHT: Vec3 = [1, 0, 0];
const OPTS = { evictOnOverflow: false };

const gravity: Constraint = {
  kind: "GRAVITY_ALIGN",
  localNormal: [0, 0, 1],
  targetWorld: UP,
};
const axis: Constraint = {
  kind: "WORLD_AXIS_ALIGN",
  localNormal: [1, 0, 0],
  targetWorld: RIGHT,
};

describe("constraint stack", () => {
  it("an empty stack leaves the object alone and keeps 3 DOF", () => {
    const r = solve([], IDENTITY, OPTS);
    expect(r.rotation).toEqual(IDENTITY);
    expect(r.freeDof).toBe(3);
    expect(r.rejected).toBe(false);
  });

  it("entry 1 is HARD: the face normal lands exactly on its target", () => {
    const r = solve([gravity], IDENTITY, OPTS);
    const landed = qRotate(qmul(r.rotation, IDENTITY), gravity.localNormal);
    expect(dot(landed, UP)).toBeCloseTo(1, 9);
    expect(r.freeDof).toBe(1); // the twist about gravity remains
  });

  it("entry 2 is SOFT: entry 1 stays exact, entry 2 is best-fit", () => {
    const stack = push(push([], gravity, false), axis, false);
    const r = solve(stack, IDENTITY, OPTS);
    const total = qmul(r.rotation, IDENTITY);

    // ⭐ The hard one must still be exact — that is what "hard" means.
    expect(dot(qRotate(total, gravity.localNormal), UP)).toBeCloseTo(1, 9);
    // And the soft one is improved, without a promise of exactness.
    expect(dot(qRotate(total, axis.localNormal), RIGHT)).toBeGreaterThan(0.9);
    expect(r.freeDof).toBe(0);
  });

  // ⛔ The combination that had NO defined behaviour in the previous spec. It is
  // defined now, and the default is refusal rather than a silent partial solve.
  it("a third constraint is REJECTED by default, not silently applied", () => {
    const stack = [gravity, axis, { ...gravity, kind: "MATE" as const }];
    const r = solve(stack, IDENTITY, OPTS);
    expect(r.rejected).toBe(true);
    expect(r.rotation).toEqual(IDENTITY);
  });

  it("...and evicts the OLDEST when the flag is set", () => {
    const third: Constraint = { ...gravity, kind: "MATE" };
    const r = solve([gravity, axis, third], IDENTITY, { evictOnOverflow: true });
    expect(r.rejected).toBe(false);
    expect(r.applied).toHaveLength(2);
    expect(r.applied[0]).toBe(axis); // gravity, the oldest, is gone
  });

  // ⭐ Ordering IS the priority rule. Appending keeps an existing anchor older and
  // therefore hard; the user established it deliberately and a later gesture must
  // not silently break it.
  it("push appends by default and prepends under matePriorityOverAnchor", () => {
    expect(push([gravity], axis, false)).toEqual([gravity, axis]);
    expect(push([gravity], axis, true)).toEqual([axis, gravity]);
  });
});
