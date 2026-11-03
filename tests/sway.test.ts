/**
 * GOLDEN VECTORS — when the sympathetic sway fires, and how hard.
 *
 * ⛔ The one that matters is the TURN, because its absence was invisible in the code: the
 * only trigger used to be `motionState`, which does not fall back to `STATIONARY` until
 * the finger has been below 6 mm/s for 150 ms. A hand reversing at speed never goes
 * still, so the scene reacted once and then sat frozen — found by finger, not by a suite.
 */
import { describe, expect, it } from "vitest";
import {
  SwayWatcher,
  swayScale,
  turnDegrees,
  receivesSway,
  SWAY_SCALE_MIN,
  SWAY_SCALE_MAX,
} from "../src/input/sway";
import { mmToPx } from "../src/core/units";
import type { Sample } from "../src/input/motion";

const DT = 8; // ms between samples
/** The MEASURED pointer noise this device reports (`pointerNoiseMm`). */
const NOISE = 0.761;

/** Drag in a straight line at `mmPerS`, feeding the watcher; collect the kicks. */
function drag(w: SwayWatcher, dirX: number, dirY: number, mmPerS: number, steps: number, from: Sample) {
  const kicks: { dirX: number; dirY: number; speedMmPerS: number }[] = [];
  let s = from;
  const stepMm = (mmPerS * DT) / 1000;
  for (let i = 0; i < steps; i++) {
    s = { x: s.x + mmToPx(dirX * stepMm), y: s.y + mmToPx(dirY * stepMm), t: s.t + DT };
    const k = w.push(s, true, true);
    if (k) kicks.push(k);
  }
  return { kicks, last: s };
}

describe("the sway trigger", () => {
  it("⭐⭐ a REVERSAL mid-drag fires a kick — the case that was missing", () => {
    const w = new SwayWatcher(50, NOISE);
    const start: Sample = { x: 400, y: 300, t: 0 };
    const out = drag(w, 1, 0, 150, 40, start); // →
    expect(out.kicks.length).toBe(1); // the onset
    const back = drag(w, -1, 0, 150, 40, out.last); // ←
    expect(back.kicks.length).toBe(1); // ⭐ the turn
    expect(back.kicks[0]!.dirX).toBeLessThan(-0.9);
  });

  it("⛔ ONE kick per turn, however long the new heading is held", () => {
    // ⚠ Otherwise the scene is shoved continuously instead of reacting once.
    const w = new SwayWatcher(50, NOISE);
    let s: Sample = { x: 400, y: 300, t: 0 };
    s = drag(w, 1, 0, 150, 30, s).last;
    const long = drag(w, 0, 1, 150, 200, s); // a quarter turn, then held for 1.6 s
    expect(long.kicks.length).toBe(1);
  });

  it("⛔ a SHALLOW turn does not fire", () => {
    const w = new SwayWatcher(50, NOISE);
    let s: Sample = { x: 400, y: 300, t: 0 };
    s = drag(w, 1, 0, 150, 30, s).last;
    // ~27° — inside the threshold
    const gentle = drag(w, Math.cos(0.47), Math.sin(0.47), 150, 60, s);
    expect(gentle.kicks.length).toBe(0);
  });

  it("⛔⛔ a finger held STILL with pointer noise fires NOTHING", () => {
    // ⛔ THE REASON THE DIRECTION IS SMOOTHED. At the measured 0.761 mm of jitter, raw
    // sample-to-sample directions reverse constantly: an unsmoothed turn test would
    // shake the whole scene while nothing moved. Mistake shape 1, made visible.
    const w = new SwayWatcher(50, NOISE);
    let seed = 3;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed / 0x7fffffff) * 2 - 1;
    };
    let kicks = 0;
    for (let i = 0; i < 400; i++) {
      const k = w.push({ x: 400 + mmToPx(rnd() * 0.76), y: 300 + mmToPx(rnd() * 0.76), t: i * DT }, true, true);
      if (k) kicks++;
    }
    expect(kicks).toBe(0);
  });

  it("⭐ becoming a TRANSLATION mid-gesture fires, even while already moving", () => {
    // The second finger goes down during a rotation: intent changed, the scene reacts.
    const w = new SwayWatcher(50, NOISE);
    let s: Sample = { x: 400, y: 300, t: 0 };
    for (let i = 0; i < 30; i++) {
      s = { x: s.x + mmToPx(1.2), y: s.y, t: s.t + DT };
      expect(w.push(s, true, false)).toBeNull(); // rotating: never fires
    }
    s = { x: s.x + mmToPx(1.2), y: s.y, t: s.t + DT };
    expect(w.push(s, true, true)).not.toBeNull(); // ⭐ now translating
  });

  it("⛔ nothing fires while the gesture is not translating or not moving", () => {
    const w = new SwayWatcher(50, NOISE);
    let s: Sample = { x: 400, y: 300, t: 0 };
    for (let i = 0; i < 20; i++) {
      s = { x: s.x + mmToPx(1.2), y: s.y, t: s.t + DT };
      expect(w.push(s, false, true)).toBeNull();
    }
  });
});

