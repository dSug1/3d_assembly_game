/**
 * GOLDEN VECTORS — **A MOUSE, AS TWO TOUCHPOINTS** (the owner, 2026-09-25).
 *
 * ⛔⛔ **THESE ARE ABOUT THE TRANSLATION, NOT ABOUT ANY GESTURE.** The whole value of the module is
 * that no rule knows it exists, so every vector here asks only *which touchpoints does this mouse
 * event stand for* — and a vector that reached into a gesture rule would be evidence the layering
 * had already failed.
 */
import { describe, expect, it } from "vitest";
import {
  DesktopPointers,
  DESKTOP_IDS,
  PINCH_HALF_PX,
  PINCH_IDLE_MS,
  PINCH_NOTCH_RATIO,
  type SyntheticAction,
} from "@input/desktop_pointers";

const LEFT = 0;
const RIGHT = 2;

const ids = (a: readonly SyntheticAction[]) => a.map((s) => `${s.kind}${s.id}`);

describe("⭐⭐⭐ the two buttons are two touchpoints", () => {
  it("⭐ LMB is touchpoint #1, and a drag is its move", () => {
    const d = new DesktopPointers();
    expect(d.step({ type: "DOWN", t: 0, x: 10, y: 20, button: LEFT })).toEqual([
      { kind: "DOWN", id: DESKTOP_IDS.first, x: 10, y: 20 },
    ]);
    expect(d.step({ type: "MOVE", t: 1, x: 11, y: 22 })).toEqual([
      { kind: "MOVE", id: DESKTOP_IDS.first, x: 11, y: 22 },
    ]);
    expect(d.step({ type: "UP", t: 2, x: 11, y: 22, button: LEFT })).toEqual([
      { kind: "UP", id: DESKTOP_IDS.first, x: 11, y: 22 },
    ]);
  });

  it("⭐⭐⭐ BOTH CAN BE DOWN AT ONCE — which a modifier could not do", () => {
    // ⛔⛔ THE VECTOR THE WHOLE MAPPING TURNS ON. `Shift`+LMB cannot hold two pointers, because
    // pressing it requires LMB to be up — and touchpoint #1 staying down while #2 presses IS the
    // alignment gesture (`D87`: hold the part, press what you want it aligned to).
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 0, y: 0, button: LEFT });
    expect(d.step({ type: "DOWN", t: 1, x: 50, y: 60, button: RIGHT })).toEqual([
      { kind: "DOWN", id: DESKTOP_IDS.second, x: 50, y: 60 },
    ]);
    expect(d.downCount).toBe(2);
  });

  it("⛔⛔ THE CURSOR DRIVES THE MOST RECENTLY PRESSED, AND THE OTHER PARKS", () => {
    // ⭐ Parking is exact, not a compromise: `A11` made §1.1 a POSITION deadband, so a still
    // pointer emits nothing at all, and `D43` says the channels SUM. A zero summand is the rule.
    // ⚠ RED against moving both — which would make every second-finger drag a two-finger
    // translation and put depth and roll out of reach entirely.
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 0, y: 0, button: LEFT });
    d.step({ type: "DOWN", t: 1, x: 50, y: 50, button: RIGHT });
    expect(d.step({ type: "MOVE", t: 2, x: 55, y: 70 })).toEqual([
      { kind: "MOVE", id: DESKTOP_IDS.second, x: 55, y: 70 },
    ]);
  });

  it("⭐⭐ SHIFT FLIPS WHICH ONE THE CURSOR DRIVES", () => {
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 0, y: 0, button: LEFT });
    d.step({ type: "DOWN", t: 1, x: 50, y: 50, button: RIGHT });
    expect(ids(d.step({ type: "MOVE", t: 2, x: 5, y: 5, shift: true }))).toEqual([
      `MOVE${DESKTOP_IDS.first}`,
    ]);
    // ⭐ And releasing Shift hands the cursor straight back.
    expect(ids(d.step({ type: "MOVE", t: 3, x: 6, y: 6 }))).toEqual([
      `MOVE${DESKTOP_IDS.second}`,
    ]);
  });

  it("⛔ SHIFT WITH ONLY ONE POINTER DOWN STILL MOVES IT — a frozen cursor reads as a hang", () => {
    // ⚠ RED against the literal reading *flip, whatever is there*: holding Shift during an
    // ordinary drag would emit nothing and look exactly like the product having stopped.
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 0, y: 0, button: LEFT });
    expect(ids(d.step({ type: "MOVE", t: 1, x: 9, y: 9, shift: true }))).toEqual([
      `MOVE${DESKTOP_IDS.first}`,
    ]);
  });

  it("⛔⛔ A LIFT IS REPORTED WHERE THAT POINTER WAS, NOT WHERE THE CURSOR IS", () => {
    // ⚠⚠ The parked pointer's own position. ⛔ RED against using the event's coordinates: the
    // release would teleport it, and `A11`'s deadband would read one enormous step — which is a
    // flick, a shake, or a translation the hand never made.
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 10, y: 10, button: LEFT });
    d.step({ type: "DOWN", t: 1, x: 90, y: 90, button: RIGHT });
    d.step({ type: "MOVE", t: 2, x: 95, y: 95 });
    expect(d.step({ type: "UP", t: 3, x: 95, y: 95, button: LEFT })).toEqual([
      { kind: "UP", id: DESKTOP_IDS.first, x: 10, y: 10 },
    ]);
  });

  it("⭐ when one lifts, the cursor falls back to the other", () => {
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 0, y: 0, button: LEFT });
    d.step({ type: "DOWN", t: 1, x: 50, y: 50, button: RIGHT });
    d.step({ type: "UP", t: 2, x: 50, y: 50, button: RIGHT });
    expect(ids(d.step({ type: "MOVE", t: 3, x: 7, y: 7 }))).toEqual([
      `MOVE${DESKTOP_IDS.first}`,
    ]);
  });

  it("⭐⭐⭐ HOVER IS NOT A GESTURE — the one event a finger cannot produce", () => {
    // ⛔ A mouse moves with no button down. ⚠ Without this, every journey across the glass would
    // be a drag, and the first click would land on a body that had already been thrown.
    const d = new DesktopPointers();
    expect(d.step({ type: "MOVE", t: 0, x: 5, y: 5 })).toEqual([]);
    expect(d.step({ type: "MOVE", t: 1, x: 500, y: 500 })).toEqual([]);
  });

  it("⛔ a middle button, a repeated press and a stray release are all ignored", () => {
    const d = new DesktopPointers();
    expect(d.step({ type: "DOWN", t: 0, x: 0, y: 0, button: 1 })).toEqual([]);
    expect(d.step({ type: "UP", t: 1, x: 0, y: 0, button: LEFT })).toEqual([]);
    d.step({ type: "DOWN", t: 2, x: 0, y: 0, button: LEFT });
    // ⚠ A second DOWN on a button already down would otherwise make two `DOWN` for one id, and
    // `IN2` latches a role per pointer id for its lifetime.
    expect(d.step({ type: "DOWN", t: 3, x: 9, y: 9, button: LEFT })).toEqual([]);
  });
});

