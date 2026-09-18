/**
 * GOLDEN VECTORS — the alignment snaps in flight.
 *
 * ⛔⛔⛔ **THE ONE THAT CARRIES THIS FILE IS `two bodies can be snapping at once`.** Until
 * 2026-09-17 `render/scene.ts` held a SINGLE global slot, so a second alignment anywhere in the
 * scene abandoned the first body mid-arc — with its constraint, its marker and its outline all
 * still claiming it was aligned. ⚠ No vector could see it, because the rule lived in a
 * 3600-line frame handler and had no seam to test through.
 */
import { describe, expect, it } from "vitest";
import { AlignSnaps } from "../src/input/align_snap";
import { IDENTITY, qAngle, qFromAxisAngle, qmul, qconj, type Quat } from "../src/core/vec";

/** ⚠ Linear, so the fixture arithmetic is exact and a failure blames the rule, not the ease. */
const linear = (u: number): number => u;

const X90 = qFromAxisAngle([1, 0, 0], Math.PI / 2);
const Y90 = qFromAxisAngle([0, 1, 0], Math.PI / 2);
const Z90 = qFromAxisAngle([0, 0, 1], Math.PI / 2);

/** The angle between two orientations, in degrees. */
const apart = (a: Quat, b: Quat): number => (qAngle(qmul(a, qconj(b))) * 180) / Math.PI;

describe("⛔⛔⛔ TWO BODIES CAN BE SNAPPING AT ONCE — the single-slot defect", () => {
  it("⛔⛔ a second body's snap does not abandon the first one mid-arc", () => {
    // ⭐⭐ THE DEFECT, AS A SEQUENCE A HAND MAKES: align A, and 40 ms later — well inside the
    // 129 ms snap — align B. ⚠ Two-handed play is the owner's own model for the fine approach,
    // so this is the intended posture, not an exotic case.
    const snaps = new AlignSnaps<string>();
    snaps.start("a", IDENTITY, X90, 0);
    snaps.start("b", IDENTITY, Y90, 40);
    expect(snaps.size).toBe(2);

    // ⭐ Both advance, independently, on their own clocks.
    const mid = snaps.advance(50, 100, linear);
    expect(mid.length).toBe(2);
    expect(mid.every((s) => !s.done)).toBe(true);

    // ⛔ And BOTH land exactly on their own targets.
    const landA = snaps.advance(101, 100, linear);
    expect(landA.find((s) => s.id === "a")?.done).toBe(true);
    expect(landA.find((s) => s.id === "a")?.orientation).toEqual(X90);
    const landB = snaps.advance(141, 100, linear);
    expect(landB.find((s) => s.id === "b")?.done).toBe(true);
    expect(landB.find((s) => s.id === "b")?.orientation).toEqual(Y90);
    expect(snaps.size).toBe(0);
  });

  it("⭐ the SAME body's new alignment replaces its own snap — that is not the defect", () => {
    // ⚠ A body holds one alignment, so a new one supersedes it. ⛔ Starting from the PARTIAL
    // pose is what makes the change continuous rather than a jump back to the press.
    const snaps = new AlignSnaps<string>();
    snaps.start("a", IDENTITY, X90, 0);
    const partial = snaps.advance(50, 100, linear)[0]!.orientation;
    snaps.start("a", partial, Y90, 50);
    expect(snaps.size).toBe(1);
    const step = snaps.advance(50, 100, linear)[0]!;
    expect(apart(step.orientation, partial)).toBeCloseTo(0, 9);
  });
});

