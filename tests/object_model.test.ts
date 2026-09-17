/**
 * `3D1` — THE OBJECT MODEL, and the composition it is built on.
 *
 * ⛔⛔ THIS FILE WAS WRITTEN BEFORE `src/core/object_model.ts`, deliberately.
 * `QUEUE.md` names `3D1` as the likeliest recurrence of MISTAKE SHAPE 4 — *a
 * composition nobody computed* — because an assembly tree composes transforms through
 * parent-child chains, and that is what cost the predecessor a from-scratch rebuild:
 * its rotation stack was defensible at every layer and a REFLECTION as a whole.
 *
 * ⭐⭐ SO THE PROPERTIES COME FIRST, AND THEY ARE PROPERTIES OF THE WHOLE CHAIN, not
 * of a layer: a round trip, a closure, and an invariant that must survive re-rooting.
 *
 * ⭐⭐ AND EVERY ONE OF THEM CARRIES ITS COUNTER-EXAMPLE. `METHOD`: *a test that cannot
 * FAIL is not a test.* The three natural wrong implementations are written out below as
 * `naiveX`, and each is asserted to FAIL the property it violates. That is what makes
 * the passing assertions mean something — a suite that only ever sees the right answer
 * cannot tell you it would have caught the wrong one.
 *
 * ⛔ THREE DEEP, NOT TWO, FROM THE FIRST FIXTURE. `3D5` is the carried-unclosed risk
 * that *the tree has never held more than two objects*, and two is exactly the depth at
 * which parent and root coincide often enough to hide a confusion between them.
 */
import { describe, expect, it } from "vitest";
import {
  IDENTITY,
  add,
  canon,
  qFromAxisAngle,
  qRotate,
  qconj,
  qmul,
  type Quat,
  type Vec3,
} from "../src/core/vec";
import type { Placed } from "../src/core/mate_connector";
import { worldPose } from "../src/core/mate_connector";
import {
  MAX_TREE_DEPTH,
  attach,
  composePlacement,
  detach,
  faceWorld,
  invertPlacement,
  makeWorld,
  connectorWorldPose,
  pushObjectConstraint,
  clearObjectConstraints,
  reroot,
  setWorldPlacement,
  worldPlacementOf,
  type SceneObject,
} from "../src/core/object_model";

// ── helpers ────────────────────────────────────────────────────────────────────

const TOL = 1e-9;

function expectVec(actual: Vec3, expected: Vec3, tol = TOL): void {
  for (let i = 0; i < 3; i++) expect(actual[i]!).toBeCloseTo(expected[i]!, Math.round(-Math.log10(tol)));
}

function expectQuat(actual: Quat, expected: Quat, tol = TOL): void {
  const a = canon(actual);
  const b = canon(expected);
  for (let i = 0; i < 4; i++) expect(a[i]!).toBeCloseTo(b[i]!, Math.round(-Math.log10(tol)));
}

function expectPlaced(actual: Placed, expected: Placed, tol = TOL): void {
  expectVec(actual.position, expected.position, tol);
  expectQuat(actual.orientation, expected.orientation, tol);
}

const rot = (axis: Vec3, deg: number): Quat => qFromAxisAngle(axis, (deg * Math.PI) / 180);

const placed = (position: Vec3, orientation: Quat = IDENTITY): Placed => ({ position, orientation });

/** A bare object with no faces or connectors. */
function obj(
  id: string,
  local: Placed,
  parent: string | null = null,
  extra: Partial<SceneObject> = {},
): SceneObject {
  return {
    id,
    local,
    parent,
    faces: [],
    connectors: [],
    constraints: [],
    ...extra,
  };
}

/**
 * ⭐ THE THREE-DEEP FIXTURE, and every pose is a rotation AND a translation.
 *
 * ⛔ A fixture with pure translations cannot see a composition-order error at all: two
 * translations commute. A fixture with rotations about ONE axis cannot see it either.
 * `METHOD`: *an invariant tested on one axis is not tested.* Three different axes.
 */
