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
  axisPairing,
  displayedAxes,
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

// ⛔⛔⛔ **TWO DESCRIBES STOOD HERE AND THEIR RULE IS DELETED** — `D135`, 2026-09-28. *PLANE* pinned the
// 2×2 solve that kept the body exactly under the finger (`D76`), and *EDGE-ON* pinned its 5° fallback
// and that fallback's signs (`D127`, `D132`, `D133` reverted). ⭐ The owner replaced both with ONE
// rule — each finger channel paired with the axis that looks like it at the gizmo, at a fixed rate —
// so they are replaced rather than kept green (`METHOD`: a suite still certifying the old mapping
// would pass on a revert).

/** ⭐ Where a world point lands on the glass, PERSPECTIVE — independent of the rule under test. */
const screenOf = (p: Vec3, c: ReturnType<typeof camera>): readonly [number, number] => {
  const z = dot(p, c.view);
  return [dot(p, c.screen.right) / z, dot(p, c.screen.up) / z];
};

/** One holder push, the body at `toAnchor` from the camera. */
const push = (c: ReturnType<typeof camera>, axes: ObjectAxes, toAnchor: Vec3, dxPx: number, dyPx: number) =>
  axisTravel(
    { holderDxPx: dxPx, holderDyPx: dyPx, secondDyPx: 0 },
    c.screen,
    axes,
    PER_PX,
    1,
    1,
    CONE,
    { toAnchor, towardGravity: c.gravity.towardGravity },
  );

