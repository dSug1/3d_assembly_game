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
 *
 * ⛔⛔ **THE HANDOVER'S VECTORS WERE DELETED 2026-09-17**, with `resolveAnchorDriver` and
 * `viewAxisAlignment` themselves. ⭐ `D34` retired the DECISION they served: `A12` had already
 * made the drag and the roll two CHANNELS, so nothing chooses between them and the constant is
 * never written. ⚠ A vector whose subject no longer exists certifies a module nothing calls —
 * which is how the roll detector survived long enough to veto a live rule (defect 40).
 */
import { describe, expect, it } from "vitest";
import {
  constrainedDragAngle,
  constrainedRollAngle,
  nearSideScreenDirection,
  rotateAboutAxis,
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

  it("⛔⛔ and it is SQUARE TO WITHIN ARITHMETIC, not square to the bit", () => {
    // ⛔⛔⛔ **THE GUARD READ `c === 0`** — an exact float comparison on a dot product of two
    // normalised vectors that have each been through a cross product and a division. ⚠ An
    // exactly-zero dot is measure-zero: the axis the camera actually reaches is square to
    // within 1e-17 and the guard waves it through, at FULL rate, with a sign taken from
    // whichever way that last bit fell. ⭐ So the branch documented as *"square to the view: no
    // component to roll about"* could essentially never run.
    // ⚠ The epsilon is the one its own sibling already uses — `nearSideScreenDirection` guards
    // `len > 1e-9` — so this is one arithmetic tolerance, not a new tunable.
    // ⭐⭐ `METHOD`: *a guard that cannot fire is not a guard.*
    // ⚠ `FRONT` looks along −z and `GRAVITY` is +y, so the two are square and the dot is
    // exactly 0. ⭐ Tilt the camera by 1e-12 radians — far below anything a hand or a float can
    // resolve — and the dot becomes 1e-12 rather than 0.
    const eps = 1e-12;
    const n = Math.hypot(eps, 1);
    const frame: ScreenFrame = { ...FRONT, viewAxis: [0, eps / n, -1 / n] };
    expect(constrainedRollAngle(frame, GRAVITY, 90)).toBeNull();
  });

  it("⚠ AND THE SIGN STILL FLIPS ACROSS SQUARE — stated, not fixed", () => {
    // ⛔⛔ **THIS IS A DEVICE QUESTION, AND THE VECTOR EXISTS TO SAY SO RATHER THAN TO BLESS
    // IT.** The magnitude does not depend on how square the axis is — only the SIGN does — so
    // as the camera crosses the square plane the roll reverses at full rate. ⭐ Making it fade
    // with `|c|` would remove the discontinuity and would also change the FEEL everywhere else,
    // and *"the object must follow the finger"* at full rate was a deliberate choice.
    // ⚠ `IN5`: a hand decides feel. This pins the current behaviour so a change to it is
    // visible rather than accidental.
    const tilt = (eps: number) => {
      const n = Math.hypot(eps, 1);
      const frame: ScreenFrame = { ...FRONT, viewAxis: [0, eps / n, -1 / n] };
      return constrainedRollAngle(frame, GRAVITY, 90);
    };
    const a = tilt(0.001);
    const b = tilt(-0.001);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    // ⛔ Equal in size, opposite in direction, for a 0.1° change of camera tilt.
    expect(Math.abs(a!)).toBeCloseTo(Math.abs(b!), 12);
    expect(Math.sign(a!)).toBe(-Math.sign(b!));
  });

  it("is linear in the swept angle", () => {
    expect(constrainedRollAngle(TOP, GRAVITY, 120)!).toBeCloseTo(
      3 * constrainedRollAngle(TOP, GRAVITY, 40)!,
      12,
    );
  });
});