function chainOfThree() {
  const root = obj("root", placed([1, 2, 3], rot([0, 1, 0], 30)));
  const mid = obj("mid", placed([0.4, -0.2, 0.1], rot([1, 0, 0], 40)), "root");
  const leaf = obj("leaf", placed([-0.3, 0.5, 0.25], rot([0, 0, 1], 50)), "mid");
  return { world: makeWorld([root, mid, leaf]), root, mid, leaf };
}

// ── the counter-examples: the three natural wrong compositions ─────────────────

/** ⛔ WRONG: child applied before parent. The classic order flip. */
function naiveReversedOrder(parent: Placed, child: Placed): Placed {
  return {
    position: add(child.position, qRotate(child.orientation, parent.position)),
    orientation: qmul(child.orientation, parent.orientation),
  };
}

/** ⛔ WRONG: the child's offset is not rotated into the parent's frame. */
function naiveUnrotatedOffset(parent: Placed, child: Placed): Placed {
  return {
    position: add(parent.position, child.position),
    orientation: qmul(parent.orientation, child.orientation),
  };
}

/** ⛔ WRONG: inverse forgets to rotate the negated offset. */
function naiveInverse(p: Placed): Placed {
  return { position: [-p.position[0], -p.position[1], -p.position[2]], orientation: qconj(p.orientation) };
}

// ══════════════════════════════════════════════════════════════════════════════

describe("composePlacement — the one expression the whole tree is built from", () => {
  it("composes a parent and a child into the parent's frame", () => {
    const parent = placed([1, 0, 0], rot([0, 1, 0], 90));
    const child = placed([0, 0, 1], IDENTITY);
    // The child sits 1 along local +z; the parent's 90° yaw about +y maps +z onto +x.
    expectPlaced(composePlacement(parent, child), placed([2, 0, 0], rot([0, 1, 0], 90)));
  });

  it("is ASSOCIATIVE — which is what makes re-rooting possible at all", () => {
    const a = placed([1, 2, 3], rot([0, 1, 0], 30));
    const b = placed([0.4, -0.2, 0.1], rot([1, 0, 0], 40));
    const c = placed([-0.3, 0.5, 0.25], rot([0, 0, 1], 50));
    expectPlaced(composePlacement(composePlacement(a, b), c), composePlacement(a, composePlacement(b, c)));
  });

  it("has identity as its neutral element, on both sides", () => {
    const p = placed([1, -2, 0.5], rot([1, 1, 0], 73));
    expectPlaced(composePlacement(p, placed([0, 0, 0], IDENTITY)), p);
    expectPlaced(composePlacement(placed([0, 0, 0], IDENTITY), p), p);
  });

  it("⛔ COUNTER-EXAMPLE: the reversed order is NOT associative-equivalent — it differs", () => {
    const parent = placed([1, 0, 0], rot([0, 1, 0], 90));
    const child = placed([0, 0, 1], IDENTITY);
    const right = composePlacement(parent, child);
    const wrong = naiveReversedOrder(parent, child);
    expect(right.position).not.toEqual(wrong.position);
  });

  it("⛔ COUNTER-EXAMPLE: an unrotated offset agrees when the parent has no rotation, and DIVERGES when it does", () => {
    const child = placed([0, 0, 1], IDENTITY);
    // Agrees: this is why a fixture with an unrotated parent certifies a broken build.
    const flat = placed([1, 0, 0], IDENTITY);
    expectPlaced(composePlacement(flat, child), naiveUnrotatedOffset(flat, child));
    // Diverges: the same check with a turned parent.
    const turned = placed([1, 0, 0], rot([0, 1, 0], 90));
    expect(composePlacement(turned, child).position).not.toEqual(naiveUnrotatedOffset(turned, child).position);
  });
});

