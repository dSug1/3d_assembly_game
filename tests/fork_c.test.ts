/**
 * GOLDEN VECTORS — **FORK C**, the owner's anchor and alignment rules.
 *
 * Design of record: `Claude/10_INPUT_TOUCH/spec/FORK_C_ANCHOR_RULES.md`.
 *
 * ⭐⭐⭐ THE VECTOR THAT MATTERS IS THE COMPOSITION, and it is written before the unit ones on
 * purpose: *hold an object, tap a face on another, and the held object's own face ends up
 * pointing THE SAME WAY as the tapped one.* ⛔ Every part of that sentence already has a
 * tested module — `face_align` builds a constraint, `solve` returns a swing, `faceWorld`
 * reports a normal — and this project has paid four times for assuming the chain follows.
 *
 * ⚠ **AND THE SENSE IS THE THING TO PIN.** The owner chose PARALLEL over anti-parallel with
 * the consequence stated (`§5.2`); parallel and anti-parallel are one sign apart, and
 * `METHOD` says a sign is not tested by any amount of testing the magnitude. The mutant for
 * these vectors is that single sign.
 */
import { describe, expect, it } from "vitest";
import {
  faceAlignConstraint,
  flickResetPlan,
  tapMeaning,
  type TapContext,
} from "@input/fork_c";
import { singleAlignment, solve, type Constraint } from "@core/constraint_stack";
import {
  faceWorld,
  makeWorld,
  setWorldPlacement,
  type SceneObject,
} from "@core/object_model";
import { constrainedDragAngle, rotateAboutAxis } from "@input/anchor_rotate";
import { mmToPx } from "@core/units";
import { IDENTITY, qFromAxisAngle, qmul, type Quat, type Vec3 } from "@core/vec";

const BOX = (id: string): SceneObject => ({
  id,
  local: { position: [0, 0, 0], orientation: IDENTITY },
  parent: null,
  faces: [
    { id: "+x", centre: [0.5, 0, 0], normal: [1, 0, 0] },
    { id: "-x", centre: [-0.5, 0, 0], normal: [-1, 0, 0] },
    { id: "+y", centre: [0, 0.5, 0], normal: [0, 1, 0] },
    { id: "-y", centre: [0, -0.5, 0], normal: [0, -1, 0] },
    { id: "+z", centre: [0, 0, 0.5], normal: [0, 0, 1] },
    { id: "-z", centre: [0, 0, -0.5], normal: [0, 0, -1] },
  ],
  connectors: [],
  constraints: [],
});

/**
 * ⭐⭐ THE SEQUENCE THE SCENE WILL RUN, written out here so the composition is the subject.
 * ⛔ Deliberately not shared with the product: a harness that calls the product's own path
 * cannot disagree with it, and disagreement is what a vector is for.
 */
function tapAndAlign(
  followerOrientation: Quat,
  followerFaceId: string,
  pioneerOrientation: Quat,
  pioneerFaceId: string,
) {
  let world = makeWorld([BOX("follower"), BOX("pioneer")]);
  world = setWorldPlacement(world, "follower", {
    position: [0, 0, 0],
    orientation: followerOrientation,
  });
  world = setWorldPlacement(world, "pioneer", {
    position: [0.3, 0, 0],
    orientation: pioneerOrientation,
  });

  // the Pioneer's normal is read in WORLD, at the tap, and then frozen
  const pioneerWorld = faceWorld(world, "pioneer", pioneerFaceId)!.normal;
  const followerLocal = BOX("follower").faces.find((f) => f.id === followerFaceId)!.normal;
  // ⚠ Where the held face pointed BEFORE the alignment — the minimality test needs it.
  const beforeWorld = faceWorld(world, "follower", followerFaceId)!.normal;

  const c = faceAlignConstraint(followerLocal, pioneerWorld);
  const capped = singleAlignment(world.objects.get("follower")!.constraints, c);
  expect(capped.refused).toBe(false);
  const solved = solve(capped.stack, followerOrientation, { evictOnOverflow: false });
  expect(solved.rejected).toBe(false);
  world = setWorldPlacement(world, "follower", {
    position: [0, 0, 0],
    orientation: qmul(solved.rotation, followerOrientation),
  });
  return {
    world,
    pioneerWorld,
    beforeWorld,
    rotation: solved.rotation,
    followerWorld: faceWorld(world, "follower", followerFaceId)!.normal,
    freeDof: solved.freeDof,
    stack: capped.stack,
  };
}

