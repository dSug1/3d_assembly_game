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
 * ## ⭐⭐⭐ THE MAPPING, AND WHY THE RIGHT BUTTON RATHER THAN A MODIFIER
 *
 * | input | touchpoint |
 * |---|---|
 * | **LMB** down / drag / up | #1 — hold, translate, orbit, tap, double-tap, flick, shake |
 * | **RMB** down / drag / up | #2 — the alignment press (`D87`), depth, roll |
 * | cursor | drives the **most recently pressed** pointer; the other PARKS |
 * | **Shift** | flips which pointer the cursor drives |
 * | **wheel** | two `OUTSIDE` pointers symmetric about the cursor, separation scaled |
 * | **CANCEL** (Esc, blur) | lifts everything |
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
}

export interface SyntheticAction {
  readonly kind: "DOWN" | "MOVE" | "UP";
  readonly id: number;
  readonly x: number;
  readonly y: number;
}

type Slot = 1 | 2;

/**
 * ⭐⭐ **THE WHOLE STATE MACHINE.** ⛔ It is a class rather than a function because *which pointer
 * the cursor drives* is a latch, and `IN2`'s lesson is that a latch must be held in one place and
 * read, never inferred from where the cursor is now.
 */
export class DesktopPointers {
  private readonly at = new Map<Slot, { x: number; y: number }>();
  private driven: Slot = 1;
  private pinch: { x: number; y: number; half: number; t: number } | null = null;

  /** ⚠ Diagnostics only — what the HUD would print if it printed this. */
  get downCount(): number {
    return this.at.size + (this.pinch === null ? 0 : 2);
  }

  step(ev: DesktopEvent): SyntheticAction[] {
    switch (ev.type) {
      case "DOWN":
        return this.onDown(ev);
      case "MOVE":
        return this.onMove(ev);
      case "UP":
        return this.onUp(ev);
      case "WHEEL":
        return this.onWheel(ev);
      case "TICK":
        return this.closePinchIfIdle(ev.t);
      case "CANCEL":
        return this.cancel();
    }
  }

  private static slotOf(button: number | undefined): Slot | null {
    if (button === 0) return 1;
    if (button === 2) return 2;
    return null;
  }

  private static idOf(slot: Slot): number {
    return slot === 1 ? DESKTOP_IDS.first : DESKTOP_IDS.second;
  }

  private onDown(ev: DesktopEvent): SyntheticAction[] {
    const slot = DesktopPointers.slotOf(ev.button);
    if (slot === null || this.at.has(slot)) return [];
    // ⛔ A press ends a zoom. ⚠ Otherwise the two synthetic `OUTSIDE` fingers would still be down
    // and §4's role table would read three touchpoints, which is a configuration the hand never
    // made.
    const out = this.closePinch();
    this.at.set(slot, { x: ev.x, y: ev.y });
    this.driven = slot;
    out.push({ kind: "DOWN", id: DesktopPointers.idOf(slot), x: ev.x, y: ev.y });
    return out;
  }

  private onMove(ev: DesktopEvent): SyntheticAction[] {
    const other: Slot = this.driven === 1 ? 2 : 1;
    // ⚠ Shift flips, but only onto a pointer that is actually down: otherwise holding Shift with
    // one button would silently freeze the cursor, which reads as the product having hung.
    let target: Slot = ev.shift === true && this.at.has(other) ? other : this.driven;
    if (!this.at.has(target)) target = other;
    const p = this.at.get(target);
    // ⭐⭐ **HOVER IS NOT A GESTURE, AND THIS IS THE LINE THAT SAYS SO.** A mouse moves with no
    // button down and a finger cannot, so it is the one event type touch never produces — feeding
    // it would make every journey across the glass a drag.
    // ⚠ There was an `at.size === 0` early return above as well; a mutant deleting it left the
    // output identical, because this check already covers it. ⛔ *A branch no vector can enter is
    // the dormant-fork shape*, so it went rather than being kept as a comment with a body.
    if (p === undefined) return [];
    p.x = ev.x;
    p.y = ev.y;
    return [{ kind: "MOVE", id: DesktopPointers.idOf(target), x: ev.x, y: ev.y }];
  }

  private onUp(ev: DesktopEvent): SyntheticAction[] {
    const slot = DesktopPointers.slotOf(ev.button);
    if (slot === null) return [];
    const p = this.at.get(slot);
    if (p === undefined) return [];
    this.at.delete(slot);
    // ⛔⛔ **THE LIFT IS REPORTED WHERE THAT POINTER WAS, NOT WHERE THE CURSOR IS.** A parked
    // pointer's last position is its own; using the cursor would teleport it on release, and
    // `A11`'s deadband would read that as a single enormous step.
    const out: SyntheticAction[] = [
      { kind: "UP", id: DesktopPointers.idOf(slot), x: p.x, y: p.y },
    ];
    const other: Slot = slot === 1 ? 2 : 1;
    if (this.at.has(other)) this.driven = other;
    return out;
  }

  private onWheel(ev: DesktopEvent): SyntheticAction[] {
    const notches = ev.wheel ?? 0;
    if (!Number.isFinite(notches) || notches === 0) return [];
    const out: SyntheticAction[] = [];
    if (this.pinch === null) {
      // ⭐ ANCHORED where the wheel started, so a cursor that drifts mid-zoom does not drag the
      // pair across the scene and turn a zoom into an orbit.
      this.pinch = { x: ev.x, y: ev.y, half: PINCH_HALF_PX, t: ev.t };
      out.push(
        { kind: "DOWN", id: DESKTOP_IDS.pinchA, x: ev.x - PINCH_HALF_PX, y: ev.y },
        { kind: "DOWN", id: DESKTOP_IDS.pinchB, x: ev.x + PINCH_HALF_PX, y: ev.y },
      );
    }
    const p = this.pinch;
    p.half = Math.max(8, p.half * Math.pow(PINCH_NOTCH_RATIO, notches));
    p.t = ev.t;
    out.push(
      { kind: "MOVE", id: DESKTOP_IDS.pinchA, x: p.x - p.half, y: p.y },
      { kind: "MOVE", id: DESKTOP_IDS.pinchB, x: p.x + p.half, y: p.y },
    );
    return out;
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
   * ⭐⭐ **EVERYTHING UP** — Esc, a lost window, a pointer the browser cancelled.
   *
   * ⛔ `IN2` records an open risk that a **stale grip** kills orbit and zoom together with no way
   * back but a reload. ⚠ A mouse makes that easier to reach than a finger does, because a button
   * released outside the window never reports. ⭐ So the panic key is part of the mapping, not an
   * afterthought.
   */
  private cancel(): SyntheticAction[] {
    const out = this.closePinch();
    for (const slot of [1, 2] as const) {
      const p = this.at.get(slot);
      if (p === undefined) continue;
      this.at.delete(slot);
      out.push({ kind: "UP", id: DesktopPointers.idOf(slot), x: p.x, y: p.y });
    }
    this.driven = 1;
    return out;
  }
}
