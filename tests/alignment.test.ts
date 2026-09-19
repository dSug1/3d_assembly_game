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
  modeForTap,
  retargetAlignment,
  tapMeaning,
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

describe("⛔⛔ THE TAP'S FOUR MEANINGS — and the GESTURE chooses what an alignment IS", () => {
  const ctx = (over: Partial<TapContext> = {}): TapContext => ({
    kind: "TAP",
    alignMode: null,
    tappedObject: "objectB",
    tappedFace: "+x",
    heldObject: "objectA",
    pioneer: null,
    ...over,
  });
  const PIONEER = { objectId: "objectB", faceId: "+x" };

  it("⭐⭐ a SINGLE tap on another object's face aligns as a SNAPSHOT (the old C1)", () => {
    expect(tapMeaning(ctx())).toEqual({ action: "ALIGN", mode: "SNAPSHOT" });
  });

  it("⭐⭐ a DOUBLE tap on another object's face aligns as a FOLLOW (the old C2)", () => {
    // ⛔⛔ THE FLAG BECAME A GESTURE, 2026-09-17. `?pioneerTurnRule` chose the reading for a
    // whole session; the owner replaced it with *"one single tap … as fork C1; one double tap
    // … as fork C2"*, so the reading is a property of EACH alignment — and the highlight
    // colours report which one, because nothing else could.
    expect(tapMeaning(ctx({ kind: "DOUBLE_TAP" }))).toEqual({ action: "ALIGN", mode: "FOLLOW" });
  });

  it("⭐⭐⭐ THE SAME GESTURE ON THE SAME FACE LETS GO; THE OTHER ONE SWITCHES MODE", () => {
    // ⭐ `D39`'s toggle-off is preserved, and the owner's *"a single tap can follow a double
    // tap … and therefore toggle to behaviors accordingly"* is the other half. ⛔ Together they
    // make each gesture its own toggle, which is why neither needs a mode to be remembered by
    // the hand: whatever you tap with is what you get.
    expect(tapMeaning(ctx({ pioneer: PIONEER, alignMode: "SNAPSHOT" })).action).toBe("UNALIGN");
    expect(tapMeaning(ctx({ kind: "DOUBLE_TAP", pioneer: PIONEER, alignMode: "FOLLOW" })).action).toBe(
      "UNALIGN",
    );
    expect(tapMeaning(ctx({ kind: "DOUBLE_TAP", pioneer: PIONEER, alignMode: "SNAPSHOT" }))).toEqual({
      action: "SWITCH",
      mode: "FOLLOW",
    });
    expect(tapMeaning(ctx({ pioneer: PIONEER, alignMode: "FOLLOW" }))).toEqual({
      action: "SWITCH",
      mode: "SNAPSHOT",
    });
  });

  it("⛔ a DIFFERENT face of the same Pioneer object still ALIGNS — and replaces", () => {
    // ⭐ The face is the whole test, not the object — otherwise re-aiming at the next face of
    // the same part would UNDO instead of re-aligning. ⚠ True for both gestures.
    const other = { objectId: "objectB", faceId: "-y" };
    expect(tapMeaning(ctx({ pioneer: other, alignMode: "SNAPSHOT" }))).toEqual({
      action: "ALIGN",
      mode: "SNAPSHOT",
    });
    expect(
      tapMeaning(ctx({ kind: "DOUBLE_TAP", pioneer: other, alignMode: "FOLLOW" })),
    ).toEqual({ action: "ALIGN", mode: "FOLLOW" });
  });

  it("⚠ an unresolved face cannot act on an alignment — `null` must not match a face", () => {
    // ⛔ A grazing pick that resolves no face would otherwise compare `null === null` if this
    // were written carelessly, and a tap that hit nothing would destroy an alignment.
    expect(tapMeaning(ctx({ tappedFace: null, pioneer: PIONEER, alignMode: "SNAPSHOT" }))).toEqual({
      action: "ALIGN",
      mode: "SNAPSHOT",
    });
  });

  it("✅✅ THE MOVEMENT MODE NO LONGER GATES IT — owner, 2026-09-17", () => {
    // ⛔⛔ THIS VECTOR ASSERTED THE OPPOSITE, and I had called the condition *load-bearing*:
    // *"in TRANSLATE the same tap must still toggle — otherwise the only way back to ROTATE
    // is gone."* ⭐ The requirement was real and my condition was OVER-BROAD: what keeps
    // `ROTATE` reachable is that a tap on **empty space or on the held object** still toggles,
    // which the vectors below assert. ⚠ Only a tap on ANOTHER object's face is claimed — a
    // far smaller claim than the one I was defending — and `TapContext` no longer carries the
    // movement mode at all, which is the strongest way to say the rule does not read it.
    // > *"In translation mode, a tap or a double tap on the second object PioneerFace also
    // > toggles the alignment logic (same as for rotation)."*
    expect(tapMeaning(ctx())).toEqual({ action: "ALIGN", mode: "SNAPSHOT" });
    expect(tapMeaning(ctx({ kind: "DOUBLE_TAP" }))).toEqual({ action: "ALIGN", mode: "FOLLOW" });
    expect(tapMeaning(ctx({ pioneer: PIONEER, alignMode: "SNAPSHOT" })).action).toBe("UNALIGN");
  });

  it("⛔ a tap with nothing held, or on empty space, or on the held object ⇒ TOGGLE", () => {
    for (const kind of ["TAP", "DOUBLE_TAP"] as const) {
      expect(tapMeaning(ctx({ kind, heldObject: null })).action).toBe("TOGGLE");
      expect(tapMeaning(ctx({ kind, tappedObject: null })).action).toBe("TOGGLE");
      // ⚠ A Pioneer and a Follower on ONE object is not a relation.
      expect(tapMeaning(ctx({ kind, tappedObject: "objectA" })).action).toBe("TOGGLE");
    }
  });

  it("⭐ `modeForTap` is the ONE place the gesture→mode mapping lives", () => {
    // ⛔ Two copies of it — one here, one in the scene — is how a single tap starts meaning
    // FOLLOW in one file and SNAPSHOT in another. `CONSTRAINTS` §4.
    expect(modeForTap("TAP")).toBe("SNAPSHOT");
    expect(modeForTap("DOUBLE_TAP")).toBe("FOLLOW");
  });
});

