/**
 * ⭐⭐⭐ **THE RIGHT MOUSE BUTTON IS THE SECOND TOUCH** — the owner, 2026-09-25: *"Create a desktop
 * version of the input system. The second touch shall be done with right click. Make the build
 * modular. Do not repeat the previous build as it has continuously failed to work. Build from
 * scratch with robust logic."*
 *
 * ## ⛔⛔⛔ WHAT THE PREVIOUS BUILD GOT WRONG, NAMED SO THIS ONE CANNOT
 *
 * Four rounds on the glass, four regressions, and every one was a **premise**, not a bug in a
 * gesture rule: that the desktop did not already work (it did — a mouse was touchpoint #1 with
 * no layer at all); that a synthetic DOM `PointerEvent` would be delivered (Babylon's device
 * layer swallowed it); that a hand presses the left button first; and that a latch remembering
 * the buttons could stand in for the buttons.
 *
 * ⭐⭐ **SO THIS MODULE HAS EXACTLY ONE JOB AND MODELS EXACTLY ONE THING.** It decides what the
 * RIGHT button means, and it models the second touchpoint — nothing else. ⛔ The first touchpoint
 * is the browser's own mouse pointer and is never represented here, because representing it is
 * what broke it.
 *
 * ## ⭐ THE RULES, ALL OF THEM
 *
 * | event | verdict |
 * |---|---|
 * | right button DOWN | #2 presses at the cursor; the real event is **skipped** |
 * | right button UP | #2 lifts **where it was parked**; skipped |
 * | MOVE, #2 down, and (`Shift` held OR the left button is up) | #2 moves; skipped |
 * | MOVE otherwise | untouched — the cursor drives the real pointer |
 * | anything else | untouched |
 *
 * ⛔⛔ **`buttons` IS READ ON EVERY EVENT, AND NOTHING IS REMEMBERED ABOUT THE REAL POINTER.**
 * `PointerEvent.buttons` is the browser's own mask of what is down right now, maintained from the
 * OS. ⚠ The one piece of state here — is #2 down, and where — is **reconciled** against bit 2 on
 * every event: a clear bit while #2 is down means its release was never seen (off the page, or a
 * cancel), and #2 lifts at once.
 *
 * ⭐ **A LONE RIGHT PRESS IS NOT REFUSED.** It is a second touch with no first one — the model has
 * no relation for it (`D87`), but it is a valid press of a pointer, and the cursor drives it while
 * it is the only thing down, so nothing is ever *held by a finger the cursor cannot move*.
 *
 * ⛔ ENGINE-FREE and DOM-free. Plain records in, a plain verdict out.
 */

/** ⚠ Well clear of any real `pointerId`, which browsers hand out as small integers. */
export const MOUSE_SECOND_ID = 9002;

/** ⚠ DOM numbering: `0` left, `1` middle, `2` right, `-1` for a move or a cancel. */
export const RIGHT_BUTTON = 2;
const LEFT_BIT = 1;
const RIGHT_BIT = 2;

export interface MouseInput {
  readonly type: "DOWN" | "MOVE" | "UP" | "CANCEL";
  /** `PointerEvent.button`. Ignored for `MOVE` and `CANCEL`. */
  readonly button: number;
  /** `PointerEvent.buttons` — the browser's mask AFTER this event. */
  readonly buttons: number;
  readonly shift: boolean;
  readonly x: number;
  readonly y: number;
}

/** One synthetic action for touchpoint #2. The id is always `MOUSE_SECOND_ID`. */
export interface SecondTouchAction {
  readonly kind: "DOWN" | "MOVE" | "UP";
  readonly x: number;
  readonly y: number;
}

export interface Verdict {
  /**
   * ⛔ `true` = the REAL event must not reach the scene. ⚠ This is the layer's whole blast radius,
   * and it is `true` only when the right button, or a move that belongs to #2, is standing in for
   * a touchpoint the mouse does not have.
   */
  readonly skip: boolean;
  /** Synthetic actions for #2, to be delivered BEFORE the real event is processed. */
  readonly emit: readonly SecondTouchAction[];
}

const PASS: Verdict = { skip: false, emit: [] };

export class MouseSecondTouch {
  /** Where #2 is parked, or `null` when it is up. The only state. */
  private parked: { x: number; y: number } | null = null;

  get isDown(): boolean {
    return this.parked !== null;
  }

  step(ev: MouseInput): Verdict {
    const emit: SecondTouchAction[] = [];
    let skip = false;

    switch (ev.type) {
      case "DOWN":
        if (ev.button === RIGHT_BUTTON) {
          // ⚠ A second DOWN for a button already down is not a second touchpoint.
          if (this.parked === null) {
            this.parked = { x: ev.x, y: ev.y };
            emit.push({ kind: "DOWN", x: ev.x, y: ev.y });
          }
          skip = true;
        }
        break;

      case "UP":
        if (ev.button === RIGHT_BUTTON) {
          // ⛔ Skipped even with nothing to lift: a right-button UP reaching Babylon is an UP of the
          // mouse's ONE pointer, which would release touchpoint #1 while the left is still held.
          skip = true;
          if (this.parked !== null) {
            // ⛔⛔ Lifted WHERE IT WAS PARKED, never at the cursor — a parked pointer's last
            // position is its own, and a lift elsewhere is one enormous step to `A11`'s deadband.
            emit.push({ kind: "UP", x: this.parked.x, y: this.parked.y });
            this.parked = null;
          }
        }
        break;

      case "MOVE":
        if (this.parked !== null) {
          const leftDown = (ev.buttons & LEFT_BIT) !== 0;
          // ⭐⭐ THE CURSOR DRIVES #2 WHEN IT IS THE ONLY POINTER DOWN, OR WHEN SHIFT SAYS SO.
          // Otherwise it drives the real pointer and #2 stays parked — which is exact: `A11`'s
          // position deadband makes a still pointer emit nothing, and `D43` says channels SUM.
          if (ev.shift || !leftDown) {
            this.parked.x = ev.x;
            this.parked.y = ev.y;
            emit.push({ kind: "MOVE", x: ev.x, y: ev.y });
            skip = true;
          }
        }
        break;

      case "CANCEL":
        if (this.parked !== null) {
          emit.push({ kind: "UP", x: this.parked.x, y: this.parked.y });
          this.parked = null;
        }
        break;
    }

    // ⭐⭐⭐ RECONCILE AGAINST THE BROWSER'S MASK, LAST, ON EVERY POINTER EVENT. ⛔ If bit 2 is
    // clear and #2 is still down, its release was never delivered — and #2 lifts now, before the
    // rules act on whatever this event is. ⚠ The right button's own UP has already cleared
    // `parked` above, so this cannot lift it twice.
    if (ev.type !== "CANCEL" && this.parked !== null && (ev.buttons & RIGHT_BIT) === 0) {
      emit.push({ kind: "UP", x: this.parked.x, y: this.parked.y });
      this.parked = null;
    }

    return emit.length === 0 && !skip ? PASS : { skip, emit };
  }
}
