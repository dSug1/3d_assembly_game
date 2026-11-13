/**
 * ⭐⭐⭐ THE BROWSER'S OWN GESTURES, KEPT OFF THE GAME (2026-11-13, the owner: *"When I double-tap on the iphone there appears a lense on the webpage by
 * the iphone: can my script disable this iphone feature for my webpage automatically ? Other features of android or windows or iphone which need to be
 * disabled on my webpage by my code so they do not interfere with my game inputs"*) → `Claude/10_INPUT_TOUCH/spec/BROWSER_GUARDS.md`.
 *
 * What the page already did (`index.html`): `touch-action: none` (no pan, no pinch-zoom, no double-tap zoom where it is honoured), `user-scalable=no`,
 * `overscroll-behavior: none` (no pull-to-refresh, no overscroll navigation), no text selection, no tap highlight; the right-click menu and the wheel
 * (`mouse_adapter.ts`). What it could not, and this does:
 * * **the iOS LOUPE** (the magnifier on a double tap, since iOS 15) — `-webkit-touch-callout: none` and `user-select: none` no longer stop it (WebKit
 *   bugs 231161, 251572): the canvas's TOUCH events cancelled (`preventDefault`, non-passive) — the double-tap zoom, the callout, the long-press menu,
 *   the selection with it. ⭐ The game reads POINTER events (Babylon), dispatched before the touch events: cancelling a touch never removes one. ⚠ On the
 *   canvas only — the HUD's and the menus' buttons keep their clicks (a touch cancelled on them would kill the click);
 * * **iOS Safari's own pinch-zoom** — it ignores `user-scalable=no`: its `gesturestart` / `gesturechange` / `gestureend` cancelled on the document;
 * * a **double click** and a **selection start** on the canvas cancelled (the desktop's word selection, Windows' touch "double tap");
 * * the **screen kept awake** while the page is shown (the Screen Wake Lock API — every major browser, Safari since 16.4): asked at once and again each
 *   time the page comes back into view (the browser releases it when the page is hidden); a refusal is silent (low battery, an unsupported browser).
 * What no page can switch off (the system's own gestures, the accessibility zooms) is told to the player: `BROWSER_GUARDS.md` §3.
 */

/** ⭐ The canvas's events cancelled — the touch sequence, the double click, the selection, the context menu. */
export const CANVAS_CANCELLED = ["touchstart", "touchmove", "touchend", "dblclick", "selectstart", "contextmenu"] as const;
/** ⭐ iOS Safari's pinch gesture events, cancelled on the document. */
export const DOCUMENT_CANCELLED = ["gesturestart", "gesturechange", "gestureend"] as const;

interface WakeLockSentinelLike {
  release(): Promise<void>;
}
interface WakeLockLike {
  request(type: "screen"): Promise<WakeLockSentinelLike>;
}

/** Installs the guards; returns their removal. `doc` and `wake` are the document and `navigator.wakeLock` (injected for the vectors). */
export function installBrowserGuards(
  canvas: EventTarget,
  doc: EventTarget & { readonly visibilityState?: string } = document,
  wake: WakeLockLike | undefined = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock,
): () => void {
  const cancel = (e: Event): void => {
    if (e.cancelable) e.preventDefault();
  };
  const opts: AddEventListenerOptions = { passive: false };
  for (const t of CANVAS_CANCELLED) canvas.addEventListener(t, cancel, opts);
  for (const t of DOCUMENT_CANCELLED) doc.addEventListener(t, cancel, opts);

  // ⭐ the screen kept awake while the page is shown
  let lock: WakeLockSentinelLike | null = null;
  let asking = false;
  const ask = (): void => {
    if (wake === undefined || lock !== null || asking || doc.visibilityState === "hidden") return;
    asking = true;
    wake
      .request("screen")
      .then((s) => {
        lock = s;
      })
      .catch(() => undefined)
      .finally(() => {
        asking = false;
      });
  };
  const onVisibility = (): void => {
    if (doc.visibilityState === "hidden") lock = null; // the browser released it
    else ask();
  };
  doc.addEventListener("visibilitychange", onVisibility);
  // ⚠ some browsers ask for a user gesture first: the first press asks again
  canvas.addEventListener("pointerdown", ask);
  ask();

  return () => {
    for (const t of CANVAS_CANCELLED) canvas.removeEventListener(t, cancel, opts);
    for (const t of DOCUMENT_CANCELLED) doc.removeEventListener(t, cancel, opts);
    doc.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("pointerdown", ask);
    if (lock !== null) void lock.release().catch(() => undefined);
    lock = null;
  };
}
