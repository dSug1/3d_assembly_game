/**
 * GOLDEN VECTORS — **WHAT A TURNED PIONEER DOES, AND HOW FAR IT REACHES.**
 *
 * Design of record: the owner, 2026-09-17 — *"if a previous pioneer P1 has a follower F1 and if
 * P1 becomes the follower of P2: if P1 is orange, P2 rotation shall trigger rotation of P1 which
 * in turn shall cascade to rotation of F1; if P1 is blue, P2 rotation shall release the
 * alignment of P1 with P2 but not the alignment of F1 with P1"*.
 *
 * ⛔⛔ **THIS FILE EXISTS BECAUSE THE RULE WAS UNTESTABLE.** It lived in `render/scene.ts`, so
 * when a hand reported *"the release of the cyan follower objects by the rotation of the pioneer
 * is not working"* there was no way to ask the code what it believed. ⭐ Every vector below is
 * a question I could not previously put to the product.
 */
import { describe, expect, it } from "vitest";
import {
  resolvePioneerTurns,
  type CascadePlan,
  type CascadeStep,
  type FollowerLink,
} from "@input/pioneer_cascade";
import {
  canon,
  IDENTITY,
  qAngle,
  qconj,
  qFromAxisAngle,
  qmul,
  qRotate,
  type Quat,
  type Vec3,
} from "@core/vec";
import type { ObjectId } from "@core/object_model";

const TURN = qFromAxisAngle([0, 1, 0], 0.4);
const BIG = qFromAxisAngle([1, 0, 0], 1.1);

/** A world of poses, read through a callback exactly as the render loop does. */
const poses = (m: Record<string, Quat>) => (id: ObjectId) => m[id] ?? null;

const link = (
  follower: string,
  pioneer: string,
  mode: "SNAPSHOT" | "FOLLOW",
  baseline: Quat = IDENTITY,
): FollowerLink => ({ follower, pioneer, mode, baseline });

describe("⛔⛔⛔ THE ONE THAT WAS REPORTED BROKEN — a cyan follower releases", () => {
  it("⭐⭐⭐ A TURNED PIONEER RELEASES ITS **SNAPSHOT** FOLLOWER", () => {
    // ⛔ *"if the pioneer object rotates, all its blue follower shall be released from
    // alignment."* ⚠ The body must NOT be rotated — `D41`'s C1 is explicit: *"releases the
    // first object alignment (but not rotate the first object)"*.
    const plan = resolvePioneerTurns([link("f", "p", "SNAPSHOT")], poses({ p: TURN, f: IDENTITY }));
    expect(plan.steps).toEqual([{ kind: "RELEASE", follower: "f" }]);
  });

  it("⭐⭐ ALL of them, not just one — the owner said *all its blue followers*", () => {
    const plan = resolvePioneerTurns(
      [link("f1", "p", "SNAPSHOT"), link("f2", "p", "SNAPSHOT"), link("f3", "p", "SNAPSHOT")],
      poses({ p: TURN, f1: IDENTITY, f2: IDENTITY, f3: IDENTITY }),
    );
    expect(plan.steps.map((s) => s.follower).sort()).toEqual(["f1", "f2", "f3"]);
    expect(plan.steps.every((s) => s.kind === "RELEASE")).toBe(true);
  });

  it("⛔ a released follower is NOT re-baselined — its link is about to cease to exist", () => {
    // ⚠ Baselining it would leave a stale entry keyed to a dead link; harmless today and
    // exactly the sort of ghost that becomes a defect once the mate reads this map.
    const plan = resolvePioneerTurns([link("f", "p", "SNAPSHOT")], poses({ p: TURN, f: IDENTITY }));
    expect(plan.baselines.has("f")).toBe(false);
  });

  it("⭐ an UNMOVED Pioneer does nothing at all", () => {
    // ⛔ The rule must not fire on float noise — `PIONEER_TURN_EPSILON_RAD` guards that, and a
    // rule that fired every frame would release an alignment the instant it was made.
    const plan = resolvePioneerTurns([link("f", "p", "SNAPSHOT")], poses({ p: IDENTITY, f: IDENTITY }));
    expect(plan.steps).toEqual([]);
  });

  it("⛔⛔ AND A TURN IS COUNTED **ONCE** — the second call is quiet", () => {
    // ⭐⭐ THE VECTOR FOR THE MOST LIKELY CAUSE OF *"it fires repeatedly"* OR *"it fires once and
    // never again"*. ⚠ The plan returns new baselines; feeding them back must leave the next
    // call with nothing to do, or a single turn would re-release for ever.
    const orange = [link("f", "p", "FOLLOW")];
    const first = resolvePioneerTurns(orange, poses({ p: TURN, f: IDENTITY }));
    expect(first.steps.length).toBe(1);
    const rebased = orange.map((l) => ({ ...l, baseline: first.baselines.get(l.follower)! }));
    const second = resolvePioneerTurns(rebased, poses({ p: TURN, f: TURN }));
    expect(second.steps).toEqual([]);
  });
});

