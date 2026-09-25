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
 * ⛔⛔⛔ **IT PASSES THROUGH BY DEFAULT AND INTERCEPTS BY EXCEPTION**, which is the whole shape of
 * the fix to the build that shipped. A mouse was **already** touchpoint #1 — nothing filters on
 * `pointerType` — so the first version, which swallowed every mouse event and replaced it, froze a
 * stream that worked. ⚠ Now an event is taken only when `DesktopVerdict.suppress` says the mapping
 * is standing in for the touchpoint a mouse does not have; everything else reaches the rules
 * exactly as it did before this file existed.
 *
 * ## ⛔⛔ THE SYNTHETIC POINTER GOES STRAIGHT TO THE OBSERVABLE, NOT THROUGH THE DOM
 *
 * ⚠⚠ **THE FIRST VERSION DISPATCHED SYNTHETIC `PointerEvent`s ON THE CANVAS** and let Babylon's
 * device layer raise the notification. ⛔ The owner: *"right click as second touch is not working:
 * I cannot toggle the vertical translation - roll, I cannot select pioneerface."* ⭐ With the left
 * button passing through and working, and the right button — the only synthetic one — producing
 * nothing, that is an A/B inside one build: **the real stream arrives and the synthetic one does
 * not.** ⚠ I could not name the mechanism inside Babylon's `WebDeviceInputSystem`, so the fix
 * removes the dependency rather than guessing at it.
 *
 * ⭐⭐ `scene.onPointerObservable.notifyObservers` is safe here for a reason worth stating:
 * `scene.ts` calls **`camera.detachControl()`**, so the scene's own handler is the only consumer
 * and nothing else can react twice. ⛔ The pick is computed with `scene.pick`, because the press
 * path reads `info.pickInfo` to resolve the face.
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
  PointerEventTypes,
  PointerInfo,
} from "@babylonjs/core/Events/pointerEvents";
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
 * ⭐⭐ **ATTACH, AND CLEAN UP WITH THE SCENE.** ⚠ Nothing here is a module-level singleton, so two
 * scenes in one page cannot fight over the window.
 *
 * ⛔ The teardown hangs off `scene.onDisposeObservable` rather than being handed back: `SceneHandle`
 * has no `dispose`, so a returned teardown would be an API for a lifetime the product does not
 * have — which `tests/unwired_debt.test.ts` said out loud the moment it was written.
 *
 * @returns the readout, which is the only thing a caller needs.
 */
export interface DesktopStats {
  /** Raw MOUSE events this adapter intercepted. */
  readonly seen: number;
  /** Synthetic touchpoint actions it dispatched. */
  readonly sent: number;
  /** The last action, as `DOWN9001@120,340`. */
  readonly last: string;
}

export interface DesktopInput {
  stats(): DesktopStats;
}

