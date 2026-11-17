/**
 * GOLDEN VECTORS — **ONE RULE FOR EVERY TILT** (2026-11-17, package LF2 — `Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md` §9, §11; the owner: *"You can
 * relax "one speed for every tilt" to "one rule for every tilt""*, then *"Agreed to every recommendation. Proceed."*): a timed turn's duration is a
 * function of its angle — the larger of the one speed's and the least duration (shrinking with the angle under `tiltSmallDeg`), never over the longest.
 * * `turnDurationMs` — the table at the defaults (2.4°, 10°, 27°, 30°, 52°, 90°, 100°, 120°, 180°, 210°), its continuity at 30°, 90°, 120°, both dials
 *   0 = angle / speed exactly, the longest alone, the least alone, the longest winning over the least.
 * * `turnStepRad` — both dials 0: the one speed's step bit for bit; under the rule the whole over its duration; a duration of 0: at once.
 * * `seamTurnStep`, `seamOutStep` — their TIME branch / their ceiling under the rule; their defaults (no dial) as before.
 * * The frames a turn takes, as `zoneStep` steps it (60 frames a second).
 * * The tunables (250, 333, 30), their validation, their sliders, and the wiring's source pins.
 * RED on the mutants listed in LF2's report (`LEVEL_FACE_ENTRY.md` §11).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { rollDurationMs, squareTurning, turnDials, turnDurationMs, turnStepRad } from "../src/input/orbit_tilt";
import { seamOutStep, seamTurnStep } from "../src/input/seam_turn";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const D = Math.PI / 180;
const DT = 1000 / 60;
const RULE = [360, 250, 333, 30] as const;
const dur = (deg: number): number => turnDurationMs(deg, ...RULE);
const code = (f: string) =>
  readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s+/g, " ");

/** the frames a turn of a constant whole takes, stepped as `zoneStep` steps it */
function frames(deg: number, minMs = 250, maxMs = 333, smallDeg = 30, degS = 360): number {
  const whole = deg * D;
  let done = 0;
  let n = 0;
  while (done < whole && n < 1000) {
    done = Math.min(whole, done + turnStepRad(whole, DT, degS, minMs, maxMs, smallDeg));
    n++;
  }
  return n;
}

describe("⭐⭐⭐ `turnDurationMs`: one rule for every tilt", () => {
  it("⭐ the table at the defaults (360°/s, 250 ms, 333 ms, 30°)", () => {
    expect(dur(2.4)).toBeCloseTo(20, 9); // the least shrunk: 250 × 2.4 / 30 — ⛔ the ramp removed: 250
    expect(dur(10)).toBeCloseTo(250 / 3, 9);
    expect(dur(27)).toBeCloseTo(225, 9);
    expect(dur(30)).toBeCloseTo(250, 9);
    expect(dur(52)).toBe(250);
    expect(dur(90)).toBe(250);
    expect(dur(100)).toBeCloseTo((100 / 360) * 1000, 9); // the one speed
    expect(dur(120)).toBe(333); // the longest (the speed's 333.3…)
    expect(dur(180)).toBe(333); // ⛔ the cap removed: 500
    expect(dur(210)).toBe(333);
  });
  it("⭐ continuous at 30°, 90° and 120°", () => {
    for (const a of [30, 90, 119.88]) expect(Math.abs(dur(a + 1e-7) - dur(a - 1e-7))).toBeLessThan(1e-4);
    expect(dur(90)).toBeCloseTo(rollDurationMs(90 * D, 360), 9); // the least meets the speed at 90°
    expect(dur(119.88)).toBeCloseTo(333, 9); // the speed meets the longest at 119.88°
  });
  it("⭐ both dials 0: the angle at the speed, exactly (today's)", () => {
    for (const a of [0, 2.4, 27, 52, 90, 180, 210]) expect(turnDurationMs(a, 360, 0, 0, 30)).toBe((a / 360) * 1000);
    expect(turnDurationMs(-52, 360, 0, 0, 30)).toBe((52 / 360) * 1000); // its size
  });
  it("⭐ the longest alone, the least alone", () => {
    expect(turnDurationMs(180, 360, 0, 333, 30)).toBe(333);
    expect(turnDurationMs(10, 360, 0, 333, 30)).toBeCloseTo(250 / 9, 9); // under it: the speed
    expect(turnDurationMs(180, 360, 250, 0, 30)).toBeCloseTo(500, 9); // no longest: the speed
    expect(turnDurationMs(10, 360, 250, 0, 30)).toBeCloseTo(250 / 3, 9);
    expect(turnDurationMs(60, 360, 250, 0, 30)).toBe(250);
  });
  it("⭐ the longest wins over the least (applied after it)", () => {
    expect(turnDurationMs(60, 360, 250, 100, 30)).toBe(100); // ⛔ the cap applied before the least: 250
    expect(turnDurationMs(20, 360, 600, 300, 30)).toBe(300);
  });
  it("⭐ no speed: the least alone; nothing: 0", () => {
    expect(turnDurationMs(15, 0, 250, 333, 30)).toBeCloseTo(125, 9);
    expect(turnDurationMs(15, 0, 0, 0, 30)).toBe(0);
    expect(turnDurationMs(Number.NaN, 360, 250, 333, 30)).toBe(0);
  });
});