describe("⭐⭐⭐ THE CHAIN — P2 → P1 → F1, the owner's exact case", () => {
  it("⭐⭐⭐ P1 **ORANGE**: P2's turn rotates P1, AND CASCADES TO F1 — in one call", () => {
    // ⛔⛔ THE VECTOR THE WHOLE MODULE IS FOR. *"if P1 is orange, P2 rotation shall trigger
    // rotation of P1 which in turn shall cascade to rotation of F1."*
    // ⚠ The previous implementation compared each follower against a remembered pose once per
    // frame, so this unwound at ONE LINK PER FRAME. ⭐ Here it is a fixed point: P1 moves, which
    // makes P1 a changed Pioneer, which F1 then sees — within the same resolution.
    const plan = resolvePioneerTurns(
      [link("f1", "p1", "FOLLOW"), link("p1", "p2", "FOLLOW")],
      poses({ p2: TURN, p1: IDENTITY, f1: IDENTITY }),
    );
    const rotated = plan.steps.filter((s) => s.kind === "ROTATE").map((s) => s.follower);
    expect(rotated.sort()).toEqual(["f1", "p1"]);
    // ⭐ and F1 takes the SAME world rotation as P1, which is what keeps their normals parallel
    const f1 = plan.steps.find((s) => s.follower === "f1")!;
    const p1 = plan.steps.find((s) => s.follower === "p1")!;
    expect(f1.kind).toBe("ROTATE");
    expect(qAngle(qmul((f1 as { delta: Quat }).delta, IDENTITY))).toBeCloseTo(
      qAngle((p1 as { delta: Quat }).delta),
      9,
    );
  });

  it("⭐⭐⭐ P1 **BLUE**: P2's turn releases P1, AND F1 IS LEFT ALONE", () => {
    // ⛔⛔ THE OTHER HALF, AND IT IS THE SUBTLER ONE. *"if P1 is blue, P2 rotation shall release
    // the alignment of P1 with P2 but not the alignment of F1 with P1."*
    // ⭐⭐ It falls out of the geometry rather than needing a rule of its own: a `RELEASE` does
    // **not move the body**, so P1 is not a changed Pioneer and F1's baseline still holds.
    // ⚠ An implementation that released P1 *and* re-based F1, or that rotated P1 on the way
    // out, would break this — and nothing on the glass would explain why F1 dropped.
    const plan = resolvePioneerTurns(
      [link("f1", "p1", "FOLLOW"), link("p1", "p2", "SNAPSHOT")],
      poses({ p2: TURN, p1: IDENTITY, f1: IDENTITY }),
    );
    expect(plan.steps).toEqual([{ kind: "RELEASE", follower: "p1" }]);
    // ⛔ F1 is untouched: not rotated, not released
    expect(plan.steps.some((s) => s.follower === "f1")).toBe(false);
  });

  it("⭐⭐ A MIXED FAN: one Pioneer, one cyan and one orange follower", () => {
    // ⚠ Both consequences in the same instant, which is what a hand will actually do first.
    const plan = resolvePioneerTurns(
      [link("cy", "p", "SNAPSHOT"), link("or", "p", "FOLLOW")],
      poses({ p: TURN, cy: IDENTITY, or: IDENTITY }),
    );
    expect(plan.steps.find((s) => s.follower === "cy")!.kind).toBe("RELEASE");
    expect(plan.steps.find((s) => s.follower === "or")!.kind).toBe("ROTATE");
  });

  it("⭐⭐ A CASCADE THAT ENDS IN A RELEASE: P2 → P1 orange → F1 **cyan**", () => {
    // ⛔ P1 rotates, so F1's baseline for P1 DOES break — and F1 is cyan, so it releases.
    // ⚠ This is the case that distinguishes *"the release did not fire"* from *"the cascade did
    // not reach it"*, and the two are indistinguishable on the glass.
    const plan = resolvePioneerTurns(
      [link("f1", "p1", "SNAPSHOT"), link("p1", "p2", "FOLLOW")],
      poses({ p2: TURN, p1: IDENTITY, f1: IDENTITY }),
    );
    expect(plan.steps.find((s) => s.follower === "p1")!.kind).toBe("ROTATE");
    expect(plan.steps.find((s) => s.follower === "f1")!.kind).toBe("RELEASE");
  });

  it("⛔⛔ ORDER MATTERS AND IS GUARANTEED: the ROTATE precedes the RELEASE it caused", () => {
    // ⭐ The caller applies these in order. ⚠ Releasing F1 before rotating P1 would be harmless
    // here but is the sort of ordering that stops being harmless once a step reads the pose a
    // previous step wrote.
    const plan = resolvePioneerTurns(
      [link("f1", "p1", "SNAPSHOT"), link("p1", "p2", "FOLLOW")],
      poses({ p2: TURN, p1: IDENTITY, f1: IDENTITY }),
    );
    const iRotate = plan.steps.findIndex((s) => s.kind === "ROTATE");
    const iRelease = plan.steps.findIndex((s) => s.kind === "RELEASE");
    expect(iRotate).toBeLessThan(iRelease);
  });

  it("⭐ a THREE-deep orange chain resolves entirely, not one level per call", () => {
    const plan = resolvePioneerTurns(
      [
        link("d", "c", "FOLLOW"),
        link("c", "b", "FOLLOW"),
        link("b", "a", "FOLLOW"),
      ],
      poses({ a: BIG, b: IDENTITY, c: IDENTITY, d: IDENTITY }),
    );
    expect(plan.steps.map((s) => s.follower).sort()).toEqual(["b", "c", "d"]);
  });
});

