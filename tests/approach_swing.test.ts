/**
 * GOLDEN VECTORS — the APPROACH SWING, a trial on branch `1.0.18-`.
 *
 * ⭐⭐⭐ THE VECTOR THAT MATTERS IS THE ROUND TRIP, and it is written first: *the camera leaves
 * its orbit when the capture triggers and is back on it, exactly, at contact.* ⛔ Every other
 * property here is a detail of how it gets there; that one is the owner's requirement.
 */
import { describe, expect, it } from "vitest";
import { axisDisplacement, axisTravel } from "@input/axis_translate";
import { axesFromFrame } from "@input/object_axes";
import { gravityFrame } from "@input/gravity_frame";
import { trackingMetresPerPx } from "@input/translate";
import { dot, normalize, type Vec3 } from "@core/vec";
import {
  freezeProgress,
  pitchAngleFor,
  pitchOffsetV,
  rebaseTriggerGap,
  swingDriverIndex,
  endApproach,
  smoothAmplitude,
  swingAmplitudeRad,
  swingProgress,
  swingSignFor,
  swingYawRad,
  type SwingLatch,
} from "@input/approach_swing";

const LATCH: SwingLatch = { gapAtTriggerM: 0.07, sign: 1, offsetAtTriggerM: 0.07, armTravelM: 0.004, armTravelUpM: 0 };
const AMP = (25 * Math.PI) / 180;
const yawAt = (gapM: number, latch: SwingLatch = LATCH) =>
  swingYawRad(swingProgress(gapM, latch), AMP, latch.sign);

describe("⛔⛔⛔ THE ROUND TRIP — out, and exactly back", () => {
  it("⭐⭐⭐ the camera is EXACTLY on its orbit at the trigger and at contact", () => {
    // ⛔ `toBe(0)`, not `toBeCloseTo`. `Math.sin(Math.PI)` is 1.2246e-16, and the owner's
    // requirement is *"the camera shall be back to its original position"* — a residual makes
    // that a near-miss rather than a fact. This is the mutant the whole file exists to kill.
    expect(yawAt(0.07)).toBe(0);
    expect(yawAt(0)).toBe(0);
  });

  it("⭐⭐ it is furthest out at HALF the original gap — the owner's reversal point", () => {
    // ⚠ *"When the offset is half what it initially was, the camera orbit reverses."*
    expect(Math.abs(yawAt(0.035))).toBeCloseTo(AMP, 12);
    // ⭐ And that really is the maximum, not merely a large value: sampled either side.
    for (const g of [0.05, 0.04, 0.03, 0.02]) {
      expect(Math.abs(yawAt(g))).toBeLessThan(Math.abs(yawAt(0.035)) + 1e-12);
    }
  });

  it("⭐⭐ it grows on the way in and shrinks on the way back — monotone on each side", () => {
    // ⛔ A COMPOSITION, sampled: the shape is the claim, and a single peak value cannot say
    // whether the curve got there monotonically or wandered.
    const half = [0.07, 0.065, 0.06, 0.05, 0.045, 0.04, 0.035].map((g) => Math.abs(yawAt(g)));
    for (let i = 1; i < half.length; i++) expect(half[i]!).toBeGreaterThan(half[i - 1]!);
    const back = [0.035, 0.03, 0.02, 0.015, 0.01, 0.005, 0].map((g) => Math.abs(yawAt(g)));
    for (let i = 1; i < back.length; i++) expect(back[i]!).toBeLessThan(back[i - 1]!);
  });

  it("⛔⛔⛔ THE REVERSAL IS SMOOTH — the camera's angular SPEED passes through zero", () => {
    // ⚠⚠ THIS VECTOR EXISTS BECAUSE A MUTANT SURVIVED. A **triangle** satisfies every other
    // claim in this file — zero at both ends, peak at half, monotone on each side, one sign —
    // and it was the stated REASON for choosing a sine that nothing tested:
    //
    //   *"its velocity is continuous at the reversal: a triangle changes the camera's angular
    //    speed instantaneously at the halfway point, which on glass reads as a knock exactly
    //    when the hand is concentrating on the last millimetres."*
    //
    // ⭐⭐ `METHOD`: *a reason recorded in prose is not a tested claim.* So it is measured: the
    // slope either side of the peak, numerically. ⛔ A sine's is ≈ 0 at the peak; a triangle's
    // jumps from `+2A` to `−2A`, a discontinuity of `4A`.
    const h = 1e-6;
    const slope = (p: number) =>
      (swingYawRad(p + h, AMP, 1) - swingYawRad(p - h, AMP, 1)) / (2 * h);
    expect(Math.abs(slope(0.5))).toBeLessThan(1e-4);
    // ⚠ And the two one-sided slopes AGREE at the reversal rather than flipping.
    expect(Math.abs(slope(0.5 - 1e-3) - slope(0.5 + 1e-3))).toBeLessThan(0.02 * AMP);
    // ⭐ While away from the peak the camera really is moving — so the test above is a statement
    // about smoothness and not about the swing being flat everywhere.
    expect(Math.abs(slope(0.25))).toBeGreaterThan(0.5 * AMP);
  });

  it("⛔ the sign is the LATCH's, and reversing it mirrors the whole swing", () => {
    const other: SwingLatch = { gapAtTriggerM: 0.07, sign: -1, offsetAtTriggerM: 0.07, armTravelM: -0.004, armTravelUpM: 0 };
    expect(yawAt(0.035, other)).toBeCloseTo(-yawAt(0.035), 12);
    // ⚠ The reversal at half is NOT a change of sign — both halves are on the same side of the
    // orbit. ⛔ Asserted, because "reverses" in the dictation could be read either way, and the
    // other reading would sweep the camera through the original position and out the far side.
    expect(Math.sign(yawAt(0.05))).toBe(Math.sign(yawAt(0.02)));
  });
});

