/**
 * GOLDEN VECTORS — §2 rule 1, camera orbit on a three-ring surface.
 *
 * ⛔⛔ THE OWNER AMENDED THIS RULE: the orbit is driven by DELTA POSITION, not device
 * tilt, and it **stops short** at rings defined by radius AND height.
 *
 * ⭐ The vectors are written against `IN1`'s three expensive shapes:
 *   * direction is asserted as *what a hand expects*, never as an internal sign —
 *     `IN1` shipped yaw AND pitch inverted because the sign was self-consistent;
 *   * the surface is checked to pass through all three rings, because a Bézier
 *     (which does not) is the obvious wrong choice here;
 *   * the limits are checked to HOLD under abuse, not merely to exist.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import {
  OrbitCentreBlend,
  OrbitController,
  distanceTurningPoints,
  orbitOffset,
  rigsOf,
} from "../src/input/orbit";
import { MotionTracker } from "../src/input/motion";
import { mmToPx } from "../src/core/units";
import type { Vec3 } from "../src/core/vec";
import { gravityFrame } from "../src/input/gravity_frame";
import { WORLD_DOWN } from "../src/core/object_model";

const cfg = DEFAULT_CONFIG;

describe("the orbit surface", () => {
  it("⭐ passes through ALL THREE rings, not just the outer two", () => {
    // ⛔ A Bézier's middle control point is NOT on its curve, so the middle ring would
    // be a bias rather than a ring the camera visits. The owner asked for three rings
    // to tune; two rings and a hint is a different feature.
    const { bottom, middle, top } = rigsOf(cfg);
    for (const [v, ring] of [[0, bottom], [0.5, middle], [1, top]] as const) {
      const pose = orbitOffset(cfg, 0, v, 1);
      expect(pose.offsetM[1]).toBeCloseTo(ring.heightM, 9);
      expect(Math.hypot(pose.offsetM[0], pose.offsetM[2])).toBeCloseTo(ring.radiusM, 9);
    }
  });

  it("⭐⭐ STOPS SHORT — elevation cannot leave the rings however hard you drag", () => {
    for (const v of [-10, -0.001, 1.001, 99]) {
      const pose = orbitOffset(cfg, 0, v, 1);
      const { bottom, top } = rigsOf(cfg);
      expect(pose.offsetM[1]).toBeGreaterThanOrEqual(Math.min(bottom.heightM, top.heightM) - 1e-9);
      expect(pose.offsetM[1]).toBeLessThanOrEqual(Math.max(bottom.heightM, top.heightM) + 1e-9);
    }
  });

  it("yaw sweeps a full circle and returns", () => {
    const a = orbitOffset(cfg, 0, 0.5, 1);
    const b = orbitOffset(cfg, 2 * Math.PI, 0.5, 1);
    for (let i = 0; i < 3; i++) expect(b.offsetM[i]).toBeCloseTo(a.offsetM[i]!, 9);
  });

  it("⭐ zoom scales the surface WITHOUT changing the viewing angle", () => {
    // Radius and height scale together, so pinch zoom (rule 4) and the orbit compose
    // instead of fighting over one radius.
    const near = orbitOffset(cfg, 1, 0.7, 0.5);
    const far = orbitOffset(cfg, 1, 0.7, 2);
    expect(far.radiusM / near.radiusM).toBeCloseTo(4, 9);
    // Same direction, different length.
    for (let i = 0; i < 3; i++) {
      expect(far.offsetM[i]! / near.offsetM[i]!).toBeCloseTo(4, 6);
    }
  });
});

describe("orbit drag — the directions a hand expects", () => {
  const drag = (dxMm: number, dyMm: number) => {
    const c = new OrbitController(cfg, 0, 0.5);
    c.drag(mmToPx(dxMm), mmToPx(dyMm));
    return c;
  };

  // ⛔⛔ DECLARED TRUTH, chosen by the owner on the device (2026-09-14):
  // *"if fingers move up and right, camera orbits down and left"* — the camera moves
  // OPPOSITE the finger. That is the "grab the world" convention: the finger pushes
  // the scene and the camera swings the other way, so whatever is under the thumb
  // tracks with it.
  // ⭐ Both readings are defensible and they are exact opposites, which is why this is
  // a decision and not a detail. An internally consistent sign cannot tell you which
  // one a hand expects — `IN1` shipped yaw AND pitch inverted for that very reason.

  it("⭐ finger RIGHT orbits the camera LEFT, and the reverse", () => {
    expect(drag(20, 0).yaw).toBeLessThan(0);
    expect(drag(-20, 0).yaw).toBeGreaterThan(0);
  });

  it("⭐ finger UP orbits the camera DOWN, and the reverse", () => {
    // ⚠ `dyPx` is positive DOWNWARD, so a finger moving UP is a negative dy.
    expect(drag(0, -20).elevation).toBeLessThan(0.5); // finger up → camera lower
    expect(drag(0, 20).elevation).toBeGreaterThan(0.5);
  });

  it("⛔ the two axes are inverted CONSISTENTLY — not one and not the other", () => {
    // ⚠ A half-applied inversion is the likeliest way to get this wrong, and it feels
    // like neither convention. Asserted together so one cannot drift from the other.
    const c = drag(20, -20); // up and right
    expect(c.yaw).toBeLessThan(0); // … orbits left
    expect(c.elevation).toBeLessThan(0.5); // … and down
  });

  it("⭐ gains are per MILLIMETRE, so a denser screen does not change the gesture", () => {
    // The same physical 20 mm of travel must give the same yaw whatever the DPI.
    const c = new OrbitController(cfg, 0, 0.5);
    c.drag(mmToPx(20), 0);
    expect(c.yaw).toBeCloseTo(-20 * cfg.gainOrbitYaw, 9);
  });

  it("⭐⭐ the elevation limit HOLDS under sustained dragging", () => {
    // Not merely "a clamp exists": drag far past it, repeatedly, and check it neither
    // escapes nor accumulates a debt that has to be paid back before it moves again.
    const c = new OrbitController(cfg, 0, 0.5);
    for (let i = 0; i < 200; i++) c.drag(0, mmToPx(10));
    expect(c.elevation).toBe(1);
    expect(c.atLimit).toBe(true);
    // ⛔ One small drag the other way must move it IMMEDIATELY — if the clamp had
    // stored the overshoot, the camera would sit dead for 2 metres of finger travel.
    c.drag(0, mmToPx(-5));
    expect(c.elevation).toBeLessThan(1);
  });

  it("a drag of nothing changes nothing", () => {
    const c = new OrbitController(cfg, 1.2, 0.3);
    c.drag(0, 0);
    expect(c.yaw).toBe(1.2);
    expect(c.elevation).toBe(0.3);
  });
});

describe("⛔ the ring config is validated", () => {
  it("REFUSES rings whose heights do not climb", () => {
    expect(
      () => new MotionTracker({ ...cfg, orbitTopHeightM: -1 }),
    ).toThrow(/fold back|increase/);
  });

  it("REFUSES a negative radius", () => {
    expect(() => new MotionTracker({ ...cfg, orbitTopRadiusM: -0.1 })).toThrow(/POSITIVE/);
  });

  it("⛔⛔ REFUSES a radius of ZERO — and this vector used to assert the opposite", () => {
    // ⛔⛔⛔ **THE MOST INSTRUCTIVE VECTOR IN THIS FILE, BECAUSE IT WAS WRONG AND GREEN.**
    // It read *"⭐ ACCEPTS a top radius of zero — directly overhead is a legal orbit"*, and
    // every word of its reasoning was defensible **about the orbit surface alone**: the ring
    // collapses to the vertical axis, the height still carries the camera a real distance
    // away, and nothing in `orbit.ts` divides by the radius.
    //
    // ⛔⛔ **MEANWHILE `render/scene.ts` ASSERTED THE OPPOSITE, IN A THROW**:
    // `requireGestureFrame` raises *"the camera is looking exactly along gravity ... the
    // orbit surface is supposed to make this unreachable — see A7."* ⚠ Two components, two
    // invariants, pointing in opposite directions, each with a comment explaining itself.
    // ⭐⭐ Composed — which nobody had done — `?orbitTopRadiusM=0` plus a drag to the top ring
    // makes **every press throw**: `gravityFrame` returns `null` there, because the roll axis
    // is *the view direction flattened onto the ground* and that is the zero vector.
    // ⛔ `METHOD`: *a composition is a thing to MEASURE, not an emergent property* — mistake
    // shape 4, found by audit rather than by a hand, in a pair of files that never met.
    expect(() => new MotionTracker({ ...cfg, orbitTopRadiusM: 0 })).toThrow(/POSITIVE/);
    expect(() => new MotionTracker({ ...cfg, orbitBottomRadiusM: 0 })).toThrow(/POSITIVE/);
    expect(() => new MotionTracker({ ...cfg, orbitMiddleRadiusM: 0 })).toThrow(/POSITIVE/);
  });
});

/**
 * ⭐⭐⭐ **THE COMPOSITION `requireGestureFrame` HAS ALWAYS CLAIMED, NOW MEASURED.**
 *
 * ⛔⛔ `scene.ts` throws if the camera ever looks along gravity and says the orbit surface
 * makes that *"unreachable"*. ⚠ That claim spans two modules and was asserted in prose in one
 * of them, which is exactly the shape `A7` was withdrawn over: *every part had green vectors
 * and the composition had none.* ⭐ This sweeps the whole reachable surface and asks the
 * gravity frame directly.
 */
