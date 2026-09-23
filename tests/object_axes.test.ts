/**
 * GOLDEN VECTORS — **THE OBJECT AXES**, and when they change (the owner's A and C).
 *
 * ⛔⛔ **THE FIXTURES ARE DELIBERATELY NOT SQUARE.** A camera at 45° of azimuth, a leading face
 * on a SLOPE, a boot camera that differs from the live one — because every interesting claim
 * here is an equality that a degenerate fixture would satisfy by accident:
 *
 *   * `WorldAxisB` fixed vs live is invisible if the camera never moves;
 *   * the orthogonalisation is invisible if the leading face is already vertical;
 *   * the ENTER/EXIT edge is invisible if the zone state never changes twice.
 *
 * ⭐ That is the 2026-09-17 audit's one shape — *a fixture chosen because it is easy to reason
 * about is usually chosen from the set where the quantity under test is zero* — and it is why
 * the sloped face is the second vector in this file rather than a footnote.
 */
import { describe, expect, it } from "vitest";
import {
  axesFromFrame,
  axesFromLeadingFace,
  updatedObjectAxes,
  zoneEdge,
  type ObjectAxes,
} from "@input/object_axes";
import { gravityFrame, type GravityFrame } from "@input/gravity_frame";
import { cross, dot, normalize, type Vec3 } from "@core/vec";

const UP: Vec3 = [0, 1, 0];
const DOWN: Vec3 = [0, -1, 0];
const DEG = Math.PI / 180;

/** A camera looking along `azimuth` and tilted `elevation` degrees DOWN towards the scene. */
const frameAt = (azimuthDeg: number, elevationDeg: number): GravityFrame => {
  const a = azimuthDeg * DEG;
  const e = elevationDeg * DEG;
  const view: Vec3 = [Math.cos(a) * Math.cos(e), -Math.sin(e), Math.sin(a) * Math.cos(e)];
  const g = gravityFrame(view, DOWN);
  if (!g) throw new Error("fixture camera has no gravity frame");
  return g;
};

const orthonormal = (a: ObjectAxes): void => {
  for (const v of [a.x, a.gravity, a.depth]) expect(Math.hypot(...v)).toBeCloseTo(1, 12);
  expect(dot(a.x, a.gravity)).toBeCloseTo(0, 12);
  expect(dot(a.x, a.depth)).toBeCloseTo(0, 12);
  expect(dot(a.gravity, a.depth)).toBeCloseTo(0, 12);
};

const BOOT = axesFromFrame(frameAt(0, 30));
const LIVE = frameAt(90, 30);

describe("the in-zone basis — LeadingFace normal, gravity, and their orthogonal", () => {
  it("a VERTICAL leading face gives the normal back exactly", () => {
    const axes = axesFromLeadingFace([0, 0, 1], UP)!;
    expect(axes.depth[0]).toBeCloseTo(0, 12);
    expect(axes.depth[2]).toBeCloseTo(1, 12);
    expect(axes.gravity).toEqual([0, 1, 0]);
    orthonormal(axes);
  });

  it("⭐⭐ A SLOPED FACE IS ORTHOGONALISED — the owner's choice, 2026-09-22", () => {
    // A 45° face: its normal has as much vertical in it as horizontal.
    const n: Vec3 = normalize([0, 1, 1])!;
    const axes = axesFromLeadingFace(n, UP)!;
    // ⛔ THE CLAIM: depth is the normal's HORIZONTAL SHADOW, and gravity is untouched.
    expect(axes.depth[1]).toBeCloseTo(0, 12);
    expect(axes.depth[2]).toBeCloseTo(1, 12);
    expect(axes.gravity).toEqual([0, 1, 0]);
    orthonormal(axes);
    // ⭐ THE COUNTER-EXAMPLE, asserted to be WRONG: the literal reading keeps the normal as
    // the depth axis, and then `depth · gravity` is 0.707 rather than 0 — the two channels
    // overlap and a push along one partly does the other. A vector that cannot fail is not
    // a test, and this is the alternative the owner rejected.
    expect(dot(n, UP)).toBeCloseTo(Math.SQRT1_2, 12);
  });

  it("⛔ a HORIZONTAL leading face REFUSES — it has no horizontal shadow", () => {
    expect(axesFromLeadingFace([0, 1, 0], UP)).toBeNull();
    expect(axesFromLeadingFace([0, -1, 0], UP)).toBeNull();
    expect(axesFromLeadingFace([0, 0, 0], UP)).toBeNull();
  });

  it("⛔⛔ ITS HANDEDNESS MATCHES THE CAMERA BASIS — `up × depth`, not `depth × up`", () => {
    // ⚠ If these two disagreed, every horizontal push would REVERSE at the moment a body
    // crossed into the zone, mid-drag, and a hand would read it as the controls inverting.
    // ⭐ `gravityFrame` records this exact sign trap; the check is that both bases build
    // `x` the same way, with the leading face standing in for the view direction.
    const f = frameAt(37, 20);
    const inZone = axesFromLeadingFace(f.depth, UP)!;
    for (let i = 0; i < 3; i++) expect(inZone.x[i]).toBeCloseTo(f.right[i]!, 12);
    const byHand = normalize(cross(UP, f.depth))!;
    for (let i = 0; i < 3; i++) expect(inZone.x[i]).toBeCloseTo(byHand[i]!, 12);
  });
});