describe("⭐⭐⭐ `turnStepRad`: one frame of a timed turn", () => {
  it("⭐ both dials 0: the one speed's step, bit for bit", () => {
    for (const w of [0, 0.01, 0.5, 1, Math.PI, 4]) expect(turnStepRad(w, DT, 360, 0, 0, 30)).toBe(((360 * Math.PI) / 180) * (DT / 1000));
    expect(turnStepRad(1, DT, 360)).toBe(((360 * Math.PI) / 180) * (DT / 1000)); // the dials' defaults here: none
  });
  it("⭐ the speed's own range at the defaults (90° – 120°): bit for bit the speed's", () => {
    expect(turnStepRad(100 * D, DT, ...RULE)).toBe(((360 * Math.PI) / 180) * (DT / 1000));
  });
  it("⭐ under the rule: the whole over its duration", () => {
    expect(turnStepRad(10 * D, DT, ...RULE)).toBeCloseTo((10 * D * DT) / (250 / 3), 12);
    expect(turnStepRad(180 * D, DT, ...RULE)).toBeCloseTo((Math.PI * DT) / 333, 12);
    expect(turnStepRad(-52 * D, DT, ...RULE)).toBeCloseTo((52 * D * DT) / 250, 12);
  });
  it("⭐ a duration of 0: at once", () => {
    expect(turnStepRad(1, DT, 0, 0, 0, 30)).toBe(Infinity);
    expect(turnStepRad(1, DT, 0, 250, 0, 30)).toBeCloseTo((1 * DT) / 250, 12); // no speed, the least
  });
  it("⭐ the frames at 60 fps: under 30° 2° a frame, 30° – 90° 15 frames (16 at 90°, as today), 90° – 120° the speed, half turns 20 frames", () => {
    expect(frames(2.4)).toBe(2); // 20 ms
    expect(frames(10)).toBe(5);
    expect(frames(27)).toBe(14); // 13.5
    expect(frames(52)).toBe(15);
    expect(frames(90)).toBe(16); // at 90° the least IS the speed: the speed's own step, as today (15 steps and a rounding's last one)
    expect(frames(90, 0, 0)).toBe(16);
    expect(frames(100)).toBe(17); // 16.7 at the speed
    expect(frames(180)).toBe(20); // ⛔ the cap removed: 30
    expect(frames(210)).toBe(20);
    expect(frames(180, 0, 0)).toBe(30); // both 0: today's 30
    expect(frames(52, 0, 0)).toBe(9); // today's 9
  });
});