describe("⭐⭐ the orbit surface NEVER reaches a pole — the frame exists everywhere on it", () => {
  it("⛔ gravityFrame is non-null at every (yaw, elevation, zoom) the surface can produce", () => {
    for (let yawStep = 0; yawStep < 12; yawStep++) {
      const yaw = (yawStep / 12) * 2 * Math.PI;
      for (let vStep = 0; vStep <= 40; vStep++) {
        // ⚠ Deliberately driven OUTSIDE [0, 1] as well: the clamp is part of what is claimed.
        const v = -0.25 + (vStep / 40) * 1.5;
        for (const zoom of [0.5, 1, 2]) {
          const pose = orbitOffset(cfg, yaw, v, zoom);
          // ⭐ The camera sits at `offsetM` from the target and looks back at it.
          const viewAxis: [number, number, number] = [
            -pose.offsetM[0],
            -pose.offsetM[1],
            -pose.offsetM[2],
          ];
          const frame = gravityFrame(viewAxis, WORLD_DOWN);
          expect(frame, `yaw=${yaw.toFixed(2)} v=${v.toFixed(3)} zoom=${zoom}`).not.toBeNull();
        }
      }
    }
  });

  it("⭐ and the horizontal reach never collapses, which is WHY the frame exists", () => {
    // ⚠ The frame dies when the view axis is vertical, i.e. when the horizontal offset is
    // zero. ⛔ Stating it as a DISTANCE makes the margin visible instead of binary.
    let worst = Infinity;
    for (let vStep = 0; vStep <= 100; vStep++) {
      const pose = orbitOffset(cfg, 0, vStep / 100, 1);
      worst = Math.min(worst, Math.hypot(pose.offsetM[0], pose.offsetM[2]));
    }
    expect(worst).toBeGreaterThan(0.05);
  });
});

