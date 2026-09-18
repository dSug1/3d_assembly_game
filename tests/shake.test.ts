/**
 * THE EVICTION SHAKE — §2 rule 2septies as amended (`AMENDMENTS_R5.md` A4, `D15`).
 *
 * ⛔⛔ THE TWO VECTORS THAT MATTER ARE THE ONES THAT MUST **NOT** FIRE, and they are
 * written first for that reason:
 *
 *   1. **A CIRCLE.** `A3`/`D14` made roll a legitimate control on exactly the objects
 *      eviction applies to — and a circle projects to a back-and-forth on EVERY axis. A
 *      reversal counter alone fires on it. *Spinning a part to look at it must not
 *      destroy the alignment the user set.*
 *   2. **A CORRECTIVE NUDGE.** "Left a bit, right a bit" during fine positioning is a
 *      genuine back-and-forth, and it is the accident this gesture is most exposed to.
 *
 * ⭐ Fixtures are stepped with INTEGERS. Mistake shape 5 — *my own fixtures* — cost four
 * false alarms in one session, one of them a float loop taking an extra step.
 */
import { describe, expect, it } from "vitest";
import { ShakeDetector, shakeParamsFrom, type ShakeParams } from "../src/input/shake";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import type { Sample } from "../src/input/motion";
import { mmToPx } from "../src/core/units";

const NOISE_MM = 0.761; // ⭐ MEASURED, 2026-09-14. Not a placeholder.

const PARAMS: ShakeParams = {
  reversals: 2,
  windowMs: 600,
  legMm: 8,
  straightness: 0.4,
};

/**
 * ⭐⭐⭐ **THE NUMBERS THE PRODUCT ACTUALLY SHIPS** — `legMm` 6, `windowMs` 300,
 * `straightness` 0.45, against the MEASURED `pointerNoiseMm`.
 *
 * ⛔⛔ AN AUDIT FOUND THAT NOT ONE VECTOR IN THIS FILE RAN AGAINST THEM. Every fixture
 * above uses the local `PARAMS` (8 / 600 / 0.4), which is a *different detector tuning* —
 * so the whole suite could stay green while the shipped `evictShake*` values drifted to
 * anything at all. ⭐ That is mistake shape 5 in its purest form — *my own fixtures* —
 * with the twist that the fixture was not merely idealised, it was **measuring a config
 * nobody runs**. ⚠ The local `PARAMS` are KEPT (a detector must be right at more than one
 * tuning, and the vectors above are honest about that tuning) and the shipped set is now
 * exercised alongside them, at the bottom of the file.
 */
const SHIPPED: ShakeParams = shakeParamsFrom(DEFAULT_CONFIG);
const SHIPPED_NOISE_MM = DEFAULT_CONFIG.pointerNoiseMm;

/** Feed a whole path and return the first verdict, or null. */
function run(path: readonly Sample[], params: ShakeParams = PARAMS, noise = NOISE_MM) {
  const d = new ShakeDetector(params, noise);
  for (const s of path) {
    const v = d.push(s);
    if (v) return { verdict: v, detector: d };
  }
  return { verdict: null, detector: d };
}

/**
 * A straight run in millimetres, from `fromMm` to `toMm` along a direction, sampled every
 * `stepMs`. ⚠ Integer steps: the count is computed, never accumulated by adding floats.
 */
function leg(
  fromMm: number,
  toMm: number,
  steps: number,
  t0: number,
  stepMs: number,
  dir: readonly [number, number] = [1, 0],
): Sample[] {
  const out: Sample[] = [];
  for (let i = 1; i <= steps; i++) {
    const mm = fromMm + ((toMm - fromMm) * i) / steps;
    out.push({ x: mmToPx(mm * dir[0]), y: mmToPx(mm * dir[1]), t: t0 + i * stepMs });
  }
  return out;
}

