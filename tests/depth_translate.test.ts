/**
 * AMENDMENT A6 — DEPTH TRANSLATION BY A COMMON VERTICAL DRAG.
 *
 * ⭐⭐ THE VECTORS THAT MATTER ARE THE ONES SEPARATING A6 FROM RULE 6. The two share a
 * touchpoint configuration — one finger on the object, one beside it — and are told apart
 * only by WHAT THE FINGERS DO. So the negatives come first: a rule 6 drag (anchor still)
 * must not read as depth, and a still hand must not either.
 *
 * ⭐ HEIGHT NEVER CHANGES is carried over from A5 and still asserted: the push direction is
 * perpendicular to gravity by construction, and gravity is the primary constraint here.
 */
import { describe, expect, it } from "vitest";
import {
  CommonDragDetector,
  depthLimits,
  depthPushDirection,
  depthTranslate,
} from "../src/input/depth_translate";
import { DEFAULT_CONFIG, CAMERA_NEAR_PLANE_M } from "../src/input/gestureConfig";
import { dot, length, normalize, scale, sub, type Vec3 } from "../src/core/vec";
import { mmToPx } from "../src/core/units";

const NOISE_MM = 0.761; // ⭐ MEASURED, 2026-09-14.
const WINDOW_MS = 60;

const DOWN: Vec3 = [0, -1, 0];
const CAM: Vec3 = [0, 0.8, -1.2];
const VIEW: Vec3 = normalize([0, -0.5, 1])!;
const OBJ: Vec3 = [0.15, 0.1, 0.1];
const { minM, maxM } = depthLimits(DEFAULT_CONFIG);
const PER_PX = 0.002; // rule 6's computed factor, at some camera distance

const push = depthPushDirection(VIEW, DOWN)!;
const depthOf = (p: Vec3) => dot(sub(p, CAM), push);
/** ⭐ +1: this fixture's camera looks DOWN on the scene, so "away" rises on screen. */
const AWAY = Math.sign(dot(VIEW, DOWN));
const move = (dyPx: number, gain = 1, obj: Vec3 = OBJ) =>
  depthTranslate(CAM, obj, push, AWAY, dyPx, PER_PX, gain, minM, maxM);

/** ⭐ The shared detector: a validator must follow within ±35% to authorise a depth drag. */
const FOLLOW_RATIO = 0.35;
const detector = () => new CommonDragDetector(WINDOW_MS, FOLLOW_RATIO, NOISE_MM);

// ══════════════════════════════════════════════════════════════════════════════
// ⛔ WHAT MUST NOT READ AS DEPTH
// ══════════════════════════════════════════════════════════════════════════════

describe("⛔ telling A6 apart from RULE 6", () => {
  it("⛔⛔ A RULE 6 DRAG IS NOT DEPTH — the anchor is still, so there is no common travel", () => {
    // The object finger sweeps 30 mm down; the anchor sits where it was put.
    const d = detector();
    let last: unknown = null;
    for (let i = 0; i <= 8; i++) last = d.push(i * 8, mmToPx(i * 4), mmToPx(0));
    expect(last).toBeNull();
  });

  it("⛔ …even when the still anchor JITTERS at the measured noise floor", () => {
    const d = detector();
    let seen = 0;
    let seed = 7;
    for (let i = 0; i <= 40; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const jitterMm = ((seed / 0x7fffffff) * 2 - 1) * NOISE_MM;
      if (d.push(i * 8, mmToPx(i * 3), mmToPx(jitterMm))) seen++;
    }
    expect(seen).toBe(0);
  });

  it("⛔ A STILL HAND is not a common drag, however long you wait", () => {
    const d = detector();
    let seen = 0;
    for (let i = 0; i <= 200; i++) if (d.push(i * 8, 0, 0)) seen++;
    expect(seen).toBe(0);
  });

  it("⛔ FINGERS MOVING OPPOSITE WAYS is not common motion — that is a pinch, not a drag", () => {
    const d = detector();
    let last: unknown = null;
    for (let i = 0; i <= 8; i++) last = d.push(i * 8, mmToPx(i * 3), mmToPx(-i * 3));
    expect(last).toBeNull();
  });

  it("⛔ travelling together but too far APART is refused — the tolerance is on the DIFFERENCE", () => {
    const d = detector();
    let last: unknown = null;
    // 24 mm against 4 mm: both moving, same direction, 20 mm apart — over a 6 mm tolerance.
    for (let i = 0; i <= 8; i++) last = d.push(i * 8, mmToPx(i * 3), mmToPx(i * 0.5));
    expect(last).toBeNull();
  });

  it("⛔ a single sample has no baseline and says nothing", () => {
    expect(detector().push(0, mmToPx(50), mmToPx(50))).toBeNull();
  });
});