/**
 * ⭐⭐⭐ THE SHAPE OF THE WHOLE SURFACE — the vectors that would have caught the
 * device-reported defect of 2026-09-14.
 *
 * Owner: *"when I move the finger up from bottom rig, the orbit radius increases,
 * decreases, increases: there should be only two changes, not three (there are only
 * three rigs and therefore two transitions)."*
 *
 * ⛔ Every vector above passed while that was true. They checked that the surface
 * PASSES THROUGH the three rings and that it STOPS at the outer two — both correct,
 * both blind to what the surface does BETWEEN them.
 *
 * ⭐⭐ `METHOD`: *"A COMPOSITION IS A THING TO MEASURE, NOT AN EMERGENT PROPERTY. Ask
 * what the whole chain does, in one expression, and check it."* Radius and height
 * were each interpolated defensibly; nobody had computed what `hypot` of the two did.
 * Measured on the shipped rings: the distance rose to 0.615 m, fell to 0.550, then
 * rose to 0.583 — two turning points from three rings.
 */
describe("⭐⭐⭐ the orbit surface, measured as a whole", () => {
  /** How many times a sampled curve changes direction. */
  function turningPoints(values: readonly number[]): number {
    const dirs: number[] = [];
    for (let i = 1; i < values.length; i++) {
      const d = values[i]! - values[i - 1]!;
      // ⚠ Ignore steps too small to be a real change, or float noise at an extremum
      // would be counted as a turn and the vector would measure rounding.
      if (Math.abs(d) > 1e-9) dirs.push(Math.sign(d));
    }
    let turns = 0;
    for (let i = 1; i < dirs.length; i++) if (dirs[i] !== dirs[i - 1]) turns++;
    return turns;
  }

  /** Sample the surface from bottom ring to top. */
  const sweep = (c = cfg, steps = 200) =>
    Array.from({ length: steps + 1 }, (_, i) => orbitOffset(c, 0, i / steps, 1));

  it("⭐⭐ THREE RINGS GIVE TWO TRANSITIONS — the distance turns at most ONCE", () => {
    // ⛔ THE DEFECT, PINNED. Independently interpolating radius and height and then
    // combining them gave TWO turning points here.
    expect(turningPoints(sweep().map((p) => p.radiusM))).toBeLessThanOrEqual(1);
  });

  it("⭐⭐ ...and so does the HORIZONTAL radius, which is what the eye reads", () => {
    const horizontal = sweep().map((p) => Math.hypot(p.offsetM[0], p.offsetM[2]));
    expect(turningPoints(horizontal)).toBeLessThanOrEqual(1);
  });

  it("⭐ the camera HEIGHT climbs all the way up, without ever dipping", () => {
    // Dragging up must raise the camera monotonically; a dip would read as the orbit
    // briefly reversing, which is the same complaint in a different coordinate.
    expect(turningPoints(sweep().map((p) => p.offsetM[1]))).toBe(0);
  });

  /** ⚠ Shapes `IN5` might plausibly land on — a vector that only checks the shipped
   *  defaults certifies today's numbers, not the geometry. */
  const PLAUSIBLE = [
    { orbitBottomRadiusM: 0.8, orbitMiddleRadiusM: 0.5, orbitTopRadiusM: 0.2 },
    { orbitBottomRadiusM: 0.6, orbitMiddleRadiusM: 0.6, orbitTopRadiusM: 0.6 },
    { orbitBottomHeightM: -0.8, orbitMiddleHeightM: -0.1, orbitTopHeightM: 0.2 },
    { orbitTopRadiusM: 0, orbitTopHeightM: 0.7 },
  ];
  /** A deliberate 4.5x radius bulge. ⚠ See the known-limit vector below. */
  const PATHOLOGICAL = {
    orbitBottomRadiusM: 0.2,
    orbitMiddleRadiusM: 0.9,
    orbitTopRadiusM: 0.1,
  };

  it("⭐⭐ NO OVERSHOOT — the surface never leaves the rings, for ANY shape", () => {
    // ⛔ THE OWNER'S REQUIREMENT IN THEIR OWN WORDS: *"define height and radius of top
    // and bottom rigs and not exceed these."* Shape-preserving interpolation gives
    // this for free — no-overshoot is exactly what it means — and it is why the
    // interpolation is done in the RINGS' OWN coordinates. Interpolating the camera's
    // (distance, angle) instead was shipped first and swung the horizontal radius to
    // 0.532 m when no ring exceeded 0.500 m.
    for (const shape of [...PLAUSIBLE, PATHOLOGICAL]) {
      const c = { ...cfg, ...shape };
      const { bottom, middle, top } = rigsOf(c);
      const rMin = Math.min(bottom.radiusM, middle.radiusM, top.radiusM);
      const rMax = Math.max(bottom.radiusM, middle.radiusM, top.radiusM);
      const hMin = Math.min(bottom.heightM, middle.heightM, top.heightM);
      const hMax = Math.max(bottom.heightM, middle.heightM, top.heightM);
      for (const pose of sweep(c)) {
        const horizontal = Math.hypot(pose.offsetM[0], pose.offsetM[2]);
        expect(horizontal).toBeGreaterThanOrEqual(rMin - 1e-9);
        expect(horizontal).toBeLessThanOrEqual(rMax + 1e-9);
        expect(pose.offsetM[1]).toBeGreaterThanOrEqual(hMin - 1e-9);
        expect(pose.offsetM[1]).toBeLessThanOrEqual(hMax + 1e-9);
      }
    }
  });

  it("⭐ the HEIGHT climbs for every ring shape — now universal, not shape-dependent", () => {
    for (const shape of [...PLAUSIBLE, PATHOLOGICAL]) {
      expect(turningPoints(sweep({ ...cfg, ...shape }).map((p) => p.offsetM[1]))).toBe(0);
    }
  });

  it("⭐⭐ the SHIPPED rings give TWO TRANSITIONS — one turning point in the distance", () => {
    // ⛔ The reported defect, pinned against the config actually in use. The owner
    // chose these six numbers on the device: a WAIST, 0.5 → 0.36 → 0.5 m.
    expect(distanceTurningPoints(cfg)).toBeLessThanOrEqual(1);
    expect(turningPoints(sweep().map((p) => p.radiusM))).toBeLessThanOrEqual(1);
  });

  it("⛔⛔ a ring set that would turn TWICE is REFUSED, not silently accepted", () => {
    // ⚠ Not every ring set is clean, and pretending otherwise would be the mistake.
    // A radius that HUMPS while the height climbs makes the distance swing in and out
    // again — exactly what was reported by finger. ⭐ The validator refuses it, so the
    // tuning menu explains the problem instead of leaving it to be rediscovered.
    const humped = {
      ...cfg,
      orbitBottomRadiusM: 0.45,
      orbitMiddleRadiusM: 0.6,
      orbitTopRadiusM: 0.3,
      orbitBottomHeightM: -0.35,
      orbitMiddleHeightM: 0,
      orbitTopHeightM: 0.5,
    };
    expect(distanceTurningPoints(humped)).toBeGreaterThan(1);
    expect(() => new MotionTracker(humped)).toThrow(/two transitions/);
  });

  it("⭐ and the rings are STILL hit exactly — the fix changed shape, not anchors", () => {
    const { bottom, middle, top } = rigsOf(cfg);
    for (const [v, ring] of [[0, bottom], [0.5, middle], [1, top]] as const) {
      const pose = orbitOffset(cfg, 0, v, 1);
      expect(pose.offsetM[1]).toBeCloseTo(ring.heightM, 9);
      expect(Math.hypot(pose.offsetM[0], pose.offsetM[2])).toBeCloseTo(ring.radiusM, 9);
    }
  });
});

