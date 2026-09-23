/**
 * GOLDEN VECTORS — **THE AXIS PROJECTION**, the owner's B.
 *
 * ⛔⛔ **THE FIRST VECTOR IS THE COMPOSITION**, as rule 6's own suite is: the three channels
 * are summed into one displacement and the result is checked as a whole. `METHOD`: *a
 * composition is a thing to MEASURE, not an emergent property* — and the two defects this
 * project has paid most for were both compositions nobody computed.
 *
 * ⭐⭐ **AND THE SIGN VECTORS ARE THE ONES THAT MATTER.** *A sign is not tested by any amount
 * of testing the magnitude* — four defects in one day shared that shape and not one was caught
 * by a suite. The depth channel's sign is the one `depthTranslate` needed `awaySign` for, and
 * the vector below is the device report that found it, written as arithmetic: *"when the camera
 * is on the bottom ring facing upwards, the depth translation is chaotic."*
 */
import { describe, expect, it } from "vitest";
import { axisDisplacement, axisTravel, clampDepthRange } from "@input/axis_translate";
import { axesFromFrame, axesFromLeadingFace } from "@input/object_axes";
import { gravityFrame } from "@input/gravity_frame";
import { trackingMetresPerPx } from "@input/translate";
import { dot, normalize, type Vec3 } from "@core/vec";

const DEG = Math.PI / 180;
const DOWN: Vec3 = [0, -1, 0];
const UP: Vec3 = [0, 1, 0];
const FOV = 0.8;
const H = 800;

/**
 * A camera at `elevationDeg` ABOVE the scene looking down at it (negative = below, looking up),
 * in the `x/z` plane at `azimuthDeg`. ⭐ Returns both frames, because the rule needs the TRUE
 * camera axes and the gravity frame answers a different question.
 */
function camera(azimuthDeg: number, elevationDeg: number) {
  const a = azimuthDeg * DEG;
  const e = elevationDeg * DEG;
  // The view direction, pointing INTO the screen and DOWN by `e`.
  const view: Vec3 = [Math.cos(a) * Math.cos(e), -Math.sin(e), Math.sin(a) * Math.cos(e)];
  const g = gravityFrame(view, DOWN)!;
  // The camera's own right is horizontal (it carries no roll); its up completes the basis.
  // ⛔⛔ `up = view × right`, and the first draft of this fixture had it the other way round —
  // which inverted the depth and gravity channels and read exactly like a sign defect in the
  // product. ⚠ MISTAKE SHAPE 5, *my own FIXTURES*, caught by the vector it was written for.
  // ⭐ The check that settles it: `right = up × view` is `gravity_frame`'s own convention, and
  // `y × z = x` / `z × x = y` is the pair that has to hold for a right-handed basis.
  const right = g.right;
  const up = normalize([
    view[1] * right[2] - view[2] * right[1],
    view[2] * right[0] - view[0] * right[2],
    view[0] * right[1] - view[1] * right[0],
  ])!;
  return { gravity: g, screen: { right, up }, view };
}

const PER_PX = trackingMetresPerPx(1.5, FOV, H);

describe("each channel drives its own axis", () => {
  it("⭐⭐ THE COMPOSITION: three channels sum into one displacement, and each shows up on its own axis", () => {
    const c = camera(35, 30);
    const axes = axesFromFrame(c.gravity);
    const t = axisTravel(
      { holderDxPx: 40, holderDyPx: -25, secondDyPx: -10 },
      c.screen,
      axes,
      PER_PX,
      1,
      1,
    );
    const d = axisDisplacement(t, axes);
    // ⛔ The displacement decomposed back onto the basis must return the three travels. With
    // an ORTHONORMAL basis that is a round trip, and it is the check that the composition
    // does not quietly lose or duplicate a channel.
    expect(dot(d, axes.x)).toBeCloseTo(t.xM, 12);
    expect(dot(d, axes.gravity)).toBeCloseTo(t.gravityM, 12);
    expect(dot(d, axes.depth)).toBeCloseTo(t.depthM, 12);
    // ⭐ And all three are genuinely non-zero for this fixture — otherwise the round trip
    // would pass against an implementation that dropped a channel.
    expect(Math.abs(t.xM)).toBeGreaterThan(1e-6);
    expect(Math.abs(t.gravityM)).toBeGreaterThan(1e-6);
    expect(Math.abs(t.depthM)).toBeGreaterThan(1e-6);
  });

  it("⭐ the holder's dx matches rule 6 exactly when the axes are the camera's", () => {
    // ⛔ THE CONTINUITY CLAIM. `WorldAxisA` outside the zone is supposed to be *the current
    // build* for the horizontal channel, and the horizontal channel is the one a hand has
    // already accepted (`gainTranslateScreen` = 1 puts the object under the finger).
    const c = camera(0, 25);
    const axes = axesFromFrame(c.gravity);
    const t = axisTravel({ holderDxPx: 33, holderDyPx: 0, secondDyPx: 0 }, c.screen, axes, PER_PX, 1, 1);
    expect(t.xM).toBeCloseTo(33 * PER_PX, 12);
    expect(t.gravityM).toBeCloseTo(0, 15);
    expect(t.depthM).toBeCloseTo(0, 15);
  });

  it("⭐ a finger moving UP the screen lifts the body on the gravity axis", () => {
    const c = camera(0, 25);
    const axes = axesFromFrame(c.gravity);
    // Screen y grows DOWNWARD, so "up the screen" is a negative dy.
    const t = axisTravel({ holderDxPx: 0, holderDyPx: 0, secondDyPx: -20 }, c.screen, axes, PER_PX, 1, 1);
    expect(t.gravityM).toBeGreaterThan(0);
  });
});

