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
  swayWorldDirection,
  turnDegrees,
  receivesSway,
  SWAY_SCALE_MIN,
  SWAY_SCALE_MAX,
  SpinSwayWatcher,
  rotationVector,
  turnDegrees3,
} from "../src/input/sway";
import { mmToPx } from "../src/core/units";
import type { Sample } from "../src/input/motion";
import { qFromAxisAngle, qmul, type Quat, type Vec3 } from "../src/core/vec";

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

describe("where the other objects go", () => {
  // A camera looking down −z with the usual axes, so the arithmetic is checkable by eye.
  const FRAME = {
    right: [1, 0, 0] as const,
    up: [0, 1, 0] as const,
    depth: [0, 0, -1] as const,
    // ⚠ Unused here — the sway maps a screen heading and never asks which side of the
    // horizon the camera is on. Present because the type is total.
    towardGravity: 0.5,
  };

  it("⭐⭐ THE SAME WAY as the drag, not opposed to it", () => {
    // ⚠ The sign is the whole character of the effect and nothing in the code can say
    // which was intended — it shipped opposed for one round before being corrected. A
    // vector is the only thing that keeps it from drifting back.
    const right = swayWorldDirection(FRAME, 1, 0);
    expect(right[0]).toBeCloseTo(1, 9); // finger right → others go RIGHT
    const down = swayWorldDirection(FRAME, 0, 1); // screen y is DOWN
    expect(down[1]).toBeCloseTo(-1, 9); // finger down → others go DOWN
  });

  it("⭐⭐ it is a TRUE 3-VECTOR: a depth component carries through too", () => {
    // ⛔ Rules 6bis/6ter translate along depth. The sway must follow the REAL
    // displacement, not its shadow on the glass — this is the one place that mapping
    // lives, so the future case is wired before it can be got wrong silently.
    const intoScreen = swayWorldDirection(FRAME, 0, 0, 1); // along the view axis
    expect(intoScreen[2]).toBeCloseTo(-1, 9); // object goes −z, others follow −z
    const diagonal = swayWorldDirection(FRAME, 1, 0, 1);
    expect(diagonal[0]).toBeCloseTo(Math.SQRT1_2, 9);
    expect(diagonal[2]).toBeCloseTo(-Math.SQRT1_2, 9);
  });

  it("⛔ it is a UNIT vector, so the amplitude is the slider's and nothing else's", () => {
    for (const [x, y, d] of [
      [1, 0, 0],
      [0.6, -0.8, 0],
      [1, 1, 1],
      [0.2, 0.3, -0.9],
    ]) {
      const v = swayWorldDirection(FRAME, x!, y!, d!);
      expect(Math.hypot(v[0], v[1], v[2])).toBeCloseTo(1, 9);
    }
  });

  it("⛔ a zero direction gives a zero vector, never a NaN", () => {
    // ⚠ One NaN written into a position never washes out of the scene.
    expect(swayWorldDirection(FRAME, 0, 0, 0)).toEqual([0, 0, 0]);
  });

  it("⚠ the speed ceiling is ×4.5, raised from ×3 on the device", () => {
    expect(SWAY_SCALE_MAX).toBe(4.5);
    expect(swayScale(5000, 120)).toBe(4.5);
  });
});

/**
 * ⭐⭐ THE SAME EFFECT FOR ROTATION — the scene swings as a BLOCK about the held object's
 * centre, on the axis it is turning about.
 */