/**
 * ⭐⭐ THE ORBIT CENTRE MIGRATES — device-reported 2026-09-14: *"when I touchpoint on
 * another barycenter, the camera position jumps to a new position… I do not want this
 * jump. I want the camera quaternion and position to blend to the new orbit along the
 * progress of the delta position."*
 *
 * ⭐ Blending the CENTRE blends both at once: the camera sits at `centre + offset` and
 * looks at `centre`, so there is no second interpolation that could fall out of step.
 */
describe("⭐⭐ orbit centre blend", () => {
  const A: Vec3 = [0, 0, 0];
  const B: Vec3 = [1, 0, 0];

  it("⭐⭐ retargeting does NOT jump — the centre starts where it was", () => {
    // ⛔ THE REPORTED DEFECT, PINNED. The first frame after a new barycentre is chosen
    // must be indistinguishable from the last frame before it.
    const b = new OrbitCentreBlend(cfg, A);
    b.retarget(B);
    expect(b.centreM).toEqual(A);
    expect(b.isBlending).toBe(true);
  });

  it("⭐ it ARRIVES after the budgeted finger travel, exactly", () => {
    const b = new OrbitCentreBlend(cfg, A);
    b.retarget(B);
    b.advance(cfg.orbitBlendDistanceMm);
    expect(b.progress).toBe(1);
    expect(b.centreM).toEqual(B);
    expect(b.isBlending).toBe(false);
  });

  it("⭐ and it does not overshoot however far the finger keeps going", () => {
    const b = new OrbitCentreBlend(cfg, A);
    b.retarget(B);
    b.advance(cfg.orbitBlendDistanceMm * 50);
    expect(b.centreM).toEqual(B);
  });

  it("⭐ progress is EASED — no velocity step at either end", () => {
    // A linear blend starts and stops abruptly, which reads as two small jumps at the
    // ends instead of one big one in the middle.
    const b = new OrbitCentreBlend(cfg, A);
    b.retarget(B);
    const step = cfg.orbitBlendDistanceMm / 20;
    const deltas: number[] = [];
    let prev = 0;
    for (let i = 0; i < 20; i++) {
      b.advance(step);
      deltas.push(b.progress - prev);
      prev = b.progress;
    }
    // Slow at the start, fastest in the middle, slow at the end.
    expect(deltas[0]!).toBeLessThan(deltas[9]!);
    expect(deltas[19]!).toBeLessThan(deltas[9]!);
  });

  it("⛔⛔ retargeting MID-BLEND starts from where the centre IS, not the old target", () => {
    // ⚠ Interrupt a half-finished migration and the previous target is a point the
    // camera never reached; resuming from it would put the jump straight back.
    // ⭐ Third instance of this lesson on this project — a difference is only
    // meaningful when BOTH of its ends are current.
    const C: Vec3 = [0, 1, 0];
    const b = new OrbitCentreBlend(cfg, A);
    b.retarget(B);
    b.advance(cfg.orbitBlendDistanceMm / 2);
    const midway = b.centreM;
    expect(midway[0]).toBeGreaterThan(0);
    expect(midway[0]).toBeLessThan(1);

    b.retarget(C);
    // No discontinuity across the retarget.
    expect(b.centreM).toEqual(midway);
    b.advance(cfg.orbitBlendDistanceMm);
    expect(b.centreM).toEqual(C);
  });

  it("⛔ a budget of ZERO is legal and reproduces the old jump — for an A/B", () => {
    const b = new OrbitCentreBlend({ ...cfg, orbitBlendDistanceMm: 0 }, A);
    b.retarget(B);
    expect(b.progress).toBe(1);
    expect(b.centreM).toEqual(B);
  });

  it("⛔ a finger that does not move does not advance the blend", () => {
    // The whole point of measuring travel rather than time: the camera must not drift
    // on its own while the finger is still.
    const b = new OrbitCentreBlend(cfg, A);
    b.retarget(B);
    for (let i = 0; i < 100; i++) b.advance(0);
    expect(b.centreM).toEqual(A);
  });
});

