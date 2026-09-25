/**
 * ⭐⭐⭐ **A MOUSE, AS TWO TOUCHPOINTS** — the owner, 2026-09-25: *"If I want to display the game on
 * desktop, what inputs do I need to wire… propose a mapping which is user friendly."*
 *
 * ## ⛔⛔ THIS IS A TRANSLATION, NOT A SECOND INPUT PATH
 *
 * ⭐⭐ **NOT ONE GESTURE RULE LIVES HERE.** This module answers exactly one question — *which
 * touchpoints does this mouse event stand for* — and hands the answer to the **same** router,
 * recogniser and rules a finger drives. ⛔ A desktop branch inside those rules would be a second
 * implementation of the input model, which is the shape `D40` deleted two whole forks to avoid.
 *
 * ⚠ It is also why the module is **removable**: delete its two lines in `render/desktop_input.ts`
 * and the product is exactly what it was, because nothing downstream knows it exists.
 *
 * ## ⛔⛔⛔ THE FIRST BUILD REPLACED A STREAM THAT ALREADY WORKED, AND BROKE IT
 *
 * ⚠⚠ **A MOUSE WAS ALREADY TOUCHPOINT #1.** Nothing filters on `pointerType`, so at `6a28e62` a
 * left-drag translated and rotated a body correctly — and the first version of this module
 * intercepted **every** mouse event and replaced it with a synthetic one. ⛔ The owner: *"in the
 * current commit, everything is almost frozen — the camera orbits by one increment as if delta
 * does not accumulate, no rotation or translation."* ⭐ A gap analysis against that commit named
 * the cause in one line: this layer is the **only** functional change between them.
 *
 * ⭐⭐⭐ **SO THE RULE IS NOW *PASS THROUGH BY DEFAULT, INTERCEPT BY EXCEPTION*.** The real mouse
 * stream is left exactly as it was, and the only events this module takes are the ones that stand
 * for the touchpoint a mouse does **not** have. ⚠ The blast radius of a layer is the set of events
 * it swallows, and the first build's was *all of them* to add *one*.
 *
 * ## ⭐⭐⭐ THE MAPPING, AND WHY THE RIGHT BUTTON RATHER THAN A MODIFIER
 *
 * | input | touchpoint | intercepted? |
 * |---|---|---|
 * | **LMB** down / drag / up | #1 — the browser's own mouse pointer, untouched | ⭐ **no** |
 * | **RMB** down / up | #2 — the alignment press (`D87`) | ⛔ yes |
 * | **Shift** + drag | moves #2 instead of #1 — depth and roll | ⛔ yes, only while held |
 * | **wheel** | two `OUTSIDE` pointers symmetric about the cursor, separation scaled | ⛔ yes |
 * | **CANCEL** (Esc, blur) | lifts every SYNTHETIC pointer | — |
 *
 * ⛔⛔ **THE RIGHT BUTTON DOES NOTHING UNLESS THE LEFT IS ALREADY DOWN.** A second touchpoint with
 * no first one has no relation to make (`D87`), and it would latch a role on the body it hit —
 * leaving it held by a finger the cursor never drives.
 *
 * ⚠ **#2 PARKS UNLESS SHIFT IS HELD**, so an ordinary drag with both buttons down moves the held
 * body and nothing else. ⭐ Parking is exact rather than approximate: `A11` made §1.1 a POSITION
 * deadband, so a still pointer emits **nothing at all**, and `D43` says the channels SUM.
 *
 * ⛔⛔ **TWO MOUSE BUTTONS ARE GENUINELY INDEPENDENT AND A MODIFIER IS NOT.** `Shift`+LMB cannot
 * hold two pointers down at once — pressing it requires LMB to be **up**, so touchpoint #1 has
 * already lifted — and touchpoint #1 staying down while #2 presses is the whole of the alignment
 * gesture. ⚠ Making `Shift`+LMB a *latch* instead buys that back and loses `D39`'s undo, because a
 * latched pointer's down and up are seconds apart and the recogniser will not call it a TAP.
 *
 * ## ⭐⭐ WHY PARKING IS FAITHFUL AND NOT A COMPROMISE
 *
 * One cursor cannot move two pointers, so the one it is not driving stays where it was. ⭐ That is
 * exact rather than approximate: `A11` made §1.1 a **position deadband**, so a still pointer emits
 * **nothing at all** — and `D43` says the channels SUM. A zero summand is the same rule. ⚠ What a
 * desktop hand cannot do is move both at once, which is a subset of what a pair of fingers can do,
 * not a different behaviour.
 *
 * ## ⛔ THE WHEEL SYNTHESISES A REAL PINCH
 *
 * Rule 4 is *a ratio of separations*, so the wheel moves two touchpoints apart rather than setting
 * a camera radius. ⚠ A direct radius would be a **second implementation of zoom** — defect 66's
 * shape, which cost a whole suite staying green over a changed product.
 *
 * ⛔ ENGINE-FREE and DOM-free: it takes plain numbers and returns plain records.
 */