describe("✅ what the reading carries", () => {
  // ⚠ This block was written against a detector that COMBINED the two fingers' travel and
  // reported a mean and a spread. It no longer does: the object follows the DRIVER, and the
  // reading exists so a caller (and a device readout) can see what was judged.
  const RATIO = 0.35;
  const det = () => new CommonDragDetector(WINDOW_MS, RATIO, NOISE_MM);

  const run = (driverStepMm: number, followerStepMm: number) => {
    const d = det();
    let last = null as ReturnType<CommonDragDetector["push"]>;
    for (let i = 0; i <= 12; i++) {
      last = d.push(i * 8, mmToPx(i * driverStepMm), mmToPx(i * followerStepMm));
    }
    return last;
  };

  it("reports BOTH travels and their ratio, so a readout need not recompute them", () => {
    // ⭐ `METHOD`: record the value the product actually used. A HUD that derived its own
    // ratio would be a second implementation free to disagree with the one that decided.
    const v = run(3, 3)!;
    expect(v).not.toBeNull();
    expect(v.driverMm).toBeGreaterThan(0); // screen y grows DOWNWARD
    expect(v.followerMm).toBeCloseTo(v.driverMm, 6);
    expect(v.ratio).toBeCloseTo(1, 6);
  });

  it("⭐ the ratio reflects a validator that lags a little", () => {
    const v = run(3, 2.4)!;
    expect(v!.ratio).toBeCloseTo(0.8, 6);
  });

  it("works upward as well as downward", () => {
    const v = run(-3, -3)!;
    expect(v.driverMm).toBeLessThan(0);
    expect(v.ratio).toBeCloseTo(1, 6);
  });

  it("⛔ says nothing at all while the verdict is not COMMON", () => {
    const d = det();
    expect(d.push(0, 0, 0)).toBeNull();
    expect(d.verdict).toBe("PENDING");
  });
});

// ══════════════════════════════════════════════════════════════════════════════

describe("⭐⭐ HEIGHT NEVER CHANGES — gravity is the primary constraint", () => {
  it("at every camera elevation", () => {
    for (const tilt of [0.1, 0.5, 1.5, 4]) {
      const view = normalize([0, -tilt, 1])!;
      const out = depthTranslate(CAM, OBJ, depthPushDirection(view, DOWN)!, Math.sign(dot(view, DOWN)), mmToPx(-20), PER_PX, 1, minM, maxM);
      expect(out[1], `tilt ${tilt}`).toBeCloseTo(OBJ[1], 12);
    }
  });

  it("⛔ and the across-view offset is untouched too — only the depth moves", () => {
    const across = (p: Vec3) => {
      const r = sub(p, CAM);
      return sub(sub(r, scale(push, dot(r, push))), scale(DOWN, dot(r, DOWN)));
    };
    expect(length(sub(across(move(mmToPx(-30))), across(OBJ)))).toBeCloseTo(0, 12);
  });
});