/**
 * ⭐ The diagnostic marker is drawn at `targetM`, not at the blended centre — owner's
 * instruction, 2026-09-14. It exists to show which barycentre §2 rule 1 SELECTED, and
 * a marker that crawls along with the camera makes that harder to read, not easier.
 */
describe("⭐ the chosen centre is readable immediately", () => {
  const A: Vec3 = [0, 0, 0];
  const B: Vec3 = [1, 0, 0];

  it("⭐ the TARGET is the new barycentre the instant it is chosen", () => {
    const b = new OrbitCentreBlend(cfg, A);
    b.retarget(B);
    expect(b.targetM).toEqual(B);
    // ⛔ …while the centre the camera orbits has not moved at all yet. Both facts at
    // once is the whole point: the gap between them IS the migration.
    expect(b.centreM).toEqual(A);
  });

  it("⭐ and the two converge as the finger travels", () => {
    const b = new OrbitCentreBlend(cfg, A);
    b.retarget(B);
    b.advance(cfg.orbitBlendDistanceMm);
    expect(b.centreM).toEqual(b.targetM);
  });
});

/**
 * ⭐ THE CAMERA RESET — §1.3's double-tap outside any object.
 * ⛔ Getting lost is easy: yaw wraps without limit while the elevation is clamped to its
 * rings, so "spin back the way I came" is not something a hand can reliably do. The
 * reset is the way out, which means it has to put back EVERYTHING that defines the view.
 */