describe("invertPlacement — the round trip", () => {
  it("compose(p, invert(p)) is the identity placement", () => {
    const p = placed([1.5, -0.25, 3], rot([0.3, 0.9, -0.2], 117));
    expectPlaced(composePlacement(p, invertPlacement(p)), placed([0, 0, 0], IDENTITY));
  });

  it("compose(invert(p), p) is the identity placement — both sides, not one", () => {
    const p = placed([1.5, -0.25, 3], rot([0.3, 0.9, -0.2], 117));
    expectPlaced(composePlacement(invertPlacement(p), p), placed([0, 0, 0], IDENTITY));
  });

  it("is an involution: invert(invert(p)) === p", () => {
    const p = placed([-2, 0.75, 1], rot([1, 0, 1], 44));
    expectPlaced(invertPlacement(invertPlacement(p)), p);
  });

  it("⛔ COUNTER-EXAMPLE: the un-rotated inverse fails the round trip whenever there is a rotation", () => {
    const p = placed([1.5, -0.25, 3], rot([0, 1, 0], 90));
    const bad = composePlacement(p, naiveInverse(p));
    expect(Math.hypot(...bad.position)).toBeGreaterThan(0.5);
  });
});

describe("worldPlacementOf — the chain, computed independently", () => {
  it("a three-deep chain matches the composition written out by hand", () => {
    const { world, root, mid, leaf } = chainOfThree();
    const byHand = composePlacement(composePlacement(root.local, mid.local), leaf.local);
    expectPlaced(worldPlacementOf(world, "leaf")!, byHand);
  });

  it("the root's world placement is its own local placement", () => {
    const { world, root } = chainOfThree();
    expectPlaced(worldPlacementOf(world, "root")!, root.local);
  });

  it("a connector on a LEAF lands where the composed chain puts it", () => {
    const { root, mid, leaf } = chainOfThree();
    const connector = {
      id: "c1",
      position: [0.1, 0.2, -0.05] as Vec3,
      normal: [0, 0, 1] as Vec3,
      tangent: [1, 0, 0] as Vec3,
      rollOrder: 4,
      radius: 0.01,
      kind: "stud",
    };
    const w = makeWorld([root, mid, { ...leaf, connectors: [connector] }]);
    const chainPose = composePlacement(composePlacement(root.local, mid.local), leaf.local);
    const expected = worldPose(connector, chainPose);
    const actual = connectorWorldPose(w, "leaf", "c1")!;
    expectVec(actual.position, expected.position);
    expectVec(actual.normal, expected.normal);
    expectVec(actual.tangent, expected.tangent);
  });

  it("a FACE CENTRE on a leaf composes through the chain — this is what 6bis reads", () => {
    const { root, mid, leaf } = chainOfThree();
    const face = { id: "top", centre: [0, 0.5, 0] as Vec3, normal: [0, 1, 0] as Vec3 };
    const w = makeWorld([root, mid, { ...leaf, faces: [face] }]);
    const chainPose = composePlacement(composePlacement(root.local, mid.local), leaf.local);
    const expected = add(chainPose.position, qRotate(chainPose.orientation, face.centre));
    expectVec(faceWorld(w, "leaf", "top")!.centre, expected);
  });

  it("the quaternion stays UNIT through a deep chain — closure, not drift", () => {
    let world = makeWorld([obj("n0", placed([0.1, 0, 0], rot([1, 2, 3], 37)))]);
    for (let i = 1; i < MAX_TREE_DEPTH; i++) {
      world = attach(
        makeWorld([...world.objects.values(), obj(`n${i}`, placed([0.1, 0, 0], rot([1, 2, 3], 37)))]),
        `n${i}`,
        `n${i - 1}`,
      );
    }
    const q = worldPlacementOf(world, `n${MAX_TREE_DEPTH - 1}`)!.orientation;
    expect(Math.hypot(...q)).toBeCloseTo(1, 12);
  });

  it("⛔ returns null for an unknown id — SUPPRESS, DO NOT GUESS. Never an identity placement", () => {
    const { world } = chainOfThree();
    expect(worldPlacementOf(world, "nobody")).toBeNull();
  });

  it("⛔ returns null on a CYCLE instead of hanging", () => {
    const a = obj("a", placed([1, 0, 0]), "b");
    const b = obj("b", placed([0, 1, 0]), "a");
    expect(worldPlacementOf(makeWorld([a, b]), "a")).toBeNull();
  });

  it("⛔ returns null past MAX_TREE_DEPTH rather than walking forever", () => {
    const objects: SceneObject[] = [obj("n0", placed([0.1, 0, 0]))];
    for (let i = 1; i <= MAX_TREE_DEPTH + 1; i++) {
      objects.push(obj(`n${i}`, placed([0.1, 0, 0]), `n${i - 1}`));
    }
    const world = makeWorld(objects);
    expect(worldPlacementOf(world, `n${MAX_TREE_DEPTH + 1}`)).toBeNull();
  });
});

