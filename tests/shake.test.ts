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
import { ShakeDetector, type ShakeParams } from "../src/input/shake";
import type { Sample } from "../src/input/motion";
import { mmToPx } from "../src/core/units";

const NOISE_MM = 0.761; // ⭐ MEASURED, 2026-09-14. Not a placeholder.

const PARAMS: ShakeParams = {
  reversals: 2,
  windowMs: 600,
  legMm: 8,
  straightness: 0.4,
};

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
    // Out and back along x, but bowing 12 mm in y: amplitude 40 mm, so the bow is 0.3 of
    // it before the return doubles the excursion. Sits the wrong side of `straightness`.
    const path: Sample[] = [{ x: 0, y: 0, t: 0 }];
    const steps = 60;
    for (let i = 1; i <= steps * 3; i++) {
      const phase = (i / steps) % 2;
      const along = phase < 1 ? phase * 40 : (2 - phase) * 40;
      path.push({ x: mmToPx(along), y: mmToPx(20 * Math.sin((Math.PI * along) / 40)), t: i * 8 });
    }
    expect(run(path).verdict).toBeNull();
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
  it("⛔ a noisier device needs more travel before the axis is claimed", () => {
    // The same tiny path: accepted as an axis at a quiet noise floor, refused at a loud
    // one. ⭐ `pointerNoiseMm` is a property of the GLASS and is passed in, as `sway.ts`
    // takes it — never hard-coded here.
    const tiny = [{ x: 0, y: 0, t: 0 }, ...leg(0, 20, 10, 0, 8), ...leg(20, -20, 20, 80, 8), ...leg(-20, 20, 20, 240, 8)];
    expect(run(tiny, PARAMS, 0.1).verdict).not.toBeNull();
    expect(run(tiny, PARAMS, 8).verdict).toBeNull();
  });
});
