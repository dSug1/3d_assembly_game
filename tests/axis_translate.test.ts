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
 *
 * ⛔⛔ **`D145` (2026-09-29) REPLACED THE MAPPING AGAIN, AND ITS VECTORS WITH IT**: the axes are the
 * LIVE camera's (x the screen's right, depth the view, both flattened), `dy`'s sign is the camera's
 * height against the gizmo's, and the holder lights red AND blue. ⛔ The boot-axis 2×2 solve, `D127`'s
 * *away along blue* and `D132`'s off-centre reading went with the rule they pinned.
 */
import { describe, expect, it } from "vitest";
import {
  awaySignFrom,
  axisDisplacement,
  axisTravel,
  clampDepthRange,
  clipSegmentInFront,
  screenShadow,
  type AxisInputsPx,
  type CameraScreenAxes,
  displayedAxes,
  freeTravelPhase,
  NO_TRAVEL_GIZMO,
  planeEdgeOn,
  stepTravelGizmo,
  stopAtHit,
  travelHalves,
  travelLines,
  soleGizmoBody,
} from "@input/axis_translate";
import { axesFromFrame, type ObjectAxes } from "@input/object_axes";
import { gravityFrame } from "@input/gravity_frame";
import { trackingMetresPerPx } from "@input/translate";
import { add, dot, normalize, scale, type Vec3 } from "@core/vec";

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
  // ⭐ The body at the centre of the screen, 1.5 m out, unless a vector says otherwise.
  toAnchor: Vec3 = scale(c.view, 1.5),
) =>
  axisTravel(
    { holderDxPx: 0, holderDyPx: 0, secondDyPx: 0, ...input },
    c.screen,
    axes,
    PER_PX,
    gain,
    gain,
    cone,
    // ⭐ In the product this is read live at every step (`D148`), as here.
    { awaySign: awaySignFrom(toAnchor) },
  );

/** ⭐ `D145`: the axes a translation runs along — THIS camera's gravity frame. */
const live = (c: ReturnType<typeof camera>): ObjectAxes => axesFromFrame(c.gravity);
const AZIMUTHS = [0, 17, 35, 90, 143, 218, 300];
const ELEVATIONS = [-40, -20, -4, 0, 4, 20, 45, 70];

describe("⭐⭐⭐ `D145` — dx along the screen's right, dy along the view, both flattened", () => {
  // > *"horizontal plane translation (first touch or left click without shift) is done: on camera
  // > view axis (projected onto the horizontal plane) for dy … on camera screen horizontal axis
  // > (projected onto the horizontal plane …) for dx. Translation sense follows dx sense."*
  // > — the owner, 2026-09-29

  it("⭐⭐ a pure `dx` moves along THIS camera's right only, in the finger's sense, exactly under it", () => {
    for (const az of AZIMUTHS)
      for (const el of ELEVATIONS) {
        const c = camera(az, el);
        for (const dx of [40, -25]) {
          const t = run({ holderDxPx: dx }, c, live(c));
          const moved = axisDisplacement(t, live(c));
          expect(Math.abs(t.depthM)).toBe(0); // ⭐ no depth from a pure dx
          expect(t.gravityM).toBeCloseTo(0, 15);
          expect(moved[1]).toBeCloseTo(0, 12); // horizontal
          expect(Math.sign(dot(moved, c.gravity.right))).toBe(Math.sign(dx));
          // ⭐ Under the finger: the independent projection lands it at `dx`, with no vertical drift.
          const landed = toScreenPx(moved, c.screen);
          expect(landed[0]).toBeCloseTo(dx, 6);
          expect(landed[1]).toBeCloseTo(0, 6);
        }
      }
  });

  it("⭐⭐ a pure `dy` moves along THIS camera's view, flattened — never across it, never up", () => {
    for (const az of AZIMUTHS)
      for (const el of ELEVATIONS) {
        const c = camera(az, el);
        const t = run({ holderDyPx: -30 }, c, live(c));
        const moved = axisDisplacement(t, live(c));
        expect(t.xM).toBeCloseTo(0, 15);
        expect(t.gravityM).toBeCloseTo(0, 15);
        expect(moved[1]).toBeCloseTo(0, 12);
        expect(Math.abs(dot(moved, c.gravity.right))).toBeLessThan(1e-12);
        expect(Math.abs(dot(moved, c.gravity.depth))).toBeGreaterThan(0);
      }
  });

  it("⛔ RED AGAINST THE BOOT AXES: after an orbit, `dx` no longer slides along the boot camera's x", () => {
    // ⭐ The premise, measured: at a camera a third of the way round, the boot x and this camera's
    // right are far apart — so the axes the caller hands over are the whole change.
    const boot = axesFromFrame(camera(0, 30).gravity);
    const c = camera(143, 30);
    expect(Math.abs(dot(boot.x, c.gravity.right))).toBeLessThan(0.9);
    const moved = axisDisplacement(run({ holderDxPx: 40 }, c, live(c)), live(c));
    expect(dot(normalize(moved)!, c.gravity.right)).toBeCloseTo(1, 12);
  });
});