describe("the sense and the size of the motion", () => {
  it("⚠ fingers UP push the object AWAY — it sits higher on screen when further off", () => {
    expect(depthOf(move(mmToPx(-20)))).toBeGreaterThan(depthOf(OBJ));
  });

  it("fingers DOWN bring it closer", () => {
    expect(depthOf(move(mmToPx(20)))).toBeLessThan(depthOf(OBJ));
  });

  it("⭐⭐ moves as far as RULE 6 would for the same travel — gain 1 means CONSISTENT, not tracking", () => {
    // 30 mm of finger at this camera factor: the same world distance a screen-plane drag
    // would cover, just pointed into the scene instead of across it.
    const travelPx = mmToPx(30);
    expect(depthOf(move(-travelPx)) - depthOf(OBJ)).toBeCloseTo(travelPx * PER_PX, 9);
  });

  it("is linear in the travel, and in the gain", () => {
    expect(depthOf(move(-mmToPx(30))) - depthOf(OBJ)).toBeCloseTo(
      3 * (depthOf(move(-mmToPx(10))) - depthOf(OBJ)),
      9,
    );
    expect(depthOf(move(-mmToPx(10), 2)) - depthOf(OBJ)).toBeCloseTo(
      2 * (depthOf(move(-mmToPx(10), 1)) - depthOf(OBJ)),
      9,
    );
  });

  it("⭐ out and back RETURNS — it is a displacement, applied per frame", () => {
    const away = move(-mmToPx(25));
    const back = depthTranslate(CAM, away, push, AWAY, mmToPx(25), PER_PX, 1, minM, maxM);
    expect(length(sub(back, OBJ))).toBeCloseTo(0, 9);
  });

  it("zero travel changes nothing", () => {
    expect(length(sub(move(0), OBJ))).toBeCloseTo(0, 12);
  });
});