/**
 * ⚠ Well clear of any real `pointerId`. ⛔ Browsers hand out small integers for touches and mice,
 * and a collision would let a synthetic pointer inherit a real one's latched role.
 */
export const DESKTOP_IDS = {
  first: 9001,
  second: 9002,
  pinchA: 9101,
  pinchB: 9102,
} as const;

/** ⚠ Half the starting separation of the synthetic pinch, in CSS pixels. */
export const PINCH_HALF_PX = 120;
/** ⭐ One wheel notch is a fixed RATIO, because rule 4 reads a ratio. */
export const PINCH_NOTCH_RATIO = 1.12;
/**
 * ⚠ How long after the last notch the synthetic fingers lift.
 *
 * ⛔ Long enough that a scroll wheel's gaps do not end the gesture mid-zoom, short enough that the
 * pair does not sit on the glass as two live `OUTSIDE` touchpoints and change what the next press
 * means. ⭐ A guess, and the only number here that is one.
 */
export const PINCH_IDLE_MS = 180;

export type DesktopEventType = "DOWN" | "MOVE" | "UP" | "WHEEL" | "CANCEL" | "TICK";

export interface DesktopEvent {
  readonly type: DesktopEventType;
  readonly t: number;
  readonly x: number;
  readonly y: number;
  /** ⚠ DOM numbering: `0` left, `2` right. Anything else is ignored rather than guessed at. */
  readonly button?: number;
  readonly shift?: boolean;
  /** ⭐ Signed notches. POSITIVE zooms IN, so the caller negates `deltaY`. */
  readonly wheel?: number;
  /**
   * ⭐⭐⭐ **THE BROWSER'S OWN BITMASK OF BUTTONS DOWN, AFTER THIS EVENT** — `PointerEvent.buttons`:
   * bit 1 = left, bit 2 = right, bit 4 = middle.
   *
   * ⛔⛔⛔ **THIS REPLACES A LATCH, AND THE LATCH WAS THE DEFECT.** The adapter used to remember
   * *is the left button down* from the downs and ups it had seen — and a `pointerup` the window
   * never sees (released off the page) or a `pointercancel` (whose `button` is `-1`) left it
   * stuck, so the NEXT press was judged against a hand that no longer existed. ⚠ The owner,
   * 2026-09-25: *"some mouse clicks and delta position land, some mouse clicks and delta position
   * do not."* ⭐ `METHOD`: *a substituted quantity* — a memory of the buttons stood in for the
   * buttons, and the two agree only while no event is missed.
   *
   * ⭐⭐ The browser maintains this mask itself, on every event, from the OS. It cannot go stale
   * the way a latch can, and it is what every decision below reads.
   */
  readonly buttons?: number;
}

export interface SyntheticAction {
  readonly kind: "DOWN" | "MOVE" | "UP";
  readonly id: number;
  readonly x: number;
  readonly y: number;
}

export interface DesktopVerdict {
  readonly actions: readonly SyntheticAction[];
  /**
   * ⛔⛔ **TRUE = SWALLOW THE REAL EVENT.** ⚠ The one field that decides this layer's blast
   * radius: everything it does not suppress reaches the rules exactly as it did before the layer
   * existed. ⭐ `false` is the default and the safe answer, which is the lesson of the build that
   * suppressed everything and froze the product.
   */
  readonly suppress: boolean;
}

const PASS: DesktopVerdict = { actions: [], suppress: false };

