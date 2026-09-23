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
import {
  faceAlignConstraint,
  flickResetPlan,
  pioneerTurned,
  retargetAlignment,
  tapMeaning,
  alignModeFor,
  pressMeaning,
  type PressContext,
  type TapContext,
} from "@input/alignment";
import { singleAlignment, solve, type Constraint } from "@core/constraint_stack";
import {
  faceWorld,
  makeWorld,
  setWorldPlacement,
  type SceneObject,
} from "@core/object_model";
import { constrainedDragAngle, rotateAboutAxis } from "@input/anchor_rotate";
import { mmToPx } from "@core/units";
import { IDENTITY, qconj, qFromAxisAngle, qmul, type Quat, type Vec3 } from "@core/vec";

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
    r.followerWorld.forEach((v, i) => expect(v).toBeCloseTo(anti(r.pioneerWorld)[i]!, 10));
  });

  it("⭐ for EVERY follower face — whichever face is held is the one that turns", () => {
    // ⭐⭐ THE INVARIANT, AND IT IS THE WHOLE RULE. ⛔ A single-face test passes on symmetry.
    const fq = qFromAxisAngle([0.1, -0.4, 0.9], 2.2);
    const pq = qFromAxisAngle([0.5, 0.5, 0.2], 0.8);
    for (const f of BOX("x").faces) {
      const r = tapAndAlign(fq, f.id, pq, "+x");
      r.followerWorld.forEach((v, i) => expect(v).toBeCloseTo(anti(r.pioneerWorld)[i]!, 10));
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
        r.beforeWorld[0]! * t[0]! + r.beforeWorld[1]! * t[1]! + r.beforeWorld[2]! * t[2]!,
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

describe("⛔⛔⛔ `D67` — THE ROLES ARE INVERTED: FIRST TOUCH THE PIONEER, SECOND THE FOLLOWER", () => {
  // ⛔⛔ THE OWNER, 2026-09-21: *"Currently, the follower face selection comes with the first
  // touch and the pioneer face selection comes with the second touch. Can i invert? First the
  // Pioneer & PioneerFace, second the Follower & the FollowerFace."*
  //
  // ⭐ Every vector below is the MIRROR of one that stood here before: the HELD body is now the
  // Pioneer and the TAPPED/PRESSED one is the Follower. ⚠ The old ones are deleted rather than
  // kept green — a vector whose subject is gone certifies nothing, which is the same rule that
  // deleted 41 fork vectors and 15 with `D66`.
  const tap = (over: Partial<TapContext> = {}): TapContext => ({
    tappedObject: "objectB",
    tappedFace: "+x",
    heldObject: "objectA",
    pioneerOfTapped: null,
    alignedFaceOfTapped: null,
    pioneerPressWasDoubleTap: false,
    ...over,
  });

  const press = (over: Partial<PressContext> = {}): PressContext => ({
    pressedObject: "objectB",
    pressedFace: "+x",
    heldObjects: ["objectA"],
    pioneerOfHeld: null,
    pioneerOfPressed: null,
    alignedFaceOfPressed: null,
    pioneerPressWasDoubleTap: false,
    ...over,
  });

  it("⭐⭐⭐ pressing a SECOND body's face aligns it TO the held one — the inversion itself", () => {
    // ⛔ The held body supplies the PioneerFace; the pressed body is the Follower. Before `D67`
    // this same call meant the opposite pairing.
    expect(pressMeaning(press())).toEqual({ action: "ALIGN", mode: "SNAPSHOT" });
    expect(tapMeaning(tap())).toEqual({ action: "ALIGN", mode: "SNAPSHOT" });
  });

  it("⭐⭐⭐ ORANGE COMES FROM THE PIONEER'S OWN PRESS, not from this touch", () => {
    // ⛔⛔ THE OWNER: *"to reach the orange, the first touch shall be double tap without final
    // release [on] the pioneer object and the second touch shall hit follower object's
    // FollowerFace while first touch is still pressed on PioneerFace."*
    // ⚠ FAILS against every earlier build, where the mode came from THIS touch's tap count.
    expect(pressMeaning(press({ pioneerPressWasDoubleTap: true }))).toEqual({
      action: "ALIGN",
      mode: "FOLLOW",
    });
    expect(tapMeaning(tap({ pioneerPressWasDoubleTap: true }))).toEqual({
      action: "ALIGN",
      mode: "FOLLOW",
    });
  });

  it("⭐⭐⭐ SEVERAL FOLLOWERS IN ONE HOLD — the flag is the Pioneer's, so they agree", () => {
    // ⛔ The owner's sequence: *"second touch is pressed on first Follower object's FollowerFace
    // and then released, second touch is then pressed on second Follower object's FollowerFace,
    // etc."* ⭐ Nothing in the rule counts Followers, and `AlignmentLinks` keeps a SET of them
    // per Pioneer — so the second and third presses are simply the first one again, with a
    // different `pressedObject` and the SAME held Pioneer.
    for (const follower of ["objectB", "objectC", "plate2"]) {
      expect(pressMeaning(press({ pressedObject: follower }))).toEqual({
        action: "ALIGN",
        mode: "SNAPSHOT",
      });
      expect(pressMeaning(press({ pressedObject: follower, pioneerPressWasDoubleTap: true }))).toEqual(
        { action: "ALIGN", mode: "FOLLOW" },
      );
    }
  });

  it("⭐⭐ a body ALREADY following this Pioneer on this FACE: the press does nothing…", () => {
    // ⚠ …and the RELEASE lets it go (`D39`'s re-tap, moved onto the face the second touch now
    // selects). ⛔ The press must not undo: a hand that presses and holds would otherwise lose
    // the alignment it is looking at, silently.
    const same = { pioneerOfPressed: "objectA", alignedFaceOfPressed: "+x" };
    expect(pressMeaning(press(same))).toEqual({ action: "NOTHING", mode: null });
    expect(
      tapMeaning(tap({ pioneerOfTapped: "objectA", alignedFaceOfTapped: "+x" })),
    ).toEqual({ action: "UNALIGN", mode: null });
  });

  it("⭐⭐ a DIFFERENT face of the same Follower RE-POINTS it — `A23`'s shape, mirrored", () => {
    // ⭐ It needs no rule of its own: the same-face test fails, so it is a fresh alignment that
    // replaces the old one — which is exactly what re-pointing is.
    expect(
      pressMeaning(press({ pressedFace: "-z", pioneerOfPressed: "objectA", alignedFaceOfPressed: "+x" })),
    ).toEqual({ action: "ALIGN", mode: "SNAPSHOT" });
  });

  it("⛔⛔ THE CYCLE IS REFUSED FROM THE OTHER END NOW", () => {
    // ⚠ Before `D67` the guard asked *does the PRESSED body follow the held one?*; inverted, it
    // asks *does the HELD body follow the pressed one?* ⛔ Both fields were already in the
    // context, which is why this is a re-point and not new logic.
    expect(pressMeaning(press({ pioneerOfHeld: "objectB" }))).toEqual({
      action: "NOTHING",
      mode: null,
    });
    // ⭐ And a Pioneer that follows some THIRD body is not a cycle at all — chains are legal.
    expect(pressMeaning(press({ pioneerOfHeld: "objectC" })).action).toBe("ALIGN");
  });

  it("⛔ the four refusals, each read from the other end", () => {
    expect(pressMeaning(press({ pressedObject: null })).action).toBe("NOTHING");
    expect(pressMeaning(press({ pressedFace: null })).action).toBe("NOTHING");
    // ⛔ Not exactly one held body: *which Pioneer?* has no answer worth guessing.
    expect(pressMeaning(press({ heldObjects: [] })).action).toBe("NOTHING");
    expect(pressMeaning(press({ heldObjects: ["objectA", "objectC"] })).action).toBe("NOTHING");
    // ⚠ The same body twice is `SECOND`'s configuration, not a relation.
    expect(pressMeaning(press({ pressedObject: "objectA" })).action).toBe("NOTHING");
  });

  it("⭐ a tap with nothing held, or on the held body itself, still TOGGLES the mode", () => {
    // ⛔ `D28`'s tap toggle is untouched by the inversion — and since `D66` it is the only
    // trigger left, so breaking it here would take the mode switch with it.
    expect(tapMeaning(tap({ heldObject: null })).action).toBe("TOGGLE");
    expect(tapMeaning(tap({ tappedObject: null })).action).toBe("TOGGLE");
    expect(tapMeaning(tap({ tappedObject: "objectA" })).action).toBe("TOGGLE");
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
    after.forEach((v, i) => expect(v).toBeCloseTo(anti(r.pioneerWorld)[i]!, 10));
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
  const FRAME = { right: [1, 0, 0] as Vec3, up: [0, 1, 0] as Vec3, viewAxis: [0, 0, -1] as Vec3 };

  it("⛔ FORTY HUNDRED twists do not drift the anchor — the case an INCREMENT is exposed to", () => {
    // ⭐⭐ The drag is applied as a per-frame increment, so the question is not whether ONE
    // twist is exact but whether four hundred are. ⚠ `faceMarkerOrientation`'s defect was
    // found by exactly this shape, and it is cheap to ask.
    const r = tapAndAlign(IDENTITY, "+x", IDENTITY, "+y");
    const axis = r.stack[0]!.targetWorld;
    let q = r.world.objects.get("follower")!.local.orientation;
    for (let i = 0; i < 400; i++) {
      q = rotateAboutAxis(q, axis, constrainedDragAngle(FRAME, axis, mmToPx(3), 0, 0.07)!);
    }
    const world = setWorldPlacement(r.world, "follower", { position: [0, 0, 0], orientation: q });
    faceWorld(world, "follower", "+x")!.normal.forEach((v, i) =>
      expect(v).toBeCloseTo(anti(r.pioneerWorld)[i]!, 8),
    );
  });

  it("⛔⛔ AND THE DEGENERATE CAMERA REFUSES rather than turning by an arbitrary amount", () => {
    // ⭐ Looking ALONG the axis, it projects to a POINT: every screen direction is equally
    // perpendicular, so there is no angle to compute. ⛔ `null` is the honest answer, and the
    // second touchpoint's roll is the chart that works there.
    const along = { right: [1, 0, 0] as Vec3, up: [0, 0, -1] as Vec3, viewAxis: [0, 1, 0] as Vec3 };
    expect(constrainedDragAngle(along, [0, 1, 0], mmToPx(20), 0, 0.07)).toBeNull();
    // ⭐ and the counter-example, so the refusal is about the geometry and not the fixture
    expect(constrainedDragAngle(FRAME, [0, 1, 0], mmToPx(20), 0, 0.07)).not.toBeNull();
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
    expect(pioneerTurned(q, q, "SNAPSHOT").kind).toBe("NONE");
    expect(pioneerTurned(q, qmul(qFromAxisAngle([0, 1, 0], 1e-6), q), "FOLLOW").kind).toBe("NONE");
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
    const t = pioneerTurned(before, now, "SNAPSHOT");
    expect(t.kind).toBe("RELEASE");
    expect(t.delta).toBeNull();
  });

  it("⭐⭐⭐ C2's delta keeps the two faces ANTI-PARALLEL — the composition, not the claim", () => {
    // ⛔⛔ THE VECTOR THIS PAIR EXISTS FOR. `FOLLOW` is only worth having if applying its
    // delta leaves the Follower's aligned face pointing exactly where the Pioneer's face now
    // points. ⭐ Every piece is tested elsewhere; this asserts the chain.
    const r = tapAndAlign(qFromAxisAngle([0.2, 0.7, -0.3], 0.9), "+x", IDENTITY, "+y");
    const pioneerBefore = r.world.objects.get("pioneer")!.local.orientation;

    // the hand turns the PIONEER
    const turn = qFromAxisAngle([0.4, 0.2, 0.9], 0.8);
    const pioneerNow = qmul(turn, pioneerBefore);
    let world = setWorldPlacement(r.world, "pioneer", {
      position: [0.3, 0, 0],
      orientation: pioneerNow,
    });

    const t = pioneerTurned(pioneerBefore, pioneerNow, "FOLLOW");
    expect(t.kind).toBe("FOLLOW");
    // apply it to the FOLLOWER, exactly as the scene does
    const follower = world.objects.get("follower")!.local.orientation;
    world = setWorldPlacement(world, "follower", {
      position: [0, 0, 0],
      orientation: qmul(t.delta!, follower),
    });

    const pioneerNormal = faceWorld(world, "pioneer", "+y")!.normal;
    const followerNormal = faceWorld(world, "follower", "+x")!.normal;
    followerNormal.forEach((v, i) => expect(v).toBeCloseTo(anti(pioneerNormal)[i]!, 10));
  });

  it("⛔⛔ AND THE OTHER COMPOSITION ORDER BREAKS IT — both measured, in one vector", () => {
    // ⭐ `now ∘ before⁻¹` is the rotation in WORLD; `before⁻¹ ∘ now` is the same rotation
    // expressed in the object's OWN frame. ⚠ They agree when `before` is the identity — which
    // is exactly why a fixture at the identity would certify the wrong one.
    //
    // ⛔⛔ MY FIRST VERSION OF THIS VECTOR WAS TOO WEAK TO MEAN ANYTHING: with a mild fixture
    // the wrong order still left the faces 8° apart (dot 0.990) and the threshold was 0.99, so
    // it passed by 0.0003. ⭐ Mistake shape 5 again — my own fixture — and the cure was to
    // MEASURE candidate fixtures instead of choosing one by eye: the pair below puts the
    // faces nearly opposite. ⚠ Both orders are now asserted in the same vector, so it cannot
    // pass by the correct one being wrong too.
    const r = tapAndAlign(IDENTITY, "+x", qFromAxisAngle([1, 1, 0], 2.4), "+y");
    const pBefore = r.world.objects.get("pioneer")!.local.orientation;
    const pNow = qmul(qFromAxisAngle([0, 0, 1], 2.0), pBefore);
    const world0 = setWorldPlacement(r.world, "pioneer", {
      position: [0.3, 0, 0],
      orientation: pNow,
    });
    const pn = faceWorld(world0, "pioneer", "+y")!.normal;
    const follower = world0.objects.get("follower")!.local.orientation;

    const after = (delta: Quat) => {
      const w = setWorldPlacement(world0, "follower", {
        position: [0, 0, 0],
        orientation: qmul(delta, follower),
      });
      const fn = faceWorld(w, "follower", "+x")!.normal;
      return fn[0]! * pn[0]! + fn[1]! * pn[1]! + fn[2]! * pn[2]!;
    };

    // ✅ the world delta — what `pioneerTurned` returns — is EXACT. ⚠ `−1` since 2026-09-23:
    // the faces are held ANTI-parallel, so exactness is a dot of −1 rather than +1.
    expect(after(pioneerTurned(pBefore, pNow, "FOLLOW").delta!)).toBeCloseTo(-1, 10);
    // ⛔ the object-frame delta leaves them nowhere near it — measured, not assumed
    expect(after(qmul(qconj(pBefore), pNow))).toBeGreaterThan(-0.9);
  });

  it("⛔⛔ THE MODE COMES FROM THE GESTURE NOW — there is no flag to read", () => {
    // ⭐ `pioneerTurnRuleOf` and `?pioneerTurnRule` lived for a few hours on 2026-09-17. The
    // owner replaced the SETTING with the GESTURE, which is better than a flag in the way that
    // matters: two alignments can differ, and a hand can see which is which from the colours
    // rather than remembering what a slider was left on.
    expect(alignModeFor(false)).toBe("SNAPSHOT");
    expect(alignModeFor(true)).toBe("FOLLOW");
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
