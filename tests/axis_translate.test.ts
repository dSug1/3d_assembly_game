/**
 * GOLDEN VECTORS — **THE AXIS MAPPING**, rewritten 2026-09-23 after the device look.
 *
 * ⛔⛔ **THE PREVIOUS VECTORS PINNED A RULE A HAND HAS NOW REJECTED**, and they are replaced
 * rather than kept green: they asserted that the rate falls with the cosine of the axis's
 * foreshortening (*"71% at 45°"*), which is precisely what came back as *"the input seems very
 * weak"*. ⭐ `METHOD`: a vector's subject is the rule, and when the rule goes the vector goes
 * with it — a suite that still certifies the old mapping is one that would pass on a revert.
 *
 * ⭐⭐ **THE CENTRAL CLAIM IS NOW A ROUND TRIP**, as rule 6's own suite is: move the body by
 * what the rule says, project it back onto the screen, and check it landed under the finger.
 * That single property answers reports 1 and 2 at once — a body that is under the finger cannot
 * feel inverted and cannot feel weak.
 */
import { describe, expect, it } from "vitest";
import {
  axisDisplacement,
  axisTravel,
  clampDepthRange,
  screenShadow,
  type AxisInputsPx,
  type CameraScreenAxes,
  displayedAxes,
  planeEdgeOn,
  soleGizmoBody,
} from "@input/axis_translate";
import { axesFromFrame, type ObjectAxes } from "@input/object_axes";
import { gravityFrame } from "@input/gravity_frame";
import { trackingMetresPerPx } from "@input/translate";
import { add, dot, length, normalize, scale, type Vec3 } from "@core/vec";

const DEG = Math.PI / 180;
const DOWN: Vec3 = [0, -1, 0];
const FOV = 0.8;
const H = 800;
const CONE = 5;

/**
 * A camera at `elevationDeg` above the scene looking down at it (negative = below, looking up),
 * at `azimuthDeg` around it.
 *
 * ⛔⛔ `up = view × right`, and the first draft of this fixture had it the other way round —
 * which inverted two channels and read exactly like a sign defect in the product. ⚠ MISTAKE
 * SHAPE 5, *my own FIXTURES*. ⭐ `right = up × view` is `gravity_frame`'s convention, and
 * `y × z = x` / `z × x = y` is the pair that has to hold.
 */
function camera(azimuthDeg: number, elevationDeg: number) {
  const a = azimuthDeg * DEG;
  const e = elevationDeg * DEG;
  const view: Vec3 = [
    Math.cos(a) * Math.cos(e),
    -Math.sin(e),
    Math.sin(a) * Math.cos(e),
  ];
  const g = gravityFrame(view, DOWN)!;
  const right = g.right;
  const up = normalize([
    view[1] * right[2] - view[2] * right[1],
    view[2] * right[0] - view[0] * right[2],
    view[0] * right[1] - view[1] * right[0],
  ])!;
  return { gravity: g, screen: { right, up } as CameraScreenAxes, view };
}

const PER_PX = trackingMetresPerPx(1.5, FOV, H);

/**
 * Where a world displacement LANDS on the glass, in CSS pixels.
 * ⛔ Derived from the camera basis independently of the rule under test, so the round trip is a
 * check and not a restatement of the same arithmetic.
 */
const toScreenPx = (
  v: Vec3,
  c: CameraScreenAxes,
): readonly [number, number] => [
  dot(v, c.right) / PER_PX,
  -dot(v, c.up) / PER_PX,
];

const run = (
  input: Partial<AxisInputsPx>,
  c: ReturnType<typeof camera>,
  axes: ObjectAxes,
  gain = 1,
  cone = CONE,
) =>
  axisTravel(
    { holderDxPx: 0, holderDyPx: 0, secondDyPx: 0, ...input },
    c.screen,
    axes,
    PER_PX,
    gain,
    gain,
    cone,
    // ⭐ The body at the centre of the screen, 1.5 m out, unless a vector says otherwise.
    { towardGravity: c.gravity.towardGravity, toAnchor: scale(c.view, 1.5) },
  );

