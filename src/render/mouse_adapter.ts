/**
 * ⭐⭐⭐ **THE MOUSE ADAPTER — the only file that knows a mouse exists** (the left button, ALT / CTRL, the wheel; ⛔ 2026-11-02 the parts'
 * Space, Shift and right-button inputs deleted, commit `d8134eb`).
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
import { PointerEventTypes, PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import { MouseSecondTouch, MOUSE_SECOND_ID, type MouseAction, type MouseInput } from "../input/mouse_second_touch";

export interface MouseSecondTouchHandle {
  /** ⚠ Diagnostics: real mouse events seen, synthetic actions delivered, the last one. */
  stats(): { seen: number; sent: number; last: string };
}

export function attachMouseSecondTouch(
  canvas: HTMLCanvasElement,
  scene: Scene,
  /** ⭐⭐ (2026-10-11, `RESTING_FACE_ALIGNMENT.md` §20) does the scene orbit a piece — ALT / CTRL then the HELD SECOND TOUCH? */
  orbitSecond?: () => boolean,
): MouseSecondTouchHandle {
  const model = new MouseSecondTouch();
  let seen = 0;
  let sent = 0;
  let last = "—";

  /** Deliver one synthetic action straight to the scene's handler. */
  const deliver = (a: MouseAction): void => {
    const type = a.kind === "DOWN" ? PointerEventTypes.POINTERDOWN : a.kind === "MOVE" ? PointerEventTypes.POINTERMOVE : PointerEventTypes.POINTERUP;
    const evt = new PointerEvent(a.kind === "DOWN" ? "pointerdown" : a.kind === "MOVE" ? "pointermove" : "pointerup", {
      pointerId: MOUSE_SECOND_ID,
      // ⭐ #2 is `touch`. ⚠ It does not pass through the pre-observer — `notifyObservers` goes straight to the scene's handler.
      pointerType: "touch",
      clientX: a.x,
      clientY: a.y,
      buttons: a.kind === "UP" ? 0 : 1,
    });
    // ⛔ Canvas-relative for `scene.pick`, which works in the engine's coordinates while the event carries client ones: its press is a raycast.
    const rect = canvas.getBoundingClientRect();
    scene.onPointerObservable.notifyObservers(new PointerInfo(type, evt, scene.pick(a.x - rect.left, a.y - rect.top)), type);
    sent++;
    last = `${a.target}.${a.kind}@${a.x.toFixed(0)},${a.y.toFixed(0)}`;
  };

  const apply = (input: MouseInput, pi?: { skipOnPointerObservable: boolean }): void => {
    const v = model.step(input);
    // ⭐ Delivered FIRST: this runs before Babylon processes the real event.
    for (const a of v.emit) deliver(a);
    if (v.skip && pi !== undefined) pi.skipOnPointerObservable = true;
  };

  /** ⭐ (2026-10-11) is the key-made second touch down (ALT or CTRL held, in the orbit)? */
  let modDown = false;
  scene.onPrePointerObservable.add((pi) => {
    const e = pi.event as PointerEvent;
    if (e.pointerType !== "mouse") return;
    const type = pi.type === PointerEventTypes.POINTERDOWN ? "DOWN" : pi.type === PointerEventTypes.POINTERUP ? "UP" : pi.type === PointerEventTypes.POINTERMOVE ? "MOVE" : null;
    if (type === null) return;
    seen++;
    if (modDown && !e.altKey && !e.ctrlKey) modDown = false; // ⭐ (2026-10-11) the model lifts it (`mod: false`)
    apply({ type, button: e.button, buttons: e.buttons, x: e.clientX, y: e.clientY, mod: e.altKey || e.ctrlKey }, pi);
  });

  // ⭐ The non-pointer DOM listeners this needs: the keys, Esc, and the OS context menu must not open on a button (anywhere on the page, since the
  // HUD sits over the canvas and a menu opened there swallows the click that dismisses it).
  const modKey = (k: string) => k === "Alt" || k === "Control";
  const onKey = (e: KeyboardEvent) => {
    // ⭐⭐ (2026-10-11, the owner: *"build with ALT and CTRL"*) ALT or CTRL — the orbit's HELD SECOND TOUCH (either: Option on a Mac, where
    // CTRL + click is the system's right click; CTRL on Linux, where ALT + drag moves the window)
    if (modKey(e.key) && !e.repeat && !modDown && orbitSecond !== undefined && orbitSecond()) {
      modDown = true;
      apply({ type: "MOD_DOWN", button: -1, buttons: 0, x: 0, y: 0 });
    }
    // ⭐⭐ `D167`: Alt and F10 must not hand the keyboard to the BROWSER's menu (Chrome, Edge and Firefox on Windows focus it on Alt's release)
    if (e.key === "Alt" || e.key === "F10") e.preventDefault();
    if (e.key === "Escape") apply({ type: "CANCEL", button: -1, buttons: 0, x: 0, y: 0 });
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Alt" || e.key === "F10") e.preventDefault(); // ⭐ `D167`: the menu activates on the RELEASE
    // ⭐ (2026-10-11) the key-made second touch lifts when NEITHER key is held any more
    if (modKey(e.key) && modDown && !e.altKey && !e.ctrlKey) {
      modDown = false;
      apply({ type: "MOD_UP", button: -1, buttons: 0, x: 0, y: 0 });
    }
  };
  const onMenu = (e: Event) => e.preventDefault();
  // ⛔⛔ (2026-11-13, the owner: *"remove the zoom function entirely"*) THE WHEEL ZOOM deleted (`D118`'s wheel, 2026-09-25); the wheel is still
  // swallowed so the page neither scrolls nor zooms (Ctrl + wheel is the browser's zoom, and Ctrl is the orbit's held second touch)
  const onWheel = (e: WheelEvent) => e.preventDefault();
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKeyUp);
  // ⭐⭐ `D167`: a lost window changes nothing in the game — only a held key is forgotten (its release will never arrive): the key-made second touch
  // lifts now (the way out, as a release)
  const lostFocus = () => {
    if (!modDown) return;
    modDown = false;
    apply({ type: "MOD_UP", button: -1, buttons: 0, x: 0, y: 0 });
  };
  window.addEventListener("blur", lostFocus);
  window.addEventListener("contextmenu", onMenu);
  scene.onDisposeObservable.add(() => {
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", lostFocus);
    window.removeEventListener("contextmenu", onMenu);
    canvas.removeEventListener("wheel", onWheel);
  });

  return { stats: () => ({ seen, sent, last }) };
}