describe("the sway scale", () => {
  it("⭐⭐ it is PROPORTIONAL to the drag speed between the clamps", () => {
    // ⭐ The owner's ask — slow drag, slow and small sway; fast drag, big and quick —
    // out of one proportionality. Doubling the speed doubles the impulse, and since the
    // excursion still peaks at the same τ, the objects cover that ground twice as fast.
    expect(swayScale(120, 120)).toBeCloseTo(1, 9);
    expect(swayScale(240, 120)).toBeCloseTo(2, 9);
    expect(swayScale(60, 120)).toBeCloseTo(0.5, 9);
  });

  it("⛔ CLAMPED at both ends — a flick must not throw the scene", () => {
    // ⚠ A flick reaches 2000 mm/s, twenty times the reference.
    expect(swayScale(2000, 120)).toBe(SWAY_SCALE_MAX);
    expect(swayScale(1, 120)).toBe(SWAY_SCALE_MIN);
    expect(swayScale(0, 120)).toBe(SWAY_SCALE_MIN);
  });

  it("⛔ a zero or absent reference is neutral, never a division by zero", () => {
    expect(swayScale(100, 0)).toBe(1);
    expect(swayScale(Number.NaN, 120)).toBe(1);
  });

  it("turnDegrees is the angle between two screen directions", () => {
    expect(turnDegrees(1, 0, 1, 0)).toBeCloseTo(0, 9);
    expect(turnDegrees(1, 0, 0, 1)).toBeCloseTo(90, 9);
    expect(turnDegrees(1, 0, -1, 0)).toBeCloseTo(180, 9);
    expect(turnDegrees(0, 0, 1, 0)).toBe(0); // no direction, no turn
  });
});

/**
 * ⭐⭐⭐ **WHO THE SWAY IS ALLOWED TO MOVE — the owner's rule, 2026-09-17.**
 *
 * > *"The frozen objects should not wobble."*
 *
 * ⛔⛔ **THE MODEL WAS FROZEN AND THE PICTURE WAS NOT, WHICH IS A DISTINCTION NOBODY MADE
 * UNTIL AN AUDIT LOOKED.** `object_model.ts` enforces `frozen` at its two writers, so the base
 * plate's PLACEMENT could never change — and it visibly wobbled and swung anyway, because the
 * sympathetic sway is a DISPLAY offset added after the model is read. ⚠ Every reason `frozen`
 * exists applies to the picture just as much: a base plate that rocks when a part is dragged
 * is not a base plate, whatever the data says.
 *
 * ⭐⭐ **AND THE PREDICATE LIVES HERE RATHER THAN IN THE RENDER LOOP** — `pioneer_cascade.ts`'s
 * header states the reason in the project's own words: *a RULE in a render file is a rule
 * nothing can interrogate.* The two sway writers had this decision written twice, inline, as
 * two `continue` statements; a third writer would have made its own third copy.
 */
describe("⛔⛔ the sway moves neither the HELD body nor a FROZEN one", () => {
  it("⭐ an ordinary body receives the kick", () => {
    expect(receivesSway({ id: "a" }, "b")).toBe(true);
    expect(receivesSway({ id: "a", frozen: false }, "b")).toBe(true);
  });

  it("⛔ the HELD body does not — it is already going that way", () => {
    expect(receivesSway({ id: "a" }, "a")).toBe(false);
  });

  it("⛔⛔ a FROZEN body does not — the owner's rule", () => {
    expect(receivesSway({ id: "plate", frozen: true }, "a")).toBe(false);
  });

  it("⛔ and it is frozen even when nothing is held", () => {
    // ⚠ The sway is also kicked by a pinch and by a rotation, where there may be no holder.
    expect(receivesSway({ id: "plate", frozen: true }, null)).toBe(false);
    expect(receivesSway({ id: "a" }, null)).toBe(true);
  });

  it("⛔ a body with no id at all is refused rather than swayed", () => {
    // ⚠ A mesh the model does not know — a marker, a contour — must not be moved by a rule
    // written about bodies. ⭐ `null` is the shape `idOf.get(mesh)` returns for exactly those.
    expect(receivesSway(null, "a")).toBe(false);
  });
});
