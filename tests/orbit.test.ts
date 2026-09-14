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
import { OrbitController, orbitOffset, rigsOf } from "../src/input/orbit";
import { MotionTracker } from "../src/input/motion";
import { mmToPx } from "../src/core/units";

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
    expect(() => new MotionTracker({ ...cfg, orbitTopRadiusM: -0.1 })).toThrow(/negative/);
  });

  it("⭐ ACCEPTS a top radius of zero — directly overhead is a legal orbit", () => {
    const c = { ...cfg, orbitTopRadiusM: 0 };
    expect(() => new MotionTracker(c)).not.toThrow();
    const pose = orbitOffset(c, 0, 1, 1);
    expect(Math.hypot(pose.offsetM[0], pose.offsetM[2])).toBeCloseTo(0, 9);
    // ⚠ And the camera is still a real distance away, because the HEIGHT carries it.
    expect(pose.radiusM).toBeGreaterThan(0.1);
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

  it("⛔ the DISTANCE holds for every ring shape, pathological ones included", () => {
    // ⭐ This is the owner's actual complaint, and it now holds universally.
    for (const shape of [...PLAUSIBLE, PATHOLOGICAL]) {
      const c = { ...cfg, ...shape };
      expect(turningPoints(sweep(c).map((p) => p.radiusM))).toBeLessThanOrEqual(1);
    }
  });

  it("⛔ the HEIGHT climbs for every PLAUSIBLE ring shape", () => {
    for (const shape of PLAUSIBLE) {
      const c = { ...cfg, ...shape };
      expect(turningPoints(sweep(c).map((p) => p.offsetM[1]))).toBe(0);
    }
  });

  it("⚠ KNOWN LIMIT: a pathological radius bulge can still dip the height", () => {
    // ⛔ RECORDED, NOT HIDDEN. With radii bulging 0.2 → 0.9 → 0.1 m, a rising
    // DISTANCE while the elevation is still negative pulls the camera DOWN, so the
    // derived height is not monotone even though the distance is well behaved.
    // ⭐ It is left unguarded deliberately: no plausible ring set reaches it, and
    // `METHOD` forbids bolting a special case onto an output to patch a case nobody
    // has observed. If a device ever lands here, it becomes a data question.
    // ⚠ This vector exists so the limit is a KNOWN quantity rather than a surprise —
    // and it FAILS if someone "fixes" it, which is the prompt to update this note.
    const c = { ...cfg, ...PATHOLOGICAL };
    expect(turningPoints(sweep(c).map((p) => p.offsetM[1]))).toBeGreaterThan(0);
    expect(turningPoints(sweep(c).map((p) => p.radiusM))).toBeLessThanOrEqual(1);
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