describe("⭐⭐ DRIVER AND VALIDATOR — the classification", () => {
  // ⛔⛔ THE OBJECT FOLLOWS ONE FINGER: the one touching it. The second finger contributes
  // NO motion — it authorises the depth reading by following within a percentage ratio.
  // ⚠ Three earlier versions of this blended the two fingers' travel (a mean, a minimum, a
  // faded mean) and a hand felt every one of them within minutes. A blend has seams.

  const RATIO = 0.35;
  const det = () => new CommonDragDetector(WINDOW_MS, RATIO, NOISE_MM);

  /** Feed a run of (driver, validator) positions in mm, 8 ms apart. */
  const feed = (
    d: CommonDragDetector,
    pairs: readonly (readonly [number, number])[],
    t0 = 0,
  ) => {
    let last = null as ReturnType<CommonDragDetector["push"]>;
    pairs.forEach(([dr, fo], i) => {
      last = d.push(t0 + i * 8, mmToPx(dr), mmToPx(fo));
    });
    return last;
  };

  const together = (n: number, step = 3, from = 0) =>
    Array.from({ length: n }, (_, i) => [from + i * step, from + i * step] as const);

  it("⭐ starts PENDING — nothing has been decided and nothing may be acted on", () => {
    const d = det();
    expect(d.verdict).toBe("PENDING");
    expect(feed(d, [[0, 0]])).toBeNull();
    expect(d.verdict).toBe("PENDING");
  });

  it("⭐⭐ two fingers in step read as COMMON", () => {
    const d = det();
    const v = feed(d, together(12));
    expect(d.verdict).toBe("COMMON");
    expect(v).not.toBeNull();
    expect(v!.ratio).toBeCloseTo(1, 6);
  });

  it("⭐ a validator inside the ratio still follows — hands are not machines", () => {
    const d = det();
    // The validator covers 80% of the driver's travel: inside ±35%.
    feed(d, Array.from({ length: 12 }, (_, i) => [i * 3, i * 2.4] as const));
    expect(d.verdict).toBe("COMMON");
  });

  it("⛔ a validator well outside the ratio does NOT authorise it", () => {
    const d = det();
    // 30% of the driver's travel: outside ±35% of 1.
    feed(d, Array.from({ length: 30 }, (_, i) => [i * 3, i * 0.9] as const));
    expect(d.verdict).toBe("SEPARATE");
  });

  it("⛔⛔ AMBIGUITY 1 — AT A REVERSAL, BOTH TRAVELS PASS THROUGH ZERO, AND IT HOLDS", () => {
    // ⚠⚠ The owner named this: "at the moment of direction reversion, both delta position y
    // converge to zero before changing sign (maybe one before the other): this is the moment
    // an ambiguity can occur between depth translation and gravity axis translation."
    // ⭐ A ratio of two numbers passing through zero is noise. Deciding on it is what leaked
    // vertical translation at every turnaround and ratcheted into a drift.
    const d = det();
    feed(d, together(12));
    expect(d.verdict).toBe("COMMON");

    // ⚠⚠ WITH THE MEASURED POINTER NOISE ON BOTH FINGERS, which is the whole point: a
    // fixture whose fingers agree EXACTLY keeps a well-behaved ratio even at zero travel,
    // so it cannot see this defect at all. My first version did exactly that and passed
    // with the hold window REMOVED. ⭐ Near a turnaround the ratio is jitter ÷ jitter, and
    // that is garbage however carefully it is computed.
    // ⚠ The hand DWELLS at the turn — 25 samples, well past the two windows a SEPARATE
    // decision needs — which is what makes the garbage persist long enough to decide on.
    let seed = 20260915;
    const jitterMm = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return ((seed / 0x7fffffff) * 2 - 1) * NOISE_MM;
    };
    let t = 96;
    for (let i = 0; i < 30; i++) {
      // ⚠ A GENUINE dwell: under a millimetre of real travel across the whole turn, so the
      // window travel sits below the noise floor and the ratio is jitter over jitter. A
      // fixture that keeps moving 12 mm through the turnaround never reaches the state the
      // hold window exists for — my first two attempts at this both did.
      const along = 33 - 0.001 * i * i;
      d.push(t, mmToPx(along + jitterMm()), mmToPx(along + jitterMm()));
      t += 8;
      expect(d.verdict, `flipped at sample ${i} of the reversal`).toBe("COMMON");
    }
  });

  it("⛔⛔ AMBIGUITY 2 — A VALIDATOR THAT STARTS LATE IS NOT A DIFFERENT GESTURE", () => {
    // ⚠⚠ Also the owner's: "at the start, if the second finger is slightly lagging its
    // start, it can also be confused with a gravity axis translation (finger on the object
    // delta position y while second finger still idle)."
    // ⭐ So a single disagreeing window must not decide. The verdict stays PENDING through
    // the lag — and PENDING means the caller withholds the vertical rather than handing it
    // to rule 6, which is what produced the lurch at the start of every gesture.
    const d = det();
    // Driver moves for one window; validator has not begun.
    feed(d, Array.from({ length: 7 }, (_, i) => [i * 3, 0] as const));
    expect(d.verdict, "one window of lag must not decide").toBe("PENDING");
    // The validator catches up.
    feed(d, Array.from({ length: 12 }, (_, i) => [18 + i * 3, i * 3] as const), 56);
    expect(d.verdict).toBe("COMMON");
  });

  it("⛔ …but a validator that NEVER starts is rule 6, and it is decided", () => {
    const d = det();
    feed(d, Array.from({ length: 40 }, (_, i) => [i * 3, 0] as const));
    expect(d.verdict).toBe("SEPARATE");
  });

  it("⛔ fingers moving OPPOSITE ways are not a depth drag", () => {
    const d = det();
    feed(d, Array.from({ length: 30 }, (_, i) => [i * 3, -i * 3] as const));
    expect(d.verdict).toBe("SEPARATE");
  });

  it("⭐⭐ a SLOW drag stays COMMON — the hold window is not a speed test", () => {
    // ⚠ The earlier gate re-decided every frame against a travel floor, so a hand that
    // slowed as it settled dropped out of depth and into rule 6's vertical: "it seems to
    // blend into a translation along gravity axis". ⭐ Below the floor the ratio is
    // undefined, and undefined means HOLD, not "no".
    const d = det();
    feed(d, together(12));
    expect(d.verdict).toBe("COMMON");
    let t = 96;
    for (let i = 1; i <= 30; i++) {
      d.push(t, mmToPx(33 + i * 0.05), mmToPx(33 + i * 0.05));
      t += 8;
    }
    expect(d.verdict).toBe("COMMON");
  });

  it("⛔ a lone VALIDATOR cannot start a depth drag on its own", () => {
    const d = det();
    feed(d, Array.from({ length: 30 }, (_, i) => [0, i * 3] as const));
    expect(d.verdict).not.toBe("COMMON");
  });
});

