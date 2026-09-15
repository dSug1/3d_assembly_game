/**
 * GOLDEN VECTORS — the animated camera reset.
 *
 * ⛔ Two of these exist because a plain lerp is WRONG on two of the four channels, and
 * both mistakes look fine in a still frame and awful in motion: a yaw that unwinds three
 * revolutions, and a zoom that crawls then rushes.
 */
import { describe, expect, it } from "vitest";
import {
  CameraResetAnimation,
  easeInOut,
  geometricLerp,
  shortestAngleDelta,
  type CameraPose,
} from "../src/input/camera_reset";

const at = (yawRad: number, elevation: number, zoom: number, c: [number, number, number]): CameraPose => ({
  yawRad,
  elevation,
  zoom,
  centreM: c,
});

describe("the animated camera reset", () => {
  it("⭐ it ARRIVES exactly, on every channel", () => {
    const a = new CameraResetAnimation(at(2.4, 0.1, 3, [1, 2, 3]), at(-Math.PI / 2, 0.62, 1, [0.4, 0, -0.2]), 400);
    let p = a.advance(0);
    for (let i = 0; i < 40; i++) p = a.advance(16);
    expect(a.done).toBe(true);
    expect(p.elevation).toBeCloseTo(0.62, 9);
    expect(p.zoom).toBeCloseTo(1, 9);
    expect(p.centreM[0]).toBeCloseTo(0.4, 9);
    expect(p.centreM[2]).toBeCloseTo(-0.2, 9);
    // ⚠ The yaw arrives at an EQUIVALENT heading, not necessarily the same number — it
    // took the short way, which may leave it a whole turn from the literal target.
    expect(Math.abs(shortestAngleDelta(p.yawRad, -Math.PI / 2))).toBeLessThan(1e-9);
  });

  it("⭐⭐ the YAW TAKES THE SHORT WAY — it does not unwind whole turns", () => {
    // ⛔ Yaw accumulates without limit: a few enthusiastic drags leave it revolutions
    // from where it started. A straight lerp would spin all of them back, which is not a
    // reset, it is a fairground ride.
    const spun = -Math.PI / 2 + 6 * Math.PI + 0.3; // three turns on, plus a little
    const a = new CameraResetAnimation(at(spun, 0.5, 1, [0, 0, 0]), at(-Math.PI / 2, 0.5, 1, [0, 0, 0]), 400);
    let travelled = 0;
    let prev = spun;
    for (let i = 0; i < 40; i++) {
      const p = a.advance(10);
      travelled += Math.abs(p.yawRad - prev);
      prev = p.yawRad;
    }
    expect(travelled).toBeCloseTo(0.3, 6); // ⭐ 0.3 rad, not 0.3 + 6π
  });

  it("⭐⭐ the ZOOM interpolates GEOMETRICALLY — halfway between ×0.25 and ×4 is ×1", () => {
    // ⚠ It is a SCALE. A linear lerp puts the midpoint at ×2.125, which spends most of
    // the animation near the far end and arrives in a rush.
    expect(geometricLerp(0.25, 4, 0.5)).toBeCloseTo(1, 9);
    expect(geometricLerp(1, 4, 0.5)).toBeCloseTo(2, 9);
    // …and the proportional rate is constant: equal steps multiply by equal factors.
    const q = [0, 0.25, 0.5, 0.75, 1].map((t) => geometricLerp(0.5, 8, t));
    for (let i = 1; i < q.length; i++) expect(q[i]! / q[i - 1]!).toBeCloseTo(2, 9);
  });

  it("⛔ a non-positive scale falls back to a lerp rather than a NaN", () => {
    // ⚠ log(0) is not a number, and one of those in a camera radius is a black screen
    // with no error to explain it.
    expect(geometricLerp(0, 4, 0.5)).toBeCloseTo(2, 9);
    expect(Number.isFinite(geometricLerp(-1, 4, 0.5))).toBe(true);
  });

  it("⭐ it is EASED: it neither leaves nor arrives with a velocity step", () => {
    const a = new CameraResetAnimation(at(0, 0, 1, [0, 0, 0]), at(0, 1, 1, [0, 0, 0]), 1000);
    const first = a.advance(50).elevation;
    const early = a.advance(50).elevation - first;
    let p = first;
    for (let i = 0; i < 8; i++) p = a.advance(50).elevation;
    const mid = a.advance(50).elevation - p;
    expect(early).toBeLessThan(mid / 2); // slow to start
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 9);
  });

  it("⛔ a duration of ZERO snaps — the pre-animation behaviour stays reachable", () => {
    const a = new CameraResetAnimation(at(2, 0.1, 3, [1, 1, 1]), at(0, 0.9, 1, [0, 0, 0]), 0);
    expect(a.done).toBe(true);
    const p = a.advance(0);
    expect(p.elevation).toBe(0.9);
    expect(p.zoom).toBe(1);
  });

  it("⛔ it CLAMPS past the end, and a degenerate dt advances nothing", () => {
    const a = new CameraResetAnimation(at(0, 0, 1, [0, 0, 0]), at(0, 1, 2, [0, 0, 0]), 200);
    a.advance(10_000);
    const p = a.advance(10_000);
    expect(p.elevation).toBe(1);
    expect(p.zoom).toBeCloseTo(2, 9);
    const b = new CameraResetAnimation(at(0, 0, 1, [0, 0, 0]), at(0, 1, 1, [0, 0, 0]), 200);
    for (const dt of [0, -5, Number.NaN]) expect(b.advance(dt).elevation).toBe(0);
  });

  it("shortestAngleDelta wraps into (−π, π]", () => {
    expect(shortestAngleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2, 9);
    expect(shortestAngleDelta(0, -Math.PI / 2)).toBeCloseTo(-Math.PI / 2, 9);
    expect(shortestAngleDelta(0, 6 * Math.PI)).toBeCloseTo(0, 9);
    expect(shortestAngleDelta(0, 3 * Math.PI)).toBeCloseTo(Math.PI, 9);
    expect(Math.abs(shortestAngleDelta(0, Math.PI * 1.9))).toBeLessThan(Math.PI);
  });
});
