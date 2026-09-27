/**
 * GOLDEN VECTORS — **FORK C**, the owner's anchor and alignment rules.
 *
 * Design of record: `Claude/10_INPUT_TOUCH/spec/ALIGNMENT_RULES.md`.
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
import { faceAlignConstraint, flickResetPlan, pioneerTurned, retargetAlignment, alignModeFor, pressMeaning, type PressContext,
  outsideTapRelease,
} from "@input/alignment";
import {
  singleAlignment,
  solve,
  type Constraint,
} from "@core/constraint_stack";
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
  const followerLocal = BOX("follower").faces.find(
    (f) => f.id === followerFaceId,
  )!.normal;
  // ⚠ Where the held face pointed BEFORE the alignment — the minimality test needs it.
  const beforeWorld = faceWorld(world, "follower", followerFaceId)!.normal;

  const c = faceAlignConstraint(followerLocal, pioneerWorld);
  const capped = singleAlignment(world.objects.get("follower")!.constraints, c);
  expect(capped.refused).toBe(false);
  const solved = solve(capped.stack, followerOrientation, {
    evictOnOverflow: false,
  });
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

/**
 * ⭐⭐⭐ **WHERE AN ALIGNED FACE MUST END UP: the ANTI-NORMAL of the tapped one** (the owner,
 * 2026-09-23). ⛔ Written out here once, as arithmetic, so that every vector below states the
 * same claim and a reversal cannot be half-applied across the file.
 * ⚠ It negates by hand rather than importing `alignTargetFor`: *a vector built from the code it
 * tests cannot contradict that code*, which the 2026-09-17 audit found ten times over.
 */
const anti = (n: readonly number[]): number[] => [-n[0]!, -n[1]!, -n[2]!];

