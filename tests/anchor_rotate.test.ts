/**
 * §2 rule 2sexte + amendment A3 — ROTATING AN ANCHORED OBJECT.
 *
 * ⭐⭐ THE COMPOSITE PROPERTY IS "THE ANCHOR SURVIVES", and it is asserted directly: take
 * a constrained normal that is ON its target axis, apply whatever rotation the rule
 * produces, and check the normal is STILL on it. That is the one thing 2sexte exists to
 * guarantee, and no test of the angle's magnitude checks it.
 *
 * ⛔⛔ AND IT CARRIES ITS COUNTER-EXAMPLE: the naive implementation — rotate about the
 * VIEW axis, which is what free rotation and 2quinte both do — is written out below and
 * asserted to BREAK the anchor. `METHOD`: *a test that cannot fail is not a test*, and
 * this is the exact mistake amendment A3's wording exists to prevent.
 */
import { describe, expect, it } from "vitest";
import {
  constrainedDragAngle,
  constrainedRollAngle,
  nearSideScreenDirection,
  resolveAnchorDriver,
  rotateAboutAxis,
  viewAxisAlignment,
} from "../src/input/anchor_rotate";
import type { ScreenFrame } from "../src/input/screen_rotate";
import { IDENTITY, dot, normalize, qRotate, type Vec3 } from "../src/core/vec";
import { mmToPx } from "../src/core/units";

const GAIN = 0.02; // radians per mm — `gainRotateConstrained`-shaped, not its value.

/** Camera looking down −z at the origin: right = +x, up = +y, view = −z (into screen). */
const FRONT: ScreenFrame = { right: [1, 0, 0], up: [0, 1, 0], viewAxis: [0, 0, -1] };
/** Camera looking straight DOWN: view = −y. Gravity now points AT the camera. */
const TOP: ScreenFrame = { right: [1, 0, 0], up: [0, 0, -1], viewAxis: [0, -1, 0] };
/** Camera looking straight UP: view = +y. Gravity points AWAY from it. */
const BOTTOM: ScreenFrame = { right: [1, 0, 0], up: [0, 0, 1], viewAxis: [0, 1, 0] };

const GRAVITY: Vec3 = [0, 1, 0];

// ══════════════════════════════════════════════════════════════════════════════
// ⭐⭐ THE PROPERTY THAT MATTERS
// ══════════════════════════════════════════════════════════════════════════════

describe("⭐⭐ the anchor SURVIVES the motion", () => {
  /** How far a normal that starts on `GRAVITY` ends up from it, in degrees. */
  function driftDeg(rotated: Vec3): number {
    const n = normalize(rotated)!;
    return (Math.acos(Math.min(1, Math.max(-1, dot(n, GRAVITY)))) * 180) / Math.PI;
  }

  it("a 2sexte drag leaves the constrained normal exactly on its axis", () => {
    const angle = constrainedDragAngle(FRONT, GRAVITY, mmToPx(30), 0, GAIN)!;
    const q = rotateAboutAxis(IDENTITY, GRAVITY, angle);
    expect(driftDeg(qRotate(q, GRAVITY))).toBeCloseTo(0, 9);
  });

  it("…and so does a LONG one — the property is not a small-angle accident", () => {
    let q = IDENTITY;
    for (let i = 0; i < 40; i++) {
      q = rotateAboutAxis(q, GRAVITY, constrainedDragAngle(FRONT, GRAVITY, mmToPx(25), 0, GAIN)!);
    }
    expect(driftDeg(qRotate(q, GRAVITY))).toBeCloseTo(0, 9);
  });

  it("an A3 roll, where roll drives, also leaves it exactly on its axis", () => {
    const angle = constrainedRollAngle(TOP, GRAVITY, 90)!;
    const q = rotateAboutAxis(IDENTITY, GRAVITY, angle);
    expect(driftDeg(qRotate(q, GRAVITY))).toBeCloseTo(0, 9);
  });

  it("⛔⛔ COUNTER-EXAMPLE: rotating about the VIEW axis BREAKS the anchor", () => {
    // The naive implementation — what free rotation and 2quinte do — with the camera
    // looking from the front, where the gravity axis lies across the screen.
    const q = rotateAboutAxis(IDENTITY, FRONT.viewAxis, 0.6);
    // ⭐ It does not drift a little. It swings the normal most of 35°.
    expect(driftDeg(qRotate(q, GRAVITY))).toBeGreaterThan(30);
  });

  it("⚠ …and the SAME naive rotation is harmless looking down the axis — which is why the spec's blanket ban was wrong", () => {
    const q = rotateAboutAxis(IDENTITY, TOP.viewAxis, 0.6);
    expect(driftDeg(qRotate(q, GRAVITY))).toBeCloseTo(0, 9);
  });
});

