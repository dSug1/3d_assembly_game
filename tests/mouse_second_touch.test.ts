/**
 * GOLDEN VECTORS — **A MOUSE AS A TWO-TOUCH DEVICE** (the owner, 2026-09-25).
 *
 * The contract, in the owner's words: *"right button click does not translate nor rotate any
 * object"*; *"hitface triggered only by right click, not by left click"*; *"right click hits
 * hitface and hold, mouse move to pioneer face and single left click sets pioneer face and aligns
 * (cyan) or double left click (amber)"* — the amber FOLLOW is deleted since (`D106`); and *"left button drag with shift = translation in gravity
 * axis with dy and roll with dx."*
 *
 * ⛔⛔ The first block is still the regression guard: with no offset, the real pointer is never
 * touched — the path `6a28e62` proved before any desktop layer existed.
 */
import { describe, expect, it } from "vitest";
import {
  hitFaceAllowed,
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
});

describe("⭐⭐⭐ RIGHT PRESS AND HOLD = THE HITFACE; LEFT CLICK = THE PIONEER", () => {
  it("⭐⭐⭐ the owner's gesture, event by event", () => {
    // > *"right click hits hitface and hold, mouse move to pioneer face and single left click sets
    // > pioneer face and aligns"*
    const m = new MouseSecondTouch();
    // right press on part A's face: the FIRST touch of `D87` — picked, so its face is the HitFace
    expect(m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 100, y: 100 }))).toEqual({
      skip: true,
      emit: [{ target: "SECOND", kind: "DOWN", x: 100, y: 100 }],
    });
    // travel to the Pioneer face: nothing moves — the HitFace holder is never driven
    expect(m.step(ev({ type: "MOVE", buttons: R, x: 300, y: 180 }))).toEqual({
      skip: false,
      emit: [],
    });
    // left click there: the REAL pointer presses and releases untouched — the second touch
    expect(m.step(ev({ type: "DOWN", button: LEFT, buttons: L | R, x: 300, y: 180 }))).toEqual({
      skip: false,
      emit: [],
    });
    expect(m.step(ev({ type: "UP", button: LEFT, buttons: R, x: 300, y: 180 }))).toEqual({
      skip: false,
      emit: [],
    });
    // releasing the right button lifts the HitFace holder where it pressed
    expect(m.step(ev({ type: "UP", button: RIGHT, buttons: 0, x: 300, y: 180 }))).toEqual({
      skip: true,
      emit: [{ target: "SECOND", kind: "UP", x: 100, y: 100 }],
    });
  });

  it("⛔⛔⛔ THE RIGHT BUTTON NEVER TRANSLATES OR ROTATES — its pointer is never driven", () => {
    // > *"right button click does not translate nor rotate any object."*
    // ⛔ RED against the previous build, where a lone right press was driven by the cursor.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 0, y: 0 }));
    for (let i = 1; i <= 5; i++) {
      const v = m.step(ev({ type: "MOVE", buttons: R, x: i * 20, y: i * 7 }));
      expect(v.emit).toEqual([]);
    }
    // ⭐ and not even with Shift: the Shift channel belongs to a LEFT hold
    expect(m.step(ev({ type: "MOVE", buttons: R, shift: true, x: 500, y: 9 })).emit).toEqual([]);
  });

  it("⛔⛔ a right press WHILE THE LEFT IS DOWN is refused, and still swallowed", () => {
    // ⚠ It would arrive SECOND and mean the opposite of a HitFace — a Pioneer press. And reaching
    // Babylon it is a press of the mouse's one pointer.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    expect(m.step(ev({ type: "DOWN", button: RIGHT, buttons: L | R, x: 0, y: 0 }))).toEqual({
      skip: true,
      emit: [],
    });
    expect(m.isSecondDown).toBe(false);
    // ⭐ its release is swallowed too, and lifts nothing
    expect(m.step(ev({ type: "UP", button: RIGHT, buttons: L, x: 0, y: 0 }))).toEqual({
      skip: true,
      emit: [],
    });
  });

  it("⛔ a repeated right DOWN is swallowed and emits nothing", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: R }));
    expect(m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 9, y: 9 }))).toEqual({
      skip: true,
      emit: [],
    });
  });
});

