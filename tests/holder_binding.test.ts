/**
 * GOLDEN VECTORS — `A15`, the holder's binding.
 *
 * ⭐ Two claims are worth more than the rest and are asserted directly:
 * 1. **both** miss cases orphan — nothing under the finger, and a DIFFERENT object;
 * 2. a `BOUND` holder is **untouched by every branch**, so the amendment is invisible to
 *    the gestures that already work.
 */
import { describe, expect, it } from "vitest";
import {
  bindingAfterSecondRelease,
  orphanAction,
  type InputEvent,
} from "@input/holder_binding";

// ⚠ Opaque handles, as the renderer passes meshes. Distinct OBJECTS, not equal strings:
// the rule is identity, and two boxes of the same name must not read as the same box.
const A = { id: "objectA" };
const B = { id: "objectB" };
const EVENTS: readonly InputEvent[] = ["MOVE", "PRESS", "RELEASE"];

describe("bindingAfterSecondRelease — the raycast at the lift", () => {
  it("the same object under the finger stays BOUND", () => {
    expect(bindingAfterSecondRelease(A, A)).toBe("BOUND");
  });

  it("⛔ nothing under the finger ORPHANS — depth pushed it out from under the holder", () => {
    expect(bindingAfterSecondRelease(A, null)).toBe("ORPHANED");
  });

  it("⛔ ANOTHER object under the finger ORPHANS, and it is not a lesser miss", () => {
    // ⭐ The owner named the two together. This is the case where carrying on with the old
    // selection is most obviously wrong: the finger is visibly on something else.
    expect(bindingAfterSecondRelease(A, B)).toBe("ORPHANED");
  });

  it("identity, not equality — two handles that merely look alike are different objects", () => {
    expect(bindingAfterSecondRelease({ id: "objectA" }, { id: "objectA" })).toBe("ORPHANED");
  });
});

describe("orphanAction — the consequence is DEFERRED", () => {
  it("⭐ a BOUND holder is untouched by every event", () => {
    // ⛔ THE REGRESSION GUARD FOR EVERY GESTURE THAT ALREADY WORKS. If this row ever goes
    // red, A15 has started interfering with rule 6, roll, depth and A14's grace.
    for (const e of EVENTS) expect(orphanAction("BOUND", e)).toBe("KEEP");
  });

  it("a delta position collects the orphan and re-resolves", () => {
    expect(orphanAction("ORPHANED", "MOVE")).toBe("UNSELECT_AND_RERESOLVE");
  });

  it("⭐ so does a NEW PRESS — the owner's second example", () => {
    // *"rotation of the new object if the second touchpoint is pressed on a new object as
    // the new event"*. ⚠ It also means A14's lift-and-replace does NOT keep a dead
    // binding alive: the grace protects a gesture, and there is no gesture left when the
    // finger is not on its object.
    expect(orphanAction("ORPHANED", "PRESS")).toBe("UNSELECT_AND_RERESOLVE");
  });

  it("⛔ the holder lifting drops it WITHOUT a release verdict", () => {
    // ⚠ The exclusion is the point: a flick-to-align belongs to a finger that was still on
    // its object. Running one here would align an object the user stopped touching.
    expect(orphanAction("ORPHANED", "RELEASE")).toBe("DROP_WITHOUT_VERDICT");
  });

  it("⛔ nothing is collected AT THE LIFT itself — there is no such action", () => {
    // ⭐⭐ THE DEFERRAL, ASSERTED AS AN ABSENCE. The only inputs that produce an action are
    // the three events; the binding's evaluation cannot itself change anything, so an
    // implementation that deselected at the release has no way to express it here.
    const actions = EVENTS.map((e) => orphanAction("ORPHANED", e));
    expect(actions.every((a) => a !== "KEEP")).toBe(true);
    expect(new Set(actions).size).toBe(2);
  });
});