describe("the rotation sway trigger", () => {
  const AXIS = [0.2, 0.95, -0.24] as const;
  /** Turn `steps` times at `degPerS` about `axis`, feeding the watcher. */
  function turn(
    w: SpinSwayWatcher,
    axis: readonly [number, number, number],
    degPerS: number,
    steps: number,
    from: { q: Quat; t: number },
  ) {
    const kicks: { axis: Vec3; degPerS: number }[] = [];
    let { q, t } = from;
    const stepRad = ((degPerS * Math.PI) / 180) * (DT / 1000);
    for (let i = 0; i < steps; i++) {
      q = qmul(qFromAxisAngle(axis as unknown as Vec3, stepRad), q);
      t += DT;
      const k = w.push(q, t, true);
      if (k) kicks.push(k);
    }
    return { kicks, q, t };
  }

  it("⭐⭐ a REVERSAL of the turn fires a kick", () => {
    const w = new SpinSwayWatcher(60, 9.2);
    const a = turn(w, AXIS, 200, 40, { q: [1, 0, 0, 0], t: 0 });
    expect(a.kicks.length).toBe(1); // the start
    const back = turn(w, [-AXIS[0], -AXIS[1], -AXIS[2]], 200, 40, a);
    expect(back.kicks.length).toBe(1); // ⭐ the reversal
    // …and it points the other way.
    expect(turnDegrees3(back.kicks[0]!.axis, a.kicks[0]!.axis)).toBeGreaterThan(150);
  });

  it("⛔ ONE kick per reversal, however long the new direction is held", () => {
    const w = new SpinSwayWatcher(60, 9.2);
    const a = turn(w, AXIS, 200, 30, { q: [1, 0, 0, 0], t: 0 });
    const long = turn(w, [-AXIS[0], -AXIS[1], -AXIS[2]], 200, 300, a);
    expect(long.kicks.length).toBe(1);
  });

  it("⛔⛔ a still finger's ORIENTATION NOISE fires nothing", () => {
    // ⛔ The floor is derived from the measured pointer noise through the rotation gain:
    // 0.761 mm × 0.07 rad/mm ≈ 3.05° per sample. Measured over 10 s of a still finger
    // that is still reported MOVING: ×1 → 377 false kicks, ×2 → 14, ×3 → 0.
    const noiseRad = 0.07 * 0.761;
    const w = new SpinSwayWatcher(60, 3 * noiseRad * (180 / Math.PI));
    let seed = 11;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed / 0x7fffffff) * 2 - 1;
    };
    let kicks = 0;
    for (let i = 0; i < 1200; i++) {
      const jitter = qmul(
        qFromAxisAngle([1, 0.3, -0.2], rnd() * noiseRad),
        qFromAxisAngle([0, 1, 0], rnd() * noiseRad),
      );
      if (w.push(jitter, i * DT, true)) kicks++;
    }
    expect(kicks).toBe(0);
  });

  it("⛔ nothing fires while the gesture is not rotating", () => {
    const w = new SpinSwayWatcher(60, 9.2);
    let q: Quat = [1, 0, 0, 0];
    for (let i = 0; i < 40; i++) {
      q = qmul(qFromAxisAngle(AXIS as unknown as Vec3, 0.05), q);
      expect(w.push(q, i * DT, false)).toBeNull();
    }
  });

  it("⭐ the speed it reports is the TURN RATE, and it scales the same way", () => {
    const fast = turn(new SpinSwayWatcher(60, 9.2), AXIS, 300, 40, { q: [1, 0, 0, 0], t: 0 });
    expect(fast.kicks[0]!.degPerS).toBeGreaterThan(250);
    expect(fast.kicks[0]!.degPerS).toBeLessThan(350);
    expect(swayScale(300, 90)).toBeCloseTo(300 / 90, 9);
  });

  it("⛔ a wobble OUT AND BACK is not two turns — the window reads the NET rotation", () => {
    // ⚠ A hand that jitters has gone nowhere. Summing per-step rotations would call that
    // a turn every time the sign flipped.
    const w = new SpinSwayWatcher(60, 9.2);
    let q: Quat = [1, 0, 0, 0];
    let kicks = 0;
    for (let i = 0; i < 300; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      q = qmul(qFromAxisAngle(AXIS as unknown as Vec3, dir * 0.06), q);
      if (w.push(q, i * DT, true)) kicks++;
    }
    expect(kicks).toBe(0);
  });
});