describe("resetting the orbit", () => {
  it("⭐ puts yaw and elevation back exactly", () => {
    const o = new OrbitController(DEFAULT_CONFIG, -Math.PI / 2, 0.62);
    o.drag(500, -400);
    o.drag(900, 300);
    expect(o.yaw).not.toBeCloseTo(-Math.PI / 2, 6);
    o.reset(-Math.PI / 2, 0.62);
    expect(o.yaw).toBeCloseTo(-Math.PI / 2, 12);
    expect(o.elevation).toBeCloseTo(0.62, 12);
  });

  it("⛔ the elevation is still CLAMPED on reset — no way in past the rings", () => {
    // ⚠ A reset is not a back door: `v` outside [0,1] would put the camera beyond the
    // top or bottom ring, which is the one thing the whole surface exists to prevent.
    const o = new OrbitController(DEFAULT_CONFIG, 0, 0.5);
    o.reset(0, 4);
    expect(o.elevation).toBe(1);
    o.reset(0, -3);
    expect(o.elevation).toBe(0);
  });

  it("⭐ snapTo leaves the centre there with NO blend left to run", () => {
    // ⛔ A blend is driven by finger TRAVEL, and a double-tap supplies none — a reset
    // that eased would simply never arrive.
    const b = new OrbitCentreBlend(DEFAULT_CONFIG, [0, 0, 0]);
    b.retarget([1, 2, 3]);
    b.advance(5);
    expect(b.isBlending).toBe(true);
    b.snapTo([0, 0, 0]);
    expect(b.centreM).toEqual([0, 0, 0]);
    expect(b.targetM).toEqual([0, 0, 0]);
    expect(b.isBlending).toBe(false);
    // …and it stays there however far a later gesture travels.
    b.advance(500);
    expect(b.centreM).toEqual([0, 0, 0]);
  });
});