describe("⭐⭐ reroot — PARENT ≠ ROOT, the invariant the predecessor paid for", () => {
  it("preserves the WORLD PLACEMENT OF EVERY OBJECT — the whole-chain property", () => {
    const { world } = chainOfThree();
    const before = new Map([...world.objects.keys()].map((id) => [id, worldPlacementOf(world, id)!]));
    const after = reroot(world, "leaf");
    for (const [id, was] of before) expectPlaced(worldPlacementOf(after, id)!, was);
  });

  it("makes the named object the root, with no parent", () => {
    const { world } = chainOfThree();
    const after = reroot(world, "leaf");
    expect(after.objects.get("leaf")!.parent).toBeNull();
    expect(after.objects.get("mid")!.parent).toBe("leaf");
    expect(after.objects.get("root")!.parent).toBe("mid");
  });

  it("re-rooting the object that is ALREADY the root changes nothing", () => {
    const { world } = chainOfThree();
    const after = reroot(world, "root");
    for (const id of world.objects.keys()) {
      expectPlaced(worldPlacementOf(after, id)!, worldPlacementOf(world, id)!);
      expect(after.objects.get(id)!.parent).toBe(world.objects.get(id)!.parent);
    }
  });

  it("re-rooting TWICE, to a different object each time, still preserves every world placement", () => {
    const { world } = chainOfThree();
    const before = new Map([...world.objects.keys()].map((id) => [id, worldPlacementOf(world, id)!]));
    const after = reroot(reroot(world, "leaf"), "mid");
    for (const [id, was] of before) expectPlaced(worldPlacementOf(after, id)!, was);
  });

  it("leaves a SIBLING's world placement untouched — it is not on the re-rooted path", () => {
    const { root, mid, leaf } = chainOfThree();
    const sibling = obj("sib", placed([0.9, 0.1, -0.4], rot([1, 1, 1], 25)), "mid");
    const world = makeWorld([root, mid, leaf, sibling]);
    const was = worldPlacementOf(world, "sib")!;
    expectPlaced(worldPlacementOf(reroot(world, "leaf"), "sib")!, was);
    expect(reroot(world, "leaf").objects.get("sib")!.parent).toBe("mid");
  });

  it("⛔⛔ GRABBING A CHILD MOVES THE WHOLE ASSEMBLY — the failure the glossary names", () => {
    const { world } = chainOfThree();
    const rootWas = worldPlacementOf(world, "root")!;
    const leafWas = worldPlacementOf(world, "leaf")!;

    // Hold the leaf: re-root onto it, then drive its world placement, as a grab does.
    const held = reroot(world, "leaf");
    const delta: Vec3 = [0.5, 0, 0];
    const moved = setWorldPlacement(held, "leaf", {
      position: add(leafWas.position, delta),
      orientation: leafWas.orientation,
    });

    // The leaf went where it was put…
    expectVec(worldPlacementOf(moved, "leaf")!.position, add(leafWas.position, delta));
    // …and the former PARENT came with it, by the same delta. "Grabbing a child moves
    // nothing" is the defect this asserts against.
    expectVec(worldPlacementOf(moved, "root")!.position, add(rootWas.position, delta));
    expectQuat(worldPlacementOf(moved, "root")!.orientation, rootWas.orientation);
  });

  it("a ROTATION applied to a held child swings the parent about the child, not about itself", () => {
    const { world } = chainOfThree();
    const leafWas = worldPlacementOf(world, "leaf")!;
    const rootWas = worldPlacementOf(world, "root")!;
    const held = reroot(world, "leaf");
    const spin = rot([0, 1, 0], 90);
    const moved = setWorldPlacement(held, "leaf", {
      position: leafWas.position,
      orientation: qmul(spin, leafWas.orientation),
    });
    // The parent's offset FROM THE PIVOT is rotated by the same amount.
    const offsetWas: Vec3 = [
      rootWas.position[0] - leafWas.position[0],
      rootWas.position[1] - leafWas.position[1],
      rootWas.position[2] - leafWas.position[2],
    ];
    expectVec(worldPlacementOf(moved, "root")!.position, add(leafWas.position, qRotate(spin, offsetWas)));
  });

  it("⛔ returns the world unchanged for an unknown id rather than corrupting the tree", () => {
    const { world } = chainOfThree();
    expect(reroot(world, "nobody")).toBe(world);
  });
});

