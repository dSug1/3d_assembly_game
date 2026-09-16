/**
 * GOLDEN VECTORS — `IN3`: how the movement mode meets the constraint stack.
 *
 * ⭐⭐ THE SPEC DOES NOT CONTAIN THIS COMPOSITION. §2 writes 2bis and 2sexte against *"an
 * empty / non-empty constraint stack"*, and the movement mode (`A16`) did not exist when it
 * was written. ⛔ So the table these vectors pin down is a **new claim**, and the two rows
 * worth arguing about are asserted directly: that `TRANSLATE` ignores the stack, and that a
 * refusal never degrades into a free rotation.
 */
import { describe, expect, it } from "vitest";
import { dragRule, isDriven, type DragRule } from "@input/drag_rule";
import type { Constraint } from "@core/constraint_stack";

/**
 * ⚠ Only the stack's LENGTH is read, so the contents are deliberately uninteresting — but
 * they are REAL `Constraint`s, not casts. ⛔ A cast would have hidden the shape drifting:
 * these carry `localNormal` and `targetWorld`, which is what §1.4's solver consumes.
 */
const gravity: Constraint = {
  kind: "GRAVITY_ALIGN",
  localNormal: [0, 1, 0],
  targetWorld: [0, -1, 0],
};
const axis: Constraint = {
  kind: "WORLD_AXIS_ALIGN",
  localNormal: [0, 0, 1],
  targetWorld: [1, 0, 0],
};
const mate: Constraint = {
  kind: "MATE",
  localNormal: [-1, 0, 0],
  targetWorld: [1, 0, 0],
  otherObjectId: "b",
};

describe("⭐ TRANSLATE ignores the stack entirely", () => {
  it("⛔⛔ AN ANCHORED OBJECT CAN STILL BE CARRIED — and that is a CLAIM, not an oversight", () => {
    // ⭐⭐ §1.4's solver consumes ROTATIONAL DOF: a swing, then a twist. Nothing in the spec
    // ties a face's alignment to a position, so an anchor says where an object POINTS, not
    // where it IS. ⚠ If a hand disagrees — if anchoring ought to pin a part in place — that
    // is a new decision, and this vector is what would go red when it is made.
    for (const stack of [[], [gravity], [gravity, axis], [gravity, axis, mate]]) {
      expect(dragRule("TRANSLATE", stack)).toBe("TRANSLATE");
    }
  });
});

describe("ROTATE reads the stack — 2bis, 2sexte, and the refusal", () => {
  it("an EMPTY stack is rule 2bis: free rotation", () => {
    expect(dragRule("ROTATE", [])).toBe("FREE_ROTATE");
  });

  it("ONE constraint is rule 2sexte: about the one remaining DOF", () => {
    // ⚠ Whatever the constraint IS — the rule counts DOF, so `MATE` needs no special case.
    for (const c of [gravity, axis, mate]) {
      expect(dragRule("ROTATE", [c])).toBe("CONSTRAINED_ROTATE");
    }
  });

  it("⛔⛔ TWO OR MORE IS REFUSED, AND MUST NOT DEGRADE INTO A FREE ROTATION", () => {
    // ⭐⭐ THE VECTOR THIS FILE EXISTS FOR. §1.4 leaves no free rotational DOF after two
    // entries, so the only honest outcomes are *nothing happens* or *a negative haptic*
    // (`IN7`). ⛔ A fall-through to 2bis would silently break the anchor the user set — which
    // is the exact defect §1.4's eviction clause was written to stop, arriving by a
    // different door.
    expect(dragRule("ROTATE", [gravity, axis])).toBe("ROTATE_REFUSED");
    expect(dragRule("ROTATE", [gravity, axis, mate])).toBe("ROTATE_REFUSED");
  });

  it("⭐ the four outcomes are distinct — a boolean could not carry this", () => {
    const seen = new Set<DragRule>([
      dragRule("TRANSLATE", []),
      dragRule("ROTATE", []),
      dragRule("ROTATE", [gravity]),
      dragRule("ROTATE", [gravity, axis]),
    ]);
    expect(seen.size).toBe(4);
  });
});

describe("⛔ isDriven — an UNWIRED rule must not look like an inert one", () => {
  it("translate and free rotation are driven today", () => {
    expect(isDriven("TRANSLATE")).toBe(true);
    expect(isDriven("FREE_ROTATE")).toBe(true);
  });

  it("⭐⭐ CONSTRAINED_ROTATE is recognised but NOT yet driven", () => {
    // ⚠ `anchor_rotate.ts` exists with 25 vectors and is not wired — blocked on a decision
    // `A12` reopened by moving roll to the second touchpoint. ⛔ So the honest behaviour is
    // *nothing happens, and the readout names the rule that would have run*. Without this
    // distinction the HUD would say `CONSTRAINED_ROTATE` while the object sat still, and a
    // device pass would read that as a defect in 2sexte rather than as work not yet done.
    expect(isDriven("CONSTRAINED_ROTATE")).toBe(false);
  });

  it("and a refusal is never 'driven'", () => {
    expect(isDriven("ROTATE_REFUSED")).toBe(false);
  });
});