describe("⭐⭐⭐ the wheel is a real pinch, not a camera radius", () => {
  it("⭐⭐ the first notch puts TWO pointers down, symmetric about the cursor", () => {
    // ⛔ Rule 4 is a RATIO OF SEPARATIONS. ⚠ Setting the camera radius instead would be a second
    // implementation of zoom — defect 66's shape, which kept a whole suite green over a changed
    // product.
    const d = new DesktopPointers();
    const out = d.step({ type: "WHEEL", t: 0, x: 400, y: 300, wheel: 1 });
    expect(out.filter((a) => a.kind === "DOWN").map((a) => a.x)).toEqual([
      400 - PINCH_HALF_PX,
      400 + PINCH_HALF_PX,
    ]);
    expect(out.every((a) => a.y === 300)).toBe(true);
    expect(d.downCount).toBe(2);
  });

  it("⭐⭐ ONE NOTCH IS ONE RATIO, and the sign zooms IN on a positive notch", () => {
    const d = new DesktopPointers();
    d.step({ type: "WHEEL", t: 0, x: 0, y: 0, wheel: 1 });
    const out = d.step({ type: "WHEEL", t: 10, x: 0, y: 0, wheel: 1 });
    const half = out.find((a) => a.id === DESKTOP_IDS.pinchB)!.x;
    expect(half).toBeCloseTo(PINCH_HALF_PX * PINCH_NOTCH_RATIO ** 2, 6);
    // ⛔ And the other way shrinks it — RED against an absolute step, which would make the last
    // notch of a long zoom a different size from the first.
    const back = d.step({ type: "WHEEL", t: 20, x: 0, y: 0, wheel: -2 });
    expect(back.find((a) => a.id === DESKTOP_IDS.pinchB)!.x).toBeCloseTo(
      PINCH_HALF_PX,
      6,
    );
  });

  it("⛔⛔ IT IS ANCHORED WHERE THE WHEEL STARTED — a drifting cursor must not orbit", () => {
    // ⚠ Two `OUTSIDE` pointers translating together is §2 rule 1's configuration, so a pinch that
    // followed the cursor would turn a zoom into an orbit halfway through.
    const d = new DesktopPointers();
    d.step({ type: "WHEEL", t: 0, x: 100, y: 100, wheel: 1 });
    const out = d.step({ type: "WHEEL", t: 10, x: 800, y: 700, wheel: 1 });
    expect(out.every((a) => a.y === 100)).toBe(true);
    expect(
      out.find((a) => a.id === DESKTOP_IDS.pinchA)!.x +
        out.find((a) => a.id === DESKTOP_IDS.pinchB)!.x,
    ).toBeCloseTo(200, 6);
  });

  it("⭐ the synthetic fingers LIFT once the wheel goes quiet", () => {
    const d = new DesktopPointers();
    d.step({ type: "WHEEL", t: 0, x: 0, y: 0, wheel: 1 });
    expect(d.step({ type: "TICK", t: PINCH_IDLE_MS - 1, x: 0, y: 0 })).toEqual([]);
    expect(ids(d.step({ type: "TICK", t: PINCH_IDLE_MS + 1, x: 0, y: 0 }))).toEqual([
      `UP${DESKTOP_IDS.pinchA}`,
      `UP${DESKTOP_IDS.pinchB}`,
    ]);
    expect(d.downCount).toBe(0);
  });

  it("⛔⛔ A PRESS ENDS A ZOOM — three touchpoints is a configuration no hand made", () => {
    // ⚠ §4's role table counts touchpoints. ⭐ RED against leaving the pair down: the next press
    // would be an `IGNORED` third finger and the body would simply not respond.
    const d = new DesktopPointers();
    d.step({ type: "WHEEL", t: 0, x: 0, y: 0, wheel: 1 });
    const out = d.step({ type: "DOWN", t: 10, x: 5, y: 5, button: LEFT });
    expect(ids(out)).toEqual([
      `UP${DESKTOP_IDS.pinchA}`,
      `UP${DESKTOP_IDS.pinchB}`,
      `DOWN${DESKTOP_IDS.first}`,
    ]);
  });

  it("⛔ a zero or non-finite notch does nothing at all", () => {
    const d = new DesktopPointers();
    expect(d.step({ type: "WHEEL", t: 0, x: 0, y: 0, wheel: 0 })).toEqual([]);
    expect(d.step({ type: "WHEEL", t: 0, x: 0, y: 0, wheel: Number.NaN })).toEqual([]);
    expect(d.downCount).toBe(0);
  });
});

