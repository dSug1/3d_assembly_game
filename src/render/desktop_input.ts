/**
 * ⭐⭐⭐ **THE DESKTOP ADAPTER — the only file that knows a mouse exists.**
 *
 * ⛔⛔⛔ **IT IS REMOVABLE BY DELETING TWO LINES.** `scene.ts` imports `attachDesktopInput` and
 * calls it once; nothing else in the product references this file or `input/desktop_pointers.ts`.
 * ⭐ That is the point of the split: the mapping is a **translation into the existing input
 * model**, not a desktop branch inside it, so excluding it leaves the touch build byte-identical.
 *
 * ## ⭐⭐ HOW IT FEEDS THE RULES: BY SYNTHESISING REAL POINTER EVENTS
 *
 * The adapter intercepts **mouse** pointer events before they reach the canvas and dispatches
 * synthetic `touch` ones in their place. ⭐ Babylon's own input manager then produces the ordinary
 * `onPointerObservable` notifications, so `scene.ts`'s gesture code is untouched and cannot tell
 * the difference — which is exactly the property that makes the layer deletable.
 *
 * ⚠ Checked rather than hoped: Babylon calls `setPointerCapture` for touch pointers inside a
 * `try/catch` (`webDeviceInputSystem.js`), so an id that belongs to no real pointer is safe.
 *
 * ⛔ **ONLY `pointerType === "mouse"` IS INTERCEPTED.** On the tablet nothing is touched, which is
 * why this needs no flag: a build that carries it behaves identically under a finger.
 *
 * ## ⚠⚠ WHAT THIS DOES *NOT* DO — AND MUST NOT BE READ AS DOING
 *
 * ⛔ It makes the game **playable** on a desktop, not **testable**. Rule 5 closes a change on a
 * real device, and a mouse has one pointer, no DPI, no tilt and no haptics.
 *
 * ⛔⛔ **AND EVERY THRESHOLD IT DRIVES WAS JUDGED BY A FINGER.** `motionDeadbandMm` is 3.5 mm —
 * about 13 px at desktop density — and `flickLiftSpeed` is 250 mm/s, which a mouse passes without
 * trying. ⚠ `pointerNoiseMm` was MEASURED at 0.761 mm on that tablet's glass; a mouse's is
 * effectively zero. ⭐ So the mapping is an afternoon and the FEEL is a tuning session, and this
 * file deliberately contains no numbers of its own to blur that line.
 */
import type { Scene } from "@babylonjs/core/scene";
import {
  DesktopPointers,
  type DesktopEvent,
  type SyntheticAction,
} from "../input/desktop_pointers";

/** ⭐ One wheel "notch". ⚠ `deltaY` is in pixels, lines or pages depending on the device. */
function notchesOf(e: WheelEvent): number {
  const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
  // ⛔ NEGATED: `deltaY` is positive scrolling DOWN, and scrolling down zooms OUT — so a positive
  // notch means *the fingers separate*, which is what `desktop_pointers` documents.
  return -(e.deltaY * scale) / 100;
}

/**
 * ⭐⭐ **ATTACH, AND HAND BACK THE DETACH.** ⚠ The caller owns the lifetime; nothing here is a
 * module-level singleton, so two scenes in one page cannot fight over the window.
 *
 * @returns a function that removes every listener and lifts every synthetic pointer.
 */
export function attachDesktopInput(
  canvas: HTMLCanvasElement,
  scene: Scene,
): () => void {
  const map = new DesktopPointers();
  // ⛔ Guards the re-entry: a synthetic event dispatched ON the canvas still travels the capture
  // path from `window`, so without this the adapter would translate its own output for ever.
  let emitting = false;

  const emit = (actions: readonly SyntheticAction[]): void => {
    if (actions.length === 0) return;
    emitting = true;
    try {
      for (const a of actions) {
        const type =
          a.kind === "DOWN"
            ? "pointerdown"
            : a.kind === "MOVE"
              ? "pointermove"
              : "pointerup";
        canvas.dispatchEvent(
          new PointerEvent(type, {
            pointerId: a.id,
            // ⭐ `touch`, so anything downstream that ever distinguishes sees ONE kind of input —
            // and so Babylon takes its try/catch'd capture path rather than the mouse one.
            pointerType: "touch",
            isPrimary: false,
            clientX: a.x,
            clientY: a.y,
            // ⚠ A `pointerup` carries no buttons; a down or a move carries the left one, because
            // that is what a held finger looks like.
            buttons: a.kind === "UP" ? 0 : 1,
            bubbles: true,
            cancelable: true,
          }),
        );
      }
    } finally {
      emitting = false;
    }
  };

  const fromPointer = (
    e: PointerEvent,
    type: DesktopEvent["type"],
  ): DesktopEvent => ({
    type,
    t: performance.now(),
    x: e.clientX,
    y: e.clientY,
    button: e.button,
    shift: e.shiftKey,
  });

  /**
   * ⛔⛔ **CAPTURE PHASE ON `window`, SO THE REAL EVENT NEVER REACHES THE CANVAS.** ⚠ Both a
   * `stopPropagation` and the `emitting` guard are needed: the first keeps the mouse out of the
   * rules, the second keeps our own output out of this handler.
   */
  const intercept = (e: PointerEvent, type: DesktopEvent["type"]): void => {
    if (emitting || e.pointerType !== "mouse") return;
    e.stopPropagation();
    e.preventDefault();
    emit(map.step(fromPointer(e, type)));
  };

  const onDown = (e: PointerEvent) => intercept(e, "DOWN");
  const onMove = (e: PointerEvent) => intercept(e, "MOVE");
  const onUp = (e: PointerEvent) => intercept(e, "UP");
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    emit(
      map.step({
        type: "WHEEL",
        t: performance.now(),
        x: e.clientX,
        y: e.clientY,
        wheel: notchesOf(e),
      }),
    );
  };
  // ⭐ Esc, and anything that takes the window away: a button released outside the page never
  // reports, which is the easiest route to `IN2`'s stale grip that a mouse has.
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") emit(map.step({ type: "CANCEL", t: 0, x: 0, y: 0 }));
  };
  const onBlur = () => emit(map.step({ type: "CANCEL", t: 0, x: 0, y: 0 }));
  // ⛔ The right button is a touchpoint here, so its menu must not open. ⚠ On the canvas only —
  // taking it from the whole page would be rude on a HUD a hand wants to copy from.
  const onMenu = (e: Event) => e.preventDefault();
  // ⭐ The wheel's synthetic fingers lift on a clock, so something has to turn it.
  const onFrame = () =>
    emit(map.step({ type: "TICK", t: performance.now(), x: 0, y: 0 }));

  window.addEventListener("pointerdown", onDown, { capture: true });
  window.addEventListener("pointermove", onMove, { capture: true });
  window.addEventListener("pointerup", onUp, { capture: true });
  window.addEventListener("pointercancel", onUp, { capture: true });
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onMenu);
  window.addEventListener("keydown", onKey);
  window.addEventListener("blur", onBlur);
  const observer = scene.onBeforeRenderObservable.add(onFrame);

  return () => {
    window.removeEventListener("pointerdown", onDown, { capture: true });
    window.removeEventListener("pointermove", onMove, { capture: true });
    window.removeEventListener("pointerup", onUp, { capture: true });
    window.removeEventListener("pointercancel", onUp, { capture: true });
    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("contextmenu", onMenu);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("blur", onBlur);
    scene.onBeforeRenderObservable.remove(observer);
    emit(map.step({ type: "CANCEL", t: 0, x: 0, y: 0 }));
  };
}
