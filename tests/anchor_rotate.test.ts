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
  flatTwistAngle,
  nearSideScreenDirection,
  rollSignFor,
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

describe("⛔⛔⛔ THE DEAD ZONE `D57` REMOVED — the projection's cosine, kept as the DIAGNOSIS", () => {
  // ⛔⛔ DEVICE-REPORTED, 2026-09-19: *"when I successively align on diverse PioneerFaces, for
  // some of them I loose the roll control of the Follower object by the second touch."*
  //
  // ⭐⭐⭐ **MEASURED, AND IT IS NOT THE DEGENERACY ANYONE HAD WRITTEN DOWN.** `scene.ts`
  // claimed the price of `D52` was *"the axis square to the view"*, and `constrainedDragAngle`
  // documents its own `null` at *"the axis points at the camera"*. ⚠ Neither is what a hand
  // meets. The near side travels along `axis × (−view)`, **perpendicular to the axis's screen
  // projection** — so the direction the finger must go SPINS with the alignment axis, while
  // this channel only ever supplies `dx` (`A16`: *its x is roll, its y is depth*).
  //
  // ⛔ The authority is therefore `|dir.x|`, a **cosine in the axis's screen orientation**, and
  // it reaches zero at an ordinary, easily-reached pose rather than at a knife edge.
  const FRAME: ScreenFrame = { right: [1, 0, 0], up: [0, 1, 0], viewAxis: [0, 0, 1] };
  const DEG = Math.PI / 180;
  const DX = mmToPx(10);
  /** ⚠ THE OLD SECOND-TOUCHPOINT LAW. `D57` replaced it; these vectors keep the measurement
   * that diagnosed the report, and the block below pins what replaced it. */
  const secondTouchDeg = (axis: Vec3) =>
    (constrainedDragAngle(FRAME, axis, DX, 0, 2 * DEG) ?? NaN) / DEG;
  const firstTouchDeg = (axis: Vec3) =>
    (constrainedDragAngle(FRAME, axis, DX, DX, 2 * DEG) ?? NaN) / DEG;

  it("⭐ an axis VERTICAL on screen gives the second touchpoint FULL authority", () => {
    // ⭐ The near side moves horizontally, so a horizontal drag is exactly the right gesture.
    expect(Math.abs(nearSideScreenDirection(FRAME, [0, 1, 0])!.x)).toBeCloseTo(1, 6);
    expect(Math.abs(secondTouchDeg([0, 1, 0]))).toBeCloseTo(20, 6);
  });

  it("⛔⛔⛔ an axis HORIZONTAL on screen gives it **ZERO** — the reported dead control", () => {
    // ⚠⚠ THE NEAR SIDE MOVES VERTICALLY, and this channel has no `dy` to give it. ⛔ The
    // result is `0`, **not** `null`: nothing refuses, so before 2026-09-19 nothing reported it
    // either — the hand dragged and the object sat still with a silent HUD.
    expect(Math.abs(nearSideScreenDirection(FRAME, [1, 0, 0])!.x)).toBeCloseTo(0, 9);
    expect(secondTouchDeg([1, 0, 0])).toBe(0);
    // ⭐⭐ AND THE FIRST TOUCHPOINT IS UNAFFECTED ON THE SAME AXIS — the asymmetry IS the
    // defect, and a vector that measured only the second finger could not have shown it.
    // ⛔⛔ SIGNED, NOT `Math.abs`. ⚠ It was written with `Math.abs` and that was mistake shape
    // 5 — my own fixture — on top of this function's own sign trap: the `−dot(world, up)` that
    // converts to screen-down. The next vector proves the sign from the geometry.
    expect(firstTouchDeg([1, 0, 0])).toBeCloseTo(-20, 6);
  });

  it("⚠ it FADES as a cosine in between — not a cliff, which is why it reads as *losing* control", () => {
    // ⛔ 30°, 45° and 60° off vertical. ⚠ A hand meets the fade long before the zero, which
    // is why the report was *"for some of them"* rather than *"it never works"*.
    const off = (rad: number): Vec3 => [Math.sin(rad), Math.cos(rad), 0];
    expect(Math.abs(secondTouchDeg(off(30 * DEG)))).toBeCloseTo(20 * Math.cos(30 * DEG), 4);
    expect(Math.abs(secondTouchDeg(off(45 * DEG)))).toBeCloseTo(20 * Math.SQRT1_2, 4);
    expect(Math.abs(secondTouchDeg(off(60 * DEG)))).toBeCloseTo(20 * Math.cos(60 * DEG), 4);
  });

  it("⛔⛔ AND `constrainedRollAngle` IS NOT A FALLBACK THERE — both charts die together", () => {
    // ⚠ The obvious repair is *hand over to `A3`'s other chart where this one fades*. It does
    // not work, and stating why saves the next session the experiment: an axis horizontal on
    // screen is **square to the view**, which is precisely where that chart returns `null`.
    // ⛔ The two degeneracies were believed complementary; in this configuration they coincide.
    // ⭐ Only the missing `dy` could serve it — which is a decision about `A16`'s channel split,
    // not an arithmetic repair.
    expect(constrainedRollAngle(FRAME, [1, 0, 0], 30)).toBeNull();
    expect(secondTouchDeg([1, 0, 0])).toBe(0);
  });
});

