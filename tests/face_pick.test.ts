/**
 * GOLDEN VECTORS — `IN3` rule 2: which face the finger landed on.
 *
 * ⭐⭐ THE ONE THING THAT CAN GO WRONG HERE IS A FRAME, and it cannot be caught by any test
 * on an UNROTATED object: local and world coincide there, so a mapping that rotates the pick
 * the wrong way passes every axis-aligned vector and fails the moment a hand turns the part.
 * ⛔ So the rotated cases are the point — and **which** of them discriminates was not what I
 * first wrote here.
 *
 * ⚠⚠ **MISTAKE SHAPE 5, CAUGHT BY A MUTANT: I called the 180° case the sharpest, and it is
 * the one case that proves NOTHING about the frame direction.** A half turn is its own
 * inverse, so `q` and `q⁻¹` rotate identically and the wrong mapping passes it untouched.
 * ⭐ The real discriminators are the **90°** case and the **arbitrary-angle** one — those are
 * what reddened when the conjugate was removed. ⛔ The 180° vector is kept, because it does
 * check that a half turn maps each pick to the OPPOSITE face rather than a neighbour, but it
 * is labelled for what it protects. ⭐ `METHOD`: *a guard that cannot fail is not a guard* —
 * and the way to find out which guard is which is to break the product and watch.
 */
import { describe, expect, it } from "vitest";
import { faceFromPickedNormal } from "@core/face_pick";
import { makeWorld, type SceneObject } from "@core/object_model";
import { qFromAxisAngle, type Vec3 } from "@core/vec";

/** A unit box with the six faces `3D1` already gives every object. */
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

const worldWith = (o: SceneObject) => makeWorld([o]);
const turned = (axis: Vec3, radians: number): SceneObject => ({
  ...BOX,
  local: { position: [0, 0, 0], orientation: qFromAxisAngle(axis, radians) },
});

describe("an UNROTATED object — the easy case, and the one that proves nothing on its own", () => {
  const w = worldWith(BOX);

  it("picks the face the normal points along, for all six", () => {
    const cases: readonly (readonly [Vec3, string])[] = [
      [[1, 0, 0], "+x"],
      [[-1, 0, 0], "-x"],
      [[0, 1, 0], "+y"],
      [[0, -1, 0], "-y"],
      [[0, 0, 1], "+z"],
      [[0, 0, -1], "-z"],
    ];
    for (const [n, want] of cases) {
      expect(faceFromPickedNormal(w, "box", n)?.faceId).toBe(want);
    }
  });

  it("⭐ a non-unit normal is normalised, not rejected", () => {
    // ⚠ Engines hand back whatever the mesh data implies; requiring unit length here would
    // be a contract the caller has no way to guarantee.
    expect(faceFromPickedNormal(w, "box", [7.3, 0, 0])?.faceId).toBe("+x");
    expect(faceFromPickedNormal(w, "box", [0, -0.001, 0])?.faceId).toBe("-y");
  });

  it("⭐ an oblique pick still resolves, and reports its cosine", () => {
    // ⚠ Nothing refuses a grazing pick — the caller gets the evidence and decides. A face
    // just off +x wins on +x with a cosine below 1, and that number is the whole point.
    const hit = faceFromPickedNormal(w, "box", [0.9, 0.3, 0.1]);
    expect(hit?.faceId).toBe("+x");
    expect(hit!.cos).toBeGreaterThan(0.9);
    expect(hit!.cos).toBeLessThan(1);
  });
});

describe("⛔⛔ A ROTATED OBJECT — the frame, which is the only real failure mode", () => {
  it("90° about +z: a world +x pick lands on the face that now faces +x", () => {
    // ⭐ The box is turned a quarter turn about z, so its local -y normal now points at
    // world +x. A mapping that rotated the pick the wrong way would answer `+y`.
    const w = worldWith(turned([0, 0, 1], Math.PI / 2));
    expect(faceFromPickedNormal(w, "box", [1, 0, 0])?.faceId).toBe("-y");
    expect(faceFromPickedNormal(w, "box", [0, 1, 0])?.faceId).toBe("+x");
  });

  it("180° about +y: the pick resolves to the OPPOSITE local face", () => {
    // ⚠⚠ AND IT CANNOT TELL THE TWO FRAME DIRECTIONS APART — a half turn is its own inverse,
    // so `q` and `q⁻¹` agree here. I had this labelled *the sharpest case* until a mutant
    // showed it surviving the wrong mapping. ⭐ What it DOES check: a half turn maps each pick
    // to the opposite face rather than to a neighbour.
    const w = worldWith(turned([0, 1, 0], Math.PI));
    expect(faceFromPickedNormal(w, "box", [0, 0, 1])?.faceId).toBe("-z");
    expect(faceFromPickedNormal(w, "box", [1, 0, 0])?.faceId).toBe("-x");
    // ⚠ And the axis of rotation is unaffected, which is what says the turn was about y.
    expect(faceFromPickedNormal(w, "box", [0, 1, 0])?.faceId).toBe("+y");
  });

  it("⭐ an arbitrary rotation still returns a cosine of ~1 for a face-on pick", () => {
    // ⭐⭐ THE FRAME-INDEPENDENT INVARIANT, and the one worth having: whatever the object's
    // orientation, picking exactly along a face's WORLD normal must resolve to that face
    // with cosine 1. ⛔ A wrong-direction mapping breaks this at every non-symmetric angle —
    // this vector and the 90° one are the two that actually reddened when the conjugate was
    // removed, which is how I learned the 180° case proves nothing about direction.
    const w = worldWith(turned([0.3, 0.9, -0.2], 0.7));
    // local +z, carried into world by the same rotation the product uses
    const worldOfLocalZ = qRotateForTest(turned([0.3, 0.9, -0.2], 0.7), [0, 0, 1]);
    const hit = faceFromPickedNormal(w, "box", worldOfLocalZ);
    expect(hit?.faceId).toBe("+z");
    expect(hit!.cos).toBeCloseTo(1, 12);
  });
});

describe("⛔ the degenerate cases return null, never a default", () => {
  const w = worldWith(BOX);

  it("a zero normal", () => {
    // ⚠ `LESSONS_CARRIED` §6: suppress, do not guess. A default here would silently anchor
    // a face nobody aimed at.
    expect(faceFromPickedNormal(w, "box", [0, 0, 0])).toBeNull();
  });

  it("an unknown object", () => {
    expect(faceFromPickedNormal(w, "ghost", [1, 0, 0])).toBeNull();
  });

  it("an object with no faces", () => {
    const bare = worldWith({ ...BOX, id: "bare", faces: [] });
    expect(faceFromPickedNormal(bare, "bare", [1, 0, 0])).toBeNull();
  });
});

/**
 * ⚠ The fixture rotates a vector itself rather than calling the product's helper on the
 * product's own path — `METHOD`: *a metric must not share an expression with the thing it
 * judges*. ⛔ It is the plain quaternion sandwich, written out here, so a bug in the
 * product's frame handling cannot hide inside the expectation.
 */
function qRotateForTest(o: SceneObject, v: Vec3): Vec3 {
  const [w, x, y, z] = o.local.orientation;
  const t: Vec3 = [
    2 * (y * v[2] - z * v[1]),
    2 * (z * v[0] - x * v[2]),
    2 * (x * v[1] - y * v[0]),
  ];
  return [
    v[0] + w * t[0] + (y * t[2] - z * t[1]),
    v[1] + w * t[1] + (z * t[0] - x * t[2]),
    v[2] + w * t[2] + (x * t[1] - y * t[0]),
  ];
}