describe("⛔⛔ THE ALIGNMENT — the held face ends up pointing THE OPPOSITE WAY to the tapped one", () => {
  it("⭐⭐⭐ from two rotated objects — the case a hand actually makes", () => {
    // ⚠ Nobody taps two pristine cubes: the rotate mode exists to turn them first, and an
    // orientation-handling error is invisible at the identity.
    const r = tapAndAlign(
      qFromAxisAngle([0.3, 0.8, -0.5], 1.1),
      "+z",
      qFromAxisAngle([-0.6, 0.2, 0.7], 2.0),
      "-y",
    );
    r.followerWorld.forEach((v, i) =>
      expect(v).toBeCloseTo(anti(r.pioneerWorld)[i]!, 10),
    );
  });

  it("⭐ for EVERY follower face — whichever face is held is the one that turns", () => {
    // ⭐⭐ THE INVARIANT, AND IT IS THE WHOLE RULE. ⛔ A single-face test passes on symmetry.
    const fq = qFromAxisAngle([0.1, -0.4, 0.9], 2.2);
    const pq = qFromAxisAngle([0.5, 0.5, 0.2], 0.8);
    for (const f of BOX("x").faces) {
      const r = tapAndAlign(fq, f.id, pq, "+x");
      r.followerWorld.forEach((v, i) =>
        expect(v).toBeCloseTo(anti(r.pioneerWorld)[i]!, 10),
      );
    }
  });

  it("⛔⛔ ANTI-PARALLEL, NOT PARALLEL — the owner's REVERSAL, pinned as a SIGN", () => {
    // ⛔⛔ **THIS VECTOR ASSERTED THE OPPOSITE UNTIL 2026-09-23**, and the retraction is the
    // useful part: it read *"PARALLEL, NOT ANTI-PARALLEL — the owner's choice"* and existed to
    // fail *"if anyone corrects fork C into a mate"*. ⚠ The owner has now asked for exactly
    // that: *"the direction of the FollowerFace shall be anti-normal to the direction of the
    // PioneerFace"*. ⭐ A sign is not tested by any amount of testing the magnitude, so the
    // claim is still a whole vector of its own — pointing the other way.
    const r = tapAndAlign(IDENTITY, "+x", IDENTITY, "-x");
    // the pioneer's −x points along world −x; the follower's +x must now point AT it, i.e. +x
    expect(r.pioneerWorld[0]).toBeCloseTo(-1, 10);
    expect(r.followerWorld[0]).toBeCloseTo(1, 10);
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
    // ⚠ Against the ANTI-normal since 2026-09-23 — the target the rule actually solves for.
    const t = anti(r.pioneerWorld);
    const dot = Math.max(
      -1,
      Math.min(
        1,
        r.beforeWorld[0]! * t[0]! +
          r.beforeWorld[1]! * t[1]! +
          r.beforeWorld[2]! * t[2]!,
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
  const A: Constraint = {
    kind: "FACE_ALIGN",
    localNormal: [0, 0, 1],
    targetWorld: [0, 1, 0],
  };
  const B: Constraint = {
    kind: "FACE_ALIGN",
    localNormal: [1, 0, 0],
    targetWorld: [1, 0, 0],
  };

  it("⭐⭐⭐ the second tap replaces the first — the fork B freeze is unreachable", () => {
    // ⛔ Appending is what fork B did, and the owner's report on it was *"the second flick
    // completely freezes the rotation"*. ⭐ With a cap there is no state with zero free DOF,
    // so the trap cannot be built.
    const r = singleAlignment([A], B);
    expect(r.stack).toEqual([B]);
    expect(r.refused).toBe(false);
    expect(solve(r.stack, IDENTITY, { evictOnOverflow: false }).freeDof).toBe(
      1,
    );
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

describe("⛔⛔⛔ `D67` — THE ROLES ARE INVERTED: FIRST TOUCH THE PIONEER, SECOND THE FOLLOWER", () => {
  // ⛔⛔ THE OWNER, 2026-09-21: *"Currently, the follower face selection comes with the first
  // touch and the pioneer face selection comes with the second touch. Can i invert? First the
  // Pioneer & PioneerFace, second the Follower & the FollowerFace."*
  //
  // ⭐ Every vector below is the MIRROR of one that stood here before: the HELD body is now the
  // Pioneer and the TAPPED/PRESSED one is the Follower. ⚠ The old ones are deleted rather than
  // kept green — a vector whose subject is gone certifies nothing, which is the same rule that
  // deleted 41 fork vectors and 15 with `D66`.
  // ⭐ `D90`: the TAPPED body is the PIONEER and the HELD body is the FOLLOWER, on the release
  // path too — every field is a question about the HELD body now.

  const press = (over: Partial<PressContext> = {}): PressContext => ({
    // ⭐ `D87`: the PRESSED body is the PIONEER and the HELD body is the FOLLOWER.
    pressedObject: "objectB",
    pressedFace: "+x",
    heldObjects: ["objectA"],
    pioneerOfHeld: null,
    alignedFaceOfHeld: null,
    // ⛔⛔ THE TWO FIELDS `D87`'s FIRST BUILD DID NOT HAVE, and their absence is the defect of
    // 2026-09-25: the *already aligned* test needs the PIONEER's face and the HELD body's face
    // SEPARATELY, because face ids are per body and `objectA/f4` ≠ `objectB/f4`.
    pioneerFaceOfHeld: null,
    heldPressFace: null,
    pressWasDoubleTap: false,
    ...over,
  });

  it("⛔⛔⛔ `D87` REVERSES `D67`: the HELD body is the FOLLOWER, the PRESSED one the PIONEER", () => {
    // > *"currently, the pioneer is pressed first and the follower is pressed second. Invert that
    // > order. That will allow to align a hitface with a pioneer face."* — the owner, 2026-09-25
    //
    // ⛔⛔ **THIS BLOCK ASSERTED THE OPPOSITE PAIRING UNTIL 2026-09-25**, and `D67` was closed by a
    // hand. ⭐ Kept as a reversal rather than rewritten in place: a vector that once asserted the
    // other direction is the only record that the direction was CHOSEN, twice.
    // ⚠ The verdict shape is unchanged; what changed is which body each field describes, so this
    // vector cannot fail on its own — the ones below carry the discrimination.
    expect(pressMeaning(press())).toEqual({
      action: "ALIGN",
      mode: "SNAPSHOT",
    });
  });

  it("⭐⭐⭐ THE MODE COMES FROM *THIS* PRESS NOW, not from the held grip", () => {
    // ⛔⛔ RED AGAINST `D67`: there the flag was the HELD body's, because the held body was the
    // Pioneer. ⚠ Inverted, the Pioneer is the body under this finger, so its own double tap is
    // what asks for `FOLLOW`.
    // ⛔⛔ `D106` (2026-09-27): a double press is a snapshot like any other — `FOLLOW` is deleted.
    // ⛔ RED against the old reading, where it asked for `FOLLOW`.
    expect(pressMeaning(press({ pressWasDoubleTap: true }))).toEqual({
      action: "ALIGN",
      mode: "SNAPSHOT",
    });
  });

  it("⛔⛔ NOTHING ONLY WHEN THE PRESS WOULD CHANGE NOTHING — all three must match", () => {
    // ⛔ `D39`: then the press does nothing and the RELEASE undoes it, so a hand that presses and
    // holds has not silently lost the alignment it is looking at.
    const same = {
      pioneerOfHeld: "objectB",
      pioneerFaceOfHeld: "+x",
      alignedFaceOfHeld: "f5",
      heldPressFace: "f5",
    };
    expect(pressMeaning(press(same))).toEqual({
      action: "NOTHING",
      mode: null,
    });
    // ⭐ A different PIONEER face re-points it.
    expect(pressMeaning(press({ ...same, pressedFace: "-z" })).action).toBe(
      "ALIGN",
    );
    // ⭐⭐ And a different HITFACE re-points it too — the owner, 2026-09-25: *"I hit face1 again,
    // I align face1 with pioneerface → instead of aligning, it disengages."*
    expect(pressMeaning(press({ ...same, heldPressFace: "f2" })).action).toBe(
      "ALIGN",
    );
  });

  it("⛔⛔⛔ THE FACE NAMESPACES ARE DIFFERENT BODIES — `D87`'s first defect, as a vector", () => {
    // ⛔⛔ Face ids are per body (`f0…fN`), so `objectB/f4` and `objectA/f4` are DIFFERENT faces
    // with the same string. ⚠ The first build compared `alignedFaceOfHeld` (a face of the HELD
    // body) against `pressedFace` (a face of the PRESSED one) and no-op'd on the collision — the
    // press then fell through to `D39`'s release, which BROKE the alignment the hand had made.
    // ⭐ Here the ids collide on purpose and the verdict must still be ALIGN.
    expect(
      pressMeaning(
        press({
          pressedFace: "f4",
          pioneerOfHeld: "objectB",
          pioneerFaceOfHeld: "f1",
          alignedFaceOfHeld: "f4",
          heldPressFace: "f5",
        }),
      ).action,
    ).toBe("ALIGN");
  });

  it("⛔⛔⛔ `D90` — THE PRESSED BODY ALREADY FOLLOWS THE HELD ONE: THAT IS A **SWAP**", () => {
    // > *"I first press the pioneer and second press the follower … why is there no swap between
    // > the pioneer and the follower? This conflicts with the rule I set."* — the owner
    //
    // ⛔⛔ A guard here answered `NOTHING` for exactly this, and it was right under `D67`: there
    // the held body was the PIONEER, so *hold B, press A* named the relation that ALREADY
    // existed. ⚠ Inverted, the same fingers name the opposite one — a fresh relation, with the
    // roles exchanged. ⭐ RED against that guard, which is the whole point of the vector.
    //
    // ⚠ `scene.ts` severs the old link first: a swap cannot close a loop, because a Follower is
    // capped at one alignment and the ring needs `A→B` to survive, which it does not.
    expect(pressMeaning(press())).toEqual({
      action: "ALIGN",
      mode: "SNAPSHOT",
    });
    // ⭐ And the held body ALREADY following the pressed one, on a DIFFERENT PioneerFace, is a
    // re-point rather than a refusal — the same verdict, from the other side of the pair.
    expect(
      pressMeaning(press({ pioneerOfHeld: "objectB", pioneerFaceOfHeld: "-z" }))
        .action,
    ).toBe("ALIGN");
  });

  it("⚠⚠ AND THE MULTI-SELECT `D67` WAS CHOSEN FOR IS GONE — the cost, as a vector", () => {
    // ⛔⛔ `D67`'s own reason: *"which enables to select several follower objects to the pioneer
    // object in one go."* ⚠ Inverted, the single HELD body is the Follower, and a Follower is
    // capped at ONE alignment — so pressing a second Pioneer REPLACES the first rather than
    // adding to a set. ⭐ Recorded here so the loss is a decision and not a discovery.
    const first = pressMeaning(press({ pressedObject: "objectB" }));
    const second = pressMeaning(
      press({
        pressedObject: "objectC",
        pioneerOfHeld: "objectB",
        alignedFaceOfHeld: "+x",
      }),
    );
    expect(first.action).toBe("ALIGN");
    expect(second.action).toBe("ALIGN"); // ⚠ a REPLACEMENT, not a second relation
  });

  it("⛔ the four refusals, each read from the new end", () => {
    expect(pressMeaning(press({ pressedObject: null })).action).toBe("NOTHING");
    expect(pressMeaning(press({ pressedFace: null })).action).toBe("NOTHING");
    // ⛔ Not exactly one held body: *which Follower?* has no answer worth guessing.
    expect(pressMeaning(press({ heldObjects: [] })).action).toBe("NOTHING");
    expect(
      pressMeaning(press({ heldObjects: ["objectA", "objectC"] })).action,
    ).toBe("NOTHING");
    // ⚠ The same body twice is `SECOND`'s configuration, not a relation.
    expect(pressMeaning(press({ pressedObject: "objectA" })).action).toBe(
      "NOTHING",
    );
  });
});

describe("⭐⭐⭐ THE ROTATION RESET — scoped by WHEN the alignment happened", () => {
  it("⛔⛔ an alignment made DURING the gesture is dropped by the reset", () => {
    // > *"If the alignment occurred during the rotation, reset the rotation (therefore this
    // > looses the alignment)."* ⭐ Because the snapshot PREDATES the alignment, so restoring
    // it would leave the object disagreeing with its own constraint — the one state §1.4
    // exists to prevent.
    // ⛔⛔ `D107` (2026-09-27): the drop branch is deleted — a flick in the gesture that made the
    // alignment now does NOTHING, since restoring the pre-alignment pose would contradict the
    // constraint. ⛔ RED against the old plan, which dropped the alignment and restored.
    expect(flickResetPlan(true)).toEqual({ restoreOrientation: false });
  });

  it("⛔⛔ an alignment that PREDATES the press survives the reset", () => {
    // > *"If the object was already aligned when the rotation was started, reset to the
    // > beginning of the rotation (therefore the alignment is conserved)."*
    // ⭐⭐ And it survives for FREE: the snapshot was taken while aligned, so it already
    // satisfies the constraint. No re-solve, no special case — which is what makes the
    // owner's framing better than mine. I had asked the question about the STATE; the answer
    // is about the GESTURE, and only the gesture can tell these two cases apart.
    expect(flickResetPlan(false)).toEqual({ restoreOrientation: true });
  });
});

describe("⭐⭐ AND THE FREE SPIN IS DRIVEABLE — 2sexte, on fork C's own alignment", () => {
  const FRAME = {
    right: [1, 0, 0] as Vec3,
    up: [0, 1, 0] as Vec3,
    viewAxis: [0, 0, -1] as Vec3,
  };

  it("⛔⛔ a drag twists about the aligned normal and the alignment SURVIVES", () => {
    // ⭐ The owner's answer to *'an aligned object, one finger, no target'*: **twist about the
    // aligned normal**. ⚠ `anchor_rotate.ts` was built for `A3` and is reused unchanged — the
    // composition is what is new, and it is the assertion that matters: the object turns AND
    // the face keeps pointing where it was aligned.
    const r = tapAndAlign(
      qFromAxisAngle([0.2, 0.7, -0.3], 0.9),
      "+x",
      IDENTITY,
      "+y",
    );
    const axis = r.stack[0]!.targetWorld;
    const angle = constrainedDragAngle(FRAME, axis, mmToPx(20), 0, 0.07)!;
    expect(Math.abs(angle)).toBeGreaterThan(0.1);
    const q = r.world.objects.get("follower")!.local.orientation;
    let world = setWorldPlacement(r.world, "follower", {
      position: [0, 0, 0],
      orientation: rotateAboutAxis(q, axis, angle),
    });
    const after = faceWorld(world, "follower", "+x")!.normal;
    after.forEach((v, i) =>
      expect(v).toBeCloseTo(anti(r.pioneerWorld)[i]!, 10),
    );
    // ⛔ and the object really moved: another face went somewhere
    const spun = faceWorld(world, "follower", "+z")!.normal;
    const still = faceWorld(r.world, "follower", "+z")!.normal;
    expect(
      Math.hypot(spun[0] - still[0], spun[1] - still[1], spun[2] - still[2]),
    ).toBeGreaterThan(0.05);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// ⭐ PORTED FROM `in3_align_wiring.test.ts` when forks A and B were deleted, 2026-09-17
// ════════════════════════════════════════════════════════════════════════════
//
// ⚠ That file tested fork B's flick-to-align composition, which is deleted with fork B. ⛔ Two
// of its vectors had a DIFFERENT subject — the twist about a constraint axis — and that
// subject is alive: fork C reuses `anchor_rotate.ts` unchanged, because the geometry of *one
// constraint, one free DOF* does not care which rule created the constraint.
// ⭐ So they are ported rather than deleted, with the constraint built fork C's way.

describe("⭐⭐ THE TWIST, PORTED — it must not drift, and it must refuse where it is undefined", () => {
  const FRAME = {
    right: [1, 0, 0] as Vec3,
    up: [0, 1, 0] as Vec3,
    viewAxis: [0, 0, -1] as Vec3,
  };

  it("⛔ FORTY HUNDRED twists do not drift the anchor — the case an INCREMENT is exposed to", () => {
    // ⭐⭐ The drag is applied as a per-frame increment, so the question is not whether ONE
    // twist is exact but whether four hundred are. ⚠ `faceMarkerOrientation`'s defect was
    // found by exactly this shape, and it is cheap to ask.
    const r = tapAndAlign(IDENTITY, "+x", IDENTITY, "+y");
    const axis = r.stack[0]!.targetWorld;
    let q = r.world.objects.get("follower")!.local.orientation;
    for (let i = 0; i < 400; i++) {
      q = rotateAboutAxis(
        q,
        axis,
        constrainedDragAngle(FRAME, axis, mmToPx(3), 0, 0.07)!,
      );
    }
    const world = setWorldPlacement(r.world, "follower", {
      position: [0, 0, 0],
      orientation: q,
    });
    faceWorld(world, "follower", "+x")!.normal.forEach((v, i) =>
      expect(v).toBeCloseTo(anti(r.pioneerWorld)[i]!, 8),
    );
  });

  it("⛔⛔ AND THE DEGENERATE CAMERA REFUSES rather than turning by an arbitrary amount", () => {
    // ⭐ Looking ALONG the axis, it projects to a POINT: every screen direction is equally
    // perpendicular, so there is no angle to compute. ⛔ `null` is the honest answer, and the
    // second touchpoint's roll is the chart that works there.
    const along = {
      right: [1, 0, 0] as Vec3,
      up: [0, 0, -1] as Vec3,
      viewAxis: [0, 1, 0] as Vec3,
    };
    expect(
      constrainedDragAngle(along, [0, 1, 0], mmToPx(20), 0, 0.07),
    ).toBeNull();
    // ⭐ and the counter-example, so the refusal is about the geometry and not the fixture
    expect(
      constrainedDragAngle(FRAME, [0, 1, 0], mmToPx(20), 0, 0.07),
    ).not.toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ THE PIONEER'S OBJECT IS TURNED WHILE THE FOLLOWER IS ALIGNED — C1 vs C2
// ══════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ TURNING THE PIONEER — two readings of what an alignment MEANS", () => {
  it("⚠ a turn under the epsilon is NOT a turn — float noise must not release an alignment", () => {
    // ⛔ The rule fires on a comparison that runs every frame, so the cheapest way to make it
    // destructive is to let arithmetic noise count as a hand. ⭐ 1e-4 rad is ~0.006°: four
    // orders under the smallest deliberate twist, and well above quaternion round-off.
    const q = qFromAxisAngle([0.3, 0.8, -0.5], 1.1);
    expect(pioneerTurned(q, q).kind).toBe("NONE");
    expect(pioneerTurned(q, qmul(qFromAxisAngle([0, 1, 0], 1e-6), q)).kind).toBe("NONE");
  });

  it("⭐ A SNAPSHOT RELEASES, and reports no rotation to apply — the Follower must not move", () => {
    // ⛔ The owner's words: *"this case releases the first object alignment (but not rotate
    // the first object)"*. ⚠ `delta: null` is how that is said in a type rather than in a
    // comment — a caller cannot accidentally apply a rotation that does not exist.
    // ⚠⚠ AND THE TWO VOCABULARIES ARE DELIBERATELY DIFFERENT: the MODE is `SNAPSHOT`, the
    // VERDICT is `RELEASE`. A rename of the modes swept this vector into asserting the mode
    // where it means the verdict, and it failed — which is the whole argument for naming a
    // decision and its consequence differently.
    const before = IDENTITY;
    const now = qFromAxisAngle([0, 1, 0], 0.5);
    // ⭐ Since `D106` a verdict carries no rotation at all: there is nothing a caller could apply.
    expect(pioneerTurned(before, now).kind).toBe("RELEASE");
  });

  it("⛔⛔ THE MODE COMES FROM THE GESTURE NOW — there is no flag to read", () => {
    // ⭐ `pioneerTurnRuleOf` and `?pioneerTurnRule` lived for a few hours on 2026-09-17. The
    // owner replaced the SETTING with the GESTURE, which is better than a flag in the way that
    // matters: two alignments can differ, and a hand can see which is which from the colours
    // rather than remembering what a slider was left on.
    // ⛔⛔ `D106` (2026-09-27): `FOLLOW` is deleted — every alignment is a snapshot, whatever the
    // press. ⛔ RED against the double press still making a `FOLLOW`.
    expect(alignModeFor()).toBe("SNAPSHOT");
  });

  it("⭐ retargeting rewrites the DIRECTION and nothing else about the constraint", () => {
    // ⚠ §1.4's doctrine survives: the constraint still holds a WORLD direction, so a camera
    // orbit still cannot redefine it. ⛔ What C2 changes is only where that direction is
    // re-read from, every frame — the face it was taken from.
    // ⛔⛔ BOTH take the PIONEER'S NORMAL and negate it themselves (2026-09-23), so the
    // anti-parallel sign lives in one place and a `FOLLOW` cascade cannot re-align its
    // followers the other way one frame after a tap.
    const c = faceAlignConstraint([0, 0, 1], [0, 1, 0]);
    expect(c.targetWorld).toEqual([-0, -1, -0]);
    const r = retargetAlignment(c, [1, 0, 0]);
    expect(r.targetWorld).toEqual([-1, -0, -0]);
    expect(r.kind).toBe(c.kind);
    expect(r.localNormal).toEqual(c.localNormal);
  });
});

describe("⭐⭐⭐ `D95`/`D107` — a tap on empty space while holding releases", () => {
  it("⭐⭐ one held body, aligned → the tap releases ITS alignment", () => {
    // > *"first touch pressed on aligned object and single tap with second touch not raycast
    // > hitting any object"* — the desktop's right-hold + left click on empty space is the same.
    expect(outsideTapRelease(1, true, 0)).toBe("SELF");
  });

  it("⭐⭐ `D107`: holding a PIONEER → the tap releases ALL its followers (the Pioneer shake's job)", () => {
    // ⛔ RED against `D95`, which answered nothing for an unaligned held body.
    expect(outsideTapRelease(1, false, 2)).toBe("FOLLOWERS");
  });

  it("⭐ aligned AND a Pioneer → its OWN alignment first", () => {
    expect(outsideTapRelease(1, true, 3)).toBe("SELF");
  });

  it("⛔ a free held body with no followers, nothing held, or two held → not this rule", () => {
    expect(outsideTapRelease(1, false, 0)).toBeNull();
    expect(outsideTapRelease(0, false, 0)).toBeNull();
    // ⚠ *which one?* has no answer with two
    expect(outsideTapRelease(2, true, 1)).toBeNull();
  });
});