describe("⛔⛔⛔ THE NEAR-SIDE DIRECTION'S **SIGN**, DERIVED FROM THE ROTATION ITSELF", () => {
  // ⛔⛔⛔ **A SIGN FLIP HERE SURVIVED ALL 880 VECTORS — measured 2026-09-19.** Negating
  // `sy` in `nearSideScreenDirection` (the `screen y grows DOWNWARD` conversion, which the
  // function's own comment calls *"the same sign trap `translate.ts` calls the commonest defect
  // in a drag"*) turned the whole suite green.
  //
  // ⭐ WHY NOTHING CAUGHT IT: every consumer that could have is the SECOND touchpoint's chart,
  // which passes `dx, 0` — so only `dir.x` is ever read, and `dir.y`'s sign is free. ⚠ And the
  // one vector that read `dir.y` asserted a MAGNITUDE.
  //
  // ⭐⭐⭐ **SO THIS DERIVES THE ANSWER INSTEAD OF RESTATING THE CODE.** `METHOD`: *a vector
  // written from the code it tests cannot contradict that code.* A point on the near side is
  // ROTATED by a small positive angle about the axis, and its displacement is projected onto
  // the screen independently — then the claim *the near side follows the finger* becomes a
  // measurement rather than a promise.
  const FRAME: ScreenFrame = { right: [1, 0, 0], up: [0, 1, 0], viewAxis: [0, 0, 1] };

  /** Where a near-side point actually GOES, in screen coordinates, for a positive turn. */
  const measuredNearSideStep = (axis: Vec3): { x: number; y: number } => {
    // ⚠ The near side faces the viewer, so it sits at −viewAxis from the centre — and the
    // component along the rotation axis contributes nothing, so any point off the axis serves.
    const v = normalize(FRAME.viewAxis)!;
    const p: Vec3 = [-v[0], -v[1], -v[2]];
    const turned = qRotate(rotateAboutAxis(IDENTITY, axis, 1e-4), p);
    const d: Vec3 = [turned[0] - p[0], turned[1] - p[1], turned[2] - p[2]];
    // ⛔ The SAME screen convention the product must obey, written out here so the two are
    // independent statements of it rather than one statement used twice.
    return { x: dot(d, FRAME.right), y: -dot(d, FRAME.up) };
  };

  const AXES: readonly (readonly [string, Vec3])[] = [
    ["vertical on screen", [0, 1, 0]],
    ["horizontal on screen", [1, 0, 0]],
    ["down on screen", [0, -1, 0]],
    ["left on screen", [-1, 0, 0]],
    ["diagonal", [1, 1, 0]],
    ["tilted out of the screen plane", [0.3, 0.7, 0.6]],
  ];

  for (const [name, axis] of AXES) {
    it(`the declared direction matches where the near side really goes — ${name}`, () => {
      const declared = nearSideScreenDirection(FRAME, axis)!;
      const measured = measuredNearSideStep(axis);
      const len = Math.hypot(measured.x, measured.y);
      expect(len).toBeGreaterThan(1e-9);
      // ⛔ Unit-for-unit, INCLUDING the sign on both components. A dot product of +1 is the
      // whole claim; −1 would be the flip that the suite could not see.
      expect(declared.x * (measured.x / len) + declared.y * (measured.y / len)).toBeCloseTo(1, 6);
    });
  }

  it("⛔ and the two screen axes are independently pinned — neither sign can hide behind the other", () => {
    // ⚠ An axis VERTICAL on screen exercises `dir.x` alone; one HORIZONTAL exercises `dir.y`
    // alone. ⛔ Asserted as signed numbers, so flipping either is red.
    // ⚠ Component-wise and not `toEqual`: IEEE `-0` and `+0` are distinct to a deep compare
    // and identical to every use, so deep equality here would assert a fact about the sign of
    // zero that nothing depends on — a fixture failing for a reason the product does not have.
    const dir = (a: Vec3) => nearSideScreenDirection(FRAME, a)!;
    expect(dir([0, 1, 0]).x).toBeCloseTo(-1, 9);
    expect(dir([0, 1, 0]).y).toBeCloseTo(0, 9);
    expect(dir([1, 0, 0]).x).toBeCloseTo(0, 9);
    expect(dir([1, 0, 0]).y).toBeCloseTo(-1, 9);
    expect(dir([0, -1, 0]).x).toBeCloseTo(1, 9);
    expect(dir([-1, 0, 0]).y).toBeCloseTo(1, 9);
  });
});