describe("⭐⭐⭐ `turnDials`: a second clock beside the turn — the one speed (the path drawn before)", () => {
  it("⭐ none beside: the three dials; the square camera beside: none (0, 0)", () => {
    expect(turnDials(false, 250, 333, 30)).toEqual({ minMs: 250, maxMs: 333, smallDeg: 30 });
    expect(turnDials(true, 250, 333, 30)).toEqual({ minMs: 0, maxMs: 0, smallDeg: 30 }); // ⛔ the beside ignored: the dials
    // …so a half turn beside the square camera takes today's 30 frames, alone 20
    const fr = (beside: boolean) => { const d = turnDials(beside, 250, 333, 30); let done = 0, n = 0; while (done < Math.PI && n < 100) { done = Math.min(Math.PI, done + turnStepRad(Math.PI, DT, 360, d.minMs, d.maxMs, d.smallDeg)); n++; } return n; };
    expect(fr(true)).toBe(30);
    expect(fr(false)).toBe(20);
  });
  it("⭐ `squareTurning` is the test the wiring reads (its share over ½, over ½° off its target)", () => {
    expect(squareTurning([0, 1, 0], [1, 0, 0], 1)).toBe(true);
    expect(squareTurning([0, 1, 0], [1, 0, 0], 0.4)).toBe(false); // far out: no square camera
    expect(squareTurning([0, 1, 0], [0, 1, 0], 1)).toBe(false);
  });
});

describe("⭐⭐⭐ the two clocks that read it: `seamTurnStep` (TIME) and `seamOutStep` (the ceiling)", () => {
  it("⭐ `seamTurnStep` by time under the rule; without the dials as before", () => {
    const t = { k: 0, done: 0, rad: Math.PI, axisKnown: true };
    expect(seamTurnStep(t, "TIME", 1, DT, 360).done).toBe(((360 * Math.PI) / 180) * (DT / 1000));
    expect(seamTurnStep(t, "TIME", 1, DT, 360, 0, 0, 30).done).toBe(((360 * Math.PI) / 180) * (DT / 1000));
    expect(seamTurnStep(t, "TIME", 1, DT, ...RULE).done).toBeCloseTo((Math.PI * DT) / 333, 12);
    expect(seamTurnStep({ ...t, rad: 10 * D }, "TIME", 1, DT, ...RULE).done).toBeCloseTo((10 * D * DT) / (250 / 3), 12);
    expect(seamTurnStep(t, "FINGER", 0.4, DT, ...RULE).k).toBe(0.4); // the finger's pace: not timed
    expect(seamTurnStep({ ...t, k: 0.2, done: 0.2 * Math.PI }, "HELD", 0.9, DT, ...RULE)).toEqual({ k: 0.2, done: 0.2 * Math.PI });
  });
  it("⭐ `seamOutStep`: the ceiling the rule's pace; without the dials as before", () => {
    const base = seamOutStep(0, 1, DT, Math.PI, 360, true);
    expect(seamOutStep(0, 1, DT, Math.PI, 360, true, 0, 0, 30)).toBe(base);
    const ruled = seamOutStep(0, 1, DT, Math.PI, 360, true, 250, 333, 30);
    expect(ruled / base).toBeCloseTo(500 / 333, 9); // a half turn: 333 ms instead of 500
    expect(seamOutStep(0, 0.001, DT, Math.PI, 360, true, 250, 333, 30)).toBe(0.001); // the fingers' pace under the ceiling unchanged
    expect(seamOutStep(0, 1, DT, Math.PI, 0, true)).toBe(1); // no speed, no dial: at once, as before
  });
});

