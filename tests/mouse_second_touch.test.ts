/**
 * GOLDEN VECTORS — **THE RIGHT MOUSE BUTTON IS THE SECOND TOUCH** (the owner, 2026-09-25, a
 * build from scratch after four failed rounds).
 *
 * ⛔⛔⛔ **THE VECTORS THAT MATTER MOST ARE ABOUT `skip`.** Every previous failure was a premise
 * about the REAL pointer, so the first block pins that the real pointer is never touched: no
 * left-button event, no lone move, no cancel is ever skipped, and none ever produces an action.
 */
import { describe, expect, it } from "vitest";
import {
  MouseSecondTouch,
  MOUSE_SECOND_ID,
  type MouseInput,
  type SecondTouchAction,
} from "@input/mouse_second_touch";

const LEFT = 0;
const MIDDLE = 1;
const RIGHT = 2;
const NONE = -1;

const ev = (o: Partial<MouseInput> & { type: MouseInput["type"] }): MouseInput => ({
  button: NONE,
  buttons: 0,
  shift: false,
  x: 0,
  y: 0,
  ...o,
});
const kinds = (a: readonly SecondTouchAction[]) => a.map((s) => s.kind);

describe("⭐⭐⭐ THE REAL POINTER IS NEVER TOUCHED", () => {
  it("⛔⛔⛔ a whole left-button drag passes through with no verdict at all", () => {
    // ⚠⚠ THE VECTOR THE BUILD TURNS ON. A mouse was touchpoint #1 with no layer, and the round
    // that intercepted its events froze the product. RED against any `skip` or any action here.
    const m = new MouseSecondTouch();
    for (const e of [
      ev({ type: "DOWN", button: LEFT, buttons: 1, x: 1, y: 1 }),
      ev({ type: "MOVE", buttons: 1, x: 2, y: 2 }),
      ev({ type: "MOVE", buttons: 1, x: 3, y: 3 }),
      ev({ type: "UP", button: LEFT, buttons: 0, x: 3, y: 3 }),
    ])
      expect(m.step(e)).toEqual({ skip: false, emit: [] });
  });

  it("⛔ hover, the middle button and a cancel-shaped UP are all untouched", () => {
    const m = new MouseSecondTouch();
    expect(m.step(ev({ type: "MOVE", buttons: 0, x: 9, y: 9 }))).toEqual({ skip: false, emit: [] });
    expect(m.step(ev({ type: "DOWN", button: MIDDLE, buttons: 4 }))).toEqual({ skip: false, emit: [] });
    expect(m.step(ev({ type: "UP", button: NONE, buttons: 0 }))).toEqual({ skip: false, emit: [] });
  });

  it("⭐ with #2 parked and the left held, a plain move still drives the REAL pointer", () => {
    // ⭐ Parking is exact rather than approximate: `A11` makes a still pointer emit nothing.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: 1 }));
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: 3, x: 50, y: 50 }));
    expect(m.step(ev({ type: "MOVE", buttons: 3, x: 99, y: 99 }))).toEqual({ skip: false, emit: [] });
    expect(m.isDown).toBe(true);
  });
});

describe("⭐⭐⭐ the right button is touchpoint #2", () => {
  it("⭐ press and release, skipped, and the lift lands where it was parked", () => {
    const m = new MouseSecondTouch();
    const down = m.step(ev({ type: "DOWN", button: RIGHT, buttons: 3, x: 50, y: 60 }));
    expect(down).toEqual({ skip: true, emit: [{ kind: "DOWN", x: 50, y: 60 }] });
    // ⚠ The cursor wandered while #2 was parked; the lift must not follow it.
    m.step(ev({ type: "MOVE", buttons: 3, x: 500, y: 500 }));
    const up = m.step(ev({ type: "UP", button: RIGHT, buttons: 1, x: 500, y: 500 }));
    expect(up).toEqual({ skip: true, emit: [{ kind: "UP", x: 50, y: 60 }] });
    expect(m.isDown).toBe(false);
  });

  it("⛔⛔ a right-button UP is skipped even with nothing to lift", () => {
    // ⚠ Reaching Babylon, it is an UP of the mouse's ONE pointer — which would release touchpoint
    // #1 while the left is still held. RED against passing it through.
    const m = new MouseSecondTouch();
    expect(m.step(ev({ type: "UP", button: RIGHT, buttons: 1 }))).toEqual({ skip: true, emit: [] });
  });

  it("⭐⭐ SHIFT hands the move to #2 while the left is held", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: 3, x: 50, y: 50 }));
    const v = m.step(ev({ type: "MOVE", buttons: 3, shift: true, x: 55, y: 70 }));
    expect(v).toEqual({ skip: true, emit: [{ kind: "MOVE", x: 55, y: 70 }] });
    // ⭐ and releasing Shift hands it straight back to the real pointer
    expect(m.step(ev({ type: "MOVE", buttons: 3, x: 56, y: 71 }))).toEqual({ skip: false, emit: [] });
  });

  it("⭐⭐⭐ A LONE RIGHT PRESS IS A PRESS, AND THE CURSOR DRIVES IT", () => {
    // ⛔ The previous build first left this body *held by a finger the cursor never drives*, then
    // refused the press outright, which made the right button look dead. ⭐ Neither: it is a
    // valid press of a pointer, and while it is the ONLY thing down the cursor moves it.
    const m = new MouseSecondTouch();
    expect(m.step(ev({ type: "DOWN", button: RIGHT, buttons: 2, x: 10, y: 10 }))).toEqual({
      skip: true,
      emit: [{ kind: "DOWN", x: 10, y: 10 }],
    });
    expect(m.step(ev({ type: "MOVE", buttons: 2, x: 20, y: 25 }))).toEqual({
      skip: true,
      emit: [{ kind: "MOVE", x: 20, y: 25 }],
    });
  });

  it("⛔ a repeated right DOWN is skipped and emits nothing", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: 3 }));
    expect(m.step(ev({ type: "DOWN", button: RIGHT, buttons: 3, x: 9, y: 9 }))).toEqual({
      skip: true,
      emit: [],
    });
  });
});

