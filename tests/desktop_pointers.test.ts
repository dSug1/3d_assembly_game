/**
 * GOLDEN VECTORS — **A MOUSE, AS THE TOUCHPOINT IT LACKS** (the owner, 2026-09-25).
 *
 * ⛔⛔⛔ **THE MOST IMPORTANT ASSERTIONS HERE ARE THE ONES ABOUT `suppress`.** The first build of
 * this module intercepted every mouse event and replaced it with a synthetic one — and a mouse was
 * **already** touchpoint #1, so it froze a stream that worked: *"everything is almost frozen — the
 * camera orbits by one increment as if delta does not accumulate, no rotation or translation."*
 * ⭐ A gap analysis against `6a28e62` named it in one line: this layer was the only functional
 * change between the two commits.
 *
 * ⚠⚠ So the vectors below pin the **blast radius**, not just the output: every event the layer does
 * NOT suppress reaches the rules exactly as it did before the layer existed. ⭐ *The blast radius
 * of a layer is the set of events it swallows.*
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

describe("⭐⭐⭐ THE LEFT BUTTON IS NOT OURS — the regression, as vectors", () => {
  it("⛔⛔⛔ NOT ONE LEFT-BUTTON EVENT IS SUPPRESSED, AND NONE PRODUCES AN ACTION", () => {
    // ⚠⚠ THE VECTOR THE WHOLE REDESIGN TURNS ON, and it is RED against the build that shipped:
    // a mouse already drives touchpoint #1 through the browser's own pointer, and it did so
    // correctly before this file existed. ⛔ Modelling it is what broke it.
    const d = new DesktopPointers();
    for (const ev of [
      { type: "DOWN", t: 0, x: 10, y: 10, button: LEFT },
      { type: "MOVE", t: 1, x: 20, y: 30 },
      { type: "MOVE", t: 2, x: 40, y: 60 },
      { type: "UP", t: 3, x: 40, y: 60, button: LEFT },
    ] as const) {
      const v = d.step(ev);
      expect(v.suppress).toBe(false);
      expect(v.actions).toEqual([]);
    }
  });

  it("⭐⭐ AND A DRAG STILL PASSES THROUGH WHILE THE SECOND TOUCHPOINT IS DOWN", () => {
    // ⭐ This is what makes a two-finger hold feel ordinary on a mouse: the cursor keeps driving
    // the held body, and #2 simply parks. ⚠ RED against *the most recently pressed pointer wins*,
    // which is what the first build did — and which takes the move away from #1.
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 0, y: 0, button: RIGHT, primaryDown: true });
    const v = d.step({ type: "MOVE", t: 1, x: 99, y: 99 });
    expect(v.suppress).toBe(false);
    expect(v.actions).toEqual([]);
  });
});

describe("⭐⭐⭐ the right button is the second touchpoint", () => {
  it("⛔⛔⛔ AND IT DOES NOTHING WITH NOTHING HELD — the owner's report, as a vector", () => {
    // > *"right button press just hits face and does nothing more than highlight the face contours
    // > in fuchsia. No movement, no selection."* — the owner, 2026-09-25
    //
    // ⭐⭐ THE FUCHSIA CONTOUR IS THE **HELD** BODY'S HitFace, so seeing it on the face the right
    // button hit says that press became a **HOLDER** — a second touchpoint with no first one.
    // ⛔ `D87` gives it no relation to make, and it latches a role on the body it hit, leaving it
    // carried by a finger the cursor never drives: held, and unmovable.
    //
    // ⚠ SWALLOWED ALL THE SAME: letting it through would hand Babylon a press on the mouse's own
    // pointer id, which is touchpoint #1 arriving by the wrong button.
    const d = new DesktopPointers();
    const v = d.step({ type: "DOWN", t: 0, x: 5, y: 5, button: RIGHT });
    expect(v.actions).toEqual([]);
    expect(v.suppress).toBe(true);
    expect(d.downCount).toBe(0);
    // ⭐ And with the left button down it is the second touchpoint, as it always should have been.
    const held = d.step({
      type: "DOWN",
      t: 1,
      x: 5,
      y: 5,
      button: RIGHT,
      primaryDown: true,
    });
    expect(ids(held.actions)).toEqual([`DOWN${DESKTOP_IDS.second}`]);
  });

  it("⭐ its press and release are swallowed and stand in for #2", () => {
    const d = new DesktopPointers();
    const down = d.step({ type: "DOWN", t: 0, x: 50, y: 60, button: RIGHT, primaryDown: true });
    expect(down.suppress).toBe(true);
    expect(down.actions).toEqual([
      { kind: "DOWN", id: DESKTOP_IDS.second, x: 50, y: 60 },
    ]);
    const up = d.step({ type: "UP", t: 1, x: 50, y: 60, button: RIGHT });
    expect(up.suppress).toBe(true);
    expect(ids(up.actions)).toEqual([`UP${DESKTOP_IDS.second}`]);
  });

  it("⛔⛔ A RELEASE IS SUPPRESSED EVEN WITH NOTHING TO LIFT", () => {
    // ⚠ Its DOWN was swallowed, so letting the UP through would hand the rules a release for a
    // press they never saw — and `IN2` latches a role at press for the touchpoint's lifetime.
    const d = new DesktopPointers();
    const v = d.step({ type: "UP", t: 0, x: 0, y: 0, button: RIGHT });
    expect(v.suppress).toBe(true);
    expect(v.actions).toEqual([]);
  });

  it("⛔ a repeated press emits nothing but is still swallowed", () => {
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 0, y: 0, button: RIGHT, primaryDown: true });
    const v = d.step({ type: "DOWN", t: 1, x: 9, y: 9, button: RIGHT, primaryDown: true });
    expect(v.actions).toEqual([]);
    expect(v.suppress).toBe(true);
  });

  it("⛔ the MIDDLE button is left alone entirely — it was before this file existed", () => {
    const d = new DesktopPointers();
    expect(d.step({ type: "DOWN", t: 0, x: 0, y: 0, button: 1 })).toEqual({
      actions: [],
      suppress: false,
    });
  });
});

describe("⭐⭐ SHIFT is the only thing that takes a move from the real pointer", () => {
  it("⭐⭐⭐ WITH SHIFT AND #2 DOWN, THE MOVE IS #2's", () => {
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 50, y: 50, button: RIGHT, primaryDown: true });
    const v = d.step({ type: "MOVE", t: 1, x: 55, y: 70, shift: true });
    expect(v.suppress).toBe(true);
    expect(v.actions).toEqual([
      { kind: "MOVE", id: DESKTOP_IDS.second, x: 55, y: 70 },
    ]);
  });

  it("⛔⛔ SHIFT WITH NO SECOND TOUCHPOINT CHANGES NOTHING", () => {
    // ⚠⚠ RED against suppressing on the modifier alone, which would make Shift freeze an ordinary
    // drag — and a frozen cursor is indistinguishable from the product having hung, which is the
    // report this whole redesign came from.
    const d = new DesktopPointers();
    const v = d.step({ type: "MOVE", t: 0, x: 9, y: 9, shift: true });
    expect(v.suppress).toBe(false);
    expect(v.actions).toEqual([]);
  });

  it("⭐ releasing Shift hands the cursor straight back to #1", () => {
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 50, y: 50, button: RIGHT, primaryDown: true });
    d.step({ type: "MOVE", t: 1, x: 60, y: 60, shift: true });
    expect(d.step({ type: "MOVE", t: 2, x: 70, y: 70 }).suppress).toBe(false);
  });

  it("⛔⛔ AND #2's LIFT IS REPORTED WHERE SHIFT LEFT IT, NOT WHERE THE CURSOR IS", () => {
    // ⚠ A parked pointer's last position is its own. ⛔ RED against using the event's coordinates:
    // the release would teleport it, and `A11`'s deadband would read one enormous step.
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 10, y: 10, button: RIGHT, primaryDown: true });
    d.step({ type: "MOVE", t: 1, x: 30, y: 40, shift: true });
    d.step({ type: "MOVE", t: 2, x: 900, y: 900 }); // ⭐ drives #1, must not move #2
    expect(d.step({ type: "UP", t: 3, x: 900, y: 900, button: RIGHT }).actions).toEqual([
      { kind: "UP", id: DESKTOP_IDS.second, x: 30, y: 40 },
    ]);
  });
});

describe("⭐⭐⭐ the wheel is a real pinch, not a camera radius", () => {
  it("⭐⭐ the first notch puts TWO pointers down, symmetric about the cursor", () => {
    // ⛔ Rule 4 is a RATIO OF SEPARATIONS. ⚠ Setting the camera radius instead would be a second
    // implementation of zoom — defect 66's shape.
    const d = new DesktopPointers();
    const v = d.step({ type: "WHEEL", t: 0, x: 400, y: 300, wheel: 1 });
    expect(v.suppress).toBe(true);
    expect(v.actions.filter((a) => a.kind === "DOWN").map((a) => a.x)).toEqual([
      400 - PINCH_HALF_PX,
      400 + PINCH_HALF_PX,
    ]);
    expect(d.downCount).toBe(2);
  });

  it("⭐⭐ ONE NOTCH IS ONE RATIO, and a positive notch zooms IN", () => {
    const d = new DesktopPointers();
    d.step({ type: "WHEEL", t: 0, x: 0, y: 0, wheel: 1 });
    const out = d.step({ type: "WHEEL", t: 10, x: 0, y: 0, wheel: 1 }).actions;
    expect(out.find((a) => a.id === DESKTOP_IDS.pinchB)!.x).toBeCloseTo(
      PINCH_HALF_PX * PINCH_NOTCH_RATIO ** 2,
      6,
    );
    // ⛔ RED against an absolute step, which would make the last notch of a long zoom a different
    // size from the first.
    const back = d.step({ type: "WHEEL", t: 20, x: 0, y: 0, wheel: -2 }).actions;
    expect(back.find((a) => a.id === DESKTOP_IDS.pinchB)!.x).toBeCloseTo(PINCH_HALF_PX, 6);
  });

  it("⛔⛔ IT IS ANCHORED WHERE THE WHEEL STARTED — a drifting cursor must not orbit", () => {
    // ⚠ Two `OUTSIDE` pointers translating together is §2 rule 1's configuration, so a pinch that
    // followed the cursor would turn a zoom into an orbit halfway through.
    const d = new DesktopPointers();
    d.step({ type: "WHEEL", t: 0, x: 100, y: 100, wheel: 1 });
    const out = d.step({ type: "WHEEL", t: 10, x: 800, y: 700, wheel: 1 }).actions;
    expect(out.every((a) => a.y === 100)).toBe(true);
    expect(
      out.find((a) => a.id === DESKTOP_IDS.pinchA)!.x +
        out.find((a) => a.id === DESKTOP_IDS.pinchB)!.x,
    ).toBeCloseTo(200, 6);
  });

  it("⭐ the synthetic fingers LIFT once the wheel goes quiet", () => {
    const d = new DesktopPointers();
    d.step({ type: "WHEEL", t: 0, x: 0, y: 0, wheel: 1 });
    expect(d.step({ type: "TICK", t: PINCH_IDLE_MS - 1, x: 0, y: 0 }).actions).toEqual([]);
    expect(
      ids(d.step({ type: "TICK", t: PINCH_IDLE_MS + 1, x: 0, y: 0 }).actions),
    ).toEqual([`UP${DESKTOP_IDS.pinchA}`, `UP${DESKTOP_IDS.pinchB}`]);
    expect(d.downCount).toBe(0);
  });

  it("⛔ a TICK never suppresses anything — it is not a real event", () => {
    // ⚠ It arrives from the render loop, not from the hand; a `suppress` here would be nonsense
    // and the field is asserted so it cannot drift into meaning something.
    const d = new DesktopPointers();
    d.step({ type: "WHEEL", t: 0, x: 0, y: 0, wheel: 1 });
    expect(d.step({ type: "TICK", t: 9999, x: 0, y: 0 }).suppress).toBe(false);
  });

  it("⛔⛔ A RIGHT PRESS ENDS A ZOOM — three touchpoints is a configuration no hand made", () => {
    const d = new DesktopPointers();
    d.step({ type: "WHEEL", t: 0, x: 0, y: 0, wheel: 1 });
    const v = d.step({ type: "DOWN", t: 10, x: 5, y: 5, button: RIGHT, primaryDown: true });
    expect(ids(v.actions)).toEqual([
      `UP${DESKTOP_IDS.pinchA}`,
      `UP${DESKTOP_IDS.pinchB}`,
      `DOWN${DESKTOP_IDS.second}`,
    ]);
  });

  it("⛔ a zero or non-finite notch does nothing and is NOT swallowed", () => {
    const d = new DesktopPointers();
    expect(d.step({ type: "WHEEL", t: 0, x: 0, y: 0, wheel: 0 })).toEqual({
      actions: [],
      suppress: false,
    });
    expect(d.step({ type: "WHEEL", t: 0, x: 0, y: 0, wheel: Number.NaN }).actions).toEqual([]);
    expect(d.downCount).toBe(0);
  });
});

describe("⭐⭐ CANCEL — every SYNTHETIC pointer up", () => {
  it("⛔⛔ LIFTS #2 AND A LIVE PINCH, and is idempotent", () => {
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 1, x: 2, y: 2, button: RIGHT, primaryDown: true });
    d.step({ type: "WHEEL", t: 2, x: 3, y: 3, wheel: 1 });
    const v = d.step({ type: "CANCEL", t: 3, x: 0, y: 0 });
    expect(v.actions.every((a) => a.kind === "UP")).toBe(true);
    expect(v.actions).toHaveLength(3);
    expect(d.downCount).toBe(0);
    expect(d.step({ type: "CANCEL", t: 4, x: 0, y: 0 }).actions).toEqual([]);
  });

  it("⚠ IT CANNOT LIFT TOUCHPOINT #1, AND THAT IS THE HONEST LIMIT", () => {
    // ⛔ #1 is the browser's own pointer and this layer never took it. ⭐ The right trade: the
    // real pointer is the one the browser cleans up itself.
    const d = new DesktopPointers();
    d.step({ type: "DOWN", t: 0, x: 0, y: 0, button: LEFT });
    expect(d.step({ type: "CANCEL", t: 1, x: 0, y: 0 }).actions).toEqual([]);
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
