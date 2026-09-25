/**
 * GOLDEN VECTORS — **THE RIGHT MOUSE BUTTON IS THE SECOND TOUCH** (the owner, 2026-09-25).
 *
 * ⛔⛔⛔ **THE OWNER'S TWO REPORTS ARE THE HEADLINE VECTORS, REPLAYED EVENT BY EVENT.** *"It does
 * not work in the other order"* and *"when I release the right click, the object jumps"*. ⚠ Both
 * came from one cursor driving two pointers at ABSOLUTE positions; the fix makes the cursor
 * RELATIVE once two exist, and every scene position below is checked against that.
 *
 * ⭐ And the regression guard stays first: with no offset, the real pointer is never touched.
 */
import { describe, expect, it } from "vitest";
import {
  MouseSecondTouch,
  MOUSE_SECOND_ID,
  type MouseAction,
  type MouseInput,
} from "@input/mouse_second_touch";

const LEFT = 0;
const MIDDLE = 1;
const RIGHT = 2;
const NONE = -1;
const L = 1; // buttons bit: left
const R = 2; // buttons bit: right

const ev = (o: Partial<MouseInput> & { type: MouseInput["type"] }): MouseInput => ({
  button: NONE,
  buttons: 0,
  shift: false,
  x: 0,
  y: 0,
  ...o,
});
const tag = (a: readonly MouseAction[]) => a.map((s) => `${s.target}.${s.kind}`);

describe("⭐⭐⭐ WITH NO OFFSET, THE REAL POINTER IS NEVER TOUCHED", () => {
  it("⛔⛔⛔ a whole left-button drag passes through with no verdict at all", () => {
    // ⚠⚠ The mouse was touchpoint #1 at `6a28e62` with no layer at all, and the round that
    // intercepted its events froze the product. RED against any `skip` or action here.
    const m = new MouseSecondTouch();
    for (const e of [
      ev({ type: "MOVE", x: 1, y: 1 }),
      ev({ type: "DOWN", button: LEFT, buttons: L, x: 1, y: 1 }),
      ev({ type: "MOVE", buttons: L, x: 5, y: 9 }),
      ev({ type: "MOVE", buttons: L, x: 12, y: 20 }),
      ev({ type: "UP", button: LEFT, buttons: 0, x: 12, y: 20 }),
      ev({ type: "MOVE", x: 30, y: 30 }),
    ])
      expect(m.step(e)).toEqual({ skip: false, emit: [] });
  });

  it("⛔ the middle button and a cancel-shaped UP are untouched", () => {
    const m = new MouseSecondTouch();
    expect(m.step(ev({ type: "DOWN", button: MIDDLE, buttons: 4 }))).toEqual({ skip: false, emit: [] });
    expect(m.step(ev({ type: "UP", button: NONE, buttons: 0 }))).toEqual({ skip: false, emit: [] });
  });
});

describe("⭐⭐⭐ THE OWNER'S FIRST REPORT: PRESS ORDER", () => {
  it("⭐ LEFT then RIGHT: Shift drives the second-pressed pointer — #2", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: L | R, x: 0, y: 0 }));
    const v = m.step(ev({ type: "MOVE", buttons: L | R, shift: true, x: 0, y: 10 }));
    expect(v.skip).toBe(true);
    expect(v.emit).toEqual([{ target: "SECOND", kind: "MOVE", x: 0, y: 10 }]);
  });

  it("⛔⛔⛔ RIGHT then LEFT: Shift STILL drives the second-pressed pointer — now the REAL one", () => {
    // > *"To reach the gravity axis translation I need to press first left click and hold and then
    // > press right click. It does not work in the other order."*
    //
    // ⛔ RED against *Shift drives the synthetic pointer*, which is what shipped: right-first makes
    // #2 the HOLDER (`IN2` latches roles by arrival), so Shift drove the holder's horizontal
    // translation and the gravity channel was unreachable. ⭐ The real pointer is second here,
    // and it sits exactly under the cursor, so its move passes through untouched.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 0, y: 0 }));
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L | R, x: 0, y: 0 }));
    expect(m.step(ev({ type: "MOVE", buttons: L | R, shift: true, x: 0, y: 10 }))).toEqual({
      skip: false,
      emit: [],
    });
  });

  it("⭐ and without Shift the cursor drives the FIRST-pressed pointer, in both orders", () => {
    const a = new MouseSecondTouch();
    a.step(ev({ type: "DOWN", button: LEFT, buttons: L }));
    a.step(ev({ type: "DOWN", button: RIGHT, buttons: L | R }));
    expect(a.step(ev({ type: "MOVE", buttons: L | R, x: 4, y: 0 }))).toEqual({ skip: false, emit: [] });

    const b = new MouseSecondTouch();
    b.step(ev({ type: "DOWN", button: RIGHT, buttons: R }));
    b.step(ev({ type: "DOWN", button: LEFT, buttons: L | R }));
    expect(tag(b.step(ev({ type: "MOVE", buttons: L | R, x: 4, y: 0 })).emit)).toEqual([
      "SECOND.MOVE",
    ]);
  });
});