describe("⭐⭐⭐ `D57` — THE SECOND TOUCHPOINT'S ROLL IS FLAT: dx, whatever the orientation", () => {
  // ⛔⛔ THE OWNER, 2026-09-19, answering the dead-control report:
  //
  // > *"the dx on the screen shall drive the roll of the Follower, the dy on the screen shall
  // > drive the depth translation of the Follower, whatever the orientation of the
  // > Pioneer-Follower duo. If there are cos or sin projections on axis based on orientation,
  // > remove those projections."*
  const FRAME: ScreenFrame = { right: [1, 0, 0], up: [0, 1, 0], viewAxis: [0, 0, 1] };
  const DEG = Math.PI / 180;
  const DX = mmToPx(10);
  const AXES: readonly Vec3[] = [
    [0, 1, 0],
    [1, 0, 0],
    [0, -1, 0],
    [1, 1, 0],
    [0.3, 0.7, 0.6],
    [0, 0.2, 1],
    [-0.4, 0.1, -0.9],
  ];

  it("⛔⛔⛔ THE RATE IS THE SAME FOR EVERY AXIS — the cosine is gone", () => {
    // ⭐ THE VECTOR THE OWNER'S RULE REDUCES TO. ⚠ The old law gave 20° for an axis vertical on
    // screen and **0°** for one horizontal; every axis now gives the same 20° per 10 mm.
    for (const axis of AXES) {
      const twist = flatTwistAngle(DX, rollSignFor(FRAME, axis), 2 * DEG);
      expect(Math.abs(twist) / DEG).toBeCloseTo(20, 9);
    }
    // ⛔ Including the axis that used to be dead — named separately so the regression is
    // unmistakable if anyone reinstates a projection.
    expect(Math.abs(flatTwistAngle(DX, rollSignFor(FRAME, [1, 0, 0]), 2 * DEG)) / DEG)
      .toBeCloseTo(20, 9);
  });

  it("⛔⛔ AND IT STILL AGREES IN DIRECTION WITH THE FIRST TOUCHPOINT — `D52` PRESERVED", () => {
    // ⚠⚠ THE CLAIM THAT MADE THE SIGN WORTH KEEPING. `D52` is the owner's own device report
    // (*"the second touchpoint is inverted vs. the first"*), and a raw `+dx` would have
    // re-broken it for every axis with `dir.x < 0` — which is the COMMON case, measured at
    // −1 for an axis vertical on screen.
    // ⛔ A COMPOSITION, not two unit checks: the two laws are different expressions now, and
    // only comparing their outputs can say they agree.
    for (const axis of AXES) {
      const dir = nearSideScreenDirection(FRAME, axis);
      if (dir === null || Math.abs(dir.x) <= 1e-9) continue; // no direction to agree ON
      for (const dx of [DX, -DX]) {
        const first = constrainedDragAngle(FRAME, axis, dx, 0, 2 * DEG)!;
        const second = flatTwistAngle(dx, rollSignFor(FRAME, axis), 2 * DEG);
        expect(Math.sign(second)).toBe(Math.sign(first));
      }
    }
  });

  it("⚠ the fallback where no direction exists is DECLARED — `+1`, not float noise", () => {
    // ⛔ An axis horizontal on screen has no near-side x to read, and `Math.sign` of a
    // float-noise value is the audit's *"square to the bit"* trap one module over.
    // ⭐ `+1` is arbitrary and is the honest residue of an orientation-free rule: at that pose
    // there is nothing to be consistent WITH. ⚠ What matters is that it is STABLE.
    expect(rollSignFor(FRAME, [1, 0, 0])).toBe(1);
    expect(rollSignFor(FRAME, [1, 0, 0])).toBe(1);
    // ⛔ And the axis pointing at the camera — no near-side direction at all — also rolls now
    // rather than refusing, which is what *"whatever the orientation"* requires.
    expect(nearSideScreenDirection(FRAME, [0, 0, 1])).toBeNull();
    expect(Math.abs(flatTwistAngle(DX, rollSignFor(FRAME, [0, 0, 1]), 2 * DEG)) / DEG)
      .toBeCloseTo(20, 9);
  });

  it("⭐ the gain means what it says: degrees per millimetre, linear in the travel", () => {
    const sign = rollSignFor(FRAME, [0, 1, 0]);
    expect(Math.abs(flatTwistAngle(mmToPx(5), sign, 2 * DEG)) / DEG).toBeCloseTo(10, 9);
    expect(Math.abs(flatTwistAngle(mmToPx(20), sign, 2 * DEG)) / DEG).toBeCloseTo(40, 9);
    // ⚠ `toBeCloseTo`, not `toBe`: `0 * −1` is IEEE `−0`, which is identical to `+0` for
    // every use and distinct to an identity compare — a fixture failing for a reason the
    // product does not have. Same trap as the near-side vector above.
    expect(flatTwistAngle(0, sign, 2 * DEG)).toBeCloseTo(0, 12);
  });
});