/**
 * ⭐⭐ **THE STATE MACHINE — AND IT OWNS ONLY WHAT THE MOUSE LACKS.** ⛔ Touchpoint #1 is the
 * browser's own pointer and is not modelled here at all: modelling it is what broke it.
 */
export class DesktopPointers {
  /** Where the SECOND touchpoint is parked, or `null` when it is up. */
  private second: { x: number; y: number } | null = null;
  private pinch: { x: number; y: number; half: number; t: number } | null = null;

  /** ⚠ Diagnostics only — SYNTHETIC pointers down. The real one is the browser's to count. */
  get downCount(): number {
    return (this.second === null ? 0 : 1) + (this.pinch === null ? 0 : 2);
  }

  step(ev: DesktopEvent): DesktopVerdict {
    switch (ev.type) {
      case "DOWN":
        return this.onDown(ev);
      case "MOVE":
        return this.onMove(ev);
      case "UP":
        return this.onUp(ev);
      case "WHEEL":
        return this.onWheel(ev);
      case "TICK": {
        const actions = this.closePinchIfIdle(ev.t);
        return actions.length === 0 ? PASS : { actions, suppress: false };
      }
      case "CANCEL": {
        const actions = this.cancel();
        return actions.length === 0 ? PASS : { actions, suppress: false };
      }
    }
  }

  /** ⚠ Bit 1 of `buttons`: is the left button — touchpoint #1 — down right now? */
  private static leftHeld(ev: DesktopEvent): boolean {
    return ((ev.buttons ?? 0) & 1) !== 0;
  }

  /**
   * ⭐⭐ **RECONCILE THE SYNTHETIC STATE AGAINST THE BROWSER'S MASK.** ⛔ If the right button is
   * up in `buttons` and #2 is still down here, its release was never seen — off the page, or a
   * cancel. ⚠ Lifted at once, or the next right press is refused as a repeat and every event in
   * between is judged against a finger that is not there.
   */
  private reconcile(ev: DesktopEvent, out: SyntheticAction[]): void {
    if (ev.buttons === undefined || this.second === null) return;
    if ((ev.buttons & 2) !== 0) return;
    out.push({ kind: "UP", id: DESKTOP_IDS.second, x: this.second.x, y: this.second.y });
    this.second = null;
  }

  private onDown(ev: DesktopEvent): DesktopVerdict {
    // ⛔⛔ **ANY PRESS ENDS A ZOOM — not only the right button's.** ⚠ The synthetic pair lifts on a
    // clock, and a LEFT press inside that window (180 ms, longer under inertial scrolling) used to
    // arrive as a THIRD touchpoint beside two `OUTSIDE` ones — a configuration §4 has no row for.
    // ⭐ Emitted BEFORE the real press reaches Babylon: this runs in the capture phase, so the
    // scene sees the pair lift, then the press.
    const actions = this.closePinch();
    this.reconcile(ev, actions);
    // ⭐⭐⭐ **THE LEFT BUTTON IS NOT OURS.** It already drives touchpoint #1 through the
    // browser's own pointer, and it did so correctly before this file existed.
    if (ev.button !== 2) return { actions, suppress: false };
    // ⛔⛔ **REFUSED WITH NOTHING HELD — but still SWALLOWED.** ⚠ Letting it through would hand
    // Babylon a press on the mouse's own pointer id, which is touchpoint #1 arriving by the wrong
    // button. ⭐ Read off `buttons`, never remembered: a memory of the left button is exactly
    // what went stale.
    if (!DesktopPointers.leftHeld(ev)) return { actions, suppress: true };
    if (this.second !== null) return { actions, suppress: true };
    this.second = { x: ev.x, y: ev.y };
    actions.push({ kind: "DOWN", id: DESKTOP_IDS.second, x: ev.x, y: ev.y });
    return { actions, suppress: true };
  }

