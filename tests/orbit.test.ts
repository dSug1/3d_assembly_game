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

  it("⭐ dragging RIGHT yaws one way, LEFT the other", () => {
    expect(drag(20, 0).yaw).toBeGreaterThan(0);
    expect(drag(-20, 0).yaw).toBeLessThan(0);
  });

  it("⭐ dragging DOWN lowers the camera; UP raises it", () => {
    // ⛔ Asserted as the elevation a hand expects. `IN1` shipped yaw AND pitch
    // inverted because an internally consistent sign was never checked this way.
    expect(drag(0, 20).elevation).toBeLessThan(0.5); // finger down → camera lower
    expect(drag(0, -20).elevation).toBeGreaterThan(0.5);
  });

  it("⭐ gains are per MILLIMETRE, so a denser screen does not change the gesture", () => {
    // The same physical 20 mm of travel must give the same yaw whatever the DPI.
    const c = new OrbitController(cfg, 0, 0.5);
    c.drag(mmToPx(20), 0);
    expect(c.yaw).toBeCloseTo(20 * cfg.gainOrbitYaw, 9);
  });

  it("⭐⭐ the elevation limit HOLDS under sustained dragging", () => {
    // Not merely "a clamp exists": drag far past it, repeatedly, and check it neither
    // escapes nor accumulates a debt that has to be paid back before it moves again.
    const c = new OrbitController(cfg, 0, 0.5);
    for (let i = 0; i < 200; i++) c.drag(0, mmToPx(-10));
    expect(c.elevation).toBe(1);
    expect(c.atLimit).toBe(true);
    // ⛔ One small drag the other way must move it IMMEDIATELY — if the clamp had
    // stored the overshoot, the camera would sit dead for 2 metres of finger travel.
    c.drag(0, mmToPx(5));
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