describe("⛔⛔ THE PROGRESS — clamped at both ends, and degenerate inputs are refused", () => {
  it("⭐ 0 at the trigger, 1 at contact, linear in the gap between", () => {
    expect(swingProgress(0.07, LATCH)).toBe(0);
    expect(swingProgress(0.035, LATCH)).toBeCloseTo(0.5, 12);
    expect(swingProgress(0, LATCH)).toBe(1);
  });

  it("⛔⛔ PULLING BACK PAST THE TRIGGER DOES NOT SWING THE OTHER WAY", () => {
    // ⚠ `p` would go negative and `sin` would take the camera out on the far side — a hand
    // backing off would see the view swing the wrong way, which is the opposite of the cue this
    // is for. ⭐ It returns to zero and STAYS there.
    expect(swingProgress(0.09, LATCH)).toBe(0);
    expect(yawAt(0.09)).toBe(0);
    expect(yawAt(10)).toBe(0);
  });

  it("⛔ PAST CONTACT the bodies interpenetrate and the gap reads 0 — still home", () => {
    // ⚠ `gapBetween` returns 0 for overlap, so there is no negative gap to handle; the clamp is
    // what makes that harmless rather than something the caller must know.
    expect(swingProgress(-0.01, LATCH)).toBe(1);
    expect(yawAt(-0.01)).toBe(0);
  });

  it("⛔⛔ a trigger gap of ZERO is degenerate and answers `1` — the only safe answer", () => {
    // ⚠ It would divide by zero, and it means the capture fired AT contact, where there is no
    // approach left to show. ⭐ `1` puts the swing at home: the one answer that cannot move the
    // camera. `LESSONS_CARRIED` §6 — a degenerate input refuses, it does not improvise.
    for (const g0 of [0, -1, NaN, Infinity]) {
      const bad: SwingLatch = { gapAtTriggerM: g0, sign: 1, offsetAtTriggerM: 0.07, armTravelM: 0.004, armTravelUpM: 0 };
      expect(swingProgress(0.03, bad)).toBe(1);
      expect(swingYawRad(swingProgress(0.03, bad), AMP, 1)).toBe(0);
    }
    expect(swingProgress(NaN, LATCH)).toBe(1);
  });
});

