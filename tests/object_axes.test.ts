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
  updatedObjectAxes,
  zoneEdge,
  type ObjectAxes,
} from "@input/object_axes";
import { gravityFrame, type GravityFrame } from "@input/gravity_frame";
import { dot, type Vec3 } from "@core/vec";

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

describe("the flag chooses WHICH camera — and that is the whole rule since D82", () => {
  // ⚠ This described the OUTSIDE-the-zone case until 2026-09-23; there is no other case now.
  // ⛔ `inZone`, `leadingNormal` and `up` were still sitting in this fixture after the rule was
  // deleted — TS accepts extra properties through a spread, so nothing objected. A fixture that
  // passes arguments the rule no longer has is a reader's trap, which is why they are gone.
  const base = {
    bootAxes: BOOT,
    liveFrame: LIVE,
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
  it("⛔⛔⛔ `D82`: being inside the zone changes NOTHING about the basis", () => {
    // > *"eliminate this rule: Inside the offset radius the axes are the LeadingFace normal,
    // > gravity, and their orthogonal. Inside shall be the same as outside. I think this is
    // > polluting the approach movement."* — the owner, 2026-09-23
    //
    // ⚠ The vector that stood here asserted the DELETED rule — that a late naming inside the
    // zone still yielded the leading face's basis. ⭐ The rule has no input for the zone at all
    // now, which is the strongest form of *inside is the same as outside*: there is nothing to
    // pass. ⛔ What remains is the flag, and it answers the same way at every distance.
    const anywhere = {
      worldAxisB: true,
      bootAxes: BOOT,
      liveFrame: LIVE,
      previous: axesFromFrame(LIVE),
    };
    expect(updatedObjectAxes(anywhere)).toEqual(BOOT);
    expect(updatedObjectAxes({ ...anywhere, worldAxisB: false })).toEqual(axesFromFrame(LIVE));
    // ⭐ And whichever it answers is still a basis a body can be translated along.
    orthonormal(updatedObjectAxes(anywhere));
    orthonormal(updatedObjectAxes({ ...anywhere, worldAxisB: false }));
  });
});
