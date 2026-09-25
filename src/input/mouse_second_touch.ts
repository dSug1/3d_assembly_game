/**
 * ⭐⭐⭐ **THE RIGHT MOUSE BUTTON IS THE SECOND TOUCH** — the owner, 2026-09-25: *"Create a desktop
 * version of the input system. The second touch shall be done with right click. Make the build
 * modular. Do not repeat the previous build as it has continuously failed to work. Build from
 * scratch with robust logic."*
 *
 * ## ⛔⛔⛔ WHAT THE PREVIOUS BUILD GOT WRONG, NAMED SO THIS ONE CANNOT
 *
 * Four rounds on the glass, four regressions, and every one was a **premise**, not a bug in a
 * gesture rule: that the desktop did not already work (a mouse was touchpoint #1 with no layer at
 * all); that a synthetic DOM `PointerEvent` would be delivered (Babylon's device layer swallowed
 * it); that a hand presses the left button first; and that a latch remembering the buttons could
 * stand in for the buttons. ⭐ This module reads `buttons` on every event and never touches a DOM
 * pointer event — see `render/mouse_adapter.ts`.
 *
 * ## ⛔⛔⛔ AND WHAT ITS OWN FIRST VERSION GOT WRONG: ONE CURSOR, TWO ABSOLUTE POINTERS
 *
 * > *"To reach the gravity axis translation I need to press first left click and hold and then
 * > press right click. It does not work in the other order. Also, when I release the right click,
 * > the object jumps to another position which is probably the accumulated value of the left
 * > click."* — the owner, 2026-09-25
 *
 * ⛔ **The jump:** while Shift drove #2, the real pointer's moves were skipped, so the scene's #1
 * stood still while the cursor wandered — and the next move it received arrived at the cursor's
 * CURRENT position, delivering the whole wander as one step. ⭐⭐ **One cursor cannot drive two
 * pointers at absolute positions.** Once two exist, the cursor must act RELATIVELY, like a
 * trackpad: each pointer keeps its own position, and the cursor's DELTA goes to whichever one it
 * drives. So the real pointer's position is tracked here too — but only its position, only while
 * it is down, and it is reconciled against `buttons` like everything else.
 *
 * ⛔ **The order dependence:** Shift meant *drive the synthetic pointer*, but the synthetic
 * pointer's ROLE depends on press order — `IN2` latches roles by arrival. Right-first makes #2 the
 * HOLDER, so Shift drove the holder. ⭐⭐ Shift now means **drive the pointer pressed SECOND**,
 * whichever button that was. Without Shift the cursor drives the one pressed FIRST.
 *
 * ## ⭐ THE RULES, ALL OF THEM (2026-09-25)
 *
 * | input | what it is |
 * |---|---|
 * | left drag | touchpoint #1 — the browser's own pointer, untouched |
 * | Shift + left drag | an anchor-only second touch (gravity + roll) — the cursor drives it |
 * | right press and HOLD | the HitFace: the first touch of `D87`, which the cursor NEVER moves |
 * | left click while right is held | the Pioneer press — single = cyan, double = amber |
 *
 * ⛔ A right press while the left is down is refused: it would arrive second and mean a Pioneer.
 *
 * ⭐⭐ **AND WHEN NO POINTER HAS BEEN OFFSET, EVERY REAL EVENT PASSES UNTOUCHED** — byte-identical to
 * `6a28e62`, where a mouse already was touchpoint #1. An offset exists only after the cursor has
 * driven #2 while the real pointer was down; from then until the real pointer lifts, its moves
 * and its release are re-issued at its own position instead of the cursor's.
 *
 * ⛔ ENGINE-FREE and DOM-free. Plain records in, a plain verdict out.
 */

/** ⚠ Well clear of any real `pointerId`, which browsers hand out as small integers. */
export const MOUSE_SECOND_ID = 9002;

const LEFT_BUTTON = 0;
const RIGHT_BUTTON = 2;
const LEFT_BIT = 1;
const RIGHT_BIT = 2;