describe("⭐⭐⭐ ONLY THE RIGHT BUTTON SETS A HITFACE", () => {
  it("⭐ a mouse-pressed holder shows no HitFace; the right button's holder and a finger do", () => {
    // > *"hitface triggered only by right click, not by left click."*
    // ⛔ The right-button holder is delivered as `touch`; RED against allowing `mouse`.
    expect(hitFaceAllowed("mouse")).toBe(false);
    expect(hitFaceAllowed("touch")).toBe(true);
    expect(hitFaceAllowed("pen")).toBe(true);
  });
});

describe("⭐⭐⭐ SHIFT + LEFT DRAG IS A SECOND TOUCH OF ITS OWN", () => {
  it("⭐⭐ the first Shift move creates an ANCHOR-ONLY #2 where the cursor was, and drives it", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 10, y: 10 }));
    expect(m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 10, y: 25 }))).toEqual({
      skip: true,
      emit: [
        { target: "SECOND", kind: "DOWN", x: 10, y: 10, anchorOnly: true },
        { target: "SECOND", kind: "MOVE", x: 10, y: 25, anchorOnly: true },
      ],
    });
  });

  it("⭐⭐ releasing Shift hands the cursor back to the holder — with NO jump", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 0, y: 50 }));
    // ⭐ #1 is still at (0,0) in the scene; +4 in x puts it at (4,0), never (4,50)
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
  });

  it("⛔ Shift with no drag creates nothing — so it can never register as a TAP", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    expect(m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 0, y: 0 }))).toEqual({
      skip: false,
      emit: [],
    });
    expect(m.isSecondDown).toBe(false);
  });

  it("⛔⛔ the mask keeps a Shift-made #2 alive with the LEFT bit, and a missed left release takes both", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 0, y: 0 }));
    m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 0, y: 10 }));
    expect(tag(m.step(ev({ type: "MOVE", buttons: L, shift: true, x: 0, y: 20 })).emit)).toEqual([
      "SECOND.MOVE",
    ]);
    expect(tag(m.step(ev({ type: "MOVE", buttons: 0, x: 0, y: 20 })).emit)).toEqual([
      "SECOND.UP",
      "REAL.UP",
    ]);
  });
});

describe("⛔⛔⛔ THE MASK IS READ EVERY TIME — a missed release never sticks", () => {
  it("⛔⛔ a right release the window never saw lifts the HitFace holder on the next event", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 40, y: 50 }));
    expect(m.step(ev({ type: "MOVE", buttons: 0, x: 70, y: 70 })).emit).toEqual([
      { target: "SECOND", kind: "UP", x: 40, y: 50 },
    ]);
    expect(m.isSecondDown).toBe(false);
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

/**
 * ⭐⭐⭐ `D154` — **SPACE + CLICK ALIGNS** (the owner, 2026-09-29): *"Space + click (left or right): freeze
 * the ongoing translation or rotation (if any) and highlight the hitface. Space being hold or another hit
 * on space + click (left or right) on another object: select the pioneerface and align the hitface which
 * becomes the follower face. All this counts as one episode."*
 */