describe("⭐⭐⭐ PLANE — the body follows the finger inside its own horizontal plane", () => {
  it("ROUND TRIP: at gain 1 the body lands exactly under the finger, at every camera pose", () => {
    // ⛔ THE ANSWER TO REPORTS 1 AND 2 IN ONE PROPERTY. Every camera the orbit rings can reach,
    // and azimuths deliberately NOT square to the world axes — the configuration the owner
    // photographed is a skew one, and a fixture at 0° would sit in the set where the two shadows
    // happen to be perpendicular and the defect cannot appear.
    for (const az of [0, 17, 35, 90, 143, 218]) {
      for (const el of [12, 30, 45, 70]) {
        const c = camera(az, el);
        const axes = axesFromFrame(camera(0, 30).gravity); // ⭐ BOOT axes, not this camera's
        for (const [dx, dy] of [
          [40, 0],
          [0, -25],
          [-33, 18],
          [120, 90],
        ]) {
          const t = run({ holderDxPx: dx!, holderDyPx: dy! }, c, axes);
          const landed = toScreenPx(axisDisplacement(t, axes), c.screen);
          expect(landed[0]).toBeCloseTo(dx!, 6);
          expect(landed[1]).toBeCloseTo(dy!, 6);
          expect(t.edgeOn).toBe(false);
          // ⚠ The LEVERAGE, not the tracking: a foreshortened plane needs MORE world travel to
          // put the body under the finger, so this is >= 1 and grows as the plane tilts away.
          expect(t.trackGain).toBeGreaterThanOrEqual(0.999);
          expect(Number.isFinite(t.trackGain)).toBe(true);
        }
      }
    }
  });

  it("⛔⛔ THE OLD RULE FAILS THAT ROUND TRIP — the report, as arithmetic", () => {
    // ⚠ The previous mapping, reproduced here as the counter-example it now is: each input
    // scaled BY its axis's foreshortening instead of divided by it. ⭐ A vector that cannot fail
    // is not a test, and this is the rule a hand rejected.
    const c = camera(35, 30);
    const axes = axesFromFrame(camera(0, 30).gravity);
    const superseded = {
      xM: 40 * PER_PX * dot(axes.x, c.screen.right),
      depthM: 0,
      gravityM: 0,
    };
    const landed = toScreenPx(axisDisplacement(superseded, axes), c.screen);
    // ⛔ It lands SHORT of the finger: 40 px asked for, and this is what arrived.
    expect(Math.abs(landed[0])).toBeLessThan(40 * 0.95);
  });

  it("⭐⭐ A HORIZONTAL DRAG MOVES THE BODY HORIZONTALLY ON SCREEN — report 1, directly", () => {
    // ⛔ The complaint was that `dx` moved the body along an axis that looks VERTICAL on the
    // glass. ⚠ Under PLANE the body's screen motion IS the finger's, so a purely horizontal drag
    // produces purely horizontal motion — whatever the axes are doing in the world.
    const c = camera(35, 30);
    const axes = axesFromFrame(camera(0, 30).gravity);
    const t = run({ holderDxPx: 50 }, c, axes);
    const landed = toScreenPx(axisDisplacement(t, axes), c.screen);
    expect(landed[0]).toBeCloseTo(50, 6);
    expect(landed[1]).toBeCloseTo(0, 6);
    // ⭐ And it genuinely used BOTH world axes to do it — otherwise this fixture would be in the
    // set where the pairing question does not arise.
    expect(Math.abs(t.xM)).toBeGreaterThan(1e-6);
    expect(Math.abs(t.depthM)).toBeGreaterThan(1e-6);
  });

  it("⭐ the gain is the SAME on all three channels — report 2's actual complaint", () => {
    // ⚠ *"the input seems very weak and not the same as the gravity axis input which is right"*.
    // ⛔ So the check is an EQUALITY between channels, not a value: 30 px of finger buys the same
    // 30 px of body motion whichever channel carries it.
    const c = camera(35, 30);
    const axes = axesFromFrame(camera(0, 30).gravity);
    const px = (t: ReturnType<typeof run>) =>
      Math.hypot(...toScreenPx(axisDisplacement(t, axes), c.screen));
    expect(px(run({ holderDxPx: 30 }, c, axes))).toBeCloseTo(30, 6);
    expect(px(run({ holderDyPx: 30 }, c, axes))).toBeCloseTo(30, 6);
    expect(px(run({ secondDyPx: 30 }, c, axes))).toBeCloseTo(30, 6);
  });

  it("⭐ the gains multiply the tracking factor, and 1.0 is 'under the finger'", () => {
    const c = camera(20, 40);
    const axes = axesFromFrame(c.gravity);
    const t = run({ holderDxPx: 10, holderDyPx: -10 }, c, axes, 2);
    const landed = toScreenPx(axisDisplacement(t, axes), c.screen);
    expect(landed[0]).toBeCloseTo(20, 6);
    expect(landed[1]).toBeCloseTo(-20, 6);
  });
});