/**
 * ⭐⭐⭐ **`D52` — THE TWO ROLL CHANNELS MUST TURN THE BODY THE SAME WAY.**
 *
 * > *"The Follower object roll controlled by the second touchpoint is inverted vs. the roll
 * > controlled by the first touchpoint … the second should be the same as the first touchpoint
 * > roll."* — the owner, 2026-09-18
 *
 * ⛔⛔ **THE DEFECT WAS A COMPOSITION NOBODY COMPUTED, NOT A SIGN.** Each channel's sign was
 * separately defensible — the drag chart projects onto the near-side direction, the roll chart
 * mapped a screen roll through `sign(axis·view)` — and **they agreed for some constraint axes
 * and opposed for others**. ⚠ Measured before any fix: of four axes tried, two agreed and two
 * opposed. ⭐ So a blanket sign flip would have repaired half the cases and broken the other
 * half, which is why this vector sweeps AXES and both drag directions rather than asserting one
 * sign in one configuration.
 *
 * ⭐ `METHOD`: *a composition is a thing to MEASURE, not an emergent property* — and here the
 * composition is *two controls over one DOF*, which no test of either one alone can see.
 */
describe("⭐⭐⭐ D52 — both roll channels agree, over axes and camera frames", () => {
  const DEG = Math.PI / 180;
  /** What the SECOND touchpoint now does: the first's chart, with the second's gain. */
  const secondTouchTwist = (f: ScreenFrame, axis: Vec3, dxPx: number, degPerMm: number) =>
    constrainedDragAngle(f, axis, dxPx, 0, degPerMm * DEG);

  const FRAMES: readonly ScreenFrame[] = [
    { right: [1, 0, 0], up: [0, 1, 0], viewAxis: [0, 0, 1] },
    // ⚠ A TILTED camera, because the whole family of defects this file records lives in the
    // composition of the frame with the rule, not in either alone (`A7`).
    { right: [1, 0, 0], up: [0, 0.7071, 0.7071], viewAxis: [0, -0.7071, 0.7071] },
  ];
  const AXES: readonly Vec3[] = [
    [0, 1, 1],
    [0, 1, -1],
    [1, 0, 1],
    [0.3, 0.7, 0.6],
    [0, 0, 1],
    [1, 1, 0],
  ];

  it("⭐⭐⭐ never opposite — for every axis, both frames, both drag directions", () => {
    let compared = 0;
    for (const frame of FRAMES) {
      for (const raw of AXES) {
        const axis = normalize(raw);
        if (!axis) continue;
        for (const dxPx of [12, -12]) {
          const first = constrainedDragAngle(frame, axis, dxPx, 0, 0.07);
          const second = secondTouchTwist(frame, axis, dxPx, 2);
          if (first === null || second === null) continue;
          if (first === 0 || second === 0) continue;
          compared++;
          expect(Math.sign(first)).toBe(Math.sign(second));
        }
      }
    }
    // ⚠ Assert the sweep actually compared something: a sweep that skipped every case would
    // pass silently, which is the *skipped check announced as green* failure.
    expect(compared).toBeGreaterThan(12);
  });

  it("⛔ where the FIRST touchpoint does nothing, the second does nothing either", () => {
    // ⭐ The degenerate configuration: the constraint axis square to the view leaves a
    // horizontal drag with no component to give. ⚠ `A3`'s roll chart used to twist there, and
    // that is precisely the case where there is nothing to be consistent WITH — so a fallback
    // would have to invent a sign. ⛔ Consistency is the owner's requirement; coverage was mine.
    const frame: ScreenFrame = { right: [1, 0, 0], up: [0, 1, 0], viewAxis: [0, 0, 1] };
    const axis = normalize([1, 0, 1]);
    const first = constrainedDragAngle(frame, axis!, 12, 0, 0.07);
    const second = secondTouchTwist(frame, axis!, 12, 2);
    expect(first).toBeCloseTo(0, 12);
    expect(second).toBeCloseTo(0, 12);
  });

  it("⭐ and the magnitude still follows the second touchpoint's OWN gain", () => {
    // ⚠ Agreement of DIRECTION must not quietly fuse the two sensitivities: the second
    // touchpoint keeps `gainRollDrag`, which a hand tunes separately.
    const frame: ScreenFrame = { right: [1, 0, 0], up: [0, 1, 0], viewAxis: [0, 0, 1] };
    const axis = normalize([0, 1, 1])!;
    const slow = secondTouchTwist(frame, axis, 12, 1);
    const fast = secondTouchTwist(frame, axis, 12, 4);
    expect(Math.abs(fast!)).toBeCloseTo(Math.abs(slow!) * 4, 9);
  });
});