describe("outside the zone — the flag chooses WHICH camera", () => {
  const base = {
    inZone: false,
    bootAxes: BOOT,
    liveFrame: LIVE,
    leadingNormal: null,
    up: UP,
    previous: BOOT,
  };

  it("⭐⭐ WorldAxisB = 1 gives the BOOT axes, whatever the camera has done since", () => {
    const axes = updatedObjectAxes({ ...base, worldAxisB: true });
    expect(axes).toEqual(BOOT);
    // ⛔ THE POINT OF THE FLAG: the live camera has orbited 90° and the axes did NOT follow.
    expect(dot(axes.x, LIVE.right)).toBeCloseTo(0, 12);
  });

  it("⭐ WorldAxisB = 0 gives the LIVE camera's axes — today's build, unchanged", () => {
    const axes = updatedObjectAxes({ ...base, worldAxisB: false });
    expect(axes).toEqual(axesFromFrame(LIVE));
    expect(axes.x).toEqual(LIVE.right);
    expect(axes.gravity).toEqual(LIVE.up);
    expect(axes.depth).toEqual(LIVE.depth);
  });

  it("⛔ the two settings genuinely DISAGREE for this fixture", () => {
    // ⚠ Without this the two vectors above would both pass against an implementation that
    // ignored the flag entirely — the fixture would be in the set where the answer is zero.
    const a = updatedObjectAxes({ ...base, worldAxisB: true });
    const b = updatedObjectAxes({ ...base, worldAxisB: false });
    expect(a).not.toEqual(b);
  });

  it("⛔ a camera with no frame keeps the basis the body has, rather than guessing", () => {
    const axes = updatedObjectAxes({ ...base, worldAxisB: false, liveFrame: null });
    expect(axes).toEqual(base.previous);
  });
});

describe("inside the zone — the leading face decides, and the flag is not consulted", () => {
  const base = {
    inZone: true,
    bootAxes: BOOT,
    liveFrame: LIVE,
    up: UP,
    previous: BOOT,
  };

  it("⭐⭐ the basis comes from the LEADING FACE, with either flag setting", () => {
    const n: Vec3 = normalize([1, 0, 1])!;
    const on = updatedObjectAxes({ ...base, worldAxisB: true, leadingNormal: n });
    const off = updatedObjectAxes({ ...base, worldAxisB: false, leadingNormal: n });
    expect(on).toEqual(off);
    expect(on.depth[0]).toBeCloseTo(Math.SQRT1_2, 12);
    expect(on.depth[2]).toBeCloseTo(Math.SQRT1_2, 12);
    orthonormal(on);
    // ⛔ And it is NOT either of the outside-zone answers — the dictation's *"therefore the
    // translation direction differs when the object is inside the offset radius zone"*.
    expect(on).not.toEqual(BOOT);
    expect(on).not.toEqual(axesFromFrame(LIVE));
  });

  it("⛔ no leading face, or a horizontal one, KEEPS the basis the body has", () => {
    expect(updatedObjectAxes({ ...base, worldAxisB: true, leadingNormal: null })).toEqual(BOOT);
    expect(updatedObjectAxes({ ...base, worldAxisB: true, leadingNormal: [0, 1, 0] })).toEqual(
      BOOT,
    );
  });
});

describe("the zone edge", () => {
  it("fires once on each crossing and never in between", () => {
    expect(zoneEdge(false, true)).toBe("ENTER");
    expect(zoneEdge(true, false)).toBe("EXIT");
    expect(zoneEdge(false, false)).toBeNull();
    expect(zoneEdge(true, true)).toBeNull();
  });

  it("⭐ a run of frames produces exactly two edges for one visit", () => {
    // ⛔ THE COMPOSITION, not the layer: a body approaches, dwells four frames, and leaves.
    // ⚠ An edge detector that re-fired while inside would re-latch the axes every frame,
    // which is the very thing latching on the edge exists to prevent.
    const run = [false, false, true, true, true, true, false, false];
    const edges = run.slice(1).map((now, i) => zoneEdge(run[i]!, now));
    expect(edges.filter((e) => e !== null)).toEqual(["ENTER", "EXIT"]);
  });
});

describe("⛔⛔ the zone is entered by PROXIMITY; the duo is nameable only while a drag translates", () => {
  it("⭐ a late naming inside the zone still yields the IN-zone basis", () => {
    // ⚠ The sequence a hand produces: drift into range in ROTATE mode (the crossing happens, with
    // no pair to apply it to), then start translating — at which point the duo is named and the
    // basis must already be the leading face's. ⛔ Keyed on the STATE, not on the edge's name.
    const n: Vec3 = normalize([1, 0, 1])!;
    const late = updatedObjectAxes({
      inZone: true,
      worldAxisB: true,
      bootAxes: BOOT,
      liveFrame: LIVE,
      leadingNormal: n,
      up: UP,
      previous: BOOT,
    });
    expect(late).toEqual(axesFromLeadingFace(n, UP));
    // ⛔ And it is NOT the boot basis, which is what a rule keyed on `edge === "ENTER"` would
    // have left the body with — the defect this vector exists to pin.
    expect(late).not.toEqual(BOOT);
  });
});
