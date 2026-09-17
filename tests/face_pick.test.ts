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
import {
  alignedFaceOf,
  faceFromPickedNormal,
  faceMarkerExtent,
  faceMarkerLocalOrientation,
} from "@core/face_pick";
import { makeWorld, type SceneObject } from "@core/object_model";
import type { Constraint } from "@core/constraint_stack";
import { qFromAxisAngle, qmul, type Quat, type Vec3 } from "@core/vec";

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

/**
 * ⭐⭐ **WHAT THESE NOW MODEL: WHAT THE SCENE GRAPH DOES.** The markers are **parented** to the
 * object since 2026-09-17 (they lagged a frame when the scene placed them from a cached world
 * matrix), so the object's orientation is composed by Babylon, not by a function here.
 * ⛔ `marker(q, n)` below is that composition written out — `qmul(objectOrientation,
 * faceMarkerLocalOrientation(n))` — so the property the defect broke is still pinned by a
 * vector, at the closest point a vector can reach `src/render`.
 */
const marker = (objectOrientation: Quat, faceNormalLocal: Vec3): Quat =>
  qmul(objectOrientation, faceMarkerLocalOrientation(faceNormalLocal));

describe("⛔⛔ the face marker's orientation — THE DEFECT A DIRECTION TEST COULD NOT SEE", () => {
  // ⭐⭐ DEVICE-REPORTED, 2026-09-16: *"the highlighted face does not rotate as the cube's
  // face: consequently, there is a growing mismatch between their respective quaternion."*
  // ⛔ The first version aligned the marker's facing with the face's world NORMAL, which
  // fixes ONE axis and leaves the spin about it free. So turning the object about that
  // face's own normal moved the face and not the marker.
  // ⭐⭐⭐ A DIRECTION TEST CANNOT SEE A ROLL — the same family as *a sign is not tested by
  // any amount of testing the magnitude*. The quantity I checked (does it face the right
  // way?) stayed true while the quantity that mattered drifted.

  const qz = (radians: number) => qFromAxisAngle([0, 0, 1], radians);

  it("⭐ the marker's +z lands on the face's WORLD normal — the old claim, still true", () => {
    // ⚠ This is what the broken version got right, kept so the fix is not a regression.
    const q = marker(qz(0.9), [0, 0, 1]);
    const facing = rotateByTest(q, [0, 0, 1]);
    const worldNormal = rotateByTest(qz(0.9), [0, 0, 1]);
    facing.forEach((v, i) => expect(v).toBeCloseTo(worldNormal[i]!, 12));
  });

  it("⛔⛔ AND ITS IN-PLANE AXES FOLLOW THE OBJECT — which the old version failed", () => {
    // ⭐⭐ THE VECTOR THAT WOULD HAVE CAUGHT IT. Spin the object about the very axis the
    // face points along: the normal does not move, so a normal-aligned marker does not
    // move either — while the face plainly does. ⛔ Here the marker's own +x must rotate
    // with the object, quarter turn for quarter turn.
    const spin = Math.PI / 2;
    const q = marker(qz(spin), [0, 0, 1]);
    const markerX = rotateByTest(q, [1, 0, 0]);
    // a quarter turn about +z takes +x to +y
    expect(markerX[0]).toBeCloseTo(0, 12);
    expect(markerX[1]).toBeCloseTo(1, 12);
  });

  it("⛔ and it keeps following after FORTY spins — not a small-angle accident", () => {
    // ⭐ `anchor_rotate.ts`'s vectors make the same move: one step can pass by luck, forty
    // cannot. ⚠ The reported symptom was a GROWING mismatch, so accumulation is the test.
    let total = 0;
    for (let i = 0; i < 40; i++) total += 0.1;
    const q = marker(qz(total), [0, 0, 1]);
    const markerX = rotateByTest(q, [1, 0, 0]);
    expect(markerX[0]).toBeCloseTo(Math.cos(total), 10);
    expect(markerX[1]).toBeCloseTo(Math.sin(total), 10);
  });

  it("⭐ a side face works the same way", () => {
    // ⚠ +z is the marker's own axis, so it is the one face where the offset is identity —
    // exactly the fixture that would hide an order-of-multiplication error.
    const q = marker(qz(0.4), [1, 0, 0]);
    const facing = rotateByTest(q, [0, 0, 1]);
    const worldNormal = rotateByTest(qz(0.4), [1, 0, 0]);
    facing.forEach((v, i) => expect(v).toBeCloseTo(worldNormal[i]!, 12));
  });
});