describe("⛔ the cases that must not hang or corrupt", () => {
  it("⛔⛔ A CYCLE TERMINATES — A aligned to B, B aligned to A", () => {
    // ⭐⭐ `singleAlignment` makes this hard to reach by hand, and *hard to reach* is not
    // *unreachable*. ⚠ An uncapped fixed point on a cycle is a **hung render loop** — the worst
    // failure mode in this file, because the glass simply freezes with no error.
    expect(() =>
      resolvePioneerTurns(
        [link("a", "b", "FOLLOW"), link("b", "a", "FOLLOW")],
        poses({ a: TURN, b: IDENTITY }),
      ),
    ).not.toThrow();
  });

  it("⚠ a missing Pioneer neither releases nor rotates", () => {
    // ⛔ §1.4 stores a frozen world direction precisely so an alignment survives its Pioneer
    // being deleted, so a vanished Pioneer must not be read as a turn.
    const plan = resolvePioneerTurns([link("f", "gone", "SNAPSHOT")], poses({ f: IDENTITY }));
    expect(plan.steps).toEqual([]);
  });

  it("⚠ no links at all is an empty plan", () => {
    const plan = resolvePioneerTurns([], poses({}));
    expect(plan.steps).toEqual([]);
    expect(plan.baselines.size).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ⛔⛔⛔ THE VECTORS ABOVE COULD NOT FAIL ON THE COMPOSITION **ORDER**.
// ══════════════════════════════════════════════════════════════════════════════
//
// ⭐⭐⭐ **AN AUDIT, 2026-09-17: swapping `qmul(turn.delta, before)` for
// `qmul(before, turn.delta)` at `pioneer_cascade.ts`'s only composition left EVERY vector in
// this file green.** Two independent faults produced that, and both are mistake shape 5 — my
// own FIXTURES:
//
// * ⛔ **every chain fixture started its bodies at `IDENTITY`**, and at the identity the two
//   orders COINCIDE (`q · 1 = 1 · q`). The fixture was not exercising the composition at all;
//   it was exercising `q`.
// * ⛔ **the one assertion that looked like it checked the cascade compared `qAngle` only** —
//   `qAngle(qmul(f1.delta, IDENTITY))` against `qAngle(p1.delta)`. ⚠ A conjugation
//   `P · D · P⁻¹` has **exactly the same angle** as `D` and a **different axis**, so the
//   wrong-order cascade is *invisible* to an angle. ⭐ `METHOD`: *a scalar summary of a
//   rotation is not a test of a rotation* — the angle survives every axis error there is.
//
// ⭐⭐ WHAT MAKES THE ORDER OBSERVABLE FROM OUTSIDE: the resolver's own view of a pose it moved
// is not private. It is handed back as **`baselines.get(follower)`** — the pose its Pioneer had
// when that link was re-based — so for a chain `P2 → P1 → F1`, `baselines.get("f1")` **IS** P1's
// composed orientation. That is precisely the quantity the mutation changes, and it is already
// part of the contract.
//
// ⛔ Everything below therefore starts every body at a DIFFERENT non-identity orientation, and
// the orientations are chosen NOT to commute (quarter turns about x, y and z pairwise fail to).

/** ⭐ Three quarter-turns. ⛔ No two of them commute — that is the whole point of the choice. */
const RX90 = qFromAxisAngle([1, 0, 0], Math.PI / 2);
const RY90 = qFromAxisAngle([0, 1, 0], Math.PI / 2);
const RZ90 = qFromAxisAngle([0, 0, 1], Math.PI / 2);
/** ⚠ An off-axis pose, so no vector below can pass by accident of a basis alignment. */
const ODD = qFromAxisAngle([1, -2, 3], 0.9);

const BASIS: readonly Vec3[] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/**
 * ⛔⛔ COMPARE THE WHOLE QUATERNION, never its angle. ⭐ `canon` folds the double cover so
 * `q` and `−q` — the same rotation — cannot read as a failure; everything else must match.
 */
function expectQuat(got: Quat, want: Quat, label: string): void {
  const g = canon(got);
  const w = canon(want);
  for (let i = 0; i < 4; i++) expect(g[i], `${label} component ${i}`).toBeCloseTo(w[i]!, 9);
}

/**
 * ⭐⭐ THE INDEPENDENT CHECK: what an orientation DOES to the three basis vectors, against an
 * expectation built by rotating them one at a time. ⛔ It never composes a quaternion, so it
 * cannot inherit `qmul`'s argument order — an order error in the product cannot be cancelled by
 * the same order error in the expectation, which is what makes it worth writing twice.
 */
function expectFrame(got: Quat, expected: (v: Vec3) => Vec3, label: string): void {
  for (const v of BASIS) {
    const a = qRotate(got, v);
    const b = expected(v);
    for (let i = 0; i < 3; i++) expect(a[i], `${label} · [${v}] axis ${i}`).toBeCloseTo(b[i]!, 9);
  }
}

/** The `ROTATE` step for one body, with its kind asserted rather than assumed. */
function rotateDelta(plan: CascadePlan, follower: string): Quat {
  const step = plan.steps.find((s) => s.follower === follower);
  expect(step, `expected a step for ${follower}`).toBeDefined();
  expect(step!.kind, `${follower}'s step kind`).toBe("ROTATE");
  return (step as Extract<CascadeStep, { kind: "ROTATE" }>).delta;
}

describe("⛔⛔⛔ THE COMPOSITION ORDER — nothing at the identity", () => {
  it("⭐⭐⭐ A `FOLLOW` DELTA IS THE PIONEER'S **WORLD** TURN, read from a turned baseline", () => {
    // ⭐ The Pioneer sat at `RX90` and now sits at `RZ90 ∘ RX90`, so the WORLD turn it made is
    // exactly `RZ90` — and `RZ90` is what the Follower must be handed, whatever the Pioneer's
    // own pose happened to be underneath it.
    // ⛔⛔ THIS IS THE VECTOR FOR `alignment.ts`'s OTHER order. `pioneerTurned` computes
    // `now ∘ before⁻¹`; the plausible wrong answer is `before⁻¹ ∘ now`, the same turn expressed
    // in the Pioneer's OWN frame. ⚠ At an identity baseline the two are EQUAL, which is why the
    // baseline here is `RX90` and not `IDENTITY` — with `before = 1` this vector would be blind.
    // ⭐ Its ANGLE is identical under that mutation too (a conjugate preserves the angle), so
    // the assertion has to be on the axis as much as on the amount.
    const pioneerNow = qmul(RZ90, RX90);
    const plan = resolvePioneerTurns(
      [link("f", "p", "FOLLOW", RX90)],
      poses({ p: pioneerNow, f: ODD }),
    );
    const delta = rotateDelta(plan, "f");
    expectQuat(delta, RZ90, "the world turn handed to the follower");
    // ⭐⭐ AND THE DEFINING PROPERTY, checked without trusting the expectation's own algebra:
    // the delta must carry the Pioneer's OLD frame onto its NEW one, vector by vector.
    expectFrame(
      qmul(delta, RX90),
      (v) => qRotate(pioneerNow, v),
      "delta applied to the pioneer's old pose",
    );
  });

  it("⛔ AND IT IGNORES THE FOLLOWER'S OWN POSE — two followers, one answer", () => {
    // ⚠ A world rotation is the same rotation for every body it is applied to. ⭐ An
    // implementation that expressed the turn in the FOLLOWER's frame would hand these two
    // different deltas — and it would look perfectly correct for a single follower at rest,
    // which is the only configuration the fixtures above ever built.
    const pioneerNow = qmul(RZ90, RX90);
    const plan = resolvePioneerTurns(
      [link("a", "p", "FOLLOW", RX90), link("b", "p", "FOLLOW", RX90)],
      poses({ p: pioneerNow, a: RY90, b: ODD }),
    );
    expectQuat(rotateDelta(plan, "a"), RZ90, "follower a");
    expectQuat(rotateDelta(plan, "b"), RZ90, "follower b");
  });

  it("⭐⭐⭐ P2 → P1 → F1: P1's COMPOSED POSE IS **LEFT**-composed, and it is observable", () => {
    // ⛔⛔⛔ **THE VECTOR THE AUDIT WAS ABOUT.** `pose.set(follower, qmul(delta, before))` versus
    // `qmul(before, delta)`: the first turns P1 about a WORLD axis, the second about P1's own.
    // ⚠ Three bodies, three DIFFERENT non-identity poses, and no two of the rotations commute —
    // so the two orders cannot agree here by arithmetic accident.
    // ⭐ `baselines.get("f1")` IS P1's composed pose, because that is what F1 was re-based
    // against when the cascade reached it one pass later. Nothing else in the plan exposes it,
    // which is why the audit found the composition unreachable.
    const p2Now = qmul(RZ90, RX90); // ⭐ P2 made a world turn of exactly RZ90
    const plan = resolvePioneerTurns(
      [link("f1", "p1", "FOLLOW", RY90), link("p1", "p2", "FOLLOW", RX90)],
      poses({ p2: p2Now, p1: RY90, f1: ODD }),
    );
    const p1Pose = plan.baselines.get("f1");
    expect(p1Pose, "F1 must have been re-based against P1's NEW pose").toBeDefined();
    // ⭐ The expectation is built once, by hand, from the world turn and P1's start.
    expectQuat(p1Pose!, qmul(RZ90, RY90), "P1's composed pose");
    // ⛔ …and again without composing at all, so the check cannot share an order error with the
    // product: first put the body where it started, THEN turn it about the world axis.
    expectFrame(p1Pose!, (v) => qRotate(RZ90, qRotate(RY90, v)), "P1's composed pose");
    // ⚠ The mutant's own answer, named explicitly, so the exclusion is on the record rather
    // than implied: `RY90 ∘ RZ90` is a full quarter turn away from the right one.
    expect(
      qAngle(qmul(qconj(p1Pose!), qmul(RY90, RZ90))),
      "P1's pose must NOT be the object-frame composition",
    ).toBeGreaterThan(0.1);
  });

  it("⭐⭐⭐ …AND F1's FINAL ORIENTATION IS EXACTLY THE WORLD TURN ON ITS OWN START", () => {
    // ⭐⭐ The cascade's whole promise: every body down the chain receives the SAME world
    // rotation, so the angles between their faces are preserved and no alignment has to be
    // re-solved. ⛔ Under the swapped order F1's delta becomes `P1 · D · P1⁻¹` — same angle,
    // wrong axis — which is exactly why the existing `qAngle`-only assertion stayed green while
    // the chain turned about the wrong axis. ⚠ Here the quaternion is compared, then the frame.
    const p2Now = qmul(RZ90, RX90);
    const plan = resolvePioneerTurns(
      [link("f1", "p1", "FOLLOW", RY90), link("p1", "p2", "FOLLOW", RX90)],
      poses({ p2: p2Now, p1: RY90, f1: ODD }),
    );
    const dP1 = rotateDelta(plan, "p1");
    const dF1 = rotateDelta(plan, "f1");
    expectQuat(dP1, RZ90, "P1's delta");
    // ⛔ NOT `qAngle(dF1) ≈ qAngle(dP1)` — that is the assertion the audit found blind.
    expectQuat(dF1, RZ90, "F1's delta, one link further down");
    expectQuat(dF1, dP1, "the two deltas are the SAME rotation, axis included");
    // ⭐ F1's final orientation, applied the way `PioneerTurn.delta` documents it
    // (`qmul(delta, body)`), against an expectation that turns F1's start by hand.
    expectFrame(qmul(dF1, ODD), (v) => qRotate(RZ90, qRotate(ODD, v)), "F1's final orientation");
  });

  it("⛔⛔ P1 **SNAPSHOT** RELEASES AND MOVES NOTHING — F1's baseline is still its start", () => {
    // ⭐ The owner's second clause, now with nothing at the identity: *"if P1 is blue, P2
    // rotation shall release the alignment of P1 with P2 but not the alignment of F1 with P1."*
    // ⛔ The earlier version of this case asserted only that F1 has no STEP. That cannot see an
    // implementation that quietly re-bases F1 against a MOVED P1 — F1 would then be aligned to a
    // pose P1 never took, and nothing on the glass would explain the drift.
    // ⚠ So the assertion is on the BASELINE: P1 did not move, therefore F1's baseline for P1 is
    // still exactly `RY90`, and neither `RZ90 ∘ RY90` nor `RY90 ∘ RZ90`.
    const plan = resolvePioneerTurns(
      [link("f1", "p1", "FOLLOW", RY90), link("p1", "p2", "SNAPSHOT", RX90)],
      poses({ p2: qmul(RZ90, RX90), p1: RY90, f1: ODD }),
    );
    expect(plan.steps).toEqual([{ kind: "RELEASE", follower: "p1" }]);
    expectQuat(plan.baselines.get("f1")!, RY90, "F1's baseline after P1 was released");
    expect(plan.baselines.has("p1"), "a released link is not re-based").toBe(false);
  });

  it("⛔⛔ THE WITHIN-PASS RE-BASELINE: each body turns ONCE, not once per pass", () => {
    // ⭐⭐ `pioneer_cascade.ts` re-bases a rotated link INSIDE the pass that rotated it. Delete
    // that and the fixed point never converges: P1's link still carries its old baseline, so
    // pass 1 re-applies the SAME turn, pass 2 again, and the cap truncates a body that is
    // spinning away. ⚠ The symptom on the glass is *"it over-rotates"*, which reads as a gain
    // being wrong — mistake shape 2, a substituted quantity, wearing a tunable's clothes.
    // ⛔ Two links ⇒ exactly two steps, and one quarter turn each. Nothing starts at the
    // identity, so an over-rotation cannot fold back onto the right answer.
    const plan = resolvePioneerTurns(
      [link("f1", "p1", "FOLLOW", RY90), link("p1", "p2", "FOLLOW", RX90)],
      poses({ p2: qmul(RZ90, RX90), p1: RY90, f1: ODD }),
    );
    expect(plan.steps.length, "one ROTATE per body, no repeats").toBe(2);
    expect(qAngle(rotateDelta(plan, "p1")), "P1 turns a quarter, once").toBeCloseTo(Math.PI / 2, 9);
    expect(qAngle(rotateDelta(plan, "f1")), "F1 turns a quarter, once").toBeCloseTo(Math.PI / 2, 9);
  });

  it("⛔⛔ AND THE TURN IS NOT RE-APPLIED ON THE **NEXT** CALL EITHER", () => {
    // ⭐⭐ The render loop calls this every frame, so the second call is as load-bearing as the
    // first. ⚠ The existing version of this vector ran on identity poses and fed back a
    // hand-written world; this one APPLIES the plan's own deltas the documented way, from
    // non-identity starts, and re-feeds the plan's own baselines — so a re-baseline that is
    // right at the identity and wrong in general is caught.
    const p2Now = qmul(RZ90, RX90);
    const links = [link("f1", "p1", "FOLLOW", RY90), link("p1", "p2", "FOLLOW", RX90)];
    const first = resolvePioneerTurns(links, poses({ p2: p2Now, p1: RY90, f1: ODD }));
    const world: Record<string, Quat> = { p2: p2Now, p1: RY90, f1: ODD };
    for (const s of first.steps) {
      if (s.kind === "ROTATE") world[s.follower] = qmul(s.delta, world[s.follower]!);
    }
    // ⭐ The world the caller ends up with, asserted before it is fed back — otherwise a wrong
    // second call could be blamed on a wrong first one.
    expectQuat(world.p1!, qmul(RZ90, RY90), "P1 after the plan was applied");
    expectQuat(world.f1!, qmul(RZ90, ODD), "F1 after the plan was applied");
    const rebased = links.map((l) => ({ ...l, baseline: first.baselines.get(l.follower)! }));
    const second = resolvePioneerTurns(rebased, poses(world));
    expect(second.steps, "a settled chain is quiet").toEqual([]);
  });
});