// ══════════════════════════════════════════════════════════════════════════════

describe("the drag mapping, and where it is degenerate", () => {
  it("⛔ returns null when the axis points AT the camera — the projection is a point", () => {
    expect(constrainedDragAngle(TOP, GRAVITY, mmToPx(30), 0, GAIN)).toBeNull();
    expect(nearSideScreenDirection(TOP, GRAVITY)).toBeNull();
  });

  it("⛔ returns null when it points AWAY, which is the same geometry", () => {
    expect(constrainedDragAngle(BOTTOM, GRAVITY, mmToPx(30), 0, GAIN)).toBeNull();
  });

  it("⛔ returns null for a degenerate axis rather than a zero angle", () => {
    expect(constrainedDragAngle(FRONT, [0, 0, 0], mmToPx(30), 0, GAIN)).toBeNull();
  });

  it("⭐ the ANGLE per millimetre is the SAME at every camera angle — §2 2sexte specifies a gain, not a tracking factor", () => {
    // ⚠ I first asserted the opposite here, and the geometry disagreed. Recorded rather
    // than quietly corrected: `|a × v| = sin α` is the near side's excursion per radian,
    // NOT a factor on the angle, and the spec's `gainRotateConstrained` is rad/mm.
    const across = Math.abs(constrainedDragAngle(FRONT, GRAVITY, mmToPx(30), 0, GAIN)!);
    const tilted: ScreenFrame = {
      right: [1, 0, 0],
      up: [0, Math.cos(Math.PI / 3), -Math.sin(Math.PI / 3)],
      viewAxis: [0, -Math.sin(Math.PI / 3), -Math.cos(Math.PI / 3)],
    };
    const oblique = Math.abs(constrainedDragAngle(tilted, GRAVITY, mmToPx(30), 0, GAIN)!);
    expect(oblique).toBeCloseTo(across, 12);
  });

  it("⛔⛔ but the VISIBLE motion fades as sin α — which is WHY the handover cannot sit at the degeneracy", () => {
    // ⚠⚠ THE FIXTURE HAS TO USE THE **NEAR POINT**, and getting that wrong is what this
    // comment is here to stop the next reader repeating. A marker at [0,0,1] sits on the
    // equator of the gravity axis, so its rotational radius is 1 WHATEVER the camera does
    // — it cannot show this effect and will report the opposite. The near point is
    // `−viewAxis` projected PERPENDICULAR to the axis, whose radius is `r·sin α`, and that
    // factor is the whole finding.
    const excursion = (frame: ScreenFrame) => {
      const v = frame.viewAxis;
      const toward: Vec3 = [-v[0], -v[1], -v[2]];
      const alongAxis = dot(toward, GRAVITY);
      // The part of the near direction that actually sweeps when the object turns.
      const before: Vec3 = [
        toward[0] - GRAVITY[0] * alongAxis,
        toward[1] - GRAVITY[1] * alongAxis,
        toward[2] - GRAVITY[2] * alongAxis,
      ];
      // ⚠ A SMALL angle on purpose. The sin α law is INFINITESIMAL: at a finite turn the
      // chord (2r·sin θ/2) and its rotated direction add a second-order term that differs
      // between frames, and 0.2 rad already shows it as 0.502 against 0.500. ⭐ State the
      // limit the law holds in, and test it there.
      const after = qRotate(rotateAboutAxis(IDENTITY, GRAVITY, 1e-5), before);
      const d: Vec3 = [after[0] - before[0], after[1] - before[1], after[2] - before[2]];
      return Math.hypot(dot(d, frame.right), dot(d, frame.up));
    };
    const tilted: ScreenFrame = {
      right: [1, 0, 0],
      up: [0, Math.cos(Math.PI / 3), -Math.sin(Math.PI / 3)],
      viewAxis: [0, -Math.sin(Math.PI / 3), -Math.cos(Math.PI / 3)],
    };
    expect(excursion(tilted)).toBeLessThan(excursion(FRONT));
    // ⭐ And it is exactly the sin α factor, not merely "less": at 60° off the axis the
    // near point sweeps half as far for the same rotation. That is the number that says
    // where `anchorHandoverCos` may sit.
    expect(excursion(tilted) / excursion(FRONT)).toBeCloseTo(Math.sin(Math.PI / 6), 6);
  });

  it("⭐ SIGN, declared against the screen: the NEAR SIDE follows the finger", () => {
    // Camera at the front, gravity axis up the screen. Finger goes RIGHT.
    const angle = constrainedDragAngle(FRONT, GRAVITY, mmToPx(30), 0, GAIN)!;
    const q = rotateAboutAxis(IDENTITY, GRAVITY, angle);
    // A marker on the near face (toward the viewer, +z) must travel RIGHT (+x).
    const moved = qRotate(q, [0, 0, 1]);
    expect(moved[0]).toBeGreaterThan(0);
  });

  it("⭐⭐ the SAME world rotation results from the front and from the back — and that is CORRECT", () => {
    // ⚠ I first asserted these must be opposite. They must not, and the reason is worth
    // keeping: from behind, "screen right" is the opposite WORLD direction, but the near
    // side is also the opposite FACE — and the two reversals cancel.
    // ⭐ Like a real turntable: pushing the near edge to your right spins it the same way
    // wherever you are standing. The control survives an orbit instead of inverting,
    // which is the property a user would notice immediately if it were missing.
    const BACK: ScreenFrame = { right: [-1, 0, 0], up: [0, 1, 0], viewAxis: [0, 0, 1] };
    const front = constrainedDragAngle(FRONT, GRAVITY, mmToPx(30), 0, GAIN)!;
    const back = constrainedDragAngle(BACK, GRAVITY, mmToPx(30), 0, GAIN)!;
    expect(Math.sign(front)).toBe(Math.sign(back));

    // …and it is the near side that follows the finger in BOTH, which is the real claim.
    const nearFront = qRotate(rotateAboutAxis(IDENTITY, GRAVITY, front), [0, 0, 1]);
    expect(dot(nearFront, FRONT.right)).toBeGreaterThan(0);
    const nearBack = qRotate(rotateAboutAxis(IDENTITY, GRAVITY, back), [0, 0, -1]);
    expect(dot(nearBack, BACK.right)).toBeGreaterThan(0);
  });

  it("a drag ALONG the axis's screen projection turns the object not at all", () => {
    // Gravity projects straight up the screen from the front, so a vertical drag has no
    // component around it.
    expect(constrainedDragAngle(FRONT, GRAVITY, 0, mmToPx(30), GAIN)!).toBeCloseTo(0, 12);
  });

  it("is linear in the finger's travel", () => {
    const one = constrainedDragAngle(FRONT, GRAVITY, mmToPx(10), 0, GAIN)!;
    const three = constrainedDragAngle(FRONT, GRAVITY, mmToPx(30), 0, GAIN)!;
    expect(three).toBeCloseTo(3 * one, 12);
  });
});