describe("⛔⛔ THE ALIGNMENT — the held face ends up pointing THE SAME WAY as the tapped one", () => {
  it("⭐⭐⭐ from two rotated objects — the case a hand actually makes", () => {
    // ⚠ Nobody taps two pristine cubes: the rotate mode exists to turn them first, and an
    // orientation-handling error is invisible at the identity.
    const r = tapAndAlign(
      qFromAxisAngle([0.3, 0.8, -0.5], 1.1),
      "+z",
      qFromAxisAngle([-0.6, 0.2, 0.7], 2.0),
      "-y",
    );
    r.followerWorld.forEach((v, i) => expect(v).toBeCloseTo(r.pioneerWorld[i]!, 10));
  });

  it("⭐ for EVERY follower face — whichever face is held is the one that turns", () => {
    // ⭐⭐ THE INVARIANT, AND IT IS THE WHOLE RULE. ⛔ A single-face test passes on symmetry.
    const fq = qFromAxisAngle([0.1, -0.4, 0.9], 2.2);
    const pq = qFromAxisAngle([0.5, 0.5, 0.2], 0.8);
    for (const f of BOX("x").faces) {
      const r = tapAndAlign(fq, f.id, pq, "+x");
      r.followerWorld.forEach((v, i) => expect(v).toBeCloseTo(r.pioneerWorld[i]!, 10));
    }
  });

  it("⛔⛔ PARALLEL, NOT ANTI-PARALLEL — the owner's choice, pinned as a SIGN", () => {
    // ⚠ The two answers differ by one sign and nothing else, so this is the vector that
    // fails if anyone "corrects" fork C into a mate. ⭐ A mate is anti-parallel
    // (`CLAUDE.md` rule 4, §4 6quater) and fork C is deliberately NOT a mate: the owner
    // chose the CAD *align* sense, with the consequence recorded in the spec (§5.2) — the
    // held object presents its opposite side toward the tapped face.
    const r = tapAndAlign(IDENTITY, "+x", IDENTITY, "-x");
    // pioneer's −x points along world −x; the follower's +x must too, NOT toward it
    expect(r.pioneerWorld[0]).toBeCloseTo(-1, 10);
    expect(r.followerWorld[0]).toBeCloseTo(-1, 10);
  });

  it("⭐⭐ it is the MINIMAL rotation — *'rotation on the minimum number of axis'*", () => {
    // ⭐ The owner's words, and §1.4's entry 1 already means them: the SHORTEST ARC taking
    // the normal onto its target. ⛔⛔ MY FIRST VERSION OF THIS VECTOR COULD NOT FAIL — it
    // built the swing axis as `before × after` and then asserted that axis was perpendicular
    // to `after`, which a cross product is BY CONSTRUCTION. Mistake shape 5, my own fixture,
    // caught by reading it rather than by a mutant.
    //
    // ⭐⭐ THE HONEST TEST OF *MINIMAL* IS THE ROTATION'S **ANGLE**: the smallest rotation
    // taking one unit vector onto another turns by exactly the angle between them. Any twist
    // added about the target — the error this rule could plausibly make — makes the total
    // turn LARGER, and nothing else does.
    const q = qFromAxisAngle([0, 1, 0], 0.7);
    const r = tapAndAlign(q, "+z", qFromAxisAngle([0.2, 0.3, 0.9], 1.3), "-x");
    const dot = Math.max(
      -1,
      Math.min(
        1,
        r.beforeWorld[0]! * r.pioneerWorld[0]! +
          r.beforeWorld[1]! * r.pioneerWorld[1]! +
          r.beforeWorld[2]! * r.pioneerWorld[2]!,
      ),
    );
    const arc = Math.acos(dot);
    expect(arc).toBeGreaterThan(0.3); // ⚠ the fixture must actually need a rotation
    // the quaternion's own turn angle, `2·acos|w|`
    const applied = 2 * Math.acos(Math.min(1, Math.abs(r.rotation[0]!)));
    expect(applied).toBeCloseTo(arc, 10);
  });

  it("⭐ ONE alignment leaves ONE free DOF — the spin about the aligned normal", () => {
    // ⛔⛔ THIS IS THE OWNER'S *'I do not want to have 2 DOF removed'*, reconciled with the
    // geometry: a normal-onto-direction alignment fixes TWO DOF and the survivor is the spin.
    // ⭐ So what the rule can promise is that the survivor is never taken, which is the cap.
    const r = tapAndAlign(IDENTITY, "+x", IDENTITY, "+y");
    expect(r.freeDof).toBe(1);
    expect(r.stack).toHaveLength(1);
  });
});

