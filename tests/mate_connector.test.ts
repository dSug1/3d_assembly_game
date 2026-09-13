import { describe, expect, it } from "vitest";
import {
  type MateConnector,
  type Placed,
  mateResidual,
  testMate,
  worldPose,
} from "../src/core/mate_connector";
import { IDENTITY, dot, qFromAxisAngle, type Vec3 } from "../src/core/vec";

const conn = (normal: Vec3, position: Vec3 = [0, 0, 0]): MateConnector => ({
  id: "c",
  position,
  normal,
  tangent: [0, 1, 0],
  rollOrder: 4,
  radius: 0.02,
  kind: "stud",
});

const at = (p: Vec3): Placed => ({ position: p, orientation: IDENTITY });

describe("mate connectors", () => {
  // ⛔⛔ THE SIGN. A connector stores the TRUE OUTWARD normal, so two mating faces
  // point AT each other. This is the opposite of the first natural wording, and it
  // is why `facingCos` must be negative.
  it("a mate is ANTI-PARALLEL", () => {
    const a = conn([1, 0, 0]);
    const b = conn([-1, 0, 0]);
    const r = testMate(a, at([0, 0, 0]), b, at([0.01, 0, 0]), -0.85);
    expect(r).not.toBeNull();
    expect(r!.facing).toBe(true);
    expect(r!.alignment).toBeCloseTo(-1, 9);
  });

  it("two faces pointing the SAME way do not mate", () => {
    const a = conn([1, 0, 0]);
    const b = conn([1, 0, 0]);
    expect(testMate(a, at([0, 0, 0]), b, at([0.01, 0, 0]), -0.85)!.facing).toBe(false);
  });

  it("⛔ a POSITIVE facingCos is refused loudly, not silently honoured", () => {
    const a = conn([1, 0, 0]);
    const b = conn([-1, 0, 0]);
    expect(() => testMate(a, at([0, 0, 0]), b, at([0.01, 0, 0]), 0.85)).toThrow();
  });

  it("different kinds never mate", () => {
    const a = conn([1, 0, 0]);
    const b = { ...conn([-1, 0, 0]), kind: "socket" };
    expect(testMate(a, at([0, 0, 0]), b, at([0.01, 0, 0]), -0.85)).toBeNull();
  });

  it("a connector's pose follows its owner's rotation", () => {
    const c = conn([1, 0, 0], [0.05, 0, 0]);
    const owner: Placed = { position: [0, 0, 0], orientation: qFromAxisAngle([0, 1, 0], Math.PI / 2) };
    const w = worldPose(c, owner);
    expect(dot(w.normal, [0, 0, -1])).toBeCloseTo(1, 9);
  });

  // ⛔⛔ BREAK ON THE RESIDUAL OF THE **DESIRED** POSES. Once mated the observed gap
  // is zero by construction, so a break test reading the gap can never fire and the
  // mate is unbreakable. This test is what keeps that distinction alive in code.
  describe("the residual", () => {
    it("is ~zero when the two DESIRE the same place", () => {
      const a = conn([1, 0, 0]);
      const b = conn([-1, 0, 0]);
      const r = mateResidual(a, at([0, 0, 0]), b, at([0, 0, 0]));
      expect(r.linear).toBeCloseTo(0, 9);
      expect(r.angular).toBeCloseTo(0, 9);
    });

    it("grows as the unconstrained desires pull apart", () => {
      const a = conn([1, 0, 0]);
      const b = conn([-1, 0, 0]);
      const near = mateResidual(a, at([0, 0, 0]), b, at([0.01, 0, 0]));
      const far = mateResidual(a, at([0, 0, 0]), b, at([0.05, 0, 0]));
      expect(far.linear).toBeGreaterThan(near.linear);
    });

    it("reports linear and angular SEPARATELY", () => {
      const a = conn([1, 0, 0]);
      const b = conn([-1, 0, 0]);
      const twisted: Placed = {
        position: [0, 0, 0],
        orientation: qFromAxisAngle([0, 1, 0], Math.PI / 4),
      };
      const r = mateResidual(a, at([0, 0, 0]), b, twisted);
      expect(r.linear).toBeCloseTo(0, 6);
      expect(r.angular).toBeGreaterThan(0.5);
    });
  });
});
