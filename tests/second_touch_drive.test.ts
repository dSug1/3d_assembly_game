/**
 * GOLDEN VECTORS — **what a second touch drives** (`D51`'s both-axes drive, kept for an aligned Follower; the pinned pair itself is deleted, `D109`).
 *
 * ⛔⛔ The rule's whole point is a DIFFERENCE from `A16`'s one-axis second finger, so the
 * vectors assert the difference directly rather than the new behaviour alone: a vector that
 * only showed "both axes apply" would pass just as well if the other rule had been changed too.
 */
import { describe, expect, it } from "vitest";
import { bothAxesSecondDrive, secondTouchDrive } from "@input/second_touch_drive";
import { secondFingerDrive } from "@input/depth_translate";
import type { MotionState } from "@input/motion";

const MOVING: MotionState = "MOVING";
const STILL: MotionState = "STATIONARY";

describe("⭐⭐⭐ bothAxesSecondDrive — BOTH axes, which is the whole difference", () => {
  const axes = (x: MotionState, y: MotionState) => ({ x, y });
  const step = { dx: 7, dy: -11 };

  it("⭐⭐⭐ a DIAGONAL drag gives roll AND depth together", () => {
    expect(bothAxesSecondDrive(axes(MOVING, MOVING), step)).toEqual({
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
    const both = bothAxesSecondDrive(axes(MOVING, MOVING), step);
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
    expect(bothAxesSecondDrive(axes(MOVING, STILL), step)).toEqual({ rollDxPx: 7, depthDyPx: 0 });
    expect(bothAxesSecondDrive(axes(STILL, MOVING), step)).toEqual({ rollDxPx: 0, depthDyPx: -11 });
  });

  it("⛔ a resting finger drives nothing on either axis", () => {
    expect(bothAxesSecondDrive(axes(STILL, STILL), step)).toEqual({ rollDxPx: 0, depthDyPx: 0 });
  });

  it("⚠ it does NOT read the movement mode — unlike the rule it contrasts with", () => {
    // ⭐ There is no mode parameter at all, which is the structural form of *both axes always*.
    // ⛔ A mode-dependent version would reintroduce the tap-to-switch this rule exists to avoid.
    expect(bothAxesSecondDrive.length).toBe(2);
  });
});

describe("⛔⛔⛔ `D59` — WHEN DOES THE SECOND TOUCH GIVE BOTH AXES?", () => {
  // ⛔⛔ THE OWNER, 2026-09-19:
  //
  // > *"whatever translation mode, when an object is aligned as follower the second touch shall
  // > control the depth and the roll (as this is currently the case when the second touch hit
  // > the Pioneer object)"*
  //
  // ⭐⭐ THE RULE MOVED FROM *WHERE THE FINGER LANDED* TO *WHAT THE BODY IS*. `D51` gave both
  // axes to a finger on the Pioneer; the owner generalised the reason — an aligned Follower has
  // **one rotational DOF left**, so there is nothing for a mode to choose between.

  it("⭐⭐⭐ OUTSIDE any object + an ALIGNED FOLLOWER → BOTH — the owner's change", () => {
    expect(secondTouchDrive("OUTSIDE", true)).toBe("BOTH");
  });

  it("⛔⛔ OUTSIDE + a FREE body → the mode still picks — `A16` survives where it earns its keep", () => {
    // ⚠ A free body has three rotational DOF, so roll-vs-depth is a real choice and `A16`'s
    // split is not redundant there. ⛔ This is also where `D58`'s `A16` collision SURVIVES —
    // the channel still alternates as the press toggles the mode. Named, because a device pass
    // must judge it and a green suite cannot.
    expect(secondTouchDrive("OUTSIDE", false)).toBe("MODE_PICKS");
  });

  it("⛔⛔ on the SAME object → the mode picks for a FREE body; an ALIGNED one drives both (`D108`)", () => {
    // ⛔⛔ REVERSED 2026-09-27: `D108` makes an aligned body mode-less, so there is no mode left to
    // pick. ⚠ The cost this vector used to guard is now accepted: a finger on the same body moving
    // DIAGONALLY drives gravity AND spin together, where the mode used to keep one.
    expect(secondTouchDrive("SAME_OBJECT", true)).toBe("BOTH");
    expect(secondTouchDrive("SAME_OBJECT", false)).toBe("MODE_PICKS");
  });
});
