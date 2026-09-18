/**
 * GOLDEN VECTORS — **`D51`: the pinned Pioneer.**
 *
 * ⛔⛔ The rule's whole point is a DIFFERENCE from `A16`'s one-axis second finger, so the
 * vectors assert the difference directly rather than the new behaviour alone: a vector that
 * only showed "both axes apply" would pass just as well if the other rule had been changed too.
 */
import { describe, expect, it } from "vitest";
import { pinnedPair, pinnedSecondDrive } from "@input/pinned_pioneer";
import { secondFingerDrive } from "@input/depth_translate";
import type { MotionState } from "@input/motion";

const MOVING: MotionState = "MOVING";
const STILL: MotionState = "STATIONARY";

describe("⭐⭐ pinnedPair — exactly two held bodies, and related", () => {
  const aligned = (map: Record<string, string>) => (id: string) => map[id] ?? null;

  it("⭐ finds the pair in either press order", () => {
    const pioneerFor = aligned({ part: "plate" });
    expect(pinnedPair(["part", "plate"], pioneerFor)).toEqual({
      follower: "part",
      pioneer: "plate",
    });
    // ⚠ Press order says nothing about who is the Pioneer — the hand chooses which body to
    // align, not which to grab first.
    expect(pinnedPair(["plate", "part"], pioneerFor)).toEqual({
      follower: "part",
      pioneer: "plate",
    });
  });

  it("⛔ two UNRELATED held bodies are not a pinned pair", () => {
    // ⚠ This is the ordinary two-holder case and it must stay untouched: both translate.
    expect(pinnedPair(["a", "b"], aligned({ a: "c" }))).toBeNull();
    expect(pinnedPair(["a", "b"], aligned({}))).toBeNull();
  });

  it("⛔ one body, or three, is not this configuration", () => {
    const pioneerFor = aligned({ part: "plate" });
    expect(pinnedPair(["part"], pioneerFor)).toBeNull();
    // ⚠ With three held, WHICH pair is *the* pair has no trustworthy answer — `scene.ts`
    // refuses an alignment for the same reason when two other bodies are held.
    expect(pinnedPair(["part", "plate", "other"], pioneerFor)).toBeNull();
  });

  it("⛔ a MUTUAL pair is refused rather than resolved by press order", () => {
    // ⚠ `A18`'s `wouldCycle` makes this unrepresentable — and this module does not rely on a
    // neighbour's invariant, because a guard that assumes one fails the day the neighbour
    // changes. ⭐ Refusing is deterministic; picking would make behaviour depend on press order.
    expect(pinnedPair(["a", "b"], aligned({ a: "b", b: "a" }))).toBeNull();
  });

  it("⚠ the same body twice is not two bodies", () => {
    expect(pinnedPair(["a", "a"], aligned({ a: "a" }))).toBeNull();
  });
});

describe("⭐⭐⭐ pinnedSecondDrive — BOTH axes, which is the whole difference", () => {
  const axes = (x: MotionState, y: MotionState) => ({ x, y });
  const step = { dx: 7, dy: -11 };

  it("⭐⭐⭐ a DIAGONAL drag gives roll AND depth together", () => {
    expect(pinnedSecondDrive(axes(MOVING, MOVING), step)).toEqual({
      rollDxPx: 7,
      depthDyPx: -11,
    });
  });

  it("⛔⛔ AND THE OTHER RULE STILL GIVES EXACTLY ONE — the contrast, asserted", () => {
    // ⭐⭐⭐ THE VECTOR THIS FILE EXISTS FOR. The owner named the difference himself: *"this is
    // different from when there is a single touchpoint on follower object, the second touchpoint
    // cannot control both the depth and the roll."*
    // ⚠ Asserting only the new rule would pass just as well if someone had "tidied" `A16` into
    // agreeing with it — which would silently delete a decision a hand made twice.
    const both = pinnedSecondDrive(axes(MOVING, MOVING), step);
    const rotate = secondFingerDrive(axes(MOVING, MOVING), step, "ROTATE");
    const translate = secondFingerDrive(axes(MOVING, MOVING), step, "TRANSLATE");
    expect(rotate).toEqual({ rollDxPx: 7, depthDyPx: 0 });
    expect(translate).toEqual({ rollDxPx: 0, depthDyPx: -11 });
    // One axis each, against two here — on the very same input.
    expect(both.rollDxPx !== 0 && both.depthDyPx !== 0).toBe(true);
  });

  it("⭐ each axis is gated on ITS OWN motion state, not on the finger as a whole", () => {
    // ⛔ `A11`'s per-axis deadband is what keeps the two corridors independent — the same thing
    // `A12` relied on the last time two axes applied at once.
    expect(pinnedSecondDrive(axes(MOVING, STILL), step)).toEqual({ rollDxPx: 7, depthDyPx: 0 });
    expect(pinnedSecondDrive(axes(STILL, MOVING), step)).toEqual({ rollDxPx: 0, depthDyPx: -11 });
  });

  it("⛔ a resting finger drives nothing on either axis", () => {
    expect(pinnedSecondDrive(axes(STILL, STILL), step)).toEqual({ rollDxPx: 0, depthDyPx: 0 });
  });

  it("⚠ it does NOT read the movement mode — unlike the rule it contrasts with", () => {
    // ⭐ There is no mode parameter at all, which is the structural form of *both axes always*.
    // ⛔ A mode-dependent version would reintroduce the tap-to-switch this rule exists to avoid.
    expect(pinnedSecondDrive.length).toBe(2);
  });
});
