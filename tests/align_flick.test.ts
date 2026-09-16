/**
 * GOLDEN VECTORS — `IN3` rules 2ter / 2quater: a flick pushes an alignment.
 *
 * ⭐⭐ TWO CLAIMS CARRY THIS FILE, and both are decisions rather than arithmetic:
 * 1. ⛔ **it fires only while the mode is `ROTATE`** (owner, 2026-09-16) — so a brisk
 *    translate cannot anchor a part;
 * 2. ⭐ **the target is a WORLD vector resolved now**, never a stored screen axis — §1.4 is
 *    explicit that storing the screen axis let a camera orbit silently redefine the
 *    constraint.
 */
import { describe, expect, it } from "vitest";
import { alignFromFlick } from "@input/align_flick";
import type { Flick } from "@input/flick";
import type { Vec3 } from "@core/vec";

const UP: Vec3 = [0, 1, 0];
/** ⚠ Deliberately NOT a world basis vector: a screen axis resolved mid-orbit. */
const RIGHT: Vec3 = [0.6, 0, -0.8];
const FACE: Vec3 = [0, 0, 1];

/**
 * ⚠ Component-wise, because negating a vector produces SIGNED ZEROS (`scale(up, -1)` is
 * `[-0, -1, -0]`) and `toEqual` treats `-0` and `+0` as different. ⛔ The product is right:
 * for a DIRECTION, −0 and +0 are the same number and behave identically in every downstream
 * arithmetic. ⭐ Mistake shape 5 — my fixture was strict about a distinction the quantity
 * does not have. Loosened deliberately, and said out loud rather than quietly.
 */
const expectVec = (got: Vec3, want: Vec3) => {
  got.forEach((v, i) => expect(v).toBeCloseTo(want[i]!, 12));
};

const flick = (axis: "VERTICAL" | "HORIZONTAL", sign: -1 | 1): Flick => ({
  axis,
  sign,
  travelMm: 12,
  liftSpeedMmPerS: 400,
  purity: 0.95,
});

describe("⛔⛔ IT FIRES ONLY IN `ROTATE` — the owner's gate", () => {
  it("a vertical flick while TRANSLATING pushes NOTHING", () => {
    // ⭐⭐ THE VECTOR THE DECISION EXISTS FOR. Read literally the spec would anchor here,
    // so a brisk vertical drag would move a part and then spin it to align a face with
    // gravity. ⛔ In `TRANSLATE` the hand is moving the object, not turning it.
    expect(alignFromFlick("TRANSLATE", flick("VERTICAL", -1), FACE, UP, RIGHT)).toBeNull();
    expect(alignFromFlick("TRANSLATE", flick("HORIZONTAL", 1), FACE, UP, RIGHT)).toBeNull();
  });

  it("the same flick while ROTATING pushes a constraint", () => {
    expect(alignFromFlick("ROTATE", flick("VERTICAL", -1), FACE, UP, RIGHT)).not.toBeNull();
  });
});

describe("2ter — a VERTICAL flick aligns the face with gravity", () => {
  it("⭐ flick UP and the face ends up pointing UP", () => {
    // ⚠ Screen y grows DOWNWARD, so `sign === -1` is upward. *You flick the face the way
    // you want it to face* — the spec's `-g for y<0` in plainer words.
    const c = alignFromFlick("ROTATE", flick("VERTICAL", -1), FACE, UP, RIGHT)!;
    expect(c.kind).toBe("GRAVITY_ALIGN");
    expectVec(c.targetWorld, [0, 1, 0]);
    expect(c.localNormal).toEqual(FACE);
  });

  it("⭐ flick DOWN and it points down", () => {
    const c = alignFromFlick("ROTATE", flick("VERTICAL", 1), FACE, UP, RIGHT)!;
    expectVec(c.targetWorld, [0, -1, 0]);
  });

  it("⛔ the two signs are opposites, which no magnitude test would catch", () => {
    // ⭐ `METHOD`: *a sign is not tested by any amount of testing the magnitude.*
    const upward = alignFromFlick("ROTATE", flick("VERTICAL", -1), FACE, UP, RIGHT)!;
    const downward = alignFromFlick("ROTATE", flick("VERTICAL", 1), FACE, UP, RIGHT)!;
    expect(upward.targetWorld.map((v, i) => v + downward.targetWorld[i]!)).toEqual([0, 0, 0]);
  });
});

describe("2quater — a HORIZONTAL flick aligns the face with a WORLD axis", () => {
  it("⭐⭐ the target is the screen axis RESOLVED INTO THE WORLD, not the screen axis", () => {
    // ⛔⛔ THE CLAIM THAT MATTERS. §1.4: *"storing a screen axis meant that rule 1's camera
    // orbit invalidated the constraint, and the next snap would silently re-solve against a
    // different axis and rotate the object."* ⚠ `RIGHT` here is deliberately not a basis
    // vector — it is what screen +x points at mid-orbit — and it must come back verbatim.
    const c = alignFromFlick("ROTATE", flick("HORIZONTAL", 1), FACE, UP, RIGHT)!;
    expect(c.kind).toBe("WORLD_AXIS_ALIGN");
    expectVec(c.targetWorld, RIGHT);
  });

  it("⭐ the other sign is the opposite world direction", () => {
    const c = alignFromFlick("ROTATE", flick("HORIZONTAL", -1), FACE, UP, RIGHT)!;
    expectVec(c.targetWorld, [-0.6, 0, 0.8]);
  });

  it("⚠ a LATER call with a different frame gives a different world target", () => {
    // ⭐⭐ This is the behaviour that makes the constraint world-absolute: the gesture is
    // view-relative, and what it stores depends on where the camera was AT THE SNAP. ⛔ Two
    // identical flicks from two camera poses must NOT produce the same constraint.
    const other: Vec3 = [-1, 0, 0];
    const a = alignFromFlick("ROTATE", flick("HORIZONTAL", 1), FACE, UP, RIGHT)!;
    const b = alignFromFlick("ROTATE", flick("HORIZONTAL", 1), FACE, UP, other)!;
    expect(a.targetWorld).not.toEqual(b.targetWorld);
  });
});

describe("⛔ the refusals", () => {
  it("no flick, no rule", () => {
    expect(alignFromFlick("ROTATE", null, FACE, UP, RIGHT)).toBeNull();
  });

  it("⛔ NO FACE SELECTED, NO RULE — there is nothing to align", () => {
    // ⚠ Reachable for real: forks A and C never select a face, so this is the state the
    // shipped default is always in.
    expect(alignFromFlick("ROTATE", flick("VERTICAL", -1), null, UP, RIGHT)).toBeNull();
  });
});