describe("⛔⛔ WHICH WAY IS AWAY depends on the camera's side of the horizon", () => {
  // ⚠⚠ THE DEFECT THESE PIN, FOUND BY FINGER: "when the camera is on the bottom ring
  // facing upwards, the depth translation is chaotic." An object pushed further off along
  // the ground RISES toward the horizon seen from above and SINKS seen from below — so a
  // rule that hard-codes "fingers up means away" is right on the top rings and BACKWARDS on
  // the bottom one. ⭐ A hand correcting a backwards control produces exactly that chaos.

  const UP_VIEW: Vec3 = normalize([0, 0.7, 0.7])!; // a camera below, looking up
  const upPush = depthPushDirection(UP_VIEW, DOWN)!;
  const upDepthOf = (q: Vec3) => dot(sub(q, CAM), upPush);

  it("⭐ looking DOWN on the scene, fingers UP push the object away", () => {
    expect(depthOf(move(mmToPx(-20)))).toBeGreaterThan(depthOf(OBJ));
  });

  it("⛔⛔ looking UP from below, the SAME fingers bring it CLOSER — the sign must flip", () => {
    const out = depthTranslate(
      CAM, OBJ, upPush, Math.sign(dot(UP_VIEW, DOWN)), mmToPx(-20), PER_PX, 1, minM, maxM,
    );
    expect(upDepthOf(out)).toBeLessThan(upDepthOf(OBJ));
  });

  it("⛔ COUNTER-EXAMPLE: forcing the old hard-coded +1 from below inverts the gesture", () => {
    // ⭐ This is what shipped, and it is what the hand felt. Kept so the fix cannot be
    // quietly undone by someone "simplifying" the sign away.
    const wrong = depthTranslate(CAM, OBJ, upPush, 1, mmToPx(-20), PER_PX, 1, minM, maxM);
    const right = depthTranslate(
      CAM, OBJ, upPush, Math.sign(dot(UP_VIEW, DOWN)), mmToPx(-20), PER_PX, 1, minM, maxM,
    );
    expect(Math.sign(upDepthOf(wrong) - upDepthOf(OBJ))).toBe(
      -Math.sign(upDepthOf(right) - upDepthOf(OBJ)),
    );
  });

  it("⛔ a LEVEL camera shows nothing for a depth change, so the gesture goes quiet", () => {
    // ⚠ The fifth appearance of "goes quiet before it fails", and the first with the quiet
    // zone in the MIDDLE of the range rather than at an end.
    const level: Vec3 = normalize([0, 0, 1])!;
    expect(Math.sign(dot(level, DOWN))).toBe(0);
    const out = depthTranslate(
      CAM, OBJ, depthPushDirection(level, DOWN)!, 0, mmToPx(-20), PER_PX, 1, minM, maxM,
    );
    expect(out).toEqual(OBJ);
  });
});

describe("⛔ the clamps and the degenerate cases", () => {
  it("cannot be pulled onto the camera", () => {
    expect(depthOf(move(mmToPx(100000)))).toBeCloseTo(minM, 9);
    expect(minM).toBeGreaterThan(CAMERA_NEAR_PLANE_M);
  });

  it("cannot be pushed past the camera's own maximum orbit radius", () => {
    expect(depthOf(move(-mmToPx(100000)))).toBeCloseTo(maxM, 9);
  });

  it("⭐ both bounds are DERIVED — no new tunable to measure", () => {
    expect(minM).toBe(2 * CAMERA_NEAR_PLANE_M);
    expect(maxM).toBe(DEFAULT_CONFIG.cameraRadiusMaxM);
  });

  it("⛔ a camera looking STRAIGHT DOWN has no depth direction", () => {
    expect(depthPushDirection([0, -1, 0], DOWN)).toBeNull();
    expect(depthTranslate(CAM, OBJ, [0, 0, 0], 1, mmToPx(-20), PER_PX, 1, minM, maxM)).toEqual(
      OBJ,
    );
  });

  it("⛔ an object BEHIND the camera is left alone", () => {
    const behind: Vec3 = [0, 0.1, -3];
    expect(move(mmToPx(-20), 1, behind)).toEqual(behind);
  });

  it("⛔ never writes a NaN — one would never wash out of a placement", () => {
    for (const bad of [NaN, Infinity]) {
      for (const c of depthTranslate(CAM, OBJ, push, AWAY, bad, PER_PX, 1, minM, maxM)) {
        expect(Number.isFinite(c)).toBe(true);
      }
      for (const c of depthTranslate(CAM, OBJ, push, AWAY, mmToPx(-20), bad, 1, minM, maxM)) {
        expect(Number.isFinite(c)).toBe(true);
      }
    }
  });
});
