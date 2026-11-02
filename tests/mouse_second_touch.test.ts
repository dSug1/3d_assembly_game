/**
 * GOLDEN VECTORS — **THE MOUSE'S SECOND TOUCH** (`input/mouse_second_touch.ts`): the left button is touchpoint #1, untouched; ALT / CTRL
 * is the orbit's HELD second touch (2026-10-11, *"build with ALT and CTRL"*); the right button is swallowed.
 *
 * ⛔ (2026-11-02, *"remove the translation and the rotation of the parts"*) the right press's HitFace, the Shift-made second touch, Space's
 * latch, freeze and unalign and the Shift tap's toggle are deleted with the parts' translation, rotation and alignment, with their vectors
 * (commit `d8134eb`).
 *
 * ⛔⛔ The first block is still the regression guard: the real pointer is never touched — the path `6a28e62` proved before any desktop layer
 * existed.
 */
import { describe, expect, it } from "vitest";
import { MouseSecondTouch, MOUSE_SECOND_ID, type MouseInput } from "@input/mouse_second_touch";

const LEFT = 0;
const MIDDLE = 1;
const RIGHT = 2;
const NONE = -1;
const L = 1; // buttons bit: left
const R = 2; // buttons bit: right

const ev = (o: Partial<MouseInput> & { type: MouseInput["type"] }): MouseInput => ({
  button: NONE,
  buttons: 0,
  x: 0,
  y: 0,
  ...o,
});

describe("⭐⭐⭐ THE REAL POINTER IS NEVER TOUCHED", () => {
  it("⛔⛔⛔ a whole left-button drag passes through with no verdict at all", () => {
    const m = new MouseSecondTouch();
    for (const e of [
      ev({ type: "MOVE", x: 1, y: 1 }),
      ev({ type: "DOWN", button: LEFT, buttons: L, x: 1, y: 1 }),
      ev({ type: "MOVE", buttons: L, x: 5, y: 9 }),
      ev({ type: "UP", button: LEFT, buttons: 0, x: 5, y: 9 }),
      ev({ type: "MOVE", x: 30, y: 30 }),
    ])
      expect(m.step(e)).toEqual({ skip: false, emit: [] });
  });

  it("⛔ the middle button and a cancel-shaped UP are untouched", () => {
    const m = new MouseSecondTouch();
    expect(m.step(ev({ type: "DOWN", button: MIDDLE, buttons: 4 }))).toEqual({ skip: false, emit: [] });
    expect(m.step(ev({ type: "UP", button: NONE, buttons: 0 }))).toEqual({ skip: false, emit: [] });
  });

  it("⛔⛔ the right button does nothing — swallowed, no second touch, nothing latched", () => {
    const m = new MouseSecondTouch();
    expect(m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 5, y: 5 }))).toEqual({ skip: true, emit: [] });
    expect(m.isSecondDown).toBe(false);
    expect(m.step(ev({ type: "MOVE", buttons: R, x: 9, y: 5 }))).toEqual({ skip: false, emit: [] });
    expect(m.step(ev({ type: "UP", button: RIGHT, buttons: 0, x: 9, y: 5 }))).toEqual({ skip: true, emit: [] });
    expect(m.isSecondDown).toBe(false);
  });
});

describe("⭐⭐⭐ ALT / CTRL — the orbit's HELD SECOND TOUCH", () => {
  it("⭐⭐ at the cursor, never driven by it, lifted where it was pressed", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 10, y: 20 }));
    expect(m.step(ev({ type: "MOD_DOWN" })).emit).toEqual([{ target: "SECOND", kind: "DOWN", x: 10, y: 20 }]);
    expect(m.isSecondDown).toBe(true);
    // the cursor drives the LEFT pointer, never the second
    expect(m.step(ev({ type: "MOVE", buttons: L, x: 30, y: 20, mod: true }))).toEqual({ skip: false, emit: [] });
    // the left released: the second stays (the same input)
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 30, y: 20, mod: true }));
    expect(m.isSecondDown).toBe(true);
    // a second key down while it is down: nothing
    expect(m.step(ev({ type: "MOD_DOWN" })).emit).toEqual([]);
    expect(m.step(ev({ type: "MOD_UP" })).emit).toEqual([{ target: "SECOND", kind: "UP", x: 10, y: 20 }]);
    expect(m.isSecondDown).toBe(false);
  });

  it("⛔ no cursor seen yet: the key presses nothing", () => {
    expect(new MouseSecondTouch().step(ev({ type: "MOD_DOWN" })).emit).toEqual([]);
  });

  it("⛔⛔ a key release the window missed: the next pointer event that says no key lifts it", () => {
    const k = new MouseSecondTouch();
    k.step(ev({ type: "MOVE", x: 5, y: 5 }));
    k.step(ev({ type: "MOD_DOWN" }));
    expect(k.step(ev({ type: "MOVE", x: 6, y: 5, mod: true })).emit).toEqual([]);
    expect(k.step(ev({ type: "MOVE", x: 7, y: 5, mod: false })).emit).toEqual([{ target: "SECOND", kind: "UP", x: 5, y: 5 }]);
    expect(k.isSecondDown).toBe(false);
  });

  it("⭐ CANCEL (Esc) lifts it, is idempotent, and never skips", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "MOVE", x: 1, y: 2 }));
    m.step(ev({ type: "MOD_DOWN" }));
    expect(m.step(ev({ type: "CANCEL" }))).toEqual({ skip: false, emit: [{ target: "SECOND", kind: "UP", x: 1, y: 2 }] });
    expect(m.step(ev({ type: "CANCEL" }))).toEqual({ skip: false, emit: [] });
  });
});

describe("⛔ the synthetic id cannot collide with a real pointer", () => {
  it("⚠ far above any browser id, so it cannot inherit a latched `IN2` role", () => {
    expect(MOUSE_SECOND_ID).toBeGreaterThan(1000);
  });
});