describe("⭐⭐ CANCEL — the panic key", () => {
  it("⛔⛔ LIFTS EVERYTHING, INCLUDING A LIVE PINCH", () => {
    // ⭐ `IN2` records an open risk that a STALE GRIP kills orbit and zoom together with no way
    // back but a reload. ⚠ A mouse reaches it more easily than a finger, because a button released
    // outside the window never reports — so Esc is part of the mapping, not an afterthought.
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 1, y: 1, button: LEFT });
    d.step({ type: "DOWN", t: 1, x: 2, y: 2, button: RIGHT });
    d.step({ type: "WHEEL", t: 2, x: 3, y: 3, wheel: 1 });
    const out = d.step({ type: "CANCEL", t: 3, x: 0, y: 0 });
    expect(out.every((a) => a.kind === "UP")).toBe(true);
    expect(out).toHaveLength(4);
    expect(d.downCount).toBe(0);
    // ⚠ And it is idempotent: a second Esc must not emit a lift for something already up.
    expect(d.step({ type: "CANCEL", t: 4, x: 0, y: 0 })).toEqual([]);
  });

  it("⭐ after a cancel the mapping starts clean — LMB is #1 again", () => {
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 0, y: 0, button: LEFT });
    d.step({ type: "DOWN", t: 1, x: 0, y: 0, button: RIGHT });
    d.step({ type: "CANCEL", t: 2, x: 0, y: 0 });
    expect(ids(d.step({ type: "DOWN", t: 3, x: 0, y: 0, button: LEFT }))).toEqual([
      `DOWN${DESKTOP_IDS.first}`,
    ]);
  });
});

describe("⛔ the synthetic ids cannot collide with a real pointer", () => {
  it("⚠ all four are distinct and far above any browser id", () => {
    const all = Object.values(DESKTOP_IDS);
    expect(new Set(all).size).toBe(all.length);
    // ⭐ Browsers hand out small integers; a collision would let a synthetic pointer inherit a
    // real one's latched `IN2` role, which is the one piece of state that cannot be re-derived.
    for (const id of all) expect(id).toBeGreaterThan(1000);
  });
});