describe("⛔⛔ THE CAP OF ONE — a second alignment REPLACES, and never freezes the object", () => {
  const A: Constraint = { kind: "FACE_ALIGN", localNormal: [0, 0, 1], targetWorld: [0, 1, 0] };
  const B: Constraint = { kind: "FACE_ALIGN", localNormal: [1, 0, 0], targetWorld: [1, 0, 0] };

  it("⭐⭐⭐ the second tap replaces the first — the fork B freeze is unreachable", () => {
    // ⛔ Appending is what fork B did, and the owner's report on it was *"the second flick
    // completely freezes the rotation"*. ⭐ With a cap there is no state with zero free DOF,
    // so the trap cannot be built.
    const r = singleAlignment([A], B);
    expect(r.stack).toEqual([B]);
    expect(r.refused).toBe(false);
    expect(solve(r.stack, IDENTITY, { evictOnOverflow: false }).freeDof).toBe(1);
  });

  it("⛔ and it is a REPLACEMENT, not an append — asserted as the DOF that survives", () => {
    // ⚠ `toEqual` above could pass on a coincidence of ordering; this says what it MEANS.
    expect(singleAlignment([A], B).stack).toHaveLength(1);
    expect(solve([A, B], IDENTITY, { evictOnOverflow: false }).freeDof).toBe(0);
  });

  it("⛔⛔ a MATE on the stack REFUSES the alignment rather than overriding it", () => {
    // ⭐ Unreachable in fork C today — §4's `6quater` is the only rule that pushes a mate and
    // it is flick-based — so this is a guard against a FUTURE session wiring one and finding
    // that an orientation gesture silently broke an assembly relationship. `D13`'s spirit.
    const mate: Constraint = {
      kind: "MATE",
      localNormal: [0, 1, 0],
      targetWorld: [0, -1, 0],
      otherObjectId: "other",
    };
    const r = singleAlignment([mate], A);
    expect(r.refused).toBe(true);
    expect(r.stack).toEqual([mate]);
  });
});

describe("⛔⛔ THE TAP'S THREE MEANINGS — `D28`'s toggle, fork C's align, and its UNDO", () => {
  const ctx = (over: Partial<TapContext> = {}): TapContext => ({
    mode: "ROTATE",
    tappedObject: "objectB",
    tappedFace: "+x",
    heldObject: "objectA",
    pioneer: null,
    ...over,
  });

  it("⭐⭐ holding an object in ROTATE and tapping ANOTHER object's face ⇒ ALIGN", () => {
    expect(tapMeaning(ctx())).toBe("ALIGN");
  });

  it("⭐⭐⭐ TAPPING THE SAME PIONEER FACE AGAIN ⇒ UNALIGN — the owner's amendment", () => {
    // > *"in addition to the shake, the alignment can be toggled off by taping another time
    // > to the same PioneerFace."* ⭐ The gesture becomes a TOGGLE rather than a second
    // command to remember, which is also why the owner expects to drop the shake later:
    // *"this is a complicated movement to execute by the user."*
    expect(tapMeaning(ctx({ pioneer: { objectId: "objectB", faceId: "+x" } }))).toBe("UNALIGN");
  });

  it("⛔ a DIFFERENT face of the same Pioneer object still ALIGNS — and replaces", () => {
    // ⭐ The face is the whole test, not the object. ⚠ Otherwise re-aiming at the next face of
    // the same part would silently UNDO instead of re-aligning, which is the opposite of what
    // the hand asked for — and the cap makes the replacement safe.
    expect(tapMeaning(ctx({ pioneer: { objectId: "objectB", faceId: "-y" } }))).toBe("ALIGN");
  });

  it("⛔ and a tap on a THIRD object aligns to it, whatever the current Pioneer is", () => {
    expect(
      tapMeaning(ctx({ tappedObject: "objectC", pioneer: { objectId: "objectB", faceId: "+x" } })),
    ).toBe("ALIGN");
  });

  it("⚠ an unresolved face cannot UNALIGN — `null` must not match a remembered face", () => {
    // ⛔ A grazing pick that resolves no face would otherwise compare `null === null` if the
    // test were written carelessly, and a tap that hit nothing would destroy an alignment.
    expect(
      tapMeaning(ctx({ tappedFace: null, pioneer: { objectId: "objectB", faceId: "+x" } })),
    ).toBe("ALIGN");
  });

  it("⛔⛔ in TRANSLATE it is always a TOGGLE — or the way back to ROTATE is gone", () => {
    // ⭐ Load-bearing, not decoration. ⚠ It also means the re-tap UNDO is a `ROTATE` gesture:
    // the shake is what undoes an alignment while translating, which is exactly why the owner
    // keeps the shake *for the moment*.
    expect(tapMeaning(ctx({ mode: "TRANSLATE" }))).toBe("TOGGLE");
    expect(
      tapMeaning(ctx({ mode: "TRANSLATE", pioneer: { objectId: "objectB", faceId: "+x" } })),
    ).toBe("TOGGLE");
  });

  it("⛔ a tap with nothing held, or on empty space, or on the held object ⇒ TOGGLE", () => {
    expect(tapMeaning(ctx({ heldObject: null }))).toBe("TOGGLE");
    expect(tapMeaning(ctx({ tappedObject: null }))).toBe("TOGGLE");
    // ⚠ A Pioneer and a Follower on ONE object is not a relation.
    expect(tapMeaning(ctx({ tappedObject: "objectA" }))).toBe("TOGGLE");
  });
});