describe("⭐⭐⭐ `D154` — Space + click latches the HitFace; Space + click on another body is the Pioneer tap", () => {
  const A = { id: "A", frozen: false };
  const B = { id: "B", frozen: false };
  const PLATE = { id: "plate", frozen: true };
  const at = (a: readonly MouseAction[], k: number) => [a[k]!.x, a[k]!.y];

  for (const [name, btn, bit] of [["left", LEFT, L], ["right", RIGHT, R]] as const) {
    it(`⭐⭐⭐ the whole gesture with the ${name} button — latched past the click, one tap, then the lift`, () => {
      const m = new MouseSecondTouch();
      // ⭐ Space + click on A: the HitFace holder presses there, and STAYS down after the release.
      const d1 = m.step(ev({ type: "DOWN", button: btn, buttons: bit, x: 10, y: 20, space: true, onBody: A }));
      expect(tag(d1.emit)).toEqual(["SECOND.DOWN"]);
      expect(at(d1.emit, 0)).toEqual([10, 20]);
      expect(d1.skip).toBe(true);
      const u1 = m.step(ev({ type: "UP", button: btn, buttons: 0, x: 10, y: 20, space: true }));
      expect(u1.skip).toBe(true);
      expect(u1.emit).toEqual([]);
      expect(m.isSecondDown).toBe(true);
      // ⭐ Space let go and the mouse travels — nothing moves, the HitFace stays.
      expect(m.step(ev({ type: "MOVE", x: 200, y: 90 }))).toEqual({ skip: false, emit: [] });
      // ⭐ Space hit again + click on B: the Pioneer tap presses there…
      const d2 = m.step(ev({ type: "DOWN", button: btn, buttons: bit, x: 200, y: 90, space: true, onBody: B }));
      expect(tag(d2.emit)).toEqual(["REAL.DOWN"]);
      expect(at(d2.emit, 0)).toEqual([200, 90]);
      expect(d2.skip).toBe(true);
      // …does not move while held (a TAP)…
      const mv = m.step(ev({ type: "MOVE", buttons: bit, x: 205, y: 93, space: true }));
      expect(mv).toEqual({ skip: true, emit: [] });
      // …and releases WHERE IT PRESSED, BEFORE the HitFace lifts — so it aligns while the Follower is held.
      const u2 = m.step(ev({ type: "UP", button: btn, buttons: 0, x: 205, y: 93, space: true }));
      expect(tag(u2.emit)).toEqual(["REAL.UP", "SECOND.UP"]);
      expect(at(u2.emit, 0)).toEqual([200, 90]);
      expect(at(u2.emit, 1)).toEqual([10, 20]);
      expect(m.isSecondDown).toBe(false);
    });
  }

  it("⭐⭐ FREEZE: Space + right click during a left drag lifts the drag where the scene has it, then latches", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 50, y: 50 }));
    m.step(ev({ type: "MOVE", buttons: L, x: 60, y: 55 }));
    const d = m.step(ev({ type: "DOWN", button: RIGHT, buttons: L | R, x: 60, y: 55, space: true, onBody: A }));
    expect(tag(d.emit)).toEqual(["REAL.UP", "SECOND.DOWN"]);
    // ⛔ the rest of the left hold drives nothing, and its release is swallowed
    expect(m.step(ev({ type: "MOVE", buttons: L | R, x: 90, y: 70 }))).toEqual({ skip: true, emit: [] });
    expect(m.step(ev({ type: "UP", button: LEFT, buttons: R, x: 90, y: 70 })).skip).toBe(true);
    expect(m.step(ev({ type: "UP", button: RIGHT, buttons: 0, x: 90, y: 70 })).emit).toEqual([]);
    expect(m.isSecondDown).toBe(true);
  });

  it("⭐ Space + click on the SAME body cancels the HitFace (`D160`; it moved it before)", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 10, y: 10, space: true, onBody: A }));
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 10, y: 10 }));
    // ⭐ `D160`: the same body again CANCELS — the HitFace lifts, nothing is pressed in its place.
    const again = m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 14, y: 12, space: true, onBody: A }));
    expect(tag(again.emit)).toEqual(["SECOND.UP"]);
    expect(again.skip).toBe(true);
    expect(m.isSecondDown).toBe(false);
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 14, y: 12 }));
    // ⭐ `D156`: on empty space it is no longer a silent cancel — see the unalign vectors below.
  });

  it("⭐⭐ `D159`: a click WITHOUT Space completes the action — it is not a cancel any more", () => {
    // ⛔ RED against `D154`: a plain click let the latched HitFace go and passed as an ordinary click.
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 10, y: 10, space: true, onBody: A }));
    m.step(ev({ type: "UP", button: RIGHT, buttons: 0, x: 10, y: 10 }));
    const plain = m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 30, y: 30, onBody: B }));
    expect(tag(plain.emit)).toEqual(["REAL.DOWN"]);
    expect(plain.skip).toBe(true);
    expect(tag(m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 30, y: 30 })).emit)).toEqual(["REAL.UP", "SECOND.UP"]);
  });

  it("⛔ a FROZEN body is never latched as the HitFace (it cannot be a Follower) — the click passes", () => {
    const m = new MouseSecondTouch();
    expect(m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 1, y: 1, space: true, onBody: PLATE }))).toEqual({ skip: false, emit: [] });
    expect(m.isSecondDown).toBe(false);
  });

  it("⭐ …but a frozen body CAN be the Pioneer — the tap goes there", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 1, y: 1, space: true, onBody: A }));
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 1, y: 1 }));
    expect(tag(m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 5, y: 5, space: true, onBody: PLATE })).emit)).toEqual(["REAL.DOWN"]);
  });

  it("⛔ Esc cancels a latched HitFace; a tap whose button was released off the page still ends in order", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 1, y: 1, space: true, onBody: A }));
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 1, y: 1 }));
    expect(tag(m.step(ev({ type: "CANCEL" })).emit)).toEqual(["SECOND.UP"]);
    const n = new MouseSecondTouch();
    n.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 1, y: 1, space: true, onBody: A }));
    n.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 1, y: 1 }));
    n.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 9, y: 9, space: true, onBody: B }));
    // ⛔ the right button's release never arrived — the next event's mask says it is up
    expect(tag(n.step(ev({ type: "MOVE", buttons: 0, x: 20, y: 20 })).emit)).toEqual(["REAL.UP", "SECOND.UP"]);
  });

  it("⛔⛔ WITHOUT Space nothing changed: right hold + left click is still the gesture", () => {
    const m = new MouseSecondTouch();
    expect(tag(m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 1, y: 1, onBody: A })).emit)).toEqual(["SECOND.DOWN"]);
    expect(m.step(ev({ type: "DOWN", button: LEFT, buttons: L | R, x: 9, y: 9 }))).toEqual({ skip: false, emit: [] });
    expect(m.step(ev({ type: "UP", button: LEFT, buttons: R, x: 9, y: 9 }))).toEqual({ skip: false, emit: [] });
    expect(tag(m.step(ev({ type: "UP", button: RIGHT, buttons: 0, x: 9, y: 9 })).emit)).toEqual(["SECOND.UP"]);
  });
});