/**
 * ⭐⭐⭐ **A BACK-AND-FORTH THAT BOWS** — three legs of `alongMm` along +x, each one
 * arcing `bowMm` off the axis in y and returning to it: `y = bow · sin(π x / along)`.
 *
 * ⭐ WHY THIS EXACT SHAPE, AND NOT AN EASIER ONE. The detector derives its axis from the
 * **principal eigenvector of the windowed covariance**, so a fixture only isolates
 * straightness if it leaves that axis alone. Two properties of this path do that, and both
 * were computed before the fixture was written rather than discovered by tuning:
 *
 *   1. `cov(x, y) = 0` **exactly** — the legs sweep x uniformly over `[0, along]` and
 *      `E[x·sin(πx/along)] = E[x]·E[sin(πx/along)]` on that interval. So the principal axis
 *      is +x or +y, never a diagonal, and the along-amplitude is exactly `alongMm`.
 *   2. `var(y) = bow²(½ − 4/π²) ≈ 0.095·bow²` stays under `var(x) = along²/12`, so the
 *      axis stays **x**. ⚠ It flips at `bow ≳ 0.9·along`, and then amplitude and
 *      perpendicular excursion swap meaning — which is why nothing here bows past 17 mm
 *      on a 20 mm leg.
 *
 * ⭐ The perpendicular excursion the detector will measure is therefore
 * `maxPerp = bow · (2/π) ≈ 0.637·bow` — the distance from the mean `ȳ = 2·bow/π` down to
 * the endpoints at `y = 0`, which is larger than the distance up to the crest. ⛔ So the
 * straightness ratio is `0.637·bow / along`, a number this file can put either side of the
 * bound ON PURPOSE, which is the whole point of the helper.
 */
function bowedShake(alongMm: number, bowMm: number, perLeg: number, stepMs = 8): Sample[] {
  const out: Sample[] = [{ x: 0, y: 0, t: 0 }];
  let t = 0;
  for (const [from, to] of [
    [0, alongMm],
    [alongMm, 0],
    [0, alongMm],
  ] as const) {
    for (let i = 1; i <= perLeg; i++) {
      const along = from + ((to - from) * i) / perLeg;
      t += stepMs;
      out.push({ x: mmToPx(along), y: mmToPx(bowMm * Math.sin((Math.PI * along) / alongMm)), t });
    }
  }
  return out;
}

