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
  type TranslatePairing,
} from "@input/axis_translate";
import { axesFromFrame, type ObjectAxes } from "@input/object_axes";
import { gravityFrame } from "@input/gravity_frame";
import { trackingMetresPerPx } from "@input/translate";
import { dot, normalize, type Vec3 } from "@core/vec";

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
  const view: Vec3 = [Math.cos(a) * Math.cos(e), -Math.sin(e), Math.sin(a) * Math.cos(e)];
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
const toScreenPx = (v: Vec3, c: CameraScreenAxes): readonly [number, number] => [
  dot(v, c.right) / PER_PX,
  -dot(v, c.up) / PER_PX,
];

const run = (
  input: Partial<AxisInputsPx>,
  c: ReturnType<typeof camera>,
  axes: ObjectAxes,
  pairing: TranslatePairing = "PLANE",
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
    pairing,
    cone,
    c.gravity.towardGravity,
  );

describe("⭐⭐⭐ PLANE — the body follows the finger inside its own {x, gravity} plane", () => {
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
          // ⛔⛔ **THE DEGENERACY MOVED WITH THE PLANE — `D83`.** `{x, depth}` went edge-on at a
          // LEVEL camera; `{x, gravity}` goes edge-on where **x points at the camera**, which
          // this sweep reaches at azimuth 90° against boot axes. ⭐ There the solve is abandoned
          // per axis, and what must hold is that the body still MOVES — the round trip is not
          // available, because the finger is asking for a travel the plane cannot show.
          if (t.edgeOn) {
            expect(Math.hypot(...axisDisplacement(t, axes))).toBeGreaterThan(0);
            continue;
          }
          const landed = toScreenPx(axisDisplacement(t, axes), c.screen);
          expect(landed[0]).toBeCloseTo(dx!, 6);
          expect(landed[1]).toBeCloseTo(dy!, 6);
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
    // ⭐ And it genuinely used BOTH of the holder's axes to do it — otherwise this fixture would
    // be in the set where the pairing question does not arise. ⚠ `gravity` since `D83`: the
    // holder's plane is the VERTICAL one now, so keeping the body on a horizontal screen line
    // takes some vertical world travel.
    expect(Math.abs(t.xM)).toBeGreaterThan(1e-6);
    expect(Math.abs(t.gravityM)).toBeGreaterThan(1e-6);
    // ⛔ And the second finger's axis is untouched by a holder drag.
    expect(t.depthM).toBeCloseTo(0, 15);
  });

  it("⭐ NO CHANNEL LOSES THE COSINE — report 2's actual complaint", () => {
    // ⚠ *"the input seems very weak and not the same as the gravity axis input which is right"*.
    // ⛔⛔ **AND THE OLD FORM OF THIS VECTOR ONLY HELD BY ACCIDENT OF THE OLD MAPPING.** It
    // compared the three channels' SCREEN travel against the full 30 px, which is right for the
    // holder's plane (the body follows the finger) and for a channel whose screen line is
    // VERTICAL — which gravity's is, and which the second finger used to drive.
    // ⭐ Since `D83` that finger drives **depth**, whose screen line is slanted, so a vertical
    // input can only move the body along the PART of itself that lies along that line: 30 px of
    // finger buys `30·cos θ` of screen travel, by construction and not by a loss.
    // ⛔ So the invariant is stated properly: the body's screen travel ALONG the axis's own line
    // equals the finger's travel along that line. That is Blender's `G X`, and it has no cosine
    // loss — the quantity report 2 was about.
    const c = camera(35, 30);
    const axes = axesFromFrame(camera(0, 30).gravity);
    const landedPx = (t: ReturnType<typeof run>) => toScreenPx(axisDisplacement(t, axes), c.screen);
    // ⭐ The holder's pair: exactly under the finger, both components.
    const holder = landedPx(run({ holderDxPx: 30, holderDyPx: -18 }, c, axes));
    expect(holder[0]).toBeCloseTo(30, 6);
    expect(holder[1]).toBeCloseTo(-18, 6);
    // ⭐ The second finger's single axis: its projection onto the axis's screen line is exact.
    const sd = screenShadow(axes.depth, c.screen)!;
    const unit = [sd[0] / Math.hypot(...sd), sd[1] / Math.hypot(...sd)] as const;
    const got = landedPx(run({ secondDyPx: 30 }, c, axes));
    const askedAlong = 0 * unit[0] + 30 * unit[1];
    expect(got[0] * unit[0] + got[1] * unit[1]).toBeCloseTo(askedAlong, 6);
    // ⚠ And it moves ONLY along that line — no component across it.
    expect(got[0] * unit[1] - got[1] * unit[0]).toBeCloseTo(0, 9);
  });

  it("⭐ the gains multiply the tracking factor, and 1.0 is 'under the finger'", () => {
    const c = camera(20, 40);
    const axes = axesFromFrame(c.gravity);
    const t = run({ holderDxPx: 10, holderDyPx: -10 }, c, axes, "PLANE", 2);
    const landed = toScreenPx(axisDisplacement(t, axes), c.screen);
    expect(landed[0]).toBeCloseTo(20, 6);
    expect(landed[1]).toBeCloseTo(-20, 6);
  });
});