describe("⭐⭐⭐ `D145` — finger UP is AWAY when the camera is at or above the gizmo, TOWARD when below", () => {
  // > *"dy towards top translates the object away from the camera if the camera is above or at the
  // > gizmo gravity position; dy towards top translates the object towards the camera if the camera is
  // > below the gizmo gravity position"* — the owner, 2026-09-29
  const away = (c: ReturnType<typeof camera>, toAnchor: Vec3, dy = -30) =>
    dot(axisDisplacement(run({ holderDyPx: dy }, c, live(c), 1, CONE, toAnchor), live(c)), c.gravity.depth);

  it("⭐⭐⭐ the whole table: every camera pose, the gizmo below, level with and above the camera", () => {
    for (const az of AZIMUTHS)
      for (const el of ELEVATIONS) {
        const c = camera(az, el);
        const ahead = scale(c.gravity.depth, 1.5);
        expect(away(c, add(ahead, [0, -0.4, 0]))).toBeGreaterThan(0); // camera ABOVE → away
        expect(away(c, ahead)).toBeGreaterThan(0); // ⭐ camera AT the gizmo's height → away
        expect(away(c, add(ahead, [0, 0.4, 0]))).toBeLessThan(0); // camera BELOW → toward
        // ⭐ and finger DOWN is the opposite, always
        expect(away(c, add(ahead, [0, -0.4, 0]), 30)).toBeLessThan(0);
        expect(away(c, add(ahead, [0, 0.4, 0]), 30)).toBeGreaterThan(0);
      }
  });

  it("⛔⛔ RED AGAINST THE VIEW-PITCH SIGN: a camera looking DOWN at a body ABOVE its own height", () => {
    // ⭐ A body at the top of the screen, above eye level, while the camera looks down 20°: the screen
    // shadow's sign (the view's pitch) says *finger up = away*; the owner's rule says TOWARD — and so
    // does perspective: a body above eye level moved away sinks toward the horizon, DOWN on the glass.
    const c = camera(35, 20);
    const toAnchor = add(scale(c.gravity.depth, 1.0), [0, 0.3, 0]);
    expect(dot(c.gravity.depth, c.screen.up)).toBeGreaterThan(0); // the old sign: away
    expect(away(c, toAnchor)).toBeLessThan(0);
  });

  it("⛔⛔ RED AGAINST `D127`: a LEVEL camera below the gizmo brings it TOWARD the camera", () => {
    // ⚠ `D127` read *fingers-up = away* at an exactly level camera, whatever the heights.
    const c = camera(218, 0);
    const t = run({ holderDyPx: -30 }, c, live(c), 1, CONE, add(scale(c.gravity.depth, 1.5), [0, 0.2, 0]));
    expect(t.edgeOn).toBe(true);
    expect(dot(axisDisplacement(t, live(c)), c.gravity.depth)).toBeLessThan(0);
  });
});

