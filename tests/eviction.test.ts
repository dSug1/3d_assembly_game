/**
 * GOLDEN VECTORS — **EVICTION, AND THE ESCAPE IT IS.** `A4`/`D13`, and defect 41.
 *
 * ⛔⛔ **DEVICE-REPORTED, 2026-09-16: *"the second flick completely freezes the rotation."***
 * `IN3`'s 2ter/2quater were wired while 2sexte and eviction were not, so two alignments
 * filled §1.4's hard capacity and `dragRule` refused every rotation afterwards — with **no
 * gesture that recovers**. ⭐⭐ Shipping one half of a pair is not a partial feature, it is a
 * trap.
 *
 * ⭐⭐⭐ SO THE SUBJECT OF THIS FILE IS THE **COMPOSITION**, not the filter: *a hand that
 * shakes a frozen object can rotate it again.* `METHOD` — *a composition is a thing to
 * MEASURE, not an emergent property* — and this project has now paid for that sentence
 * three times (`A7`'s frame, `IN3`'s alignment chain, and defect 40, which sat one stage
 * upstream of a green composition test).
 *
 * ⚠ The stack half and the gesture half each already had vectors: `shake.test.ts` proves a
 * shake is recognised and a circle is not, `constraint_stack.test.ts` proves the DOF budget.
 * **What nothing asserted was that the two meet.**
 */
import { describe, expect, it } from "vitest";
import { evict, solve, type Constraint } from "../src/core/constraint_stack";
import {
  evictObjectConstraints,
  makeWorld,
  pushObjectConstraint,
  type SceneObject,
} from "../src/core/object_model";
import { dragRule, isDriven } from "../src/input/drag_rule";
import { ShakeDetector, type ShakeParams } from "../src/input/shake";
import type { Sample } from "../src/input/motion";
import { mmToPx } from "../src/core/units";
import { IDENTITY } from "../src/core/vec";

const NOISE_MM = 0.761; // ⭐ MEASURED, 2026-09-14.
const PARAMS: ShakeParams = { reversals: 2, windowMs: 600, legMm: 8, straightness: 0.4 };

const GRAVITY: Constraint = {
  kind: "GRAVITY_ALIGN",
  localNormal: [0, 0, 1],
  targetWorld: [0, 1, 0],
};
const AXIS: Constraint = {
  kind: "WORLD_AXIS_ALIGN",
  localNormal: [1, 0, 0],
  targetWorld: [1, 0, 0],
};
const MATE: Constraint = {
  kind: "MATE",
  localNormal: [0, 1, 0],
  targetWorld: [0, -1, 0],
  otherObjectId: "objectB",
};

const BOX: SceneObject = {
  id: "box",
  local: { position: [0, 0, 0], orientation: IDENTITY },
  parent: null,
  faces: [{ id: "+z", centre: [0, 0, 0.5], normal: [0, 0, 1] }],
  connectors: [],
  constraints: [],
};

/** A straight run in millimetres. ⚠ Integer steps — mistake shape 5 is my own fixtures. */
function leg(fromMm: number, toMm: number, steps: number, t0: number, stepMs: number): Sample[] {
  const out: Sample[] = [];
  for (let i = 1; i <= steps; i++) {
    out.push({ x: mmToPx(fromMm + ((toMm - fromMm) * i) / steps), y: 0, t: t0 + i * stepMs });
  }
  return out;
}

