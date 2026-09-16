/**
 * GOLDEN VECTORS — `IN3`'s ALIGNMENT COMPOSITION, end to end.
 *
 * ⛔⛔ **DEVICE-REPORTED: *"the face does not point up at rotation flick."*** Every piece had
 * vectors — `alignFromFlick` builds the right constraint, `solve` returns the right swing,
 * `faceWorld` reports the right normal — and the CHAIN had none.
 *
 * ⭐⭐⭐ `METHOD`: *a composition is a thing to MEASURE, not an emergent property.* This is
 * the same file `a7_wiring.test.ts` is, for the same reason: the gravity frame's parts were
 * all green while *"a horizontal drag yaws about gravity"* had never been asserted.
 *
 * ⚠ So this walks the exact sequence `scene.ts` performs at a flick release —
 * **build the constraint → push → re-solve → apply** — and asserts the only thing a hand
 * cares about: **the selected face ends up pointing where it was flicked.**
 */
import { describe, expect, it } from "vitest";
import { alignFromFlick } from "@input/align_flick";
import type { Flick } from "@input/flick";
import { faceWorld, makeWorld, pushObjectConstraint, setWorldPlacement, type SceneObject } from "@core/object_model";
import { solve } from "@core/constraint_stack";
import { qFromAxisAngle, qmul, type Quat, type Vec3 } from "@core/vec";

const UP: Vec3 = [0, 1, 0];
const RIGHT: Vec3 = [1, 0, 0];

const BOX: SceneObject = {
  id: "box",
  local: { position: [0, 0, 0], orientation: [1, 0, 0, 0] },
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
};

const flickUp: Flick = {
  axis: "VERTICAL",
  sign: -1, // ⚠ screen y grows downward, so −1 is upward
  travelMm: 14,
  liftSpeedMmPerS: 500,
  purity: 0.96,
};

/**
 * ⭐⭐ THE SEQUENCE `scene.ts` RUNS, written out once so the composition is the subject.
 * ⛔ Deliberately NOT a helper shared with the product: `METHOD` — a harness that calls the
 * product's own path cannot disagree with it, and disagreement is what a vector is for.
 */
function flickAndSolve(orientation: Quat, faceId: string, flick: Flick) {
  let world = setWorldPlacement(makeWorld([BOX]), "box", { position: [0, 0, 0], orientation });
  const face = BOX.faces.find((f) => f.id === faceId)!;
  const c = alignFromFlick("ROTATE", flick, face.normal, UP, RIGHT);
  expect(c).not.toBeNull();
  world = pushObjectConstraint(world, "box", c!, false);
  const stack = world.objects.get("box")!.constraints;
  const solved = solve(stack, orientation, { evictOnOverflow: false });
  expect(solved.rejected).toBe(false);
  // ⛔ The order `scene.ts` uses: the solver returns a WORLD-space rotation to pre-multiply.
  world = setWorldPlacement(world, "box", {
    position: [0, 0, 0],
    orientation: qmul(solved.rotation, orientation),
  });
  return faceWorld(world, "box", faceId)!.normal;
}

describe("⛔⛔ A FLICK UP MUST LEAVE THE SELECTED FACE POINTING UP", () => {
  it("from the identity orientation", () => {
    const n = flickAndSolve([1, 0, 0, 0], "+x", flickUp);
    n.forEach((v, i) => expect(v).toBeCloseTo(UP[i]!, 10));
  });

  it("⭐ from an already-rotated object — the case a hand actually produces", () => {
    // ⚠ Nobody flicks a pristine cube: they turn it first, which is what the rotate mode is
    // for. ⛔ An orientation-handling error is invisible at the identity.
    const n = flickAndSolve(qFromAxisAngle([0.3, 0.8, -0.5], 1.1), "-z", flickUp);
    n.forEach((v, i) => expect(v).toBeCloseTo(UP[i]!, 10));
  });

  it("⭐ for EVERY face, from a rotated object", () => {
    // ⭐⭐ THE INVARIANT, AND IT IS THE WHOLE RULE: whichever face was selected, flicking up
    // points THAT face up. ⛔ A single-face test could pass on a coincidence of symmetry.
    const q = qFromAxisAngle([0.1, -0.4, 0.9], 2.2);
    for (const f of BOX.faces) {
      const n = flickAndSolve(q, f.id, flickUp);
      n.forEach((v, i) => expect(v).toBeCloseTo(UP[i]!, 10));
    }
  });

  it("⛔ a flick DOWN points it down — the sign, composed", () => {
    // ⭐ `METHOD`: a sign is not tested by any amount of testing the magnitude, and here the
    // sign survives two more stages (the constraint, then the solver) than the unit test saw.
    const n = flickAndSolve(qFromAxisAngle([0, 0, 1], 0.7), "+y", { ...flickUp, sign: 1 });
    n.forEach((v, i) => expect(v).toBeCloseTo([0, -1, 0][i]!, 10));
  });

  it("⭐ a HORIZONTAL flick points the face along the world axis it resolved", () => {
    const n = flickAndSolve(qFromAxisAngle([0.2, 0.9, 0.3], 1.4), "+z", {
      ...flickUp,
      axis: "HORIZONTAL",
      sign: 1,
    });
    n.forEach((v, i) => expect(v).toBeCloseTo(RIGHT[i]!, 10));
  });
});