/**
 * ⭐⭐⭐ `D155` (the owner, 2026-09-29): *"if a translation or a rotation is ongoing, the pressing of space
 * key during the movement should stop the translation or rotation and immediately select the face which
 * was dragged as the hitface; also, if a face is currently being pressed by left click (even without
 * movement), the pressing of space key shall trigger the hitface; once an alignment occurs, it shall
 * reset the space key (the space key needs to be hit again to start another hitface cycle)."*
 */
describe("⭐⭐⭐ `D155` — Space during a left hold freezes it into the HitFace; an alignment uses Space up", () => {
  const A = { id: "A", frozen: false };
  const B = { id: "B", frozen: false };
  const SPACE = (o: Partial<MouseInput> = {}) => ev({ type: "SPACE", space: true, ...o });

  it("⭐⭐⭐ DURING A DRAG: the drag lifts where the scene has it; the HitFace presses on the body, inheriting", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 50, y: 50 }));
    m.step(ev({ type: "MOVE", buttons: L, x: 70, y: 58 }));
    const v = m.step(SPACE({ x: 300, y: 200, onBody: A }));
    expect(tag(v.emit)).toEqual(["REAL.UP", "SECOND.DOWN"]);
    expect([v.emit[0]!.x, v.emit[0]!.y]).toEqual([70, 58]); // where the scene has the drag
    expect([v.emit[1]!.x, v.emit[1]!.y]).toEqual([300, 200]); // the adapter's point on the body
    expect(v.emit[1]!.inherit).toBe(true);
    // ⛔ the rest of the left hold moves nothing and its release is swallowed; the HitFace stays
    expect(m.step(ev({ type: "MOVE", buttons: L, x: 90, y: 60, space: true }))).toEqual({ skip: true, emit: [] });
    expect(m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 90, y: 60, space: true }))).toEqual({ skip: true, emit: [] });
    expect(m.isSecondDown).toBe(true);
    // ⭐ and Space + click on another body aligns, exactly as `D154`
    expect(tag(m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 400, y: 90, space: true, onBody: B })).emit)).toEqual(["REAL.DOWN"]);
    expect(tag(m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 400, y: 90, space: true })).emit)).toEqual(["REAL.UP", "SECOND.UP"]);
  });

  it("⭐⭐ WITHOUT MOVEMENT: a left press held still — Space freezes it the same way", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 50, y: 50 }));
    expect(tag(m.step(SPACE({ x: 55, y: 52, onBody: A })).emit)).toEqual(["REAL.UP", "SECOND.DOWN"]);
  });

  it("⛔ no left hold, no body, a frozen body, or a HitFace already latched: Space only re-arms", () => {
    const m = new MouseSecondTouch();
    expect(m.step(SPACE({ onBody: A }))).toEqual({ skip: false, emit: [] }); // nothing held
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 1, y: 1 }));
    expect(m.step(SPACE({ onBody: null }))).toEqual({ skip: false, emit: [] }); // holding empty space
    expect(m.step(SPACE({ onBody: { id: "plate", frozen: true } }))).toEqual({ skip: false, emit: [] });
  });

  it("⭐⭐⭐ AN ALIGNMENT USES SPACE UP: still held, the next click is an ordinary one — until Space is hit again", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 1, y: 1, space: true, onBody: A }));
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 1, y: 1, space: true }));
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 9, y: 9, space: true, onBody: B }));
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 9, y: 9, space: true })); // ⭐ aligned
    // ⛔ RED against `D154`: Space still held, a click on a body latched a new HitFace at once.
    expect(m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 20, y: 20, space: true, onBody: A }))).toEqual({ skip: false, emit: [] });
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 20, y: 20, space: true }));
    // ⭐ hit again: armed
    m.step(SPACE());
    expect(tag(m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 30, y: 30, space: true, onBody: A })).emit)).toEqual(["SECOND.DOWN"]);
  });

  it("⭐ …or released: a Space let go and pressed again is a fresh cycle", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 1, y: 1, space: true, onBody: A }));
    m.step(ev({ type: "UP", button: RIGHT, buttons: 0, x: 1, y: 1, space: true }));
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 9, y: 9, space: true, onBody: B }));
    m.step(ev({ type: "UP", button: RIGHT, buttons: 0, x: 9, y: 9, space: true }));
    m.step(ev({ type: "MOVE", x: 12, y: 12, space: false })); // released
    expect(tag(m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 12, y: 12, space: true, onBody: A })).emit)).toEqual(["SECOND.DOWN"]);
  });
});