describe("⭐⭐⭐ THE ROTATION RESET — scoped by WHEN the alignment happened", () => {
  it("⛔⛔ an alignment made DURING the gesture is dropped by the reset", () => {
    // > *"If the alignment occurred during the rotation, reset the rotation (therefore this
    // > looses the alignment)."* ⭐ Because the snapshot PREDATES the alignment, so restoring
    // it would leave the object disagreeing with its own constraint — the one state §1.4
    // exists to prevent.
    expect(flickResetPlan(true)).toEqual({ restoreOrientation: true, dropAlignment: true });
  });

  it("⛔⛔ an alignment that PREDATES the press survives the reset", () => {
    // > *"If the object was already aligned when the rotation was started, reset to the
    // > beginning of the rotation (therefore the alignment is conserved)."*
    // ⭐⭐ And it survives for FREE: the snapshot was taken while aligned, so it already
    // satisfies the constraint. No re-solve, no special case — which is what makes the
    // owner's framing better than mine. I had asked the question about the STATE; the answer
    // is about the GESTURE, and only the gesture can tell these two cases apart.
    expect(flickResetPlan(false)).toEqual({ restoreOrientation: true, dropAlignment: false });
  });

  it("⚠ the orientation is restored in BOTH cases — the reset is never refused", () => {
    // ⭐ The owner reinstated *the rotation reset*; the alignment's fate is the only thing
    // that varies. ⛔ Stated as its own vector so a later session cannot read the two above
    // as *"sometimes it does nothing"*.
    expect(flickResetPlan(true).restoreOrientation).toBe(true);
    expect(flickResetPlan(false).restoreOrientation).toBe(true);
  });
});

describe("⭐⭐ AND THE FREE SPIN IS DRIVEABLE — 2sexte, on fork C's own alignment", () => {
  const FRAME = { right: [1, 0, 0] as Vec3, up: [0, 1, 0] as Vec3, viewAxis: [0, 0, -1] as Vec3 };

  it("⛔⛔ a drag twists about the aligned normal and the alignment SURVIVES", () => {
    // ⭐ The owner's answer to *'an aligned object, one finger, no target'*: **twist about the
    // aligned normal**. ⚠ `anchor_rotate.ts` was built for `A3` and is reused unchanged — the
    // composition is what is new, and it is the assertion that matters: the object turns AND
    // the face keeps pointing where it was aligned.
    const r = tapAndAlign(qFromAxisAngle([0.2, 0.7, -0.3], 0.9), "+x", IDENTITY, "+y");
    const axis = r.stack[0]!.targetWorld;
    const angle = constrainedDragAngle(FRAME, axis, mmToPx(20), 0, 0.07)!;
    expect(Math.abs(angle)).toBeGreaterThan(0.1);
    const q = r.world.objects.get("follower")!.local.orientation;
    let world = setWorldPlacement(r.world, "follower", {
      position: [0, 0, 0],
      orientation: rotateAboutAxis(q, axis, angle),
    });
    const after = faceWorld(world, "follower", "+x")!.normal;
    after.forEach((v, i) => expect(v).toBeCloseTo(r.pioneerWorld[i]!, 10));
    // ⛔ and the object really moved: another face went somewhere
    const spun = faceWorld(world, "follower", "+z")!.normal;
    const still = faceWorld(r.world, "follower", "+z")!.normal;
    expect(
      Math.hypot(spun[0] - still[0], spun[1] - still[1], spun[2] - still[2]),
    ).toBeGreaterThan(0.05);
  });
});