/** out → back → out. ⭐ The same path shape `shake.test.ts` uses, on purpose. */
function shakePath(ampMm: number, stepMs = 8): Sample[] {
  return [
    { x: 0, y: 0, t: 0 },
    ...leg(0, ampMm, 10, 0, stepMs),
    ...leg(ampMm, -ampMm, 20, 10 * stepMs, stepMs),
    ...leg(-ampMm, ampMm, 20, 30 * stepMs, stepMs),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ THE COMPOSITION — the reason this file exists
// ══════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ THE ESCAPE FROM A FULL STACK — the exact state defect 41 reported", () => {
  it("⭐⭐⭐ a frozen object is rotatable again after a shake, and that is the whole fix", () => {
    // The dead end, reached the way a hand reaches it: two flicks, two alignments.
    let world = makeWorld([BOX]);
    world = pushObjectConstraint(world, "box", GRAVITY, false);
    world = pushObjectConstraint(world, "box", AXIS, false);
    const frozen = world.objects.get("box")!.constraints;
    expect(dragRule("ROTATE", frozen)).toBe("ROTATE_REFUSED");
    expect(isDriven(dragRule("ROTATE", frozen))).toBe(false);

    // ⭐ The gesture, recognised by the SHIPPED detector rather than asserted into being.
    const d = new ShakeDetector(PARAMS, NOISE_MM);
    let fired = null as ReturnType<ShakeDetector["push"]>;
    for (const s of shakePath(12)) fired = d.push(s) ?? fired;
    expect(fired).not.toBeNull();

    const after = evictObjectConstraints(world, "box");
    expect(after.result.refused).toBe(false);
    expect(after.result.removed).toBe(2);
    // ⛔⛔ THE ASSERTION THE DEFECT ASKED FOR, in the words the report used.
    expect(dragRule("ROTATE", after.world.objects.get("box")!.constraints)).toBe("FREE_ROTATE");
    expect(isDriven(dragRule("ROTATE", after.world.objects.get("box")!.constraints))).toBe(true);
  });

  it("⛔ and it is REACHABLE from the refused state, not only from a driveable one", () => {
    // ⚠ The trap was that the escape had to work where nothing else did. A guard that only
    // fed the detector on a DRIVEN drag would leave the dead end exactly as it was — so the
    // vector states that the frozen stack is what the eviction is applied to.
    let world = makeWorld([BOX]);
    world = pushObjectConstraint(world, "box", GRAVITY, false);
    world = pushObjectConstraint(world, "box", AXIS, false);
    const stack = world.objects.get("box")!.constraints;
    // the object refuses to rotate, and the solver refuses the third entry too
    expect(solve([...stack, AXIS], IDENTITY, { evictOnOverflow: false }).rejected).toBe(true);
    expect(evict(stack).removed).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ⛔ WHAT EVICTION MUST NOT TAKE — `D13`, and it is the half a filter gets wrong
// ══════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ THE ALIGNMENTS GO, THE MATES STAY (`A4`/`D13`)", () => {
  it("⛔⛔ A MATE SURVIVES A SHAKE — an assembly relationship is not a gesture's decision", () => {
    // ⭐ This is the vector `cleared()` would fail: §2septies' original *"clears its
    // constraint stack"* predates mates being on it, and `D13` amended it for exactly this.
    const r = evict([GRAVITY, MATE, AXIS]);
    expect(r.stack).toEqual([MATE]);
    expect(r.removed).toBe(2);
    expect(r.refused).toBe(false);
  });

  it("⭐ several mates keep their ORDER — the stack is ordered, and eviction is not a resort", () => {
    const second: Constraint = { ...MATE, otherObjectId: "objectC" };
    const r = evict([MATE, GRAVITY, second]);
    expect(r.stack.map((c) => c.otherObjectId)).toEqual(["objectB", "objectC"]);
  });

  it("⛔⛔ A MATE-ONLY STACK REFUSES — *audibly*, which is the point of the flag", () => {
    // ⭐ `shake.ts`'s header states the contract: a mate-only stack *"must refuse AUDIBLY
    // rather than silently do nothing"*. ⚠ Without `refused`, a hand cannot tell *it did
    // not work* from *there was nothing to undo* — opposite situations, identical silence.
    const r = evict([MATE]);
    expect(r.removed).toBe(0);
    expect(r.refused).toBe(true);
    expect(r.stack).toEqual([MATE]);
  });

  it("⛔ AN EMPTY STACK REFUSES TOO — the commonest shake of all, over an unaligned object", () => {
    expect(evict([]).refused).toBe(true);
    expect(evict([]).removed).toBe(0);
  });

  it("⚠ pure: the input stack is not touched", () => {
    // ⭐ `METHOD`: the model is authoritative, and a core function that mutated its argument
    // would make `world` and the stack disagree about history.
    const input: readonly Constraint[] = [GRAVITY, MATE];
    evict(input);
    expect(input).toEqual([GRAVITY, MATE]);
  });
});

describe("⭐ eviction, attached to an object", () => {
  it("leaves every OTHER object alone", () => {
    const other: SceneObject = { ...BOX, id: "other" };
    let world = makeWorld([BOX, other]);
    world = pushObjectConstraint(world, "box", GRAVITY, false);
    world = pushObjectConstraint(world, "other", GRAVITY, false);
    const after = evictObjectConstraints(world, "box");
    expect(after.world.objects.get("box")!.constraints).toEqual([]);
    expect(after.world.objects.get("other")!.constraints).toEqual([GRAVITY]);
  });

  it("⛔ an unknown id REFUSES rather than throwing — the caller is a pointer handler", () => {
    const world = makeWorld([BOX]);
    const after = evictObjectConstraints(world, "not-an-object");
    expect(after.result.refused).toBe(true);
    expect(after.world).toBe(world);
  });

  it("⚠ the object's PLACEMENT is untouched — eviction removes rules, it does not move anything", () => {
    // ⛔⛔ The alternative reading would be *"put it back where it was before the alignment"*,
    // and it is wrong: §2septies removes the constraint, and the pose the user now sees is
    // the pose they aligned. ⭐ Stated as a vector so nobody re-derives the other answer.
    let world = makeWorld([BOX]);
    world = pushObjectConstraint(world, "box", GRAVITY, false);
    const before = world.objects.get("box")!.local;
    const after = evictObjectConstraints(world, "box");
    expect(after.world.objects.get("box")!.local).toEqual(before);
  });
});

describe("⛔⛔ THE FLICK SKIP — A4's owed half, and a shake is two flicks by construction", () => {
  it("✅ THE SKIP KEYS ON THE SHAKE HAVING FIRED — narrowed by a device report (`D33`)", () => {
    // ⛔⛔ WRITTEN AN HOUR EARLIER AS *"ONE reversal already suppresses the flick"*, on
    // `A4`'s own wording, and retracted the same day: *"the flick should be triggerable
    // during an ongoing rotation"* — and a rotate-then-flick IS a reversal. ⭐ The full
    // argument is in `shake.ts` and `tests/shake.test.ts`; what this file asserts is the
    // composition it cares about — an eviction and a flick cannot both land on one release.
    const d = new ShakeDetector(PARAMS, NOISE_MM);
    let fired = false;
    for (const s of shakePath(12)) fired = d.push(s) !== null || fired;
    expect(fired).toBe(true);
    expect(d.suppressesFlick).toBe(true);
  });

  it("⛔ a plain straight drag does NOT suppress a flick — the guard can fail", () => {
    // ⭐ `METHOD`: *a guard that cannot fail is not a guard.* If `suppressesFlick` were
    // simply true, every vector above would still pass and every alignment would stop
    // working.
    const d = new ShakeDetector(PARAMS, NOISE_MM);
    for (const s of leg(0, 40, 20, 0, 8)) d.push(s);
    expect(d.sawReversal).toBe(false);
    expect(d.suppressesFlick).toBe(false);
  });
});