describe("⭐⭐⭐ the tunables, their validation, their sliders, the wiring", () => {
  it("⭐ 250 ms, 333 ms, 30°; validated", () => {
    expect(DEFAULT_CONFIG.tiltMinMs).toBe(250);
    expect(DEFAULT_CONFIG.tiltMaxMs).toBe(333);
    expect(DEFAULT_CONFIG.tiltSmallDeg).toBe(30);
    expect(DEFAULT_CONFIG.tiltRollDegS).toBe(360);
    expect(() => validateGestureConfig(DEFAULT_CONFIG)).not.toThrow();
    const v = (o: Partial<typeof DEFAULT_CONFIG>) => () => validateGestureConfig({ ...DEFAULT_CONFIG, ...o });
    expect(v({ tiltMinMs: 0, tiltMaxMs: 0 })).not.toThrow();
    expect(v({ tiltMaxMs: 0 })).not.toThrow();
    expect(v({ tiltMaxMs: 250 })).not.toThrow();
    expect(v({ tiltMaxMs: 100 })).toThrow(/tiltMaxMs/); // under the least
    expect(v({ tiltMinMs: -1 })).toThrow(/tiltMinMs/);
    expect(v({ tiltMinMs: 1001, tiltMaxMs: 0 })).toThrow(/tiltMinMs/);
    expect(v({ tiltMaxMs: 2001 })).toThrow(/tiltMaxMs/);
    expect(v({ tiltSmallDeg: 0.5 })).toThrow(/tiltSmallDeg/);
    expect(v({ tiltSmallDeg: 91 })).toThrow(/tiltSmallDeg/);
    expect(v({ tiltSmallDeg: 1 })).not.toThrow();
    expect(v({ tiltSmallDeg: 90 })).not.toThrow();
  });
  it("⭐ three sliders beside the speed", () => {
    const m = code("render/tuning_menu.ts");
    expect(m).toContain('"tiltRollDegS", 0, 1440, 30), tunable(st, "every tilt\'s least duration (ms; 0: none)", "tiltMinMs", 0, 1000, 10), tunable(st, "every tilt\'s longest duration (ms; 0: none)", "tiltMaxMs", 0, 2000, 10), tunable(st, "every tilt: the angle under which the least duration shrinks with the turn (°)", "tiltSmallDeg", 1, 90, 1),');
  });
  it("⭐ the wiring: the zones' clock, the paced turn's time, the way out's ceiling read the rule", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("zm.done = Math.min(whole, zm.done + turnStepRad(whole, dtMs, degS, dl.minMs, dl.maxMs, dl.smallDeg));");
    expect(a).toContain("const dl = zm !== null && zm.byMm !== true && zm.out === undefined ? turnDialsOf(st, zm) : null; if (zm !== null && dl !== null && zm.axis !== null) {");
    expect(a).toContain("const dl = turnDialsOf(st, zm); const r = seamTurnStep({ k: zm.k, done: zm.done, rad: turnWhole(st, zm), axisKnown: zm.axis !== null }, pace, bl === null ? 1 : blendShare(bl.mm, st.cfg.tiltBlendMm), dtMs, st.cfg.tiltRollDegS, dl.minMs, dl.maxMs, dl.smallDeg);");
    expect(a).toContain("const dl = turnDialsOf(st, zm); o.p = seamOutStep(o.p, target, dtMs, whole, st.cfg.tiltRollDegS, zm.axis !== null, dl.minMs, dl.maxMs, dl.smallDeg);");
    // ⭐ the second clock: the square camera turning beside the turn, kept for its life
    expect(a).toContain("if (zm.beside !== true && squareTurning(sq.n, sq.target, sq.q)) zm.beside = true; return turnDials(zm.beside === true, st.cfg.tiltMinMs, st.cfg.tiltMaxMs, st.cfg.tiltSmallDeg);");
    // ⭐ what stays (LEVEL_FACE_ENTRY.md §11): the square camera's own turn and share, the relocation glides
    expect(a).toContain("sq.n = squareTurn(sq.n, sq.target, dtMs, st.cfg.tiltRollDegS, t);");
    expect(a).toContain("const swingDurMs = rollDurationMs(deltaShown, st.cfg.tiltRollDegS);");
  });
});