describe("⛔⛔ the depth sign — the defect that was found by finger", () => {
  it("fingers-up pushes AWAY looking down, and TOWARDS looking up", () => {
    // ⭐⭐ `depthTranslate` needs `awaySign = sign(towardGravity)` for this, and assuming it
    // was +1 produced *"the depth translation is chaotic"* on the bottom ring. Here the sign
    // is not assumed and not passed in — it falls out of `depthAxis · cameraUp`.
    const above = camera(0, 35);
    const below = camera(0, -35);
    const push = { holderDxPx: 0, holderDyPx: -20, secondDyPx: 0 };
    const up = axisTravel(push, above.screen, axesFromFrame(above.gravity), PER_PX, 1, 1);
    const dn = axisTravel(push, below.screen, axesFromFrame(below.gravity), PER_PX, 1, 1);
    expect(up.depthM).toBeGreaterThan(0);
    expect(dn.depthM).toBeLessThan(0);
    // ⚠ And the magnitudes match: it is the same gesture, mirrored.
    expect(Math.abs(up.depthM)).toBeCloseTo(Math.abs(dn.depthM), 12);
  });

  it("⚠ A LEVEL CAMERA IS THE QUIET ONE, NOT A WRONG ONE — the sixth time on this project", () => {
    const c = camera(0, 0);
    const t = axisTravel({ holderDxPx: 0, holderDyPx: -50, secondDyPx: 0 }, c.screen, axesFromFrame(c.gravity), PER_PX, 1, 1);
    // ⛔ Zero travel, never a guessed direction: a depth change produces no screen motion at
    // a level camera, so there is nothing for the finger to follow.
    expect(t.depthM).toBeCloseTo(0, 12);
    // ⭐ And the OTHER channels are untouched by that degeneracy — the vertical is at full
    // rate exactly where depth is dead, which is why the two are a pair.
    const both = axisTravel({ holderDxPx: 10, holderDyPx: -50, secondDyPx: -10 }, c.screen, axesFromFrame(c.gravity), PER_PX, 1, 1);
    expect(both.xM).toBeCloseTo(10 * PER_PX, 12);
    expect(both.gravityM).toBeCloseTo(10 * PER_PX, 12);
  });
});