describe("⭐⭐⭐ `D156` — Space + click the Follower, Space + click EMPTY space: unalign", () => {
  // > *"also to unalign a follower object = space + click on follower and space + click on empty space
  // > (with same latitude applying for the hold of the space key and the space key hit order)"* — the owner
  const A = { id: "A", frozen: false };
  for (const [name, btn, bit] of [["left", LEFT, L], ["right", RIGHT, R]] as const) {
    it(`⭐⭐ with the ${name} button: a TAP on empty space while the HitFace holds, then the lift`, () => {
      const m = new MouseSecondTouch();
      m.step(ev({ type: "DOWN", button: btn, buttons: bit, x: 10, y: 10, space: true, onBody: A }));
      m.step(ev({ type: "UP", button: btn, buttons: 0, x: 10, y: 10, space: false })); // Space let go…
      m.step(ev({ type: "SPACE", space: true })); // …and hit again
      // ⛔ RED against `D154`: empty space lifted the HitFace and delivered nothing.
      const d = m.step(ev({ type: "DOWN", button: btn, buttons: bit, x: 500, y: 60, space: true, onBody: null }));
      expect(tag(d.emit)).toEqual(["REAL.DOWN"]);
      expect([d.emit[0]!.x, d.emit[0]!.y]).toEqual([500, 60]);
      expect(d.skip).toBe(true);
      const u = m.step(ev({ type: "UP", button: btn, buttons: 0, x: 503, y: 61, space: true }));
      expect(tag(u.emit)).toEqual(["REAL.UP", "SECOND.UP"]);
      expect([u.emit[0]!.x, u.emit[0]!.y]).toEqual([500, 60]);
      expect(m.isSecondDown).toBe(false);
    });
  }

  it("⭐ the unalign uses Space up too — a click with Space still held is ordinary", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 10, y: 10, space: true, onBody: A }));
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 10, y: 10, space: true }));
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 500, y: 60, space: true, onBody: null }));
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 500, y: 60, space: true }));
    expect(m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 10, y: 10, space: true, onBody: A }))).toEqual({ skip: false, emit: [] });
  });

  it("⭐ Esc still cancels silently", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 10, y: 10, space: true, onBody: A }));
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 10, y: 10, space: true }));
    expect(tag(m.step(ev({ type: "CANCEL" })).emit)).toEqual(["SECOND.UP"]);
  });
});