describe("the A3 roll mapping", () => {
  it("⛔ THE SIGN FLIPS with the axis, or orbiting under the object reverses the controls", () => {
    const fromTop = constrainedRollAngle(TOP, GRAVITY, 90)!;
    const fromBottom = constrainedRollAngle(BOTTOM, GRAVITY, 90)!;
    expect(Math.sign(fromTop)).toBe(-Math.sign(fromBottom));
  });

  it("matches `screenRollRotation`'s convention when the axis IS the view axis", () => {
    // Looking up: view = +y = the gravity axis. A clockwise sweep must produce the same
    // rotation `screen_rotate` would, which is −deg about the view axis.
    expect(constrainedRollAngle(BOTTOM, GRAVITY, 90)!).toBeCloseTo(-Math.PI / 2, 12);
  });

  it("⛔ returns null when the axis is square to the view — nothing to roll about", () => {
    expect(constrainedRollAngle(FRONT, GRAVITY, 90)).toBeNull();
  });

  it("is linear in the swept angle", () => {
    expect(constrainedRollAngle(TOP, GRAVITY, 120)!).toBeCloseTo(
      3 * constrainedRollAngle(TOP, GRAVITY, 40)!,
      12,
    );
  });
});

describe("⛔ the handover — ONE constant, with hysteresis", () => {
  const COS = 0.8;
  const HYST = 0.1; // band 0.75 … 0.85

  it("roll drives when the camera looks along the axis", () => {
    expect(resolveAnchorDriver(0.99, COS, HYST, null)).toBe("ROLL");
  });

  it("the drag drives when the axis lies across the screen", () => {
    expect(resolveAnchorDriver(0.1, COS, HYST, null)).toBe("DRAG");
  });

  it("⭐ inside the band the PREVIOUS driver is kept — both ways", () => {
    expect(resolveAnchorDriver(0.8, COS, HYST, "ROLL")).toBe("ROLL");
    expect(resolveAnchorDriver(0.8, COS, HYST, "DRAG")).toBe("DRAG");
  });

  it("⛔ and leaving the band overrides it — hysteresis must not become a latch for ever", () => {
    expect(resolveAnchorDriver(0.99, COS, HYST, "DRAG")).toBe("ROLL");
    expect(resolveAnchorDriver(0.1, COS, HYST, "ROLL")).toBe("DRAG");
  });

  it("⛔⛔ THERE IS NO DEAD BAND: every alignment has exactly one driver", () => {
    // The failure two independent thresholds would give — a camera angle at which the
    // free DOF has NO driver and the control silently stops working.
    for (let i = 0; i <= 100; i++) {
      const c = i / 100;
      const d = resolveAnchorDriver(c, COS, HYST, null);
      expect(d === "ROLL" || d === "DRAG", `alignment ${c}`).toBe(true);
    }
  });

  it("⭐ with no previous choice it still decides, rather than inventing a preference", () => {
    expect(resolveAnchorDriver(0.82, COS, HYST, null)).toBe("ROLL");
    expect(resolveAnchorDriver(0.78, COS, HYST, null)).toBe("DRAG");
  });

  it("⭐ the driver it picks is the one that is WELL-CONDITIONED there", () => {
    // Where roll drives, the drag is degenerate or nearly so; where the drag drives, it
    // is not. This is the claim A3 makes, checked rather than asserted.
    expect(viewAxisAlignment(TOP, GRAVITY)).toBeCloseTo(1, 12);
    expect(resolveAnchorDriver(viewAxisAlignment(TOP, GRAVITY)!, COS, HYST, null)).toBe("ROLL");
    expect(nearSideScreenDirection(TOP, GRAVITY)).toBeNull();

    expect(viewAxisAlignment(FRONT, GRAVITY)).toBeCloseTo(0, 12);
    expect(resolveAnchorDriver(viewAxisAlignment(FRONT, GRAVITY)!, COS, HYST, null)).toBe("DRAG");
    expect(nearSideScreenDirection(FRONT, GRAVITY)).not.toBeNull();
  });
});