describe("⛔⛔ EDGE-ON — a level camera, which is report 3", () => {
  it("the body KEEPS MOVING in depth, at the judged fixed rate, instead of going dead", () => {
    // ⚠ The old rule returned exactly 0 here and a hand called it out. ⛔ Blender goes quiet too
    // (`axisProjection` switches to a plain projection inside 5°); this deliberately does not.
    const c = camera(0, 0);
    const axes = axesFromFrame(camera(0, 30).gravity);
    const t = run({ holderDyPx: -50 }, c, axes);
    expect(t.edgeOn).toBe(true);
    // ⭐ FINGERS-UP IS AWAY at a level camera — the convention, since the picture is symmetric
    // there and no sign is derivable from it.
    expect(t.depthM).toBeGreaterThan(0);
    // ⭐ At the fixed rate: one pixel of finger buys one tracking factor of world travel.
    expect(t.depthM).toBeCloseTo(50 * PER_PX, 9);
    // ⚠ And `x` is untouched by the degeneracy — it is the axis lying across the screen.
    expect(run({ holderDxPx: 30 }, c, axes).xM).not.toBe(0);
  });

  it("⭐⭐ the SIGN is continuous through the cone — the defect that was found by finger", () => {
    // ⛔ *"when the camera is on the bottom ring facing upwards, the depth translation is
    // chaotic"* — fingers-up means AWAY seen from above and TOWARDS seen from below. ⚠ Inside
    // the cone the sign is still read from `towardGravity`, so entering the cone from either
    // side flips nothing.
    const axes = axesFromFrame(camera(0, 30).gravity);
    const push = { holderDyPx: -50 };
    const aboveOutside = run(push, camera(0, 20), axes).depthM;
    const aboveInside = run(push, camera(0, 2), axes).depthM;
    const belowInside = run(push, camera(0, -2), axes).depthM;
    const belowOutside = run(push, camera(0, -20), axes).depthM;
    expect(Math.sign(aboveOutside)).toBe(Math.sign(aboveInside));
    expect(Math.sign(belowOutside)).toBe(Math.sign(belowInside));
    expect(Math.sign(aboveInside)).not.toBe(Math.sign(belowInside));
  });

  it("⭐⭐⭐ `D127`: finger UP pushes along BLUE ALONE, AWAY from THIS camera, at every orbit angle", () => {
    // > *"I want to translate the object in the world axis in whatever camera position … In edge-on
    // > case, I want dy to translate the object on blue axis (finger up = translation on blue axis
    // > away from the camera)."* — the owner, 2026-09-28
    // ⛔ RED against the build before: the sign was the BOOT camera's, so past a quarter-orbit
    // fingers-up brought the body TOWARD the camera, and the holder's dy leaked onto red whenever
    // the camera was not exactly level. ⚠ Azimuths deliberately NOT square to the world axes —
    // the owner's screenshot is a skew one — and ±90° is its own vector below.
    const axes = axesFromFrame(camera(0, 30).gravity); // ⭐ BOOT axes, not this camera's
    for (const az of [0, 35, 135, 180, 218, 315]) {
      for (const el of [0, 2, 4]) {
        const c = camera(az, el);
        const t = run({ holderDyPx: -50 }, c, axes);
        expect(t.edgeOn).toBe(true);
        expect(Math.abs(t.xM)).toBe(0);
        expect(t.gravityM).toBe(0);
        expect(Math.abs(t.depthM)).toBeCloseTo(50 * PER_PX, 9);
        // ⭐ AWAY, measured against THIS camera's horizontal view direction.
        expect(dot(axisDisplacement(t, axes), c.gravity.depth)).toBeGreaterThan(0);
      }
    }
  });

  it("⭐⭐⭐ `D132`: AWAY is read from the camera to the GIZMO, not along the view — the body off-centre", () => {
    // > *"the translation on blue axis and finger dy input are still reversed. I think we need to
    // > compute the camera position vs. the center of the gizmo, not the camera position in absolute
    // > world coordinates."* — the owner, 2026-09-28, the body well left of the screen's centre.
    // ⛔ RED against `D127`'s build: two degrees past a quarter-orbit, blue · view is −0.035 — so
    // `+blue` read as TOWARD — while the body sits 0.4 m to the right of the view axis, where `+blue`
    // takes it FARTHER from the camera. ⭐ The assertion is the owner's meaning, measured: the
    // camera-to-body distance GROWS when the finger goes up.
    const axes = axesFromFrame(camera(0, 30).gravity);
    const c = camera(92, 2);
    const toAnchor = add(scale(c.view, 1.5), scale(c.gravity.right, 0.4));
    expect(dot(axes.depth, c.gravity.depth)).toBeLessThan(0); // the view-axis reading says the other way
    const t = axisTravel(
      { holderDxPx: 0, holderDyPx: -50, secondDyPx: 0 },
      c.screen,
      axes,
      PER_PX,
      1,
      1,
      CONE,
      { towardGravity: c.gravity.towardGravity, toAnchor },
    );
    expect(t.edgeOn).toBe(true);
    const moved = axisDisplacement(t, axes);
    expect(length(add(toAnchor, moved))).toBeGreaterThan(length(toAnchor));
    // ⛔ THE COUNTER-EXAMPLE — `D127`'s reading, along the VIEW: the same finger brings this body
    // CLOSER. That is the owner's report, as arithmetic.
    const alongView = axisTravel(
      { holderDxPx: 0, holderDyPx: -50, secondDyPx: 0 },
      c.screen,
      axes,
      PER_PX,
      1,
      1,
      CONE,
      { towardGravity: c.gravity.towardGravity, toAnchor: scale(c.view, 1.5) },
    );
    expect(length(add(toAnchor, axisDisplacement(alongView, axes)))).toBeLessThan(length(toAnchor));
  });

  it("⛔ from BELOW the finger-found sign stands: finger up comes TOWARD this camera", () => {
    // ⚠ *"when the camera is on the bottom ring facing upwards, the depth translation is
    // chaotic"* — outside the cone, exact tracking brings a body TOWARD a camera looking up when
    // the finger goes up, so the cone must agree or entering it from below reverses the push.
    const axes = axesFromFrame(camera(0, 30).gravity);
    for (const az of [0, 35, 180, 218]) {
      const c = camera(az, -2);
      const t = run({ holderDyPx: -50 }, c, axes);
      expect(t.edgeOn).toBe(true);
      expect(dot(axisDisplacement(t, axes), c.gravity.depth)).toBeLessThan(0);
    }
  });

  it("⚠ at a quarter-orbit BLUE lies across the screen: finger up slides along blue, never red", () => {
    // ⭐ The owner's rule taken literally where *away* has no meaning — blue is square to the view.
    // ⚠ The cost, stated: here finger up moves the body SIDEWAYS on the glass, and no finger
    // moves it toward or away from the camera (red points at it and goes quiet).
    const axes = axesFromFrame(camera(0, 30).gravity);
    for (const az of [90, -90]) {
      const t = run({ holderDyPx: -50 }, camera(az, 2), axes);
      expect(t.edgeOn).toBe(true);
      expect(Math.abs(t.xM)).toBe(0);
      expect(Math.abs(t.depthM)).toBeCloseTo(50 * PER_PX, 9);
    }
  });

  it("⭐⭐ `D134`: the HUD's EDGE-ON is the CAMERA's — `planeEdgeOn` needs no drag, and it IS the rule's branch", () => {
    // > *"when i click an object, most of the time the axis indicate 'edge-on', whatever the camera
    // > orbit is"* — the owner, 2026-09-28. ⛔ The readout was written only by a translating finger,
    // so a click or an orbit left the last drag's answer showing. ⭐ Now it is a function of the
    // camera alone — and, swept over every pose, it agrees with `axisTravel`'s own branch, so the
    // readout can never say one thing while the rule does another.
    const axes = axesFromFrame(camera(0, 30).gravity);
    for (const az of [0, 35, 90, 143, 218, 300])
      for (const el of [-20, -5.5, -4.5, -1, 0, 1, 4.5, 5.5, 12, 45]) {
        const c = camera(az, el);
        const edge = planeEdgeOn(c.screen, axes, CONE);
        expect(edge).toBe(Math.abs(el) < CONE);
        expect(run({ holderDyPx: -10 }, c, axes).edgeOn).toBe(edge);
      }
    // ⭐ The slider moves it: at a 0° cone nothing is edge-on but an exactly level camera's degeneracy.
    expect(planeEdgeOn(camera(35, 2).screen, axes, 0)).toBe(false);
    expect(planeEdgeOn({ right: [0, 0, 0], up: [0, 1, 0] }, axes, CONE)).toBe(false);
  });

  it("⚠ the RATE steps at the boundary, and the step is stated rather than hidden", () => {    // ⛔ Just outside the cone the exact mapping is buying `1/sin(5°)` ≈ 11× the tracking factor;
    // inside it the fallback buys 1×. ⭐ Neither produces visible SCREEN motion there, which is
    // why this is a cost and not a defect — but a vector says the number out loud.
    const axes = axesFromFrame(camera(0, 30).gravity);
    const justOutside = run({ holderDyPx: -50 }, camera(0, 5.5), axes);
    const justInside = run({ holderDyPx: -50 }, camera(0, 4.5), axes);
    expect(justOutside.edgeOn).toBe(false);
    expect(justInside.edgeOn).toBe(true);
    expect(Math.abs(justOutside.depthM / justInside.depthM)).toBeGreaterThan(5);
    expect(1 / Math.sin(CONE * DEG)).toBeCloseTo(11.47, 1);
  });

  it("⛔ cone = 0 disables the fallback — the runaway a hand is being protected from", () => {
    const axes = axesFromFrame(camera(0, 30).gravity);
    const t = run({ holderDyPx: -50 }, camera(0, 0.05), axes, 1, 0);
    expect(t.edgeOn).toBe(false);
    // ⚠ 50 px of finger, and the body has gone a hundred times further than it would flat on.
    expect(Math.abs(t.depthM)).toBeGreaterThan(100 * 50 * PER_PX);
  });
});