describe("⛔⛔⛔ NOTHING IS REMEMBERED ABOUT THE REAL POINTER — the mask is read every time", () => {
  it("⛔⛔⛔ A RIGHT RELEASE THE WINDOW NEVER SAW IS RECOVERED ON THE NEXT EVENT", () => {
    // ⚠⚠ THE DEFECT THAT MADE 'some clicks land, some do not'. Released off the page, no UP
    // arrives; the next event of ANY kind carries the browser's mask with bit 2 clear, and #2
    // lifts where it was parked — BEFORE the rules act on that event. RED against a latch.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: 3, x: 40, y: 50 }));
    const v = m.step(ev({ type: "MOVE", buttons: 1, x: 70, y: 70 }));
    expect(v).toEqual({ skip: false, emit: [{ kind: "UP", x: 40, y: 50 }] });
    expect(m.isDown).toBe(false);
    // ⭐ and the right button works again at once
    expect(kinds(m.step(ev({ type: "DOWN", button: RIGHT, buttons: 3 })).emit)).toEqual(["DOWN"]);
  });

  it("⛔⛔ a LEFT press with the right bit clear lifts a stale #2 and still passes through", () => {
    // ⭐ The one verdict a latch could not express: a synthetic lift owed AND the real event
    // untouched. It is delivered first, so the scene sees the lift, then the press.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: 2, x: 4, y: 4 }));
    const v = m.step(ev({ type: "DOWN", button: LEFT, buttons: 1, x: 8, y: 8 }));
    expect(v).toEqual({ skip: false, emit: [{ kind: "UP", x: 4, y: 4 }] });
  });

  it("⛔ a cancel-shaped UP (button −1, mask 0) passes through and takes #2 with it", () => {
    // ⚠ A `pointercancel` means the real pointer is gone; Babylon must see it. The old latch
    // never cleared on one, because only `button === 0` cleared it.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: 3, x: 1, y: 2 }));
    expect(m.step(ev({ type: "UP", button: NONE, buttons: 0 }))).toEqual({
      skip: false,
      emit: [{ kind: "UP", x: 1, y: 2 }],
    });
  });

  it("⭐ the right button's own UP does not lift #2 twice", () => {
    // ⚠ Its mask already has bit 2 clear, so the reconcile step would fire as well — the explicit
    // branch clears `parked` first. RED against a reconcile that runs before the branches.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: 3, x: 1, y: 2 }));
    expect(kinds(m.step(ev({ type: "UP", button: RIGHT, buttons: 1 })).emit)).toEqual(["UP"]);
  });

  it("⭐ CANCEL lifts #2 and is idempotent; it never skips", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: 3, x: 1, y: 2 }));
    expect(m.step(ev({ type: "CANCEL" }))).toEqual({ skip: false, emit: [{ kind: "UP", x: 1, y: 2 }] });
    expect(m.step(ev({ type: "CANCEL" }))).toEqual({ skip: false, emit: [] });
  });
});

describe("⛔ the synthetic id cannot collide with a real pointer", () => {
  it("⚠ far above any browser id, so it cannot inherit a latched `IN2` role", () => {
    expect(MOUSE_SECOND_ID).toBeGreaterThan(1000);
  });
});
