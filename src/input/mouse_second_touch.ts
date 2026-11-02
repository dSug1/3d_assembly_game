/**
 * ⭐⭐⭐ **THE MOUSE'S SECOND TOUCH** — engine-free and DOM-free: plain records in, a plain verdict out (`render/mouse_adapter.ts` delivers it).
 *
 * | input | what it is |
 * |---|---|
 * | left drag | touchpoint #1 — the browser's own pointer, untouched: the orbit, the slide, A + drag's approach |
 * | ⭐ (2026-10-11, *"build with ALT and CTRL"*) **ALT or CTRL** held | the orbit's HELD SECOND TOUCH — pressed where the cursor is (its press is a raycast: on the orbited piece it names the resting face), never driven by the cursor, lifted with the key |
 * | the right button | nothing — swallowed (reaching Babylon it would be a press of the mouse's ONE pointer, releasing #1) |
 *
 * ⭐⭐ `buttons` and the keys are read on every event and nothing is remembered that the browser's state could contradict (a key release the window
 * missed lifts the second touch at the next pointer event that says no key is held). ⛔⛔ (2026-11-02, *"remove the translation and the rotation of
 * the parts"*) — the Shift-made second touch (a part's gravity and roll), the right press's HitFace and its latch (`D161`), Space's latch, freeze
 * and unalign (`D154`–`D160`) and the Shift tap's mode toggle (`D167`) are deleted with the parts' translation, rotation and alignment (commit
 * `d8134eb`); with them the relative cursor that two absolute pointers needed — the key-made second touch is never driven, so #1 is never offset.
 */

/** ⚠ Well clear of any real `pointerId`, which browsers hand out as small integers. */
export const MOUSE_SECOND_ID = 9002;

const RIGHT_BUTTON = 2;

export interface MouseInput {
  readonly type: "DOWN" | "MOVE" | "UP" | "CANCEL" | "MOD_DOWN" | "MOD_UP";
  /** `PointerEvent.button` — `0` left, `2` right, `-1` for a move or a cancel. */
  readonly button: number;
  /** `PointerEvent.buttons` — the browser's mask AFTER this event. */
  readonly buttons: number;
  readonly x: number;
  readonly y: number;
  /** ⭐ (2026-10-11) is ALT or CTRL held at this pointer event? — a release the window missed lifts the key-made second touch. */
  readonly mod?: boolean;
}

/** One synthetic action: touchpoint #2, id `MOUSE_SECOND_ID`. */
export interface MouseAction {
  readonly target: "SECOND";
  readonly kind: "DOWN" | "MOVE" | "UP";
  readonly x: number;
  readonly y: number;
}

export interface Verdict {
  /** ⛔ `true` = the REAL event must not reach the scene (the right button's). */
  readonly skip: boolean;
  /** Synthetic actions, delivered BEFORE the real event is processed. */
  readonly emit: readonly MouseAction[];
}

const PASS: Verdict = { skip: false, emit: [] };

interface Pt {
  x: number;
  y: number;
}

export class MouseSecondTouch {
  /** #2, the key-made second touch: where it pressed (the cursor never moves it). */
  private second: Pt | null = null;
  /** The last cursor position — where the next key press lands. */
  private cursor: Pt | null = null;

  get isSecondDown(): boolean {
    return this.second !== null;
  }

  step(ev: MouseInput): Verdict {
    const emit: MouseAction[] = [];
    if (ev.type === "MOD_DOWN") {
      if (this.second !== null || this.cursor === null) return PASS;
      this.second = { ...this.cursor };
      return { skip: false, emit: [{ target: "SECOND", kind: "DOWN", x: this.second.x, y: this.second.y }] };
    }
    if (ev.type === "MOD_UP" || ev.type === "CANCEL") {
      this.lift(emit);
      return emit.length === 0 ? PASS : { skip: false, emit };
    }
    // ⭐ a key release the window missed: the pointer event says no key is held
    if (ev.mod === false) this.lift(emit);
    const skip = (ev.type === "DOWN" || ev.type === "UP") && ev.button === RIGHT_BUTTON;
    this.cursor = { x: ev.x, y: ev.y };
    return emit.length === 0 && !skip ? PASS : { skip, emit };
  }

  private lift(emit: MouseAction[]): void {
    if (this.second === null) return;
    emit.push({ target: "SECOND", kind: "UP", x: this.second.x, y: this.second.y });
    this.second = null;
  }
}