// ⛔⛔⛔ **A DESCRIBE STOOD HERE AND ITS SUBJECT IS DELETED** — `D82`, 2026-09-23.
// *"THE IN-ZONE BASIS AND `PLANE` — a finding, not a feature"* measured what the CAPTURE ZONE's
// basis did to a given drag: inert under `PLANE` (both bases span the same horizontal plane) and
// a real change of direction under `CHANNELS`. ⚠ The owner has removed that basis — *"Inside
// shall be the same as outside. I think this is polluting the approach movement."*
// ⭐ Kept as a note, because that measurement is the reason the rule looked harmless under
// `PLANE` while it was not.

describe("the depth range clamp — A5's bounds, carried over with the channel", () => {
  it("holds a body inside [min, max] along the push direction and moves nothing else", () => {
    const push: Vec3 = [0, 0, 1];
    const cam: Vec3 = [0, 0, 0];
    expect(clampDepthRange(cam, [1, 2, 3], push, 0.1, 10)).toEqual([1, 2, 3]);
    expect(clampDepthRange(cam, [1, 2, 30], push, 0.1, 10)).toEqual([1, 2, 10]);
    expect(clampDepthRange(cam, [1, 2, 0.05], push, 0.1, 10)).toEqual([
      1, 2, 0.1,
    ]);
  });

  it("⛔ a body BEHIND the camera is left alone rather than teleported in front of it", () => {
    expect(clampDepthRange([0, 0, 0], [1, 2, -5], [0, 0, 1], 0.1, 10)).toEqual([
      1, 2, -5,
    ]);
    expect(clampDepthRange([0, 0, 0], [1, 2, 3], [0, 0, 0], 0.1, 10)).toEqual([
      1, 2, 3,
    ]);
  });
});