/** out → back → out, each leg `ampMm` long. The canonical shake. */
function shakePath(ampMm: number, stepMs = 8, dir: readonly [number, number] = [1, 0]): Sample[] {
  return [
    { x: 0, y: 0, t: 0 },
    ...leg(0, ampMm, 10, 0, stepMs, dir),
    ...leg(ampMm, -ampMm, 20, 10 * stepMs, stepMs, dir),
    ...leg(-ampMm, ampMm, 20, 30 * stepMs, stepMs, dir),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// ⛔ THE COUNTER-EXAMPLES FIRST — a detector that cannot refuse is not a detector.
// ══════════════════════════════════════════════════════════════════════════════

describe("⛔ what must NOT be a shake", () => {
  it("⛔⛔ A CIRCLE does not evict — it oscillates on every axis, and roll is now legal", () => {
    // 40 mm diameter, two full turns, 8 ms apart: exactly what rolling an anchored
    // object looks like after `D14`.
    // ⚠⚠ **WHAT REFUSES IT IS NOT STRAIGHTNESS**, and the header of `shake.ts` reads as
    // though it were. An EXACT circle over whole turns has an **isotropic** covariance —
    // `sxx = syy`, `sxy = 0` — so `read` finds no eigenvector at all and returns `null`
    // before any ratio is computed (`shake.ts`, the `len > 1e-12` branch). ⭐ The outcome
    // is right and the ATTRIBUTION was wrong, which is why deleting the straightness test
    // left this vector green. ⛔ The pair at the bottom of this block is the one that
    // actually holds the straightness guard down; this one holds the isotropy branch down.
    // ⭐ `METHOD`: *when one vector is green for two different reasons, it is guarding one
    // of them and merely accompanying the other.*
    const path: Sample[] = [];
    const steps = 96;
    for (let i = 0; i <= steps * 2; i++) {
      const a = (2 * Math.PI * i) / steps;
      path.push({ x: mmToPx(20 * Math.cos(a) - 20), y: mmToPx(20 * Math.sin(a)), t: i * 8 });
    }
    expect(run(path).verdict).toBeNull();
  });

  it("⛔ A CORRECTIVE NUDGE does not evict — the legs are below `legMm`", () => {
    // ±3 mm, well under the 8 mm leg: the "left a bit, right a bit" of fine positioning.
    expect(run(shakePath(3)).verdict).toBeNull();
  });

  it("⛔ A SINGLE STROKE does not evict — there is nothing to reverse from", () => {
    const path = [{ x: 0, y: 0, t: 0 }, ...leg(0, 40, 20, 0, 8)];
    expect(run(path).verdict).toBeNull();
  });

  it("⛔ ONE reversal is not enough — `reversals` is 2", () => {
    const path = [{ x: 0, y: 0, t: 0 }, ...leg(0, 20, 10, 0, 8), ...leg(20, -20, 20, 80, 8)];
    const { verdict, detector } = run(path);
    expect(verdict).toBeNull();
    expect(detector.sawReversal).toBe(true);
    // ⛔ ...and the flick guard is NOT armed by it — see the guard's own suite below.
    expect(detector.suppressesFlick).toBe(false);
  });

  it("⛔ A SLOW fidget does not evict — the reversals fall outside one window", () => {
    // Same shape, but each leg takes 500 ms, so no two reversals share a 600 ms window.
    expect(run(shakePath(20, 50)).verdict).toBeNull();
  });

  it("⛔⛔ A FINGER HELD STILL fires nothing over 10 s of measured jitter", () => {
    // ⭐ The exact failure `sway.ts` was built around: a still finger once produced 272
    // false kicks in 3 s from per-sample directions.
    const path: Sample[] = [];
    let seed = 12345;
    for (let i = 0; i <= 1250; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const a = (seed / 0x7fffffff) * 2 * Math.PI;
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const r = (seed / 0x7fffffff) * NOISE_MM;
      path.push({ x: mmToPx(r * Math.cos(a)), y: mmToPx(r * Math.sin(a)), t: i * 8 });
    }
    expect(run(path).verdict).toBeNull();
  });

  it("⛔ A BOWED back-and-forth is refused — straightness is part of the definition", () => {
    // ⛔⛔⛔ **THIS VECTOR COULD NOT FAIL UNTIL 2026-09-17, AND THE TRAP IS WORTH MORE THAN
    // THE ASSERTION.** It is kept in place, repaired, rather than quietly replaced.
    //
    // ⚠ THE OLD FIXTURE: three legs of 40 mm, each bowing 20 mm — and each leg sampled 60
    // times at 8 ms, so **one leg took 480 ms inside a 600 ms window**. No trailing
    // sub-window ever held three legs, so no reading ever reached two reversals, and the
    // path was refused by the REVERSAL COUNT before straightness was consulted at all.
    // Deleting the straightness test from `shake.ts` left this vector — and the whole file
    // — green. ⭐ Mistake shape 5 with a sting: the fixture LOOKED like the thing it named,
    // and its name is what stopped anyone reading the timing.
    //
    // ⭐⭐ THE REPAIR IS A FIXTURE WHOSE TIMING FITS: three 160 ms legs, 480 ms end to end,
    // comfortably inside the 600 ms window, so two reversals are genuinely available and
    // **straightness is the only thing left that can refuse it**. The next vector proves
    // that claim instead of asserting it.
    //
    // ⭐ 15 mm of bow on a 20 mm leg ⇒ `maxPerp = 9.37 mm` at 20 samples a leg (the
    // continuum value is `0.637 × 15 = 9.55`; discrete sampling misses the crest) against an
    // amplitude of 20 mm — a ratio of **0.469**, the wrong side of `straightness` 0.4.
    expect(run(bowedShake(20, 15, 20)).verdict).toBeNull();
  });

  it("⭐⭐ ...and STRAIGHTNESS is the ONLY reason — relax that one number and it fires", () => {
    // ⛔⛔ `METHOD`: *a guard is only proven by a specimen that nothing else refuses.* The
    // vector above says "null"; a null can come from six places in `read` — too few
    // reversals, an amplitude under the noise floor, an isotropic covariance, a window
    // shorter than three samples. ⭐ So the SAME path is fed a second time with nothing
    // changed but `straightness`, and it must fire. That pins the refusal on the one test
    // this fixture exists for, and it is what makes deleting the guard turn this file red.
    const bowed = bowedShake(20, 15, 20);
    expect(run(bowed, PARAMS).verdict).toBeNull();
    expect(run(bowed, { ...PARAMS, straightness: 0.9 }).verdict).not.toBeNull();
  });

  it("✅ THE NEAR-TWIN, bowed just UNDER the bound, still evicts", () => {
    // ⭐ The other half of the pair, and the half that keeps the guard from being sized as
    // "refuse everything": the identical path with 12 mm of bow instead of 15 gives
    // `maxPerp = 7.50 mm` on a 20 mm amplitude — a ratio of **0.375**, just inside 0.4.
    // ⛔ A hand does not shake in a straight line, and a straightness test tight enough to
    // refuse an ordinary human back-and-forth would make eviction unreachable — which is
    // the failure mode nobody reports, because it looks like "I must have done it wrong".
    const { verdict } = run(bowedShake(20, 12, 20));
    expect(verdict).not.toBeNull();
    expect(verdict!.reversals).toBeGreaterThanOrEqual(2);
    // ⚠ And the axis really is x, so the amplitude is the along-axis one and not a
    // diagonal's: 20 mm peak to peak. If this ever reads ~15 mm the eigenvector flipped and
    // the pair above stopped measuring straightness. See `bowedShake`'s header.
    expect(verdict!.amplitudeMm).toBeCloseTo(20, 1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════

describe("✅ what IS a shake", () => {
  it("out → back → out, 20 mm legs, fires", () => {
    const { verdict } = run(shakePath(20));
    expect(verdict).not.toBeNull();
    expect(verdict!.reversals).toBeGreaterThanOrEqual(2);
  });

  it("⭐ fires in ANY direction — the axis comes from the user's first leg", () => {
    for (const dir of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0.6, -0.8],
    ] as const) {
      expect(run(shakePath(20, 8, dir)).verdict, `direction ${dir}`).not.toBeNull();
    }
  });

  it("reports an amplitude that matches the path it was given", () => {
    const { verdict } = run(shakePath(20));
    // Peak to peak is 40 mm: +20 out, −20 back.
    expect(verdict!.amplitudeMm).toBeCloseTo(40, 1);
  });

  it("⛔ fires only ONCE — eviction is destructive and must not re-arm mid-gesture", () => {
    const d = new ShakeDetector(PARAMS, NOISE_MM);
    let fires = 0;
    // Six legs: enough for two separate shakes if it re-armed.
    const path = [
      ...shakePath(20),
      ...leg(20, -20, 20, 400, 8),
      ...leg(-20, 20, 20, 560, 8),
    ];
    for (const s of path) if (d.push(s)) fires++;
    expect(fires).toBe(1);
  });

  it("⭐ a LONG leg is one leg, not a sequence of them — the extremum follows the finger", () => {
    // 60 mm out (7.5 × `legMm`), then back, then out. Still exactly two reversals.
    const { verdict } = run(shakePath(60));
    expect(verdict).not.toBeNull();
    expect(verdict!.reversals).toBe(2);
  });
});

describe("the flick guard — ⛔ the one thing `IN3` must not forget", () => {
  it("`suppressesFlick` is FALSE before any reversal", () => {
    const d = new ShakeDetector(PARAMS, NOISE_MM);
    for (const s of [{ x: 0, y: 0, t: 0 }, ...leg(0, 40, 20, 0, 8)]) d.push(s);
    expect(d.suppressesFlick).toBe(false);
  });

  it("⛔⛔ ONE REVERSAL DOES **NOT** ARM IT — retracted by a device report, `D33`", () => {
    // ⛔⛔⛔ THIS VECTOR ASSERTED THE OPPOSITE FOR ONE HOUR, and the retraction is the
    // record. It read: *"it must arm on the reversal, NOT at the completed shake — a user
    // who abandons a shake mid-way releases at speed, and that release must not run the
    // flick test."* ⭐ The argument was sound and the SIZE was wrong: *"the flick should be
    // triggerable during an ongoing rotation"* (device, 2026-09-16), and a hand that turns
    // an object and then flicks a face **reverses** — so a one-reversal skip suppresses the
    // gesture `IN3` is for.
    // ⭐⭐ WHY IT LOOKED FREE WHEN A4 ASKED FOR IT: a flick was then read over the whole
    // motion window, where the two legs of a reversal CANCEL and no flick was detectable
    // anyway. `D33` made the flick read its TAIL, and the guard's cost appeared with it.
    // ⚠ The remaining exposure is stated in `shake.ts` and `D33`: an abandoned shake can
    // end in a flick. It is reversible; suppressing every post-reversal flick was not.
    const d = new ShakeDetector(PARAMS, NOISE_MM);
    const path = [{ x: 0, y: 0, t: 0 }, ...leg(0, 20, 10, 0, 8), ...leg(20, -20, 20, 80, 8)];
    for (const s of path) d.push(s);
    expect(d.sawReversal).toBe(true);
    expect(d.suppressesFlick).toBe(false);
  });

  it("✅ it arms when the shake FIRES — the case with a concrete harm", () => {
    // ⭐ The harm is specific: the hand has just cleared its alignments, and a flick at the
    // release would push a new one — undoing the escape with the gesture that made it.
    const d = new ShakeDetector(PARAMS, NOISE_MM);
    let firedAt = -1;
    const path = shakePath(20);
    path.forEach((s, i) => {
      if (d.push(s) !== null && firedAt < 0) firedAt = i;
    });
    expect(firedAt).toBeGreaterThan(0);
    expect(d.suppressesFlick).toBe(true);
    // ⛔ AND IT STAYS ARMED for the rest of the gesture: the detector fires at most once,
    // so a second release-time question must not get a different answer.
    for (const s of leg(0, 40, 10, path[path.length - 1]!.t, 8)) d.push(s);
    expect(d.suppressesFlick).toBe(true);
  });
});

describe("the noise floor is a parameter, not an assumption", () => {
  it("⛔ a noisier device refuses a shake whose AMPLITUDE does not clear the noise", () => {
    // ⭐ `pointerNoiseMm` is a property of the GLASS and is passed in, as `sway.ts` takes it.
    // ⛔⛔ WHAT IT GATES MOVED WHEN THE DETECTOR BECAME A WINDOWED READING (2026-09-16): it
    // used to gate *claiming the axis from the first leg*, and now gates the **windowed
    // amplitude**, because there is no first leg any more — the axis is the windowed path's
    // principal one, re-derived every sample.
    // ⚠⚠ AND THE OLD FIXTURE USED A CONFIG THE PRODUCT REFUSES: noise 8 mm against
    // `legMm` 8 mm, where `validateGestureConfig` demands `legMm >= 3×` the noise — so it
    // proved the floor on a specimen that cannot occur. Mistake shape 5, kept on the record.
    const path = [{ x: 0, y: 0, t: 0 }, ...leg(0, 20, 10, 0, 8), ...leg(20, -20, 20, 80, 8), ...leg(-20, 20, 20, 240, 8)];
    expect(run(path, PARAMS, 0.1).verdict).not.toBeNull();
    // 40 mm of amplitude against a 15 mm noise floor: 3× is 45 mm, so it must refuse.
    expect(run(path, PARAMS, 15).verdict).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ A SHAKE MAY START AT ANY MOMENT — the device report, 2026-09-16
// ═════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ A SHAKE AFTER A LONG DRAG — *\"only if the shake immediately follows\"*", () => {
  it("⭐⭐⭐ a hand that drags somewhere and THEN shakes evicts — the reported defect", () => {
    // > *"currently, your shake movement is triggered only if the touchpoint is pressed and
    // > the shake immediately follows. Modify so the shake can occur at anytime during a
    // > movement."*
    //
    // ⛔⛔ THE CAUSE WAS THE BASELINE, NOT A THRESHOLD. The first build claimed its axis ONCE,
    // from the gesture's first leg, and then tracked headings, amplitude and perpendicular
    // excursion against that stale origin for as long as the finger stayed down.
    // ⭐ The fixture is the reported gesture: a long drag DOWN, then a shake left-and-right.
    // ⚠ The drag is deliberately perpendicular to the shake — the worst case for a stale
    // axis, and the one a hand makes when it moves a part and then changes its mind.
    const drag: Sample[] = [];
    for (let k = 1; k <= 60; k++) drag.push({ x: 0, y: mmToPx(k), t: k * 8 });
    const t0 = 60 * 8;
    const y0 = mmToPx(60);
    const shake: Sample[] = [];
    // out → back → out, 20 mm legs, along x this time
    const legs = [20, -20, 20];
    let t = t0;
    let from = 0;
    for (const to of legs) {
      for (let i = 1; i <= 10; i++) {
        t += 8;
        shake.push({ x: mmToPx(from + ((to - from) * i) / 10), y: y0, t });
      }
      from = to;
    }
    const { verdict } = run([...drag, ...shake]);
    expect(verdict).not.toBeNull();
    expect(verdict!.reversals).toBeGreaterThanOrEqual(2);
  });

  it("⛔ and the long drag ALONE still evicts nothing — the guard can fail", () => {
    // ⭐ `METHOD`: *a guard that cannot fail is not a guard.* A windowed reading that fired on
    // any motion would pass the vector above and destroy an alignment on every drag.
    const drag: Sample[] = [];
    for (let k = 1; k <= 60; k++) drag.push({ x: 0, y: mmToPx(k), t: k * 8 });
    expect(run(drag).verdict).toBeNull();
  });

  it("⚠ a shake is still refused when its legs straddle the WINDOW, however long the drag", () => {
    // ⭐ The window is what makes the gesture reachable at any moment, and it is also what
    // keeps a slow fidget from accumulating into an eviction — both halves of one number.
    const drag: Sample[] = [];
    for (let k = 1; k <= 60; k++) drag.push({ x: 0, y: mmToPx(k), t: k * 8 });
    const y0 = mmToPx(60);
    const slow: Sample[] = [];
    let t = 60 * 8;
    let from = 0;
    for (const to of [20, -20, 20]) {
      for (let i = 1; i <= 10; i++) {
        t += 70; // ⚠ 700 ms a leg, against a 600 ms window: no sub-window holds two reversals
        slow.push({ x: mmToPx(from + ((to - from) * i) / 10), y: y0, t });
      }
      from = to;
    }
    expect(run([...drag, ...slow]).verdict).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐⭐ THE SHIPPED NUMBERS — `shakeParamsFrom(DEFAULT_CONFIG)`, not a local tuning
// ═════════════════════════════════════════════════════════════════════════════

describe("⛔⛔ the SHIPPED evictShake* values, which nothing exercised until 2026-09-17", () => {
  // ⛔⛔ EVERY VECTOR ABOVE RUNS THE LOCAL `PARAMS` — 8 mm legs, a 600 ms window, 0.4 of
  // straightness. ⭐ THE PRODUCT SHIPS 6 / 300 / 0.45. So the suite proved a detector that
  // is correct at a tuning **no hand has ever touched**, and `evictShakeLegMm` could have
  // been edited to 60 mm or `evictShakeWindowMs` to 30 ms without one vector going red.
  // ⚠ `CONSTRAINTS` §4 already says a tuning value is IMPORTED and never copied; this is
  // the same rule applied to the FIXTURES, which had quietly grown a second copy.
  // ⭐ `shakeParamsFrom` is the one reader, so these vectors follow the config wherever a
  // slider moves it — they assert the SHAPE of the behaviour at the shipped numbers, never
  // the numbers themselves, which is `IN5`'s whole premise.

  it("✅ a canonical 20 mm shake fires at the shipped tuning", () => {
    // ⭐ 8 ms a sample: the three legs span 400 ms, longer than the shipped 300 ms window,
    // and it still fires — because the shake is read in every trailing SUB-window, so the
    // last two legs alone carry the two reversals. ⛔ That is the `D33` lesson, and at 600 ms
    // the fixture could never have exercised it.
    const { verdict } = run(shakePath(20), SHIPPED, SHIPPED_NOISE_MM);
    expect(verdict).not.toBeNull();
    expect(verdict!.reversals).toBeGreaterThanOrEqual(SHIPPED.reversals);
  });

  it("⛔ a CORRECTIVE NUDGE is still refused at the shipped `legMm`", () => {
    // ⭐ ±3 mm — the same nudge as the local counter-example — but stepped at **5 ms**, so
    // all three legs fit inside the shipped 300 ms window. ⛔⛔ THE TIMING IS THE WHOLE
    // POINT: at 8 ms the three legs span 400 ms and the WINDOW refuses the path before
    // `legMm` is ever reached, which would make this vector green for the wrong reason —
    // exactly the trap the repaired BOWED fixture above was caught in. ⭐ Fast and small is
    // the hostile case: it is what the leg threshold, and nothing else, has to refuse.
    // ⚠ The margin is thin by design — a 3 mm excursion against a 6 mm leg — because that
    // margin IS the safety of the gesture. Drop `evictShakeLegMm` to 3 and this goes red,
    // which is the warning a hand would otherwise get by losing its alignments.
    expect(run(shakePath(3, 5), SHIPPED, SHIPPED_NOISE_MM).verdict).toBeNull();
  });

  it("⛔ a LEISURELY reposition is refused at the shipped `windowMs` — the owner's argument", () => {
    // ⭐⭐ THE FIXTURE IS SIZED TO THE DECISION, not to the guard. `evictShakeWindowMs` was
    // halved from my 600 ms to the owner's 300 ms on 2026-09-17 with a stated reason: *"a
    // leisurely reposition cannot accumulate into an eviction."* ⛔ 20 ms a sample ⇒ 400 ms
    // a leg — a reposition that IS leisurely, and which the 600 ms window would have
    // accepted as an eviction. So this vector goes red if the window is ever widened back,
    // which the local `PARAMS` suite (running 600 ms itself) structurally cannot say.
    // ⚠ The local 50 ms fixture is refused at BOTH tunings, so it pins nothing here.
    expect(run(shakePath(20, 20), SHIPPED, SHIPPED_NOISE_MM).verdict).toBeNull();
  });

  it("⛔⛔ and STRAIGHTNESS holds at the shipped 0.45 — the bowed pair, re-measured", () => {
    // ⭐ The same fixture as the repaired pair above, re-timed for the 300 ms window: three
    // 96 ms legs, 288 ms end to end. ⛔ The BOUND MOVED with the config — 0.45 rather than
    // 0.4 — so the bow that refuses had to move with it, and that is exactly the point of
    // running the shipped numbers: 17 mm of bow measures **0.496**, refused, while 14 mm
    // measures **0.409**, just inside 0.45 and accepted. ⚠ Twelve samples a leg, so both sit
    // a little under the continuum `0.637 × bow / 20`; the fixture is sized to what the
    // detector MEASURES, not to the closed form.
    // ⚠ A detector tuned to 0.4 would refuse BOTH, and the suite above could not tell.
    const bowed = bowedShake(20, 17, 12);
    expect(run(bowed, SHIPPED, SHIPPED_NOISE_MM).verdict).toBeNull();
    // ⭐ ...and straightness is the only reason, by the same substitution as above.
    expect(run(bowed, { ...SHIPPED, straightness: 0.9 }, SHIPPED_NOISE_MM).verdict).not.toBeNull();
    // ✅ The near-twin, just inside the shipped bound, still evicts.
    expect(run(bowedShake(20, 14, 12), SHIPPED, SHIPPED_NOISE_MM).verdict).not.toBeNull();
  });
});