describe("⭐⭐⭐ `D135` — dx and dy each drive the axis that looks like them at the gizmo, at a fixed rate", () => {
  // > *"For whichever camera vs. center of gizmo configuration, i want to match the dx and dy input
  // > with the respective axis which shows the maximal projection onto screen x and screen y axis.
  // > Then the sense of translation should be the projection of the input onto the axis."* — the
  // > owner, 2026-09-28, with two pictures.
  const axes = axesFromFrame(camera(0, 30).gravity); // ⭐ BOOT axes: red = x, blue = depth
  const onAxis = (c: ReturnType<typeof camera>) => scale(c.view, 1.5);

  it("⭐⭐ PICTURE 1 — blue runs away, red across: dx → red toward screen-right, dy up → blue AWAY", () => {
    const c = camera(20, 12);
    const at = onAxis(c);
    const r = push(c, axes, at, 30, 0);
    expect(Math.abs(r.depthM)).toBe(0);
    expect(screenOf(add(at, axisDisplacement(r, axes)), c)[0]).toBeGreaterThan(screenOf(at, c)[0]);
    const u = push(c, axes, at, 0, -30);
    expect(Math.abs(u.xM)).toBe(0);
    expect(length(add(at, axisDisplacement(u, axes)))).toBeGreaterThan(length(at));
  });

  it("⭐⭐ PICTURE 2 — turned a quarter: dx → BLUE toward screen-right, dy up → RED away (RED: dx drove red)", () => {
    // ⛔ The build before tracked `dx` along red here — whose screen line points at the camera.
    const c = camera(105, 2);
    const at = add(onAxis(c), scale(c.gravity.right, 0.1));
    const r = push(c, axes, at, 30, 0);
    expect(Math.abs(r.xM)).toBe(0);
    expect(Math.abs(r.depthM)).toBeGreaterThan(0);
    expect(screenOf(add(at, axisDisplacement(r, axes)), c)[0]).toBeGreaterThan(screenOf(at, c)[0]);
    const u = push(c, axes, at, 0, -30);
    expect(Math.abs(u.depthM)).toBe(0);
    expect(length(add(at, axisDisplacement(u, axes)))).toBeGreaterThan(length(at));
  });

  it("⭐⭐⭐ THE SWEEP — every orbit, above, level and below, the body OFF-centre: the four promises hold", () => {
    for (const az of [0, 17, 44, 46, 90, 133, 180, 218, 271, 333])
      for (const el of [-20, -3, 0, 3, 15, 45])
        for (const off of [-0.4, 0, 0.35]) {
          const c = camera(az, el);
          const at = add(onAxis(c), scale(c.gravity.right, off));
          const r = push(c, axes, at, 40, 0);
          const u = push(c, axes, at, 0, -40);
          // ① each channel drives exactly ONE horizontal axis, and not the same one
          const dxRed = Math.abs(r.xM) > 0;
          expect(dxRed ? Math.abs(r.depthM) : Math.abs(r.xM)).toBe(0);
          expect(dxRed ? Math.abs(u.xM) : Math.abs(u.depthM)).toBe(0);
          // ② the fixed rate: one pixel buys one tracking factor, on either axis
          expect(Math.hypot(r.xM, r.depthM)).toBeCloseTo(40 * PER_PX, 12);
          expect(Math.hypot(u.xM, u.depthM)).toBeCloseTo(40 * PER_PX, 12);
          // ③ dx right → the body's image moves RIGHT
          expect(screenOf(add(at, axisDisplacement(r, axes)), c)[0]).toBeGreaterThan(screenOf(at, c)[0]);
          // ④ dy up → AWAY from the camera, or TOWARD it looking up (the kept 2026-09-16 flip)
          const grows = length(add(at, axisDisplacement(u, axes))) > length(at);
          expect(grows).toBe(!(c.gravity.towardGravity < 0));
          // ⑤ dx took the axis whose image moves MORE horizontally at the gizmo
          const across = (a: Vec3) => Math.abs(screenOf(add(at, scale(a, 1e-4)), c)[0] - screenOf(at, c)[0]);
          expect(dxRed).toBe(across(axes.x) >= across(axes.depth));
        }
  });

  it("⚠ the pairing swaps where the axes cross the screen equally — between drags, never under one", () => {
    const at40 = axisPairing(camera(40, 15).screen, axes, onAxis(camera(40, 15)), 1)!;
    const at50 = axisPairing(camera(50, 15).screen, axes, onAxis(camera(50, 15)), 1)!;
    expect(at40.dxAxis).not.toBe(at50.dxAxis);
  });

  it("⭐⭐ the gizmo lights the axis MOVED: in picture 2 a pure dx lights BLUE, a pure dy RED", () => {
    const c = camera(105, 2);
    expect(push(c, axes, onAxis(c), 30, 0).driven).toEqual([false, false, true]);
    expect(push(c, axes, onAxis(c), 0, -30).driven).toEqual([true, false, false]);
  });

  it("⭐ `axisPairing` is what the rule applies — the HUD reads the same answer", () => {
    for (const az of [10, 100, 190, 280]) {
      const c = camera(az, 8);
      const p = axisPairing(c.screen, axes, onAxis(c), c.gravity.towardGravity)!;
      const r = push(c, axes, onAxis(c), 25, 0);
      expect(p.dxAxis === "x").toBe(Math.abs(r.xM) > 0);
    }
    expect(axisPairing({ right: [0, 0, 0], up: [0, 1, 0] }, axes, [0, 0, 1], 1)).toBeNull();
  });

  it("⭐ the SECOND touch is untouched: its dy still lifts the body exactly under the finger", () => {
    const c = camera(35, 30);
    const g = run({ secondDyPx: 30 }, c, axes);
    expect(Math.abs(g.xM) + Math.abs(g.depthM)).toBe(0);
    expect(Math.hypot(...toScreenPx(axisDisplacement(g, axes), c.screen))).toBeCloseTo(30, 6);
  });

  it("⛔ cone = 0 still guards the gravity channel from a runaway — the only reader left", () => {
    const g = run({ secondDyPx: -50 }, camera(0, 89.99), axes, 1, 0);
    expect(Number.isFinite(g.gravityM)).toBe(true);
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
    // ⛔⛔ **THE PREMISE, MEASURED FIRST** — and `D135` changed it: under `PLANE` a pure `dx` moved
    // the body along BOTH axes; now it moves exactly ONE, and `driven` names that one.
    const t = run({ holderDxPx: 50 }, c, axes);
    expect(Math.abs(t.xM)).toBeGreaterThan(1e-6);
    expect(Math.abs(t.depthM)).toBe(0);
    expect(t.driven).toEqual([true, false, false]);
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
    expect(Math.abs(t.xM)).toBe(0); // ⭐ `D135`: one channel, one axis
    expect(t.driven).toEqual([false, false, true]);
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