describe("⭐⭐ the projection is NOT normalised — a foreshortened axis goes QUIET", () => {
  it("rate falls with the cosine and reaches zero pointing at the camera", () => {
    // ⛔ THE OWNER'S CHOICE OVER BLENDER'S DIVISION, 2026-09-22, and the reason it needs no
    // cutoff: the rate is `cos`, not `1/cos`, so the failure is silence rather than infinity.
    const c = camera(0, 0);
    const rates = [0, 30, 60, 89.9].map((tilt) => {
      // An axis tilted `tilt` degrees out of the screen plane, in the camera's up/view plane.
      const axis = normalize([
        c.view[0] * Math.sin(tilt * DEG),
        Math.cos(tilt * DEG),
        c.view[2] * Math.sin(tilt * DEG),
      ])!;
      const t = axisTravel(
        { holderDxPx: 0, holderDyPx: 0, secondDyPx: -100 },
        c.screen,
        { x: [1, 0, 0], gravity: axis, depth: [0, 0, 1] },
        PER_PX,
        1,
        1,
      );
      return t.gravityM / PER_PX / 100;
    });
    expect(rates[0]).toBeCloseTo(1, 9);
    expect(rates[1]).toBeCloseTo(Math.cos(30 * DEG), 9);
    expect(rates[2]).toBeCloseTo(Math.cos(60 * DEG), 9);
    // ⚠ NOT *approximately zero* — the exact cosine, and then the magnitude claim separately.
    // ⭐ `0.0017` is small and it is not nothing: the axis is still live, just very quiet, and
    // rounding that to "zero" in a vector would hide the difference from a real refusal.
    expect(rates[3]).toBeCloseTo(Math.cos(89.9 * DEG), 9);
    expect(Math.abs(rates[3]!)).toBeLessThan(0.002);
    // ⭐ Monotone, and bounded by 1: no input can ever outrun the finger on any axis.
    for (let i = 1; i < rates.length; i++) expect(rates[i]!).toBeLessThan(rates[i - 1]!);
    expect(Math.max(...rates)).toBeLessThanOrEqual(1);
  });

  it("⛔ Blender's division would have to divide by ~0 in that last case", () => {
    // ⚠ The counter-example, written out: at 89.9° the axis's screen shadow is 0.0017, so the
    // rejected formulation would multiply the finger's travel by 573. A vector that cannot
    // fail is not a test, and this is the number that decided the choice.
    expect(1 / Math.cos(89.9 * DEG)).toBeGreaterThan(500);
  });
});

describe("the in-zone basis changes where a push goes", () => {
  it("⭐⭐ the SAME finger travel moves the body differently inside the zone", () => {
    // ⛔ *"Therefore the translation direction differs when the object is inside the offset
    // radius zone"* — the dictation's own claim, asserted.
    const c = camera(0, 30);
    const outside = axesFromFrame(c.gravity);
    const inside = axesFromLeadingFace(normalize([1, 0, 1])!, UP)!;
    const push = { holderDxPx: 50, holderDyPx: -30, secondDyPx: 0 };
    const a = axisDisplacement(axisTravel(push, c.screen, outside, PER_PX, 1, 1), outside);
    const b = axisDisplacement(axisTravel(push, c.screen, inside, PER_PX, 1, 1), inside);
    const apart = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    expect(apart).toBeGreaterThan(1e-4);
  });
});

describe("the depth range clamp — A5's bounds, carried over with the channel", () => {
  it("holds a body inside [min, max] along the push direction and moves nothing else", () => {
    const push: Vec3 = [0, 0, 1];
    const cam: Vec3 = [0, 0, 0];
    // Inside the range: untouched, and the identity is exact.
    expect(clampDepthRange(cam, [1, 2, 3], push, 0.1, 10)).toEqual([1, 2, 3]);
    // Beyond the ceiling: pulled back to it, with x and y intact.
    expect(clampDepthRange(cam, [1, 2, 30], push, 0.1, 10)).toEqual([1, 2, 10]);
    // Inside the floor: pushed out to it.
    expect(clampDepthRange(cam, [1, 2, 0.05], push, 0.1, 10)).toEqual([1, 2, 0.1]);
  });

  it("⛔ a body BEHIND the camera is left alone rather than teleported in front of it", () => {
    expect(clampDepthRange([0, 0, 0], [1, 2, -5], [0, 0, 1], 0.1, 10)).toEqual([1, 2, -5]);
    expect(clampDepthRange([0, 0, 0], [1, 2, 3], [0, 0, 0], 0.1, 10)).toEqual([1, 2, 3]);
  });
});

describe("degenerate inputs never reach a placement", () => {
  it("⛔ a NaN in, zeros out — one NaN in a position is permanent", () => {
    const c = camera(20, 20);
    const axes = axesFromFrame(c.gravity);
    const t = axisTravel(
      { holderDxPx: NaN, holderDyPx: Infinity, secondDyPx: 5 },
      c.screen,
      axes,
      PER_PX,
      1,
      1,
    );
    expect(Number.isFinite(t.xM)).toBe(true);
    expect(Number.isFinite(t.depthM)).toBe(true);
    expect(t.xM).toBe(0);
    expect(t.depthM).toBeCloseTo(0, 15);
    const d = axisDisplacement(t, axes);
    for (const n of d) expect(Number.isFinite(n)).toBe(true);
  });

  it("⛔ a camera with no basis moves nothing", () => {
    const axes = axesFromFrame(camera(0, 30).gravity);
    const t = axisTravel(
      { holderDxPx: 10, holderDyPx: 10, secondDyPx: 10 },
      { right: [0, 0, 0], up: [0, 1, 0] },
      axes,
      PER_PX,
      1,
      1,
    );
    expect(t).toEqual({ xM: 0, gravityM: 0, depthM: 0 });
  });
});