describe("⭐⭐⭐ `D147`/`D148` — the direction is re-read every step: a ZOOM or a LIFT mid-drag can flip it", () => {
  // > *"camera position at the end of zoom shall determine the direction of translation, even if the
  // > zoom happens during drag"* — the owner, 2026-09-29, reversing `D146` (*"Camera position after
  // > zoom shall not change direction of translation during drag"*)

  it("⭐⭐ a zoom that carries the camera BELOW the gizmo turns finger-up TOWARD the camera", () => {
    // ⭐ The premise, measured: a camera looking down 20° at a gizmo just below its eye level; zooming
    // in slides the camera along its view line, DOWN, until it is below the gizmo.
    const c = camera(35, 20);
    const gizmo: Vec3 = [0, 0.05, 0];
    const cameraAt = (radius: number): Vec3 => scale(c.view, -radius);
    const toAnchorAt = (radius: number): Vec3 => [
      gizmo[0] - cameraAt(radius)[0],
      gizmo[1] - cameraAt(radius)[1],
      gizmo[2] - cameraAt(radius)[2],
    ];
    expect(awaySignFrom(toAnchorAt(1.5))).toBe(1); // camera above the gizmo at the press → away
    const afterZoom = awaySignFrom(toAnchorAt(0.05));
    expect(afterZoom).toBe(-1); // ⭐ the zoom left the camera below it
    // ⭐ The re-decided sign drives the rest of the drag: finger up now comes TOWARD the camera.
    const t = axisTravel(
      { holderDxPx: 0, holderDyPx: -30, secondDyPx: 0 },
      c.screen,
      live(c),
      PER_PX,
      1,
      1,
      CONE,
      { awaySign: afterZoom },
    );
    expect(dot(axisDisplacement(t, live(c)), c.gravity.depth)).toBeLessThan(0);
  });

  it("⭐⭐ `D148`: a GRAVITY lift that carries the gizmo above the camera turns finger-up TOWARD", () => {
    // > *"Same for translation on gravity axis: relative position of the gizmo and camera shall be
    // > updated each frame and determine the direction of translation on blue axis"* — the owner
    const c = camera(35, 20);
    const eye: Vec3 = scale(c.view, -1.5); // the camera, 1.5 m back from the orbit centre
    const gizmoAt = (y: number): Vec3 => [0, y, 0];
    const toAnchor = (g: Vec3): Vec3 => [g[0] - eye[0], g[1] - eye[1], g[2] - eye[2]];
    const before = awaySignFrom(toAnchor(gizmoAt(0)));
    expect(before).toBe(1); // below the camera → away
    // ⭐ the second finger lifts the body 1 m: its gizmo is now above the camera
    const t = run({ secondDyPx: -10 }, c, live(c));
    expect(t.gravityM).toBeGreaterThan(0);
    const after = awaySignFrom(toAnchor(gizmoAt(eye[1] + 0.2)));
    expect(after).toBe(-1);
    const step = axisTravel(
      { holderDxPx: 0, holderDyPx: -30, secondDyPx: 0 },
      c.screen,
      live(c),
      PER_PX,
      1,
      1,
      CONE,
      { awaySign: after },
    );
    expect(dot(axisDisplacement(step, live(c)), c.gravity.depth)).toBeLessThan(0);
  });

  it("⭐ `awaySignFrom` — at or above: away; below: toward; a NaN height counts as level", () => {
    expect(awaySignFrom([0, -0.3, 1])).toBe(1);
    expect(awaySignFrom([0, 0, 1])).toBe(1);
    expect(awaySignFrom([0, 0.3, 1])).toBe(-1);
    expect(awaySignFrom([0, NaN, 1])).toBe(1);
  });
});

