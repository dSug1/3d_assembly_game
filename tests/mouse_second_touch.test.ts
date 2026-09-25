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
  secondTouchAlwaysAvailable,
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

describe("⭐⭐⭐ SHIFT + LEFT DRAG IS A SECOND TOUCH OF ITS OWN — no right button needed", () => {
  // > *"left button drag without shift = translation in horizontal plane, left button drag with
  // > shift: translation in gravity axis with dy and roll with dx"* — the owner, 2026-09-25
  //
  // ⭐ Nothing here chooses gravity or roll: that is the scene's existing second-touch rule, which
  // already gives gravity to a free body in translation, both to an aligned one, roll in rotation.

  it("⭐⭐⭐ the first Shift move creates an ANCHOR-ONLY #2 where the cursor was, and drives it", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 10, y: 10 }));
    const v = m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 10, y: 25 }));
    expect(v.skip).toBe(true);
    expect(v.emit).toEqual([
      { target: "SECOND", kind: "DOWN", x: 10, y: 10, anchorOnly: true },
      { target: "SECOND", kind: "MOVE", x: 10, y: 25, anchorOnly: true },
    ]);
  });

  it("⛔⛔⛔ IT IS NEVER PICKED — so it can never become the holder of another body", () => {
    // > *"it says ready X->roll but the roll does not appear and the object cannot roll.
    // > Sometimes it rolls, though."*
    // ⛔ A second touch that raycasts takes its ROLE from what lies under the cursor: over empty
    // space it drives roll, over ANOTHER body it becomes that body's holder and drives nothing
    // here. ⭐ Every action of a Shift-made #2 is anchor-only, down to its lift.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    const all = [
      ...m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 5, y: 0 })).emit,
      ...m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 9, y: 3 })).emit,
      ...m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 9, y: 3 })).emit,
    ].filter((a) => a.target === "SECOND");
    expect(all.length).toBe(4);
    expect(all.every((a) => a.anchorOnly === true)).toBe(true);
  });

  it("⭐⭐ releasing Shift hands the cursor back to the holder — with NO jump", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 0, y: 50 }));
    // ⭐ #1 is still at (0,0) in the scene; +4 in x must put it at (4,0), never (4,50)
    expect(m.step(ev({ type: "MOVE", buttons: L, x: 4, y: 50 }))).toEqual({
      skip: true,
      emit: [{ target: "REAL", kind: "MOVE", x: 4, y: 0 }],
    });
  });

  it("⭐⭐ the left release lifts the Shift-made #2 FIRST, then #1 where the scene has it", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 0, y: 20 }));
    expect(m.step(ev({ type: "UP", button: LEFT, buttons: 0, shift: true, x: 0, y: 20 }))).toEqual({
      skip: true,
      emit: [
        { target: "SECOND", kind: "UP", x: 0, y: 20, anchorOnly: true },
        { target: "REAL", kind: "UP", x: 0, y: 0 },
      ],
    });
    expect(m.isSecondDown).toBe(false);
  });

  it("⛔ Shift with no drag creates nothing — so it can never register as a TAP", () => {
    // ⚠ A second touch pressed and released in place is a tap, and a tap toggles the mode.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    expect(m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 0, y: 0 }))).toEqual({
      skip: false,
      emit: [],
    });
    expect(m.isSecondDown).toBe(false);
  });

  it("⛔ Shift while hovering creates nothing — there is no holder to drive", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "MOVE", x: 0, y: 0 }));
    expect(m.step(ev({ type: "MOVE", shift: true, x: 5, y: 5 }))).toEqual({ skip: false, emit: [] });
  });

  it("⭐ a right press REPLACES a Shift-made #2 — one second touch at a time", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 0, y: 10 }));
    const v = m.step(ev({ type: "DOWN", button: RIGHT, buttons: L | R, x: 0, y: 10 }));
    expect(v.emit).toEqual([
      { target: "SECOND", kind: "UP", x: 0, y: 10, anchorOnly: true },
      { target: "SECOND", kind: "DOWN", x: 0, y: 10 },
    ]);
  });

  it("⛔ a stray right release (its press was missed) does not lift the Shift-made #2", () => {
    // ⚠ The Shift-made #2 belongs to the LEFT button's hold. A right-button UP whose DOWN happened
    // outside the window is still swallowed — but it must not take the channel away mid-drag.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 0, y: 10 }));
    expect(m.step(ev({ type: "UP", button: RIGHT, buttons: L, x: 0, y: 10 }))).toEqual({
      skip: true,
      emit: [],
    });
    expect(m.isSecondDown).toBe(true);
  });

  it("⛔⛔ the mask keeps a Shift-made #2 alive with the LEFT bit, not the right one", () => {
    // ⚠ RED against reconciling it on bit 2, which is clear the whole time it exists — it would be
    // lifted on the very next event and the channel would never run.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 0, y: 10 }));
    expect(tag(m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 0, y: 20 })).emit)).toEqual([
      "SECOND.MOVE",
    ]);
    // ⭐ and a missed LEFT release takes it with the holder
    expect(tag(m.step(ev({ type: "MOVE", buttons: 0, x: 0, y: 20 })).emit)).toEqual([
      "SECOND.UP",
      "REAL.UP",
    ]);
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

describe("⭐⭐⭐ ON A MOUSE THE SECOND TOUCH IS ALWAYS AVAILABLE — `D60` for an aligned body", () => {
  it("⭐⭐ a mouse holder counts it as present; a finger and a pen do not", () => {
    // > *"When an object is aligned, whatever the mode, the left click shall give access to
    // > horizontal translation … This shall be immediate."*
    // ⛔ RED against `false` for a mouse, which is what shipped: in ROTATE a plain left drag on an
    // aligned body twisted it until a Shift-drag had brought the second touch into being.
    // ⚠ RED against `true` for touch — a finger's second touch exists only when it lands.
    expect(secondTouchAlwaysAvailable("mouse")).toBe(true);
    expect(secondTouchAlwaysAvailable("touch")).toBe(false);
    expect(secondTouchAlwaysAvailable("pen")).toBe(false);
  });
});

describe("⛔ the synthetic id cannot collide with a real pointer", () => {
  it("⚠ far above any browser id, so it cannot inherit a latched `IN2` role", () => {
    expect(MOUSE_SECOND_ID).toBeGreaterThan(1000);
  });
});