export interface MouseInput {
  readonly type: "DOWN" | "MOVE" | "UP" | "CANCEL";
  /** `PointerEvent.button` — `0` left, `2` right, `-1` for a move or a cancel. */
  readonly button: number;
  /** `PointerEvent.buttons` — the browser's mask AFTER this event. */
  readonly buttons: number;
  readonly shift: boolean;
  readonly x: number;
  readonly y: number;
}

/**
 * One synthetic action. ⚠ `REAL` re-issues the mouse's own pointer at its own position — the
 * adapter fills in the real `pointerId`. `SECOND` is touchpoint #2, id `MOUSE_SECOND_ID`.
 */
export interface MouseAction {
  readonly target: "REAL" | "SECOND";
  readonly kind: "DOWN" | "MOVE" | "UP";
  readonly x: number;
  readonly y: number;
  /**
   * ⭐⭐ `true` = deliver WITHOUT a raycast, so the scene routes it `OUTSIDE`. ⛔ Set for the
   * Shift-made second touch, which is a pure channel driver: a pick there would let the cursor's
   * position decide its role, and over ANOTHER body it became that body's holder — the owner's
   * *"it says ready X->roll but the roll does not appear. Sometimes it rolls, though."*
   */
  readonly anchorOnly?: boolean;
}

export interface Verdict {
  /**
   * ⛔ `true` = the REAL event must not reach the scene. ⚠ The layer's whole blast radius: `true`
   * only for the right button, for a move the cursor gives to another pointer, and for a real
   * event that has to be re-issued at an offset position.
   */
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
  /**
   * #2: where it is, and whether SHIFT made it (an anchor-only channel driver that lives for the
   * left button's hold) or the RIGHT button did (the HitFace holder, which the cursor never moves).
   */
  private second: (Pt & { shiftMade: boolean }) | null = null;
  /** The real pointer's position AS THE SCENE KNOWS IT, while the left button holds it down. */
  private real: Pt | null = null;
  /** The last cursor position, for the delta. */
  private cursor: Pt | null = null;

  get isSecondDown(): boolean {
    return this.second !== null;
  }

  /** ⚠ Diagnostics: is the real pointer currently re-issued away from the cursor? */
  get isOffset(): boolean {
    return this.real !== null && this.cursor !== null && !same(this.real, this.cursor);
  }

