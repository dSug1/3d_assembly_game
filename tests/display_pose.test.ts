/**
 * THE DISPLAYED POSE — `SWAY ∘ FOLLOW ∘ model`, the composition three files used to make
 * inline in a render loop where nothing could check it.
 *
 * ⭐⭐ THE VECTOR THAT MATTERS MOST IS **RIGIDITY**, and it had never been written. The
 * sway's own comment claims the block *"both ORBITS the pivot and SPINS on its own by the
 * same angle"* and that *"orbiting alone would shear the group"* — a claim about the whole
 * group, made in prose, tested by nothing. A shear is invisible in any single object's
 * pose and obvious the moment two are compared, which is exactly the shape `METHOD` warns
 * about: *a statistic pooled across a region cannot answer a question about that region.*
 */
import { describe, expect, it } from "vitest";
import { NO_SWAY, displayPose, type SwayOffsets } from "../src/input/display_pose";
import {
  IDENTITY,
  length,
  qFromAxisAngle,
  qRotate,
  sub,
  type Quat,
  type Vec3,
} from "../src/core/vec";

const rot = (axis: Vec3, deg: number): Quat => qFromAxisAngle(axis, (deg * Math.PI) / 180);

function expectVec(a: Vec3, b: Vec3, digits = 9): void {
  for (let i = 0; i < 3; i++) expect(a[i]!).toBeCloseTo(b[i]!, digits);
}

describe("⛔ at rest the decoration changes NOTHING", () => {
  it("zero sway returns the followed position and the model's orientation, exactly", () => {
    const p: Vec3 = [1, 2, 3];
    const q = rot([0.3, 1, -0.2], 57);
    const out = displayPose(p, q, NO_SWAY);
    expectVec(out.position, p, 12);
    expect(out.orientation).toEqual(q);
  });

  it("⛔ a zero rotation VECTOR does not build a quaternion from a zero axis", () => {
    // The place a normalise-by-zero would hide. It must return the model's orientation
    // itself, not something that merely rounds to it.
    const q = rot([1, 0, 0], 33);
    const out = displayPose([5, 0, 0], q, { ...NO_SWAY, pivot: [9, 9, 9] });
    expect(out.orientation).toEqual(q);
  });

  it("a pivot far away is irrelevant while the block rotation is zero", () => {
    const a = displayPose([1, 1, 1], IDENTITY, { ...NO_SWAY, pivot: [0, 0, 0] });
    const b = displayPose([1, 1, 1], IDENTITY, { ...NO_SWAY, pivot: [1000, -500, 7] });
    expectVec(a.position, b.position, 12);
  });
});