describe("⭐⭐⭐ THE OWNER'S SECOND REPORT: THE JUMP ON RELEASE", () => {
  it("⛔⛔⛔ AFTER A SHIFT-DRAG, THE REAL POINTER RESUMES FROM ITS OWN POSITION — no jump", () => {
    // > *"When I release the right click, the object jumps to another position which is probably
    // > the accumulated value of the left click."*
    //
    // ⛔⛔ RED against absolute positions, which is what shipped: while Shift drove #2 the real
    // pointer's moves were skipped, the scene's #1 stood still, and the first move it received
    // afterwards was at the cursor's CURRENT position — the whole wander in one step.
    // ⭐ Here: #1 at (0,0); Shift-drag moves the cursor to (0,100) driving #2; then a plain move
    // of +5 in x must put #1 at (5,0), NOT at (5,100).
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: L | R, x: 0, y: 0 }));
    m.step(ev({ type: "MOVE", buttons: L | R, shift: true, x: 0, y: 100 }));
    m.step(ev({ type: "UP", button: RIGHT, buttons: L, x: 0, y: 100 }));
    const v = m.step(ev({ type: "MOVE", buttons: L, x: 5, y: 100 }));
    expect(v).toEqual({ skip: true, emit: [{ target: "REAL", kind: "MOVE", x: 5, y: 0 }] });
    expect(m.isOffset).toBe(true);
  });

  it("⛔⛔ #2 IS LIFTED WHERE IT WAS DRIVEN TO, not at the cursor", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: L | R, x: 0, y: 0 }));
    m.step(ev({ type: "MOVE", buttons: L | R, shift: true, x: 0, y: 40 }));
    // ⚠ Shift released: the cursor drives #1 again and #2 stays at (0,40).
    m.step(ev({ type: "MOVE", buttons: L | R, x: 90, y: 40 }));
    expect(m.step(ev({ type: "UP", button: RIGHT, buttons: L, x: 90, y: 40 }))).toEqual({
      skip: true,
      emit: [{ target: "SECOND", kind: "UP", x: 0, y: 40 }],
    });
  });

  it("⛔⛔ AN OFFSET REAL POINTER IS RELEASED WHERE THE SCENE HAS IT", () => {
    // ⚠ The jump's other half: releasing at the cursor would be one enormous final step.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: L | R, x: 0, y: 0 }));
    m.step(ev({ type: "MOVE", buttons: L | R, shift: true, x: 0, y: 60 }));
    m.step(ev({ type: "UP", button: RIGHT, buttons: L, x: 0, y: 60 }));
    expect(m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 0, y: 60 }))).toEqual({
      skip: true,
      emit: [{ target: "REAL", kind: "UP", x: 0, y: 0 }],
    });
    // ⭐ and the next gesture starts clean — pass-through again
    expect(m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 3, y: 3 }))).toEqual({
      skip: false,
      emit: [],
    });
  });

  it("⭐ RIGHT then LEFT, plain drag drives the holder #2 relatively", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 10, y: 10 }));
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L | R, x: 30, y: 30 }));
    // ⭐ #2 is the holder and stays where it pressed; +5 in x now drives it relatively.
    const v = m.step(ev({ type: "MOVE", buttons: L | R, x: 35, y: 30 }));
    expect(v.emit).toEqual([{ target: "SECOND", kind: "MOVE", x: 15, y: 10 }]);
  });
});