  step(ev: MouseInput): Verdict {
    const emit: MouseAction[] = [];
    let skip = false;
    const dx = this.cursor === null ? 0 : ev.x - this.cursor.x;
    const dy = this.cursor === null ? 0 : ev.y - this.cursor.y;
    const here: Pt = { x: ev.x, y: ev.y };

    switch (ev.type) {
      case "DOWN":
        // ⛔ RECONCILED FIRST for a press too: #2's press order is recorded from `real`, and a
        // left release the window missed must not make a right press think it came second.
        this.reconcile(ev, emit);
        if (ev.button === RIGHT_BUTTON) {
          // ⭐⭐⭐ **RIGHT PRESS AND HOLD = THE HITFACE** (the owner, 2026-09-25): *"right click hits
          // hitface and hold, mouse move to pioneer face and single left click sets pioneer face
          // and aligns (cyan) or double left click (amber)."* ⭐ It is the FIRST touch of `D87`'s
          // gesture — the held body, whose raycast face is the HitFace and becomes the
          // FollowerFace — and the left click that follows is the second touch pressing the
          // Pioneer. ⛔ So it is refused while the left button is down: it would arrive SECOND and
          // mean the opposite. ⚠ Swallowed either way — reaching Babylon it is a press of the
          // mouse's one pointer.
          if (this.real === null && this.second === null) {
            this.second = { x: ev.x, y: ev.y, shiftMade: false };
            emit.push({ target: "SECOND", kind: "DOWN", x: ev.x, y: ev.y });
          }
          skip = true;
        } else if (ev.button === LEFT_BUTTON && this.real === null) {
          // ⭐ The real pointer presses where the cursor IS, so it starts with no offset and the
          // event passes untouched.
          this.real = { ...here };
        }
        break;

      case "UP":
        if (ev.button === RIGHT_BUTTON) {
          // ⛔ Skipped even with nothing to lift: a right-button UP reaching Babylon is an UP of
          // the mouse's ONE pointer, which would release touchpoint #1 while the left is held.
          skip = true;
          // ⛔⛔ Lifted WHERE IT IS, never at the cursor — a lift elsewhere is one enormous step.
          if (this.second !== null && !this.second.shiftMade) this.liftSecond(emit);
        } else if (ev.button === LEFT_BUTTON && this.real !== null) {
          // ⭐ A Shift-made #2 lives for the left button's hold, and lifts just BEFORE it.
          if (this.second !== null && this.second.shiftMade) this.liftSecond(emit);
          const at = this.real;
          this.real = null;
          // ⭐⭐ THE JUMP'S OTHER HALF: an offset pointer is released where the SCENE has it.
          if (!same(at, here)) {
            emit.push({ target: "REAL", kind: "UP", x: at.x, y: at.y });
            skip = true;
          }
        } else if (ev.button !== LEFT_BUTTON && ev.button !== RIGHT_BUTTON) {
          // ⚠ A cancel (`button` −1) passes through: Babylon releases the real pointer itself.
          if ((ev.buttons & LEFT_BIT) === 0) this.real = null;
        }
        break;

      case "MOVE": {
        // ⛔ RECONCILED FIRST for a move: a pointer whose button the mask says is up must not
        // receive one last move before it is lifted.
        this.reconcile(ev, emit);
        const moved = dx !== 0 || dy !== 0;
        // ⭐⭐⭐ **SHIFT + LEFT DRAG DRIVES A SECOND TOUCH OF ITS OWN** (the owner, 2026-09-25):
        // *"left button drag with shift = translation in gravity axis with dy and roll with dx"* —
        // for an aligned body; gravity only for a free one in translation; roll with dx in
        // rotation. ⭐ That is EXACTLY what the scene already does with a second touchpoint that
        // is not on another body (`A16`'s mode pick, `D59`'s both-axes for an aligned follower),
        // so nothing here chooses a channel. ⚠ Made LAZILY, on the first Shift move — so a Shift
        // tapped without a drag creates no pointer and cannot register as a tap.
        if (ev.shift && moved && this.real !== null && this.second === null && this.cursor !== null)
          this.pressShiftSecond(emit);
        const driven = this.drivenBy(ev.shift);
        if (driven === "SECOND" && this.second !== null) {
          this.second.x += dx;
          this.second.y += dy;
          if (moved)
            emit.push(this.secondAction("MOVE"));
          // ⚠ Skipped even when still: the real event would move #1, which the cursor is not driving.
          skip = true;
        } else if (driven === "REAL" && this.real !== null) {
          this.real.x += dx;
          this.real.y += dy;
          // ⭐⭐ UNTOUCHED WHILE THERE IS NO OFFSET — the path `6a28e62` proved.
          if (!same(this.real, here)) {
            if (moved)
              emit.push({ target: "REAL", kind: "MOVE", x: this.real.x, y: this.real.y });
            skip = true;
          }
        }
        break;
      }

      case "CANCEL":
        if (this.second !== null) this.liftSecond(emit);
        break;
    }

    // ⭐ A RELEASE is reconciled LAST: the explicit branches above have already cleared the
    // state for an ordinary release, so nothing is lifted twice.
    if (ev.type === "UP") this.reconcile(ev, emit);

    this.cursor = here;
    return emit.length === 0 && !skip ? PASS : { skip, emit };
  }