export function attachDesktopInput(
  canvas: HTMLCanvasElement,
  scene: Scene,
): DesktopInput {
  const map = new DesktopPointers();
  // ⭐⭐⭐ **A READOUT ON BOTH ENDS OF THE CHAIN**, added 2026-09-25 when the owner reported
  // *"not working. Delta position not working"* and four analyses in a row were plausible.
  // ⛔ `D86` cost NINE such analyses and was found by reading a HUD field — *when a defect
  // resists several correct-looking analyses, stop modelling the code and ask which READOUT
  // moves.* ⚠ This counts what went IN; `scene.ts` counts what came back out of Babylon, and
  // the pair says which link is broken rather than which is suspected.
  let seen = 0;
  let sent = 0;
  let last = "—";

  const emit = (actions: readonly SyntheticAction[]): void => {
    if (actions.length === 0) return;
    sent += actions.length;
    const a0 = actions[actions.length - 1]!;
    last = `${a0.kind}${a0.id}@${a0.x.toFixed(0)},${a0.y.toFixed(0)}`;
    const rect = canvas.getBoundingClientRect();
    for (const a of actions) {
      const type =
        a.kind === "DOWN"
          ? PointerEventTypes.POINTERDOWN
          : a.kind === "MOVE"
            ? PointerEventTypes.POINTERMOVE
            : PointerEventTypes.POINTERUP;
      const evt = new PointerEvent(
        a.kind === "DOWN"
          ? "pointerdown"
          : a.kind === "MOVE"
            ? "pointermove"
            : "pointerup",
        {
          pointerId: a.id,
          // ⭐ `touch`, so anything downstream that ever distinguishes sees ONE kind of input.
          pointerType: "touch",
          clientX: a.x,
          clientY: a.y,
          // ⚠ A `pointerup` carries no buttons; a down or a move carries the left one, which is
          // what a held finger looks like.
          buttons: a.kind === "UP" ? 0 : 1,
        },
      );
      // ⛔ Canvas-relative, because `scene.pick` works in the engine's own coordinates while the
      // event carries client ones. ⚠ They agree only while the canvas sits at the viewport origin,
      // which is true today and is exactly the kind of premise that goes stale in silence.
      const pick = scene.pick(a.x - rect.left, a.y - rect.top);
      scene.onPointerObservable.notifyObservers(
        new PointerInfo(type, evt, pick),
        type,
      );
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
   * ⛔⛔ **CAPTURE PHASE ON `window`, SO A SUPPRESSED EVENT NEVER REACHES THE CANVAS.** ⚠ Only the
   * suppressed ones are stopped; everything else continues to Babylon untouched, which is the
   * whole of defect 71's fix.
   */
  const intercept = (e: PointerEvent, type: DesktopEvent["type"]): void => {
    // ⚠ Only a MOUSE is ours. ⛔ A finger is untouched, which is why this needs no flag — and the
    // synthetic pointers never come back through here, because they no longer touch the DOM.
    if (e.pointerType !== "mouse") return;
    seen++;
    const v = map.step(fromPointer(e, type));
    // ⭐⭐⭐ **PASS THROUGH UNLESS THE MAPPING ASKS FOR THE EVENT.** ⛔ The first build stopped
    // every mouse event and replaced it, which froze a stream that already worked — the owner's
    // *"everything is almost frozen"*, and a gap analysis against `6a28e62` showed this layer was
    // the only functional change. ⚠ Now the real pointer reaches the rules untouched unless the
    // mapping is standing in for the touchpoint a mouse does not have.
    if (!v.suppress) return;
    e.stopPropagation();
    e.preventDefault();
    emit(v.actions);
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
      }).actions,
    );
  };
  // ⭐ Esc, and anything that takes the window away: a button released outside the page never
  // reports, which is the easiest route to `IN2`'s stale grip that a mouse has.
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape")
      emit(map.step({ type: "CANCEL", t: 0, x: 0, y: 0 }).actions);
  };
  const onBlur = () => emit(map.step({ type: "CANCEL", t: 0, x: 0, y: 0 }).actions);
  // ⛔ The right button is a touchpoint here, so its menu must not open. ⚠ On the canvas only —
  // taking it from the whole page would be rude on a HUD a hand wants to copy from.
  const onMenu = (e: Event) => e.preventDefault();
  // ⭐ The wheel's synthetic fingers lift on a clock, so something has to turn it.
  const onFrame = () =>
    emit(map.step({ type: "TICK", t: performance.now(), x: 0, y: 0 }).actions);

  window.addEventListener("pointerdown", onDown, { capture: true });
  window.addEventListener("pointermove", onMove, { capture: true });
  window.addEventListener("pointerup", onUp, { capture: true });
  window.addEventListener("pointercancel", onUp, { capture: true });
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onMenu);
  window.addEventListener("keydown", onKey);
  window.addEventListener("blur", onBlur);
  const observer = scene.onBeforeRenderObservable.add(onFrame);

  // ⚠⚠ **NOT NAMED `detach`, AND THAT IS NOT A STYLE CHOICE.** `tests/unwired_debt.test.ts`
  // counts references by IDENTIFIER, so a local called `detach` reads as a use of
  // `object_model.ts`'s declared-debt `detach` and quietly marks it wired — removing a real
  // entry from the debt list. ⛔ The dangerous direction: it HIDES debt rather than inventing it.
  const teardown = () => {
    window.removeEventListener("pointerdown", onDown, { capture: true });
    window.removeEventListener("pointermove", onMove, { capture: true });
    window.removeEventListener("pointerup", onUp, { capture: true });
    window.removeEventListener("pointercancel", onUp, { capture: true });
    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("contextmenu", onMenu);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("blur", onBlur);
    scene.onBeforeRenderObservable.remove(observer);
    emit(map.step({ type: "CANCEL", t: 0, x: 0, y: 0 }).actions);
  };
  scene.onDisposeObservable.add(teardown);
  return { stats: () => ({ seen, sent, last }) };
}