describe("⭐⭐⭐ `D159` — after a Space-locked click, a PLAIN click (left or right) completes the action", () => {
  // > *"following a click locked by space key … a simple left click or right click is sufficient to complete
  // > the action (no need hold Space key or to press Space key again). Therefore the second simple click can
  // > align the object, un-align the follower, etc."* — the owner, 2026-09-29
  const A = { id: "A", frozen: false };
  const B = { id: "B", frozen: false };
  const latch = (m: MouseSecondTouch) => {
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 10, y: 10, space: true, onBody: A }));
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 10, y: 10, space: false }));
  };
  for (const [name, btn, bit] of [["left", LEFT, L], ["right", RIGHT, R]] as const) {
    it(`⭐⭐ a plain ${name} click on ANOTHER body aligns; on EMPTY space unaligns — no Space`, () => {
      const m = new MouseSecondTouch();
      latch(m);
      expect(tag(m.step(ev({ type: "DOWN", button: btn, buttons: bit, x: 90, y: 90, onBody: B })).emit)).toEqual(["REAL.DOWN"]);
      expect(tag(m.step(ev({ type: "UP", button: btn, buttons: 0, x: 90, y: 90 })).emit)).toEqual(["REAL.UP", "SECOND.UP"]);
      const n = new MouseSecondTouch();
      latch(n);
      expect(tag(n.step(ev({ type: "DOWN", button: btn, buttons: bit, x: 700, y: 500, onBody: null })).emit)).toEqual(["REAL.DOWN"]);
      expect(tag(n.step(ev({ type: "UP", button: btn, buttons: 0, x: 700, y: 500 })).emit)).toEqual(["REAL.UP", "SECOND.UP"]);
    });
  }

  it("⭐ a Space FREEZE, then a plain click on another body — the same", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 50, y: 50 }));
    m.step(ev({ type: "MOVE", buttons: L, x: 60, y: 50 }));
    m.step(ev({ type: "SPACE", space: true, x: 300, y: 200, onBody: A }));
    m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 60, y: 50 }));
    expect(tag(m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 90, y: 90, onBody: B })).emit)).toEqual(["REAL.DOWN"]);
  });

  it("⛔ with NOTHING latched a plain click is untouched — no Space, no latch", () => {
    const m = new MouseSecondTouch();
    expect(m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 5, y: 5, onBody: A }))).toEqual({ skip: false, emit: [] });
  });
});