  /**
   * ⭐⭐⭐ **RECONCILE AGAINST THE BROWSER'S MASK.** ⛔ A clear bit while this module still holds that
   * pointer down means its release was never delivered — off the page, or a cancel. Lifted where
   * it is, before the rules act on anything else. ⚠ This is why nothing here is a latch: every
   * piece of state is re-checked against the mask the OS maintains, on every event.
   */
  private reconcile(ev: MouseInput, emit: MouseAction[]): void {
    // ⚠ A Shift-made #2 belongs to the LEFT button's hold, a right-made one to the right button.
    if (this.second !== null) {
      const bit = this.second.shiftMade ? LEFT_BIT : RIGHT_BIT;
      if ((ev.buttons & bit) === 0) this.liftSecond(emit);
    }
    if (this.real !== null && (ev.buttons & LEFT_BIT) === 0) {
      emit.push({ target: "REAL", kind: "UP", x: this.real.x, y: this.real.y });
      this.real = null;
    }
  }

  private secondAction(kind: "DOWN" | "MOVE" | "UP"): MouseAction {
    const s = this.second!;
    return s.shiftMade
      ? { target: "SECOND", kind, x: s.x, y: s.y, anchorOnly: true }
      : { target: "SECOND", kind, x: s.x, y: s.y };
  }

  private liftSecond(emit: MouseAction[]): void {
    if (this.second === null) return;
    emit.push(this.secondAction("UP"));
    this.second = null;
  }

  /** ⭐ The Shift-made #2 presses where the cursor WAS, so its first move is this event's delta. */
  private pressShiftSecond(emit: MouseAction[]): void {
    const c = this.cursor!;
    this.second = { x: c.x, y: c.y, shiftMade: true };
    emit.push(this.secondAction("DOWN"));
  }

  /**
   * ⭐⭐ WHICH POINTER THE CURSOR DRIVES.
   *
   * ⛔⛔ **NEVER THE RIGHT BUTTON'S** — the owner, 2026-09-25: *"right button click does not
   * translate nor rotate any object."* The HitFace holder stays exactly where it pressed while the
   * cursor travels to the Pioneer face. ⭐ With Shift, the Shift-made second touch; otherwise the
   * real pointer, if it is down.
   */
  private drivenBy(shift: boolean): "REAL" | "SECOND" | null {
    if (shift && this.second !== null && this.second.shiftMade) return "SECOND";
    return this.real === null ? null : "REAL";
  }
}

function same(a: Pt, b: Pt): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * ⭐⭐⭐ **ON A MOUSE, THE SECOND TOUCH IS ALWAYS AVAILABLE** — so `D60` treats it as present.
 *
 * > *"When an object is aligned, whatever the mode, the left click shall give access to horizontal
 * > translation and left click + shift shall give access to gravity translation and roll. This
 * > shall be immediate."* — the owner, 2026-09-25
 *
 * ⭐⭐ `D60` already states the rule: when a second touch owns roll + gravity (an aligned body), the
 * first touch takes translation *whatever the mode says*. ⛔ On the glass that second touch exists
 * the moment a finger lands. On a mouse it existed only after the first Shift move — so in
 * `ROTATE` a plain left drag on an aligned body TWISTED it, and horizontal translation needed a
 * Shift-drag first to bring the second touch into being. ⭐ But a mouse's second touch is always
 * one Shift away, which is exactly the availability a resting finger has — so for a mouse holder
 * it counts as present from the start.
 *
 * ⚠ Unaligned bodies are untouched: `D60` asks the drive table first, and a free body's second
 * touch owns one axis, not both, so the mode still decides.
 */
export function secondTouchAlwaysAvailable(holderPointerType: string): boolean {
  return holderPointerType === "mouse";
}

/**
 * ⭐⭐⭐ **ONLY THE RIGHT BUTTON SETS A HITFACE ON A MOUSE** — the owner, 2026-09-25: *"hitface
 * triggered only by right click, not by left click."*
 *
 * ⭐ The left button is for MOVING — its press still resolves a face, because a left click on a
 * Pioneer face is how the alignment is made, but that face is never shown or used as a HitFace.
 * ⛔ The right-button holder is delivered as a `touch` pointer, so it passes; a finger is `touch`
 * and passes too, which leaves the phone exactly as it was.
 */
export function hitFaceAllowed(holderPointerType: string): boolean {
  return holderPointerType !== "mouse";
}
