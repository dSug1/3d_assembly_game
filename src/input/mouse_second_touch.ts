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
 * | left click while right is held | the Pioneer tap — it aligns (cyan; the double-click amber FOLLOW is deleted, `D106`) |
 * | ⭐ `D154`: **Space + click** (either button) on a body | the HitFace — a held second touch, LATCHED past the click; an ongoing drag is frozen first |
 * | ⭐ `D154`: **Space + click** on ANOTHER body | the Pioneer tap — it aligns, then the latched HitFace lifts: one episode (`D115`) |
 * | ⭐ `D159`: with a HitFace latched, a **plain click** (left or right, no Space) | completes the action as a Space click would: another body aligns, empty space unaligns |
 * | ⭐ `D160`: with a HitFace latched, a click on the **same** body | CANCELS it — the count is the underlying action's (a frozen drag that moved: 1; else 0) |
 * | ⭐ `D167`: a **Shift TAP** (down and up within the tap time, no Shift drag between) while the left button holds a part | the verdict asks the scene to toggle translation / rotation (`toggleMode`) |
 * | ⭐ `D161`: a **right press released unused** on a body | LATCHES the HitFace like Space + click — the next plain click completes the action; used while held (a left click or drag), it lifts on release as before |
 * | ⭐ `D155`: **Space pressed** while the left button holds a body (moving or not) | the drag stops and the face it pressed becomes the latched HitFace |
 * | ⭐ `D155`: an alignment made with Space | uses Space up — it must be hit again to start another HitFace |
 * | ⭐ `D156`: **Space + click on EMPTY space** with a HitFace latched | a tap there while it holds — `D107`'s unalign (a Pioneer: its followers go); then the HitFace lifts |
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
  /** ⭐ `SPACE`: the Space key went DOWN (not a repeat) — `D155`. */
  readonly type: "DOWN" | "MOVE" | "UP" | "CANCEL" | "SPACE" | "SHIFT_DOWN" | "SHIFT_UP";
  /** `PointerEvent.button` — `0` left, `2` right, `-1` for a move or a cancel. */
  readonly button: number;
  /** `PointerEvent.buttons` — the browser's mask AFTER this event. */
  readonly buttons: number;
  readonly shift: boolean;
  readonly x: number;
  readonly y: number;
  /** ⭐ `D154`: is Space held at this event? */
  readonly space?: boolean;
  /** ⭐ `D167`: the event's time in ms — read for `SHIFT_DOWN` / `SHIFT_UP`, and (`RESTING_FACE_ALIGNMENT.md` §4) a right DOWN / UP. */
  readonly t?: number;
  /**
   * ⭐ `D154`: the body under the cursor at a DOWN, resolved by the adapter (a pick) — `null` for
   * empty space. ⚠ Only read for a Space click; absent for every other event.
   */
  readonly onBody?: { readonly id: string; readonly frozen: boolean } | null;
  /**
   * ⭐ (2026-10-10, `RESTING_FACE_ALIGNMENT.md` §18) at a RIGHT press while the left button is down: the scene says a drag of both
   * buttons YAWS / PITCHES the orbited piece now (outside the sphere, aligned). ⚠ Read only there.
   */
  readonly tumble?: boolean;
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
  /**
   * ⭐ `D155`: this second touch takes over the face the real pointer's grip pressed — the scene has
   * been told which (the adapter's freeze hook) and resolves it on this press, not from a pick.
   */
  readonly inherit?: boolean;
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
  /** ⭐ `D167`: a Shift TAP while the left button holds a part — the scene toggles translation / rotation. */
  readonly toggleMode?: boolean;
  /**
   * ⭐ `RESTING_FACE_ALIGNMENT.md` §4: a RIGHT press made while the LEFT button was down, released — how long it was held (ms). The
   * scene judges the tap (time only: the cursor moves with the orbit) and whether the left button is orbiting.
   */
  readonly rightTapMs?: number;
  /**
   * ⭐⭐ (2026-10-10, the owner: *"the yaw/pitch shall be with left button hold and right button hold and drag"*) the cursor moved with BOTH
   * buttons held, the scene having said so at the right press (`MouseInput.tumble`): its delta, px (y down) — the orbit pointer does not
   * move. ⛔ Never a right tap then.
   */
  readonly rightDrag?: { readonly dx: number; readonly dy: number };
  /** ⭐ That two-button drag ended (a button released, or its release missed). */
  readonly rightDragEnd?: boolean;
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
  private second:
    | (Pt & {
        shiftMade: boolean;
        spaceBody?: string;
        /** ⭐ `D161`: the body a RIGHT press made this HitFace on — it latches there if released unused. */
        rightBody?: string;
        /** ⭐ `D161`: the left button pressed while the right held it — an action was made; no latch. */
        used?: boolean;
      })
    | null = null;
  /**
   * ⭐ `D154`: the Pioneer tap in flight — the REAL pointer pressed at `at` by a Space click on another
   * body, released there when that button lifts, and the latched HitFace lifted just after it.
   */
  private tap: { button: number; at: Pt } | null = null;
  /** ⭐ `D154`: the left button's hold belongs to a Space click — its moves and its release are swallowed. */
  private swallowLeft = false;
  /**
   * ⭐ `D155`: an alignment made with Space used it up — a Space still held does not count until it is
   * released or hit again (*"the space key needs to be hit again to start another hitface cycle"*).
   */
  private spaceUsed = false;
  /** ⭐ `D167`: Shift went down at `t`; `used` once a Shift drag made the second touch — then it is a HOLD. */
  private shiftTap: { t: number; used: boolean } | null = null;
  /** ⭐ `RESTING_FACE_ALIGNMENT.md` §4: a right press made while the left button was down — when (ms). */
  private rightWhileLeft: { t: number; tumble: boolean; moved: boolean } | null = null;

  /** @param tapMaxMs the longest press that is still a tap — `tapMaxDuration`, the recognizer's own. */
  constructor(private readonly tapMaxMs = 250) {}
  /** The real pointer's position AS THE SCENE KNOWS IT, while the left button holds it down. */
  private real: Pt | null = null;
  /** The last cursor position, for the delta. */
  private cursor: Pt | null = null;

  get isSecondDown(): boolean {
    return this.second !== null;
  }

  /** ⭐ `D162`: is the second touch a LATCHED HitFace — down past its click (`D154`/`D161`), no button held? */
  get isSecondLatched(): boolean {
    return this.second?.spaceBody !== undefined;
  }

  /** ⚠ Diagnostics: is the real pointer currently re-issued away from the cursor? */
  get isOffset(): boolean {
    return this.real !== null && this.cursor !== null && !same(this.real, this.cursor);
  }

  step(ev: MouseInput): Verdict {
    const emit: MouseAction[] = [];
    let skip = false;
    let rightDrag: { dx: number; dy: number } | undefined;
    let rightDragEnd = false;
    // ⭐ `D155`: Space is re-armed by its release (seen on any event) or by a fresh press.
    if (ev.space !== true || ev.type === "SPACE") this.spaceUsed = false;
    if (ev.type === "SPACE") return this.spaceDown(ev, emit);
    if (ev.type === "SHIFT_DOWN" || ev.type === "SHIFT_UP") return this.shiftKey(ev);
    const dx = this.cursor === null ? 0 : ev.x - this.cursor.x;
    const dy = this.cursor === null ? 0 : ev.y - this.cursor.y;
    const here: Pt = { x: ev.x, y: ev.y };

    switch (ev.type) {
      case "DOWN": {
        // ⛔ RECONCILED FIRST for a press too: #2's press order is recorded from `real`, and a
        // left release the window missed must not make a right press think it came second.
        this.reconcile(ev, emit);
        // ⭐⭐⭐ `D154` — **SPACE + CLICK ALIGNS** (the owner, 2026-09-29): *"Space + click (left or right):
        // freeze the ongoing translation or rotation (if any) and highlight the hitface. Space being
        // hold or another hit on space + click (left or right) on another object: select the
        // pioneerface and align the hitface which becomes the follower face. All this counts as one
        // episode."* ⭐ It is the right button's gesture with the hold LATCHED: the HitFace is a second
        // touch that stays down past the click, and the second click is the Pioneer tap.
        if (this.tap !== null) {
          // ⛔ A second button during the tap: nothing — the tap owns the pointer until it lifts.
          skip = true;
          break;
        }
        const space = ev.space === true && !this.spaceUsed;
        const latched = this.second?.spaceBody ?? null;
        const on = ev.onBody ?? null;
        // ⭐⭐ `D159` (the owner, 2026-09-29: *"following a click locked by space key … a simple left click or
        // right click is sufficient to complete the action (no need hold Space key or to press Space key
        // again)"*): with a HitFace latched, EVERY click completes the action — Space or not. ⛔ `D154`'s
        // *a click without Space lets it go* is reversed; Esc still cancels.
        if (latched !== null) {
          skip = true;
          if (on === null) {
            // ⭐⭐ `D156` (the owner, 2026-09-29: *"also to unalign a follower object = space + click on
            // follower and space + click on empty space"*): a TAP on empty space while the HitFace holds —
            // exactly `D107`'s unalign (holding a Pioneer, its followers are released; a free body: nothing,
            // a mouse tap never toggles the mode). Then the HitFace lifts, and Space is used up.
            this.tap = { button: ev.button, at: { ...here } };
            emit.push({ target: "REAL", kind: "DOWN", x: here.x, y: here.y });
          } else if (on.id === latched) {
            // ⭐⭐ `D160` (the owner, 2026-09-29: *"on the same part it cancels the HitFace and does not increase
            // the episode count (the episode count shall be driven by the underlying ongoing action)"*): the
            // HitFace lifts and the click itself is swallowed — so the gesture ends on the underlying action
            // alone (`D158`/`D159`: a frozen drag that moved lands 1; a plain latch lands 0). ⛔ `D154`'s
            // *the same body moves the HitFace* is reversed.
            this.liftSecond(emit);
          } else {
            // ⭐⭐ ANOTHER body: the Pioneer tap — the real pointer presses here and does not move.
            this.tap = { button: ev.button, at: { ...here } };
            emit.push({ target: "REAL", kind: "DOWN", x: here.x, y: here.y });
          }
          if (ev.button === LEFT_BUTTON && this.tap === null) this.swallowLeft = true;
          break;
        } else if (space && on !== null && !on.frozen && this.second === null) {
          // ⭐⭐ THE FIRST SPACE CLICK: freeze an ongoing left drag where the scene has it, then latch
          // the HitFace here. ⛔ A frozen body cannot be a Follower (`D77`), so it is not latched.
          if (this.real !== null) {
            emit.push({ target: "REAL", kind: "UP", x: this.real.x, y: this.real.y });
            this.real = null;
            this.swallowLeft = true;
          }
          this.pressSpaceSecond(here, on.id, emit);
          if (ev.button === LEFT_BUTTON) this.swallowLeft = true;
          skip = true;
          break;
        }
        if (ev.button === RIGHT_BUTTON) {
          // ⭐⭐⭐ **RIGHT PRESS AND HOLD = THE HITFACE** (the owner, 2026-09-25): *"right click hits
          // hitface and hold, mouse move to pioneer face and single left click sets pioneer face
          // and aligns (cyan) or double left click (amber)."* (⛔ the amber FOLLOW is deleted, `D106`.)
          // ⭐ It is the FIRST touch of `D87`'s
          // gesture — the held body, whose raycast face is the HitFace and becomes the
          // FollowerFace — and the left click that follows is the second touch pressing the
          // Pioneer. ⛔ So it is refused while the left button is down: it would arrive SECOND and
          // mean the opposite. ⚠ Swallowed either way — reaching Babylon it is a press of the
          // mouse's one pointer.
          if (this.real === null && this.second === null) {
            // ⭐ `D161`: on a (non-frozen) body, remember it — the release may latch the HitFace there.
            this.second =
              on !== null && !on.frozen
                ? { x: ev.x, y: ev.y, shiftMade: false, rightBody: on.id }
                : { x: ev.x, y: ev.y, shiftMade: false };
            emit.push({ target: "SECOND", kind: "DOWN", x: ev.x, y: ev.y });
          } else if (this.real !== null) {
            // ⭐ `RESTING_FACE_ALIGNMENT.md` §4: refused as a HitFace (it would arrive second), but TIMED — released quickly it is the
            // right TAP the left button's orbit counts (the scene decides; a plain right click is untouched)
            // ⭐ (2026-10-10) and, if the scene says so, the start of a two-button drag — the yaw / pitch (`rightDrag`)
            this.rightWhileLeft = { t: ev.t ?? 0, tumble: ev.tumble === true, moved: false };
          }
          skip = true;
        } else if (ev.button === LEFT_BUTTON && this.real === null) {
          // ⭐ `D161`: a left press while the right button holds the HitFace IS the action (an align tap, a
          // steer, an unalign) — the right release will lift it, never latch it.
          if (this.second !== null && !this.second.shiftMade && this.second.spaceBody === undefined)
            this.second.used = true;
          // ⭐ The real pointer presses where the cursor IS, so it starts with no offset and the
          // event passes untouched.
          this.real = { ...here };
        }
        break;
      }

      case "UP":
        if (this.rightWhileLeft !== null && ev.button === RIGHT_BUTTON) {
          const rw = this.rightWhileLeft;
          const heldMs = (ev.t ?? 0) - rw.t;
          this.rightWhileLeft = null;
          // ⭐ (2026-10-10) a two-button DRAG ends — never a tap
          if (rw.moved) return { skip: true, emit: [], rightDragEnd: true };
          return rw.tumble ? { skip: true, emit: [], rightTapMs: heldMs, rightDragEnd: true } : { skip: true, emit: [], rightTapMs: heldMs };
        }
        // ⭐ (2026-10-10) the LEFT button lifted first: the two-button drag is over too
        if (this.rightWhileLeft !== null && ev.button === LEFT_BUTTON) {
          if (this.rightWhileLeft.tumble) rightDragEnd = true;
          this.rightWhileLeft = null;
        }
        // ⭐ `D154`: the Pioneer tap lifts WHERE IT PRESSED, then the latched HitFace — in that order, so
        // the tap releases while the Follower is still held (`D119`: it aligns on the released tap).
        if (this.tap !== null && ev.button === this.tap.button) {
          skip = true;
          this.endTap(emit);
          break;
        }
        if (this.swallowLeft && ev.button === LEFT_BUTTON) {
          skip = true;
          this.swallowLeft = false;
          break;
        }
        if (ev.button === RIGHT_BUTTON) {
          // ⛔ Skipped even with nothing to lift: a right-button UP reaching Babylon is an UP of
          // the mouse's ONE pointer, which would release touchpoint #1 while the left is held.
          skip = true;
          // ⛔⛔ Lifted WHERE IT IS, never at the cursor — a lift elsewhere is one enormous step.
          if (this.second !== null && !this.second.shiftMade && this.second.spaceBody === undefined) {
            // ⭐⭐⭐ `D161` (the owner, 2026-09-29: *"currently, right click on an object triggers the hitface but
            // when the right click is released, the hitface cancels: make it a latch with episode counting
            // once the action is completed (similar to the space key)"*): released UNUSED on a body, the
            // HitFace stays — latched exactly as a Space click latches it (`D154`/`D159`/`D160`).
            if (this.second.rightBody !== undefined && this.second.used !== true)
              this.second.spaceBody = this.second.rightBody;
            else this.liftSecond(emit);
          }
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
        // ⭐⭐ (2026-10-10, `RESTING_FACE_ALIGNMENT.md` §18) BOTH buttons held and the scene said so at the right press: the cursor YAWS /
        // PITCHES (`rightDrag`) and the orbit pointer stays where it is (the cursor is relative from here, as for any second touch). ⛔ A
        // button whose bit is clear ends it.
        {
          const rw = this.rightWhileLeft;
          if (rw !== null && rw.tumble) {
            if ((ev.buttons & RIGHT_BIT) === 0 || (ev.buttons & LEFT_BIT) === 0) {
              this.rightWhileLeft = null;
              rightDragEnd = true;
            } else {
              if (dx !== 0 || dy !== 0) {
                rw.moved = true;
                rightDrag = { dx, dy };
              }
              skip = true;
              break;
            }
          }
        }
        // ⭐ `D154`: a Space click's hold moves nothing — the tap stays where it pressed (a TAP), and a
        // swallowed left hold drives no body (the freeze).
        if (this.tap !== null || this.swallowLeft) {
          skip = true;
          break;
        }
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
        if (this.tap !== null) this.endTap(emit);
        if (this.second !== null) this.liftSecond(emit);
        this.swallowLeft = false;
        this.shiftTap = null;
        // ⭐ (2026-10-10) a two-button drag is over too
        if (this.rightWhileLeft !== null) {
          if (this.rightWhileLeft.tumble) rightDragEnd = true;
          this.rightWhileLeft = null;
        }
        break;
    }

    // ⭐ A RELEASE is reconciled LAST: the explicit branches above have already cleared the
    // state for an ordinary release, so nothing is lifted twice.
    if (ev.type === "UP") this.reconcile(ev, emit);

    // ⛔⛔ `D167` — **THE ESC BUG**: a CANCEL carries no position (the adapter sends `0, 0`), and recording it as the
    // cursor made the next move one step from the page's corner to the pointer — a held body jumped away.
    if (ev.type !== "CANCEL") this.cursor = here;
    const extra = { ...(rightDrag !== undefined ? { rightDrag } : {}), ...(rightDragEnd ? { rightDragEnd: true } : {}) };
    return emit.length === 0 && !skip && rightDrag === undefined && !rightDragEnd ? PASS : { skip, emit, ...extra };
  }

  /**
   * ⭐⭐⭐ **RECONCILE AGAINST THE BROWSER'S MASK.** ⛔ A clear bit while this module still holds that
   * pointer down means its release was never delivered — off the page, or a cancel. Lifted where
   * it is, before the rules act on anything else. ⚠ This is why nothing here is a latch: every
   * piece of state is re-checked against the mask the OS maintains, on every event.
   */
  private reconcile(ev: MouseInput, emit: MouseAction[]): void {
    // ⭐ `D154`: a Pioneer tap whose button the mask says is up was released off the page.
    if (this.tap !== null && (ev.buttons & (this.tap.button === RIGHT_BUTTON ? RIGHT_BIT : LEFT_BIT)) === 0)
      this.endTap(emit);
    if (this.swallowLeft && (ev.buttons & LEFT_BIT) === 0) this.swallowLeft = false;
    // ⚠ A Shift-made #2 belongs to the LEFT button's hold, a right-made one to the right button, and a
    // Space-made one to NO button — it is latched past its click (`D154`).
    if (this.second !== null && this.second.spaceBody === undefined) {
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

  /** ⭐ `D154`: the latched HitFace — a second touch pressed on `bodyId` at `at`, never driven. */
  private pressSpaceSecond(at: Pt, bodyId: string, emit: MouseAction[]): void {
    this.second = { x: at.x, y: at.y, shiftMade: false, spaceBody: bodyId };
    emit.push(this.secondAction("DOWN"));
  }

  /** ⭐ `D154`: the Pioneer tap releases where it pressed, then the latched HitFace lifts. */
  private endTap(emit: MouseAction[]): void {
    const t = this.tap!;
    this.tap = null;
    emit.push({ target: "REAL", kind: "UP", x: t.at.x, y: t.at.y });
    this.liftSecond(emit);
    // ⭐ `D155`/`D156`: the alignment — or the unalign — used Space up.
    this.spaceUsed = true;
  }

  /**
   * ⭐⭐⭐ `D155` — **SPACE PRESSED DURING A LEFT HOLD ON A BODY** (the owner, 2026-09-29): *"if a translation
   * or a rotation is ongoing, the pressing of space key during the movement should stop the translation
   * or rotation and immediately select the face which was dragged as the hitface"* — *"also, if a face is
   * currently being pressed by left click (even without movement)"*. ⭐ The drag is released where the
   * scene has it and the rest of the hold is swallowed (the freeze); a second touch presses at
   * `(ev.x, ev.y)` — the adapter's point on that body — and INHERITS the dragged face. ⛔ Not for a
   * frozen body, with no body (`onBody` null), or while another second touch or a tap is live: then
   * Space only re-arms. ⚠ The cursor is not moved: `x`/`y` here are the body's, not the mouse's.
   */
  private spaceDown(ev: MouseInput, emit: MouseAction[]): Verdict {
    const on = ev.onBody ?? null;
    if (on !== null && !on.frozen && this.real !== null && this.second === null && this.tap === null) {
      emit.push({ target: "REAL", kind: "UP", x: this.real.x, y: this.real.y });
      this.real = null;
      this.swallowLeft = true;
      this.second = { x: ev.x, y: ev.y, shiftMade: false, spaceBody: on.id };
      emit.push({ ...this.secondAction("DOWN"), inherit: true });
    }
    return emit.length === 0 ? PASS : { skip: false, emit };
  }

  /**
   * ⭐⭐ `D167` — **A SHIFT TAP** toggles translation / rotation: Shift down, then up within `tapMaxMs`, with no Shift drag
   * between (that made the second touch — a HOLD, `D94`, unchanged) and the left button holding a part. ⛔ Neither
   * event moves the cursor.
   */
  private shiftKey(ev: MouseInput): Verdict {
    const t = ev.t ?? 0;
    if (ev.type === "SHIFT_DOWN") {
      this.shiftTap = { t, used: false };
      return PASS;
    }
    const tap = this.shiftTap;
    this.shiftTap = null;
    if (tap === null || tap.used || !(t - tap.t <= this.tapMaxMs) || this.real === null) return PASS;
    return { skip: false, emit: [], toggleMode: true };
  }

  /** ⭐ The Shift-made #2 presses where the cursor WAS, so its first move is this event's delta. */
  private pressShiftSecond(emit: MouseAction[]): void {
    if (this.shiftTap !== null) this.shiftTap.used = true;
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
