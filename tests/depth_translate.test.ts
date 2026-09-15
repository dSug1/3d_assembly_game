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
  shared,
} from "../src/input/depth_translate";
import { DEFAULT_CONFIG, CAMERA_NEAR_PLANE_M } from "../src/input/gestureConfig";
import { dot, length, normalize, scale, sub, type Vec3 } from "../src/core/vec";
import { mmToPx } from "../src/core/units";

const NOISE_MM = 0.761; // ⭐ MEASURED, 2026-09-14.
const TOL_MM = 6;
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

const detector = () => new CommonDragDetector(WINDOW_MS, TOL_MM, NOISE_MM);

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

describe("✅ what IS a common drag", () => {
  const run = (aStepMm: number, bStepMm: number) => {
    const d = detector();
    let last = null as ReturnType<CommonDragDetector["push"]>;
    for (let i = 0; i <= 8; i++) last = d.push(i * 8, mmToPx(i * aStepMm), mmToPx(i * bStepMm));
    return last;
  };

  it("both fingers sweeping down together is reported", () => {
    const v = run(3, 3)!;
    expect(v).not.toBeNull();
    expect(v.spreadMm).toBeCloseTo(0, 9);
    expect(v.commonMm).toBeGreaterThan(0); // screen y grows DOWNWARD
  });

  it("⭐ a small spread INSIDE the tolerance still counts — hands are not machines", () => {
    const v = run(3, 2.6)!;
    expect(v).not.toBeNull();
    expect(v.spreadMm).toBeGreaterThan(0);
    expect(v.spreadMm).toBeLessThan(TOL_MM);
  });

  it("⭐ the reported common travel is the AVERAGE of the two, not either one", () => {
    // ⚠ Two samples, both inside the window, so the travels are exactly what is written
    // here. My first version of this used a ramp whose SPREAD (14 mm) exceeded the 6 mm
    // tolerance, and the detector refused it — correctly. ⭐ Control the window when the
    // assertion is about arithmetic rather than about the gate.
    const d = detector();
    d.push(0, 0, 0);
    const v = d.push(8, mmToPx(10), mmToPx(6))!;
    expect(v).not.toBeNull();
    expect(v.commonMm).toBeCloseTo(8, 6);
    expect(v.spreadMm).toBeCloseTo(4, 6);
  });

  it("works upward as well as downward", () => {
    expect(run(-3, -3)!.commonMm).toBeLessThan(0);
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

describe("⭐⭐ THE OBJECT FOLLOWS THE **SHARED** TRAVEL", () => {
  // ⚠⚠ THE DEFECT THIS PINS, FOUND BY FINGER: "the finger which is outside any object can
  // move the object on depth once or twice even if the finger on the object is still."
  // ⛔ The displacement used to be HALF OF EACH FINGER'S OWN DELTA, and halves sum to the
  // average — so a finger moving alone still contributed real motion until the divergence
  // test tripped. Any tolerance above zero leaks that way: it is inherent to averaging, and
  // no value of `depthCommonToleranceMm` fixes it.

  it("⭐ shared() is zero unless BOTH went the same way", () => {
    expect(shared(10, 0)).toBe(0);
    expect(shared(0, 10)).toBe(0);
    expect(shared(10, -10)).toBe(0);
    expect(shared(0, 0)).toBe(0);
  });

  it("⭐ and is the SMALLER of the two when they agree, keeping the sign", () => {
    expect(shared(10, 4)).toBe(4);
    expect(shared(4, 10)).toBe(4);
    expect(shared(-10, -4)).toBe(-4);
    expect(shared(-4, -10)).toBe(-4);
  });

  const enter = (d: CommonDragDetector) => {
    let last = null as ReturnType<CommonDragDetector["push"]>;
    for (let i = 0; i < 12; i++) last = d.push(i * 8, mmToPx(i * 3), mmToPx(i * 3));
    return last!;
  };

  it("⛔⛔ A FINGER MOVING ALONE ADDS NOTHING — the shared travel does not budge", () => {
    const d = detector();
    const atLatch = enter(d);
    // The holder freezes at 33 mm; the anchor runs on, well inside the tolerance.
    let t = 96;
    let last = atLatch;
    for (let i = 1; i <= 5; i++) {
      last = d.push(t, mmToPx(33), mmToPx(33 + i))!;
      t += 8;
    }
    expect(last).not.toBeNull();
    // ⭐ THE ASSERTION THE REPORT ASKS FOR: the object is driven by this number, and it
    // has not changed, so the object has not moved.
    expect(last.sharedMm).toBeCloseTo(atLatch.sharedMm, 9);
  });

  it("⭐ both moving together DOES add — and it follows the SLOWER one", () => {
    // ⚠ RELATIVE, because the latch closes as soon as the entry test passes — several
    // samples before `enter` finishes — so the absolute shared travel at that point is
    // whatever it is. My first version assumed the latch closed on the LAST entry sample
    // and asserted an absolute 4 mm; the geometry disagreed. ⭐ A difference is the honest
    // assertion here, and it is the quantity the object actually moves by.
    const d = detector();
    const before = enter(d);
    // Holder +4 mm, anchor +6 mm from where they were: they agree, so the shared part of
    // the STEP is the smaller of the two.
    const v = d.push(96, mmToPx(37), mmToPx(39))!;
    expect(v.sharedMm - before.sharedMm).toBeCloseTo(4, 6);
  });

  it("⛔ OUT AND BACK RETURNS TO THE SAME SHARED TRAVEL — this is what stops the drift", () => {
    // ⭐ Stated as an INVARIANT rather than against a number: the shared travel at a given
    // pair of finger positions is the same whichever direction the hand arrived from. That
    // is exactly what "a back-and-forth leaves the object where it started" means, and it
    // does not depend on where the latch happened to close.
    const d = detector();
    enter(d);
    let t = 96;
    const atOutbound = d.push(t, mmToPx(36), mmToPx(36))!;
    t += 8;
    // Push further out…
    for (let mm = 39; mm <= 60; mm += 3) {
      d.push(t, mmToPx(mm), mmToPx(mm));
      t += 8;
    }
    // …then come back to exactly where `atOutbound` was read.
    let back = atOutbound;
    for (let mm = 57; mm >= 36; mm -= 3) {
      back = d.push(t, mmToPx(mm), mmToPx(mm))!;
      t += 8;
    }
    expect(back.sharedMm).toBeCloseTo(atOutbound.sharedMm, 6);
  });

  it("⛔⛔ the idle-anchor exit is RATE-INDEPENDENT — the flaw no tuning could fix", () => {
    // ⚠ The first exit test was a WINDOWED spread, so the moving finger had to cover the
    // whole tolerance INSIDE one 60 ms window — above ~100 mm/s. Slower than that it never
    // exited at all, which is what "the depth translation continues" was.
    // ⭐ Measured from the latch instead, the exit happens after a fixed DISTANCE at any
    // speed. Asserted at two speeds an order of magnitude apart.
    const exitAfterMm = (stepMm: number) => {
      const d = detector();
      enter(d);
      let t = 96;
      let travelled = 0;
      for (let i = 0; i < 400; i++) {
        travelled += stepMm;
        const v = d.push(t, mmToPx(33), mmToPx(33 + travelled));
        t += 8;
        if (v === null) return travelled;
      }
      return Infinity;
    };
    const fast = exitAfterMm(4);
    const slow = exitAfterMm(0.2);
    expect(fast).toBeLessThan(TOL_MM + 5);
    expect(slow).toBeLessThan(TOL_MM + 5);
  });
});

describe("⛔⛔ THE GATE LATCHES — two defects, one cause", () => {
  // ⚠⚠ BOTH OF THESE WERE FOUND BY FINGER ON THE SAME DAY, and they are the same bug seen
  // from two angles:
  //   "at the start the translation on depth is OK but then it seems to BLEND into a
  //    translation along gravity axis, even though the two fingers continue their
  //    synchronized movements"
  //   "when I do BACK AND FORTH of the two synchronized fingers, the object DRIFTS along
  //    the gravity axis"
  // ⛔ The entry test needs both fingers to have travelled 3× the measured noise across the
  // window. A hand SLOWS as it settles, and a hand STOPS at every reversal — so the gate
  // dropped, control fell through to rule 6, and under A7 rule 6's dy is the GRAVITY axis.
  // The first report is that handover happening once; the second is it happening at every
  // turnaround, which ratchets into a drift.

  const feed = (d: CommonDragDetector, pairs: readonly (readonly [number, number])[]) => {
    let last = null as ReturnType<CommonDragDetector["push"]>;
    pairs.forEach(([a, b], i) => {
      last = d.push(i * 8, mmToPx(a), mmToPx(b));
    });
    return last;
  };

  /** A brisk common drag, enough to latch. */
  const entering = (): readonly (readonly [number, number])[] =>
    Array.from({ length: 12 }, (_, i) => [i * 3, i * 3] as const);

  it("⛔⛔ a common drag that SLOWS TO A CRAWL keeps reporting — the BLEND defect", () => {
    // ⚠⚠ ASSERTED ON WHAT `push` RETURNS, NOT ON THE FLAG. My first version of this
    // checked `isCommon`, which stays set either way — so it passed with the latch REMOVED
    // and proved nothing. `METHOD`: a test that cannot fail is not a test, and the only
    // way to know is to break the code and watch.
    const d = detector();
    expect(feed(d, entering())).not.toBeNull();
    // Now creep, far below the 3 × 0.761 mm floor the ENTRY test demands.
    // ⚠ CONTINUOUS TIME. My first version jumped the clock by 112 ms here, which empties
    // a 60 ms window — so the detector had no baseline and said null for an honest reason
    // that had nothing to do with the defect. A fixture must not manufacture the failure
    // it is testing for.
    let lastDuringCreep = null as ReturnType<CommonDragDetector["push"]>;
    for (let i = 0; i < 20; i++) {
      const mm = 36 + i * 0.05;
      lastDuringCreep = d.push(96 + i * 8, mmToPx(mm), mmToPx(mm));
    }
    expect(lastDuringCreep, "a hand that slows is still doing the same gesture").not.toBeNull();
  });

  it("⛔⛔ a BACK-AND-FORTH never stops reporting, reversal included — the DRIFT defect", () => {
    // ⭐ At the turnaround the window's travel passes through ZERO, which is exactly what
    // the entry floor rejects — and every rejection leaked a few frames of rule 6, whose dy
    // is the gravity axis. Repeated turnarounds ratchet that leak into a drift.
    // ⛔ So the assertion is that NOT ONE sample after entry returns null.
    const d = detector();
    Array.from({ length: 12 }, (_, i) => i * 3).forEach((mm, i) => {
      d.push(i * 8, mmToPx(mm), mmToPx(mm));
    });

    let nulls = 0;
    // ⚠ Continues the entry phase's clock — see the note in the crawl vector above.
    let t = 96;
    const sweep = (from: number, to: number, step: number) => {
      for (let mm = from; step > 0 ? mm <= to : mm >= to; mm += step) {
        if (d.push(t, mmToPx(mm), mmToPx(mm)) === null) nulls++;
        t += 8;
      }
    };
    sweep(33, -39, -3); // back through the turnaround
    sweep(-39, 33, 3); // and out again
    expect(nulls, "every null here is a frame of vertical drift").toBe(0);
  });

  it("⛔ but a genuine DIVERGENCE still ends it — that is the hand saying something else", () => {
    const d = detector();
    feed(d, entering());
    expect(d.isCommon).toBe(true);
    // One finger holds while the other runs on: a rule 6 drag, not a depth drag.
    const diverge = Array.from({ length: 12 }, (_, i) => [36 + i * 4, 36] as const);
    expect(feed(d, diverge)).toBeNull();
    expect(d.isCommon).toBe(false);
  });

  it("⛔ ENTERING still needs both fingers moving — the latch does not lower the bar", () => {
    // ⚠ Rule 6's anchor is deliberately still, and this is what keeps it out of A6.
    const d = detector();
    const oneMoving = Array.from({ length: 12 }, (_, i) => [i * 3, 0] as const);
    expect(feed(d, oneMoving)).toBeNull();
    expect(d.isCommon).toBe(false);
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