describe("attach / detach — parenting preserves the world pose", () => {
  it("attaching a free object to a parent does not move it", () => {
    const parent = obj("p", placed([1, 0, 0], rot([0, 1, 0], 60)));
    const free = obj("f", placed([0, 2, 0], rot([1, 0, 0], 20)));
    const world = makeWorld([parent, free]);
    const was = worldPlacementOf(world, "f")!;
    expectPlaced(worldPlacementOf(attach(world, "f", "p"), "f")!, was);
  });

  it("detaching does not move it either — and clears the parent", () => {
    const { world } = chainOfThree();
    const was = worldPlacementOf(world, "leaf")!;
    const after = detach(world, "leaf");
    expect(after.objects.get("leaf")!.parent).toBeNull();
    expectPlaced(worldPlacementOf(after, "leaf")!, was);
  });

  it("attach then detach is a round trip on the world placement", () => {
    const parent = obj("p", placed([1, 0, 0], rot([0, 1, 0], 60)));
    const free = obj("f", placed([0, 2, 0], rot([1, 0, 0], 20)));
    const world = makeWorld([parent, free]);
    const was = worldPlacementOf(world, "f")!;
    expectPlaced(worldPlacementOf(detach(attach(world, "f", "p"), "f"), "f")!, was);
  });

  it("⛔ refuses an attachment that would create a cycle, returning the world unchanged", () => {
    const { world } = chainOfThree();
    // "root" is an ancestor of "leaf"; parenting root TO leaf closes the loop.
    expect(attach(world, "root", "leaf")).toBe(world);
  });

  it("⛔ refuses to attach an object to itself", () => {
    const { world } = chainOfThree();
    expect(attach(world, "mid", "mid")).toBe(world);
  });

  it("⛔ refuses an attachment that would exceed MAX_TREE_DEPTH", () => {
    const objects: SceneObject[] = [obj("n0", placed([0.1, 0, 0]))];
    for (let i = 1; i < MAX_TREE_DEPTH; i++) objects.push(obj(`n${i}`, placed([0.1, 0, 0]), `n${i - 1}`));
    objects.push(obj("extra", placed([0, 0, 0])));
    const world = makeWorld(objects);
    expect(attach(world, "extra", `n${MAX_TREE_DEPTH - 1}`)).toBe(world);
  });
});