describe("⭐⭐ the right button is touchpoint #2", () => {
  it("⭐ a lone right press is a press, and the cursor drives it", () => {
    const m = new MouseSecondTouch();
    expect(m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 10, y: 10 }))).toEqual({
      skip: true,
      emit: [{ target: "SECOND", kind: "DOWN", x: 10, y: 10 }],
    });
    expect(m.step(ev({ type: "MOVE", buttons: R, x: 20, y: 25 })).emit).toEqual([
      { target: "SECOND", kind: "MOVE", x: 20, y: 25 },
    ]);
  });

  it("⛔⛔ a right-button UP is skipped even with nothing to lift", () => {
    // ⚠ Reaching Babylon it is an UP of the mouse's ONE pointer — it would release #1.
    const m = new MouseSecondTouch();
    expect(m.step(ev({ type: "UP", button: RIGHT, buttons: L }))).toEqual({ skip: true, emit: [] });
  });

  it("⛔ a repeated right DOWN is skipped and emits nothing", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: R }));
    expect(m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 9, y: 9 }))).toEqual({
      skip: true,
      emit: [],
    });
  });
});

describe("⛔⛔⛔ THE MASK IS READ EVERY TIME — a missed release never sticks", () => {
  it("⛔⛔ a right release the window never saw lifts #2 on the next event", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: L | R, x: 40, y: 50 }));
    const v = m.step(ev({ type: "MOVE", buttons: L, x: 40, y: 50 }));
    expect(v.emit).toEqual([{ target: "SECOND", kind: "UP", x: 40, y: 50 }]);
    expect(m.isSecondDown).toBe(false);
  });

  it("⛔⛔ a left release the window never saw lifts an OFFSET real pointer where it is", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: L | R, x: 0, y: 0 }));
    m.step(ev({ type: "MOVE", buttons: L | R, shift: true, x: 0, y: 30 }));
    const v = m.step(ev({ type: "MOVE", buttons: 0, x: 0, y: 30 }));
    expect(tag(v.emit)).toEqual(["SECOND.UP", "REAL.UP"]);
    expect(v.emit[1]).toEqual({ target: "REAL", kind: "UP", x: 0, y: 0 });
  });

  it("⛔⛔ a right press after a MISSED left release knows it came FIRST", () => {
    // ⚠ #2's press order is recorded from the real pointer's state, so that state is reconciled
    // BEFORE the press is judged. RED against reconciling after: #2 would think it came second,
    // and Shift would drive the wrong pointer for the rest of the gesture.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    // the left release is never delivered; the next event is a right press with only bit 2 set
    const v = m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 0, y: 0 }));
    expect(tag(v.emit)).toEqual(["REAL.UP", "SECOND.DOWN"]);
    // ⭐ #2 is alone, so a plain move drives it
    expect(tag(m.step(ev({ type: "MOVE", buttons: R, x: 3, y: 0 })).emit)).toEqual(["SECOND.MOVE"]);
  });

  it("⭐ each pointer's own UP does not lift it twice", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L }));
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: L | R }));
    expect(tag(m.step(ev({ type: "UP", button: RIGHT, buttons: L })).emit)).toEqual(["SECOND.UP"]);
  });

  it("⭐ CANCEL lifts #2, is idempotent, and never skips", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 1, y: 2 }));
    expect(m.step(ev({ type: "CANCEL" }))).toEqual({
      skip: false,
      emit: [{ target: "SECOND", kind: "UP", x: 1, y: 2 }],
    });
    expect(m.step(ev({ type: "CANCEL" }))).toEqual({ skip: false, emit: [] });
  });
});

describe("⛔ the synthetic id cannot collide with a real pointer", () => {
  it("⚠ far above any browser id, so it cannot inherit a latched `IN2` role", () => {
    expect(MOUSE_SECOND_ID).toBeGreaterThan(1000);
  });
});