describe("CHANNELS — the dictated pairing, each axis tracking exactly", () => {
  it("⭐ `dx` slides the body ALONG the x axis's screen line, at the finger's rate", () => {
    // ⛔ Blender's `G X`: the body moves along the axis by the component of the pointer motion
    // lying along that axis's screen image — no cosine loss, and no motion at all from the part
    // of the drag that runs across the axis.
    const c = camera(35, 30);
    const axes = axesFromFrame(camera(0, 30).gravity);
    const t = run({ holderDxPx: 50 }, c, axes, "CHANNELS");
    expect(t.gravityM).toBeCloseTo(0, 15);
    expect(t.depthM).toBeCloseTo(0, 15);
    const s = screenShadow(axes.x, c.screen)!;
    const len = Math.hypot(s[0], s[1]);
    const landed = toScreenPx(axisDisplacement(t, axes), c.screen);
    expect(landed[0]).toBeCloseTo((50 * s[0] * s[0]) / (len * len), 6);
    expect(landed[1]).toBeCloseTo((50 * s[0] * s[1]) / (len * len), 6);
  });

  it("⛔ the two pairings genuinely DISAGREE for the photographed configuration", () => {
    const c = camera(35, 30);
    const axes = axesFromFrame(camera(0, 30).gravity);
    const plane = run({ holderDxPx: 50 }, c, axes, "PLANE");
    const chan = run({ holderDxPx: 50 }, c, axes, "CHANNELS");
    // ⚠ `gravity` since `D83` — the channel the two pairings disagree about is the holder's
    // SECOND axis, and that is gravity now.
    expect(Math.abs(plane.gravityM - chan.gravityM)).toBeGreaterThan(1e-4);
  });
});

