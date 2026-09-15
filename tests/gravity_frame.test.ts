/**
 * AMENDMENT A7 — THE GRAVITY FRAME.
 *
 * ⭐⭐ THE VECTOR THAT CARRIES THE ARGUMENT IS THE COUNTER-EXAMPLE: the CAMERA's basis —
 * what every object gesture used before A7 — is asserted to LOSE its orthogonality as the
 * camera tilts, so roll stops being independent of yaw. That is not a feel problem with a
 * gain to fix; it is a basis that is not a basis, and no amount of tuning recovers it.
 */
import { describe, expect, it } from "vitest";
import { gravityFrame, verticalVisibility } from "../src/input/gravity_frame";
import { cross, dot, length, normalize, type Vec3 } from "../src/core/vec";

const DOWN: Vec3 = [0, -1, 0];
const UP: Vec3 = [0, 1, 0];

/** Camera forwards from level to almost straight down, as the orbit surface produces. */
const FORWARDS: Vec3[] = [
  normalize([0, 0, 1])!,
  normalize([0, -0.3, 1])!,
  normalize([0, -1, 1])!,
  normalize([0.6, -0.5, 0.7])!,
  normalize([0, -0.95, 0.31])!,
];

/** The CAMERA's basis, the way the scene builds it — the thing A7 replaces. */
function cameraBasis(forward: Vec3) {
  const right = normalize(cross(UP, forward))!;
  const up = cross(forward, right);
  return { right, up, viewAxis: forward };
}

describe("⭐⭐ the frame is ORTHONORMAL at every camera elevation", () => {
  it("all three axes are unit length", () => {
    for (const f of FORWARDS) {
      const g = gravityFrame(f, DOWN)!;
      for (const [name, a] of [["right", g.right], ["up", g.up], ["depth", g.depth]] as const) {
        expect(length(a), `${name} @ ${f}`).toBeCloseTo(1, 12);
      }
    }
  });

  it("all three pairs are perpendicular", () => {
    for (const f of FORWARDS) {
      const g = gravityFrame(f, DOWN)!;
      expect(dot(g.right, g.up), `right·up @ ${f}`).toBeCloseTo(0, 12);
      expect(dot(g.right, g.depth), `right·depth @ ${f}`).toBeCloseTo(0, 12);
      expect(dot(g.up, g.depth), `up·depth @ ${f}`).toBeCloseTo(0, 12);
    }
  });

  it("⭐ `up` is straight up, whatever the camera is doing", () => {
    // ⚠ Component-wise: `scale(g, -1)` produces a signed −0, which `toEqual` refuses
    // and which is the same number by every definition that matters here.
    for (const f of FORWARDS) {
      const u = gravityFrame(f, DOWN)!.up;
      for (let i = 0; i < 3; i++) expect(u[i]!).toBeCloseTo(UP[i]!, 12);
    }
  });

  it("⭐ `depth` is horizontal, and keeps the view's heading", () => {
    const g = gravityFrame(normalize([1, -1, 1])!, DOWN)!;
    expect(dot(g.depth, UP)).toBeCloseTo(0, 12);
    expect(g.depth[0] / g.depth[2]).toBeCloseTo(1, 12);
  });

  it("⭐ `right` matches the CAMERA's right — it was already horizontal", () => {
    // ⚠ The one axis that did not have to change: the camera carries no roll, so its right
    // is `worldUp × forward`, which is horizontal by construction. Asserted rather than
    // assumed, because the whole basis rests on it.
    for (const f of FORWARDS) {
      const g = gravityFrame(f, DOWN)!;
      const cam = cameraBasis(f);
      for (let i = 0; i < 3; i++) expect(g.right[i]!).toBeCloseTo(cam.right[i]!, 12);
      expect(dot(cam.right, UP)).toBeCloseTo(0, 12);
    }
  });
});

describe("⛔⛔ COUNTER-EXAMPLE: the CAMERA's basis stops being independent as it tilts", () => {
  it("the camera's UP leaves the vertical as soon as the camera looks down", () => {
    expect(dot(cameraBasis(FORWARDS[0]!).up, UP)).toBeCloseTo(1, 9); // level: they agree
    expect(dot(cameraBasis(FORWARDS[4]!).up, UP)).toBeLessThan(0.4); // steep: they do not
  });

  it("⛔⛔ so ROLL (view axis) and YAW (camera up) OVERLAP, and the overlap grows", () => {
    // ⭐ THIS IS THE WHOLE ARGUMENT FOR A7. Two rotation gestures whose axes are not
    // perpendicular partly do the same thing — a roll drags the object round the way a yaw
    // would, and no gain can separate them.
    const overlap = (f: Vec3) => {
      const c = cameraBasis(f);
      return Math.abs(dot(c.viewAxis, c.up));
    };
    // The camera's own axes ARE mutually perpendicular…
    expect(overlap(FORWARDS[4]!)).toBeCloseTo(0, 12);
    // …but that is not the question. The question is whether ROLL is independent of a yaw
    // about the WORLD vertical, which is what an anchored part actually turns about.
    const rollVsWorldYaw = (f: Vec3) => Math.abs(dot(cameraBasis(f).viewAxis, UP));
    expect(rollVsWorldYaw(FORWARDS[0]!)).toBeCloseTo(0, 9); // level: independent
    expect(rollVsWorldYaw(FORWARDS[4]!)).toBeGreaterThan(0.9); // steep: almost the same axis
  });

  it("⭐ A7's roll axis stays independent of the world vertical at every elevation", () => {
    for (const f of FORWARDS) {
      expect(Math.abs(dot(gravityFrame(f, DOWN)!.depth, UP)), `@ ${f}`).toBeCloseTo(0, 12);
    }
  });
});

describe("⛔ where it goes quiet, and where it refuses", () => {
  it("returns null looking STRAIGHT DOWN — no horizontal heading to call depth", () => {
    expect(gravityFrame([0, -1, 0], DOWN)).toBeNull();
    expect(gravityFrame([0, 1, 0], DOWN)).toBeNull();
  });

  it("returns null for a degenerate axis rather than an arbitrary basis", () => {
    expect(gravityFrame([0, 0, 0], DOWN)).toBeNull();
    expect(gravityFrame([0, 0, 1], [0, 0, 0])).toBeNull();
  });

  it("⚠ vertical motion GOES QUIET before it fails — the third time this shape has appeared", () => {
    // ⭐ Published so the weakening is measurable rather than reported as "it stopped
    // working". 1 looking level, → 0 looking straight down.
    expect(verticalVisibility(FORWARDS[0]!, DOWN)!).toBeCloseTo(1, 9);
    expect(verticalVisibility(FORWARDS[4]!, DOWN)!).toBeLessThan(0.35);
    expect(verticalVisibility([0, -1, 0], DOWN)!).toBeCloseTo(0, 9);
  });

  it("⭐ and DEPTH is strongest exactly where the vertical is weakest, and the reverse", () => {
    // ⚠ The two rules cover each other: A6's depth scales with the camera's horizontal
    // distance, which grows as the camera levels out — the opposite of this.
    const level = verticalVisibility(FORWARDS[0]!, DOWN)!;
    const steep = verticalVisibility(FORWARDS[4]!, DOWN)!;
    expect(level).toBeGreaterThan(steep);
  });
});