describe("⭐⭐ `D160` — with a HitFace latched, a click on the SAME part cancels it", () => {
  // > *"on the same part it cancels the HitFace and does not increase the episode count (the episode count
  // > shall be driven by the undelying ongoing action)"* — the owner, 2026-09-29
  const A = { id: "A", frozen: false };
  for (const [name, btn, bit] of [["left", LEFT, L], ["right", RIGHT, R]] as const) {
    it(`⭐ a plain ${name} click on the same part: the HitFace lifts, the click is swallowed whole`, () => {
      const m = new MouseSecondTouch();
      m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 10, y: 10, space: true, onBody: A }));
      m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 10, y: 10 }));
      // ⛔ RED against `D154`: the HitFace was re-pressed on the new face.
      const d = m.step(ev({ type: "DOWN", button: btn, buttons: bit, x: 12, y: 11, onBody: A }));
      expect(tag(d.emit)).toEqual(["SECOND.UP"]);
      expect([d.emit[0]!.x, d.emit[0]!.y]).toEqual([10, 10]); // lifted where it pressed
      expect(d.skip).toBe(true);
      expect(m.step(ev({ type: "UP", button: btn, buttons: 0, x: 12, y: 11 }))).toEqual({ skip: true, emit: [] });
      expect(m.isSecondDown).toBe(false);
    });
  }
});

describe("⭐⭐⭐ `D161` — a RIGHT press released unused on a part LATCHES the HitFace", () => {
  // > *"currently, right click on an object triggers the hitface but when the right click is released, the
  // > hitface cancels: make it a latch with episode counting once the action is completed (similar to the
  // > space key)"* — the owner, 2026-09-29
  const A = { id: "A", frozen: false };
  const B = { id: "B", frozen: false };

  it("⭐⭐ right click + release on a part: the HitFace STAYS; a plain click on another part aligns", () => {
    const m = new MouseSecondTouch();
    expect(tag(m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 10, y: 10, onBody: A })).emit)).toEqual(["SECOND.DOWN"]);
    // ⛔ RED against the build before: the release lifted it (`SECOND.UP`).
    expect(m.step(ev({ type: "UP", button: RIGHT, buttons: 0, x: 10, y: 10 }))).toEqual({ skip: true, emit: [] });
    expect(m.isSecondDown).toBe(true);
    expect(tag(m.step(ev({ type: "DOWN", button: LEFT, buttons: L, x: 90, y: 90, onBody: B })).emit)).toEqual(["REAL.DOWN"]);
    expect(tag(m.step(ev({ type: "UP", button: LEFT, buttons: 0, x: 90, y: 90 })).emit)).toEqual(["REAL.UP", "SECOND.UP"]);
  });

  it("⭐ latched by the right button: empty space unaligns, the same part cancels, Esc cancels", () => {
    const latch = () => {
      const m = new MouseSecondTouch();
      m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 10, y: 10, onBody: A }));
      m.step(ev({ type: "UP", button: RIGHT, buttons: 0, x: 10, y: 10 }));
      return m;
    };
    expect(tag(latch().step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 700, y: 500, onBody: null })).emit)).toEqual(["REAL.DOWN"]);
    expect(tag(latch().step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 11, y: 11, onBody: A })).emit)).toEqual(["SECOND.UP"]);
    expect(tag(latch().step(ev({ type: "CANCEL" })).emit)).toEqual(["SECOND.UP"]);
  });

  it("⛔⛔ USED while held — right hold + left click, or a left drag that steers — the release LIFTS, as before", () => {
    const m = new MouseSecondTouch();
    m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 10, y: 10, onBody: A }));
    expect(m.step(ev({ type: "DOWN", button: LEFT, buttons: L | R, x: 90, y: 90, onBody: B }))).toEqual({ skip: false, emit: [] });
    m.step(ev({ type: "MOVE", buttons: L | R, x: 120, y: 95 }));
    m.step(ev({ type: "UP", button: LEFT, buttons: R, x: 120, y: 95 }));
    expect(tag(m.step(ev({ type: "UP", button: RIGHT, buttons: 0, x: 120, y: 95 })).emit)).toEqual(["SECOND.UP"]);
    expect(m.isSecondDown).toBe(false);
  });

  it("⛔ a right press on EMPTY space or a FROZEN body does not latch — it lifts on release", () => {
    for (const on of [null, { id: "plate", frozen: true }]) {
      const m = new MouseSecondTouch();
      m.step(ev({ type: "DOWN", button: RIGHT, buttons: R, x: 10, y: 10, onBody: on }));
      expect(tag(m.step(ev({ type: "UP", button: RIGHT, buttons: 0, x: 10, y: 10 })).emit)).toEqual(["SECOND.UP"]);
    }
  });
});