describe("⛔⛔ `D55` — THE PRESS TOGGLES THE MECHANISM **ON**, AND ONLY EVER ON", () => {
  const ctx = (over: Partial<PressContext> = {}): PressContext => ({
    pressedObject: "objectB",
    pressedFace: "+x",
    heldObjects: ["objectA"],
    pioneerOfHeld: null,
    pioneerOfPressed: null,
    alignModeOfHeld: null,
    completesDoubleTap: false,
    ...over,
  });
  // ⭐ The held body aligned to `objectB`'s `+x` — the fixture most of these vectors vary.
  const ON_B = { objectId: "objectB", faceId: "+x" } as const;

  it("⭐⭐⭐ a press on a SECOND object's face aligns immediately — no tap needed", () => {
    // ⛔ The owner's whole sentence: *"as soon as a second touch is pressed on second object
    // (= a tap or a continued press), the Pioneer - Follower mechanism toggles on."* ⚠ The
    // press knows nothing about what the touch will BECOME, which is the point — a continued
    // press that never releases must align just as a tap does.
    expect(pressMeaning(ctx())).toEqual({ action: "ALIGN", mode: "SNAPSHOT" });
  });

  it("⛔⛔ AND IT IS `SNAPSHOT`, BECAUSE A PRESS CANNOT KNOW THE TAP COUNT", () => {
    // ⭐⭐ THE MUTANT THIS KILLS IS `FOLLOW`. `D42` made the tap count choose the mode, and a
    // press precedes it — so guessing `FOLLOW` would spin a body the hand never aimed at,
    // while guessing `SNAPSHOT` only leaves it independent. ⚠ The double tap still REACHES
    // `FOLLOW`, through `tapMeaning`'s `SWITCH`, which the next vector pins as a composition.
    expect(pressMeaning(ctx()).mode).toBe("SNAPSHOT");
  });

  it("⭐⭐⭐ THE COMPOSITION: a DOUBLE TAP still ends on `FOLLOW`, in two steps", () => {
    // ⛔⛔ THIS IS THE VECTOR THAT MATTERS, and it is a COMPOSITION rather than a unit — the
    // audit's finding 4 and `A7`'s withdrawn report both say a chain nobody computed is where
    // this project's defects live. ⚠ Neither function below is changed by `D55`; what is new
    // is that they are now asked to run in sequence.
    const first = pressMeaning(ctx());
    expect(first).toEqual({ action: "ALIGN", mode: "SNAPSHOT" });

    // ⭐ press #2 lands on the face the alignment now names: the mechanism is already on, so
    // the press stands aside and leaves the meaning to the release.
    const second = pressMeaning(ctx({ pioneerOfHeld: ON_B }));
    expect(second.action).toBe("NOTHING");

    // ⭐ … and that release is a `DOUBLE_TAP` on the same face, which is a mode SWITCH.
    expect(
      tapMeaning({
        kind: "DOUBLE_TAP",
        alignMode: first.mode,
        tappedObject: "objectB",
        tappedFace: "+x",
        heldObject: "objectA",
        pioneer: { objectId: "objectB", faceId: "+x" },
      }),
    ).toEqual({ action: "SWITCH", mode: "FOLLOW" });
  });

  it("⛔⛔⛔ A PRESS NEVER **BREAKS** — *'to toggle off, the rule stays unchanged'*", () => {
    // ⭐⭐ THE ALIGNED FACE IS THE ONE SAFE HANDHOLD ON A PIONEER, and it is what keeps the
    // press from owning a meaning the owner did not give it: toggling OFF lives on the release.
    expect(pressMeaning(ctx({ pioneerOfHeld: ON_B })).action).toBe("NOTHING");
    // ⭐ A press on a THIRD body is a fresh relation and aligns — `D40`'s cap of one means it
    // REPLACES, which is the release's own long-standing behaviour.
    expect(pressMeaning(ctx({ pressedObject: "objectC", pioneerOfHeld: ON_B }))).toEqual({
      action: "ALIGN",
      mode: "SNAPSHOT",
    });
  });

  it("⛔⛔⛔ ALREADY RELATED **IN EITHER DIRECTION** — the defect the glass found in minutes", () => {
    // ⛔⛔ THIS VECTOR EXISTS BECAUSE THE FIRST VERSION OF `D55` SHIPPED WITHOUT IT, and the
    // tablet reported it inside ten minutes:
    //
    //   `align: objectA→objectB would cycle — broke objectB's own alignment instead`
    //
    // ⚠ With `A→B` live, picking the pair up in the OTHER order — hold `B`, press `A` — read
    // as a fresh relation, because only the held body's pioneer was consulted. `wouldCycle`
    // then did its job and destroyed the alignment the hand was holding. ⭐ Before `D55` that
    // needed a deliberate tap; a press turned it into an accident.
    //
    // ⭐⭐ `METHOD`: *a substituted quantity* — *"is the HELD body related to the pressed
    // one?"* stood in for *"are these two bodies related?"*, and those agree in one direction.
    expect(pressMeaning(ctx({ pioneerOfPressed: "objectA" })).action).toBe("NOTHING");
    // ⚠ And on any face of it, for the same reason the forward case refuses on any face.
    expect(pressMeaning(ctx({ pressedFace: "-z", pioneerOfPressed: "objectA" })).action).toBe(
      "NOTHING",
    );
    // ⭐ But a pressed body aligned to somebody ELSE is still a fresh relation for this pair —
    // the refusal is about *these two*, never about the pressed body being busy.
    expect(pressMeaning(ctx({ pioneerOfPressed: "objectC" }))).toEqual({
      action: "ALIGN",
      mode: "SNAPSHOT",
    });
  });

  it("⭐⭐⭐ `A22` — A TAP THEN A RAPID **PRESS-AND-HOLD** GOES ORANGE, WITHOUT A LIFT", () => {
    // ⛔⛔ THE OWNER'S QUESTION, and it was a gap rather than a design:
    //
    // > *"why a single tap followed by a rapid press (the equivalent of double tap where the
    // > final release is not done) doesn't trigger a switch to orange?"*
    //
    // ⭐ `D55` moved the ALIGN to the press and left the mode SWITCH on the release, where the
    // double-tap question is asked — so a second touch that never lifted never asked it.
    // ⚠ The whole sequence, as one composition:
    //
    //   press #1 on a fresh face  → ALIGN as SNAPSHOT (cyan)
    //   release #1                → spent
    //   press #2, same face, fast → SWITCH to FOLLOW (orange) — **with the finger still down**
    expect(pressMeaning(ctx())).toEqual({ action: "ALIGN", mode: "SNAPSHOT" });
    expect(
      pressMeaning(ctx({ pioneerOfHeld: ON_B, alignModeOfHeld: "SNAPSHOT", completesDoubleTap: true })),
    ).toEqual({ action: "SWITCH", mode: "FOLLOW" });
  });

  it("⛔⛔ BUT AN ORDINARY GRAB OF THE PIONEER MUST NOT RECOLOUR ANYTHING", () => {
    // ⚠⚠ THE REASON THE RULE IS NARROW. A plain press on the Pioneer's face is `D51`'s
    // two-handed posture — the commonest thing a hand does here. ⛔ If every grab switched the
    // mode, the Pioneer could not be picked up without flipping cyan↔amber under the fingers.
    // ⭐ `completesDoubleTap` is what separates *the second of a rapid pair* from *a grab*.
    expect(
      pressMeaning(ctx({ pioneerOfHeld: ON_B, alignModeOfHeld: "SNAPSHOT", completesDoubleTap: false })),
    ).toEqual({ action: "NOTHING", mode: null });
  });

  it("⛔⛔⛔ AND IT NEVER SWITCHES **BACK** — toggling off stays on the release, untouched", () => {
    // ⛔ `modeForTap("DOUBLE_TAP")` is `FOLLOW`, so a rapid pair onto an alignment that is
    // ALREADY `FOLLOW` is *the same gesture again* — which is `D39`'s toggle-OFF, and the owner
    // required that *"to toggle off, the rule stays unchanged."* ⚠ So the press stands aside
    // and `tapMeaning` gets the release, exactly as before.
    expect(
      pressMeaning(ctx({ pioneerOfHeld: ON_B, alignModeOfHeld: "FOLLOW", completesDoubleTap: true })),
    ).toEqual({ action: "NOTHING", mode: null });
    // ⭐ … and that release is where the UNALIGN lives. The composition, so the pair is read
    // together rather than each half being trusted on its own.
    expect(
      tapMeaning({
        kind: "DOUBLE_TAP",
        alignMode: "FOLLOW",
        tappedObject: "objectB",
        tappedFace: "+x",
        heldObject: "objectA",
        pioneer: { objectId: "objectB", faceId: "+x" },
      }).action,
    ).toBe("UNALIGN");
  });

  it("⭐⭐⭐ `A23` — A PRESS ON A **NEW FACE** OF THE CURRENT PIONEER RE-POINTS THE ALIGNMENT", () => {
    // ⛔⛔ THE OWNER, 2026-09-19:
    //
    // > *"currently, a tap on a new face on pioneer object triggers the switch to this new
    // > PioneerFace and new alignment of the Follower object: add a continued press to also
    // > trigger this switch"*
    //
    // ⭐ `D55` finishing its own sweep: *tap or continued press* now governs all three things a
    // press can do to an alignment — **make** it (`D55`), **upgrade** it (`A22`), **re-point**
    // it (`A23`) — while the two ways OUT stay on the release.
    //
    // ⚠⚠ IT REVERSES A GUARD THIS FILE ASSERTED TWO HOURS EARLIER, and the vector that held
    // the old rule went red rather than sliding — which is the whole reason it was written.
    expect(pressMeaning(ctx({ pressedFace: "-z", pioneerOfHeld: ON_B }))).toEqual({
      action: "ALIGN",
      mode: "SNAPSHOT",
    });
    // ⛔ `SNAPSHOT`, not the mode it had: a press cannot know the tap count, and this is
    // exactly what a single TAP on a new face has always produced — `modeForTap("TAP")`.
    // ⚠ So re-pointing a `FOLLOW` alignment lands it on `SNAPSHOT`, at the press and at the
    // release alike. The two paths agree, which is the claim worth pinning.
    expect(pressMeaning(ctx({ pressedFace: "-z", pioneerOfHeld: ON_B, alignModeOfHeld: "FOLLOW" })).mode)
      .toBe("SNAPSHOT");
    expect(
      tapMeaning({
        kind: "TAP",
        alignMode: "FOLLOW",
        tappedObject: "objectB",
        tappedFace: "-z",
        heldObject: "objectA",
        pioneer: { objectId: "objectB", faceId: "+x" },
      }),
    ).toEqual({ action: "ALIGN", mode: "SNAPSHOT" });
  });

  it("⚠⚠ … AND THE COST: only the ALIGNED face is still a safe handhold on the Pioneer", () => {
    // ⛔ Stated as a vector because it is the price of `A23` and a hand will meet it: with
    // `D51` making a finger on the Pioneer the ordinary posture, grabbing it anywhere but its
    // aligned face now re-points the relation onto whatever is under the finger.
    // ⭐ Recoverable in one gesture — unlike the destroyed alignment this behaviour replaced.
    expect(pressMeaning(ctx({ pioneerOfHeld: ON_B })).action).toBe("NOTHING");
    expect(pressMeaning(ctx({ pressedFace: "-z", pioneerOfHeld: ON_B })).action).toBe("ALIGN");
  });

  it("⛔⛔ BUT THE REVERSE DIRECTION IS STILL REFUSED — `A23` does not relax the cycle guard", () => {
    // ⚠ Here the PRESSED body follows the HELD one, so held→pressed would close a cycle. That
    // is the defect the glass found in minutes, and it is a different question from re-pointing:
    // a hand may re-aim its own Pioneer, but this configuration has no valid alignment to make.
    expect(pressMeaning(ctx({ pioneerOfPressed: "objectA" })).action).toBe("NOTHING");
    expect(pressMeaning(ctx({ pressedFace: "-z", pioneerOfPressed: "objectA" })).action).toBe(
      "NOTHING",
    );
  });

  it("⛔ nothing held, two bodies held, the SAME body, or no face — all refuse", () => {
    // ⚠ Nothing held is the FIRST press of every gesture in the game, so this branch is the
    // common one, not the exotic one.
    expect(pressMeaning(ctx({ heldObjects: [] })).action).toBe("NOTHING");
    // ⛔ Two held bodies: *which* is the Follower has no answer worth trusting — the same
    // refusal `alignFollowerToPioneer` has always made, now made before it is called.
    expect(pressMeaning(ctx({ heldObjects: ["objectA", "objectC"] })).action).toBe("NOTHING");
    // ⚠ A press on the body already held is `SECOND`'s configuration; a Pioneer and a
    // Follower on ONE body is not a relation.
    expect(pressMeaning(ctx({ pressedObject: "objectA" })).action).toBe("NOTHING");
    // ⛔ No face resolved → silence, never a stand-in face.
    expect(pressMeaning(ctx({ pressedFace: null })).action).toBe("NOTHING");
    expect(pressMeaning(ctx({ pressedObject: null })).action).toBe("NOTHING");
  });

  it("⚠ a press NEVER returns `TOGGLE` — the movement mode is a RELEASE's business", () => {
    // ⛔ `D28` flips translate/rotate on a tap RELEASE. If a press could return `TOGGLE` the
    // caller would flip the mode on the way down AND on the way up.
    for (const over of [
      {},
      { heldObjects: [] as string[] },
      { pressedFace: null },
      { pioneerOfHeld: ON_B },
      { pressedObject: "objectA" },
    ]) {
      expect(pressMeaning(ctx(over)).action).not.toBe("TOGGLE");
    }
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
      expect(v).toBeCloseTo(r.pioneerWorld[i]!, 8),
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

  it("⭐⭐⭐ C2's delta keeps the two faces PARALLEL — the composition, not the claim", () => {
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
    followerNormal.forEach((v, i) => expect(v).toBeCloseTo(pioneerNormal[i]!, 10));
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

    // ✅ the world delta — what `pioneerTurned` returns — is EXACT
    expect(after(pioneerTurned(pBefore, pNow, "FOLLOW").delta!)).toBeCloseTo(1, 10);
    // ⛔ the object-frame delta leaves the faces nearly opposite
    expect(after(qmul(qconj(pBefore), pNow))).toBeLessThan(0);
  });

  it("⛔⛔ THE MODE COMES FROM THE GESTURE NOW — there is no flag to read", () => {
    // ⭐ `pioneerTurnRuleOf` and `?pioneerTurnRule` lived for a few hours on 2026-09-17. The
    // owner replaced the SETTING with the GESTURE, which is better than a flag in the way that
    // matters: two alignments can differ, and a hand can see which is which from the colours
    // rather than remembering what a slider was left on.
    expect(modeForTap("TAP")).toBe("SNAPSHOT");
    expect(modeForTap("DOUBLE_TAP")).toBe("FOLLOW");
  });

  it("⭐ retargeting rewrites the DIRECTION and nothing else about the constraint", () => {
    // ⚠ §1.4's doctrine survives: the constraint still holds a WORLD direction, so a camera
    // orbit still cannot redefine it. ⛔ What C2 changes is only where that direction is
    // re-read from, every frame — the face it was taken from.
    const c = faceAlignConstraint([0, 0, 1], [0, 1, 0]);
    const r = retargetAlignment(c, [1, 0, 0]);
    expect(r.targetWorld).toEqual([1, 0, 0]);
    expect(r.kind).toBe(c.kind);
    expect(r.localNormal).toEqual(c.localNormal);
  });
});