  private onMove(ev: DesktopEvent): DesktopVerdict {
    const actions: SyntheticAction[] = [];
    this.reconcile(ev, actions);
    // ⭐⭐ **SHIFT IS THE ONLY THING THAT TAKES A MOVE FROM THE REAL POINTER**, and only while the
    // second touchpoint is actually down. ⚠ Otherwise the cursor drives #1, exactly as it always
    // has — including while #2 is parked, which is what makes a two-finger hold feel ordinary.
    if (ev.shift !== true || this.second === null)
      return actions.length === 0 ? PASS : { actions, suppress: false };
    this.second.x = ev.x;
    this.second.y = ev.y;
    actions.push({ kind: "MOVE", id: DESKTOP_IDS.second, x: ev.x, y: ev.y });
    return { actions, suppress: true };
  }

  private onUp(ev: DesktopEvent): DesktopVerdict {
    if (ev.button !== 2) {
      // ⭐ The left button's release, or a `pointercancel` (whose `button` is `-1`): the browser's
      // business, and it must reach Babylon or the real pointer is never released. ⚠ Anything the
      // mask says is gone is lifted alongside — which is how a cancel takes #2 with it.
      const actions: SyntheticAction[] = [];
      this.reconcile(ev, actions);
      return actions.length === 0 ? PASS : { actions, suppress: false };
    }
    const p = this.second;
    // ⚠ Suppressed even with nothing to lift: its DOWN was swallowed, so letting the UP through
    // would hand the rules a release for a press they never saw.
    if (p === null) return { actions: [], suppress: true };
    this.second = null;
    // ⛔⛔ **REPORTED WHERE THAT POINTER WAS, NOT WHERE THE CURSOR IS.** A parked pointer's last
    // position is its own; using the cursor would teleport it on release, and `A11`'s deadband
    // would read one enormous step — a flick, or a translation the hand never made.
    return {
      actions: [{ kind: "UP", id: DESKTOP_IDS.second, x: p.x, y: p.y }],
      suppress: true,
    };
  }

  private onWheel(ev: DesktopEvent): DesktopVerdict {
    const notches = ev.wheel ?? 0;
    if (!Number.isFinite(notches) || notches === 0) return PASS;
    const actions: SyntheticAction[] = [];
    if (this.pinch === null) {
      // ⭐ ANCHORED where the wheel started, so a cursor that drifts mid-zoom does not drag the
      // pair across the scene and turn a zoom into an orbit.
      this.pinch = { x: ev.x, y: ev.y, half: PINCH_HALF_PX, t: ev.t };
      actions.push(
        { kind: "DOWN", id: DESKTOP_IDS.pinchA, x: ev.x - PINCH_HALF_PX, y: ev.y },
        { kind: "DOWN", id: DESKTOP_IDS.pinchB, x: ev.x + PINCH_HALF_PX, y: ev.y },
      );
    }
    const p = this.pinch;
    p.half = Math.max(8, p.half * Math.pow(PINCH_NOTCH_RATIO, notches));
    p.t = ev.t;
    actions.push(
      { kind: "MOVE", id: DESKTOP_IDS.pinchA, x: p.x - p.half, y: p.y },
      { kind: "MOVE", id: DESKTOP_IDS.pinchB, x: p.x + p.half, y: p.y },
    );
    return { actions, suppress: true };
  }

  private closePinchIfIdle(t: number): SyntheticAction[] {
    if (this.pinch === null || t - this.pinch.t < PINCH_IDLE_MS) return [];
    return this.closePinch();
  }

  private closePinch(): SyntheticAction[] {
    const p = this.pinch;
    if (p === null) return [];
    this.pinch = null;
    return [
      { kind: "UP", id: DESKTOP_IDS.pinchA, x: p.x - p.half, y: p.y },
      { kind: "UP", id: DESKTOP_IDS.pinchB, x: p.x + p.half, y: p.y },
    ];
  }

  /**
   * ⭐⭐ **EVERY SYNTHETIC POINTER UP** — Esc, a lost window, a pointer the browser cancelled.
   *
   * ⛔ It cannot lift touchpoint #1, which belongs to the browser. ⚠ That is the honest limit of a
   * layer that passes through by default, and it is the right trade: the real pointer is the one
   * the browser will clean up on its own.
   */
  private cancel(): SyntheticAction[] {
    const out = this.closePinch();
    const p = this.second;
    if (p !== null) {
      this.second = null;
      out.push({ kind: "UP", id: DESKTOP_IDS.second, x: p.x, y: p.y });
    }
    return out;
  }
}