describe("⭐⭐ the RATE — tracked outside the cone, the judged fixed rate inside it", () => {
  it("⭐ outside the cone `dy` buys `1/sin(pitch)` — the tracking `D76` asked for", () => {
    for (const el of [-45, -20, 12, 30, 70]) {
      const c = camera(35, el);
      const t = run({ holderDyPx: -30 }, c, live(c));
      expect(t.edgeOn).toBe(false);
      expect(Math.abs(t.depthM)).toBeCloseTo((30 * PER_PX) / Math.sin(Math.abs(el) * DEG), 9);
    }
  });

  it("⛔⛔ EDGE-ON — a level camera — the body KEEPS MOVING, one tracking factor per pixel", () => {
    // ⚠ Report 3: *"the holder's dy is dead at a level camera"*. `Scene_1` boots here.
    for (const el of [0, 2, -2, 4.5]) {
      const c = camera(35, el);
      const t = run({ holderDyPx: -50 }, c, live(c));
      expect(t.edgeOn).toBe(true);
      expect(Math.abs(t.depthM)).toBeCloseTo(50 * PER_PX, 9);
      expect(t.xM).toBeCloseTo(0, 15);
    }
  });

  it("⭐ the gains multiply the tracking factor, and 1.0 is 'under the finger'", () => {
    const c = camera(20, 40);
    const t1 = run({ holderDxPx: 10, holderDyPx: -10 }, c, live(c));
    const t2 = run({ holderDxPx: 10, holderDyPx: -10 }, c, live(c), 2);
    expect(t2.xM).toBeCloseTo(2 * t1.xM, 12);
    expect(t2.depthM).toBeCloseTo(2 * t1.depthM, 12);
    expect(toScreenPx(axisDisplacement(t1, live(c)), c.screen)[0]).toBeCloseTo(10, 6);
  });

  it("⭐⭐ `D134`: the HUD's EDGE-ON is the CAMERA's — `planeEdgeOn` needs no drag, and it IS the rule's branch", () => {
    for (const az of AZIMUTHS)
      for (const el of [-20, -5.5, -4.5, -1, 0, 1, 4.5, 5.5, 12, 45]) {
        const c = camera(az, el);
        const edge = planeEdgeOn(c.screen, live(c), CONE);
        expect(edge).toBe(Math.abs(el) < CONE);
        expect(run({ holderDyPx: -10 }, c, live(c)).edgeOn).toBe(edge);
      }
    expect(planeEdgeOn({ right: [0, 0, 0], up: [0, 1, 0] }, live(camera(0, 30)), CONE)).toBe(false);
  });

  it("⚠ the RATE steps at the boundary, and the step is stated rather than hidden", () => {
    const justOutside = run({ holderDyPx: -50 }, camera(0, 5.5), live(camera(0, 5.5)));
    const justInside = run({ holderDyPx: -50 }, camera(0, 4.5), live(camera(0, 4.5)));
    expect(justOutside.edgeOn).toBe(false);
    expect(justInside.edgeOn).toBe(true);
    expect(Math.abs(justOutside.depthM / justInside.depthM)).toBeGreaterThan(5);
    expect(1 / Math.sin(CONE * DEG)).toBeCloseTo(11.47, 1);
  });

  it("⛔ cone = 0 disables the fallback — the runaway a hand is being protected from", () => {
    const c = camera(0, 0.05);
    const t = run({ holderDyPx: -50 }, c, live(c), 1, 0);
    expect(t.edgeOn).toBe(false);
    expect(Math.abs(t.depthM)).toBeGreaterThan(100 * 50 * PER_PX);
  });

  it("⭐ gravity is untouched — the second touch's `dy` still lifts, exactly under the finger", () => {
    const c = camera(35, 30);
    const t = run({ secondDyPx: -30 }, c, live(c));
    expect(t.xM).toBeCloseTo(0, 15);
    expect(t.depthM).toBeCloseTo(0, 15);
    expect(t.gravityM).toBeGreaterThan(0);
    expect(toScreenPx(axisDisplacement(t, live(c)), c.screen)[1]).toBeCloseTo(-30, 6);
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
      { awaySign: 1 },
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
  /**
   * ⭐ The channel set is the plain per-frame emission again — the owner, 2026-09-23: *"Remove the
   * deadband on the gizmo."* ⚠ `A11` has already deadbanded these travels for the BODY; the gizmo
   * adds nothing of its own, and nothing needs it to, because the anchor no longer moves with the
   * input.
   */
  const shownFor = (dx: boolean, holderDy: boolean, secondDy: boolean) =>
    displayedAxes(null, [dx, secondDy, holderDy, false, false, false]);

  // ⛔⛔ THREE VECTORS STOOD HERE — *a pure `dx` lights red alone*, *a pure `dy` blue alone*, *both
  // only when both* (the owner, 2026-09-23). ⭐ `D145` reverses them: *"Red and blue axis are
  // displayed as soon as one or two of the two dx or dy inputs are above the deadband (both axis
  // display even if there is only one input)"*. ⚠ The rule lives in `axisTravel`'s `driven`, which
  // is what the gizmo reads, so the vectors read it there.
  const shownBy = (input: Partial<AxisInputsPx>) =>
    displayedAxes(null, [...run(input, c, live(c)).driven, false, false, false]);

  it("⭐⭐⭐ `D145`: a pure `dx`, a pure `dy`, or both — RED AND BLUE together, green off", () => {
    // ⛔ RED against the build before: a pure `dx` lit red alone, a pure `dy` blue alone.
    for (const input of [{ holderDxPx: 12 }, { holderDyPx: -12 }, { holderDxPx: 5, holderDyPx: 9 }])
      expect(shownBy(input)).toEqual([true, false, true, false, false, false]);
  });

  it("⭐ inside the deadband nothing is emitted, so nothing lights", () => {
    expect(shownBy({})).toBeNull();
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

describe("⭐⭐⭐ `D150` — a FREE body's translation gizmo: full at a start or a toggle, then a ray toward the travel", () => {
  // > *"at start or toggle to translation in horizontal plane, both red and blue axis are displayed and
  // > extend full screen as long as both dx and dy stay within deadband; at start or toggle to
  // > translation in gravity axis, green axis is displayed full screen as long as [its delta] stays
  // > within deadband; if one delta position is beyond deadband, its axis extend only in the direction
  // > of translation until delta position is beyond the deadband in the opposite sense."* — the owner
  const T = (xM: number, gravityM: number, depthM: number) => ({ xM, gravityM, depthM });
  const H = "HORIZONTAL" as const;
  const G = "GRAVITY" as const;

  it("⭐ the phase is PRESENCE: translating + a second touch down → gravity; translating alone → horizontal", () => {
    expect(freeTravelPhase(true, false)).toBe(H);
    expect(freeTravelPhase(true, true)).toBe(G);
    expect(freeTravelPhase(false, true)).toBeNull();
    expect(freeTravelPhase(false, false)).toBeNull();
  });

  it("⭐⭐ at the START (a press), red and blue FULL screen, green hidden — before any movement", () => {
    // ⛔ RED against `D145`: nothing showed until an input went beyond the deadband.
    const g = stepTravelGizmo(NO_TRAVEL_GIZMO, H, null);
    expect(travelLines(g)).toEqual(["FULL", "HIDDEN", "FULL"]);
  });

  it("⭐⭐ `dx` beyond the deadband turns RED into a ray toward the travel; BLUE stays full", () => {
    let g = stepTravelGizmo(NO_TRAVEL_GIZMO, H, null);
    g = stepTravelGizmo(g, H, T(0.01, 0, 0));
    expect(travelLines(g)).toEqual([1, "HIDDEN", "FULL"]);
  });

  it("⭐⭐⭐ the ray STAYS through a rest and flips only when travel goes the OTHER way", () => {
    let g = stepTravelGizmo(NO_TRAVEL_GIZMO, H, T(0, 0, -0.02));
    expect(travelLines(g)).toEqual(["FULL", "HIDDEN", -1]);
    // ⭐ inside the deadband: no travel at all — nothing changes
    g = stepTravelGizmo(g, H, T(0, 0, 0));
    g = stepTravelGizmo(g, H, null);
    expect(travelLines(g)).toEqual(["FULL", "HIDDEN", -1]);
    // ⭐ beyond it the other way: the ray flips
    g = stepTravelGizmo(g, H, T(0, 0, 0.005));
    expect(travelLines(g)).toEqual(["FULL", "HIDDEN", 1]);
  });

  it("⭐⭐ a TOGGLE to gravity: green FULL alone; its lift turns it into a ray; back to horizontal is full again", () => {
    let g = stepTravelGizmo(NO_TRAVEL_GIZMO, H, T(0.01, 0, -0.01));
    expect(travelLines(g)).toEqual([1, "HIDDEN", -1]);
    g = stepTravelGizmo(g, G, null); // ⭐ the second touch goes down
    expect(travelLines(g)).toEqual(["HIDDEN", "FULL", "HIDDEN"]);
    g = stepTravelGizmo(g, G, T(0, 0.01, 0));
    expect(travelLines(g)).toEqual(["HIDDEN", 1, "HIDDEN"]);
    g = stepTravelGizmo(g, H, null); // ⭐ it lifts: a toggle back, and the sides are forgotten
    expect(travelLines(g)).toEqual(["FULL", "HIDDEN", "FULL"]);
  });

  it("⭐ a travel recorded IN the new phase survives the toggle's reset", () => {
    // ⛔ The reset happens on the phase CHANGE, before this step's travel is applied.
    const g = stepTravelGizmo(stepTravelGizmo(NO_TRAVEL_GIZMO, H, null), G, T(0, -0.01, 0));
    expect(travelLines(g)).toEqual(["HIDDEN", -1, "HIDDEN"]);
  });

  it("⛔ not translating (the grip rotates): no translation line; a NaN travel is ignored", () => {
    expect(travelLines(stepTravelGizmo(NO_TRAVEL_GIZMO, null, T(0.1, 0.1, 0.1)))).toEqual(["HIDDEN", "HIDDEN", "HIDDEN"]);
    const g = stepTravelGizmo(NO_TRAVEL_GIZMO, H, T(NaN, 0, 0));
    expect(travelLines(g)).toEqual(["FULL", "HIDDEN", "FULL"]);
  });

  it("⭐ blue's side is the TRAVEL's: from below the gizmo, finger up comes TOWARD — the ray points at the camera", () => {
    const c = camera(35, -20);
    const t = axisTravel(
      { holderDxPx: 0, holderDyPx: -30, secondDyPx: 0 },
      c.screen,
      live(c),
      PER_PX,
      1,
      1,
      CONE,
      { awaySign: -1 },
    );
    expect(t.depthM).toBeLessThan(0);
    expect(travelLines(stepTravelGizmo(NO_TRAVEL_GIZMO, H, t))[2]).toBe(-1);
  });
});

describe("⛔⛔ `clipSegmentInFront` — a gizmo line with an end BEHIND the camera was never drawn", () => {
  // ⭐ Found building `D150`: blue is the view's own direction since `D145`, so its full-screen line
  // runs back under the camera — and a line crossing behind the eye did not render at all.
  const eye: Vec3 = [0, 0.8, -1.27];
  const view = normalize([0, -0.8, 1.27])!;
  const near = 0.02;
  const depth = (p: Vec3) => dot([p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]], view);

  it("⭐⭐ blue's full line from Scene_0's boot camera is CUT at the front, not dropped", () => {
    // ⭐ The very line the headless run measured: through the gizmo, ±30 m along the flattened view.
    const cut = clipSegmentInFront([0.2, 0, -30.27], [0.2, 0, 30.27], eye, view, near)!;
    expect(cut).not.toBeNull();
    expect(depth(cut[0])).toBeCloseTo(near, 9); // ⭐ the behind end moved up to the plane
    expect(cut[1]).toEqual([0.2, 0, 30.27]); // the far end untouched
  });

  it("⭐ a line wholly in front is returned as it is; wholly behind → null", () => {
    const a: Vec3 = [-1, 0, 0];
    const b: Vec3 = [1, 0, 0];
    expect(clipSegmentInFront(a, b, eye, view, near)).toEqual([a, b]);
    expect(clipSegmentInFront([0, 0.8, -5], [1, 0.8, -6], eye, view, near)).toBeNull();
  });

  it("⭐ either end may be the behind one — a ray drawn TOWARD the camera is cut at its tip", () => {
    const cut = clipSegmentInFront([0.2, 0, 0], [0.2, 0, -30], eye, view, near)!;
    expect(cut[0]).toEqual([0.2, 0, 0]);
    expect(depth(cut[1])).toBeCloseTo(near, 9);
  });

  it("⛔ no view direction, or a NaN end: nothing, never a line through the eye", () => {
    expect(clipSegmentInFront([0, 0, 0], [1, 0, 0], eye, [0, 0, 0], near)).toBeNull();
    expect(clipSegmentInFront([NaN, 0, 0], [1, 0, 0], eye, view, near)).toBeNull();
  });
});

describe("⭐⭐⭐ `D151` — a translation line STOPS where it hits an object, with a white ring there", () => {
  // > *"In addition to the rule already implemented, a translation axis stops where it hits an object
  // > and a white ring gizmo is displayed at this point. If no hit while the axis is displayed, no
  // > change as currently implemented."* — the owner, 2026-09-29
  it("⭐ the halves cast: both sides of a FULL line, the ray's own side, none when hidden", () => {
    expect(travelHalves("FULL")).toEqual([-1, 1]);
    expect(travelHalves(1)).toEqual([1]);
    expect(travelHalves(-1)).toEqual([-1]);
    expect(travelHalves("HIDDEN")).toEqual([]);
  });

  it("⭐⭐ a hit inside the reach shortens the half to it and asks for the ring", () => {
    expect(stopAtHit(30, 0.42)).toEqual({ lengthM: 0.42, hit: true });
    expect(stopAtHit(30, 30)).toEqual({ lengthM: 30, hit: true });
  });

  it("⛔ no hit — or one past the reach, behind, or NaN — leaves the line exactly as before, no ring", () => {
    for (const h of [null, 31, 0, -2, NaN, Infinity]) expect(stopAtHit(30, h)).toEqual({ lengthM: 30, hit: false });
  });
});