describe("⭐⭐ RIGIDITY — the block swings as one body, it does not shear", () => {
  const sway: SwayOffsets = {
    translation: [0, 0, 0],
    rotationVector: [0, (6 * Math.PI) / 180, 0], // 6° about +y
    pivot: [0, 0, 0],
  };

  /** Three objects at different distances from the pivot — a shear shows up between them. */
  const CLOUD: Vec3[] = [
    [1, 0, 0],
    [0, 0, 3],
    [-2, 1, 0.5],
  ];

  it("every PAIRWISE distance survives the swing", () => {
    const moved = CLOUD.map((p) => displayPose(p, IDENTITY, sway).position);
    for (let i = 0; i < CLOUD.length; i++) {
      for (let j = i + 1; j < CLOUD.length; j++) {
        expect(length(sub(moved[i]!, moved[j]!))).toBeCloseTo(
          length(sub(CLOUD[i]!, CLOUD[j]!)),
          9,
        );
      }
    }
  });

  it("⭐ each object SPINS by the same angle it ORBITS by — not one or the other", () => {
    const out = displayPose(CLOUD[0]!, IDENTITY, sway);
    // The orbit: its position is the pivot-relative point, rotated.
    expectVec(out.position, qRotate(qFromAxisAngle([0, 1, 0], (6 * Math.PI) / 180), CLOUD[0]!));
    // The spin: its orientation carries the same rotation.
    const marker = qRotate(out.orientation, [1, 0, 0]);
    expectVec(marker, qRotate(qFromAxisAngle([0, 1, 0], (6 * Math.PI) / 180), [1, 0, 0]));
  });

  it("⛔⛔ COUNTER-EXAMPLE: ORBIT WITHOUT SPIN preserves distances but SHEARS the group", () => {
    // The naive half-implementation. Distances survive — so a distance test alone would
    // certify it — but every object keeps its original orientation while its position
    // swings, which reads as things sliding past one another.
    const orbitOnly = CLOUD.map((p) => ({
      position: displayPose(p, IDENTITY, sway).position,
      orientation: IDENTITY,
    }));
    for (let i = 0; i < CLOUD.length; i++) {
      for (let j = i + 1; j < CLOUD.length; j++) {
        expect(length(sub(orbitOnly[i]!.position, orbitOnly[j]!.position))).toBeCloseTo(
          length(sub(CLOUD[i]!, CLOUD[j]!)),
          9,
        );
      }
    }
    // ⭐ And here is what the distance test cannot see: the orientation did not come with
    // it. This is the assertion that separates a block from a crowd.
    expect(orbitOnly[0]!.orientation).toEqual(IDENTITY);
    expect(displayPose(CLOUD[0]!, IDENTITY, sway).orientation).not.toEqual(IDENTITY);
  });

  it("⛔ COUNTER-EXAMPLE: SPIN WITHOUT ORBIT leaves every object turning on the spot", () => {
    // Objects keep their positions, so the group's shape is untouched — but nothing
    // swings. A "rigidity" test built only from distances passes this too.
    const spinOnly = CLOUD.map((p) => ({ position: p, orientation: rot([0, 1, 0], 6) }));
    for (let i = 0; i < CLOUD.length; i++) {
      for (let j = i + 1; j < CLOUD.length; j++) {
        expect(length(sub(spinOnly[i]!.position, spinOnly[j]!.position))).toBeCloseTo(
          length(sub(CLOUD[i]!, CLOUD[j]!)),
          9,
        );
      }
    }
    // The real composition MOVES them; this does not.
    expect(length(sub(displayPose(CLOUD[0]!, IDENTITY, sway).position, CLOUD[0]!))).toBeGreaterThan(
      0.05,
    );
  });

  it("an object AT the pivot orbits nowhere, but still spins with the block", () => {
    const out = displayPose([0, 0, 0], IDENTITY, sway);
    expectVec(out.position, [0, 0, 0], 12);
    expect(out.orientation).not.toEqual(IDENTITY);
  });
});

describe("the layers compose without fighting", () => {
  it("the translational sway is additive, and independent of the block rotation", () => {
    const t: Vec3 = [0.01, -0.02, 0.005];
    const withRot: SwayOffsets = {
      translation: t,
      rotationVector: [0, 0.05, 0],
      pivot: [0, 0, 0],
    };
    const rotOnly: SwayOffsets = { ...withRot, translation: [0, 0, 0] };
    const a = displayPose([1, 0, 0], IDENTITY, withRot).position;
    const b = displayPose([1, 0, 0], IDENTITY, rotOnly).position;
    expectVec(sub(a, b), t, 12);
  });

  it("⭐ the model's orientation passes through UNFILTERED — rotation has no inertia", () => {
    // Built as `src/input/spin.ts`, measured, and rejected by the owner on the device.
    const q = rot([1, 1, 0], 80);
    expect(displayPose([0, 0, 0], q, NO_SWAY).orientation).toEqual(q);
  });

  it("⛔ it is PURE — the same inputs give the same outputs, so nothing can read it back as state", () => {
    const p: Vec3 = [0.5, 0.25, -1];
    const q = rot([0, 0, 1], 12);
    const s: SwayOffsets = { translation: [0.01, 0, 0], rotationVector: [0.02, 0, 0], pivot: [1, 1, 1] };
    const first = displayPose(p, q, s);
    for (let i = 0; i < 5; i++) {
      const again = displayPose(p, q, s);
      expectVec(again.position, first.position, 12);
      expect(again.orientation).toEqual(first.orientation);
    }
  });

  it("⚠ a LARGER sway moves an object FURTHER from the pivot more than a nearer one", () => {
    // Not a correctness property so much as the thing that makes it read as rotation:
    // distance from the pivot is what turns a swing into a swing.
    const near = displayPose([0.5, 0, 0], IDENTITY, {
      translation: [0, 0, 0],
      rotationVector: [0, 0.05, 0],
      pivot: [0, 0, 0],
    }).position;
    const far = displayPose([3, 0, 0], IDENTITY, {
      translation: [0, 0, 0],
      rotationVector: [0, 0.05, 0],
      pivot: [0, 0, 0],
    }).position;
    expect(length(sub(far, [3, 0, 0]))).toBeGreaterThan(length(sub(near, [0.5, 0, 0])));
  });
});