describe("⭐⭐ landing, cancelling and the clock", () => {
  it("⛔ lands EXACTLY on the target, never one frame short of it", () => {
    const snaps = new AlignSnaps<string>();
    snaps.start("a", IDENTITY, X90, 0);
    const step = snaps.advance(100, 100, linear)[0]!;
    expect(step.done).toBe(true);
    expect(step.orientation).toEqual(X90);
    // ⚠ And it is forgotten, so it cannot be advanced a second time.
    expect(snaps.advance(200, 100, linear)).toEqual([]);
  });

  it("⭐ a duration of ZERO means no animation at all — the slider's own meaning", () => {
    const snaps = new AlignSnaps<string>();
    snaps.start("a", IDENTITY, X90, 0);
    const step = snaps.advance(0, 0, linear)[0]!;
    expect(step.done).toBe(true);
    expect(step.orientation).toEqual(X90);
  });

  it("⛔⛔ CANCEL drops it where it is — a release must not finish the turn", () => {
    // ⭐ The owner's rule: releasing an alignment *"does not rotate the first object"*.
    const snaps = new AlignSnaps<string>();
    snaps.start("a", IDENTITY, X90, 0);
    snaps.advance(50, 100, linear);
    snaps.cancel("a");
    expect(snaps.has("a")).toBe(false);
    expect(snaps.advance(200, 100, linear)).toEqual([]);
  });

  it("⛔ cancelling one body does not touch another's snap", () => {
    // ⚠ The single-slot version could not tell these apart: `cancelAlignAnim` compared the one
    // slot's id, so a release on the WRONG body was a no-op and a release on the right one
    // cancelled whatever happened to be in flight.
    const snaps = new AlignSnaps<string>();
    snaps.start("a", IDENTITY, X90, 0);
    snaps.start("b", IDENTITY, Y90, 0);
    snaps.cancel("a");
    expect(snaps.has("a")).toBe(false);
    expect(snaps.has("b")).toBe(true);
  });

  it("⛔ a body that has gone away takes its snap with it", () => {
    const snaps = new AlignSnaps<string>();
    snaps.start("a", IDENTITY, X90, 0);
    expect(snaps.advance(50, 100, linear, () => false)).toEqual([]);
    expect(snaps.size).toBe(0);
  });

  it("⚠ a clock that runs BACKWARDS holds the body at its start", () => {
    // ⛔ A negative `u` must not fling the object past `from`. `qSlerp` clamps, and this is
    // what says the clamp is load-bearing rather than decorative.
    const snaps = new AlignSnaps<string>();
    snaps.start("a", IDENTITY, X90, 100);
    const step = snaps.advance(0, 100, linear)[0]!;
    expect(apart(step.orientation, IDENTITY)).toBeCloseTo(0, 9);
  });
});

describe("⭐⭐⭐ RIDE ALONG — a gesture during the snap moves the arc, not the progress", () => {
  it("⛔⛔ the remaining arc is UNCHANGED in length, and both ends have turned", () => {
    // ⭐⭐ THE PROPERTY, STATED AS A MEASUREMENT rather than as a shape: `slerp` commutes with a
    // left-multiplied world rotation, so riding must not change how far along the arc the body
    // is — only where the arc points. ⚠ `METHOD`: *a composition is a thing to MEASURE.*
    const snaps = new AlignSnaps<string>();
    snaps.start("a", IDENTITY, X90, 0);
    const before = snaps.advance(30, 100, linear)[0]!.orientation;
    const remainingBefore = apart(before, X90);

    snaps.ride("a", Z90);
    const after = snaps.advance(30, 100, linear)[0]!.orientation;

    // ⭐ The body has turned by exactly the ridden rotation, and no more.
    expect(apart(after, qmul(Z90, before))).toBeCloseTo(0, 9);
    // ⭐ And its remaining journey is the same length as it was.
    expect(apart(after, qmul(Z90, X90))).toBeCloseTo(remainingBefore, 9);
  });

  it("⛔⛔ and it LANDS on the ridden target, not on the original one", () => {
    const snaps = new AlignSnaps<string>();
    snaps.start("a", IDENTITY, X90, 0);
    snaps.advance(30, 100, linear);
    snaps.ride("a", Z90);
    const landed = snaps.advance(100, 100, linear)[0]!;
    expect(landed.done).toBe(true);
    expect(apart(landed.orientation, qmul(Z90, X90))).toBeCloseTo(0, 9);
    expect(apart(landed.orientation, X90)).toBeGreaterThan(1);
  });

  it("⛔ riding composes on the LEFT — the opposite order is a different rotation", () => {
    // ⭐ The counter-example, which is what makes the vector above able to fail: for these two
    // rotations the two orders disagree, so an implementation that composed on the right would
    // land somewhere else entirely. ⚠ At the identity they agree, which is why the wrong order
    // has no symptom until something is already turned.
    expect(apart(qmul(Z90, X90), qmul(X90, Z90))).toBeGreaterThan(10);
  });

  it("⚠ riding a body with no snap in flight does nothing — it does not START one", () => {
    const snaps = new AlignSnaps<string>();
    snaps.ride("a", Z90);
    expect(snaps.size).toBe(0);
    expect(snaps.has("a")).toBe(false);
  });

  it("⭐ two rides compose in the order they were applied", () => {
    const snaps = new AlignSnaps<string>();
    snaps.start("a", IDENTITY, X90, 0);
    snaps.ride("a", Z90);
    snaps.ride("a", Y90);
    const landed = snaps.advance(100, 100, linear)[0]!;
    expect(apart(landed.orientation, qmul(Y90, qmul(Z90, X90)))).toBeCloseTo(0, 9);
  });
});