describe("the rotation vector", () => {
  it("⛔ the identity gives a ZERO vector, not a 0/0", () => {
    expect(rotationVector([1, 0, 0, 0])).toEqual([0, 0, 0]);
  });

  it("⛔ it always takes the SHORT way — a 350° turn is a −10° turn", () => {
    const r = rotationVector(qFromAxisAngle([0, 0, 1], (350 * Math.PI) / 180));
    expect(Math.hypot(r[0], r[1], r[2])).toBeLessThan(Math.PI);
    expect(r[2]).toBeLessThan(0);
  });

  it("turnDegrees3 is the angle between two axes, and 0 for a zero vector", () => {
    expect(turnDegrees3([1, 0, 0], [1, 0, 0])).toBeCloseTo(0, 9);
    expect(turnDegrees3([1, 0, 0], [-1, 0, 0])).toBeCloseTo(180, 9);
    expect(turnDegrees3([0, 0, 0], [1, 0, 0])).toBe(0);
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

/**
 * ⭐⭐⭐ **`D53` — A BODY UNDER A FINGER IS NOT SWAYED BY ANYTHING.**
 *
 * > *"While a touchpoint is pressed on an object, disable its sway: it shall not be swayed by
 * > the move of any other object."* — the owner, 2026-09-18
 *
 * ⛔⛔ **IT IS A SECOND, DIFFERENT EXCLUSION.** `receivesSway` already spared the body that
 * CAUSED the kick — *it is already going that way*. ⚠ This spares any body a hand is holding,
 * whether or not it moved, and the two only coincide when exactly one body is held.
 * ⭐ Two fingers on two bodies is where they part company, and that is the configuration
 * `D51` has just made central.
 */
describe("⭐⭐⭐ D53 — a grasped body receives no sway", () => {
  const body = (id: string, frozen?: boolean) => ({ id, ...(frozen ? { frozen } : {}) });
  const grasping = (...ids: string[]) => (id: string) => ids.includes(id);

  it("⭐ ungrasped bodies still sway — the rule must not switch the feature off", () => {
    expect(receivesSway(body("b"), "a", grasping("a"))).toBe(true);
    expect(receivesSway(body("b"), "a", grasping())).toBe(true);
  });

  it("⭐⭐⭐ a body with a finger on it is spared, though ANOTHER body kicked the sway", () => {
    // ⛔ THE VECTOR THE RULE EXISTS FOR. `b` did not move and is not the mover, so every older
    // exclusion lets it through; the hand is on it, so it must not be shoved.
    expect(receivesSway(body("b"), "a", grasping("b"))).toBe(false);
  });

  it("⭐⭐ TWO HELD BODIES: each is spared from the other's kick", () => {
    // ⚠ Before this rule only the kicker was spared, so a part held in one hand was nudged by
    // the part held in the other — the configuration `D51` is built around.
    const both = grasping("a", "b");
    expect(receivesSway(body("b"), "a", both)).toBe(false);
    expect(receivesSway(body("a"), "b", both)).toBe(false);
  });

  it("⚠ the default argument keeps every existing caller's behaviour", () => {
    // ⛔ `receivesSway` is called from two writers and from older vectors. A required third
    // parameter would have changed what those assert without anyone editing them.
    expect(receivesSway(body("b"), "a")).toBe(true);
  });

  it("⛔ frozen still wins, and so does the mover exclusion", () => {
    // ⭐ The three reasons are independent and none may mask another.
    expect(receivesSway(body("plate", true), "a", grasping())).toBe(false);
    expect(receivesSway(body("a"), "a", grasping())).toBe(false);
    expect(receivesSway(null, "a", grasping())).toBe(false);
  });
});

describe("⭐⭐⭐ the mover's own PIONEER does not sway", () => {
  it("⛔⛔ *\"the pioneer object does not sway when its follower object moves\"* — the owner, 2026-09-26", () => {
    // ⛔ RED against the predicate before this rule, which swayed every other free body.
    expect(receivesSway({ id: "pioneer" }, "follower", () => false, "pioneer")).toBe(false);
  });

  it("⭐ every OTHER body still sways — the exclusion names one body, not the scene", () => {
    expect(receivesSway({ id: "bystander" }, "follower", () => false, "pioneer")).toBe(true);
  });

  it("⭐ a mover with no Pioneer spares nobody extra", () => {
    expect(receivesSway({ id: "pioneer" }, "free", () => false, null)).toBe(true);
  });
});