describe("⛔⛔⛔ THE DIRECTION — and it SHIPPED INVERTED (device-reported, 2026-09-19)", () => {
  // ⛔⛔ THE OWNER: *"the follower … was translating delta position x negative and the camera
  // orbited to the left and bottom. how is that possible? (i thought delta position x negative
  // would trigger camera orbit to the right and up)."*
  //
  // ⭐⭐⭐ **THE DEFECT WAS A DOUBLE NEGATION.** I read *"opposite to the dx movement"* and
  // negated — without checking that the yaw axis is **already** opposite. `OrbitController.drag`
  // does `yawRad -= dxMm · gain` precisely so the camera moves against the finger.
  //
  // ⭐⭐ MEASURED, not reasoned, this time. At the boot pose the camera sits on `+z` looking at
  // the origin, so `+x` is screen-right, and `orbitOffset` gives:
  //
  //     yaw +30°  →  x = −0.667   (LEFT)
  //     yaw −30°  →  x = +0.667   (RIGHT)
  //
  // ⛔ So `+yaw` is LEFT, and *"opposite to dx"* is `sign(dx)` — the IDENTITY, not its negation.
  // ⚠ `orbit.ts` warns about exactly this: *"IN1 shipped yaw AND pitch inverted for exactly that
  // reason, twice."* `METHOD`: *a sign is not tested by any amount of testing the magnitude.*

  it("⭐⭐⭐ a LEFTWARD finger swings the camera RIGHT — the owner's expectation", () => {
    // ⛔ `dx < 0` → sign −1 → negative yaw → the camera moves toward `+x` → RIGHT.
    expect(swingSignFor(-12)).toBe(-1);
    expect(swingYawRad(0.5, 0.4, swingSignFor(-12))).toBeLessThan(0);
  });

  it("⭐⭐ and a RIGHTWARD finger swings it LEFT — still *opposite to the dx movement*", () => {
    expect(swingSignFor(12)).toBe(1);
    expect(swingYawRad(0.5, 0.4, swingSignFor(12))).toBeGreaterThan(0);
  });

  // ⛔⛔⛔ **THE 2026-09-20 REPORT, AND THE RETRACTION IT FORCED.** This block asserted
  // *"a zero dx falls back to +1 rather than to NO SWING"*, and the reasoning was that a swing
  // of nothing would be a gesture a hand could not retry. ⚠ The owner:
  //
  // > *"sometimes the yaw is to the left bottom, sometimes it is to the right up for the same
  // > delta position x."*
  //
  // ⭐ A fallback is a GUESS, and this one guessed a 30° camera motion. `LESSONS_CARRIED` §6:
  // *a degenerate input must return `null`, never a default.* ⚠ The old vector is kept as text
  // because a claim that was overturned is more useful than one silently deleted (`METHOD`).
  it("⛔⛔⛔ NO TRAVEL IS NO DIRECTION — `null`, and therefore NO SWING", () => {
    // ⛔ FAILS against the old code, which returned `1` here and leaned the camera 30° in a
    // direction nothing had asked for.
    expect(swingSignFor(0)).toBeNull();
    // ⭐⭐ And the consequence is asserted where it is spent: a `null` sign is zero at EVERY
    // progress, including the peak. ⚠ Without this the caller would be free to write
    // `sign ?? 1` in the render file, which is the same defect one layer along.
    expect(swingYawRad(0.5, 0.4, swingSignFor(0))).toBe(0);
    expect(swingYawRad(0.25, 0.4, null)).toBe(0);
  });

  it("⛔⛔⛔ A PURELY VERTICAL APPROACH STILL SWINGS — device-reported, 2026-09-21", () => {
    // ⛔⛔ THE OWNER, with the HUD showing `sign⛔? p=0.29 yaw=0.0° dxArm=0.00mm`:
    // *"Sometimes, when the follower enters the offset radius by a vertical translation (delta
    // position dy) the camera orbit swing is not triggered."*
    //
    // ⚠⚠ The 2026-09-20 rule read ONLY `dx`, so a vertical drag — a real translation, really
    // closing the gap — armed with no direction and the lean stayed at zero. ⭐ It was listed as
    // a COST when it shipped and judged a BUG by the hand that met it.
    // ⛔ FAILS against that rule, which returned `null` here.
    expect(swingSignFor(0, -0.004)).toBe(1);
    expect(swingSignFor(0, 0.004)).toBe(1);
    // ⭐⭐ And the consequence is asserted where it is spent: the camera actually leans.
    expect(swingYawRad(0.5, 0.4, swingSignFor(0, -0.004))).not.toBe(0);
  });

  it("⭐⭐ a HORIZONTAL component still decides the direction when there is one", () => {
    // ⚠ The vertical is a FALLBACK, never a vote: a diagonal drag is aimed by its `dx`, so the
    // owner's *"opposite to the dx movement"* is unchanged wherever it has an answer.
    expect(swingSignFor(-0.004, 0.02)).toBe(-1);
    expect(swingSignFor(0.004, -0.02)).toBe(1);
  });

  it("⛔⛔ AND NO TRAVEL AT ALL IS STILL NO SWING — the 2026-09-20 rule survives intact", () => {
    // ⭐⭐⭐ THE DISTINCTION THE WHOLE FIX TURNS ON: *was there a translation at all?* A press
    // inside the band, a rotation moving the closest points, or a pinch rescaling `D49`'s
    // threshold all cross it with **zero** travel on both axes — and must still lean nothing,
    // or the 2026-09-20 defect (*"sometimes left, sometimes right for the same dx"*) returns by
    // the back door with a constant in place of a stale variable.
    expect(swingSignFor(0, 0)).toBeNull();
    expect(swingYawRad(0.5, 0.4, swingSignFor(0, 0))).toBe(0);
  });

  it("⚠ and a non-finite travel is refused too, rather than signed", () => {
    // ⚠ `NaN < 0` is false, so the old form answered `+1` for a NaN as confidently as for a
    // zero — the shape `LESSONS_CARRIED` §6 exists to refuse.
    expect(swingSignFor(Number.NaN)).toBeNull();
    // ⚠ And a non-finite VERTICAL is refused as well — it decides whether a swing happens at
    // all, so it is not a field the rule may read loosely.
    expect(swingSignFor(0, Number.NaN)).toBeNull();
    // ⚠ An infinity is refused as well, and it is NOT a sign question: a travel that is not a
    // number is not a travel, and *"lean the camera as far as the slider allows, that way"* is
    // not a safer answer than *"do not lean"*.
    expect(swingSignFor(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("⭐⭐ a ZERO-crossing travel takes the NET sign, not the last sample's", () => {
    // ⛔ The arming frame sums every translate step applied since the previous frame, so a
    // finger that wobbled within one frame arms on where it actually GOT TO. ⚠ This is the
    // vector that pins *the travel that crossed the threshold* rather than *a travel*.
    const net = 0.9 - 1.4; // two steps of one frame, in mm: right then further left
    expect(swingSignFor(net)).toBe(-1);
  });

  it("⛔⛔ THE PITCH DOES NOT MIRROR — it leans the same way whichever way the part travels", () => {
    // ⭐ The owner's sentence names ONE vertical direction for both axes (*"right and up"*).
    // ⚠ Sharing the yaw's SIGNED angle would give right-and-up one way and left-and-**down** the
    // other, so `+x` and `−x` approaches would be shown from opposite sides vertically and a hand
    // comparing them would be comparing two different views.
    expect(pitchAngleFor(0.4)).toBeCloseTo(0.4, 12);
    expect(pitchAngleFor(-0.4)).toBeCloseTo(0.4, 12);
    // ⛔ And it still vanishes with the swing, so both halves come home together.
    expect(pitchAngleFor(0)).toBe(0);
  });
});

describe("⛔⛔ THE PITCH HALF — the same angle, expressed in the ring surface's units", () => {
  // ⛔ THE OWNER, 2026-09-19: *"also add a pitch swing of the same value. The idea is that the
  // swing of the camera helps the user visualize the alignment in the directions orthogonal to
  // the translation approach."*
  //
  // ⭐⭐ THE YAW IS RADIANS AND THE ELEVATION IS NOT. `v ∈ [0, 1]` runs along a monotone cubic
  // through three tuned rings, so *"the same value"* has to be converted before it means
  // anything — which is the whole of this function.

  // ⚠ Representative rings: a bottom looking up from near the ground and a top looking down.
  const BOTTOM = Math.atan2(0.2, 1.4); // ≈ 8.1°
  const TOP = Math.atan2(1.3, 0.5); // ≈ 69.0°
  const SPAN = TOP - BOTTOM;

  it("⭐⭐ a pitch of the WHOLE span is exactly one unit of `v`", () => {
    // ⛔ The definition, stated as its own vector: `v` is a FRACTION of the ring surface, so a
    // pitch equal to the surface's angular span must be 1.
    expect(pitchOffsetV(SPAN, BOTTOM, TOP)).toBeCloseTo(1, 12);
    expect(pitchOffsetV(SPAN / 2, BOTTOM, TOP)).toBeCloseTo(0.5, 12);
  });

  it("⚠ and a realistic 25° swing is a real but partial move across the rings", () => {
    // ⭐ The sanity check that the number is USEFUL, not merely well-defined: at the shipped
    // default the camera crosses about 40% of the ring surface at the peak of the swing.
    const v = pitchOffsetV((25 * Math.PI) / 180, BOTTOM, TOP);
    expect(v).toBeGreaterThan(0.3);
    expect(v).toBeLessThan(0.55);
  });

  it("⛔⛔ it is ZERO wherever the swing is zero — so both halves come home together", () => {
    // ⚠⚠ THE PROPERTY THAT KEEPS THE OWNER'S REQUIREMENT TRUE ON BOTH AXES. The yaw returns to
    // exactly 0 at the trigger and at contact; the pitch must vanish at the same instants or the
    // camera would come back at the right heading and the wrong height.
    expect(pitchOffsetV(0, BOTTOM, TOP)).toBe(0);
    expect(pitchOffsetV(swingYawRad(0, AMP, 1), BOTTOM, TOP)).toBe(0);
    expect(pitchOffsetV(swingYawRad(1, AMP, 1), BOTTOM, TOP)).toBe(0);
  });

  it("⭐ it carries the SIGN through — the camera leaves on a diagonal, not on two axes at odds", () => {
    expect(Math.sign(pitchOffsetV(0.3, BOTTOM, TOP))).toBe(1);
    expect(Math.sign(pitchOffsetV(-0.3, BOTTOM, TOP))).toBe(-1);
  });

  it("⛔⛔ DEGENERATE RINGS GIVE **NO** PITCH, never an improvised one", () => {
    // ⚠ Coincident rings mean the surface has no angular span, so no pitch is expressible.
    // ⛔ Dividing by it would be ±Infinity — which `orbitOffset` clamps to a RING, silently
    // slamming the camera to the top or bottom of the world at the first frame of an approach.
    // ⭐ `LESSONS_CARRIED` §6: a degenerate input returns nothing rather than a default.
    expect(pitchOffsetV(0.3, 0.5, 0.5)).toBe(0);
    expect(pitchOffsetV(0.3, 0.5, 0.5 + 1e-9)).toBe(0);
    expect(pitchOffsetV(0.3, NaN, TOP)).toBe(0);
    expect(pitchOffsetV(NaN, BOTTOM, TOP)).toBe(0);
  });
});

describe("⛔⛔⛔ THE AMPLITUDE IS **DIVIDED** BY THE FINGER'S SPEED", () => {
  // ⛔⛔ THE OWNER, 2026-09-19: *"I want to set the maximum approach swing with the slider, and
  // divide it by the speed of the delta position so that there is not a very big camera orbit
  // jump when the delta position is fast."*
  //
  // ⭐⭐⭐ AND THE ARITHMETIC SAYS WHY THAT IS THE RIGHT FORM. The lean is `θ = A·sin(πp)`, so
  // `dθ/dt = A·π·cos(πp)·dp/dt` and `dp/dt ∝ speed`. With a fixed `A` the camera's angular
  // velocity is proportional to how fast the hand moves — the *"very big jump"*, named exactly.
  // ⛔ `A ∝ 1/speed` cancels the term. The last vector here MEASURES that cancellation.
  // ⚠ The shipped defaults: the knee sits at `(1/0.0083)^1` ≈ 120 mm/s.
  const GAIN = 0.0083, EXP = 1;
  const REF = 1 / GAIN;
  const MAX = (25 * Math.PI) / 180;

  it("⭐⭐ at or below the reference speed the slider's value is what you get", () => {
    expect(swingAmplitudeRad(MAX, REF, GAIN, EXP)).toBeCloseTo(MAX, 12);
    expect(swingAmplitudeRad(MAX, 40, GAIN, EXP)).toBeCloseTo(MAX, 12);
    // ⚠ A STOPPED finger gets the MAXIMUM, which is the clamped limit of `ref/speed` — and is
    // what a hand that has stopped should see: the widest look at the join.
    expect(swingAmplitudeRad(MAX, 0, GAIN, EXP)).toBeCloseTo(MAX, 12);
  });

  it("⛔⛔ above it the swing SHRINKS — twice the speed, half the swing", () => {
    expect(swingAmplitudeRad(MAX, 2 * REF, GAIN, EXP)).toBeCloseTo(MAX / 2, 12);
    expect(swingAmplitudeRad(MAX, 4 * REF, GAIN, EXP)).toBeCloseTo(MAX / 4, 12);
    // ⚠ A FLICK reaches twenty times the reference (`sway.ts` measured it) and asks for almost
    // nothing — which is the owner's requirement at its extreme.
    expect(swingAmplitudeRad(MAX, 20 * REF, GAIN, EXP)).toBeLessThan(MAX / 15);
  });

  it("⛔⛔ the UPPER CLAMP is not decoration — `ref/speed` diverges as the hand slows", () => {
    // ⚠ Without it a nearly-still finger would ask for an unbounded lean: at 0.001 mm/s the
    // raw ratio is 120000, which is ~52000 radians of camera yaw.
    expect(swingAmplitudeRad(MAX, 0.001, GAIN, EXP)).toBeCloseTo(MAX, 12);
    expect(swingAmplitudeRad(MAX, -5, GAIN, EXP)).toBeCloseTo(MAX, 12);
  });

  it("⚠ a NEGATIVE or NaN gain or exponent gives NO swing rather than a full one", () => {
    // ⛔ An unconfigured law is not a reason to move the camera by an amount nobody chose, and
    // a NEGATIVE divisor would MIRROR the swing mid-approach rather than damp it.
    for (const bad of [-1, NaN]) expect(swingAmplitudeRad(MAX, 200, bad, EXP)).toBe(0);
    for (const bad of [-1, NaN]) expect(swingAmplitudeRad(MAX, 200, GAIN, bad)).toBe(0);
  });

  it("⭐⭐⭐ THE POINT OF IT ALL: the camera's angular RATE is the same at any hand speed", () => {
    // ⛔⛔ THE COMPOSITION, and the only vector that states the owner's actual GOAL rather than
    // the mechanism. ⚠ Two approaches over the same gap, one four times faster than the other:
    // the fast hand covers the gap in a quarter of the time, so a fixed amplitude would sweep
    // the camera four times as fast. ⭐ Measured here as degrees of camera per millimetre of gap
    // closed — which is what a hand actually experiences.
    const latch: SwingLatch = { gapAtTriggerM: 0.07, sign: 1, offsetAtTriggerM: 0.07, armTravelM: 0.004, armTravelUpM: 0 };
    const rateAt = (speed: number) => {
      const A = swingAmplitudeRad(MAX, speed, GAIN, EXP);
      const g1 = 0.05, g2 = 0.049;
      const d =
        swingYawRad(swingProgress(g2, latch), A, 1) - swingYawRad(swingProgress(g1, latch), A, 1);
      // ⚠ per unit TIME: the faster hand closes that same 1 mm in a quarter of the time.
      return (d * speed) / REF;
    };
    // ⛔ Rates within 1% of each other across a 4x spread of hand speed. With a fixed amplitude
    // they would differ by exactly 4x — which is the mutant this kills.
    const slow = rateAt(REF), fast = rateAt(4 * REF);
    expect(Math.abs(fast - slow) / Math.abs(slow)).toBeLessThan(0.01);
  });
});

describe("⛔⛔ THE EXPONENT — the owner's second dial", () => {
  const MAX = (25 * Math.PI) / 180;

  it("⛔⛔⛔ `exponent = 0` REMOVES THE SPEED DEPENDENCE — the A/B switch", () => {
    // ⭐ `speed ** 0` is 1 for every speed, so the divisor is just the gain. ⚠ With a gain at or
    // below 1 the clamp takes over and the swing is simply the slider's value at ANY speed —
    // which is the build the owner had before asking for the division, reachable by finger.
    for (const v of [0, 10, 120, 1200, 12000]) {
      expect(swingAmplitudeRad(MAX, v, 0.0083, 0)).toBeCloseTo(MAX, 12);
    }
  });

  it("⭐⭐⭐ THE EXPONENT CHANGES THE SHARPNESS AND **NOT** THE KNEE", () => {
    // ⛔⛔ THE DIVISOR IS `(gain × speed)^exponent`, GROUPED — and the ungrouped form
    // `gain × speed^exponent` was what shipped first, measured, and rejected:
    //
    //   its knee is `(1/gain)^(1/exponent)`, so at `gain = 0.0083` it falls from 120 mm/s to
    //   11 at `exp = 2` and 5 at `exp = 3`. Every real drag is then far past it and the swing
    //   **collapses to 1–3% of the slider** — the dial annihilated the effect instead of
    //   tuning it, and near that knee is where the noise amplification is steepest.
    //
    // ⭐ Grouped, the knee is `1/gain` for EVERY exponent: **gain chooses WHERE damping starts,
    // exponent chooses HOW SHARPLY it bites.** That is what *"so I can finetune"* asks for.
    const g = 1 / 120; // knee at 120 mm/s
    for (const e of [1, 2, 3]) {
      expect(swingAmplitudeRad(MAX, 60, g, e)).toBeCloseTo(MAX, 12);
      expect(swingAmplitudeRad(MAX, 120, g, e)).toBeCloseTo(MAX, 12);
    }
    // ⚠ Past the knee they separate — at twice it, 1/2, 1/4, 1/8.
    expect(swingAmplitudeRad(MAX, 240, g, 1)).toBeCloseTo(MAX / 2, 12);
    expect(swingAmplitudeRad(MAX, 240, g, 2)).toBeCloseTo(MAX / 4, 12);
    expect(swingAmplitudeRad(MAX, 240, g, 3)).toBeCloseTo(MAX / 8, 12);
  });

  it("⚠ a HIGHER gain moves the knee DOWN — damping starts at a slower hand", () => {
    // ⛔ The knee is `1/gain`. ⭐ Doubling the gain halves it, so a speed that sat exactly ON the
    // knee is now past it and already damped — by the divisor, exactly.
    expect(swingAmplitudeRad(MAX, 120, 1 / 120, 1)).toBeCloseTo(MAX, 12);
    expect(swingAmplitudeRad(MAX, 120, 2 / 120, 1)).toBeCloseTo(MAX / 2, 12);
    expect(swingAmplitudeRad(MAX, 120, 4 / 120, 1)).toBeCloseTo(MAX / 4, 12);
  });
});

describe("⛔⛔⛔ THE AMPLITUDE IS SMOOTHED — device-reported jitter, 2026-09-19", () => {
  // ⛔⛔ THE OWNER: *"when I increase the swing speed gain or the swing speed exponent, the orbit
  // of the camera becomes jittery: there seems to be steps in the orbit and it goes back and
  // forth … especially the swing speed exponent"* — and, crucially,
  // *"although the delta position movement is quite regular."*
  //
  // ⭐⭐⭐ THAT LAST SENTENCE IS THE DIAGNOSIS: a steady hand and a stepping camera means the
  // STEPS ARE IN THE ESTIMATOR. `terminalSpeedPxPerS` measures over whatever samples fall inside
  // a 40 ms window, so as the boundary crosses a sample the baseline jumps (32 ms ↔ 40 ms) and
  // the reading changes ±11% for an input with NO variation at all.
  const MAX = (25 * Math.PI) / 180;

  /** Steady-state peak-to-peak of the amplitude, as a fraction of the maximum swing. */
  const ripple = (gain: number, exp: number, tau: number): number => {
    const speedAt = (i: number) => 60 * (i % 2 === 0 ? 1 : 40 / 32);
    let prev = swingAmplitudeRad(MAX, speedAt(0), gain, exp);
    const tail: number[] = [];
    for (let i = 0; i < 400; i++) {
      prev = smoothAmplitude(prev, swingAmplitudeRad(MAX, speedAt(i), gain, exp), 16, tau);
      // ⚠ TAIL ONLY. The first probe measured the whole series and read the filter's own
      // TRANSIENT as ripple — my instrument, not the product, and it said 8.9% where the truth
      // was 1.1%. A settling filter has to be allowed to settle before it is judged.
      if (i > 300) tail.push(prev);
    }
    return (Math.max(...tail) - Math.min(...tail)) / MAX;
  };

  it("⭐⭐⭐ it removes the estimator's ripple — measured, ~15×", () => {
    expect(ripple(0.02, 1, 0)).toBeGreaterThan(0.15);
    expect(ripple(0.02, 1, 120)).toBeLessThan(0.02);
    // ⚠ And harder where the owner said it was worst — a higher exponent amplifies the
    // estimator's RELATIVE wobble by that exponent: `dA/A = −n · dspeed/speed`.
    expect(ripple(0.02, 2, 0)).toBeGreaterThan(0.2);
    expect(ripple(0.02, 2, 120)).toBeLessThan(0.02);
  });

  it("⛔⛔ BELOW THE KNEE there was never any ripple — which is why the defaults felt fine", () => {
    // ⭐ The clamp holds the amplitude at the slider's value, so speed noise does nothing at all.
    // ⚠ Worth pinning: it explains why the report only appeared once a dial was RAISED.
    expect(ripple(1 / 120, 1, 0)).toBeCloseTo(0, 6);
    expect(ripple(1 / 120, 3, 0)).toBeCloseTo(0, 6);
  });

  it("⛔⛔⛔ AND SMOOTHING CANNOT MOVE THE ENDPOINTS — which is why it is safe", () => {
    // ⭐ `θ = A·sin(πp)` is exactly zero at `p = 0` and `p = 1` for ANY `A`, so no amount of
    // lag can leave the camera off its orbit at the trigger or at contact. ⚠ That is the owner's
    // one hard requirement, and it survives by construction rather than by care.
    for (const A of [0, MAX, MAX / 3, 1e-9, 12345]) {
      expect(swingYawRad(0, A, 1)).toBe(0);
      expect(swingYawRad(1, A, 1)).toBe(0);
    }
  });

  it("⚠ it is FRAME-RATE INDEPENDENT — the same lag at 60 fps and at 120", () => {
    // ⛔ `1 − e^(−dt/τ)`, never a fixed per-frame fraction: a fixed fraction would smooth twice
    // as hard at 120 fps, which is the shape that makes a gesture feel different on two devices
    // for no reason anyone can see.
    const after = (dt: number, steps: number) => {
      let v = 0;
      for (let i = 0; i < steps; i++) v = smoothAmplitude(v, 1, dt, 120);
      return v;
    };
    expect(after(16, 15)).toBeCloseTo(after(8, 30), 3);
    expect(after(16, 15)).toBeCloseTo(after(4, 60), 3);
  });

  it("⚠ degenerate inputs hold rather than lurch", () => {
    expect(smoothAmplitude(0.5, 0.9, 0, 120)).toBe(0.5);
    expect(smoothAmplitude(0.5, 0.9, -8, 120)).toBe(0.5);
    expect(smoothAmplitude(0.5, 0.9, NaN, 120)).toBe(0.5);
    expect(smoothAmplitude(NaN, 0.9, 16, 120)).toBe(0.9);
    expect(smoothAmplitude(0.5, NaN, 16, 120)).toBe(0.5);
    // ⛔ τ = 0 is a legitimate request for NO smoothing, and the honest reading is *follow
    // exactly* — not *never move*, which a naive guard would produce.
    expect(smoothAmplitude(0.5, 0.9, 16, 0)).toBe(0.9);
  });
});

describe("⛔⛔⛔ THE SWING FREEZES WHEN NO TRANSLATION DRIVES IT — device-reported, 2026-09-19", () => {
  // ⛔⛔ THE OWNER: *"when the follower is orange and the mode is rotation and pioneer and
  // follower objects are within the offset radius, a rotation of the pioneer controls the
  // rotation of the follower (which is normal) but also controls the camera to orbit which is
  // not wanted."*
  //
  // ⭐⭐⭐ THE CAUSE: `p` is a function of the SURFACE GAP, and turning two boxes moves their
  // closest points — so `gapBetween` changes and the swing advances although **nothing
  // approached**. ⚠ In `FOLLOW` both bodies turn, which is why the report names orange. The
  // owner's spec is explicit that the swing accompanies *"the translation of the Follower"*.

  it("⭐⭐⭐ re-basing makes a resumed swing EXACTLY continuous — the same angle, new geometry", () => {
    // ⚠ Freezing alone is not enough: while frozen a rotation may move the gap a long way, so
    // the first frame of the resumed drag would JUMP the camera. ⛔ `g0' = gap/(1−p)` is the `g0`
    // that makes the NEW gap mean the progress already on screen.
    const before: SwingLatch = { gapAtTriggerM: 0.07, sign: 1, offsetAtTriggerM: 0.07, armTravelM: 0.004, armTravelUpM: 0 };
    const pHeld = swingProgress(0.042, before); // 40% of the way in
    expect(pHeld).toBeCloseTo(0.4, 12);
    // ⚠ A rotation now moves the gap from 42 mm to 55 mm without anything approaching.
    const g0 = rebaseTriggerGap(0.055, pHeld)!;
    const after: SwingLatch = { ...before, gapAtTriggerM: g0 };
    // ✅ The resumed progress is the frozen one, so the camera does not move as the drag resumes.
    expect(swingProgress(0.055, after)).toBeCloseTo(pHeld, 12);
    expect(swingYawRad(swingProgress(0.055, after), AMP, 1)).toBeCloseTo(
      swingYawRad(pHeld, AMP, 1),
      12,
    );
  });

  it("⛔⛔ AND RE-BASING FROM THE **LIVE** GAP IS THE IDENTITY — the way this fix first failed", () => {
    // ⚠⚠ `p = (g0−gap)/g0`, so `gap/(1−p) = gap·g0/gap = g0` — exactly what you started with.
    // ⛔ The first build recomputed the progress from the live gap each frame, so the re-base
    // did **nothing at all** and the jump remained. ⭐ The frozen progress has to be captured
    // ONCE, on the frame the translation stopped. Pinned so it cannot be re-introduced.
    const latch: SwingLatch = { gapAtTriggerM: 0.07, sign: 1, offsetAtTriggerM: 0.07, armTravelM: 0.004, armTravelUpM: 0 };
    for (const gap of [0.06, 0.042, 0.01]) {
      expect(rebaseTriggerGap(gap, swingProgress(gap, latch))).toBeCloseTo(latch.gapAtTriggerM, 12);
    }
  });

  it("⚠ a completed or impossible approach refuses to re-base rather than improvising", () => {
    // ⛔ `p ≥ 1` has no solution — no `g0` makes a positive gap read as finished. ⭐ `null`, and
    // the caller keeps the latch it has: a swing that has arrived stays arrived.
    expect(rebaseTriggerGap(0.05, 1)).toBeNull();
    expect(rebaseTriggerGap(0.05, 1.2)).toBeNull();
    expect(rebaseTriggerGap(0.05, -0.1)).toBeNull();
    // ⚠ And a gap of zero is contact: there is nothing left to re-base against.
    expect(rebaseTriggerGap(0, 0.4)).toBeNull();
    expect(rebaseTriggerGap(NaN, 0.4)).toBeNull();
    expect(rebaseTriggerGap(0.05, NaN)).toBeNull();
  });

  it("⭐ a progress of ZERO re-bases to the gap itself — the approach starts here", () => {
    // ⛔ `g0' = gap/(1−0) = gap`, which is exactly what arming at this instant would have done.
    expect(rebaseTriggerGap(0.05, 0)).toBeCloseTo(0.05, 12);
  });
});

describe("⛔⛔ THE TWO DECISIONS THAT WERE HIDING IN `scene.ts`", () => {
  // ⚠⚠ BOTH OF THESE EXIST BECAUSE MUTANTS SURVIVED. They were a `.find()` and an `if` in the
  // render file, and reinstating the reported defect in either left the WHOLE suite green.
  // ⭐ *A rule in a render file is a rule nothing can interrogate* — the fourth time in one day.

  it("⭐⭐⭐ only a TRANSLATING grip drives the swing — a rotation drives nothing", () => {
    // ⛔ THE REPORTED DEFECT, as a vector: with the mode test gone, a rotating grip would drive
    // the swing and a turn of the Pioneer would orbit the camera.
    expect(swingDriverIndex(["ROTATE"])).toBe(-1);
    expect(swingDriverIndex(["ROTATE", "ROTATE"])).toBe(-1);
    expect(swingDriverIndex(["TRANSLATE"])).toBe(0);
    // ⚠ The translating grip is found wherever it sits — press order is not role order.
    expect(swingDriverIndex(["ROTATE", "TRANSLATE"])).toBe(1);
    expect(swingDriverIndex(["DEPTH", null, "TRANSLATE"])).toBe(2);
  });

  it("⚠ nothing held, or nothing with a mode yet, drives nothing", () => {
    expect(swingDriverIndex([])).toBe(-1);
    expect(swingDriverIndex([null, null])).toBe(-1);
  });

  it("⛔⛔⛔ the frozen progress is captured ONCE — the whole of the re-base depends on it", () => {
    // ⚠⚠ Recomputing it every frame makes `rebaseTriggerGap` the IDENTITY, so the fix does
    // nothing and the camera still jumps when the drag resumes. ⛔ It failed silently once: the
    // code looked right, the suite was green, and the arithmetic quietly cancelled.
    let held: number | null = null;
    held = freezeProgress(held, 0.4, false); // the frame the translation stopped
    expect(held).toBeCloseTo(0.4, 12);
    // ✅ Later frames do NOT overwrite it, however far a rotation moves the geometry.
    for (const live of [0.1, 0.55, 0.9]) held = freezeProgress(held, live, false);
    expect(held).toBeCloseTo(0.4, 12);
  });

  it("⭐ and it is cleared the moment a translation drives again", () => {
    // ⛔ Otherwise the next pause would re-base against a progress from the previous one.
    expect(freezeProgress(0.4, 0.9, true)).toBeNull();
    expect(freezeProgress(null, 0.9, true)).toBeNull();
  });
});

describe("⛔⛔⛔ THE ENDING — what a camera the GAME moved owes a live gesture", () => {
  // ⛔ THE OWNER, 2026-09-20: *"if the camera has significantly orbited already when the
  // follower exits the offset radius, the delta position axis ends up being quite off vs the
  // camera axis and therefore the user feels a disconnect between the touch input axis and the
  // follower translation axis."*
  //
  // ⭐⭐ `A7`'s basis is latched at the PRESS against the **hand's** orbit, deliberately. The
  // swing is the **game's** orbit, and `absorb` is the instant that displacement stops being
  // temporary — so that is the instant the latch stops protecting anything.
  const BOTTOM = Math.atan2(0.2, 1.4);
  const TOP = Math.atan2(1.3, 0.5);

  it("⭐⭐⭐ a NO-OP ending owes nothing — no absorb, and the latched basis STAYS", () => {
    // ⛔ At contact and on a clean separation the lean is exactly zero, the camera is on its own
    // orbit, and the press-time basis is still correct. ⚠ Re-deriving there would throw away a
    // latch that is doing its job — and it would do it on EVERY capture drop, which is the
    // common case.
    expect(endApproach(0, BOTTOM, TOP)).toEqual({ yawRad: 0, vOffset: 0, rebaseFrames: false });
  });

  it("⛔⛔ an ending that LEANS absorbs both halves and re-bases the frames", () => {
    const e = endApproach(0.3, BOTTOM, TOP);
    expect(e.yawRad).toBeCloseTo(0.3, 12);
    expect(e.rebaseFrames).toBe(true);
    // ⭐⭐ THE COMPOSITION IS ASSERTED, NOT ASSUMED — `scene.ts` used to build this inline at the
    // call site, and every rule this trial wrote in the render file became a mutant the suite
    // could not see. ⚠ `METHOD`: a composition is a thing to MEASURE.
    expect(e.vOffset).toBeCloseTo(pitchOffsetV(pitchAngleFor(0.3), BOTTOM, TOP), 12);
    expect(e.vOffset).toBeGreaterThan(0);
  });

  it("⭐ and the ending's PITCH does not mirror either — a left lean absorbs UP too", () => {
    // ⚠ The same fact as `pitchAngleFor`, asserted where it is SPENT: an ending that absorbed a
    // mirrored elevation would leave `+x` and `−x` approaches on opposite sides of the scene
    // for good, not just during the lean.
    expect(endApproach(-0.3, BOTTOM, TOP).vOffset).toBeCloseTo(
      endApproach(0.3, BOTTOM, TOP).vOffset,
      12,
    );
    expect(endApproach(-0.3, BOTTOM, TOP).yawRad).toBeCloseTo(-0.3, 12);
  });

  it("⚠ a non-finite lean absorbs NOTHING and re-bases nothing", () => {
    // ⛔ `LESSONS_CARRIED` §6 — a degenerate input is refused, never improvised. Absorbing a NaN
    // would poison the orbit's own yaw, which nothing downstream could recover from.
    expect(endApproach(Number.NaN, BOTTOM, TOP)).toEqual({
      yawRad: 0,
      vOffset: 0,
      rebaseFrames: false,
    });
  });

  it("⛔ degenerate rings give NO elevation, and the yaw is still absorbed", () => {
    // ⚠ `pitchOffsetV` answers 0 when the rings have no span — no angle is expressible — and the
    // ending must not turn that into a refusal of the YAW, which is unaffected by the rings.
    const e = endApproach(0.3, TOP, TOP);
    expect(e.vOffset).toBe(0);
    expect(e.yawRad).toBeCloseTo(0.3, 12);
    expect(e.rebaseFrames).toBe(true);
  });
});

describe("⛔⛔⛔ AN APPROACH ALONG GRAVITY ARMS THE SWING — the 2026-09-23 device report", () => {
  /**
   * ⚠⚠ *"When the object approaches another one from the gravity axis, sometimes there is no swing
   * of the camera when the object enters the offset radius zone."*
   *
   * ⛔⛔ **THE RULE WAS NEVER WRONG — IT WAS NEVER FED.** `swingSignFor` has always answered `1`
   * for a purely vertical travel; the scene accumulated the travel in the HOLDER's branch only,
   * and since `D75` a gravity-axis push is the SECOND touchpoint's channel, which added nothing.
   * ⭐ So the arming call was `swingSignFor(0, 0)` — `null`, no swing — and *"sometimes"* was
   * exactly the frames where the holder happened to be still.
   *
   * ⚠ These vectors compose the chain the scene threads: a gravity-channel displacement,
   * projected onto the gravity frame, must produce travel the swing can take a sign from.
   * ⛔ What they cannot prove is that `scene.ts` threads it — that is now structural, one
   * function applying the step AND recording it, because the missing line was the symptom and
   * two writers were the cause.
   */
  const FOV = 0.8;
  const H = 800;
  const PER_PX = trackingMetresPerPx(1.5, FOV, H);
  const camera = (elevationDeg: number) => {
    const e = (elevationDeg * Math.PI) / 180;
    const view: Vec3 = [Math.cos(e), -Math.sin(e), 0];
    const g = gravityFrame(view, [0, -1, 0])!;
    const right = g.right;
    const up = normalize([
      view[1] * right[2] - view[2] * right[1],
      view[2] * right[0] - view[0] * right[2],
      view[0] * right[1] - view[1] * right[0],
    ])!;
    return { gravity: g, screen: { right, up } };
  };

  it("⭐⭐⭐ a SECOND-touchpoint push along gravity produces up-travel, and the swing takes a sign", () => {
    const c = camera(30);
    const axes = axesFromFrame(c.gravity);
    // ⛔ The gravity channel ONLY — no holder motion at all, which is the reported gesture.
    const travel = axisTravel(
      { holderDxPx: 0, holderDyPx: 0, secondDyPx: -40 },
      c.screen,
      axes,
      PER_PX,
      1,
      1,
      "PLANE",
      5,
      c.gravity.towardGravity,
    );
    const step = axisDisplacement(travel, axes);
    // ⭐ What the scene now accumulates: the applied displacement projected onto the gravity frame.
    const travelRight = dot(step, c.gravity.right);
    const travelUp = dot(step, c.gravity.up);
    expect(Math.abs(travelUp)).toBeGreaterThan(1e-6);
    // ⚠ And the horizontal component really is ~zero, so this fixture is the degenerate case the
    // report describes rather than one that arms by accident.
    expect(Math.abs(travelRight)).toBeLessThan(1e-9);
    // ⛔⛔ THE CLAIM: a vertical approach arms.
    expect(swingSignFor(travelRight, travelUp)).not.toBeNull();
  });

  it("⛔ and with NOTHING accumulated it does not arm — the state the defect left behind", () => {
    // ⭐ The counter-example, which is what the product did until 2026-09-23: the holder's branch
    // fed the accumulator and the gravity channel did not, so the arming call saw zero.
    expect(swingSignFor(0, 0)).toBeNull();
  });
});