describe("degenerate inputs never reach a placement", () => {
  it("⛔ a NaN in, zeros out — one NaN in a position is permanent", () => {
    const c = camera(20, 20);
    const axes = axesFromFrame(c.gravity);
    const t = run(
      { holderDxPx: NaN, holderDyPx: Infinity, secondDyPx: 5 },
      c,
      axes,
    );
    for (const n of [t.xM, t.depthM, t.gravityM])
      expect(Number.isFinite(n)).toBe(true);
    expect(t.xM).toBeCloseTo(0, 15);
    expect(t.depthM).toBeCloseTo(0, 15);
    for (const n of axisDisplacement(t, axes))
      expect(Number.isFinite(n)).toBe(true);
  });

  it("⛔ a camera with no basis moves nothing", () => {
    const c = camera(0, 30);
    const axes = axesFromFrame(c.gravity);
    const t = axisTravel(
      { holderDxPx: 10, holderDyPx: 10, secondDyPx: 10 },
      { right: [0, 0, 0], up: [0, 1, 0] },
      axes,
      PER_PX,
      1,
      1,
      CONE,
      { towardGravity: 0, toAnchor: [0, 0, 1] },
    );
    expect(t.xM).toBe(0);
    expect(t.gravityM).toBe(0);
    expect(t.depthM).toBe(0);
    expect(screenShadow([0, 0, 0], c.screen)).toBeNull();
  });
});