/** ⚠ The plain quaternion sandwich, written out, so the product cannot judge itself. */
function rotateByTest(q: readonly [number, number, number, number], v: Vec3): Vec3 {
  const [w, x, y, z] = q;
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

// ══════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ THE MARKER'S SIZE ON A NON-CUBE FACE — `L × 2L × 3L`, the owner's scene (2026-09-17).
//
// ⛔⛔ EVERY ONE OF THESE WAS INVISIBLE WHILE THE OBJECTS WERE CUBES, because a cube's six
// faces are the same square. ⚠ And my first implementation was WRONG: it read the two axes
// that are not the normal in ascending order, which swaps `2L` and `3L` on the ±x faces.
// ⭐ `METHOD`: a composition is a thing to MEASURE.
// ══════════════════════════════════════════════════════════════════════════════
describe("⛔⛔ faceMarkerExtent — the marker must be the shape of the face it marks", () => {
  const L = 0.08;
  const DIMS: Vec3 = [L, 2 * L, 3 * L];
  /** The two in-plane dimensions of each face, as a SET — the geometry, order aside. */
  const expected: Record<string, [number, number]> = {
    "+x": [2 * L, 3 * L],
    "-x": [2 * L, 3 * L],
    "+y": [L, 3 * L],
    "-y": [L, 3 * L],
    "+z": [L, 2 * L],
    "-z": [L, 2 * L],
  };
  const normals: Record<string, Vec3> = {
    "+x": [1, 0, 0],
    "-x": [-1, 0, 0],
    "+y": [0, 1, 0],
    "-y": [0, -1, 0],
    "+z": [0, 0, 1],
    "-z": [0, 0, -1],
  };

  it("⭐⭐ all six faces get the two dimensions that actually lie IN that face", () => {
    // ⛔ Asserted as a sorted pair, because WHICH of the two is the marker's local x depends on
    // `shortestArc`'s convention — and that convention is not this function's promise. ⚠ What
    // IS promised is that the marker covers the face, and a swap would leave it overhanging on
    // one axis and short on the other.
    for (const id of Object.keys(expected)) {
      const { u, v } = faceMarkerExtent(normals[id]!, DIMS);
      const got = [u, v].sort((a, b) => a - b);
      const want = [...expected[id]!].sort((a, b) => a - b);
      expect(got[0]).toBeCloseTo(want[0]!, 12);
      expect(got[1]).toBeCloseTo(want[1]!, 12);
    }
  });

  it("⛔⛔ AND THE ±x FACES ARE 2L × 3L — the pair my first version got BACKWARDS", () => {
    // ⭐ Kept as its own vector because it is the specific case that was wrong, and because the
    // sorted-pair check above would also pass for an implementation that happened to be right
    // only on ±z. ⚠ 3L must appear, and L must NOT — the +x face never sees the body's width.
    const { u, v } = faceMarkerExtent([1, 0, 0], DIMS);
    expect(Math.max(u, v)).toBeCloseTo(3 * L, 12);
    expect(Math.min(u, v)).toBeCloseTo(2 * L, 12);
    expect(Math.min(u, v)).not.toBeCloseTo(L, 6);
  });

  it("⭐ a cube gives one square on every face — which is why none of this showed before", () => {
    for (const id of Object.keys(normals)) {
      const { u, v } = faceMarkerExtent(normals[id]!, [L, L, L]);
      expect(u).toBeCloseTo(L, 12);
      expect(v).toBeCloseTo(L, 12);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ WHICH FACE CARRIES THE ALIGNMENT — the owner, 2026-09-17: *"when an object is aligned,
// always maintain its FollowerFace highlighted (even if the touchpoints later select other
// objects) until its alignment is broken."*
//
// ⛔⛔ THE DEFECT THIS REPLACES: one remembered `selectedFace` record, so aligning a SECOND
// object wiped the FIRST object's highlight — defeating the exact purpose the owner wants it
// for, which is seeing *which objects* are aligned, plural.
// ══════════════════════════════════════════════════════════════════════════════
describe("⛔⛔ alignedFaceOf — derived from the stack, so it cannot outlive the alignment", () => {
  const L = 0.08;
  const body = (id: string, constraints: readonly Constraint[]): SceneObject => ({
    id,
    local: { position: [0, 0, 0], orientation: [1, 0, 0, 0] },
    parent: null,
    faces: [
      { id: "+x", centre: [L / 2, 0, 0], normal: [1, 0, 0] },
      { id: "-x", centre: [-L / 2, 0, 0], normal: [-1, 0, 0] },
      { id: "+y", centre: [0, L, 0], normal: [0, 1, 0] },
      { id: "-y", centre: [0, -L, 0], normal: [0, -1, 0] },
      { id: "+z", centre: [0, 0, 1.5 * L], normal: [0, 0, 1] },
      { id: "-z", centre: [0, 0, -1.5 * L], normal: [0, 0, -1] },
    ],
    connectors: [],
    constraints,
  });
  const align = (localNormal: Vec3): Constraint[] => [
    { kind: "FACE_ALIGN", localNormal, targetWorld: [0, 1, 0] },
  ];

  it("⭐ the face whose LOCAL normal the alignment constrains", () => {
    const w = makeWorld([body("a", align([0, 0, 1]))]);
    expect(alignedFaceOf(w, "a")).toBe("+z");
  });

  it("⛔⛔ SIGNED, NOT |dot| — `-x` must not light up for a `+x` alignment", () => {
    // ⭐⭐ `+x` and `-x` are one AXIS but two FACES. ⚠ An `|dot|` test would light the opposite
    // face roughly half the time, and on a cuboid that is immediately visible to a hand — the
    // highlight appears on the far side of the body from the finger that made it.
    expect(alignedFaceOf(makeWorld([body("a", align([1, 0, 0]))]), "a")).toBe("+x");
    expect(alignedFaceOf(makeWorld([body("a", align([-1, 0, 0]))]), "a")).toBe("-x");
    expect(alignedFaceOf(makeWorld([body("a", align([0, -1, 0]))]), "a")).toBe("-y");
  });

  it("⛔⛔ NO ALIGNMENT ⇒ null, WHICH IS WHAT MAKES THE HIGHLIGHT SELF-CLEARING", () => {
    // ⭐ This is the whole reason the function reads the model instead of a remembered record:
    // the moment a shake, a re-tap or a rotation reset evicts the constraint, the highlight has
    // nothing to draw. ⛔ No cleanup path to forget, and no way for the marker to survive the
    // thing it reports.
    expect(alignedFaceOf(makeWorld([body("a", [])]), "a")).toBeNull();
  });

  it("⛔ a MATE is not an alignment — a seat must not wear the alignment's highlight", () => {
    const mate: Constraint[] = [
      { kind: "MATE", localNormal: [0, 0, 1], targetWorld: [0, 0, -1], otherObjectId: "b" },
    ];
    expect(alignedFaceOf(makeWorld([body("a", mate)]), "a")).toBeNull();
  });

  it("⭐⭐ TWO OBJECTS ALIGNED AT ONCE, each reporting its OWN face", () => {
    // ⭐⭐⭐ THE VECTOR FOR THE OWNER'S ACTUAL REQUEST. ⛔ The old single-record design could not
    // express this state at all: whichever object was aligned second owned the only highlight.
    const w = makeWorld([body("a", align([0, 0, 1])), body("b", align([0, 1, 0]))]);
    expect(alignedFaceOf(w, "a")).toBe("+z");
    expect(alignedFaceOf(w, "b")).toBe("+y");
  });

  it("⚠ a missing object answers null rather than throwing in a per-frame query", () => {
    expect(alignedFaceOf(makeWorld([body("a", align([0, 0, 1]))]), "gone")).toBeNull();
  });
});
