import { describe, expect, it } from "vitest";
import {
  type MateConnector,
  type Placed,
  mateResidual,
  testMate,
  worldPose,
} from "../src/core/mate_connector";
import { IDENTITY, dot, qFromAxisAngle, type Vec3 } from "../src/core/vec";

const conn = (normal: Vec3, position: Vec3 = [0, 0, 0], radius = 0.02): MateConnector => ({
  id: "c",
  position,
  normal,
  tangent: [0, 1, 0],
  rollOrder: 4,
  radius,
  kind: "stud",
});

const at = (p: Vec3): Placed => ({ position: p, orientation: IDENTITY });

/**
 * Component-wise, to 12 places.
 *
 * ⭐ Exists because the vectors added on 2026-09-17 assert a WHOLE POSE against literals
 * written out by hand. ⛔ Checking one component of three is how `worldPose` kept a hole:
 * see the block at the bottom of this file.
 */
function expectVec3(actual: Vec3, expected: Vec3): void {
  for (let i = 0; i < 3; i++) expect(actual[i]!, `component ${i}`).toBeCloseTo(expected[i]!, 12);
}

describe("mate connectors", () => {
  // ⛔⛔ THE SIGN. A connector stores the TRUE OUTWARD normal, so two mating faces
  // point AT each other. This is the opposite of the first natural wording, and it
  // is why `facingCos` must be negative.
  it("a mate is ANTI-PARALLEL", () => {
    const a = conn([1, 0, 0]);
    const b = conn([-1, 0, 0]);
    const r = testMate(a, at([0, 0, 0]), b, at([0.01, 0, 0]), -0.85);
    expect(r).not.toBeNull();
    expect(r!.facing).toBe(true);
    expect(r!.alignment).toBeCloseTo(-1, 9);
  });

  it("two faces pointing the SAME way do not mate", () => {
    const a = conn([1, 0, 0]);
    const b = conn([1, 0, 0]);
    expect(testMate(a, at([0, 0, 0]), b, at([0.01, 0, 0]), -0.85)!.facing).toBe(false);
  });

  it("⛔ a POSITIVE facingCos is refused loudly, not silently honoured", () => {
    const a = conn([1, 0, 0]);
    const b = conn([-1, 0, 0]);
    expect(() => testMate(a, at([0, 0, 0]), b, at([0.01, 0, 0]), 0.85)).toThrow();
  });

  it("different kinds never mate", () => {
    const a = conn([1, 0, 0]);
    const b = { ...conn([-1, 0, 0]), kind: "socket" };
    expect(testMate(a, at([0, 0, 0]), b, at([0.01, 0, 0]), -0.85)).toBeNull();
  });

  // ⚠⚠ **PARTIAL, AND ITS GAP IS WHY `worldPose` COULD BE MUTATED SILENTLY**: it reads the
  // `normal` and neither the position nor the tangent, which are rotated on OTHER lines.
  // ⭐ Kept as the cheap smoke check it is; the pose is pinned in full, against hand-written
  // literals, in the `worldPose` block at the bottom of this file.
  it("a connector's pose follows its owner's rotation", () => {
    const c = conn([1, 0, 0], [0.05, 0, 0]);
    const owner: Placed = { position: [0, 0, 0], orientation: qFromAxisAngle([0, 1, 0], Math.PI / 2) };
    const w = worldPose(c, owner);
    expect(dot(w.normal, [0, 0, -1])).toBeCloseTo(1, 9);
  });

  // ⛔⛔ BREAK ON THE RESIDUAL OF THE **DESIRED** POSES. Once mated the observed gap
  // is zero by construction, so a break test reading the gap can never fire and the
  // mate is unbreakable. This test is what keeps that distinction alive in code.
  describe("the residual", () => {
    it("is ~zero when the two DESIRE the same place", () => {
      const a = conn([1, 0, 0]);
      const b = conn([-1, 0, 0]);
      const r = mateResidual(a, at([0, 0, 0]), b, at([0, 0, 0]));
      expect(r.linear).toBeCloseTo(0, 9);
      expect(r.angular).toBeCloseTo(0, 9);
    });

    it("grows as the unconstrained desires pull apart", () => {
      const a = conn([1, 0, 0]);
      const b = conn([-1, 0, 0]);
      const near = mateResidual(a, at([0, 0, 0]), b, at([0.01, 0, 0]));
      const far = mateResidual(a, at([0, 0, 0]), b, at([0.05, 0, 0]));
      expect(far.linear).toBeGreaterThan(near.linear);
    });

    it("reports linear and angular SEPARATELY", () => {
      const a = conn([1, 0, 0]);
      const b = conn([-1, 0, 0]);
      const twisted: Placed = {
        position: [0, 0, 0],
        orientation: qFromAxisAngle([0, 1, 0], Math.PI / 4),
      };
      const r = mateResidual(a, at([0, 0, 0]), b, twisted);
      expect(r.linear).toBeCloseTo(0, 6);
      expect(r.angular).toBeGreaterThan(0.5);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ⛔⛔ **`worldPose` COULD DROP THE OWNER'S ROTATION AND STAY GREEN** — found by an audit,
// 2026-09-17. Replace `qRotate(owner.orientation, c.position)` with `c.position` and the
// whole suite passed.
//
// ⭐ TWO INDEPENDENT HOLES LET IT THROUGH, and both are named mistake shapes:
//
// 1. ⚠ **A PARTIAL ASSERTION.** The vector above (*"a connector's pose follows its owner's
//    rotation"*) checks the `normal` and nothing else. The normal is rotated on a different
//    line from the position, so it pins one line and leaves the other free. ⛔ A connector
//    has THREE rotated quantities; asserting one of them is not asserting the pose.
// 2. ⛔⛔ **A TAUTOLOGICAL VECTOR** in `tests/object_model.test.ts` — it built its expected
//    answer by calling `worldPose` itself, so the product was judging itself and the two
//    sides moved together under the mutation. That one is REPAIRED there, in place.
//
// ⭐⭐ SO THE VECTORS BELOW COMPUTE THE ANSWER BY HAND, from a rotation written out in the
// test as a permutation of the axes — no call to `worldPose`, no call to `qRotate`, nothing
// from `src/` on the expected side at all. `METHOD`: *a test that cannot FAIL is not a test*,
// and the surest way to make one that cannot fail is to ask the code what the answer is.
// ═══════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ worldPose, with the expectation computed INDEPENDENTLY", () => {
  // ⭐ THE ROTATION, WRITTEN OUT. 120° about the diagonal `[1, 1, 1]` is the CYCLIC
  // PERMUTATION of the axes — it carries x̂ → ŷ → ẑ → x̂ — so by hand
  //
  //     R([a, b, c]) = [c, a, b]
  //
  // ⭐ Chosen precisely because it is hand-checkable to the last digit AND it moves all
  // three components. ⚠ A rotation about a single axis would leave one component alone, and
  // a fixture that leaves a component alone cannot see a bug in that component — the
  // idealised-fixture shape, mistake 3.
  const CYCLE = qFromAxisAngle([1, 1, 1], (2 * Math.PI) / 3);
  const byHand = (v: Vec3): Vec3 => [v[2]!, v[0]!, v[1]!];

  // ⚠ BOTH a non-zero rotation AND a non-zero translation, which is the only configuration
  // that can separate the two. With no rotation, dropping the rotation changes nothing; with
  // no translation, `owner.position + R(p)` and `R(p)` agree as well.
  const OWNER: Placed = { position: [1, 2, 3], orientation: CYCLE };

  it("⭐ the axis permutation is what the test claims it is — stated, not assumed", () => {
    // ⚠ The one thing that must be true before the hand-computed expectations mean anything:
    // that `qFromAxisAngle` really produces this rotation in this handedness. Asserted on
    // the three basis vectors through the PRODUCT, so a convention flip is a loud failure
    // here rather than a confusing one three vectors down.
    // ⛔ This is the ONLY place below where the product touches the expected side, and it is
    // pinned against literals: x̂→ŷ, ŷ→ẑ, ẑ→x̂.
    const origin: Placed = { position: [0, 0, 0], orientation: CYCLE };
    const probe = (n: Vec3) => worldPose({ ...conn(n), position: n }, origin);
    const BASIS: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (const b of BASIS) expectVec3(probe(b).position, byHand(b));
    // ⭐ And the permutation spelled out against literals, so a reader never has to run
    // `byHand` in their head to know what this file is claiming.
    expectVec3(byHand([1, 0, 0]), [0, 1, 0]);
    expectVec3(byHand([0, 1, 0]), [0, 0, 1]);
    expectVec3(byHand([0, 0, 1]), [1, 0, 0]);
  });

  it("⛔⛔ POSITION is rotated INTO the owner's frame, then translated", () => {
    // ⭐⭐ THE VECTOR THE AUDIT WAS MISSING. Expected, entirely by hand:
    //     R([0.05, -0.02, 0.07])  =  [0.07, 0.05, -0.02]
    //     + owner [1, 2, 3]       =  [1.07, 2.05, 2.98]
    // ⛔ The wrong implementation this rules out — `owner.position + c.position`, the
    // rotation dropped — would put it at [1.05, 1.98, 3.07]. Every component differs, so
    // there is nowhere for the mutation to hide.
    // ⚠ It also rules out TRANSLATE-THEN-ROTATE, `R(owner.position + c.position)`, which
    // would give [4.07, 1.05, 1.98]: a connector that swings around the world origin as its
    // owner turns instead of around its owner.
    const c = { ...conn([1, 0, 0], [0.05, -0.02, 0.07]) };
    const w = worldPose(c, OWNER);
    expectVec3(w.position, [1.07, 2.05, 2.98]);
  });

  it("⛔ NORMAL is rotated and NOT translated — it is a direction, not a point", () => {
    // R([1, 0, 0]) = [0, 1, 0]. ⚠ The owner's [1, 2, 3] must not appear anywhere in it;
    // adding the translation to a direction is the mirror-image bug of dropping the
    // rotation from a position, and it stays unit-length-ish enough to look plausible.
    const c = { ...conn([1, 0, 0], [0.05, -0.02, 0.07]) };
    expectVec3(worldPose(c, OWNER).normal, [0, 1, 0]);
  });

  it("⛔ TANGENT is rotated too — the third quantity, and the one nothing watched", () => {
    // R([0, 1, 0]) = [0, 0, 1]. ⭐ `rollOrder` + tangent are what make a mate FASTENED
    // rather than REVOLUTE (header rule 4), so a tangent that does not follow its owner
    // leaves the last DOF wrong in a way only an assembled part would show.
    const c = { ...conn([1, 0, 0], [0.05, -0.02, 0.07]) };
    expectVec3(worldPose(c, OWNER).tangent, [0, 0, 1]);
  });

  it("⭐ and the three agree with each other: the frame survives the transform", () => {
    // ⚠ A composition, not a component: normal ⟂ tangent locally, so they must stay
    // perpendicular and unit in world space whatever the owner is doing. Three correct
    // lines can still compose into a frame that is not a frame — mistake shape 4.
    const c = { ...conn([1, 0, 0], [0.05, -0.02, 0.07]) };
    const w = worldPose(c, OWNER);
    expect(dot(w.normal, w.tangent)).toBeCloseTo(0, 12);
    expect(Math.hypot(...w.normal)).toBeCloseTo(1, 12);
    expect(Math.hypot(...w.tangent)).toBeCloseTo(1, 12);
  });

  it("⚠ a connector at the owner's ORIGIN is the case that hides the bug — named, not used", () => {
    // ⛔ THE TRAP, WRITTEN DOWN SO NOBODY REBUILDS THE FIXTURE THAT MISSED IT. With
    // `c.position = [0, 0, 0]` the rotation of the position is a no-op, so this vector
    // passes against BOTH the correct code and the mutant. It is kept as documentation of
    // what a fixture must NOT be, and every other vector here uses an off-centre connector.
    const c = conn([1, 0, 0], [0, 0, 0]);
    expectVec3(worldPose(c, OWNER).position, [1, 2, 3]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ⛔ **`withinRadius` WAS ASSERTED BY NO TEST AT ALL** — a grep over `tests/` on
// 2026-09-17 returned nothing. It is one of the four fields of `MateTest` and it is the one
// `3D2`'s CAPTURE RADIUS will read, so it goes from untested to load-bearing in one row.
// ⚠ Every existing vector in this file reads `facing`, `alignment` or the residual; the
// boolean that decides whether two connectors are even CLOSE ENOUGH to consider was shipped
// on inspection alone.
// ═══════════════════════════════════════════════════════════════════════════════

describe("⛔ withinRadius — the capture test `3D2` will read", () => {
  // ⚠ RADII AND DISTANCES ARE POWERS OF TWO on purpose. `length` is `sqrt(dot(v, v))`, and
  // for a friendly-looking 0.02 the round trip returns 0.020000000000000004 — which is
  // GREATER than the radius, so an "exactly at the boundary" vector written with decimal
  // metres would assert the opposite of what it means to and nobody would see why.
  // ⭐ 2⁻⁵ = 0.03125 squares and square-roots exactly, so the boundary case is exact.
  const R = 0.03125;

  /** Two connectors at the owners' origins, `d` metres apart along +x. */
  const apart = (d: number, ra = R, rb = R) =>
    testMate(conn([1, 0, 0], [0, 0, 0], ra), at([0, 0, 0]), conn([-1, 0, 0], [0, 0, 0], rb), at([d, 0, 0]), -0.85)!;

  it("⭐ WELL INSIDE the radius: true", () => {
    expect(apart(R / 4).withinRadius).toBe(true);
    expect(apart(R / 4).distance).toBeCloseTo(R / 4, 12);
  });

  it("⛔ EXACTLY AT the radius: true — the boundary is INCLUSIVE", () => {
    // ⚠ This is the vector that pins `<=` rather than `<`. Exactly-at is reachable in
    // practice because a snap puts the connector AT a computed distance, and an exclusive
    // boundary makes capture flicker at the one distance the code itself produced.
    const r = apart(R);
    expect(r.distance).toBe(R); // exact, by the powers-of-two note above
    expect(r.withinRadius).toBe(true);
  });

  it("⛔ JUST OUTSIDE the radius: false", () => {
    // ⭐ One part in 10⁴ past the boundary, not a mile past it. A vector that tests "far
    // away" passes against `distance <= 10 * radius` too and says almost nothing.
    const r = apart(R * 1.0001);
    expect(r.withinRadius).toBe(false);
    expect(r.distance).toBeGreaterThan(R);
  });

  it("⛔⛔ it is the SMALLER of the two radii — a big face does not capture a small one", () => {
    // ⭐ `Math.min(a.radius, b.radius)`. The distance below sits inside the large radius and
    // outside the small one, so `max`, or reading only `a.radius`, or only `b.radius`, each
    // give the opposite answer. ⚠ Asserted in BOTH orders, because reading only `a.radius`
    // is right half the time and a one-order vector would not know.
    const big = 0.03125; // 2⁻⁵
    const small = 0.0078125; // 2⁻⁷
    const d = 0.015625; // 2⁻⁶ — between them
    expect(apart(d, big, small).withinRadius).toBe(false);
    expect(apart(d, small, big).withinRadius).toBe(false);
    expect(apart(d, big, big).withinRadius).toBe(true);
  });

  it("⚠ it is INDEPENDENT of facing — near is not the same question as aligned", () => {
    // ⛔ Two faces pointing the SAME way, touching. `withinRadius` must still say true and
    // `facing` must still say false; a capture rule that conflated them would either grab
    // parts that cannot mate or refuse parts that are already in contact.
    const r = testMate(conn([1, 0, 0], [0, 0, 0], R), at([0, 0, 0]), conn([1, 0, 0], [0, 0, 0], R), at([R / 4, 0, 0]), -0.85)!;
    expect(r.withinRadius).toBe(true);
    expect(r.facing).toBe(false);
  });

  it("⭐ the distance is between the CONNECTORS in world space, not between the owners", () => {
    // ⚠ The composition. Two owners 0.5 m apart whose connectors reach toward each other are
    // within capture; reading owner-to-owner would put them far outside. ⛔ This is the same
    // dropped-transform family as the `worldPose` hole above, one level up.
    const a = conn([1, 0, 0], [0.25, 0, 0], R);
    const b = conn([-1, 0, 0], [-0.25, 0, 0], R);
    const r = testMate(a, at([0, 0, 0]), b, at([0.5, 0, 0]), -0.85)!;
    expect(r.distance).toBeCloseTo(0, 12);
    expect(r.withinRadius).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ⚠⚠ **`rollOrder` IS A DEAD FIELD TODAY — DELIBERATELY, AND THIS NOTE IS THE GUARD.**
//
// ⭐ It is declared on `MateConnector`, it is set by every fixture in this file and by the
// scene, and as of 2026-09-17 a grep over `src/` finds **no reader**: nothing branches on it,
// nothing validates it, and mutating it changes no behaviour anywhere. So there is nothing
// here to vector — a vector over a field no code reads would assert that an object literal
// remembers what was put in it, which is a test of the language, not of the product.
//
// ⛔ IT IS NOT AN ORPHAN AND MUST NOT BE SWEPT. Header rule 4 is what it is for: normals
// alone leave the roll about the contact axis free (Onshape's *Revolute*); the tangent plus
// the roll order is what removes the last DOF and makes a mate *Fastened*. `3D2` (snap
// transform + capture radius + seat) is the row that gives it a reader, and the vectors owed
// with that code are the ones that say a 4-fold face snaps to the NEAREST of four rolls and a
// continuous one (`rollOrder: 0`) snaps to none.
//
// ⚠ The 2026-09-17 orphan scan deleted `verticalVisibility` for looking like a control and
// not being one. This comment exists so the next scan reaches a different verdict on this
// field for a stated reason, rather than the same verdict by default.
// ═══════════════════════════════════════════════════════════════════════════════
