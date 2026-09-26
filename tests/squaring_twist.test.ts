/**
 * GOLDEN VECTORS — **THE SQUARING TWIST** (the owner, 2026-09-26: *"add that squaring twist"*).
 * After the minimal swing, the Follower turns about the aligned normal by ≤ 45° so its edges are
 * square to the Pioneer's — the perpendicularity the minimal swing alone loses (spec §11.12).
 */
import { describe, expect, it } from "vitest";
import { alignTargetFor, faceAlignConstraint, squaringTwist } from "@input/alignment";
import { solve } from "@core/constraint_stack";
import { bootTilt } from "@core/scene_dims";
import {
  IDENTITY,
  qAngle,
  qFromAxisAngle,
  qmul,
  qRotate,
  type Quat,
  type Vec3,
} from "@core/vec";

const FOLLOWER_FACE: Vec3 = [0, -1, 0];

/** The Follower after swing + twist, aligned to the Pioneer's local face `nLocal`. */
function alignTo(follower: Quat, pioneer: Quat, nLocal: Vec3): { q: Quat; twist: Quat; target: Vec3 } {
  const target = alignTargetFor(qRotate(pioneer, nLocal));
  const s = solve([faceAlignConstraint(FOLLOWER_FACE, qRotate(pioneer, nLocal))], follower, {
    evictOnOverflow: false,
  });
  const swung = qmul(s.rotation, follower);
  const twist = squaringTwist(target, swung, pioneer);
  return { q: qmul(twist, swung), twist, target };
}

/** Largest angle, in degrees, between a Follower axis and its nearest Pioneer axis (0 = square). */
function offSquareDeg(follower: Quat, pioneer: Quat): number {
  const E: Vec3[] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  let worst = 0;
  for (const e of E) {
    const f = qRotate(follower, e);
    const best = Math.max(
      ...E.map((g) => {
        const p = qRotate(pioneer, g);
        return Math.abs(f[0] * p[0] + f[1] * p[1] + f[2] * p[2]);
      }),
    );
    worst = Math.max(worst, (Math.acos(Math.min(1, best)) * 180) / Math.PI);
  }
  return worst;
}

describe("⭐⭐⭐ the owner's case: square to the plate, re-aligned to the tilted grey part", () => {
  const grey = bootTilt(1);
  for (const [name, nLocal, measured] of [
    ["top", [0, 1, 0], 8.2],
    ["side (+x)", [1, 0, 0], 17.6],
    ["end (+z)", [0, 0, 1], 30.0],
  ] as const) {
    it(`⛔⛔ ${name}: lands SQUARE to the grey part (the minimal swing alone was ${measured}° off)`, () => {
      // ⛔ RED against the build before this rule, which applied the swing and no twist.
      const { q } = alignTo(IDENTITY, grey, nLocal as Vec3);
      expect(offSquareDeg(q, grey)).toBeLessThan(1e-6);
    });
  }

  it("⭐⭐ the alignment itself is untouched — the face normal still lands on its target", () => {
    const { q, target } = alignTo(IDENTITY, grey, [1, 0, 0]);
    const n = qRotate(q, FOLLOWER_FACE);
    for (let i = 0; i < 3; i++) expect(n[i]).toBeCloseTo(target[i] as number, 9);
  });
});

describe("⭐⭐ the twist is the SMALLEST that squares — never more than 45°", () => {
  it("⭐ a Follower 80° round from square turns back 10°, not forward 80°", () => {
    // ⛔ RED against squaring to PARALLEL edges instead of the nearest square position.
    const pioneer = IDENTITY;
    const follower = qFromAxisAngle([0, 1, 0], (80 * Math.PI) / 180);
    const twist = squaringTwist([0, 1, 0], follower, pioneer);
    expect((qAngle(twist) * 180) / Math.PI).toBeCloseTo(10, 6);
    expect(offSquareDeg(qmul(twist, follower), pioneer)).toBeLessThan(1e-6);
  });

  it("⭐ twisting the WRONG way would double the error — the sign is pinned", () => {
    // ⛔ RED against a flipped sign: 20° off would become 40° off.
    const follower = qFromAxisAngle([0, 1, 0], (20 * Math.PI) / 180);
    const twist = squaringTwist([0, 1, 0], follower, IDENTITY);
    expect(offSquareDeg(qmul(twist, follower), IDENTITY)).toBeLessThan(1e-6);
  });

  it("⚠ already square → no twist at all", () => {
    expect(qAngle(squaringTwist([0, 1, 0], IDENTITY, IDENTITY))).toBeCloseTo(0, 12);
  });

  it("⛔ no axis → identity, never NaN", () => {
    expect(squaringTwist([0, 0, 0], IDENTITY, IDENTITY)).toEqual(IDENTITY);
  });
});
