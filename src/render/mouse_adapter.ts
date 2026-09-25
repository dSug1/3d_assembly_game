/**
 * ⭐⭐⭐ **THE MOUSE ADAPTER — the only file that knows a mouse exists.**
 *
 * ⛔⛔⛔ **IT NEVER TOUCHES A DOM POINTER EVENT — NOT TO STOP ONE, NOT TO CREATE ONE.** The build
 * this replaces did both, and each was a round on the glass: intercepting the real events froze
 * touchpoint #1, and synthetic DOM events were swallowed by Babylon's device layer. ⭐ This one
 * works at the ONE seam Babylon documents for exactly this:
 *
 * * `scene.onPrePointerObservable` fires for every pointer event BEFORE the scene's handler, and
 *   setting `skipOnPointerObservable` makes `InputManager` return before processing it — so a
 *   skipped event never reaches `scene.ts`, with no `stopPropagation` anywhere.
 * * `scene.onPointerObservable.notifyObservers` delivers a synthetic touchpoint straight to the
 *   scene's handler — the path PROVEN on the glass when a synthetic press resolved a face.
 *
 * ⭐⭐ **AND THE SCENE OWNS THAT OBSERVABLE OUTRIGHT**: `scene.ts` calls `camera.detachControl()`,
 * so nothing else consumes it and nothing can react twice.
 *
 * ## ⛔ REMOVABLE BY DELETING TWO LINES
 *
 * `scene.ts` imports `attachMouseSecondTouch` and calls it once. Nothing else references this
 * file or `input/mouse_second_touch.ts`. Only `pointerType === "mouse"` is looked at, so a finger
 * is untouched and no flag is needed.
 *
 * ## ⚠⚠ PLAYABLE, NEVER TESTABLE
 *
 * Rule 5 closes a change on a real device; a mouse has one pointer, no DPI, no tilt. ⛔ And every
 * threshold this drives was judged by a finger — `motionDeadbandMm` is ~13 px at desktop density.
 * This file carries no numbers of its own so that line stays visible.
 */
import type { Scene } from "@babylonjs/core/scene";
import {
  PointerEventTypes,
  PointerInfo,
} from "@babylonjs/core/Events/pointerEvents";
import {
  MouseSecondTouch,
  MOUSE_SECOND_ID,
  type MouseAction,
  type MouseInput,
} from "../input/mouse_second_touch";
import { wheelNotches } from "../input/mouse_wheel_zoom";

export interface MouseSecondTouchHandle {
  /** ⚠ Diagnostics: real mouse events seen, synthetic actions delivered, the last one. */
  stats(): { seen: number; sent: number; last: string };
}

export function attachMouseSecondTouch(
  canvas: HTMLCanvasElement,
  scene: Scene,
  /**
   * ⭐ The scene's zoom, handed signed wheel notches (positive = in). ⛔ The scene owns `zoom` and
   * `applyCamera()`; this file only translates the wheel into notches — `input/mouse_wheel_zoom.ts`.
   */
  onWheelNotches?: (notches: number) => void,
): MouseSecondTouchHandle {
  const model = new MouseSecondTouch();
  let seen = 0;
  let sent = 0;
  let last = "—";
  // ⭐ The mouse's own pointer id, read off every real event — a `REAL` action re-issues THAT
  // pointer at its own position, so it must carry the same id the scene latched a role for.
  let realId = 1;

  /** Deliver one synthetic action straight to the scene's handler. */
  const deliver = (a: MouseAction): void => {
    const type =
      a.kind === "DOWN"
        ? PointerEventTypes.POINTERDOWN
        : a.kind === "MOVE"
          ? PointerEventTypes.POINTERMOVE
          : PointerEventTypes.POINTERUP;
    const evt = new PointerEvent(
      a.kind === "DOWN" ? "pointerdown" : a.kind === "MOVE" ? "pointermove" : "pointerup",
      {
        pointerId: a.target === "SECOND" ? MOUSE_SECOND_ID : realId,
        // ⭐ #2 is `touch`; a re-issued real pointer stays `mouse`. ⚠ Neither passes through the
        // pre-observer — `notifyObservers` goes straight to the scene's handler.
        pointerType: a.target === "SECOND" ? "touch" : "mouse",
        clientX: a.x,
        clientY: a.y,
        buttons: a.kind === "UP" ? 0 : 1,
      },
    );
    // ⛔ Canvas-relative for `scene.pick`, which works in the engine's coordinates while the event
    // carries client ones. ⚠ The press path reads `info.pickInfo` to resolve the face.
    const rect = canvas.getBoundingClientRect();
    // ⛔ An anchor-only action is delivered with NO pick, so the scene routes it `OUTSIDE` — a
    // Shift-made second touch must never become the holder of whatever lies under the cursor.
    const pick = a.anchorOnly === true ? null : scene.pick(a.x - rect.left, a.y - rect.top);
    scene.onPointerObservable.notifyObservers(new PointerInfo(type, evt, pick), type);
    sent++;
    last = `${a.target}.${a.kind}@${a.x.toFixed(0)},${a.y.toFixed(0)}`;
  };

  const apply = (input: MouseInput, pi?: { skipOnPointerObservable: boolean }): void => {
    const v = model.step(input);
    // ⭐ Delivered FIRST: this runs before Babylon processes the real event, so a lift the model
    // owes reaches the scene before the event that revealed it.
    for (const a of v.emit) deliver(a);
    if (v.skip && pi !== undefined) pi.skipOnPointerObservable = true;
  };

  scene.onPrePointerObservable.add((pi) => {
    const e = pi.event as PointerEvent;
    if (e.pointerType !== "mouse") return;
    const type =
      pi.type === PointerEventTypes.POINTERDOWN
        ? "DOWN"
        : pi.type === PointerEventTypes.POINTERUP
          ? "UP"
          : pi.type === PointerEventTypes.POINTERMOVE
            ? "MOVE"
            : null;
    if (type === null) return;
    seen++;
    realId = e.pointerId;
    apply(
      {
        type,
        button: e.button,
        buttons: e.buttons,
        shift: e.shiftKey,
        x: e.clientX,
        y: e.clientY,
      },
      pi,
    );
  });

  // ⭐ The two non-pointer DOM listeners this needs: Esc and a lost window lift #2, and the OS
  // context menu must not open on a button that is a touchpoint — anywhere on the page, since the
  // HUD sits over the canvas and a menu opened there swallows the click that dismisses it.
  const cancel = () =>
    apply({ type: "CANCEL", button: -1, buttons: 0, shift: false, x: 0, y: 0 });
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") cancel();
  };
  const onMenu = (e: Event) => e.preventDefault();
  // ⭐⭐ THE WHEEL ZOOMS (the owner, 2026-09-25). ⚠ A `wheel` event, not a pointer event, so the
  // rule above is untouched. ⛔ `passive: false` and `preventDefault`, or the page scrolls instead.
  const onWheel = (e: WheelEvent) => {
    if (onWheelNotches === undefined) return;
    e.preventDefault();
    const n = wheelNotches(e.deltaY, e.deltaMode);
    if (n !== 0) onWheelNotches(n);
  };
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("blur", cancel);
  window.addEventListener("contextmenu", onMenu);
  scene.onDisposeObservable.add(() => {
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("blur", cancel);
    window.removeEventListener("contextmenu", onMenu);
    canvas.removeEventListener("wheel", onWheel);
    cancel();
  });

  return { stats: () => ({ seen, sent, last }) };
}