describe("setWorldPlacement", () => {
  it("puts a ROOT object exactly where it is asked to go", () => {
    const { world } = chainOfThree();
    const target = placed([9, -1, 2], rot([0, 0, 1], 15));
    expectPlaced(worldPlacementOf(setWorldPlacement(world, "root", target), "root")!, target);
  });

  it("puts a PARENTED object exactly where it is asked to go, by recomputing its local", () => {
    const { world } = chainOfThree();
    const target = placed([9, -1, 2], rot([0, 0, 1], 15));
    const after = setWorldPlacement(world, "mid", target);
    expectPlaced(worldPlacementOf(after, "mid")!, target);
    expect(after.objects.get("mid")!.parent).toBe("root");
  });

  it("moving a PARENT carries its children with it", () => {
    const { world } = chainOfThree();
    const leafWas = worldPlacementOf(world, "leaf")!;
    const rootWas = worldPlacementOf(world, "root")!;
    const delta: Vec3 = [0, 0, 1.25];
    const after = setWorldPlacement(world, "root", {
      position: add(rootWas.position, delta),
      orientation: rootWas.orientation,
    });
    expectVec(worldPlacementOf(after, "leaf")!.position, add(leafWas.position, delta));
  });

  it("⛔ returns the world unchanged for an unknown id", () => {
    const { world } = chainOfThree();
    expect(setWorldPlacement(world, "nobody", placed([0, 0, 0]))).toBe(world);
  });
});

describe("the constraint stack, attached to an object", () => {
  const anchor = {
    kind: "GRAVITY_ALIGN" as const,
    localNormal: [0, 1, 0] as Vec3,
    targetWorld: [0, -1, 0] as Vec3,
  };

  it("starts empty — spec §0's Start condition", () => {
    const { world } = chainOfThree();
    expect(world.objects.get("leaf")!.constraints).toEqual([]);
  });

  it("appends NEWEST LAST, so an existing anchor stays older and therefore HARD", () => {
    const { world } = chainOfThree();
    const axis = { kind: "WORLD_AXIS_ALIGN" as const, localNormal: [1, 0, 0] as Vec3, targetWorld: [1, 0, 0] as Vec3 };
    const after = pushObjectConstraint(pushObjectConstraint(world, "leaf", anchor, false), "leaf", axis, false);
    expect(after.objects.get("leaf")!.constraints.map((c) => c.kind)).toEqual(["GRAVITY_ALIGN", "WORLD_AXIS_ALIGN"]);
  });

  it("a constraint pushed on one object does not appear on another", () => {
    const { world } = chainOfThree();
    const after = pushObjectConstraint(world, "leaf", anchor, false);
    expect(after.objects.get("mid")!.constraints).toEqual([]);
  });

  it("clearing empties that object's stack only — spec §2septies", () => {
    const { world } = chainOfThree();
    const both = pushObjectConstraint(pushObjectConstraint(world, "leaf", anchor, false), "mid", anchor, false);
    const after = clearObjectConstraints(both, "leaf");
    expect(after.objects.get("leaf")!.constraints).toEqual([]);
    expect(after.objects.get("mid")!.constraints).toHaveLength(1);
  });

  it("⛔ re-rooting does NOT disturb the stacks — they are per-object state, not tree state", () => {
    const { world } = chainOfThree();
    const withStack = pushObjectConstraint(world, "root", anchor, false);
    expect(reroot(withStack, "leaf").objects.get("root")!.constraints).toHaveLength(1);
  });
});