describe("⛔⛔ EDGE-ON — the DEPTH axis facing the camera, and the judged fallback", () => {
  // ⚠⚠ **THIS DESCRIBE CHANGED SUBJECT WITH `D83`.** It used to be *"a level camera, which is
  // report 3"* — the HOLDER's `dy` drove depth, and the holder's plane went edge-on wherever the
  // camera was level. ⭐ Since the swap the holder's plane is `{x, gravity}` and `depth` belongs
  // to the second touchpoint, so the judged fixed rate is back on the channel it was judged for.

  it("the body KEEPS MOVING in depth, at the judged fixed rate, instead of going dead", () => {
    // ⚠ The old rule returned exactly 0 here and a hand called it out. ⛔ Blender goes quiet too
    // (`axisProjection` switches to a plain projection inside 5°); this deliberately does not.
    const c = camera(0, 0);
    const axes = axesFromFrame(camera(0, 30).gravity);
    const t = run({ secondDyPx: -50 }, c, axes);
    expect(t.edgeOn).toBe(true);
    // ⭐ FINGERS-UP IS AWAY at a level camera — the convention, since the picture is symmetric
    // there and no sign is derivable from it.
    expect(t.depthM).toBeGreaterThan(0);
    // ⭐ At the fixed rate: one pixel of finger buys one tracking factor of world travel.
    expect(t.depthM).toBeCloseTo(50 * PER_PX, 9);
    // ⚠ And the HOLDER's own channels are untouched by that degeneracy.
    expect(run({ holderDxPx: 30 }, c, axes).xM).not.toBe(0);
    expect(run({ holderDyPx: 30 }, c, axes).gravityM).not.toBe(0);
  });

  it("⭐⭐ the SIGN is continuous through the cone — the defect that was found by finger", () => {
    // ⛔ *"when the camera is on the bottom ring facing upwards, the depth translation is
    // chaotic"* — fingers-up means AWAY seen from above and TOWARDS seen from below. ⚠ Inside
    // the cone the sign is still read from `towardGravity`, so entering the cone from either
    // side flips nothing.
    const axes = axesFromFrame(camera(0, 30).gravity);
    const push = { secondDyPx: -50 };
    const aboveOutside = run(push, camera(0, 20), axes).depthM;
    const aboveInside = run(push, camera(0, 2), axes).depthM;
    const belowInside = run(push, camera(0, -2), axes).depthM;
    const belowOutside = run(push, camera(0, -20), axes).depthM;
    expect(Math.sign(aboveOutside)).toBe(Math.sign(aboveInside));
    expect(Math.sign(belowOutside)).toBe(Math.sign(belowInside));
    expect(Math.sign(aboveInside)).not.toBe(Math.sign(belowInside));
  });

  it("⛔⛔⛔ A DEGENERATE HOLDER PLANE DEGRADES PER AXIS — it does NOT freeze the body", () => {
    // ⛔⛔ **THE FAILURE MODE `D83` HAD TO AVOID.** With `{x, gravity}` the plane is edge-on when
    // **x points at the camera**, and the branch it replaced assumed the opposite (*"x is still
    // healthy, it lies across the screen"*) — which would have tracked the SICK axis and
    // fixed-rated the healthy one. ⭐ Each channel keeps its OWN axis instead, tracking where the
    // axis is presented well enough and at a fixed rate where it is not.
    // ⚠ FIXTURE, CORRECTED: azimuth 0 is the camera looking ALONG +x; at 90° the view is
    // along z and x lies across the screen, fully visible — the opposite of the premise.
    const c = camera(0, 12); // ⭐ looking along the x axis
    const axes: ObjectAxes = { x: [1, 0, 0], gravity: [0, 1, 0], depth: [0, 0, 1] };
    const sx = screenShadow(axes.x, c.screen)!;
    expect(Math.hypot(...sx)).toBeLessThan(0.3); // ⚠ the premise: x really is edge-on here
    for (const dx of [60, -60]) {
      const t = run({ holderDxPx: dx }, c, axes);
      expect(t.edgeOn).toBe(true);
      expect(Math.abs(t.xM)).toBeGreaterThan(0); // ⛔ it moves — no dead channel
      expect(t.gravityM).toBeCloseTo(0, 12); // ⛔ and it stays on its OWN axis
      expect(t.depthM).toBeCloseTo(0, 15);
    }
    // ⭐ A back-and-forth returns the body exactly: within one pose nothing reverses.
    const out = run({ holderDxPx: 60 }, c, axes);
    const back = run({ holderDxPx: -60 }, c, axes);
    expect(out.xM + back.xM).toBeCloseTo(0, 12);
    // ⭐ And the vertical channel is unharmed by x's degeneracy — fingers UP lifts.
    expect(run({ holderDyPx: -40 }, c, axes).gravityM).toBeGreaterThan(0);
  });

  it("⚠ the RATE steps at the boundary, and the step is stated rather than hidden", () => {
    // ⛔ Just outside the cone the exact mapping is buying `1/sin(5°)` ≈ 11× the tracking factor;
    // inside it the fallback buys 1×. ⭐ Neither produces visible SCREEN motion there, which is
    // why this is a cost and not a defect — but a vector says the number out loud.
    const axes = axesFromFrame(camera(0, 30).gravity);
    const justOutside = run({ secondDyPx: -50 }, camera(0, 5.5), axes);
    const justInside = run({ secondDyPx: -50 }, camera(0, 4.5), axes);
    expect(justOutside.edgeOn).toBe(false);
    expect(justInside.edgeOn).toBe(true);
    expect(Math.abs(justOutside.depthM / justInside.depthM)).toBeGreaterThan(5);
    expect(1 / Math.sin(CONE * DEG)).toBeCloseTo(11.47, 1);
  });

  it("⛔ cone = 0 disables the fallback — the runaway a hand is being protected from", () => {
    const axes = axesFromFrame(camera(0, 30).gravity);
    const t = run({ secondDyPx: -50 }, camera(0, 0.05), axes, "PLANE", 1, 0);
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
    const t = run({ holderDxPx: NaN, holderDyPx: Infinity, secondDyPx: 5 }, c, axes);
    for (const n of [t.xM, t.depthM, t.gravityM]) expect(Number.isFinite(n)).toBe(true);
    // ⛔ The two poisoned channels are the HOLDER's, and they contribute nothing…
    expect(t.xM).toBeCloseTo(0, 15);
    expect(t.gravityM).toBeCloseTo(0, 15);
    // ⭐ …and the FINITE one still moves the body: one bad number must not cost the channel
    // beside it, which is what makes this a sanitiser rather than a mute.
    // ⚠ `secondDyPx` drives DEPTH since `D83`; this vector asserted `gravity` before the swap.
    expect(Math.abs(t.depthM)).toBeGreaterThan(0);
    for (const n of axisDisplacement(t, axes)) expect(Number.isFinite(n)).toBe(true);
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
      "PLANE",
      CONE,
      0,
    );
    expect(t.xM).toBe(0);
    expect(t.gravityM).toBe(0);
    expect(t.depthM).toBe(0);
    expect(screenShadow([0, 0, 0], c.screen)).toBeNull();
  });
});
