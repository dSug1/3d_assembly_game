import { describe, expect, it } from "vitest";
import {
  type Constraint,
  bestTwist,
  hasAlignment,
  push,
  rotationChannel,
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

/**
 * ⭐⭐⭐ **WHAT A DRAG MAY DO TO A BODY'S ROTATION — asked of the STACK, not of its LENGTH.**
 *
 * ⛔⛔⛔ **THIS REPLACES THREE COPIES OF `stack.length === 1` IN `render/scene.ts`**, found by
 * audit 2026-09-17: the one-finger twist, the second finger's roll, and the `FOLLOW` retarget.
 * Each read *"is there exactly one constraint?"*, meant *"is this body aligned?"*, and fell
 * through to **FREE ROTATION** for every other count.
 *
 * ⚠⚠ **IT IS UNREACHABLE TODAY AND ARMS ITSELF THE MOMENT `3D2` LANDS.** The cap of one makes
 * a two-entry stack impossible right now — and a mate is the second entry. So the first seated
 * body would rotate **freely**, breaking its mate and its alignment at once, with every vector
 * in this suite still green. ⛔ `QUEUE.md` already names it: *"a live defect arms itself the
 * moment a mate lands."*
 *
 * ⭐⭐ **AND THE THIRD VERDICT IS THE POINT.** The honest answer for a mated body is not
 * *free* and not *twist* — it is **REFUSED**, because what a drag should do to a seated body is
 * `3D2`/`3D3`'s decision and has not been made. ⛔ `LESSONS_CARRIED` §6: *a degenerate input
 * returns null, never a default.* A count test silently chose the most destructive default
 * available.
 */
describe("⛔⛔ rotationChannel — a COUNT is not a question about the stack", () => {
  const mate: Constraint = {
    kind: "MATE",
    localNormal: [0, 0, 1],
    targetWorld: UP,
    otherObjectId: "other",
  };

  it("⭐ an EMPTY stack rotates freely — 2bis's own precondition", () => {
    expect(rotationChannel([]).kind).toBe("FREE");
  });

  it("⭐ ONE alignment gives the twist, about that alignment's world target", () => {
    const ch = rotationChannel([gravity]);
    expect(ch.kind).toBe("TWIST");
    if (ch.kind !== "TWIST") throw new Error("unreachable");
    expect(ch.axis).toEqual(UP);
  });

  it("⭐ and a FACE_ALIGN is an alignment too — the kind is not what decides", () => {
    const face: Constraint = { kind: "FACE_ALIGN", localNormal: [1, 0, 0], targetWorld: RIGHT };
    const ch = rotationChannel([face]);
    expect(ch.kind).toBe("TWIST");
    if (ch.kind !== "TWIST") throw new Error("unreachable");
    expect(ch.axis).toEqual(RIGHT);
  });

  it("⛔⛔ A MATE ALONE IS REFUSED, NOT FREE — the defect `3D2` would have armed", () => {
    // ⚠ THE ONE THAT MATTERS. `length === 1` answered TRUE here and twisted about the MATE's
    // axis; and a mate plus an alignment answered FALSE and rotated the body FREELY, breaking
    // both. ⭐ Neither is a decision anyone made.
    const ch = rotationChannel([mate]);
    expect(ch.kind).toBe("REFUSED");
  });

  it("⛔⛔ a MATE plus an alignment is REFUSED — it must not fall through to FREE", () => {
    expect(rotationChannel([mate, gravity]).kind).toBe("REFUSED");
    expect(rotationChannel([gravity, mate]).kind).toBe("REFUSED");
  });

  it("⛔ two alignments are refused as well — the cap says this cannot happen", () => {
    // ⚠ Reaching here means the cap has been broken somewhere. ⭐ Refusing makes that visible
    // instead of quietly picking one of the two axes.
    expect(rotationChannel([gravity, axis]).kind).toBe("REFUSED");
  });

  it("⛔ a REFUSAL carries a reason, because the HUD has to say why nothing moved", () => {
    const ch = rotationChannel([mate]);
    if (ch.kind !== "REFUSED") throw new Error("unreachable");
    expect(ch.why.length).toBeGreaterThan(0);
    expect(ch.why).toMatch(/mate/i);
  });

  it("⛔ a degenerate target axis is refused rather than twisted about nothing", () => {
    // ⚠ `shortestArc` and `bestTwist` both return IDENTITY for a zero axis, so a twist would
    // silently do nothing at all — the readout-that-lies shape.
    const zero: Constraint = { kind: "FACE_ALIGN", localNormal: [1, 0, 0], targetWorld: [0, 0, 0] };
    expect(rotationChannel([zero]).kind).toBe("REFUSED");
  });
});

/**
 * ⭐⭐ **IS THIS BODY STILL ALIGNED? — the question the highlight and the link index ask.**
 *
 * ⛔ `render/scene.ts` asked `constraints.length > 0`, which counts a **MATE** as an alignment.
 * ⚠ A mated body would then keep its follower highlight and its entry in the link index for
 * ever, because `evict` deliberately never removes a mate.
 */
describe("⛔ hasAlignment — a MATE is not an alignment", () => {
  const mate: Constraint = {
    kind: "MATE",
    localNormal: [0, 0, 1],
    targetWorld: UP,
    otherObjectId: "other",
  };

  it("⭐ an alignment counts", () => {
    expect(hasAlignment([gravity])).toBe(true);
    expect(hasAlignment([{ kind: "FACE_ALIGN", localNormal: UP, targetWorld: UP }])).toBe(true);
  });

  it("⛔⛔ a MATE does not — it survives an eviction, so it would pin the marker for ever", () => {
    expect(hasAlignment([mate])).toBe(false);
  });

  it("⭐ and a mate alongside an alignment still counts, because the alignment is there", () => {
    expect(hasAlignment([mate, gravity])).toBe(true);
  });

  it("⭐ an empty stack is not aligned", () => {
    expect(hasAlignment([])).toBe(false);
  });
});

/**
 * ⭐⭐⭐ **ENTRY 2's TWIST — and the vector that used to make it untestable.**
 *
 * ⛔⛔⛔ **`bestTwist` SURVIVED BEING REPLACED BY `IDENTITY`, AND SURVIVED A SIGN FLIP.** Both
 * mutations left all 716 vectors green (audit, 2026-09-17). ⚠ The single vector that exercised
 * entry 2 — *"entry 2 is SOFT"* — drives gravity `+z→+y` and then the axis `+x→+x` from
 * IDENTITY, and the required twist there is **exactly 0°**. ⭐ So any twist at all passed it,
 * including no twist and a backwards one.
 *
 * ⭐⭐ **THE SHAPE IS IDEALISED FIXTURES — mistake shape 3**, and it is the same trap as the
 * perfect circles that let the roll vanish from the deployed page with every vector green.
 * ⚠ A fixture chosen for how easy it is to reason about is usually chosen from the set where
 * the quantity under test is zero.
 *
 * ⛔ The counter-example is written out below: a case where the correct twist is a QUARTER
 * TURN with a definite direction, so identity, the opposite sign and any other angle all fail.
 */
describe("⛔⛔ bestTwist — a NON-ZERO twist, with a direction", () => {
  it("⭐⭐ it actually rotates `from` onto `to` about the axis", () => {
    // ⚠ Both vectors are already perpendicular to the axis, so the twist can align them
    // EXACTLY — which makes the assertion an equality rather than an improvement.
    const q = bestTwist([1, 0, 0], [0, 0, 1], UP);
    const landed = qRotate(q, [1, 0, 0]);
    expect(landed[0]).toBeCloseTo(0, 9);
    expect(landed[1]).toBeCloseTo(0, 9);
    expect(landed[2]).toBeCloseTo(1, 9);
  });

  it("⛔⛔ and the DIRECTION is pinned — a sign flip lands 180° away", () => {
    // ⭐ THE COUNTER-EXAMPLE, STATED: the wrong sign sends `+x` to `−z`, which is as far from
    // the target as it is possible to be while still lying in the plane. ⚠ Nothing about the
    // magnitude would notice.
    const q = bestTwist([1, 0, 0], [0, 0, 1], UP);
    expect(qRotate(q, [1, 0, 0])[2]).toBeCloseTo(1, 9);
    const back = bestTwist([0, 0, 1], [1, 0, 0], UP);
    expect(qRotate(back, [0, 0, 1])[0]).toBeCloseTo(1, 9);
    // ⛔ The two are inverses, so composing them returns the vector to where it started.
    const roundTrip = qRotate(back, qRotate(q, [1, 0, 0]));
    expect(roundTrip[0]).toBeCloseTo(1, 9);
    expect(roundTrip[2]).toBeCloseTo(0, 9);
  });

  it("⭐ it twists ONLY about the axis — the component along it is untouched", () => {
    // ⚠ This is what makes the twist "1 DOF": a vector tilted out of the plane keeps exactly
    // its height, whatever the twist does to the rest of it.
    const from: Vec3 = [1, 0, 0];
    const to: Vec3 = [0, 0, 1];
    const tilted: Vec3 = [0.6, 0.8, 0];
    const q = bestTwist(from, to, UP);
    expect(qRotate(q, tilted)[1]).toBeCloseTo(0.8, 9);
  });

  it("⛔ a vector PARALLEL to the axis suppresses rather than guesses", () => {
    // ⚠ Its projection collapses, so no twist can change anything and the honest answer is
    // identity. ⭐ `LESSONS_CARRIED` §6: suppress, do not substitute.
    expect(bestTwist(UP, [0, 0, 1], UP)).toEqual(IDENTITY);
    expect(bestTwist([1, 0, 0], UP, UP)).toEqual(IDENTITY);
  });

  it("⛔⛔ and `solve` USES it — entry 2 measurably improves, from a case that needs a turn", () => {
    // ⭐⭐ The composition, measured. ⚠ The old entry-2 vector could not see whether `solve`
    // called `bestTwist` at all; this one starts entry 2 a quarter turn away from its target,
    // so a missing or reversed twist is a large, signed error rather than a rounding one.
    const g: Constraint = { kind: "GRAVITY_ALIGN", localNormal: [0, 1, 0], targetWorld: UP };
    const second: Constraint = { kind: "WORLD_AXIS_ALIGN", localNormal: [1, 0, 0], targetWorld: [0, 0, 1] };
    const r = solve([g, second], IDENTITY, OPTS);
    const total = qmul(r.rotation, IDENTITY);
    // ⛔ The hard one is still exact.
    expect(dot(qRotate(total, g.localNormal), UP)).toBeCloseTo(1, 9);
    // ⭐ And the soft one is now EXACT too, because both are perpendicular to the axis.
    expect(dot(qRotate(total, second.localNormal), [0, 0, 1])).toBeCloseTo(1, 9);
  });
});

/**
 * ⭐⭐⭐ **`solve` MUST NOT REPORT A STATE IT IS NOT IN.**
 *
 * ⛔⛔ Two results contradicted themselves in their own fields until 2026-09-17 (audit). Neither
 * is reachable from a gesture today, and both are the kind of thing a later caller believes:
 * the result type is the only description of what happened.
 */
describe("⛔⛔ a refusal says REFUSED in every field, not just one", () => {
  it("⛔⛔ an overflow refusal reports NOTHING applied and the DOF still free", () => {
    // ⚠ It used to return `applied: stack.slice(0, 2)` beside `rotation: IDENTITY` and
    // `freeDof: 0` — *two constraints are in force and the body is fully pinned* — while the
    // rotation it handed back was the identity and nothing had been honoured at all.
    // ⭐ `RND1` will render the stack from `applied`; it would have drawn two glyphs for
    // constraints the solver had just refused.
    const stack = [gravity, axis, { ...gravity, kind: "MATE" as const }];
    const r = solve(stack, IDENTITY, OPTS);
    expect(r.rejected).toBe(true);
    expect(r.rotation).toEqual(IDENTITY);
    expect(r.applied, "nothing was applied, so nothing is in force").toEqual([]);
    expect(r.freeDof, "and no freedom was taken").toBe(3);
  });

  it("⛔⛔ a DEGENERATE entry 1 is refused rather than reported as satisfied", () => {
    // ⭐⭐ THE SUBTLE ONE. `shortestArc` returns IDENTITY for a zero-length direction, which is
    // correct — there is no arc. ⚠ `solve` then said `rejected: false, freeDof: 1`, meaning
    // *two DOF consumed, the face is on its target* — a confident, wrong answer in three fields.
    // ⛔ `LESSONS_CARRIED` §6: a degenerate input returns a refusal, never a plausible default.
    const zeroTarget: Constraint = {
      kind: "FACE_ALIGN",
      localNormal: [0, 1, 0],
      targetWorld: [0, 0, 0],
    };
    const zeroNormal: Constraint = {
      kind: "FACE_ALIGN",
      localNormal: [0, 0, 0],
      targetWorld: UP,
    };
    for (const c of [zeroTarget, zeroNormal]) {
      const r = solve([c], IDENTITY, OPTS);
      expect(r.rejected, `${JSON.stringify(c.targetWorld)} must refuse`).toBe(true);
      expect(r.rotation).toEqual(IDENTITY);
      expect(r.applied).toEqual([]);
      expect(r.freeDof).toBe(3);
    }
  });

  it("⭐ and an ordinary single alignment is still accepted, unchanged", () => {
    // ⚠ The guard must not make the normal path refuse: this is the vector that says the two
    // refusals above are narrow rather than a blanket.
    const r = solve([gravity], IDENTITY, OPTS);
    expect(r.rejected).toBe(false);
    expect(r.applied).toEqual([gravity]);
    expect(r.freeDof).toBe(1);
  });
});