describe("immutability — every operation returns a new world", () => {
  it("setWorldPlacement does not mutate the input", () => {
    const { world } = chainOfThree();
    const was = worldPlacementOf(world, "mid")!;
    setWorldPlacement(world, "mid", placed([9, 9, 9], IDENTITY));
    expectPlaced(worldPlacementOf(world, "mid")!, was);
  });

  it("reroot does not mutate the input", () => {
    const { world } = chainOfThree();
    reroot(world, "leaf");
    expect(world.objects.get("leaf")!.parent).toBe("mid");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ `FROZEN` — the transform cannot be modified and the body cannot be a follower.
// The owner, 2026-09-17, for the base plate.
//
// ⛔⛔ ENFORCED AT THE TWO WRITERS, which is the whole design. A dozen things move an object —
// rule 6, depth, the approach, a snap, the sway, an alignment slerp, a FOLLOW cascade — and
// asking each of them to check a flag means the next one added will not.
// ══════════════════════════════════════════════════════════════════════════════
describe("⛔⛔ frozen — an invariant at the writers, not a rule at the call sites", () => {
  const plate = (frozen: boolean): SceneObject => ({
    id: "plate",
    local: { position: [0, -0.24, 0], orientation: IDENTITY },
    parent: null,
    faces: [{ id: "+y", centre: [0, 0.012, 0], normal: [0, 1, 0] }],
    connectors: [],
    constraints: [],
    frozen,
  });

  it("⛔⛔⛔ A FROZEN BODY CANNOT BE MOVED, and the world comes back UNCHANGED", () => {
    // ⭐ Unchanged rather than thrown: this runs inside a render loop, and a throw would take
    // the scene down for a finger resting on the base plate.
    const w = makeWorld([plate(true)]);
    const after = setWorldPlacement(w, "plate", {
      position: [1, 1, 1],
      orientation: qFromAxisAngle([0, 1, 0], 1),
    });
    expect(worldPlacementOf(after, "plate")!.position).toEqual([0, -0.24, 0]);
    expect(worldPlacementOf(after, "plate")!.orientation).toEqual(IDENTITY);
  });

  it("⭐ and the SAME body unfrozen moves normally — so the guard is what stops it", () => {
    // ⛔ Without this, the vector above would also pass for a `setWorldPlacement` that was
    // simply broken. ⚠ The only difference between the two cases is the attribute.
    const w = makeWorld([plate(false)]);
    const after = setWorldPlacement(w, "plate", { position: [1, 1, 1], orientation: IDENTITY });
    expect(worldPlacementOf(after, "plate")!.position).toEqual([1, 1, 1]);
  });

  it("⛔⛔ A FROZEN BODY CANNOT BE A FOLLOWER — the constraint push is refused", () => {
    // ⭐⭐ NOT a second feature: a constraint is what would MOVE it. An alignment's solve, a
    // FOLLOW cascade and a mate all read the stack and write a pose, so refusing the stack
    // closes the same guarantee through the other door.
    const w = makeWorld([plate(true)]);
    const after = pushObjectConstraint(
      w,
      "plate",
      { kind: "FACE_ALIGN", localNormal: [0, 1, 0], targetWorld: [1, 0, 0] },
      false,
    );
    expect(after.objects.get("plate")!.constraints).toEqual([]);
  });

  it("⭐ an unfrozen body accepts the same constraint", () => {
    const w = makeWorld([plate(false)]);
    const after = pushObjectConstraint(
      w,
      "plate",
      { kind: "FACE_ALIGN", localNormal: [0, 1, 0], targetWorld: [1, 0, 0] },
      false,
    );
    expect(after.objects.get("plate")!.constraints.length).toBe(1);
  });

  it("⚠ `frozen` is OPTIONAL and absent means free — every existing body is unaffected", () => {
    // ⛔ The attribute was added to a live model with 40+ vectors already green. ⚠ If absence
    // read as frozen, every object in the game would have stopped moving at once.
    const loose: SceneObject = { ...plate(false) };
    delete (loose as { frozen?: boolean }).frozen;
    const w = makeWorld([loose]);
    const after = setWorldPlacement(w, "plate", { position: [0.5, 0, 0], orientation: IDENTITY });
    expect(worldPlacementOf(after, "plate")!.position).toEqual([0.5, 0, 0]);
  });
});