/**
 * ⭐⭐⭐ **THE GIZMO SHOWS THE DIRECTIONS THIS PUSH ACTUALLY TRANSLATES ALONG.**
 *
 * > *"the direction is shown only if the delta position triggers a translation in this direction.
 * > Therefore, for example, for a pure translation in the gravity axis only the green line would
 * > show. For a translation in the horizontal plane, both blue and red lines would show but not
 * > the green line."* — the owner, 2026-09-23
 */
describe("⭐⭐ displayedAxes — which gizmo lines are drawn", () => {
  // > *"the direction is shown only if the delta position triggers a translation in this
  // > direction. Therefore, for example, for a pure translation in the gravity axis only the
  // > green line would show. For a translation in the horizontal plane, both blue and red lines
  // > would show but not the green line."*
  //
  // > *"on first touch, if there is only dx or only dy, the other gizmo line should not appear.
  // > Both red and blue gizmo lines should appear only if both dx and dy are not null."*
  //
  // ⭐ The gizmo draws `[x, gravity, depth]` in that order — **red, green, blue**.
  const c = camera(35, 30);
  const axes = axesFromFrame(camera(0, 30).gravity);
  /**
   * ⭐ The channel set is the plain per-frame emission again — the owner, 2026-09-23: *"Remove the
   * deadband on the gizmo."* ⚠ `A11` has already deadbanded these travels for the BODY; the gizmo
   * adds nothing of its own, and nothing needs it to, because the anchor no longer moves with the
   * input.
   */
  const shownFor = (dx: boolean, holderDy: boolean, secondDy: boolean) =>
    displayedAxes(null, [dx, secondDy, holderDy, false, false, false]);

  it("⭐⭐⭐ RED AGAINST THE FIRST BUILD OF THIS RULE: a pure `dx` lights RED ALONE", () => {
    // ⛔⛔ **THE PREMISE, MEASURED FIRST**: under `PLANE` a pure `dx` genuinely moves the body
    // along BOTH horizontal axes — that is how the 2×2 solve keeps it under the finger. ⭐ So a
    // rule reading the TRAVEL lights red and blue here, which is exactly what the owner rejected.
    const t = run({ holderDxPx: 50 }, c, axes);
    expect(Math.abs(t.xM)).toBeGreaterThan(1e-6);
    expect(Math.abs(t.depthM)).toBeGreaterThan(1e-6);
    // ⛔ THE ASSERTION: the line belongs to the CHANNEL that was pushed.
    expect(shownFor(true, false, false)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("⭐⭐⭐ a pure holder `dy` lights BLUE alone", () => {
    const t = run({ holderDyPx: -40 }, c, axes);
    expect(Math.abs(t.xM)).toBeGreaterThan(1e-6); // ⚠ again, the travel is spread
    expect(shownFor(false, true, false)).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
    ]);
  });

  it("⭐⭐ both RED and BLUE only when both `dx` and `dy` are non-null — the owner's words", () => {
    expect(shownFor(true, true, false)).toEqual([
      true,
      false,
      true,
      false,
      false,
      false,
    ]);
    expect(shownFor(true, false, false)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(shownFor(false, true, false)).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
    ]);
  });

  it("⭐⭐⭐ a pure SECOND-touch push lights GREEN alone — his first example", () => {
    expect(shownFor(false, false, true)).toEqual([
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
    // ⭐ And all three when all three channels are pushed at once.
    expect(shownFor(true, true, true)).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
  });

  it("⛔ a pause does NOT blank the gizmo — the last non-empty answer stands", () => {
    // ⚠ A finger that stops emits nothing, and `A11`'s deadband emits nothing on an axis inside
    // its band, so the instantaneous answer is *no axes* many frames per second.
    const shown = shownFor(true, false, false)!;
    expect(shown).toEqual([true, false, false, false, false, false]);
    expect(
      displayedAxes(shown, [false, false, false, false, false, false]),
    ).toBe(shown);
  });

  it("⛔ before anything has been pushed there is nothing to show", () => {
    expect(
      displayedAxes(null, [false, false, false, false, false, false]),
    ).toBeNull();
    expect(shownFor(false, false, false)).toBeNull();
  });

  it("⛔ an axis at REST is not a push — the deadband's own hysteresis decides", () => {
    // ⚠ The set no longer asks *"did this channel emit this frame"*: `A11` emits the excess over
    // a dead radius in BURSTS, and reading those made the gizmo flicker. ⭐ It asks §1.1's per-axis
    // STATE, which stays `MOVING` until that axis has been at rest for `restConfirmMs`.
    expect(shownFor(false, false, false)).toBeNull();
    expect(shownFor(false, false, true)).toEqual([
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
  });
});

/**
 * ⭐⭐⭐ **THE LEADING-FACE RAY IS AIMED BY THE CHANNEL PUSHED HARDEST.**
 *
 * > *"still, there is a slight lag for the repositioning of the green line to the leadingface."*
 * > — the owner, 2026-09-23, after the direction's time memory had already been deleted
 *
 * ⛔⛔ The residue was not time: aimed by the vector SUM of the channels, the ray only reaches
 * `objectB`'s top face inside **29.4°** of vertical (half-extents `0.75 × 1.0 × 1.5 L`, sides
 * leaning in) — so any residual horizontal travel above ~56% of the vertical kept it on the side,
 * where the side genuinely IS the nearer exit.
 */
// ⛔⛔⛔ **THREE DESCRIBES STOOD HERE AND THEIR SUBJECT IS DELETED** — 2026-09-23, the owner:
// *"Remove the rule of the raycast of the delta position direction from the object center to
// identify the leadingface, and keep the gizmo always positioned at the center of the object by
// default, or the center of the followerface if there is one. Remove the deadband on the gizmo."*
//
// ⚠ They pinned the RAY: where it pointed (four rules were tried — a 120 ms memory, the vector
// sum, the dominant channel, the channel set), which quantity it read, and that the chain could
// cold-start. ⭐ The gizmo has no ray now: its anchor does not depend on the input at all, so
// none of those questions has an answer to pin.
// ⛔ What survives is `displayedAxes` — WHICH lines are drawn — and it is tested above.

/**
 * ⭐⭐⭐ **THE THREE TURN CHANNELS — the grey line, and it is a channel like the other three.**
 *
 * > *"add a grey axis to the gizmo to show the rotation axis when there is rotation with the
 * > second touch dx."* … *"also when there is rotation with the dx of the first touch in rotation
 * > mode (on aligned follower object)"* … *"the gizmo does not exist in rotation mode on aligned
 * > follower object. It may need to be created."* — the owner, 2026-09-23
 */
describe("⭐⭐ the rotation channels — grey, purple, maroon", () => {
  it("⭐⭐⭐ a turn alone lights GREY alone — no translation line comes with it", () => {
    expect(
      displayedAxes(null, [false, false, false, true, false, false]),
    ).toEqual([false, false, false, true, false, false]);
  });

  it("⛔ and a translation puts it away by itself — no rule had to be written for that", () => {
    // ⭐ The grey line obeys `displayedAxes` like the other three: a new non-empty set REPLACES
    // the old one, so starting to translate drops the rotation axis without anything clearing it.
    const turning = displayedAxes(null, [
      false,
      false,
      false,
      true,
      false,
      false,
    ])!;
    expect(
      displayedAxes(turning, [true, false, false, false, false, false]),
    ).toEqual([true, false, false, false, false, false]);
  });

  it("⛔ a pause keeps it, exactly as it keeps the translation lines", () => {
    const turning = displayedAxes(null, [
      false,
      false,
      false,
      true,
      false,
      false,
    ])!;
    expect(
      displayedAxes(turning, [false, false, false, false, false, false]),
    ).toBe(turning);
  });

  it("⭐ and a turn WHILE translating shows both kinds at once", () => {
    expect(
      displayedAxes(null, [true, false, true, true, false, false]),
    ).toEqual([true, false, true, true, false, false]);
  });
});

/**
 * ⭐⭐⭐ **PURPLE AND MAROON — THE FREE YAW AND PITCH.**
 *
 * > *"create purple and marron axis for yaw and pitch rotation on unaligned object in rotation
 * > mode."* — the owner, 2026-09-23
 *
 * ⛔ The channel order is `[x, gravity, depth, roll, yaw, pitch]`, so the last two are the ones
 * under test here. ⚠ WHICH axis each draws along is `scene.ts`'s, recorded where the turn is
 * applied — the gravity frame's `up` for the yaw and its `right` for the pitch, the very vectors
 * `screenPlaneRotation` is handed. What is testable here is WHEN each line appears.
 */
describe("⭐⭐ the free yaw and pitch channels", () => {
  it("⭐⭐⭐ a `dx`-only drag lights PURPLE ALONE — the maroon line stays away", () => {
    // ⛔ This is the rotation twin of *"on first touch, if there is only dx or only dy, the other
    // gizmo line should not appear"*, and it is the assertion that fails if the scene ever records
    // both turn axes unconditionally instead of per channel.
    expect(
      displayedAxes(null, [false, false, false, false, true, false]),
    ).toEqual([false, false, false, false, true, false]);
  });

  it("⭐⭐⭐ a `dy`-only drag lights MAROON ALONE", () => {
    expect(
      displayedAxes(null, [false, false, false, false, false, true]),
    ).toEqual([false, false, false, false, false, true]);
  });

  it("⭐ a diagonal drag lights BOTH — it genuinely yaws and pitches at once", () => {
    expect(
      displayedAxes(null, [false, false, false, false, true, true]),
    ).toEqual([false, false, false, false, true, true]);
  });

  it("⛔⛔ and flipping to TRANSLATE puts both turn lines away with no rule for it", () => {
    // ⭐⭐ THE ARGUMENT FOR ONE SET RATHER THAN TWO: translation and rotation share
    // `displayedAxes`, which replaces a non-empty set WHOLESALE. ⚠ Two independent sets would
    // each have needed a rule to clear the other, and that rule would have lived in `scene.ts`.
    const turning = displayedAxes(null, [
      false,
      false,
      false,
      false,
      true,
      true,
    ])!;
    expect(
      displayedAxes(turning, [true, false, false, false, false, false]),
    ).toEqual([true, false, false, false, false, false]);
    // ⛔ And back the other way: translating, then turning, drops the red line.
    const moving = displayedAxes(null, [
      true,
      true,
      false,
      false,
      false,
      false,
    ])!;
    expect(
      displayedAxes(moving, [false, false, false, false, true, false]),
    ).toEqual([false, false, false, false, true, false]);
  });
});

/**
 * ⭐⭐⭐ **ONE GIZMO, NEVER TWO.**
 *
 * > *"the gizmo shall not be applied to a second object (pioneer object for example) as this
 * > confuses the reading on the screen"* — the owner, 2026-09-23
 */
describe("⭐⭐ soleGizmoBody — which body carries the gizmo", () => {
  it("⛔⛔⛔ TWO ELIGIBLE BODIES YIELD ONE ANSWER — the whole point of the rule", () => {
    // ⚠ Before this rule the render loop drew a gizmo per held grip, so a finger steadying the
    // Pioneer while another moved the part put twelve full-screen lines on the glass.
    expect(
      soleGizmoBody([
        { id: "part", driven: true },
        { id: "pioneer", driven: false },
      ]),
    ).toBe("part");
  });

  it("⭐⭐⭐ THE DRIVEN ONE WINS REGARDLESS OF PRESS ORDER", () => {
    // ⛔ RED AGAINST *"first candidate always"*: here the Pioneer was pressed FIRST and the part
    // is the one being pushed. A press-order rule returns "pioneer" and the instrument sits on
    // the body nobody is moving.
    expect(
      soleGizmoBody([
        { id: "pioneer", driven: false },
        { id: "part", driven: true },
      ]),
    ).toBe("part");
  });

  it("⛔ with NONE driven the first candidate keeps it — press order, so a pause is stable", () => {
    expect(
      soleGizmoBody([
        { id: "a", driven: false },
        { id: "b", driven: false },
      ]),
    ).toBe("a");
  });

  it("⛔ and no candidates means no gizmo — nothing stands in", () => {
    expect(soleGizmoBody([])).toBeNull();
  });
});
